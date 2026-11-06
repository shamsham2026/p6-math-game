/**
 * 聰明鳥 — protagonist adventure progress (run / jump / fly).
 * Advances on correct answers; stumbles briefly on wrong.
 */
(function (global) {
  'use strict';

  var HERO_NAME = '聰明鳥';

  /** Mission stages (index = stage) */
  var STAGES = [
    { id: 'start', name: '起跑線', action: 'idle', emoji: '🏁' },
    { id: 'runway', name: '跑道衝刺', action: 'run', emoji: '跑道' },
    { id: 'jump', name: '跳台起跳', action: 'jump', emoji: '跳' },
    { id: 'takeoff', name: '起飛', action: 'fly', emoji: '飛' },
    { id: 'clouds', name: '雲端飛翔', action: 'soar', emoji: '雲' },
    { id: 'peak', name: '勝利峰', action: 'cheer', emoji: '🏆' }
  ];

  /**
   * Map correct-count → stage index.
   * With ~10 questions: 0→0, 1-2→1, 3-4→2, 5-6→3, 7-8→4, 9+→5
   */
  function stageFromCorrect(correct) {
    var c = Math.max(0, correct | 0);
    if (c <= 0) return 0;
    if (c <= 2) return 1;
    if (c <= 4) return 2;
    if (c <= 6) return 3;
    if (c <= 8) return 4;
    return 5;
  }

  function progressPct(correct, totalQ) {
    var t = Math.max(totalQ || 10, 1);
    return Math.min(100, Math.round((correct / t) * 100));
  }

  /** Cute bird SVG; pose via CSS class on wrapper */
  function birdSvg(extraClass) {
    return (
      '<svg class="bird-svg ' + (extraClass || '') + '" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<ellipse class="bird-body" cx="30" cy="34" rx="16" ry="13"/>' +
      '<circle class="bird-head" cx="44" cy="24" r="11"/>' +
      '<circle class="bird-eye" cx="47" cy="22" r="2.2"/>' +
      '<circle class="bird-eye-shine" cx="47.6" cy="21.4" r="0.7"/>' +
      '<path class="bird-beak" d="M54 24 L62 26 L54 29 Z"/>' +
      '<path class="bird-wing" d="M22 32 Q14 22 20 36 Q24 38 28 34 Z"/>' +
      '<path class="bird-tail" d="M16 36 L8 30 L10 40 L16 38 Z"/>' +
      '<ellipse class="bird-belly" cx="30" cy="37" rx="9" ry="7"/>' +
      '<path class="bird-scarf" d="M36 30 Q42 34 40 20" fill="none"/>' +
      '</svg>'
    );
  }

  function sceneBackdrop(stageIndex) {
    var s = STAGES[stageIndex] || STAGES[0];
    var clouds =
      '<ellipse class="sc-cloud" cx="40" cy="18" rx="18" ry="8"/>' +
      '<ellipse class="sc-cloud" cx="120" cy="28" rx="22" ry="9"/>' +
      '<ellipse class="sc-cloud" cx="200" cy="14" rx="16" ry="7"/>';
    var ground =
      '<rect class="sc-ground" x="0" y="70" width="280" height="30"/>' +
      '<path class="sc-hill" d="M0 70 Q40 50 80 70 Q120 55 160 70 Q200 58 240 70 L280 70 L280 100 L0 100 Z"/>';
    var runway =
      '<rect class="sc-runway" x="20" y="78" width="240" height="8" rx="2"/>' +
      '<g class="sc-dashes">' +
      '<rect x="30" y="80" width="14" height="3" rx="1"/>' +
      '<rect x="56" y="80" width="14" height="3" rx="1"/>' +
      '<rect x="82" y="80" width="14" height="3" rx="1"/>' +
      '<rect x="108" y="80" width="14" height="3" rx="1"/>' +
      '<rect x="134" y="80" width="14" height="3" rx="1"/>' +
      '<rect x="160" y="80" width="14" height="3" rx="1"/>' +
      '<rect x="186" y="80" width="14" height="3" rx="1"/>' +
      '<rect x="212" y="80" width="14" height="3" rx="1"/>' +
      '</g>';
    var platform =
      '<rect class="sc-platform" x="170" y="58" width="50" height="12" rx="3"/>' +
      '<rect class="sc-platform-leg" x="175" y="70" width="8" height="18"/>' +
      '<rect class="sc-platform-leg" x="207" y="70" width="8" height="18"/>';
    var sun = '<circle class="sc-sun" cx="248" cy="22" r="12"/>';
    var peak =
      '<polygon class="sc-peak" points="200,70 230,28 260,70"/>' +
      '<polygon class="sc-peak-snow" points="222,40 230,28 238,40"/>';

    var extras = '';
    if (stageIndex >= 2) extras += platform;
    if (stageIndex >= 4) extras += peak;
    if (stageIndex >= 3) {
      clouds =
        '<ellipse class="sc-cloud sc-cloud--hi" cx="50" cy="22" rx="20" ry="9"/>' +
        '<ellipse class="sc-cloud sc-cloud--hi" cx="140" cy="16" rx="24" ry="10"/>' +
        '<ellipse class="sc-cloud sc-cloud--hi" cx="220" cy="26" rx="18" ry="8"/>';
    }

    return (
      '<svg class="adv-scene-svg" viewBox="0 0 280 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<rect class="sc-sky" x="0" y="0" width="280" height="100"/>' +
      sun + clouds + ground + runway + extras +
      '</svg>'
    );
  }

  function stageChipsHtml(activeIndex) {
    return STAGES.map(function (st, i) {
      var cls = 'adv-chip';
      if (i < activeIndex) cls += ' done';
      if (i === activeIndex) cls += ' active';
      return '<span class="' + cls + '" title="' + st.name + '">' + (i + 1) + '. ' + st.name + '</span>';
    }).join('');
  }

  /**
   * Render adventure strip.
   * @param {{correct:number, totalQ:number, pose?:string, playerLabel?:string, variant?:string}} opts
   */
  function renderStrip(opts) {
    opts = opts || {};
    var correct = opts.correct || 0;
    var stage = stageFromCorrect(correct);
    var pose = opts.pose || STAGES[stage].action;
    var pct = progressPct(correct, opts.totalQ);
    // bird X along track (pad so bird stays in view)
    var leftPct = 4 + (pct / 100) * 78;

    var label = opts.playerLabel ? opts.playerLabel + ' · ' : '';
    return (
      '<div class="adv-strip' + (opts.variant ? ' adv-strip--' + opts.variant : '') + '" data-stage="' + stage + '">' +
      '<div class="adv-head">' +
      '<span class="adv-hero-name">🐦 ' + HERO_NAME + '</span>' +
      '<span class="adv-stage-name">' + label + STAGES[stage].name +
      (pose === 'stumble' ? '（絆倒…）' : pose === 'cheer' ? '（完成！）' : '') +
      '</span>' +
      '</div>' +
      '<div class="adv-track-wrap">' +
      sceneBackdrop(stage) +
      '<div class="adv-bird-wrap pose-' + pose + '" style="left:' + leftPct + '%">' +
      birdSvg() +
      '</div>' +
      '<div class="adv-rail"><div class="adv-rail-fill" style="width:' + pct + '%"></div></div>' +
      '</div>' +
      '<div class="adv-chips">' + stageChipsHtml(stage) + '</div>' +
      '</div>'
    );
  }

  /** Home hero banner decoration */
  function homeBannerHtml() {
    return (
      '<div class="home-hero-art" aria-hidden="true">' +
      '<div class="home-sky">' +
      birdSvg('bird-home') +
      '<div class="home-caption"><strong>' + HERO_NAME + '</strong> 等你一齊闖關！答對就跑、跳、飛～</div>' +
      '</div></div>'
    );
  }


  /** Center strip for opposite-seating versus: bird watches both sides */
  function renderVersusCenter(opts) {
    opts = opts || {};
    var aCorrect = opts.aCorrect || 0;
    var bCorrect = opts.bCorrect || 0;
    var totalQ = opts.totalQ || 10;
    var pose = opts.pose || 'idle';
    var combined = Math.max(aCorrect, bCorrect);
    var stage = stageFromCorrect(combined);
    var pctA = progressPct(aCorrect, totalQ);
    var pctB = progressPct(bCorrect, totalQ);
    return (
      '<div class="vs-center" data-stage="' + stage + '">' +
      '<div class="vs-center-scores">' +
      '<span class="vs-pill vs-pill-a">A ' + aCorrect + '✓</span>' +
      '<span class="vs-center-title">🐦 ' + HERO_NAME + ' · ' + STAGES[stage].name + '</span>' +
      '<span class="vs-pill vs-pill-b">B ' + bCorrect + '✓</span>' +
      '</div>' +
      '<div class="vs-center-bird-row">' +
      '<div class="vs-mini-bar"><div class="vs-mini-fill a" style="width:' + pctA + '%"></div></div>' +
      '<div class="vs-center-bird pose-' + pose + '">' + birdSvg('bird-vs-center') + '</div>' +
      '<div class="vs-mini-bar"><div class="vs-mini-fill b" style="width:' + pctB + '%"></div></div>' +
      '</div>' +
      '</div>'
    );
  }

  global.Adventure = {
    HERO_NAME: HERO_NAME,
    STAGES: STAGES,
    stageFromCorrect: stageFromCorrect,
    progressPct: progressPct,
    birdSvg: birdSvg,
    renderStrip: renderStrip,
    homeBannerHtml: homeBannerHtml,
    renderVersusCenter: renderVersusCenter
  };
})(typeof window !== 'undefined' ? window : globalThis);
