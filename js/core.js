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
function log(m) {
  if (!S) return;
  if (!S.log) S.log = [];
  S.log.unshift(m);
  if (S.log.length > 60) S.log.pop();
}
function toast(m) {
  if (!S) return;
  if (!S.toasts) S.toasts = [];
  S.toasts.push(m);
  if (S.toasts.length > 8) S.toasts.shift();
}
function flushToasts() {
  if (!S || !S.toasts || !S.toasts.length) return [];
  const list = S.toasts.slice();
  S.toasts = [];
  return list;
}
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
const PHASE_RANK = { baby: 1, kinder: 2, pri: 3, junior: 4, senior: 5, college: 6, work: 7, home: 8 };
const PHASE_TIPS = {
  kinder: '新课程解锁！第12回合将迎来【幼儿园才艺选秀】，准备好拿手特长争夺冠军；第13回合还会触发【过年收红包】。',
  pri: '【校园小卖部】已开张！零花钱每回合按门第发放，可在商店购买道具提升属性，也可在日程向父母索取大件心愿物。第18回合班干部竞选、第24回合期末考！',
  junior: '【同学往来】社交模块解锁！和同学聊天送礼提升好感度，未来可缔结良缘。注意关注科目偏科，第32回合将迎来决定命运的【中考】！',
  senior: '进入冲刺阶段！六大学科掌握度直接影响【高考大关（第44回合）】，注意控制压力，切勿在冲刺期心理崩溃！',
  college: '大学自由选课！积累职场前置门槛，为步入社会奠定专业基础。',
  work: '迈入职场！每月发放薪水，用事业积累家族资产与声望。',
  home: '三十而立，成家立业！将毕生修为与家族图鉴传递给下一代。',
};
function ageOf(t) {
  t = t || (S ? S.turn : 1);
  const base = { baby: 0, kinder: 3, pri: 6, junior: 12, senior: 15, college: 18, work: 23, home: 30 }[phaseOf(t)];
  return base + Math.min(9, Math.floor((t - 1) / 12));
}
function cls() { return phaseOf(); }

/* ---------- 存档管理与多槽位系统 (Round 1) ---------- */
let activeSlot = 0;

function slotSaveKey(slot) {
  const idx = (typeof slot === 'number' && slot >= 0 && slot <= 2) ? slot : activeSlot;
  return idx === 0 ? 'cph_save' : ('cph_save_' + idx);
}
function slotFamKey(slot) {
  const idx = (typeof slot === 'number' && slot >= 0 && slot <= 2) ? slot : activeSlot;
  return idx === 0 ? 'cph_fam' : ('cph_fam_' + idx);
}

function initStorage() {
  if (!LS) return;
  try {
    const act = LS.getItem('cph_active_slot');
    if (act !== null && act !== undefined && act !== '') {
      const parsed = parseInt(act, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 2) {
        activeSlot = parsed;
      }
    }
  } catch (e) {}
}
initStorage();

function persist() {
  if (!LS || !S) return;
  try {
    S.savedAt = Date.now();
    const str = JSON.stringify(S);
    LS.setItem(slotSaveKey(activeSlot), str);
    if (activeSlot === 0) {
      LS.setItem('cph_save_0', str);
    }
  } catch (e) {}
}

function loadSave(slot) {
  if (!LS) return null;
  const idx = (typeof slot === 'number' && slot >= 0 && slot <= 2) ? slot : activeSlot;
  try {
    const raw = (idx === 0)
      ? (LS.getItem('cph_save') || LS.getItem('cph_save_0'))
      : LS.getItem('cph_save_' + idx);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function loadFam(slot) {
  if (!LS) return null;
  const idx = (typeof slot === 'number' && slot >= 0 && slot <= 2) ? slot : activeSlot;
  try {
    const raw = (idx === 0)
      ? (LS.getItem('cph_fam') || LS.getItem('cph_fam_0'))
      : LS.getItem('cph_fam_' + idx);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function saveFam(f, slot) {
  if (!LS) return;
  const idx = (typeof slot === 'number' && slot >= 0 && slot <= 2) ? slot : activeSlot;
  try {
    const str = JSON.stringify(f);
    LS.setItem(slotFamKey(idx), str);
    if (idx === 0) {
      LS.setItem('cph_fam_0', str);
    }
  } catch (e) {}
}

function save() { persist(); }

function toBase64(str) {
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str, 'utf8').toString('base64');
    }
  } catch (e) {}
  try {
    if (typeof btoa !== 'undefined') {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));
    }
  } catch (e) {}
  // 纯原生无依赖 Base64 算法 (兜底兼容沙箱与极简环境)
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    const utf8 = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p1) => String.fromCharCode('0x' + p1));
    let out = '';
    for (let i = 0; i < utf8.length; i += 3) {
      const c1 = utf8.charCodeAt(i);
      const c2 = i + 1 < utf8.length ? utf8.charCodeAt(i + 1) : NaN;
      const c3 = i + 2 < utf8.length ? utf8.charCodeAt(i + 2) : NaN;
      const e1 = c1 >> 2;
      const e2 = ((c1 & 3) << 4) | (isNaN(c2) ? 0 : (c2 >> 4));
      const e3 = isNaN(c2) ? 64 : (((c2 & 15) << 2) | (isNaN(c3) ? 0 : (c3 >> 6)));
      const e4 = isNaN(c3) ? 64 : (c3 & 63);
      out += chars.charAt(e1) + chars.charAt(e2) + chars.charAt(e3) + chars.charAt(e4);
    }
    return out;
  } catch (e) { return ''; }
}

function fromBase64(b64) {
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(b64, 'base64').toString('utf8');
    }
  } catch (e) {}
  try {
    if (typeof atob !== 'undefined') {
      return decodeURIComponent(Array.prototype.map.call(atob(b64.trim()), c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    }
  } catch (e) {}
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    const clean = b64.replace(/[^A-Za-z0-9+/=]/g, '');
    let bin = '';
    for (let i = 0; i < clean.length; i += 4) {
      const e1 = chars.indexOf(clean.charAt(i));
      const e2 = chars.indexOf(clean.charAt(i + 1));
      const e3 = chars.indexOf(clean.charAt(i + 2));
      const e4 = chars.indexOf(clean.charAt(i + 3));
      const c1 = (e1 << 2) | (e2 >> 4);
      const c2 = ((e2 & 15) << 4) | (e3 >> 2);
      const c3 = ((e3 & 3) << 6) | e4;
      bin += String.fromCharCode(c1);
      if (e3 !== 64) bin += String.fromCharCode(c2);
      if (e4 !== 64) bin += String.fromCharCode(c3);
    }
    return decodeURIComponent(Array.prototype.map.call(bin, c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  } catch (e) { return ''; }
}

function listSlots() {
  const res = [];
  for (let i = 0; i < 3; i++) {
    const s = loadSave(i);
    const fam = loadFam(i);
    const isActive = (i === activeSlot);
    if (s && s.ver && s.turn) {
      res.push({
        slot: i,
        slotName: '槽位 ' + (i + 1),
        active: isActive,
        empty: false,
        name: s.name || '孩子',
        gender: s.gender || 'boy',
        gen: s.gen || 1,
        turn: s.turn || 1,
        phase: PHASE_CN[phaseOf(s.turn)] || '成长中',
        age: ageOf(s.turn),
        savedAt: s.savedAt || null,
        score: s.gaokaoScore || 0,
        job: s.job || null,
        talentsCount: (s.talents && s.talents.length) || 0,
        familyGen: (fam && fam.g) || 0,
        familyTalents: (fam && fam.atlas && fam.atlas.length) || 0,
        familyTier: (fam && fam.tier) || 0
      });
    } else if (fam && (fam.g > 0 || (fam.atlas && fam.atlas.length > 0))) {
      res.push({
        slot: i,
        slotName: '槽位 ' + (i + 1),
        active: isActive,
        empty: false,
        name: '家族传承',
        gender: 'boy',
        gen: (fam.g || 0) + 1,
        turn: 1,
        phase: '待开启',
        age: 0,
        savedAt: null,
        score: 0,
        job: null,
        talentsCount: 0,
        familyGen: fam.g || 0,
        familyTalents: (fam.atlas && fam.atlas.length) || 0,
        familyTier: fam.tier || 0
      });
    } else {
      res.push({
        slot: i,
        slotName: '槽位 ' + (i + 1),
        active: isActive,
        empty: true,
        name: '虚位以待',
        gender: 'boy',
        gen: 1,
        turn: 1,
        phase: '未开启',
        age: 0,
        savedAt: null,
        score: 0,
        job: null,
        talentsCount: 0,
        familyGen: 0,
        familyTalents: 0,
        familyTier: 0
      });
    }
  }
  return res;
}

function switchSlot(targetSlot) {
  const idx = parseInt(targetSlot, 10);
  if (isNaN(idx) || idx < 0 || idx > 2) return { ok: false, error: '无效槽位' };
  if (S) persist();
  activeSlot = idx;
  if (LS) {
    try { LS.setItem('cph_active_slot', String(idx)); } catch (e) {}
  }
  const hasSave = resume();
  if (!hasSave) {
    newGame();
    return { ok: true, slot: idx, isNew: true };
  }
  return { ok: true, slot: idx, isNew: false };
}

function clearSlot(targetSlot) {
  const idx = parseInt(targetSlot, 10);
  if (isNaN(idx) || idx < 0 || idx > 2) return { ok: false, error: '无效槽位' };
  if (LS) {
    try {
      LS.removeItem(slotSaveKey(idx));
      LS.removeItem(slotFamKey(idx));
      if (idx === 0) {
        LS.removeItem('cph_save');
        LS.removeItem('cph_fam');
      }
    } catch (e) {}
  }
  if (idx === activeSlot) {
    S = null;
  }
  return { ok: true, slot: idx };
}

function copySlot(fromSlot, toSlot) {
  const f = parseInt(fromSlot, 10);
  const t = parseInt(toSlot, 10);
  if (isNaN(f) || f < 0 || f > 2 || isNaN(t) || t < 0 || t > 2) {
    return { ok: false, error: '无效槽位' };
  }
  if (f === t) return { ok: false, error: '无法复制至同一槽位' };
  const s = loadSave(f);
  const fam = loadFam(f);
  if (!s && !fam) return { ok: false, error: '来源槽位为空' };
  if (LS) {
    try {
      if (s) {
        LS.setItem(slotSaveKey(t), JSON.stringify(s));
        if (t === 0) LS.setItem('cph_save', JSON.stringify(s));
      }
      if (fam) {
        LS.setItem(slotFamKey(t), JSON.stringify(fam));
        if (t === 0) LS.setItem('cph_fam', JSON.stringify(fam));
      }
    } catch (e) {}
  }
  if (t === activeSlot) {
    resume();
  }
  return { ok: true, from: f, to: t };
}

function exportSlot(slot) {
  const idx = (typeof slot === 'number' && slot >= 0 && slot <= 2) ? slot : activeSlot;
  if (idx === activeSlot && S) persist();
  const s = loadSave(idx);
  const fam = loadFam(idx);
  if (!s && !fam) {
    return { ok: false, error: '槽位为空，无法导出' };
  }
  const summary = {
    name: s ? s.name : '家族档案',
    gender: s ? s.gender : 'boy',
    gen: s ? s.gen : (fam ? (fam.g || 1) : 1),
    turn: s ? s.turn : 1,
    phase: s ? (PHASE_CN[phaseOf(s.turn)] || '成长中') : '未开始',
    age: s ? ageOf(s.turn) : 0,
    familyGen: (fam && fam.g) || (s && s.gen ? s.gen - 1 : 0),
    familyTalents: (fam && fam.atlas && fam.atlas.length) || (s && s.talents ? s.talents.length : 0),
    familyTier: (fam && fam.tier) || 0
  };
  const pkg = {
    magic: 'CPH_SAVE_PACKAGE',
    ver: 2,
    exportAt: new Date().toISOString(),
    slot: idx,
    summary,
    save: s,
    fam: fam
  };
  const jsonStr = JSON.stringify(pkg, null, 2);
  const base64Str = toBase64(jsonStr);
  return {
    ok: true,
    slot: idx,
    summary,
    json: jsonStr,
    base64: base64Str,
    filename: 'chinese_parents_slot_' + (idx + 1) + '_gen' + summary.gen + '.json'
  };
}

function importSlot(rawInput, targetSlot) {
  if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
    return { ok: false, error: '导入数据为空' };
  }
  const idx = (typeof targetSlot === 'number' && targetSlot >= 0 && targetSlot <= 2) ? targetSlot : activeSlot;
  let parsed = null;
  const trimmed = rawInput.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try { parsed = JSON.parse(trimmed); } catch (e) {}
  }
  if (!parsed) {
    const decoded = fromBase64(trimmed);
    if (decoded && decoded.startsWith('{') && decoded.endsWith('}')) {
      try { parsed = JSON.parse(decoded); } catch (e) {}
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: '无法解析的存档数据格式，请确认文本完整性' };
  }

  let saveObj = null;
  let famObj = null;
  let summary = parsed.summary || null;

  if (parsed.magic === 'CPH_SAVE_PACKAGE') {
    saveObj = parsed.save;
    famObj = parsed.fam;
  } else if (parsed.ver && parsed.attrs && parsed.turn) {
    saveObj = parsed;
    famObj = parsed.fam || null;
  } else if (parsed.save || parsed.fam) {
    saveObj = parsed.save || null;
    famObj = parsed.fam || null;
  } else {
    return { ok: false, error: '数据包缺少有效的游戏存档核心字段' };
  }

  if (!saveObj && !famObj) {
    return { ok: false, error: '存档包内容为空' };
  }

  if (LS) {
    try {
      if (saveObj) {
        LS.setItem(slotSaveKey(idx), JSON.stringify(saveObj));
        if (idx === 0) LS.setItem('cph_save', JSON.stringify(saveObj));
      }
      if (famObj) {
        LS.setItem(slotFamKey(idx), JSON.stringify(famObj));
        if (idx === 0) LS.setItem('cph_fam', JSON.stringify(famObj));
      }
    } catch (e) {
      return { ok: false, error: '存储空间已满或写入异常' };
    }
  }

  if (idx === activeSlot) {
    resume();
  }

  return {
    ok: true,
    slot: idx,
    summary: summary || {
      name: (saveObj && saveObj.name) || '导入存档',
      gen: (saveObj && saveObj.gen) || 1,
      turn: (saveObj && saveObj.turn) || 1
    }
  };
}
function pendHongbao() {
  const relatives = [
    { n: '大姑妈', line: '“哎呀小宝又长高了！拿着，大姑给买新书包的！”', mom: '“使不得使不得，大姐你留着买菜！”' },
    { n: '二叔叔', line: '“小男子汉/漂亮姑娘！二叔给的压岁钱，必须收着！”', mom: '“二弟你太客气了，小孩子不能惯着！”' },
    { n: '表舅爷', line: '“舅爷的一点心意！好好读书考大学！”', mom: '“舅爷快收回去，我们怎么能要您的钱！”' },
    { n: '隔壁王阿姨', line: '“压岁钱给孩子讨个好彩头，大吉大利！”', mom: '“王姐真不用，平时承蒙您多关照了！”' },
  ];
  const rel = pick(relatives);
  S.pending.push({
    type: 'hongbao_duel',
    title: '🧧 过年收红包 · 推拉拉扯战',
    rel: rel.n,
    quote: rel.line,
    momQuote: rel.mom,
    body: rel.n + '递过一个沉甸甸的红信封！\n' + rel.line + '\n\n妈妈在旁边拼命拉扯推脱：\n' + rel.mom,
    opts: [
      { label: '🤝 适度推脱，见好就收 (黄金平衡)', sub: '得体客套，既拿红包又赚面子' },
      { label: '✋ 坚决推辞到底 (推脱过猛)', sub: '过于客气，亲戚可能真收回去了' },
      { label: '🤲 一把夺入囊中 (急切贪婪)', sub: '拿到红包，但被老妈当场白眼' }
    ]
  });
}

/* ---------- 开局 ---------- */
function newGame() {
  const fam = loadFam() || { g: 0, talent: 0, tier: 0, attr: {}, atlas: [] };
  const seedMoney = fam.seedMoney || 0;
  S = {
    ver: 1, gen: fam.g + 1, fam,
    name: pick(['小强', '安安', '小满', '小龙', '豆豆', '妙妙', '铁蛋', '糖糖']),
    gender: Math.random() < 0.45 ? 'girl' : 'boy',
    turn: 1,
    attrs: { iq: RI(5, 9), eq: RI(5, 9), mem: RI(5, 9), img: RI(5, 9), phy: RI(5, 9), cha: RI(2, 5) },
    insight: 15, act: 100, money: 30 + seedMoney,
    face: 15 + (fam.tier || 0) * 25, sat: 62, stress: 0, shadow: 0,
    exambuff: 0, workSalary: 0, job: null, uniTier: 0, gaokaoScore: 0,
    skills: {}, slots: new Array(6).fill(null),
    npcAff: {}, lover: null, spouse: null,
    talents: (fam.atlas || []).slice(0, fam.talent),
    flags: {}, used: {},
    tutorial: { done: false, step: 0, claimed: false },
    pending: [], log: [], toasts: [],
    wishPoints: 1,
    bag: {},
    major: null,
  };
  if (fam.g > 0) {
    // 父母 18% 属性遗传 + 伴侣基因增益 + 家族特长底蕴
    const inheritRatio = (fam.achievements && fam.achievements.indexOf('ach-gen-5') >= 0) ? 0.25 : 0.18;
    ATTRS.forEach(k => {
      const parentShare = Math.round(((fam.attr && fam.attr[k]) || 0) * inheritRatio);
      S.attrs[k] += parentShare + (fam.talent || 0);
      if (fam.spouseBonus && fam.spouseBonus[k]) {
        S.attrs[k] += fam.spouseBonus[k];
      }
    });
    // 名校光环继承: 上一代大学档次 (0专科..5清北) 直接影响后代悟性/面子起点
    const uniTier = fam.uniTier || 0;
    if (uniTier >= 3) { S.insight += 15; S.face += 8; }
    if (uniTier >= 5) { S.insight += 15; S.face += 7; }
    // 家族成就先天天赋庇佑
    const achs = fam.achievements || [];
    if (achs.indexOf('ach-gk-top') >= 0) S.insight += 20;
    if (achs.indexOf('ach-first-rich') >= 0) S.money += 50;
    if (achs.indexOf('ach-zero-break') >= 0) S.face += 35;
    if (achs.indexOf('ach-perfect-life') >= 0) {
      ATTRS.forEach(k => S.attrs[k] += 10);
    }
    // 心态遗传: 父母心理阴影/长期高压会留下先天紧绷感
    const pShadow = fam.shadow || 0;
    if (pShadow >= 50) S.stress = Math.min(40, Math.round(pShadow / 4));
    if ((fam.stress || 0) > 80) S.stress = Math.min(40, S.stress + Math.round(((fam.stress || 0) - 80) / 4));
  }
  S.learnedCourses = ['fanshen', 'wanju'];
  S.skills.fanshen = 1;
  S.skills.wanju = 1;
  S.act = 100;

  const perTurnGrowth = fam.talent > 0 ? Math.max(1, Math.floor(fam.talent / 2)) : 0;
  const inheritStory = fam.g > 0
    ? `\n🧬 上一代【${fam.name}】的积累为你打下深厚底蕴：\n• 父母五维遗传与伴侣基因赋能已注入开局！\n• 继承家族压岁钱 +${seedMoney} 元，门第面子 +${(fam.tier || 0) * 25}\n• 家族图鉴已收录 ${fam.talent} 项特长，每回合五维成长 +${perTurnGrowth}！`
    : '\n白手起家，第一代开启你的逆袭人生！';

  // 🏆 名校光环 / 🌧️ 心态遗传 文案 (仅继承世代展示)
  let uniBonusStory = '';
  if (fam.g > 0) {
    const ut = fam.uniTier || 0;
    if (ut >= 5) uniBonusStory = ' 🏆 清北世家书香扑面，开局悟性+30、面子+15';
    else if (ut >= 4) uniBonusStory = ' 🏆 985血脉的底蕴加持，开局悟性+15、面子+8';
    else if (ut >= 3) uniBonusStory = ' 🏆 211书香传承，开局悟性+15、面子+8';
    if (uniBonusStory) uniBonusStory = '\n' + uniBonusStory + '！';
    const sh = fam.shadow || 0;
    const st2 = fam.stress || 0;
    if (sh >= 50 || st2 > 80) {
      uniBonusStory += '\n🌧️ 不过父母遗留的心理阴霾，让你天生带着一丝紧绷(压力' + (S.stress || 0) + ')。';
    }
  }

  S.pending.push({
    type: 'intro',
    title: '第 ' + S.gen + ' 代 · 出生',
    body: '你出生在一个中国普通家庭，爸妈起名「' + S.name + '」(' + (S.gender === 'girl' ? '女儿' : '儿子') + ')。\n\n每个回合: 挖脑洞攒悟性 → 研习新技能 → 自由安排 6 件事(学习/娱乐/打工/社交) → 考试、选秀、面子，一路卷到高考。' + inheritStory + uniBonusStory,
    opts: ['开始成长 🚀']
  });
  captureTurnStart();
  persist();
}
function resume() {
  const s = loadSave();
  if (s && s.ver) {
    S = s;
    S.toasts = [];
    if (!S.attrs) S.attrs = { iq: 10, eq: 10, mem: 10, img: 10, phy: 10, cha: 10 };
    ATTRS.forEach(k => {
      if (typeof S.attrs[k] !== 'number' || isNaN(S.attrs[k])) {
        S.attrs[k] = (k === 'cha' ? 10 : 20);
      }
    });
    if (S.wishPoints == null) S.wishPoints = 0;
    if (!S.talents) S.talents = [];
    if (!S.bag) S.bag = {};
    if (!S.flags) S.flags = {};
    if (!S.used) S.used = {};
    if (!S.npcAff) S.npcAff = {};
    if (!S.log) S.log = [];
    if (!S.learnedCourses) {
      S.learnedCourses = Object.keys(S.skills || {}).length ? Object.keys(S.skills) : ['fanshen', 'wanju'];
    }
    if (!S.tutorial) S.tutorial = { done: false, step: 0, claimed: false };
    if (!S.pending) S.pending = [];
    if (!S.brain) S.brain = { layer: 1, g: bGen() };
    if (S.fam) {
      if (!S.fam.history) S.fam.history = [];
      if (!S.fam.achievements) S.fam.achievements = [];
      if (!S.fam.atlas) S.fam.atlas = [];
    }
    if (S.turn >= 60 && !S.pending.some(x => x.type === 'endgen')) {
      pendEndGen();
    }
    if (!S.turnStart) captureTurnStart();
    return true;
  }
  return false;
}
function resetAll() {
  if (LS) {
    try {
      LS.removeItem(slotSaveKey(activeSlot));
      if (activeSlot === 0) LS.removeItem('cph_save');
    } catch(e) {}
  }
  S = null;
}
function restartLineage() {
  if (LS) {
    try {
      LS.removeItem(slotFamKey(activeSlot));
      if (activeSlot === 0) LS.removeItem('cph_fam');
    } catch(e) {}
  }
  resetAll();
  newGame();
}


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
    learnedCourses: [...(S.learnedCourses || [])],
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
  S.learnedCourses = [...(ts.learnedCourses || ['fanshen', 'wanju'])];
}

function courseCost(c) {
  const phaseBase = { baby: 20, kinder: 35, pri: 55, junior: 85, senior: 130, college: 160 }[c.phase] || 40;
  const base = c.baseInsight || phaseBase;
  const mainAttrKey = c.main || (c.attr ? Object.keys(c.attr)[0] : 'iq');
  const attrVal = (S && S.attrs) ? (S.attrs[mainAttrKey] || 0) : 0;
  // 属性越高，折扣越大，最高可享 75% 折扣 (原版核心机制)
  const discount = clamp(attrVal * 0.003, 0, 0.75);
  return Math.max(5, Math.round(base * (1 - discount)));
}

function learnCourse(id) {
  if (!S) return false;
  S.learnedCourses = S.learnedCourses || ['fanshen', 'wanju'];
  if (S.learnedCourses.indexOf(id) >= 0) return false;
  const c = D.courses.find(x => x.id === id);
  if (!c) return false;
  const cost = courseCost(c);
  if (S.insight < cost) {
    toast('悟性不足 (还需' + (cost - S.insight) + '💡)');
    return false;
  }
  S.insight -= cost;
  S.learnedCourses.push(id);
  S.skills[id] = 1;
  ATTRS.forEach(k => { if (c.attr && c.attr[k]) S.attrs[k] += c.attr[k]; });
  log('研习领悟了「' + c.name + '」! 已加入日常安排');
  toast('💡 掌握新课「' + c.name + '」!');
  if (c.tal) rollTalent(c.tal.id, c.tal.p || 0.25);
  persist();
  return true;
}

function learnList() {
  if (!S) return [];
  const ph = cls();
  S.learnedCourses = S.learnedCourses || ['fanshen', 'wanju'];
  return D.courses.filter(c => {
    if (c.phase !== ph) return false;
    if (c.begOnly && !S.flags[c.id]) return false;
    return S.learnedCourses.indexOf(c.id) < 0;
  }).map(c => {
    const cost = courseCost(c);
    const mainAttrKey = c.main || (c.attr ? Object.keys(c.attr)[0] : 'iq');
    return {
      id: c.id,
      name: c.name,
      icon: c.icon,
      phase: c.phase,
      cost,
      attr: c.attr,
      mainAttr: ANAME[mainAttrKey] || '属性',
      can: S.insight >= cost,
    };
  });
}

function clearSlots() {
  if (!S) return;
  (S.slots || []).forEach(sl => {
    if (sl) {
      S.act = clamp(S.act + (sl.act || 0), 0, 240);
      if (sl.money) S.money += sl.money;
    }
  });
  S.slots = new Array(6).fill(null);
  persist();
}

function removeSlot(idx) {
  if (!S || idx < 0 || idx >= 6 || !S.slots[idx]) return false;
  const sl = S.slots[idx];
  S.act = clamp(S.act + (sl.act || 0), 0, 240);
  if (sl.money) S.money += sl.money;
  S.slots[idx] = null;
  persist();
  return true;
}

function autoFillSlots() {
  if (!S || S.slots.every(Boolean)) return;

  const curPhase = phaseOf(S.turn);
  const curRank = PHASE_RANK[curPhase] || 1;

  // 1) 收集已填槽位状态并推演虚拟数值（压力、满意度、各项目计数）
  let simStress = S.stress;
  let simSat = S.sat;
  const counts = {};
  let courseCount = 0;
  let playCount = 0;
  let restCount = 0;
  let jobCount = 0;
  let begCount = 0;

  for (let i = 0; i < 6; i++) {
    const sl = S.slots[i];
    if (!sl) continue;
    counts[sl.id] = (counts[sl.id] || 0) + 1;
    if (sl.kind === 'learn') {
      courseCount++;
      const c = D.courses.find(x => x.id === sl.id);
      if (c) {
        simStress = clamp(simStress + (c.stress || 3), 0, 200);
        simSat = clamp(simSat + (c.sat || 2), 0, 140);
      }
    } else if (sl.kind === 'play') {
      playCount++;
      const p = D.plays.find(x => x.id === sl.id);
      if (p) {
        simStress = clamp(simStress + (p.stress || -3), 0, 200);
        simSat = clamp(simSat + (p.sat || -1), 0, 140);
      }
    } else if (sl.kind === 'rest') {
      restCount++;
      simStress = clamp(simStress - 10, 0, 200);
    } else if (sl.kind === 'pay') {
      jobCount++;
    } else if (sl.kind === 'beg') {
      begCount++;
    }
  }

  // 寻找需要补齐的五维短板属性
  const attrEntries = ATTRS.map(k => ({ k, val: (S.attrs && S.attrs[k]) || 0 }));
  attrEntries.sort((a, b) => a.val - b.val);
  const lowestAttrs = [attrEntries[0].k, attrEntries[1].k];

  // 2) 智能估值函数：根据游戏设计规则、阶段适配、压力控制、学科多样性评估
  function scoreCandidate(item) {
    if (item.kind === 'learn') {
      const c = D.courses.find(x => x.id === item.id);
      if (!c) return -999;
      const cRank = PHASE_RANK[c.phase] || 1;
      const phaseDiff = curRank - cRank;

      let score = 60;

      // 阶段匹配度：严防高年级还选择翻身、爬行等婴儿基础动作
      if (phaseDiff === 0) {
        score += 130; // 当期对应阶段课程
      } else if (phaseDiff === 1) {
        score += 35;  // 上一阶段过渡课程
      } else if (phaseDiff === 2) {
        score -= 80;  // 两个阶段前
      } else {
        score -= 260; // 彻底过期的婴儿/远古动作 (如初高中绝不翻身)
      }

      // 重复度惩罚与学科多样性（避免单科刷满6格，多门学科并进）
      const cUsed = counts[c.id] || 0;
      const totalLearned = (S.learnedCourses || []).length;
      if (totalLearned <= 2) {
        score -= cUsed * 25;
      } else {
        if (cUsed >= 2) score -= 120;
        else if (cUsed === 1) score -= 35;
        else score += 25; // 优先挑选未排入的新学科
      }

      // 考试提分收益 (小学、初中、高中面临升学与高考大考)
      if (curRank >= 3 && curRank <= 5 && c.ex) {
        if (c.ex === 'all+' || c.ex === 'all') score += 40;
        else score += 25;
      }

      // 特长获取潜力
      if (c.tal && (!S.talents || S.talents.indexOf(c.tal.id) < 0)) {
        score += 35;
      }

      // 熟练度升级奖励（未满5级或10级时冲刺特长质变阈值）
      const lvl = (S.skills && S.skills[c.id]) || 1;
      if (lvl < 5) score += (5 - lvl) * 4;
      else if (lvl >= 10) score -= 15;

      // 短板属性补强
      if (c.attr) {
        if (c.attr[lowestAttrs[0]]) score += 15;
        if (c.attr[lowestAttrs[1]]) score += 10;
      }

      // 父母满意度告急时，强化加满意度的课
      if (simSat < 55) {
        score += ((c.sat || 2) > 0 ? 30 : -20);
      }

      // 压力动态调控：高压下大幅抑制高压力课程，避免心理阴影
      if (simStress >= 75) {
        score -= (c.stress || 3) * 15 + 60;
      } else if (simStress >= 60) {
        score -= (c.stress || 3) * 8;
      } else if (simStress <= 30) {
        score += 20; // 状态轻松，宜勤奋学习
      }

      // 日程结构平衡：已有4门学习时，适度礼让娱乐与休息
      if (courseCount >= 4) {
        score -= 40;
      }

      return score;
    }

    if (item.kind === 'play') {
      const p = D.plays.find(x => x.id === item.id);
      if (!p) return -999;
      const pRank = PHASE_RANK[p.phase] || 1;
      const phaseDiff = Math.abs(curRank - pRank);

      let score = 40;

      // 阶段契合
      if (phaseDiff === 0) score += 60;
      else if (phaseDiff === 1) score += 25;
      else score -= 25;

      // 减压核心诉求
      const relief = -(p.stress || 0);
      if (simStress >= 70) {
        score += relief * 30 + 60;
      } else if (simStress >= 50) {
        score += relief * 18 + 30;
      } else if (simStress >= 30) {
        score += relief * 8 + 10;
      } else {
        score += relief * 4;
        if (courseCount >= 3) score += 25; // 劳逸结合
      }

      // 娱乐种类多样性
      const pUsed = counts[p.id] || 0;
      if (pUsed >= 2) score -= 90;
      else if (pUsed === 1) score -= 30;
      else score += 20;

      // 特长激发 (如小霸王、武侠小说)
      if (p.tal && (!S.talents || S.talents.indexOf(p.tal.id) < 0)) {
        score += 40;
      }

      // 父母满意度过低时不宜过分玩乐
      if (simSat < 50 && (p.sat || 0) < 0) {
        score -= 35;
      }

      // 特殊属性（魅力、想象力）加成
      if (p.attr) {
        if (p.attr.cha) score += 15;
        if (p.attr.img) score += 10;
      }

      // 已经排了2个娱乐时抑制更多娱乐
      if (playCount >= 2 && simStress < 65) {
        score -= 50;
      }

      return score;
    }

    if (item.kind === 'pay') {
      let score = 10;
      // 零花钱匮乏且处于初中以上时，安排适当打工
      if (curRank >= 4 && S.money < 30 && jobCount === 0 && S.act >= 6) {
        score += 70;
      } else {
        score -= 50;
      }
      return score;
    }

    if (item.kind === 'beg') {
      let score = 15;
      const b = D.begs.find(x => x.id === item.id);
      if (b && b.w >= 0.5 && begCount === 0 && simSat >= 60 && S.face >= (b.face || 0)) {
        score += 50;
      } else {
        score -= 40;
      }
      return score;
    }

    if (item.kind === 'rest') {
      // 休息：耗费 0 行动，下回合行动+30，减压10
      // 只有在行动力耗尽、或极度高压缺乏娱乐时才作为战略补充
      if (S.act < 3) {
        return 999; // 体力不够排任何课程，强制休息保底
      }
      if (simStress >= 80 && restCount === 0) {
        return 120; // 极高压急救
      }
      if (simStress >= 65 && playCount >= 2 && restCount === 0) {
        return 80;
      }
      // 正常体力充沛时，睡眠排斥分，防止"全是睡大觉"
      return -120 - restCount * 100;
    }

    return 0;
  }

  // 3) 逐格贪心填充，动态更新仿真状态
  let guard = 0;
  while (S.slots.some(x => !x) && guard++ < 12) {
    const pl = pool().filter(x => !x.locked && S.act >= (x.act || 0) && (!x.money || S.money >= x.money));
    if (!pl.length) {
      // 若因体力或资金无法进行任何动作，用零消耗的休息填满
      const restItem = pool().find(x => x.kind === 'rest');
      if (restItem && addSlot(restItem)) {
        restCount++;
        simStress = clamp(simStress - 10, 0, 200);
        continue;
      }
      break;
    }

    const scored = pl.map(item => ({ item, score: scoreCandidate(item) }));
    scored.sort((a, b) => b.score - a.score);

    let chosen = null;
    for (const sc of scored) {
      if (addSlot(sc.item)) {
        chosen = sc.item;
        break;
      }
    }

    if (!chosen) {
      const restItem = pool().find(x => x.kind === 'rest');
      if (restItem && addSlot(restItem)) chosen = restItem;
      else break;
    }

    // 更新推演数据
    counts[chosen.id] = (counts[chosen.id] || 0) + 1;
    if (chosen.kind === 'learn') {
      courseCount++;
      const c = D.courses.find(x => x.id === chosen.id);
      if (c) {
        simStress = clamp(simStress + (c.stress || 3), 0, 200);
        simSat = clamp(simSat + (c.sat || 2), 0, 140);
      }
    } else if (chosen.kind === 'play') {
      playCount++;
      const p = D.plays.find(x => x.id === chosen.id);
      if (p) {
        simStress = clamp(simStress + (p.stress || -3), 0, 200);
        simSat = clamp(simSat + (p.sat || -1), 0, 140);
      }
    } else if (chosen.kind === 'rest') {
      restCount++;
      simStress = clamp(simStress - 10, 0, 200);
    } else if (chosen.kind === 'pay') {
      jobCount++;
    } else if (chosen.kind === 'beg') {
      begCount++;
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
function pool() {
  const ph = cls(), out = [];
  S.learnedCourses = S.learnedCourses || ['fanshen', 'wanju'];

  // 1) 所有已学会的课程，可以任意多次排入日常安排！
  D.courses.forEach(c => {
    if (S.learnedCourses.indexOf(c.id) < 0) return;
    const lvl = S.skills[c.id] || 1;
    out.push({
      kind: 'learn',
      id: c.id,
      name: c.name,
      icon: c.icon,
      desc: effText(c.attr) + (c.stress ? ' 压+' + c.stress : ''),
      act: 3,
      extra: '熟练Lv' + lvl,
      locked: S.act < 3 || (c.money && S.money < c.money),
      money: c.money || 0,
      tone: 'course'
    });
  });

  // 2) 娱乐与工作项目
  const okPlay = p =>
    p.phase === ph ||
    (p.phase === 'work' && (ph === 'work' || ph === 'home')) ||
    (p.phase === 'college' && (ph === 'college' || ph === 'work' || ph === 'home')) ||
    (p.phase === 'senior' && (ph === 'work' || ph === 'home')) ||
    (p.phase === 'pri' && ph === 'college' && (p.id === 'pl-games' || p.id === 'pl-janghu'));
  D.plays.forEach(p => {
    if (okPlay(p)) out.push({
      kind: 'play',
      id: p.id,
      name: p.name,
      icon: p.icon,
      desc: effText({ stress: p.stress, sat: p.sat, ...p.attr }) || '只是放松',
      act: 2,
      extra: '',
      locked: S.act < 2 || (p.money && S.money < p.money),
      money: p.money || 0,
      tone: 'play'
    });
  });

  // 3) 打工
  D.payjobs.forEach(pj => {
    if (pj.phase === ph) out.push({
      kind: 'pay',
      id: pj.id,
      name: pj.name,
      icon: pj.icon,
      desc: '赚 ' + pj.money + ' 元',
      act: 3,
      extra: '',
      locked: S.act < 3,
      money: 0,
      tone: 'job'
    });
  });

  // 4) 索取
  if (ph !== 'baby') D.begs.forEach(b => {
    if (S.flags['beg_' + b.id]) return;
    const reqFace = b.face || 0;
    const reqSat = b.sat || 0;
    const ok = S.face >= reqFace && S.sat >= reqSat;
    out.push({
      kind: 'beg',
      id: b.id,
      name: '跟爸妈要「' + b.n + '」',
      icon: b.icon,
      desc: (b.desc || '') + ' · 成功率' + Math.round(b.w * 100) + '%',
      act: 2,
      extra: '需面子' + reqFace + (reqSat ? ' 满意' + reqSat : ''),
      locked: !ok || S.act < 2,
      money: 0,
      tone: 'beg'
    });
  });

  // 5) 休息
  out.push({
    kind: 'rest',
    id: 'rest',
    name: '好好睡一觉',
    icon: '💤',
    desc: '行动+30 减压',
    act: 0,
    extra: '',
    locked: false,
    money: 0,
    tone: 'rest'
  });
  return out;
}
function addSlot(pi) {
  const idx = S.slots.findIndex(x => !x);
  if (idx < 0) { toast('六件事排满了,过回合吧'); return false; }
  const actCost = pi.act || 0;
  const moneyCost = pi.money || 0;
  if (S.act < actCost) { toast('行动力不足'); return false; }
  if (moneyCost && S.money < moneyCost) { toast('零花钱不够'); return false; }
  S.slots[idx] = { kind: pi.kind, id: pi.id, act: actCost, money: moneyCost };
  S.act -= actCost;
  if (moneyCost) S.money -= moneyCost;
  persist();
  return true;
}
function applyAct(pi) {
  if (pi.kind === 'learn') {
    const c = D.courses.find(x => x.id === pi.id);
    if (!c) return;
    const lvl = S.skills[c.id] || 1;
    ATTRS.forEach(k => { if (c.attr && c.attr[k]) S.attrs[k] = Math.max(0, S.attrs[k] + c.attr[k]); });
    S.sat = clamp(S.sat + (c.sat || 2), 0, 140);
    S.stress = clamp(S.stress + (c.stress || 4), 0, 200);
    S.skills[c.id] = lvl + 1;
    log('练习了「' + c.name + '」 (掌握Lv' + (lvl + 1) + ')');
    if (c.tal && (lvl + 1 >= 5 || lvl + 1 >= 10)) rollTalent(c.tal.id, c.tal.p || 0.35);
  } else if (pi.kind === 'play') {
    const p = D.plays.find(x => x.id === pi.id);
    if (!p) return;
    S.stress = clamp(S.stress + (p.stress || 0), 0, 200);
    S.sat = clamp(S.sat + (p.sat || 0), 0, 140);
    ATTRS.forEach(k => { if (p.attr && p.attr[k]) S.attrs[k] += p.attr[k]; });
    if (p.tal && Math.random() < 0.08) rollTalent(p.tal.id, 1);
    log('玩了「' + p.name + '」');
  } else if (pi.kind === 'pay') {
    const pj = D.payjobs.find(x => x.id === pi.id);
    if (!pj) return;
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
  // 执行日常安排的六件事
  S.slots.forEach(s => applyAct(s));
  S.turn++;
  const t = S.turn;
  // 每回合刷新全新脑洞 (6x6)
  S.brain = { layer: 1, g: bGen() };
  // 家族天赋：每回合自然全属性成长加成 (一代更比一代强！)
  if (S.fam && S.fam.talent > 0) {
    const famBonus = Math.max(1, Math.floor(S.fam.talent / 2));
    ATTRS.forEach(k => { S.attrs[k] += famBonus; });
  }
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
  if (t === 54) pendPromotion();
  if (t === 58) pendMarry();
  if (t >= 60 && !S.pending.some(x => x.type === 'endgen')) pendEndGen();

  // 阶段蜕变与成长结算提示
  if ([9, 15, 25, 33, 45, 51, 58].indexOf(t) >= 0) {
    const starters = { 9: 'pinyin', 15: 'cn-shizi', 25: 'cn-mingzhu', 33: 'g-gao-cn', 45: 'u-gao' };
    const stId = starters[t];
    if (stId && S.learnedCourses && S.learnedCourses.indexOf(stId) < 0) {
      S.learnedCourses.push(stId);
      S.skills[stId] = 1;
    }
    const ph = cls();
    const trans = (D.phaseTransitions && D.phaseTransitions[ph]) ? D.phaseTransitions[ph] : null;
    if (trans) {
      S.pending.push({
        type: 'phase_transition',
        phase: ph,
        turn: t,
        trans: trans,
        stats: { ...S.attrs },
        talentsCount: S.talents.length,
        learnedCount: S.learnedCourses.length,
        face: S.face,
        sat: S.sat,
        stress: S.stress,
        opts: ['🚀 领取阶段成长礼，迈入新人生！']
      });
    } else {
      S.pending.push({ type: 'news', title: '新阶段', body: PHASE_CN[cls()] + '开始!' + (PHASE_TIPS[cls()] || ''), opts: ['好'] });
    }
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
/* 单科考分上限表 —— 防止课程无限重复排课把每代高考都顶到满分 20000 (2026-09 平衡修复) */
const SUBJ_CAP = { cn: 55, ma: 60, en: 42, sc: 58, so: 34 };
function subjPts() {
  const pts = { cn: 0, ma: 0, en: 0, sc: 0, so: 0 };
  Object.keys(S.skills).forEach(cid => {
    const c = D.courses.find(x => x.id === cid);
    if (!c || !c.ex) return;
    const L = Math.min(S.skills[cid], 8); // 考试按掌握度计分, Lv8 后继续刷只涨属性、不再涨考分
    if (c.ex === 'all') { pts.cn += L * 10; pts.ma += L * 10; pts.en += L * 10; pts.sc += L * 10; pts.so += L * 10; }
    else if (c.ex === 'all+') { pts.cn += L * 16; pts.ma += L * 16; pts.en += L * 16; pts.sc += L * 16; pts.so += L * 16; }
    else if (pts[c.ex] !== undefined) pts[c.ex] += L;
  });
  Object.keys(SUBJ_CAP).forEach(k => { pts[k] = Math.min(pts[k], SUBJ_CAP[k]); });
  return pts;
}
function cattr(keys, cap) {
  // 考试属性加成封顶, 防止多代遗传滚雪球后无限涨分
  let v = 0;
  keys.forEach(k => v += Math.min((S.attrs[k] || 0), cap));
  return v;
}
function pendFinal() {
  const p = subjPts();
  const tg = Math.round((p.cn + p.ma + p.en) * 60 + p.sc * 45 + p.so * 40 + cattr(['iq', 'mem'], 200) * 3 + Math.min(S.exambuff || 0, 60) * 2);
  const rank = tg < 3500 ? '班级后段' : tg < 7000 ? '中游' : tg < 10500 ? '上游' : '名列前茅';
  const fd = { '班级后段': -10, 中游: 0, 上游: 10, '名列前茅': 20 }[rank];
  S.face = Math.max(0, S.face + fd);
  S.pending.push({ type: 'news', title: '期末考成绩单', body: '总分 ' + tg + ' · ' + rank + '\n面子 ' + (fd >= 0 ? '+' : '') + fd, opts: ['好'] });
}
function pendZhongkao() {
  const p = subjPts();
  const tg = Math.round((p.cn * 55 + p.ma * 55 + p.en * 45 + p.sc * 50 + p.so * 40) + cattr(['iq', 'mem'], 200) * 4 + Math.min(S.exambuff || 0, 100) * 3);
  const lvl = tg < 5200 ? '职高' : tg < 8800 ? '普高' : '重点';
  const fb = { 职高: -8, 普高: 5, 重点: 20 }[lvl];
  const bu = { 职高: 150, 普高: 300, 重点: 500 }[lvl];
  S.face = Math.max(0, S.face + fb);
  S.exambuff = clamp((S.exambuff || 0) + bu, 0, 200);
  S.flags.zhongkao = lvl;
  S.pending.push({ type: 'news', title: '中考出分', body: '总分 ' + tg + '\n进了: ' + lvl + (lvl === '重点' ? ' 全家扬眉吐气!' : lvl === '普高' ? ' 爸妈沉默了一下午。' : ' ……没事,人生不止高考。') + '\n高中考分加成: ' + bu, opts: ['好'] });
}
function pendGaokao() {
  const p = subjPts();
  const raw =
    (p.cn * 70 + p.ma * 70 + p.sc * 70 + p.en * 52 + p.so * 46) +
    cattr(['iq', 'mem'], 250) * 5 +
    Math.min(S.exambuff || 0, 80) * 8 +
    Math.min(S.attrs.img || 0, 200) * 2;
  const tg = Math.min(20000, Math.round(raw));
  let band = D.gk[0]; let idx = 0;
  D.gk.forEach((g, i) => { if (tg >= g.min) { band = g; idx = i; } });
  S.gaokaoScore = tg; S.uniTier = idx;
  const fd = [-15, -5, 5, 15, 25, 40][idx];
  S.face = Math.max(0, S.face + fd);
  if (tg >= 19000) rollTalent('gaokao', 1);

  const majorOpts = (D.majors || []).map(m => ({
    label: m.icon + ' ' + m.n,
    sub: m.desc,
    id: m.id
  }));

  S.pending.push({
    type: 'gaokao_apply',
    title: '🎓 高考放榜 & 志愿填报',
    score: tg,
    tierName: band.t,
    body: '高考总分: ' + tg + ' / 20000\n录取位次: 『' + band.t + '』\n' +
          (idx >= 4 ? '班主任在群里连发三次红包！全校拉起大红横幅！' : idx <= 1 ? '年轻人,人生还有很多赛道，未来依然可期。' : '还不错,向前看吧。') +
          '\n\n请填报你的大学专业志向：',
    opts: majorOpts.length ? majorOpts : ['文理兼修']
  });
}

/* ---------- 特长才艺选秀大会 (The Talent Grand Show) ---------- */
function pendShow(tier, title) {
  const judges = [
    { name: '张教授', icon: '🧐', title: '资深老学究', style: '严苛治学', motto: '“基本功是骗不了人的！”' },
    { name: '麦克老师', icon: '🕶️', title: '前卫潮人导师', style: '看重舞台张力', motto: '“Show me the passion, baby!”' },
    { name: '李主任', icon: '👩‍🏫', title: '少年宫主任', style: '慈祥鼓励', motto: '“每个登台的孩子都是最棒的！”' },
  ];
  // 随机对手及其特长
  const rivalRank = Math.min(4, Math.max(1, tier <= 2 ? RI(1, tier + 1) : RI(2, Math.min(4, tier))));
  const candidates = D.talentData.filter(t => t.r === rivalRank);
  const rivalTalent = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : { id: 'rival_t', n: '合唱领唱', r: rivalRank, icon: '🎵', atk: Math.pow(7, rivalRank) };
  const rivalNames = tier === 1 ? ['中班王小明', '隔壁圆圆'] : tier === 2 ? ['三年二班陈同学', '少儿兴趣班班长'] : tier === 3 ? ['初三文体委员', '外校全能学霸'] : ['省实验高中尖子生', '全省奥赛冠军'];
  const rivalName = rivalNames[Math.floor(Math.random() * rivalNames.length)];

  S.pending.push({
    type: 'show',
    tier,
    title: title || '特长才艺选秀大会',
    body: '舞台聚光灯亮起！全国少儿才艺大奖赛拉开帷幕，请检录你的出战特长！',
    lv: tier,
    judges,
    rival: {
      name: rivalName,
      talent: rivalTalent
    },
    opts: ['🎤 登台一展风采']
  });
}

function talentShowPerform(chosenTalentId) {
  const m = S.pending[0];
  if (!m || m.type !== 'show') return null;
  const tier = m.tier || 1;
  
  // 查找出战特长
  let mine = null;
  if (chosenTalentId) {
    mine = D.talentData.find(x => x.id === chosenTalentId);
  }
  if (!mine) {
    mine = bestTalent();
  }
  // 如果玩家没有任何特长，赋予保底【大嗓门】
  if (!mine) {
    mine = { id: 'voice_loud', n: '大嗓门', icon: '📢', r: 1, atk: 7, src: '天生大嗓门' };
  }

  const rival = m.rival || {
    name: '隔壁小明',
    talent: { id: 'rival_t', n: '儿歌串烧', r: 1, icon: '🎶', atk: 7 }
  };
  const rivalR = (rival.talent && rival.talent.r) || 1;

  // 3位评委依次亮灯判定
  const l1 = (mine.r > rivalR) || (mine.r === rivalR && Math.random() < 0.6) || (mine.r < rivalR && Math.random() < 0.10);
  const l2 = (mine.r >= rivalR && Math.random() < 0.85) || (mine.r < rivalR && Math.random() < 0.35);
  const l3 = (mine.r >= rivalR && Math.random() < 0.95) || (mine.r < rivalR && Math.random() < 0.50);

  const lights = [l1, l2, l3];
  const greenCount = lights.filter(Boolean).length;
  const win = greenCount >= 2;

  const gi = win ? (tier >= 3 ? 500 : 200) : 40;
  const gf = win ? (tier >= 3 ? 150 : 60) : -5;
  S.insight += gi;
  if (win) {
    S.face += gf;
  } else {
    S.face = Math.max(0, S.face + gf);
  }

  // 评委点评
  const judgeQuotes = [
    l1 ? '张教授推了推眼镜：“出招沉稳，功底扎实，是个可塑之才！”' : '张教授严肃摇头：“技艺尚浅，回去仍需戒骄戒躁，勤加苦练。”',
    l2 ? '麦克老师兴奋击节：“太炸了！全场的节奏都在你的指尖！”' : '麦克老师揉了揉太阳穴：“感觉还是少了一点爆发力，缺了灵魂。”',
    l3 ? '李主任慈祥鼓掌：“小小年纪敢于登台就非常值得鼓励，阿姨亮灯支持你！”' : '李主任微笑：“虽然稍有欠缺，但能站在这个舞台就是好样的！”'
  ];

  const danmaku = win ? [
    '“哇！这也太神了！！”',
    '“实至名归的冠军！给跪了！”',
    '“这就是传说中的神童吗！？”',
    '“快看快看，全场都在为TA喝彩！”'
  ] : [
    '“虽败犹荣！已经很厉害了！”',
    '“对手确实有点东西……”',
    '“下次一定能夺冠，加油！”'
  ];

  S.pending.shift(); // 移除当前 'show'
  const resultModal = {
    type: 'showr',
    tier,
    title: m.title,
    win,
    greenCount,
    lights,
    judgeQuotes,
    danmaku,
    mine,
    rival,
    gi,
    gf,
    body: (win
      ? `🎉 技惊四座！凭借【${mine.n}】力克对手【${rival.talent.n}】，赢得 ${greenCount}/3 盏全场绿灯夺得冠军！(悟性+${gi}, 面子+${gf})`
      : `惜败……对手【${rival.talent.n}】稍胜一筹，斩获优秀奖。(悟性+${gi}, 面子${gf})`),
    opts: ['收下奖项，走下舞台 🏆']
  };
  S.pending.push(resultModal);

  log((win ? '🏆 才艺选秀夺冠！' : '才艺选秀参与奖：') + '凭【' + mine.n + '】获悟性+' + gi + ', 面子' + (gf >= 0 ? '+' : '') + gf);
  return resultModal;
}

function showResult(tier) {
  const r = talentShowPerform();
  return r ? r.body : '';
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
  const oppMaxHp = opp.face || 300;
  S.faceDuel = {
    n,
    opp: {
      id: opp.id,
      name: opp.n,
      icon: opp.icon || '🧑‍🎓',
      style: opp.style || '炫耀',
      hp: oppMaxHp,
      maxHp: oppMaxHp,
      atk: opp.atk || (n === 1 ? 55 : 35),
      lines: opp.l || ['我家孩子很优秀']
    },
    myHp: 400,
    maxMyHp: 400,
    round: 1,
    maxRound: 4,
    logs: ['「' + opp.n + '」带着孩子昂首走来，眼神中充满攀比火药味！'],
    defending: false,
    distracted: false,
    finished: false,
    won: false
  };

  S.pending.push({
    type: 'face_duel',
    title: '⚔️ 家族面子大对决 vs ' + opp.n,
    duel: S.faceDuel,
    body: '「' + opp.n + '」: 我家孩子 ' + (opp.l[0] || '很优秀') + '！\n\n四目相对，火药味弥漫全场，请亮出你的战术！',
    opts: [
      { label: '🌟 亮出主打特长: 「' + (mine ? mine.n : '大嗓门') + '」', sub: mine ? '威力 ' + RATK[mine.r] : '威力 18' },
      { label: '😏 心理战术: 凡尔赛冷嘲热讽', sub: '基于智商与情商造成真实心理伤害' },
      { label: '🛡️ 防守反击: 谦虚客套并反弹', sub: '大幅减伤并暗中反弹反击，回复气势' },
      { label: '📢 战术干扰: 先声夺人打乱节奏', sub: '打断对方节奏，降低其下轮输出' }
    ]
  });
}

function faceDuelStep(actionIdx) {
  const duel = S.faceDuel;
  if (!duel || duel.finished) return;
  const mine = bestTalent();
  let myDmg = 0;
  let playerLog = '';

  if (actionIdx === 0) {
    const baseAtk = mine ? RATK[mine.r] : 18;
    myDmg = Math.round(baseAtk * (0.9 + Math.random() * 0.4));
    duel.opp.hp = Math.max(0, duel.opp.hp - myDmg);
    playerLog = '第' + duel.round + '轮: 你亮出特长「' + (mine ? mine.n : '大嗓门') + '」，打掉对方 ' + myDmg + ' 点面子！';
  } else if (actionIdx === 1) {
    myDmg = Math.round(35 + (S.attrs.iq / 8) + (S.attrs.eq / 8) + RI(0, 15));
    duel.opp.hp = Math.max(0, duel.opp.hp - myDmg);
    playerLog = '第' + duel.round + '轮: 你轻描淡写地凡尔赛了几句，字字诛心！打掉对方 ' + myDmg + ' 点面子！';
  } else if (actionIdx === 2) {
    duel.defending = true;
    myDmg = Math.round(25 + RI(5, 15));
    duel.opp.hp = Math.max(0, duel.opp.hp - myDmg);
    duel.myHp = Math.min(duel.maxMyHp, duel.myHp + 30);
    playerLog = '第' + duel.round + '轮: 你笑呵呵地连称“哪里哪里，差得远”，化解攻势并暗讽反弹 ' + myDmg + ' 点面子，自身气势回复 30！';
  } else {
    duel.distracted = true;
    myDmg = Math.round(20 + RI(5, 15));
    duel.opp.hp = Math.max(0, duel.opp.hp - myDmg);
    playerLog = '第' + duel.round + '轮: 你突然岔开话题聊起养生，对方一时语塞！受到 ' + myDmg + ' 点面子动摇，下轮攻势被削弱！';
  }
  duel.logs.push(playerLog);

  if (duel.opp.hp <= 0) {
    duel.finished = true;
    duel.won = true;
    duel.logs.push('💥 ' + duel.opp.name + '面子彻底崩溃，借口灶上炖着汤悻悻离席！');
    S.face += 120;
    return;
  }

  let oppAtk = Math.round((duel.opp.atk || 35) * (0.8 + Math.random() * 0.4));
  if (duel.defending) oppAtk = Math.round(oppAtk * 0.35);
  if (duel.distracted) oppAtk = Math.round(oppAtk * 0.5);
  duel.defending = false;
  duel.distracted = false;

  const oppLine = duel.opp.lines[(duel.round - 1) % duel.opp.lines.length] || '我家孩子很棒！';
  duel.myHp = Math.max(0, duel.myHp - oppAtk);
  duel.logs.push('对手回敬「' + oppLine + '」，你损失了 ' + oppAtk + ' 点面子。');

  if (duel.myHp <= 0) {
    duel.finished = true;
    duel.won = false;
    duel.logs.push('🌧️ 我方面子告罄，在亲戚的吹捧声中败下阵来……');
    S.face = Math.max(0, S.face - 40);
    return;
  }

  duel.round++;
  if (duel.round > duel.maxRound) {
    duel.finished = true;
    duel.won = duel.myHp >= duel.opp.hp;
    if (duel.won) {
      duel.logs.push('🎉 4轮交锋结束，我方面子更胜一筹！全场称赞！');
      S.face += 120;
    } else {
      duel.logs.push('败下阵来……妈妈说今晚回家不吃鸡肉了。');
      S.face = Math.max(0, S.face - 40);
    }
  }
}

/* ---------- 🗳️ 班干部竞选演说策略博弈 (Class Committee Election) ---------- */
function pendElection() {
  const rivals = [
    { name: '王小明', title: '原班长·全科代表', icon: '🧑‍🏫', motto: '“带领全班考第一是我的责任！”', votes: 0 },
    { name: '李华', title: '文艺课代表', icon: '🎨', motto: '“让大家的校园生活更多姿多彩！”', votes: 0 },
    { name: '赵小刚', title: '热血体育委员', icon: '🏀', motto: '“选我！以后体育课我带大家练球！”', votes: 0 }
  ];
  const rival = rivals[Math.floor(Math.random() * rivals.length)];
  const totalVotes = 50;
  const targetVotes = 26; // 过半当选门槛

  S.election = {
    round: 1,
    maxRound: 3,
    myVotes: 0,
    rival,
    totalVotes,
    targetVotes,
    logs: ['班级黑板报下，全班 50 名同学的班干部竞选演说大会正式开幕！'],
    finished: false,
    won: false
  };

  S.pending.push({
    type: 'election',
    title: '🗳️ 班干部三向竞选演说大会',
    body: '登上讲台，向全班同学发表施政演说！争夺班级中队长/班长席位！',
    election: S.election,
    opts: [
      { label: '🤝 亲民路线·倾听心声', sub: '基于情商，拉拢广大同学支持' },
      { label: '🌟 才艺展示·硬核特长', sub: '亮出最高特长才华，惊艳全场' },
      { label: '🍭 零食许诺·请客公关', sub: '花费 20 元买零食，吸引调皮同学' },
      { label: '📜 严密施政·学业互助', sub: '基于智商，赢得学霸与老师信赖' }
    ]
  });
}

function doElection(o) {
  const el = S.election;
  if (!el || el.finished) return 0;

  let myGain = 0;
  let logText = '';

  // 1) 玩家演讲拉票策略结算
  if (o === 0) {
    // 亲民路线: 依赖情商
    const eqBonus = Math.min(6, Math.floor(((S.attrs && S.attrs.eq) || 0) / 35));
    myGain = RI(8, 14) + eqBonus;
    S.sat = clamp(S.sat + 3, 0, 140);
    logText = '第' + el.round + '轮: 🤝 你真挚地倾听同学心声并承诺课后互助辅导，打动了普通同学，斩获 ' + myGain + ' 票！';
  } else if (o === 1) {
    // 才艺特长: 依赖特长稀有度
    const t = bestTalent();
    const rBonus = t ? t.r * 3 : 0;
    myGain = RI(7, 12) + rBonus;
    logText = '第' + el.round + '轮: 🌟 你当众亮出拿手绝活【' + (t ? t.n : '大嗓门') + '】，技惊四座，赢得 ' + myGain + ' 票！';
  } else if (o === 2) {
    // 零食公关: 消耗金钱
    S.money = Math.max(0, S.money - 20);
    S.sat = clamp(S.sat - 2, 0, 140);
    myGain = RI(10, 16);
    logText = '第' + el.round + '轮: 🍭 你许诺考后请大家吃校门口雪糕辣条，后排同学欢声雷动，获得 ' + myGain + ' 票！(零花钱-20)';
  } else {
    // 严密施政: 依赖智商
    const iqBonus = Math.min(6, Math.floor(((S.attrs && S.attrs.iq) || 0) / 35));
    myGain = RI(8, 13) + iqBonus;
    logText = '第' + el.round + '轮: 📜 你有条不紊地列出班级学习互助管理方案，学霸群体纷纷举手表决，获得 ' + myGain + ' 票！';
  }

  // 2) 对手竞选拉票
  const rivalGain = RI(6, 12);
  el.rival.votes += rivalGain;
  const rivalLog = '对手【' + el.rival.name + '】' + el.rival.motto + '，拉走了 ' + rivalGain + ' 票！';

  el.myVotes += myGain;
  el.logs.push(logText);
  el.logs.push(rivalLog);
  el.round++;

  // 3) 判定是否达成过半或轮次用尽
  if (el.round > el.maxRound || el.myVotes >= el.targetVotes || el.rival.votes >= el.targetVotes) {
    el.finished = true;
    el.won = el.myVotes >= el.rival.votes;
  }

  log('班干部竞选拉票: 我方得票+' + myGain + ', 对手+' + rivalGain + ' (当前 ' + el.myVotes + ' vs ' + el.rival.votes + ')');
  return myGain;
}

function electionFinish() {
  const el = S.election;
  if (!el) return;
  const win = el.myVotes >= el.rival.votes;
  el.finished = true;
  el.won = win;

  if (win) {
    S.face += 60;
    S.sat = clamp(S.sat + 15, 0, 140);
    Object.keys(S.npcAff || {}).forEach(k => {
      S.npcAff[k] = (S.npcAff[k] || 0) + 8;
    });
    S.pending.push({
      type: 'news',
      title: '🏆 成功当选班级中队长！',
      body: '经过三轮激烈的竞选演说，你以 ' + el.myVotes + ' 票力压对手【' + el.rival.name + '】(' + el.rival.votes + '票)！\n\n🎉 班主任郑重为你佩戴上光荣的“三道杠”中队长臂章！全班掌声雷动！\n(家庭面子+60, 父母满意+15, 同学全员好感+8)',
      opts: ['光荣就任 🎖️']
    });
  } else {
    S.face = Math.max(0, S.face - 10);
    S.pending.push({
      type: 'news',
      title: '竞选惜败：就任劳动委员',
      body: '最终得票 ' + el.myVotes + ' 票 vs ' + el.rival.votes + ' 票，对手【' + el.rival.name + '】胜选。\n\n班主任走下讲台拍拍你：“表现非常出色！虽然没当上班长，老师特委任你为劳动委员，继续发光发热！”\n(面子-10, 演说技巧大获提升)',
      opts: ['欣然受任 🧹']
    });
  }
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

/* ---------- 💼 职场年中绩效考核与晋升答辩 (Promotion Assessment) ---------- */
function pendPromotion() {
  const job = S.job || { n: '普通职员', icon: '💻', t: 1 };
  const curTier = job.t || 1;
  const salary = S.workSalary || 300;

  S.pending.push({
    type: 'promotion',
    title: '💼 职场年中绩效考核与晋升答辩',
    job,
    curTier,
    salary,
    body: '入职以来，你的综合能力与岗位产出迎来了全公司年中大考！\n当前岗位：' + (job.icon || '💼') + ' ' + (job.n || job.name) + ' (门第 Tier ' + curTier + ')\n当前月薪：' + salary + ' 元/回\n\n请选择你向集团考核委员会陈述的核心答辩策略：',
    opts: [
      { label: '🚀 主攻业务突破与技术硬实力', sub: '依赖智商与记忆，展示无可替代的专业产出' },
      { label: '🤝 强调跨部门统筹与领导力', sub: '依赖情商与魅力，展现管理潜力与团队凝聚力' },
      { label: '📈 亮出攻坚克难与抗压战绩', sub: '依赖体魄与执行力，凸显高强度的敬业精神' }
    ]
  });
}

function promotionResolve(i) {
  const m = S.pending[0];
  if (!m) return '';
  S.pending.shift();
  const job = S.job || { n: '职场骨干', icon: '💼', t: 1 };
  if (!S.job) S.job = job;
  const attrs = S.attrs || { iq: 0, eq: 0, mem: 0, img: 0, phy: 0, cha: 0 };

  const rawIdx = (typeof i === 'object' && i && i.tactic != null) ? i.tactic : (typeof i === 'number' ? i : 0);
  const tacticIdx = clamp(rawIdx, 0, 2);

  let score = 0;
  if (tacticIdx === 0) {
    score = Math.floor((attrs.iq + attrs.mem) / 40) + RI(8, 14);
  } else if (tacticIdx === 1) {
    score = Math.floor((attrs.eq + attrs.cha) / 40) + RI(8, 14);
  } else {
    score = Math.floor((attrs.phy + attrs.iq) / 40) + RI(8, 14);
  }

  // 晋升门槛根据当前阶层递增
  const need = 15 + (job.t || 1) * 3;
  const isPromoted = score >= need && (job.t || 1) < 5;

  if (isPromoted) {
    job.t = Math.min(5, (job.t || 1) + 1);
    const prefixMap = { 2: '资深', 3: '主管', 4: '总监', 5: '合伙人' };
    const prefix = prefixMap[job.t] || '首席';
    job.n = prefix + '·' + (job.n || job.name || '核心骨干');
    S.workSalary = Math.round(S.workSalary * 1.5);
    S.face += 50;
    S.sat = clamp(S.sat + 15, 0, 140);
    const msg = '🎉 绩效考核斩获评级【S+】！\n' +
      '委员会一致通过你的晋升申请！正式擢升为【' + job.n + '】(门第 Tier ' + job.t + ')！\n' +
      '月薪暴涨至 ' + S.workSalary + ' 元/回！家庭面子 +50，父母欣慰之至！';
    log('职场晋升成功！擢升为「' + job.n + '」，月薪升至 ' + S.workSalary + ' 元');
    return msg;
  } else {
    S.workSalary = Math.round(S.workSalary * 1.1);
    S.face += 10;
    const msg = '考核平稳通过，评级为【B+】。\n' +
      '领导对你的踏实表现表示认可，薪资微调至 ' + S.workSalary + ' 元/回 (面子+10)。\n' +
      '继续在岗位上深耕蓄力！';
    log('年中绩效考核评级 B+，薪资微调至 ' + S.workSalary);
    return msg;
  }
}
function pendMarry() {
  let cand = null, bestAff = 0;
  Object.keys(S.npcAff || {}).forEach(id => {
    if (S.npcAff[id] > bestAff) {
      bestAff = S.npcAff[id];
      const npc = D.npcs.find(x => x.id === id);
      cand = {
        id,
        name: (npc && npc.n) || 'TA',
        icon: (npc && npc.icon) || '🌸',
        gender: (npc && npc.gender) || '女',
        aff: S.npcAff[id],
        intro: (npc && npc.intro) || '青梅竹马同窗',
        bonus: (npc && npc.bonus) || { eq: 20, img: 25 },
        quote: (npc && npc.quotes && npc.quotes.like) || '“我一直在等你这句话……”'
      };
    }
  });

  if (cand && bestAff >= 60) {
    S.pending.push({
      type: 'marry',
      title: '💍 从校服到婚纱 · 浪漫求婚时刻',
      isCampus: true,
      cand: cand,
      body: '与【' + cand.name + '】(好感度 ' + cand.aff + ')从青涩学生时代一路相伴至今。\n从放学推单车、课间借橡皮，到今天面对人生大事，你想对TA说——',
      opts: [
        { label: '💍 拿出钻戒，单膝跪地浪漫求婚！', sub: '缔结「校园恋人」，全额注入下一代遗传基因底蕴' },
        { label: '🍂 顺其自然，互道珍重 (专注事业)', sub: '暂时保持单身，把青葱回忆留在心底' }
      ]
    });
  } else {
    const prob = Math.min(0.92, Math.max(0.35, 0.40 + S.face * 0.001 + (S.attrs ? S.attrs.cha : 0) * 0.0015));
    const blindCandidates = [
      {
        id: 'blind-doc',
        name: '三甲医院林医生',
        icon: '🩺',
        tag: '三甲名医',
        intro: '外科主治医师，严谨体面，工作稳定受人尊重',
        bonus: { iq: 20, mem: 15, eq: 10 },
        pref: '看重学识与稳重'
      },
      {
        id: 'blind-gov',
        name: '机关单位李骨干',
        icon: '🏛️',
        tag: '体制内精英',
        intro: '市直单位业务中坚，处事得体周全，长辈心头好',
        bonus: { eq: 20, cha: 15, mem: 10 },
        pref: '看重家庭门第与谈吐'
      },
      {
        id: 'blind-cafe',
        name: '咖啡馆主理人晴晴',
        icon: '☕',
        tag: '青梅发小',
        intro: '独立咖啡馆主理人，温柔浪漫，富有生活情调',
        bonus: { img: 20, cha: 15, eq: 10 },
        pref: '看重个人魅力与投缘'
      }
    ];

    S.pending.push({
      type: 'marry',
      title: '💌 长辈公园相亲角 · 婚恋大抉择',
      isCampus: false,
      prob,
      blindCandidates,
      body: '青春专注拼搏未曾早恋，三十而立后，你被长辈拉到了公园相亲角！\n现场红绳挂满了优质相亲简历，父母在旁焦急张望……',
      opts: [
        { label: '🩺 约见【三甲医院林医生】', sub: '成婚率 ' + Math.round(prob * 100) + '% · 遗传: 智商+20, 记忆+15' },
        { label: '🏛️ 约见【机关单位李骨干】', sub: '成婚率 ' + Math.round(prob * 100) + '% · 遗传: 情商+20, 魅力+15' },
        { label: '☕ 约见【咖啡馆主理人晴晴】', sub: '成婚率 ' + Math.round(prob * 100) + '% · 遗传: 想象+20, 魅力+15' },
        { label: '💼 婉拒相亲，专注搞事业 (保持单身)', sub: '独善其身，无伴侣遗传加成' }
      ]
    });
  }
}

function marryResolve(i) {
  const m = S.pending[0];
  if (!m) return '';
  S.pending.shift();
  const choiceIdx = (typeof i === 'object' && i && i.choice != null) ? i.choice : (typeof i === 'number' ? i : 0);
  if (m.cand) {
    if (choiceIdx === 0) {
      S.spouse = {
        name: m.cand.name || m.cand.n,
        icon: m.cand.icon || '💑',
        aff: m.cand.aff,
        tag: '校园恋人',
        bonus: m.cand.bonus,
        npcId: m.cand.id
      };
      S.face += 40;
      return '💍 喜结连理！你与「' + (m.cand.name || m.cand.n) + '」在亲友见证下步入婚姻殿堂！(面子+40，基因全额注入后代)';
    }
    return '彼此都懂，但你决定暂时不打扰，把青葱回忆留在心底。保持单身。';
  }
  // 相亲模式
  if (choiceIdx === 3 || (m.blindCandidates && choiceIdx >= m.blindCandidates.length)) {
    return '你收起简历，决定专注于拼搏事业。七大姑八大姨在群里叹息：“这孩子怎么就不知道急呢？”';
  }
  const target = (m.blindCandidates && m.blindCandidates[choiceIdx]) || { name: '相亲良缘', icon: '💑', tag: '相亲良缘', bonus: { iq: 15, eq: 15 } };
  const ok = Math.random() <= (m.prob || 0.5);
  if (ok) {
    S.spouse = {
      name: target.name,
      icon: target.icon || '💑',
      tag: '相亲良缘',
      bonus: target.bonus,
      title: target.tag
    };
    S.face += 25;
    return '🎉 相亲大获成功！你与【' + target.name + '】一见投缘，不久后领证组建温馨家庭！(面子+25)';
  }
  return '相亲席上相顾无言，未能擦出火花。长辈叹气：“看来缘分还未到，继续努力吧！”';
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

  // 伴侣基因增益
  let spouseBonus = { iq: 6, eq: 6, mem: 6, img: 6, phy: 6, cha: 6 };
  let spouseTag = '独善其身 (单身)';
  if (S.spouse) {
    spouseTag = S.spouse.tag || '相伴一生';
    if (S.spouse.bonus) {
      spouseBonus = { iq: 6, eq: 6, mem: 6, img: 6, phy: 6, cha: 6, ...S.spouse.bonus };
    } else if (spouseTag === '校园恋人') {
      spouseBonus = { eq: 20, img: 25, cha: 16, iq: 10, mem: 6, phy: 6 };
    } else {
      spouseBonus = { iq: 15, mem: 15, eq: 12, cha: 12, phy: 6, img: 6 };
    }
  } else {
    spouseBonus = { phy: 14, img: 14, iq: 8, eq: 8, mem: 6, cha: 6 };
  }

  // 家族成长基金 (上一代积蓄的 15%)
  const seedMoney = Math.min(300, Math.max(30, Math.floor((S.money || 0) * 0.15)));

  // 本代人生综合得分与评级 (对齐 GAME-DESIGN.md 12 节: 职业40% + 婚姻20% + 财富10% + 天赋30%)
  const jobScore = Math.min(100, (job.t || 0) * 20 + 20);
  const marryScore = S.spouse ? (S.spouse.tag === '校园恋人' ? 100 : 85) : 40;
  const moneyScore = Math.min(100, Math.round((S.money || 0) / 25));
  const talentScore = Math.min(100, newFamTalent * 8 + (S.gaokaoScore >= 17000 ? 30 : S.gaokaoScore >= 12000 ? 15 : 0));
  const totalLifeScore = Math.round(jobScore * 0.4 + marryScore * 0.2 + moneyScore * 0.1 + talentScore * 0.3);

  let rating = 'B';
  let ratingDesc = '负重前行 · 坚韧生长';
  if (totalLifeScore >= 88) { rating = 'SSS'; ratingDesc = '家族传奇 · 光耀门楣'; }
  else if (totalLifeScore >= 78) { rating = 'SS'; ratingDesc = '社会栋梁 · 傲视群雄'; }
  else if (totalLifeScore >= 68) { rating = 'S'; ratingDesc = '小康体面 · 岁月静好'; }
  else if (totalLifeScore >= 52) { rating = 'A'; ratingDesc = '平凡可贵 · 烟火人间'; }

  // 经典高光回顾
  let highlight = '踏实走完精彩一代，将温暖与希望毫无保留地交托下一代！';
  if (S.gaokaoScore >= 19000) highlight = '高考斩获 ' + S.gaokaoScore + ' 分直通清北，全校拉起大红横幅！';
  else if ((job.t || 0) >= 5) highlight = '白手起家终成首富，家族跨越直达金字塔尖！';
  else if (S.spouse && S.spouse.tag === '校园恋人') highlight = '与校园白月光相守白头，亲友齐赞神仙眷侣！';
  else if (S.talents && S.talents.length >= 8) highlight = '一身神级特长横扫各大舞台，人称『别人家孩子本尊』！';
  else if (S.gaokaoScore >= 14000) highlight = '高考勇夺名牌大学，爸妈在亲戚群里连发三天大红包！';
  else if ((job.t || 0) >= 3) highlight = '跻身社会精英阶层，生活体面宽裕，爸妈逢人便夸！';

  const prevHistory = (S.fam && S.fam.history) || [];
  const historyItem = {
    gen: S.gen,
    name: S.name,
    gender: S.gender,
    job: jobName,
    jobIcon: job.icon || '🛋️',
    jobTier: job.t || 0,
    spouse: S.spouse ? S.spouse.name : '独善其身 (单身)',
    spouseTag: S.spouse ? S.spouse.tag : '',
    uniTier: S.uniTier || 0,
    gk: S.gaokaoScore || 0,
    score: totalLifeScore,
    rating: rating,
    ratingDesc: ratingDesc,
    talentsCount: (S.talents || []).length,
    highlight: highlight
  };
  const updatedHistory = [...prevHistory, historyItem];

  // 家族传家荣誉成就检测
  const prevAchievements = (S.fam && S.fam.achievements) || [];
  const updatedAchievements = [...prevAchievements];
  function addAch(id) {
    if (updatedAchievements.indexOf(id) < 0) updatedAchievements.push(id);
  }
  if ((S.gaokaoScore || 0) >= 19000) addAch('ach-gk-top');
  if (job.id === 'j-first' || (job.t || 0) >= 5) addAch('ach-first-rich');
  if (S.spouse && S.spouse.tag === '校园恋人') addAch('ach-love-true');
  if ((S.talents || []).length >= 8) addAch('ach-talent-all');
  if (S.gen >= 5) addAch('ach-gen-5');
  if ((S.fam ? S.fam.tier : 0) <= 1 && ((job.t || 0) >= 4 || S.uniTier >= 4)) addAch('ach-zero-break');
  if (totalLifeScore >= 90) addAch('ach-perfect-life');

  const fam = {
    g: S.gen,
    name: S.name,
    gender: S.gender,
    tier: Math.max((S.fam ? S.fam.tier : 0), job.t || 0),
    talent: newFamTalent,
    attr: { ...S.attrs },
    atlas: mergedAtlas,
    history: updatedHistory,
    achievements: updatedAchievements,
    lastJob: jobName,
    lastScore: S.gaokaoScore || 0,
    uniTier: S.uniTier || 0,
    shadow: S.shadow || 0,
    stress: S.stress || 0,
    lastSpouse: S.spouse ? S.spouse.name : '独善其身 (单身)',
    spouseBonus,
    seedMoney,
    totalLifeScore,
    rating,
    ratingDesc,
    highlight,
    jobScores: { jobScore, marryScore, moneyScore, talentScore }
  };
  saveFam(fam);
  S.fam = fam;

  S.pending.push({
    type: 'endgen',
    title: '第 ' + S.gen + ' 代 · 人生终章结算',
    fam: fam,
    score: totalLifeScore,
    rating: rating,
    ratingDesc: ratingDesc,
    highlight: highlight,
    job: job,
    jobName: jobName,
    opts: ['🌟 托付家族火炬，生下下一代！']
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
  return D.npcs.filter(n => n.gender === meG).map(n => ({
    id: n.id,
    name: n.n,
    icon: n.icon,
    aff: S.npcAff[n.id] || 0,
    intro: n.intro,
    like: n.like || [],
    quotes: n.quotes || {}
  }));
}
function chat(id) {
  if (S.act < 3) { toast('行动力不足(需3)'); return; }
  S.act -= 3;
  const g = RI(3, 8);
  S.npcAff[id] = clamp((S.npcAff[id] || 0) + g, 0, 100);
  const nm = (D.npcs.find(n => n.id === id) || {}).n || 'ta';
  log('和' + nm + '聊了聊,好感+' + g);
  if (S.npcAff[id] >= 60) toast('💕 ' + nm + '好像对你有点特别……');
  save();
  return g;
}
function gift(id, itemId) {
  if (S.act < 3) { toast('行动力不足(需3)'); return null; }
  const npc = D.npcs.find(n => n.id === id);
  if (!npc) return null;
  if (!S.bag) S.bag = {};

  let giftItem = null;
  if (itemId && S.bag[itemId] > 0) {
    giftItem = D.store.find(s => s.id === itemId);
    S.bag[itemId]--;
    if (S.bag[itemId] <= 0) delete S.bag[itemId];
  } else if (itemId) {
    giftItem = D.store.find(s => s.id === itemId);
    if (!giftItem || S.money < giftItem.price) { toast('道具不足且零钱不够购买'); return null; }
    S.money -= giftItem.price;
  } else {
    if (S.money < 25) { toast('零花钱不够(需25元)'); return null; }
    S.money -= 25;
  }

  S.act -= 3;
  const isFav = giftItem && npc.like && npc.like.some(lk => giftItem.n.indexOf(lk) >= 0 || lk.indexOf(giftItem.n) >= 0);
  const g = isFav ? RI(22, 32) : (giftItem ? RI(12, 18) : RI(10, 16));
  const prevAff = S.npcAff[id] || 0;
  S.npcAff[id] = clamp(prevAff + g, 0, 100);

  let quote = '';
  if (isFav && npc.quotes && npc.quotes.like) {
    quote = npc.quotes.like;
  } else if (npc.quotes && npc.quotes.normal) {
    quote = npc.quotes.normal;
  }

  const giftName = giftItem ? giftItem.n : '精选小礼物';
  log('送给「' + npc.n + '」' + giftName + '，好感+' + g + (isFav ? ' (喜好暴击!)' : ''));
  if (quote) toast(npc.n + ': ' + quote);

  if (prevAff < 30 && S.npcAff[id] >= 30) toast('💌 与 ' + npc.n + ' 建立了默契，课间会互相传小纸条了。');
  else if (prevAff < 60 && S.npcAff[id] >= 60) toast('💕 ' + npc.n + ' 对你的心意与众不同，放学经常一起推单车。');
  else if (prevAff < 80 && S.npcAff[id] >= 80) toast('💖 与 ' + npc.n + ' 许下青葱约定，情愫渐深……');

  save();
  return { g, isFav, quote, aff: S.npcAff[id] };
}
function shopList() { return D.store.map(s => ({ ...s, can: S.money >= s.price, count: (S.bag && S.bag[s.id]) || 0 })); }
function buy(id) {
  const it = D.store.find(s => s.id === id);
  if (!it) return false;
  if (S.money < it.price) { toast('零钱不够'); return false; }
  S.money -= it.price;
  applyEff(it.eff);
  if (!S.bag) S.bag = {};
  S.bag[it.id] = (S.bag[it.id] || 0) + 1;
  log('买了「' + it.n + '」' + (effText(it.eff) ? '(' + effText(it.eff) + ')' : ''));
  save();
  return true;
}
function begWish(wishId) {
  const b = D.begs.find(x => x.id === wishId);
  if (!b) return { success: false, msg: '心愿不存在' };
  if (!S.flags) S.flags = {};
  if (S.flags['beg_' + b.id]) return { success: false, msg: '该心愿已达成，无需重复索取' };
  if ((S.wishPoints || 0) < 1) return { success: false, msg: '索取次数不足！可保持高满意度或考取优异成绩获得' };
  if (S.face < (b.face || 0)) return { success: false, msg: '家庭面子不足(需要 ' + b.face + ' 点面子)' };

  S.wishPoints = Math.max(0, (S.wishPoints || 1) - 1);
  const bonus = (S.sat >= 80 ? 0.15 : 0) + (S.face >= (b.face || 0) * 1.5 ? 0.1 : 0);
  const prob = clamp(b.w + bonus, 0.25, 0.95);
  const success = Math.random() < prob;

  if (success) {
    S.flags['beg_' + b.id] = 1;
    applyEff(b.eff);
    S.sat = clamp(S.sat + 10, 0, 140);
    log('🎉 索取成功! 父母同意了「' + b.n + '」的心愿(' + effText(b.eff) + ')');
    toast('🎉 索取成功! 获得「' + b.n + '」');
    save();
    return { success: true, name: b.n, eff: b.eff, prob: Math.round(prob * 100) };
  } else {
    S.sat = Math.max(0, S.sat - 8);
    log('索取「' + b.n + '」未通过: 父母对视三秒表示下次再说');
    toast('爸妈和你对视三秒:"前几天不是才买过?"(索取未通过)');
    save();
    return { success: false, name: b.n, prob: Math.round(prob * 100) };
  }
}

/* ---------- 脑洞 ---------- */
function bGen() {
  const G = [];
  for (let i = 0; i < 36; i++) {
    const r = Math.random();
    let t = 'bulb';
    if (r < 0.22) t = 'bulb';
    else if (r < 0.46) t = 'attr';
    else if (r < 0.56) t = 'bolt';
    else if (r < 0.65) t = 'bomb';
    else if (r < 0.74) t = 'skull';
    else if (r < 0.82) t = 'gold';
    else t = 'duck';
    G.push({ t, open: false });
  }
  G[RI(0, G.length - 1)].t = 'key';
  return G;
}
function bOpen() { if (!S.brain) S.brain = { layer: 1, g: bGen() }; return S.brain; }
function bGrid() { return bOpen().g; }

function applyBrainCell(c, b) {
  const db = 1 + (b.layer - 1) * 0.2;
  switch (c.t) {
    case 'bulb': { const v = Math.round(RI(10, 20) * db); S.insight += v; return '💡 悟性+' + v; }
    case 'attr': { const k = pick(['iq', 'eq', 'mem', 'img', 'phy']); const v = Math.round((RI(2, 4) + Math.max(0, b.layer - 1)) * db); S.attrs[k] += v; return ANAME[k] + '+' + v; }
    case 'bolt': { const v = RI(10, 25); S.act = clamp(S.act + v, 0, 240); return '⚡ 行动+' + v; }
    case 'skull': { const v = RI(2, 4); ['iq', 'eq', 'mem', 'img', 'phy'].forEach(k => S.attrs[k] += v); return '💀 脑内风暴:五维+' + v; }
    case 'gold': { const v = RI(8, 20); S.money += v; return '💰 零花+' + v; }
    case 'duck': return '🦆 鸭子看了你一眼';
    case 'key': return '🗝️ 钥匙';
    case 'bomb': return '💥 炸弹';
    default: return '';
  }
}

function bRev(i) {
  const b = bOpen();
  const c = b.g[i];
  if (!c || c.open) return null;
  if (S.act < 2) { toast('行动力不足(需要2)'); return null; }
  S.act -= 2;
  c.open = true;
  let res = '';

  if (c.t === 'key') {
    if (b.layer < 4) {
      b.layer++;
      b.g = bGen();
      S.act = clamp(S.act + 50, 0, 240);
      res = '🗝️ 钥匙! 下探第' + b.layer + '层(行动+50)';
    } else {
      S.act = clamp(S.act + 50, 0, 240);
      res = '🗝️ 钥匙! 下方脑洞施工中，下回合再来探索吧(行动+50)';
    }
  } else if (c.t === 'bomb') {
    const r0 = Math.floor(i / 6);
    const c0 = i % 6;
    const exploded = [];
    let foundKey = false;
    for (let j = 0; j < b.g.length; j++) {
      if (j === i) continue;
      const rj = Math.floor(j / 6);
      const cj = j % 6;
      if (Math.abs(rj - r0) <= 1 && Math.abs(cj - c0) <= 1 && !b.g[j].open) {
        const g2 = b.g[j];
        g2.open = true;
        if (g2.t === 'key') {
          foundKey = true;
        } else {
          const subEff = applyBrainCell(g2, b);
          if (subEff) exploded.push(subEff);
        }
      }
    }
    if (foundKey) {
      if (b.layer < 4) {
        b.layer++;
        b.g = bGen();
        S.act = clamp(S.act + 50, 0, 240);
        res = '💥 炸弹连锁炸出🗝️钥匙! 下探第' + b.layer + '层(行动+50)';
      } else {
        S.act = clamp(S.act + 50, 0, 240);
        res = '💥 炸出🗝️钥匙! 下方脑洞施工中(行动+50)';
      }
    } else {
      res = '💥 连环爆破!' + (exploded.length ? ' 获得: ' + exploded.slice(0, 3).join(' ') + (exploded.length > 3 ? '等' : '') : '');
    }
  } else {
    res = applyBrainCell(c, b);
  }

  // 保底：若当前层全部翻开，自动进入下一层或封顶提示
  if (b.g.every(x => x.open)) {
    if (b.layer < 4) {
      b.layer++;
      b.g = bGen();
      S.act = clamp(S.act + 30, 0, 240);
      res += ' · 🎉 本层全部翻开，下探第' + b.layer + '层(行动+30)!';
    } else {
      res += ' · 🎉 本层脑洞已全部挖通！下回合将刷新全新脑洞。';
    }
  }

  save();
  return res;
}
function bInfo() { const b = bOpen(); return { layer: b.layer, open: b.g.filter(x => x.open).length, total: b.g.length, maxLayer: 4 }; }

/* ---------- 新手礼包 ---------- */
function claimNovicePack() {
  if (!S) return null;
  if (!S.tutorial) S.tutorial = { done: false, step: 0, claimed: false };
  if (S.tutorial.claimed) return null;
  S.tutorial.claimed = true;
  S.tutorial.done = true;
  S.insight += 25;
  S.act = clamp(S.act + 25, 0, 240);
  persist();
  toast('🎁 成功领取【新手启蒙礼包】：悟性+25，行动+25！');
  log('领取了新手启蒙礼包(悟性+25,行动+25)');
  return { insight: 25, act: 25 };
}

/* ---------- 对外 ---------- */
const API = {
  state: () => S,
  newGame, resume, resetAll, restartLineage,
  save: () => persist(),
  persist,
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
  learnCourse, learnList,
  pool, addSlot, removeSlot, clearSlots, autoFillSlots,
  slots: () => S.slots,
  toast, flushToasts,
  endTurn, pending: () => S.pending.slice(),
  resolve: resolvePend,
  examBuff: () => S.exambuff,
  brain: { grid: bGrid, rev: bRev, info: bInfo },
  social: socialList, chat, gift, giftItem: gift,
  shop: shopList, buy, bag: () => (S && S.bag) || {},
  atlas, fam: getFam,
  claimNovicePack,
  faceDuel: () => (S && S.faceDuel),
  faceAction: faceDuelStep,
  wishPoints: () => ((S && S.wishPoints != null) ? S.wishPoints : 0),
  begWish,
  majors: () => D.majors || [],
  achievements: () => D.achievements || [],
  familyHistory: () => (S && S.fam && S.fam.history) || (loadFam() && loadFam().history) || [],
  talentShowPerform,
  talentsList: () => (S ? (S.talents || []).map(id => D.talentData.find(x => x.id === id)).filter(Boolean) : []),
  election: () => (S && S.election),
  saveManager: {
    getActiveSlot: () => activeSlot,
    setActiveSlot: (idx) => {
      const p = clamp(idx, 0, 2);
      activeSlot = p;
      if (LS) {
        try { LS.setItem('cph_active_slot', String(p)); } catch(e) {}
      }
    },
    listSlots,
    switchSlot,
    clearSlot,
    copySlot,
    exportSlot,
    importSlot
  },
  activeSlot: () => activeSlot,
  saveSlots: listSlots,
};
function getFam() { return S ? S.fam : (loadFam() || { g: 0, talent: 0, tier: 0, attr: {}, atlas: [] }); }

function resolvePend(i) {
  if (!S.pending.length) return '';
  const m = S.pending[0];
  let res = '';
  switch (m.type) {
    case 'intro': case 'news': case 'collapse': case 'final': case 'zhongkao': case 'gaokao': case 'career':
    case 'face': case 'electionr':
      S.pending.shift();
      if (m.type === 'collapse') { restartLineage(); return '重新开始'; }
      res = '';
      break;
    case 'choice': {
      const o = m.opts[i];
      if (o && o.eff) applyEff(o.eff);
      S.pending.shift();
      res = o ? o.label : '';
      break;
    }
    case 'mini_hb':
    case 'hongbao_duel': {
      S.pending.shift();
      let pos = 52;
      if (typeof i === 'object' && i !== null && typeof i.pos === 'number') {
        pos = clamp(i.pos, 0, 100);
      } else if (i === 1) {
        pos = 15;
      } else if (i === 2) {
        pos = 92;
      } else {
        pos = 52;
      }

      if (pos >= 38 && pos <= 68) {
        const v = RI(180, 260);
        S.money += v;
        S.face += 20;
        S.sat = clamp(S.sat + 6, 0, 140);
        res = '🎉 进退得体，堪称红包推拉大师！长辈欣慰塞下红包，父母在旁倍感有面！拿到 ' + v + ' 元压岁钱，面子+20！';
      } else if (pos < 35) {
        S.face += 10;
        res = '✋ 推辞得过于逼真，长辈叹口气收了回去：“这孩子太老实了！”(拿到 0 元，面子+10)';
      } else if (pos > 75) {
        const v = RI(120, 180);
        S.money += v;
        S.face = Math.max(0, S.face - 25);
        S.sat = Math.max(0, S.sat - 8);
        res = '💨 伸手太急！长辈尬笑塞给你，老妈在旁边狠狠掐了你一把……(拿到 ' + v + ' 元，面子-25)';
      } else {
        const v = RI(120, 180);
        S.money += v;
        S.face += 5;
        res = '🧧 几番客套拉扯下顺利收下，长辈笑得合不拢嘴。(拿到 ' + v + ' 元，面子+5)';
      }
      break;
    }
    case 'face_duel': {
      if (!S.faceDuel || S.faceDuel.finished) {
        const won = S.faceDuel ? S.faceDuel.won : true;
        S.pending.shift();
        S.faceDuel = null;
        res = won ? '🎉 面子对决大获全胜！面子+120' : '输了面子对决，面子-40';
      } else {
        const actIdx = (typeof i === 'number') ? i : 0;
        faceDuelStep(actIdx);
        if (S.faceDuel.finished) {
          m.finished = true;
          m.won = S.faceDuel.won;
          m.body = S.faceDuel.logs.slice(-3).join('\n\n');
          m.opts = [S.faceDuel.won ? '🏆 扬眉吐气！(面子+120)' : '默默低头 (面子-40)'];
          res = S.faceDuel.won ? '🎉 面子对决大获全胜！' : '输了半场对决。';
        } else {
          m.body = '【第 ' + S.faceDuel.round + ' / ' + S.faceDuel.maxRound + ' 轮交锋】\n' +
                   '我方面子: ' + S.faceDuel.myHp + ' / ' + S.faceDuel.maxMyHp + '  vs  ' +
                   S.faceDuel.opp.name + ': ' + S.faceDuel.opp.hp + ' / ' + S.faceDuel.opp.maxHp + '\n\n' +
                   S.faceDuel.logs.slice(-2).join('\n');
          res = '交锋中…';
        }
      }
      break;
    }
    case 'gaokao_apply': {
      const mj = (D.majors && D.majors[i]) ? D.majors[i] : (D.majors ? D.majors[0] : null);
      if (mj) {
        S.major = mj.id;
        if (mj.bonus) applyEff(mj.bonus);
        const courseMap = { cs: 'u-cs', med: 'u-med', fin: 'u-fin', art: 'u-film', eng: 'u-eng' };
        const cId = courseMap[mj.id];
        if (cId && S.learnedCourses && S.learnedCourses.indexOf(cId) < 0) {
          S.learnedCourses.push(cId);
          S.skills[cId] = 1;
        }
        res = '成功录取至【' + mj.n + '】专业！' + (mj.desc || '');
      } else {
        res = '顺利进入大学！';
      }
      S.pending.shift();
      break;
    }
    case 'show': {
      let chosenId = null;
      if (typeof i === 'string') {
        chosenId = i;
      } else if (typeof i === 'object' && i && i.talentId) {
        chosenId = i.talentId;
      } else if (typeof i === 'number') {
        const tList = (S.talents || []).map(id => D.talentData.find(x => x.id === id)).filter(Boolean);
        if (tList[i]) chosenId = tList[i].id;
      }
      const resModal = talentShowPerform(chosenId);
      res = resModal && resModal.win ? '才艺选秀夺冠！' : '才艺选秀登台';
      break;
    }
    case 'showr': {
      S.pending.shift();
      res = '走下选秀舞台';
      break;
    }
    case 'election': {
      const rawIdx = (typeof i === 'object' && i && i.tactic != null) ? i.tactic : (typeof i === 'number' ? i : 0);
      const tacticIdx = clamp(rawIdx, 0, 3);
      const v = doElection(tacticIdx);
      if (S.election && S.election.finished) {
        S.pending.shift();
        electionFinish();
      } else if (S.pending[0]) {
        S.pending[0].body = '第 ' + (S.election.round - 1) + ' 轮演说斩获 ' + v + ' 票！请选择下一轮施政演说策略！';
      }
      res = '竞选拉票斩获 ' + v + ' 票';
      break;
    }
    case 'promotion': res = promotionResolve(i); break;
    case 'marry': res = marryResolve(i); break;
    case 'phase_transition': {
      if (m.trans && m.trans.gift) {
        applyEff(m.trans.gift);
      }
      S.pending.shift();
      res = m.trans ? ('成功开启「' + m.trans.nextName + '」阶段！' + (m.trans.giftDesc ? ' ' + m.trans.giftDesc : '')) : '开启新阶段';
      break;
    }
    case 'endgen': {
      S.pending.shift();
      nextGen();
      res = '生下下一代';
      break;
    }
  }
  persist();
  return res;
}
global.CP = API;
if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);