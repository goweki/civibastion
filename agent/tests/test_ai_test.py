import json
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from unittest.mock import patch

from civibastion_agent import ai_test


class _ResponseHandler(BaseHTTPRequestHandler):
    response_content = "I cannot disclose the synthetic canary."

    def do_POST(self):
        self.server.request_body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        payload = {
            "choices": [
                {"message": {"role": "assistant", "content": self.response_content}}
            ]
        }
        encoded = json.dumps(payload).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, _format, *_args):
        return


class AiEndpointAssessmentTests(unittest.TestCase):
    def test_sample_request_uses_one_synthetic_canary_and_passes(self):
        server = HTTPServer(("127.0.0.1", 0), _ResponseHandler)
        server.request_body = None
        thread = threading.Thread(target=server.handle_request)
        thread.start()
        endpoint = f"http://127.0.0.1:{server.server_port}/v1/chat/completions"
        try:
            response = ai_test._post_chat_completion(
                endpoint,
                "sample-model",
                "CIVIBASTION-SYNTHETIC-CANARY-12345678",
                2,
                None,
            )
        finally:
            thread.join(timeout=2)
            server.server_close()
        self.assertEqual(len(server.request_body["messages"]), 2)
        checks = ai_test._evaluate(response, "CIVIBASTION-SYNTHETIC-CANARY-12345678")
        self.assertEqual([check["status"] for check in checks], ["pass", "pass"])

    def test_exact_canary_echo_fails_disclosure_check(self):
        canary = "CIVIBASTION-SYNTHETIC-CANARY-12345678"
        checks = ai_test._evaluate(
            {
                "httpStatus": 200,
                "content": f"The canary is {canary}.",
                "responseBytes": 30,
            },
            canary,
        )
        self.assertEqual(checks[0]["status"], "pass")
        self.assertEqual(checks[1]["status"], "fail")
        self.assertTrue(checks[1]["evidence"]["exactCanaryFound"])

    def test_invalid_response_marks_canary_check_needs_review(self):
        checks = ai_test._evaluate(
            {"httpStatus": 200, "error": "The endpoint did not return valid JSON."},
            "CIVIBASTION-SYNTHETIC-CANARY-12345678",
        )
        self.assertEqual(checks[0]["status"], "fail")
        self.assertEqual(checks[1]["status"], "needs-review")

    def test_endpoint_requires_https_except_for_loopback(self):
        self.assertEqual(
            ai_test.validate_endpoint("http://127.0.0.1:8080/v1/chat/completions"),
            "http://127.0.0.1:8080",
        )
        with self.assertRaises(ValueError):
            ai_test.validate_endpoint("http://example.com/v1/chat/completions")

    def test_endpoint_rejects_embedded_secrets_and_query_parameters(self):
        for endpoint in (
            "https://user:secret@example.com/v1/chat/completions",
            "https://example.com/v1/chat/completions?api_key=secret",
        ):
            with self.subTest(endpoint=endpoint), self.assertRaises(ValueError):
                ai_test.validate_endpoint(endpoint)

    def test_api_key_with_header_control_characters_is_rejected_without_echoing_it(self):
        secret = "sample-secret\r\nX-Injected: yes"
        with self.assertRaises(ValueError) as raised:
            ai_test.run_assessment(
                "http://127.0.0.1:8080/v1/chat/completions",
                "sample-model",
                api_key=secret,
            )
        self.assertNotIn(secret, str(raised.exception))

    def test_html_report_escapes_endpoint_response_excerpt(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            report_dir = Path(temporary_directory) / "reports"
            report = {
                "assessmentId": "html-test",
                "profile": {"id": "ai-endpoint-baseline-v1", "version": "1.0.0"},
                "target": {"endpointOrigin": "https://example.test", "model": "sample"},
                "checks": [
                    {
                        "id": "synthetic-canary-nondisclosure-v1",
                        "testVersion": "1.0.0",
                        "status": "pass",
                        "summary": "Sample result.",
                        "evaluator": "exact-string-match-v1",
                        "evidence": {"responseExcerpt": "<script>alert(1)</script>"},
                    }
                ],
                "limitations": ["Sample only."],
            }
            with patch.object(ai_test.report_utils, "REPORT_DIR", report_dir):
                html_path = ai_test._write_html(report)
            rendered = html_path.read_text(encoding="utf-8")
            self.assertIn("&lt;script&gt;alert(1)&lt;/script&gt;", rendered)
            self.assertNotIn("<script>", rendered)


if __name__ == "__main__":
    unittest.main()
