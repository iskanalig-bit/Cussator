"""Python mirror of site/cussator-config.js — SINGLE SOURCE OF TRUTH for
game-balance constants that the Python API actually needs.

Only REBUTTAL_WORD_CAP lives here: HP penalties, difficulty pacing/token
budgets, filler words, and the interruption threshold are all purely
client-side concerns (script.js applies HP damage and renders the timer/
Word Economy pool; the API never touches any of that). There's no build
step in this project to let a single file be imported by both the static
site and these serverless functions, so this value is kept numerically
identical to site/cussator-config.js by hand — if you change one, change
the other.
"""

REBUTTAL_WORD_CAP = 60
