(function () {
  'use strict';

  var GOOD = 'oklch(0.75 0.13 150)';
  var WARN = 'oklch(0.74 0.15 55)';
  var REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Set by initDashboard() below once the post-round dashboard is wired up.
  // initArena() (and, in Feature 4, Elevator Pitch mode) call dashboardApi.open()
  // to hand off a round's collected data — declared up here, at the shared
  // top-level scope every init*() function runs in, since the two modules
  // are otherwise independent closures with no other way to reach each other.
  var dashboardApi = null;

  var tokens = [
    { t: 'I', s: 'n' }, { t: 'believe', s: 'n' }, { t: 'nuclear', s: 's' }, { t: 'power', s: 's' },
    { t: 'is', s: 'n' }, { t: 'kind', s: 'w' }, { t: 'of', s: 'w' }, { t: 'the', s: 'n' },
    { t: 'best', s: 'w' }, { t: 'option', s: 'n' }, { t: 'for', s: 'n' }, { t: 'decarbonizing', s: 's' },
    { t: 'the', s: 'n' }, { t: 'grid', s: 's' }, { t: 'by', s: 'n' }, { t: '2035.', s: 's' }
  ];

  var JUDGE_TARGETS = { logic: 78, precision: 52, delivery: 81 };

  function colorFor(tok) {
    return tok.s === 's' ? GOOD : tok.s === 'w' ? WARN : 'var(--color-text)';
  }

  function initDemo() {
    var speechEl = document.getElementById('cuss-speech');
    var aiCard = document.getElementById('cuss-ai-card');
    var judge = document.getElementById('cuss-judge');
    var timerEl = document.getElementById('cuss-timer');
    var barLogic = document.getElementById('cuss-bar-logic');
    var barPrecision = document.getElementById('cuss-bar-precision');
    var barDelivery = document.getElementById('cuss-bar-delivery');
    var valLogic = document.getElementById('cuss-val-logic');
    var valPrecision = document.getElementById('cuss-val-precision');
    var valDelivery = document.getElementById('cuss-val-delivery');
    if (!speechEl) return;

    var spans = tokens.map(function (tok) {
      var span = document.createElement('span');
      span.textContent = tok.t + ' ';
      span.style.color = 'transparent';
      span.style.fontWeight = tok.s === 'n' ? '400' : '600';
      if (tok.s === 'w') span.style.textDecoration = 'underline wavy ' + WARN;
      speechEl.appendChild(span);
      return span;
    });

    function setJudgeValues(logic, precision, delivery) {
      barLogic.style.width = logic + '%';
      barPrecision.style.width = precision + '%';
      barDelivery.style.width = delivery + '%';
      valLogic.textContent = logic;
      valPrecision.textContent = precision;
      valDelivery.textContent = delivery;
    }

    if (REDUCED_MOTION) {
      spans.forEach(function (span, i) { span.style.color = colorFor(tokens[i]); });
      aiCard.classList.add('is-visible');
      judge.classList.add('is-visible');
      setJudgeValues(JUDGE_TARGETS.logic, JUDGE_TARGETS.precision, JUDGE_TARGETS.delivery);
      timerEl.textContent = '00:42';
      return;
    }

    var timer = null;
    var seconds = 0;

    function formatTime(s) {
      var m = Math.floor(s / 60);
      var r = s % 60;
      return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
    }

    function tickTimer() {
      seconds++;
      timerEl.textContent = formatTime(seconds);
    }

    function startLoop() {
      spans.forEach(function (span) { span.style.color = 'transparent'; });
      aiCard.classList.remove('is-visible');
      judge.classList.remove('is-visible');
      setJudgeValues(0, 0, 0);
      seconds = 0;
      timerEl.textContent = '00:00';
      var tickInterval = setInterval(tickTimer, 1000);
      timer = { interval: tickInterval };
      revealTokens(0);
    }

    function revealTokens(i) {
      if (i >= tokens.length) {
        setTimeout(revealAi, 1000);
        return;
      }
      spans[i].style.color = colorFor(tokens[i]);
      setTimeout(function () { revealTokens(i + 1); }, 160);
    }

    function revealAi() {
      aiCard.classList.add('is-visible');
      setTimeout(revealJudge, 1900);
    }

    function revealJudge() {
      judge.classList.add('is-visible');
      setTimeout(function () { animateJudge(0); }, 300);
    }

    function animateJudge(step) {
      var n = 14;
      var p = Math.min(step, n) / n;
      setJudgeValues(
        Math.round(JUDGE_TARGETS.logic * p),
        Math.round(JUDGE_TARGETS.precision * p),
        Math.round(JUDGE_TARGETS.delivery * p)
      );
      if (step < n) {
        setTimeout(function () { animateJudge(step + 1); }, 40);
      } else {
        clearInterval(timer.interval);
        setTimeout(startLoop, 3400);
      }
    }

    startLoop();
  }

  // Leaves ' unescaped on purpose: its output only ever lands in element
  // innerHTML as text content (never inside a quoted attribute), where a
  // bare apostrophe is inert — and escaping it to &#39; used to break
  // matching for every filler entry that contains one ("y'all", "ain't",
  // "i don't know"), since the classifier regex runs on this escaped string.
  function escapeHtml(str) {
    return str.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Main filler/parasite tier — genuine hedges and verbal tics, -15 Credibility each.
  // Kept deliberately narrower than every "casual" word (see FILLER_WORDS_LIGHT
  // below) since -15 is a big chunk of a 100-point Credibility bar.
  var FILLER_WORDS = [
    'like', 'um', 'uh', 'umm', 'uhh', 'erm', 'hmm', 'kind of', 'kinda', 'sort of', 'sorta',
    'basically', 'i guess', 'i think', 'i mean', 'you know', 'maybe', 'probably',
    'possibly', 'somewhat', 'more or less', 'i feel like', "y'all", 'yall',
    'tryna', 'sum', 'you know what i mean', 'i would say', 'if that makes sense',
    'at the end of the day', 'pmo', 'finna', 'trna', 'dat', 'typa', 'ima', 'lwk',
    'to be honest', 'honestly speaking', 'or something', 'or whatever', 'whatever',
    'stuff like that', 'and stuff', 'and things', 'js', 'ts', 'and everything',
    'just saying', 'not gonna lie', 'lowkey', 'highkey', 'so yeah', 'anyway', 'anyways',
    'i dunno', "i don't know", 'dunno', 'okay so', 'like i said', 'as i said',
    'kind of like', 'sort of like', 'pretty much', 'whatnot', 'and whatnot', 'or anything',
    'i suppose', 'i would guess', 'technically speaking', 'in a way', 'in some way',
    'gonna', 'wanna', 'gotta', "ain't", 'tbh', 'idk', 'imo', 'like literally', 'super literally',
    // 'literally' and 'well' promoted from the light tier below to match
    // CUSSATOR_CONFIG.FILLER_WORDS (cussator-config.js), which lists both
    // at the single, full HP_PENALTIES.filler severity rather than a
    // lighter one — every other word already in that shared list ('like',
    // 'basically', 'sort of', 'kind of', 'uh', 'um') was already here.
    'literally', 'well'
  ];
  // Light filler tier — common but milder verbal habits, -5 Credibility each.
  // Not part of CUSSATOR_CONFIG.FILLER_WORDS, which has no "light" concept
  // at all — this is an app-specific refinement layered on top of the
  // shared config's baseline list, not a substitute for it.
  var FILLER_WORDS_LIGHT = ['actually', 'honestly', 'so'];

  // Stronger-alternative suggestions for the post-round recap, grouped by
  // the underlying weak-speech pattern rather than written one by one —
  // every FILLER_WORDS / FILLER_WORDS_LIGHT entry belongs to exactly one
  // group below, so every filler the player actually used has a suggestion.
  //
  // title/desc are the Vocabulary Scars card's flavor text (see
  // initVocabScars() below) — one fixed, hand-written pair per GROUP, not
  // per word or per instance, so "kind of" reads the exact same "Hedge
  // Merchant" card every time you open Scars, this round or ten rounds from
  // now. Deliberately not AI-generated, for the same reason the swap
  // suggestions above aren't: consistency across visits matters more here
  // than variety. desc uses %WORD% as a placeholder — renderScars() splits
  // on it to slot the actual offending word in as its own highlighted pill
  // rather than baking it into the string.
  var FILLER_ALTERNATIVE_GROUPS = [
    { words: ['kind of', 'kinda', 'sort of', 'sorta', 'kind of like', 'sort of like', 'somewhat',
        'more or less', 'pretty much', 'in a way', 'in some way', 'basically', 'whatever'],
      alternatives: ['specifically', 'precisely'],
      title: "The Hedge Merchant",
      desc: "You reached for %WORD% instead of naming the actual mechanism, leaving the claim vague enough to dodge scrutiny." },
    { words: ['i think', 'i guess', 'i feel like', 'i would say', 'i suppose', 'i would guess', 'imo'],
      alternatives: ['I would argue', 'the evidence suggests'],
      title: "The Unclaimed Opinion",
      desc: "%WORD% frames your claim as a feeling instead of a position, so the judge never has to take it seriously." },
    { words: ['maybe', 'probably', 'possibly'],
      alternatives: ['likely', 'the data indicates'],
      title: "The Coin Flip",
      desc: "%WORD% hedges the claim before you've even finished making it, handing your opponent the confidence you gave up." },
    { words: ['like', 'um', 'uh', 'umm', 'uhh', 'erm', 'hmm', 'so yeah', 'okay so', 'anyway',
        'anyways', 'well', 'so', 'i mean'],
      alternatives: ['(cut it, lead with the claim)', 'therefore'],
      title: "The Stall Tactic",
      desc: "%WORD% buys you a beat to think, but it costs you momentum the judge actually notices." },
    { words: ['or something', 'or whatever', 'and stuff', 'and things', 'stuff like that',
        'whatnot', 'and whatnot', 'or anything', 'and everything', 'just saying',
        'not gonna lie', 'sum'],
      alternatives: ['for example', 'specifically'],
      title: "The Trailing Off",
      desc: "%WORD% lets the point end wherever you ran out of examples, instead of ending on the strongest one." },
    { words: ['you know', 'you know what i mean', 'like i said', 'as i said'],
      alternatives: ['to be clear', 'specifically'],
      title: "The Borrowed Nod",
      desc: "%WORD% asks the room to already agree, instead of re-making the case that actually earns it." },
    { words: ['to be honest', 'honestly speaking', 'tbh', 'honestly'],
      alternatives: ['in fact', 'clearly'],
      title: "The Credibility Tax",
      desc: "%WORD% quietly implies your other sentences weren't honest, which is not the read you want a judge to walk away with." },
    { words: ['actually'],
      alternatives: ['in fact', 'notably'],
      title: "The Reflex Correction",
      desc: "%WORD% works when you're correcting something real; used as a reflex, it just softens the point that follows it." },
    { words: ['literally', 'like literally', 'super literally'],
      alternatives: ['precisely', '(cut it)'],
      title: "The Overstatement",
      desc: "%WORD% is usually covering for a claim that isn't literal at all, and the judge knows it." },
    { words: ['i dunno', "i don't know", 'dunno', 'idk'],
      alternatives: ["I'm not certain, but", 'further evidence would clarify'],
      title: "The Open Concession",
      desc: "%WORD% hands the point to your opponent before they even had to argue for it." },
    { words: ['tryna', 'finna', 'gonna', 'wanna', 'gotta', "ain't", "y'all", 'yall', 'pmo',
        'trna', 'dat', 'typa', 'ima', 'lwk', 'js', 'ts', 'lowkey', 'highkey'],
      alternatives: ['(use the formal phrasing)', 'trying to / going to'],
      title: "The Register Slip",
      desc: "%WORD% reads as casual speech dropped into a formal round, and it costs you Delivery even when the logic underneath is fine." },
    { words: ['at the end of the day', 'technically speaking'],
      alternatives: ['ultimately', 'in practice'],
      title: "The Long Way Around",
      desc: "%WORD% spends a whole clause getting to the point instead of just making it." },
    { words: ['if that makes sense'],
      alternatives: ['(cut it, trust your claim)', 'specifically'],
      title: "The Permission Check",
      desc: "%WORD% asks whether your own claim landed, planting the doubt yourself before anyone else has to." }
  ];
  var FILLER_ALTERNATIVES = {};
  var FILLER_BADGE_TITLES = {};
  var FILLER_DESCRIPTIONS = {};
  FILLER_ALTERNATIVE_GROUPS.forEach(function (group) {
    group.words.forEach(function (w) {
      FILLER_ALTERNATIVES[w] = group.alternatives;
      FILLER_BADGE_TITLES[w] = group.title;
      FILLER_DESCRIPTIONS[w] = group.desc;
    });
  });

  // Vocabulary Scars — a persistent, cross-round tally of the same
  // fillerWordsUsed data classifyText() already produces per argument (see
  // the post-round recap). No separate detection logic: every submitted
  // argument's filler hits get folded into this running total in
  // localStorage, so the Scars page is just a different view over numbers
  // that were already being computed.
  var VOCAB_SCARS_KEY = 'cussatorVocabScars';

  function loadVocabScars() {
    try {
      var raw = localStorage.getItem(VOCAB_SCARS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function recordFillerWords(words) {
    if (!words.length) return;
    try {
      var scars = loadVocabScars();
      words.forEach(function (w) { scars[w] = (scars[w] || 0) + 1; });
      localStorage.setItem(VOCAB_SCARS_KEY, JSON.stringify(scars));
    } catch (e) {
      // localStorage unavailable (private mode, quota, etc.) — the current
      // round's recap still works from in-memory state either way.
    }
  }

  // Bag — the positive mirror of Vocabulary Scars above: same pattern
  // (persistent word -> use-count tally in localStorage, no accounts),
  // just tracking the player's own successfully-used advanced vocabulary
  // instead of their repeated filler words. Also no separate detection
  // logic — every submitted argument's vocabWordsUsed (classifyText(),
  // same 'vocab' tier that already colors these words green live) gets
  // folded in here. Only ever called with the PLAYER's own analysis, never
  // the AI reply's — see the submit handler below.
  var BAG_KEY = 'cussatorBag';

  function loadBag() {
    try {
      var raw = localStorage.getItem(BAG_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function recordBagWords(words) {
    if (!words.length) return;
    try {
      var bag = loadBag();
      words.forEach(function (w) { bag[w] = (bag[w] || 0) + 1; });
      localStorage.setItem(BAG_KEY, JSON.stringify(bag));
    } catch (e) {
      // localStorage unavailable — this round's catches just won't persist.
    }
  }

  // Keeps the "Bag (N)" count fresh on both entry points (hero + nav) —
  // called once on load and again after every argument that might have
  // added a new word, so the number is never stale while sitting on the
  // homepage mid-round.
  function updateBagBadge() {
    var count = Object.keys(loadBag()).length;
    ['cuss-bag-nav-count', 'cuss-bag-hero-count'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = '(' + count + ')';
    });
    bagUpdateListeners.forEach(function (fn) { fn(); });
  }

  // Lets initArena()'s Bag shelf (a persistent hotbar inside the round view,
  // see renderBagShelf()) stay in sync with every existing Bag-crediting
  // call site above without threading a callback through each one — they
  // already all funnel through updateBagBadge() by design (see the comment
  // on creditBagWords() below), so hooking in there is the one choke point.
  var bagUpdateListeners = [];
  function onBagUpdate(fn) { bagUpdateListeners.push(fn); }

  // Definition/CEFR for Bag words the AI's contextual check (see
  // vocab_words_used on /api/respond) discovers OUTSIDE the curated
  // VOCAB_WORDS list — renderBag() already falls back to 'B2' for an
  // unknown CEFR and simply omits the definition line for an unknown word,
  // so this is additive: it only fills in what the static tables (VOCAB_CEFR,
  // WORD_OF_DAY_DEFS) don't already have, never overrides them. Persisted
  // separately from the word/count tally itself (BAG_KEY above) since it's
  // a different shape of data with a different lifetime concern - a word's
  // definition doesn't change if you land it three more times.
  var BAG_WORD_INFO_KEY = 'cussatorBagWordInfo';

  function loadBagWordInfo() {
    try {
      var raw = localStorage.getItem(BAG_WORD_INFO_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveBagWordInfo(word, info) {
    try {
      var all = loadBagWordInfo();
      all[word] = info;
      localStorage.setItem(BAG_WORD_INFO_KEY, JSON.stringify(all));
    } catch (e) {
      // localStorage unavailable — the word still gets collected via
      // recordBagWords, it just won't show a definition/real CEFR later.
    }
  }

  // Defensive floor under the AI's own Bag Evaluator judgment (see
  // DEBATE_SYSTEM_PROMPT's "hold a high bar" instruction in
  // api/_common.py) — a genuinely advanced word should never coincide
  // with a word already on the app's own filler/curse/connective lists,
  // so if the model ever slips and credits one anyway (a prompt-
  // adherence miss, not a layout bug), this keeps it out of the Bag and
  // off the Bag shelf entirely rather than shipping it to the player as
  // a "word ×N" chip. Checked here, at the one shared choke point every
  // Bag-crediting call site already funnels through, rather than at each
  // call site separately.
  function isKnownNonVocabWord(word) {
    var w = String(word || '').trim().toLowerCase();
    if (!w) return true;
    return FILLER_WORDS.indexOf(w) !== -1 || FILLER_WORDS_LIGHT.indexOf(w) !== -1
      || CURSE_WORDS.indexOf(w) !== -1 || CONNECTIVE_WORDS.indexOf(w) !== -1;
  }

  // Words credited to the Bag during the current round, in first-seen order.
  // Only feeds the guest sign-in card on the result screen (see
  // renderGuestBagPrompt()); cleared by resetRound(). Purely a display list —
  // it has no effect on scoring or on what gets saved to the Bag.
  var roundVocabWords = [];

  // Thin wrapper so every Bag-crediting call site also refreshes the badge,
  // instead of each one remembering to call updateBagBadge() separately.
  function creditBagWords(words) {
    if (!words || !words.length) return;
    var clean = words.filter(function (w) { return !isKnownNonVocabWord(w); });
    if (!clean.length) return;
    clean.forEach(function (w) {
      if (roundVocabWords.indexOf(w) === -1) roundVocabWords.push(w);
    });
    recordBagWords(clean);
    updateBagBadge();
  }

  // Authoritative path: the AI's own contextual read on the player's LATEST
  // argument (see the "Judging" section of DEBATE_SYSTEM_PROMPT in
  // api/_common.py) — a word only reaches here if it was both advanced
  // AND used correctly in context, unlike the plain exact-match list this
  // replaces as the primary source. Curated data always wins over the AI's
  // own guess: saveBagWordInfo() is only ever read as a fallback in
  // renderBag() when VOCAB_CEFR/WORD_OF_DAY_DEFS have nothing for that word.
  function creditBagWordsWithInfo(entries) {
    if (!Array.isArray(entries) || !entries.length) return;
    var words = [];
    entries.forEach(function (entry) {
      var word = String((entry && entry.word) || '').trim().toLowerCase();
      if (!word) return;
      words.push(word);
      var cefr = entry && ['B2', 'C1', 'C2'].indexOf(entry.cefr) !== -1 ? entry.cefr : undefined;
      var def = entry && typeof entry.definition === 'string' ? entry.definition.slice(0, 200) : undefined;
      if (cefr || def) saveBagWordInfo(word, { cefr: cefr, def: def });
    });
    creditBagWords(words);
  }

  // Connector Log — same pattern again as Bag/Scars above: a persistent
  // word -> use-count tally in localStorage, no accounts, no separate
  // detection logic. classifyText()'s existing 'connective' tier (the same
  // one that already colors these words blue live via .cuss-connective,
  // and already feeds the Logic score through roundStats.connective) now
  // also reports which specific words matched via connectiveWordsUsed —
  // this just folds that into a running total, exactly like
  // recordFillerWords/recordBagWords do for their own tiers. A positive
  // tracker like Bag, not corrective like Scars, so there's no
  // alternatives lookup here.
  var CONNECTOR_LOG_KEY = 'cussatorConnectorLog';

  function loadConnectorLog() {
    try {
      var raw = localStorage.getItem(CONNECTOR_LOG_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function recordConnectiveWords(words) {
    if (!words.length) return;
    try {
      var log = loadConnectorLog();
      words.forEach(function (w) { log[w] = (log[w] || 0) + 1; });
      localStorage.setItem(CONNECTOR_LOG_KEY, JSON.stringify(log));
    } catch (e) {
      // localStorage unavailable — this round's tally just won't persist.
    }
  }

  // Per-round total filler-word count, oldest first — a second, smaller
  // localStorage log alongside the Scars word tally above. This is what
  // powers both the round-end "vs your last 3 rounds" trend and the
  // homepage's real per-player improvement stat, so a round's total only
  // needs summing once (see endRound()) rather than re-deriving it from
  // the word tally, which doesn't preserve per-round boundaries.
  var ROUND_HISTORY_KEY = 'cussatorRoundFillerHistory';
  var ROUND_HISTORY_MAX = 50;

  function loadRoundHistory() {
    try {
      var raw = localStorage.getItem(ROUND_HISTORY_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function recordRoundFillerCount(count) {
    try {
      var history = loadRoundHistory();
      history.push(count);
      if (history.length > ROUND_HISTORY_MAX) history = history.slice(history.length - ROUND_HISTORY_MAX);
      localStorage.setItem(ROUND_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      // localStorage unavailable — this round just won't contribute to the
      // trend or the homepage stat; nothing else depends on it.
    }
  }

  // Optional Google sign-in (Supabase Auth) + cloud sync of the five
  // localStorage stores above. Guests are unaffected: if the supabase-js CDN
  // script or the config didn't load (or has no url/key yet), initAuth()
  // bails out and the sign-in button stays hidden. Only the public anon key
  // is ever used here; row level security on user_progress is what limits a
  // user to their own row.
  var sbClient = null;
  var sbUser = null;

  function readLocalProgress() {
    return {
      bag: loadBag(),
      scars: loadVocabScars(),
      connector_log: loadConnectorLog(),
      bag_word_info: loadBagWordInfo(),
      round_history: loadRoundHistory()
    };
  }

  function writeLocalProgress(p) {
    try {
      localStorage.setItem(BAG_KEY, JSON.stringify(p.bag));
      localStorage.setItem(VOCAB_SCARS_KEY, JSON.stringify(p.scars));
      localStorage.setItem(CONNECTOR_LOG_KEY, JSON.stringify(p.connector_log));
      localStorage.setItem(BAG_WORD_INFO_KEY, JSON.stringify(p.bag_word_info));
      localStorage.setItem(ROUND_HISTORY_KEY, JSON.stringify(p.round_history));
    } catch (e) {
      // localStorage unavailable — the cloud copy is still saved below.
    }
  }

  function clearLocalProgress() {
    try {
      [BAG_KEY, VOCAB_SCARS_KEY, CONNECTOR_LOG_KEY, BAG_WORD_INFO_KEY, ROUND_HISTORY_KEY]
        .forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) { /* nothing to clear */ }
  }

  function asObject(v) {
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  }

  // Union of words, higher count wins.
  function mergeCounts(a, b) {
    a = asObject(a); b = asObject(b);
    var out = {};
    [a, b].forEach(function (src) {
      Object.keys(src).forEach(function (w) {
        var n = Number(src[w]);
        if (!isFinite(n)) return;
        out[w] = Math.max(out[w] || 0, n);
      });
    });
    return out;
  }

  // Union of words; on a clash the local entry wins.
  function mergeWordInfo(remote, local) {
    return Object.assign({}, asObject(remote), asObject(local));
  }

  // Round history is an ordered list of per-round totals with no ids, so it
  // can't be unioned exactly. Identical -> keep; one is the tail of the
  // other -> keep the longer; otherwise treat them as two devices' rounds and
  // concatenate (cloud first), capped at ROUND_HISTORY_MAX.
  function mergeHistory(remote, local) {
    var r = Array.isArray(remote) ? remote.filter(isFinite) : [];
    var l = Array.isArray(local) ? local : [];
    var long = r.length >= l.length ? r : l;
    var short = long === r ? l : r;
    var tail = long.slice(long.length - short.length);
    var merged = JSON.stringify(tail) === JSON.stringify(short) ? long : r.concat(l);
    return merged.length > ROUND_HISTORY_MAX ? merged.slice(merged.length - ROUND_HISTORY_MAX) : merged;
  }

  function pushProgress(p) {
    if (!sbClient || !sbUser) return Promise.resolve();
    return sbClient.from('user_progress').upsert({
      user_id: sbUser.id,
      bag: p.bag,
      scars: p.scars,
      connector_log: p.connector_log,
      bag_word_info: p.bag_word_info,
      round_history: p.round_history,
      updated_at: new Date().toISOString()
    }).then(function (res) {
      if (res && res.error) console.warn('Cussator: progress sync failed', res.error.message);
    }, function (err) {
      console.warn('Cussator: progress sync failed', err);
    });
  }

  // Plain push of local state (no pull). Used where merging first isn't wanted:
  // the sign-out flush and the console test hook.
  function syncProgress() {
    if (!sbClient || !sbUser) return Promise.resolve();
    return pushProgress(readLocalProgress());
  }

  // Set by initArena() once it exists; true from the moment a side is picked
  // until the round ends. Pulls never touch local data or the UI in between.
  var arenaRoundActive = function () { return false; };

  var PULL_MIN_INTERVAL_MS = 30000; // focus-triggered pulls: at most once per 30s
  var pullInFlight = false;
  var pendingPull = false;
  var lastPullAt = 0;

  // Key-order-insensitive: Postgres jsonb doesn't preserve object key order.
  function deepEqual(a, b) {
    if (a === b) return true;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    var ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every(function (k) { return deepEqual(a[k], b[k]); });
  }

  // The one place progress is pulled from Supabase: read the row, merge with
  // local (same merge as sign-in), save locally, and push back only if the
  // merged result differs from what the cloud already had. reason is one of
  // 'login' (session found / signed in), 'focus', 'round-end'. No-op for guests.
  function pullAndMerge(reason) {
    if (!sbClient || !sbUser) return Promise.resolve();
    if (arenaRoundActive()) { pendingPull = true; return Promise.resolve(); }
    if (pullInFlight) return Promise.resolve();
    if (reason === 'focus' && !pendingPull && Date.now() - lastPullAt < PULL_MIN_INTERVAL_MS) {
      return Promise.resolve();
    }
    pullInFlight = true;
    pendingPull = false;
    lastPullAt = Date.now();
    var user = sbUser;
    return sbClient.from('user_progress').select('*').eq('user_id', user.id).maybeSingle()
      .then(function (res) {
        if (res.error) throw res.error;
        // Signed out, switched user, or a round started while we waited:
        // drop the result rather than writing/re-rendering under them.
        if (!sbUser || sbUser.id !== user.id) return;
        if (arenaRoundActive()) { pendingPull = true; return; }
        var row = res.data || {};
        var remote = {
          bag: asObject(row.bag),
          scars: asObject(row.scars),
          connector_log: asObject(row.connector_log),
          bag_word_info: asObject(row.bag_word_info),
          round_history: Array.isArray(row.round_history) ? row.round_history : []
        };
        var local = readLocalProgress();
        var merged = {
          bag: mergeCounts(remote.bag, local.bag),
          scars: mergeCounts(remote.scars, local.scars),
          connector_log: mergeCounts(remote.connector_log, local.connector_log),
          bag_word_info: mergeWordInfo(remote.bag_word_info, local.bag_word_info),
          round_history: mergeHistory(remote.round_history, local.round_history)
        };
        if (!deepEqual(merged, local)) {
          writeLocalProgress(merged);
          updateBagBadge();
          initHomepageStat();
        }
        if (!res.data || !deepEqual(merged, remote)) return pushProgress(merged);
      })
      .catch(function (err) {
        console.warn('Cussator: could not load saved progress', err && err.message ? err.message : err);
        // A finished round's data must still reach the cloud if the pull failed.
        if (reason === 'round-end') return pushProgress(readLocalProgress());
      })
      .then(function () { pullInFlight = false; });
  }

  // Guest sign-in UI (initSignInUI() below) — module-level so initBag() and the
  // round-result code can reach it. Set by initAuth()/initSignInUI().
  var startGoogleSignIn = function () {};
  var signInDialogApi = null;

  function isGuestWithSignIn() {
    var c = document.body.classList;
    return c.contains('auth-enabled') && !c.contains('signed-in');
  }

  // ---- Nicknames (public.profiles) -----------------------------------------
  // Fail-safe by design: if the profiles table can't be read or written for any
  // reason, nothing is shown or blocked — the nav chip just says "Player" and
  // the user keeps playing. Independent of the progress-sync code above.
  var sbProfile = { loaded: false, nickname: null, exists: false };
  var nicknameApi = null;              // set by initNicknameUI()
  var refreshUserChip = function () {}; // set by initAuth()

  var NICK_RESERVED = ['admin', 'cussator', 'chair', 'judge']; // mirrored by a DB check
  // Basic filter only (the database can't enforce this one): strong roots are
  // matched anywhere in the name; short words only as whole "_"-separated parts
  // so ordinary names ("class", "Dickens") aren't caught.
  var NICK_BLOCKED_ROOTS = ['fuck', 'shit', 'bitch', 'cunt', 'whore', 'slut', 'nigg', 'fagg', 'retard', 'rapist', 'nazi', 'hitler', 'pussy', 'asshole', 'bastard'];
  var NICK_BLOCKED_WORDS = ['ass', 'dick', 'cock', 'cum', 'tits', 'fag', 'rape', 'sex', 'porn'];

  function validateNickname(name) {
    if (!name) return { ok: false, silent: true };
    if (!/^[A-Za-z0-9_]+$/.test(name)) return { ok: false, msg: 'Use letters, numbers and underscores only.' };
    if (name.length < 3) return { ok: false, msg: 'At least 3 characters.' };
    var lower = name.toLowerCase();
    if (NICK_RESERVED.indexOf(lower) !== -1) return { ok: false, msg: 'That name is reserved.' };
    var leet = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't' };
    var plain = lower.replace(/[013457]/g, function (c) { return leet[c]; });
    var squashed = plain.replace(/_/g, '');
    var parts = plain.split('_');
    var bad = NICK_BLOCKED_ROOTS.some(function (r) { return squashed.indexOf(r) !== -1; }) ||
      NICK_BLOCKED_WORDS.some(function (w) { return parts.indexOf(w) !== -1; });
    if (bad) return { ok: false, msg: 'Please choose a different name.' };
    return { ok: true };
  }

  function loadProfile(user) {
    sbProfile = { loaded: false, nickname: null, exists: false };
    var settled = false;
    function settle(nickname, exists, promptable) {
      if (settled) return;
      settled = true;
      if (!sbUser || sbUser.id !== user.id) return; // signed out / switched user meanwhile
      sbProfile = { loaded: true, nickname: nickname, exists: exists };
      refreshUserChip();
      if (promptable && !exists) maybePromptNickname();
    }
    // If the request hangs, still resolve the chip to "Player".
    setTimeout(function () { settle(null, false, false); }, 4000);
    try {
      sbClient.from('profiles').select('nickname').eq('user_id', user.id).maybeSingle()
        .then(function (res) {
          if (res.error) settle(null, false, false); // e.g. table missing: no dialog, just "Player"
          else settle(res.data ? res.data.nickname : null, !!res.data, true);
        }, function () { settle(null, false, false); });
    } catch (e) { settle(null, false, false); }
  }

  var NICK_PROMPT_KEY = 'cussatorNickPrompted';
  var nickPromptedInMemory = false;

  // Auto-open for a signed-in user with no profile — once per browser session,
  // so skipping it doesn't nag, but it returns at the next sign-in/session.
  function maybePromptNickname() {
    if (!nicknameApi || nickPromptedInMemory) return;
    try {
      if (sessionStorage.getItem(NICK_PROMPT_KEY)) return;
      sessionStorage.setItem(NICK_PROMPT_KEY, '1');
    } catch (e) { /* storage blocked — the in-memory flag still limits it to once per page load */ }
    nickPromptedInMemory = true;
    nicknameApi.open();
  }

  function initNicknameUI() {
    var dialog = document.getElementById('cuss-nick-dialog');
    var trigger = document.getElementById('cuss-user-trigger');
    var menu = document.getElementById('cuss-user-menu');
    var changeBtn = document.getElementById('cuss-nick-change-btn');
    var signOutItem = document.getElementById('cuss-signout-btn');
    var chip = document.getElementById('cuss-user-chip');
    if (!dialog || !trigger || !menu || !changeBtn || !chip) return;
    var titleEl = document.getElementById('cuss-nick-title');
    var input = document.getElementById('cuss-nick-input');
    var statusEl = document.getElementById('cuss-nick-status');
    var saveBtn = document.getElementById('cuss-nick-save');
    var closeBtn = document.getElementById('cuss-nick-close');

    // ---- user menu ----
    function setMenu(open) {
      menu.hidden = !open;
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    trigger.addEventListener('click', function () { setMenu(menu.hidden); });
    document.addEventListener('click', function (e) { if (!menu.hidden && !chip.contains(e.target)) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { setMenu(false); trigger.focus(); }
    });
    if (signOutItem) signOutItem.addEventListener('click', function () { setMenu(false); });
    changeBtn.addEventListener('click', function () { setMenu(false); open(); });

    // ---- dialog ----
    var lastFocus = null, prevOverflow = '', checkTimer = null, checkToken = 0;
    var canSave = false;

    function isOpen() { return dialog.classList.contains('is-open'); }

    function setStatus(text, kind) {
      statusEl.textContent = text || '';
      statusEl.className = 'cuss-nick-status' + (kind ? ' is-' + kind : '');
    }
    function setCanSave(v) { canSave = v; saveBtn.disabled = !v; }

    function open() {
      if (isOpen() || !sbUser) return;
      lastFocus = document.activeElement;
      prevOverflow = document.body.style.overflow;
      titleEl.textContent = sbProfile.exists ? 'Change your nickname' : 'Choose your nickname';
      input.value = sbProfile.nickname || '';
      setStatus('', '');
      setCanSave(false);
      dialog.classList.add('is-open');
      dialog.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      input.focus();
      input.select();
    }

    function close() {
      if (!isOpen()) return;
      clearTimeout(checkTimer);
      checkToken++;
      dialog.classList.remove('is-open');
      dialog.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = prevOverflow;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    nicknameApi = { open: open, close: close };

    function onInput() {
      clearTimeout(checkTimer);
      var token = ++checkToken;
      var name = input.value.trim();
      var v = validateNickname(name);
      setCanSave(false);
      if (!v.ok) { setStatus(v.silent ? '' : v.msg, v.silent ? '' : 'bad'); return; }
      if (sbProfile.nickname && name === sbProfile.nickname) { setStatus('This is already your nickname.', ''); return; }
      setStatus('Checking…', '');
      checkTimer = setTimeout(function () {
        // "_" is a single-character wildcard in ILIKE, so escape it for an exact
        // case-insensitive match. Any failure here is silent: leave Save enabled
        // and let the database's unique index have the final say.
        var pattern = name.replace(/_/g, '\\_');
        var done = function (taken) {
          if (token !== checkToken || !isOpen()) return;
          if (taken) { setStatus('That name is taken.', 'bad'); setCanSave(false); }
          else { setStatus(taken === false ? 'Available' : '', taken === false ? 'ok' : ''); setCanSave(true); }
        };
        try {
          sbClient.from('profiles').select('user_id').ilike('nickname', pattern).limit(1)
            .then(function (res) {
              if (res.error || !res.data) return done(null);
              var others = res.data.filter(function (r) { return sbUser && r.user_id !== sbUser.id; });
              done(others.length > 0);
            }, function () { done(null); });
        } catch (e) { done(null); }
      }, 350);
    }
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && canSave) { e.preventDefault(); save(); } });

    function save() {
      var name = input.value.trim();
      if (!canSave || !sbUser || !validateNickname(name).ok) return;
      setCanSave(false);
      var user = sbUser;
      var req = sbProfile.exists
        ? sbClient.from('profiles').update({ nickname: name }).eq('user_id', user.id)
        : sbClient.from('profiles').insert({ user_id: user.id, nickname: name });
      var failQuietly = function () { close(); }; // any other failure: no error UI, chip stays as it was
      try {
        req.then(function (res) {
          if (res.error) {
            if (res.error.code === '23505') { // someone took it a moment ago
              setStatus('That name was just taken.', 'bad');
              return;
            }
            return failQuietly();
          }
          if (sbUser && sbUser.id === user.id) {
            sbProfile = { loaded: true, nickname: name, exists: true };
            refreshUserChip();
          }
          close();
        }, failQuietly);
      } catch (e) { failQuietly(); }
    }
    saveBtn.addEventListener('click', save);

    if (closeBtn) closeBtn.addEventListener('click', close);
    dialog.addEventListener('click', function (e) { if (e.target === dialog) close(); });
    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var focusable = Array.prototype.filter.call(dialog.querySelectorAll('button, input'), function (el) { return !el.disabled; });
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  function initAuth() {
    var cfg = window.CUSSATOR_SUPABASE || {};
    var signInBtn = document.getElementById('cuss-signin-btn');
    var chip = document.getElementById('cuss-user-chip');
    if (!signInBtn || !chip) return;
    if (!window.supabase || !window.supabase.createClient || !cfg.url || !cfg.anonKey) return;

    try {
      sbClient = window.supabase.createClient(cfg.url, cfg.anonKey);
    } catch (e) {
      sbClient = null;
      return;
    }

    // TEMPORARY test hook: run cussatorSyncNow() in the browser console to
    // push local progress to Supabase immediately and log what came back.
    // Remove once sign-in sync is verified.
    window.cussatorSyncNow = function () {
      if (!sbUser) {
        console.warn('[cussatorSyncNow] not signed in — nothing to sync');
        return Promise.resolve(null);
      }
      var p = readLocalProgress();
      console.log('[cussatorSyncNow] pushing for', sbUser.id, p);
      return sbClient.from('user_progress').upsert({
        user_id: sbUser.id,
        bag: p.bag,
        scars: p.scars,
        connector_log: p.connector_log,
        bag_word_info: p.bag_word_info,
        round_history: p.round_history,
        updated_at: new Date().toISOString()
      }).select().then(function (res) {
        if (res.error) console.error('[cussatorSyncNow] FAILED', res.error);
        else console.log('[cussatorSyncNow] OK — row now in Supabase:', res.data && res.data[0]);
        return res;
      });
    };

    var avatarEl = document.getElementById('cuss-user-avatar');
    var nameEl = document.getElementById('cuss-user-name');
    var signOutBtn = document.getElementById('cuss-signout-btn');
    var changeNickBtn = document.getElementById('cuss-nick-change-btn');

    signInBtn.hidden = false;

    function renderUser(user) {
      // Drives the guest-only UI (lock icons, landing note, sign-in card) in
      // CSS/JS; auth-enabled only appears once the first auth state is known.
      document.body.classList.add('auth-enabled');
      document.body.classList.toggle('signed-in', !!user);
      var meta = (user && user.user_metadata) || {};
      var googleLabel = meta.full_name || meta.name || (user && user.email) || '';
      signInBtn.hidden = !!user;
      chip.hidden = !user;
      if (!user) return;
      // The chip shows the public nickname, never the Google name: "Player"
      // until one is set (blank only while the profile is still loading).
      var label = sbProfile.loaded ? (sbProfile.nickname || 'Player') : '';
      nameEl.textContent = label;
      nameEl.title = label;
      if (changeNickBtn) changeNickBtn.textContent = sbProfile.nickname ? 'Change nickname' : 'Set nickname';
      if (meta.avatar_url) {
        avatarEl.style.backgroundImage = 'url("' + String(meta.avatar_url).replace(/["\\\n\r]/g, '') + '")';
        avatarEl.textContent = '';
      } else {
        avatarEl.style.backgroundImage = '';
        avatarEl.textContent = ((label || googleLabel).charAt(0) || '?').toUpperCase();
      }
    }
    refreshUserChip = function () { if (sbUser) renderUser(sbUser); };

    startGoogleSignIn = function () {
      // origin (not a hardcoded URL) so the same build works on cussator.com
      // and cussator.vercel.app; both must be in Supabase's Redirect URLs.
      sbClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname }
      });
    };

    // The nav button opens the sign-in dialog (whose Google button calls
    // startGoogleSignIn()); without the dialog it goes straight to Google.
    signInBtn.addEventListener('click', function () {
      if (signInDialogApi) signInDialogApi.open();
      else startGoogleSignIn();
    });

    signOutBtn.addEventListener('click', function () {
      // Push the latest local state first so clearing it below can't lose anything.
      signOutBtn.disabled = true;
      syncProgress().then(function () { return sbClient.auth.signOut(); })
        .then(function () { signOutBtn.disabled = false; });
    });

    // Pick up progress saved from another device/domain when the tab comes
    // back into view (throttled inside pullAndMerge).
    function onWake() {
      if (document.visibilityState === 'hidden') return;
      pullAndMerge('focus');
    }
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);

    sbClient.auth.onAuthStateChange(function (event, session) {
      var user = session && session.user ? session.user : null;
      if (user) {
        renderUser(user);
        // Supabase also fires SIGNED_IN on tab refocus — only merge for a new user.
        if (!sbUser || sbUser.id !== user.id) {
          sbUser = user;
          // Deferred: supabase-js docs advise against awaiting other supabase
          // calls inside this callback.
          setTimeout(function () { pullAndMerge('login'); }, 0);
          setTimeout(function () { loadProfile(user); }, 0);
        } else {
          sbUser = user;
        }
      } else if (event === 'SIGNED_OUT') {
        var wasSignedIn = !!sbUser;
        sbUser = null;
        sbProfile = { loaded: false, nickname: null, exists: false };
        if (nicknameApi) nicknameApi.close();
        renderUser(null);
        if (wasSignedIn) {
          clearLocalProgress();
          updateBagBadge();
          initHomepageStat();
        }
      } else {
        renderUser(null);
      }
    });
  }

  // Curse / profanity — general-purpose swearing only, no slurs. -25 Credibility each.
  var CURSE_WORDS = [
    'damn', 'hell', 'crap', 'ass', 'asshole', 'bastard', 'bitch', 'bullshit', 'shit',
    'shitty', 'fuck', 'fucking', 'fucked', 'motherfucker', 'piss', 'pissed off',
    'dick', 'dickhead', 'prick', 'douchebag', 'jackass', 'goddamn',
    'pussy', 'bih', 'shi', 'screwed', 'freaking', 'frigging', 'bloody', 'wtf', 'af',
    'stfu', 'gtfo', 'sybau', 'hellhole', 'damned', 'cursed', 'jerk', 'moron', 'idiot',
    'stupid', 'dumbass', 'screw this', 'screw that', 'crappy', 'sucks'
  ];
  // Connective / logic words — small heal, +5 Credibility each, tagged blue.
  var CONNECTIVE_WORDS = [
    'because', 'therefore', 'however', 'thus', 'hence', 'consequently', 'furthermore',
    'moreover', 'nevertheless', 'nonetheless', 'although', 'though', 'whereas',
    'while', 'given that', 'in contrast', 'on the other hand', 'as a result',
    'for instance', 'for example', 'that said', 'in other words', 'provided that',
    'unless', 'due to', 'owing to', 'accordingly', 'subsequently', 'meanwhile',
    'similarly', 'likewise', 'conversely', 'specifically', 'ultimately',
    // 'arguably' and 'notwithstanding' are deliberately left out here — both
    // are already in VOCAB_WORDS, and classifying them in two tiers at once
    // would double-count the same word.
    'in fact', 'indeed', 'notably', 'importantly', 'crucially', 'evidently', 'clearly',
    'undoubtedly', 'undeniably', 'presumably', 'essentially', 'fundamentally', 'primarily',
    'principally', 'chiefly', 'mainly', 'largely', 'particularly', 'especially',
    'in particular', 'above all', 'first and foremost', 'to begin with', 'to start with',
    'finally', 'lastly', 'in conclusion', 'to conclude', 'in summary', 'to summarize',
    'overall', 'on balance', 'all things considered', 'taking everything into account',
    'as a consequence', 'in light of', 'in view of', 'with regard to', 'with respect to',
    'regarding', 'concerning', 'as for', 'when it comes to', 'in terms of', 'insofar as',
    'to the extent that', 'assuming that', 'on condition that', 'provided', 'providing',
    'so long as', 'as long as', 'in case', 'in the event that', 'even if', 'even though',
    'despite', 'in spite of', 'regardless of', 'by contrast', 'alternatively', 'instead',
    'rather than', 'as opposed to', 'in comparison', 'comparatively', 'correspondingly',
    'equally', 'by the same token', 'in the same way', 'additionally', 'in addition',
    'also', 'besides', "what's more", 'on top of that', 'thereafter', 'henceforth',
    'from then on', 'in the meantime', 'simultaneously', 'at the same time', 'eventually',
    'gradually', 'immediately', 'thereby', 'whereby', 'so that', 'in order that',
    'so as to', 'to that end', 'with that in mind', 'needless to say', 'it follows that',
    'it stands to reason', 'this implies', 'this suggests', 'this indicates',
    'this demonstrates', 'this proves', 'this shows'
  ];
  // Curated advanced-vocabulary list as a stand-in for a real CEFR classifier —
  // flags B2/C1/C2-level lexis with the "vocab" tag, +10 Credibility each. Grouped by
  // debate topic for maintainability. Matched with light suffix tolerance
  // (see classifyText) so "exacerbate" also catches "exacerbates",
  // "exacerbated", etc. without listing every inflection.
  var VOCAB_WORDS = [
    // general academic / argumentative
    'ubiquitous', 'paradigm', 'notwithstanding', 'ostensible', 'ostensibly', 'pertinent',
    'corroborate', 'juxtapose', 'ameliorate', 'delineate', 'exacerbate', 'nuanced', 'underscore',
    'conducive', 'inherent', 'meticulous', 'pragmatic', 'pragmatism', 'substantiate', 'circumvent',
    'elucidate', 'mitigate', 'mitigating', 'prevalent', 'prevalence', 'discern', 'discernible',
    'cogent', 'cogency', 'unequivocally', 'arguably', 'invariably', 'hitherto', 'albeit',
    'quintessential', 'multifaceted', 'unprecedented', 'discrepancy', 'discrepancies',
    'ramification', 'ramifications', 'tantamount', 'plausible', 'plausibility', 'comprehensive',
    'holistic', 'holistically', 'empirical', 'empirically', 'detrimental', 'viable', 'viability',
    'feasible', 'feasibility', 'robust', 'robustness', 'catalyst', 'coherent', 'coherence',
    'credible', 'credibility', 'legitimate', 'legitimacy', 'resilient', 'resilience', 'untenable',
    'dubious', 'contentious', 'controversial', 'polarizing', 'polarized', 'divisive', 'provocative',
    'staunch', 'vehement', 'adamant', 'resolute', 'unwavering', 'uncompromising', 'redundant',
    'superfluous', 'extraneous', 'gratuitous', 'arbitrary', 'capricious', 'inevitable',
    'imperative', 'paramount', 'indispensable', 'obsolete', 'antiquated', 'anachronistic',
    'archaic', 'unorthodox', 'unconventional', 'groundbreaking', 'transformative', 'formidable',
    'insurmountable', 'tenuous', 'spurious', 'disproportionate', 'asymmetric', 'asymmetrical',
    'ingrained', 'endemic', 'pervasive', 'rampant', 'widespread', 'chronic', 'transient',
    'ephemeral', 'fleeting', 'enduring', 'myopic', 'shortsighted', 'prudent', 'imprudent',
    'judicious', 'circumspect', 'reckless', 'negligent', 'negligence', 'exonerate', 'vindicate',
    'vilify', 'demonize', 'scapegoat', 'complacent', 'complacency', 'apathy', 'apathetic',
    'ambivalent', 'ambivalence', 'equivocal', 'unequivocal', 'ambiguous', 'ambiguity',
    'categorical', 'definitive', 'conclusive', 'tentative', 'provisional', 'contingent',
    // politics / international relations
    'multilateral', 'unilateral', 'bilateral', 'bipartisan', 'nonpartisan', 'sovereignty',
    'sovereign', 'geopolitical', 'autocracy', 'autocratic', 'authoritarian', 'totalitarian',
    'oligarchy', 'oligarchic', 'plutocracy', 'hegemony', 'hegemonic', 'diplomacy', 'diplomatic',
    'insurgency', 'insurgent', 'dissent', 'dissident', 'coalition', 'referendum', 'secession',
    'annexation', 'annex', 'sanctions', 'appeasement', 'propaganda', 'censorship', 'egalitarian',
    'disenfranchised', 'disenfranchise', 'enfranchise', 'constituency', 'jurisdiction',
    'statecraft', 'isolationism', 'protectionism', 'globalization', 'deregulation', 'nationalism',
    'populism', 'partisan', 'incumbent', 'electorate', 'insurrection', 'embargo', 'ratify',
    'repeal', 'mandate', 'autonomy', 'federalism', 'centralized', 'decentralized', 'statesmanship',
    'subversive', 'subversion', 'coercive', 'coercion', 'repression', 'repressive', 'factionalism',
    'demagogue', 'demagoguery', 'xenophobia', 'xenophobic', 'jingoism', 'realpolitik',
    // economics
    'inequitable', 'inequity', 'disparity', 'stagnation', 'stagnant', 'recession', 'recessionary',
    'inflationary', 'deflationary', 'subsidize', 'subsidy', 'deficit', 'surplus', 'austerity',
    'fiscal', 'monetary', 'commodify', 'commodification', 'privatization', 'privatize',
    'nationalize', 'deregulate', 'monopoly', 'monopolistic', 'oligopoly', 'cartel', 'arbitrage',
    'speculative', 'speculation', 'volatility', 'volatile', 'liquidity', 'illiquid', 'insolvency',
    'insolvent', 'bankruptcy', 'creditworthy', 'collateral', 'discretionary', 'redistribution',
    'redistributive', 'entrenched', 'exploitative', 'exploitation', 'precarious', 'precarity',
    'incentivize', 'disincentivize', 'externality', 'unsustainable', 'exorbitant', 'lucrative',
    'meager', 'diminishing', 'exponential', 'tangible', 'intangible', 'protracted', 'regressive',
    'progressive', 'macroeconomic', 'microeconomic', 'protectionist', 'offshoring', 'outsourcing',
    'downturn', 'hyperinflation',
    // science
    'hypothesis', 'hypothetical', 'methodology', 'methodological', 'falsifiable', 'replicable',
    'correlation', 'causation', 'causal', 'variable', 'anomaly', 'anomalous', 'phenomenon',
    'quantifiable', 'qualitative', 'quantitative', 'longitudinal', 'theoretical', 'rigorous',
    'rigor', 'inconclusive', 'conjecture', 'deduction', 'deductive', 'induction', 'inductive',
    'inference', 'inferential', 'empiricism', 'calibrate', 'calibration', 'extrapolate',
    'extrapolation', 'verifiable', 'verification', 'reproducibility', 'confounding',
    // philosophy / ethics
    'utilitarian', 'utilitarianism', 'deontological', 'consequentialist', 'consequentialism',
    'normative', 'subjective', 'objective', 'relativism', 'absolutism', 'dichotomy',
    'dichotomous', 'paradox', 'paradoxical', 'fallacy', 'fallacious', 'sophistry', 'rhetoric',
    'rhetorical', 'syllogism', 'epistemology', 'epistemological', 'ontology', 'ontological',
    'metaphysical', 'existential', 'existentialism', 'nihilism', 'nihilistic', 'determinism',
    'deterministic', 'culpability', 'culpable', 'complicity', 'complicit', 'transgression',
    'sanctity', 'egregious', 'reprehensible', 'unconscionable', 'indefensible', 'unjustifiable',
    'unwarranted', 'disingenuous', 'hypocrisy', 'hypocritical', 'paternalistic', 'condescending',
    'axiomatic', 'teleological',
    // law
    'adjudicate', 'adjudication', 'litigation', 'litigious', 'plaintiff', 'defendant', 'liable',
    'liability', 'indemnity', 'injunction', 'precedent', 'jurisprudence', 'statute', 'statutory',
    'unconstitutional', 'constitutionality', 'testimony', 'admissible', 'inadmissible',
    'indictment', 'prosecution', 'acquittal', 'conviction', 'extradite', 'extradition',
    'arbitration', 'mediation', 'contractual', 'breach', 'infringe', 'infringement', 'litigant',
    'malfeasance',
    // technology
    'algorithmic', 'obsolescence', 'disruptive', 'scalable', 'scalability', 'interoperable',
    'interoperability', 'encrypted', 'encryption', 'surveillance', 'autonomous', 'automation',
    'digitize', 'digitization', 'proliferation', 'proliferate', 'disintermediation',
    'cybersecurity', 'vulnerability', 'malicious', 'obfuscate', 'obfuscation', 'rudimentary',
    'technocratic', 'technocracy', 'computational',
    // environment
    'depletion', 'deplete', 'degradation', 'degrade', 'mitigation', 'adaptation', 'biodiversity',
    'ecosystem', 'renewable', 'finite', 'irreversible', 'catastrophic', 'anthropogenic',
    'emission', 'sequestration', 'deforestation', 'desertification', 'overexploitation',
    'ecological', 'sustainability',
    // society
    'marginalized', 'marginalization', 'stigmatize', 'stigma', 'perpetuate', 'entrench',
    'disenfranchisement', 'socioeconomic', 'demographic', 'assimilation', 'assimilate',
    'integration', 'segregation', 'segregated', 'discriminatory', 'discrimination', 'prejudice',
    'prejudiced', 'ostracize', 'ostracized', 'alienation', 'alienate', 'disparate',
    'underprivileged', 'underrepresented', 'overrepresented', 'institutionalized',
    'institutionalize', 'systemic',
    // additional terms
    'coincide', 'articulate', 'refute', 'reconcile', 'undermine', 'reinforce', 'encompass',
    'precipitate', 'subsequent', 'profound', 'versatile', 'marginal', 'incremental',
    'cumulative', 'transparent', 'accountability', 'sustainable', 'equitable', 'inclusive',
    'integral', 'unsubstantiated', 'framework', 'infrastructure', 'legislation', 'regulatory',
    'humanitarian', 'compliance', 'transparency', 'vulnerable', 'extraction', 'allocation',
    'distribution', 'procurement', 'tariff', 'inflation', 'liberalization', 'nationalization',
    'oversight', 'scrutiny', 'consensus', 'deadlock', 'gridlock', 'polarization',
    'radicalization', 'extremism', 'moderate', 'centrist', 'conservative', 'ideology',
    'disinformation', 'misinformation', 'exploit', 'algorithm', 'disruption', 'innovation',
    'escalation', 'deterrence', 'containment', 'intervention', 'occupation', 'ceasefire',
    'armistice', 'reconciliation', 'reparation', 'allegation', 'constitutional', 'plebiscite',
    'gerrymandering', 'filibuster', 'lobbying', 'discretion', 'prerogative', 'entitlement',
    'stipulation', 'provision', 'clause', 'amendment', 'ratification', 'treaty', 'accord',
    'protocol', 'sanction', 'blockade',
    // high-register / GRE-tier — kept separate for provenance, but matched
    // exactly like every other tier above; also feeds Word of the Day.
    'perspicacious', 'ineffable', 'recalcitrant', 'assiduous', 'sagacious', 'vicarious',
    'circuitous', 'obstreperous', 'fastidious', 'inscrutable', 'sanguine', 'parsimonious',
    'loquacious', 'mercurial'
  ];

  // Real CEFR (Common European Framework of Reference for Languages) level
  // for every word in VOCAB_WORDS above — shown on each word's Bag card
  // instead of a made-up "Level N" tied to how many times it's been used.
  // Classified offline (not at runtime — this is a static site with no
  // build step) with the `cefrpy` package, which ships English Vocabulary
  // Profile-derived level data per word. cefrpy occasionally mis-tags a
  // handful of genuinely uncommon words as A1/A2 (e.g. "untenable"), which
  // doesn't happen with truly basic vocabulary — cross-checked with
  // `wordfreq` Zipf frequency and remapped to B1-C2 by actual frequency
  // whenever cefrpy returned A1, A2, or nothing at all, since this bank is
  // curated to be advanced-only by construction (a genuine beginner word
  // should never appear here in the first place). See
  // scripts/classify_vocab_cefr.py to regenerate this table after
  // VOCAB_WORDS changes.
  var VOCAB_CEFR = {
    'ubiquitous': 'C2', 'paradigm': 'C2', 'notwithstanding': 'C1', 'ostensible': 'C2',
    'ostensibly': 'C2', 'pertinent': 'B2', 'corroborate': 'C2', 'juxtapose': 'C2',
    'ameliorate': 'C2', 'delineate': 'C1', 'exacerbate': 'C2', 'nuanced': 'C2',
    'underscore': 'C2', 'conducive': 'C2', 'inherent': 'B2', 'meticulous': 'C2',
    'pragmatic': 'C1', 'pragmatism': 'C2', 'substantiate': 'C2', 'circumvent': 'C2',
    'elucidate': 'C2', 'mitigate': 'C2', 'mitigating': 'C2', 'prevalent': 'C2',
    'prevalence': 'C2', 'discern': 'C2', 'discernible': 'C2', 'cogent': 'C2', 'cogency': 'C2',
    'unequivocally': 'C2', 'arguably': 'C2', 'invariably': 'B2', 'hitherto': 'C2',
    'albeit': 'C1', 'quintessential': 'C2', 'multifaceted': 'C2', 'unprecedented': 'C1',
    'discrepancy': 'C1', 'discrepancies': 'C1', 'ramification': 'B2', 'ramifications': 'B2',
    'tantamount': 'C2', 'plausible': 'C1', 'plausibility': 'C2', 'comprehensive': 'B2',
    'holistic': 'C2', 'holistically': 'C2', 'empirical': 'C1', 'empirically': 'C2',
    'detrimental': 'C1', 'viable': 'B2', 'viability': 'C1', 'feasible': 'C1',
    'feasibility': 'C1', 'robust': 'C1', 'robustness': 'C1', 'catalyst': 'B2',
    'coherent': 'B2', 'coherence': 'B2', 'credible': 'C1', 'credibility': 'C1',
    'legitimate': 'B2', 'legitimacy': 'C1', 'resilient': 'C2', 'resilience': 'C2',
    'untenable': 'C2', 'dubious': 'C2', 'contentious': 'C2', 'controversial': 'B1',
    'polarizing': 'B2', 'polarized': 'B2', 'divisive': 'C2', 'provocative': 'C2',
    'staunch': 'C2', 'vehement': 'C2', 'adamant': 'B1', 'resolute': 'C2', 'unwavering': 'C2',
    'uncompromising': 'C2', 'redundant': 'B2', 'superfluous': 'C2', 'extraneous': 'C1',
    'gratuitous': 'C2', 'arbitrary': 'C2', 'capricious': 'C2', 'inevitable': 'B1',
    'imperative': 'B2', 'paramount': 'C2', 'indispensable': 'B2', 'obsolete': 'C1',
    'antiquated': 'B1', 'anachronistic': 'C2', 'archaic': 'C2', 'unorthodox': 'B2',
    'unconventional': 'C2', 'groundbreaking': 'C1', 'transformative': 'C2', 'formidable': 'B2',
    'insurmountable': 'C2', 'tenuous': 'C2', 'spurious': 'C2', 'disproportionate': 'B1',
    'asymmetric': 'C2', 'asymmetrical': 'C2', 'ingrained': 'B2', 'endemic': 'C2',
    'pervasive': 'C2', 'rampant': 'B2', 'widespread': 'B1', 'chronic': 'B2', 'transient': 'B2',
    'ephemeral': 'C2', 'fleeting': 'B2', 'enduring': 'B2', 'myopic': 'C2',
    'shortsighted': 'C2', 'prudent': 'C1', 'imprudent': 'C2', 'judicious': 'C2',
    'circumspect': 'C2', 'reckless': 'C2', 'negligent': 'C2', 'negligence': 'B1',
    'exonerate': 'C2', 'vindicate': 'C2', 'vilify': 'C2', 'demonize': 'C1', 'scapegoat': 'C2',
    'complacent': 'C2', 'complacency': 'C2', 'apathy': 'C2', 'apathetic': 'C2',
    'ambivalent': 'C2', 'ambivalence': 'C2', 'equivocal': 'C2', 'unequivocal': 'C2',
    'ambiguous': 'B2', 'ambiguity': 'B2', 'categorical': 'C2', 'definitive': 'C1',
    'conclusive': 'C2', 'tentative': 'B1', 'provisional': 'B2', 'contingent': 'C1',
    'multilateral': 'C2', 'unilateral': 'C2', 'bilateral': 'C1', 'bipartisan': 'C2',
    'nonpartisan': 'B1', 'sovereignty': 'B2', 'sovereign': 'C1', 'geopolitical': 'C2',
    'autocracy': 'C2', 'autocratic': 'C2', 'authoritarian': 'C2', 'totalitarian': 'C2',
    'oligarchy': 'C2', 'oligarchic': 'C2', 'plutocracy': 'C2', 'hegemony': 'C2',
    'hegemonic': 'C2', 'diplomacy': 'C1', 'diplomatic': 'B2', 'insurgency': 'C2',
    'insurgent': 'C2', 'dissent': 'C1', 'dissident': 'B2', 'coalition': 'B2',
    'referendum': 'C2', 'secession': 'C2', 'annexation': 'B2', 'annex': 'C2',
    'sanctions': 'C1', 'appeasement': 'C2', 'propaganda': 'B2', 'censorship': 'C1',
    'egalitarian': 'C2', 'disenfranchised': 'C2', 'disenfranchise': 'C2', 'enfranchise': 'C2',
    'constituency': 'C1', 'jurisdiction': 'B2', 'statecraft': 'C2', 'isolationism': 'B1',
    'protectionism': 'B1', 'globalization': 'B1', 'deregulation': 'B2', 'nationalism': 'B2',
    'populism': 'C2', 'partisan': 'B2', 'incumbent': 'C2', 'electorate': 'B2',
    'insurrection': 'C2', 'embargo': 'C2', 'ratify': 'C2', 'repeal': 'C1', 'mandate': 'C1',
    'autonomy': 'C1', 'federalism': 'C2', 'centralized': 'C1', 'decentralized': 'B1',
    'statesmanship': 'C2', 'subversive': 'C2', 'subversion': 'C2', 'coercive': 'C2',
    'coercion': 'C2', 'repression': 'B2', 'repressive': 'B1', 'factionalism': 'C2',
    'demagogue': 'C2', 'demagoguery': 'C2', 'xenophobia': 'C2', 'xenophobic': 'C2',
    'jingoism': 'C2', 'realpolitik': 'C2', 'inequitable': 'C2', 'inequity': 'C2',
    'disparity': 'B1', 'stagnation': 'C2', 'stagnant': 'C2', 'recession': 'B2',
    'recessionary': 'C1', 'inflationary': 'C2', 'deflationary': 'C2', 'subsidize': 'C2',
    'subsidy': 'B2', 'deficit': 'B2', 'surplus': 'B2', 'austerity': 'C2', 'fiscal': 'B2',
    'monetary': 'B2', 'commodify': 'C2', 'commodification': 'C2', 'privatization': 'C2',
    'privatize': 'C2', 'nationalize': 'C2', 'deregulate': 'B2', 'monopoly': 'C1',
    'monopolistic': 'C2', 'oligopoly': 'C2', 'cartel': 'C2', 'arbitrage': 'C2',
    'speculative': 'C1', 'speculation': 'B2', 'volatility': 'C2', 'volatile': 'C1',
    'liquidity': 'B1', 'illiquid': 'B1', 'insolvency': 'C2', 'insolvent': 'C2',
    'bankruptcy': 'B2', 'creditworthy': 'C2', 'collateral': 'B2', 'discretionary': 'C1',
    'redistribution': 'C2', 'redistributive': 'C2', 'entrenched': 'C2', 'exploitative': 'B2',
    'exploitation': 'C1', 'precarious': 'C2', 'precarity': 'C2', 'incentivize': 'C2',
    'disincentivize': 'C2', 'externality': 'C2', 'unsustainable': 'B2', 'exorbitant': 'C2',
    'lucrative': 'B2', 'meager': 'C2', 'diminishing': 'C1', 'exponential': 'C2',
    'tangible': 'C1', 'intangible': 'C2', 'protracted': 'B1', 'regressive': 'C2',
    'progressive': 'B1', 'macroeconomic': 'C2', 'microeconomic': 'C2', 'protectionist': 'B1',
    'offshoring': 'C2', 'outsourcing': 'C1', 'downturn': 'C2', 'hyperinflation': 'C2',
    'hypothesis': 'C2', 'hypothetical': 'C1', 'methodology': 'B2', 'methodological': 'C2',
    'falsifiable': 'C2', 'replicable': 'C2', 'correlation': 'C1', 'causation': 'C2',
    'causal': 'B2', 'variable': 'B1', 'anomaly': 'C2', 'anomalous': 'C2', 'phenomenon': 'B1',
    'quantifiable': 'C2', 'qualitative': 'C2', 'quantitative': 'C1', 'longitudinal': 'C1',
    'theoretical': 'B2', 'rigorous': 'C1', 'rigor': 'C2', 'inconclusive': 'C2',
    'conjecture': 'C2', 'deduction': 'B2', 'deductive': 'C1', 'induction': 'C1',
    'inductive': 'C1', 'inference': 'B2', 'inferential': 'C2', 'empiricism': 'C2',
    'calibrate': 'C2', 'calibration': 'C1', 'extrapolate': 'C2', 'extrapolation': 'C2',
    'verifiable': 'C2', 'verification': 'C1', 'reproducibility': 'C2', 'confounding': 'C2',
    'utilitarian': 'C2', 'utilitarianism': 'C2', 'deontological': 'C2',
    'consequentialist': 'C2', 'consequentialism': 'C2', 'normative': 'B2', 'subjective': 'B2',
    'objective': 'B2', 'relativism': 'C1', 'absolutism': 'C2', 'dichotomy': 'C2',
    'dichotomous': 'C2', 'paradox': 'B2', 'paradoxical': 'B2', 'fallacy': 'C2',
    'fallacious': 'C2', 'sophistry': 'C2', 'rhetoric': 'B2', 'rhetorical': 'C2',
    'syllogism': 'C2', 'epistemology': 'C2', 'epistemological': 'C2', 'ontology': 'C2',
    'ontological': 'C2', 'metaphysical': 'C1', 'existential': 'C2', 'existentialism': 'C2',
    'nihilism': 'C2', 'nihilistic': 'C2', 'determinism': 'C2', 'deterministic': 'C2',
    'culpability': 'C2', 'culpable': 'C2', 'complicity': 'C2', 'complicit': 'C2',
    'transgression': 'C2', 'sanctity': 'C2', 'egregious': 'C2', 'reprehensible': 'C2',
    'unconscionable': 'C2', 'indefensible': 'C2', 'unjustifiable': 'C2', 'unwarranted': 'C2',
    'disingenuous': 'C2', 'hypocrisy': 'C2', 'hypocritical': 'C2', 'paternalistic': 'C2',
    'condescending': 'C2', 'axiomatic': 'C2', 'teleological': 'C2', 'adjudicate': 'C2',
    'adjudication': 'C2', 'litigation': 'B1', 'litigious': 'C2', 'plaintiff': 'C1',
    'defendant': 'B2', 'liable': 'B1', 'liability': 'B2', 'indemnity': 'C1',
    'injunction': 'B2', 'precedent': 'B2', 'jurisprudence': 'C2', 'statute': 'B2',
    'statutory': 'B1', 'unconstitutional': 'C1', 'constitutionality': 'B1', 'testimony': 'B2',
    'admissible': 'C2', 'inadmissible': 'C2', 'indictment': 'B2', 'prosecution': 'B1',
    'acquittal': 'C2', 'conviction': 'B1', 'extradite': 'C2', 'extradition': 'C2',
    'arbitration': 'B1', 'mediation': 'C2', 'contractual': 'B2', 'breach': 'C1',
    'infringe': 'B2', 'infringement': 'B2', 'litigant': 'C2', 'malfeasance': 'C2',
    'algorithmic': 'B1', 'obsolescence': 'C2', 'disruptive': 'C2', 'scalable': 'C2',
    'scalability': 'C2', 'interoperable': 'C2', 'interoperability': 'C2', 'encrypted': 'C2',
    'encryption': 'C2', 'surveillance': 'B2', 'autonomous': 'C1', 'automation': 'C2',
    'digitize': 'C1', 'digitization': 'C1', 'proliferation': 'B2', 'proliferate': 'C2',
    'disintermediation': 'C2', 'cybersecurity': 'C1', 'vulnerability': 'C1', 'malicious': 'C2',
    'obfuscate': 'C2', 'obfuscation': 'C2', 'rudimentary': 'C2', 'technocratic': 'C2',
    'technocracy': 'C2', 'computational': 'C2', 'depletion': 'C1', 'deplete': 'C2',
    'degradation': 'C1', 'degrade': 'C2', 'mitigation': 'C2', 'adaptation': 'B2',
    'biodiversity': 'C1', 'ecosystem': 'B1', 'renewable': 'B2', 'finite': 'C2',
    'irreversible': 'C2', 'catastrophic': 'B2', 'anthropogenic': 'C2', 'emission': 'C1',
    'sequestration': 'C2', 'deforestation': 'B2', 'desertification': 'C2',
    'overexploitation': 'C2', 'ecological': 'B1', 'sustainability': 'B2', 'marginalized': 'C1',
    'marginalization': 'C2', 'stigmatize': 'C2', 'stigma': 'C2', 'perpetuate': 'C2',
    'entrench': 'C2', 'disenfranchisement': 'C2', 'socioeconomic': 'C2', 'demographic': 'C1',
    'assimilation': 'C2', 'assimilate': 'C2', 'integration': 'B1', 'segregation': 'C2',
    'segregated': 'C2', 'discriminatory': 'C2', 'discrimination': 'B1', 'prejudice': 'B1',
    'prejudiced': 'B1', 'ostracize': 'C2', 'ostracized': 'C2', 'alienation': 'B2',
    'alienate': 'B2', 'disparate': 'B1', 'underprivileged': 'C2', 'underrepresented': 'C2',
    'overrepresented': 'C2', 'institutionalized': 'B2', 'institutionalize': 'B2',
    'systemic': 'B2', 'coincide': 'B2', 'articulate': 'B2', 'refute': 'B2', 'reconcile': 'C1',
    'undermine': 'C1', 'reinforce': 'B2', 'encompass': 'C2', 'precipitate': 'C2',
    'subsequent': 'B1', 'profound': 'B2', 'versatile': 'C2', 'marginal': 'B2',
    'incremental': 'C1', 'cumulative': 'B2', 'transparent': 'B2', 'accountability': 'B2',
    'sustainable': 'B2', 'equitable': 'C1', 'inclusive': 'C1', 'integral': 'C1',
    'unsubstantiated': 'C2', 'framework': 'B2', 'infrastructure': 'B1', 'legislation': 'B2',
    'regulatory': 'B2', 'humanitarian': 'C1', 'compliance': 'B1', 'transparency': 'B1',
    'vulnerable': 'B2', 'extraction': 'B2', 'allocation': 'C1', 'distribution': 'B1',
    'procurement': 'B1', 'tariff': 'C1', 'inflation': 'B2', 'liberalization': 'C1',
    'nationalization': 'C2', 'oversight': 'B2', 'scrutiny': 'C1', 'consensus': 'B2',
    'deadlock': 'C2', 'gridlock': 'C2', 'polarization': 'B2', 'radicalization': 'C2',
    'extremism': 'C2', 'moderate': 'B1', 'centrist': 'C2', 'conservative': 'B1',
    'ideology': 'B2', 'disinformation': 'B1', 'misinformation': 'B1', 'exploit': 'B2',
    'algorithm': 'C1', 'disruption': 'C1', 'innovation': 'B2', 'escalation': 'C2',
    'deterrence': 'C2', 'containment': 'B1', 'intervention': 'B1', 'occupation': 'B2',
    'ceasefire': 'C1', 'armistice': 'C1', 'reconciliation': 'C1', 'reparation': 'B1',
    'allegation': 'B2', 'constitutional': 'B1', 'plebiscite': 'C2', 'gerrymandering': 'C2',
    'filibuster': 'C2', 'lobbying': 'B2', 'discretion': 'B1', 'prerogative': 'C2',
    'entitlement': 'C1', 'stipulation': 'C2', 'provision': 'B2', 'clause': 'B2',
    'amendment': 'B2', 'ratification': 'C2', 'treaty': 'B2', 'accord': 'C1', 'protocol': 'B1',
    'sanction': 'C2', 'blockade': 'C2', 'perspicacious': 'C2', 'ineffable': 'C1',
    'recalcitrant': 'C2', 'assiduous': 'C2', 'sagacious': 'B2', 'vicarious': 'C2',
    'circuitous': 'B2', 'obstreperous': 'C2', 'fastidious': 'C2', 'inscrutable': 'C2',
    'sanguine': 'C2', 'parsimonious': 'C2', 'loquacious': 'C2', 'mercurial': 'C2'
  };

  // "Word of the Day" pulls from this same VOCAB_WORDS bank rather than a
  // separate list — every entry's `word` is one of the terms above. A short
  // definition is the only thing that has to live here, since VOCAB_WORDS
  // itself is just a flat match list with no glosses attached.
  var WORD_OF_DAY_ENTRIES = [
    { word: 'ubiquitous', def: 'Present or found everywhere at once.' },
    { word: 'ostensible', def: 'Stated or appearing to be true, though not necessarily so.' },
    { word: 'pertinent', def: 'Relevant to the matter at hand.' },
    { word: 'corroborate', def: 'Confirm or support a claim with further evidence.' },
    { word: 'ameliorate', def: 'Make a bad situation better.' },
    { word: 'delineate', def: 'Describe or outline something precisely.' },
    { word: 'exacerbate', def: 'Make a problem or situation worse.' },
    { word: 'nuanced', def: 'Marked by subtle shades of meaning or distinction.' },
    { word: 'conducive', def: 'Making a certain outcome likely to happen.' },
    { word: 'meticulous', def: 'Extremely careful and precise about details.' },
    { word: 'pragmatic', def: 'Dealing with things sensibly and realistically.' },
    { word: 'substantiate', def: 'Provide evidence to support a claim.' },
    { word: 'circumvent', def: 'Find a way around an obstacle or rule.' },
    { word: 'elucidate', def: 'Make something clear through explanation.' },
    { word: 'mitigate', def: 'Make something less severe or serious.' },
    { word: 'prevalent', def: 'Widespread in a particular area or at a particular time.' },
    { word: 'cogent', def: 'Clear, logical, and convincing.' },
    { word: 'unequivocally', def: 'In a way that leaves absolutely no doubt.' },
    { word: 'quintessential', def: 'Representing the most perfect example of something.' },
    { word: 'multifaceted', def: 'Having many different aspects or sides.' },
    { word: 'unprecedented', def: 'Never having happened or existed before.' },
    { word: 'ramification', def: 'A consequence, often complicated or unwelcome.' },
    { word: 'tantamount', def: 'Equivalent in effect to something else.' },
    { word: 'plausible', def: 'Seeming reasonable or probable.' },
    { word: 'holistic', def: 'Considering something as a whole, not just its parts.' },
    { word: 'empirical', def: 'Based on observation or experience, not theory alone.' },
    { word: 'viable', def: 'Capable of working successfully.' },
    { word: 'feasible', def: 'Possible to do easily or conveniently.' },
    { word: 'robust', def: 'Strong and unlikely to fail or break down.' },
    { word: 'coherent', def: 'Logical and consistent; easy to follow.' },
    { word: 'credible', def: 'Able to be believed or trusted.' },
    { word: 'resilient', def: 'Able to recover quickly from difficulty.' },
    { word: 'untenable', def: 'Not able to be defended or maintained.' },
    { word: 'dubious', def: 'Not to be relied upon; of doubtful value.' },
    { word: 'contentious', def: 'Likely to cause disagreement or argument.' },
    { word: 'vehement', def: 'Showing strong, forceful feeling or conviction.' },
    { word: 'perspicacious', def: 'Having keen insight and sound judgment.' },
    { word: 'ineffable', def: 'Too great or intense to be expressed in words.' },
    { word: 'recalcitrant', def: 'Stubbornly resistant to authority or guidance.' },
    { word: 'assiduous', def: 'Showing great care, attention, and diligence.' },
    { word: 'sagacious', def: 'Having or showing keen judgment and wisdom.' },
    { word: 'vicarious', def: 'Experienced through the feelings or actions of another.' },
    { word: 'circuitous', def: 'Longer and less direct than a straight path; roundabout.' },
    { word: 'obstreperous', def: 'Noisy, unruly, and difficult to control.' },
    { word: 'fastidious', def: 'Very attentive to accuracy and detail; hard to please.' },
    { word: 'inscrutable', def: 'Impossible to understand or interpret.' },
    { word: 'sanguine', def: 'Optimistic or positive, especially in a difficult situation.' },
    { word: 'parsimonious', def: 'Unwilling to spend money or use resources; extremely frugal.' },
    { word: 'loquacious', def: 'Tending to talk a great deal; very talkative.' },
    { word: 'mercurial', def: 'Subject to sudden or unpredictable changes of mood.' }
  ];

  // Bag (see initBag()) shows a definition alongside each collected word
  // when one exists — but WORD_OF_DAY_ENTRIES only glosses 50 of the ~350
  // words in VOCAB_WORDS (the rest are a flat match list with no glosses
  // attached, see the comment above VOCAB_WORDS). A Bag word outside that
  // 50 just renders without a definition line rather than a fabricated one.
  var WORD_OF_DAY_DEFS = {};
  WORD_OF_DAY_ENTRIES.forEach(function (e) { WORD_OF_DAY_DEFS[e.word] = e.def; });

  // Fixed per-hit Credibility values — the whole scoring system runs on these flat
  // numbers, no formulas or randomness. Loosely modeled on how MUN judges
  // weight rubric lines: content failures (a bad, unsupported argument) cost
  // more than a conduct violation (profanity), which costs more than a style
  // tic (a filler word) — and a genuinely strong turn (rubric + lexis, not
  // just "not bad") is worth more than any single word-level hit.
  // Sourced from CUSSATOR_CONFIG (cussator-config.js, loaded before this
  // file — see index.html) rather than hardcoded here. FILLER_PENALTY_LIGHT
  // and the heal amounts have no equivalent in that shared config (it only
  // defines one flat filler tier, no "light"/heal concept), so those stay
  // local constants — CUSSATOR_CONFIG is the source of truth for the
  // values it actually defines, not a reason to invent matching ones for
  // everything it doesn't.
  var FILLER_PENALTY = CUSSATOR_CONFIG.HP_PENALTIES.filler;
  var FILLER_PENALTY_LIGHT = 5;
  var CURSE_PENALTY = CUSSATOR_CONFIG.HP_PENALTIES.curse;
  var CONNECTIVE_HEAL = 5;
  var VOCAB_HEAL = 10;
  var BAD_ARGUMENT_PENALTY = CUSSATOR_CONFIG.HP_PENALTIES.badArgument;
  var FALLACY_PENALTY = CUSSATOR_CONFIG.HP_PENALTIES.fallacy;
  // Left as absolute point values, same as every penalty above — a bigger
  // MAX_HP pool means these heal/damage the same amount but matter
  // relatively less, which is the intended effect of a larger pool, not
  // something to compensate for by scaling these up too.
  var STRONG_ARGUMENT_SELF_HEAL = 20;
  var STRONG_ARGUMENT_OPPONENT_DAMAGE = 20;

  // Both sides' starting/max HP. Every 0-100 assumption below (bar-width
  // percentage math, danger-tier thresholds, the clamp ceiling, the
  // post-round chart's Y-axis, Pitch mode's placeholder hpHistory) reads
  // off this instead of a literal 100, so it can change in one place.
  var MAX_HP = CUSSATOR_CONFIG.STARTING_HP;

  // Split Battle Engine's local filter — runs client-side, no AI call,
  // before the submitted argument is ever sent to /api/respond. Its
  // result feeds two things: the request payload's localFillerResult
  // (so the server can decide whether the AI's reply should open with a
  // Point of Order quote-and-mock, see debate_reply() in api/_common.py),
  // and — since CUSSATOR_CONFIG.HP_PENALTIES.filler and
  // .INTERRUPTION_THRESHOLD.fillerCount already exactly match what
  // classifyText()'s own filler tier and the live draft checker
  // (runInterruptionCheck()) already use — this deliberately does NOT
  // apply a second, separate HP deduction of its own: classifyText()'s
  // word-level delta (applied once, on submit, via setHealth() in the
  // form handler below) already is the filler damage for this turn. This
  // function's hpDamage field is informational/for parity with the spec's
  // own shape, not a value the client actually subtracts anywhere.
  //
  // Deliberately simpler than classifyText(): a flat word-boundary scan
  // against one list, no light tier, no HTML output, no word-count floor
  // — a fast, single-purpose check, not a replacement for the full
  // classifier that still drives real scoring/highlighting.
  function scanForFillers(text, fillerList) {
    // Defaults to the app's own full FILLER_WORDS (declared just above —
    // already a superset of CUSSATOR_CONFIG.FILLER_WORDS's 8-word
    // baseline, see the comment there), not the bare config list, so this
    // actually catches the same fillers classifyText() would — the config
    // list alone would under-detect real filler-heavy turns and rarely
    // trigger the interruption it's meant to feed. Pass an explicit list
    // to override.
    var list = fillerList || FILLER_WORDS;
    var found = list.filter(function (word) {
      return new RegExp('\\b' + escapeRegex(word) + '\\b', 'i').test(text);
    });
    return {
      detectedFillers: found,
      hpDamage: found.length * CUSSATOR_CONFIG.HP_PENALTIES.filler,
      triggerInterruption: found.length > CUSSATOR_CONFIG.INTERRUPTION_THRESHOLD.fillerCount,
    };
  }

  // All five tiers are matched in a single combined pass, longest phrase
  // first, instead of five sequential regex-and-replace passes. With lists
  // this size, several phrases in one tier contain a whole word from another
  // tier ("so yeah" contains the light filler "so"; "honestly speaking"
  // contains the light filler "honestly"); running separate passes would
  // let a later pass re-match text an earlier pass already wrapped in a
  // span, double-counting it. A single pass sorted by length means the
  // longest alternative that fits at a given position always wins, so
  // "so yeah" or "so that" is claimed whole before bare "so" ever gets a
  // chance at it.
  var CLASSIFIER_LOOKUP = {};
  var CLASSIFIER_ENTRIES = [];
  (function () {
    function addAll(list, kind) {
      list.forEach(function (w) {
        var key = w.toLowerCase();
        CLASSIFIER_LOOKUP[key] = kind;
        CLASSIFIER_ENTRIES.push(key);
      });
    }
    addAll(CURSE_WORDS, 'curse');
    addAll(FILLER_WORDS, 'filler');
    addAll(FILLER_WORDS_LIGHT, 'fillerLight');
    addAll(CONNECTIVE_WORDS, 'connective');
    addAll(VOCAB_WORDS, 'vocab');
    CLASSIFIER_ENTRIES.sort(function (a, b) { return b.length - a.length; });
  })();

  var CLASSIFIER_REGEX = new RegExp(
    '\\b(?:' + CLASSIFIER_ENTRIES.map(escapeRegex).join('|') + ')(?:s|es|d|ed|ly)?\\b', 'gi'
  );
  // Light suffix tolerance (s/es/d/ed/ly) applies to every entry so
  // "exacerbates"/"exacerbated" still catch the vocab tag without listing
  // every inflected form — a matched word not found verbatim in the lookup
  // gets one suffix stripped and is looked up again.
  var CLASSIFIER_SUFFIXES = ['ly', 'es', 'ed', 's', 'd'];
  // Returns both the tier and the canonical dictionary entry that matched
  // (with any inflectional suffix stripped) — the base is what the
  // post-round filler recap looks up in FILLER_ALTERNATIVES, since the
  // surface form in the player's text ("kinda") may differ from the key.
  function lookupEntry(matched) {
    var lower = matched.toLowerCase();
    if (CLASSIFIER_LOOKUP[lower]) return { kind: CLASSIFIER_LOOKUP[lower], base: lower };
    for (var i = 0; i < CLASSIFIER_SUFFIXES.length; i++) {
      var suf = CLASSIFIER_SUFFIXES[i];
      if (lower.length > suf.length && lower.slice(-suf.length) === suf) {
        var base = lower.slice(0, -suf.length);
        if (CLASSIFIER_LOOKUP[base]) return { kind: CLASSIFIER_LOOKUP[base], base: base };
      }
    }
    return null;
  }

  var CLASSIFIER_CLASS = {
    curse: 'cuss-curse',
    filler: 'cuss-weak',
    fillerLight: 'cuss-weak cuss-weak-light',
    connective: 'cuss-connective',
    vocab: 'cuss-vocab'
  };

  function classifyText(text) {
    var counts = { curse: 0, filler: 0, fillerLight: 0, connective: 0, vocab: 0 };
    var fillerWordsUsed = [];
    var vocabWordsUsed = [];
    var connectiveWordsUsed = [];
    var html = escapeHtml(text);

    html = html.replace(CLASSIFIER_REGEX, function (m) {
      var entry = lookupEntry(m);
      if (!entry) return m;
      counts[entry.kind]++;
      if (entry.kind === 'filler' || entry.kind === 'fillerLight') fillerWordsUsed.push(entry.base);
      if (entry.kind === 'vocab') vocabWordsUsed.push(entry.base);
      // Persistence-only addition (see recordConnectiveWords/Connector Log)
      // — the live highlight and counts[entry.kind]++ above are unchanged.
      if (entry.kind === 'connective') connectiveWordsUsed.push(entry.base);
      return '<span class="' + CLASSIFIER_CLASS[entry.kind] + '">' + m + '</span>';
    });

    var words = text.split(/\s+/).filter(Boolean);
    var delta = counts.connective * CONNECTIVE_HEAL + counts.vocab * VOCAB_HEAL
      - counts.filler * FILLER_PENALTY - counts.fillerLight * FILLER_PENALTY_LIGHT
      - counts.curse * CURSE_PENALTY;

    return {
      html: html,
      delta: delta,
      fillerCount: counts.filler,
      fillerLightCount: counts.fillerLight,
      curseCount: counts.curse,
      connectiveCount: counts.connective,
      vocabCount: counts.vocab,
      wordCount: words.length,
      fillerWordsUsed: fillerWordsUsed,
      vocabWordsUsed: vocabWordsUsed,
      connectiveWordsUsed: connectiveWordsUsed
    };
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  // The Logic/Precision/Delivery scoring formula — shared, top-level, and
  // pure (takes a stats object, returns a stats object) so both the normal
  // multi-turn arena (initArena()'s computeJudgeTargets(), which just calls
  // this with roundStats) and Elevator Pitch mode (initPitch(), a single
  // synthetic one-turn stats object) score off the exact same formula
  // rather than two copies that could quietly drift apart. See the
  // comments this used to carry inline in computeJudgeTargets() for the
  // reasoning behind each term — unchanged here, just relocated.
  function computeJudgeScores(stats) {
    var turns = stats.solid + stats.neutral + stats.bad;
    if (!turns) return { logic: 0, precision: 0, delivery: 0 };

    var verdictAvg = (stats.solid * 90 + stats.neutral * 50 - stats.bad * 20) / turns;
    var avgWords = stats.words / turns;

    return {
      logic: Math.round(clamp(verdictAvg + stats.connective * 3 - stats.filler * 2, 0, 100)),
      precision: Math.round(clamp(verdictAvg * 0.4 + stats.vocab * 9 - stats.filler * 6 - stats.curse * 5, 0, 100)),
      delivery: Math.round(clamp(Math.min(avgWords, 25) * 2.4 - stats.filler * 9 - stats.curse * 10, 0, 100))
    };
  }

  // Word Economy's "token" budget is a plain word count, not a BPE/subword
  // tokenizer — real subword tokenization is reserved for the future
  // AI-vs-AI Research Mode, not human rounds. A whitespace-delimited chunk
  // counts as one token if it contains at least one letter or digit, so:
  // contractions ("don't") and hyphenated compounds ("well-known") are
  // already single chunks and count as 1; multi-digit numbers ("2035")
  // count as 1 regardless of length; a chunk that's pure punctuation (a
  // stray "--" or "..." typed on its own) contains no letter/digit and
  // doesn't consume budget.
  function countWordTokens(text) {
    var chunks = text.split(/\s+/).filter(Boolean);
    var count = 0;
    for (var i = 0; i < chunks.length; i++) {
      if (/[\p{L}\p{N}]/u.test(chunks[i])) count++;
    }
    return count;
  }

  var MOTIONS = [
    'This House believes that artificial intelligence should be regulated as strictly as nuclear technology.',
    'This House would abolish the veto power in the UN Security Council.',
    'This House believes that social media platforms should be held legally liable for user-generated content.',
    'This House supports a universal basic income funded by automation taxes.',
    'This House believes that developed nations should cancel the debt of developing countries.',
    'This House would ban the use of animals in scientific research.',
    'This House believes that standardized testing does more harm than good in education.',
    'This House would grant legal personhood to advanced AI systems.',
    'This House believes that space exploration funding should be redirected to climate change mitigation.',
    'This House supports mandatory national service for all citizens.'
  ];

  function pickMotion() {
    return MOTIONS[Math.floor(Math.random() * MOTIONS.length)];
  }

  function initArena() {
    var arena = document.getElementById('cuss-arena');
    var arenaInner = arena.querySelector('.cuss-arena-inner');
    var form = document.getElementById('cuss-arena-form');
    if (!arena || !form) return;

    // Screen shake on penalty — plain class-toggle + CSS keyframes (see
    // .cuss-arena-inner.is-shaking in styles.css), not a timed state flag.
    // Removing the class and forcing a reflow before re-adding it means a
    // second penalty landing before the first shake finishes restarts the
    // animation from frame 0 instead of doing nothing (a repeat class add
    // with no change is a no-op in the browser).
    function triggerScreenShake() {
      if (!arenaInner) return;
      arenaInner.classList.remove('is-shaking');
      void arenaInner.offsetWidth;
      arenaInner.classList.add('is-shaking');
      setTimeout(function () { arenaInner.classList.remove('is-shaking'); }, 500);
    }

    // Per-turn countdown — ticks only while it's actually the player's turn
    // (textarea enabled), pausing during the AI's response, the stance-select
    // screen, and after the round ends. Purely a visible pressure cue: it
    // doesn't auto-submit or penalize on timeout, just holds at 00:00.
    //
    // Sourced from CUSSATOR_CONFIG.DIFFICULTY_TIERS (see cussator-config.js,
    // loaded before this file) rather than a hardcoded number — this now
    // genuinely reverses the earlier Feature 2 decision that difficulty
    // only ever changed vocabulary/phrasing (DIFFICULTY_STYLES in
    // api/_common.py), never pacing: Rookie/Delegate/Chair now run real
    // different clocks, token budgets, paste rules, and Point of Order
    // availability, per that config's DIFFICULTY_TIERS. getDifficultyTier()
    // is the one place that resolves the current tier, falling back to
    // delegate's if difficulty is ever somehow unset/unknown.
    function getDifficultyTier() {
      return CUSSATOR_CONFIG.DIFFICULTY_TIERS[difficulty] || CUSSATOR_CONFIG.DIFFICULTY_TIERS.delegate;
    }
    function getTurnDurationSeconds() {
      return getDifficultyTier().timerSeconds;
    }

    // Word Economy budget — a per-round pool of "tokens" (see
    // countWordTokens: 1 token = 1 word, not a real subword tokenizer),
    // now sized per difficulty tier (CUSSATOR_CONFIG.DIFFICULTY_TIERS
    // .maxTokensAllowed) instead of one flat number. Spent cumulatively
    // across every argument submitted this round; running out ends the
    // round through the same Credibility-loss path as any other auto-loss
    // (see checkTokenBudget()).
    function getTokenPoolSize() {
      return getDifficultyTier().maxTokensAllowed;
    }

    // Budget-aware gradient border (the ring around #cuss-arena-input-wrap,
    // see styles.css) — tracks whichever of the two limits is more
    // depleted right now (tokens remaining vs. time remaining), since
    // either one running out ends the turn the same way. The 50%/20% band
    // edges are this component's own UI thresholds, not part of
    // CUSSATOR_CONFIG — that config only defines the per-tier maxima
    // (maxTokensAllowed/timerSeconds) these percentages are computed
    // against, so nothing about a specific tier's numbers is hardcoded
    // here. Called on every timer tick (startTurnTimer()) and every
    // token-budget recheck (checkTokenBudget()), not per animation frame —
    // the underlying values only change on those two events anyway, and
    // the CSS transition on the border itself (see styles.css) is what
    // keeps the change from reading as an instant snap.
    var INPUT_BORDER_WARNING_PCT = 0.5;
    var INPUT_BORDER_CRITICAL_PCT = 0.2;
    function updateInputBorderState() {
      if (!inputWrapEl) return;
      var draftCount = countWordTokens(textarea.value);
      var tokenPct = clamp((getTokenPoolSize() - tokensUsed - draftCount) / getTokenPoolSize(), 0, 1);
      var timePct = clamp(turnSecondsLeft / getTurnDurationSeconds(), 0, 1);
      var worstPct = Math.min(tokenPct, timePct);
      var band = worstPct > INPUT_BORDER_WARNING_PCT ? 'safe'
        : worstPct > INPUT_BORDER_CRITICAL_PCT ? 'warning' : 'critical';
      inputWrapEl.classList.toggle('cuss-budget-warning', band === 'warning');
      inputWrapEl.classList.toggle('cuss-budget-critical', band === 'critical');
    }

    // Floating filler-penalty pill — fires once per submit (see the call
    // site in the form handler below), never per keystroke. Combines every
    // filler hit from this one submission into a single pill rather than
    // stacking one per word, since a single-shot submit flow (unlike a
    // live chat where words land one at a time) can easily produce 3+ hits
    // in the same instant. count/totalDamage are passed in already
    // computed from the same classifyText() output driving the real HP
    // deduction — see the call site — so this can never show a number that
    // doesn't match what the HP bar just did.
    var fillerPillTimer = null;
    var FILLER_PILL_FADE_IN_MS = 150;
    var FILLER_PILL_HOLD_MS = 350;
    var FILLER_PILL_FADE_OUT_MS = 300; // must match .cuss-filler-pill's base transition duration
    function showFillerPenaltyPill(count, totalDamage) {
      if (!fillerPillEl || count <= 0) return;
      fillerPillEl.textContent = '-' + totalDamage + ' HP: ' + count + (count === 1 ? ' FILLER WORD' : ' FILLER WORDS');

      clearTimeout(fillerPillTimer);
      fillerPillEl.classList.remove('is-visible');
      fillerPillEl.hidden = false;
      void fillerPillEl.offsetWidth; // reflow so back-to-back submits each replay the animation
      requestAnimationFrame(function () { fillerPillEl.classList.add('is-visible'); });

      fillerPillTimer = setTimeout(function () {
        fillerPillEl.classList.remove('is-visible');
        fillerPillTimer = setTimeout(function () {
          fillerPillEl.hidden = true;
        }, FILLER_PILL_FADE_OUT_MS);
      }, FILLER_PILL_FADE_IN_MS + FILLER_PILL_HOLD_MS);
    }

    // Interruption Mode ("Point of Order") — the architecture is strict
    // request/response with no streaming at any layer (see api/_common.py:
    // the Claude call itself is non-streaming, and the server never sees a
    // keystroke, only a fully submitted argument), so a literal mid-keystroke
    // read isn't possible. This is the debounced client-side stand-in: it
    // waits for a pause in typing, then runs the SAME local classifyText()
    // filler/hedge detection that already docks Credibility/Logic/Precision
    // on submit against the live, not-yet-sent draft. Purely advisory —
    // never blocks typing or sending — and reuses existing judging signal
    // rather than adding a second detector.
    var POINT_OF_ORDER_DEBOUNCE_MS = 650;
    // Below this, a single hedge word (e.g. an opening "I feel like") reads
    // as a false-positive interruption before the player has said anything
    // to actually judge yet.
    var POINT_OF_ORDER_MIN_WORDS = 7;
    var POINT_OF_ORDER_MESSAGES = [
      'Point of order. That is an assertion, not an argument, back it with a mechanism or example.',
      'Point of order. The delegate is hedging. Say what you actually mean and defend it.',
      'Point of order. Vague phrasing on the floor, the committee needs a specific claim to respond to.',
      'Point of order. That is a shrug dressed up as a point, tighten it before you send it.',
      'Point of order. Unsupported claim developing, a reason or example would make this land.'
    ];

    var openBtns = [document.getElementById('cuss-start-hero'), document.getElementById('cuss-start-nav')];
    var ENTER_ANIM_DURATION = 2200; // must match the CSS keyframes' 2.2s duration
    var SEND_KEY_PRESS_DURATION = 320; // must match .cuss-send-btn.is-pressed's 0.32s keyframe duration
    var entering = false; // guards against overlapping runs from fast repeat Chat clicks
    var closeBtn = document.getElementById('cuss-arena-close');
    var transcript = document.getElementById('cuss-arena-transcript');
    var textarea = document.getElementById('cuss-arena-input');
    var highlightLayer = document.getElementById('cuss-arena-highlight');
    var submitBtn = document.getElementById('cuss-arena-submit');
    var bagInsertBtn = document.getElementById('cuss-bag-insert-btn');
    var bagInsertPopover = document.getElementById('cuss-bag-insert-popover');
    var bagInsertList = document.getElementById('cuss-bag-insert-list');
    var bagShelfEl = document.getElementById('cuss-bag-shelf');
    var liveScarsEl = document.getElementById('cuss-live-scars');
    var motionEl = document.getElementById('cuss-arena-motion');
    var inputWrapEl = document.getElementById('cuss-arena-input-wrap');
    var fillerPillEl = document.getElementById('cuss-filler-pill');
    // Assigned inside the Insert-from-Bag block below (only when its DOM
    // refs all exist) — declared as a plain var up here, rather than a
    // block-scoped function declaration, so resetRound() below can call it
    // without depending on Annex-B function-hoisting semantics.
    var renderBagShelf = null;
    var typing = document.getElementById('cuss-arena-typing');
    var healthFill = document.getElementById('cuss-health-fill');
    var healthVal = document.getElementById('cuss-health-val');
    var healthTrail = document.getElementById('cuss-health-trail');
    var aiHealthFill = document.getElementById('cuss-ai-health-fill');
    var aiHealthVal = document.getElementById('cuss-ai-health-val');
    var aiHealthTrail = document.getElementById('cuss-ai-health-trail');
    var motionTextEl = document.getElementById('cuss-arena-motion-text');
    var judgePanel = document.getElementById('cuss-arena-judge');
    var judgeSummaryBtn = document.getElementById('cuss-judge-summary-btn');
    var judgePopover = document.getElementById('cuss-judge-popover');
    var judgeLogicFill = document.getElementById('cuss-judge-logic-fill');
    var judgeLogicVal = document.getElementById('cuss-judge-logic-val');
    var judgeLogicValInline = document.getElementById('cuss-judge-logic-val-inline');
    var judgePrecisionFill = document.getElementById('cuss-judge-precision-fill');
    var judgePrecisionVal = document.getElementById('cuss-judge-precision-val');
    var judgePrecisionValInline = document.getElementById('cuss-judge-precision-val-inline');
    var judgeDeliveryFill = document.getElementById('cuss-judge-delivery-fill');
    var judgeDeliveryVal = document.getElementById('cuss-judge-delivery-val');
    var judgeDeliveryValInline = document.getElementById('cuss-judge-delivery-val-inline');
    var judgeCritiqueEl = document.getElementById('cuss-judge-critique');
    var judgeCritiqueSummaryEl = document.getElementById('cuss-judge-critique-summary');
    var judgeCritiqueBreakdownEl = document.getElementById('cuss-judge-critique-breakdown');

    // Judge popover — collapsed to a one-line summary (see index.html);
    // the full bars/scores/explanations only render once this is opened.
    // Same open/close/outside-click/Escape pattern as the Insert-from-Bag
    // popover elsewhere in this file.
    if (judgeSummaryBtn && judgePopover) {
      function closeJudgePopover() {
        judgePopover.hidden = true;
        judgeSummaryBtn.setAttribute('aria-expanded', 'false');
      }
      function openJudgePopover() {
        judgePopover.hidden = false;
        judgeSummaryBtn.setAttribute('aria-expanded', 'true');
      }
      judgeSummaryBtn.addEventListener('click', function () {
        if (judgePopover.hidden) openJudgePopover();
        else closeJudgePopover();
      });
      document.addEventListener('click', function (e) {
        if (!judgePopover.hidden
          && !judgePopover.contains(e.target)
          && e.target !== judgeSummaryBtn && !judgeSummaryBtn.contains(e.target)) {
          closeJudgePopover();
        }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !judgePopover.hidden) closeJudgePopover();
      });
    }
    var gameoverRestartBtn = document.getElementById('cuss-gameover-restart');
    var gameoverReportBtn = document.getElementById('cuss-gameover-report');
    var resultOverlay = document.getElementById('cuss-result-transition');
    var resultVerdict = document.getElementById('cuss-result-verdict');
    var resultHeadline = document.getElementById('cuss-result-headline');
    var resultSub = document.getElementById('cuss-result-sub');
    var resultRuleText = document.getElementById('cuss-result-rule-text');
    var resultStats = document.getElementById('cuss-result-stats');
    var RESULT_LINE_DRAW_DELAY = 2700; // matches the keyframes' ~75-78% reveal point
    var RESULT_STATS_REVEAL_DELAY = 3100; // shortly after the rule-line finishes drawing in
    var recapEl = document.getElementById('cuss-recap');
    var trendEl = document.getElementById('cuss-trend');
    var stanceSelectEl = document.getElementById('cuss-stance-select');
    var stanceContentEl = document.getElementById('cuss-stance-content');
    var stanceMotionText = document.getElementById('cuss-stance-motion-text');
    var stanceAffirmBtn = document.getElementById('cuss-stance-affirm');
    var stanceNegateBtn = document.getElementById('cuss-stance-negate');
    var stanceConfirmEl = document.getElementById('cuss-stance-confirm');
    var stanceConfirmYouEl = document.getElementById('cuss-stance-confirm-you');
    var stanceConfirmAiEl = document.getElementById('cuss-stance-confirm-ai');
    var healthLabelEl = document.getElementById('cuss-health-label');
    var aiHealthLabelEl = document.getElementById('cuss-ai-health-label');
    var turnTimerEl = document.getElementById('cuss-arena-timer');
    var arenaSideEl = document.getElementById('cuss-arena-side');
    var tokenValEl = document.getElementById('cuss-token-val');
    var tokenBudgetEl = document.getElementById('cuss-token-budget');
    var difficultyBtns = Array.prototype.slice.call(document.querySelectorAll('.cuss-difficulty-btn'));
    var pointOfOrderEl = document.getElementById('cuss-point-of-order');
    var pointOfOrderTextEl = document.getElementById('cuss-poo-text');
    var pointOfOrderDismissBtn = document.getElementById('cuss-poo-dismiss');
    var pasteBlockedEl = document.getElementById('cuss-paste-blocked');

    // Cost of one Simplify action, deducted from the same Word Economy pool
    // as everything else (see checkTokenBudget()) — comprehension help isn't
    // free, it's just another way to spend the pool. Unavailable entirely in
    // Chair mode, since that difficulty is opt-in hard mode.
    var SIMPLIFY_COST = 25;

    var MOTION = motionTextEl ? motionTextEl.textContent : '';
    var health = MAX_HP;
    var aiHealth = MAX_HP;
    var history = [];
    var roundStats = { filler: 0, curse: 0, connective: 0, vocab: 0, words: 0, solid: 0, neutral: 0, bad: 0 };
    // Same shape as roundStats' word-category fields, but for the AI's own
    // replies — roundStats only ever tracked the player's words (it feeds
    // the player-facing Judge panel), so this is a new, parallel tally kept
    // purely for the post-round dashboard's "you vs AI opponent" breakdown
    // chart. Accumulated from the same classifyText() call already made on
    // every AI reply (see aiAnalysis in the submit handler) — no new
    // classification pass, just a second running total from data already
    // computed.
    var aiRoundStats = { filler: 0, curse: 0, connective: 0, vocab: 0 };
    var roundFillerWords = {};
    // Post-round dashboard data (Feature 3) — timestamps and a per-turn log
    // the app never tracked before. turnStartTime marks the moment the
    // textarea was last handed back to the player (set in startTurnTimer(),
    // the single point where that happens, whether that's the top of the
    // round or right after an AI reply); WPM is computed from the gap
    // between that moment and the next submit, floored at 1s so a
    // near-instant send (e.g. an Insert-from-Bag word immediately sent)
    // can't produce an absurd spike. turnLog holds one entry per player
    // submission built up via finalizeTurn() (see the submit handler) so it
    // still records a partial entry even if the round ends mid-exchange
    // (self-KO, or a KO landing before the AI's own reply is judged).
    // hpHistory is a parallel timeline of {turnIndex, health, aiHealth}
    // snapshots for the dashboard's HP-over-time chart, seeded with the
    // 100/100 starting point so the line has a real start, not a jump.
    var turnStartTime = null;
    var turnLog = [];
    var hpHistory = [{ turnIndex: 0, health: MAX_HP, aiHealth: MAX_HP }];
    var lastRoundPlayerWon = null; // read by buildDashboardPayload() for the report's "Result" stat
    var judgeAnimTimer = null;
    var roundOver = false;
    var stanceTimer = null;
    var resultLineTimer = null;
    var resultStatsTimer = null;
    var playerSide = null;
    arenaRoundActive = function () { return !!playerSide && !roundOver; };
    var difficulty = 'delegate';
    var turnTimer = null;
    var turnSecondsLeft = getTurnDurationSeconds();
    var tokensUsed = 0;
    var poiTimer = null;
    var poiVisible = false;
    // Signature of the last draft the player explicitly dismissed a Point of
    // Order for (see dismissPointOfOrder()) — re-arms itself once the draft's
    // own filler fingerprint changes (new/different hedge word added), so a
    // dismiss doesn't just get instantly re-triggered by the next debounce
    // tick, but also doesn't suppress a genuinely new weak spot for the rest
    // of the turn.
    var poiDismissedSignature = null;

    function formatTurnTime(s) {
      var m = Math.floor(s / 60);
      var r = s % 60;
      return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
    }

    // Reused by the placeholder swap below, so the "hurry up" copy and the
    // timer chip's own amber warning always agree on what "running out"
    // means, rather than tracking two separate thresholds.
    var NORMAL_PLACEHOLDER = 'Your argument...';
    var URGENT_PLACEHOLDER = "Time's almost up. Argue now!";

    function updateTurnTimerDisplay() {
      updateInputBorderState();
      if (!turnTimerEl) return;
      turnTimerEl.textContent = formatTurnTime(turnSecondsLeft);
      var isWarn = turnSecondsLeft > 0 && turnSecondsLeft <= 10;
      turnTimerEl.classList.toggle('is-warn', isWarn);
      // Dynamic placeholder — deliberately NOT a new idle timer: this rides
      // the same per-second tick (and the same 10s threshold) the countdown
      // chip already runs on. Only visible while the box is actually empty
      // anyway, and only touched while the player can type, so it can't
      // clobber a disabled textarea's state between turns.
      if (textarea && !textarea.disabled) {
        textarea.placeholder = isWarn ? URGENT_PLACEHOLDER : NORMAL_PLACEHOLDER;
      }
    }

    function stopTurnTimer() {
      if (turnTimer) { clearInterval(turnTimer); turnTimer = null; }
    }

    function startTurnTimer() {
      stopTurnTimer();
      turnSecondsLeft = getTurnDurationSeconds();
      updateTurnTimerDisplay();
      // The one point where the textarea is actually handed back to the
      // player (round start and after every AI reply) — see the WPM note
      // on turnStartTime above.
      turnStartTime = Date.now();
      turnTimer = setInterval(function () {
        turnSecondsLeft = Math.max(0, turnSecondsLeft - 1);
        updateTurnTimerDisplay();
        if (turnSecondsLeft === 0) stopTurnTimer();
      }, 1000);
    }

    function updateTokenDisplay(remaining) {
      if (!tokenValEl) return;
      tokenValEl.textContent = remaining;
      if (tokenBudgetEl) tokenBudgetEl.classList.toggle('is-critical', remaining <= getTokenPoolSize() * 0.1);
    }

    // Recomputes remaining budget live — tokensUsed (already-submitted
    // arguments this round) plus whatever's currently typed but not sent
    // yet, so the number ticks down as the player types, same as the
    // filler/vocab highlighter. Running out reuses the existing
    // Credibility-loss path instead of a separate end state: zeroing
    // health and running the normal game-over check.
    function checkTokenBudget() {
      if (roundOver) return;
      var draftCount = countWordTokens(textarea.value);
      var remaining = getTokenPoolSize() - tokensUsed - draftCount;
      updateTokenDisplay(Math.max(0, remaining));
      updateInputBorderState();
      if (remaining <= 0) {
        setHealth(0);
        checkGameOver();
      }
    }

    function resetRound() {
      MOTION = pickMotion();
      if (motionTextEl) motionTextEl.textContent = MOTION;
      if (motionEl) motionEl.title = 'Motion: ' + MOTION;
      if (stanceMotionText) stanceMotionText.textContent = MOTION;

      history = [];
      roundVocabWords = [];
      var bagPromptEl = document.getElementById('cuss-bag-prompt');
      if (bagPromptEl) bagPromptEl.hidden = true;
      roundStats = { filler: 0, curse: 0, connective: 0, vocab: 0, words: 0, solid: 0, neutral: 0, bad: 0 };
      aiRoundStats = { filler: 0, curse: 0, connective: 0, vocab: 0 };
      roundFillerWords = {};
      renderLiveScars();
      if (renderBagShelf) renderBagShelf();
      if (motionEl) motionEl.classList.remove('is-expanded');
      if (fillerPillEl) { clearTimeout(fillerPillTimer); fillerPillEl.classList.remove('is-visible'); fillerPillEl.hidden = true; }
      if (inputWrapEl) inputWrapEl.classList.remove('cuss-budget-warning', 'cuss-budget-critical');
      turnStartTime = null;
      turnLog = [];
      hpHistory = [{ turnIndex: 0, health: MAX_HP, aiHealth: MAX_HP }];
      lastRoundPlayerWon = null;
      recapEl.innerHTML = '';
      trendEl.innerHTML = '';
      if (judgeAnimTimer) { clearTimeout(judgeAnimTimer); judgeAnimTimer = null; }
      if (stanceTimer) { clearTimeout(stanceTimer); stanceTimer = null; }
      if (resultLineTimer) { clearTimeout(resultLineTimer); resultLineTimer = null; }
      if (resultStatsTimer) { clearTimeout(resultStatsTimer); resultStatsTimer = null; }
      if (resultOverlay) {
        resultOverlay.classList.remove('playing-win', 'playing-lose');
        resultOverlay.hidden = true;
      }
      if (resultVerdict) resultVerdict.classList.remove('line-drawn');
      if (resultStats) resultStats.classList.remove('is-visible');
      stopTurnTimer();
      turnSecondsLeft = getTurnDurationSeconds();
      updateTurnTimerDisplay();
      stopInterruptionCheck();
      hidePointOfOrder();
      poiDismissedSignature = null;
      tokensUsed = 0;
      if (tokenBudgetEl) tokenBudgetEl.classList.remove('is-critical');
      updateTokenDisplay(getTokenPoolSize());

      roundOver = false;

      setHealth(MAX_HP);
      setAiHealth(MAX_HP);

      judgePanel.classList.remove('is-visible');
      judgePanel.hidden = true;
      setJudgeBar(judgeLogicFill, judgeLogicVal, judgeLogicValInline, 0);
      setJudgeBar(judgePrecisionFill, judgePrecisionVal, judgePrecisionValInline, 0);
      setJudgeBar(judgeDeliveryFill, judgeDeliveryVal, judgeDeliveryValInline, 0);
      if (judgePopover) judgePopover.hidden = true;
      if (judgeSummaryBtn) judgeSummaryBtn.setAttribute('aria-expanded', 'false');
      if (judgeCritiqueEl) {
        judgeCritiqueEl.classList.remove('is-visible');
        judgeCritiqueEl.hidden = true;
      }

      // Light pre-round anchor — sits where the first AI card / user bubble
      // will land (left/right, same as .cuss-bubble-ai / .cuss-bubble-user)
      // so the transcript reads as populated, not broken, before the first
      // message. Side letters/colors get filled in by chooseStance() once
      // a side is picked; addUserBubbleAnimated() removes this block the
      // moment the first real bubble is added.
      transcript.classList.add('is-empty');
      transcript.innerHTML =
        '<div class="cuss-transcript-anchor" id="cuss-transcript-anchor">' +
          '<div class="cuss-anchor-row cuss-anchor-left">' +
            '<span class="cuss-anchor-avatar" id="cuss-anchor-ai-avatar">?</span>' +
            '<span class="cuss-anchor-label" id="cuss-anchor-ai-label">AI opponent</span>' +
          '</div>' +
          '<div class="cuss-anchor-row cuss-anchor-right">' +
            '<span class="cuss-anchor-label" id="cuss-anchor-you-label">You</span>' +
            '<span class="cuss-anchor-avatar" id="cuss-anchor-you-avatar">?</span>' +
          '</div>' +
        '</div>' +
        '<p class="cuss-arena-empty">' +
          '<span class="tag tag-outline cuss-arena-prompt-badge">YOUR TURN</span>' +
          'Make the case for the resolution — precise phrasing strengthens your position, filler words weaken it instantly.' +
        '</p>';
      typing.hidden = true;
      typing.classList.remove('is-visible');

      // Locked until a side is picked on the stance-select screen — see
      // chooseStance(), which re-enables these once the confirm beat ends.
      textarea.disabled = true;
      submitBtn.disabled = true;
      if (bagInsertBtn) bagInsertBtn.disabled = true;
      textarea.value = '';
      textarea.placeholder = 'Your argument...'; // in case the last round ended on the urgent variant
      renderHighlight();

      playerSide = null;
      setDifficulty('delegate');
      healthLabelEl.textContent = 'You';
      aiHealthLabelEl.textContent = 'Opponent';
      if (arenaSideEl) { arenaSideEl.hidden = true; arenaSideEl.textContent = ''; arenaSideEl.className = 'tag tag-outline cuss-arena-side'; }
      stanceAffirmBtn.disabled = false;
      stanceNegateBtn.disabled = false;
      stanceConfirmEl.hidden = true;
      stanceConfirmYouEl.className = 'cuss-stance-confirm-row';
      stanceConfirmAiEl.className = 'cuss-stance-confirm-row';
      // Defensive: Rematch calls resetRound() directly (never through
      // playEnterThenOpen()), so if anything ever left is-entering set,
      // this guarantees .cuss-stance-content shows immediately rather than
      // staying suppressed with no timer left to clear it.
      stanceSelectEl.classList.remove('is-entering');
      stanceSelectEl.hidden = false;
    }

    // Picked freely on the stance-select screen, independent of Affirm/Negate
    // — changes only vocabulary/phrasing density server-side (see
    // DIFFICULTY_STYLES in api/_common.py), never the judging rubric. Chair
    // also gates out the per-message Simplify action (see addAiCard()).
    function setDifficulty(level) {
      difficulty = level;
      difficultyBtns.forEach(function (btn) {
        btn.classList.toggle('is-active', btn.dataset.difficulty === level);
      });
      // Only ever called pre-round (the difficultyBtns click handler below
      // guards on !playerSide) or from resetRound()'s own default, so it's
      // always safe to refresh the timer/token displays right here too —
      // this is what makes picking a tier on the stance-select screen
      // actually show that tier's real timer/Word Economy budget before
      // the round even starts, per CUSSATOR_CONFIG.DIFFICULTY_TIERS.
      turnSecondsLeft = getTurnDurationSeconds();
      updateTurnTimerDisplay();
      tokensUsed = 0;
      if (tokenBudgetEl) tokenBudgetEl.classList.remove('is-critical');
      updateTokenDisplay(getTokenPoolSize());
    }

    // Player picks Affirm/Negate; the AI automatically takes the opposite
    // side. Briefly shows both choices as a confirmation beat, then reveals
    // the round with the player speaking first — no AI message before that.
    function chooseStance(side) {
      if (playerSide) return;
      playerSide = side;
      stanceAffirmBtn.disabled = true;
      stanceNegateBtn.disabled = true;

      var aiSide = side === 'affirm' ? 'negate' : 'affirm';
      var difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
      // Kept short on purpose — the HUD bars are compact side-by-side
      // strips, and the side (Affirm/Negate) is already shown right next
      // to them via arenaSideEl's tag and the pre-round anchor row, so
      // repeating it here just crowds out the label under a narrow track.
      healthLabelEl.textContent = 'You';
      aiHealthLabelEl.textContent = 'Opponent (' + difficultyLabel + ')';
      if (arenaSideEl) {
        arenaSideEl.hidden = false;
        arenaSideEl.textContent = side === 'affirm' ? 'AFFIRM' : 'NEGATE';
        arenaSideEl.classList.add(side === 'affirm' ? 'is-affirm' : 'is-negate');
        // rAF so the browser paints the pre-fade (opacity:0) frame first —
        // otherwise adding is-visible in the same tick as unhiding skips
        // straight to the end state and there's nothing to transition from.
        requestAnimationFrame(function () { arenaSideEl.classList.add('is-visible'); });
      }

      // Fill in the pre-round anchor's avatars/labels now that sides are
      // known — re-queried here rather than cached, since resetRound()
      // rebuilds the transcript (and these nodes with it) on every round.
      var youAvatar = document.getElementById('cuss-anchor-you-avatar');
      var youLabel = document.getElementById('cuss-anchor-you-label');
      var aiAvatar = document.getElementById('cuss-anchor-ai-avatar');
      var aiLabel = document.getElementById('cuss-anchor-ai-label');
      if (youAvatar) {
        youAvatar.textContent = side === 'affirm' ? 'A' : 'N';
        youAvatar.className = 'cuss-anchor-avatar is-' + side;
      }
      if (youLabel) youLabel.textContent = 'You · ' + (side === 'affirm' ? 'Affirm' : 'Negate');
      if (aiAvatar) {
        aiAvatar.textContent = aiSide === 'affirm' ? 'A' : 'N';
        aiAvatar.className = 'cuss-anchor-avatar is-' + aiSide;
      }
      if (aiLabel) aiLabel.textContent = 'AI opponent · ' + (aiSide === 'affirm' ? 'Affirm' : 'Negate');

      stanceConfirmYouEl.textContent = 'You: ' + side.toUpperCase();
      stanceConfirmYouEl.className = 'cuss-stance-confirm-row cuss-text-' + side;
      stanceConfirmAiEl.textContent = 'AI opponent: ' + aiSide.toUpperCase();
      stanceConfirmAiEl.className = 'cuss-stance-confirm-row cuss-text-' + aiSide;
      stanceConfirmEl.hidden = false;

      requestAnimationFrame(function () {
        stanceConfirmYouEl.classList.add('is-visible');
        setTimeout(function () { stanceConfirmAiEl.classList.add('is-visible'); }, 300);
      });

      stanceTimer = setTimeout(function () {
        stanceSelectEl.hidden = true;
        textarea.disabled = false;
        submitBtn.disabled = false;
        if (bagInsertBtn) bagInsertBtn.disabled = false;
        textarea.focus();
        startTurnTimer();
      }, 1700);
    }

    // Ends the round immediately once either bar hits 0 — no further
    // exchange happens after the turn that caused it finishes resolving.
    function checkGameOver() {
      if (roundOver) return true;
      if (aiHealth <= 0) { endRound(true); return true; }
      if (health <= 0) { endRound(false); return true; }
      return false;
    }

    function endRound(playerWon) {
      roundOver = true;
      lastRoundPlayerWon = playerWon;
      textarea.disabled = true;
      submitBtn.disabled = true;
      if (bagInsertBtn) bagInsertBtn.disabled = true;
      typing.hidden = true;
      typing.classList.remove('is-visible');
      stopTurnTimer();
      stopInterruptionCheck();
      hidePointOfOrder();

      // The turn that ends the round can return before the normal
      // post-turn reveal path reaches revealJudge() (see the submit
      // handler's early checkGameOver() returns) — call it here too so
      // the panel always reflects the final turn, not the one before it.
      revealJudge();

      var totalFillerThisRound = Object.keys(roundFillerWords).reduce(function (sum, w) {
        return sum + roundFillerWords[w];
      }, 0);
      var priorHistory = loadRoundHistory();
      recordRoundFillerCount(totalFillerThisRound);
      renderRoundTrend(totalFillerThisRound, priorHistory);
      renderFillerRecap();
      pullAndMerge('round-end');

      playRoundResultTransition(playerWon);
      fetchJudgeCritique();
    }

    // Written explanation for the Judge panel's three scores, fetched once
    // the round is actually over — never mid-round, both because it's a
    // whole-round critique and because there's no reason to spend a call on
    // a round that isn't finished yet. Purely additive: the scores
    // themselves (judgeLogicVal etc., already set by revealJudge() above)
    // are never touched by this or by anything this call returns. Silently
    // does nothing if the round ended with zero real turns (e.g. the token
    // budget ran out on an unsent draft) or if the request fails — a round
    // report missing this one paragraph isn't worth surfacing an error for.
    function fetchJudgeCritique() {
      var userTurns = history
        .filter(function (turn) { return turn.role === 'user'; })
        .map(function (turn) { return turn.content; });
      if (!userTurns.length) return;

      fetch('/api/judge-critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motion: MOTION, side: playerSide, turns: userTurns })
      })
        .then(function (res) { return res.ok ? res.json() : null; })
        .catch(function () { return null; })
        .then(function (data) {
          if (!data || !data.overall_summary || !judgeCritiqueEl) return;
          judgeCritiqueSummaryEl.textContent = data.overall_summary;
          judgeCritiqueBreakdownEl.textContent = data.logic_breakdown || '';
          judgeCritiqueEl.hidden = false;
          requestAnimationFrame(function () { judgeCritiqueEl.classList.add('is-visible'); });
        });
    }

    // Ping-pong-volley win/lose transition — plays, then the SAME screen
    // (lips/ball frozen at their end state, verdict line + headline still
    // up) reveals the round stats and Rematch button below the verdict,
    // instead of handing off to a separate gameover screen the way this
    // used to work. That handoff was itself a second screen transition —
    // its own place for a homepage-flash-style glitch to creep in (see the
    // "Entering the Chat" -> stance-select fix) — and read as two
    // differently-styled screens stitched together rather than one result.
    // Upper lip = player, lower = AI, matching the health-bar order;
    // whichever one "returns" the final volley vs. fades out as the ball
    // flies past is driven entirely by playerWon, never guessed from
    // anything else. Only ever called from endRound(), which itself only
    // runs once per round (see roundOver guard in checkGameOver()) — so
    // this can't double-fire or play for a mid-round state.
    function playRoundResultTransition(playerWon) {
      if (!resultOverlay || !resultVerdict) return;
      if (resultLineTimer) clearTimeout(resultLineTimer);
      if (resultStatsTimer) clearTimeout(resultStatsTimer);

      resultHeadline.textContent = playerWon ? 'YOU WIN' : 'YOU LOSE';
      resultSub.textContent = playerWon ? 'CREDIBILITY HELD' : 'POSITION COLLAPSED';
      resultRuleText.textContent = playerWon ? 'MOTION CARRIES' : 'MOTION FAILS';

      resultOverlay.classList.remove('playing-win', 'playing-lose');
      resultVerdict.classList.remove('line-drawn');
      if (resultStats) resultStats.classList.remove('is-visible');
      resultOverlay.hidden = false;
      void resultOverlay.offsetWidth; // reflow so the keyframes always start from frame 0
      resultOverlay.classList.add(playerWon ? 'playing-win' : 'playing-lose');

      resultLineTimer = setTimeout(function () {
        resultVerdict.classList.add('line-drawn');
      }, RESULT_LINE_DRAW_DELAY);

      // Stats + Rematch fade in shortly after the rule-line finishes
      // drawing in, as a continuation of the same reveal rather than a cut
      // to a new screen. The overlay itself is never hidden again after
      // this — it just stays up (lip/ball animations already hold their
      // final "forwards" keyframe) until resetRound() (Rematch, or closing
      // and reopening the arena) clears it.
      resultStatsTimer = setTimeout(function () {
        // Rendered here, not in endRound(): a self-KO credits its Bag words
        // just after endRound() returns, and this runs well after that.
        renderGuestBagPrompt();
        if (resultStats) resultStats.classList.add('is-visible');
      }, RESULT_STATS_REVEAL_DELAY);
    }

    // This round's filler total against the average of the player's own
    // last (up to) 3 completed rounds — priorHistory is read before this
    // round gets recorded, so it never includes the round it's judging.
    function renderRoundTrend(currentCount, priorHistory) {
      trendEl.innerHTML = '';

      var headline = document.createElement('p');
      headline.className = 'cuss-trend-count';
      headline.textContent = currentCount + (currentCount === 1 ? ' filler word this round' : ' filler words this round');
      trendEl.appendChild(headline);

      var recent = priorHistory.slice(-3);
      if (!recent.length) {
        var first = document.createElement('p');
        first.className = 'cuss-trend-note cuss-trend-flat';
        first.textContent = "That's your first tracked round — play a few more to see your trend.";
        trendEl.appendChild(first);
        return;
      }

      var avg = recent.reduce(function (a, b) { return a + b; }, 0) / recent.length;
      var avgRounded = Math.round(avg * 10) / 10;
      var delta = Math.round(currentCount - avg);
      var roundWord = recent.length > 1 ? ' rounds' : ' round';

      var trendLine = document.createElement('p');
      trendLine.className = 'cuss-trend-note';
      if (delta < 0) {
        trendLine.classList.add('cuss-trend-down');
        trendLine.textContent = '▼ ' + Math.abs(delta) + ' fewer than your last ' + recent.length + roundWord + ' (avg ' + avgRounded + ')';
      } else if (delta > 0) {
        trendLine.classList.add('cuss-trend-up');
        trendLine.textContent = '▲ ' + delta + ' more than your last ' + recent.length + roundWord + ' (avg ' + avgRounded + ')';
      } else {
        trendLine.classList.add('cuss-trend-flat');
        trendLine.textContent = '— same as your last ' + recent.length + roundWord + ' (avg ' + avgRounded + ')';
      }
      trendEl.appendChild(trendLine);
    }

    // Post-round takeaway: the player's own filler words from this round
    // only (never the AI's), ranked by how often each came up, capped at 5
    // so it stays a quick read rather than a full report.
    function renderFillerRecap() {
      var entries = Object.keys(roundFillerWords)
        .map(function (w) { return { word: w, count: roundFillerWords[w] }; })
        .sort(function (a, b) { return b.count - a.count; })
        .slice(0, 5);

      recapEl.innerHTML = '';

      if (!entries.length) {
        var clean = document.createElement('p');
        clean.className = 'cuss-recap-clean';
        clean.textContent = 'No filler words this round — clean delivery.';
        recapEl.appendChild(clean);
        return;
      }

      var heading = document.createElement('p');
      heading.className = 'cuss-recap-heading';
      heading.textContent = 'Words to upgrade next round';
      recapEl.appendChild(heading);

      entries.forEach(function (entry) {
        var alternatives = FILLER_ALTERNATIVES[entry.word] || ['specifically', 'precisely'];
        var row = document.createElement('div');
        row.className = 'cuss-recap-row';

        var from = document.createElement('span');
        from.className = 'cuss-recap-from';
        from.textContent = '"' + entry.word + '"' + (entry.count > 1 ? ' ×' + entry.count : '');

        var arrow = document.createElement('span');
        arrow.className = 'cuss-recap-arrow';
        arrow.textContent = '→';

        var to = document.createElement('span');
        to.className = 'cuss-recap-to';
        to.textContent = alternatives.join(' / ');

        row.appendChild(from);
        row.appendChild(arrow);
        row.appendChild(to);
        recapEl.appendChild(row);
      });
    }

    // Applies the AI-judged per-turn verdict on top of the word-level delta
    // already scored for this turn — this is what makes Credibility respond
    // to whether an argument actually held up, not just to filler/vocab
    // word choice. Called twice per exchange, once per verdict the judge
    // call already returns: applyVerdict(user_argument_verdict, ..., true)
    // for the player's own turn, and applyVerdict(ai_reply_verdict, ...,
    // false) for the AI's rebuttal — so a turn that's bad AND gets called
    // out by a solid rebuttal costs the player twice in one exchange,
    // same as actually getting caught being vague would.
    //
    // Previously "solid" only paid out when the turn ALSO happened to
    // contain a tracked connective + vocab word on top of the LLM judging
    // it solid — a narrow, mostly-coincidental gate that made genuinely
    // strong arguments (real reasoning, just not using one of the specific
    // tracked words) pay out nothing, so the opponent's Credibility bar
    // effectively never moved. The verdict itself already reflects the
    // rubric (a real reason or mechanism, not just tone), so it's the
    // signal on its own now.
    // fallacyType is only ever passed for the player's own verdict (the AI
    // reply's verdict call below never has one) — /api/respond only judges
    // the player's argument for a specific named fallacy (see
    // DEBATE_TOOL's fallacy_type in api/_common.py), not its own rebuttal.
    // A verdict of "bad" that's specifically a named fallacy costs
    // HP_PENALTIES.fallacy instead of HP_PENALTIES.badArgument — same
    // value today (both 30), but tracked as its own constant per
    // CUSSATOR_CONFIG so the two can diverge later without a code change.
    function applyVerdict(verdict, selfIsPlayer, fallacyType) {
      var selfVal = selfIsPlayer ? health : aiHealth;
      var oppVal = selfIsPlayer ? aiHealth : health;
      var setSelf = selfIsPlayer ? setHealth : setAiHealth;
      var setOpp = selfIsPlayer ? setAiHealth : setHealth;
      var isFallacy = verdict === 'bad' && fallacyType && fallacyType !== 'none';

      if (verdict === 'bad') {
        setSelf(selfVal - (isFallacy ? FALLACY_PENALTY : BAD_ARGUMENT_PENALTY));
      } else if (verdict === 'solid') {
        setSelf(selfVal + STRONG_ARGUMENT_SELF_HEAL);
        setOpp(oppVal - STRONG_ARGUMENT_OPPONENT_DAMAGE);
      }
    }

    // Named-fallacy callout — reuses the exact Point of Order component
    // (showPointOfOrder()) rather than a new UI element, but fires AFTER
    // the AI's verdict comes back instead of live off the draft: a fallacy
    // can only be judged once a full argument has actually been submitted
    // and read, unlike the filler-count check above which reads the
    // in-progress draft. Gated on CUSSATOR_CONFIG.INTERRUPTION_THRESHOLD
    // .fallacyTriggersInterruption.
    var FALLACY_CALLOUTS = {
      strawman: 'Point of order. That was a strawman, the delegate rebutted a version of the argument nobody made.',
      ad_hominem: 'Point of order. That was an ad hominem, attacking the arguer instead of the argument.',
      slippery_slope: 'Point of order. That was a slippery slope, one small step does not guarantee the extreme outcome.',
      other: 'Point of order. That rested on a logical fallacy, not an actual reason.'
    };
    function maybeShowFallacyCallout(fallacyType) {
      if (!fallacyType || fallacyType === 'none') return;
      if (!CUSSATOR_CONFIG.INTERRUPTION_THRESHOLD.fallacyTriggersInterruption) return;
      showPointOfOrder(FALLACY_CALLOUTS[fallacyType] || FALLACY_CALLOUTS.other);
    }

    // Forces the browser to restart a CSS animation that's already mid-run
    // (removing then re-adding the class alone is a no-op without a reflow
    // in between) — used so back-to-back HP changes in the same turn (a
    // word-level delta immediately followed by a verdict delta) each get
    // their own visible pulse instead of the second one silently no-opping.
    function flashHealth(el) {
      el.classList.remove('is-flash');
      void el.offsetWidth;
      el.classList.add('is-flash');
    }

    // Trailing depletion streak (see .cuss-judge-trail in styles.css) — on
    // a drop, the trail snaps to the OLD (higher) width with no
    // transition, then a forced reflow + class-driven transition eases it
    // down to the new width on its own slower, delayed schedule, so it
    // visibly "catches up" after the real fill has already moved. A heal
    // just collapses the trail to the same value instantly — there's
    // nothing to trail on a gain.
    // value/previous here are raw HP (0..MAX_HP), not already percentages —
    // bar widths are always expressed as a percentage OF MAX_HP so the bar
    // fills/empties correctly regardless of the pool size.
    function hpPercent(v) {
      return (v / MAX_HP) * 100;
    }

    function setHpTrail(trailEl, value, previous) {
      if (!trailEl) return;
      if (value < previous) {
        trailEl.style.transition = 'none';
        trailEl.style.width = hpPercent(previous) + '%';
        void trailEl.offsetWidth; // reflow so the width below doesn't just no-op
        trailEl.style.transition = '';
        trailEl.style.width = hpPercent(value) + '%';
      } else {
        trailEl.style.transition = 'none';
        trailEl.style.width = hpPercent(value) + '%';
        void trailEl.offsetWidth;
        trailEl.style.transition = '';
      }
    }

    function updateHealthDisplay(fillEl, valEl, trailEl, value, previous) {
      fillEl.style.width = hpPercent(value) + '%';
      valEl.textContent = value;
      setHpTrail(trailEl, value, previous);

      // Danger tiers fire at the same relative HP fractions (25%/50% of
      // MAX_HP) regardless of pool size, not at the old scale's flat 25/50.
      var isCritical = value <= MAX_HP * 0.25;
      var isWarning = !isCritical && value <= MAX_HP * 0.5;
      fillEl.classList.toggle('is-hp-critical', isCritical);
      fillEl.classList.toggle('is-hp-warning', isWarning);
      valEl.classList.toggle('is-hp-critical', isCritical);
      valEl.classList.toggle('is-hp-warning', isWarning);

      if (value !== previous) {
        var isHit = value < previous;
        fillEl.classList.toggle('is-hit', isHit);
        valEl.classList.toggle('is-hit', isHit);
        flashHealth(fillEl);
        flashHealth(valEl);
      }
    }

    function setHealth(v) {
      var next = clamp(v, 0, MAX_HP);
      updateHealthDisplay(healthFill, healthVal, healthTrail, next, health);
      health = next;
    }

    function setAiHealth(v) {
      var next = clamp(v, 0, MAX_HP);
      updateHealthDisplay(aiHealthFill, aiHealthVal, aiHealthTrail, next, aiHealth);
      aiHealth = next;
    }

    // Live word-by-word highlighting while typing — same highlight classes
    // and classifier the hero demo widget uses for its scripted reveal.
    function renderHighlight() {
      var value = textarea.value;
      highlightLayer.innerHTML = value ? classifyText(value).html : '';
      highlightLayer.scrollTop = textarea.scrollTop;
    }
    textarea.addEventListener('input', renderHighlight);
    textarea.addEventListener('input', checkTokenBudget);

    // Point of Order — see the constants above for why this is a debounced
    // local check rather than a real mid-keystroke read. showPointOfOrder()/
    // hidePointOfOrder() follow the exact same hidden+is-visible pattern as
    // the AI "is responding" indicator (`typing`) elsewhere in this file.
    function showPointOfOrder(message) {
      if (!pointOfOrderEl) return;
      pointOfOrderTextEl.textContent = message;
      pointOfOrderEl.hidden = false;
      requestAnimationFrame(function () { pointOfOrderEl.classList.add('is-visible'); });
      poiVisible = true;
    }

    function hidePointOfOrder() {
      if (!pointOfOrderEl || !poiVisible) return;
      pointOfOrderEl.classList.remove('is-visible');
      pointOfOrderEl.hidden = true;
      poiVisible = false;
    }

    function dismissPointOfOrder(signature) {
      poiDismissedSignature = signature;
      hidePointOfOrder();
    }

    function stopInterruptionCheck() {
      if (poiTimer) { clearTimeout(poiTimer); poiTimer = null; }
    }

    // Reads the draft currently sitting in the textarea (never the submitted
    // history) through the same classifyText() used for the live highlighter
    // and the real scoring path — a hedge-heavy, still-short-of-a-reason
    // draft is exactly what already costs Credibility/Logic/Precision on
    // submit, this just surfaces that a beat before the player sends it.
    function runInterruptionCheck() {
      poiTimer = null;
      // Rookie has allowPointOfOrder:false in CUSSATOR_CONFIG.DIFFICULTY_TIERS
      // — no scaffolding-removal pressure at that tier, so this whole check
      // is skipped rather than just never firing visibly.
      if (roundOver || !playerSide || textarea.disabled || !getDifficultyTier().allowPointOfOrder) {
        hidePointOfOrder();
        return;
      }

      var analysis = classifyText(textarea.value);
      var fillerHits = analysis.fillerCount + analysis.fillerLightCount;
      var signature = analysis.fillerWordsUsed.join(',') + '|' + analysis.wordCount;

      // "More than this many fillers" (CUSSATOR_CONFIG.INTERRUPTION_THRESHOLD
      // .fillerCount) — a strictly-greater-than check, so the default
      // threshold of 2 means 3+ filler hits in the draft trigger this.
      if (analysis.wordCount < POINT_OF_ORDER_MIN_WORDS || fillerHits <= CUSSATOR_CONFIG.INTERRUPTION_THRESHOLD.fillerCount) {
        poiDismissedSignature = null; // the flagged draft got edited away, re-arm for next time
        hidePointOfOrder();
        return;
      }
      if (signature === poiDismissedSignature) return; // player already dismissed this exact draft

      if (!poiVisible) {
        var message = POINT_OF_ORDER_MESSAGES[Math.floor(Math.random() * POINT_OF_ORDER_MESSAGES.length)];
        showPointOfOrder(message);
      }
    }

    function scheduleInterruptionCheck() {
      stopInterruptionCheck();
      poiTimer = setTimeout(runInterruptionCheck, POINT_OF_ORDER_DEBOUNCE_MS);
    }

    textarea.addEventListener('input', scheduleInterruptionCheck);
    if (pointOfOrderDismissBtn) {
      pointOfOrderDismissBtn.addEventListener('click', function () {
        var analysis = classifyText(textarea.value);
        dismissPointOfOrder(analysis.fillerWordsUsed.join(',') + '|' + analysis.wordCount);
      });
    }

    textarea.addEventListener('scroll', function () {
      highlightLayer.scrollTop = textarea.scrollTop;
    });

    // Motion text truncates to one line with an ellipsis by default (see
    // .cuss-arena-motion in styles.css) — tap/click, or Enter/Space while
    // focused, toggles the full wrapped text. The native title attribute
    // (set alongside MOTION in resetRound()) already covers desktop hover,
    // so this only needs to handle the tap/keyboard case.
    if (motionEl) {
      motionEl.addEventListener('click', function () {
        motionEl.classList.toggle('is-expanded');
      });
      motionEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          motionEl.classList.toggle('is-expanded');
        }
      });
    }

    // Live Scars counter — same roundFillerWords tally the post-round recap
    // already reads (see the recap-building code below), just surfaced live.
    // Called after every submit (see the submit handler) and reset in
    // resetRound(). Hidden entirely while the round has no filler hits yet.
    function renderLiveScars() {
      if (!liveScarsEl) return;
      var words = Object.keys(roundFillerWords);
      if (!words.length) {
        liveScarsEl.hidden = true;
        liveScarsEl.innerHTML = '';
        return;
      }
      liveScarsEl.innerHTML = words
        .sort(function (a, b) { return roundFillerWords[b] - roundFillerWords[a]; })
        .map(function (w) {
          return '<span class="cuss-live-scars-item">' + escapeHtml(w) + ' ×' + roundFillerWords[w] + '</span>';
        })
        .join('');
      liveScarsEl.hidden = false;
    }
    // Quick scale-down-and-back on the Send keycap, like a physical key
    // being pressed — .btn has no :active transform of its own, so a real
    // mouse click wouldn't otherwise show any press feedback either.
    function flashSendKey() {
      submitBtn.classList.remove('is-pressed');
      void submitBtn.offsetWidth; // reflow so back-to-back presses each replay it
      submitBtn.classList.add('is-pressed');
      setTimeout(function () { submitBtn.classList.remove('is-pressed'); }, SEND_KEY_PRESS_DURATION);
    }
    submitBtn.addEventListener('click', flashSendKey);
    // Enter sends, same as clicking Send — Shift+Enter still inserts a
    // newline for the rare multi-line argument. requestSubmit() (rather
    // than calling the handler directly) still runs the form's own
    // validation/guard clauses below, same as a real click would. The
    // button itself never receives this keystroke (the textarea does), so
    // without flashSendKey() here it would sit inert while a physical
    // Enter key visibly depresses.
    textarea.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        flashSendKey();
        form.requestSubmit();
      }
    });

    // Blocks pasting into the argument box specifically — the whole point
    // of the round is typing under pressure, so a pasted paragraph would
    // skip that entirely. Scoped to this one textarea only (Pitch mode's
    // own input is untouched). A plain 'paste' listener + preventDefault,
    // with a brief toast explaining why nothing happened rather than
    // failing silently.
    var pasteBlockedTimer = null;
    if (pasteBlockedEl) {
      textarea.addEventListener('paste', function (e) {
        // Rookie is the one tier where CUSSATOR_CONFIG.DIFFICULTY_TIERS
        // allows pasting — let the browser's default paste happen there
        // instead of blocking it.
        if (!getDifficultyTier().pastingDisabled) return;
        e.preventDefault();
        clearTimeout(pasteBlockedTimer);
        pasteBlockedEl.hidden = false;
        requestAnimationFrame(function () { pasteBlockedEl.classList.add('is-visible'); });
        pasteBlockedTimer = setTimeout(function () {
          pasteBlockedEl.classList.remove('is-visible');
          pasteBlockedTimer = setTimeout(function () { pasteBlockedEl.hidden = true; }, 200);
        }, 2000);
      });
    }

    // Insert-from-Bag — a text-insertion shortcut only, nothing more. This
    // never touches HP, the timer, or scoring: it just splices the chosen
    // word into the textarea like a fast typist would, then dispatches a
    // real 'input' event so the existing renderHighlight()/checkTokenBudget()
    // listeners above pick it up exactly as if the player had typed it —
    // no separate detection or scoring path for Bag-inserted words at all.
    // Uses loadBag() (see Bag's own storage functions higher up) read-only;
    // never writes to it.
    if (bagInsertBtn && bagInsertPopover && bagInsertList) {
      function closeBagInsertPopover() {
        bagInsertPopover.hidden = true;
      }

      function renderBagInsertList() {
        var bag = loadBag();
        var entries = Object.keys(bag)
          .map(function (w) { return { word: w, count: bag[w] }; })
          .sort(function (a, b) { return b.count - a.count; });

        bagInsertList.innerHTML = '';

        if (!entries.length) {
          var empty = document.createElement('p');
          empty.className = 'cuss-recap-clean';
          empty.textContent = 'No words in your Bag yet.';
          bagInsertList.appendChild(empty);
          return;
        }

        entries.forEach(function (entry) {
          var row = document.createElement('button');
          row.type = 'button';
          row.className = 'cuss-bag-insert-word';
          row.textContent = entry.word + ' ×' + entry.count;
          row.addEventListener('click', function () {
            closeBagInsertPopover();
            playCardPullAnimation(entry.word);
          });
          bagInsertList.appendChild(row);
        });
      }

      function openBagInsertPopover() {
        if (textarea.disabled) return;
        renderBagInsertList();
        bagInsertPopover.hidden = false;
      }

      bagInsertBtn.addEventListener('click', function () {
        if (bagInsertPopover.hidden) openBagInsertPopover();
        else closeBagInsertPopover();
      });
      document.addEventListener('click', function (e) {
        if (!bagInsertPopover.hidden
          && !bagInsertPopover.contains(e.target)
          && e.target !== bagInsertBtn && !bagInsertBtn.contains(e.target)) {
          closeBagInsertPopover();
        }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !bagInsertPopover.hidden) closeBagInsertPopover();
      });
      // Tab toggles the same Insert-from-Bag popover the button opens —
      // an additional shortcut, not a replacement. Scoped to the textarea
      // itself (not document-wide) so Tab still does normal focus
      // navigation everywhere else on the page, and only hijacked here
      // while the input is actually usable (textarea.disabled covers both
      // "round hasn't started" and "waiting on the AI").
      textarea.addEventListener('keydown', function (e) {
        if (e.key === 'Tab' && !textarea.disabled) {
          e.preventDefault();
          if (bagInsertPopover.hidden) openBagInsertPopover();
          else closeBagInsertPopover();
        }
      });

      // Splices the word in at the cursor (or appends it, if the textarea
      // never had focus) with natural spacing, then fires the same 'input'
      // event a real keystroke would — this IS the entire integration
      // point with round logic; everything downstream (highlighting,
      // Word Economy, and the classifyText() scoring pass on submit) is
      // the existing pipeline running unmodified on ordinary text.
      function insertWordAtCursor(word) {
        var start = typeof textarea.selectionStart === 'number' ? textarea.selectionStart : textarea.value.length;
        var end = typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : textarea.value.length;
        var before = textarea.value.slice(0, start);
        var after = textarea.value.slice(end);
        var needsLeadingSpace = before.length > 0 && !/\s$/.test(before);
        var needsTrailingSpace = after.length > 0 && !/^\s/.test(after);
        var insert = (needsLeadingSpace ? ' ' : '') + word + (needsTrailingSpace ? ' ' : '');

        textarea.value = before + insert + after;
        var cursor = before.length + insert.length;
        textarea.focus();
        textarea.setSelectionRange(cursor, cursor);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // The "pulling a card" animation — purely cosmetic, blocks nothing:
      // the word is only actually inserted once the card finishes flying
      // into the input. Reuses the same lips mark used for the loading
      // animation/token counter elsewhere (see cussator-mark.svg) as the
      // card's face-down back, flipped via a real 3D transform to reveal
      // the word, then flown into the textarea. A transient DOM node,
      // built and torn down entirely in JS — nothing persists.
      var CARD_PULL_APPEAR_MS = 220;
      var CARD_PULL_FLIP_MS = 420;
      var CARD_PULL_HOLD_MS = 450;
      var CARD_PULL_FLY_MS = 380;

      function playCardPullAnimation(word, originEl) {
        var originRect = (originEl || bagInsertBtn).getBoundingClientRect();
        var targetRect = textarea.getBoundingClientRect();
        var cardWidth = 108;
        var cardHeight = 140;
        var originX = originRect.left + originRect.width / 2 - cardWidth / 2;
        var originY = originRect.top + originRect.height / 2 - cardHeight / 2;
        var targetX = targetRect.left + targetRect.width / 2 - cardWidth / 2;
        var targetY = targetRect.top + targetRect.height / 2 - cardHeight / 2;

        var card = document.createElement('div');
        card.className = 'cuss-card-pull';
        card.style.left = originX + 'px';
        card.style.top = originY + 'px';
        card.style.width = cardWidth + 'px';
        card.style.height = cardHeight + 'px';
        card.innerHTML =
          '<div class="cuss-card-pull-inner">' +
            '<div class="cuss-card-pull-face cuss-card-pull-back">' +
              '<svg viewBox="0 0 160 120" aria-hidden="true">' +
                '<path d="M16 60 C16 42,48 34,68 36 C74 37,76 42,80 42 C84 42,86 37,92 36 C112 34,144 42,144 60 C144 60,105 50,80 50 C55 50,16 60,16 60 Z" fill="currentColor"/>' +
                '<path d="M16 60 C16 82,46 90,80 90 C114 90,144 82,144 60 C144 60,105 70,80 70 C55 70,16 60,16 60 Z" fill="currentColor"/>' +
              '</svg>' +
            '</div>' +
            '<div class="cuss-card-pull-face cuss-card-pull-front">' +
              '<span class="cuss-card-pull-front-word"></span>' +
            '</div>' +
          '</div>';
        card.querySelector('.cuss-card-pull-front-word').textContent = word;
        document.body.appendChild(card);

        void card.offsetWidth; // reflow so the appear transition below actually plays
        card.classList.add('is-visible');

        setTimeout(function () {
          // Flip to reveal the word while drifting up slightly — the flip
          // and the move happen together, like the card is being turned
          // over as it's drawn.
          card.classList.add('is-flipped');
          card.style.transform = 'translateY(-14px) scale(1.08)';
        }, CARD_PULL_APPEAR_MS);

        setTimeout(function () {
          // Fly into the input and fade — insertion happens right as this
          // finishes, so the word "arrives" the moment the card vanishes.
          card.classList.add('is-flying');
          card.style.left = targetX + 'px';
          card.style.top = targetY + 'px';
          card.style.transform = 'translateY(0) scale(0.4)';
        }, CARD_PULL_APPEAR_MS + CARD_PULL_FLIP_MS + CARD_PULL_HOLD_MS);

        setTimeout(function () {
          card.remove();
          insertWordAtCursor(word);
        }, CARD_PULL_APPEAR_MS + CARD_PULL_FLIP_MS + CARD_PULL_HOLD_MS + CARD_PULL_FLY_MS);
      }

      // Chat Bag shelf — persistent hotbar alongside (not replacing) the
      // popover above. Same loadBag() data, same insertWordAtCursor()/
      // playCardPullAnimation() as the popover's own rows; a chip just
      // passes itself as the animation's origin instead of bagInsertBtn.
      // Kept in sync via onBagUpdate() (fires from updateBagBadge(), the
      // existing single choke point every Bag-crediting call already
      // funnels through) plus a direct call from resetRound() so it's
      // populated the moment a round opens, not just after the next credit.
      renderBagShelf = function () {
        if (!bagShelfEl) return;
        var bag = loadBag();
        var entries = Object.keys(bag)
          .map(function (w) { return { word: w, count: bag[w] }; })
          .sort(function (a, b) { return b.count - a.count; });

        bagShelfEl.innerHTML = '';
        bagShelfEl.hidden = !entries.length;
        if (!entries.length) return;

        entries.forEach(function (entry) {
          var chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'cuss-bag-shelf-chip';
          chip.setAttribute('aria-label', 'Insert "' + entry.word + '" into your argument');
          var wordSpan = document.createElement('span');
          wordSpan.textContent = entry.word;
          var countSpan = document.createElement('span');
          countSpan.className = 'cuss-bag-shelf-chip-count';
          countSpan.textContent = '×' + entry.count;
          chip.appendChild(wordSpan);
          chip.appendChild(countSpan);
          chip.addEventListener('click', function () {
            if (textarea.disabled) return;
            playCardPullAnimation(entry.word, chip);
          });
          bagShelfEl.appendChild(chip);
        });
      };
      onBagUpdate(renderBagShelf);
    }

    // Opens the arena WITHOUT its usual 0.2s opacity fade — the fade is
    // disabled just for this one open (restored right after, so closing
    // still fades out normally). Needed now that "Entering the Chat" plays
    // on .cuss-stance-select, a child of this same arena: if the arena
    // itself faded in over 0.2s, the animation's very first frame would be
    // partially see-through and the homepage would show behind it, the
    // exact bug already fixed once for the old separate-overlay version of
    // this transition.
    function openArena() {
      resetRound();
      arena.style.transition = 'none';
      arena.classList.add('is-open');
      void arena.offsetWidth; // flush the instant, transition-less open
      arena.style.transition = '';
      arena.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    // Plays once on every Chat click, hosted directly on the round-setup
    // screen (.cuss-stance-select, see "Entering the Chat" in styles.css)
    // instead of a separate overlay that used to crossfade into it —
    // exactly the two-screens-with-a-handoff pattern that caused the
    // original flash-of-homepage bug. There's no second screen to hand off
    // to anymore: the lip/ball/label animate themselves to invisible via
    // their own existing keyframes (unchanged timing), then
    // .cuss-stance-content fades in on this same element the instant
    // is-entering comes off, all within one continuously-visible,
    // continuously-opaque .cuss-stance-select.
    function playEnterThenOpen() {
      if (entering) return; // ignore repeat Chat clicks mid-sequence
      entering = true;
      openArena();
      stanceSelectEl.classList.remove('is-entering');
      void stanceSelectEl.offsetWidth; // reflow so a repeat click restarts the keyframes
      stanceSelectEl.classList.add('is-entering');
      setTimeout(function () {
        stanceSelectEl.classList.remove('is-entering'); // reveals .cuss-stance-content, see CSS
        stanceAffirmBtn.focus();
        entering = false;
      }, ENTER_ANIM_DURATION);
    }
    function closeArena() {
      stopTurnTimer();
      arena.classList.remove('is-open');
      arena.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    openBtns.forEach(function (btn) { if (btn) btn.addEventListener('click', playEnterThenOpen); });
    if (closeBtn) closeBtn.addEventListener('click', closeArena);
    if (gameoverRestartBtn) gameoverRestartBtn.addEventListener('click', resetRound);
    if (stanceAffirmBtn) stanceAffirmBtn.addEventListener('click', function () { chooseStance('affirm'); });
    if (stanceNegateBtn) stanceNegateBtn.addEventListener('click', function () { chooseStance('negate'); });
    difficultyBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (playerSide) return;
        setDifficulty(btn.dataset.difficulty);
      });
    });
    arena.addEventListener('click', function (e) { if (e.target === arena) closeArena(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && arena.classList.contains('is-open')) closeArena();
    });

    // Same per-token stagger as the hero demo widget's revealTokens() (160ms
    // a step) — reveals the submitted argument word by word ("breakdown") before
    // the AI card is allowed to appear. Uses opacity instead of demo's
    // color:transparent so the "vocab" tag (its own explicit color) fades in
    // together with its word rather than popping in ahead of it.
    function addUserBubbleAnimated(html, onDone) {
      var empty = transcript.querySelector('.cuss-arena-empty');
      if (empty) empty.remove();
      var anchor = transcript.querySelector('.cuss-transcript-anchor');
      if (anchor) anchor.remove();
      transcript.classList.remove('is-empty');

      var p = document.createElement('p');
      p.className = 'cuss-bubble-user';
      transcript.appendChild(p);
      requestAnimationFrame(function () { p.classList.add('is-visible'); });

      var temp = document.createElement('div');
      temp.innerHTML = html;
      var revealEls = [];

      Array.prototype.forEach.call(temp.childNodes, function (node) {
        if (node.nodeType === 3) {
          var parts = node.textContent.match(/\S+|\s+/g) || [];
          parts.forEach(function (part) {
            if (/^\s+$/.test(part)) {
              p.appendChild(document.createTextNode(part));
            } else {
              var span = document.createElement('span');
              span.textContent = part;
              span.style.opacity = '0';
              span.style.transition = 'opacity 0.2s ease';
              p.appendChild(span);
              revealEls.push(span);
            }
          });
        } else if (node.nodeType === 1) {
          var clone = node.cloneNode(true);
          clone.style.opacity = '0';
          clone.style.transition = 'opacity 0.2s ease';
          p.appendChild(clone);
          revealEls.push(clone);
        }
      });

      transcript.scrollTop = transcript.scrollHeight;

      // Total reveal budget capped low regardless of argument length. The
      // old fixed 160ms-per-token step scaled unboundedly with a longer
      // argument (~4.5s for a normal 28-word one) — the bubble is already
      // laid out at its full, final size from the moment it's appended
      // (every span is in the DOM up front, just at opacity 0, so wrapping
      // and box height are already correct), but for that whole multi-
      // second stretch most of it sits blank, which reads as the argument
      // being cut off rather than a quick reveal. Clamped per-step so a
      // short argument still gets a visible stagger (floor) and a long one
      // never drags on (ceiling).
      var REVEAL_BUDGET_MS = 450;
      var stepMs = revealEls.length ? clamp(REVEAL_BUDGET_MS / revealEls.length, 15, 60) : 0;

      var i = 0;
      function reveal() {
        if (i >= revealEls.length) {
          // Post-submit-only filler flagging: classifyText() already ran
          // before this bubble was built (see the submit handler), wrapping
          // each hit in .cuss-weak — this just plays a one-time flash+shake
          // on those already-classified spans now that the bubble has
          // finished animating in. No new detection pass, and nothing here
          // runs per keystroke.
          var flagged = p.querySelectorAll('.cuss-weak');
          Array.prototype.forEach.call(flagged, function (span) {
            span.classList.add('is-flagged');
          });
          if (flagged.length) {
            setTimeout(function () {
              Array.prototype.forEach.call(flagged, function (span) {
                span.classList.remove('is-flagged');
              });
            }, 650);
          }
          if (onDone) onDone();
          return;
        }
        revealEls[i].style.opacity = '1';
        i++;
        transcript.scrollTop = transcript.scrollHeight;
        setTimeout(reveal, stepMs);
      }
      reveal();
    }

    // Reuses the demo widget's "AI opponent rebuts" card — same
    // .cuss-ai-card / .cuss-ai-label markup and .is-visible fade-in.
    // rawText (the AI's plain, unhighlighted reply) is only needed for the
    // Simplify action — omit it (or play Chair) and no button is rendered.
    function addAiCard(html, label, rawText) {
      var card = document.createElement('div');
      card.className = 'cuss-ai-card cuss-bubble-ai';

      // Reminds the player which difficulty tier they're actually facing —
      // reuses the app's existing .tag/.tag-outline look (same classes as
      // the arena header's LIVE ROUND / timer tags) rather than a new tag
      // style, so it reads as part of the same visual language.
      var difficultyTag = document.createElement('span');
      difficultyTag.className = 'tag tag-outline cuss-ai-difficulty-tag';
      difficultyTag.textContent = 'AI ' + difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
      card.appendChild(difficultyTag);

      var head = document.createElement('div');
      head.className = 'cuss-ai-card-head';
      var labelEl = document.createElement('p');
      labelEl.className = 'cuss-ai-label';
      labelEl.textContent = label || 'AI opponent rebuts';
      head.appendChild(labelEl);

      var body = document.createElement('p');
      body.className = 'cuss-ai-body';
      body.innerHTML = html;

      // Simplify re-renders THIS message in plainer English — not a free
      // toggle, it spends from the same Word Economy pool as everything
      // else (see checkTokenBudget()), and it's absent entirely in Chair
      // mode, which is opt-in hard mode with no scaffolding.
      if (difficulty !== 'chair' && rawText) {
        var simplifyBtn = document.createElement('button');
        simplifyBtn.type = 'button';
        simplifyBtn.className = 'cuss-simplify-btn';
        simplifyBtn.textContent = 'Simplify (' + SIMPLIFY_COST + ')';
        simplifyBtn.title = 'Re-render this message in plainer English — costs ' +
          SIMPLIFY_COST + ' tokens from your Word Economy pool.';
        simplifyBtn.addEventListener('click', function () {
          if (simplifyBtn.disabled || roundOver) return;
          var remaining = getTokenPoolSize() - tokensUsed;
          if (remaining < SIMPLIFY_COST) {
            var original = simplifyBtn.textContent;
            simplifyBtn.textContent = 'Not enough tokens';
            setTimeout(function () { simplifyBtn.textContent = original; }, 1500);
            return;
          }
          simplifyBtn.disabled = true;
          simplifyBtn.textContent = 'Simplifying…';
          fetch('/api/simplify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: rawText })
          })
            .then(function (res) {
              return res.json().then(function (data) { return { ok: res.ok, data: data }; });
            })
            .catch(function () {
              return { ok: false, data: { error: 'Failed to reach the server.' } };
            })
            .then(function (result) {
              if (!result.ok) {
                simplifyBtn.disabled = false;
                simplifyBtn.textContent = 'Simplify (' + SIMPLIFY_COST + ')';
                return;
              }
              body.innerHTML = classifyText(result.data.reply).html;
              tokensUsed += SIMPLIFY_COST;
              checkTokenBudget();
              simplifyBtn.textContent = 'Simplified';
              simplifyBtn.classList.add('is-done');
            });
        });
        head.appendChild(simplifyBtn);
      }

      card.appendChild(head);
      card.appendChild(body);
      transcript.appendChild(card);
      transcript.scrollTop = transcript.scrollHeight;
      requestAnimationFrame(function () { card.classList.add('is-visible'); });
    }

    function addError(message) {
      var p = document.createElement('p');
      p.className = 'cuss-arena-error';
      p.textContent = message;
      transcript.appendChild(p);
      transcript.scrollTop = transcript.scrollHeight;
    }

    // Judge scores the user's own performance across the round so far — it
    // does not take a side in the argument, just grades it. Same 14-step /
    // 40ms stepped fill the demo widget's animateJudge() uses.
    //
    // No flat baseline: a round with no real turns yet (or a turn that's
    // not actually an argument, like "hey") scores 0, not a comfortable
    // default — a fixed baseline used to show up even for zero-signal input,
    // which read as a false "not bad" score for a non-argument. Logic is
    // now driven by the AI's own solid/neutral/bad verdict on the turn (the
    // one signal that actually reflects whether the reasoning held up),
    // not just filler/connective counts, which used to leave Logic blind to
    // whether an "argument" was an argument at all.
    //
    // Precision used to be JUST roundStats.vocab * 9 — a hard match against
    // the ~350-word VOCAB_WORDS list and nothing else, with no floor tied to
    // actual argument quality the way Logic has via verdictAvg. Two equally
    // precise arguments that happened to phrase things with different
    // (both legitimate) advanced words could score 0 and 18 purely on
    // whether their specific word choice happened to land in that fixed
    // list — indistinguishable from a genuinely vague turn to this metric.
    // Giving it the same verdictAvg floor Logic has (smaller weight, so it
    // stays a distinct signal, not a Logic clone) means a precise,
    // well-supported turn scores reasonably even if the classifier doesn't
    // recognize its exact vocabulary; matched vocab words still add on top,
    // so using tracked terms is still rewarded, just no longer the only way
    // to avoid a near-zero score for filler-free, on-topic precision.
    function computeJudgeTargets() {
      return computeJudgeScores(roundStats);
    }

    // inlineValEl is the one-line summary's own score span (see
    // #cuss-arena-judge in index.html) — kept in sync with the exact same
    // number the popover's bar/value shows, just also surfaced where the
    // player can actually see it without opening anything.
    function setJudgeBar(fillEl, valEl, inlineValEl, v) {
      fillEl.style.width = v + '%';
      valEl.textContent = v;
      if (inlineValEl) inlineValEl.textContent = v;
    }

    function revealJudge() {
      var targets = computeJudgeTargets();
      judgePanel.hidden = false;
      judgePanel.classList.add('is-visible');
      if (judgeAnimTimer) clearTimeout(judgeAnimTimer);

      var n = 14;
      var step = 0;
      function tick() {
        var p = Math.min(step, n) / n;
        setJudgeBar(judgeLogicFill, judgeLogicVal, judgeLogicValInline, Math.round(targets.logic * p));
        setJudgeBar(judgePrecisionFill, judgePrecisionVal, judgePrecisionValInline, Math.round(targets.precision * p));
        setJudgeBar(judgeDeliveryFill, judgeDeliveryVal, judgeDeliveryValInline, Math.round(targets.delivery * p));
        if (step < n) {
          step++;
          judgeAnimTimer = setTimeout(tick, 40);
        }
      }
      tick();
    }

    // Hands a plain snapshot of this round's data to the standalone
    // dashboard module (see initDashboard() / dashboardApi) — everything
    // it needs to render the HP/WPM/word-category charts and score cards,
    // gathered from state this closure already tracks (turnLog, hpHistory,
    // roundStats/aiRoundStats, computeJudgeTargets()). critique is left out
    // here; only Elevator Pitch mode (Feature 4) sets it.
    function buildDashboardPayload() {
      return {
        motion: MOTION,
        playerWon: lastRoundPlayerWon,
        hpHistory: hpHistory,
        turnLog: turnLog,
        wordCategories: {
          you: { filler: roundStats.filler, connective: roundStats.connective, vocab: roundStats.vocab },
          ai: { filler: aiRoundStats.filler, connective: aiRoundStats.connective, vocab: aiRoundStats.vocab }
        },
        scores: computeJudgeTargets(),
        critique: null
      };
    }

    if (gameoverReportBtn) {
      gameoverReportBtn.addEventListener('click', function () {
        if (!dashboardApi) return;
        dashboardApi.open(buildDashboardPayload(), { onRematch: resetRound });
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (roundOver || !playerSide) return;
      var text = textarea.value.trim();
      if (!text) return;

      stopInterruptionCheck();
      hidePointOfOrder();
      poiDismissedSignature = null;

      // WPM for this turn — elapsed time since the textarea was last handed
      // back to the player (see turnStartTime/startTurnTimer above), floored
      // at 1s so a near-instant send can't read as an absurd words-per-minute
      // spike. Computed here, before setHealth() below changes anything,
      // purely from the timestamp and the word count classifyText() already
      // produces for the highlighter/scoring.
      var elapsedMs = Math.max(Date.now() - (turnStartTime || Date.now()), 1000);

      var analysis = classifyText(text);
      var userWpm = Math.round(analysis.wordCount / (elapsedMs / 60000));

      // Floating penalty pill — same fillerCount/fillerLightCount
      // classifyText() already produced above (no second detection pass).
      // Priced flat at CUSSATOR_CONFIG.HP_PENALTIES.filler per word, not a
      // blend with the light tier's own lower FILLER_PENALTY_LIGHT rate —
      // the shared config only defines one filler severity, and this is
      // the one place that number must never drift from it. The
      // light-tier words (see FILLER_WORDS_LIGHT) still cost their own
      // lower amount on the actual HP bar below, same as always; on a
      // turn that mixes a light-tier word in with real fillers, this
      // pill's total can read slightly higher than that exact deduction —
      // an accepted tradeoff for a single, never-hardcoded number here.
      showFillerPenaltyPill(
        analysis.fillerCount + analysis.fillerLightCount,
        (analysis.fillerCount + analysis.fillerLightCount) * FILLER_PENALTY
      );

      // Split Battle Engine's local filter — see scanForFillers() above.
      // Sent up with the request below so the server can decide whether
      // the AI's reply should open with a quote-and-mock, without paying
      // for a second round of filler detection there.
      var localFillerResult = scanForFillers(text);

      // Records exactly one dashboard entry for this submission, whatever
      // the closure's health/aiHealth/turnLog.length happen to be at the
      // moment it's called — called from every exit point below (self-KO,
      // a KO landing mid-exchange, or full normal completion) so the
      // post-round dashboard still has real data even for a round that
      // ended abruptly.
      function finalizeTurn(aiWords, userVerdict, aiVerdict) {
        turnLog.push({
          index: turnLog.length + 1,
          userWords: analysis.wordCount,
          userWpm: userWpm,
          userVerdict: userVerdict,
          aiVerdict: aiVerdict,
          aiWords: aiWords,
          health: health,
          aiHealth: aiHealth
        });
        hpHistory.push({ turnIndex: turnLog.length, health: health, aiHealth: aiHealth });
      }

      // Everything this submit mutates before the AI has answered, captured
      // so a failed request (see rollbackTurn() below) can undo the turn
      // completely instead of charging the player for a reply they never got.
      var turnSnapshot = {
        health: health,
        tokensUsed: tokensUsed,
        historyLength: history.length,
        roundStats: Object.assign({}, roundStats),
        roundFillerWords: Object.assign({}, roundFillerWords),
        scars: loadVocabScars(),
        connectorLog: loadConnectorLog()
      };

      function rollbackTurn() {
        setHealth(turnSnapshot.health);
        tokensUsed = turnSnapshot.tokensUsed;
        history.length = turnSnapshot.historyLength;
        Object.keys(roundStats).forEach(function (k) { roundStats[k] = turnSnapshot.roundStats[k]; });
        roundFillerWords = turnSnapshot.roundFillerWords;
        try {
          localStorage.setItem(VOCAB_SCARS_KEY, JSON.stringify(turnSnapshot.scars));
          localStorage.setItem(CONNECTOR_LOG_KEY, JSON.stringify(turnSnapshot.connectorLog));
        } catch (err) { /* localStorage unavailable — nothing was persisted to undo */ }
        renderLiveScars();
        // Hand the argument back so it can be resent as-is, and drop the
        // bubble so a resend doesn't show it twice.
        var bubbles = transcript.querySelectorAll('.cuss-bubble-user');
        if (bubbles.length) bubbles[bubbles.length - 1].remove();
        textarea.value = text;
        renderHighlight();
        checkTokenBudget();
      }

      setHealth(health + analysis.delta);
      // Reserved for an actual interruption-level hit (the same
      // CUSSATOR_CONFIG.INTERRUPTION_THRESHOLD.fillerCount threshold
      // scanForFillers() already checked above, or any curse word — a
      // curse is always interruption-worthy regardless of count), not
      // fired on every single filler word the way it used to be. A lone
      // filler still docks Credibility and shows the penalty pill above;
      // it just doesn't rattle the whole screen for one word anymore.
      if (localFillerResult.triggerInterruption || analysis.curseCount > 0) {
        triggerScreenShake();
      }
      roundStats.filler += analysis.fillerCount + analysis.fillerLightCount;
      roundStats.curse += analysis.curseCount;
      roundStats.connective += analysis.connectiveCount;
      roundStats.vocab += analysis.vocabCount;
      roundStats.words += analysis.wordCount;
      analysis.fillerWordsUsed.forEach(function (w) {
        roundFillerWords[w] = (roundFillerWords[w] || 0) + 1;
      });
      renderLiveScars();
      recordFillerWords(analysis.fillerWordsUsed);
      // Bag crediting is deliberately NOT instant anymore — it used to fire
      // right here off the same exact-match list that's still used for
      // live highlighting and the round's own Precision score (that part
      // is untouched; roundStats.vocab above still comes from this local
      // match, same as always). The persistent Bag collection now waits
      // for the AI's contextual read on THIS argument (see
      // vocab_words_used in the /api/respond response, credited in the
      // success handler below) so a word only gets collected if it was
      // actually used correctly, not just present in the sentence. See
      // creditBagWords()/creditBagWordsWithInfo() and their call sites for
      // the fallback paths (self-KO, API failure) that still use this
      // local list when no AI judgment is coming.
      recordConnectiveWords(analysis.connectiveWordsUsed);
      tokensUsed += countWordTokens(text);

      history.push({ role: 'user', content: text });
      textarea.value = '';
      renderHighlight();
      textarea.disabled = true;
      submitBtn.disabled = true;
      if (bagInsertBtn) bagInsertBtn.disabled = true;
      stopTurnTimer();
      checkTokenBudget();

      // A speaker can only self-KO from their own word-level hits, so this
      // can already be decided before the AI is even asked to respond.
      if (checkGameOver()) {
        finalizeTurn(0, null, null);
        // No AI response is ever coming for this turn, so there's no
        // contextual read to wait for — fall back to the local exact-match
        // list rather than losing Bag credit entirely on a self-KO.
        creditBagWords(analysis.vocabWordsUsed);
        addUserBubbleAnimated(analysis.html, function () {});
        return;
      }

      // Fire the request in parallel with the reveal animation so the two
      // don't add up — the AI card still waits for both to finish.
      var respondPromise = fetch('/api/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motion: MOTION, argument: text, history: history, side: playerSide, difficulty: difficulty,
          wordOfDay: currentWordOfDay ? currentWordOfDay.word : '',
          wordOfDayDef: currentWordOfDay ? currentWordOfDay.def : '',
          localFillerResult: localFillerResult
        })
      })
        .then(function (res) {
          return res.json().then(function (data) { return { ok: res.ok, data: data }; });
        })
        .catch(function () {
          return { ok: false, data: { error: 'Failed to reach the server. Make sure server.py is running.' } };
        });

      addUserBubbleAnimated(analysis.html, function () {
        typing.hidden = false;
        requestAnimationFrame(function () { typing.classList.add('is-visible'); });
        respondPromise.then(function (result) {
          typing.hidden = true;
          typing.classList.remove('is-visible');
          if (!result.ok) {
            // No reply came back, so this turn never happened: HP, tokens,
            // tallies and history are restored and the text is put back in
            // the box. No Bag credit either — the resend will earn it.
            rollbackTurn();
            addError((result.data.error || 'Failed to get a response from the AI opponent.') +
              " Your turn wasn't counted.");
            textarea.disabled = false;
            submitBtn.disabled = false;
            if (bagInsertBtn) bagInsertBtn.disabled = false;
            textarea.focus();
            startTurnTimer();
            return;
          }

          // Bag crediting for THIS turn, now that the AI has actually
          // weighed in — vocab_words_used is only present when the model
          // returned it (older/degraded responses might not), so an array
          // check rather than a truthiness check distinguishes "the AI
          // legitimately found nothing this turn" (a real, correct empty
          // array — credit nothing) from "this field isn't there at all"
          // (fall back to the local list rather than losing credit).
          if (Array.isArray(result.data.vocab_words_used)) {
            creditBagWordsWithInfo(result.data.vocab_words_used);
          } else {
            creditBagWords(analysis.vocabWordsUsed);
          }

          // The AI's holistic verdict on the user's own turn — can push the
          // player's Credibility the rest of the way to 0 (bad) or land the
          // symmetric strong-argument hit on the AI (solid). Also feeds the
          // Judge panel's Logic score (see computeJudgeTargets) —
          // that's the only signal there that reflects whether the turn was
          // an actual argument at all, not just its word choice.
          if (result.data.user_argument_verdict === 'solid') roundStats.solid++;
          else if (result.data.user_argument_verdict === 'bad') roundStats.bad++;
          else roundStats.neutral++;
          applyVerdict(result.data.user_argument_verdict, true, result.data.fallacy_type);
          if (checkGameOver()) { finalizeTurn(0, result.data.user_argument_verdict, null); return; }

          var aiAnalysis = classifyText(result.data.reply);
          // Parallel tally to roundStats, but for the AI's own words — see
          // aiRoundStats' declaration above. Same classifyText() output
          // already computed for the reply's highlight/HP delta, just
          // folded into a second running total.
          aiRoundStats.filler += aiAnalysis.fillerCount + aiAnalysis.fillerLightCount;
          aiRoundStats.curse += aiAnalysis.curseCount;
          aiRoundStats.connective += aiAnalysis.connectiveCount;
          aiRoundStats.vocab += aiAnalysis.vocabCount;
          addAiCard(aiAnalysis.html, 'AI opponent rebuts', result.data.reply);
          setAiHealth(aiHealth + aiAnalysis.delta);
          history.push({ role: 'assistant', content: result.data.reply });
          if (checkGameOver()) { finalizeTurn(aiAnalysis.wordCount, result.data.user_argument_verdict, null); return; }

          // Same verdict treatment, mirrored onto the AI's own rebuttal —
          // a lazy reply hurts the AI, a sharp one hurts the player back.
          applyVerdict(result.data.ai_reply_verdict, false);
          if (checkGameOver()) {
            finalizeTurn(aiAnalysis.wordCount, result.data.user_argument_verdict, result.data.ai_reply_verdict);
            return;
          }
          finalizeTurn(aiAnalysis.wordCount, result.data.user_argument_verdict, result.data.ai_reply_verdict);

          // Update the Judge panel BEFORE unlocking the input — otherwise a
          // fast player can submit the next argument while this turn's
          // scores are still pending, and the panel reads one exchange
          // behind until the following reveal catches up.
          revealJudge();
          maybeShowFallacyCallout(result.data.fallacy_type);
          textarea.disabled = false;
          submitBtn.disabled = false;
          if (bagInsertBtn) bagInsertBtn.disabled = false;
          textarea.focus();
          startTurnTimer();
        });
      });
    });
  }

  // Standalone view of the persistent Vocabulary Scars tally — reachable
  // any time from the nav, independent of whether a round is in progress.
  function initVocabScars() {
    var scarsEl = document.getElementById('cuss-scars');
    var scarsList = document.getElementById('cuss-scars-list');
    var scarsLink = document.getElementById('cuss-scars-link');
    var scarsCloseBtn = document.getElementById('cuss-scars-close');
    if (!scarsEl || !scarsList) return;

    function renderScars() {
      var scars = loadVocabScars();
      var entries = Object.keys(scars)
        .map(function (w) { return { word: w, count: scars[w] }; })
        .sort(function (a, b) { return b.count - a.count; });

      scarsList.innerHTML = '';

      if (!entries.length) {
        var empty = document.createElement('p');
        empty.className = 'cuss-recap-clean';
        empty.textContent = "No filler words tracked yet — play a round to start building your list.";
        scarsList.appendChild(empty);
        return;
      }

      entries.forEach(function (entry) {
        var alternatives = FILLER_ALTERNATIVES[entry.word] || ['specifically', 'precisely'];
        var title = FILLER_BADGE_TITLES[entry.word] || 'The Repeat Offender';
        var descTemplate = FILLER_DESCRIPTIONS[entry.word] || "You leaned on %WORD% more than once this round.";

        var card = document.createElement('div');
        card.className = 'cuss-scar-card';

        // Top row: badge label + title on the left, count pill on the right.
        var top = document.createElement('div');
        top.className = 'cuss-scar-card-top';
        var badge = document.createElement('div');
        var badgeLabel = document.createElement('p');
        badgeLabel.className = 'cuss-scar-badge-label';
        badgeLabel.textContent = 'Debuff Active';
        var badgeTitle = document.createElement('h4');
        badgeTitle.className = 'cuss-scar-badge-title';
        badgeTitle.textContent = title;
        badge.appendChild(badgeLabel);
        badge.appendChild(badgeTitle);
        var count = document.createElement('span');
        count.className = 'cuss-scar-count';
        count.textContent = '×' + entry.count;
        top.appendChild(badge);
        top.appendChild(count);

        // Middle: the flavor sentence, with the offending word itself
        // broken out into its own highlighted pill (see FILLER_DESCRIPTIONS'
        // %WORD% placeholder above) rather than baked into the string.
        var desc = document.createElement('p');
        desc.className = 'cuss-scar-desc';
        var descParts = descTemplate.split('%WORD%');
        desc.appendChild(document.createTextNode(descParts[0]));
        var wordPill = document.createElement('span');
        wordPill.className = 'cuss-scar-word-pill';
        wordPill.textContent = '"' + entry.word + '"';
        desc.appendChild(wordPill);
        desc.appendChild(document.createTextNode(descParts[1] || ''));

        // Bottom row: recommended swap — just the first alternative, to
        // match a single clear suggestion rather than the full list.
        var swapRow = document.createElement('div');
        swapRow.className = 'cuss-scar-swap-row';
        var swapLabel = document.createElement('span');
        swapLabel.className = 'cuss-scar-swap-label';
        swapLabel.textContent = 'Recommended swap:';
        var swapPill = document.createElement('span');
        swapPill.className = 'cuss-scar-swap-pill';
        swapPill.textContent = '💡 ' + alternatives[0];
        swapRow.appendChild(swapLabel);
        swapRow.appendChild(swapPill);

        card.appendChild(top);
        card.appendChild(desc);
        card.appendChild(swapRow);
        scarsList.appendChild(card);
      });
    }

    function openScars() {
      renderScars();
      scarsEl.classList.add('is-open');
      scarsEl.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeScars() {
      scarsEl.classList.remove('is-open');
      scarsEl.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    if (scarsLink) scarsLink.addEventListener('click', function (e) { e.preventDefault(); openScars(); });
    if (scarsCloseBtn) scarsCloseBtn.addEventListener('click', closeScars);
    scarsEl.addEventListener('click', function (e) { if (e.target === scarsEl) closeScars(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && scarsEl.classList.contains('is-open')) closeScars();
    });
  }

  // Standalone view of the persistent Connector Log tally — same shape as
  // initVocabScars() just above, reachable any time from the nav. Purely a
  // display over data recordConnectiveWords() already accumulated from
  // classifyText()'s existing connective-detection pass; no detection
  // logic lives here.
  function initConnectorLog() {
    var logEl = document.getElementById('cuss-connector-log');
    var logList = document.getElementById('cuss-connector-log-list');
    var logLink = document.getElementById('cuss-connector-log-link');
    var logCloseBtn = document.getElementById('cuss-connector-log-close');
    if (!logEl || !logList) return;

    function renderConnectorLog() {
      var log = loadConnectorLog();
      var entries = Object.keys(log)
        .map(function (w) { return { word: w, count: log[w] }; })
        .sort(function (a, b) { return b.count - a.count; });

      logList.innerHTML = '';

      if (!entries.length) {
        var empty = document.createElement('p');
        empty.className = 'cuss-recap-clean';
        empty.textContent = "No connectors tracked yet — words like \"because\" or \"however\" show up here once you use them in a round.";
        logList.appendChild(empty);
        return;
      }

      entries.forEach(function (entry) {
        var row = document.createElement('div');
        row.className = 'cuss-recap-row';

        var word = document.createElement('span');
        word.className = 'cuss-connector-word';
        word.textContent = '"' + entry.word + '" ×' + entry.count;

        row.appendChild(word);
        logList.appendChild(row);
      });
    }

    function openConnectorLog() {
      renderConnectorLog();
      logEl.classList.add('is-open');
      logEl.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeConnectorLog() {
      logEl.classList.remove('is-open');
      logEl.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    if (logLink) logLink.addEventListener('click', function (e) { e.preventDefault(); openConnectorLog(); });
    if (logCloseBtn) logCloseBtn.addEventListener('click', closeConnectorLog);
    logEl.addEventListener('click', function (e) { if (e.target === logEl) closeConnectorLog(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && logEl.classList.contains('is-open')) closeConnectorLog();
    });
  }

  // Purely cosmetic tag for Bag cards — flags words that are also genuine
  // MUN/diplomatic procedural vocabulary, separate from (and unrelated to)
  // VOCAB_CEFR's real-world difficulty rating above. Read-only against
  // existing Bag data: this never changes which words get collected, how
  // they're leveled, or anything about round play — it only decides
  // whether renderBag() below adds one extra badge to a card. Kept as its
  // own flat array, deliberately separate from VOCAB_WORDS/VOCAB_CEFR, so
  // it's trivial to extend or to rip out entirely without touching either
  // of those.
  var MUN_TERMS = [
    'sovereignty', 'resolution', 'caucus', 'moratorium', 'delegation', 'ratify', 'ratification',
    'consensus', 'mandate', 'sanction', 'sanctions', 'bilateral', 'multilateral', 'precedent',
    'jurisdiction', 'amendment', 'quorum', 'treaty', 'accord', 'coalition', 'referendum', 'embargo',
    'plenary', 'abstain', 'communique', 'rapporteur', 'protocol', 'statecraft', 'plebiscite',
    'unilateral'
  ];

  // Second, independent Bag tag — same pattern and same constraints as
  // MUN_TERMS above (purely cosmetic, read-only against existing Bag data,
  // a word can carry both tags at once since this is checked separately).
  // Flags words that also appear on Coxhead's Academic Word List (1998),
  // the standard ~570-word-family list behind most IELTS/TOEFL academic
  // vocabulary prep. No installable dataset or package for the real AWL
  // was available to pull in (checked pip; nothing legitimate exists), so
  // this is a hand-curated subset of its most-cited headwords — sublists
  // 1 to 3 (its most frequent third) plus a handful of derived family
  // forms that happen to already appear in VOCAB_WORDS above (e.g.
  // "methodology", "coherence") — rather than a guess at the full list.
  var AWL_TERMS = [
    // sublist 1 (most frequent)
    'analyze', 'analyse', 'approach', 'area', 'assess', 'assume', 'authority', 'available',
    'benefit', 'concept', 'consist', 'constitute', 'context', 'contract', 'create', 'data',
    'define', 'derive', 'distribute', 'economy', 'environment', 'establish', 'estimate', 'evident',
    'export', 'factor', 'finance', 'formula', 'function', 'identify', 'income', 'indicate',
    'individual', 'interpret', 'involve', 'issue', 'labor', 'labour', 'legal', 'legislate',
    'major', 'method', 'occur', 'percent', 'period', 'policy', 'principle', 'proceed', 'process',
    'require', 'research', 'respond', 'role', 'section', 'sector', 'significant', 'similar',
    'source', 'specific', 'structure', 'theory', 'vary',
    // sublist 2
    'achieve', 'acquire', 'administrate', 'affect', 'appropriate', 'aspect', 'assist', 'category',
    'chapter', 'commission', 'community', 'complex', 'compute', 'conclude', 'conduct', 'consequent',
    'construct', 'consume', 'credit', 'culture', 'design', 'distinct', 'element', 'equate',
    'evaluate', 'feature', 'final', 'focus', 'impact', 'injure', 'institute', 'invest', 'item',
    'journal', 'maintain', 'normal', 'obtain', 'participate', 'perceive', 'positive', 'potential',
    'previous', 'primary', 'purchase', 'range', 'region', 'regulate', 'relevant', 'reside',
    'resource', 'restrict', 'secure', 'seek', 'select', 'site', 'strategy', 'survey', 'text',
    'tradition', 'transfer',
    // sublist 3
    'alternative', 'circumstance', 'comment', 'compensate', 'component', 'consent', 'considerable',
    'constant', 'constrain', 'contribute', 'convention', 'coordinate', 'core', 'corporate',
    'correspond', 'criteria', 'deviate', 'displace', 'dynamic', 'eliminate', 'emphasis', 'ensure',
    'exceed', 'external', 'facilitate', 'fundamental', 'generate', 'generation', 'image', 'liberal',
    'licence', 'license', 'logic', 'margin', 'medical', 'mental', 'modify', 'monitor', 'network',
    'notion', 'objective', 'orient', 'perspective', 'precise', 'prime', 'psychology', 'pursue',
    'ratio', 'reject', 'revenue', 'stable', 'style', 'substitute', 'sustain', 'symbol', 'target',
    'transit', 'trend', 'version', 'welfare', 'whereas',
    // named directly by the user as expected matches, plus their family forms
    'hypothesis', 'methodology', 'methodological', 'coherent', 'coherence', 'consistent',
    'consistency', 'implement', 'subsequent'
  ];

  // Standalone view of the persistent Bag tally — the positive mirror of
  // Vocabulary Scars above, same structure (full-screen panel, one row per
  // word, sorted by use-count), reachable from either of the two entry
  // points next to the Chat button (hero + nav).
  function initBag() {
    var bagEl = document.getElementById('cuss-bag');
    var bagList = document.getElementById('cuss-bag-list');
    var bagLinks = [document.getElementById('cuss-bag-hero'), document.getElementById('cuss-bag-nav')];
    var bagCloseBtn = document.getElementById('cuss-bag-close');
    if (!bagEl || !bagList) return;

    // Must match the CSS keyframes' 2.2s duration — same value as
    // ENTER_ANIM_DURATION in initArena(), duplicated here since the two
    // init functions don't share scope.
    var BAG_ENTER_ANIM_DURATION = 2200;
    var bagEntering = false; // guards against overlapping runs from fast repeat Bag clicks

    function renderBag() {
      var bag = loadBag();
      var wordInfo = loadBagWordInfo(); // AI-discovered words outside VOCAB_WORDS, see creditBagWordsWithInfo()
      var entries = Object.keys(bag)
        .map(function (w) { return { word: w, count: bag[w] }; })
        .sort(function (a, b) { return b.count - a.count; });

      bagList.innerHTML = '';

      if (!entries.length) {
        var empty = document.createElement('p');
        empty.className = 'cuss-recap-clean';
        empty.textContent = "No words collected yet — land a strong vocabulary word in a round to start your Bag.";
        bagList.appendChild(empty);
        return;
      }

      entries.forEach(function (entry, i) {
        var card = document.createElement('div');
        card.className = 'cuss-bag-card';

        var level = document.createElement('span');
        level.className = 'cuss-bag-card-level';
        // Real CEFR level (see VOCAB_CEFR above), not a made-up tier tied
        // to use count. Falls back to the AI's own estimate (see
        // creditBagWordsWithInfo()) for a word outside the curated list,
        // then to 'B2' if even that's missing (e.g. VOCAB_WORDS grew since
        // a player's Bag was last saved, or the word predates this fallback
        // existing at all).
        level.textContent = VOCAB_CEFR[entry.word] || (wordInfo[entry.word] && wordInfo[entry.word].cefr) || 'B2';
        card.appendChild(level);

        if (MUN_TERMS.indexOf(entry.word) !== -1) {
          var munTag = document.createElement('span');
          munTag.className = 'cuss-bag-card-mun';
          munTag.textContent = 'MUN term';
          card.appendChild(munTag);
        }

        if (AWL_TERMS.indexOf(entry.word) !== -1) {
          var awlTag = document.createElement('span');
          awlTag.className = 'cuss-bag-card-awl';
          awlTag.textContent = 'Academic';
          card.appendChild(awlTag);
        }

        var word = document.createElement('span');
        word.className = 'cuss-bag-card-word';
        word.textContent = entry.word + (entry.count > 1 ? ' ×' + entry.count : '');
        card.appendChild(word);

        var def = WORD_OF_DAY_DEFS[entry.word] || (wordInfo[entry.word] && wordInfo[entry.word].def);
        if (def) {
          var defEl = document.createElement('span');
          defEl.className = 'cuss-bag-card-def';
          defEl.textContent = def;
          card.appendChild(defEl);
        }

        bagList.appendChild(card);
        // Dealt out one at a time (like a hand of cards), not popping in
        // all at once.
        setTimeout(function () { card.classList.add('is-visible'); }, i * 45);
      });
    }

    // Plays the same lips-paddle "Entering the Chat" animation (see
    // .cuss-enter-stage in styles.css and playEnterThenOpen() above) on
    // this same panel before the collected-words content reveals — one
    // continuous screen, same reasoning as the round entrance.
    function openBag() {
      if (bagEntering) return;
      bagEntering = true;
      bagEl.classList.add('is-open');
      bagEl.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      bagEl.classList.remove('is-entering');
      void bagEl.offsetWidth; // reflow so a repeat click restarts the keyframes
      bagEl.classList.add('is-entering');
      setTimeout(function () {
        bagEl.classList.remove('is-entering'); // reveals .cuss-bag-content, see CSS
        renderBag();
        bagEntering = false;
      }, BAG_ENTER_ANIM_DURATION);
    }
    function closeBag() {
      bagEl.classList.remove('is-open');
      bagEl.classList.remove('is-entering');
      bagEl.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    bagLinks.forEach(function (btn) {
      if (btn) btn.addEventListener('click', function (e) {
        e.preventDefault();
        // Guests see a lock on Bag: open the sign-in dialog instead. Their
        // words are still collected locally and merge in once they sign in.
        if (isGuestWithSignIn() && signInDialogApi) { signInDialogApi.open(); return; }
        openBag();
      });
    });
    if (bagCloseBtn) bagCloseBtn.addEventListener('click', closeBag);
    bagEl.addEventListener('click', function (e) { if (e.target === bagEl) closeBag(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && bagEl.classList.contains('is-open')) closeBag();
    });

    updateBagBadge();
  }

  // The hero stats band's "filler words by round 2" tile — reads the same
  // round-history log endRound() writes to, so it's the player's own real
  // number instead of a fixed marketing figure. Left at the static
  // placeholder (see index.html) until they've actually played 2 rounds.
  function initHomepageStat() {
    var numEl = document.getElementById('cuss-stat-improvement');
    var labelEl = document.getElementById('cuss-stat-improvement-label');
    if (!numEl || !labelEl) return;

    var history = loadRoundHistory();
    if (history.length < 2) return;

    var r1 = history[0];
    var r2 = history[1];
    var pct = r1 === 0 ? 0 : Math.round(((r1 - r2) / r1) * 100);

    numEl.textContent = pct >= 0 ? ('−' + pct + '%') : ('+' + Math.abs(pct) + '%');
    labelEl.textContent = 'filler words by round 2 (yours)';
  }

  // Word of the Day — picked fresh at random on every load (no date-based
  // seed), so two visitors — or the same visitor reloading — can land on
  // different words. The word itself is picked exactly as before; only the
  // reveal changed. It's now a horizontal sliding reel (case-opening
  // style): a long strip of decoy words — drawn from the same
  // WORD_OF_DAY_ENTRIES pool — slides left and decelerates to a stop with
  // the real pick centered in the window. Only that landed item gets the
  // "big and accent-colored" treatment; every other item in the strip stays
  // small and dim, so the landing pops instead of reading as several
  // simultaneous candidates (an earlier vertical 3-slot version had exactly
  // that problem). The definition only appears once the reel has actually
  // stopped, matching the landed word.
  //
  // Mechanic (sequence-building, decelerating easing + blur-clear, edge
  // mask fade) adapted from a reference case-opening reel the user
  // supplied; every color/font/spacing value here is Cussator's own token,
  // not the reference's.
  var WOTD_ITEM_WIDTH = 190; // must match .cuss-wotd-item's flex-basis
  var WOTD_BEFORE_COUNT = 34;
  var WOTD_AFTER_COUNT = 6;
  var WOTD_SPIN_SECONDS = 4;
  var WOTD_BLUR_CLEAR_SECONDS = 2.2;

  // Exposed at module scope so the arena's /api/respond call (see
  // initArena() above) can tell the AI opponent what today's word is, so
  // it can occasionally work it into a rebuttal. Set once initWordOfDay()
  // below actually picks one; stays null (and is just omitted from the
  // request) on the rare case that init hasn't run yet.
  var currentWordOfDay = null;

  function initWordOfDay() {
    var reelWindow = document.getElementById('cuss-wotd-reel');
    var track = document.getElementById('cuss-wotd-track');
    var defEl = document.getElementById('cuss-wotd-def');
    if (!reelWindow || !track || !defEl) return;

    var entry = WORD_OF_DAY_ENTRIES[Math.floor(Math.random() * WORD_OF_DAY_ENTRIES.length)];
    currentWordOfDay = entry;
    var pool = WORD_OF_DAY_ENTRIES.filter(function (e) { return e.word !== entry.word; });
    function randomDecoy() { return pool[Math.floor(Math.random() * pool.length)].word; }

    var sequence = [];
    for (var i = 0; i < WOTD_BEFORE_COUNT; i++) sequence.push(randomDecoy());
    var landIndex = sequence.length;
    sequence.push(entry.word);
    for (var j = 0; j < WOTD_AFTER_COUNT; j++) sequence.push(randomDecoy());

    track.innerHTML = '';
    sequence.forEach(function (word) {
      var span = document.createElement('span');
      span.className = 'cuss-wotd-item';
      span.textContent = word;
      track.appendChild(span);
    });

    // Centers the landing word in the (now full-width) window regardless of
    // how wide that window actually is.
    var containerWidth = reelWindow.clientWidth;
    var offset = landIndex * WOTD_ITEM_WIDTH + WOTD_ITEM_WIDTH / 2 - containerWidth / 2;

    track.style.transition = 'none';
    track.style.transform = 'translateX(0px)';
    track.style.filter = 'blur(3px)';
    // Reflow so the transition below animates from this reset position
    // rather than wherever the track last was — same technique
    // playEnterThenOpen() uses for the "Entering the Chat" replay, and
    // applied synchronously right after (not wrapped in
    // requestAnimationFrame, which needless here and risks never firing at
    // all if the tab is backgrounded when a round starts).
    void track.offsetWidth;
    track.style.transition = 'transform ' + WOTD_SPIN_SECONDS + 's cubic-bezier(0.14,0.85,0.24,1), filter ' + WOTD_BLUR_CLEAR_SECONDS + 's ease-out';
    track.style.transform = 'translateX(-' + offset + 'px)';
    track.style.filter = 'blur(0px)';

    // A plain timeout matching the transition duration, same completion
    // pattern as the win/lose transition and "Entering the Chat" elsewhere
    // in this file — more reliable than a transitionend listener, which
    // can silently never fire if anything interrupts or re-triggers the
    // transition before it naturally finishes.
    setTimeout(function () {
      var landed = track.children[landIndex];
      if (landed) landed.classList.add('is-landed');
      defEl.textContent = entry.def;
      requestAnimationFrame(function () { defEl.classList.add('is-visible'); });
    }, WOTD_SPIN_SECONDS * 1000);
  }

  // Post-round dashboard (Feature 3) — a standalone full-screen report,
  // deliberately independent of initArena()'s own closure (see dashboardApi
  // above) so it can be opened two ways: from the result screen's "Full
  // Report" button once a normal round ends, or opened directly by
  // Elevator Pitch mode (Feature 4) with a critique string attached,
  // bypassing the win/lose screen entirely. Either caller hands it a plain
  // data object (see buildDashboardPayload() in initArena()) plus
  // {onRematch, onClose} callbacks — this module renders whatever it's
  // given and never reaches back into arena internals itself.
  function initDashboard() {
    var dashEl = document.getElementById('cuss-dashboard');
    var motionEl = document.getElementById('cuss-dash-motion');
    var critiqueEl = document.getElementById('cuss-dash-critique');
    var critiqueTextEl = document.getElementById('cuss-dash-critique-text');
    var quickstatsEl = document.getElementById('cuss-dash-quickstats');
    var scoreCardsEl = document.getElementById('cuss-dash-score-cards');
    var rematchBtn = document.getElementById('cuss-dash-rematch');
    var closeBtn = document.getElementById('cuss-dash-close');
    var hpCanvas = document.getElementById('cuss-dash-hp-chart');
    var wordsCanvas = document.getElementById('cuss-dash-words-chart');
    var libErrorEl = document.getElementById('cuss-dash-lib-error');
    // WPM is pure inline SVG (see the reference-design conversation) — no
    // canvas, no Chart.js, no fallback state, so it's deliberately excluded
    // from chartFallbacks/chartsAvailable below: it renders unconditionally.
    var wpmBadgeEl = document.getElementById('cuss-dash-wpm-badge');
    var wpmLineEl = document.getElementById('cuss-dash-wpm-line');
    var wpmLabelsEl = document.getElementById('cuss-dash-wpm-labels');
    var chartFallbacks = [hpCanvas, wordsCanvas].map(function (canvas) {
      return canvas && canvas.parentElement ? canvas.parentElement.querySelector('.cuss-dash-chart-fallback') : null;
    });
    if (!dashEl) return;

    // Chart.js should always be defined by now — index.html's <head> loads
    // it from the CDN, falling back to a vendored local copy (byte-for-byte
    // identical, verified by SHA-512) via a synchronous document.write if
    // the CDN is unreachable. This flag is the last line of defense: if
    // somehow BOTH sources failed, the dashboard still opens and still
    // shows real numbers — it just skips chart creation and says why
    // (#cuss-dash-lib-error) instead of the previous behavior, which was
    // this whole function returning early and dashboardApi staying null —
    // silently doing nothing when "Full Report" or a finished Pitch round
    // tried to open it.
    var chartsAvailable = typeof Chart !== 'undefined';

    // Both run the same validated pass from the dataviz skill against this
    // panel's near-black surface: chroma floor, CVD separation (worst
    // adjacent ΔE 16.7 protan) and the normal-vision floor (ΔE 22.6, floor
    // is 15) all clear. Never the only way the two are told apart though —
    // every chart below also varies point shape and line style (solid vs
    // dashed) between them, so identity never rests on hue alone.
    var YOU_COLOR = '#eaff00';
    var AI_COLOR = '#00e0a8';
    var PANEL_COLOR = '#131316';
    var BORDER_COLOR = '#2c2c31';
    var TEXT_DIM = '#9a9aa2';
    var TEXT_MAIN = '#f5f5f7';

    function withAlpha(hex, alpha) {
      var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }

    var hpChart = null, wordsChart = null;
    var onRematch = null, onClose = null;

    function destroyCharts() {
      if (hpChart) { hpChart.destroy(); hpChart = null; }
      if (wordsChart) { wordsChart.destroy(); wordsChart = null; }
    }

    function baseScales(extra) {
      var scales = {
        x: { grid: { display: false }, ticks: { color: TEXT_DIM, font: { size: 11 } } },
        y: { grid: { color: BORDER_COLOR }, ticks: { color: TEXT_DIM, font: { size: 11 } } }
      };
      if (extra) {
        if (extra.y) Object.assign(scales.y, extra.y);
      }
      return scales;
    }

    function tooltipBase() {
      return {
        backgroundColor: PANEL_COLOR, borderColor: BORDER_COLOR, borderWidth: 1,
        titleColor: TEXT_MAIN, bodyColor: TEXT_MAIN, padding: 10, boxPadding: 4,
        usePointStyle: true
      };
    }

    function renderHpChart(hpHistory) {
      var labels = hpHistory.map(function (h) { return h.turnIndex === 0 ? 'Start' : 'Turn ' + h.turnIndex; });
      hpChart = new Chart(hpCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'You', data: hpHistory.map(function (h) { return h.health; }),
              borderColor: YOU_COLOR, backgroundColor: withAlpha(YOU_COLOR, 0.1), fill: true,
              borderWidth: 2, tension: 0.25, pointStyle: 'circle',
              pointRadius: 4, pointHoverRadius: 6, pointBackgroundColor: YOU_COLOR,
              pointBorderColor: PANEL_COLOR, pointBorderWidth: 2
            },
            {
              label: 'AI opponent', data: hpHistory.map(function (h) { return h.aiHealth; }),
              borderColor: AI_COLOR, backgroundColor: withAlpha(AI_COLOR, 0.1), fill: true,
              borderWidth: 2, borderDash: [6, 4], tension: 0.25, pointStyle: 'triangle',
              pointRadius: 5, pointHoverRadius: 7, pointBackgroundColor: AI_COLOR,
              pointBorderColor: PANEL_COLOR, pointBorderWidth: 2
            }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: baseScales({ y: { min: 0, max: CUSSATOR_CONFIG.STARTING_HP, ticks: { stepSize: CUSSATOR_CONFIG.STARTING_HP / 5, color: TEXT_DIM } } }),
          plugins: {
            legend: { display: true, position: 'top', align: 'end', labels: { color: TEXT_DIM, usePointStyle: true, boxWidth: 8, font: { size: 12 } } },
            tooltip: Object.assign(tooltipBase(), {
              callbacks: { label: function (ctx) { return ctx.dataset.label + ': ' + ctx.parsed.y + ' HP'; } }
            })
          }
        }
      });
    }

    // Pure inline SVG sparkline — no Chart.js, no canvas, so this one panel
    // never depends on the CDN (or its local vendor fallback) at all, unlike
    // renderHpChart/renderWordsChart above and below. Normalizes each turn's
    // userWpm into the 0-30 viewBox height (SVG y grows downward, so a
    // faster pace needs a SMALLER y — inverted here), spaces points evenly
    // across the 0-100 width, and derives a simple three-state trend badge
    // from the first vs. last point rather than anything fancier. Monochrome
    // in --dash-you, same reasoning as the CSS: this is always "your" pace,
    // same entity that color already means everywhere else on this screen.
    function renderWpmSpark(turnLog) {
      if (!turnLog.length) {
        wpmLineEl.setAttribute('points', '');
        wpmBadgeEl.textContent = 'NO DATA';
        wpmLabelsEl.innerHTML = '';
        return;
      }

      var wpms = turnLog.map(function (t) { return t.userWpm; });
      var minWpm = Math.min.apply(null, wpms);
      var maxWpm = Math.max.apply(null, wpms);
      var range = maxWpm - minWpm || 1;
      var PAD = 3; // keeps the line off the grid's very top/bottom edge

      var points = wpms.map(function (wpm, i) {
        var x = wpms.length > 1 ? (i / (wpms.length - 1)) * 100 : 50;
        var y = PAD + (1 - (wpm - minWpm) / range) * (30 - PAD * 2);
        return x.toFixed(1) + ',' + y.toFixed(1);
      });
      // One turn has no second point to draw a line to — duplicate it across
      // the full width so there's still a visible flat line, not a blank chart.
      if (points.length === 1) {
        var flatY = points[0].split(',')[1];
        points = ['0,' + flatY, '100,' + flatY];
      }
      wpmLineEl.setAttribute('points', points.join(' '));

      var badge = 'STABLE';
      if (wpms.length > 1) {
        var first = wpms[0], last = wpms[wpms.length - 1];
        if (last > first * 1.15) badge = 'SPEEDING UP';
        else if (last < first * 0.85) badge = 'SLOWING DOWN';
      }
      wpmBadgeEl.textContent = badge;

      wpmLabelsEl.innerHTML = '';
      var labelTurns = [turnLog[0]];
      if (turnLog.length >= 3) labelTurns.push(turnLog[Math.floor((turnLog.length - 1) / 2)]);
      if (turnLog.length >= 2) labelTurns.push(turnLog[turnLog.length - 1]);
      labelTurns.forEach(function (t, i) {
        var span = document.createElement('span');
        var isLast = i === labelTurns.length - 1 && turnLog.length > 1;
        span.textContent = 'Turn ' + t.index + (isLast ? ' (End)' : '');
        wpmLabelsEl.appendChild(span);
      });
    }

    function renderWordsChart(you, ai) {
      wordsChart = new Chart(wordsCanvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Filler', 'Connectors', 'High-tier vocab'],
          datasets: [
            {
              label: 'You', data: [you.filler, you.connective, you.vocab],
              backgroundColor: YOU_COLOR, borderRadius: 4, maxBarThickness: 24,
              categoryPercentage: 0.6, barPercentage: 0.85
            },
            {
              label: 'AI opponent', data: [ai.filler, ai.connective, ai.vocab],
              backgroundColor: AI_COLOR, borderRadius: 4, maxBarThickness: 24,
              categoryPercentage: 0.6, barPercentage: 0.85
            }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: baseScales({ y: { beginAtZero: true, ticks: { precision: 0, color: TEXT_DIM } } }),
          plugins: {
            legend: { display: true, position: 'top', align: 'end', labels: { color: TEXT_DIM, usePointStyle: true, boxWidth: 8, font: { size: 12 } } },
            tooltip: tooltipBase()
          }
        }
      });
    }

    function statTile(label, value) {
      var tile = document.createElement('div');
      tile.className = 'cuss-dash-stat';
      var labelEl = document.createElement('p');
      labelEl.className = 'cuss-dash-stat-label';
      labelEl.textContent = label;
      var valueEl = document.createElement('p');
      valueEl.className = 'cuss-dash-stat-value';
      valueEl.textContent = value;
      tile.appendChild(labelEl);
      tile.appendChild(valueEl);
      return tile;
    }

    function scoreCard(label, value) {
      var card = document.createElement('div');
      card.className = 'cuss-dash-score-card';
      var labelEl = document.createElement('p');
      labelEl.className = 'cuss-dash-score-label';
      labelEl.textContent = label;
      var valueEl = document.createElement('p');
      valueEl.className = 'cuss-dash-score-value';
      valueEl.textContent = value;
      var track = document.createElement('div');
      track.className = 'cuss-dash-score-track';
      var fill = document.createElement('div');
      fill.className = 'cuss-dash-score-fill';
      fill.style.width = clamp(value, 0, 100) + '%';
      track.appendChild(fill);
      card.appendChild(labelEl);
      card.appendChild(valueEl);
      card.appendChild(track);
      return card;
    }

    function render(data) {
      motionEl.textContent = data.motion ? 'Motion: «' + data.motion + '»' : '';

      if (data.critique) {
        critiqueTextEl.textContent = data.critique;
        critiqueEl.hidden = false;
      } else {
        critiqueEl.hidden = true;
      }

      var turnLog = data.turnLog || [];
      var hpHistory = (data.hpHistory && data.hpHistory.length) ? data.hpHistory : [{ turnIndex: 0, health: CUSSATOR_CONFIG.STARTING_HP, aiHealth: CUSSATOR_CONFIG.STARTING_HP }];
      var totalWords = turnLog.reduce(function (sum, t) { return sum + t.userWords; }, 0);
      var avgWpm = turnLog.length ? Math.round(turnLog.reduce(function (sum, t) { return sum + t.userWpm; }, 0) / turnLog.length) : 0;

      quickstatsEl.innerHTML = '';
      quickstatsEl.appendChild(statTile('Result', data.playerWon === true ? 'Win' : data.playerWon === false ? 'Loss' : '—'));
      quickstatsEl.appendChild(statTile('Turns', String(turnLog.length)));
      quickstatsEl.appendChild(statTile('Words spoken', String(totalWords)));
      quickstatsEl.appendChild(statTile('Avg pace', avgWpm + ' wpm'));

      // Unconditional — the SVG sparkline has no library dependency to fail.
      renderWpmSpark(turnLog);

      if (libErrorEl) libErrorEl.hidden = chartsAvailable;
      destroyCharts();

      if (!chartsAvailable) {
        // Numbers above (quick stats, and scores below) are unaffected —
        // only the 2 remaining canvas-based charts are skipped. Hide each
        // empty canvas and show its fallback line instead of leaving a
        // blank black box with no explanation beyond the one banner at top.
        [hpCanvas, wordsCanvas].forEach(function (canvas, i) {
          if (canvas) canvas.hidden = true;
          if (chartFallbacks[i]) chartFallbacks[i].hidden = false;
        });
      } else {
        chartFallbacks.forEach(function (el) { if (el) el.hidden = true; });
        hpCanvas.hidden = false;
        renderHpChart(hpHistory);
        wordsCanvas.hidden = false;
        renderWordsChart(
          data.wordCategories ? data.wordCategories.you : { filler: 0, connective: 0, vocab: 0 },
          data.wordCategories ? data.wordCategories.ai : { filler: 0, connective: 0, vocab: 0 }
        );
      }

      var scores = data.scores || { logic: 0, precision: 0, delivery: 0 };
      scoreCardsEl.innerHTML = '';
      scoreCardsEl.appendChild(scoreCard('Logic', scores.logic));
      scoreCardsEl.appendChild(scoreCard('Precision', scores.precision));
      scoreCardsEl.appendChild(scoreCard('Delivery', scores.delivery));
    }

    function open(data, opts) {
      opts = opts || {};
      onRematch = typeof opts.onRematch === 'function' ? opts.onRematch : null;
      onClose = typeof opts.onClose === 'function' ? opts.onClose : null;
      render(data || {});
      dashEl.classList.add('is-open');
      dashEl.setAttribute('aria-hidden', 'false');
      dashEl.scrollTop = 0;
    }

    function close() {
      dashEl.classList.remove('is-open');
      dashEl.setAttribute('aria-hidden', 'true');
    }

    if (rematchBtn) {
      rematchBtn.addEventListener('click', function () {
        close();
        if (onRematch) onRematch();
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        close();
        if (onClose) onClose();
      });
    }
    dashEl.addEventListener('click', function (e) {
      if (e.target === dashEl) { close(); if (onClose) onClose(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && dashEl.classList.contains('is-open')) { close(); if (onClose) onClose(); }
    });

    dashboardApi = { open: open, close: close };
  }

  // 60-Second Elevator Pitch (Feature 4) — a standalone alternative round
  // type, selectable from the home screen, deliberately NOT built inside
  // initArena()'s state machine: this is one continuous timed pitch with no
  // opponent turn, so the arena's HP bars, per-turn timer, Word Economy
  // budget and Point of Order heuristic don't apply here. Shares the
  // scoring formula (computeJudgeScores) and the report screen
  // (dashboardApi) with the normal round, and nothing else.
  function initPitch() {
    var pitchEl = document.getElementById('cuss-pitch');
    var stanceSelectEl = document.getElementById('cuss-pitch-stance-select');
    var stanceMotionText = document.getElementById('cuss-pitch-stance-motion-text');
    var affirmBtn = document.getElementById('cuss-pitch-affirm');
    var negateBtn = document.getElementById('cuss-pitch-negate');
    var closeBtn = document.getElementById('cuss-pitch-close');
    var sideEl = document.getElementById('cuss-pitch-side');
    var motionTextEl = document.getElementById('cuss-pitch-motion-text');
    var timerEl = document.getElementById('cuss-pitch-timer');
    var timerFillEl = document.getElementById('cuss-pitch-timer-fill');
    var clockEl = document.getElementById('cuss-pitch-clock');
    var clockHandEl = document.getElementById('cuss-pitch-clock-hand');
    var form = document.getElementById('cuss-pitch-form');
    var textarea = document.getElementById('cuss-pitch-input');
    var highlightLayer = document.getElementById('cuss-pitch-highlight');
    var submitBtn = document.getElementById('cuss-pitch-submit');
    var openBtns = [document.getElementById('cuss-start-pitch-hero')];
    if (!pitchEl || !form || !textarea) return;

    // A hard 60 seconds for the whole pitch, not a per-turn allowance like
    // the normal arena's TURN_DURATION_SECONDS — this mode has exactly one
    // turn. Countdown ticks visibly (see .cuss-pitch-timer/-fill in
    // styles.css) and auto-submits whatever's in the textarea at 0,
    // whether that's a finished pitch or nothing at all.
    var PITCH_DURATION_SECONDS = 60;
    var WARN_AT = 15;
    var CRITICAL_AT = 5;

    var MOTION = '';
    var playerSide = null;
    var roundOver = false;
    var timerInterval = null;
    var secondsLeft = PITCH_DURATION_SECONDS;
    var pitchStartTime = null;

    function renderHighlight() {
      var value = textarea.value;
      highlightLayer.innerHTML = value ? classifyText(value).html : '';
      highlightLayer.scrollTop = textarea.scrollTop;
    }
    textarea.addEventListener('input', renderHighlight);
    textarea.addEventListener('scroll', function () { highlightLayer.scrollTop = textarea.scrollTop; });
    textarea.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
    });

    function updateTimerDisplay() {
      timerEl.textContent = String(secondsLeft);
      var warn = secondsLeft <= WARN_AT && secondsLeft > CRITICAL_AT;
      var critical = secondsLeft <= CRITICAL_AT;
      timerEl.classList.toggle('is-warn', warn);
      timerEl.classList.toggle('is-critical', critical);
      timerFillEl.style.width = (secondsLeft / PITCH_DURATION_SECONDS * 100) + '%';
      timerFillEl.classList.toggle('is-warn', warn);
      timerFillEl.classList.toggle('is-critical', critical);
      if (clockEl) {
        clockEl.classList.toggle('is-warn', warn);
        clockEl.classList.toggle('is-critical', critical);
        // Reduced motion skips the smooth 60s CSS sweep entirely (see the
        // media query in styles.css) — this is the fallback: the hand still
        // shows real progress, just as a once-a-second step matching the
        // digit's own update cadence instead of a continuous animation.
        if (REDUCED_MOTION && clockHandEl) {
          var elapsed = PITCH_DURATION_SECONDS - secondsLeft;
          clockHandEl.style.transform = 'rotate(' + (elapsed / PITCH_DURATION_SECONDS * 360) + 'deg)';
        }
      }
    }

    function stopTimer() {
      if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    }

    function startTimer() {
      stopTimer();
      secondsLeft = PITCH_DURATION_SECONDS;
      pitchStartTime = Date.now();
      // Restarts the sweep from 12 o'clock every time — same remove-class,
      // force-reflow, re-add-class trick triggerScreenShake() uses in the
      // arena, so a repeat pitch doesn't inherit the previous round's hand
      // position or skip the animation (re-adding an already-present class
      // is a no-op in the browser, hence the reflow in between).
      if (clockEl) {
        clockEl.classList.remove('is-sweeping', 'is-warn', 'is-critical');
        if (clockHandEl) clockHandEl.style.transform = '';
        void clockEl.offsetWidth;
        clockEl.classList.add('is-sweeping');
      }
      updateTimerDisplay();
      timerInterval = setInterval(function () {
        secondsLeft = Math.max(0, secondsLeft - 1);
        updateTimerDisplay();
        if (secondsLeft === 0) {
          stopTimer();
          submitPitch(); // hard cutoff — locks input and auto-submits whatever's there
        }
      }, 1000);
    }

    function resetPitch() {
      MOTION = pickMotion();
      if (motionTextEl) motionTextEl.textContent = MOTION;
      if (stanceMotionText) stanceMotionText.textContent = MOTION;

      playerSide = null;
      roundOver = false;
      stopTimer();
      secondsLeft = PITCH_DURATION_SECONDS;
      if (clockEl) {
        clockEl.classList.remove('is-sweeping', 'is-warn', 'is-critical');
        if (clockHandEl) clockHandEl.style.transform = '';
      }
      updateTimerDisplay();

      textarea.value = '';
      textarea.disabled = true;
      submitBtn.disabled = true;
      renderHighlight();

      if (sideEl) {
        sideEl.hidden = true;
        sideEl.classList.remove('is-visible', 'is-affirm', 'is-negate');
      }
      affirmBtn.disabled = false;
      negateBtn.disabled = false;
      stanceSelectEl.hidden = false;
    }

    function chooseSide(side) {
      if (playerSide) return;
      playerSide = side;
      stanceSelectEl.hidden = true;

      if (sideEl) {
        sideEl.hidden = false;
        sideEl.textContent = side === 'affirm' ? 'AFFIRM' : 'NEGATE';
        sideEl.classList.add(side === 'affirm' ? 'is-affirm' : 'is-negate');
        requestAnimationFrame(function () { sideEl.classList.add('is-visible'); });
      }

      textarea.disabled = false;
      submitBtn.disabled = false;
      textarea.focus();
      startTimer();
    }

    function openPitch() {
      resetPitch();
      pitchEl.classList.add('is-open');
      pitchEl.setAttribute('aria-hidden', 'false');
    }

    function closePitch() {
      stopTimer();
      pitchEl.classList.remove('is-open');
      pitchEl.setAttribute('aria-hidden', 'true');
    }

    // Hands off to the same dashboard Feature 3 built (dashboardApi),
    // bypassing the normal arena's win/lose screen entirely — there is no
    // win/lose in a solo pitch. Rematch from here opens a fresh pitch
    // (not the debate arena), so a pitch-mode round always leads back into
    // pitch mode, matching what the player actually chose.
    function goToDashboard(payload) {
      closePitch();
      if (dashboardApi) {
        dashboardApi.open(payload, { onRematch: openPitch, onClose: function () {} });
      }
    }

    function submitPitch() {
      if (roundOver || !playerSide) return;
      roundOver = true;
      stopTimer();
      textarea.disabled = true;
      submitBtn.disabled = true;

      var text = textarea.value.trim();

      if (!text) {
        // Time ran out (or Send was hit) with nothing written — skip the
        // API call (an empty argument would just 400) and go straight to
        // the report with zero real turns, same empty-state the dashboard
        // already renders correctly for a self-KO with no completed turns.
        goToDashboard({
          motion: MOTION, playerWon: null,
          hpHistory: [{ turnIndex: 0, health: CUSSATOR_CONFIG.STARTING_HP, aiHealth: CUSSATOR_CONFIG.STARTING_HP }],
          turnLog: [],
          wordCategories: { you: { filler: 0, connective: 0, vocab: 0 }, ai: { filler: 0, connective: 0, vocab: 0 } },
          scores: { logic: 0, precision: 0, delivery: 0 },
          critique: "Time ran out before you started your pitch. Next time, lead with your strongest claim first so you always land at least one real point before the clock runs out."
        });
        return;
      }

      fetch('/api/pitch-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motion: MOTION, argument: text, side: playerSide })
      })
        .then(function (res) {
          return res.json().then(function (data) { return { ok: res.ok, data: data }; });
        })
        .catch(function () {
          return { ok: false, data: { error: 'Failed to reach the server.' } };
        })
        .then(function (result) {
          var critique = result.ok ? result.data.critique : (result.data.error || 'Could not generate a critique for this pitch.');
          var verdict = result.ok ? (result.data.argument_verdict || 'neutral') : 'neutral';

          var analysis = classifyText(text);
          var health = clamp(CUSSATOR_CONFIG.STARTING_HP + analysis.delta, 0, CUSSATOR_CONFIG.STARTING_HP);
          var stats = {
            solid: verdict === 'solid' ? 1 : 0, neutral: verdict === 'neutral' ? 1 : 0, bad: verdict === 'bad' ? 1 : 0,
            connective: analysis.connectiveCount,
            filler: analysis.fillerCount + analysis.fillerLightCount,
            vocab: analysis.vocabCount, curse: analysis.curseCount, words: analysis.wordCount
          };
          var elapsedMs = Math.max(Date.now() - (pitchStartTime || Date.now()), 1000);
          var wpm = Math.round(analysis.wordCount / (elapsedMs / 60000));

          goToDashboard({
            motion: MOTION, playerWon: null,
            hpHistory: [{ turnIndex: 0, health: CUSSATOR_CONFIG.STARTING_HP, aiHealth: CUSSATOR_CONFIG.STARTING_HP }, { turnIndex: 1, health: health, aiHealth: CUSSATOR_CONFIG.STARTING_HP }],
            turnLog: [{
              index: 1, userWords: analysis.wordCount, userWpm: wpm,
              userVerdict: verdict, aiVerdict: null, aiWords: 0, health: health, aiHealth: CUSSATOR_CONFIG.STARTING_HP
            }],
            wordCategories: {
              you: { filler: stats.filler, connective: stats.connective, vocab: stats.vocab },
              ai: { filler: 0, connective: 0, vocab: 0 }
            },
            scores: computeJudgeScores(stats),
            critique: critique
          });
        });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitPitch();
    });

    if (affirmBtn) affirmBtn.addEventListener('click', function () { chooseSide('affirm'); });
    if (negateBtn) negateBtn.addEventListener('click', function () { chooseSide('negate'); });
    if (closeBtn) closeBtn.addEventListener('click', closePitch);
    openBtns.forEach(function (btn) { if (btn) btn.addEventListener('click', openPitch); });
    pitchEl.addEventListener('click', function (e) { if (e.target === pitchEl) closePitch(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && pitchEl.classList.contains('is-open')) closePitch();
    });
  }

  // Mobile hamburger menu — collapses the secondary nav links (How it
  // works/Features/Vocabulary Scars/Connector Log) into a dropdown below
  // the header on narrow screens (see the max-width:640px rules on
  // .cuss-nav-links in styles.css); at desktop widths .cuss-nav-links is
  // just an inline row and this class never gets applied since the
  // button that would toggle it is hidden. Same open/close/outside-
  // click/Escape pattern as the Insert-from-Bag popover elsewhere in
  // this file.
  function initNavMenu() {
    var menuBtn = document.getElementById('cuss-nav-menu-btn');
    var navLinks = document.getElementById('cuss-nav-links');
    if (!menuBtn || !navLinks) return;

    function closeMenu() {
      navLinks.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
    function openMenu() {
      navLinks.classList.add('is-open');
      menuBtn.setAttribute('aria-expanded', 'true');
    }

    menuBtn.addEventListener('click', function () {
      if (navLinks.classList.contains('is-open')) closeMenu();
      else openMenu();
    });
    // Closes as soon as a link is actually chosen, rather than leaving
    // the dropdown open over whatever section/panel it just navigated to.
    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeMenu();
    });
    document.addEventListener('click', function (e) {
      if (navLinks.classList.contains('is-open')
        && !navLinks.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
        closeMenu();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('is-open')) closeMenu();
    });
  }

  // Mobile-only live-round preview card on the landing page — the
  // inline script right after it in index.html already hides it before
  // first paint if localStorage says it was dismissed on a previous
  // visit; this only wires the close button for THIS visit. Purely
  // decorative sample content — no timer, no API call, nothing here
  // ever touches real game state.
  function initHeroPreview() {
    var card = document.getElementById('cuss-hero-preview');
    var closeBtn = document.getElementById('cuss-hero-preview-close');
    if (!card || !closeBtn) return;
    closeBtn.addEventListener('click', function () {
      card.classList.add('is-dismissing');
      try { localStorage.setItem('cussator_preview_dismissed', 'true'); } catch (e) {
        // localStorage unavailable — the card still closes for this
        // visit via the class above, it just won't stay dismissed next time.
      }
      setTimeout(function () { card.hidden = true; }, 300); // matches the CSS transition duration
    });
  }

  // Round-report card for guests: "N strong words from this round" with the
  // words credited to the Bag this round. At most once per browser session
  // (sessionStorage, with an in-memory fallback if storage is blocked), never
  // for signed-in users, and only if there's at least one word to show.
  var BAG_PROMPT_SEEN_KEY = 'cussatorBagPromptShown';
  var bagPromptShownInMemory = false;

  function renderGuestBagPrompt() {
    var card = document.getElementById('cuss-bag-prompt');
    var titleEl = document.getElementById('cuss-bag-prompt-title');
    var wordsEl = document.getElementById('cuss-bag-prompt-words');
    if (!card || !titleEl || !wordsEl) return;
    card.hidden = true;
    if (!isGuestWithSignIn() || !roundVocabWords.length || bagPromptShownInMemory) return;
    try {
      if (sessionStorage.getItem(BAG_PROMPT_SEEN_KEY)) return;
      sessionStorage.setItem(BAG_PROMPT_SEEN_KEY, '1');
    } catch (e) { /* storage blocked — the in-memory flag below still limits it to once per page load */ }
    bagPromptShownInMemory = true;

    var n = roundVocabWords.length;
    titleEl.textContent = n + (n === 1 ? ' strong word' : ' strong words') + ' from this round';
    wordsEl.innerHTML = '';
    roundVocabWords.forEach(function (w) {
      var chip = document.createElement('span');
      chip.className = 'cuss-bag-prompt-word';
      chip.textContent = w;
      wordsEl.appendChild(chip);
    });
    card.hidden = false;
  }

  // Sign-in dialog + the round-report card's buttons. The Google buttons call
  // startGoogleSignIn() (defined in initAuth()), so the OAuth call lives in
  // one place. Closes with the X, Escape, a backdrop click or "Continue as guest".
  function initSignInUI() {
    var dialog = document.getElementById('cuss-signin-dialog');
    if (!dialog) return;
    var closeBtn = document.getElementById('cuss-signin-close');
    var googleBtn = document.getElementById('cuss-signin-google');
    var guestBtn = document.getElementById('cuss-signin-guest');
    var promptSignIn = document.getElementById('cuss-bag-prompt-signin');
    var promptLater = document.getElementById('cuss-bag-prompt-later');
    var lastFocus = null;
    var prevOverflow = '';

    function isOpen() { return dialog.classList.contains('is-open'); }

    function open() {
      if (isOpen()) return;
      lastFocus = document.activeElement;
      prevOverflow = document.body.style.overflow;
      dialog.classList.add('is-open');
      dialog.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (googleBtn) googleBtn.focus();
    }

    function close() {
      if (!isOpen()) return;
      dialog.classList.remove('is-open');
      dialog.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = prevOverflow;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    signInDialogApi = { open: open, close: close };

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (guestBtn) guestBtn.addEventListener('click', close);
    if (googleBtn) googleBtn.addEventListener('click', function () { startGoogleSignIn(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) close(); });

    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      // Keep Tab inside the dialog while it's open.
      var focusable = dialog.querySelectorAll('button, a[href]');
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    if (promptSignIn) promptSignIn.addEventListener('click', function () { startGoogleSignIn(); });
    if (promptLater) promptLater.addEventListener('click', function () {
      var card = document.getElementById('cuss-bag-prompt');
      if (card) card.hidden = true;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initDemo();
    initArena();
    initDashboard();
    initPitch();
    initVocabScars();
    initConnectorLog();
    initBag();
    initHomepageStat();
    initWordOfDay();
    initNavMenu();
    initHeroPreview();
    initSignInUI();
    initNicknameUI();
    initAuth();
  });
})();
