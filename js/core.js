/* ============================================================
 * 中国式家长 H5 — 核心逻辑(无 DOM 依赖,可 headless 测试)
 * 对外暴露: window.CP
 * 状态字段: attrs 五维+cha / insight悟性 / act行动 / money零钱
 *           face面子 / sat满意度 / stress压力 / shadow心理阴影
 *           skills={课程:等级} talents=[特长id] npcAff={好感}
 * ============================================================ */
'use strict';
(function (global) {
const D = global.DATA;
const RI = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const ATTRS = ['iq', 'eq', 'mem', 'img', 'phy', 'cha'];
const ANAME = { iq: '智商', eq: '情商', mem: '记忆力', img: '想象力', phy: '体魄', cha: '魅力' };
const RARE_CN = { 1: '普通', 2: '稀有', 3: '史诗', 4: '传说' };
const RATK = { 1: 7, 2: 49, 3: 343, 4: 2401 };

const LS = (typeof localStorage !== 'undefined') ? localStorage : null;
let S = null;

/* ---------- 工具 ---------- */
function effText(e) {
  if (!e) return '';
  const out = [];
  ATTRS.forEach(k => { if (e[k]) out.push(ANAME[k] + (e[k] > 0 ? '+' : '') + e[k]); });
  const nm = { insight: '悟性', act: '行动', money: '零钱', face: '面子', sat: '满意度', stress: '压力', shadow: '阴影' };
  ['insight', 'act', 'money', 'face', 'sat', 'stress', 'shadow'].forEach(k => { if (e[k]) out.push(nm[k] + (e[k] > 0 ? '+' : '') + e[k]); });
  if (e.exam) out.push('考分+' + e.exam);
  return out.join(' ');
}
function log(m) { S.log.unshift(m); if (S.log.length > 60) S.log.pop(); }
function toast(m) { S.toasts.push(m); if (S.toasts.length > 4) S.toasts.shift(); }
function applyEff(e) {
  if (!e) return;
  ATTRS.forEach(k => { if (e[k]) S.attrs[k] += e[k]; });
  ['insight', 'act', 'money', 'face'].forEach(k => { if (e[k]) S[k] = Math.max(0, S[k] + e[k]); });
  if (e.stress) S.stress = clamp(S.stress + e.stress, 0, 200);
  if (e.sat) S.sat = clamp(S.sat + e.sat, 0, 140);
  if (e.shadow) S.shadow = Math.max(0, S.shadow + e.shadow);
  if (e.exam) S.exambuff = clamp((S.exambuff || 0) + e.exam, 0, 200);
}
function phaseOf(t) {
  t = t || (S ? S.turn : 1);
  if (t <= 8) return 'baby';
  if (t <= 14) return 'kinder';
  if (t <= 24) return 'pri';
  if (t <= 32) return 'junior';
  if (t <= 44) return 'senior';
  if (t <= 50) return 'college';
  if (t <= 57) return 'work';
  return 'home';
}
const PHASE_CN = { baby: '婴儿期', kinder: '幼儿园', pri: '小学', junior: '初中', senior: '高中', college: '大学', work: '工作', home: '成家后' };
const PHASE_TIPS = {
  kinder: '新课程解锁,还能参加选秀、抢红包。',
  pri: '零花钱发放! 商店开张,期末考来了。',
  junior: '科目变多,中考倒计时。试着和同学走近一点?',
  senior: '大战前的宁静。冲刺高考吧!',
  college: '大学自由了,但也要为将来做打算。',
  work: '上班了! 没想到吧,人生才刚刚开始。',
  home: '成家之年——找个伴吧!',
};
function ageOf(t) {
  t = t || (S ? S.turn : 1);
  const base = { baby: 0, kinder: 3, pri: 6, junior: 12, senior: 15, college: 18, work: 23, home: 30 }[phaseOf(t)];
  return base + Math.min(9, Math.floor((t - 1) / 12));
}
function cls() { return phaseOf(); }

/* ---------- 存档 ---------- */
function persist() {
  if (!LS || !S) return;
  const p = S.pending; S.pending = [];
  try { LS.setItem('cph_save', JSON.stringify(S)); } catch (e) {}
  S.pending = p;
}
function loadSave() { if (!LS) return null; try { return JSON.parse(LS.getItem('cph_save')); } catch (e) { return null; } }
function loadFam() { if (!LS) return null; try { return JSON.parse(LS.getItem('cph_fam')); } catch (e) { return null; } }
function saveFam(f) { if (LS) LS.setItem('cph_fam', JSON.stringify(f)); }
function save() { persist(); }
function pendHongbao() {
  S.pending.push({ type: 'mini_hb', title: '🧧 过年收红包', body: '七大姑八大姨的红包一股脑递过来,爸妈在旁边疯狂推辞——', opts: [
    { label: '大方接下左袋(100-200元)' },
    { label: '眼疾手快抢右袋(100-220元)' },
    { label: '懂事地上缴给爸妈(面子+15)' },
  ] });
}

/* ---------- 开局 ---------- */
function newGame() {
  const fam = loadFam() || { g: 0, talent: 0, tier: 0, attr: {}, atlas: [] };
  S = {
    ver: 1, gen: fam.g + 1, fam,
    name: pick(['小强', '安安', '小满', '小龙', '豆豆', '妙妙', '铁蛋', '糖糖']),
    gender: Math.random() < 0.45 ? 'girl' : 'boy',
    turn: 1,
    attrs: { iq: RI(5, 9), eq: RI(5, 9), mem: RI(5, 9), img: RI(5, 9), phy: RI(5, 9), cha: RI(2, 5) },
    insight: 15, act: 100, money: 30,
    face: 15 + fam.tier * 25, sat: 62, stress: 0, shadow: 0,
    exambuff: 0, workSalary: 0, job: null, uniTier: 0, gaokaoScore: 0,
    skills: {}, slots: new Array(6).fill(null),
    npcAff: {}, lover: null, spouse: null,
    talents: (fam.atlas || []).slice(0, fam.talent),
    flags: {}, used: {},
    pending: [], log: [], toasts: [],
  };
  if (fam.g > 0) {
    ATTRS.forEach(k => { S.attrs[k] += Math.round(((fam.attr && fam.attr[k]) || 0) * 0.18) + (fam.talent || 0); });
  }
  S.act = 100;
  S.pending.push({ type: 'intro', title: '第' + S.gen + '代 · 出生', body: '你出生在一个普通中国家庭,爸妈起名「' + S.name + '」。\n\n每个回合:挖脑洞攒悟性 → 安排 6 件事(学习/娱乐/打工/社交) → 考试、选秀、面子,一路卷到高考。\n' + (fam.g > 0 ? '上一代的积累让你出生自带天赋 +' + fam.talent + '。' : '白手起家,加油!'), opts: ['开始成长'] });
  captureTurnStart();
  persist();
}
function resume() {
  const s = loadSave();
  if (s && s.ver) {
    S = s;
    if (!S.turnStart) captureTurnStart();
    return true;
  }
  return false;
}
function resetAll() { if (LS) LS.removeItem('cph_save'); S = null; }
function restartLineage() { if (LS) LS.removeItem('cph_fam'); resetAll(); newGame(); }

function captureTurnStart() {
  if (!S) return;
  S.turnStart = {
    attrs: { ...S.attrs },
    insight: S.insight,
    act: S.act,
    money: S.money,
    sat: S.sat,
    stress: S.stress,
    shadow: S.shadow,
    skills: { ...S.skills },
    flags: { ...S.flags },
    talents: [...(S.talents || [])],
  };
}

function restoreTurnStart() {
  if (!S || !S.turnStart) return;
  const ts = S.turnStart;
  S.attrs = { ...ts.attrs };
  S.insight = ts.insight;
  S.act = ts.act;
  S.money = ts.money;
  S.sat = ts.sat;
  S.stress = ts.stress;
  S.shadow = ts.shadow;
  S.skills = { ...ts.skills };
  S.flags = { ...ts.flags };
  S.talents = [...ts.talents];
}

function clearSlots() {
  if (!S) return;
  restoreTurnStart();
  S.slots = new Array(6).fill(null);
  persist();
}

function removeSlot(idx) {
  if (!S || idx < 0 || idx >= 6 || !S.slots[idx]) return false;
  const preserved = S.slots.filter((s, i) => i !== idx && s != null);
  restoreTurnStart();
  S.slots = new Array(6).fill(null);
  for (const s of preserved) {
    const pl = pool();
    const item = pl.find(x => x.kind === s.kind && x.id === s.id);
    if (item && !item.locked) {
      addSlot(item);
    }
  }
  persist();
  return true;
}

function autoFillSlots() {
  if (!S) return;
  let guard = 0;
  while (S.slots.some(x => !x) && guard++ < 12) {
    const pl = pool().filter(x => !x.locked);
    if (!pl.length) break;
    let choice = null;
    if (S.stress > 65) {
      choice = pl.find(x => x.tone === 'rest') || pl.find(x => x.tone === 'play');
    } else if (S.insight >= 15) {
      choice = pl.find(x => x.tone === 'course') || pl.find(x => x.tone === 'play');
    }
    if (!choice) choice = pl.find(x => x.tone === 'course') || pl.find(x => x.tone === 'rest') || pl[0];
    if (!choice || !addSlot(choice)) {
      const restItem = pl.find(x => x.tone === 'rest');
      if (restItem) addSlot(restItem);
      else break;
    }
  }
  persist();
}

function saveInfo() {
  const s = loadSave();
  if (s && s.ver && s.turn) {
    return {
      gen: s.gen || 1,
      turn: s.turn,
      age: ageOf(s.turn),
      name: s.name || '孩子',
      phase: PHASE_CN[phaseOf(s.turn)] || '成长中'
    };
  }
  return null;
}

/* ---------- 行动池 ---------- */
function insCost(c, lvl) {
  const base = 10 + lvl * lvl * 2.5;
  const dis = clamp(S.attrs[c.main || 'iq'] * 0.002, 0, 0.5);
  return Math.max(3, Math.round(base * (1 - dis)));
}
function pool() {
  const ph = cls(), out = [];
  D.courses.forEach(c => {
    if (c.phase !== ph) return;
    if (c.begOnly && !S.flags[c.id]) return;
    const lvl = S.skills[c.id] || 0;
    if (lvl >= 5) return;
    const ic = insCost(c, lvl);
    out.push({ kind: 'learn', id: c.id, name: c.name, icon: c.icon, desc: '课业 ' + lvl + '/5' + (c.ex ? ' ·学科' : ''), act: 3, extra: ic + '悟性', locked: S.insight < ic, money: c.money || 0, tone: 'course' });
  });
  const okPlay = p =>
    p.phase === ph ||
    (p.phase === 'college' && ph === 'college') ||
    (p.phase === 'pri' && ph === 'college' && (p.id === 'pl-games' || p.id === 'pl-janghu'));
  D.plays.forEach(p => { if (okPlay(p)) out.push({ kind: 'play', id: p.id, name: p.name, icon: p.icon, desc: effText({ stress: p.stress, sat: p.sat, ...p.attr }) || '只是放松', act: 2, extra: '', locked: false, money: p.money || 0, tone: 'play' }); });
  D.payjobs.forEach(pj => { if (pj.phase === ph) out.push({ kind: 'pay', id: pj.id, name: pj.name, icon: pj.icon, desc: '赚 ' + pj.money + ' 元', act: 3, extra: '', locked: false, money: 0, tone: 'job' }); });
  if (ph !== 'baby') D.begs.forEach(b => {
    if (S.flags['beg_' + b.id]) return;
    const reqFace = b.face || 0;
    const reqSat = b.sat || 0;
    const ok = S.face >= reqFace && S.sat >= reqSat;
    out.push({ kind: 'beg', id: b.id, name: '跟爸妈要「' + b.n + '」', icon: b.icon, desc: (b.desc || '') + ' · 成功率' + Math.round(b.w * 100) + '%', act: 2, extra: '需面子' + reqFace + (reqSat ? ' 满意' + reqSat : ''), locked: !ok, money: 0, tone: 'beg' });
  });
  out.push({ kind: 'rest', id: 'rest', name: '好好睡一觉', icon: '💤', desc: '行动+30 减压', act: 0, extra: '', locked: false, money: 0, tone: 'rest' });
  return out;
}
function addSlot(pi) {
  const idx = S.slots.findIndex(x => !x);
  if (idx < 0) { toast('六件事排满了,过回合吧'); return false; }
  if (S.act < pi.act) { toast('行动力不足'); return false; }
  if (pi.money && S.money < pi.money) { toast('零花钱不够'); return false; }
  S.slots[idx] = { kind: pi.kind, id: pi.id };
  S.act -= pi.act;
  applyAct(pi);
  persist();
  return true;
}
function applyAct(pi) {
  if (pi.kind === 'learn') {
    const c = D.courses.find(x => x.id === pi.id);
    const lvl = S.skills[c.id] || 0;
    S.insight -= insCost(c, lvl);
    ATTRS.forEach(k => { if (c.attr && c.attr[k]) S.attrs[k] = Math.max(0, S.attrs[k] + c.attr[k]); });
    S.sat = clamp(S.sat + (c.sat || 2), 0, 140);
    S.stress = clamp(S.stress + (c.stress || 4), 0, 200);
    if (c.money) S.money = Math.max(0, S.money - c.money);
    S.skills[c.id] = lvl + 1;
    log('学了「' + c.name + '」 Lv' + (lvl + 1));
    if (c.tal && lvl + 1 >= 4) rollTalent(pi.talId || c.tal.id, c.tal.p || 0.15);
    if (c.tal && lvl + 1 === 5) rollTalent(c.tal.id, 1);
  } else if (pi.kind === 'play') {
    const p = D.plays.find(x => x.id === pi.id);
    S.stress = clamp(S.stress + (p.stress || 0), 0, 200);
    S.sat = clamp(S.sat + (p.sat || 0), 0, 140);
    ATTRS.forEach(k => { if (p.attr && p.attr[k]) S.attrs[k] += p.attr[k]; });
    if (p.money) S.money = Math.max(0, S.money - p.money);
    if (p.tal && Math.random() < 0.08) rollTalent(p.tal.id, 1);
    log('玩了「' + p.name + '」');
  } else if (pi.kind === 'pay') {
    const pj = D.payjobs.find(x => x.id === pi.id);
    S.money += pj.money;
    ATTRS.forEach(k => { if (pj.attr && pj.attr[k]) S.attrs[k] += pj.attr[k]; });
    log('打工「' + pj.name + '」赚 ' + pj.money + ' 元');
  } else if (pi.kind === 'beg') {
    const b = D.begs.find(x => x.id === pi.id);
    if (b) {
      const ok = Math.random() <= b.w;
      if (ok) {
        S.flags['beg_' + b.id] = 1;
        if (b.eff) applyEff(b.eff);
        if (b.id === 'bg-huanggang') { S.flags['g-huanggang'] = 1; }
        log('爸妈爽快答应了要「' + b.n + '」!');
        toast('🎉 索取成功! 获得「' + b.n + '」');
      } else {
        toast('爸妈和你对视三秒:"前几天不是才买过?"(索取未通过)');
      }
    }
  } else if (pi.kind === 'rest') {
    S.act = clamp(S.act + 30, 0, 240);
    S.stress = clamp(S.stress - 10, 0, 200);
    log('呼呼大睡');
  }
}
function rollTalent(id, p) {
  if (!id || S.talents.indexOf(id) >= 0) return;
  if (Math.random() >= p) return;
  const t = D.talentData.find(x => x.id === id);
  if (!t) return;
  S.talents.push(id);
  S.fam.atlas = S.fam.atlas || [];
  if (S.fam.atlas.indexOf(id) < 0) S.fam.atlas.push(id);
  saveFam(S.fam);
  toast('✨ 特长「' + t.n + '」(' + RARE_CN[t.r] + ')');
  log('获得特长: ' + t.n);
}

/* ---------- 回合结算 ---------- */
function endTurn() {
  if (S.slots.some(x => !x)) return false;
  S.turn++;
  const t = S.turn;
  if (cls() === 'work') S.money += (S.workSalary || 100);
  const mp = moneyLet();
  if (mp > 0) { S.money += mp; log('零花钱 +' + mp); }
  const rests = S.slots.filter(x => x && x.kind === 'rest').length;
  S.act = clamp(S.act + 40 + rests * 10, 10, 240);
  if (S.stress <= 0) { S.act = clamp(S.act + 15, 0, 240); }
  while (S.stress > 100) { S.stress -= 50; S.shadow += 10; toast('压力爆炸…阴影+10'); }
  if (S.sat >= 100) { S.shadow = Math.max(0, S.shadow - 5); S.sat = 100; }
  if (S.sat < 15) { S.sat = 15; S.attrs.iq = Math.max(0, S.attrs.iq - 1); log('被爸妈念了一晚上,智商-1'); }
  if (S.shadow >= 100) {
    S.pending.push({ type: 'collapse', title: ' 💔 BE · 心理崩塌', body: '压力与失望,最终压垮了' + S.name + '。\n\n本代人生草草收场。\n\n愿这些遭遇,不要重演。', opts: ['重新开始'] });
    persist(); return;
  }
  // ---- 固定节点 ----
  if ([7, 13, 21, 27, 35, 39].indexOf(t) >= 0) pendHongbao();
  if (t === 12) pendShow(1, '幼儿园才艺小舞台');
  if (t === 20) pendShow(2, '小学艺术节');
  if (t === 31) pendShow(3, '初中青春汇演');
  if (t === 41) pendShow(4, '高中盛大选秀');
  if (t === 18) pendElection();
  if (t === 24) pendFinal();
  if (t === 32) pendZhongkao();
  if (t === 44) pendGaokao();
  if (t === 28) pendFace(0);
  if (t === 37) pendFace(1);
  if (t === 50) pendCareer();
  if (t === 58) pendMarry();
  if (t === 60) pendEndGen();
  if ([9, 15, 25, 33, 45, 51].indexOf(t) >= 0) {
    S.pending.push({ type: 'news', title: '新阶段', body: PHASE_CN[cls()] + '开始!' + (PHASE_TIPS[cls()] || ''), opts: ['好'] });
  }
  // ---- 随机事件 ----
  if (Math.random() < 0.45) {
    const cands = D.events.filter(e => (e.p || []).indexOf(cls()) >= 0 && !S.used[e.id]);
    if (cands.length) {
      const ev = pick(cands);
      S.used[ev.id] = 1;
      if (ev.type === 'choice') {
        S.pending.push({ type: 'choice', title: ev.n, body: ev.d, opts: ev.opts.map(o => ({ label: o.t, sub: effText(o.e), eff: o.e })) });
      } else {
        applyEff(ev.eff);
        S.pending.push({ type: 'news', title: ev.n, body: ev.d + (effText(ev.eff) ? '\n【' + effText(ev.eff) + '】' : ''), opts: ['好'] });
      }
    }
  }
  S.slots = new Array(6).fill(null);
  captureTurnStart();
  persist();
}
function moneyLet() {
  const ph = cls();
  if (ph === 'baby' || ph === 'kinder' || ph === 'home') return 0;
  if (ph === 'college') return 120 + S.fam.tier * 40;
  if (ph === 'work') return 0; // 走工资
  return 30 + S.fam.tier * 55 + (ph === 'senior' ? 25 : 0);
}

/* ---------- 考试 ---------- */
function subjPts() {
  const pts = { cn: 0, ma: 0, en: 0, sc: 0, so: 0 };
  Object.keys(S.skills).forEach(cid => {
    const c = D.courses.find(x => x.id === cid);
    if (!c || !c.ex) return;
    const L = S.skills[cid];
    if (c.ex === 'all') { pts.cn += L * 10; pts.ma += L * 10; pts.en += L * 10; pts.sc += L * 10; pts.so += L * 10; }
    else if (c.ex === 'all+') { pts.cn += L * 16; pts.ma += L * 16; pts.en += L * 16; pts.sc += L * 16; pts.so += L * 16; }
    else if (pts[c.ex] !== undefined) pts[c.ex] += L;
  });
  return pts;
}
function pendFinal() {
  const p = subjPts();
  const tg = Math.round((p.cn + p.ma + p.en) * 60 + p.sc * 45 + p.so * 40 + (S.attrs.iq + S.attrs.mem) * 3 + S.exambuff * 2);
  const rank = tg < 1200 ? '班级后段' : tg < 2400 ? '中游' : tg < 3800 ? '上游' : '名列前茅';
  const fd = { '班级后段': -10, 中游: 0, 上游: 10, '名列前茅': 20 }[rank];
  S.face = Math.max(0, S.face + fd);
  S.pending.push({ type: 'news', title: '期末考成绩单', body: '总分 ' + tg + ' · ' + rank + '\n面子 ' + (fd >= 0 ? '+' : '') + fd, opts: ['好'] });
}
function pendZhongkao() {
  const p = subjPts();
  const tg = Math.round((p.cn * 55 + p.ma * 55 + p.en * 45 + p.sc * 50 + p.so * 40) + (S.attrs.iq + S.attrs.mem) * 4 + S.exambuff * 3);
  const lvl = tg < 4300 ? '职高' : tg < 6900 ? '普高' : '重点';
  const fb = { 职高: -8, 普高: 5, 重点: 20 }[lvl];
  const bu = { 职高: 150, 普高: 300, 重点: 500 }[lvl];
  S.face = Math.max(0, S.face + fb);
  S.exambuff = clamp((S.exambuff || 0) + bu, 0, 200);
  S.flags.zhongkao = lvl;
  S.pending.push({ type: 'news', title: '中考出分', body: '总分 ' + tg + '\n进了: ' + lvl + (lvl === '重点' ? ' 全家扬眉吐气!' : lvl === '普高' ? ' 爸妈沉默了一下午。' : ' ……没事,人生不止高考。') + '\n高中考分加成: ' + bu, opts: ['好'] });
}
function pendGaokao() {
  const p = subjPts();
  const raw = (p.cn * 60 + p.ma * 60 + p.sc * 55 + p.en * 45 + p.so * 40) + (S.attrs.iq + S.attrs.mem) * 6 + S.exambuff * 12 + S.attrs.img * 3;
  const tg = Math.min(20000, Math.round(raw));
  let band = D.gk[0]; let idx = 0;
  D.gk.forEach((g, i) => { if (tg >= g.min) { band = g; idx = i; } });
  S.gaokaoScore = tg; S.uniTier = idx;
  const fd = [-15, -5, 5, 15, 25, 40][idx];
  S.face = Math.max(0, S.face + fd);
  if (tg >= 19000) rollTalent('gaokao', 1);
  S.pending.push({ type: 'news', title: '高考放榜!!!', body: '总分 ' + tg + ' / 20000\n『' + band.t + '』\n' + (idx >= 4 ? '—— 班主任在群里发了三次红包!' : idx <= 1 ? '—— 年轻人,人生还有很多赛道。' : '—— 还不错,向前看吧。'), opts: ['好'] });
}

/* ---------- 选秀 ---------- */
function pendShow(tier, title) {
  S.pending.push({ type: 'show', tier, title, body: '带上你最拿手的特长登台吧!', lv: tier });
}
function showResult(tier) {
  const mine = bestTalent();
  if (!mine) { S.face = Math.max(0, S.face - 10); return '没有特长可亮相……评委礼貌地请你下台。(面子-10)'; }
  const rivalR = RI(1, 3);
  const rivalN = (D.talentData.filter(t => t.r === rivalR).map(t => '「' + t.n + '」') || ['合唱领唱'])[0] || '合唱领唱';
  const win = mine.r >= rivalR;
  const gi = win ? (tier >= 3 ? 500 : 200) : 40;
  const gf = win ? (tier >= 3 ? 150 : 60) : 10;
  S.insight += gi;
  if (win) S.face += gf; else S.face = Math.max(0, S.face - 5);
  return '你登台「' + mine.n + '」 vs ' + rivalN + '\n' + (win ? '🌱 全场亮灯夺冠!悟性+' + gi + ' 面子+' + gf : '惜败……不过勇气可嘉。悟性+' + gi);
}
function bestTalent() {
  let b = null, br = 0;
  (S.talents || []).forEach(id => { const t = D.talentData.find(x => x.id === id); if (t && t.r > br) { br = t.r; b = t; } });
  return b;
}

/* ---------- 面子对决 ---------- */
function pendFace(n) {
  const opp = D.rivals[n % 4] || pick(D.rivals);
  const mine = bestTalent();
  const myAtk = mine ? RATK[mine.r] : 7;
  const opAtk = n === 1 ? RI(49, 343) : RI(7, 49);
  const logs = [];
  let mh = 400, oh = 400;
  for (let r = 1; r <= 4 && mh > 0 && oh > 0; r++) {
    const d = Math.round(myAtk * (0.9 + Math.random() * 0.4));
    oh -= d;
    logs.push('第' + r + '轮: 你使出「' + (mine ? mine.n : '大嗓门') + '」打掉对方 ' + d + ' 面子');
    if (oh <= 0) break;
    const d2 = Math.round(opAtk * (0.8 + Math.random() * 0.4) * (r === 1 ? 0.5 : 1));
    mh -= d2;
    logs.push('对手回敬「' + opp.l[0] + '」,你掉了 ' + d2 + ' 面子');
  }
  const win = oh <= 0 || mh > oh;
  const gain = win ? 120 : -40;
  S.face = Math.max(0, S.face + gain);
  S.pending.push({ type: 'news', title: '面子对决 vs ' + opp.n, body: '「' + opp.n + '」: 我家孩子 ' + opp.l.join('、') + '!\n\n' + logs.join('\n') + '\n' + (win ? '🎉 大获全胜! 面子+' + gain : '输了半场。妈妈说今晚不吃鸡肉了。面子' + gain), opts: ['好'] });
}

/* ---------- 班干部竞选 ---------- */
function pendElection() {
  S.election = { round: 0, votes: 0 };
  S.pending.push({ type: 'election', title: '班干部竞选', body: '和两个竞争者抢一个劳动委 + 学习委。拉票吧!\n(两轮拉票,票数决定胜负)', opts: ['🤝 辅导同学(eq)', '🎤 才艺展示(qe)', '🍬 请客吃糖(钱-20)'] });
}
function doElection(o) {
  const el = S.election;
  let v = 0;
  if (o === 0) { v = RI(8, 16); S.sat = clamp(S.sat + 4, 0, 140); log('辅导同学做作业,好感上来'); }
  if (o === 1) { v = RI(6, 12) + (bestTalent() ? 4 : 0); }
  if (o === 2) { v = RI(5, 10); S.money = Math.max(0, S.money - 20); S.sat = clamp(S.sat - 3, 0, 140); }
  el.votes += v; el.round++;
  return v;
}
function electionFinish() {
  const need = RI(20, 30);
  const win = S.election.votes >= need;
  S.face = Math.max(0, S.face + (win ? 60 : -10));
  const r = win ? '你当选了!' : '差一点点,下次再来!';
  S.pending.push({ type: 'news', title: '竞选结果', body: '你的票数 ' + S.election.votes + '/>' + need + '\n' + r + (win ? '\n(面子+60,同学好感+)' : '\n(面子-10)'), opts: ['好'] });
}

/* ---------- 职业 / 婚姻 / 世代 ---------- */
function pendCareer() {
  const list = D.jobs.map(j => {
    let sc = 0, n = 0;
    ATTRS.forEach(k => { if (j.req[k]) { n++; sc += clamp(S.attrs[k] / j.req[k], 0, 1.2); } });
    if (j.req.any) { n++; sc += clamp((S.attrs.iq * 0.4 + S.attrs.eq * 0.4 + S.attrs.mem * 0.4) / j.req.any, 0, 1.2); }
    return { j, sc, rate: sc / Math.max(1, n) };
  });
  list.sort((a, b) => ((b.rate >= 1) - (a.rate >= 1)) || (b.j.t - a.j.t) || (b.rate - a.rate));
  const best = list[0];
  S.job = best.j;
  S.workSalary = 180 + best.j.t * 120;
  S.pending.push({ type: 'news', title: '毕业,步入职场', body: '你拿到了属于自己的工牌——\n\n' + best.j.icon + ' ' + (best.j.n || best.j.name) + ' 月薪回到手: ' + S.workSalary + '\n\n' + (best.j.d || '新人阶段: 踩点上下班,偶尔加班。'), opts: ['好'] });
}
function pendMarry() {
  let cand = null, bestAff = 0;
  Object.keys(S.npcAff || {}).forEach(id => {
    if (S.npcAff[id] > bestAff) {
      bestAff = S.npcAff[id];
      cand = { id, n: (D.npcs.find(x => x.id === id) || {}).n || 'TA', aff: S.npcAff[id] };
    }
  });
  if (cand && bestAff >= 60) {
    S.pending.push({
      type: 'marry',
      title: '求婚时刻',
      body: '和 ' + cand.n + '(好感 ' + cand.aff + ')从青涩学生时代一路相伴至今。\n此时此刻，你想对TA说——',
      cand: cand,
      opts: ['浪漫求婚 💍', '顺其自然(暂缓成家)']
    });
  } else {
    const prob = Math.min(0.9, 0.35 + S.face * 0.001 + S.attrs.cha * 0.0015);
    S.pending.push({
      type: 'marry',
      title: '家庭相亲大会',
      body: '恋爱未果，你被安排到了长辈的相亲席。\n成功概率约 ' + Math.round(prob * 100) + '%(面子和魅力是硬通货)',
      prob,
      opts: ['去相亲 💌', '拼事业(选择单身)']
    });
  }
}
function marryResolve(i) {
  const m = S.pending[0];
  S.pending.shift();
  if (m.cand) {
    if (i === 0) {
      S.spouse = { name: m.cand.n, icon: '💑', aff: m.cand.aff, tag: '校园恋人' };
      S.face += 40;
      return '你与「' + m.cand.n + '」在亲友见证下互换戒指，相视而笑！面子+40';
    }
    return '彼此都懂，但你决定暂时不打扰，把回忆留在心底。';
  }
  if (i === 1) return '你选择了专注于拼搏事业。过年亲戚的"找对象了吗"虽迟但到。';
  if (Math.random() < m.prob) {
    const sName = pick(['同事介绍的小林', '相亲结识的珠珠', '咖啡馆里投缘的晴晴', '老朋友介绍的发小']);
    S.spouse = { name: sName, icon: '💑', tag: '相亲良缘' };
    S.face += 25;
    return '🎉 相亲成功! 和「' + sName + '」谈起恋爱，很快领证成家。';
  }
  return '相亲席上相顾无言。妈妈在群里叹气:"这孩子怎么就不开窍呢?"';
}
function pendEndGen() {
  pushEndGen();
}
function pushEndGen() {
  const job = S.job || { n: '自由职业者', icon: '🛋️', t: 0 };
  const jobName = job.n || job.name || '自由职业';
  const prevAtlas = (S.fam && S.fam.atlas) || [];
  const mergedAtlas = [...prevAtlas];
  (S.talents || []).forEach(id => {
    if (mergedAtlas.indexOf(id) < 0) mergedAtlas.push(id);
  });
  const newFamTalent = mergedAtlas.length;
  const fam = {
    g: S.gen,
    name: S.name,
    tier: Math.max((S.fam ? S.fam.tier : 0), job.t || 0),
    talent: newFamTalent,
    attr: { ...S.attrs },
    atlas: mergedAtlas,
    lastJob: jobName,
    lastScore: S.gaokaoScore || 0,
    lastSpouse: S.spouse ? S.spouse.name : '单身'
  };
  saveFam(fam);
  S.fam = fam;
  const line = (job.t || 0) >= 4 ? '你登上了金字塔尖，亲戚们的目光满是敬佩与艳羡！'
    : (job.t || 0) >= 2 ? '生活体面安稳，爸妈茶余饭后终于不再念叨别人家的孩子。'
    : '在平凡的烟火人间里，你走出了属于自己的路。';

  S.pending.push({
    type: 'endgen',
    title: '第' + S.gen + '代 · 人生终章结算',
    body: '【本代主人公】' + S.name + ' (' + (S.gender === 'girl' ? '女儿' : '儿子') + ')\n' +
      '【最终职业】' + job.icon + ' ' + jobName + '\n' +
      '【阶层档位】' + ['普通工薪', '温饱', '小康', '中产', '高收入', '社会领军'][Math.min(5, job.t || 0)] + '\n' +
      '【家族积蓄】' + S.money + ' 元 · 面子 ' + S.face + '\n' +
      '【高考成绩】' + (S.gaokaoScore || '未参加') + ' 分\n' +
      '【特长积累】本代 ' + S.talents.length + ' 个 · 家族图鉴已收录 ' + newFamTalent + ' 个\n' +
      '【婚姻家庭】' + (S.spouse ? S.spouse.name : '独立潇洒 (单身)') + '\n\n' +
      line + '\n\n—— 家族的火炬已准备好，下一代将享有更高的先天属性与家族零花！',
    opts: ['生下下一代 (开启新传承)']
  });
}
function nextGen() { resetAll(); newGame(); }
function collapse() { /* 由 UI 调用 restartLineage */ }

/* ---------- 图鉴/同学/商店 ---------- */
function atlas() {
  const list = (S.talents || []).map(id => D.talentData.find(t => t.id === id)).filter(Boolean);
  const stats = {};
  list.forEach(t => { stats[t.r] = (stats[t.r] || 0) + 1; });
  return { list, stats, total: list.length, fam: S.fam };
}
function socialList() {
  const meG = S.gender === 'boy' ? '女' : '男';
  return D.npcs.filter(n => n.gender === meG).map(n => ({ id: n.id, name: n.n, icon: n.icon, aff: S.npcAff[n.id] || 0, intro: n.intro }));
}
function chat(id) {
  if (S.act < 3) { toast('行动力不足'); return; }
  S.act -= 3;
  const g = RI(3, 8);
  S.npcAff[id] = clamp((S.npcAff[id] || 0) + g, 0, 100);
  const nm = (D.npcs.find(n => n.id === id) || {}).n || 'ta';
  log('和' + nm + '聊了聊,好感+' + g);
  if (S.npcAff[id] >= 60) toast('💕 ' + nm + '好像对你有点特别……');
  return g;
}
function gift(id) {
  if (S.money < 25) { toast('零花钱不够'); return; }
  if (S.act < 3) { toast('行动力不足'); return; }
  S.money -= 25; S.act -= 3;
  const g = RI(10, 18);
  S.npcAff[id] = clamp((S.npcAff[id] || 0) + g, 0, 100);
  log('送' + ((D.npcs.find(n => n.id === id) || {}).n) + '小礼物:-25元 好感+' + g);
  return g;
}
function shopList() { return D.store.map(s => ({ ...s, can: S.money >= s.price })); }
function buy(id) {
  const it = D.store.find(s => s.id === id);
  if (!it) return false;
  if (S.money < it.price) { toast('零钱不够'); return false; }
  S.money -= it.price;
  applyEff(it.eff);
  log('买了「' + it.n + '」' + (effText(it.eff) ? '(' + effText(it.eff) + ')' : ''));
  save();
  return true;
}

/* ---------- 脑洞 ---------- */
function bGen() {
  const G = [];
  for (let i = 0; i < 30; i++) {
    const r = Math.random();
    let t = 'bulb';
    if (r < 0.2) t = 'bulb';
    else if (r < 0.45) t = 'attr';
    else if (r < 0.55) t = 'bolt';
    else if (r < 0.63) t = 'bomb';
    else if (r < 0.71) t = 'skull';
    else if (r < 0.8) t = 'gold';
    else t = 'duck';
    G.push({ t, open: false });
  }
  G[RI(0, G.length - 1)].t = 'key';
  return G;
}
function bOpen() { if (!S.brain) S.brain = { layer: 1, g: bGen() }; return S.brain; }
function bGrid() { return bOpen().g; }
function bRev(i) {
  const b = bOpen();
  const c = b.g[i];
  if (!c || c.open) return null;
  if (S.act < 2) { toast('行动力不足(需要2)'); return null; }
  S.act -= 2;
  c.open = true;
  let res = '';
  const db = 1 + (b.layer - 1) * 0.2;
  switch (c.t) {
    case 'bulb': { const v = Math.round(RI(8, 16) * db); S.insight += v; res = '💡 悟性+' + v; break; }
    case 'attr': { const k = pick(['iq', 'eq', 'mem', 'img', 'phy']); const v = Math.round((RI(1, 3) + Math.max(0, b.layer - 1)) * db); S.attrs[k] += v; res = ANAME[k] + '+' + v; break; }
    case 'bolt': { const v = RI(8, 20); S.act = clamp(S.act + v, 0, 240); res = '⚡ 行动+' + v; break; }
    case 'bomb': { b.g.forEach((g2, j) => { if (j !== i && Math.abs(j - i) <= 5 && !g2.open) g2.open = true; }); res = '💥 爆破连开!'; break; }
    case 'skull': { const v = RI(2, 4); ['iq', 'eq', 'mem', 'img', 'phy'].forEach(k => S.attrs[k] += v); res = '💀 脑内风暴:五维+' + v; break; }
    case 'gold': { const v = RI(6, 16); S.money += v; res = '💰 零花+' + v; break; }
    case 'duck': res = '🦆 鸭子看了你一眼,然后走了。'; break;
    case 'key': { b.layer++; b.g = bGen(); S.act = clamp(S.act + 50, 0, 240); res = '🗝️ 钥匙!下探第' + b.layer + '层(行动+50)'; break; }
  }
  save();
  return res;
}
function bInfo() { const b = bOpen(); return { layer: b.layer, open: b.g.filter(x => x.open).length, total: b.g.length }; }

/* ---------- 对外 ---------- */
const API = {
  state: () => S,
  newGame, resume, resetAll, restartLineage,
  nextGen: () => { resetAll(); newGame(); },
  saveInfo,
  info: () => S ? {
    gen: S.gen, turn: S.turn, name: S.name, gender: S.gender,
    phase: PHASE_CN[cls()], age: ageOf(),
    attrs: { ...S.attrs }, insight: S.insight, act: S.act, money: S.money,
    face: S.face, sat: S.sat, stress: S.stress, shadow: S.shadow,
    exambuff: S.exambuff, talents: S.talents.length,
    job: S.job, spouse: S.spouse,
  } : null,
  pool, addSlot, removeSlot, clearSlots, autoFillSlots,
  slots: () => S.slots,
  endTurn, pending: () => S.pending.slice(),
  resolve: resolvePend,
  examBuff: () => S.exambuff,
  brain: { grid: bGrid, rev: bRev, info: bInfo },
  social: socialList, chat, gift,
  shop: shopList, buy,
  atlas, fam: getFam,
};
function getFam() { return S ? S.fam : (loadFam() || { g: 0, talent: 0, tier: 0, attr: {}, atlas: [] }); }

function resolvePend(i) {
  if (!S.pending.length) return '';
  const m = S.pending[0];
  switch (m.type) {
    case 'intro': case 'news': case 'collapse': case 'final': case 'zhongkao': case 'gaokao': case 'career':
    case 'face': case 'electionr':
      S.pending.shift();
      if (m.type === 'collapse') { restartLineage(); return '重新开始'; }
      return '';
    case 'choice': {
      const o = m.opts[i];
      applyEff(o.eff);
      S.pending.shift();
      return o.label;
    }
    case 'mini_hb': {
      S.pending.shift();
      if (i === 2) { S.face += 15; return '你主动把红包交给爸妈,父母欣慰(面子+15)'; }
      const v = RI(100, 200);
      S.money += v;
      return '你抢到了红包,拿到 ' + v + ' 元!' + (i === 0 ? '(左兜)' : '(右兜)');
    }
    case 'show': {
      S.pending.shift();
      S.pending.push({ type: 'showr', title: m.title, body: showResult(m.tier), opts: ['好'] });
      return '登台';
    }
    case 'showr': S.pending.shift(); return '';
    case 'election': {
      const v = doElection(i);
      if (S.election.round >= 2) { S.pending.shift(); electionFinish(); }
      else S.pending[0].body = '拉了一票(+' + v + ')。再来一轮!当前票: ' + S.election.votes;
      return '拉到 ' + v + ' 票';
    }
    case 'marry': return marryResolve(i);
    case 'endgen': {
      S.pending.shift();
      nextGen();
      return '生下下一代';
    }
  }
  return '';
}
global.CP = API;
if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);