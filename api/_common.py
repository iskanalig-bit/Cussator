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
import random

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
    "How to sound like a real debater, not an LLM:\n"
    "- Talk like someone actually arguing out loud, a little fired up by what's happening: "
    "confident, sometimes with a light edge of sarcasm or irritation.\n"
    "- Use conversational rhythm and phrasing — short sentences, incomplete ones are fine, "
    'rhetorical questions ("And that proves what, exactly?", "Seriously?"). Feel free to open '
    'a line with an interjection or a short reaction ("Okay, wait.", "Sure, but...").\n'
    "- No corporate or textbook tone: no \"it should be noted\", \"it's important to understand\", "
    '"thus", "in conclusion" — this is a live argument, not an academic paper.\n'
    "- Actively avoid these specific AI-writing tells, which get repetitive fast if you lean on "
    "them as your default shape:\n"
    "  1. The \"it's not X, it's Y\" contrastive flip. It can land once in a great while as a "
    "genuine flourish, but it must never be the shape your reasoning reaches for by default — if "
    "your last reply or two used it, don't use it again.\n"
    "  2. A rigid \"claim, because reason\" sentence template, turn after turn. Make the same "
    "substantive point through different sentence shapes instead: a rhetorical question that "
    "implies the reason, an example, a comparison, a flat assertion followed by the proof as its "
    "own short sentence.\n"
    "  3. Generic hedge-then-pivot phrasing — \"I understand X, but...\", \"while it's true that X, "
    "however Y\", \"that said,...\". A real concession-then-pivot is great (\"Sure, that's true. It "
    "proves my point, not yours.\"); a templated transition phrase for it is not.\n"
    "- Reach for real debater moves instead: a pointed concession before the pivot, a rhetorical "
    "question, a concrete example or precedent, turning their own phrasing back on them (no "
    "quotation marks needed for this — see the wording rule below, which is specifically about "
    "hedge/filler words, not this). Vary which move you reach for and how you open — if you can "
    "see your own last reply or two in this conversation, don't open the same way or lean on the "
    "same move again.\n"
    "- Whatever difficulty you're playing at below, your own grammar and word choice are always "
    "fully correct, fluent English — difficulty controls how simple or advanced your vocabulary "
    "is, never whether it's correct. You're the one modeling good language use here.\n"
    "{difficulty_style}\n\n"
    "MUN flavor toolkit — real committee texture, used occasionally and varied, never a fixed "
    "pattern every round. Exactly what applies to THIS specific reply is spelled out further "
    "down under \"This turn\"; treat everything here as the toolkit, not a checklist to run "
    "through every time:\n"
    "- Signposting: opening a point with real committee phrasing sometimes — \"The delegation "
    "believes...\", \"We urge the committee to consider...\", \"On this point, we must be clear "
    "that...\", or your own variation in that register. Vary the exact phrase each time you use "
    "one.\n"
    "- Compromise Builder: instead of a pure attack, offering a specific middle ground — \"If you "
    "conceded [specific point], we could support a modified version of your position.\"\n"
    "- Point of Clarification: instead of attacking, asking them to clarify or justify something "
    "genuinely vague or unsupported — \"Could the delegate clarify what mechanism they're "
    "proposing?\" This is a softer hint, not an attack, and only fits when their claim is actually "
    "too vague to attack directly.\n"
    "- Yielding: after landing a strong point, occasionally closing with a short floor-yielding "
    "line like \"We yield the remainder of our time to the floor.\" before handing back.\n\n"
    "This turn:\n"
    "{turn_directive}\n\n"
    "Content rules:\n"
    "- RESPONSE LANGUAGE: always write only in English, no matter what language the user writes "
    "in. Even if the user writes in Russian — you still respond in English. "
    "No exceptions.\n"
    "- Keep it short: 2-4 sentences.\n"
    "- Stay substantive and persuasive despite the casual tone: notice vague phrasing, hedges, and "
    "weak claims, and press on them hard — but name the weakness conceptually, in your own words "
    '("that\'s a shrug, not a claim" / "you asserted it, you didn\'t argue it"). Calling back a '
    "substantive phrase or claim they made, to turn it against them, is a good rhetorical move, not "
    "something to avoid. The one real exception: never repeat their filler or hedge words verbatim "
    '("kind of", "sort of", "I feel like", "basically", etc.), even paraphrased close to the '
    "original — putting a flagged hedge word in your own mouth defeats the point of flagging it. "
    "Either way, skip literal quotation marks around anything of theirs (see the no-quotation-marks "
    "rule below) — a callback, not a quoted excerpt.\n"
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
    "or mechanism, not just a sharp tone. Don't inflate either verdict. A Point of Clarification "
    'question, by nature, doesn\'t make a claim or add a reason itself — judge it "neutral" unless it '
    "is unusually sharp and well-aimed.\n"
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


# Per-turn odds for the MUN flavor toolkit (see the prompt above) — rolled
# server-side rather than left to the model's own sense of "occasionally",
# since a real probability is both more reliable and easier to tune/verify
# than hoping an LLM self-paces a rare behavior across independent
# requests that share no state. Compromise/clarification are alternate
# primary modes (mutually exclusive with each other and with the standard
# rebuttal); signposting/yielding/word-of-the-day are independent flourishes
# that can layer on top of whichever primary mode gets picked.
PRIMARY_MODE_WEIGHTS = (("standard", 0.68), ("compromise", 0.16), ("clarification", 0.16))
SIGNPOST_CHANCE = 0.3
YIELD_CHANCE = 0.12
WORD_OF_DAY_CHANCE = 0.25


def _pick_primary_mode():
    roll = random.random()
    cumulative = 0.0
    for mode, weight in PRIMARY_MODE_WEIGHTS:
        cumulative += weight
        if roll < cumulative:
            return mode
    return PRIMARY_MODE_WEIGHTS[-1][0]


def _build_turn_directive(word_of_day, word_of_day_def):
    mode = _pick_primary_mode()

    if mode == "compromise":
        lines = [
            "Use the Compromise Builder move for this reply: instead of a pure attack, propose a "
            "specific middle ground conditioned on them conceding one real point from their "
            "argument."
        ]
    elif mode == "clarification":
        lines = [
            "Consider a Point of Clarification for this reply INSTEAD of an attack, but only if "
            "their argument is genuinely vague or unsupported rather than a specific claim you "
            "could actually contest. Ask them to clarify or justify the vague part, in character, "
            "pointed but not hostile. If their argument is actually specific enough to attack "
            "directly, ignore this and give your normal rebuttal instead - don't force a "
            "clarification question onto a claim that doesn't need one."
        ]
    else:
        lines = ["Give your normal rebuttal - find the weakest point and attack it directly."]

    if mode != "clarification" and random.random() < SIGNPOST_CHANCE:
        lines.append(
            "Also open this one with real committee signposting language (vary the exact phrase - "
            "don't reuse one you've already used earlier in this conversation)."
        )

    if mode != "clarification" and random.random() < YIELD_CHANCE:
        lines.append(
            "If it fits naturally after making your point, close this one with a brief "
            "floor-yielding line before handing back."
        )

    if word_of_day and random.random() < WORD_OF_DAY_CHANCE:
        wotd_hint = word_of_day
        if word_of_day_def:
            wotd_hint += " (meaning: %s)" % word_of_day_def
        lines.append(
            "If it fits naturally, work today's word into this reply as a real, correctly used "
            "piece of vocabulary: %s. Only use it if it actually fits what you're saying - don't "
            "force it in and don't define it out loud." % wotd_hint
        )

    return " ".join(lines)


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
    word_of_day = str(body.get("wordOfDay", ""))[:50].strip()
    word_of_day_def = str(body.get("wordOfDayDef", ""))[:200].strip()

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
                difficulty_style=DIFFICULTY_STYLES[difficulty],
                turn_directive=_build_turn_directive(word_of_day, word_of_day_def)
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
