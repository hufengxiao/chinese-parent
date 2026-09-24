/* ============================================================
 * 中国式家长 H5 — 界面层 (依赖 core.js 的 CP 与 data.js 的 DATA)
 * ============================================================ */
'use strict';
(function (global) {
const CP = global.CP;
const D = global.DATA;
const $ = s => document.querySelector(s);
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.innerHTML = x; return e; };

let ACTIVE = 'plan';
const RARE_CN = { 1: '普通', 2: '稀有', 3: '史诗', 4: '传说' };

/* ---------- 音效系统 (WebAudio 原生免外部文件合成) ---------- */
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('cph_mute') === '1';
    this.updateBtn();
  }
  init() {
    if (!this.ctx && typeof AudioContext !== 'undefined') {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
  }
  toggle() {
    this.muted = !this.muted;
    localStorage.setItem('cph_mute', this.muted ? '1' : '0');
    this.updateBtn();
    if (!this.muted) this.playTone(523, 0.08, 'sine');
  }
  updateBtn() {
    const btn = $('#sound-btn');
    if (btn) btn.textContent = this.muted ? '🔇' : '🔊';
  }
  playTone(freq, duration = 0.1, type = 'sine', decay = 0.05) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const ctx = this.ctx;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch(e) {}
  }
  click() { this.playTone(600, 0.04, 'sine'); }
  pop() { this.playTone(850, 0.06, 'triangle'); }
  coin() {
    this.playTone(987, 0.08, 'sine');
    setTimeout(() => this.playTone(1318, 0.12, 'sine'), 60);
  }
  brain() {
    this.playTone(520, 0.06, 'sine');
    setTimeout(() => this.playTone(1040, 0.09, 'sine'), 50);
  }
  win() {
    [523, 659, 783, 1046].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 0.15, 'triangle'), idx * 80);
    });
  }
  fail() {
    [400, 340, 280].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 0.12, 'sawtooth'), idx * 90);
    });
  }
}
const sound = new SoundManager();

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
  $('#topbar').innerHTML =
    '<span class="gen-tag">第' + i.gen + '代 ' + genderIcon + i.name + '</span>' +
    '<span class="chip">📅 回合' + i.turn + ' · ' + i.age + '岁 · ' + i.phase + '</span>' +
    '<span class="chip" title="面子">⭐面子<b>' + i.face + '</b></span>' +
    '<span class="chip" title="行动力">⚡行动<b>' + i.act + '</b></span>' +
    '<span class="chip" title="零花钱">💰零钱<b>' + i.money + '</b></span>' +
    '<span class="chip" title="悟性">💡悟性<b>' + i.insight + '</b></span>';
  
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
function renderPlan() {
  const st = $('#stage');
  st.innerHTML = '';
  const wrap = h('div');

  const titleRow = h('div', 'flex-between');
  titleRow.appendChild(h('h3', '', '📅 今日安排 (挑选6件事)'));
  const quickActions = h('div', 'slot-actions');
  const autoBtn = h('button', 'mini-btn', '⚡ 自动排满');
  autoBtn.onclick = () => { sound.pop(); CP.autoFillSlots(); render(); };
  const clearBtn = h('button', 'mini-btn ghost', '🧹 清空');
  clearBtn.onclick = () => { sound.click(); CP.clearSlots(); render(); };
  quickActions.appendChild(autoBtn);
  quickActions.appendChild(clearBtn);
  titleRow.appendChild(quickActions);
  wrap.appendChild(titleRow);

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
function renderBrain() {
  const st = $('#stage');
  st.innerHTML = '';
  const b = CP.brain.info();
  const wrap = h('div');
  wrap.appendChild(h('div', 'pool-cat', '🧠 脑洞挖掘 — 第 ' + b.layer + ' 层 · 已翻 ' + b.open + '/' + b.total + ' · 每格消耗 2⚡'));
  const grid = h('div');
  grid.id = 'brain-grid';
  CP.brain.grid().forEach((c, i) => {
    const cell = h('div', 'cell' + (c.open ? ' open' : ''));
    cell.textContent = c.open ? ({ bulb: '💡', attr: '🔮', bolt: '⚡', bomb: '💥', skull: '💀', gold: '💰', key: '🗝️', duck: '🦆' })[c.t] : '?';
    cell.onclick = () => {
      const r = CP.brain.rev(i);
      if (r != null) {
        sound.brain();
        toast(r);
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
  wrap.appendChild(h('div', 'pool-cat', '👥 同学往来 (初中及以上开放互动)'));
  const list = CP.social();
  if (!list.length) {
    wrap.appendChild(h('div', 'hint', '当前阶段大家都在忙着上课，还没有能深入互动的同学。'));
  } else {
    list.forEach(n => {
      const d = h('div', 'card npc-card');
      d.innerHTML = '<span class="av">' + n.icon + '</span>' +
        '<span class="npc-body"><span class="nm">' + n.name + '</span> <span class="af">好感度 ' + n.aff + '</span><br><span class="small">' + n.intro + '</span></span>' +
        '<span class="heart-bar">' + (n.aff >= 60 ? '💖' : n.aff >= 30 ? '💛' : '🤍') + '</span>' +
        '<span class="btns"><button class="sub-btn" data-c="' + n.id + '">💬 聊天(-3⚡)</button>' +
        '<button class="sub-btn" data-g="' + n.id + '">🎁 送礼(-25¥)</button></span>';
      d.querySelector('[data-c]').onclick = () => {
        sound.click();
        const g = CP.chat(n.id);
        if (g != null) toast('和 ' + n.name + ' 聊得很投机，好感+' + g);
        render();
      };
      d.querySelector('[data-g]').onclick = () => {
        sound.coin();
        const g = CP.gift(n.id);
        if (g != null) toast('送了 ' + n.name + ' 一份小礼物，好感+' + g);
        render();
      };
      wrap.appendChild(d);
    });
  }
  wrap.appendChild(h('div', 'hint', '好感到 60 以上，大学成家阶段将有机会携手一生，为下一代带来更高的先天遗传！'));
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
      '<span class="s-info"><span class="s-name">' + it.n + '</span><br><span class="s-desc">' + (it.eff ? niceEff(it.eff) : '') + '</span></span>' +
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
  wrap.appendChild(h('div', 'hint', '零花钱自小学阶段开始发放。想要更高品质的大件物品，可在「日程」里向爸妈提出索取。'));
  st.appendChild(wrap);
}

/* ---------- 图鉴 ---------- */
function renderAtlas() {
  const st = $('#stage');
  st.innerHTML = '';
  const wrap = h('div');
  const a = CP.atlas();
  const fam = CP.fam();
  const tierNames = ['白手起家', '温饱家庭', '小康之家', '中产家庭', '高收入阶层', '社会领军精英'];

  wrap.appendChild(h('div', 'card fam-stat-card', '<b>📜 家族档案簿</b><br>' +
    '<div class="fam-details">' +
    '<span>已结算世代: 第 <b>' + (fam.g || 0) + '</b> 代</span><br>' +
    '<span>家族特长图鉴: <b>' + (fam.atlas ? fam.atlas.length : 0) + '</b> 个</span><br>' +
    '<span>家族底蕴加成: 先天属性 +<b>' + (fam.talent || 0) + '</b></span><br>' +
    '<span>当前门第阶层: <b>' + (tierNames[fam.tier || 0] || '工薪') + '</b></span>' +
    '</div>'));

  wrap.appendChild(h('div', 'pool-cat', '🏆 本代特长收录 (' + a.total + ' 个)' + (a.stats[4] ? ' · 🌟 包含传说特长!' : '')));
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

/* ---------- 初始化绑定 ---------- */
function init() {
  sound.updateBtn();
  $('#sound-btn').onclick = () => sound.toggle();

  guide.init();
  const guideBtn = $('#guide-btn');
  if (guideBtn) guideBtn.onclick = () => openManual();

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

  // 检查是否有存档可自动恢复
  if (CP.resume()) {
    renderAll();
  } else {
    updateSplash();
  }
}

global.UI = { renderPhaseTransition, showReport, renderModal, renderAll, init };
document.addEventListener('DOMContentLoaded', init);
})(typeof window !== 'undefined' ? window : globalThis);