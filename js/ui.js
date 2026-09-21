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
  wrap.appendChild(h('div', 'hint', '📌 优先翻开💡灯泡攒悟性；🗝️钥匙能直通下一层并回复 50 行动力；💥炸弹连环爆破周边格子！'));
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
}

function renderToasts() {
  const s = CP.state();
  if (!s) return;
  let box = $('#toasts');
  box.innerHTML = '';
  s.toasts.slice().reverse().forEach(t => {
    const d = h('div', 'toast', t);
    box.appendChild(d);
    setTimeout(() => d.classList.add('out'), 2200);
    setTimeout(() => d.remove(), 2600);
  });
}

function toast(m) {
  const s = CP.state();
  if (!s) return;
  s.toasts.push(m);
  if (s.toasts.length > 4) s.toasts.shift();
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

/* ---------- 世代终章大屏展示 ---------- */
function showReport(p) {
  showScreen('report');
  sound.win();
  const info = CP.info();
  const fam = CP.fam();
  const s = CP.state();

  $('#rep-title').textContent = '第 ' + (info ? info.gen : 1) + ' 代 · 人生功绩录';
  $('#rep-sub').textContent = '「' + (info ? info.name : '孩子') + '」的人生旅程已圆满落幕';

  const job = (s && s.job) ? s.job : { n: '自由职业者', icon: '🛋️', t: 0 };
  const tierDesc = ['工薪起步', '温饱无忧', '小康之家', '中产体面', '高薪优渥', '领军精英'][job.t || 0];

  $('#rep-profile').innerHTML =
    '<h4>👤 个人生平</h4>' +
    '<p>姓名: <b>' + (info ? info.name : '') + '</b> (' + (info && info.gender === 'girl' ? '女儿' : '儿子') + ')</p>' +
    '<p>最终职业: <b>' + job.icon + ' ' + (job.n || job.name || '自由职业') + '</b> (' + tierDesc + ')</p>' +
    '<p>积攒积蓄: <b>' + (info ? info.money : 0) + '</b> 元 · 最终面子: <b>' + (info ? info.face : 0) + '</b></p>';

  $('#rep-highlights').innerHTML =
    '<h4>🎓 关键履历</h4>' +
    '<p>高考战绩: <b>' + (s && s.gaokaoScore ? s.gaokaoScore + ' 分' : '特长直录 / 保送') + '</b></p>' +
    '<p>婚姻伴侣: <b>' + ((s && s.spouse) ? s.spouse.name : '独善其身 (单身潇洒)') + '</b></p>' +
    '<p>本代特长收集: <b>' + (s && s.talents ? s.talents.length : 0) + '</b> 个</p>';

  $('#rep-inheritance').innerHTML =
    '<h4>🧬 家族传承与遗产</h4>' +
    '<p>家族图鉴总计: <b>' + (fam.atlas ? fam.atlas.length : 0) + '</b> 个特长</p>' +
    '<p>后代天赋继承: 每回合属性额外加成 <b>+' + (fam.talent || 0) + '</b></p>' +
    '<p>后代先天底蕴: 继承前代五维约 18% 遗传点数</p>';

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
}

function render() {
  renderTop();
  renderStage();
  renderModal();
  renderToasts();
}

/* ---------- 初始化绑定 ---------- */
function init() {
  sound.updateBtn();
  $('#sound-btn').onclick = () => sound.toggle();

  $('#btn-new').onclick = () => {
    sound.pop();
    const existing = CP.saveInfo();
    if (existing) {
      if (confirm('检测到已有第 ' + existing.gen + ' 代的成长存档，开启新的一代将重置本代进度。确定开启吗？')) {
        CP.restartLineage();
        renderAll();
      }
    } else {
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

document.addEventListener('DOMContentLoaded', init);
})(typeof window !== 'undefined' ? window : globalThis);