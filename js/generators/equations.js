(function (global) {
  'use strict';
  var U = global.U;
  var Frac = global.Frac;

  function genOneStep(diff) {
    var x = U.randInt(diff === 'hard' ? -10 : 2, 20);
    if (x === 0) x = 3;
    var kind = U.pick(['add', 'sub', 'mul', 'div']);
    var prompt, ans;
    ans = x;
    if (kind === 'add') {
      var a = U.randInt(2, 15);
      prompt = 'x + ' + a + ' = ' + (x + a);
    } else if (kind === 'sub') {
      var b = U.randInt(2, 12);
      prompt = 'x − ' + b + ' = ' + (x - b);
    } else if (kind === 'mul') {
      var c = U.randInt(2, 9);
      prompt = c + 'x = ' + (c * x);
    } else {
      var d = U.randInt(2, 8);
      x = d * U.randInt(2, 9);
      ans = x;
      prompt = 'x ÷ ' + d + ' = ' + (x / d);
    }
    return U.q({
      topic: 'equation',
      type: 'fill',
      promptHtml: '<p class="q-lead">解方程，求 x：</p><p class="q-expr">' + prompt + '</p>',
      answer: ans,
      accept: function (v) { return U.almostEqual(v, ans, 0.01); }
    });
  }

  function genTwoStep(diff) {
    var x = U.randInt(2, 12);
    var a = U.randInt(2, 8);
    var b = U.randInt(1, 15);
    var op = U.pick(['+', '−']);
    var rhs = op === '+' ? a * x + b : a * x - b;
    return U.q({
      topic: 'equation',
      type: 'fill',
      promptHtml: '<p class="q-lead">解方程，求 x：</p><p class="q-expr">' +
        a + 'x ' + op + ' ' + b + ' = ' + rhs + '</p>',
      answer: x,
      accept: function (v) { return U.almostEqual(v, x, 0.01); }
    });
  }

  function genFracEq(diff) {
    var den = U.pick([2, 3, 4, 5]);
    var x = den * U.randInt(2, 8);
    var rhs = x / den;
    return U.q({
      topic: 'equation',
      type: 'fill',
      promptHtml: '<p class="q-lead">解方程，求 x：</p><p class="q-expr">' +
        Frac.html(1, den) + 'x = ' + Frac.escape(rhs) + '</p>',
      answer: x,
      accept: function (v) { return U.almostEqual(v, x, 0.01); }
    });
  }

  function genWhichSolution(diff) {
    var x = U.randInt(3, 15);
    var a = U.randInt(2, 7);
    var b = U.randInt(1, 10);
    var rhs = a * x + b;
    var wrongs = [x + 1, x - 1, rhs, a];
    return U.q({
      topic: 'equation',
      type: 'mc',
      promptHtml: '<p class="q-lead">邊個係方程 ' + a + 'x + ' + b + ' = ' + rhs + ' 的解？</p>',
      answer: x,
      choices: U.mcChoices(x, wrongs),
      accept: function (v) { return U.almostEqual(v, x, 0.01); }
    });
  }

  function genTF(diff) {
    var xCand = U.randInt(2, 12);
    var a = U.randInt(2, 6);
    var b = U.randInt(1, 10);
    var rhs = a * 5 + b; // true solution is 5
    var trueX = 5;
    var claim = U.pick([trueX, xCand]);
    var isTrue = claim === trueX;
    return U.q({
      topic: 'equation',
      type: 'tf',
      promptHtml: '<p class="q-lead">判斷：x = ' + claim + ' 是方程 ' + a + 'x + ' + b + ' = ' + rhs + ' 的解？</p>',
      answer: isTrue,
      accept: function (v) { return !!v === isTrue; }
    });
  }

  function genComplete(diff) {
    var x = U.randInt(4, 16);
    var a = U.randInt(2, 9);
    // a * x = ?
    var product = a * x;
    return U.q({
      topic: 'equation',
      type: 'fill',
      promptHtml: '<p class="q-lead">已知 x = ' + x + '，完成方程：' + a + 'x = □</p>',
      answer: product,
      accept: function (v) { return U.almostEqual(v, product, 0.01); }
    });
  }

  function generate(diff) {
    return U.pick([genOneStep, genOneStep, genTwoStep, genTwoStep, genFracEq, genWhichSolution, genTF, genComplete])(diff || 'normal');
  }

  global.GenEquation = { generate: generate };
})(typeof window !== 'undefined' ? window : globalThis);
