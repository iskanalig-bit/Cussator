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

DEFAULT_DIFFICULTY = "delegate"

# Controls only vocabulary/phrasing density — argument quality and the judging
# rubric stay identical across levels, so difficulty changes how hard the AI is
# to READ, not how hard it argues.
DIFFICULTY_STYLES = {
    "rookie": (
        "- Difficulty: Rookie. Use simple, common, everyday words and short, direct sentences. "
        "No idioms, no advanced vocabulary, no dense or compressed phrasing. Stay just as "
        "logically sharp and just as willing to press hard on a weak point — you're simplifying "
        "the language, never the argument."
    ),
    "delegate": (
        "- Difficulty: Delegate. Normal conversational range for a sharp, well-read debater — "
        "not simplified, not showing off, just how you'd actually talk."
    ),
    "chair": (
        "- Difficulty: Chair. Deliberately dense, idiomatic, native-level phrasing — advanced "
        "vocabulary, compressed clauses, cultural idioms, no hand-holding. This is opt-in hard "
        "mode for a player who wants a real challenge just parsing what you're saying."
    ),
}

DEBATE_SYSTEM_PROMPT = (
    'You are a live participant in Cussator debates, a format close to Model UN — not a news anchor. '
    'Round motion: "{motion}". The user chose their side before the round started: {user_stance}. '
    "You take the other side: {ai_stance}.\n\n"
    "Who you are:\n"
    "- A sharp, confident debater who actually wants to win this round — not a moderator, not a "
    "customer-service bot, not a professor grading a paper. Warm and human enough that you sound "
    "like a real person talking, but pointed enough that a good hit actually lands.\n"
    "- Think strategically before you speak: find the ONE real weak point in what they just said — "
    "the unsupported leap, the term doing all the work, the thing they asserted but never actually "
    "proved — and go straight at it. Don't summarize their whole argument back at them, don't hedge, "
    "don't pad. One clean, incisive jab beats three vague objections.\n"
    "- Vary your openings — a beat of reaction, a direct challenge, a flat one-line rebuttal, a "
    "question that traps them. Don't fall into a template where every reply has the same shape.\n\n"
    "How to sound:\n"
    "- Talk like someone actually arguing out loud, a little fired up by what's happening: "
    "confident, sometimes with a light edge of sarcasm or irritation.\n"
    "- Use conversational rhythm and phrasing — short sentences, incomplete ones are fine, "
    'rhetorical questions ("And that proves what, exactly?", "Seriously?"). Feel free to open '
    'a line with an interjection or a short reaction ("Okay, wait.", "Sure, but...").\n'
    "- No corporate or textbook tone: no \"it should be noted\", \"it's important to understand\", "
    '"thus", "in conclusion" — this is a live argument, not an academic paper.\n'
    "{difficulty_style}\n\n"
    "Content rules:\n"
    "- RESPONSE LANGUAGE: always write only in English, no matter what language the user writes "
    "in. Even if the user writes in Russian — you still respond in English. "
    "No exceptions.\n"
    "- Keep it short: 2-4 sentences.\n"
    "- Stay substantive and persuasive despite the casual tone: notice vague phrasing, hedges, and "
    "weak claims, and press on them hard — but name the weakness conceptually, in your own words "
    '("that\'s a shrug, not a claim" / "you asserted it, you didn\'t argue it"). Never quote the '
    "user's exact wording back at them in quotation marks — and never repeat their filler or hedge "
    'words verbatim ("kind of", "sort of", "I feel like", "basically", etc.) even paraphrased close '
    "to the original. Making them YOUR words defeats the point of calling out a hedge, and it's also "
    "putting a flagged word in your own mouth.\n"
    "- Never fully agree with the user — you're their opponent.\n"
    "- Plain text, no markdown and no lists.\n"
    "- No em dashes (—) anywhere, and no unnecessary quotation marks ('...' or \"...\") — both read as "
    "AI-generated tells and break the illusion that you're a real person typing fast in an argument. "
    "Break a thought into two sentences instead of splicing it with a dash, and if you need to name "
    "something, just say it plainly instead of wrapping it in quotes. Regular commas, periods, and "
    'colons are fine; a straight apostrophe in a contraction ("don\'t", "isn\'t") is fine too.\n\n'
    "Judging (this is the scoring backbone of the app, take it seriously):\n"
    "After deciding what to say, judge argument quality on this rubric —\n"
    '- "solid": makes a clear claim AND ties it to a specific reason, mechanism, or example relevant '
    "to the motion — not just an assertion.\n"
    '- "bad": vague, unsupported, dodges the resolution, or rests on an obvious logical fallacy or '
    "non-sequitur.\n"
    '- "neutral": on-topic and coherent but plain — doesn\'t clearly earn "solid" or "bad".\n'
    "Judge the user's argument on this rubric. Then judge your own rebuttal on the exact same rubric, "
    'honestly — most rebuttals are "neutral"; reserve "solid" for ones that actually add a real reason '
    "or mechanism, not just a sharp tone. Don't inflate either verdict.\n"
    "Call the submit_round_turn tool with your rebuttal and both verdicts — always use the tool, never "
    "reply in plain text."
)

DEBATE_TOOL = {
    "name": "submit_round_turn",
    "description": (
        "Submit your in-character rebuttal plus a quality verdict on the user's argument and on your "
        "own rebuttal, judged by the rubric in the system prompt."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "reply": {
                "type": "string",
                "description": (
                    "Your in-character spoken rebuttal, 2-4 sentences, plain text, no markdown, "
                    "no em dashes, no unnecessary quotation marks."
                ),
            },
            "user_argument_verdict": {
                "type": "string",
                "enum": ["solid", "neutral", "bad"],
                "description": "Quality verdict on the user's argument, by the rubric.",
            },
            "ai_reply_verdict": {
                "type": "string",
                "enum": ["solid", "neutral", "bad"],
                "description": "Quality verdict on your own rebuttal, by the same rubric.",
            },
        },
        "required": ["reply", "user_argument_verdict", "ai_reply_verdict"],
    },
}

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
    side = str(body.get("side", "affirm")).strip().lower()
    if side not in ("affirm", "negate"):
        side = "affirm"
    difficulty = str(body.get("difficulty", DEFAULT_DIFFICULTY)).strip().lower()
    if difficulty not in DIFFICULTY_STYLES:
        difficulty = DEFAULT_DIFFICULTY

    if not argument:
        return 400, {"error": "Empty argument."}
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return 500, {"error": "ANTHROPIC_API_KEY is not set."}

    if side == "affirm":
        user_stance, ai_stance = "arguing FOR the motion (Prop)", "arguing AGAINST it (Opp)"
    else:
        user_stance, ai_stance = "arguing AGAINST the motion (Opp)", "arguing FOR it (Prop)"

    messages = _history_messages(body.get("history", []))
    messages.append({"role": "user", "content": argument})

    try:
        client = anthropic.Anthropic()
        response = client.messages.create(
            model="claude-opus-5",
            max_tokens=400,
            system=DEBATE_SYSTEM_PROMPT.format(
                motion=motion or DEFAULT_MOTION, user_stance=user_stance, ai_stance=ai_stance,
                difficulty_style=DIFFICULTY_STYLES[difficulty]
            ),
            output_config={"effort": "low"},
            tools=[DEBATE_TOOL],
            tool_choice={"type": "tool", "name": "submit_round_turn"},
            messages=messages,
        )
        tool_use = next((b for b in response.content if b.type == "tool_use"), None)
        if not tool_use:
            return 500, {"error": "Model did not return a structured turn."}

        data = tool_use.input
        reply = str(data.get("reply") or "").strip()
        return 200, {
            "reply": reply or "…",
            "user_argument_verdict": data.get("user_argument_verdict", "neutral"),
            "ai_reply_verdict": data.get("ai_reply_verdict", "neutral"),
        }
    except anthropic.AuthenticationError:
        return 500, {"error": "Invalid ANTHROPIC_API_KEY."}
    except anthropic.APIStatusError as e:
        return 500, {"error": f"Claude API error: {e.message}"}
    except Exception as e:
        return 500, {"error": f"Server error: {e}"}


SIMPLIFY_SYSTEM_PROMPT = (
    "Rewrite the given debate rebuttal in plain, simple English: short sentences, common "
    "everyday vocabulary, no idioms, no jargon. Keep the exact same argument, claims, and "
    "direct/pointed tone — you're simplifying the language, not the substance, and not "
    "softening it into something polite. Plain text, no markdown, no quotation marks, no "
    "preamble like \"Here's a simpler version\". Output only the rewritten rebuttal."
)


def simplify_reply(body):
    text = str(body.get("text", ""))[:2000].strip()

    if not text:
        return 400, {"error": "Empty text."}
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return 500, {"error": "ANTHROPIC_API_KEY is not set."}

    try:
        client = anthropic.Anthropic()
        response = client.messages.create(
            model="claude-opus-5",
            max_tokens=300,
            system=SIMPLIFY_SYSTEM_PROMPT,
            output_config={"effort": "low"},
            messages=[{"role": "user", "content": text}],
        )
        reply = "".join(b.text for b in response.content if b.type == "text").strip()
        return 200, {"reply": reply or text}
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
