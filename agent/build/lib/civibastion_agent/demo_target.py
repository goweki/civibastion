import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any


class DemoTargetHandler(BaseHTTPRequestHandler):
    server_version = "CiviBastionDemo/1.0"
    sys_version = ""

    def do_GET(self) -> None:
        if self.path != "/health":
            self.send_error(404)
            return

        payload = json.dumps(
            {
                "status": "ok",
                "target": "civibastion-local-demo",
                "mode": self.server.demo_mode,
            }
        ).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        if self.server.demo_mode == "patched":
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Security-Policy", "default-src 'none'")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, _format: str, *_args: Any) -> None:
        return


class DemoTargetServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True

    def __init__(self, port: int, mode: str):
        super().__init__(("127.0.0.1", port), DemoTargetHandler)
        self.demo_mode = mode
