'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

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
const D = ctx.DATA;

console.log('🚀 开始运行原版还原·面子对决 (Faithful Face Duel) 专属深度测试套件...\n');

// ==========================================
// 测试 1: 五大经典亲戚登门阵容与阶段数据完备性
// ==========================================
console.log('--- 测试 1: 👵 五大经典亲戚阵容与阶段数据完备性 ---');
const classicIds = ['biaosao', 'eryi', 'erjiuma', 'zhouayi', 'dagu'];
classicIds.forEach((cid, idx) => {
  const rival = D.rivals.find(r => r.id === cid);
  assert(rival, `必须存在经典亲戚档案: ${cid}`);
  assert(rival.face >= 200, `${cid} 面子血量必须足够支撑回合博弈 (>=200)`);
  assert(rival.atk >= 20, `${cid} 攻击力必须合理 (>=20)`);
  assert(rival.l && rival.l.length >= 3, `${cid} 必须包含至少3条专属挑衅台词`);
  assert(rival.tiltLines && rival.tiltLines.length >= 3, `${cid} 必须包含破防退场台词`);
  console.log(`✅ 经典亲戚 [${rival.n}] (${rival.style}) 检录合格: HP=${rival.face}, ATK=${rival.atk}`);
});

// ==========================================
// 测试 2: 特长单场单次消耗制 (Single-Use Protocol)
// ==========================================
console.log('\n--- 测试 2: 🃏 特长单场单次消耗制与保底客套机制 ---');
CP.newGame('测试宝宝');
while (CP.pending().length) CP.resolve(0);

// 给角色注入3项特长：Rank 1、Rank 2、Rank 3
CP.state().talents = ['tuyasha', 'qintong', 'jiazui']; // 小涂鸦师(R1), 琴童(R2), 压轴题杀手(R3)
CP.pendFace(0); // 迎战表嫂

const duel = CP.faceDuel();
assert(duel, '对决必须成功初始化');
duel.opp.hp = 600; // 设定充足血量保证完整演练4轮出招
duel.opp.maxHp = 600;
assert(duel.hand.some(c => c.id === 'tuyasha'), '手牌应收录小涂鸦师');
assert(duel.hand.some(c => c.id === 'qintong'), '手牌应收录琴童');
assert(duel.hand.some(c => c.id === 'jiazui'), '手牌应收录压轴题杀手');
assert(duel.hand.some(c => c.id === 'tact_polite'), '手牌应包含保底客套赔笑卡');

// 轮次 1: 打出压轴题杀手 (Rank 3)
const jiazuiCard = duel.hand.find(c => c.id === 'jiazui');
assert.strictEqual(jiazuiCard.used, false, '出招前特长未消耗');
CP.resolve('jiazui');
assert.strictEqual(jiazuiCard.used, true, '出招后压轴题杀手必须标记为已消耗 (used: true)');
assert(duel.usedCardIds.includes('jiazui'), 'usedCardIds 必须记录 jiazui');

// 轮次 2: 打出琴童 (Rank 2)
const qintongCard = duel.hand.find(c => c.id === 'qintong');
assert.strictEqual(qintongCard.used, false, '琴童出招前未消耗');
CP.resolve('qintong');
assert.strictEqual(qintongCard.used, true, '出招后琴童必须标记为已消耗');

// 轮次 3: 打出小涂鸦师 (Rank 1)
const tuCard = duel.hand.find(c => c.id === 'tuyasha');
CP.resolve('tuyasha');
assert.strictEqual(tuCard.used, true, '出招后小涂鸦师必须标记为已消耗');

// 验证所有特长均已消耗
const allTalentsUsed = duel.hand.filter(c => c.type === 'talent').every(c => c.used);
assert.strictEqual(allTalentsUsed, true, '三项特长均已单次出战消耗');

// 轮次 4: 特长耗尽后，使用保底技能【客套赔笑】
const oppHpBeforePolite = duel.opp.hp;
CP.resolve('tact_polite');
assert(duel.opp.hp < oppHpBeforePolite, '客套赔笑必须造成保底面子打击');
assert(duel.logs.some(l => l.includes('客套赔笑')), '日志中必须体现客套赔笑保底出招');
console.log('✅ 特长单场单次出战消耗、已出战锁定与客套保底机制断言全部通过！');

// ==========================================
// 测试 3: 特长品阶专属特效 (暴击/压制削弱/降维打击)
// ==========================================
console.log('\n--- 测试 3: ✨ 特长品阶专属特效与羁绊加成 ---');
while (CP.pending().length) CP.resolve(0);

// 测试史诗特长 (Rank 3): 削弱对手反击 40%
CP.state().talents = ['jiazui']; // 压轴题杀手 (Rank 3)
CP.pendFace(2); // 二舅妈
const duelEpic = CP.faceDuel();
assert.strictEqual(duelEpic.oppWeaken, 0, '初始对手削弱标记为 0');
CP.resolve('jiazui');
assert(duelEpic.logs.some(l => l.includes('压制') || l.includes('气焰受挫')), '史诗特长应触发降温压制战斗日志');

// 测试传说特长 (Rank 4): 降维打击与巨额破防
while (CP.pending().length) CP.resolve(0);
CP.state().talents = ['gaokao']; // 状元苗子 (Rank 4)
CP.pendFace(4); // 大姑
const duelLegend = CP.faceDuel();
const legendTiltBefore = duelLegend.opp.tilt;
CP.resolve('gaokao');
assert(duelLegend.opp.tilt >= legendTiltBefore + 20, '传说特长出战应直接大幅拉升破防槽');
assert(duelLegend.logs.some(l => l.includes('传说降维打击') || l.includes('震撼全场')), '传说特长应触发传说降维打击战斗日志');
console.log('✅ 史诗特长削弱、传说特长降维打击与品阶特效断言全部通过！');

// ==========================================
// 测试 4: 攻防阶段、对手破防瘫痪与老妈必杀应援
// ==========================================
console.log('\n--- 测试 4: 🛡️ 对手破防瘫痪跳过反击与老妈必杀爆发 ---');
while (CP.pending().length) CP.resolve(0);
CP.state().talents = ['wenqing'];
CP.pendFace(1); // 二姨
const duelCombat = CP.faceDuel();

// 谦虚防守测试
const hpBeforeDefend = duelCombat.myHp;
CP.resolve('tact_defend');
assert(duelCombat.momRage >= 25, '谦虚防守应为老妈充能怒气至少 25%');

// 破防瘫痪测试: 手动将 tilt 设为 99
duelCombat.opp.tilt = 99;
CP.resolve('tact_versal');
const hasStunLog = duelCombat.logs.some(l => l.includes('破防石化') || l.includes('张口结舌'));
assert(hasStunLog, '破防槽满必须触发对手破防石化');

// 老妈大招测试: 怒气蓄满 100% 释放
duelCombat.opp.hp = 600;
duelCombat.opp.maxHp = 600;
duelCombat.momRage = 100;
const oppHpBeforeUlt = duelCombat.opp.hp;
CP.resolve('mom');
assert(duelCombat.momRage < 100, '老妈大招释放后100%怒气已被清空重置');
assert(duelCombat.opp.hp <= oppHpBeforeUlt - 120, '老妈大招应打出 >120 巨额面子伤害');
assert(duelCombat.logs.some(l => l.includes('老妈必杀') || l.includes('拍案而起')), '老妈大招应触发全家杀手锏专属日志');
console.log('✅ 谦虚防反蓄怒、破防石化瘫痪与老妈大招爆发断言全部通过！');

// ==========================================
// 测试 5: 终局结算、MVP特长与家庭面子奖励正向闭环
// ==========================================
console.log('\n--- 测试 5: 🏆 终局战报、MVP 特长与家庭面子正向闭环 ---');
const faceBefore = CP.state().face;
duelCombat.opp.hp = 0; // 对手退场
CP.resolve(0); // 推进至结算态

assert.strictEqual(duelCombat.finished, true, '对手HP归零时对决必须结束');
assert.strictEqual(duelCombat.won, true, '必须判定我方获胜');
assert(duelCombat.mvpTalent, '终局必须评选出 MVP 特长');
assert(duelCombat.totalDamageDealt > 0, '终局必须统计造成的总面子伤害');
assert(CP.state().face >= faceBefore + 120, '获胜后家庭面子必须增加 120');

// 确认并退出战报
const exitMsg = CP.resolve(0);
assert(exitMsg.includes('面子对决大获全胜'), '战报确认返回提示语正确');
assert.strictEqual(CP.faceDuel(), null, '对决状态在退出后必须被清空');
console.log('✅ 终局战报看板、MVP 结算、面子暴增与状态清理断言全部通过！');

// ==========================================
// 测试 6: 🥋 回合制格斗攻防数据流 (lastAction与双向打击状态)
// ==========================================
console.log('\n--- 测试 6: 🥋 回合制格斗攻防数据流与打击反馈元数据 ---');
CP.newGame('格斗宝宝');
while (CP.pending().length) CP.resolve(0);
CP.state().talents = ['tuyasha'];
CP.pendFace(0); // 表嫂
const duelArcade = CP.faceDuel();
assert(duelArcade, '对决初始化成功');

// 轮次 1 出招
const beforeOppHp = duelArcade.opp.hp;
CP.resolve('tuyasha');
const act1 = duelArcade.lastAction;
assert(act1, '必须生成 lastAction 攻防演播元数据');
assert(act1.myDmg > 0, '必须记录造成的伤害值');
assert.strictEqual(act1.prevOppHp, beforeOppHp, '必须记录受创前对手血量');
assert.strictEqual(act1.newOppHp, duelArcade.opp.hp, '必须记录受创后对手血量');
assert(act1.cardName === '小涂鸦师', '记录出招技能名称');
assert(typeof act1.isCrit === 'boolean', '必须记录暴击布尔标识');
assert(typeof act1.oppAtk === 'number', '必须记录对手反击伤害');

// 轮次 2 见招拆招防反
CP.resolve('tact_defend');
const act2 = duelArcade.lastAction;
assert(act2, '防反行动生成元数据');
assert(duelArcade.momRage >= 25, '防反为老妈怒气充能');

console.log('✅ 回合制格斗攻防数据流、打击反馈元数据断言全部通过！');

console.log('\n🎉🎉🎉 原版还原·面子对决全部六大专项深度测试 100% 成功通过！');
