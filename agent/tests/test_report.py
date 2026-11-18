import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from civibastion_agent import report


class ReportVerificationTests(unittest.TestCase):
    def test_signed_report_verifies_and_tampering_fails(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            data_directory = Path(temporary_directory)
            with (
                patch.object(report, "DATA_DIR", data_directory),
                patch.object(report, "KEY_PATH", data_directory / "signing-key.pem"),
                patch.object(report, "REPORT_DIR", data_directory / "reports"),
            ):
                signed_report = report.sign_report(
                    {
                        "schemaVersion": "1.0.0",
                        "assessmentId": "test-assessment",
                        "checks": [{"id": "health", "status": "pass"}],
                    }
                )
                self.assertTrue(report.verify_report(signed_report)["valid"])

                tampered = {
                    **signed_report,
                    "checks": [{"id": "health", "status": "fail"}],
                }
                self.assertFalse(report.verify_report(tampered)["valid"])


if __name__ == "__main__":
    unittest.main()
