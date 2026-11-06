/**
 * Game session state machine.
 * Versus = simultaneous race (same question, independent answers).
 */
(function (global) {
  'use strict';

  function createSession(opts) {
    opts = opts || {};
    var topic = opts.topic || 'mixed';
    var mode = opts.mode || 'solo'; // solo | versus
    var diff = opts.difficulty || 'normal';
    var count = opts.questionsPerRound || 10;
    var seconds = opts.secondsPerRound || 120;
    if (diff === 'easy') seconds = Math.round(seconds * 1.25);
    if (diff === 'hard') seconds = Math.round(seconds * 0.85);

    var questions = global.Topics.generateRound(topic, count, diff);

    return {
      topic: topic,
      mode: mode,
      difficulty: diff,
      questions: questions,
      index: 0,
      secondsTotal: seconds,
      secondsLeft: seconds,
      players: mode === 'versus'
        ? [
            { name: '玩家 A', score: 0, correct: 0, wrong: 0, streak: 0 },
            { name: '玩家 B', score: 0, correct: 0, wrong: 0, streak: 0 }
          ]
        : [{ name: '你', score: 0, correct: 0, wrong: 0, streak: 0 }],
      currentPlayer: 0,
      answered: false,
      /** Versus: per-player lock for current question [bool, bool] */
      sideAnswered: [false, false],
      sideCorrect: [null, null],
      questionWon: false,
      finished: false,
      lastCorrect: null
    };
  }

  function currentQuestion(session) {
    return session.questions[session.index] || null;
  }

  function currentPlayer(session) {
    return session.players[session.currentPlayer];
  }

  function scoreFor(correct, streak, secondsLeft, secondsTotal, speedBonus) {
    if (!correct) return 0;
    var base = 100;
    var streakBonus = Math.min(streak, 5) * 20;
    var timeBonus = Math.round(50 * (secondsLeft / secondsTotal));
    return base + streakBonus + timeBonus + (speedBonus || 0);
  }

  function evaluateRaw(q, raw) {
    if (q.type === 'tf') {
      return q.accept(raw === true || raw === 'true' || raw === '對' || raw === 1);
    }
    if (q.type === 'mc' || q.type === 'compare') return q.accept(raw);
    if (q.inputMode === 'fraction') return q.accept(raw);
    if (q.inputMode === 'text') return q.accept(raw);
    return q.accept(global.U.parseAnswer(raw));
  }

  /** Solo (or legacy): submit for currentPlayer */
  function submitAnswer(session, raw) {
    if (session.mode === 'versus') {
      return submitVersus(session, session.currentPlayer, raw);
    }
    if (session.finished || session.answered) return null;
    var q = currentQuestion(session);
    if (!q) return null;
    var ok = evaluateRaw(q, raw);
    var p = currentPlayer(session);
    session.answered = true;
    session.lastCorrect = ok;
    if (ok) {
      p.correct += 1;
      p.streak += 1;
      p.score += scoreFor(true, p.streak, session.secondsLeft, session.secondsTotal, 0);
    } else {
      p.wrong += 1;
      p.streak = 0;
    }
    return { correct: ok, answer: q.answer, player: p, playerIndex: session.currentPlayer };
  }

  /**
   * Versus 搶答: playerIndex 0 = top (A), 1 = bottom (B).
   * First CORRECT wins the question (+30), advances immediately (UI).
   * Wrong locks that side only; other may still 搶答.
   */
  function submitVersus(session, playerIndex, raw) {
    if (session.finished) return null;
    if (session.questionWon) return null; // already advancing
    if (session.sideAnswered[playerIndex]) return null; // locked after wrong (or done)
    var q = currentQuestion(session);
    if (!q) return null;

    var ok = evaluateRaw(q, raw);
    var p = session.players[playerIndex];
    var speedBonus = 0;
    var raceWon = false;

    if (ok) {
      session.sideAnswered[playerIndex] = true;
      session.sideCorrect[playerIndex] = true;
      session.questionWon = true;
      session.answered = true;
      raceWon = true;
      speedBonus = 30; // 搶答成功
      p.correct += 1;
      p.streak += 1;
      p.score += scoreFor(true, p.streak, session.secondsLeft, session.secondsTotal, speedBonus);
    } else {
      session.sideAnswered[playerIndex] = true;
      session.sideCorrect[playerIndex] = false;
      p.wrong += 1;
      p.streak = 0;
    }

    session.lastCorrect = ok;
    var bothWrong = session.sideAnswered[0] && session.sideAnswered[1] &&
      session.sideCorrect[0] === false && session.sideCorrect[1] === false;

    return {
      correct: ok,
      answer: q.answer,
      player: p,
      playerIndex: playerIndex,
      speedBonus: speedBonus,
      raceWon: raceWon,
      bothWrong: bothWrong
    };
  }

  function bothSidesDone(session) {
    return !!session.questionWon ||
      (session.sideAnswered[0] && session.sideAnswered[1]);
  }

  function next(session) {
    if (session.finished) return session;
    session.answered = false;
    session.lastCorrect = null;
    session.sideAnswered = [false, false];
    session.sideCorrect = [null, null];
    session.questionWon = false;
    session.index += 1;
    session.currentPlayer = 0;

    if (session.index >= session.questions.length) {
      session.finished = true;
    }
    return session;
  }

  function tick(session) {
    if (session.finished || session.secondsLeft <= 0) {
      session.secondsLeft = 0;
      session.finished = true;
      return session;
    }
    session.secondsLeft -= 1;
    if (session.secondsLeft <= 0) {
      session.secondsLeft = 0;
      session.finished = true;
    }
    return session;
  }

  function summary(session) {
    var attempted = session.players.reduce(function (s, p) { return s + p.correct + p.wrong; }, 0);
    return {
      topic: session.topic,
      mode: session.mode,
      difficulty: session.difficulty,
      players: session.players.map(function (p) {
        return {
          name: p.name,
          score: p.score,
          correct: p.correct,
          wrong: p.wrong,
          total: p.correct + p.wrong,
          accuracy: (p.correct + p.wrong) ? p.correct / (p.correct + p.wrong) : 0
        };
      }),
      attempted: attempted,
      timeUsed: session.secondsTotal - session.secondsLeft,
      winner: session.mode === 'versus'
        ? (session.players[0].score === session.players[1].score
          ? null
          : (session.players[0].score > session.players[1].score ? 0 : 1))
        : 0
    };
  }

  global.Game = {
    createSession: createSession,
    currentQuestion: currentQuestion,
    currentPlayer: currentPlayer,
    submitAnswer: submitAnswer,
    submitVersus: submitVersus,
    bothSidesDone: bothSidesDone,
    next: next,
    tick: tick,
    summary: summary,
    scoreFor: scoreFor
  };
})(typeof window !== 'undefined' ? window : globalThis);
