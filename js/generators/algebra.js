(function (global) {
  'use strict';
  var U = global.U;
  var Frac = global.Frac;

  function genSimplify(diff) {
    var a = U.randInt(2, 9);
    var b = U.randInt(1, 8);
    var c = U.randInt(2, 9);
    var d = U.randInt(1, 8);
    // (ax + b) + (cx + d) = (a+c)x + (b+d)
    var coef = a + c;
    var constTerm = b + d;
    var ansStr = coef + 'x+' + constTerm;
    return U.q({
      topic: 'algebra',
      type: 'mc',
      promptHtml: '<p class="q-lead">化簡：</p><p class="q-expr">' + a + 'x + ' + b + ' + ' + c + 'x + ' + d + '</p>',
      answer: ansStr,
      choices: U.shuffle([
        { value: ansStr, label: coef + 'x + ' + constTerm },
        { value: 'w1', label: (a + c) + 'x + ' + (b - d) },
        { value: 'w2', label: (a * c) + 'x + ' + (b + d) },
        { value: 'w3', label: coef + 'x − ' + constTerm }
      ]).slice(0, 4),
      accept: function (v) { return String(v) === ansStr; }
    });
  }

  function genSimplifySub(diff) {
    var a = U.randInt(3, 12);
    var b = U.randInt(2, 9);
    var c = U.randInt(1, Math.min(a - 1, 8));
    var coef = a - c;
    var constTerm = b;
    // ax + b − cx
    var ansStr = coef + 'x+' + constTerm;
    return U.q({
      topic: 'algebra',
      type: 'fill',
      promptHtml: '<p class="q-lead">化簡（只填係數與常數，格式如 3x+5）：</p><p class="q-expr">' +
        a + 'x + ' + b + ' − ' + c + 'x</p>',
      answer: ansStr,
      accept: function (v) {
        var s = String(v).replace(/\s+/g, '').replace(/−/g, '-');
        var norm = coef + 'x+' + constTerm;
        var alt = coef + 'x' + (constTerm >= 0 ? '+' + constTerm : String(constTerm));
        return s === norm || s === alt || s === coef + 'x+' + constTerm;
      },
      inputMode: 'text'
    });
  }

  function genEval(diff) {
    var a = U.randInt(2, 8);
    var b = U.randInt(1, 15);
    var x = U.randInt(2, 10);
    var op = U.pick(['+', '−']);
    var val = op === '+' ? a * x + b : a * x - b;
    return U.q({
      topic: 'algebra',
      type: 'fill',
      promptHtml: '<p class="q-lead">代入：當 x = ' + x + '，求 ' + a + 'x ' + op + ' ' + b + ' 的值。</p>',
      answer: val,
      accept: function (v) { return U.almostEqual(v, val, 0.01); }
    });
  }

  function genEvalFrac(diff) {
    // (1/2)x + 3 when x=4 → use stacked fraction in prompt
    var den = U.pick([2, 3, 4, 5]);
    var num = 1;
    var x = den * U.randInt(2, 6);
    var add = U.randInt(1, 10);
    var val = (num / den) * x + add;
    return U.q({
      topic: 'algebra',
      type: 'fill',
      promptHtml: '<p class="q-lead">代入：當 x = ' + x + '，求</p><p class="q-expr">' +
        Frac.html(num, den) + 'x + ' + add + ' 的值。</p>',
      answer: val,
      accept: function (v) { return U.almostEqual(v, val, 0.01); }
    });
  }

  function genTF(diff) {
    var a = U.randInt(2, 6);
    var b = U.randInt(2, 6);
    var x = U.randInt(2, 8);
    var trueVal = a * x + b;
    var shown = U.pick([trueVal, a * x - b, a + x + b, trueVal + 1]);
    var isTrue = shown === trueVal;
    return U.q({
      topic: 'algebra',
      type: 'tf',
      promptHtml: '<p class="q-lead">判斷：當 x = ' + x + ' 時，' + a + 'x + ' + b + ' = ' + shown + '？</p>',
      answer: isTrue,
      accept: function (v) { return !!v === isTrue; }
    });
  }

  function genCompareExpr(diff) {
    var x = U.randInt(3, 9);
    var a = 2 * x + 5;
    var b = 3 * x - 1;
    var ans = a === b ? '=' : (a > b ? '>' : '<');
    return U.q({
      topic: 'algebra',
      type: 'compare',
      promptHtml: '<p class="q-lead">當 x = ' + x + '，比較：</p><p class="q-expr">2x + 5　□　3x − 1</p>',
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
    return U.pick([genSimplify, genSimplifySub, genEval, genEval, genEvalFrac, genTF, genCompareExpr])(diff || 'normal');
  }

  global.GenAlgebra = { generate: generate };
})(typeof window !== 'undefined' ? window : globalThis);
