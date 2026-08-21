import http.server
import json
import os
import socketserver
import sys
from pathlib import Path

SITE_DIR = Path(__file__).parent
ROOT_DIR = SITE_DIR.parent
ENV_FILE = SITE_DIR / ".env"

# Shared request-handling logic lives in api/_common.py so the local dev
# server and the Vercel serverless functions can't drift apart.
sys.path.insert(0, str(ROOT_DIR / "api"))
from _common import debate_reply, support_reply  # noqa: E402


def load_env():
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip()
        if key and value and key not in os.environ:
            os.environ[key] = value


load_env()


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE_DIR), **kwargs)

    def end_headers(self):
        # Dev server — never let the browser cache stale JS/CSS between edits.
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        super().end_headers()

    def do_POST(self):
        if self.path == "/api/respond":
            self._handle(debate_reply)
        elif self.path == "/api/support-chat":
            self._handle(support_reply)
        else:
            self.send_error(404)

    def _handle(self, fn):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            self.send_json(400, {"error": "Malformed request."})
            return
        status, payload = fn(body)
        self.send_json(status, payload)

    def send_json(self, status, payload):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    with socketserver.ThreadingTCPServer(("", port), Handler) as httpd:
        print(f"Cussator dev server: http://localhost:{port}")
        httpd.serve_forever()
