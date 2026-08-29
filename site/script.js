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
    'gonna', 'wanna', 'gotta', "ain't", 'tbh', 'idk', 'imo', 'like literally', 'super literally'
  ];
  // Light filler tier — common but milder verbal habits, -5 Credibility each.
  var FILLER_WORDS_LIGHT = ['actually', 'honestly', 'literally', 'well', 'so'];

  // Stronger-alternative suggestions for the post-round recap, grouped by
  // the underlying weak-speech pattern rather than written one by one —
  // every FILLER_WORDS / FILLER_WORDS_LIGHT entry belongs to exactly one
  // group below, so every filler the player actually used has a suggestion.
  var FILLER_ALTERNATIVE_GROUPS = [
    { words: ['kind of', 'kinda', 'sort of', 'sorta', 'kind of like', 'sort of like', 'somewhat',
        'more or less', 'pretty much', 'in a way', 'in some way', 'basically', 'whatever'],
      alternatives: ['specifically', 'precisely'] },
    { words: ['i think', 'i guess', 'i feel like', 'i would say', 'i suppose', 'i would guess', 'imo'],
      alternatives: ['I would argue', 'the evidence suggests'] },
    { words: ['maybe', 'probably', 'possibly'],
      alternatives: ['likely', 'the data indicates'] },
    { words: ['like', 'um', 'uh', 'umm', 'uhh', 'erm', 'hmm', 'so yeah', 'okay so', 'anyway',
        'anyways', 'well', 'so', 'i mean'],
      alternatives: ['(cut it, lead with the claim)', 'therefore'] },
    { words: ['or something', 'or whatever', 'and stuff', 'and things', 'stuff like that',
        'whatnot', 'and whatnot', 'or anything', 'and everything', 'just saying',
        'not gonna lie', 'sum'],
      alternatives: ['for example', 'specifically'] },
    { words: ['you know', 'you know what i mean', 'like i said', 'as i said'],
      alternatives: ['to be clear', 'specifically'] },
    { words: ['to be honest', 'honestly speaking', 'tbh', 'honestly'],
      alternatives: ['in fact', 'clearly'] },
    { words: ['actually'],
      alternatives: ['in fact', 'notably'] },
    { words: ['literally', 'like literally', 'super literally'],
      alternatives: ['precisely', '(cut it)'] },
    { words: ['i dunno', "i don't know", 'dunno', 'idk'],
      alternatives: ["I'm not certain, but", 'further evidence would clarify'] },
    { words: ['tryna', 'finna', 'gonna', 'wanna', 'gotta', "ain't", "y'all", 'yall', 'pmo',
        'trna', 'dat', 'typa', 'ima', 'lwk', 'js', 'ts', 'lowkey', 'highkey'],
      alternatives: ['(use the formal phrasing)', 'trying to / going to'] },
    { words: ['at the end of the day', 'technically speaking'],
      alternatives: ['ultimately', 'in practice'] },
    { words: ['if that makes sense'],
      alternatives: ['(cut it, trust your claim)', 'specifically'] }
  ];
  var FILLER_ALTERNATIVES = {};
  FILLER_ALTERNATIVE_GROUPS.forEach(function (group) {
    group.words.forEach(function (w) { FILLER_ALTERNATIVES[w] = group.alternatives; });
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
    var html = escapeHtml(text);

    html = html.replace(CLASSIFIER_REGEX, function (m) {
      var entry = lookupEntry(m);
      if (!entry) return m;
      counts[entry.kind]++;
      if (entry.kind === 'filler' || entry.kind === 'fillerLight') fillerWordsUsed.push(entry.base);
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
      fillerWordsUsed: fillerWordsUsed
    };
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
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
    var form = document.getElementById('cuss-arena-form');
    if (!arena || !form) return;

    // Per-turn countdown — ticks only while it's actually the player's turn
    // (textarea enabled), pausing during the AI's response, the stance-select
    // screen, and after the round ends. Purely a visible pressure cue: it
    // doesn't auto-submit or penalize on timeout, just holds at 00:00.
    var TURN_DURATION_SECONDS = 60;

    // Word Economy budget — a fixed per-round pool of "tokens" (see
    // countWordTokens: 1 token = 1 word, not a real subword tokenizer).
    // Spent cumulatively across every argument submitted this round;
    // running out ends the round through the same Credibility-loss path
    // as any other auto-loss (see checkTokenBudget()).
    var TOKEN_POOL_SIZE = 300;

    var openBtns = [document.getElementById('cuss-start-hero'), document.getElementById('cuss-start-nav')];
    var enterOverlayEl = document.getElementById('cuss-enter-overlay');
    var ENTER_ANIM_DURATION = 2200; // must match the CSS keyframes' 2.2s duration
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
    var resultOverlay = document.getElementById('cuss-result-transition');
    var resultVerdict = document.getElementById('cuss-result-verdict');
    var resultHeadline = document.getElementById('cuss-result-headline');
    var resultSub = document.getElementById('cuss-result-sub');
    var resultRuleText = document.getElementById('cuss-result-rule-text');
    var RESULT_ANIM_DURATION = 3600; // must match the CSS keyframes' 3.6s duration
    var RESULT_LINE_DRAW_DELAY = 2700; // matches the keyframes' ~75-78% reveal point
    var recapEl = document.getElementById('cuss-recap');
    var trendEl = document.getElementById('cuss-trend');
    var stanceSelectEl = document.getElementById('cuss-stance-select');
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

    // Cost of one Simplify action, deducted from the same Word Economy pool
    // as everything else (see checkTokenBudget()) — comprehension help isn't
    // free, it's just another way to spend the pool. Unavailable entirely in
    // Chair mode, since that difficulty is opt-in hard mode.
    var SIMPLIFY_COST = 25;

    var MOTION = motionTextEl ? motionTextEl.textContent : '';
    var health = 100;
    var aiHealth = 100;
    var history = [];
    var roundStats = { filler: 0, curse: 0, connective: 0, vocab: 0, words: 0, solid: 0, neutral: 0, bad: 0 };
    var roundFillerWords = {};
    var judgeAnimTimer = null;
    var roundOver = false;
    var stanceTimer = null;
    var resultLineTimer = null;
    var resultDoneTimer = null;
    var playerSide = null;
    var difficulty = 'delegate';
    var turnTimer = null;
    var turnSecondsLeft = TURN_DURATION_SECONDS;
    var tokensUsed = 0;

    function formatTurnTime(s) {
      var m = Math.floor(s / 60);
      var r = s % 60;
      return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
    }

    function updateTurnTimerDisplay() {
      if (!turnTimerEl) return;
      turnTimerEl.textContent = formatTurnTime(turnSecondsLeft);
      turnTimerEl.classList.toggle('is-warn', turnSecondsLeft > 0 && turnSecondsLeft <= 10);
    }

    function stopTurnTimer() {
      if (turnTimer) { clearInterval(turnTimer); turnTimer = null; }
    }

    function startTurnTimer() {
      stopTurnTimer();
      turnSecondsLeft = TURN_DURATION_SECONDS;
      updateTurnTimerDisplay();
      turnTimer = setInterval(function () {
        turnSecondsLeft = Math.max(0, turnSecondsLeft - 1);
        updateTurnTimerDisplay();
        if (turnSecondsLeft === 0) stopTurnTimer();
      }, 1000);
    }

    function updateTokenDisplay(remaining) {
      if (!tokenValEl) return;
      tokenValEl.textContent = remaining;
      if (tokenBudgetEl) tokenBudgetEl.classList.toggle('is-critical', remaining <= TOKEN_POOL_SIZE * 0.1);
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
      var remaining = TOKEN_POOL_SIZE - tokensUsed - draftCount;
      updateTokenDisplay(Math.max(0, remaining));
      if (remaining <= 0) {
        setHealth(0);
        checkGameOver();
      }
    }

    function resetRound() {
      MOTION = pickMotion();
      if (motionTextEl) motionTextEl.textContent = MOTION;
      if (stanceMotionText) stanceMotionText.textContent = MOTION;

      history = [];
      roundStats = { filler: 0, curse: 0, connective: 0, vocab: 0, words: 0, solid: 0, neutral: 0, bad: 0 };
      roundFillerWords = {};
      recapEl.innerHTML = '';
      trendEl.innerHTML = '';
      if (judgeAnimTimer) { clearTimeout(judgeAnimTimer); judgeAnimTimer = null; }
      if (stanceTimer) { clearTimeout(stanceTimer); stanceTimer = null; }
      if (resultLineTimer) { clearTimeout(resultLineTimer); resultLineTimer = null; }
      if (resultDoneTimer) { clearTimeout(resultDoneTimer); resultDoneTimer = null; }
      if (resultOverlay) {
        resultOverlay.classList.remove('playing-win', 'playing-lose');
        resultOverlay.hidden = true;
      }
      if (resultVerdict) resultVerdict.classList.remove('line-drawn');
      stopTurnTimer();
      turnSecondsLeft = TURN_DURATION_SECONDS;
      updateTurnTimerDisplay();
      tokensUsed = 0;
      if (tokenBudgetEl) tokenBudgetEl.classList.remove('is-critical');
      updateTokenDisplay(TOKEN_POOL_SIZE);

      roundOver = false;
      gameoverEl.hidden = true;
      gameoverEl.classList.remove('is-visible');

      setHealth(100);
      setAiHealth(100);

      judgePanel.classList.remove('is-visible');
      judgePanel.hidden = true;
      setJudgeBar(judgeLogicFill, judgeLogicVal, 0);
      setJudgeBar(judgePrecisionFill, judgePrecisionVal, 0);
      setJudgeBar(judgeDeliveryFill, judgeDeliveryVal, 0);

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
      textarea.value = '';
      renderHighlight();

      playerSide = null;
      setDifficulty('delegate');
      healthLabelEl.textContent = 'Your position';
      aiHealthLabelEl.textContent = 'AI opponent';
      if (arenaSideEl) { arenaSideEl.hidden = true; arenaSideEl.textContent = ''; arenaSideEl.className = 'tag tag-outline cuss-arena-side'; }
      stanceAffirmBtn.disabled = false;
      stanceNegateBtn.disabled = false;
      stanceConfirmEl.hidden = true;
      stanceConfirmYouEl.className = 'cuss-stance-confirm-row';
      stanceConfirmAiEl.className = 'cuss-stance-confirm-row';
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
      if (arenaSideEl) {
        arenaSideEl.hidden = false;
        arenaSideEl.textContent = side === 'affirm' ? 'AFFIRM' : 'NEGATE';
        arenaSideEl.classList.add(side === 'affirm' ? 'is-affirm' : 'is-negate');
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
      textarea.disabled = true;
      submitBtn.disabled = true;
      typing.hidden = true;
      typing.classList.remove('is-visible');
      stopTurnTimer();

      // The turn that ends the round can return before the normal
      // post-turn reveal path reaches revealJudge() (see the submit
      // handler's early checkGameOver() returns) — call it here too so
      // the panel always reflects the final turn, not the one before it.
      revealJudge();
      gameoverTitle.textContent = playerWon ? 'You Win' : 'You Lose';
      gameoverTitle.classList.toggle('is-win', playerWon);
      gameoverTitle.classList.toggle('is-lose', !playerWon);
      gameoverSub.textContent = playerWon
        ? "The AI opponent's position collapsed under the pressure of your argument."
        : "Your position collapsed under the pressure of the AI opponent's argument.";

      var totalFillerThisRound = Object.keys(roundFillerWords).reduce(function (sum, w) {
        return sum + roundFillerWords[w];
      }, 0);
      var priorHistory = loadRoundHistory();
      recordRoundFillerCount(totalFillerThisRound);
      renderRoundTrend(totalFillerThisRound, priorHistory);

      renderFillerRecap();
      playRoundResultTransition(playerWon, function () {
        gameoverEl.hidden = false;
        requestAnimationFrame(function () { gameoverEl.classList.add('is-visible'); });
      });
    }

    // Ping-pong-volley win/lose transition, same visual language as
    // "Entering the Chat" (playEnterThenOpen()) — plays once, then hands off
    // to the existing gameover reveal via onDone(). Upper lip = player,
    // lower = AI, matching the health-bar order; whichever one "returns" the
    // final volley vs. fades out as the ball flies past is driven entirely
    // by playerWon, never guessed from anything else. Only ever called from
    // endRound(), which itself only runs once per round (see roundOver
    // guard in checkGameOver()) — so this can't double-fire or play for a
    // mid-round state.
    function playRoundResultTransition(playerWon, onDone) {
      if (!resultOverlay || !resultVerdict) { onDone(); return; }
      if (resultLineTimer) clearTimeout(resultLineTimer);
      if (resultDoneTimer) clearTimeout(resultDoneTimer);

      resultHeadline.textContent = playerWon ? 'YOU WIN' : 'YOU LOSE';
      resultSub.textContent = playerWon ? 'CREDIBILITY HELD' : 'POSITION COLLAPSED';
      resultRuleText.textContent = playerWon ? 'MOTION CARRIES' : 'MOTION FAILS';

      resultOverlay.classList.remove('playing-win', 'playing-lose');
      resultVerdict.classList.remove('line-drawn');
      resultOverlay.hidden = false;
      void resultOverlay.offsetWidth; // reflow so the keyframes always start from frame 0
      resultOverlay.classList.add(playerWon ? 'playing-win' : 'playing-lose');

      resultLineTimer = setTimeout(function () {
        resultVerdict.classList.add('line-drawn');
      }, RESULT_LINE_DRAW_DELAY);

      resultDoneTimer = setTimeout(function () {
        resultOverlay.classList.remove('playing-win', 'playing-lose');
        resultOverlay.hidden = true;
        onDone();
      }, RESULT_ANIM_DURATION);
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
    function applyVerdict(verdict, selfIsPlayer) {
      var selfVal = selfIsPlayer ? health : aiHealth;
      var oppVal = selfIsPlayer ? aiHealth : health;
      var setSelf = selfIsPlayer ? setHealth : setAiHealth;
      var setOpp = selfIsPlayer ? setAiHealth : setHealth;

      if (verdict === 'bad') {
        setSelf(selfVal - BAD_ARGUMENT_PENALTY);
      } else if (verdict === 'solid') {
        setSelf(selfVal + STRONG_ARGUMENT_SELF_HEAL);
        setOpp(oppVal - STRONG_ARGUMENT_OPPONENT_DAMAGE);
      }
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

    function updateHealthDisplay(fillEl, valEl, value, previous) {
      fillEl.style.width = value + '%';
      valEl.textContent = value;

      var isCritical = value <= 25;
      var isWarning = !isCritical && value <= 50;
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
      var next = clamp(v, 0, 100);
      updateHealthDisplay(healthFill, healthVal, next, health);
      health = next;
    }

    function setAiHealth(v) {
      var next = clamp(v, 0, 100);
      updateHealthDisplay(aiHealthFill, aiHealthVal, next, aiHealth);
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

    // Plays once on every Chat click, before the round setup (motion /
    // difficulty / side) screen appears — see .cuss-enter-overlay in
    // styles.css for the animation itself. Falls back to opening the arena
    // immediately if the overlay markup is ever missing.
    function playEnterThenOpen() {
      if (!enterOverlayEl) { openArena(); return; }
      document.body.style.overflow = 'hidden';
      enterOverlayEl.hidden = false;
      enterOverlayEl.classList.remove('is-playing');
      void enterOverlayEl.offsetWidth; // reflow so a repeat click restarts the keyframes
      enterOverlayEl.classList.add('is-playing');
      setTimeout(function () {
        enterOverlayEl.classList.remove('is-playing');
        enterOverlayEl.hidden = true;
        openArena();
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
    // rawText (the AI's plain, unhighlighted reply) is only needed for the
    // Simplify action — omit it (or play Chair) and no button is rendered.
    function addAiCard(html, label, rawText) {
      var card = document.createElement('div');
      card.className = 'cuss-ai-card cuss-bubble-ai';

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
          var remaining = TOKEN_POOL_SIZE - tokensUsed;
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
      var turns = roundStats.solid + roundStats.neutral + roundStats.bad;
      if (!turns) return { logic: 0, precision: 0, delivery: 0 };

      var verdictAvg = (roundStats.solid * 90 + roundStats.neutral * 50 - roundStats.bad * 20) / turns;
      var avgWords = roundStats.words / turns;

      return {
        logic: Math.round(clamp(verdictAvg + roundStats.connective * 3 - roundStats.filler * 2, 0, 100)),
        precision: Math.round(clamp(verdictAvg * 0.4 + roundStats.vocab * 9 - roundStats.filler * 6 - roundStats.curse * 5, 0, 100)),
        delivery: Math.round(clamp(Math.min(avgWords, 25) * 2.4 - roundStats.filler * 9 - roundStats.curse * 10, 0, 100))
      };
    }

    function setJudgeBar(fillEl, valEl, v) {
      fillEl.style.width = v + '%';
      valEl.textContent = v;
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
      analysis.fillerWordsUsed.forEach(function (w) {
        roundFillerWords[w] = (roundFillerWords[w] || 0) + 1;
      });
      recordFillerWords(analysis.fillerWordsUsed);
      tokensUsed += countWordTokens(text);

      history.push({ role: 'user', content: text });
      textarea.value = '';
      renderHighlight();
      textarea.disabled = true;
      submitBtn.disabled = true;
      stopTurnTimer();
      checkTokenBudget();

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
        body: JSON.stringify({ motion: MOTION, argument: text, history: history, side: playerSide, difficulty: difficulty })
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
            addError(result.data.error || 'Failed to get a response from the AI opponent.');
            textarea.disabled = false;
            submitBtn.disabled = false;
            textarea.focus();
            startTurnTimer();
            return;
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
          applyVerdict(result.data.user_argument_verdict, true);
          if (checkGameOver()) return;

          var aiAnalysis = classifyText(result.data.reply);
          addAiCard(aiAnalysis.html, 'AI opponent rebuts', result.data.reply);
          setAiHealth(aiHealth + aiAnalysis.delta);
          history.push({ role: 'assistant', content: result.data.reply });
          if (checkGameOver()) return;

          // Same verdict treatment, mirrored onto the AI's own rebuttal —
          // a lazy reply hurts the AI, a sharp one hurts the player back.
          applyVerdict(result.data.ai_reply_verdict, false);
          if (checkGameOver()) return;

          // Update the Judge panel BEFORE unlocking the input — otherwise a
          // fast player can submit the next argument while this turn's
          // scores are still pending, and the panel reads one exchange
          // behind until the following reveal catches up.
          revealJudge();
          textarea.disabled = false;
          submitBtn.disabled = false;
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
        var row = document.createElement('div');
        row.className = 'cuss-recap-row';

        var from = document.createElement('span');
        from.className = 'cuss-recap-from';
        from.textContent = '"' + entry.word + '" ×' + entry.count;

        var arrow = document.createElement('span');
        arrow.className = 'cuss-recap-arrow';
        arrow.textContent = '→';

        var to = document.createElement('span');
        to.className = 'cuss-recap-to';
        to.textContent = alternatives.join(' / ');

        row.appendChild(from);
        row.appendChild(arrow);
        row.appendChild(to);
        scarsList.appendChild(row);
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
  // different words. Shows exactly one word with its one matching
  // definition; a earlier 3-slot scrolling-reel version showed decoy words
  // stacked with fading opacity above/below the real one, which read as
  // three simultaneous candidates rather than a single clear pick.
  function initWordOfDay() {
    var wordEl = document.getElementById('cuss-wotd-word');
    var defEl = document.getElementById('cuss-wotd-def');
    if (!wordEl || !defEl) return;

    var entry = WORD_OF_DAY_ENTRIES[Math.floor(Math.random() * WORD_OF_DAY_ENTRIES.length)];
    wordEl.textContent = entry.word;
    defEl.textContent = entry.def;

    requestAnimationFrame(function () {
      wordEl.classList.add('is-visible');
      defEl.classList.add('is-visible');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initDemo();
    initArena();
    initVocabScars();
    initHomepageStat();
    initWordOfDay();
  });
})();
