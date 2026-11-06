/**
 * localStorage progress persistence.
 */
(function (global) {
  'use strict';

  var KEY = 'p6-math-arena-v1';

  function defaults() {
    return {
      bestScores: {},
      bestAccuracy: {},
      totalPlayed: 0,
      totalCorrect: 0,
      unlockedTopics: ['decimal', 'fraction', 'average', 'area', 'volume', 'algebra', 'equation', 'word', 'mixed'],
      lastSession: null,
      settings: { muted: false, difficulty: 'normal', questionsPerRound: 10, secondsPerRound: 120 },
      history: []
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      var data = JSON.parse(raw);
      var d = defaults();
      return Object.assign(d, data, {
        settings: Object.assign(d.settings, data.settings || {}),
        bestScores: Object.assign({}, d.bestScores, data.bestScores || {}),
        bestAccuracy: Object.assign({}, d.bestAccuracy, data.bestAccuracy || {})
      });
    } catch (e) {
      return defaults();
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) { /* quota */ }
  }

  function update(fn) {
    var data = load();
    fn(data);
    save(data);
    return data;
  }

  function recordSession(session) {
    return update(function (data) {
      data.totalPlayed += 1;
      data.totalCorrect += session.correct || 0;
      data.lastSession = session;
      var topic = session.topic;
      var score = session.score || 0;
      if (!data.bestScores[topic] || score > data.bestScores[topic]) {
        data.bestScores[topic] = score;
      }
      var acc = session.total ? session.correct / session.total : 0;
      if (!data.bestAccuracy[topic] || acc > data.bestAccuracy[topic]) {
        data.bestAccuracy[topic] = acc;
      }
      data.history.unshift({
        at: Date.now(),
        topic: topic,
        mode: session.mode,
        score: score,
        correct: session.correct,
        total: session.total,
        difficulty: session.difficulty
      });
      if (data.history.length > 30) data.history.length = 30;
    });
  }

  global.Store = {
    load: load,
    save: save,
    update: update,
    recordSession: recordSession,
    KEY: KEY
  };
})(typeof window !== 'undefined' ? window : globalThis);
