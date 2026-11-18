import json
import os
import shutil
import subprocess
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock
from typing import Any

from . import __version__
from .assessment import run_assessment
from .profile import PROFILE_ID, ROOT, VARIANTS, load_profile
from .report import verify_report


AGENT_HOST = "127.0.0.1"
AGENT_PORT = 8785
MAX_REQUEST_BYTES = 1_048_576
ALLOWED_VARIANTS = {"baseline", "patched"}
ASSESSMENT_LOCK = Lock()
TARGET_SCRIPT = ROOT / "examples" / "demo-target" / "server.mjs"


class AgentHandler(BaseHTTPRequestHandler):
    server_version = "CiviBastionLocalAgent/0.1"
    sys_version = ""

    def do_GET(self) -> None:
        if self.path != "/v1/health":
            self._send_json(404, {"error": "Not found."})
            return
        profile = load_profile()
        self._send_json(
            200,
            {
                "status": "ok",
                "agentVersion": __version__,
                "profile": {"id": profile["id"], "version": profile["version"]},
                "variants": sorted(ALLOWED_VARIANTS),
                "targets": [
                    {"variant": "baseline", "port": 8786},
                    {"variant": "patched", "port": 8787},
                ],
            },
        )

    def do_POST(self) -> None:
        if self.path not in {"/v1/assessments", "/v1/reports/verify"}:
            self._send_json(404, {"error": "Not found."})
            return

        try:
            body = self._read_json()
        except ValueError as error:
            self._send_json(400, {"error": str(error)})
            return

        if self.path == "/v1/assessments":
            if body.get("profileId") != PROFILE_ID:
                self._send_json(400, {"error": "Unsupported assessment profile."})
                return
            variant = body.get("variant")
            if variant not in ALLOWED_VARIANTS:
                self._send_json(400, {"error": "Unsupported demo target variant."})
                return
            if not ASSESSMENT_LOCK.acquire(blocking=False):
                self._send_json(429, {"error": "A demo assessment is already running."})
                return
            try:
                self._send_json(200, {"report": run_assessment(variant)})
            except (OSError, RuntimeError, subprocess.SubprocessError) as error:
                self._send_json(500, {"error": f"Local agent failed: {error}"})
            finally:
                ASSESSMENT_LOCK.release()
            return

        self._send_json(200, verify_report(body.get("report")))

    def _read_json(self) -> dict[str, Any]:
        try:
            size = int(self.headers.get("Content-Length", "0"))
        except ValueError as error:
            raise ValueError("Invalid Content-Length.") from error
        if size <= 0 or size > MAX_REQUEST_BYTES:
            raise ValueError("Request body must be between 1 byte and 1 MiB.")
        try:
            body = json.loads(self.rfile.read(size))
        except (json.JSONDecodeError, UnicodeDecodeError) as error:
            raise ValueError("Request body must be valid JSON.") from error
        if not isinstance(body, dict):
            raise ValueError("Request body must be a JSON object.")
        return body

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, _format: str, *_args: Any) -> None:
        return


class LocalAgentServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def main() -> None:
    load_profile()
    targets: list[subprocess.Popen[bytes]] = []
    server: LocalAgentServer | None = None
    try:
        targets = _start_targets()

        server = LocalAgentServer((AGENT_HOST, AGENT_PORT), AgentHandler)
        print(
            f"CiviBastion local demo agent ready at http://{AGENT_HOST}:{AGENT_PORT} "
            f"(profile {PROFILE_ID}; sample targets only)",
            flush=True,
        )
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        if server is not None:
            server.server_close()
        _stop_targets(targets)


def _start_targets() -> list[subprocess.Popen[bytes]]:
    node = shutil.which("node")
    if not node:
        raise RuntimeError("Node.js is required to start the bundled local demo targets.")

    processes: list[subprocess.Popen[bytes]] = []
    try:
        for variant in ("baseline", "patched"):
            target = VARIANTS[variant]
            environment = {
                "PATH": os.environ.get("PATH", ""),
                "CIVIBASTION_DEMO_PORT": str(target["port"]),
                "CIVIBASTION_DEMO_HARDENED": str(variant == "patched").lower(),
                "NODE_ENV": "production",
            }
            process = subprocess.Popen(
                [node, str(TARGET_SCRIPT)],
                cwd=target["directory"],
                env=environment,
            )
            processes.append(process)
            _wait_for_target(process, variant, target["port"])
    except (OSError, RuntimeError) as error:
        _stop_targets(processes)
        raise RuntimeError(f"Could not start the bundled demo targets: {error}") from error
    return processes


def _wait_for_target(
    process: subprocess.Popen[bytes],
    variant: str,
    port: int,
) -> None:
    deadline = time.monotonic() + 10
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError(
                f"The {variant} sample service exited during startup. "
                "Install its dependencies using the README instructions."
            )
        try:
            request = urllib.request.Request(
                f"http://127.0.0.1:{port}/health",
                headers={"Accept": "application/json"},
            )
            with urllib.request.urlopen(request, timeout=1) as response:
                payload = json.loads(response.read(4096))
                if response.status == 200 and payload.get("mode") == variant:
                    return
        except (OSError, urllib.error.URLError, TimeoutError, ValueError, json.JSONDecodeError):
            time.sleep(0.1)
    raise RuntimeError(f"The {variant} sample service did not become ready in 10 seconds.")


def _stop_targets(processes: list[subprocess.Popen[bytes]]) -> None:
    for process in processes:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)


if __name__ == "__main__":
    main()
