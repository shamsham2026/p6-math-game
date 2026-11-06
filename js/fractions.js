/**
 * Stacked fraction rendering — never use slash a/b in UI.
 */
(function (global) {
  'use strict';

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Greatest common divisor */
  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }

  function simplify(n, d) {
    if (d < 0) {
      n = -n;
      d = -d;
    }
    var g = gcd(n, d);
    return { n: n / g, d: d / g };
  }

  /**
   * HTML for a vertical stacked fraction.
   * @param {number|string} num
   * @param {number|string} den
   * @param {{sign?: string, whole?: number|string}} opts
   */
  function fractionHtml(num, den, opts) {
    opts = opts || {};
    var sign = opts.sign || '';
    var whole = opts.whole;
    var cls = 'frac' + (opts.large ? ' frac--large' : '');
    var html = '<span class="' + cls + '" role="math" aria-label="' +
      escapeHtml(String(sign) + (whole != null ? whole + ' ' : '') + num + ' 分之 ' + den) + '">';
    if (sign) html += '<span class="frac__sign">' + escapeHtml(sign) + '</span>';
    if (whole != null && whole !== '' && whole !== 0) {
      html += '<span class="frac__whole">' + escapeHtml(String(whole)) + '</span>';
    }
    html += '<span class="frac__stack">';
    html += '<span class="frac__num">' + escapeHtml(String(num)) + '</span>';
    html += '<span class="frac__bar" aria-hidden="true"></span>';
    html += '<span class="frac__den">' + escapeHtml(String(den)) + '</span>';
    html += '</span></span>';
    return html;
  }

  /**
   * Parse tokens in a template string and replace {{frac:n/d}} or {{frac:w n/d}}.
   * Also supports {{n}} numeric placeholders from a map.
   */
  function renderTemplate(tpl, vars) {
    vars = vars || {};
    var out = String(tpl);
    out = out.replace(/\{\{frac:(-?\d+)\s+(\d+)\/(\d+)\}\}/g, function (_, w, n, d) {
      var s = simplify(parseInt(n, 10), parseInt(d, 10));
      return fractionHtml(s.n, s.d, { whole: parseInt(w, 10) });
    });
    out = out.replace(/\{\{frac:(-?\d+)\/(\d+)\}\}/g, function (_, n, d) {
      var nn = parseInt(n, 10);
      var dd = parseInt(d, 10);
      var sign = '';
      if (nn < 0) {
        sign = '−';
        nn = -nn;
      }
      var s = simplify(nn, dd);
      return fractionHtml(s.n, s.d, { sign: sign });
    });
    out = out.replace(/\{\{(\w+)\}\}/g, function (_, key) {
      if (Object.prototype.hasOwnProperty.call(vars, key)) {
        var v = vars[key];
        if (v && typeof v === 'object' && v.__frac) {
          return fractionHtml(v.n, v.d, { sign: v.sign || '', whole: v.whole, large: v.large });
        }
        return escapeHtml(String(v));
      }
      return '';
    });
    return out;
  }

  /** Build a frac object for templates */
  function F(n, d, opts) {
    opts = opts || {};
    var s = simplify(n, d);
    return { __frac: true, n: s.n, d: s.d, sign: opts.sign || '', whole: opts.whole, large: opts.large };
  }

  /**
   * Convert a number that might be a terminating decimal into stacked fraction if needed,
   * or return plain text for integers/decimals.
   */
  function prettyNumber(x, preferFraction) {
    if (typeof x === 'object' && x && x.__frac) {
      return fractionHtml(x.n, x.d, { sign: x.sign, whole: x.whole, large: x.large });
    }
    if (preferFraction && typeof x === 'number' && !Number.isInteger(x)) {
      // try common denominators
      var dens = [2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 25, 50, 100];
      for (var i = 0; i < dens.length; i++) {
        var d = dens[i];
        var n = Math.round(x * d);
        if (Math.abs(n / d - x) < 1e-9) {
          var s = simplify(n, d);
          if (s.d === 1) return escapeHtml(String(s.n));
          var whole = Math.floor(Math.abs(s.n) / s.d);
          var rem = Math.abs(s.n) % s.d;
          var sign = s.n < 0 ? '−' : '';
          if (whole > 0 && rem > 0) return fractionHtml(rem, s.d, { sign: sign, whole: whole });
          return fractionHtml(Math.abs(s.n), s.d, { sign: sign });
        }
      }
    }
    if (typeof x === 'number') {
      // trim floating noise
      var r = Math.round(x * 1e8) / 1e8;
      return escapeHtml(String(r));
    }
    return escapeHtml(String(x));
  }

  global.Frac = {
    html: fractionHtml,
    render: renderTemplate,
    F: F,
    gcd: gcd,
    simplify: simplify,
    pretty: prettyNumber,
    escape: escapeHtml
  };
})(typeof window !== 'undefined' ? window : globalThis);
