(function (global) {
  'use strict';

  var TOPICS = {
    decimal: { id: 'decimal', name: '小數四則', icon: '÷', gen: function (d) { return global.GenDecimal.generate(d); } },
    fraction: { id: 'fraction', name: '分數四則', icon: '¼', gen: function (d) { return global.GenFraction.generate(d); } },
    average: { id: 'average', name: '平均數', icon: '⌀', gen: function (d) { return global.GenAverage.generate(d); } },
    area: { id: 'area', name: '面積', icon: '▭', gen: function (d) { return global.GenArea.generate(d); } },
    volume: { id: 'volume', name: '體積', icon: '▣', gen: function (d) { return global.GenVolume.generate(d); } },
    algebra: { id: 'algebra', name: '代數', icon: '𝑥', gen: function (d) { return global.GenAlgebra.generate(d); } },
    equation: { id: 'equation', name: '方程', icon: '=', gen: function (d) { return global.GenEquation.generate(d); } },
    word: { id: 'word', name: '文字題', icon: '文', gen: function (d) { return global.GenWord.generate(d); } },
    mixed: { id: 'mixed', name: '綜合挑戰', icon: '★', gen: null }
  };

  var TOPIC_ORDER = ['decimal', 'fraction', 'average', 'area', 'volume', 'algebra', 'equation', 'word'];

  function generateOne(topicId, diff) {
    if (topicId === 'mixed') {
      var tid = global.U.pick(TOPIC_ORDER);
      return TOPICS[tid].gen(diff);
    }
    var t = TOPICS[topicId];
    if (!t || !t.gen) throw new Error('Unknown topic: ' + topicId);
    return t.gen(diff);
  }

  function generateRound(topicId, count, diff) {
    var list = [];
    var guard = 0;
    while (list.length < count && guard < count * 5) {
      guard++;
      try {
        list.push(generateOne(topicId, diff));
      } catch (e) {
        console.warn(e);
      }
    }
    return list;
  }

  global.Topics = {
    TOPICS: TOPICS,
    TOPIC_ORDER: TOPIC_ORDER,
    generateOne: generateOne,
    generateRound: generateRound
  };
})(typeof window !== 'undefined' ? window : globalThis);
