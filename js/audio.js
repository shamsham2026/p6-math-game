/**
 * Lightweight SFX via Web Audio API (no external assets).
 */
(function (global) {
  'use strict';

  var ctx = null;
  var muted = false;

  function getCtx() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    return ctx;
  }

  function resume() {
    var c = getCtx();
    if (c && c.state === 'suspended') c.resume();
  }

  function beep(freq, dur, type, vol, when) {
    if (muted) return;
    var c = getCtx();
    if (!c) return;
    resume();
    var t0 = c.currentTime + (when || 0);
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  function playCorrect() {
    beep(523.25, 0.08, 'sine', 0.12, 0);
    beep(659.25, 0.08, 'sine', 0.12, 0.08);
    beep(783.99, 0.16, 'sine', 0.14, 0.16);
  }

  function playWrong() {
    beep(220, 0.12, 'triangle', 0.12, 0);
    beep(165, 0.22, 'triangle', 0.1, 0.1);
  }

  function playTick() {
    beep(880, 0.04, 'square', 0.05, 0);
  }

  function playClick() {
    beep(600, 0.03, 'sine', 0.06, 0);
  }

  function playWin() {
    [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
      beep(f, 0.15, 'sine', 0.12, i * 0.12);
    });
  }

  function playStart() {
    beep(392, 0.1, 'sine', 0.1, 0);
    beep(523.25, 0.15, 'sine', 0.12, 0.12);
  }

  function setMuted(m) {
    muted = !!m;
  }

  function isMuted() {
    return muted;
  }

  global.SFX = {
    resume: resume,
    correct: playCorrect,
    wrong: playWrong,
    tick: playTick,
    click: playClick,
    win: playWin,
    start: playStart,
    setMuted: setMuted,
    isMuted: isMuted
  };
})(typeof window !== 'undefined' ? window : globalThis);
