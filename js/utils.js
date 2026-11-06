/**
 * Shared RNG helpers for generators.
 */
(function (global) {
  'use strict';

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[randInt(0, arr.length - 1)];
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  /** Round to n decimal places (string-safe for display/compare) */
  function roundTo(n, places) {
    var f = Math.pow(10, places);
    return Math.round(n * f) / f;
  }

  function almostEqual(a, b, eps) {
    eps = eps == null ? 1e-6 : eps;
    return Math.abs(Number(a) - Number(b)) <= eps;
  }

  /** Parse user answer: allow decimal, integer, and stacked-style "a b/c" or "a/b" for input only */
  function parseAnswer(str) {
    if (str == null) return NaN;
    var s = String(str).trim().replace(/,/g, '').replace(/−/g, '-');
    if (!s) return NaN;
    // mixed: 1 2/3
    var m = s.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (m) {
      var whole = parseInt(m[1], 10);
      var n = parseInt(m[2], 10);
      var d = parseInt(m[3], 10);
      if (!d) return NaN;
      var sign = whole < 0 ? -1 : 1;
      return sign * (Math.abs(whole) + n / d);
    }
    // improper/simple fraction input (answer box only — not UI display)
    m = s.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
    if (m) {
      var nn = parseInt(m[1], 10);
      var dd = parseInt(m[2], 10);
      if (!dd) return NaN;
      return nn / dd;
    }
    var num = Number(s);
    return num;
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  /** Difficulty scales */
  function difficultyParams(diff) {
    if (diff === 'easy') return { scale: 0.7, choices: 3, timeBonus: 1.2 };
    if (diff === 'hard') return { scale: 1.4, choices: 4, timeBonus: 0.85 };
    return { scale: 1, choices: 4, timeBonus: 1 };
  }

  /**
   * Standard question object:
   * { id, topic, type: 'fill'|'mc'|'tf'|'compare', promptHtml, answer, choices?, accept?, unit?, hint? }
   */
  function q(obj) {
    obj.id = obj.id || ('q' + Date.now() + '-' + Math.random().toString(36).slice(2, 8));
    return obj;
  }

  function mcChoices(correct, distractors, stringify) {
    stringify = stringify || function (x) { return String(x); };
    var set = {};
    var list = [];
    function add(v) {
      var s = stringify(v);
      if (set[s] != null) return;
      set[s] = v;
      list.push({ value: v, label: s });
    }
    add(correct);
    distractors.forEach(add);
    return shuffle(list).slice(0, 4);
  }

  global.U = {
    randInt: randInt,
    pick: pick,
    shuffle: shuffle,
    roundTo: roundTo,
    almostEqual: almostEqual,
    parseAnswer: parseAnswer,
    clamp: clamp,
    difficultyParams: difficultyParams,
    q: q,
    mcChoices: mcChoices
  };
})(typeof window !== 'undefined' ? window : globalThis);
