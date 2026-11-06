(function (global) {
  'use strict';
  var U = global.U;
  var Frac = global.Frac;

  function makeSet(diff) {
    var n = diff === 'easy' ? U.randInt(3, 4) : diff === 'hard' ? U.randInt(5, 7) : U.randInt(4, 5);
    var nums = [];
    for (var i = 0; i < n; i++) {
      nums.push(diff === 'hard' ? U.roundTo(U.randInt(10, 100) / 2, 1) : U.randInt(5, 40));
    }
    return nums;
  }

  function mean(nums) {
    var s = nums.reduce(function (a, b) { return a + b; }, 0);
    return s / nums.length;
  }

  function genMeanFill(diff) {
    var nums = makeSet(diff);
    // force nice mean sometimes
    if (diff !== 'hard') {
      var m = U.randInt(8, 25);
      var n = nums.length;
      var total = m * n;
      nums = [];
      var left = total;
      for (var i = 0; i < n - 1; i++) {
        var v = U.randInt(Math.max(1, Math.floor(left / (n - i) - 8)), Math.min(40, Math.floor(left / (n - i) + 8)));
        v = U.clamp(v, 1, left - (n - i - 1));
        nums.push(v);
        left -= v;
      }
      nums.push(left);
      nums = U.shuffle(nums);
    }
    var ans = U.roundTo(mean(nums), 2);
    return U.q({
      topic: 'average',
      type: 'fill',
      promptHtml: '<p class="q-lead">求以下數據的平均數：</p><p class="q-expr">' +
        nums.map(function (x) { return Frac.escape(x); }).join('、') + '</p>',
      answer: ans,
      accept: function (v) { return U.almostEqual(v, ans, 0.011); }
    });
  }

  function genMissing(diff) {
    var n = U.randInt(4, 6);
    var m = U.randInt(10, 30);
    var known = [];
    var sumKnown = 0;
    for (var i = 0; i < n - 1; i++) {
      var v = U.randInt(5, 40);
      known.push(v);
      sumKnown += v;
    }
    var missing = m * n - sumKnown;
    if (missing < 1 || missing > 80) {
      missing = U.randInt(5, 40);
      m = (sumKnown + missing) / n;
      m = U.roundTo(m, 2);
    }
    return U.q({
      topic: 'average',
      type: 'fill',
      promptHtml: '<p class="q-lead">已知 ' + n + ' 個數的平均數是 ' + Frac.escape(m) +
        '，其中 ' + (n - 1) + ' 個數是：</p><p class="q-expr">' +
        known.map(Frac.escape).join('、') +
        '</p><p class="q-lead">求未知數。</p>',
      answer: missing,
      accept: function (v) { return U.almostEqual(v, missing, 0.011); }
    });
  }

  function genMC(diff) {
    var nums = makeSet('easy');
    var mTarget = U.randInt(10, 20);
    var n = 4;
    var total = mTarget * n;
    nums = U.shuffle([
      U.randInt(5, 15),
      U.randInt(8, 18),
      U.randInt(10, 22)
    ]);
    var last = total - nums.reduce(function (a, b) { return a + b; }, 0);
    nums.push(last);
    var ans = mTarget;
    var wrong = [ans + 1, ans - 1, U.roundTo(total / (n - 1), 1), ans + 2];
    return U.q({
      topic: 'average',
      type: 'mc',
      promptHtml: '<p class="q-lead">這組數據的平均數是？</p><p class="q-expr">' +
        nums.map(Frac.escape).join('、') + '</p>',
      answer: ans,
      choices: U.mcChoices(ans, wrong),
      accept: function (v) { return U.almostEqual(v, ans, 0.001); }
    });
  }

  function genTF(diff) {
    var nums = [U.randInt(5, 20), U.randInt(5, 20), U.randInt(5, 20), U.randInt(5, 20)];
    var trueM = U.roundTo(mean(nums), 2);
    var shown = U.pick([trueM, U.roundTo(trueM + U.pick([1, 2, -1, 0.5]), 2)]);
    var isTrue = U.almostEqual(shown, trueM, 0.001);
    return U.q({
      topic: 'average',
      type: 'tf',
      promptHtml: '<p class="q-lead">判斷：以下數據平均數是 ' + Frac.escape(shown) + '？</p><p class="q-expr">' +
        nums.map(Frac.escape).join('、') + '</p>',
      answer: isTrue,
      accept: function (v) { return !!v === isTrue; }
    });
  }

  function genCompare(diff) {
    var a = [U.randInt(8, 20), U.randInt(8, 20), U.randInt(8, 20)];
    var b = [U.randInt(8, 20), U.randInt(8, 20), U.randInt(8, 20)];
    var ma = mean(a);
    var mb = mean(b);
    var ans = U.almostEqual(ma, mb, 0.001) ? '=' : (ma > mb ? '>' : '<');
    return U.q({
      topic: 'average',
      type: 'compare',
      promptHtml: '<p class="q-lead">比較兩組平均數：</p>' +
        '<p class="q-expr">甲：' + a.map(Frac.escape).join('、') + '</p>' +
        '<p class="q-expr">乙：' + b.map(Frac.escape).join('、') + '</p>' +
        '<p class="q-lead">甲的平均數 □ 乙的平均數</p>',
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
    return U.pick([genMeanFill, genMeanFill, genMissing, genMC, genTF, genCompare])(diff || 'normal');
  }

  global.GenAverage = { generate: generate };
})(typeof window !== 'undefined' ? window : globalThis);
