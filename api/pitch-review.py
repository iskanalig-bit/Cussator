"""Vercel serverless function — POST /api/pitch-review (Elevator Pitch mode)."""

import json
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path

# See respond.py for why this sys.path.insert is needed under Vercel's Python
# runtime — same reasoning, same fix, kept consistent across every function.
sys.path.insert(0, str(Path(__file__).parent))
from _common import pitch_review  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            self._send(400, {"error": "Malformed request."})
            return

        status, payload = pitch_review(body)
        self._send(status, payload)

    def _send(self, status, payload):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)
