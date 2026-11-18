import base64
import hashlib
import json
import os
import stat
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)


DATA_DIR = Path.home() / ".civibastion-demo"
KEY_PATH = DATA_DIR / "signing-key.pem"
REPORT_DIR = DATA_DIR / "reports"


def ensure_private_directory(path: Path) -> None:
    path.mkdir(mode=0o700, parents=True, exist_ok=True)
    if os.name == "posix" and stat.S_IMODE(path.stat().st_mode) & 0o077:
        raise RuntimeError(f"Local results directory has unsafe permissions: {path}")


def canonical_json(value: Any) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def _private_key() -> Ed25519PrivateKey:
    ensure_private_directory(DATA_DIR)
    if KEY_PATH.exists():
        if os.name == "posix" and stat.S_IMODE(KEY_PATH.stat().st_mode) & 0o077:
            raise RuntimeError("The local signing key must not be readable by group or other users.")
        try:
            loaded = serialization.load_pem_private_key(KEY_PATH.read_bytes(), password=None)
        except (OSError, ValueError, TypeError) as error:
            raise RuntimeError(f"The local signing key could not be loaded: {error}") from error
        if not isinstance(loaded, Ed25519PrivateKey):
            raise RuntimeError("The local signing key is not an Ed25519 key.")
        return loaded

    key = Ed25519PrivateKey.generate()
    encoded = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    descriptor = os.open(KEY_PATH, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "wb") as key_file:
        key_file.write(encoded)
    return key


def sign_report(content: dict[str, Any]) -> dict[str, Any]:
    report = dict(content)
    digest = hashlib.sha256(canonical_json(report)).hexdigest()
    key = _private_key()
    public_key = key.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    report["integrity"] = {
        "algorithm": "Ed25519",
        "canonicalization": "CiviBastion-JSON-v1",
        "digest": digest,
        "publicKey": base64.b64encode(public_key).decode("ascii"),
        "signature": base64.b64encode(key.sign(bytes.fromhex(digest))).decode("ascii"),
    }

    ensure_private_directory(REPORT_DIR)
    report_path = REPORT_DIR / f"{report['assessmentId']}.json"
    descriptor = os.open(report_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "wb") as report_file:
        report_file.write(canonical_json(report))
    return report


def verify_report(report: Any) -> dict[str, Any]:
    if not isinstance(report, dict):
        return {"valid": False, "reason": "Report must be a JSON object."}

    integrity = report.get("integrity")
    if not isinstance(integrity, dict) or integrity.get("algorithm") != "Ed25519":
        return {"valid": False, "reason": "Ed25519 integrity metadata is missing."}

    unsigned_report = {key: value for key, value in report.items() if key != "integrity"}
    expected_digest = hashlib.sha256(canonical_json(unsigned_report)).hexdigest()
    if integrity.get("digest") != expected_digest:
        return {"valid": False, "reason": "The canonical report digest does not match."}

    try:
        public_key = Ed25519PublicKey.from_public_bytes(
            base64.b64decode(integrity["publicKey"], validate=True)
        )
        signature = base64.b64decode(integrity["signature"], validate=True)
        public_key.verify(signature, bytes.fromhex(expected_digest))
    except (KeyError, ValueError, InvalidSignature):
        return {"valid": False, "reason": "The report signature is invalid."}

    return {
        "valid": True,
        "reason": "Digest and Ed25519 signature are valid.",
        "digest": expected_digest,
        "publicKey": integrity["publicKey"],
    }


def new_assessment_id() -> str:
    return str(uuid4())


def utc_now() -> str:
    return datetime.now(UTC).isoformat()
