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
  if (t <= 8) return Math.floor((t - 1) / 2); // 婴儿期 (Turn 1~8): 0~3岁, 每2回合+1岁
  if (t <= 14) return 3 + Math.floor((t - 9) / 2); // 幼儿园 (Turn 9~14): 3~5岁, 每2回合+1岁
  if (t <= 24) return 6 + Math.floor((t - 15) * 6 / 10); // 小学期 (Turn 15~24): 6~11岁, 约每2回合+1岁
  if (t <= 32) return 12 + Math.floor((t - 25) / 2); // 初中期 (Turn 25~32): 12~15岁, 每2回合+1岁 (中考15岁)
  if (t <= 44) return 15 + Math.min(3, Math.floor((t - 33) * 3 / 11)); // 高中期 (Turn 33~44): 15~18岁 (第44回合高考冲刺18岁)
  if (t <= 50) return 18 + Math.floor((t - 45) / 2); // 大学期 (Turn 45~50): 18~21岁, 毕业22岁
  if (t <= 57) return 22 + (t - 51); // 职场期 (Turn 51~57): 22~28岁
  return 30 + Math.floor((t - 58) / 2); // 成家后 (Turn 58+): 30岁+
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
        LS.removeItem('cph_save_0');
        LS.removeItem('cph_fam_0');
      } else {
        LS.removeItem('cph_save_' + idx);
        LS.removeItem('cph_fam_' + idx);
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
        if (t === 0) {
          LS.setItem('cph_save', JSON.stringify(s));
          LS.setItem('cph_save_0', JSON.stringify(s));
        }
      }
      if (fam) {
        LS.setItem(slotFamKey(t), JSON.stringify(fam));
        if (t === 0) {
          LS.setItem('cph_fam', JSON.stringify(fam));
          LS.setItem('cph_fam_0', JSON.stringify(fam));
        }
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
        if (idx === 0) {
          LS.setItem('cph_save', JSON.stringify(saveObj));
          LS.setItem('cph_save_0', JSON.stringify(saveObj));
        }
      }
      if (famObj) {
        LS.setItem(slotFamKey(idx), JSON.stringify(famObj));
        if (idx === 0) {
          LS.setItem('cph_fam', JSON.stringify(famObj));
          LS.setItem('cph_fam_0', JSON.stringify(famObj));
        }
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
  const t = S ? S.turn : 7;
  let diff = 1.0;
  if (t <= 14) diff = 0.8;
  else if (t <= 28) diff = 1.0;
  else diff = 1.35;

  const relatives = [
    {
      n: '大姑妈',
      line: '“哎呀小宝又长高了！拿着，大姑给买新书包的！”',
      mom: '“使不得使不得，大姐你留着买菜！”',
      driftBias: 0.6, // 偏向猛塞
      waveAmp1: 3.6,
      waveAmp2: 1.8,
      waveFreq1: 0.075,
      goldenCenter: 56,
      goldenWidth: Math.round(26 / diff),
      startPos: 24, // 初始落在左侧拒收边缘
      gustChance: 0.35,
      gustText: '大姑妈猛地往你羽绒服口袋一塞：“拿着买肉吃！”',
      amountBase: 240
    },
    {
      n: '二叔叔',
      line: '“小男子汉/漂亮姑娘！二叔给的压岁钱，必须收着！”',
      mom: '“二弟你太客气了，小孩子不能惯着！”',
      driftBias: -0.5, // 偏向往回收缩
      waveAmp1: 3.3,
      waveAmp2: 2.0,
      waveFreq1: 0.07,
      goldenCenter: 62,
      goldenWidth: Math.round(28 / diff),
      startPos: 78, // 初始落在右侧
      gustChance: 0.4,
      gustText: '二叔顺坡下驴往回缩：“哎呀孩子不要那就算了……”',
      amountBase: 200
    },
    {
      n: '表舅爷',
      line: '“舅爷的一点心意！好好读书考大学！”',
      mom: '“舅爷快收回去，我们怎么能要您的钱！”',
      driftBias: 0.1, // 强振荡波
      waveAmp1: 4.6,
      waveAmp2: 2.4,
      waveFreq1: 0.085,
      goldenCenter: 50,
      goldenWidth: Math.round(22 / diff),
      startPos: 20,
      gustChance: 0.45,
      gustText: '表舅爷爽朗大喝：“读书人的事！谁也别拦着！”',
      amountBase: 280
    },
    {
      n: '隔壁王阿姨',
      line: '“压岁钱给孩子讨个好彩头，大吉大利！”',
      mom: '“王姐真不用，平时承蒙您多关照了！”',
      driftBias: 0.2,
      waveAmp1: 2.6,
      waveAmp2: 1.4,
      waveFreq1: 0.095,
      goldenCenter: 52,
      goldenWidth: Math.round(18 / diff), // 超窄黄金区间
      startPos: 26,
      gustChance: 0.25,
      gustText: '王阿姨笑盈盈地打量着你的神色反应……',
      amountBase: 210
    },
  ];
  const rel = pick(relatives);
  const halfW = Math.round(rel.goldenWidth / 2);
  const goldenMin = clamp(rel.goldenCenter - halfW, 20, 75);
  const goldenMax = clamp(rel.goldenCenter + halfW, goldenMin + 12, 85);
  const startPos = (rel.driftBias < 0) ? clamp(goldenMax + 8, goldenMax + 5, 90) : clamp(goldenMin - 10, 8, goldenMin - 5);

  S.pending.push({
    type: 'hongbao_duel',
    title: '🧧 过年收红包 · 客套推拉大对决',
    rel: rel.n,
    quote: rel.line,
    momQuote: rel.mom,
    body: rel.n + '递过一个沉甸甸的红信封！\n' + rel.line + '\n\n妈妈在旁边拼命拉扯推脱：\n' + rel.mom,
    driftBias: rel.driftBias,
    waveAmp1: rel.waveAmp1,
    waveAmp2: rel.waveAmp2,
    waveFreq1: rel.waveFreq1,
    totalTime: 8.0,
    goldenMin: goldenMin,
    goldenMax: goldenMax,
    goldenCenter: rel.goldenCenter,
    goldenWidth: rel.goldenWidth,
    startPos: startPos,
    gustChance: rel.gustChance,
    gustText: rel.gustText,
    amountBase: rel.amountBase,
    difficulty: diff,
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
    if (!S.brain) S.brain = { layer: 1, g: bGen(), keyPending: false, keyIdx: -1 };
    else {
      if (S.brain.keyPending === undefined) S.brain.keyPending = false;
      if (S.brain.keyIdx === undefined) S.brain.keyIdx = -1;
    }
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

function canRepeatLastSlots() {
  return !!(S && Array.isArray(S.lastSlots) && S.lastSlots.some(Boolean));
}

function repeatLastSlots() {
  if (!S) return { ok: false, error: '状态机未初始化' };
  if (!canRepeatLastSlots()) {
    return { ok: false, error: '暂无可延续的上一回合日程安排' };
  }

  // 1) 先安全退还并清空当前已占用的槽位资源，以便干净排布
  clearSlots();

  const curPool = pool();
  let filledCount = 0;
  let skippedCount = 0;
  const skippedItems = [];

  for (let i = 0; i < 6; i++) {
    const last = S.lastSlots[i];
    if (!last) continue;

    // 在当前池中查找对应项目（校验是否依旧解锁或符合当前阶段）
    const match = curPool.find(p => p.kind === last.kind && p.id === last.id);
    if (!match) {
      skippedCount++;
      skippedItems.push(last.id);
      continue;
    }

    const actCost = match.act || 0;
    const moneyCost = match.money || 0;

    if (S.act < actCost || (moneyCost && S.money < moneyCost)) {
      skippedCount++;
      skippedItems.push(match.name);
      continue;
    }

    // 成功填入
    S.slots[i] = { kind: match.kind, id: match.id, act: actCost, money: moneyCost };
    S.act -= actCost;
    if (moneyCost) S.money -= moneyCost;
    filledCount++;
  }

  persist();

  return {
    ok: true,
    filled: filledCount,
    skipped: skippedCount,
    skippedItems: skippedItems
  };
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
      let phaseDiff = curRank - cRank;
      if (curRank >= 7 && c.phase === 'college') {
        phaseDiff = 0; // 职场期与成家期大学专业技能视同当期核心素养
      }

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
  if (!S) return [];
  const ph = cls(), out = [];
  S.learnedCourses = S.learnedCourses || ['fanshen', 'wanju'];
  const curRank = PHASE_RANK[ph] || 1;

  // 1) 课程生命周期与学段过滤法则:
  // - 婴儿期动作 (phase: baby): 仅在婴儿期有效，离开婴儿期彻底隐退！
  // - 职场与成家期 (work / home): 大学专业课代表终身高阶职业素养，继续保留；
  // - 当前学段专属课程: 全部保留；
  // - 平滑过渡兜底: 若当前阶段尚未研习任何当期新课，允许上一阶段（phaseDiff === 1）课程作为过渡兜底；
  const allLearned = D.courses.filter(c => S.learnedCourses.indexOf(c.id) >= 0);
  const curPhaseLearned = allLearned.filter(c => c.phase === ph);

  const okCourse = c => {
    if (c.phase === 'baby') return ph === 'baby';
    if ((ph === 'work' || ph === 'home') && c.phase === 'college') return true;
    if (c.phase === ph) return true;
    const cRank = PHASE_RANK[c.phase] || 1;
    if (curPhaseLearned.length === 0 && (curRank - cRank === 1) && c.phase !== 'baby') {
      return true;
    }
    return false;
  };

  allLearned.forEach(c => {
    if (!okCourse(c)) return;
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
      extra: '+' + pj.money + '元',
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
  // 记录本回合执行的六项日程安排 (Round 2)
  S.lastSlots = S.slots.map(s => (s ? { kind: s.kind, id: s.id, act: s.act, money: s.money } : null));
  // 执行日常安排的六件事
  S.slots.forEach(s => applyAct(s));
  S.turn++;
  const t = S.turn;
  // 每回合刷新全新脑洞 (6x6)
  S.brain = { layer: 1, g: bGen(), keyPending: false, keyIdx: -1 };
  // 家族天赋：每回合自然全属性成长加成 (一代更比一代强！)
  if (S.fam && S.fam.talent > 0) {
    const famBonus = Math.max(1, Math.floor(S.fam.talent / 2));
    ATTRS.forEach(k => { S.attrs[k] += famBonus; });
  }
  if (cls() === 'work' || cls() === 'home') S.money += (S.workSalary || 100);
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
  if (t === 43) pendGraduationToken();
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
  // ---- 随机同学邀约大事件 (Turn 25~42, 25% 几率触发) ----
  if (t >= 25 && t <= 42 && Math.random() < 0.25) {
    pendSpontaneousDate();
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

function talentShowPerform(chosenTalentId, showtimeGrade, encoreChoice) {
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
    mine = { id: 'voice_loud', n: '大嗓门', icon: '📢', r: 1, cat: 'art', atk: 7, src: '天生大嗓门' };
  }
  if (!mine.cat) mine.cat = 'art';

  const rival = m.rival || {
    name: '隔壁小明',
    talent: { id: 'rival_t', n: '儿歌串烧', r: 1, icon: '🎶', atk: 7, cat: 'art' }
  };
  const rivalR = (rival.talent && rival.talent.r) || 1;

  // 1) 基础胜率基准
  let pBase = 0.50;
  if (mine.r >= rivalR) {
    pBase = clamp(0.75 + (mine.r - rivalR) * 0.20, 0.08, 0.95);
  } else {
    pBase = clamp(0.25 - (rivalR - mine.r) * 0.10, 0.08, 0.95);
  }

  // 2) Showtime 演出操作加成
  const sGrade = showtimeGrade || 'normal';
  let deltaShowtime = 0;
  if (sGrade === 'perfect') deltaShowtime = 0.25;
  else if (sGrade === 'good') deltaShowtime = 0.12;

  // 3) 三位评委个性化偏好加权
  // 张教授 (严谨学术派)
  let bZhang = (mine.cat === 'stem' ? 0.20 : 0) + (mine.r >= 3 ? 0.15 : 0) - (mine.cat === 'witty' ? 0.18 : 0);
  const pZhang = clamp(pBase + deltaShowtime + bZhang, 0.05, 0.98);
  const l1 = Math.random() < pZhang;

  // 麦克老师 (前卫舞台派)
  let bMike = ((mine.cat === 'art' || mine.cat === 'witty' || mine.cat === 'phy') ? 0.22 : 0) + (sGrade === 'perfect' ? 0.15 : 0) - (mine.r <= 1 ? 0.10 : 0);
  const pMike = clamp(pBase + deltaShowtime + bMike, 0.05, 0.98);
  const l2 = Math.random() < pMike;

  // 李主任 (德育亲和派)
  let bLi = (mine.r === 1 ? 0.15 : 0) + (mine.cat === 'phy' ? 0.12 : 0) + 0.10;
  const pLi = clamp(pBase + deltaShowtime + bLi, 0.05, 0.98);
  const l3 = Math.random() < pLi;

  let lights = [l1, l2, l3];

  // 4) 危急时刻【绝活返场 (Encore)】判定
  let encoreTriggered = false;
  let encoreSuccess = false;
  if (encoreChoice && lights.filter(Boolean).length <= 1) {
    encoreTriggered = true;
    const pEncore = clamp(0.55 + ((S.attrs && S.attrs.eq) ? S.attrs.eq / 250 : 0.05) + (sGrade === 'perfect' ? 0.15 : 0), 0.35, 0.88);
    if (Math.random() < pEncore) {
      encoreSuccess = true;
      for (let k = 0; k < 3; k++) {
        if (!lights[k]) {
          lights[k] = true;
          break;
        }
      }
    }
  }

  const greenCount = lights.filter(Boolean).length;
  const win = greenCount >= 2;

  let gi = win ? (tier >= 3 ? 500 : 200) : 40;
  let gf = win ? (tier >= 3 ? 150 : 60) : -5;
  // 3 盏全绿大满贯额外加奖
  if (win && greenCount === 3) {
    gi = Math.round(gi * 1.25);
    gf += 30;
  }
  S.insight += gi;
  if (win) {
    S.face += gf;
  } else {
    S.face = Math.max(0, S.face + gf);
  }

  // 5) 评委个性化针对性点评
  const judgeQuotes = [
    lights[0]
      ? (mine.cat === 'stem' ? '张教授扶镜赞叹：“严谨求实，大将之风！理科底蕴非一日之功！”' : '张教授推了推眼镜：“出招沉稳，功底扎实，是个可塑之才！”')
      : (mine.cat === 'witty' ? '张教授严肃摇头：“花拳绣腿，不够庄重，回去多读经典戒骄戒躁。”' : '张教授严肃摇头：“技艺尚浅，回去仍需勤加苦练。”'),
    lights[1]
      ? (sGrade === 'perfect' ? '麦克老师起立欢呼：“Oh My God！全场的节奏与尖叫都被你引爆了！完美Showtime！”' : '麦克老师兴奋击节：“太炸了！全场的节奏都在你的指尖！”')
      : '麦克老师揉了揉太阳穴：“感觉还是少了一点舞台张力，缺了灵魂与律动。”',
    lights[2]
      ? '李主任慈祥鼓掌：“小小年纪敢于登台就非常值得鼓励，阿姨亮灯支持你！”'
      : '李主任微笑：“虽然稍有欠缺，但能勇敢站在这个舞台就是最棒的好孩子！”'
  ];

  const danmaku = win ? [
    (greenCount === 3 ? '“全场大满贯！！！太帅了吧！！”' : '“哇！这也太神了！！”'),
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
    showtimeGrade: sGrade,
    encoreTriggered,
    encoreSuccess,
    judgeQuotes,
    danmaku,
    mine,
    rival,
    gi,
    gf,
    body: (win
      ? (greenCount === 3
        ? `🌟 全场大满贯！凭借【${mine.n}】斩获 3/3 盏全绿灯，全场起立欢呼！(悟性+${gi}, 面子+${gf})`
        : `🎉 技惊四座！凭借【${mine.n}】赢得 ${greenCount}/3 盏绿灯夺得冠军！(悟性+${gi}, 面子+${gf})`)
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

/* ---------- 面子对决 2.0 (手牌化/特长羁绊/对手破防槽/老妈必杀) ---------- */
function pendFace(n) {
  const opp = D.rivals[n % 4] || pick(D.rivals);
  const oppMaxHp = opp.face || 300;

  // 1) 检录玩家已觉醒特长，按稀有度及战力排序
  const myTalents = (S.talents || []).map(id => D.talentData.find(x => x.id === id)).filter(Boolean);
  myTalents.sort((a, b) => (b.r || 1) - (a.r || 1));

  // 2) 检测触发的特长羁绊 (Synergy)
  const catCounts = {};
  myTalents.forEach(t => { const c = t.cat || 'art'; catCounts[c] = (catCounts[c] || 0) + 1; });
  const activeSynergies = [];
  (D.talentSynergies || []).forEach(syn => {
    let can = true;
    const reqs = {};
    syn.reqCats.forEach(rc => { reqs[rc] = (reqs[rc] || 0) + 1; });
    for (const k in reqs) {
      if ((catCounts[k] || 0) < reqs[k]) { can = false; break; }
    }
    if (can) activeSynergies.push(syn);
  });

  // 3) 构建出招手牌 (Hand Cards: 2~3张主力特长 + 凡尔赛 + 谦虚防反)
  const duelHand = [];
  if (myTalents.length > 0) {
    duelHand.push({
      id: myTalents[0].id,
      type: 'talent',
      name: myTalents[0].n,
      icon: myTalents[0].icon,
      cat: myTalents[0].cat || 'art',
      r: myTalents[0].r || 1,
      atkVal: RATK[myTalents[0].r || 1] || 18,
      sub: '主力特长 战力 ' + (RATK[myTalents[0].r || 1] || 18)
    });
  } else {
    duelHand.push({
      id: 'voice_loud',
      type: 'talent',
      name: '大嗓门',
      icon: '📢',
      cat: 'phy',
      r: 1,
      atkVal: 18,
      sub: '天生本能 威力 18'
    });
  }

  if (myTalents.length > 1) {
    duelHand.push({
      id: myTalents[1].id,
      type: 'talent',
      name: myTalents[1].n,
      icon: myTalents[1].icon,
      cat: myTalents[1].cat || 'art',
      r: myTalents[1].r || 1,
      atkVal: RATK[myTalents[1].r || 1] || 18,
      sub: '次席特长 战力 ' + (RATK[myTalents[1].r || 1] || 18)
    });
  }

  // 常驻心理战术卡：凡尔赛
  const baseVersalAtk = Math.round(35 + (S.attrs.iq / 8) + (S.attrs.eq / 8));
  duelHand.push({
    id: 'tact_versal',
    type: 'tactic',
    name: '凡尔赛冷嘲',
    icon: '😏',
    atkVal: baseVersalAtk,
    sub: '智商+情商穿透 威力 ~' + baseVersalAtk
  });

  // 常驻心理战术卡：谦虚防反
  duelHand.push({
    id: 'tact_defend',
    type: 'tactic',
    name: '谦虚客套防反',
    icon: '🛡️',
    atkVal: 30,
    sub: '化解65%攻势·反弹·老妈蓄怒'
  });

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
      tilt: 0, // 0~100 心理破防槽
      lines: opp.l || ['我家孩子很优秀'],
      tiltLines: opp.tiltLines || ['对方神色慌乱！']
    },
    myHp: 400,
    maxMyHp: 400,
    momRage: 0, // 0~100 老妈怒气槽
    round: 1,
    maxRound: 4,
    logs: ['「' + opp.n + '」带着孩子昂首走来，眼神中充满攀比火药味！'],
    hand: duelHand,
    activeSynergies: activeSynergies,
    defending: false,
    paralyzed: false,
    oppWeaken: 0,
    finished: false,
    won: false,
    mvpTalent: null,
    mvpDamage: 0,
    totalDamageDealt: 0
  };

  S.pending.push({
    type: 'face_duel',
    title: '⚔️ 家族面子大对决 vs ' + opp.n,
    duel: S.faceDuel,
    body: '「' + opp.n + '」: 我家孩子 ' + (opp.l[0] || '很优秀') + '！\n\n火药味弥漫全场，请构筑你的战术！',
    opts: duelHand.map(c => ({
      label: c.icon + ' ' + c.name,
      sub: c.sub
    }))
  });
}

function faceDuelStep(actionIdx) {
  const duel = S.faceDuel;
  if (!duel || duel.finished) return;

  // 兜底自愈与老存档兼容
  if (typeof duel.momRage !== 'number') duel.momRage = 0;
  if (typeof duel.opp.tilt !== 'number') duel.opp.tilt = 0;
  if (!duel.hand || !duel.hand.length) {
    const mine = bestTalent();
    duel.hand = [
      { id: 't1', type: 'talent', name: mine ? mine.n : '大嗓门', r: mine ? mine.r : 1, cat: mine ? mine.cat : 'art', atkVal: mine ? RATK[mine.r] : 18, sub: '战力 ' + (mine ? RATK[mine.r] : 18) },
      { id: 'tact_versal', type: 'tactic', name: '凡尔赛冷嘲', icon: '😏', atkVal: 40, sub: '心理穿透' },
      { id: 'tact_defend', type: 'tactic', name: '谦虚客套防反', icon: '🛡️', atkVal: 30, sub: '减伤反弹' }
    ];
  }

  let myDmg = 0;
  let playerLog = '';
  let synergyNotice = '';
  const isMomUlt = (actionIdx === 'mom' || (actionIdx === 4 && duel.momRage >= 100));

  if (isMomUlt) {
    duel.momRage = 0;
    myDmg = Math.round(140 + RI(15, 35));
    synergyNotice = '💥【老妈必杀·全家杀手锏】爆发！';
    playerLog = '第' + duel.round + '轮: 🔥 老妈拍案而起：“我家宝儿上个月刚作为全区优秀少先队员做过典型汇报！” 字字诛心！暴击打掉对方 ' + myDmg + ' 点面子！';
    if (!duel.mvpDamage || myDmg > duel.mvpDamage) {
      duel.mvpDamage = myDmg;
      duel.mvpTalent = '老妈必杀技';
    }
  } else {
    const cIdx = typeof actionIdx === 'number' ? actionIdx : 0;
    const card = duel.hand[cIdx] || duel.hand[0];

    if (card.type === 'talent') {
      const baseAtk = card.atkVal || (card.r ? RATK[card.r] : 18);
      myDmg = Math.round(baseAtk * (0.95 + Math.random() * 0.35));

      // 羁绊加成判定
      const synStem = (duel.activeSynergies || []).find(s => s.id === 'synergy_stem');
      const synArt = (duel.activeSynergies || []).find(s => s.id === 'synergy_art');
      const synWitty = (duel.activeSynergies || []).find(s => s.id === 'synergy_witty');
      const synPhy = (duel.activeSynergies || []).find(s => s.id === 'synergy_phy');

      if (card.cat === 'stem' && synStem) {
        myDmg = Math.round(myDmg * (1 + synStem.bonusDmg));
        synergyNotice = ' ⚡触发【' + synStem.n + '】！贯穿防线！';
      } else if (card.cat === 'art' && synArt) {
        myDmg = Math.round(myDmg * (1 + synArt.bonusDmg));
        duel.myHp = Math.min(duel.maxMyHp, duel.myHp + (synArt.healBonus || 25));
        synergyNotice = ' 📜触发【' + synArt.n + '】！气势回复+25！';
      } else if (card.cat === 'witty' && synWitty) {
        duel.oppWeaken = synWitty.weakenOpp || 0.45;
        synergyNotice = ' 💡触发【' + synWitty.n + '】！对手下轮攻击削弱45%！';
      } else if (card.cat === 'phy' && synPhy) {
        myDmg = Math.round(myDmg * (1 + synPhy.bonusDmg));
        synergyNotice = ' 🏃触发【' + synPhy.n + '】！朝气蓬勃！';
      }

      if (!duel.mvpDamage || myDmg > duel.mvpDamage) {
        duel.mvpDamage = myDmg;
        duel.mvpTalent = card.name;
      }
      playerLog = '第' + duel.round + '轮: 你亮出特长「' + card.name + '」！' + synergyNotice + ' 打掉对方 ' + myDmg + ' 点面子！';

    } else if (card.id === 'tact_versal' || card.id === 't_v') {
      myDmg = Math.round(35 + (S.attrs.iq / 8) + (S.attrs.eq / 8) + RI(0, 15));
      if (duel.opp.tilt >= 50) myDmg = Math.round(myDmg * 1.25);
      playerLog = '第' + duel.round + '轮: 你轻描淡写地凡尔赛了几句，字字诛心！打掉对方 ' + myDmg + ' 点面子！';

    } else if (card.id === 'tact_defend' || card.id === 't_d') {
      duel.defending = true;
      myDmg = Math.round(25 + RI(5, 15));
      duel.myHp = Math.min(duel.maxMyHp, duel.myHp + 35);
      duel.momRage = Math.min(100, duel.momRage + 25);
      playerLog = '第' + duel.round + '轮: 你笑呵呵地连称“哪里哪里，差得远”，化解攻势并暗讽反弹 ' + myDmg + ' 点面子，自身气势回复 35，老妈怒气+25%！';

    } else {
      myDmg = Math.round(25 + RI(5, 15));
      playerLog = '第' + duel.round + '轮: 你从容应对，打掉对方 ' + myDmg + ' 点面子！';
    }
  }

  // 扣减对手面子
  duel.opp.hp = Math.max(0, duel.opp.hp - myDmg);
  duel.totalDamageDealt = (duel.totalDamageDealt || 0) + myDmg;

  // 对手破防槽（Tilt）计算
  const tiltAdd = Math.round(myDmg / 6) + (synergyNotice ? 15 : 0) + (duel.defending ? 15 : 0);
  duel.opp.tilt = Math.min(100, (duel.opp.tilt || 0) + tiltAdd);

  // 是否当场破防
  if (duel.opp.tilt >= 100) {
    duel.paralyzed = true;
    duel.opp.tilt = 0;
    duel.logs.push('😵 【' + duel.opp.name + '】当场被秀得破防石化！张口结舌，本轮无法出招反击！');
  }

  duel.logs.push(playerLog);

  // 判定对手是否败退
  if (duel.opp.hp <= 0) {
    duel.finished = true;
    duel.won = true;
    const finQuote = (duel.opp.tiltLines && duel.opp.tiltLines.length)
      ? duel.opp.tiltLines[duel.opp.tiltLines.length - 1]
      : '面子彻底崩溃，借口灶上炖着汤悻悻离席！';
    duel.logs.push('💥 ' + duel.opp.name + finQuote);
    S.face += 120;
    S.sat = clamp(S.sat + 10, 0, 140);
    return;
  }

  // 对手反击阶段
  if (duel.paralyzed) {
    duel.paralyzed = false;
    // 瘫痪跳过反击
  } else {
    let oppAtk = Math.round((duel.opp.atk || 35) * (0.8 + Math.random() * 0.4));
    if (duel.defending) oppAtk = Math.round(oppAtk * 0.35);
    if (duel.oppWeaken) {
      oppAtk = Math.round(oppAtk * (1 - duel.oppWeaken));
      duel.oppWeaken = 0;
    }
    duel.defending = false;

    duel.myHp = Math.max(0, duel.myHp - oppAtk);
    duel.momRage = Math.min(100, (duel.momRage || 0) + Math.round(oppAtk * 0.6) + 10);

    const oppLine = duel.opp.lines[(duel.round - 1) % duel.opp.lines.length] || '我家孩子很棒！';
    duel.logs.push('对手回敬「' + oppLine + '」，你损失了 ' + oppAtk + ' 点面子 (老妈怒气升至 ' + duel.momRage + '%)。');
  }

  // 判定我方是否溃败
  if (duel.myHp <= 0) {
    duel.finished = true;
    duel.won = false;
    duel.logs.push('🌧️ 我方面子告罄，在亲戚的吹捧声中败下阵来……妈妈说今晚回家不吃鸡肉了。');
    S.face = Math.max(0, S.face - 40);
    return;
  }

  // 推进交锋轮次
  duel.round++;
  if (duel.round > duel.maxRound) {
    duel.finished = true;
    duel.won = duel.myHp >= duel.opp.hp;
    if (duel.won) {
      duel.logs.push('🎉 4轮交锋结束，我方面子更胜一筹！全场称赞！');
      S.face += 120;
      S.sat = clamp(S.sat + 10, 0, 140);
    } else {
      duel.logs.push('败下阵来……妈妈说今晚回家不吃鸡肉了。');
      S.face = Math.max(0, S.face - 40);
    }
  }
}

/* ---------- 🗳️ 班干部竞选演说策略博弈 2.0 (Class Committee Election) ---------- */
function pendElection() {
  const rivals = [
    { name: '王小明', title: '原班长·全科代表', icon: '🧑‍🏫', motto: '“带领全班考第一是我的责任！”', votes: 0, favBloc: 'studious' },
    { name: '李华', title: '文艺课代表', icon: '🎨', motto: '“让大家的校园生活更多姿多彩！”', votes: 0, favBloc: 'middle' },
    { name: '赵小刚', title: '热血体育委员', icon: '🏀', motto: '“选我！以后体育课我带大家练球！”', votes: 0, favBloc: 'rowdy' }
  ];
  const rival = rivals[Math.floor(Math.random() * rivals.length)];
  const totalVotes = 50;
  const targetVotes = 26; // 过半当选门槛

  const blocs = {
    studious: { name: '学霸尖子圈', icon: '🎓', total: 15, myVotes: 0, rivalVotes: 0, remaining: 15 },
    middle: { name: '中立吃瓜圈', icon: '👥', total: 20, myVotes: 0, rivalVotes: 0, remaining: 20 },
    rowdy: { name: '后排活跃圈', icon: '🏀', total: 15, myVotes: 0, rivalVotes: 0, remaining: 15 }
  };

  S.election = {
    round: 1,
    maxRound: 3,
    myVotes: 0,
    rival,
    blocs,
    totalVotes,
    targetVotes,
    logs: ['班级黑板报下，全班 50 名少先队员的班干部竞选演说大会正式开幕！三大选民圈子屏息聆听！'],
    finished: false,
    won: false
  };

  S.pending.push({
    type: 'election',
    title: '🗳️ 班干部三向竞选演说大会',
    body: '登上讲台，向全班同学发表施政演说！争夺班级中队长/班长席位！',
    election: S.election,
    opts: [
      { label: '🤝 亲民路线·倾听心声', sub: '基于情商，重点拉拢中立吃瓜群众(20票)' },
      { label: '🌟 才艺展示·硬核特长', sub: '亮出最高特长才华，吸引中立与后排同学' },
      { label: '🍭 零食许诺·请客公关', sub: '花费 20 元买零食，绝杀收割后排圈(15票)' },
      { label: '📜 严密施政·学业互助', sub: '基于智商，强力斩获学霸尖子圈(15票)' }
    ]
  });
}

function doElection(o) {
  const el = S.election;
  if (!el || el.finished) return 0;

  // 兜底自愈三大选民圈子
  if (!el.blocs) {
    el.blocs = {
      studious: { name: '学霸尖子圈', icon: '🎓', total: 15, myVotes: 0, rivalVotes: 0, remaining: 15 },
      middle: { name: '中立吃瓜圈', icon: '👥', total: 20, myVotes: 0, rivalVotes: 0, remaining: 20 },
      rowdy: { name: '后排活跃圈', icon: '🏀', total: 15, myVotes: 0, rivalVotes: 0, remaining: 15 }
    };
  }

  let gStud = 0, gMid = 0, gRowdy = 0;
  let logText = '';

  // 1) 玩家演讲拉票策略结算 (针对三大选民群体)
  if (o === 0) {
    // 亲民路线: 重点吸纳中立圈，兼顾学霸
    const eqBonus = Math.min(5, Math.floor(((S.attrs && S.attrs.eq) || 0) / 35));
    gMid = clamp(RI(5, 8) + eqBonus, 0, el.blocs.middle.remaining);
    gStud = clamp(RI(2, 4), 0, el.blocs.studious.remaining);
    gRowdy = clamp(RI(1, 3), 0, el.blocs.rowdy.remaining);
    S.sat = clamp(S.sat + 3, 0, 140);
    logText = '第' + el.round + '轮: 🤝 你真挚倾听同学心声并承诺减负互助，深得中立吃瓜同学共鸣，获得 ' + (gStud + gMid + gRowdy) + ' 票！';
  } else if (o === 1) {
    // 才艺特长: 吸引中立与后排圈
    const t = bestTalent();
    const rBonus = t ? Math.min(4, t.r * 2) : 1;
    gMid = clamp(RI(4, 7) + rBonus, 0, el.blocs.middle.remaining);
    gRowdy = clamp(RI(2, 5) + (t && t.cat === 'witty' ? 2 : 0), 0, el.blocs.rowdy.remaining);
    gStud = clamp(RI(1, 3), 0, el.blocs.studious.remaining);
    logText = '第' + el.round + '轮: 🌟 你当众亮出绝活【' + (t ? t.n : '大嗓门') + '】，技惊四座，赢得 ' + (gStud + gMid + gRowdy) + ' 票！';
  } else if (o === 2) {
    // 零食公关: 消耗金钱，绝杀后排圈
    S.money = Math.max(0, S.money - 20);
    S.sat = clamp(S.sat - 2, 0, 140);
    gRowdy = clamp(RI(8, 12), 0, el.blocs.rowdy.remaining);
    gMid = clamp(RI(2, 4), 0, el.blocs.middle.remaining);
    gStud = clamp(RI(0, 1), 0, el.blocs.studious.remaining);
    logText = '第' + el.round + '轮: 🍭 你许诺考后请大家吃雪糕辣条，后排同学欢声雷动当场反水！怒揽 ' + (gStud + gMid + gRowdy) + ' 票！(零花钱-20)';
  } else {
    // 严密施政: 重点收割学霸尖子圈
    const iqBonus = Math.min(5, Math.floor(((S.attrs && S.attrs.iq) || 0) / 35));
    gStud = clamp(RI(6, 9) + iqBonus, 0, el.blocs.studious.remaining);
    gMid = clamp(RI(2, 4), 0, el.blocs.middle.remaining);
    gRowdy = clamp(RI(0, 1), 0, el.blocs.rowdy.remaining);
    logText = '第' + el.round + '轮: 📜 你有条不紊阐述期末复习与学业提分互助方案，学霸尖子圈纷纷举手表决！斩获 ' + (gStud + gMid + gRowdy) + ' 票！';
  }

  el.blocs.studious.myVotes += gStud;
  el.blocs.studious.remaining -= gStud;
  el.blocs.middle.myVotes += gMid;
  el.blocs.middle.remaining -= gMid;
  el.blocs.rowdy.myVotes += gRowdy;
  el.blocs.rowdy.remaining -= gRowdy;
  const myGain = gStud + gMid + gRowdy;

  // 2) 对手竞选拉票 (从优势圈与中立圈吸票)
  const favKey = (el.rival && el.rival.favBloc) || 'studious';
  const rFav = clamp(RI(4, 7), 0, el.blocs[favKey] ? el.blocs[favKey].remaining : 5);
  if (el.blocs[favKey]) {
    el.blocs[favKey].rivalVotes += rFav;
    el.blocs[favKey].remaining -= rFav;
  }
  const rMid = clamp(RI(2, 4), 0, el.blocs.middle.remaining);
  el.blocs.middle.rivalVotes += rMid;
  el.blocs.middle.remaining -= rMid;
  const rivalGain = rFav + rMid;
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
  } else {
    S.face = Math.max(0, S.face - 10);
  }

  S.pending.push({
    type: 'electionr',
    title: win ? '🏆 班干部正式任命聘书' : '📜 班干部竞选公报',
    election: el,
    win,
    body: win
      ? '🎉 经过三轮激烈的竞选演说，你以 ' + el.myVotes + ' 票力压对手【' + el.rival.name + '】(' + el.rival.votes + '票)！\n\n班主任郑重为你佩戴上光荣的“三道杠”中队长臂章！全班掌声雷动！\n(家庭面子+60, 父母满意+15, 同学全员好感+8)'
      : '最终得票 ' + el.myVotes + ' 票 vs ' + el.rival.votes + ' 票，对手【' + el.rival.name + '】胜选。\n\n班主任走下讲台拍拍你：“表现非常出色！老师特委任你为劳动委员，继续发光发热！”\n(面子-10, 演说技巧大获提升)',
    opts: [win ? '光荣就任 🎖️' : '欣然受任 🧹']
  });
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
  const talents = (S && S.talents) || [];
  const list = talents.map(id => D.talentData.find(t => t.id === id)).filter(Boolean);
  const stats = {};
  list.forEach(t => { stats[t.r] = (stats[t.r] || 0) + 1; });
  return { list, stats, total: list.length, fam: S ? S.fam : getFam() };
}
/* ---------- 👥 同学社交双向羁绊与偶发约会大事件 (Round 5 SOC-BONDS) ---------- */
function getBondTier(aff) {
  if (aff >= 120) return { tier: 5, title: '青梅竹马', desc: '独一无二的青春密友，未来婚恋享有至高默契与基因爆发加成' };
  if (aff >= 81) return { tier: 4, title: '莫逆之交', desc: '周末互相串门，遇到挫折给予暖心减压' };
  if (aff >= 51) return { tier: 3, title: '志趣相投', desc: '放学校门口推车闲逛，倾诉彼此心事与理想' };
  if (aff >= 21) return { tier: 2, title: '同窗好友', desc: '互相借阅课堂笔记、课间结伴吃食堂' };
  return { tier: 1, title: '点头之交', desc: '日常礼貌问候，偶遇打个招呼' };
}

function pendSpontaneousDate() {
  if (!S || !S.npcAff) return;
  const meG = S.gender === 'boy' ? '女' : '男';
  const cands = D.npcs.filter(n => n.gender === meG && (S.npcAff[n.id] || 0) >= 25);
  if (!cands.length) return;

  cands.sort((a, b) => (S.npcAff[b.id] || 0) - (S.npcAff[a.id] || 0));
  const npc = cands[0];

  const dateConfigs = {
    xiaomei: {
      title: '🍡 夏小美 · 校门口关东煮之约',
      body: '夏小美神秘兮兮地拉了拉你的衣角：“今天校门口关东煮买一送一，老板还送秘制萝卜汤，放学一起去呀！”',
      opts: [
        {
          label: '🍡 欣然同往 (花费10元零钱)',
          sub: '零钱-10, 情商+18, 压力-25, 好感+15',
          costMoney: 10,
          eff: { eq: 18, stress: -25 },
          affGain: 15,
          logText: '和夏小美在校门口热腾腾地吃着关东煮，聊得前仰后合！'
        },
        {
          label: '🚲 改天再去 (礼貌推托)',
          sub: '压力-5',
          eff: { stress: -5 },
          affGain: 0,
          logText: '夏小美有些遗憾地挥手告别：“好吧，那下次你请客哦！”'
        }
      ]
    },
    shenhan: {
      title: '🏀 沈寒 · 周末球场三对三对抗',
      body: '沈寒单手抱着篮球走到你桌前：“隔壁班带人来踢馆，我们队缺个冷静的控球后卫，你来帮我一把！”',
      opts: [
        {
          label: '🏀 全力应战 (消耗20行动力)',
          sub: '体力-20, 体魄+25, 沈寒好感+15, 压力-15',
          costAct: 20,
          eff: { phy: 25, stress: -15 },
          affGain: 15,
          logText: '你在三分线外妙传助攻沈寒暴扣！拿下比赛扬眉吐气！'
        },
        {
          label: '🥤 场边加油 (观战助威)',
          sub: '体魄+6, 沈寒好感+5',
          eff: { phy: 6 },
          affGain: 5,
          logText: '你在场边递上冰镇矿泉水，沈寒擦着汗对你比了个大拇指。'
        }
      ]
    },
    summer: {
      title: '🎨 苏软软 · 美术馆周末写生之邀',
      body: '苏软软有些微红着脸轻声说：“那个……我有两张市美术馆画展的赠票，周末你想和我一起去看看吗……”',
      opts: [
        {
          label: '🎨 欣然赴约 (消耗15悟性)',
          sub: '悟性-15, 想象力+30, 苏软软好感+18, 压力-20',
          costInsight: 15,
          eff: { img: 30, stress: -20 },
          affGain: 18,
          logText: '在艺术画廊的静谧光影中，你与苏软软并肩漫步，心灵共鸣。'
        },
        {
          label: '📖 在家看书 (客气婉拒)',
          sub: '悟性+8',
          eff: { insight: 8 },
          affGain: 0,
          logText: '苏软软轻轻点头：“嗯嗯，那你好好复习，下次再约~”'
        }
      ]
    },
    kongde: {
      title: '📐 孔德 · 奥数竞赛难题深夜攻关',
      body: '孔德推了推眼镜，兴奋地指着草稿纸：“这道全省数学竞赛压轴立体几何我想了一整晚，快来看看这条辅助线！”',
      opts: [
        {
          label: '📐 共同推导 (消耗20行动力)',
          sub: '体力-20, 智商+25, 孔德好感+16',
          costAct: 20,
          eff: { iq: 25 },
          affGain: 16,
          logText: '两人演算了整整三大张稿纸终于破题，相视大笑！'
        },
        {
          label: '💡 虚心求教 (直接听讲)',
          sub: '智商+10, 孔德好感+6',
          eff: { iq: 10 },
          affGain: 6,
          logText: '孔德头头是道地为你讲解了题眼，受益匪浅。'
        }
      ]
    },
    lizhen: {
      title: '🔥 李振 · 体育场冲刺强化特训',
      body: '李振吹响口哨：“体测长跑快到了，兄弟别趴着，起来跟我跑个五公里拉拉体能！”',
      opts: [
        {
          label: '🔥 一起冲刺 (消耗20行动力)',
          sub: '体力-20, 体魄+28, 李振好感+15',
          costAct: 20,
          eff: { phy: 28 },
          affGain: 15,
          logText: '顶风冲过终点线，夕阳下拉长的影子充满了青春汗水！'
        },
        {
          label: '👟 慢跑陪练',
          sub: '体魄+10, 李振好感+5',
          eff: { phy: 10 },
          affGain: 5,
          logText: '在塑胶跑道上有说有笑慢跑两圈，身心放松。'
        }
      ]
    },
    yuanyuan: {
      title: '🧸 媛媛 · 潮流街区文具淘金',
      body: '媛媛晃着新买的可爱发夹：“听说新开的那家文创店上了全套限定贴纸和小文具，陪我去逛逛嘛！”',
      opts: [
        {
          label: '🧸 结伴淘宝 (花费15元零钱)',
          sub: '零钱-15, 魅力+22, 媛媛好感+16, 压力-18',
          costMoney: 15,
          eff: { cha: 22, stress: -18 },
          affGain: 16,
          logText: '在琳琅满目的货架间挑选精美文具，媛媛送了你一枚可爱挂件！'
        },
        {
          label: '✨ 推荐好物',
          sub: '魅力+8, 媛媛好感+5',
          eff: { cha: 8 },
          affGain: 5,
          logText: '你为媛媛推荐了一款热销书签，她开心地收下了。'
        }
      ]
    },
    qixue: {
      title: '🎮 棋子 · 街机厅双人通关挑战',
      body: '棋子压了压鸭舌帽：“合金弹头双人合作模式今天有人刷新了全服记录，来，上机带我破了它！”',
      opts: [
        {
          label: '🕹️ 投币开黑 (消耗15行动力)',
          sub: '体力-15, 智商+18, 想象力+15, 棋子好感+16',
          costAct: 15,
          eff: { iq: 18, img: 15 },
          affGain: 16,
          logText: '摇杆狂搓，炸弹连发！两人绝地翻盘打破榜首纪录！'
        },
        {
          label: '🍿 场边助威',
          sub: '智商+8, 棋子好感+5',
          eff: { iq: 8 },
          affGain: 5,
          logText: '你在边上递可乐呐喊助威，棋子一命通关爽快击掌！'
        }
      ]
    }
  };

  const conf = dateConfigs[npc.id] || {
    title: '🤝 ' + npc.n + ' · 课间真挚交谈',
    body: npc.n + ' 走到你身边，与你聊起了近期的理想与心愿。',
    opts: [
      { label: '倾心畅聊', sub: '情商+15, 好感+10', eff: { eq: 15 }, affGain: 10, logText: '与 ' + npc.n + ' 畅谈青春理想，彼此勉励。' },
      { label: '点头微笑', sub: '情商+5', eff: { eq: 5 }, affGain: 3, logText: '礼貌微笑，彼此默契。' }
    ]
  };

  S.pending.push({
    type: 'social_spontaneous_date',
    title: conf.title,
    body: conf.body,
    npcId: npc.id,
    npcName: npc.n,
    opts: conf.opts.map(o => ({
      label: o.label,
      sub: o.sub,
      costMoney: o.costMoney,
      costAct: o.costAct,
      costInsight: o.costInsight,
      eff: o.eff,
      affGain: o.affGain,
      logText: o.logText
    }))
  });
}

function pendGraduationToken() {
  if (!S || !S.npcAff) return;
  const meG = S.gender === 'boy' ? '女' : '男';
  const bestFriends = D.npcs.filter(n => n.gender === meG && (S.npcAff[n.id] || 0) >= 80);
  if (!bestFriends.length) return;

  bestFriends.sort((a, b) => (S.npcAff[b.id] || 0) - (S.npcAff[a.id] || 0));
  const topBff = bestFriends[0];
  const tokenMap = {
    summer: { name: '🌸 苏软软的草稿画本', eff: { img: 50 }, quote: '“三年韶华，每一页速写里都有你的侧影。愿你高考金榜题名，岁岁如意。”' },
    shenhan: { name: '🏀 沈寒的珍藏战靴', eff: { phy: 50 }, quote: '“球场上最好的搭档，高考考场上也不许输！毕业之后，我们大学球场再见！”' },
    xiaomei: { name: '🍡 夏小美的手作纪念册', eff: { eq: 50 }, quote: '“哈哈哈哈，高中这三年能遇见你是我最大的幸运！苟富贵，勿相忘呀！”' },
    kongde: { name: '🔭 孔德的星空图鉴', eff: { iq: 50 }, quote: '“向星空仰望的人，终将在更高处相逢。愿你如恒星般璀璨生辉！”' },
    yuanyuan: { name: '🧸 媛媛的手作香囊', eff: { cha: 50 }, quote: '“把所有的好运气都缝在里面啦，祝我的同桌在考场上一路开挂！”' },
    lizhen: { name: '🔥 李振的冠军哨子', eff: { phy: 50 }, quote: '“哨声一响，全力冲刺！高考冲线，必须给我拿第一！”' },
    qixue: { name: '🎮 棋子的限定纪念卡', eff: { iq: 25, img: 25 }, quote: '“通关了高中这个大副本，大学见！这枚限定卡是我最高荣誉的徽记，送你！”' }
  };

  const tok = tokenMap[topBff.id] || { name: '💌 ' + topBff.n + ' 的亲笔毕业留言', eff: { eq: 40 }, quote: '“同窗数载，情谊长青。祝未来前程似锦！”' };

  S.pending.push({
    type: 'graduation_token',
    title: '🎓 高三终局 · 毕业留言册与信物互赠',
    body: '在高中毕业典礼前夕，同窗密友「' + topBff.n + '」红着眼眶来到你的课桌前，郑重递给你一份亲手准备的毕业纪念信物：\n\n' +
          '“' + tok.quote + '”\n\n获得永久信物【' + tok.name + '】！',
    tokenName: tok.name,
    tokenEff: tok.eff,
    npcId: topBff.id,
    npcName: topBff.n,
    opts: ['💌 郑重珍藏入怀，互道珍重与前程似锦！']
  });
}

function socialList() {
  if (!S) return [];
  const meG = S.gender === 'boy' ? '女' : '男';
  if (!S.npcAff) S.npcAff = {};
  return D.npcs.filter(n => n.gender === meG).map(n => {
    const aff = S.npcAff[n.id] || 0;
    const bond = getBondTier(aff);
    return {
      id: n.id,
      name: n.n,
      icon: n.icon,
      aff: aff,
      bondTier: bond.tier,
      bondTitle: bond.title,
      bondDesc: bond.desc,
      intro: n.intro,
      like: n.like || [],
      quotes: n.quotes || {}
    };
  });
}

function chat(id) {
  if (S.act < 3) { toast('行动力不足(需3)'); return; }
  S.act -= 3;
  const g = RI(3, 8);
  const prevAff = S.npcAff[id] || 0;
  S.npcAff[id] = clamp(prevAff + g, 0, 150);
  const nm = (D.npcs.find(n => n.id === id) || {}).n || 'ta';
  log('和' + nm + '聊了聊,好感+' + g);
  if (prevAff < 21 && S.npcAff[id] >= 21) toast('🤝 与 ' + nm + ' 熟络起来，晋升为【同窗好友】！');
  else if (prevAff < 51 && S.npcAff[id] >= 51) toast('💌 与 ' + nm + ' 无话不谈，晋升为【志趣相投】！');
  else if (prevAff < 81 && S.npcAff[id] >= 81) toast('💕 与 ' + nm + ' 患难与共，晋升为【莫逆之交】！');
  else if (prevAff < 120 && S.npcAff[id] >= 120) toast('💖 与 ' + nm + ' 达成最高羁绊【青梅竹马】！');
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
  S.npcAff[id] = clamp(prevAff + g, 0, 150);

  let quote = '';
  if (isFav && npc.quotes && npc.quotes.like) {
    quote = npc.quotes.like;
  } else if (npc.quotes && npc.quotes.normal) {
    quote = npc.quotes.normal;
  }

  const giftName = giftItem ? giftItem.n : '精选小礼物';
  log('送给「' + npc.n + '」' + giftName + '，好感+' + g + (isFav ? ' (喜好暴击!)' : ''));
  if (quote) toast(npc.n + ': ' + quote);

  if (prevAff < 21 && S.npcAff[id] >= 21) toast('🤝 与 ' + npc.n + ' 熟络起来，晋升为【同窗好友】！');
  else if (prevAff < 51 && S.npcAff[id] >= 51) toast('💌 与 ' + npc.n + ' 无话不谈，晋升为【志趣相投】！');
  else if (prevAff < 81 && S.npcAff[id] >= 81) toast('💕 与 ' + npc.n + ' 患难与共，晋升为【莫逆之交】！');
  else if (prevAff < 120 && S.npcAff[id] >= 120) toast('💖 与 ' + npc.n + ' 许下青葱之约，达成最高羁绊【青梅竹马】！');

  save();
  return { g, isFav, quote, aff: S.npcAff[id] };
}
function shopList() {
  const money = S ? S.money : 0;
  const bag = (S && S.bag) || {};
  return D.store.map(s => ({ ...s, can: money >= s.price, count: bag[s.id] || 0 }));
}
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
function bOpen() {
  if (!S) return { layer: 1, g: [], keyPending: false, keyIdx: -1 };
  if (!S.brain) S.brain = { layer: 1, g: bGen(), keyPending: false, keyIdx: -1 };
  if (S.brain.keyPending === undefined) S.brain.keyPending = false;
  if (S.brain.keyIdx === undefined) S.brain.keyIdx = -1;
  return S.brain;
}
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
  if (!S) return null;
  const b = bOpen();
  if (!b || !b.g) return null;

  // 1. 若当前盘面已有钥匙等待激活 (二段确认状态)
  if (b.keyPending) {
    if (i === b.keyIdx || i === -1) {
      let res = '';
      if (b.layer < 4) {
        b.layer++;
        b.g = bGen();
        S.act = clamp(S.act + 50, 0, 240);
        b.keyPending = false;
        b.keyIdx = -1;
        res = '🗝️ 钥匙已启用！成功下探至第' + b.layer + '层 (行动+50)！';
      } else {
        S.act = clamp(S.act + 50, 0, 240);
        b.keyPending = false;
        b.keyIdx = -1;
        res = '🗝️ 钥匙已启用！已探明脑洞最深处，行动+50！';
      }
      save();
      return res;
    } else {
      toast('🗝️ 已探明通向下层的钥匙！请点击高亮的钥匙开启下潜通道~');
      return null;
    }
  }

  // 2. 正常探索挖掘逻辑
  const c = b.g[i];
  if (!c || c.open) return null;
  if (S.act < 2) {
    toast('⚡ 行动力不足 (需2⚡)！可在日程中安排娱乐/小憩，或在小卖部购买能量饮料补充体力~');
    return null;
  }
  S.act -= 2;
  c.open = true;
  let res = '';

  if (c.t === 'key') {
    b.keyPending = true;
    b.keyIdx = i;
    res = '🗝️ 发现了通往下一层的钥匙！点击高亮的钥匙开启下潜通道~';
  } else if (c.t === 'bomb') {
    const r0 = Math.floor(i / 6);
    const c0 = i % 6;
    const exploded = [];
    let foundKeyIdx = -1;
    for (let j = 0; j < b.g.length; j++) {
      if (j === i) continue;
      const rj = Math.floor(j / 6);
      const cj = j % 6;
      if (Math.abs(rj - r0) <= 1 && Math.abs(cj - c0) <= 1 && !b.g[j].open) {
        const g2 = b.g[j];
        g2.open = true;
        if (g2.t === 'key') {
          foundKeyIdx = j;
        } else {
          const subEff = applyBrainCell(g2, b);
          if (subEff) exploded.push(subEff);
        }
      }
    }
    if (foundKeyIdx >= 0) {
      b.keyPending = true;
      b.keyIdx = foundKeyIdx;
      res = '💥 炸弹连锁炸出🗝️钥匙！点击高亮的钥匙开启下潜通道~' + (exploded.length ? ' (连带翻开: ' + exploded.slice(0, 2).join(' ') + ')' : '');
    } else {
      res = '💥 连环爆破!' + (exploded.length ? ' 获得: ' + exploded.slice(0, 3).join(' ') + (exploded.length > 3 ? '等' : '') : '');
    }
  } else {
    res = applyBrainCell(c, b);
  }

  // 保底：若当前层全部翻开，自动进入下一层或封顶提示 (非钥匙等待状态)
  if (!b.keyPending && b.g.every(x => x.open)) {
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
function bInfo() {
  if (!S) {
    return { layer: 1, open: 0, total: 36, remaining: 36, percent: 0, maxLayer: 4, bulbs: 0, bombs: 0, keys: 0, act: 0, maxExplores: 0, canExplore: false, keyPending: false, keyIdx: -1 };
  }
  const b = bOpen();
  const openCount = b.g.filter(x => x.open).length;
  const total = b.g.length;
  const bulbs = b.g.filter(x => x.open && x.t === 'bulb').length;
  const bombs = b.g.filter(x => x.open && x.t === 'bomb').length;
  const keys = b.g.filter(x => x.open && x.t === 'key').length;
  const percent = total > 0 ? Math.round((openCount / total) * 100) : 0;
  const act = S ? S.act : 0;
  const maxExplores = Math.floor(act / 2);
  const canExplore = act >= 2;

  return {
    layer: b.layer,
    open: openCount,
    total: total,
    remaining: total - openCount,
    percent: percent,
    maxLayer: 4,
    bulbs: bulbs,
    bombs: bombs,
    keys: keys,
    act: act,
    maxExplores: maxExplores,
    canExplore: canExplore,
    keyPending: !!b.keyPending,
    keyIdx: b.keyIdx !== undefined ? b.keyIdx : -1
  };
}

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
  repeatLastSlots, canRepeatLastSlots,
  slots: () => (S && S.slots) ? S.slots : [],
  toast, flushToasts,
  endTurn, pending: () => (S && S.pending) ? S.pending.slice() : [],
  resolve: resolvePend,
  examBuff: () => S.exambuff,
  brain: { grid: bGrid, rev: bRev, info: bInfo, useKey: () => bRev(bOpen().keyIdx) },
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
  pendHongbao: () => pendHongbao(),
  pendFace: (n) => pendFace(n),
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
  bondTier: getBondTier,
  pendDate: pendSpontaneousDate,
  pendToken: pendGraduationToken,
  tokens: () => (S && S.tokens) || [],
};
function getFam() { return S ? S.fam : (loadFam() || { g: 0, talent: 0, tier: 0, attr: {}, atlas: [] }); }

function resolvePend(i) {
  if (!S || !S.pending || !S.pending.length) return '';
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
      const gMin = (m && typeof m.goldenMin === 'number') ? m.goldenMin : 38;
      const gMax = (m && typeof m.goldenMax === 'number') ? m.goldenMax : 68;
      const amtBase = (m && typeof m.amountBase === 'number') ? m.amountBase : 220;
      const relName = (m && m.rel) ? m.rel : '长辈';

      let pos = Math.round((gMin + gMax) / 2);
      let isSkip = false;
      if (typeof i === 'object' && i !== null && typeof i.pos === 'number') {
        pos = clamp(i.pos, 0, 100);
        if (i.skipped) isSkip = true;
      } else if (i === 1) {
        pos = 15;
      } else if (i === 2) {
        pos = 92;
      } else {
        pos = Math.round((gMin + gMax) / 2);
      }

      if (pos >= gMin && pos <= gMax) {
        const v = Math.round(amtBase * (0.9 + Math.random() * 0.25));
        S.money += v;
        S.face += 20;
        S.sat = clamp(S.sat + 6, 0, 140);
        res = '🎉 进退得体，堪称红包推拉大师！' + relName + '欣慰塞下红包，父母在旁倍感有面！拿到 ' + v + ' 元压岁钱，面子+20！';
      } else if (pos < Math.max(18, gMin - 6)) {
        S.face += 10;
        res = '✋ 推辞得过于逼真，' + relName + '叹口气收了回去：“这孩子太老实了！”(拿到 0 元，面子+10)';
      } else if (pos > Math.min(82, gMax + 8)) {
        const v = Math.round(amtBase * 0.65);
        S.money += v;
        S.face = Math.max(0, S.face - 25);
        S.sat = Math.max(0, S.sat - 8);
        res = '💨 伸手太急！' + relName + '尬笑塞给你，老妈在旁边狠狠掐了你一把……(拿到 ' + v + ' 元，面子-25)';
      } else {
        const v = Math.round(amtBase * 0.75);
        S.money += v;
        S.face += 5;
        res = '🧧 几番客套拉扯下顺利收下，' + relName + '笑得合不拢嘴。(拿到 ' + v + ' 元，面子+5)';
      }
      if (isSkip) {
        res = '⏩ [保底收下] ' + res;
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
        const actIdx = (typeof i === 'number' || typeof i === 'string') ? i : 0;
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
      let showtimeGrade = 'normal';
      let encoreChoice = false;
      if (typeof i === 'string') {
        chosenId = i;
      } else if (typeof i === 'object' && i) {
        if (i.talentId) chosenId = i.talentId;
        if (i.showtimeGrade) showtimeGrade = i.showtimeGrade;
        if (i.encore) encoreChoice = true;
      } else if (typeof i === 'number') {
        const tList = (S.talents || []).map(id => D.talentData.find(x => x.id === id)).filter(Boolean);
        if (tList[i]) chosenId = tList[i].id;
      }
      const resModal = talentShowPerform(chosenId, showtimeGrade, encoreChoice);
      res = resModal && resModal.win ? '🏆 才艺选秀夺冠！' : '才艺选秀登台';
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
    case 'social_spontaneous_date': {
      const idx = typeof i === 'number' ? i : 0;
      let opt = (m.opts && m.opts[idx]) ? m.opts[idx] : (m.opts && m.opts[0]);
      if (opt) {
        const cantAfford = (opt.costMoney && S.money < opt.costMoney) ||
                           (opt.costAct && S.act < opt.costAct) ||
                           (opt.costInsight && S.insight < opt.costInsight);
        if (cantAfford) {
          toast('资源不足，本次改为礼貌推托');
          opt = (m.opts && m.opts[1]) ? m.opts[1] : opt;
        }
        if (opt.costMoney && S.money >= opt.costMoney) S.money -= opt.costMoney;
        if (opt.costAct && S.act >= opt.costAct) S.act -= opt.costAct;
        if (opt.costInsight && S.insight >= opt.costInsight) S.insight -= opt.costInsight;
        if (opt.eff) applyEff(opt.eff);
        if (opt.affGain && m.npcId) {
          S.npcAff[m.npcId] = clamp((S.npcAff[m.npcId] || 0) + opt.affGain, 0, 150);
        }
        if (opt.logText) log(opt.logText);
      }
      S.pending.shift();
      res = (opt && opt.label) || '完成同窗约会';
      break;
    }
    case 'graduation_token': {
      if (!S.tokens) S.tokens = [];
      if (m.tokenName && S.tokens.indexOf(m.tokenName) < 0) {
        S.tokens.push(m.tokenName);
        if (m.tokenEff) applyEff(m.tokenEff);
        log('获得高三毕业纪念信物【' + m.tokenName + '】！');
        toast('🎓 获得毕业纪念信物【' + m.tokenName + '】！');
      }
      S.pending.shift();
      res = '珍藏毕业信物';
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