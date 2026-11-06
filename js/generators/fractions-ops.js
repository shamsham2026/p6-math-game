/**
 * 分數四則：＋ － × ÷；題目用堆疊分數；答案用分數輸入框。
 */
(function (global) {
  'use strict';
  var U = global.U;
  var Frac = global.Frac;

  function rf(maxDen) {
    maxDen = maxDen || 9;
    var d = U.randInt(2, maxDen);
    var n = U.randInt(1, d - 1);
    return Frac.simplify(n, d);
  }

  function rfAny(maxDen) {
    maxDen = maxDen || 10;
    var d = U.randInt(2, maxDen);
    var n = U.randInt(1, Math.min(d + 4, 12));
    return Frac.simplify(n, d);
  }

  function eqFrac(a, b) {
    return a.n * b.d === b.n * a.d;
  }

  function acceptFrac(expected) {
    var e = Frac.simplify(expected.n, expected.d);
    return function (v) {
      if (v == null) return false;
      if (typeof v === 'object' && v.n != null && v.d != null) {
        var dd = Number(v.d);
        if (!dd || !isFinite(dd)) return false;
        var nn = Number(v.n);
        if (!isFinite(nn)) return false;
        var w = Number(v.whole);
        if (!isFinite(w)) w = 0;
        var got = Frac.simplify(w * dd + nn, dd);
        return eqFrac(got, e);
      }
      var num = typeof v === 'number' ? v : U.parseAnswer(v);
      if (!isFinite(num)) return false;
      return U.almostEqual(num, e.n / e.d, 1e-6);
    };
  }

  function expr(a, op, b) {
    return Frac.html(a.n, a.d) + ' <span class="op">' + op + '</span> ' + Frac.html(b.n, b.d);
  }

  function fillQ(promptInner, ans) {
    var s = Frac.simplify(ans.n, ans.d);
    return U.q({
      topic: 'fraction',
      type: 'fill',
      inputMode: 'fraction',
      promptHtml: '<p class="q-lead">計算（答案請約簡）：</p><p class="q-expr">' + promptInner + ' ＝ ？</p>',
      answer: s,
      answerDisplay: Frac.html(s.n, s.d),
      accept: acceptFrac(s)
    });
  }

  function genAdd(diff) {
    var a = rf(diff === 'hard' ? 12 : 8);
    var b = rf(diff === 'hard' ? 12 : 8);
    var ans = Frac.simplify(a.n * b.d + b.n * a.d, a.d * b.d);
    return fillQ(expr(a, '＋', b), ans);
  }

  function genSub(diff) {
    var a = rfAny(diff === 'hard' ? 12 : 9);
    var b = rf(diff === 'hard' ? 10 : 8);
    // ensure a >= b
    if (a.n * b.d < b.n * a.d) {
      var t = a; a = { n: a.n + b.n, d: a.d }; // bump
      a = Frac.simplify(Math.max(a.n, b.n + 1), a.d);
      if (a.n * b.d < b.n * a.d) {
        a = Frac.simplify(b.n * a.d + U.randInt(1, 5), a.d);
      }
    }
    // rebuild clean: pick result then add
    b = rf(7);
    var res = rf(8);
    a = Frac.simplify(res.n * b.d + b.n * res.d, res.d * b.d);
    var ans = res;
    return fillQ(expr(a, '−', b), ans);
  }

  function genMul(diff) {
    var a = rf(diff === 'hard' ? 10 : 7);
    var b = rf(diff === 'hard' ? 10 : 7);
    var ans = Frac.simplify(a.n * b.n, a.d * b.d);
    return fillQ(expr(a, '×', b), ans);
  }

  function genDiv(diff) {
    var a = rf(diff === 'hard' ? 10 : 7);
    var b = rf(diff === 'hard' ? 9 : 7);
    var ans = Frac.simplify(a.n * b.d, a.d * b.n);
    return fillQ(expr(a, '÷', b), ans);
  }

  function generate(diff) {
    return U.pick([genAdd, genSub, genMul, genDiv, genAdd, genMul])(diff || 'normal');
  }

  global.GenFraction = { generate: generate, acceptFrac: acceptFrac };
})(typeof window !== 'undefined' ? window : globalThis);
