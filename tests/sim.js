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

CP.newGame();

for (let gen = 1; gen <= MAX_GENS; gen++) {
  let turns = 0;
  let guard = 0;
  let genFinished = false;

  while (!genFinished && guard++ < 3000) {
    // 1) 处理 pending 弹窗
    let p = CP.pending();
    let pg = 0;
    while (p.length && pg++ < 40) {
      const m = p[0];
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
        });
        CP.resolve(0); // 触发 nextGen()
        genFinished = true;
        break;
      }
      const optIdx = (m.opts && m.opts.length) ? ri(m.opts.length) : 0;
      CP.resolve(optIdx);
      p = CP.pending();
    }
    if (genFinished) break;

    // 2) 尝试研习新技能 (消耗悟性学新课)
    const learnable = CP.learnList ? CP.learnList().filter(x => x.can) : [];
    if (learnable.length && Math.random() < 0.8) {
      CP.learnCourse(learnable[0].id);
    }

    // 3) 测试槽位操作与自动填充 (已掌握课程可无限次重复排满)
    if (Math.random() < 0.2) {
      CP.autoFillSlots();
    } else {
      const pl = CP.pool().filter(x => !x.locked);
      let tries = 0;
      while (CP.slots().some(x => !x) && tries++ < 30) {
        const pi = pl[ri(pl.length)];
        if (!CP.addSlot(pi)) break;
      }
      // 测试撤销槽位
      if (Math.random() < 0.25 && CP.slots()[2]) {
        CP.removeSlot(2);
      }
      // 补齐槽位
      CP.autoFillSlots();
    }

    if (!CP.slots().every(Boolean)) {
      CP.clearSlots();
      CP.autoFillSlots();
    }

    // 4) 挖脑洞
    if (Math.random() < 0.6) {
      for (let k = 0; k < 5; k++) CP.brain.rev(ri(30));
    }

    CP.endTurn();
    turns++;
  }
}

console.log('===== 模拟完成 (5代全流程) =====');
summaries.forEach((s, idx) => {
  console.log(`第${s.gen}代 [${s.name}, ${s.gender}] 职业: ${s.job}, 伴侣: ${s.spouse}, 高考: ${s.gk}, 家族特长: ${s.famTalent}, 门第: ${s.tier}`);
});