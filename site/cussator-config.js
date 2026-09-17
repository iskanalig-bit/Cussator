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
  // TOKEN_BUDGET_PER_SIDE replaces the old per-tier maxTokensAllowed split
  // (rookie 500 / delegate+chair 300) with one flat pool for every tier —
  // "PER_SIDE" (not "PER_TIER" or "DEFAULT") reads as a single universal
  // budget, not a rookie-only cushion, so all three tiers below now
  // reference this same constant. Difficulty still differs by timer,
  // pasting, and Point of Order availability — just not by token budget
  // anymore. If the rookie-gets-more-tokens cushion was meant to survive
  // this change, that's a one-line revert (give DIFFICULTY_TIERS.rookie
  // its own maxTokensAllowed again instead of TOKEN_BUDGET_PER_SIDE).
  var TOKEN_BUDGET_PER_SIDE = 600; // was 300

  window.CUSSATOR_CONFIG = {
    // Both sides start here (see setHealth()/setAiHealth() in script.js) —
    // HP bars, the danger-tier thresholds (25%/50% of this, not the old
    // flat 25/50), and the post-round dashboard's HP chart Y-axis all
    // read off this instead of an assumed 0-100 scale.
    STARTING_HP: 250, // was 100

    TOKEN_BUDGET_PER_SIDE: TOKEN_BUDGET_PER_SIDE,

    HP_PENALTIES: {
      filler: 15, // "like", "basically", "kind of", "sort of", etc. — unchanged
      curse: 25,        // unchanged
      badArgument: 30,  // weak/unsupported claim, structural hedge — unchanged
      fallacy: 30, // Strawman, Ad Hominem, Slippery Slope, etc. — unchanged,
                   // same severity as badArgument (see api/_common.py's
                   // fallacy_type judging), tracked as its own constant so
                   // the two can diverge later without a code change.
                   // Left as absolute point values on purpose even though
                   // STARTING_HP tripled below — a filler hit costing 15 of
                   // 250 (6%) instead of 15 of 100 (15%) is the actual
                   // rebalance this config change is making, not an
                   // oversight: more room to make mistakes before losing,
                   // same per-word cost.
    },

    INTERRUPTION_THRESHOLD: {
      fillerCount: 2, // more than this many fillers in one turn triggers interruption
      fallacyTriggersInterruption: true, // any detected fallacy also interrupts
    },

    DIFFICULTY_TIERS: {
      rookie:   { timerSeconds: 90, maxTokensAllowed: TOKEN_BUDGET_PER_SIDE, pastingDisabled: false, allowPointOfOrder: false },
      delegate: { timerSeconds: 60, maxTokensAllowed: TOKEN_BUDGET_PER_SIDE, pastingDisabled: true,  allowPointOfOrder: true },
      chair:    { timerSeconds: 45, maxTokensAllowed: TOKEN_BUDGET_PER_SIDE, pastingDisabled: true,  allowPointOfOrder: true },
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
