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

/* ---------- 存档 ---------- */
function persist() {
  if (!LS || !S) return;
  try { LS.setItem('cph_save', JSON.stringify(S)); } catch (e) {}
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
  };
  if (fam.g > 0) {
    // 父母 18% 属性遗传 + 伴侣基因增益 + 家族特长底蕴
    ATTRS.forEach(k => {
      const parentShare = Math.round(((fam.attr && fam.attr[k]) || 0) * 0.18);
      S.attrs[k] += parentShare + (fam.talent || 0);
      if (fam.spouseBonus && fam.spouseBonus[k]) {
        S.attrs[k] += fam.spouseBonus[k];
      }
    });
    // 名校光环继承: 上一代大学档次 (0专科..5清北) 直接影响后代悟性/面子起点
    const uniTier = fam.uniTier || 0;
    if (uniTier >= 3) { S.insight += 15; S.face += 8; }
    if (uniTier >= 5) { S.insight += 15; S.face += 7; }
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
    if (!S.learnedCourses) {
      S.learnedCourses = Object.keys(S.skills).length ? Object.keys(S.skills) : ['fanshen', 'wanju'];
    }
    if (!S.tutorial) S.tutorial = { done: false, step: 0, claimed: false };
    if (!S.pending) S.pending = [];
    if (!S.brain) S.brain = { layer: 1, g: bGen() };
    if (S.turn >= 60 && !S.pending.some(x => x.type === 'endgen')) {
      pendEndGen();
    }
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

  // 2) 娱乐项目
  const okPlay = p =>
    p.phase === ph ||
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

  // 伴侣基因增益
  let spouseBonus = { iq: 6, eq: 6, mem: 6, img: 6, phy: 6, cha: 6 };
  let spouseTag = '独善其身 (单身)';
  if (S.spouse) {
    spouseTag = S.spouse.tag || '相伴一生';
    if (spouseTag === '校园恋人') {
      spouseBonus = { eq: 16, cha: 16, iq: 10, mem: 10 };
    } else {
      spouseBonus = { iq: 14, mem: 14, eq: 10, cha: 10 };
    }
  } else {
    spouseBonus = { phy: 14, img: 14, iq: 8, eq: 8 };
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

  const fam = {
    g: S.gen,
    name: S.name,
    gender: S.gender,
    tier: Math.max((S.fam ? S.fam.tier : 0), job.t || 0),
    talent: newFamTalent,
    attr: { ...S.attrs },
    atlas: mergedAtlas,
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
  social: socialList, chat, gift,
  shop: shopList, buy,
  atlas, fam: getFam,
  claimNovicePack,
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
    case 'mini_hb': {
      S.pending.shift();
      if (i === 2) { S.face += 15; res = '你主动把红包交给爸妈,父母欣慰(面子+15)'; break; }
      const v = RI(100, 200);
      S.money += v;
      res = '你抢到了红包,拿到 ' + v + ' 元!' + (i === 0 ? '(左兜)' : '(右兜)');
      break;
    }
    case 'show': {
      S.pending.shift();
      S.pending.push({ type: 'showr', title: m.title, body: showResult(m.tier), opts: ['好'] });
      res = '登台';
      break;
    }
    case 'showr': S.pending.shift(); res = ''; break;
    case 'election': {
      const v = doElection(i);
      if (S.election.round >= 2) { S.pending.shift(); electionFinish(); }
      else S.pending[0].body = '拉了一票(+' + v + ')。再来一轮!当前票: ' + S.election.votes;
      res = '拉到 ' + v + ' 票';
      break;
    }
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