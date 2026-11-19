/* 拟真玩家无头测试: 模拟真人节奏玩一代, 逐回合记录悟性收支与取舍时刻 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dir = path.join(__dirname, '..', 'js');
const store = {};
const ctx = {
  console: { log: () => {} },
  Math, Date, JSON,
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
  },
};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(dir, 'data.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(dir, 'core.js'), 'utf8'), ctx);

const CP = ctx.CP;
const ri = n => Math.floor(Math.random() * n);
const PH = { baby: '婴儿', kinder: '幼儿园', pri: '小学', junior: '初中', senior: '高中', college: '大学', work: '职场', home: '成家' };
const phaseOf = t => t <= 8 ? 'baby' : t <= 14 ? 'kinder' : t <= 24 ? 'pri' : t <= 32 ? 'junior' : t <= 44 ? 'senior' : t <= 50 ? 'college' : t <= 57 ? 'work' : 'home';

CP.newGame('小明', 'boy');
const log = [];
const phaseSum = {};
let couldntAfford = [];   // 想学学不起的回合 (稀缺感时刻)
let keyUses = 0, bombsHit = 0, comboHits = 0;
let totalDug = 0, totalInsightFromDig = 0, totalSpent = 0;

let guard = 0, done = false;
while (!done && guard++ < 4000) {
  const t0 = CP.state().turn;
  const ph = phaseOf(t0);
  const ins0 = CP.state().insight;

  // 1) 处理弹窗 (真人: 看一眼点确认/第一个选项)
  let p = CP.pending(), pg = 0;
  const popups = [];
  while (p.length && pg++ < 40) {
    const m = p[0];
    popups.push(m.type + (m.title ? ':' + m.title : ''));
    if (m.type === 'endgen') { done = true; break; }
    CP.resolve(0);
    p = CP.pending();
  }
  if (done) break;

  // 2) 挖脑洞 (休闲玩家: 7~10 格, 出钥匙就开, 炸弹被动挨炸)
  const insBeforeDig = CP.state().insight;
  const digs = 7 + ri(4);
  let opened = 0;
  for (let k = 0; k < digs; k++) {
    const bi = CP.brain.info();
    if (bi.keyPending) { CP.brain.useKey(); keyUses++; continue; }
    if (CP.brain.rev(ri(36))) opened++;
  }
  const digGain = CP.state().insight - insBeforeDig;
  totalDug += opened;
  totalInsightFromDig += digGain;

  // 3) 学课 (真人: 买得起最便宜的先学, 学不起就记账)
  let learned = null, spent = 0;
  const afford = CP.learnList().filter(x => x.can);
  if (afford.length) {
    afford.sort((a, b) => a.cost - b.cost);
    const c = afford[0];
    const before = CP.state().insight;
    const nL = CP.state().learnedCourses.length;
    CP.learnCourse(c.id);
    if (CP.state().learnedCourses.length > nL) { spent = before - CP.state().insight; learned = c; totalSpent += spent; }
  } else if (CP.learnList().length) {
    couldntAfford.push(t0);
  }

  // 4) 连击/炸弹统计 (从 rev 返回的文案拼不出来, 用状态差间接体现 — 略过细分)

  // 5) 排日程 (真人: 压力大休息, 否则自动安排)
  if (CP.state().stress > 65) CP.clearSlots();
  CP.autoFillSlots();
  const actBefore = CP.state().act;
  CP.endTurn();

  const ins1 = CP.state().insight;
  const phAgg = phaseSum[ph] = phaseSum[ph] || { turns: 0, dug: 0, digGain: 0, spent: 0, learned: 0, insEnd: 0, cantAfford: 0 };
  phAgg.turns++; phAgg.dug += opened; phAgg.digGain += digGain; phAgg.spent += spent;
  phAgg.learned += learned ? 1 : 0; phAgg.insEnd = ins1;
  if (!afford.length && CP.learnList && CP.learnList().length) phAgg.cantAfford++;

  log.push({ t: t0, ph, ins0, dug: opened, digGain, learned: learned ? learned.name + '(' + spent + ')' : null, ins1, act: CP.state().act, popups: popups.join('|') });
}

// ---- 汇总输出 ----
console.log('=== 拟真玩家一代全程 (休闲策略: 每回合挖7~10格, 学最便宜的可负担课, 压力>65清槽休息) ===\n');
console.log('--- 分学段小结 ---');
for (const ph in phaseSum) {
  const a = phaseSum[ph];
  console.log(`${(PH[ph] || ph).padEnd(4)} ${String(a.turns).padStart(2)}回合 | 挖格${String(a.dug).padStart(3)} +悟性${String(a.digGain).padStart(4)} | 学课${a.learned}门 花悟性${String(a.spent).padStart(4)} | 学段末结余${String(a.insEnd).padStart(4)} | 学不起回合${a.cantAfford}`);
}
console.log(`\n全程: 挖开${totalDug}格 → 脑洞共+${totalInsightFromDig}悟性; 研习共花${totalSpent}; 钥匙启用${keyUses}次; "想学学不起"出现${couldntAfford.length}回合 (回合: ${couldntAfford.slice(0, 20).join(',')}${couldntAfford.length > 20 ? '…' : ''})`);
console.log(`最终: ${CP.learnedCount ? CP.learnedCount() : CP.state().learnedCourses.length} 门课 / 悟性结余 ${CP.state().insight}`);

console.log('\n--- 前16回合流水 (开局节奏) ---');
for (const r of log.slice(0, 16)) {
  console.log(`T${String(r.t).padStart(2)} ${(PH[r.ph] || r.ph).padEnd(3)} 悟性${String(r.ins0).padStart(4)}→挖${r.dug}格+${String(r.digGain).padStart(3)}→${r.learned ? '学' + r.learned : '—'}→结余${String(r.ins1).padStart(4)} ${r.popups ? ' [' + r.popups + ']' : ''}`);
}
console.log('\n--- 关键转折回合流水 (有学课/有弹窗的回合, 抽样24条) ---');
const notable = log.filter(r => r.learned || r.popups).slice(0, 60);
const step = Math.max(1, Math.floor(notable.length / 24));
for (let i = 0; i < notable.length; i += step) {
  const r = notable[i];
  console.log(`T${String(r.t).padStart(2)} ${(PH[r.ph] || r.ph).padEnd(3)} 悟性${String(r.ins0).padStart(4)}→挖${r.dug}格+${String(r.digGain).padStart(3)}→${r.learned ? '学' + r.learned : '—'}→结余${String(r.ins1).padStart(4)} ${r.popups ? ' [' + r.popups.slice(0, 40) + ']' : ''}`);
}
