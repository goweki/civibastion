import json
import os
import shutil
import subprocess
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
    try:
        completed = subprocess.run(
            [npm, "audit", "--json", "--omit=dev", "--no-fund", "--no-progress"],
            cwd=directory,
            env=environment,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return _result(
            "dependency-advisories-v1",
            "error",
            f"npm audit exceeded the {timeout}-second time limit.",
        )
    except OSError as error:
        return _result("dependency-advisories-v1", "error", f"Could not start npm audit: {error}")

    if len(completed.stdout.encode("utf-8")) > MAX_OUTPUT_BYTES:
        return _result(
            "dependency-advisories-v1",
            "error",
            "npm audit output exceeded the 1 MiB limit.",
        )
    try:
        audit = json.loads(completed.stdout)
    except json.JSONDecodeError:
        detail = completed.stderr.strip()[:500] or "npm returned malformed JSON."
        return _result("dependency-advisories-v1", "error", detail)

    metadata = audit.get("metadata", {}).get("vulnerabilities", {})
    if not isinstance(metadata, dict):
        return _result(
            "dependency-advisories-v1",
            "error",
            "npm audit returned a result with an invalid vulnerability summary.",
        )
    total = sum(
        int(metadata.get(severity, 0) or 0)
        for severity in ("critical", "high", "moderate", "low", "info")
    )
    vulnerabilities = audit.get("vulnerabilities", {})
    findings = []
    if isinstance(vulnerabilities, dict):
        for name, item in list(vulnerabilities.items())[:MAX_FINDINGS]:
            if not isinstance(item, dict):
                continue
            via = item.get("via", [])
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
            "counts": {
                severity: int(metadata.get(severity, 0) or 0)
                for severity in ("critical", "high", "moderate", "low", "info")
            },
            "findings": findings,
            "truncated": len(vulnerabilities) > MAX_FINDINGS
            if isinstance(vulnerabilities, dict)
            else False,
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
    try:
        completed = subprocess.run(
            [
                npm,
                "sbom",
                "--package-lock-only",
                "--sbom-format",
                "cyclonedx",
                "--omit=dev",
            ],
            cwd=directory,
            env=environment,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return _result("cyclonedx-sbom-v1", "error", f"SBOM generation exceeded {timeout} seconds.")
    except OSError as error:
        return _result("cyclonedx-sbom-v1", "error", f"Could not start npm SBOM generation: {error}")

    if completed.returncode != 0:
        detail = completed.stderr.strip()[:500] or "npm SBOM generation failed."
        return _result("cyclonedx-sbom-v1", "error", detail)
    if len(completed.stdout.encode("utf-8")) > MAX_OUTPUT_BYTES:
        return _result("cyclonedx-sbom-v1", "error", "SBOM output exceeded the 1 MiB limit.")
    try:
        sbom = json.loads(completed.stdout)
    except json.JSONDecodeError:
        return _result("cyclonedx-sbom-v1", "error", "npm returned malformed CycloneDX JSON.")

    components = sbom.get("components")
    if not isinstance(components, list):
        return _result("cyclonedx-sbom-v1", "error", "SBOM did not contain a components list.")

    report_dir = Path.home() / ".civibastion-demo" / "reports"
    ensure_private_directory(report_dir)
    sbom_path = report_dir / f"{assessment_id}.cdx.json"
    descriptor = os.open(sbom_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w", encoding="utf-8") as sbom_file:
        json.dump(sbom, sbom_file, sort_keys=True, separators=(",", ":"))
    return _result(
        "cyclonedx-sbom-v1",
        "pass",
        f"Generated a CycloneDX SBOM with {len(components)} component(s).",
        {
            "componentCount": len(components),
            "file": str(sbom_path),
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
