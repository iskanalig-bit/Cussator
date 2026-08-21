import http.server
import json
import os
import socketserver
import sys
from pathlib import Path

import anthropic
from openai import OpenAI
from supabase import create_client

SITE_DIR = Path(__file__).parent
ENV_FILE = SITE_DIR / ".env"

EMBEDDING_MODEL = "text-embedding-3-small"
MATCH_COUNT = 5
MATCH_THRESHOLD = 0.3

SUPPORT_SYSTEM_PROMPT = (
    "Ты помощник поддержки. Отвечай ТОЛЬКО по информации из базы знаний, которую даёт "
    "инструмент поиска. Если ответа в базе нет, честно скажи: "
    "'В моей базе знаний нет ответа на этот вопрос'. Не выдумывай."
)

SYSTEM_PROMPT = (
    'You are a live participant in Cussator debates, a format close to Model UN — not a news anchor. '
    'Round motion: "{motion}". The user argues for the motion (Prop 1), you argue against it (Opp).\n\n'
    "How to sound:\n"
    "- Talk like someone actually arguing out loud, a little fired up by what's happening: "
    "confident, sometimes with a light edge of sarcasm or irritation.\n"
    "- Use conversational rhythm and phrasing — short sentences, incomplete ones are fine, "
    'rhetorical questions ("And that proves what, exactly?", "Seriously?"). Feel free to open '
    'a line with an interjection or a short reaction ("Okay, wait.", "Sure, but...").\n'
    "- No corporate or textbook tone: no \"it should be noted\", \"it's important to understand\", "
    '"thus", "in conclusion" — this is a live argument, not an academic paper.\n\n'
    "Content rules:\n"
    "- RESPONSE LANGUAGE: always write only in English, no matter what language the user writes "
    "in. Even if the user writes in Russian — you still respond in English. "
    "No exceptions.\n"
    "- Keep it short: 2-4 sentences.\n"
    "- Stay substantive and persuasive despite the casual tone: latch onto vague "
    'phrasing, filler words ("kind of", "in my opinion", "как бы", "вроде", "наверное", '
    '"типа") and weak claims — call them out directly and demand specifics.\n'
    "- Never fully agree with the user — you're their opponent.\n"
    "- Plain text, no markdown and no lists."
)


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
            self.handle_respond()
        elif self.path == "/api/support-chat":
            self.handle_support_chat()
        else:
            self.send_error(404)

    def handle_respond(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            self.send_json(400, {"error": "Malformed request."})
            return

        motion = str(body.get("motion", ""))[:500].strip()
        argument = str(body.get("argument", ""))[:2000].strip()
        history = body.get("history", [])

        if not argument:
            self.send_json(400, {"error": "Empty argument."})
            return

        if not os.environ.get("ANTHROPIC_API_KEY"):
            self.send_json(
                500,
                {"error": "ANTHROPIC_API_KEY is not set. Add your key to site/.env and restart the server."},
            )
            return

        messages = []
        if isinstance(history, list):
            for turn in history[-8:]:
                if not isinstance(turn, dict):
                    continue
                role, content = turn.get("role"), turn.get("content")
                if role in ("user", "assistant") and isinstance(content, str) and content.strip():
                    messages.append({"role": role, "content": content[:2000]})
        messages.append({"role": "user", "content": argument})

        try:
            client = anthropic.Anthropic()
            response = client.messages.create(
                model="claude-opus-5",
                max_tokens=300,
                system=SYSTEM_PROMPT.format(motion=motion or "This House believes nuclear power is the fastest path to decarbonization."),
                output_config={"effort": "low"},
                messages=messages,
            )
            reply = "".join(block.text for block in response.content if block.type == "text").strip()
            self.send_json(200, {"reply": reply or "…"})
        except anthropic.AuthenticationError:
            self.send_json(500, {"error": "Invalid ANTHROPIC_API_KEY."})
        except anthropic.APIStatusError as e:
            self.send_json(500, {"error": f"Claude API error: {e.message}"})
        except Exception as e:
            self.send_json(500, {"error": f"Server error: {e}"})

    def handle_support_chat(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            self.send_json(400, {"error": "Malformed request."})
            return

        question = str(body.get("question", ""))[:2000].strip()
        history = body.get("history", [])

        if not question:
            self.send_json(400, {"error": "Empty question."})
            return

        missing = [
            k for k in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY")
            if not os.environ.get(k)
        ]
        if missing:
            self.send_json(
                500,
                {"error": f"Missing env vars: {', '.join(missing)}. Add them to site/.env and restart the server."},
            )
            return

        try:
            openai_client = OpenAI()
            embedding = openai_client.embeddings.create(
                model=EMBEDDING_MODEL, input=question
            ).data[0].embedding

            supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
            result = supabase.rpc(
                "match_knowledge_chunks",
                {"query_embedding": embedding, "match_count": MATCH_COUNT},
            ).execute()
            # The RPC returns the top match_count chunks regardless of score;
            # decide relevance here rather than in the SQL predicate.
            matches = [m for m in (result.data or []) if m.get("similarity", 0) > MATCH_THRESHOLD]

            if matches:
                context_block = "\n\n".join(
                    f"[{i + 1}] {m['content']}" for i, m in enumerate(matches)
                )
                user_turn = (
                    f"Knowledge base search results:\n{context_block}\n\n"
                    f"User question: {question}"
                )
            else:
                user_turn = (
                    "Knowledge base search results: (no matching chunks found)\n\n"
                    f"User question: {question}"
                )

            messages = []
            if isinstance(history, list):
                for turn in history[-8:]:
                    if not isinstance(turn, dict):
                        continue
                    role, content = turn.get("role"), turn.get("content")
                    if role in ("user", "assistant") and isinstance(content, str) and content.strip():
                        messages.append({"role": role, "content": content[:2000]})
            messages.append({"role": "user", "content": user_turn})

            client = anthropic.Anthropic()
            response = client.messages.create(
                model="claude-opus-5",
                max_tokens=500,
                system=SUPPORT_SYSTEM_PROMPT,
                output_config={"effort": "low"},
                messages=messages,
            )
            reply = "".join(block.text for block in response.content if block.type == "text").strip()
            sources = sorted({m.get("source") for m in matches if m.get("source")})
            self.send_json(200, {"reply": reply or "…", "sources": sources})
        except anthropic.AuthenticationError:
            self.send_json(500, {"error": "Invalid ANTHROPIC_API_KEY."})
        except anthropic.APIStatusError as e:
            self.send_json(500, {"error": f"Claude API error: {e.message}"})
        except Exception as e:
            self.send_json(500, {"error": f"Server error: {e}"})

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
