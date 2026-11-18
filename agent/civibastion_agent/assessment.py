import hashlib
import json
import os
import shutil
import subprocess
import threading
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from . import __version__
from .profile import VARIANTS, load_profile
from .report import (
    ensure_private_directory,
    new_assessment_id,
    sign_report,
    utc_now,
)


MAX_OUTPUT_BYTES = 1_048_576
MAX_FINDINGS = 50


def _run_bounded(
    command: list[str],
    directory: Path,
    environment: dict[str, str],
    timeout: int,
) -> tuple[int, str, str] | str:
    try:
        process = subprocess.Popen(
            command,
            cwd=directory,
            env=environment,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            bufsize=0,
        )
    except OSError as error:
        return f"Could not start the approved tool: {error}"

    output = {"stdout": bytearray(), "stderr": bytearray()}
    output_size = 0
    output_too_large = threading.Event()
    output_lock = threading.Lock()

    def collect(name: str, stream) -> None:
        nonlocal output_size
        try:
            while True:
                chunk = stream.read(4096)
                if not chunk:
                    return
                with output_lock:
                    remaining = MAX_OUTPUT_BYTES - output_size
                    if len(chunk) > remaining:
                        output[name].extend(chunk[:remaining])
                        output_size = MAX_OUTPUT_BYTES
                        output_too_large.set()
                        if process.poll() is None:
                            process.terminate()
                    elif not output_too_large.is_set():
                        output[name].extend(chunk)
                        output_size += len(chunk)
        except OSError:
            return

    readers = [
        threading.Thread(target=collect, args=("stdout", process.stdout), daemon=True),
        threading.Thread(target=collect, args=("stderr", process.stderr), daemon=True),
    ]
    for reader in readers:
        reader.start()

    try:
        return_code = process.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait()
        for reader in readers:
            reader.join()
        return f"The approved tool exceeded the {timeout}-second time limit."

    for reader in readers:
        reader.join()
    if output_too_large.is_set():
        return f"The approved tool output exceeded the {MAX_OUTPUT_BYTES}-byte limit."

    return (
        return_code,
        output["stdout"].decode("utf-8", errors="replace"),
        output["stderr"].decode("utf-8", errors="replace"),
    )


def _request_health(port: int, timeout: int) -> tuple[int, dict[str, str], bytes]:
    request = urllib.request.Request(
        f"http://127.0.0.1:{port}/health",
        headers={"Accept": "application/json"},
        method="GET",
    )
    opener = urllib.request.build_opener(_NoRedirect())
    with opener.open(request, timeout=timeout) as response:
        body = response.read(4097)
        if len(body) > 4096:
            raise ValueError("The demo target response exceeded the 4096-byte limit.")
        return response.status, {key.lower(): value for key, value in response.headers.items()}, body


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, _request, _file, _code, _message, _headers, _url):
        return None


def _result(check_id: str, status: str, summary: str, evidence: Any = None) -> dict[str, Any]:
    result: dict[str, Any] = {
        "id": check_id,
        "status": status,
        "summary": summary,
    }
    if evidence is not None:
        result["evidence"] = evidence
    return result


def _audit_dependencies(directory: Path, timeout: int) -> dict[str, Any]:
    npm = shutil.which("npm")
    if not npm:
        return _result(
            "dependency-advisories-v1",
            "error",
            "npm was not found. Install Node.js/npm and restart the local agent.",
        )

    environment = {
        "PATH": os.environ.get("PATH", ""),
        "HOME": str(Path.home()),
        "npm_config_registry": "https://registry.npmjs.org/",
        "npm_config_userconfig": os.devnull,
        "npm_config_globalconfig": os.devnull,
        "npm_config_audit": "true",
        "npm_config_fund": "false",
        "npm_config_update_notifier": "false",
    }
    execution = _run_bounded(
        [npm, "audit", "--json", "--omit=dev", "--no-fund", "--no-progress"],
        directory,
        environment,
        timeout,
    )
    if isinstance(execution, str):
        return _result(
            "dependency-advisories-v1",
            "error",
            execution,
        )
    return_code, stdout, stderr = execution
    try:
        audit = json.loads(stdout)
    except json.JSONDecodeError:
        detail = stderr.strip()[:500] or "npm returned malformed JSON."
        return _result("dependency-advisories-v1", "error", detail)
    if not isinstance(audit, dict):
        return _result("dependency-advisories-v1", "error", "npm audit returned a non-object result.")

    if return_code not in (0, 1):
        return _result("dependency-advisories-v1", "error", stderr.strip()[:500] or "npm audit failed.")
    audit_metadata = audit.get("metadata")
    if not isinstance(audit_metadata, dict):
        return _result("dependency-advisories-v1", "error", "npm audit metadata is missing.")
    metadata = audit_metadata.get("vulnerabilities")
    if not isinstance(metadata, dict):
        return _result(
            "dependency-advisories-v1",
            "error",
            "npm audit returned a result with an invalid vulnerability summary.",
        )
    counts: dict[str, int] = {}
    for severity in ("critical", "high", "moderate", "low", "info"):
        count = metadata.get(severity, 0)
        if type(count) is not int or count < 0:
            return _result(
                "dependency-advisories-v1",
                "error",
                "npm audit returned an invalid vulnerability count.",
            )
        counts[severity] = count
    total = sum(
        counts.values()
    )
    vulnerabilities = audit.get("vulnerabilities", {})
    if not isinstance(vulnerabilities, dict):
        return _result("dependency-advisories-v1", "error", "npm audit findings are malformed.")
    findings = []
    for name, item in list(vulnerabilities.items())[:MAX_FINDINGS]:
        if not isinstance(item, dict):
            return _result("dependency-advisories-v1", "error", "npm audit returned malformed findings.")
        via = item.get("via", [])
        if not isinstance(via, list):
            return _result("dependency-advisories-v1", "error", "npm audit returned malformed references.")
        references = [
            {
                "title": reference.get("title"),
                "url": reference.get("url"),
            }
            for reference in via
            if isinstance(reference, dict)
        ]
        findings.append(
            {
                "package": name,
                "severity": item.get("severity", "unknown"),
                "range": item.get("range"),
                "direct": bool(item.get("isDirect")),
                "references": references[:5],
            }
        )

    status = "fail" if total else "pass"
    return _result(
        "dependency-advisories-v1",
        status,
        f"npm audit reported {total} known vulnerable package(s).",
        {
            "counts": counts,
            "findings": findings,
            "truncated": len(vulnerabilities) > MAX_FINDINGS,
            "database": "npm registry audit endpoint",
        },
    )


def _generate_sbom(directory: Path, timeout: int, assessment_id: str) -> dict[str, Any]:
    npm = shutil.which("npm")
    if not npm:
        return _result("cyclonedx-sbom-v1", "error", "npm was not found.")

    environment = {
        "PATH": os.environ.get("PATH", ""),
        "HOME": str(Path.home()),
        "npm_config_registry": "https://registry.npmjs.org/",
        "npm_config_userconfig": os.devnull,
        "npm_config_globalconfig": os.devnull,
        "npm_config_update_notifier": "false",
    }
    execution = _run_bounded(
        [
            npm,
            "sbom",
            "--package-lock-only",
            "--sbom-format",
            "cyclonedx",
            "--omit=dev",
        ],
        directory,
        environment,
        timeout,
    )
    if isinstance(execution, str):
        return _result("cyclonedx-sbom-v1", "error", execution)
    return_code, stdout, stderr = execution
    if return_code != 0:
        detail = stderr.strip()[:500] or "npm SBOM generation failed."
        return _result("cyclonedx-sbom-v1", "error", detail)
    try:
        sbom = json.loads(stdout)
    except json.JSONDecodeError:
        return _result("cyclonedx-sbom-v1", "error", "npm returned malformed CycloneDX JSON.")

    if not isinstance(sbom, dict):
        return _result("cyclonedx-sbom-v1", "error", "npm returned a non-object SBOM.")
    components = sbom.get("components")
    if not isinstance(components, list):
        return _result("cyclonedx-sbom-v1", "error", "SBOM did not contain a components list.")

    report_dir = Path.home() / ".civibastion-demo" / "reports"
    ensure_private_directory(report_dir)
    sbom_path = report_dir / f"{assessment_id}.cdx.json"
    sbom_content = json.dumps(sbom, sort_keys=True, separators=(",", ":")).encode("utf-8")
    descriptor = os.open(sbom_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w", encoding="utf-8") as sbom_file:
        sbom_file.write(sbom_content.decode("utf-8"))
    return _result(
        "cyclonedx-sbom-v1",
        "pass",
        f"Generated a CycloneDX SBOM with {len(components)} component(s).",
        {
            "componentCount": len(components),
            "file": sbom_path.name,
            "sha256": hashlib.sha256(sbom_content).hexdigest(),
        },
    )


def run_assessment(variant: str) -> dict[str, Any]:
    profile = load_profile()
    target = VARIANTS.get(variant)
    if target is None:
        raise ValueError("Unsupported demo target variant.")

    started_at = utc_now()
    assessment_id = new_assessment_id()
    port = target["port"]
    directory: Path = target["directory"]
    checks = []
    try:
        status_code, headers, body = _request_health(
            port,
            profile["limits"]["requestTimeoutSeconds"],
        )
        payload = json.loads(body)
        mode_matches = payload.get("mode") == variant
        health_ok = status_code == 200 and payload.get("status") == "ok" and mode_matches
        checks.append(
            _result(
                "service-health-v1",
                "pass" if health_ok else "fail",
                (
                    f"Health endpoint returned HTTP {status_code} for the expected {variant} target."
                    if health_ok
                    else f"Health endpoint returned HTTP {status_code} or the target variant did not match."
                ),
                {"path": "/health", "targetMode": payload.get("mode")},
            )
        )
        required_headers = {
            "x-content-type-options": "nosniff",
            "content-security-policy": "default-src 'none'",
        }
        missing_headers = [
            f"{name}: {expected}"
            for name, expected in required_headers.items()
            if headers.get(name, "").lower() != expected.lower()
        ]
        checks.append(
            _result(
                "security-headers-v1",
                "fail" if missing_headers else "pass",
                (
                    f"{len(missing_headers)} required response header(s) are missing or incorrect."
                    if missing_headers
                    else "Both required response headers are present."
                ),
                {
                    "required": required_headers,
                    "missingOrIncorrect": missing_headers,
                },
            )
        )
    except (OSError, urllib.error.URLError, TimeoutError, ValueError, json.JSONDecodeError) as error:
        checks.append(
            _result(
                "service-health-v1",
                "error",
                f"The fixed local demo endpoint could not be assessed: {error}",
                {"port": port},
            )
        )
        checks.append(
            _result(
                "security-headers-v1",
                "skipped",
                "Skipped because the local health endpoint could not be read.",
            )
        )

    checks.append(
        _audit_dependencies(
            directory,
            profile["limits"]["scannerTimeoutSeconds"],
        )
    )
    checks.append(
        _generate_sbom(
            directory,
            profile["limits"]["scannerTimeoutSeconds"],
            assessment_id,
        )
    )
    completed_at = utc_now()

    content = {
        "schemaVersion": "1.0.0",
        "assessmentId": assessment_id,
        "profile": {
            "id": profile["id"],
            "version": profile["version"],
            "sha256": profile["sha256"],
            "checks": profile["checks"],
        },
        "target": {
            "kind": profile["targetKind"],
            "name": "CiviBastion bundled local demo",
            "variant": variant,
            "scope": ["127.0.0.1", f"127.0.0.1:{port}", str(directory.relative_to(profile_root()))],
        },
        "execution": {
            "startedAt": started_at,
            "completedAt": completed_at,
            "agentVersion": __version__,
            "npmVersion": _tool_version("npm"),
            "nodeVersion": _tool_version("node"),
        },
        "checks": checks,
        "limitations": [
            "This demo assesses only the bundled local sample service and its npm lockfile.",
            "npm audit uses the npm registry audit database; this is not Trivy, Syft, or OSV-Scanner.",
            "A passing check is not a security certification and does not evaluate AI model behavior.",
            "The embedded demo signing key is not independently trusted as an organizational identity.",
        ],
    }
    return sign_report(content)


def _tool_version(name: str) -> str:
    executable = shutil.which(name)
    if not executable:
        return "unavailable"
    try:
        completed = subprocess.run(
            [executable, "--version"],
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return "unavailable"
    return completed.stdout.strip()[:80] or "unavailable"


def profile_root() -> Path:
    return Path(__file__).resolve().parents[2]
