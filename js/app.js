/**
 * UI controller — 小六數學競技場
 * Versus: opposite seating (top A rotated 180°, bottom B), simultaneous answers.
 */
(function () {
  'use strict';

  var state = {
    topic: 'mixed',
    mode: 'solo',
    difficulty: 'normal',
    session: null,
    timerId: null,
    data: null,
    advPose: 'idle',
    advPoseTimer: null
  };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function showScreen(id) {
    $$('.screen').forEach(function (el) {
      el.classList.toggle('active', el.id === id);
    });
  }

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function topicName(id) {
    var t = Topics.TOPICS[id];
    return t ? t.name : id;
  }

  function typeLabel(t) {
    return ({ fill: '填充', mc: '選擇', tf: '判斷', compare: '比較' })[t] || t;
  }

  function formatAnswerDisplay(ans) {
    if (typeof ans === 'boolean') return ans ? '對' : '錯';
    if (ans && typeof ans === 'object' && ans.__frac) return Frac.pretty(ans);
    if (ans && typeof ans === 'object' && ans.n != null && ans.d != null) {
      return Frac.html(ans.n, ans.d);
    }
    return Frac.escape(String(ans));
  }

  function setPlayModeLayout(mode) {
    var solo = $('#solo-play');
    var vs = $('#versus-play');
    var play = $('#screen-play');
    if (mode === 'versus') {
      if (solo) solo.hidden = true;
      if (vs) vs.hidden = false;
      if (play) play.classList.add('is-versus');
    } else {
      if (solo) solo.hidden = false;
      if (vs) vs.hidden = true;
      if (play) play.classList.remove('is-versus');
    }
  }

  function initHome() {
    state.data = Store.load();
    SFX.setMuted(!!state.data.settings.muted);
    $('#btn-mute').setAttribute('aria-pressed', SFX.isMuted() ? 'true' : 'false');
    $('#btn-mute').textContent = SFX.isMuted() ? '🔇 靜音' : '🔊 音效';

    state.difficulty = state.data.settings.difficulty || 'normal';
    $$('[data-diff]').forEach(function (btn) {
      btn.classList.toggle('selected', btn.getAttribute('data-diff') === state.difficulty);
    });
    $$('[data-mode]').forEach(function (btn) {
      btn.classList.toggle('selected', btn.getAttribute('data-mode') === state.mode);
    });
    $$('[data-topic]').forEach(function (btn) {
      btn.classList.toggle('selected', btn.getAttribute('data-topic') === state.topic);
    });

    var best = state.data.bestScores || {};
    var ul = $('#best-scores');
    ul.innerHTML = '';
    Topics.TOPIC_ORDER.concat(['mixed']).forEach(function (id) {
      var li = document.createElement('li');
      var score = best[id];
      li.innerHTML = '<span>' + Frac.escape(topicName(id)) + '</span><span>' +
        (score != null ? score + ' 分' : '—') + '</span>';
      ul.appendChild(li);
    });

    var last = state.data.lastSession;
    var lastEl = $('#last-session');
    if (last) {
      var when = new Date(last.at || Date.now());
      lastEl.textContent = '上次：' + topicName(last.topic) + ' · ' +
        (last.score != null ? last.score + ' 分' : '') +
        ' · ' + when.toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' });
    } else {
      lastEl.textContent = '尚未有對局紀錄';
    }

    var art = $('#home-art');
    if (art && typeof Adventure !== 'undefined') art.innerHTML = Adventure.homeBannerHtml();
    $$('[data-icon]').forEach(function (slot) {
      if (typeof Diagrams !== 'undefined') {
        slot.innerHTML = Diagrams.topicIcon(slot.getAttribute('data-icon'));
      }
    });

    showScreen('screen-home');
  }

  function startGame() {
    SFX.resume();
    SFX.start();
    Store.update(function (d) { d.settings.difficulty = state.difficulty; });

    var settings = Store.load().settings;
    state.session = Game.createSession({
      topic: state.topic,
      mode: state.mode,
      difficulty: state.difficulty,
      questionsPerRound: settings.questionsPerRound || 10,
      secondsPerRound: settings.secondsPerRound || 120
    });

    if (state.timerId) clearInterval(state.timerId);
    state.timerId = setInterval(onTick, 1000);
    state.advPose = 'idle';
    if (state.advPoseTimer) clearTimeout(state.advPoseTimer);

    setPlayModeLayout(state.mode);
    showScreen('screen-play');
    renderPlay();
  }

  function quitToHome() {
    if (state.timerId) clearInterval(state.timerId);
    state.session = null;
    setPlayModeLayout('solo');
    initHome();
  }

  function onTick() {
    if (!state.session || state.session.finished) return;
    Game.tick(state.session);
    updateHud();
    if (state.session.secondsLeft <= 10 && state.session.secondsLeft > 0) SFX.tick();
    if (state.session.finished) endGame();
  }

  function updateHud() {
    var s = state.session;
    if (!s) return;
    var t = formatTime(s.secondsLeft);
    var qn = Math.min(s.index + 1, s.questions.length) + ' / ' + s.questions.length;

    if (s.mode === 'versus') {
      if ($('#vs-score-a')) $('#vs-score-a').textContent = String(s.players[0].score);
      if ($('#vs-score-b')) $('#vs-score-b').textContent = String(s.players[1].score);
      if ($('#vs-time-a')) $('#vs-time-a').textContent = t;
      if ($('#vs-time-b')) $('#vs-time-b').textContent = t;
      if ($('#vs-qnum')) $('#vs-qnum').textContent = qn;
      renderVersusCenter();
      return;
    }

    var hudTime = $('#hud-time');
    if (hudTime) {
      hudTime.textContent = t;
      hudTime.parentElement.classList.toggle('warn', s.secondsLeft <= 15);
    }
    var p = Game.currentPlayer(s);
    if ($('#hud-score')) $('#hud-score').textContent = String(p.score);
    if ($('#hud-qnum')) $('#hud-qnum').textContent = qn;
    if ($('#progress-fill')) {
      $('#progress-fill').style.width = ((s.index) / s.questions.length) * 100 + '%';
    }
  }

  function renderVersusCenter(forcePose) {
    var root = $('#vs-center-root');
    if (!root || typeof Adventure === 'undefined') return;
    var s = state.session;
    if (!s) { root.innerHTML = ''; return; }
    var pose = forcePose || state.advPose || 'idle';
    if (!forcePose && pose === 'idle') {
      var combined = Math.max(s.players[0].correct, s.players[1].correct);
      pose = Adventure.STAGES[Adventure.stageFromCorrect(combined)].action;
    }
    root.innerHTML = Adventure.renderVersusCenter({
      aCorrect: s.players[0].correct,
      bCorrect: s.players[1].correct,
      totalQ: s.questions.length,
      pose: pose
    });
  }

  function renderAdventure(forcePose) {
    var s = state.session;
    if (!s) return;
    if (s.mode === 'versus') {
      renderVersusCenter(forcePose);
      return;
    }
    var root = $('#adventure-root');
    if (!root || typeof Adventure === 'undefined') return;
    var pose = forcePose || state.advPose || 'idle';
    var p = s.players[0];
    if (!forcePose && pose === 'idle') {
      pose = Adventure.STAGES[Adventure.stageFromCorrect(p.correct)].action;
    }
    root.innerHTML = Adventure.renderStrip({
      correct: p.correct,
      totalQ: s.questions.length,
      pose: pose
    });
  }

  function readFractionFrom(prefix) {
    var wholeEl = document.getElementById(prefix + 'frac-whole');
    var numEl = document.getElementById(prefix + 'frac-num');
    var denEl = document.getElementById(prefix + 'frac-den');
    if (!numEl || !denEl) return null;
    return {
      whole: wholeEl && wholeEl.value !== '' ? wholeEl.value : 0,
      n: numEl.value,
      d: denEl.value
    };
  }

  function mountFractionInput(area, opts) {
    opts = opts || {};
    var prefix = opts.idPrefix || '';
    var onSubmit = opts.onSubmit || function () {};
    var wrap = document.createElement('div');
    wrap.className = 'frac-answer-wrap';
    wrap.innerHTML =
      '<p class="frac-answer-hint">輸入約簡分數（可選整數）</p>' +
      '<div class="frac-answer" role="group" aria-label="分數答案">' +
      '<input type="text" inputmode="numeric" class="frac-whole-input" id="' + prefix + 'frac-whole" placeholder="整" aria-label="整數" autocomplete="off"/>' +
      '<span class="frac-answer-stack">' +
      '<input type="text" inputmode="numeric" class="frac-part-input" id="' + prefix + 'frac-num" placeholder="分子" aria-label="分子" autocomplete="off"/>' +
      '<span class="frac-answer-bar" aria-hidden="true"></span>' +
      '<input type="text" inputmode="numeric" class="frac-part-input" id="' + prefix + 'frac-den" placeholder="分母" aria-label="分母" autocomplete="off"/>' +
      '</span></div>';
    var btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.type = 'button';
    btn.textContent = '提交';
    btn.addEventListener('click', function () { onSubmit(readFractionFrom(prefix)); });
    wrap.appendChild(btn);
    area.appendChild(wrap);

    var pad = document.createElement('div');
    pad.className = 'numpad show';
    var active = null;
    [prefix + 'frac-whole', prefix + 'frac-num', prefix + 'frac-den'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('focus', function () { active = el; });
    });
    active = document.getElementById(prefix + 'frac-num');
    ['7','8','9','4','5','6','1','2','3','0','⌫'].forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = k;
      if (k === '0') b.className = 'wide';
      b.addEventListener('click', function () {
        SFX.click();
        if (!active) active = document.getElementById(prefix + 'frac-num');
        if (k === '⌫') active.value = active.value.slice(0, -1);
        else active.value += k;
        active.focus();
      });
      pad.appendChild(b);
    });
    area.appendChild(pad);
  }

  function mountNumericInput(area, opts) {
    opts = opts || {};
    var id = opts.inputId || 'answer-input';
    var onSubmit = opts.onSubmit || function () {};
    var textMode = opts.textMode;
    var row = document.createElement('div');
    row.className = 'answer-input-row';
    var input = document.createElement('input');
    input.className = 'answer-input';
    input.id = id;
    input.type = 'text';
    input.inputMode = textMode ? 'text' : 'decimal';
    input.autocomplete = 'off';
    input.placeholder = textMode ? '例如 3x+5' : '輸入答案';
    input.setAttribute('aria-label', '答案');
    var btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.type = 'button';
    btn.textContent = '提交';
    btn.addEventListener('click', function () { onSubmit(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') onSubmit(input.value);
    });
    row.appendChild(input);
    row.appendChild(btn);
    area.appendChild(row);
    if (!textMode) {
      var pad = document.createElement('div');
      pad.className = 'numpad show';
      ['7','8','9','4','5','6','1','2','3','.','0','⌫'].forEach(function (k) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = k;
        b.addEventListener('click', function () {
          SFX.click();
          if (k === '⌫') input.value = input.value.slice(0, -1);
          else input.value += k;
          input.focus();
        });
        pad.appendChild(b);
      });
      area.appendChild(pad);
    }
  }

  function mountChoiceInput(area, q, onSubmit) {
    if (q.type === 'tf') {
      var tf = document.createElement('div');
      tf.className = 'tf-row';
      var yes = document.createElement('button');
      yes.type = 'button';
      yes.className = 'btn btn-good';
      yes.textContent = '✓ 對';
      yes.addEventListener('click', function () { onSubmit(true, yes); });
      var no = document.createElement('button');
      no.type = 'button';
      no.className = 'btn btn-bad';
      no.textContent = '✗ 錯';
      no.addEventListener('click', function () { onSubmit(false, no); });
      tf.appendChild(yes);
      tf.appendChild(no);
      area.appendChild(tf);
      return;
    }
    var grid = document.createElement('div');
    grid.className = 'choices';
    (q.choices || []).forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice-btn';
      b.textContent = c.label;
      b.addEventListener('click', function () { onSubmit(c.value, b); });
      grid.appendChild(b);
    });
    area.appendChild(grid);
  }

  function mountAnswerControls(area, q, opts) {
    opts = opts || {};
    var onSubmit = opts.onSubmit;
    var idPrefix = opts.idPrefix || '';
    area.innerHTML = '';
    if (q.type === 'fill' && q.inputMode === 'fraction') {
      mountFractionInput(area, { idPrefix: idPrefix, onSubmit: onSubmit });
    } else if (q.type === 'fill') {
      mountNumericInput(area, {
        inputId: idPrefix + 'answer-input',
        textMode: q.inputMode === 'text',
        onSubmit: onSubmit
      });
    } else {
      mountChoiceInput(area, q, onSubmit);
    }
  }


  function mountScratch(parent, opts) {
    if (typeof ScratchPad === 'undefined' || !parent) return null;
    return ScratchPad.mount(parent, opts || {});
  }

  function renderPlay() {
    var s = state.session;
    var q = Game.currentQuestion(s);
    updateHud();
    if (!q || s.finished) {
      endGame();
      return;
    }
    if (s.mode === 'versus') {
      renderVersusPlay(q);
      return;
    }
    renderSoloPlay(q);
  }

  function renderSoloPlay(q) {
    var s = state.session;
    if (state.advPose !== 'stumble') {
      state.advPose = 'idle';
      renderAdventure();
    }
    var card = $('#question-card');
    card.classList.remove('flash-ok', 'flash-no');
    $('#feedback').className = 'feedback';
    $('#feedback').textContent = '';
    $('#q-topic').textContent = topicName(q.topic);
    $('#q-type').textContent = typeLabel(q.type);
    $('#q-body').innerHTML = q.promptHtml;

    var area = $('#answer-area');
    mountAnswerControls(area, q, {
      onSubmit: function (raw, btn) { submitSolo(raw, btn); }
    });

    var nextWrap = document.createElement('div');
    nextWrap.style.marginTop = '0.75rem';
    nextWrap.style.display = 'none';
    nextWrap.id = 'next-wrap';
    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn btn-primary';
    nextBtn.id = 'btn-next';
    nextBtn.textContent = '下一題 →';
    nextBtn.addEventListener('click', goNext);
    nextWrap.appendChild(nextBtn);
    area.appendChild(nextWrap);

    // 算草區（單人，答案區下方，細緻唔搶空間）
    var scratchHost = document.createElement('div');
    scratchHost.className = 'scratch-host scratch-host--solo';
    area.appendChild(scratchHost);
    mountScratch(scratchHost, { compact: true });
  }

  function renderVersusPlay(q) {
    var s = state.session;
    state.advPose = 'idle';
    renderVersusCenter();

    var tname = topicName(q.topic) + ' · ' + typeLabel(q.type);
    $('#vs-topic-a').textContent = tname;
    $('#vs-topic-b').textContent = tname;
    $('#vs-qbody-a').innerHTML = q.promptHtml;
    $('#vs-qbody-b').innerHTML = q.promptHtml;

    ['a', 'b'].forEach(function (side) {
      var fb = $('#vs-feedback-' + side);
      fb.className = 'vs-feedback';
      fb.textContent = '';
      var panel = $('#vs-panel-' + side);
      panel.classList.remove('locked', 'got-ok', 'got-no');
    });

    var nextBtn = $('#btn-vs-next');
    nextBtn.hidden = true;

    mountAnswerControls($('#vs-answer-a'), q, {
      idPrefix: 'a-',
      onSubmit: function (raw, btn) { submitVersusSide(0, raw, btn); }
    });
    mountAnswerControls($('#vs-answer-b'), q, {
      idPrefix: 'b-',
      onSubmit: function (raw, btn) { submitVersusSide(1, raw, btn); }
    });

    // 各邊獨立算草區（跟面板旋轉）
    var sa = document.createElement('div');
    sa.className = 'scratch-host scratch-host--vs';
    $('#vs-answer-a').appendChild(sa);
    mountScratch(sa, { compact: true });

    var sb = document.createElement('div');
    sb.className = 'scratch-host scratch-host--vs';
    $('#vs-answer-b').appendChild(sb);
    mountScratch(sb, { compact: true });

    updateHud();
  }

  function submitSolo(raw, btnEl) {
    var s = state.session;
    if (!s || s.answered || s.finished) return;
    SFX.resume();
    var result = Game.submitAnswer(s, raw);
    if (!result) return;

    var card = $('#question-card');
    var fb = $('#feedback');
    fb.classList.add('show');
    var iconOk = Diagrams ? Diagrams.feedbackIcon(true) : '';
    var iconNo = Diagrams ? Diagrams.feedbackIcon(false) : '';
    if (state.advPoseTimer) clearTimeout(state.advPoseTimer);

    if (result.correct) {
      SFX.correct();
      card.classList.add('flash-ok');
      fb.classList.add('ok');
      var stIdx = Adventure.stageFromCorrect(result.player.correct);
      var actionPose = Adventure.STAGES[stIdx].action;
      state.advPose = actionPose;
      renderAdventure(actionPose);
      fb.innerHTML = iconOk + ' <span>答對了！' + Adventure.HERO_NAME + '進入「' +
        Adventure.STAGES[stIdx].name + '」· ' + result.player.score + ' 分</span>';
      if (btnEl) btnEl.classList.add('correct');
    } else {
      SFX.wrong();
      card.classList.add('flash-no');
      fb.classList.add('no');
      state.advPose = 'stumble';
      renderAdventure('stumble');
      state.advPoseTimer = setTimeout(function () {
        state.advPose = 'idle';
        renderAdventure();
      }, 900);
      fb.innerHTML = iconNo + ' <span>唔啱。正確答案：' + formatAnswerDisplay(result.answer) + '</span>';
      if (btnEl) btnEl.classList.add('wrong');
    }

    $$('#answer-area button, #answer-area input').forEach(function (el) {
      if (el.id !== 'btn-next') el.disabled = true;
    });
    var nw = $('#next-wrap');
    if (nw) nw.style.display = 'block';
    updateHud();
  }

  function submitVersusSide(playerIndex, raw, btnEl) {
    var s = state.session;
    if (!s || s.finished || s.questionWon) return;
    SFX.resume();
    var result = Game.submitVersus(s, playerIndex, raw);
    if (!result) return;

    var side = playerIndex === 0 ? 'a' : 'b';
    var other = playerIndex === 0 ? 'b' : 'a';
    var fb = $('#vs-feedback-' + side);
    var panel = $('#vs-panel-' + side);
    var iconOk = Diagrams ? Diagrams.feedbackIcon(true) : '';
    var iconNo = Diagrams ? Diagrams.feedbackIcon(false) : '';

    // lock this side after any submit (wrong = out for this Q; correct = race won)
    panel.classList.add('locked');
    $$('#vs-answer-' + side + ' button, #vs-answer-' + side + ' input').forEach(function (el) {
      el.disabled = true;
    });

    if (result.correct && result.raceWon) {
      SFX.correct();
      panel.classList.add('got-ok');
      fb.classList.add('ok', 'show');
      fb.innerHTML = iconOk + ' <span>搶答成功！+' + (100 + (result.speedBonus || 0)) +
        ' · 共 ' + result.player.score + ' 分</span>';
      if (btnEl) btnEl.classList.add('correct');

      // freeze other side — they lost the race
      var op = $('#vs-panel-' + other);
      op.classList.add('locked');
      $$('#vs-answer-' + other + ' button, #vs-answer-' + other + ' input').forEach(function (el) {
        el.disabled = true;
      });
      var ofb = $('#vs-feedback-' + other);
      if (!s.sideAnswered[playerIndex === 0 ? 1 : 0]) {
        ofb.classList.add('show');
        ofb.innerHTML = '<span>對手搶答成功</span>';
      }

      state.advPose = Adventure.STAGES[Adventure.stageFromCorrect(result.player.correct)].action;
      renderVersusCenter(state.advPose);
      updateHud();
      $('#btn-vs-next').hidden = true;

      // 搶答即過：短暫回饋後自動下一題
      if (state.advPoseTimer) clearTimeout(state.advPoseTimer);
      state.advPoseTimer = setTimeout(function () {
        goNext();
      }, 420);
      return;
    }

    // wrong — this side out; other may still 搶答
    SFX.wrong();
    panel.classList.add('got-no');
    fb.classList.add('no', 'show');
    fb.innerHTML = iconNo + ' <span>唔啱 · 對手仲可以搶答</span>';
    if (btnEl) btnEl.classList.add('wrong');
    state.advPose = 'stumble';
    renderVersusCenter('stumble');
    if (state.advPoseTimer) clearTimeout(state.advPoseTimer);
    state.advPoseTimer = setTimeout(function () {
      state.advPose = 'idle';
      renderVersusCenter();
    }, 600);
    updateHud();

    // both wrong → optional skip only
    if (result.bothWrong) {
      var reveal = formatAnswerDisplay(result.answer);
      fb.innerHTML = iconNo + ' <span>兩邊都唔啱 · 答案：' + reveal + '</span>';
      var ofb2 = $('#vs-feedback-' + other);
      ofb2.classList.add('no', 'show');
      ofb2.innerHTML = iconNo + ' <span>兩邊都唔啱 · 答案：' + reveal + '</span>';
      $('#btn-vs-next').hidden = false;
      $('#btn-vs-next').textContent = '下一題 →';
    } else {
      $('#btn-vs-next').hidden = true;
    }
  }

  function goNext() {
    SFX.click();
    var s = state.session;
    Game.next(s);
    if (s.finished) {
      endGame();
      return;
    }
    renderPlay();
  }

  function endGame() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
    var s = state.session;
    if (!s) return;
    s.finished = true;
    var sum = Game.summary(s);
    SFX.win();
    state.advPose = 'cheer';
    if (s.mode === 'versus') renderVersusCenter('cheer');
    else renderAdventure('cheer');

    var primary = sum.players[0];
    if (s.mode === 'versus' && sum.winner != null) primary = sum.players[sum.winner];
    else if (s.mode === 'versus') {
      primary = sum.players[0].score >= sum.players[1].score ? sum.players[0] : sum.players[1];
    }
    Store.recordSession({
      at: Date.now(),
      topic: s.topic,
      mode: s.mode,
      difficulty: s.difficulty,
      score: primary.score,
      correct: primary.correct,
      total: primary.total,
      players: sum.players
    });

    showScreen('screen-end');
    setPlayModeLayout('solo');
    $('#end-topic').textContent = topicName(s.topic) + ' · ' +
      (s.mode === 'versus' ? '雙人對坐對賽' : '單人') + ' · ' +
      ({ easy: '簡易', normal: '普通', hard: '挑戰' })[s.difficulty];

    var hero = $('#end-body');
    if (s.mode === 'versus') {
      var w = sum.winner;
      var html = '<div class="vs-result">';
      html += '<div class="side"><div class="pname">玩家 A</div><div class="sc" style="color:var(--player-a)">' +
        sum.players[0].score + '</div>';
      if (w === 0) html += '<div class="winner-tag">勝出</div>';
      html += '<div style="color:var(--muted);font-size:.85rem">正確 ' + sum.players[0].correct +
        ' / ' + sum.players[0].total + '</div></div>';
      html += '<div style="font-size:1.5rem;font-weight:900;opacity:.5">VS</div>';
      html += '<div class="side"><div class="pname">玩家 B</div><div class="sc" style="color:var(--player-b)">' +
        sum.players[1].score + '</div>';
      if (w === 1) html += '<div class="winner-tag">勝出</div>';
      html += '<div style="color:var(--muted);font-size:.85rem">正確 ' + sum.players[1].correct +
        ' / ' + sum.players[1].total + '</div></div></div>';
      if (w == null) html += '<p style="text-align:center;font-weight:700">平手！</p>';
      hero.innerHTML = html;
    } else {
      var acc = primary.total ? Math.round(primary.accuracy * 100) : 0;
      hero.innerHTML =
        '<div class="end-hero"><div class="big-score">' + primary.score + '</div><p>得分</p></div>' +
        '<div class="stats-bar">' +
        '<div class="stat"><div class="label">正確</div><div class="value">' + primary.correct + '</div></div>' +
        '<div class="stat"><div class="label">準確率</div><div class="value">' + acc + '%</div></div>' +
        '<div class="stat"><div class="label">用時</div><div class="value">' + formatTime(sum.timeUsed) + '</div></div>' +
        '</div>';
    }
  }

  function bind() {
    $$('[data-topic]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        SFX.click();
        state.topic = btn.getAttribute('data-topic');
        $$('[data-topic]').forEach(function (b) { b.classList.toggle('selected', b === btn); });
      });
    });
    $$('[data-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        SFX.click();
        state.mode = btn.getAttribute('data-mode');
        $$('[data-mode]').forEach(function (b) { b.classList.toggle('selected', b === btn); });
      });
    });
    $$('[data-diff]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        SFX.click();
        state.difficulty = btn.getAttribute('data-diff');
        $$('[data-diff]').forEach(function (b) { b.classList.toggle('selected', b === btn); });
      });
    });

    $('#btn-start').addEventListener('click', startGame);
    $('#btn-mute').addEventListener('click', function () {
      var m = !SFX.isMuted();
      SFX.setMuted(m);
      Store.update(function (d) { d.settings.muted = m; });
      $('#btn-mute').setAttribute('aria-pressed', m ? 'true' : 'false');
      $('#btn-mute').textContent = m ? '🔇 靜音' : '🔊 音效';
    });
    $('#btn-quit').addEventListener('click', quitToHome);
    var qvs = $('#btn-quit-vs');
    if (qvs) qvs.addEventListener('click', quitToHome);
    var nvs = $('#btn-vs-next');
    if (nvs) nvs.addEventListener('click', goNext);
    $('#btn-home').addEventListener('click', initHome);
    $('#btn-rematch').addEventListener('click', startGame);
    $('#btn-reset-progress').addEventListener('click', function () {
      if (confirm('確定清除所有本機進度？')) {
        localStorage.removeItem(Store.KEY);
        initHome();
      }
    });
    document.addEventListener('pointerdown', function once() {
      SFX.resume();
      document.removeEventListener('pointerdown', once);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bind();
    initHome();
  });
})();
