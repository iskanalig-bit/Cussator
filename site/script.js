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

  var WEAK_PHRASES = [
    'kind of', 'sort of', 'basically', 'i guess', 'i think', 'i mean', 'you know',
    'maybe', 'probably', 'possibly', 'sorta', 'kinda', 'somewhat', 'more or less',
    'как бы', 'вроде бы', 'вроде', 'типа', 'наверное', 'наверно', 'скорее всего',
    'мне кажется', 'я думаю', 'в принципе', 'в общем-то', 'короче', 'ну типа', 'если что'
  ];
  var STRONG_KEYWORDS = [
    'because', 'therefore', 'evidence', 'data', 'specifically', 'precisely', 'requires', 'means',
    'потому что', 'поэтому', 'следовательно', 'данные', 'исследование', 'статистика',
    'конкретно', 'доказывает', 'означает', 'например'
  ];
  // Curated advanced-vocabulary list (English + Russian) as a stand-in for a
  // real CEFR classifier — flags B2/C1/C2-level lexis with the "vocab" tag.
  // Grouped by debate topic for maintainability. Matched with light suffix
  // tolerance (see classifyText) so "exacerbate" also catches "exacerbates",
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

    // — Russian —
    // general academic
    'имплицитный', 'эксплицитный', 'детерминировать', 'амбивалентный', 'релевантный',
    'инкорпорировать', 'констатировать', 'коннотация', 'парадигма', 'дискурс', 'имманентный',
    'гипотетически', 'квинтэссенция', 'нивелировать', 'предпосылка', 'целесообразно',
    'всеобъемлющий', 'беспрецедентный', 'многогранный', 'эмпирический', 'устойчивый',
    'правдоподобный', 'легитимный', 'катализатор', 'когерентный', 'достоверный', 'сомнительный',
    'спорный', 'поляризующий', 'непоколебимый', 'безальтернативный', 'чрезмерный',
    'произвольный', 'непредсказуемый', 'неизбежный', 'первостепенный', 'незаменимый',
    'устаревший', 'анахроничный', 'нетрадиционный', 'новаторский', 'преобразующий', 'грозный',
    'непреодолимый', 'шаткий', 'надуманный', 'непропорциональный', 'асимметричный',
    'укоренившийся', 'повсеместный', 'безудержный', 'распространённый', 'хронический',
    'мимолётный', 'недальновидный', 'дальновидный', 'благоразумный', 'неосмотрительный',
    'беспечность', 'апатия', 'безразличие', 'двусмысленный', 'однозначный', 'категоричный',
    'окончательный', 'предварительный', 'обусловленный',
    // politics
    'многосторонний', 'односторонний', 'двусторонний', 'надпартийный', 'суверенитет',
    'суверенный', 'геополитический', 'автократия', 'авторитарный', 'тоталитарный', 'олигархия',
    'гегемония', 'дипломатия', 'диссидент', 'коалиция', 'референдум', 'сецессия', 'аннексия',
    'санкции', 'умиротворение', 'пропаганда', 'цензура', 'эгалитарный', 'электорат',
    'повстанческий', 'ратифицировать', 'мандат', 'автономия', 'федерализм', 'централизованный',
    'децентрализованный', 'реваншизм', 'ксенофобия',
    // economics
    'неравноправный', 'диспропорция', 'стагнация', 'рецессия', 'инфляционный', 'дефляционный',
    'субсидировать', 'дефицит', 'профицит', 'фискальный', 'монетарный', 'приватизация',
    'национализация', 'монополия', 'олигополия', 'картель', 'спекулятивный', 'волатильность',
    'ликвидность', 'неплатёжеспособность', 'банкротство', 'дискреционный', 'перераспределение',
    'эксплуататорский', 'прекарность', 'стимулировать', 'дестимулировать', 'неустойчивый',
    'непомерный', 'прибыльный', 'скудный', 'убывающий', 'экспоненциальный', 'осязаемый',
    'неосязаемый', 'затяжной', 'регрессивный',
    // science
    'гипотеза', 'методология', 'фальсифицируемый', 'воспроизводимый', 'корреляция',
    'причинность', 'аномалия', 'феномен', 'количественный', 'качественный', 'продольный',
    'теоретический', 'строгий', 'неубедительный', 'предположение', 'дедукция', 'индукция',
    'умозаключение', 'эмпиризм', 'калибровка', 'экстраполяция', 'верифицируемый',
    // philosophy / ethics
    'утилитарный', 'деонтологический', 'консеквенциалистский', 'нормативный', 'релятивизм',
    'абсолютизм', 'дихотомия', 'парадокс', 'софистика', 'риторика', 'силлогизм', 'эпистемология',
    'онтология', 'метафизический', 'экзистенциальный', 'нигилизм', 'детерминизм', 'принуждение',
    'соучастие', 'святость', 'вопиющий', 'предосудительный', 'недопустимый', 'неоправданный',
    'лицемерие', 'лицемерный', 'покровительственный', 'мнимый',
    // law
    'тяжба', 'истец', 'ответчик', 'виновный', 'ответственность', 'прецедент', 'юриспруденция',
    'статут', 'конституционность', 'показания', 'допустимый', 'обвинение', 'оправдание',
    'осуждение', 'экстрадиция', 'арбитраж', 'посредничество', 'договорный', 'нарушение',
    // society
    'маргинализированный', 'стигматизировать', 'увековечивать', 'социально-экономический',
    'демографический', 'ассимиляция', 'интеграция', 'сегрегация', 'дискриминационный',
    'предвзятость', 'остракизм', 'отчуждение', 'недопредставленный', 'институционализированный'
  ];

  function classifyText(text) {
    var weakCount = 0;
    var strongCount = 0;
    var vocabCount = 0;
    var html = escapeHtml(text);

    if (WEAK_PHRASES.length) {
      var weakRe = new RegExp('\\b(' + WEAK_PHRASES.map(escapeRegex).join('|') + ')\\b', 'gi');
      html = html.replace(weakRe, function (m) {
        weakCount++;
        return '<span class="cuss-weak">' + m + '</span>';
      });
    }
    if (STRONG_KEYWORDS.length) {
      var strongRe = new RegExp('\\b(' + STRONG_KEYWORDS.map(escapeRegex).join('|') + ')\\b', 'gi');
      html = html.replace(strongRe, function (m) {
        strongCount++;
        return '<span class="cuss-strong">' + m + '</span>';
      });
    }
    if (VOCAB_WORDS.length) {
      // Light suffix tolerance — "exacerbate" also catches "exacerbates" /
      // "exacerbated" / "exacerbately" without listing every inflected form.
      var vocabRe = new RegExp('\\b(' + VOCAB_WORDS.map(escapeRegex).join('|') + ')(?:s|es|d|ed|ly)?\\b', 'gi');
      html = html.replace(vocabRe, function (m) {
        vocabCount++;
        return '<span class="cuss-vocab">' + m + '</span>';
      });
    }

    // Generic precision signal: long/technical words and numbers still count
    // as "strong" even when they aren't in the fixed STRONG_KEYWORDS list —
    // otherwise a clean, filler-free argument with no listed keyword never
    // moves the bar (delta stayed 0 for most normal sentences).
    var words = text.split(/\s+/).filter(Boolean);
    var specificCount = 0;
    words.forEach(function (w) {
      var clean = w.replace(/[^\wа-яёА-ЯЁ]/g, '');
      if (clean.length >= 7 || /\d/.test(clean)) specificCount++;
    });

    var delta = strongCount * 6 + Math.min(specificCount, 5) * 3 - weakCount * 12;
    if (weakCount === 0 && words.length >= 5) delta += 6;
    if (words.length < 3) delta -= 5;

    return {
      html: html,
      delta: delta,
      weakCount: weakCount,
      strongCount: strongCount,
      specificCount: specificCount,
      vocabCount: vocabCount,
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

    var openBtns = [document.getElementById('cuss-start-nav'), document.getElementById('cuss-start-hero')];
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

    var MOTION = motionTextEl ? motionTextEl.textContent : '';
    var health = 100;
    var aiHealth = 100;
    var history = [];
    var roundStats = { weak: 0, strong: 0, specific: 0, words: 0 };
    var judgeAnimTimer = null;

    function resetRound() {
      MOTION = pickMotion();
      if (motionTextEl) motionTextEl.textContent = MOTION;

      history = [];
      roundStats = { weak: 0, strong: 0, specific: 0, words: 0 };
      if (judgeAnimTimer) { clearTimeout(judgeAnimTimer); judgeAnimTimer = null; }

      setHealth(100);
      setAiHealth(100);

      judgePanel.classList.remove('is-visible');
      setJudgeBar(judgeLogicFill, judgeLogicVal, 0);
      setJudgeBar(judgePrecisionFill, judgePrecisionVal, 0);
      setJudgeBar(judgeDeliveryFill, judgeDeliveryVal, 0);

      transcript.innerHTML = '<p class="cuss-arena-empty">Your turn. Make the case for the resolution — precise phrasing strengthens your position, filler words weaken it instantly.</p>';
      typing.hidden = true;

      textarea.value = '';
      renderHighlight();
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

    // Live word-by-word highlighting while typing — same .cuss-weak/.cuss-strong
    // classes and classifier the hero demo widget uses for its scripted reveal.
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
      textarea.focus();
    }
    function closeArena() {
      arena.classList.remove('is-open');
      arena.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    openBtns.forEach(function (btn) { if (btn) btn.addEventListener('click', openArena); });
    if (closeBtn) closeBtn.addEventListener('click', closeArena);
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

    // Reuses the demo widget's "AI opponent interrupts" card — same
    // .cuss-ai-card / .cuss-ai-label markup and .is-visible fade-in.
    function addAiIntercept(html) {
      var card = document.createElement('div');
      card.className = 'cuss-ai-card cuss-bubble-ai';
      var label = document.createElement('p');
      label.className = 'cuss-ai-label';
      label.textContent = 'AI opponent interrupts';
      var body = document.createElement('p');
      body.className = 'cuss-ai-body';
      body.innerHTML = html;
      card.appendChild(label);
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

    // Judge scores the user's own performance across the round so far —
    // it does not take a side in the argument, just grades it. Same
    // 14-step / 40ms stepped fill the demo widget's animateJudge() uses.
    function computeJudgeTargets() {
      return {
        logic: Math.round(clamp(50 + roundStats.strong * 8 - roundStats.weak * 5, 0, 100)),
        precision: Math.round(clamp(35 + roundStats.specific * 9 - roundStats.weak * 8, 0, 100)),
        delivery: Math.round(clamp(60 - roundStats.weak * 9 + Math.min(roundStats.words / 8, 25), 0, 100))
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
      var text = textarea.value.trim();
      if (!text) return;

      var analysis = classifyText(text);
      setHealth(health + analysis.delta);
      roundStats.weak += analysis.weakCount;
      roundStats.strong += analysis.strongCount;
      roundStats.specific += analysis.specificCount;
      roundStats.words += analysis.wordCount;

      history.push({ role: 'user', content: text });
      textarea.value = '';
      renderHighlight();
      textarea.disabled = true;
      submitBtn.disabled = true;

      // Fire the request in parallel with the reveal animation so the two
      // don't add up — the AI card still waits for both to finish.
      var respondPromise = fetch('/api/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motion: MOTION, argument: text, history: history })
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
          } else {
            var aiAnalysis = classifyText(result.data.reply);
            addAiIntercept(aiAnalysis.html);
            setAiHealth(aiHealth + aiAnalysis.delta);
            history.push({ role: 'assistant', content: result.data.reply });
            setTimeout(revealJudge, 700);
          }
          textarea.disabled = false;
          submitBtn.disabled = false;
          textarea.focus();
        });
      });
    });
  }

  function initSignupForm() {
    var form = document.getElementById('cuss-signup-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var button = form.querySelector('button');
      var input = form.querySelector('input');
      if (!input.checkValidity()) { input.reportValidity(); return; }
      button.textContent = 'Spot reserved';
      button.disabled = true;
      input.disabled = true;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initDemo();
    initArena();
    initSignupForm();
  });
})();
