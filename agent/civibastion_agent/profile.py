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
    if (
        profile.get("id") != PROFILE_ID
        or not isinstance(checks, list)
        or not checks
        or any(check not in ALLOWED_CHECKS for check in checks)
    ):
        raise RuntimeError("The bundled assessment profile is invalid or contains an unapproved check.")

    return profile
