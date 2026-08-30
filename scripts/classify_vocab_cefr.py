"""Regenerates the VOCAB_CEFR table in site/script.js.

One-off/offline tool, not part of the deployed app (the site is static
with no build step, so this is never run at request time). Run this again
whenever VOCAB_WORDS in site/script.js changes, then paste the printed
object literal back in over the existing VOCAB_CEFR block.

Dev-only dependencies (not part of requirements.txt, which is for the
deployed API): `pip install cefrpy wordfreq`

Method: cefrpy ships English Vocabulary Profile-derived CEFR levels per
word. It occasionally mis-tags a genuinely uncommon word as A1/A2 (e.g.
"untenable" -> A1, verified against wordfreq's own frequency data as
implausible) - this doesn't happen for truly basic words, and every word
in VOCAB_WORDS is deliberately advanced/academic vocabulary by
construction, so a real A1/A2 result there is always a data artifact, not
signal. Whenever cefrpy returns A1, A2, or nothing at all, this falls back
to a level derived from the word's own Zipf frequency (wordfreq),
calibrated so the fallback only ever lands B1-C2. Any word neither source
has data for at all defaults to B2.
"""

import json
import re
from pathlib import Path

from cefrpy import CEFRAnalyzer
from wordfreq import zipf_frequency

SCRIPT_JS = Path(__file__).resolve().parent.parent / "site" / "script.js"


def zipf_to_level(z):
    if z is None:
        return None
    if z >= 4.3:
        return "B1"
    if z >= 3.7:
        return "B2"
    if z >= 3.2:
        return "C1"
    return "C2"


def main():
    src = SCRIPT_JS.read_text(encoding="utf-8")
    match = re.search(r"var VOCAB_WORDS = \[(.*?)\];", src, re.S)
    words = re.findall(r"'([^']+)'", match.group(1))

    analyzer = CEFRAnalyzer()
    result = {}
    for word in words:
        level = analyzer.get_average_word_level_CEFR(word)
        name = level.name if level is not None else None
        if name in (None, "A1", "A2"):
            z = zipf_frequency(word, "en")
            name = zipf_to_level(z if z and z > 0 else None) or "B2"
        result[word] = name

    lines = ["  var VOCAB_CEFR = {"]
    row = "    "
    for i, word in enumerate(words):
        piece = "'%s': '%s'" % (word, result[word])
        piece += "," if i < len(words) - 1 else ""
        if len(row) + len(piece) + 1 > 96:
            lines.append(row.rstrip())
            row = "    "
        row += piece + " "
    if row.strip():
        lines.append(row.rstrip())
    lines.append("  };")

    print("\n".join(lines))


if __name__ == "__main__":
    main()
