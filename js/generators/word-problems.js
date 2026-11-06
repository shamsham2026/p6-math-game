/**
 * 文字題：混合小六課題（分數／小數／平均／面積／體積長方正方／代數／方程）
 */
(function (global) {
  'use strict';
  var U = global.U;
  var Frac = global.Frac;

  function genAvg(diff) {
    var n = U.randInt(3, 5);
    var m = U.randInt(10, 28);
    var nums = [];
    var left = m * n;
    for (var i = 0; i < n - 1; i++) {
      var v = U.randInt(5, Math.max(6, Math.floor(left / (n - i) + 5)));
      v = U.clamp(v, 1, left - (n - i - 1));
      nums.push(v);
      left -= v;
    }
    nums.push(left);
    nums = U.shuffle(nums);
    return U.q({
      topic: 'word',
      type: 'fill',
      promptHtml: '<p class="q-lead">文字題</p><p class="q-word">' +
        '小明連續 ' + n + ' 次測驗得分是 ' + nums.map(Frac.escape).join('、') +
        '。平均分是多少？</p>',
      answer: m,
      accept: function (v) { return U.almostEqual(v, m, 0.01); }
    });
  }

  function genArea(diff) {
    var L = U.randInt(8, 20), W = U.randInt(4, 12);
    var area = L * W;
    return U.q({
      topic: 'word',
      type: 'fill',
      promptHtml: '<p class="q-lead">文字題</p><p class="q-word">' +
        '課室地板是長方形，長 ' + L + ' m、闊 ' + W + ' m。面積是多少 m<sup>2</sup>？</p>',
      answer: area,
      accept: function (v) { return U.almostEqual(v, area, 0.01); }
    });
  }

  function genVolCuboid(diff) {
    var l = U.randInt(4, 12), w = U.randInt(3, 8), h = U.randInt(2, 6);
    if (l === w && w === h) h += 1;
    var vol = l * w * h;
    return U.q({
      topic: 'word',
      type: 'fill',
      promptHtml: '<p class="q-lead">文字題</p><p class="q-word">' +
        '一個紙箱是長方體，長 ' + l + ' cm、闊 ' + w + ' cm、高 ' + h +
        ' cm。體積是多少 cm<sup>3</sup>？</p>',
      answer: vol,
      accept: function (v) { return U.almostEqual(v, vol, 0.01); }
    });
  }

  function genVolCube(diff) {
    var a = U.randInt(3, 10);
    var vol = a * a * a;
    return U.q({
      topic: 'word',
      type: 'fill',
      promptHtml: '<p class="q-lead">文字題</p><p class="q-word">' +
        '一個正方體禮盒棱長 ' + a + ' cm，體積是多少 cm<sup>3</sup>？</p>',
      answer: vol,
      accept: function (v) { return U.almostEqual(v, vol, 0.01); }
    });
  }

  function genDecimal(diff) {
    var price = U.roundTo(U.randInt(15, 80) / 10, 1);
    var n = U.randInt(2, 6);
    var total = U.roundTo(price * n, 2);
    return U.q({
      topic: 'word',
      type: 'fill',
      promptHtml: '<p class="q-lead">文字題</p><p class="q-word">' +
        '一支筆售價 $' + Frac.escape(price) + '，買 ' + n + ' 支要付多少元？</p>',
      answer: total,
      accept: function (v) { return U.almostEqual(v, total, 0.011); }
    });
  }

  function genFraction(diff) {
    var den = U.pick([2, 3, 4, 5, 6, 8]);
    var num = U.randInt(1, den - 1);
    var whole = U.randInt(12, 48);
    // whole * num/den — ensure divisible
    whole = den * U.randInt(3, 10);
    var ans = Frac.simplify(whole * num, den);
    // if integer, use numeric fill; else fraction input
    if (ans.d === 1) {
      return U.q({
        topic: 'word',
        type: 'fill',
        promptHtml: '<p class="q-lead">文字題</p><p class="q-word">' +
          '一條繩長 ' + whole + ' m，用去 ' + Frac.html(num, den) +
          '，用去多少米？</p>',
        answer: ans.n,
        accept: function (v) { return U.almostEqual(v, ans.n, 0.01); }
      });
    }
    return U.q({
      topic: 'word',
      type: 'fill',
      inputMode: 'fraction',
      promptHtml: '<p class="q-lead">文字題</p><p class="q-word">' +
        '蛋糕切成 ' + den + ' 等份，小華吃了 ' + Frac.html(num, den) +
        '，剩低 ' + Frac.html(den - num, den) + '。若整塊是 1，小華吃了幾多？（約簡）</p>',
      answer: Frac.simplify(num, den),
      answerDisplay: Frac.html(num, den),
      accept: global.GenFraction.acceptFrac(Frac.simplify(num, den))
    });
  }

  function genAlgebra(diff) {
    var a = U.randInt(2, 8), x = U.randInt(3, 12), b = U.randInt(1, 15);
    var val = a * x + b;
    return U.q({
      topic: 'word',
      type: 'fill',
      promptHtml: '<p class="q-lead">文字題</p><p class="q-word">' +
        '一件商品原價 x 元，現價是 ' + a + 'x ＋ ' + b + ' 元。若 x ＝ ' + x +
        '，現價是多少元？</p>',
      answer: val,
      accept: function (v) { return U.almostEqual(v, val, 0.01); }
    });
  }

  function genEquation(diff) {
    var x = U.randInt(5, 20);
    var a = U.randInt(2, 7);
    var b = U.randInt(1, 12);
    var rhs = a * x + b;
    return U.q({
      topic: 'word',
      type: 'fill',
      promptHtml: '<p class="q-lead">文字題</p><p class="q-word">' +
        '每盒有 ' + a + ' 枝筆，再加 ' + b + ' 枝，合共 ' + rhs +
        ' 枝。求盒數 x。（方程：' + a + 'x ＋ ' + b + ' ＝ ' + rhs + '）</p>',
      answer: x,
      accept: function (v) { return U.almostEqual(v, x, 0.01); }
    });
  }

  function generate(diff) {
    var fns = [genAvg, genArea, genVolCuboid, genVolCube, genDecimal, genFraction, genAlgebra, genEquation];
    return U.pick(fns)(diff || 'normal');
  }

  global.GenWord = { generate: generate };
})(typeof window !== 'undefined' ? window : globalThis);
