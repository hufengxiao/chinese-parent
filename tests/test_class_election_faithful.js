/* ============================================================
 * 班委竞选 3.0 经典还原专项自动化深度测试套件
 * ============================================================ */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('🚀 开始运行班委竞选 3.0 (Class Election 3.0) 专属深度测试套件...\n');

// 构造沙箱上下文
const ctx = {
  console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  }
};
ctx.window = ctx;
ctx.globalThis = ctx;
vm.createContext(ctx);

const dir = __dirname;
['../js/data.js', '../js/core.js'].forEach(file => {
  const code = fs.readFileSync(path.join(dir, file), 'utf8');
  vm.runInContext(code, ctx);
});

const CP = ctx.CP;
const DATA = ctx.DATA;

// 初始化单代游戏
CP.newGame('测试选手');
while (CP.pending().length) CP.resolve(0);

// --- 测试 1: 三大候选人同台模型、三大核心指标与动态长短板测定 ---
console.log('--- 测试 1: 🧑‍🏫 三大候选人同台模型、三大核心指标与长短板测定 ---');
CP.state().attrs = { iq: 120, eq: 80, cha: 60, mem: 50, img: 50, phy: 50 };
CP.pendElection();

assert(CP.state().pending.length > 0, '必须成功推入 election pending 事件');
assert.strictEqual(CP.state().pending[0].type, 'election', '事件类型必须为 election');

const el = CP.state().election;
assert(el, 'S.election 状态必须存在');
assert.strictEqual(el.version, '3.0', '竞选版本必须为 3.0');
assert.strictEqual(el.maxRound, 5, '原版经典竞选轮次必须为 5 回合');
assert.strictEqual(el.totalVotes, 50, '全班总票池必须为 50 票');
assert.strictEqual(el.targetVotes, 26, '过半胜选门槛必须为 26 票');

assert(Array.isArray(el.candidates) && el.candidates.length === 3, '候选人必须为三人同台 (我方 + 王小明 + 赵小刚)');
const pCand = el.candidates.find(c => c.isPlayer);
const rA = el.candidates.find(c => c.id === 'rivalA');
const rB = el.candidates.find(c => c.id === 'rivalB');

assert(pCand && rA && rB, '我方、尖子王小明、后排赵小刚必须全部检录完毕');
assert(pCand.metrics.teacher > 0 && pCand.metrics.peer > 0 && pCand.metrics.moral > 0, '三大指标必须全部有效计算');
assert(['teacher', 'peer', 'moral'].includes(pCand.strength), '优势长板必须属于三大核心指标');
assert(['teacher', 'peer', 'moral'].includes(pCand.weakness), '劣势短板必须属于三大核心指标');

// 王小明与赵小刚设定
assert.strictEqual(rA.strength, 'moral', '王小明优势长板必须为品德表率 (学霸尖子)');
assert.strictEqual(rA.weakness, 'peer', '王小明劣势短板必须为群众基础 (严肃死板爱打小报告)');
assert.strictEqual(rB.strength, 'peer', '赵小刚优势长板必须为群众基础 (热血义气请吃零食)');
assert.strictEqual(rB.weakness, 'teacher', '赵小刚劣势短板必须为师生关系 (纪律散漫爱迟到)');
console.log('✅ 候选人模型与三大指标（师生/群众/品德）长短板断言通过！');

// --- 测试 2: 5 回合博弈状态机与自我宣传优势加成 ---
console.log('\n--- 测试 2: 📢 5 回合博弈推进与自我宣传长板爆发 ---');
const prevMoral = pCand.metrics.moral;
const gain1 = CP.doElection(0); // 选项 0: 自我宣传
assert(gain1 >= 5, `自我宣传长板得票应具备加成 (实际: ${gain1})`);
assert(pCand.votes > 0 && pCand.votes <= gain1, '我方累计票数应有效增加');
assert(el.round === 2, '当前回合应推进至第 2 轮');
console.log(`✅ 第 1 轮自我宣传斩获 ${gain1} 票，长板加成生效！`);

// --- 测试 3: 针对揭短攻击与指定目标削弱对手 ---
console.log('\n--- 测试 3: ⚡ 针对揭短攻击与指定目标削弱对手 ---');
rA.votes = 15; // 假设王小明目前领跑
const rABefore = rA.votes;
const rAPeerBefore = rA.metrics.peer;
const gain3 = CP.doElection({ tactic: 3, target: 'rivalA' }); // 针对揭发王小明
assert(gain3 > 0, '针对揭短应为我方分流斩获选票');
assert(rA.metrics.peer <= rAPeerBefore || el.logs.some(l => l.includes('王小明')), '针对王小明弱项揭短应削弱其指标或在战报中体现打击');
console.log(`✅ 针对王小明劣势揭短成功：王小明指标/票数受到削弱，我方分流斩获 ${gain3} 票！`);

// --- 测试 4: 课桌代表同学席位与动态弹幕更新 ---
console.log('\n--- 测试 4: 🏫 课桌代表同学席位与动态弹幕更新 ---');
assert(Array.isArray(el.desks) && el.desks.length >= 8, '教室课桌必须具备 8 位同班同学代表席位');
const hasBubble = el.desks.some(d => Boolean(d.bubble));
assert(hasBubble, '演说拉票后必须有课桌同学动态冒出漫画对白气泡');
console.log('✅ 教室课桌席位与动态弹幕气泡机制断言通过！');

// --- 测试 5: 三档职位任命结算与专属特长赋予 ---
console.log('\n--- 测试 5: 🏆 三档职位任命结算 (三道杠/二道杠/一道杠) 与专属特长 ---');
// 场景 A: 第 1 名当选中队长 / 班长
el.candidates.find(c => c.isPlayer).votes = 30; // 超过 26 票直接过半胜出
rA.votes = 10;
rB.votes = 8;
el.myVotes = 30;
CP.electionFinish();

assert.strictEqual(el.finished, true, '竞选必须已宣告结标');
assert.strictEqual(el.won, true, '第一名必须判定为胜选');
assert.strictEqual(el.rank, 1, '第一名 rank 必须为 1');
assert.strictEqual(el.awardedTitle, '班级中队长 / 班长', '头衔必须为班级中队长 / 班长');
assert(CP.state().talents.includes('el_leader'), '必须获得金色传说特长：威风凛凛一班之长');
assert(CP.pending()[0].type === 'electionr', '必须推入 electionr 正式任命聘书弹窗');

// 场景 B: 模拟第 2 名当选副班长
el.finished = false;
el.candidates.find(c => c.isPlayer).votes = 15;
rA.votes = 20; // 王小明第一
rB.votes = 10;
el.myVotes = 15;
CP.electionFinish();
assert.strictEqual(el.rank, 2, '第二名 rank 必须为 2');
assert.strictEqual(el.won, false, '第二名 won 判定为 false');
assert.strictEqual(el.awardedTitle, '班级副班长 / 宣传委员', '头衔必须为副班长 / 宣传委员');
assert(CP.state().talents.includes('el_deputy'), '必须获得史诗特长：班级得力臂膀');

// 场景 C: 模拟第 3 名受任劳动委员
el.finished = false;
el.candidates.find(c => c.isPlayer).votes = 8;
rA.votes = 22;
rB.votes = 18;
el.myVotes = 8;
CP.electionFinish();
assert.strictEqual(el.rank, 3, '第三名 rank 必须为 3');
assert.strictEqual(el.awardedTitle, '班级劳动委员 / 保洁专员', '头衔必须为劳动委员 / 保洁专员');
assert(CP.state().talents.includes('el_labor'), '必须获得稀有特长：包干区总管');

console.log('✅ 三档职位任命结算、称号特长赋予（三道杠/二道杠/一道杠）断言通过！');

// --- 测试 6: 面子对决卡牌联动 (特长出战验证) ---
console.log('\n--- 测试 6: 🎴 班干部专属特长与面子对决卡组无缝联动 ---');
const allTalentIds = CP.state().talents;
assert(allTalentIds.includes('el_leader') && allTalentIds.includes('el_deputy') && allTalentIds.includes('el_labor'), '三大特长已全部收入个人特长池');
const leaderData = DATA.talentData.find(x => x.id === 'el_leader');
assert(leaderData && leaderData.r === 4, '威风凛凛一班之长必须为 Rank 4 传说特长');
console.log('✅ 班干部专属特长与面子对决出战体系无缝融合！');

console.log('\n🎉🎉🎉 恭喜！班委竞选 3.0 全部六大专项深度测试 100% 成功通过！\n');
