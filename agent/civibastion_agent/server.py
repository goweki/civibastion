import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock, Thread
from typing import Any

from . import __version__
from .assessment import run_assessment
from .demo_target import DemoTargetServer
from .profile import PROFILE_ID, load_profile
from .report import verify_report


AGENT_HOST = "127.0.0.1"
AGENT_PORT = 8785
MAX_REQUEST_BYTES = 1_048_576
ALLOWED_VARIANTS = {"baseline", "patched"}
ASSESSMENT_LOCK = Lock()


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
                finally:
                    ASSESSMENT_LOCK.release()
                return

            self._send_json(200, verify_report(body.get("report")))
        except (ValueError, RuntimeError) as error:
            self._send_json(400, {"error": str(error)})
        except OSError as error:
            self._send_json(500, {"error": f"Local agent failed: {error}"})

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
    targets: list[DemoTargetServer] = []
    server: LocalAgentServer | None = None
    try:
        for port, mode in ((8786, "baseline"), (8787, "patched")):
            target = DemoTargetServer(port, mode)
            targets.append(target)
            Thread(target=target.serve_forever, daemon=True).start()

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
        for target in targets:
            target.shutdown()
            target.server_close()


if __name__ == "__main__":
    main()
