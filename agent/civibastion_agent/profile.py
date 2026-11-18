import hashlib
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
PROFILE_PATH = ROOT / "profiles" / "demo-web-baseline-v1.json"
ALLOWED_CHECKS = {
    "service-health-v1",
    "security-headers-v1",
    "dependency-advisories-v1",
    "cyclonedx-sbom-v1",
}
PROFILE_ID = "demo-web-baseline"
VARIANTS = {
    "baseline": {
        "port": 8786,
        "directory": ROOT / "examples" / "demo-target" / "baseline",
    },
    "patched": {
        "port": 8787,
        "directory": ROOT / "examples" / "demo-target" / "patched",
    },
}


def load_profile() -> dict[str, Any]:
    try:
        raw_profile = PROFILE_PATH.read_bytes()
        profile = json.loads(raw_profile)
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError(f"Could not load the bundled assessment profile: {error}") from error

    checks = profile.get("checks")
    limits = profile.get("limits")
    if (
        profile.get("id") != PROFILE_ID
        or profile.get("targetKind") != "bundled-demo-service"
        or not isinstance(checks, list)
        or any(not isinstance(check, str) or check not in ALLOWED_CHECKS for check in checks)
        or len(checks) != len(ALLOWED_CHECKS)
        or set(checks) != ALLOWED_CHECKS
        or not isinstance(limits, dict)
        or type(limits.get("requestTimeoutSeconds")) is not int
        or not 1 <= limits["requestTimeoutSeconds"] <= 10
        or type(limits.get("scannerTimeoutSeconds")) is not int
        or not 1 <= limits["scannerTimeoutSeconds"] <= 120
        or limits.get("maxOutputBytes") != 1_048_576
    ):
        raise RuntimeError("The bundled assessment profile is invalid or contains an unapproved check.")

    profile["sha256"] = hashlib.sha256(raw_profile).hexdigest()
    return profile
