(function (global) {
  'use strict';
  var U = global.U;
  var Frac = global.Frac;

  function unitPair() {
    return U.pick(['cm', 'm']);
  }

  function genRect(diff) {
    var u = unitPair();
    var L = U.randInt(diff === 'hard' ? 12 : 5, diff === 'hard' ? 40 : 20);
    var W = U.randInt(3, Math.min(L, 15));
    var area = L * W;
    return U.q({
      topic: 'area',
      type: 'fill',
      promptHtml: '<p class="q-lead">長方形長 ' + L + ' ' + u + '，闊 ' + W + ' ' + u +
        '，面積是多少 ' + u + '<sup>2</sup>？</p>',
      answer: area,
      unit: u + '²',
      accept: function (v) { return U.almostEqual(v, area, 0.01); }
    });
  }

  function genTriangle(diff) {
    var u = unitPair();
    var b = U.randInt(6, 24);
    var h = U.randInt(4, 18);
    if ((b * h) % 2 !== 0) h += 1;
    var area = (b * h) / 2;
    return U.q({
      topic: 'area',
      type: 'fill',
      promptHtml: '<p class="q-lead">三角形底 ' + b + ' ' + u + '，高 ' + h + ' ' + u +
        '，面積是多少 ' + u + '<sup>2</sup>？</p><p class="q-hint">（面積＝底×高÷2）</p>',
      answer: area,
      accept: function (v) { return U.almostEqual(v, area, 0.01); }
    });
  }

  function genPara(diff) {
    var u = 'cm';
    var b = U.randInt(8, 20);
    var h = U.randInt(4, 12);
    var area = b * h;
    return U.q({
      topic: 'area',
      type: 'mc',
      promptHtml: '<p class="q-lead">平行四邊形底 ' + b + ' ' + u + '，高 ' + h + ' ' + u +
        '，面積是？</p>',
      answer: area,
      choices: U.mcChoices(area, [b * h / 2, (b + h) * 2, b + h, area + b]),
      accept: function (v) { return U.almostEqual(v, area, 0.01); }
    });
  }

  function genLShape(diff) {
    var u = 'cm';
    var L = U.randInt(10, 20);
    var W = U.randInt(8, 14);
    var a = U.randInt(3, Math.floor(L / 2));
    var b = U.randInt(3, Math.floor(W / 2));
    var area = L * W - a * b;
    return U.q({
      topic: 'area',
      type: 'fill',
      promptHtml: '<p class="q-lead">L 形圖形：大長方形 ' + L + '×' + W + ' ' + u +
        '，剪去一角 ' + a + '×' + b + ' ' + u + '。求面積（' + u + '<sup>2</sup>）。</p>',
      answer: area,
      accept: function (v) { return U.almostEqual(v, area, 0.01); }
    });
  }

  function genTF(diff) {
    var L = U.randInt(6, 15);
    var W = U.randInt(4, 10);
    var trueA = L * W;
    var shown = U.pick([trueA, 2 * (L + W), L * W / 2, trueA + 2]);
    var isTrue = shown === trueA;
    return U.q({
      topic: 'area',
      type: 'tf',
      promptHtml: '<p class="q-lead">判斷：長 ' + L + ' cm、闊 ' + W + ' cm 的長方形面積是 ' +
        shown + ' cm<sup>2</sup>？</p>',
      answer: isTrue,
      accept: function (v) { return !!v === isTrue; }
    });
  }

  function genCompare(diff) {
    var b1 = U.randInt(6, 14);
    var h1 = U.randInt(4, 10);
    if ((b1 * h1) % 2) h1++;
    var a2 = (b1 * h1) / 2;
    var rectL = U.randInt(6, 12);
    var rectW = U.randInt(4, 9);
    var a1 = rectL * rectW;
    var ans = a1 === a2 ? '=' : (a1 > a2 ? '>' : '<');
    return U.q({
      topic: 'area',
      type: 'compare',
      promptHtml: '<p class="q-lead">比較面積：</p>' +
        '<p class="q-expr">甲：長方形 ' + rectL + '×' + rectW + ' cm</p>' +
        '<p class="q-expr">乙：三角形底 ' + b1 + ' cm、高 ' + h1 + ' cm</p>' +
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
    return U.pick([genRect, genTriangle, genPara, genLShape, genTF, genCompare])(diff || 'normal');
  }

  global.GenArea = { generate: generate };
})(typeof window !== 'undefined' ? window : globalThis);
