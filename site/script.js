(function () {
  'use strict';

  var GOOD = 'oklch(0.75 0.13 150)';
  var WARN = 'oklch(0.74 0.15 55)';
  var REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
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
    'gonna', 'wanna', 'gotta', "ain't", 'tbh', 'idk', 'imo', 'like literally', 'super literally'
  ];
  // Light filler tier — common but milder verbal habits, -5 Credibility each.
  var FILLER_WORDS_LIGHT = ['actually', 'honestly', 'literally', 'well', 'so'];
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
    'protocol', 'sanction', 'blockade'
  ];

  // Fixed per-hit Credibility values — the whole scoring system runs on these flat
  // numbers, no formulas or randomness. Loosely modeled on how MUN judges
  // weight rubric lines: content failures (a bad, unsupported argument) cost
  // more than a conduct violation (profanity), which costs more than a style
  // tic (a filler word) — and a genuinely strong turn (rubric + lexis, not
  // just "not bad") is worth more than any single word-level hit.
  var FILLER_PENALTY = 15;
  var FILLER_PENALTY_LIGHT = 5;
  var CURSE_PENALTY = 25;
  var CONNECTIVE_HEAL = 5;
  var VOCAB_HEAL = 10;
  var BAD_ARGUMENT_PENALTY = 30;
  var STRONG_ARGUMENT_SELF_HEAL = 20;
  var STRONG_ARGUMENT_OPPONENT_DAMAGE = 20;

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
  function lookupKind(matched) {
    var lower = matched.toLowerCase();
    if (CLASSIFIER_LOOKUP[lower]) return CLASSIFIER_LOOKUP[lower];
    for (var i = 0; i < CLASSIFIER_SUFFIXES.length; i++) {
      var suf = CLASSIFIER_SUFFIXES[i];
      if (lower.length > suf.length && lower.slice(-suf.length) === suf) {
        var base = lower.slice(0, -suf.length);
        if (CLASSIFIER_LOOKUP[base]) return CLASSIFIER_LOOKUP[base];
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
    var html = escapeHtml(text);

    html = html.replace(CLASSIFIER_REGEX, function (m) {
      var kind = lookupKind(m);
      if (!kind) return m;
      counts[kind]++;
      return '<span class="' + CLASSIFIER_CLASS[kind] + '">' + m + '</span>';
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
      wordCount: words.length
    };
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
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
    var form = document.getElementById('cuss-arena-form');
    if (!arena || !form) return;

    var openBtns = [document.getElementById('cuss-start-hero')];
    var closeBtn = document.getElementById('cuss-arena-close');
    var transcript = document.getElementById('cuss-arena-transcript');
    var textarea = document.getElementById('cuss-arena-input');
    var highlightLayer = document.getElementById('cuss-arena-highlight');
    var submitBtn = document.getElementById('cuss-arena-submit');
    var typing = document.getElementById('cuss-arena-typing');
    var healthFill = document.getElementById('cuss-health-fill');
    var healthVal = document.getElementById('cuss-health-val');
    var aiHealthFill = document.getElementById('cuss-ai-health-fill');
    var aiHealthVal = document.getElementById('cuss-ai-health-val');
    var motionTextEl = document.getElementById('cuss-arena-motion-text');
    var judgePanel = document.getElementById('cuss-arena-judge');
    var judgeLogicFill = document.getElementById('cuss-judge-logic-fill');
    var judgeLogicVal = document.getElementById('cuss-judge-logic-val');
    var judgePrecisionFill = document.getElementById('cuss-judge-precision-fill');
    var judgePrecisionVal = document.getElementById('cuss-judge-precision-val');
    var judgeDeliveryFill = document.getElementById('cuss-judge-delivery-fill');
    var judgeDeliveryVal = document.getElementById('cuss-judge-delivery-val');
    var gameoverEl = document.getElementById('cuss-gameover');
    var gameoverTitle = document.getElementById('cuss-gameover-title');
    var gameoverSub = document.getElementById('cuss-gameover-sub');
    var gameoverRestartBtn = document.getElementById('cuss-gameover-restart');
    var stanceSelectEl = document.getElementById('cuss-stance-select');
    var stanceMotionText = document.getElementById('cuss-stance-motion-text');
    var stanceAffirmBtn = document.getElementById('cuss-stance-affirm');
    var stanceNegateBtn = document.getElementById('cuss-stance-negate');
    var stanceConfirmEl = document.getElementById('cuss-stance-confirm');
    var stanceConfirmYouEl = document.getElementById('cuss-stance-confirm-you');
    var stanceConfirmAiEl = document.getElementById('cuss-stance-confirm-ai');
    var healthLabelEl = document.getElementById('cuss-health-label');
    var aiHealthLabelEl = document.getElementById('cuss-ai-health-label');

    var MOTION = motionTextEl ? motionTextEl.textContent : '';
    var health = 100;
    var aiHealth = 100;
    var history = [];
    var roundStats = { filler: 0, curse: 0, connective: 0, vocab: 0, words: 0, solid: 0, neutral: 0, bad: 0 };
    var judgeAnimTimer = null;
    var roundOver = false;
    var stanceTimer = null;
    var playerSide = null;

    function resetRound() {
      MOTION = pickMotion();
      if (motionTextEl) motionTextEl.textContent = MOTION;
      if (stanceMotionText) stanceMotionText.textContent = MOTION;

      history = [];
      roundStats = { filler: 0, curse: 0, connective: 0, vocab: 0, words: 0, solid: 0, neutral: 0, bad: 0 };
      if (judgeAnimTimer) { clearTimeout(judgeAnimTimer); judgeAnimTimer = null; }
      if (stanceTimer) { clearTimeout(stanceTimer); stanceTimer = null; }

      roundOver = false;
      gameoverEl.hidden = true;

      setHealth(100);
      setAiHealth(100);

      judgePanel.classList.remove('is-visible');
      setJudgeBar(judgeLogicFill, judgeLogicVal, 0);
      setJudgeBar(judgePrecisionFill, judgePrecisionVal, 0);
      setJudgeBar(judgeDeliveryFill, judgeDeliveryVal, 0);

      transcript.innerHTML = '<p class="cuss-arena-empty">Your turn. Make the case for the resolution — precise phrasing strengthens your position, filler words weaken it instantly.</p>';
      typing.hidden = true;

      // Locked until a side is picked on the stance-select screen — see
      // chooseStance(), which re-enables these once the confirm beat ends.
      textarea.disabled = true;
      submitBtn.disabled = true;
      textarea.value = '';
      renderHighlight();

      playerSide = null;
      healthLabelEl.textContent = 'Your position';
      aiHealthLabelEl.textContent = 'AI opponent';
      stanceAffirmBtn.disabled = false;
      stanceNegateBtn.disabled = false;
      stanceConfirmEl.hidden = true;
      stanceConfirmYouEl.className = 'cuss-stance-confirm-row';
      stanceConfirmAiEl.className = 'cuss-stance-confirm-row';
      stanceSelectEl.hidden = false;
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
      healthLabelEl.textContent = 'Your position — ' + (side === 'affirm' ? 'Affirm' : 'Negate');
      aiHealthLabelEl.textContent = 'AI opponent — ' + (aiSide === 'affirm' ? 'Affirm' : 'Negate');

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
        textarea.focus();
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
      textarea.disabled = true;
      submitBtn.disabled = true;
      typing.hidden = true;
      gameoverTitle.textContent = playerWon ? 'You Win' : 'You Lose';
      gameoverTitle.classList.toggle('is-win', playerWon);
      gameoverTitle.classList.toggle('is-lose', !playerWon);
      gameoverSub.textContent = playerWon
        ? "The AI opponent's position collapsed under the pressure of your argument."
        : "Your position collapsed under the pressure of the AI opponent's argument.";
      gameoverEl.hidden = false;
    }

    // Applies the AI-judged per-turn verdict on top of the word-level delta
    // already scored for this turn. "solid" only pays out the bigger
    // symmetric bonus (self-heal + opponent damage) when it's backed by
    // actual lexis — logic alone isn't enough, matching the brief's
    // "good vocab, connectives, AND judged logically solid" conjunction.
    function applyVerdict(verdict, analysis, selfIsPlayer) {
      var selfVal = selfIsPlayer ? health : aiHealth;
      var oppVal = selfIsPlayer ? aiHealth : health;
      var setSelf = selfIsPlayer ? setHealth : setAiHealth;
      var setOpp = selfIsPlayer ? setAiHealth : setHealth;

      if (verdict === 'bad') {
        setSelf(selfVal - BAD_ARGUMENT_PENALTY);
      } else if (verdict === 'solid' && analysis.connectiveCount >= 1 && analysis.vocabCount >= 1) {
        setSelf(selfVal + STRONG_ARGUMENT_SELF_HEAL);
        setOpp(oppVal - STRONG_ARGUMENT_OPPONENT_DAMAGE);
      }
    }

    function setHealth(v) {
      health = clamp(v, 0, 100);
      healthFill.style.width = health + '%';
      healthVal.textContent = health;
    }

    function setAiHealth(v) {
      aiHealth = clamp(v, 0, 100);
      aiHealthFill.style.width = aiHealth + '%';
      aiHealthVal.textContent = aiHealth;
    }

    // Live word-by-word highlighting while typing — same highlight classes
    // and classifier the hero demo widget uses for its scripted reveal.
    function renderHighlight() {
      var value = textarea.value;
      highlightLayer.innerHTML = value ? classifyText(value).html : '';
      highlightLayer.scrollTop = textarea.scrollTop;
    }
    textarea.addEventListener('input', renderHighlight);
    textarea.addEventListener('scroll', function () {
      highlightLayer.scrollTop = textarea.scrollTop;
    });

    function openArena() {
      resetRound();
      arena.classList.add('is-open');
      arena.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      stanceAffirmBtn.focus();
    }
    function closeArena() {
      arena.classList.remove('is-open');
      arena.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    openBtns.forEach(function (btn) { if (btn) btn.addEventListener('click', openArena); });
    if (closeBtn) closeBtn.addEventListener('click', closeArena);
    if (gameoverRestartBtn) gameoverRestartBtn.addEventListener('click', resetRound);
    if (stanceAffirmBtn) stanceAffirmBtn.addEventListener('click', function () { chooseStance('affirm'); });
    if (stanceNegateBtn) stanceNegateBtn.addEventListener('click', function () { chooseStance('negate'); });
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

      var p = document.createElement('p');
      p.className = 'cuss-bubble-user';
      transcript.appendChild(p);

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

      var i = 0;
      function reveal() {
        if (i >= revealEls.length) {
          if (onDone) onDone();
          return;
        }
        revealEls[i].style.opacity = '1';
        i++;
        transcript.scrollTop = transcript.scrollHeight;
        setTimeout(reveal, 160);
      }
      reveal();
    }

    // Reuses the demo widget's "AI opponent rebuts" card — same
    // .cuss-ai-card / .cuss-ai-label markup and .is-visible fade-in.
    function addAiCard(html, label) {
      var card = document.createElement('div');
      card.className = 'cuss-ai-card cuss-bubble-ai';
      var labelEl = document.createElement('p');
      labelEl.className = 'cuss-ai-label';
      labelEl.textContent = label || 'AI opponent rebuts';
      var body = document.createElement('p');
      body.className = 'cuss-ai-body';
      body.innerHTML = html;
      card.appendChild(labelEl);
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
    function computeJudgeTargets() {
      var turns = roundStats.solid + roundStats.neutral + roundStats.bad;
      if (!turns) return { logic: 0, precision: 0, delivery: 0 };

      var verdictAvg = (roundStats.solid * 90 + roundStats.neutral * 50 - roundStats.bad * 20) / turns;
      var avgWords = roundStats.words / turns;

      return {
        logic: Math.round(clamp(verdictAvg + roundStats.connective * 3 - roundStats.filler * 2, 0, 100)),
        precision: Math.round(clamp(roundStats.vocab * 9 - roundStats.filler * 6 - roundStats.curse * 5, 0, 100)),
        delivery: Math.round(clamp(Math.min(avgWords, 25) * 2.4 - roundStats.filler * 9 - roundStats.curse * 10, 0, 100))
      };
    }

    function setJudgeBar(fillEl, valEl, v) {
      fillEl.style.width = v + '%';
      valEl.textContent = v;
    }

    function revealJudge() {
      var targets = computeJudgeTargets();
      judgePanel.classList.add('is-visible');
      if (judgeAnimTimer) clearTimeout(judgeAnimTimer);

      var n = 14;
      var step = 0;
      function tick() {
        var p = Math.min(step, n) / n;
        setJudgeBar(judgeLogicFill, judgeLogicVal, Math.round(targets.logic * p));
        setJudgeBar(judgePrecisionFill, judgePrecisionVal, Math.round(targets.precision * p));
        setJudgeBar(judgeDeliveryFill, judgeDeliveryVal, Math.round(targets.delivery * p));
        if (step < n) {
          step++;
          judgeAnimTimer = setTimeout(tick, 40);
        }
      }
      tick();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (roundOver || !playerSide) return;
      var text = textarea.value.trim();
      if (!text) return;

      var analysis = classifyText(text);
      setHealth(health + analysis.delta);
      roundStats.filler += analysis.fillerCount + analysis.fillerLightCount;
      roundStats.curse += analysis.curseCount;
      roundStats.connective += analysis.connectiveCount;
      roundStats.vocab += analysis.vocabCount;
      roundStats.words += analysis.wordCount;

      history.push({ role: 'user', content: text });
      textarea.value = '';
      renderHighlight();
      textarea.disabled = true;
      submitBtn.disabled = true;

      // A speaker can only self-KO from their own word-level hits, so this
      // can already be decided before the AI is even asked to respond.
      if (checkGameOver()) {
        addUserBubbleAnimated(analysis.html, function () {});
        return;
      }

      // Fire the request in parallel with the reveal animation so the two
      // don't add up — the AI card still waits for both to finish.
      var respondPromise = fetch('/api/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motion: MOTION, argument: text, history: history, side: playerSide })
      })
        .then(function (res) {
          return res.json().then(function (data) { return { ok: res.ok, data: data }; });
        })
        .catch(function () {
          return { ok: false, data: { error: 'Failed to reach the server. Make sure server.py is running.' } };
        });

      addUserBubbleAnimated(analysis.html, function () {
        typing.hidden = false;
        respondPromise.then(function (result) {
          typing.hidden = true;
          if (!result.ok) {
            addError(result.data.error || 'Failed to get a response from the AI opponent.');
            textarea.disabled = false;
            submitBtn.disabled = false;
            textarea.focus();
            return;
          }

          // The AI's holistic verdict on the user's own turn — can push the
          // player's Credibility the rest of the way to 0 (bad) or land the
          // symmetric strong-argument hit on the AI (solid + lexis). Also
          // feeds the Judge panel's Logic score (see computeJudgeTargets) —
          // that's the only signal there that reflects whether the turn was
          // an actual argument at all, not just its word choice.
          if (result.data.user_argument_verdict === 'solid') roundStats.solid++;
          else if (result.data.user_argument_verdict === 'bad') roundStats.bad++;
          else roundStats.neutral++;
          applyVerdict(result.data.user_argument_verdict, analysis, true);
          if (checkGameOver()) return;

          var aiAnalysis = classifyText(result.data.reply);
          addAiCard(aiAnalysis.html, 'AI opponent rebuts');
          setAiHealth(aiHealth + aiAnalysis.delta);
          history.push({ role: 'assistant', content: result.data.reply });
          if (checkGameOver()) return;

          // Same verdict treatment, mirrored onto the AI's own rebuttal —
          // a lazy reply hurts the AI, a sharp one hurts the player back.
          applyVerdict(result.data.ai_reply_verdict, aiAnalysis, false);
          if (checkGameOver()) return;

          setTimeout(revealJudge, 700);
          textarea.disabled = false;
          submitBtn.disabled = false;
          textarea.focus();
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initDemo();
    initArena();
  });
})();
