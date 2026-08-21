"""Vercel serverless function — POST /api/support-chat (RAG support bot)."""

import json
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path

# Vercel's Python runtime loads this file via importlib.util.spec_from_file_location
# rather than a normal interpreter invocation, so the sibling directory isn't on
# sys.path automatically the way it would be for `python support-chat.py` — add it
# explicitly rather than relying on that assumption.
sys.path.insert(0, str(Path(__file__).parent))
from _common import support_reply  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            self._send(400, {"error": "Malformed request."})
            return

        status, payload = support_reply(body)
        self._send(status, payload)

    def _send(self, status, payload):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)
