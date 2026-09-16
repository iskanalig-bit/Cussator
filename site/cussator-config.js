// cussator-config.js — SINGLE SOURCE OF TRUTH for game-balance constants.
// script.js reads every one of these off window.CUSSATOR_CONFIG instead of
// hardcoding a penalty, threshold, or per-difficulty value itself — see
// getDifficultyTier()/getTurnDurationSeconds()/getTokenPoolSize() and the
// FILLER_PENALTY/CURSE_PENALTY/BAD_ARGUMENT_PENALTY/FALLACY_PENALTY
// constants near the top of that file.
//
// Written as a plain classic script, not an ES module — this site has no
// build step and nothing else uses import/export (see index.html), so
// export/import here would only mean every consuming <script> tag also has
// to become type="module", changing execution order for no real benefit.
// Loaded before script.js in index.html so window.CUSSATOR_CONFIG is
// guaranteed to exist by the time script.js's own top-level code runs.
//
// The Python API can't import this file directly (different runtime, no
// shared build step) — api/_cussator_config.py mirrors the one value it
// actually needs (REBUTTAL_WORD_CAP) by hand. Keep the two in sync.
(function () {
  window.CUSSATOR_CONFIG = {
    HP_PENALTIES: {
      filler: 15, // "like", "basically", "kind of", "sort of", etc.
      curse: 25,
      badArgument: 30, // weak/unsupported claim, structural hedge
      fallacy: 30, // Strawman, Ad Hominem, Slippery Slope, etc. — same
                   // severity as badArgument (see api/_common.py's
                   // fallacy_type judging), tracked as its own constant so
                   // the two can diverge later without a code change.
    },

    INTERRUPTION_THRESHOLD: {
      fillerCount: 2, // more than this many fillers in one turn triggers interruption
      fallacyTriggersInterruption: true, // any detected fallacy also interrupts
    },

    DIFFICULTY_TIERS: {
      rookie:   { timerSeconds: 90, maxTokensAllowed: 500, pastingDisabled: false, allowPointOfOrder: false },
      delegate: { timerSeconds: 60, maxTokensAllowed: 300, pastingDisabled: true,  allowPointOfOrder: true },
      chair:    { timerSeconds: 45, maxTokensAllowed: 300, pastingDisabled: true,  allowPointOfOrder: true },
    },

    // The single-tier baseline every one of these words must detect at
    // HP_PENALTIES.filler severity. script.js's own FILLER_WORDS list is a
    // superset of this (it already contained all of these except
    // 'literally' and 'well', which were promoted out of its separate
    // lighter tier to match) — see the comment above FILLER_WORDS_LIGHT in
    // script.js for why that lighter tier still exists on top of this.
    FILLER_WORDS: [
      'like', 'basically', 'sort of', 'kind of', 'literally', 'uh', 'um', 'well',
    ],

    REBUTTAL_WORD_CAP: 60, // enforced server-side after generation, not just prompted
  };
})();
