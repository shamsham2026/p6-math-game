/**
 * 體積：只限長方體（V = l×w×h）與正方體（V = a³）。
 * 不含排水法、不規則體、圓柱、組合體等。
 */
(function (global) {
  'use strict';
  var U = global.U;

  function unit() {
    return U.pick(['cm', 'm']);
  }

  /** 長方體：求體積 V = l×w×h */
  function genCuboidFill(diff) {
    var u = unit();
    var max = diff === 'hard' ? 20 : 12;
    var l = U.randInt(3, max);
    var w = U.randInt(2, Math.min(10, max));
    var h = U.randInt(2, Math.min(10, max));
    // 避免偶然變成正方體（正方體另有題型）
    if (l === w && w === h) h = h + 1;
    var vol = l * w * h;
    return U.q({
      topic: 'volume',
      type: 'fill',
      kind: 'cuboid',
      promptHtml: '<p class="q-lead">長方體長 ' + l + ' ' + u + '、闊 ' + w + ' ' + u +
        '、高 ' + h + ' ' + u + '，體積是多少 ' + u + '<sup>3</sup>？</p>' +
        '<p class="q-hint">（體積＝長×闊×高）</p>',
      answer: vol,
      accept: function (v) { return U.almostEqual(v, vol, 0.01); }
    });
  }

  /** 正方體：求體積 V = a³ */
  function genCubeFill(diff) {
    var u = unit();
    var max = diff === 'hard' ? 15 : 10;
    var a = U.randInt(2, max);
    var vol = a * a * a;
    return U.q({
      topic: 'volume',
      type: 'fill',
      kind: 'cube',
      promptHtml: '<p class="q-lead">正方體的棱長是 ' + a + ' ' + u +
        '，體積是多少 ' + u + '<sup>3</sup>？</p>' +
        '<p class="q-hint">（體積＝棱長×棱長×棱長）</p>',
      answer: vol,
      accept: function (v) { return U.almostEqual(v, vol, 0.01); }
    });
  }

  /** 已知長方體體積與兩邊，求另一邊 */
  function genCuboidMissingEdge(diff) {
    var u = 'cm';
    var l = U.randInt(4, 12);
    var w = U.randInt(3, 10);
    var h = U.randInt(2, 8);
    if (l === w && w === h) h += 1;
    var vol = l * w * h;
    var which = U.pick(['h', 'w', 'l']);
    var prompt, ans;
    if (which === 'h') {
      prompt = '長方體體積 ' + vol + ' ' + u + '<sup>3</sup>，長 ' + l +
        ' ' + u + '、闊 ' + w + ' ' + u + '，求高（' + u + '）。';
      ans = h;
    } else if (which === 'w') {
      prompt = '長方體體積 ' + vol + ' ' + u + '<sup>3</sup>，長 ' + l +
        ' ' + u + '、高 ' + h + ' ' + u + '，求闊（' + u + '）。';
      ans = w;
    } else {
      prompt = '長方體體積 ' + vol + ' ' + u + '<sup>3</sup>，闊 ' + w +
        ' ' + u + '、高 ' + h + ' ' + u + '，求長（' + u + '）。';
      ans = l;
    }
    return U.q({
      topic: 'volume',
      type: 'fill',
      kind: 'cuboid-missing',
      promptHtml: '<p class="q-lead">' + prompt + '</p>',
      answer: ans,
      accept: function (v) { return U.almostEqual(v, ans, 0.01); }
    });
  }

  /** 已知正方體體積，求棱長 */
  function genCubeMissingEdge(diff) {
    var u = 'cm';
    var a = U.randInt(2, diff === 'hard' ? 12 : 8);
    var vol = a * a * a;
    return U.q({
      topic: 'volume',
      type: 'fill',
      kind: 'cube-missing',
      promptHtml: '<p class="q-lead">正方體體積是 ' + vol + ' ' + u +
        '<sup>3</sup>，求棱長（' + u + '）。</p>',
      answer: a,
      accept: function (v) { return U.almostEqual(v, a, 0.01); }
    });
  }

  /** 長方體或正方體選擇題 */
  function genMC(diff) {
    if (U.randInt(0, 1) === 0) {
      var l = U.randInt(5, 10), w = U.randInt(3, 8), h = U.randInt(2, 6);
      if (l === w && w === h) h += 1;
      var vol = l * w * h;
      return U.q({
        topic: 'volume',
        type: 'mc',
        kind: 'cuboid',
        promptHtml: '<p class="q-lead">長方體長 ' + l + ' cm、闊 ' + w +
          ' cm、高 ' + h + ' cm，體積是？</p>',
        answer: vol,
        choices: U.mcChoices(vol, [l * w, 2 * (l * w + w * h + h * l), vol + l, l + w + h]),
        accept: function (v) { return U.almostEqual(v, vol, 0.01); }
      });
    }
    var a = U.randInt(3, 9);
    var cvol = a * a * a;
    return U.q({
      topic: 'volume',
      type: 'mc',
      kind: 'cube',
      promptHtml: '<p class="q-lead">正方體棱長 ' + a + ' cm，體積是？</p>',
      answer: cvol,
      choices: U.mcChoices(cvol, [a * a, 6 * a * a, a * 3, cvol + a]),
      accept: function (v) { return U.almostEqual(v, cvol, 0.01); }
    });
  }

  function genTF(diff) {
    if (U.randInt(0, 1) === 0) {
      var l = U.randInt(4, 10), w = U.randInt(3, 8), h = U.randInt(2, 6);
      if (l === w && w === h) h += 1;
      var trueV = l * w * h;
      var shown = U.pick([trueV, l * w * 2, trueV + 10, l + w + h]);
      var isTrue = shown === trueV;
      return U.q({
        topic: 'volume',
        type: 'tf',
        kind: 'cuboid',
        promptHtml: '<p class="q-lead">判斷：長 ' + l + ' cm、闊 ' + w + ' cm、高 ' + h +
          ' cm 的長方體，體積是 ' + shown + ' cm<sup>3</sup>？</p>',
        answer: isTrue,
        accept: function (v) { return !!v === isTrue; }
      });
    }
    var a = U.randInt(2, 8);
    var trueC = a * a * a;
    var shownC = U.pick([trueC, a * a, 6 * a * a, trueC + 1]);
    var ok = shownC === trueC;
    return U.q({
      topic: 'volume',
      type: 'tf',
      kind: 'cube',
      promptHtml: '<p class="q-lead">判斷：棱長 ' + a + ' cm 的正方體，體積是 ' +
        shownC + ' cm<sup>3</sup>？</p>',
      answer: ok,
      accept: function (v) { return !!v === ok; }
    });
  }

  /** 比較兩個長方體／正方體體積 */
  function genCompare(diff) {
    var kindA = U.pick(['cuboid', 'cube']);
    var kindB = U.pick(['cuboid', 'cube']);
    var descA, descB, va, vb;

    if (kindA === 'cube') {
      var a1 = U.randInt(3, 8);
      va = a1 * a1 * a1;
      descA = '正方體棱長 ' + a1 + ' cm';
    } else {
      var la = U.randInt(4, 9), wa = U.randInt(3, 7), ha = U.randInt(2, 6);
      if (la === wa && wa === ha) ha += 1;
      va = la * wa * ha;
      descA = '長方體 ' + la + '×' + wa + '×' + ha + ' cm';
    }

    if (kindB === 'cube') {
      var a2 = U.randInt(3, 8);
      vb = a2 * a2 * a2;
      descB = '正方體棱長 ' + a2 + ' cm';
    } else {
      var lb = U.randInt(4, 9), wb = U.randInt(3, 7), hb = U.randInt(2, 6);
      if (lb === wb && wb === hb) hb += 1;
      vb = lb * wb * hb;
      descB = '長方體 ' + lb + '×' + wb + '×' + hb + ' cm';
    }

    var ans = va === vb ? '=' : (va > vb ? '>' : '<');
    return U.q({
      topic: 'volume',
      type: 'compare',
      kind: 'compare',
      promptHtml: '<p class="q-lead">比較體積：</p>' +
        '<p class="q-expr">甲：' + descA + '</p>' +
        '<p class="q-expr">乙：' + descB + '</p>' +
        '<p class="q-lead">甲 □ 乙</p>',
      answer: ans,
      choices: [
        { value: '>', label: '>' },
        { value: '<', label: '<' },
        { value: '=', label: '=' }
      ],
      accept: function (v) { return String(v) === ans; }
    });
  }

  function generate(diff) {
    var fns = [
      genCuboidFill, genCuboidFill,
      genCubeFill, genCubeFill,
      genCuboidMissingEdge,
      genCubeMissingEdge,
      genMC, genTF, genCompare
    ];
    return U.pick(fns)(diff || 'normal');
  }

  global.GenVolume = { generate: generate };
})(typeof window !== 'undefined' ? window : globalThis);
