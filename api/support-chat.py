"""Vercel serverless function — POST /api/support-chat (RAG support bot)."""

import json
from http.server import BaseHTTPRequestHandler

from _common import support_reply


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
