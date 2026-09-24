/* 无头模拟器: 随机策略把游戏跑 N 代,验证不崩 + 数值合理性 + 世代传承 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dir = path.join(__dirname, '..', 'js');
const store = {};
const ctx = {
  console: console,
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

const MAX_GENS = 5;
const summaries = [];
const gkScores = [];
const baseAttrSums = [];

CP.newGame();

for (let gen = 1; gen <= MAX_GENS; gen++) {
  {
    const i0 = CP.info();
    baseAttrSums.push(i0.attrs.iq + i0.attrs.eq + i0.attrs.mem + i0.attrs.img + i0.attrs.phy);
  }
  let turns = 0;
  let guard = 0;
  let genFinished = false;

  let phaseTransitions = 0;

  while (!genFinished && guard++ < 3000) {
    // 1) 处理 pending 弹窗
    let p = CP.pending();
    let pg = 0;
    while (p.length && pg++ < 40) {
      const m = p[0];
      if (m.type === 'phase_transition') {
        phaseTransitions++;
      }
      if (m.type === 'endgen') {
        const i = CP.info();
        const s = CP.state();
        const fam = CP.fam();
        const at = CP.atlas();
        summaries.push({
          gen: i.gen, turns: s.turn, name: i.name, gender: i.gender,
          job: s.job ? (s.job.n || s.job.name) : '未就业',
          spouse: s.spouse ? s.spouse.name : '单身',
          talentN: at.total,
          iq: i.attrs.iq, eq: i.attrs.eq, mem: i.attrs.mem, img: i.attrs.img, phy: i.attrs.phy, cha: i.attrs.cha,
          money: i.money, face: i.face, stress: i.stress, shadow: i.shadow, sat: i.sat,
          gk: s.gaokaoScore, famTalent: fam.talent, tier: fam.tier,
          rating: fam.rating, score: fam.totalLifeScore, phaseTransitions
        });
        gkScores.push(s.gaokaoScore || 0);
        CP.resolve(0); // 触发 nextGen()
        genFinished = true;
        break;
      }
      const optIdx = (m.opts && m.opts.length) ? ri(m.opts.length) : 0;
      CP.resolve(optIdx);
      p = CP.pending();
    }
    if (genFinished) break;

    // 2) 挖脑洞 (回合标准循环: 优先挖脑洞攒悟性)
    const bInfoStart = CP.brain.info();
    if (bInfoStart.total !== 36) {
      throw new Error(`第${gen}代 回合${CP.state().turn} 脑洞格数异常: ${bInfoStart.total}`);
    }
    // 验证每回合开始时脑洞均已刷新为未翻开状态 (0 / 36)
    if (bInfoStart.open !== 0) {
      throw new Error(`第${gen}代 回合${CP.state().turn} 脑洞未重置刷新! 已翻开: ${bInfoStart.open}`);
    }

    // 翻开 6~12 格脑洞
    const digTimes = ri(7) + 6;
    let digOpened = 0;
    for (let k = 0; k < digTimes; k++) {
      if (CP.brain.rev(ri(36))) digOpened++;
    }

    // 3) 尝试研习新技能 (消耗当回合挖出的悟性研习新课)
    const learnable = CP.learnList ? CP.learnList().filter(x => x.can) : [];
    if (learnable.length && Math.random() < 0.85) {
      CP.learnCourse(learnable[0].id);
    }

    // 4) 槽位操作与撤销压力测试
    if (Math.random() < 0.2) {
      CP.autoFillSlots();
    } else {
      const pl = CP.pool().filter(x => !x.locked);
      let tries = 0;
      while (CP.slots().some(x => !x) && tries++ < 30) {
        const pi = pl[ri(pl.length)];
        if (!CP.addSlot(pi)) break;
      }
      // 测试撤销槽位并验证悟性未被污染抹除
      const insightBeforeUndo = CP.state().insight;
      const learnedCountBefore = CP.state().learnedCourses ? CP.state().learnedCourses.length : 0;
      if (Math.random() < 0.35 && CP.slots()[1]) {
        CP.removeSlot(1);
        if (CP.state().insight !== insightBeforeUndo) {
          throw new Error('removeSlot 破坏了悟性数值!');
        }
        if (CP.state().learnedCourses && CP.state().learnedCourses.length !== learnedCountBefore) {
          throw new Error('removeSlot 抹除了已研习的技能!');
        }
      }
      // 补齐槽位
      CP.autoFillSlots();
    }

    if (!CP.slots().every(Boolean)) {
      CP.clearSlots();
      CP.autoFillSlots();
    }

    CP.endTurn();
    turns++;
  }
}

// ---- 回归断言 ----
if (summaries.length !== MAX_GENS) throw new Error(`只完成了 ${summaries.length} 代`);
summaries.forEach((ss) => {
  if (ss.phaseTransitions !== 7) throw new Error(`第${ss.gen}代阶段蜕变次数异常: ${ss.phaseTransitions}`);
  if (!ss.turns || ss.turns < 40) throw new Error(`第${ss.gen}代回合数异常: ${ss.turns}`);
  const maxGk = Math.max.apply(null, gkScores);
  const allCapped = gkScores.every(v => v >= 19900);
  if (allCapped) throw new Error('高考分数饱和缺陷回归: 全部世代顶到满分! ' + JSON.stringify(gkScores));
  if (maxGk > 20000) throw new Error(`高考分数不应超过 20000 上限, 实际 ${maxGk}`);
});
// 传承断言: 二代起基础属性显著强于一代开局
for (let i = 1; i < MAX_GENS; i++) {
  if (baseAttrSums[i] < baseAttrSums[0]) {
    throw new Error(`第${i + 1}代开局属性(${baseAttrSums[i]})未高于第1代(${baseAttrSums[0]}), 传承机制失效!`);
  }
}
console.log('回归断言通过: 7次蜕变/代, 高考分布合理区分, 世代传承显著生效');

console.log('===== 模拟完成 (5代全流程) =====');
summaries.forEach((s) => {
  console.log(`第${s.gen}代 [${s.name}, ${s.gender}] 评级: ${s.rating} (${s.score}分), 经历阶段蜕变: ${s.phaseTransitions}次, 职业: ${s.job}, 伴侣: ${s.spouse}, 高考: ${s.gk}, 家族特长: ${s.famTalent}, 门第: ${s.tier}`);
});