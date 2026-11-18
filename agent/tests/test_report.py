import unittest

from civibastion_agent.report import sign_report, verify_report


class ReportVerificationTests(unittest.TestCase):
    def test_signed_report_verifies_and_tampering_fails(self):
        report = sign_report(
            {
                "schemaVersion": "1.0.0",
                "assessmentId": "test-assessment",
                "checks": [{"id": "health", "status": "pass"}],
            }
        )

        self.assertTrue(verify_report(report)["valid"])

        tampered = {**report, "checks": [{"id": "health", "status": "fail"}]}
        self.assertFalse(verify_report(tampered)["valid"])


if __name__ == "__main__":
    unittest.main()
