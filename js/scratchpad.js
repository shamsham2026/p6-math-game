/**
 * 算草區 — touch/stylus canvas scratch pad (no backend).
 */
(function (global) {
  'use strict';

  function attach(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var drawing = false;
    var last = null;
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    var stroke = opts.strokeStyle || '#e2e8f0';
    var width = opts.lineWidth || 2.2;

    function resize() {
      var w = canvas.clientWidth || canvas.parentElement.clientWidth || 200;
      var h = canvas.clientHeight || 90;
      if (w < 40) w = 200;
      if (h < 40) h = 90;
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
    }

    function pos(e) {
      var rect = canvas.getBoundingClientRect();
      var src = e.touches && e.touches[0] ? e.touches[0] : e;
      return { x: src.clientX - rect.left, y: src.clientY - rect.top };
    }

    function start(e) {
      e.preventDefault();
      drawing = true;
      last = pos(e);
    }
    function move(e) {
      if (!drawing) return;
      e.preventDefault();
      var p = pos(e);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
    }
    function end(e) {
      if (e) e.preventDefault();
      drawing = false;
      last = null;
    }

    function clear() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
    }

    canvas.style.touchAction = 'none';
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end, { passive: false });
    canvas.addEventListener('touchcancel', end, { passive: false });

    resize();
    return { clear: clear, resize: resize };
  }

  /** Build a compact scratch UI into parent; returns { clear, resize } */
  function mount(parent, opts) {
    opts = opts || {};
    var wrap = document.createElement('div');
    wrap.className = 'scratch-pad' + (opts.compact ? ' scratch-pad--compact' : '');
    wrap.innerHTML =
      '<div class="scratch-toolbar">' +
      '<span class="scratch-label">算草區</span>' +
      '<button type="button" class="scratch-clear">清除</button>' +
      '</div>' +
      '<canvas class="scratch-canvas" aria-label="算草區畫布"></canvas>';
    parent.appendChild(wrap);
    var canvas = wrap.querySelector('.scratch-canvas');
    var api = attach(canvas, opts);
    wrap.querySelector('.scratch-clear').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      api.clear();
      if (typeof SFX !== 'undefined') SFX.click();
    });
    // defer resize after layout
    setTimeout(function () { api.resize(); }, 30);
    setTimeout(function () { api.resize(); }, 200);
    return api;
  }

  global.ScratchPad = { attach: attach, mount: mount };
})(typeof window !== 'undefined' ? window : globalThis);
