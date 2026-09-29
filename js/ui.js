/* ============================================================
 * 中国式家长 H5 — 界面层 (依赖 core.js 的 CP 与 data.js 的 DATA)
 * ============================================================ */
'use strict';
(function (global) {
const CP = global.CP;
const D = global.DATA;
const $ = s => document.querySelector(s);
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.innerHTML = x; return e; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

let ACTIVE = 'plan';
const RARE_CN = { 1: '普通', 2: '稀有', 3: '史诗', 4: '传说' };

/* ---------- 音效与背景音律系统 (WebAudio 原生免外部文件合成) ---------- */
class SoundManager {
  constructor() {
    this.ctx = null;
    const stored = (typeof localStorage !== 'undefined' && localStorage.getItem) ? localStorage.getItem('cph_audio_mode') : null;
    if (stored === 'all' || stored === 'sfx' || stored === 'mute') {
      this.mode = stored;
    } else {
      const oldMute = (typeof localStorage !== 'undefined' && localStorage.getItem) ? localStorage.getItem('cph_mute') : null;
      this.mode = oldMute === '1' ? 'mute' : 'all';
    }
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.bgmPlaying = false;
    this.updateBtn();
  }

  get muted() {
    return this.mode === 'mute';
  }

  init() {
    if (!this.ctx && typeof AudioContext !== 'undefined') {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch(e) {}
    }
  }

  setMode(mode) {
    if (mode !== 'all' && mode !== 'sfx' && mode !== 'mute') return;
    this.mode = mode;
    if (this.mode === 'all') {
      this.startBGM();
    } else {
      this.stopBGM();
    }
    if (typeof localStorage !== 'undefined' && localStorage.setItem) {
      localStorage.setItem('cph_audio_mode', this.mode);
      localStorage.setItem('cph_mute', this.mode === 'mute' ? '1' : '0');
    }
    this.updateBtn();
  }

  toggle() {
    if (this.mode === 'all') {
      this.setMode('sfx');
      this.playTone(440, 0.08, 'sine');
    } else if (this.mode === 'sfx') {
      this.setMode('mute');
    } else {
      this.setMode('all');
      this.playTone(523.25, 0.1, 'triangle');
    }
  }

  updateBtn() {
    let icon = '🔊';
    let title = '声音：音乐+音效 (点击切换为仅音效)';
    if (this.mode === 'sfx') {
      icon = '🎵';
      title = '声音：仅音效 (点击切换为静音)';
    } else if (this.mode === 'mute') {
      icon = '🔇';
      title = '声音：全局静音 (点击开启音乐+音效)';
    }

    if (typeof $ === 'function') {
      const btn = $('#sound-btn');
      if (btn) {
        btn.textContent = icon;
        btn.title = title;
      }
      const sBtn = $('#splash-sound-btn');
      if (sBtn) {
        sBtn.textContent = icon;
        sBtn.title = title;
      }
    }
  }

  playTone(freq, duration = 0.1, type = 'sine', volume = 0.12) {
    if (this.mode === 'mute') return;
    this.init();
    if (!this.ctx) return;
    try {
      const ctx = this.ctx;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch(e) {}
  }

  /* ---------- 中国古典五声音阶轻量 BGM 调度器 ---------- */
  startBGM() {
    if (this.mode !== 'all' || this.bgmTimer) return;
    this.init();
    if (!this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch(e) {}

    // 古典五声旋律（平沙落雁意境，含休止符 0）
    const melodySequence = [
      523.25, 587.33, 659.25, 523.25, 392.00, 440.00, 523.25, 0,
      659.25, 783.99, 880.00, 659.25, 587.33, 523.25, 440.00, 0,
      392.00, 523.25, 587.33, 659.25, 523.25, 440.00, 392.00, 0,
      440.00, 523.25, 659.25, 783.99, 880.00, 783.99, 659.25, 523.25
    ];
    const bassScale = [130.81, 196.00, 220.00, 196.00];

    this.bgmPlaying = true;
    this.bgmStep = 0;

    const playStep = () => {
      if (this.mode !== 'all' || !this.bgmPlaying || !this.ctx) return;
      try {
        const ctx = this.ctx;
        if (ctx.state === 'suspended') ctx.resume();

        const curPitch = melodySequence[this.bgmStep % melodySequence.length];
        if (curPitch > 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          const jitter = (Math.random() - 0.5) * 3;
          osc.frequency.setValueAtTime(curPitch + jitter, ctx.currentTime);
          gain.gain.setValueAtTime(0.025, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.46);
        }

        if (this.bgmStep % 4 === 0) {
          const bassPitch = bassScale[Math.floor(this.bgmStep / 4) % bassScale.length];
          const bOsc = ctx.createOscillator();
          const bGain = ctx.createGain();
          bOsc.type = 'sine';
          bOsc.frequency.setValueAtTime(bassPitch, ctx.currentTime);
          bGain.gain.setValueAtTime(0.02, ctx.currentTime);
          bGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
          bOsc.connect(bGain);
          bGain.connect(ctx.destination);
          bOsc.start();
          bOsc.stop(ctx.currentTime + 1.85);
        }

        this.bgmStep++;
      } catch(e) {}
    };

    this.bgmTimer = setInterval(playStep, 480);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  tryStartBGM() {
    if (this.mode === 'all' && !this.bgmTimer) {
      this.startBGM();
    }
  }

  click() {
    this.tryStartBGM();
    this.playTone(600, 0.04, 'sine', 0.1);
  }
  pop() {
    this.tryStartBGM();
    this.playTone(850, 0.06, 'triangle', 0.1);
  }
  coin() {
    this.tryStartBGM();
    this.playTone(987, 0.08, 'sine', 0.1);
    setTimeout(() => this.playTone(1318, 0.12, 'sine', 0.1), 60);
  }
  brain() {
    this.tryStartBGM();
    this.playTone(520, 0.06, 'sine', 0.1);
    setTimeout(() => this.playTone(1040, 0.09, 'sine', 0.1), 50);
  }
  win() {
    this.tryStartBGM();
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 0.16, 'triangle', 0.12), idx * 75);
    });
  }
  fail() {
    this.tryStartBGM();
    [400, 340, 280].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 0.12, 'sawtooth', 0.1), idx * 90);
    });
  }

  /* ---------- 高潮节点情绪音效群 (Round 4 Climax SFX) ---------- */
  // 1. 金榜题名 · 高考放榜吹打喜报 (快速五度和弦 C5-G5-C6-E6 辉煌共鸣)
  gaokaoBang() {
    this.tryStartBGM();
    const chords = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    chords.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 0.35, 'triangle', 0.15), idx * 80);
    });
  }

  // 2. 才艺选秀 · 冠军三灯全亮欢呼 (三阶亮灯 chime + 伪白噪声掌声脉冲)
  talentWin() {
    this.tryStartBGM();
    [659.25, 783.99, 1046.5].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 0.18, 'sine', 0.14), idx * 70);
    });
    setTimeout(() => {
      if (this.mode === 'mute' || !this.ctx) return;
      try {
        const ctx = this.ctx;
        if (ctx.state === 'suspended') ctx.resume();
        const bufferSize = ctx.sampleRate * 0.4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.15));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        noise.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
      } catch(e) {}
    }, 220);
  }

  // 3. 面子对决 · 弱点暴击重击 (低频锯齿波向下急剧扫频)
  faceCrit() {
    this.tryStartBGM();
    if (this.mode === 'mute') return;
    this.init();
    if (!this.ctx) return;
    try {
      const ctx = this.ctx;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch(e) {}
  }

  // 4. 压力过高濒临崩溃心跳警戒 (双击心跳 "咚-咚")
  stressPanic() {
    this.tryStartBGM();
    if (this.mode === 'mute') return;
    this.init();
    if (!this.ctx) return;
    try {
      const ctx = this.ctx;
      if (ctx.state === 'suspended') ctx.resume();
      [0, 0.16].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, ctx.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + delay + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.13);
      });
    } catch(e) {}
  }
}
const sound = new SoundManager();
if (typeof window !== 'undefined') {
  window.SoundManager = SoundManager;
  window.sound = sound;
}
if (typeof global !== 'undefined') {
  global.SoundManager = SoundManager;
  global.sound = sound;
}

/* ---------- 查找表 ---------- */
function course(id) { return D.courses.find(c => c.id === id); }
function play(id) { return D.plays.find(p => p.id === id); }
function payjob(id) { return D.payjobs.find(p => p.id === id); }
function beg(id) { return D.begs.find(b => b.id === id); }
function slotIcon(sl) {
  if (sl.kind === 'rest') return '💤';
  if (sl.kind === 'learn') { const c = course(sl.id); return c ? c.icon : '📘'; }
  if (sl.kind === 'play') { const p = play(sl.id); return p ? p.icon : '🎮'; }
  if (sl.kind === 'pay') { const p = payjob(sl.id); return p ? p.icon : '💼'; }
  if (sl.kind === 'beg') { const b = beg(sl.id); return b ? b.icon : '🧺'; }
  return '❓';
}
function slotName(sl) {
  if (sl.kind === 'rest') return '睡大觉';
  if (sl.kind === 'learn') { const c = course(sl.id); return c ? c.name : sl.id; }
  if (sl.kind === 'play') { const p = play(sl.id); return p ? p.name : sl.id; }
  if (sl.kind === 'pay') { const p = payjob(sl.id); return p ? p.name : sl.id; }
  if (sl.kind === 'beg') { const b = beg(sl.id); return b ? '要「' + b.n + '」' : sl.id; }
  return sl.id;
}

/* ---------- 屏幕流转控制器 (彻底解决 [hidden] 白屏问题) ---------- */
function showScreen(name) {
  const screens = {
    splash: $('#splash'),
    game: $('#game'),
    report: $('#report')
  };
  Object.keys(screens).forEach(k => {
    const el = screens[k];
    if (!el) return;
    if (k === name) {
      el.hidden = false;
      el.classList.remove('hidden');
      el.classList.add('active');
    } else {
      el.hidden = true;
      el.classList.add('hidden');
      el.classList.remove('active');
    }
  });
}

/* ---------- 顶栏 ---------- */
function renderTop() {
  const i = CP.info();
  if (!i) return;
  const genderIcon = i.gender === 'girl' ? '👧' : '👦';
  
  const elGen = $('#top-gen');
  if (elGen) {
    elGen.textContent = '第' + i.gen + '代 ' + genderIcon + i.name;
    const elTurn = $('#top-turn');
    if (elTurn) elTurn.textContent = '📅 回合' + i.turn + ' · ' + i.age + '岁 · ' + i.phase;
    const elFace = $('#top-face');
    if (elFace) elFace.textContent = i.face;
    const elAct = $('#top-act');
    if (elAct) elAct.textContent = i.act;
    const elMoney = $('#top-money');
    if (elMoney) elMoney.textContent = i.money;
    const elInsight = $('#top-insight');
    if (elInsight) elInsight.textContent = i.insight;
  } else {
    // 降级兜底兼容
    $('#topbar').innerHTML =
      '<span class="gen-tag">第' + i.gen + '代 ' + genderIcon + i.name + '</span>' +
      '<span class="chip">📅 回合' + i.turn + ' · ' + i.age + '岁 · ' + i.phase + '</span>' +
      '<span class="chip" title="面子">⭐面子<b>' + i.face + '</b></span>' +
      '<span class="chip" title="行动力">⚡行动<b>' + i.act + '</b></span>' +
      '<span class="chip" title="零花钱">💰零钱<b>' + i.money + '</b></span>' +
      '<span class="chip" title="悟性">💡悟性<b>' + i.insight + '</b></span>';
  }
  
  const a = i.attrs;
  const kv = [
    ['iq', '智商', '🟢'],
    ['eq', '情商', '❤️'],
    ['mem', '记忆', '🔵'],
    ['img', '想象', '🟣'],
    ['phy', '体魄', '🔴'],
    ['cha', '魅力', '✨']
  ];
  const satCls = i.sat >= 75 ? 'sat-high' : i.sat <= 30 ? 'sat-low' : '';
  const stressCls = i.stress >= 75 ? 'stress-high' : '';
  const shadowCls = i.shadow >= 60 ? 'shadow-high' : '';

  $('#status').innerHTML =
    kv.map(k => '<div class="stat"><div class="ico">' + k[2] + '</div><div class="val">' + (a[k[0]] || 0) + '</div><div class="lbl">' + k[1] + '</div></div>').join('') +
    '<div class="wall sat ' + satCls + '"><b>父母满意 ' + Math.min(100, Math.round(i.sat)) + '%</b><div class="bar"><i style="width:' + Math.min(100, Math.round(i.sat)) + '%"></i></div></div>' +
    '<div class="wall stress ' + stressCls + '"><b>压力值 ' + Math.min(100, Math.round(i.stress)) + '%</b><div class="bar"><i style="width:' + Math.min(100, Math.round(i.stress)) + '%"></i></div></div>' +
    '<div class="wall shadow ' + shadowCls + '"><b>心理阴影 ' + Math.min(100, Math.round(i.shadow)) + '%</b><div class="bar"><i style="width:' + Math.min(100, Math.round(i.shadow)) + '%"></i></div></div>';
}

/* ---------- tab 切换 ---------- */
function setTab(t) {
  ACTIVE = t;
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  sound.click();
  renderStage();
  if (typeof guide !== 'undefined' && guide && guide.isActive) {
    setTimeout(() => guide.updatePosition(), 60);
  }
}

/* ---------- 日程 ---------- */
function openWishModal() {
  const m = $('#modal');
  m.classList.add('show');
  m.dataset.customModal = 'wish';
  m.innerHTML = '';

  const closeWishModal = () => {
    m.onclick = null;
    delete m.dataset.customModal;
    m.classList.remove('show');
    m.innerHTML = '';
  };

  // 点击遮罩空白处直接关闭
  m.onclick = (e) => {
    if (e.target === m) {
      closeWishModal();
    }
  };

  const body = h('div', 'm-body');
  const wishPts = CP.wishPoints();
  const info = CP.info();

  body.appendChild(h('div', 'm-title', '🎁 向父母索取大件心愿'));
  body.appendChild(h('div', 'm-desc', '父母满意度 ≥ 80、阶段蜕变或考试名列前茅可积攒索取点数。\n家庭面子越高，父母越欣然准奏！\n<b>当前剩余索取次数: ' + wishPts + ' 次 · 家庭面子: ' + (info ? info.face : 0) + '</b>'));

  const grid = h('div', 'wish-grid');
  const begsList = (D && D.begs) || [];
  begsList.forEach(b => {
    const isDone = CP.state() && CP.state().flags && CP.state().flags['beg_' + b.id];
    const card = h('div', 'wish-card');
    const needFace = b.face || 0;
    const canFace = (info ? info.face : 0) >= needFace;
    const bonus = ((info ? info.sat : 0) >= 80 ? 0.15 : 0) + ((info ? info.face : 0) >= needFace * 1.5 ? 0.1 : 0);
    const prob = Math.round(clamp((b.w || 0.4) + bonus, 0.25, 0.95) * 100);

    card.innerHTML =
      '<span class="wish-ico">' + b.icon + '</span>' +
      '<div class="wish-info">' +
        '<div class="wish-name">' + b.n + ' ' + (isDone ? '✅' : '') + '</div>' +
        '<div class="wish-sub">' + b.desc + '</div>' +
        '<div class="wish-sub" style="color:var(--gold-main);margin-top:2px">' + niceEff(b.eff) + ' · 需面子: ' + needFace + ' · 成功率: ' + prob + '%</div>' +
      '</div>';

    const btn = h('button', 'btn wish-btn');
    if (isDone) {
      btn.textContent = '已达成';
      btn.disabled = true;
      btn.className += ' ghost';
    } else if (wishPts < 1) {
      btn.textContent = '暂无次数';
      btn.disabled = true;
      btn.className += ' ghost';
      btn.title = '当前回合暂无索取次数，推进到阶段蜕变或保持满意度积攒点数';
    } else if (!canFace) {
      btn.textContent = '面子不足';
      btn.disabled = true;
      btn.className += ' ghost';
      btn.title = '家庭面子需达到 ' + needFace;
    } else {
      btn.textContent = '软磨硬泡索取';
      btn.onclick = (e) => {
        e.stopPropagation();
        const res = CP.begWish(b.id);
        if (res.success) {
          sound.win();
        } else {
          sound.fail();
        }
        renderTop();
        renderStage();
        openWishModal();
      };
    }
    card.appendChild(btn);
    grid.appendChild(card);
  });

  body.appendChild(grid);

  const closeBtn = h('button', 'btn secondary plain', '关闭');
  closeBtn.style.marginTop = '14px';
  closeBtn.style.width = '100%';
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    closeWishModal();
  };
  body.appendChild(closeBtn);

  m.appendChild(body);
}

function renderPlan() {
  const st = $('#stage');
  st.innerHTML = '';
  const wrap = h('div');

  const titleRow = h('div', 'flex-between');
  titleRow.appendChild(h('h3', '', '📅 今日安排 (挑选6件事)'));
  const quickActions = h('div', 'slot-actions');
  const canRepeat = CP.canRepeatLastSlots && CP.canRepeatLastSlots();
  const repeatBtn = h('button', 'mini-btn' + (canRepeat ? ' repeat' : ' disabled'), '🔁 延续');
  repeatBtn.title = canRepeat ? '一键复用上一回合安排的6项学习与娱乐日程' : '暂无可复用的上一回合记录';
  repeatBtn.onclick = () => {
    if (!CP.canRepeatLastSlots || !CP.canRepeatLastSlots()) {
      toast('暂无可延续的上一回合日程记录');
      return;
    }
    sound.pop();
    const res = CP.repeatLastSlots();
    if (res.ok) {
      if (res.skipped > 0) {
        toast(`🔁 已成功复用 ${res.filled} 项日程，其中 ${res.skipped} 项因体力/金钱不足跳过`);
      } else {
        toast(`🔁 已成功延续上一回合全套日程安排！`);
      }
      render();
    } else {
      toast(res.error || '延续日程失败');
    }
  };
  const autoBtn = h('button', 'mini-btn', '⚡ 排满');
  autoBtn.onclick = () => { sound.pop(); CP.autoFillSlots(); render(); };
  const clearBtn = h('button', 'mini-btn ghost', '🧹 清空');
  clearBtn.onclick = () => { sound.click(); CP.clearSlots(); render(); };
  quickActions.appendChild(repeatBtn);
  quickActions.appendChild(autoBtn);
  quickActions.appendChild(clearBtn);
  titleRow.appendChild(quickActions);
  wrap.appendChild(titleRow);

  const wishPts = CP.wishPoints();
  const wishBanner = h('div', 'wish-header-banner');
  wishBanner.innerHTML =
    '<div class="wish-banner-left"><span>🎁 向父母索取大件心愿</span>' +
    (wishPts > 0 ? '<span class="wish-count-pill">' + wishPts + ' 次机会</span>' : '<span style="font-size:11px;color:#8d6e63">(暂无机会)</span>') +
    '</div><span class="small" style="color:#d48806">查看心愿清单 ➔</span>';
  wishBanner.onclick = () => {
    sound.click();
    openWishModal();
  };
  wrap.appendChild(wishBanner);

  // 槽位板
  const board = h('div', 'plan-board');
  board.id = 'slotBoard';
  const slots = CP.slots();
  slots.forEach((sl, i) => {
    const d = h('div', 'slot' + (sl ? ' filled' : ''));
    if (sl) {
      d.innerHTML = '<div class="s-ico">' + slotIcon(sl) + '</div><div class="s-name">' + slotName(sl) + '</div><div class="s-remove" title="撤销此项">✕</div>';
      d.onclick = () => {
        sound.click();
        CP.removeSlot(i);
        render();
      };
    } else {
      d.innerHTML = '<div class="s-ico">🕐</div><div class="s-name">第' + (i + 1) + '节</div>';
    }
    board.appendChild(d);
  });
  wrap.appendChild(board);

  const done = slots.every(Boolean);
  if (done) {
    const ok = h('button', 'btn big pulse', '✅ 过完这一天 (推进回合)');
    ok.style.margin = '10px auto 14px';
    ok.style.display = 'block';
    ok.onclick = () => {
      sound.win();
      CP.endTurn();
      renderAll();
    };
    wrap.appendChild(ok);
  } else {
    wrap.appendChild(h('div', 'hint', '💡 点击已选格子可撤销。填满 6 个格子后可结束回合。注意平衡学习与娱乐！'));
  }

  // 1) 研习新技能板块 (原版核心机制: 挖脑洞得悟性 -> 悟性研习新课程 -> 日程自由排课)
  const unlearned = CP.learnList ? CP.learnList() : [];
  const info = CP.info();
  if (unlearned.length) {
    const learnSection = h('div', 'learn-section');
    learnSection.innerHTML = '<div class="pool-cat flex-between"><span>💡 研习新技能 (消耗悟性)</span><span class="chip" style="font-size:11px">可用悟性: <b>' + (info ? info.insight : 0) + '💡</b></span></div>';
    const lgrid = h('div', 'learn-grid');
    unlearned.forEach(uc => {
      const card = h('div', 'learn-card' + (uc.can ? '' : ' disabled'));
      card.innerHTML =
        '<div class="lc-header"><span class="lc-ico">' + uc.icon + '</span><span class="lc-name">' + uc.name + '</span><span class="lc-cost">' + uc.cost + '💡</span></div>' +
        '<div class="lc-desc">' + niceEff(uc.attr) + ' <span class="lc-sub">(' + uc.mainAttr + '折扣)</span></div>';
      if (uc.can) {
        card.onclick = () => {
          sound.coin();
          if (CP.learnCourse(uc.id)) {
            render();
          }
        };
      }
      lgrid.appendChild(card);
    });
    learnSection.appendChild(lgrid);
    wrap.appendChild(learnSection);
  }

  // 2) 行动池 (日程安排: 所有已掌握课程与娱乐均可自由、重复安排至 6 个格子中)
  const pl = CP.pool();
  const cats = { '学习 📘 (已掌握可重复排)': [], '娱乐 🎮': [], '打工 💼': [], '索取 🧺': [], '休息 💤': [] };
  pl.forEach(pi => {
    if (pi.tone === 'course') cats['学习 📘 (已掌握可重复排)'].push(pi);
    else if (pi.tone === 'job') cats['打工 💼'].push(pi);
    else if (pi.tone === 'beg') cats['索取 🧺'].push(pi);
    else if (pi.tone === 'rest') cats['休息 💤'].push(pi);
    else cats['娱乐 🎮'].push(pi);
  });

  wrap.appendChild(h('div', 'pool-cat', '📋 今日可选安排 (点击填入上方格子，可重复安排)'));

  Object.keys(cats).forEach(cn => {
    if (!cats[cn].length) return;
    wrap.appendChild(h('div', 'pool-subcat', cn));
    const list = h('div', '');
    cats[cn].forEach(pi => {
      const li = h('div', 'pool-item' + (pi.locked ? ' disabled' : ''));
      li.innerHTML = '<span class="pi-ico">' + pi.icon + '</span>' +
        '<span class="pi-info"><span class="pi-name">' + pi.name + '</span><br><span class="pi-desc">' + pi.desc + '</span></span>' +
        '<span class="pi-cost">' + (pi.money ? pi.money + '¥ ' : '') + (pi.extra ? '<span class="tag-badge">' + pi.extra + '</span> ' : '') + (pi.act ? pi.act + '⚡' : '') + '</span>';
      if (!pi.locked) {
        li.onclick = () => {
          sound.pop();
          if (CP.addSlot(pi)) render();
        };
      }
      list.appendChild(li);
    });
    wrap.appendChild(list);
  });
  st.appendChild(wrap);
}

/* ---------- 脑洞 ---------- */
let brainShaking = false;
let lastExplodedIdx = -1;
let lastChainIndices = [];

function renderBrain() {
  const st = $('#stage');
  st.innerHTML = '';
  const b = CP.brain.info();
  const wrap = h('div', 'brain-container');

  // 构建 HUD 看板
  const hud = h('div', 'brain-hud');

  // 1. 顶层状态栏：层级徽章 + 行动力雷达
  const topRow = h('div', 'brain-hud-top flex-between');
  const layerBadge = h('div', 'brain-layer-badge layer-' + b.layer, '🧠 脑域深潜 · 第 ' + b.layer + ' / ' + (b.maxLayer || 4) + ' 层');
  const actRadar = h('div', 'brain-act-radar' + (b.act < 2 ? ' exhausted' : ''),
    b.act < 2 ? '⚡ 行动力耗尽 (需2⚡)' : '⚡ 行动力 ' + b.act + ' (可探 ' + b.maxExplores + ' 次)'
  );
  topRow.appendChild(layerBadge);
  topRow.appendChild(actRadar);
  hud.appendChild(topRow);

  // 2. 探索进度条 (流光竹管样式)
  const progTrack = h('div', 'brain-prog-track');
  const progFill = h('div', 'brain-prog-fill' + (b.percent >= 100 ? ' full' : ''));
  progFill.style.width = Math.min(100, Math.max(0, b.percent)) + '%';
  progTrack.appendChild(progFill);
  hud.appendChild(progTrack);

  // 3. 统计标签
  const statsRow = h('div', 'brain-hud-stats flex-between');
  const progText = h('span', 'brain-stat-item', '已探明 ' + b.open + ' / ' + b.total + ' 格 (' + b.percent + '%)');
  const tagsWrap = h('div', 'brain-radar-tags');
  tagsWrap.innerHTML = '<span class="brain-mini-tag bulb">💡 悟性 ' + b.bulbs + '</span>' +
                       '<span class="brain-mini-tag bomb">💥 爆破 ' + b.bombs + '</span>' +
                       '<span class="brain-mini-tag key">🗝️ 钥匙 ' + b.keys + '</span>';
  statsRow.appendChild(progText);
  statsRow.appendChild(tagsWrap);
  hud.appendChild(statsRow);

  wrap.appendChild(hud);

  const grid = h('div', brainShaking ? 'brain-shake' : '');
  grid.id = 'brain-grid';
  if (brainShaking) {
    setTimeout(() => {
      if (grid) grid.classList.remove('brain-shake');
      brainShaking = false;
      lastExplodedIdx = -1;
      lastChainIndices = [];
    }, 450);
  }
  CP.brain.grid().forEach((c, i) => {
    let extraCls = '';
    if (i === lastExplodedIdx) extraCls = ' bomb-burst';
    else if (lastChainIndices.indexOf(i) >= 0) extraCls = ' chain-burst';
    else if (!c.open && b.act < 2) extraCls = ' cell-exhausted';

    const cell = h('div', 'cell' + (c.open ? ' open' : '') + extraCls);
    cell.textContent = c.open ? ({ bulb: '💡', attr: '🔮', bolt: '⚡', bomb: '💥', skull: '💀', gold: '💰', key: '🗝️', duck: '🦆' })[c.t] : '?';
    cell.onclick = () => {
      if (!c.open && b.act < 2) {
        sound.click();
        cell.classList.remove('shake-exhausted');
        void cell.offsetWidth;
        cell.classList.add('shake-exhausted');
        toast('⚡ 行动力不足 (需2⚡)！可在日程中安排娱乐/小憩，或在小卖部购买能量饮料补充体力~');
        return;
      }
      const wasBomb = !c.open && c.t === 'bomb';
      const r = CP.brain.rev(i);
      if (r != null) {
        sound.brain();
        toast(r);
        if (wasBomb || (typeof r === 'string' && (r.indexOf('💥') >= 0 || r.indexOf('炸弹') >= 0))) {
          if (sound.win) sound.win();
          brainShaking = true;
          lastExplodedIdx = i;
          const r0 = Math.floor(i / 6), c0 = i % 6;
          lastChainIndices = [];
          for (let j = 0; j < 36; j++) {
            if (j === i) continue;
            const rj = Math.floor(j / 6), cj = j % 6;
            if (Math.abs(rj - r0) <= 1 && Math.abs(cj - c0) <= 1) {
              lastChainIndices.push(j);
            }
          }
        }
      }
      render();
    };
    grid.appendChild(cell);
  });
  wrap.appendChild(grid);
  if (b.layer >= (b.maxLayer || 4) && b.open >= b.total) {
    wrap.appendChild(h('div', 'hint', '🚧 当前回合脑洞已挖通至最深处（施工中），推进到下个回合将刷新全新一轮脑洞！'));
  } else {
    wrap.appendChild(h('div', 'hint', '📌 优先翻开💡灯泡攒悟性；🗝️钥匙能直通下一层并回复 50 行动力；💥炸弹连环爆破周边格子！每回合都会刷新全新脑洞！'));
  }
  st.appendChild(wrap);
}

/* ---------- 同学 ---------- */
function renderSocial() {
  const st = $('#stage');
  st.innerHTML = '';
  const wrap = h('div');
  wrap.appendChild(h('div', 'pool-cat', '👥 同学往来 (初中及以上开放深度互动)'));
  const list = CP.social();
  if (!list.length) {
    wrap.appendChild(h('div', 'hint', '当前阶段大家都在忙着上课，还没有能深入互动的同学。'));
  } else {
    list.forEach(n => {
      const d = h('div', 'card npc-card');
      const aff = n.aff || 0;
      const hearts = aff >= 120 ? '💖💖💖💖💖' : aff >= 81 ? '💖💖💖💖🤍' : aff >= 51 ? '💖💖💖🤍🤍' : aff >= 21 ? '💛💛🤍🤍🤍' : '🤍🤍🤍🤍🤍';
      const bondHeader = n.bondTitle ? ('【' + n.bondTitle + '】' + n.bondDesc) : (aff >= 120 ? '💖 青梅竹马 · 独一无二' : aff >= 81 ? '💕 莫逆之交 · 倾心以待' : aff >= 51 ? '💌 志趣相投 · 放学同行' : aff >= 21 ? '🤝 同窗好友 · 课间互动' : '点头之交');
      const likeTags = (n.like && n.like.length) ? n.like.join('、') : '精美礼物';

      d.innerHTML =
        '<div style="display:flex;align-items:flex-start;gap:10px">' +
          '<span class="av">' + n.icon + '</span>' +
          '<div class="npc-body" style="flex:1">' +
            '<div class="flex-between"><span class="nm">' + n.name + '</span><span class="af">' + hearts + ' ' + aff + '/150</span></div>' +
            '<div class="small" style="color:var(--gold-main);margin:2px 0">' + bondHeader + '</div>' +
            '<div class="small">' + n.intro + '</div>' +
            '<div class="small" style="color:var(--ink-secondary);margin-top:2px">🎁 喜好: <b>' + likeTags + '</b></div>' +
          '</div>' +
        '</div>' +
        '<div class="btns" style="margin-top:10px">' +
          '<button class="sub-btn" data-c="' + n.id + '">💬 课间闲聊 (-3⚡)</button>' +
          '<button class="sub-btn" data-g="' + n.id + '">🎁 赠送心意礼物...</button>' +
        '</div>' +
        '<div class="gift-drawer hidden" id="gift-drawer-' + n.id + '">' +
          '<div class="gift-drawer-title">从随身包或小卖部挑选一份心意礼物：</div>' +
          '<div class="gift-items-wrap" id="gift-items-' + n.id + '"></div>' +
        '</div>';

      d.querySelector('[data-c]').onclick = () => {
        sound.click();
        const g = CP.chat(n.id);
        if (g != null) toast('和 ' + n.name + ' 聊得很投机，好感+' + g);
        render();
      };

      const giftDrawer = d.querySelector('#gift-drawer-' + n.id);
      const giftItemsWrap = d.querySelector('#gift-items-' + n.id);
      d.querySelector('[data-g]').onclick = () => {
        sound.click();
        giftDrawer.classList.toggle('hidden');
        if (!giftDrawer.classList.contains('hidden') && !giftItemsWrap.children.length) {
          const giftCandidates = [
            { id: 'st-biscuit', n: '妮妮\'s饼干', icon: '🍪', price: 15 },
            { id: 'st-cai',     n: '彩笔',       icon: '🖍️', price: 25 },
            { id: 'st-ice',     n: '西瓜冰',     icon: '🍉', price: 10 },
            { id: 'st-candy',   n: '棒棒糖',     icon: '🍭', price: 5 },
            { id: 'st-latiao',  n: '辣条',       icon: '🌶️', price: 8 },
            { id: 'st-tea',     n: '奶茶兑换券', icon: '🧋', price: 20 },
            { id: 'st-toy',     n: '毛绒玩具',   icon: '🧸', price: 35 },
            { id: 'st-card',    n: '经典游戏卡', icon: '🕹️', price: 25 },
            { id: 'st-shoes',   n: '重点鞋',     icon: '👟', price: 80 },
            { id: 'st-juice',   n: '运动饮料',   icon: '🧃', price: 15 },
            { id: 'st-bk',      n: '三年模拟',   icon: '📙', price: 70 },
            { id: 'st-book',    n: '课外书',     icon: '📖', price: 30 },
            { id: 'st-glass',   n: '单筒望远镜', icon: '🔭', price: 50 },
          ];
          const bag = CP.bag();
          giftCandidates.forEach(gc => {
            const isFav = n.like && n.like.some(lk => gc.n.indexOf(lk) >= 0 || lk.indexOf(gc.n) >= 0);
            const inBagCount = bag[gc.id] || 0;
            const btn = h('button', 'gift-pill-btn' + (isFav ? ' fav' : ''));
            btn.innerHTML = gc.icon + ' ' + gc.n + (isFav ? ' ✨' : '') + '<span style="font-size:9px;opacity:0.8">(' + (inBagCount > 0 ? '背包x' + inBagCount : gc.price + '¥') + ')</span>';
            btn.onclick = () => {
              const res = CP.giftItem(n.id, gc.id);
              if (res) {
                sound.win();
                render();
              }
            };
            giftItemsWrap.appendChild(btn);
          });
        }
      };

      wrap.appendChild(d);
    });
  }
  wrap.appendChild(h('div', 'hint', '投其所好可获得喜好暴击与专属台词！好感达到 60 以上，大学成家阶段将有机会携手一生，注入优异的家族基因！'));
  st.appendChild(wrap);
}

/* ---------- 商店 ---------- */
function renderShop() {
  const st = $('#stage');
  st.innerHTML = '';
  const wrap = h('div');
  wrap.appendChild(h('div', 'pool-cat', '🛍️ 校园小卖部 / 百货商场'));
  const list = h('div');
  list.id = 'shop-list';
  CP.shop().forEach(it => {
    const d = h('div', 'shop-item' + (it.can ? '' : ' disabled'));
    d.innerHTML = '<span class="s-ico">' + it.icon + '</span>' +
      '<span class="s-info"><span class="s-name">' + it.n + '</span>' +
      (it.count > 0 ? ' <span class="chip" style="font-size:10px">包内x' + it.count + '</span>' : '') +
      '<br><span class="s-desc">' + (it.eff ? niceEff(it.eff) : '') + '</span></span>' +
      '<span class="s-price">' + it.price + '¥</span>';
    if (it.can) {
      d.onclick = () => {
        sound.coin();
        if (CP.buy(it.id)) {
          toast('成功购买「' + it.n + '」');
          render();
        }
      };
    }
    list.appendChild(d);
  });
  wrap.appendChild(list);
  wrap.appendChild(h('div', 'hint', '小卖部购买的文具、零食与玩具均可存入随身包，用于课间送给同学增进好感！'));
  st.appendChild(wrap);
}

/* ---------- 图鉴与家族百年谱系 ---------- */
let atlasTab = 'talents';
function setAtlasTab(tab) {
  atlasTab = tab;
}
function renderAtlas() {
  const st = $('#stage');
  st.innerHTML = '';
  const wrap = h('div');
  const a = CP.atlas();
  const fam = CP.fam();
  const tierNames = ['白手起家', '温饱家庭', '小康之家', '中产家庭', '高收入阶层', '社会领军精英'];

  wrap.appendChild(h('div', 'card fam-stat-card', '<b>📜 家族百年档案簿</b><br>' +
    '<div class="fam-details">' +
    '<span>已结算世代: 第 <b>' + (fam.g || 0) + '</b> 代</span><br>' +
    '<span>家族特长图鉴: <b>' + (fam.atlas ? fam.atlas.length : 0) + '</b> 个</span><br>' +
    '<span>家族底蕴加成: 先天属性 +<b>' + (fam.talent || 0) + '</b></span><br>' +
    '<span>当前门第阶层: <b>' + (tierNames[fam.tier || 0] || '工薪') + '</b></span>' +
    '</div>'));

  // 三大子选项卡
  const subTabs = h('div', 'atlas-subtabs');
  const tabsConfig = [
    { id: 'talents', label: '🌟 家族特长 (' + a.total + ')' },
    { id: 'tree', label: '🌳 百年世代谱系' },
    { id: 'achievements', label: '🏆 传家荣誉殿堂' }
  ];
  tabsConfig.forEach(tc => {
    const tabBtn = h('button', 'atlas-stab' + (atlasTab === tc.id ? ' active' : ''), tc.label);
    tabBtn.onclick = () => {
      sound.click();
      atlasTab = tc.id;
      renderAtlas();
    };
    subTabs.appendChild(tabBtn);
  });
  wrap.appendChild(subTabs);

  if (atlasTab === 'talents') {
    if (!a.list.length) {
      wrap.appendChild(h('div', 'hint', '本代尚未觉醒特长。在日程中深入学习、体验娱乐、或参加特长选秀，均有机会领悟特长！'));
    } else {
      const grid = h('div');
      grid.className = 'grid-atlas';
      const RCLS = { 1: 'rar1', 2: 'rar2', 3: 'rar3', 4: 'rar4' };
      a.list.forEach(t => {
        grid.appendChild(h('div', 'tal-item', '<div class="t-ico">' + t.icon + '</div><div class="t-name ' + RCLS[t.r] + '">' + t.n + '</div><div class="small">' + RARE_CN[t.r] + '</div>'));
      });
      wrap.appendChild(grid);
    }
  } else if (atlasTab === 'tree') {
    const history = CP.familyHistory();
    const curState = CP.state();
    const totalGens = Math.max((fam.g || 0), history.length + (curState ? 1 : 0), 1);
    const tierName = tierNames[fam.tier || 0] || '工薪之家';
    const talentsCount = (fam.atlas ? fam.atlas.length : 0);
    const talentBonus = (fam.talent || 0);

    // 1. 宗族总览牌匾 (Ancestral Hall Banner)
    const banner = h('div', 'ancestral-hall-banner');
    banner.innerHTML =
      '<div class="hall-plaque">🏛️ 百年氏族 · 宗祠总谱画卷</div>' +
      '<div class="hall-stats-grid">' +
        '<div class="hall-stat-item"><span class="h-lbl">绵延世系</span><span class="h-val">第 <b>' + totalGens + '</b> 代</span></div>' +
        '<div class="hall-stat-item"><span class="h-lbl">最高门第</span><span class="h-val"><b>' + tierName + '</b></span></div>' +
        '<div class="hall-stat-item"><span class="h-lbl">传家特长</span><span class="h-val"><b>' + talentsCount + '</b> 项</span></div>' +
        '<div class="hall-stat-item"><span class="h-lbl">先天底蕴</span><span class="h-val"><b>+' + talentBonus + '</b></span></div>' +
      '</div>';
    wrap.appendChild(banner);

    // 2. 树状代际画卷 (Genealogy Tree)
    const treeContainer = h('div', 'tree-scroll-container');
    const tree = h('div', 'genealogy-tree');

    if (history.length === 0 && !curState) {
      tree.appendChild(h('div', 'hint', '暂无已结算世代，本代人生圆满结束后，生平功绩将自动镌刻于此家族树中！'));
    } else {
      // 历代先祖节点
      history.forEach((anc) => {
        const isFounder = anc.gen === 1;
        const nodeWrap = h('div', 'tree-node-wrap');
        const dot = h('div', 'tree-node-dot' + (isFounder ? ' founder' : ''));
        nodeWrap.appendChild(dot);

        const card = h('div', 'tree-card' + (isFounder ? ' founder' : ''));
        const genLabel = isFounder ? '👑 开基始祖' : ('📜 第 ' + anc.gen + ' 代宗亲');
        const genderIcon = anc.gender === 'girl' ? '👧' : '👦';
        const spouseTxt = (anc.spouse && anc.spouse !== '单身')
          ? ('💑 联姻配偶: <b>' + anc.spouse + '</b> (' + (anc.spouseTag || '良缘') + ')')
          : '💑 终身求索 · 志在四方 (单身)';

        card.innerHTML =
          '<div class="tree-card-top">' +
            '<span class="tree-gen-tag">' + genLabel + '</span>' +
            '<span class="tree-person-name">' + genderIcon + ' ' + anc.name + '</span>' +
            '<span class="tree-rating-stamp">' + anc.rating + ' 级 · ' + anc.score + '分</span>' +
          '</div>' +
          '<div class="tree-badges-row">' +
            '<span class="tree-badge-chip">💼 官职: <b>' + (anc.jobIcon || '🛋️') + ' ' + anc.job + '</b></span>' +
            '<span class="tree-badge-chip">🎓 高考: <b>' + (anc.gk ? anc.gk + ' 分' : '保送') + '</b></span>' +
            '<span class="tree-badge-chip">✨ 特长: <b>' + (anc.talentsCount || 0) + ' 项</b></span>' +
          '</div>' +
          '<div class="tree-spouse-box">' + spouseTxt + '</div>' +
          '<div class="tree-hl-box">🌟 <b>生平纪事：</b>' + (anc.highlight || '精彩的一生') + '</div>';

        nodeWrap.appendChild(card);
        tree.appendChild(nodeWrap);
      });

      // 当前在世苗裔节点 (Living Scion)
      if (curState) {
        const curGen = curState.gen || (history.length + 1);
        const nodeWrap = h('div', 'tree-node-wrap');
        const dot = h('div', 'tree-node-dot current');
        nodeWrap.appendChild(dot);

        const card = h('div', 'tree-card current');
        const genderIcon = curState.gender === 'girl' ? '👧' : '👦';
        card.innerHTML =
          '<div class="tree-card-top">' +
            '<span class="tree-gen-tag">🌱 第 ' + curGen + ' 代在世苗裔</span>' +
            '<span class="tree-person-name">' + genderIcon + ' ' + curState.name + '</span>' +
            '<span class="tree-rating-stamp" style="background:#ecfdf5;color:#059669;border-color:#6ee7b7">正在书写生平…</span>' +
          '</div>' +
          '<div class="tree-badges-row">' +
            '<span class="tree-badge-chip">📍 阶段: <b>' + ((CP.info() && CP.info().phase) || '成长中') + '</b></span>' +
            '<span class="tree-badge-chip">⚡ 行动力: <b>' + curState.act + '</b></span>' +
            '<span class="tree-badge-chip">💰 积蓄: <b>' + curState.money + ' 元</b></span>' +
            '<span class="tree-badge-chip">✨ 觉醒特长: <b>' + (curState.talents ? curState.talents.length : 0) + ' 项</b></span>' +
          '</div>' +
          '<div class="tree-hl-box" style="border-left-color:#10b981;background:#f0fdf4">' +
            '🚀 <b>当代寄语：</b>承袭先祖百年积淀与智慧，书写属于本代的辉煌篇章！' +
          '</div>';

        nodeWrap.appendChild(card);
        tree.appendChild(nodeWrap);
      }
    }

    treeContainer.appendChild(tree);
    wrap.appendChild(treeContainer);
  } else if (atlasTab === 'achievements') {
    const achs = CP.achievements();
    const unlocked = (fam && fam.achievements) || [];
    const achGrid = h('div', 'ach-grid');
    achs.forEach(ac => {
      const isUn = unlocked.indexOf(ac.id) >= 0;
      const acCard = h('div', 'ach-card' + (isUn ? ' unlocked' : ''));
      acCard.innerHTML =
        '<span class="ach-ico">' + ac.icon + '</span>' +
        '<div class="ach-info">' +
          '<div class="ach-name">' + ac.n + '</div>' +
          '<div class="ach-desc">' + ac.desc + '</div>' +
          '<div class="ach-perk">庇佑: ' + ac.perk + '</div>' +
        '</div>' +
        '<span class="ach-status">' + (isUn ? '✨ 已达成' : '🔒 未解锁') + '</span>';
      achGrid.appendChild(acCard);
    });
    wrap.appendChild(achGrid);
  }

  wrap.appendChild(h('div', 'pool-cat', ''));
  const rb = h('button', 'btn small plain', '🧹 重置家族 (清空全部存档与图鉴)');
  rb.onclick = () => {
    sound.fail();
    if (confirm('确定要重置整个家族档案吗？所有世代记录与图鉴积累都将归零！')) {
      CP.restartLineage();
      renderAll();
    }
  };
  wrap.appendChild(rb);
  st.appendChild(wrap);
}

/* ---------- 渲染调度 ---------- */
function renderStage() {
  if (!CP.state()) return;
  if (ACTIVE === 'plan') renderPlan();
  else if (ACTIVE === 'brain') renderBrain();
  else if (ACTIVE === 'social') renderSocial();
  else if (ACTIVE === 'shop') renderShop();
  else if (ACTIVE === 'atlas') renderAtlas();
  if (typeof guide !== 'undefined' && guide && guide.isActive) {
    setTimeout(() => guide.updatePosition(), 60);
  }
}

function renderToasts() {
  const box = $('#toasts');
  if (!box) return;
  const newToasts = CP.flushToasts ? CP.flushToasts() : [];
  if (!newToasts.length) return;

  newToasts.forEach(t => {
    const d = h('div', 'toast', t);
    d.title = '点击关闭';
    d.onclick = () => d.remove();
    box.appendChild(d);
    while (box.children.length > 4) {
      box.removeChild(box.firstChild);
    }
    setTimeout(() => {
      d.classList.add('out');
      setTimeout(() => d.remove(), 400);
    }, 2200);
  });
}

function toast(m) {
  if (!m) return;
  if (CP.toast) {
    CP.toast(m);
  } else {
    const s = CP.state();
    if (s) {
      if (!s.toasts) s.toasts = [];
      s.toasts.push(m);
    }
  }
  renderToasts();
}

function niceEff(e) {
  const p = [];
  if (e.insight) p.push('悟性+' + e.insight);
  if (e.act) p.push('行动+' + e.act);
  if (e.stress) p.push('压力' + (e.stress > 0 ? '+' : '') + e.stress);
  if (e.sat) p.push('满意' + (e.sat > 0 ? '+' : '') + e.sat);
  [['iq', '智商'], ['eq', '情商'], ['mem', '记忆'], ['img', '想象'], ['phy', '体魄'], ['cha', '魅力']].forEach(k => {
    if (e[k[0]]) p.push(k[1] + '+' + e[k[0]]);
  });
  return p.join(' ');
}

/* ---------- 弹窗系统 ---------- */
function renderModal() {
  const m = $('#modal');
  const pend = CP.pending();
  if (m.dataset.customModal) {
    if (!pend.length) return;
    delete m.dataset.customModal;
  }
  // 系统模态框强制解绑点击遮罩关闭，防止误触导致重要系统交互（高考/竞选/选秀）中断卡死
  m.onclick = null;
  if (!CP.state() || !pend.length) {
    m.classList.remove('show');
    m.innerHTML = '';
    return;
  }
  const p = pend[0];

  // 针对世代终章 endgen，展示专属世代战报页面
  if (p.type === 'endgen') {
    m.classList.remove('show');
    m.innerHTML = '';
    showReport(p);
    return;
  }

  // 针对阶段蜕变与成长画卷，展示专属阶段结算提示
  if (p.type === 'phase_transition') {
    renderPhaseTransition(p, m);
    return;
  }

  // 针对过年收红包推拉小游戏
  if (p.type === 'hongbao_duel' || p.type === 'mini_hb') {
    renderHongbaoModal(p, m);
    return;
  }

  // 针对面子对决回合制战斗
  if (p.type === 'face_duel') {
    renderFaceDuelModal(p, m);
    return;
  }

  // 针对高考专业志愿填报
  if (p.type === 'gaokao_apply') {
    renderGaokaoApplyModal(p, m);
    return;
  }

  // 针对特长才艺选秀大会舞台与结算
  if (p.type === 'show') {
    renderTalentShowModal(p, m);
    return;
  }
  if (p.type === 'showr') {
    renderTalentShowResultModal(p, m);
    return;
  }

  // 针对班干部三向竞选演说博弈台
  if (p.type === 'election') {
    renderElectionModal(p, m);
    return;
  }

  // 针对终局求婚与长辈相亲角舞台
  if (p.type === 'marry') {
    renderMarryModal(p, m);
    return;
  }

  // 针对职场期年中绩效考核与晋升答辩
  if (p.type === 'promotion') {
    renderPromotionModal(p, m);
    return;
  }

  m.classList.add('show');
  m.innerHTML = '';
  const body = h('div', 'm-body');
  body.appendChild(h('div', 'm-title', p.iconText || (p.title || '人生事件')));
  if (p.body) body.appendChild(h('div', 'm-desc', p.body.replace(/\n/g, '<br>')));

  let opts = p.opts || [];
  if (!opts.length) {
    opts = [p.type === 'show' ? '🎤 登台一展风采' : p.type === 'collapse' ? '重新振作' : '明白了'];
  }
  opts.forEach((o, i) => {
    const label = (typeof o === 'string') ? o : o.label;
    const sub = (o && typeof o === 'object' && o.sub) ? o.sub : '';
    const btn = h('button', 'm-opt');
    btn.innerHTML = '<span class="st-t">' + label + '</span>' + (sub ? '<span class="mo-e">' + sub + '</span>' : '');
    btn.onclick = () => {
      sound.click();
      const r = CP.resolve(i);
      if (r) toast(r);
      renderAll();
    };
    body.appendChild(btn);
  });
  m.appendChild(body);
}

/* ---------- 阶段成长蜕变结算画卷 ---------- */
function renderPhaseTransition(p, m) {
  m.classList.add('show');
  m.innerHTML = '';
  const trans = p.trans || {};
  const body = h('div', 'm-body phase-trans-modal');
  const PHASE_SEQ = ['baby', 'kinder', 'pri', 'junior', 'senior', 'college', 'work', 'home'];
  const phaseIdx = Math.max(0, PHASE_SEQ.indexOf(p.phase));

  // 顶栏蜕变徽章与阶段指示器
  const header = h('div', 'trans-header');
  header.innerHTML =
    '<div class="trans-badge">✨ 阶段蜕变 · 人生成长礼 ✨</div>' +
    (trans.epilogue ? '<div class="trans-epilogue">🌅 人生后半程 · 终章启幕</div>' : '') +
    '<div class="trans-ceremony"><span class="ceremony-anim">' + (trans.ceremony || '👶 ➜ 🎒') + '</span></div>' +
    '<div class="trans-title">' + (trans.title || '迈入新阶段') + '</div>' +
    '<div class="trans-phase-tag">' + (trans.prevName || '上一阶段') + ' (' + (trans.prevIcon || '') + ') ➔ ' + (trans.nextName || '新阶段') + ' (' + (trans.nextIcon || '') + ')</div>' +
    '<div class="trans-progress">' + ['👶', '🎒', '🏫', '🏢', '🏛️', '🎓', '👔', '🏡'].map((ic, i) =>
      '<span class="tp-dot' + (i <= phaseIdx ? ' on' : '') + '" title="' + PHASE_SEQ[i] + '">' + ic + '</span>').join('<span class="tp-line"></span>') +
    '</div>' +
    '<div class="trans-phase-count">人生阶段 ' + (phaseIdx + 1) + ' / 8</div>';
  body.appendChild(header);

  // 成长感言故事
  if (trans.story) {
    const storyBox = h('div', 'trans-story-box');
    storyBox.innerHTML = '“' + trans.story + '”';
    body.appendChild(storyBox);
  }

  // 终章提醒 (大学/职场/成家)
  if (trans.epilogue) {
    const epilogueBox = h('div', 'trans-epilogue-box');
    epilogueBox.innerHTML = '💡 <b>终章提醒：</b>' +
      (p.phase === 'college' ? '高考已落幕，本代人生进入下半场——职业、婚姻与家族档案将在最后结算，并把遗产传给下一代。' :
       p.phase === 'work' ? '职场打拼的每一分积蓄与面子，都会折算进下一代的家族基金与门第底蕴。'
       : '成家是这一代的句点，也是下一代的开端：伴侣基因、家族图鉴与人生评分将一起合成传家档案。');
    body.appendChild(epilogueBox);
  }

  // 阶段成长盘点
  const statsBox = h('div', 'trans-stats-box');
  const a = p.stats || {};
  statsBox.innerHTML =
    '<div class="trans-sec-title">📊 阶段五维心智积累</div>' +
    '<div class="trans-capsules">' +
      '<span class="capsule">🟢 智商 <b>' + (a.iq || 0) + '</b></span>' +
      '<span class="capsule">❤️ 情商 <b>' + (a.eq || 0) + '</b></span>' +
      '<span class="capsule">🔵 记忆 <b>' + (a.mem || 0) + '</b></span>' +
      '<span class="capsule">🟣 想象 <b>' + (a.img || 0) + '</b></span>' +
      '<span class="capsule">🔴 体魄 <b>' + (a.phy || 0) + '</b></span>' +
      '<span class="capsule">✨ 魅力 <b>' + (a.cha || 0) + '</b></span>' +
    '</div>' +
    '<div class="trans-subinfo">' +
      '<span>📘 已掌握课程: <b>' + (p.learnedCount || 0) + '</b> 门</span>' +
      '<span>🏆 觉醒特长: <b>' + (p.talentsCount || 0) + '</b> 个</span>' +
      '<span>⭐ 现有面子: <b>' + (p.face || 0) + '</b></span>' +
    '</div>';
  body.appendChild(statsBox);

  // 下一阶段解锁内容
  if (trans.unlocks && trans.unlocks.length) {
    const unlockBox = h('div', 'trans-unlock-box');
    const itemsHtml = trans.unlocks.map(u => '<li>' + u + '</li>').join('');
    unlockBox.innerHTML =
      '<div class="trans-sec-title">🎯 ' + (trans.nextName || '') + '新阶段目标与解锁：</div>' +
      '<ul class="trans-unlock-list">' + itemsHtml + '</ul>';
    body.appendChild(unlockBox);
  }

  // 阶段成长礼包
  if (trans.giftDesc) {
    const giftBox = h('div', 'trans-gift-box');
    giftBox.innerHTML = '🎁 <b>阶段成长礼包：</b>' + trans.giftDesc;
    body.appendChild(giftBox);
  }

  // 推进大按钮
  const btn = h('button', 'btn big pulse trans-confirm-btn', '🚀 领取成长礼，迈向新阶段！');
  btn.onclick = () => {
    sound.win();
    const r = CP.resolve(0);
    if (r) toast(r);
    renderAll();
  };
  body.appendChild(btn);
  m.appendChild(body);
}

/* ---------- 🧧 过年收红包推拉拉扯小游戏 ---------- */
let hbTimer = null;
function renderHongbaoModal(p, m) {
  if (hbTimer) { clearInterval(hbTimer); hbTimer = null; }
  m.classList.add('show');
  m.innerHTML = '';
  const body = h('div', 'm-body hb-modal');
  body.appendChild(h('div', 'm-title', p.title || '🧧 过年收红包 · 推拉拉扯战'));

  const diagWrap = h('div', 'hb-dialogues');
  diagWrap.innerHTML =
    '<div class="hb-bubble hb-rel-bubble"><b>' + (p.rel || '长辈') + '</b>: ' + (p.quote || '“拿着拿着，给孩子的压岁钱！”') + '</div>' +
    '<div class="hb-bubble hb-mom-bubble"><b>妈妈</b>: ' + (p.momQuote || '“哎呀使不得使不得，他小孩子要什么钱！”') + '</div>';
  body.appendChild(diagWrap);

  const gaugeBox = h('div', 'hb-gauge-container');
  gaugeBox.innerHTML =
    '<div class="hb-gauge-labels"><span>✋ 客套推脱 (拒收)</span><span style="color:#2e7d32">🌟 黄金平衡区</span><span>🤲 急切收下 (夺取)</span></div>' +
    '<div class="hb-gauge-track">' +
      '<div class="hb-golden-zone">黄金得体</div>' +
      '<div class="hb-pointer" id="hbPointer" style="left:52%">🧧</div>' +
    '</div>' +
    '<div class="hb-timer-wrap"><div class="hb-timer-bar" id="hbTimerBar" style="width:100%"></div></div>';
  body.appendChild(gaugeBox);

  let curPos = 52;
  let timeLeft = 4.5;
  const totalTime = 4.5;

  const updatePointer = () => {
    const pt = $('#hbPointer');
    if (pt) pt.style.left = clamp(curPos, 4, 96) + '%';
  };

  const finishHb = (posVal) => {
    if (hbTimer) { clearInterval(hbTimer); hbTimer = null; }
    sound.win();
    const r = CP.resolve({ pos: posVal });
    if (r) toast(r);
    renderAll();
  };

  hbTimer = setInterval(() => {
    timeLeft -= 0.1;
    curPos = clamp(curPos + 1.2 + (Math.random() * 1.6 - 0.8), 2, 98);
    updatePointer();
    const bar = $('#hbTimerBar');
    if (bar) bar.style.width = Math.max(0, (timeLeft / totalTime) * 100) + '%';
    if (timeLeft <= 0) {
      finishHb(Math.round(curPos));
    }
  }, 100);

  const actGrid = h('div', 'hb-action-grid');
  const btnPush = h('button', 'btn secondary hb-btn-nudge', '✋ 假意推辞 (-14%)');
  btnPush.onclick = () => {
    sound.click();
    curPos = clamp(curPos - 14, 5, 95);
    updatePointer();
  };
  const btnPull = h('button', 'btn secondary hb-btn-nudge', '🤲 勉为其实 (+14%)');
  btnPull.onclick = () => {
    sound.click();
    curPos = clamp(curPos + 14, 5, 95);
    updatePointer();
  };
  const btnTake = h('button', 'btn hb-btn-take', '🧧 顺势收下 (立刻定局结算)');
  btnTake.onclick = () => {
    finishHb(Math.round(curPos));
  };
  actGrid.appendChild(btnPush);
  actGrid.appendChild(btnPull);
  actGrid.appendChild(btnTake);
  body.appendChild(actGrid);

  const fallbackRow = h('div', 'sub-btns flex-between');
  fallbackRow.style.marginTop = '12px';
  const fastBtn = h('button', 'mini-btn ghost', '⏩ 快速直接收下(跳过拉扯)');
  fastBtn.onclick = () => { finishHb(52); };
  fallbackRow.appendChild(fastBtn);
  body.appendChild(fallbackRow);

  m.appendChild(body);
}

/* ---------- ⚔️ 面子对决卡牌对战场 ---------- */
function renderFaceDuelModal(p, m) {
  m.classList.add('show');
  m.innerHTML = '';
  const duel = CP.faceDuel() || p.duel;
  const body = h('div', 'm-body fd-arena');
  body.appendChild(h('div', 'm-title', p.title || '⚔️ 家族面子大对决'));

  if (!duel) {
    body.appendChild(h('div', 'm-desc', p.body || '对决准备中'));
    const btn = h('button', 'btn big', '出招');
    btn.onclick = () => { CP.resolve(0); renderAll(); };
    body.appendChild(btn);
    m.appendChild(body);
    return;
  }

  const fighters = h('div', 'fd-fighters');
  const myHpPct = Math.max(0, Math.min(100, Math.round((duel.myHp / duel.maxMyHp) * 100)));
  const oppHpPct = Math.max(0, Math.min(100, Math.round((duel.opp.hp / duel.opp.maxHp) * 100)));

  fighters.innerHTML =
    '<div class="fd-fighter left">' +
      '<div class="fd-f-header"><span class="av">👶</span><span class="fd-f-name">我家宝儿</span><span class="fd-f-badge">我方</span></div>' +
      '<div class="fd-hp-wrap"><div class="fd-hp-fill mine" style="width:' + myHpPct + '%"></div></div>' +
      '<div class="fd-hp-val">面子: ' + duel.myHp + ' / ' + duel.maxMyHp + '</div>' +
    '</div>' +
    '<div class="fd-vs-col">' +
      '<span>VS</span>' +
      '<span class="fd-vs-round">' + (duel.finished ? '战局结束' : '第 ' + duel.round + ' / ' + duel.maxRound + ' 轮') + '</span>' +
    '</div>' +
    '<div class="fd-fighter right">' +
      '<div class="fd-f-header"><span class="av">' + (duel.opp.icon || '🧑‍🎓') + '</span><span class="fd-f-name">' + duel.opp.name + '</span><span class="fd-f-badge">' + (duel.opp.style || '学神') + '</span></div>' +
      '<div class="fd-hp-wrap"><div class="fd-hp-fill opp" style="width:' + oppHpPct + '%"></div></div>' +
      '<div class="fd-hp-val">面子: ' + duel.opp.hp + ' / ' + duel.opp.maxHp + '</div>' +
    '</div>';
  body.appendChild(fighters);

  const logBox = h('div', 'fd-combat-box');
  const recentLogs = duel.logs.slice(-4);
  logBox.innerHTML = recentLogs.map(l => '<div>' + l + '</div>').join('');
  body.appendChild(logBox);

  if (duel.finished) {
    const finBtn = h('button', 'btn big ' + (duel.won ? 'pulse' : 'secondary'), duel.won ? '🏆 扬眉吐气！(面子+120)' : '默默低头 (面子-40)');
    finBtn.onclick = () => {
      sound.win();
      CP.resolve(0);
      renderAll();
    };
    body.appendChild(finBtn);
  } else {
    const cardsGrid = h('div', 'fd-cards-grid');
    (p.opts || []).forEach((opt, idx) => {
      const card = h('button', 'fd-card-btn');
      const label = (typeof opt === 'string') ? opt : opt.label;
      const sub = (opt && typeof opt === 'object' && opt.sub) ? opt.sub : '';
      card.innerHTML = '<span class="fd-c-title">' + label + '</span>' + (sub ? '<span class="fd-c-sub">' + sub + '</span>' : '');
      card.onclick = () => {
        sound.faceCrit();
        const r = CP.resolve(idx);
        if (r) toast(r);
        renderAll();
      };
      cardsGrid.appendChild(card);
    });
    body.appendChild(cardsGrid);
  }

  m.appendChild(body);
}

/* ---------- 🎓 高考志愿填报 ---------- */
function renderGaokaoApplyModal(p, m) {
  m.classList.add('show');
  m.innerHTML = '';
  sound.gaokaoBang();
  const body = h('div', 'm-body');
  body.appendChild(h('div', 'm-title', p.title || '🎓 高考放榜 & 志愿填报'));
  if (p.body) body.appendChild(h('div', 'm-desc', p.body.replace(/\n/g, '<br>')));

  const majorGrid = h('div', 'major-cards-grid');
  const majors = CP.majors();
  majors.forEach((mj, idx) => {
    const card = h('button', 'major-card-btn');
    card.innerHTML =
      '<span class="major-ico">' + mj.icon + '</span>' +
      '<div class="major-info">' +
        '<div class="major-title">' + mj.n + '</div>' +
        '<div class="major-desc">' + mj.desc + '</div>' +
      '</div>' +
      '<span class="major-tag">填报志愿</span>';
    card.onclick = () => {
      sound.win();
      const r = CP.resolve(idx);
      if (r) toast(r);
      renderAll();
    };
    majorGrid.appendChild(card);
  });
  body.appendChild(majorGrid);
  m.appendChild(body);
}

/* ---------- 🌟 特长才艺选秀大会舞台 ---------- */
function renderTalentShowModal(p, m) {
  m.classList.add('show');
  m.innerHTML = '';
  const body = h('div', 'm-body ts-modal');

  // 1) 舞台横幅与奖励提示
  const head = h('div', 'ts-header');
  const rewardInsight = (p.tier >= 3 ? 500 : 200);
  const rewardFace = (p.tier >= 3 ? 150 : 60);
  head.innerHTML =
    '<div class="ts-badge">🎪 全国少儿才艺大奖赛 · 舞台争霸</div>' +
    '<div class="ts-title">' + (p.title || '特长才艺选秀大会') + '</div>' +
    '<div class="ts-reward-tag">🏆 夺冠重奖：+' + rewardInsight + ' 悟性 · +' + rewardFace + ' 面子</div>';
  body.appendChild(head);

  // 2) 登台对手卡片
  const rival = p.rival || { name: '隔壁小明', talent: { n: '儿歌串烧', icon: '🎶', r: 1, atk: 7 } };
  const rivalBox = h('div', 'ts-rival-card');
  rivalBox.innerHTML =
    '<div class="ts-rival-tag">🔥 登场对手</div>' +
    '<div class="ts-rival-info">' +
      '<div class="ts-rival-name">' + rival.name + '</div>' +
      '<div class="ts-rival-talent">' + (rival.talent ? rival.talent.icon : '🎵') + ' 演出【' + (rival.talent ? rival.talent.n : '合唱') + '】</div>' +
      '<div class="ts-rival-rank">' + '★'.repeat((rival.talent && rival.talent.r) || 1) + ' Rank ' + ((rival.talent && rival.talent.r) || 1) + ' (战力 ' + ((rival.talent && rival.talent.atk) || Math.pow(7, (rival.talent && rival.talent.r) || 1)) + ')</div>' +
    '</div>';
  body.appendChild(rivalBox);

  // 3) 三位评委席
  const judges = p.judges || [
    { name: '张教授', icon: '🧐', title: '资深老学究', style: '严苛治学', motto: '“基本功是骗不了人的！”' },
    { name: '麦克老师', icon: '🕶️', title: '前卫潮人导师', style: '看重舞台张力', motto: '“Show me the passion!”' },
    { name: '李主任', icon: '👩‍🏫', title: '少年宫主任', style: '慈祥鼓励', motto: '“每个登台的孩子都是最棒的！”' },
  ];
  const judgeRow = h('div', 'ts-judges-row');
  judges.forEach(j => {
    const jc = h('div', 'ts-judge-card');
    jc.innerHTML =
      '<div class="ts-judge-ico">' + j.icon + '</div>' +
      '<div class="ts-judge-name">' + j.name + '</div>' +
      '<div class="ts-judge-style">' + j.title + '</div>' +
      '<div class="ts-judge-status">⚪ 待登台评分</div>';
    judgeRow.appendChild(jc);
  });
  body.appendChild(judgeRow);

  // 4) 玩家特长卡组检录
  const myTalents = CP.talentsList ? CP.talentsList() : [];
  const displayTalents = myTalents.length > 0 ? myTalents : [
    { id: 'voice_loud', n: '大嗓门', icon: '📢', r: 1, atk: 7, src: '天生大嗓门' }
  ];

  let selectedTalent = displayTalents[0];

  const deckBox = h('div', 'ts-deck-section');
  deckBox.innerHTML = '<div class="ts-deck-title">🎒 请检录并挑选你的登台特长：</div>';
  const grid = h('div', 'ts-deck-grid');

  const updateSelectionUI = () => {
    grid.querySelectorAll('.ts-talent-card').forEach((el, idx) => {
      if (displayTalents[idx] && displayTalents[idx].id === selectedTalent.id) el.classList.add('selected');
      else el.classList.remove('selected');
    });
    btn.innerHTML = '🌟 携带【' + selectedTalent.n + '】登台演出！';
  };

  displayTalents.forEach(t => {
    const card = h('div', 'ts-talent-card' + (t.id === selectedTalent.id ? ' selected' : ''));
    const rankStars = '★'.repeat(t.r || 1);
    const atkVal = t.atk || Math.pow(7, t.r || 1);
    card.innerHTML =
      '<div class="ts-card-top">' +
        '<span class="ts-card-ico">' + t.icon + '</span>' +
        '<span class="ts-card-rank r' + (t.r || 1) + '">' + rankStars + ' R' + (t.r || 1) + '</span>' +
      '</div>' +
      '<div class="ts-card-name">' + t.n + '</div>' +
      '<div class="ts-card-atk">战力: ' + atkVal + '</div>' +
      '<div class="ts-card-src">' + (t.src || '悟性研习') + '</div>';
    card.onclick = () => {
      sound.click();
      selectedTalent = t;
      updateSelectionUI();
    };
    grid.appendChild(card);
  });
  deckBox.appendChild(grid);
  body.appendChild(deckBox);

  // 5) 登台演出按钮
  const btn = h('button', 'ts-perform-btn');
  btn.innerHTML = '🌟 携带【' + selectedTalent.n + '】登台演出！';
  btn.onclick = () => {
    sound.win();
    const r = CP.resolve({ talentId: selectedTalent.id });
    if (r) toast(r);
    renderAll();
  };
  body.appendChild(btn);

  m.appendChild(body);
}

/* ---------- 🌟 选秀结算结果舞台 ---------- */
function renderTalentShowResultModal(p, m) {
  m.classList.add('show');
  m.innerHTML = '';
  if (p.win) {
    sound.talentWin();
  } else {
    sound.fail();
  }
  const body = h('div', 'm-body ts-modal ts-result-modal');

  // 1) 顶部结果徽章
  const head = h('div', 'ts-header');
  head.innerHTML =
    '<div class="ts-badge ' + (p.win ? 'win' : 'lose') + '">' + (p.win ? '🎉 冠军诞生 · 技惊四座' : '📜 虽败犹荣 · 参与纪念') + '</div>' +
    '<div class="ts-title">' + (p.title || '特长才艺选秀') + '</div>';
  body.appendChild(head);

  // 2) 三位评委亮灯与点评
  const judges = [
    { name: '张教授', icon: '🧐' },
    { name: '麦克老师', icon: '🕶️' },
    { name: '李主任', icon: '👩‍🏫' },
  ];
  const judgeRow = h('div', 'ts-judges-row');
  judges.forEach((j, idx) => {
    const isLit = p.lights ? p.lights[idx] : p.win;
    const jc = h('div', 'ts-judge-card ' + (isLit ? 'lit' : 'unlit'));
    jc.innerHTML =
      '<div class="ts-judge-ico">' + j.icon + '</div>' +
      '<div class="ts-judge-name">' + j.name + '</div>' +
      '<div class="ts-lamp-badge ' + (isLit ? 'on' : 'off') + '">' + (isLit ? '💡 亮灯通过' : '❌ 灭灯') + '</div>' +
      '<div class="ts-judge-quote">' + ((p.judgeQuotes && p.judgeQuotes[idx]) || '') + '</div>';
    judgeRow.appendChild(jc);
  });
  body.appendChild(judgeRow);

  // 3) 现场弹幕反响
  const danmakuBox = h('div', 'ts-danmaku-container');
  const dList = p.danmaku || (p.win ? ['“太震撼了！”', '“全场起立鼓掌！”'] : ['“加油，下次一定能赢！”']);
  danmakuBox.innerHTML =
    '<div class="ts-danmaku-tag">📣 全场观众席沸腾声浪</div>' +
    '<div class="ts-danmaku-stream">' + dList.map(txt => '<span class="dm-chip">' + txt + '</span>').join('') + '</div>';
  body.appendChild(danmakuBox);

  // 4) 核心大奖结算区域
  const prizeBox = h('div', 'ts-prize-card ' + (p.win ? 'win' : 'lose'));
  prizeBox.innerHTML =
    '<div class="ts-prize-ico">' + (p.win ? '🏆' : '📜') + '</div>' +
    '<div class="ts-prize-title">' + (p.win ? '荣获大赛总冠军！' : '获得大赛优秀参与奖') + '</div>' +
    '<div class="ts-prize-sub">登台特长：' + ((p.mine && p.mine.n) || '特长表演') + '  vs  对手：' + ((p.rival && p.rival.talent && p.rival.talent.n) || '对手') + '</div>' +
    '<div class="ts-rewards-row">' +
      '<span class="ts-rw-item ins">💡 悟性 +' + (p.gi || (p.win ? 500 : 40)) + '</span>' +
      '<span class="ts-rw-item face ' + (p.gf >= 0 ? 'pos' : 'neg') + '">🌟 面子 ' + (p.gf >= 0 ? '+' + p.gf : p.gf) + '</span>' +
    '</div>';
  body.appendChild(prizeBox);

  // 5) 确认离开按钮
  const btn = h('button', 'ts-perform-btn finish-btn');
  btn.innerHTML = '收下荣誉，走下舞台 👏';
  btn.onclick = () => {
    sound.click();
    CP.resolve(0);
    renderAll();
  };
  body.appendChild(btn);

  m.appendChild(body);
}

/* ---------- 🗳️ 班干部三向竞选演说博弈台 ---------- */
function renderElectionModal(p, m) {
  m.classList.add('show');
  m.innerHTML = '';
  const body = h('div', 'm-body el-modal');
  const el = (CP.election ? CP.election() : null) || p.election || {
    round: 1, maxRound: 3, myVotes: 0,
    rival: { name: '王小明', title: '原班长', icon: '🧑‍🏫', votes: 0 },
    targetVotes: 26, totalVotes: 50, logs: []
  };

  // 1) 竞选讲台横幅
  const head = h('div', 'el-header');
  head.innerHTML =
    '<div class="el-badge">🗳️ 班干部三向竞选演说大会</div>' +
    '<div class="el-title">第 ' + (el.round || 1) + ' / ' + (el.maxRound || 3) + ' 轮演说 · 争夺班级中队长</div>' +
    '<div class="el-sub">向全班 50 名同学发表施政演说，拉取过半关键选票！</div>';
  body.appendChild(head);

  // 2) 双方得票与候选人PK看台
  const arena = h('div', 'el-arena');
  const genderIcon = (CP.state && CP.state().gender === 'girl') ? '👧' : '👦';
  const myPct = Math.min(100, Math.round(((el.myVotes || 0) / (el.targetVotes || 26)) * 100));
  const rivalPct = Math.min(100, Math.round(((el.rival.votes || 0) / (el.targetVotes || 26)) * 100));

  arena.innerHTML =
    '<div class="el-cand left">' +
      '<div class="el-avatar">' + genderIcon + '</div>' +
      '<div class="el-cand-name">我 (候选人)</div>' +
      '<div class="el-vote-badge mine">' + (el.myVotes || 0) + ' 票</div>' +
      '<div class="el-bar-wrap"><div class="el-bar mine" style="width:' + myPct + '%"></div></div>' +
    '</div>' +
    '<div class="el-vs-box">' +
      '<span class="el-vs-tag">VS</span>' +
      '<span class="el-target-tag">当选门槛: ' + (el.targetVotes || 26) + ' 票</span>' +
    '</div>' +
    '<div class="el-cand right">' +
      '<div class="el-avatar">' + (el.rival.icon || '🧑‍🏫') + '</div>' +
      '<div class="el-cand-name">' + el.rival.name + '</div>' +
      '<div class="el-vote-badge rival">' + (el.rival.votes || 0) + ' 票</div>' +
      '<div class="el-bar-wrap"><div class="el-bar rival" style="width:' + rivalPct + '%"></div></div>' +
    '</div>';
  body.appendChild(arena);

  // 3) 讲台黑板报实时速记
  const blackboard = h('div', 'el-blackboard');
  const logs = el.logs || [];
  blackboard.innerHTML =
    '<div class="el-bb-title">📝 讲台竞选速记与同学反响</div>' +
    '<div class="el-bb-list">' +
      logs.slice(-4).map(line => '<div class="el-bb-line">' + line + '</div>').join('') +
    '</div>';
  body.appendChild(blackboard);

  // 4) 四大施政演说策略卡牌
  const tacticsBox = h('div', 'el-tactics-box');
  tacticsBox.innerHTML = '<div class="el-tactics-title">🗣️ 请选择本轮演说与拉票策略：</div>';
  const grid = h('div', 'el-tactics-grid');

  const defaultOpts = [
    { label: '🤝 亲民路线·倾听心声', sub: '基于情商，拉拢广大同学支持' },
    { label: '🌟 才艺展示·硬核特长', sub: '亮出最高特长才华，惊艳全场' },
    { label: '🍭 零食许诺·请客公关', sub: '花费 20 元买零食，吸引调皮同学' },
    { label: '📜 严密施政·学业互助', sub: '基于智商，赢得学霸与老师信赖' }
  ];
  const opts = (p.opts && p.opts.length === 4) ? p.opts : defaultOpts;

  opts.forEach((opt, idx) => {
    const card = h('button', 'el-tactic-btn');
    card.innerHTML =
      '<div class="el-tactic-title">' + (opt.label || opt) + '</div>' +
      '<div class="el-tactic-desc">' + (opt.sub || '') + '</div>';
    card.onclick = () => {
      sound.click();
      const r = CP.resolve(idx);
      if (r) toast(r);
      renderAll();
    };
    grid.appendChild(card);
  });
  tacticsBox.appendChild(grid);
  body.appendChild(tacticsBox);

  m.appendChild(body);
}

/* ---------- 💘 终局求婚与长辈相亲角舞台 ---------- */
function renderMarryModal(p, m) {
  m.classList.add('show');
  m.innerHTML = '';
  const body = h('div', 'm-body marry-modal');
  const ATTR_MAP = { iq: '📐 智商', eq: '❤️ 情商', mem: '🧠 记忆', img: '🎨 想象', phy: '💪 体魄', cha: '⭐ 魅力' };

  if (p.isCampus) {
    // 1) 校园恋人浪漫求婚舞台
    const cand = p.cand || { name: 'TA', icon: '🌸', aff: 80, bonus: { eq: 20, img: 25 }, intro: '同窗恋人', quote: '我一直在等你……' };
    const head = h('div', 'marry-header');
    head.innerHTML =
      '<div class="marry-badge campus">💍 从校服到婚纱 · 浪漫求婚时刻</div>' +
      '<div class="marry-title">与「' + cand.name + '」的人生约定</div>' +
      '<div class="marry-sub">从青涩校服走到圣洁婚纱，此时此刻，你想对TA说——</div>';
    body.appendChild(head);

    const card = h('div', 'marry-lover-card');
    const bonusText = Object.entries(cand.bonus || {}).map(([k, v]) => (ATTR_MAP[k] || k) + ' +' + v).join('  ·  ');
    card.innerHTML =
      '<div class="marry-avatar-box">' +
        '<span class="marry-avatar">' + (cand.icon || '🌸') + '</span>' +
        '<span class="marry-heart-badge">❤️ ' + cand.aff + ' / 100</span>' +
      '</div>' +
      '<div class="marry-lover-info">' +
        '<div class="marry-lover-name">' + cand.name + '</div>' +
        '<div class="marry-lover-intro">' + (cand.intro || '青梅竹马同窗知己') + '</div>' +
        '<div class="marry-lover-quote">“' + (cand.quote || '从后排传小纸条，到一起走过大学操场，我一直在等你这句话……') + '”</div>' +
        '<div class="marry-gen-perk">🧬 伴侣后代基因赋能：' + bonusText + '</div>' +
      '</div>';
    body.appendChild(card);

    const btnPropose = h('button', 'marry-action-btn propose');
    btnPropose.innerHTML = '💍 拿出钻戒，单膝跪地深情求婚！<span class="btn-sub">结为校园夫妻，家庭面子+40，全额继承基因</span>';
    btnPropose.onclick = () => {
      sound.win();
      const r = CP.resolve(0);
      if (r) toast(r);
      renderAll();
    };
    body.appendChild(btnPropose);

    const btnSingle = h('button', 'marry-action-btn single');
    btnSingle.innerHTML = '🍂 顺其自然，互道珍重 (专注拼事业)<span class="btn-sub">暂时保持单身，把青葱回忆珍藏在心底</span>';
    btnSingle.onclick = () => {
      sound.click();
      const r = CP.resolve(1);
      if (r) toast(r);
      renderAll();
    };
    body.appendChild(btnSingle);

  } else {
    // 2) 长辈公园相亲角展台
    const prob = p.prob || 0.5;
    const candidates = p.blindCandidates || [
      { id: 'blind-doc', name: '三甲医院林医生', icon: '🩺', tag: '三甲名医', intro: '外科主治医师，严谨体面受人尊重', bonus: { iq: 20, mem: 15 } },
      { id: 'blind-gov', name: '机关单位李骨干', icon: '🏛️', tag: '体制内精英', intro: '市直单位业务中坚，处事得体周全', bonus: { eq: 20, cha: 15 } },
      { id: 'blind-cafe', name: '咖啡馆主理人晴晴', icon: '☕', tag: '青梅发小', intro: '独立咖啡馆主理人，温柔浪漫生活情调', bonus: { img: 20, cha: 15 } }
    ];

    const head = h('div', 'marry-header');
    head.innerHTML =
      '<div class="marry-badge park">💌 长辈公园相亲角 · 婚恋大抉择</div>' +
      '<div class="marry-title">红绳飘扬的相亲长廊</div>' +
      '<div class="marry-sub">面子与个人魅力是相亲硬通货 · 意向成婚率约 ' + Math.round(prob * 100) + '%</div>';
    body.appendChild(head);

    const list = h('div', 'blind-grid');
    candidates.forEach((cand, idx) => {
      const card = h('button', 'blind-cand-card');
      const bonusText = Object.entries(cand.bonus || {}).map(([k, v]) => (ATTR_MAP[k] || k) + ' +' + v).join(' · ');
      card.innerHTML =
        '<div class="blind-cand-top">' +
          '<span class="blind-cand-ico">' + cand.icon + '</span>' +
          '<div class="blind-cand-titles">' +
            '<div class="blind-cand-name">' + cand.name + '</div>' +
            '<span class="blind-cand-tag">' + cand.tag + '</span>' +
          '</div>' +
          '<span class="blind-match-btn">约见 ➔</span>' +
        '</div>' +
        '<div class="blind-cand-intro">' + cand.intro + '</div>' +
        '<div class="blind-cand-perk">🧬 遗传底蕴: ' + bonusText + '</div>';
      card.onclick = () => {
        sound.click();
        const r = CP.resolve(idx);
        if (r) toast(r);
        renderAll();
      };
      list.appendChild(card);
    });
    body.appendChild(list);

    const btnPass = h('button', 'marry-action-btn single');
    btnPass.innerHTML = '💼 婉拒相亲，专注搞事业 (保持单身)<span class="btn-sub">一个人自由自在，无伴侣遗传赋能</span>';
    btnPass.onclick = () => {
      sound.click();
      const r = CP.resolve(3);
      if (r) toast(r);
      renderAll();
    };
    body.appendChild(btnPass);
  }

  m.appendChild(body);
}

/* ---------- 💼 职场年中绩效考核与晋升答辩 ---------- */
function renderPromotionModal(p, m) {
  m.classList.add('show');
  m.innerHTML = '';
  const body = h('div', 'm-body pro-modal');
  const job = p.job || { n: '普通员工', icon: '💼', t: 1 };

  // 1) 顶栏徽章与标题
  const head = h('div', 'pro-header');
  head.innerHTML =
    '<div class="pro-badge">💼 集团年中考核委员会 · 职级答辩</div>' +
    '<div class="pro-title">' + (p.title || '职场年中绩效考核') + '</div>' +
    '<div class="pro-sub">亮出核心业绩与答辩策略，争取升职加薪与家族门第跃迁！</div>';
  body.appendChild(head);

  // 2) 当前岗位与月薪卡片
  const jobCard = h('div', 'pro-job-card');
  jobCard.innerHTML =
    '<div class="pro-job-ico">' + (job.icon || '💼') + '</div>' +
    '<div class="pro-job-info">' +
      '<div class="pro-job-name">' + (job.n || job.name || '核心骨干') + '</div>' +
      '<div class="pro-job-tier">当前社会门第：Tier ' + (p.curTier || 1) + ' · 月薪 ' + (p.salary || 300) + ' 元/回</div>' +
    '</div>' +
    '<div class="pro-kpi-badge">考核评定中 ⏳</div>';
  body.appendChild(jobCard);

  // 3) 三大答辩策略卡片
  const optsBox = h('div', 'pro-opts-box');
  optsBox.innerHTML = '<div class="pro-opts-title">📊 请选择你的答辩陈述重点：</div>';
  const grid = h('div', 'pro-opts-grid');

  const defaultOpts = [
    { label: '🚀 主攻业务突破与技术硬实力', sub: '依赖智商与记忆，展示无可替代的专业产出' },
    { label: '🤝 强调跨部门统筹与领导力', sub: '依赖情商与魅力，展现管理潜力与团队凝聚力' },
    { label: '📈 亮出攻坚克难与抗压战绩', sub: '依赖体魄与执行力，凸显高强度的敬业精神' }
  ];
  const opts = (p.opts && p.opts.length === 3) ? p.opts : defaultOpts;

  opts.forEach((opt, idx) => {
    const btn = h('button', 'pro-opt-btn');
    btn.innerHTML =
      '<div class="pro-opt-title">' + (opt.label || opt) + '</div>' +
      '<div class="pro-opt-sub">' + (opt.sub || '') + '</div>';
    btn.onclick = () => {
      sound.click();
      const r = CP.resolve(idx);
      if (r) toast(r);
      renderAll();
    };
    grid.appendChild(btn);
  });
  optsBox.appendChild(grid);
  body.appendChild(optsBox);

  m.appendChild(body);
}

/* ---------- 世代终章大屏展示 ---------- */
function showReport(p) {
  showScreen('report');
  sound.win();
  const info = CP.info();
  const fam = p.fam || CP.fam();
  const s = CP.state();

  const job = (s && s.job) ? s.job : (fam.job || { n: '自由职业者', icon: '🛋️', t: 0 });
  const jobName = job.n || job.name || fam.lastJob || '自由职业';
  const tierDesc = ['普通工薪', '温饱无忧', '小康之家', '中产体面', '高薪优渥', '领军精英'][job.t || 0];
  const rating = fam.rating || 'S';
  const ratingDesc = fam.ratingDesc || '小康体面 · 岁月静好';
  const totalScore = fam.totalLifeScore || 75;
  const perTurnBonus = fam.talent > 0 ? Math.max(1, Math.floor(fam.talent / 2)) : 0;
  const seedMoney = fam.seedMoney || 0;
  const highlight = fam.highlight || '踏实走完精彩一代，将温暖与希望毫无保留地交托下一代！';

  $('#rep-title').textContent = '第 ' + (info ? info.gen : (fam.g || 1)) + ' 代 · 人生终章功绩录';
  $('#rep-sub').textContent = '「' + (info ? info.name : fam.name) + '」的一生圆满落幕，家族火炬已准备就绪';

  const ratingColors = {
    SSS: 'linear-gradient(135deg, #ffd700, #ff8c00)',
    SS: 'linear-gradient(135deg, #ff416c, #ff4b2b)',
    S: 'linear-gradient(135deg, #9b51e0, #e056fd)',
    A: 'linear-gradient(135deg, #27ae60, #2ecc71)',
    B: 'linear-gradient(135deg, #2980b9, #3498db)'
  };

  $('#rep-profile').innerHTML =
    '<div class="rep-rating-row">' +
      '<div class="rep-rating-badge" style="background:' + (ratingColors[rating] || ratingColors.S) + '">' + rating + '</div>' +
      '<div class="rep-rating-meta">' +
        '<div class="rep-rating-title">' + ratingDesc + '</div>' +
        '<div class="rep-rating-score">本代综合评定分: <b>' + totalScore + '</b> / 100</div>' +
      '</div>' +
    '</div>' +
    '<div class="rep-highlight-box">' +
      '<span class="rep-hl-icon">✨</span>' +
      '<span class="rep-hl-text"><b>家族高光时刻：</b>' + highlight + '</span>' +
    '</div>' +
    '<div class="rep-summary-grid">' +
      '<div class="rep-grid-item"><span class="lbl">主角生平</span><span class="val">' + (info ? info.name : fam.name) + ' (' + ((info && info.gender === 'girl') ? '女儿' : '儿子') + ')</span></div>' +
      '<div class="rep-grid-item"><span class="lbl">最终职业</span><span class="val">' + (job.icon || '💼') + ' ' + jobName + ' (' + tierDesc + ')</span></div>' +
      '<div class="rep-grid-item"><span class="lbl">高考战绩</span><span class="val">' + (s && s.gaokaoScore ? s.gaokaoScore + ' 分' : (fam.lastScore ? fam.lastScore + ' 分' : '推荐保送')) + '</span></div>' +
      '<div class="rep-grid-item"><span class="lbl">家庭伴侣</span><span class="val">' + (s && s.spouse ? s.spouse.name : (fam.lastSpouse || '独善其身 (单身)')) + '</span></div>' +
      '<div class="rep-grid-item"><span class="lbl">家族积蓄</span><span class="val">' + (info ? info.money : 0) + ' 元</span></div>' +
      '<div class="rep-grid-item"><span class="lbl">最终面子</span><span class="val">⭐ ' + (info ? info.face : 0) + '</span></div>' +
    '</div>';

  const a = (s && s.attrs) ? s.attrs : (fam.attr || {});
  $('#rep-highlights').innerHTML =
    '<h4>📊 毕生五维心智成长</h4>' +
    '<div class="rep-stats-capsules">' +
      '<span class="capsule">🟢 智商 <b>' + (a.iq || 0) + '</b></span>' +
      '<span class="capsule">❤️ 情商 <b>' + (a.eq || 0) + '</b></span>' +
      '<span class="capsule">🔵 记忆 <b>' + (a.mem || 0) + '</b></span>' +
      '<span class="capsule">🟣 想象 <b>' + (a.img || 0) + '</b></span>' +
      '<span class="capsule">🔴 体魄 <b>' + (a.phy || 0) + '</b></span>' +
      '<span class="capsule">✨ 魅力 <b>' + (a.cha || 0) + '</b></span>' +
    '</div>' +
    '<p style="margin-top:8px;font-size:12px;color:var(--ink-secondary);">' +
      '已研习课程 <b>' + ((s && s.learnedCourses) ? s.learnedCourses.length : 0) + '</b> 门 · 本代收集特长 <b>' + ((s && s.talents) ? s.talents.length : 0) + '</b> 个' +
    '</p>';

  const spB = fam.spouseBonus || { iq: 6, eq: 6, mem: 6, img: 6, phy: 6, cha: 6 };
  const uniTier = fam.uniTier || 0;
  let uniRow = '';
  if (uniTier >= 5) uniRow = '<div class="inherit-row"><span class="i-icon">🏆</span><div class="i-info"><b>清北世家 · 名校光环</b><div class="i-desc">让后代开局自带悟性 <b>+30</b>、面子 <b>+15</b>！</div></div></div>';
  else if (uniTier >= 4) uniRow = '<div class="inherit-row"><span class="i-icon">🏆</span><div class="i-info"><b>985 · 名校光环</b><div class="i-desc">让后代开局自带悟性 <b>+15</b>、面子 <b>+8</b>！</div></div></div>';
  else if (uniTier >= 3) uniRow = '<div class="inherit-row"><span class="i-icon">🏆</span><div class="i-info"><b>211 · 书香传承</b><div class="i-desc">让后代开局自带悟性 <b>+15</b>、面子 <b>+8</b>！</div></div></div>';

  const famShadow = fam.shadow || 0;
  const famStress = fam.stress || 0;
  let shadowRow = '';
  if (famShadow >= 50) shadowRow = '<div class="inherit-row"><span class="i-icon">🌧️</span><div class="i-info"><b>心态阴翳的遗传</b><div class="i-desc">父母的心理阴影让后代出生自带压力 <b>+' + Math.min(40, Math.round(famShadow / 4)) + '</b>，记得早点用娱乐与休息化解。</div></div></div>';
  else if (famStress > 80) shadowRow = '<div class="inherit-row"><span class="i-icon">🌧️</span><div class="i-info"><b>高压环境的烙印</b><div class="i-desc">长期高压让后代出生自带压力 <b>+' + Math.min(40, Math.round((famStress - 80) / 4)) + '</b>。</div></div></div>';

  $('#rep-inheritance').innerHTML =
    '<h4>🧬 家族传承与下一代先天红利清单</h4>' +
    uniRow + shadowRow +
    '<div class="rep-inherit-list">' +
      '<div class="inherit-row">' +
        '<span class="i-icon">🧬</span>' +
        '<div class="i-info">' +
          '<b>父母五维基因遗传 (18% 折算)</b>' +
          '<div class="i-desc">智商 +' + Math.round((a.iq || 0) * 0.18) + ' | 情商 +' + Math.round((a.eq || 0) * 0.18) + ' | 记忆 +' + Math.round((a.mem || 0) * 0.18) + ' | 想象 +' + Math.round((a.img || 0) * 0.18) + ' | 体魄 +' + Math.round((a.phy || 0) * 0.18) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="inherit-row">' +
        '<span class="i-icon">💑</span>' +
        '<div class="i-info">' +
          '<b>伴侣基因赋能加成 (' + (fam.lastSpouse || '相伴') + ')</b>' +
          '<div class="i-desc">情商 +' + (spB.eq || 0) + ' | 魅力 +' + (spB.cha || 0) + ' | 智商 +' + (spB.iq || 0) + ' | 记忆 +' + (spB.mem || 0) + ' | 体魄 +' + (spB.phy || 0) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="inherit-row">' +
        '<span class="i-icon">🌱</span>' +
        '<div class="i-info">' +
          '<b>家族特长图鉴庇佑 (' + fam.talent + ' 项特长)</b>' +
          '<div class="i-desc">后代每回合五维全属性自然成长 <b>+' + perTurnBonus + '</b>！(一代更比一代强)</div>' +
        '</div>' +
      '</div>' +
      '<div class="inherit-row">' +
        '<span class="i-icon">💰</span>' +
        '<div class="i-info">' +
          '<b>家族压岁钱基金与门第底蕴</b>' +
          '<div class="i-desc">开局自带压岁钱 <b>+' + seedMoney + '</b> 元 · 初始面子 +' + ((fam.tier || 0) * 25) + ' · 每回合发放 ' + (30 + (fam.tier || 0) * 55) + ' 元零花</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  $('#rep-next-btn').onclick = () => {
    sound.win();
    CP.resolve(0); // 触发 endgen 结算，调用 nextGen
    renderAll();
  };
}

/* ---------- 刷新与状态统筹 ---------- */
function updateSplash() {
  showScreen('splash');
  const sInfo = CP.saveInfo();
  const contBtn = $('#btn-continue');
  if (sInfo) {
    $('#cont-gen').textContent = sInfo.gen;
    $('#cont-turn').textContent = sInfo.turn;
    contBtn.hidden = false;
    contBtn.classList.remove('hidden');
  } else {
    contBtn.hidden = true;
    contBtn.classList.add('hidden');
  }

  const fam = CP.fam();
  const famBadge = $('#fam-badge');
  if (fam && fam.g > 0) {
    famBadge.hidden = false;
    famBadge.classList.remove('hidden');
    $('#fam-detail').textContent = '已历经 ' + fam.g + ' 代 · 家族特长 ' + (fam.atlas ? fam.atlas.length : 0) + ' 个 · 天赋 +' + (fam.talent || 0);
  } else {
    famBadge.hidden = true;
    famBadge.classList.add('hidden');
  }
}

/* ---------- 新手引导系统 (聚光灯高亮与交互指引) ---------- */
class GuideManager {
  constructor() {
    this.currentStep = 0;
    this.isActive = false;
    this.overlay = null;
    this.spotlight = null;
    this.card = null;
    this.title = null;
    this.body = null;
    this.dots = null;
    this.nextBtn = null;
    this.skipBtn = null;
    this.steps = [];
  }

  init() {
    this.overlay = $('#guide-overlay');
    this.spotlight = $('#guide-spotlight');
    this.card = $('#guide-card');
    this.title = $('#guide-title');
    this.body = $('#guide-body');
    this.dots = $('#guide-steps-dots');
    this.nextBtn = $('#guide-next');
    this.skipBtn = $('#guide-skip');
    this.steps = (D && D.tutorialSteps) ? D.tutorialSteps : [];

    if (this.nextBtn) {
      this.nextBtn.onclick = () => {
        sound.click();
        this.next();
      };
    }
    if (this.skipBtn) {
      this.skipBtn.onclick = () => {
        sound.click();
        this.skip();
      };
    }

    window.addEventListener('resize', () => {
      if (this.isActive) this.updatePosition();
    });
    window.addEventListener('scroll', () => {
      if (this.isActive) this.updatePosition();
    }, true);
  }

  shouldStart() {
    const s = CP.state();
    if (!s || s.turn !== 1) return false;
    const pend = CP.pending();
    if (pend && pend.length > 0) return false;
    if (s.tutorial && s.tutorial.done) return false;
    if (localStorage.getItem('cph_guide_done') === '1') return false;
    return true;
  }

  start(force = false) {
    if (!this.overlay) this.init();
    if (!force && !this.shouldStart()) return;
    this.currentStep = 0;
    this.isActive = true;
    if (this.overlay) {
      this.overlay.hidden = false;
      this.overlay.classList.remove('hidden');
    }
    this.renderStep(0);
  }

  renderStep(index) {
    if (!this.steps || index >= this.steps.length) {
      this.finish();
      return;
    }
    this.currentStep = index;
    const step = this.steps[index];

    if (step.tab && ACTIVE !== step.tab) {
      setTab(step.tab);
    }

    if (this.title) this.title.textContent = step.title;
    if (this.body) this.body.innerHTML = step.body;
    if (this.nextBtn) this.nextBtn.textContent = step.btn || '下一步 👉';

    if (this.dots) {
      this.dots.innerHTML = '';
      this.steps.forEach((_, i) => {
        const dot = h('div', 'guide-dot' + (i === index ? ' active' : ''));
        this.dots.appendChild(dot);
      });
    }

    setTimeout(() => {
      this.updatePosition();
    }, 60);
  }

  updatePosition() {
    if (!this.isActive || !this.steps.length || !this.spotlight || !this.card) return;
    const step = this.steps[this.currentStep];
    const targetEl = document.querySelector(step.target);

    if (targetEl && targetEl.offsetParent !== null) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const rect = targetEl.getBoundingClientRect();
      const pad = 6;
      const top = Math.max(4, rect.top - pad);
      const left = Math.max(4, rect.left - pad);
      const width = Math.min(window.innerWidth - 8, rect.width + pad * 2);
      const height = Math.min(window.innerHeight - 8, rect.height + pad * 2);

      this.spotlight.style.top = top + 'px';
      this.spotlight.style.left = left + 'px';
      this.spotlight.style.width = width + 'px';
      this.spotlight.style.height = height + 'px';
      this.spotlight.style.opacity = '1';

      const cardHeight = this.card.offsetHeight || 190;
      if (top + height + cardHeight + 25 < window.innerHeight) {
        this.card.style.top = (top + height + 10) + 'px';
        this.card.style.bottom = 'auto';
      } else if (top - cardHeight - 20 > 0) {
        this.card.style.top = 'auto';
        this.card.style.bottom = (window.innerHeight - top + 10) + 'px';
      } else {
        this.card.style.top = 'auto';
        this.card.style.bottom = '76px';
      }
    } else {
      this.spotlight.style.opacity = '0';
      this.card.style.top = '26%';
      this.card.style.bottom = 'auto';
    }
  }

  next() {
    const step = this.steps[this.currentStep];
    if (step && step.action === 'switch-tab-brain') {
      setTab('brain');
    } else if (step && step.action === 'switch-tab-plan') {
      setTab('plan');
    }

    if (this.currentStep < this.steps.length - 1) {
      this.renderStep(this.currentStep + 1);
    } else {
      this.finish();
    }
  }

  skip() {
    this.close();
    localStorage.setItem('cph_guide_done', '1');
    const s = CP.state();
    if (s && s.tutorial) s.tutorial.done = true;
    toast('已跳过新手指引，随时可点击右上角 📖 查看攻略手册');
  }

  finish() {
    this.close();
    localStorage.setItem('cph_guide_done', '1');
    const gift = CP.claimNovicePack();
    if (gift) {
      sound.win();
    }
    renderAll();
  }

  close() {
    this.isActive = false;
    if (this.overlay) {
      this.overlay.hidden = true;
      this.overlay.classList.add('hidden');
    }
  }
}
const guide = new GuideManager();

/* ---------- 常驻通关手册 ---------- */
function openManual(activeCat = 'loop') {
  sound.click();
  const m = $('#manual-modal');
  if (!m) return;
  m.hidden = false;
  m.classList.remove('hidden');

  const tabsEl = $('#manual-tabs');
  const bodyEl = $('#manual-body');
  const list = (D && D.manual) ? D.manual : [];

  tabsEl.innerHTML = '';
  list.forEach(item => {
    const t = h('button', 'm-tab' + (item.id === activeCat ? ' active' : ''));
    t.innerHTML = item.icon + ' ' + item.title;
    t.onclick = () => {
      sound.click();
      openManual(item.id);
    };
    tabsEl.appendChild(t);
  });

  const cur = list.find(x => x.id === activeCat) || list[0];
  if (cur) {
    bodyEl.innerHTML =
      '<div class="manual-card">' +
      '<h4>' + cur.icon + ' ' + cur.title + '</h4>' +
      (cur.summary ? '<div class="manual-summary">💡 ' + cur.summary + '</div>' : '') +
      '<div class="manual-content">' + cur.content + '</div>' +
      '</div>';
  }
}

function closeManual() {
  sound.click();
  const m = $('#manual-modal');
  if (m) {
    m.hidden = true;
    m.classList.add('hidden');
  }
}

/* ---------- 版本更新公告与更新日志 ---------- */
function getStoredVer() {
  try { return localStorage.getItem('cph_last_seen_ver'); } catch(e) { return null; }
}
function setStoredVer(v) {
  try { localStorage.setItem('cph_last_seen_ver', v); } catch(e) {}
}

function checkChangelogNotice() {
  const curVer = (D && D.version) ? D.version : 'v2.1.0';
  const lastSeen = getStoredVer();
  const badges = document.querySelectorAll('#update-badge, #splash-update-badge');
  badges.forEach(badge => {
    if (lastSeen !== curVer) {
      badge.hidden = false;
      badge.classList.remove('hidden');
    } else {
      badge.hidden = true;
      badge.classList.add('hidden');
    }
  });
  const splashVer = $('#splash-ver-badge');
  if (splashVer) splashVer.textContent = curVer;
  const headerVer = $('#changelog-cur-ver');
  if (headerVer) headerVer.textContent = curVer;

  // 用户刷新或进入游戏，若未阅读过新版本，自动弹出更新公告
  if (lastSeen !== curVer) {
    setTimeout(() => {
      openChangelogModal(true);
    }, 200);
  }
}

function openChangelogModal(isAuto = false) {
  if (!isAuto) sound.click();
  const m = $('#changelog-modal');
  if (!m) return;
  m.hidden = false;
  m.classList.remove('hidden');

  const curVer = (D && D.version) ? D.version : 'v2.1.0';
  const list = (D && D.changelog) ? D.changelog : [];
  const body = $('#changelog-body');
  if (!body) return;

  let html = '';
  html += `
    <div class="changelog-banner">
      <div class="banner-badge">🎉 欢迎体验全新版本 · ${curVer}</div>
      <div class="banner-text">中国式家长持续进化！为你带来更真实沉浸的中国式成长轨迹与深度策略玩法。向下滚动可查阅各版本历史更新内容。</div>
    </div>
  `;

  list.forEach((item, idx) => {
    const isLatest = idx === 0;
    const cardClass = isLatest ? 'changelog-card latest' : 'changelog-card';
    const tagClass = isLatest ? 'tag-badge latest' : 'tag-badge normal';

    html += `<div class="${cardClass}">`;
    html += `  <div class="ver-header">`;
    html += `    <div class="ver-left">`;
    html += `      <span class="ver-num">${item.ver || item.version}</span>`;
    html += `      <span class="${tagClass}">${item.tag || (isLatest ? '最新' : '历史')}</span>`;
    html += `    </div>`;
    html += `    <span class="ver-date">📅 ${item.date || ''}</span>`;
    html += `  </div>`;
    html += `  <div class="ver-title">${item.title}</div>`;
    if (item.desc) {
      html += `  <div class="ver-desc">${item.desc}</div>`;
    }

    if (item.highlights && item.highlights.length) {
      html += `  <div class="ver-features">`;
      item.highlights.forEach(h => {
        if (typeof h === 'string') {
          html += `    <div class="feature-item"><span class="feature-icon">✨</span><div class="feature-content"><div class="feature-text">${h}</div></div></div>`;
        } else {
          html += `    <div class="feature-item">`;
          html += `      <span class="feature-icon">${h.icon || '✨'}</span>`;
          html += `      <div class="feature-content">`;
          html += `        <div class="feature-title">${h.title}</div>`;
          html += `        <div class="feature-desc">${h.desc}</div>`;
          html += `      </div>`;
          html += `    </div>`;
        }
      });
      html += `  </div>`;
    }
    html += `</div>`;
  });

  body.innerHTML = html;
  body.scrollTop = 0;
}

function closeChangelogModal() {
  sound.click();
  const m = $('#changelog-modal');
  if (m) {
    m.hidden = true;
    m.classList.add('hidden');
  }
  const curVer = (D && D.version) ? D.version : 'v2.1.0';
  setStoredVer(curVer);

  const badges = document.querySelectorAll('#update-badge, #splash-update-badge');
  badges.forEach(badge => {
    badge.hidden = true;
    badge.classList.add('hidden');
  });
}

function renderAll() {
  if (!CP.state()) {
    updateSplash();
    return;
  }
  showScreen('game');
  renderTop();
  renderStage();
  renderModal();
  renderToasts();
  if (guide && guide.shouldStart()) {
    setTimeout(() => guide.start(), 80);
  }
}

function render() {
  renderTop();
  renderStage();
  renderModal();
  renderToasts();
  if (guide && guide.shouldStart()) {
    setTimeout(() => guide.start(), 80);
  }
}

/* ---------- 存档管理与多槽位备份模态窗 (Round 1) ---------- */
function copyToClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  if (typeof document === 'undefined') return;
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(ta);
}

function downloadSaveFile(slotIdx) {
  const sm = CP.saveManager;
  if (!sm) return;
  const exp = sm.exportSlot(slotIdx);
  if (!exp.ok) {
    toast(exp.error || '当前槽位为空，无法下载');
    return;
  }
  if (typeof Blob === 'undefined' || typeof URL === 'undefined' || typeof document === 'undefined') return;
  const blob = new Blob([exp.json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = exp.filename || `chinese_parents_slot_${slotIdx + 1}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast(`已下载槽位 ${slotIdx + 1} 存档文件！`);
}

function openSaveModal() {
  sound.click();
  const m = $('#save-modal');
  if (!m) return;
  m.hidden = false;
  m.classList.remove('hidden');
  const importPanel = $('#save-import-panel');
  if (importPanel) importPanel.hidden = true;
  renderSaveSlots();
}

function closeSaveModal() {
  const m = $('#save-modal');
  if (!m) return;
  m.hidden = true;
  m.classList.add('hidden');
}

function renderSaveSlots() {
  const container = $('#save-slots-container');
  if (!container) return;
  container.innerHTML = '';

  const sm = CP.saveManager;
  if (!sm) return;
  const activeIdx = sm.getActiveSlot();
  const badge = $('#save-active-badge');
  if (badge) badge.textContent = '当前游玩：槽位 ' + (activeIdx + 1);

  const slots = sm.listSlots();
  slots.forEach((sl, idx) => {
    const card = h('div', 'slot-card' + (sl.active ? ' active' : ''));
    
    // Header
    const head = h('div', 'slot-head');
    const titleRow = h('div', 'slot-title-row');
    titleRow.innerHTML = `<b class="slot-num-title">槽位 ${idx + 1}</b>` + 
      (sl.active ? `<span class="slot-active-tag">进行中</span>` : '');
    const timeSpan = h('span', 'slot-time');
    timeSpan.textContent = sl.savedAt ? new Date(sl.savedAt).toLocaleString() : (sl.empty ? '未开启' : '已归档');
    head.appendChild(titleRow);
    head.appendChild(timeSpan);
    card.appendChild(head);

    // Body
    const body = h('div', 'slot-body');
    if (sl.empty) {
      body.innerHTML = `
        <div class="slot-empty-wrap">
          <span class="slot-empty-icon">📭</span>
          <span class="slot-empty-text">虚位以待 · 尚未开启此人生历程</span>
        </div>
      `;
    } else {
      const genderIco = sl.gender === 'girl' ? '👧 女' : '👦 男';
      const detailStr = `第 <b>${sl.gen}</b> 代 · 「<b>${sl.name}</b>」 (${genderIco}) · <b>${sl.phase}</b> (第${sl.turn}回合·${sl.age}岁)`;
      const famStr = `📜 家族已历 <b>${sl.familyGen}</b> 代 · 家族特长 <b>${sl.familyTalents}</b> 项 · 门第 Tier <b>${sl.familyTier}</b>`;
      body.innerHTML = `
        <div class="slot-desc-main">${detailStr}</div>
        <div class="slot-desc-sub">${famStr}</div>
      `;
    }
    card.appendChild(body);

    // Actions
    const actions = h('div', 'slot-actions');
    if (sl.active) {
      const activeBtn = h('button', 'btn small ghost disabled', '⭐ 当前正在游玩');
      activeBtn.disabled = true;
      actions.appendChild(activeBtn);
    } else if (!sl.empty) {
      const loadBtn = h('button', 'btn small primary', '🎮 载入此槽位');
      loadBtn.onclick = () => {
        sound.win();
        const res = sm.switchSlot(idx);
        if (res.ok) {
          toast(`已切换至槽位 ${idx + 1}！`);
          closeSaveModal();
          renderAll();
        }
      };
      actions.appendChild(loadBtn);
    } else {
      const startBtn = h('button', 'btn small primary', '🎒 开启新人生');
      startBtn.onclick = () => {
        sound.pop();
        sm.switchSlot(idx);
        toast(`已在槽位 ${idx + 1} 开启全新世代！`);
        closeSaveModal();
        renderAll();
      };
      actions.appendChild(startBtn);
    }

    if (!sl.empty) {
      const exportBtn = h('button', 'btn small ghost', '📋 导出备份');
      exportBtn.onclick = () => {
        const exp = sm.exportSlot(idx);
        if (exp.ok) {
          copyToClipboard(exp.base64);
          toast(`已复制槽位 ${idx + 1} 的 Base64 存档码至剪贴板！`);
        } else {
          toast(exp.error || '导出失败');
        }
      };
      actions.appendChild(exportBtn);

      const clearBtn = h('button', 'btn small danger', '🗑️ 清空');
      clearBtn.onclick = () => {
        if (confirm(`确定要清空【槽位 ${idx + 1}】的存档与全部家族数据吗？此操作不可逆！`)) {
          sound.fail();
          sm.clearSlot(idx);
          toast(`已清空槽位 ${idx + 1}`);
          renderSaveSlots();
          if (idx === activeIdx) {
            renderAll();
          }
        }
      };
      actions.appendChild(clearBtn);
    }

    card.appendChild(actions);
    container.appendChild(card);
  });
}

/* ---------- 初始化绑定 ---------- */
function init() {
  sound.updateBtn();
  const soundBtn = $('#sound-btn');
  if (soundBtn) soundBtn.onclick = () => sound.toggle();
  const splashSoundBtn = $('#splash-sound-btn');
  if (splashSoundBtn) splashSoundBtn.onclick = () => sound.toggle();

  guide.init();
  const guideBtn = $('#guide-btn');
  if (guideBtn) guideBtn.onclick = () => openManual();
  const splashGuideBtn = $('#splash-guide-btn');
  if (splashGuideBtn) splashGuideBtn.onclick = () => openManual();

  const manualClose = $('#manual-close');
  if (manualClose) manualClose.onclick = () => closeManual();

  const manualConfirm = $('#manual-confirm');
  if (manualConfirm) manualConfirm.onclick = () => closeManual();

  const manualReplay = $('#manual-replay-guide');
  if (manualReplay) {
    manualReplay.onclick = () => {
      closeManual();
      setTab('plan');
      guide.start(true);
    };
  }

  $('#btn-new').onclick = () => {
    sound.pop();
    const existing = CP.saveInfo();
    if (existing) {
      if (confirm('检测到已有第 ' + existing.gen + ' 代的成长存档，开启新的一代将重置本代进度。确定开启吗？')) {
        localStorage.removeItem('cph_guide_done');
        CP.restartLineage();
        renderAll();
      }
    } else {
      localStorage.removeItem('cph_guide_done');
      CP.restartLineage();
      renderAll();
    }
  };

  $('#btn-continue').onclick = () => {
    sound.click();
    if (CP.resume()) {
      renderAll();
    } else {
      toast('暂无可恢复的有效存档');
      updateSplash();
    }
  };

  document.querySelectorAll('#tabs button').forEach(b => {
    b.onclick = () => setTab(b.dataset.tab);
  });

  const changelogBtn = $('#changelog-btn');
  if (changelogBtn) changelogBtn.onclick = () => openChangelogModal(false);
  const splashChangelogBtn = $('#splash-changelog-btn');
  if (splashChangelogBtn) splashChangelogBtn.onclick = () => openChangelogModal(false);

  const changelogClose = $('#changelog-close');
  if (changelogClose) changelogClose.onclick = () => closeChangelogModal();

  const changelogConfirm = $('#changelog-confirm');
  if (changelogConfirm) changelogConfirm.onclick = () => closeChangelogModal();

  const changelogModal = $('#changelog-modal');
  if (changelogModal) {
    changelogModal.onclick = (e) => {
      if (e.target === changelogModal) closeChangelogModal();
    };
  }

  const splashVer = $('#splash-ver-badge');
  if (splashVer) splashVer.onclick = () => openChangelogModal(false);

  // 存档管理弹窗绑定
  const saveBtn = $('#save-btn');
  if (saveBtn) saveBtn.onclick = () => openSaveModal();
  const splashSaveBtn = $('#splash-save-btn');
  if (splashSaveBtn) splashSaveBtn.onclick = () => openSaveModal();
  const splashSaveManageBtn = $('#splash-save-manage-btn');
  if (splashSaveManageBtn) splashSaveManageBtn.onclick = () => openSaveModal();

  const saveClose = $('#save-close');
  if (saveClose) saveClose.onclick = () => closeSaveModal();
  const saveConfirmClose = $('#save-confirm-close');
  if (saveConfirmClose) saveConfirmClose.onclick = () => closeSaveModal();

  const saveModal = $('#save-modal');
  if (saveModal) {
    saveModal.onclick = (e) => {
      if (e.target === saveModal) closeSaveModal();
    };
  }

  // 快捷导出当前槽位码
  const btnExportCode = $('#btn-export-code');
  if (btnExportCode) {
    btnExportCode.onclick = () => {
      const activeIdx = CP.saveManager.getActiveSlot();
      const exp = CP.saveManager.exportSlot(activeIdx);
      if (exp.ok) {
        copyToClipboard(exp.base64);
        toast(`已复制当前【槽位 ${activeIdx + 1}】的存档码至剪贴板！`);
      } else {
        toast(exp.error || '当前槽位为空');
      }
    };
  }

  // 下载当前槽位文件
  const btnExportFile = $('#btn-export-file');
  if (btnExportFile) {
    btnExportFile.onclick = () => {
      downloadSaveFile(CP.saveManager.getActiveSlot());
    };
  }

  // 展开导入面板
  const btnOpenImport = $('#btn-open-import');
  const importPanel = $('#save-import-panel');
  if (btnOpenImport && importPanel) {
    btnOpenImport.onclick = () => {
      importPanel.hidden = !importPanel.hidden;
    };
  }
  const btnCancelImport = $('#btn-cancel-import');
  if (btnCancelImport && importPanel) {
    btnCancelImport.onclick = () => {
      importPanel.hidden = true;
    };
  }

  // 确认导入
  const btnConfirmImport = $('#btn-confirm-import');
  if (btnConfirmImport) {
    btnConfirmImport.onclick = () => {
      const ta = $('#save-import-text');
      const text = ta ? ta.value : '';
      const targetSelect = $('#save-import-target-slot');
      const targetSlot = targetSelect ? parseInt(targetSelect.value, 10) : 0;
      if (!text || !text.trim()) {
        toast('请先粘贴存档码或选择本地文件');
        return;
      }
      const res = CP.saveManager.importSlot(text, targetSlot);
      if (res.ok) {
        sound.win();
        toast(`🎉 成功导入至【槽位 ${targetSlot + 1}】(${res.summary.name || '已恢复'})！`);
        if (ta) ta.value = '';
        if (importPanel) importPanel.hidden = true;
        renderSaveSlots();
        if (targetSlot === CP.saveManager.getActiveSlot()) {
          renderAll();
        }
      } else {
        sound.fail();
        alert(res.error || '导入失败，请检查数据完整性');
      }
    };
  }

  // 本地文件选择
  const fileInput = $('#save-file-input');
  if (fileInput) {
    fileInput.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target.result;
        const ta = $('#save-import-text');
        if (ta) ta.value = content;
        toast(`已读取文件：${file.name}，请选择目标槽位并点击“确认载入”！`);
      };
      reader.readAsText(file);
    };
  }

  // 检查新版本公告并自愈呈现
  checkChangelogNotice();

  // 检查是否有存档可自动恢复
  if (CP.resume()) {
    renderAll();
  } else {
    updateSplash();
  }
}

global.UI = {
  renderTop,
  renderPhaseTransition,
  showReport,
  renderModal,
  renderAll,
  openWishModal,
  openChangelogModal,
  closeChangelogModal,
  checkChangelogNotice,
  openSaveModal,
  closeSaveModal,
  renderSaveSlots,
  renderAtlas,
  setAtlasTab,
  setTab,
  init
};
document.addEventListener('DOMContentLoaded', init);
})(typeof window !== 'undefined' ? window : globalThis);