/**
 * 小數四則：＋ － × ÷（以填充題為主）
 */
(function (global) {
  'use strict';
  var U = global.U;
  var Frac = global.Frac;

  function d1() { return U.roundTo(U.randInt(1, 99) / 10, 1); }
  function d2() { return U.roundTo(U.randInt(1, 99) / 10, 1); }

  function genAdd(diff) {
    var a = d1(), b = d1();
    if (diff === 'hard') { a = U.roundTo(U.randInt(15, 250) / 10, 1); b = U.roundTo(U.randInt(15, 250) / 10, 1); }
    var ans = U.roundTo(a + b, 2);
    return U.q({
      topic: 'decimal',
      type: 'fill',
      promptHtml: '<p class="q-lead">計算：</p><p class="q-expr">' +
        Frac.escape(a) + ' ＋ ' + Frac.escape(b) + ' ＝ ？</p>',
      answer: ans,
      accept: function (v) { return U.almostEqual(v, ans, 0.011); }
    });
  }

  function genSub(diff) {
    var a = d1(), b = d1();
    if (a < b) { var t = a; a = b; b = t; }
    if (diff === 'hard') {
      a = U.roundTo(U.randInt(50, 300) / 10, 1);
      b = U.roundTo(U.randInt(10, Math.floor(a * 10) - 1) / 10, 1);
    }
    var ans = U.roundTo(a - b, 2);
    return U.q({
      topic: 'decimal',
      type: 'fill',
      promptHtml: '<p class="q-lead">計算：</p><p class="q-expr">' +
        Frac.escape(a) + ' − ' + Frac.escape(b) + ' ＝ ？</p>',
      answer: ans,
      accept: function (v) { return U.almostEqual(v, ans, 0.011); }
    });
  }

  function genMul(diff) {
    var a = U.roundTo(U.randInt(2, 15) / 10 + U.randInt(1, 8), 1);
    var b = U.roundTo(U.randInt(2, 9) / 10, 1);
    if (diff === 'easy') { a = U.roundTo(U.randInt(2, 9) + 0.5, 1); b = U.roundTo(U.randInt(2, 5) / 10, 1); }
    var ans = U.roundTo(a * b, 3);
    // clean terminating
    ans = U.roundTo(ans, 2);
    a = U.roundTo(a, 1); b = U.roundTo(b, 1);
    ans = U.roundTo(a * b, 2);
    return U.q({
      topic: 'decimal',
      type: 'fill',
      promptHtml: '<p class="q-lead">計算：</p><p class="q-expr">' +
        Frac.escape(a) + ' × ' + Frac.escape(b) + ' ＝ ？</p>',
      answer: ans,
      accept: function (v) { return U.almostEqual(v, ans, 0.011); }
    });
  }

  function genDiv(diff) {
    var quotient = U.roundTo(U.randInt(1, 25) + U.randInt(0, 9) / 10, 1);
    var divisor = U.roundTo(U.randInt(2, 9) / 10 + U.randInt(0, 1), 1);
    if (divisor < 0.2) divisor = 0.5;
    var dividend = U.roundTo(divisor * quotient, 2);
    quotient = U.roundTo(dividend / divisor, 2);
    return U.q({
      topic: 'decimal',
      type: 'fill',
      promptHtml: '<p class="q-lead">計算：</p><p class="q-expr">' +
        Frac.escape(dividend) + ' ÷ ' + Frac.escape(divisor) + ' ＝ ？</p>',
      answer: quotient,
      accept: function (v) { return U.almostEqual(v, quotient, 0.011); }
    });
  }

  function genMissing(diff) {
    var a = U.roundTo(U.randInt(12, 90) / 10, 1);
    var b = U.roundTo(U.randInt(2, 9) / 10 + U.randInt(1, 5), 1);
    var product = U.roundTo(a * b, 2);
    return U.q({
      topic: 'decimal',
      type: 'fill',
      promptHtml: '<p class="q-lead">求未知數：</p><p class="q-expr">' +
        Frac.escape(a) + ' × ？ ＝ ' + Frac.escape(product) + '</p>',
      answer: b,
      accept: function (v) { return U.almostEqual(v, b, 0.011); }
    });
  }

  function generate(diff) {
    return U.pick([genAdd, genAdd, genSub, genSub, genMul, genMul, genDiv, genDiv, genMissing])(diff || 'normal');
  }

  global.GenDecimal = { generate: generate };
})(typeof window !== 'undefined' ? window : globalThis);
