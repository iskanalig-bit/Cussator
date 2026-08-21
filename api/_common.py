"""Shared request-handling logic for the Cussator API.

Imported by both the Vercel serverless functions (respond.py, support-chat.py)
and the local dev server (site/server.py) so behavior can't drift between the
two deployment paths. Each public function takes the parsed JSON request body
and returns (status_code, payload_dict) — the caller is responsible for
turning that into an actual HTTP response.

Env vars (ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
OPENAI_API_KEY) are read directly from os.environ — on Vercel these come from
the dashboard / `vercel env`; locally, site/server.py populates them from
site/.env before this module is used.
"""

import os

import anthropic
from openai import OpenAI
from supabase import create_client

EMBEDDING_MODEL = "text-embedding-3-small"
MATCH_COUNT = 5
MATCH_THRESHOLD = 0.3

DEFAULT_MOTION = "This House believes nuclear power is the fastest path to decarbonization."

DEBATE_SYSTEM_PROMPT = (
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

SUPPORT_SYSTEM_PROMPT = (
    "Ты помощник поддержки. Отвечай ТОЛЬКО по информации из базы знаний, которую даёт "
    "инструмент поиска. Если ответа в базе нет, честно скажи: "
    "'В моей базе знаний нет ответа на этот вопрос'. Не выдумывай."
)


def _history_messages(history):
    messages = []
    if isinstance(history, list):
        for turn in history[-8:]:
            if not isinstance(turn, dict):
                continue
            role, content = turn.get("role"), turn.get("content")
            if role in ("user", "assistant") and isinstance(content, str) and content.strip():
                messages.append({"role": role, "content": content[:2000]})
    return messages


def debate_reply(body):
    motion = str(body.get("motion", ""))[:500].strip()
    argument = str(body.get("argument", ""))[:2000].strip()

    if not argument:
        return 400, {"error": "Empty argument."}
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return 500, {"error": "ANTHROPIC_API_KEY is not set."}

    messages = _history_messages(body.get("history", []))
    messages.append({"role": "user", "content": argument})

    try:
        client = anthropic.Anthropic()
        response = client.messages.create(
            model="claude-opus-5",
            max_tokens=300,
            system=DEBATE_SYSTEM_PROMPT.format(motion=motion or DEFAULT_MOTION),
            output_config={"effort": "low"},
            messages=messages,
        )
        reply = "".join(b.text for b in response.content if b.type == "text").strip()
        return 200, {"reply": reply or "…"}
    except anthropic.AuthenticationError:
        return 500, {"error": "Invalid ANTHROPIC_API_KEY."}
    except anthropic.APIStatusError as e:
        return 500, {"error": f"Claude API error: {e.message}"}
    except Exception as e:
        return 500, {"error": f"Server error: {e}"}


def support_reply(body):
    question = str(body.get("question", ""))[:2000].strip()

    if not question:
        return 400, {"error": "Empty question."}

    missing = [
        k for k in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY")
        if not os.environ.get(k)
    ]
    if missing:
        return 500, {"error": f"Missing env vars: {', '.join(missing)}."}

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

        messages = _history_messages(body.get("history", []))
        messages.append({"role": "user", "content": user_turn})

        client = anthropic.Anthropic()
        response = client.messages.create(
            model="claude-opus-5",
            max_tokens=500,
            system=SUPPORT_SYSTEM_PROMPT,
            output_config={"effort": "low"},
            messages=messages,
        )
        reply = "".join(b.text for b in response.content if b.type == "text").strip()
        sources = sorted({m.get("source") for m in matches if m.get("source")})
        return 200, {"reply": reply or "…", "sources": sources}
    except anthropic.AuthenticationError:
        return 500, {"error": "Invalid ANTHROPIC_API_KEY."}
    except anthropic.APIStatusError as e:
        return 500, {"error": f"Claude API error: {e.message}"}
    except Exception as e:
        return 500, {"error": f"Server error: {e}"}
