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
        profile = json.loads(PROFILE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError(f"Could not load the bundled assessment profile: {error}") from error

    checks = profile.get("checks")
    limits = profile.get("limits")
    if (
        profile.get("id") != PROFILE_ID
        or profile.get("targetKind") != "bundled-demo-service"
        or not isinstance(checks, list)
        or not checks
        or any(not isinstance(check, str) or check not in ALLOWED_CHECKS for check in checks)
        or not isinstance(limits, dict)
        or not isinstance(limits.get("requestTimeoutSeconds"), int)
        or not 1 <= limits["requestTimeoutSeconds"] <= 10
        or not isinstance(limits.get("scannerTimeoutSeconds"), int)
        or not 1 <= limits["scannerTimeoutSeconds"] <= 120
        or limits.get("maxOutputBytes") != 1_048_576
    ):
        raise RuntimeError("The bundled assessment profile is invalid or contains an unapproved check.")

    return profile
