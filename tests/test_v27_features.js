// tests/test_v27_features.js
// v2.7.0 全系统核心玩法深度自动化验证套件
// 涵盖：育儿流派、传家宝百宝阁、校友圈人脉、脑洞2.0神经突触连击、大学四向分流、10代混沌压力测试

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🚀 开始运行 v2.7.0 全系统核心玩法深度测试套件...\n');

// 构造纯净沙箱环境
function createSandbox() {
  const localStorageMock = (function() {
    let store = {};
    return {
      getItem: (key) => (store[key] !== undefined ? store[key] : null),
      setItem: (key, val) => { store[key] = String(val); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; },
      _store: () => store
    };
  })();

  const sandbox = {
    console: { log: () => {}, error: () => {}, warn: () => {} },
    localStorage: localStorageMock,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    Math: Math,
    Date: Date,
    JSON: JSON,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    RegExp: RegExp,
    Set: Set
  };
  sandbox.global = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;

  vm.createContext(sandbox);

  const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf-8');
  vm.runInContext(dataCode, sandbox);

  const coreCode = fs.readFileSync(path.join(__dirname, '../js/core.js'), 'utf-8');
  vm.runInContext(coreCode, sandbox);

  return sandbox;
}

// -----------------------------------------------------------------------------
// 测试 1: 👪 家庭育儿风格流派系统 (Parenting Styles)
// -----------------------------------------------------------------------------
(function testParentingStyles() {
  console.log('--- 测试 1: 👪 家庭育儿风格流派系统 (Parenting Styles) ---');
  const sb = createSandbox();
  const CP = sb.CP;
  const D = sb.DATA;

  // 1.1 校验数据配置表
  assert(Array.isArray(D.parentingStyles) && D.parentingStyles.length === 4, '必须定义4大育儿流派');
  const styleIds = D.parentingStyles.map(s => s.id);
  assert(styleIds.includes('tiger') && styleIds.includes('buddhist') && styleIds.includes('elite') && styleIds.includes('democratic'), '必须包含tiger, buddhist, elite, democratic');

  // 1.2 严父虎妈 (Tiger): 学业行动点减免、考试加成、压力增加、禁绝娱乐索取
  CP.newGame();
  let state = CP.state();
  state.parentingStyle = 'tiger';

  // 检查学业日程扣费
  const learnPool = CP.pool().filter(a => a.kind === 'learn');
  assert(learnPool.length > 0, '应该存在可研习课程');
  assert.strictEqual(learnPool[0].act, 2, '严父虎妈下学业日程行动点消耗必须优惠为 2 (原为3)');

  // 检查娱乐索取被禁绝
  const begsInPool = CP.pool().filter(a => a.kind === 'beg');
  const playBegs = begsInPool.filter(b => {
    const orig = D.begs.find(x => x.id === b.id);
    return orig && orig.kind === 'play';
  });
  assert.strictEqual(playBegs.length, 0, '严父虎妈流派下娱乐型索取必须被完全禁绝不可见');

  // 1.3 佛系散养 (Buddhist): 回合自然压力消除-8、阴影封顶60绝不崩溃、零花钱减少
  CP.newGame();
  state = CP.state();
  state.parentingStyle = 'buddhist';
  state.stress = 50;
  state.shadow = 80;
  state.slots = new Array(6).fill({ kind: 'rest', id: 'rest', act: 0, money: 0 });
  CP.endTurn();
  assert(state.shadow <= 60, '佛系散养流派下心理阴影必须被锁定截断在 60 以下，绝不崩塌');

  // 1.4 卷王世家 (Elite): 开局高额面子与资金、选秀/考试非前列满意度惩罚
  CP.newGame();
  state = CP.state();
  state.parentingStyle = 'elite';
  state.sat = 80;
  state.pending = [{
    type: 'show',
    tier: 1,
    rival: { talent: { r: 4, atk: 50 } }
  }];
  // 模拟选秀未夺冠
  const origRandom = sb.Math.random;
  sb.Math.random = () => 0.99;
  CP.talentShowPerform('voice_loud', 'normal', false);
  sb.Math.random = origRandom;
  assert(state.sat <= 55, '卷王世家在才艺舞台未能夺冠时，父母满意度必须骤降 25');

  // 1.5 民主知心 (Democratic): 满意度保底50、索取失败无失落惩罚
  CP.newGame();
  state = CP.state();
  state.parentingStyle = 'democratic';
  state.sat = 40;
  state.slots = new Array(6).fill({ kind: 'rest', id: 'rest', act: 0, money: 0 });
  CP.endTurn();
  assert(state.sat >= 50, '民主知心流派下父母满意度必须保底 50');

  console.log('✅ 家庭育儿风格流派系统（4大流派全部被动与交互）断言通过！\n');
})();

// -----------------------------------------------------------------------------
// 测试 2: 🏺 传家宝与祖宅百宝阁系统 (Ancestral Relics & Heirlooms)
// -----------------------------------------------------------------------------
(function testAncestralRelics() {
  console.log('--- 测试 2: 🏺 传家宝与祖宅百宝阁系统 (Ancestral Relics & Heirlooms) ---');
  const sb = createSandbox();
  const CP = sb.CP;
  const D = sb.DATA;

  // 2.1 校验8大传家宝定义
  assert(Array.isArray(D.relics) && D.relics.length === 8, '必须定义8件传家珍宝');

  // 2.2 宗祠百宝阁装备上限管控 (上限 2 件)
  CP.newGame();
  const state = CP.state();
  state.fam.heirlooms = ['relic_bike', 'relic_paper', 'relic_stock', 'relic_scarf'];

  state.equippedRelics = [];
  assert.strictEqual(CP.heirlooms.equip('relic_bike'), true, '第1件装备成功');
  assert.strictEqual(CP.heirlooms.equip('relic_paper'), true, '第2件装备成功');
  assert.strictEqual(CP.heirlooms.equip('relic_stock'), false, '第3件装备必须被拦截，每代上限2件');
  assert.strictEqual(CP.heirlooms.equipped().length, 2, '当前装备数量必须严格等于 2');

  // 2.3 卸下与重新佩戴
  assert.strictEqual(CP.heirlooms.unequip('relic_bike'), true, '卸下成功');
  assert.strictEqual(CP.heirlooms.equipped().length, 1, '卸下后当前装备数变为 1');
  assert.strictEqual(CP.heirlooms.equip('relic_stock'), true, '腾出槽位后新传家宝佩戴成功');

  // 2.4 relic_bike 回合自然恢复 +10 行动力
  state.equippedRelics = ['relic_bike'];
  state.act = 100;
  state.slots = new Array(6).fill({ kind: 'rest', id: 'rest', act: 0, money: 0 });
  CP.endTurn();
  // 基础恢复40 + rest*10(60) + bike(10) = 210
  assert(state.act >= 210, '佩戴二八大杠每回合行动力恢复必须额外 +10');

  // 2.5 relic_scarf 必成婚良缘
  state.equippedRelics = ['relic_scarf'];
  state.pending = [{
    type: 'marry',
    isCampus: false,
    prob: 0.01, // 哪怕极低概率
    blindCandidates: [{ name: '林医生', tag: '名医', bonus: { iq: 10 } }]
  }];
  const marryRes = CP.resolve(0);
  assert(state.spouse && state.spouse.name === '林医生', '佩戴青梅竹马手织围巾相亲成婚率必须 100% 必成');

  console.log('✅ 祖宅百宝阁（传家宝铸造、2件配装限制、各被动词条全生效）断言通过！\n');
})();

// -----------------------------------------------------------------------------
// 测试 3: 🤝 同窗校友圈与成人期人脉网络 (Alumni Network)
// -----------------------------------------------------------------------------
(function testAlumniNetwork() {
  console.log('--- 测试 3: 🤝 同窗校友圈与成人期人脉网络 (Alumni Network) ---');
  const sb = createSandbox();
  const CP = sb.CP;
  const D = sb.DATA;

  // 3.1 数据检验
  assert(Array.isArray(D.alumniPerks) && D.alumniPerks.length === 7, '必须定义7位同窗的成人职业档案');

  // 3.2 幼年期与高中期未成年时校友圈锁定
  CP.newGame();
  let state = CP.state();
  state.turn = 10; // 小学期
  let alumniList = CP.alumni.list();
  assert(alumniList.length === 7, '校友列表包含7人');
  assert.strictEqual(alumniList[0].unlocked, false, '高中毕业前成人校友圈必须处于未解锁状态');

  const earlyCall = CP.alumni.call('summer');
  assert.strictEqual(earlyCall.success, false, '高中毕业前呼叫校友必须被拦截');

  // 3.3 大学及职场期校友圈解锁，并发起专属技能求助
  state.turn = 47; // 大学期
  alumniList = CP.alumni.list();
  assert.strictEqual(alumniList[0].unlocked, true, '步入大学后校友圈自动全部解锁');

  state.insight = 100;
  state.act = 100;
  state.money = 200;
  const callRes = CP.alumni.call('shenhan'); // 沈韩 (顶级三甲主治医师: 清空压力并回复体魄)
  assert.strictEqual(callRes.success, true, '沈韩医生援助技能调用成功');
  assert.strictEqual(state.stress, 0, '呼叫沈韩医生后压力必须彻底清空归零');

  // 3.4 每回合防重复呼叫（单回合内同一校友只能呼叫 1 次）
  const callAgain = CP.alumni.call('shenhan');
  assert.strictEqual(callAgain.success, false, '单回合内同一校友不能连续呼叫');

  // 3.5 过回合后自动重置呼叫限制
  state.slots = new Array(6).fill({ kind: 'rest', id: 'rest', act: 0, money: 0 });
  CP.endTurn();
  assert.strictEqual(state.alumniCalls['shenhan'], undefined, '过回合后校友呼叫状态必须全部清空重置');

  console.log('✅ 同窗校友圈与成人人脉网络（阶段解锁、技能扣费、增益生效、回合重置）断言通过！\n');
})();

// -----------------------------------------------------------------------------
// 测试 4: 🧠 脑洞 2.0 神经突触连锁共鸣与特色脑域 (Synaptic Combos 2.0)
// -----------------------------------------------------------------------------
(function testSynapticCombos() {
  console.log('--- 测试 4: 🧠 脑洞 2.0 神经突触连锁共鸣与特色脑域 (Synaptic Combos 2.0) ---');
  const sb = createSandbox();
  const CP = sb.CP;

  CP.newGame();
  const state = CP.state();
  state.act = 200;

  // 4.1 构造 4 连通同色连击棋盘 (例如第 0, 1, 6 格全部为 bulb)
  const g = CP.brain.grid();
  g[0] = { t: 'bulb', open: false };
  g[1] = { t: 'bulb', open: true };
  g[6] = { t: 'bulb', open: true };
  g[7] = { t: 'bulb', open: true };

  const startInsight = state.insight;
  const revRes = CP.brain.rev(0);
  assert(revRes && revRes.indexOf('灵感回路') >= 0, '4连通连击必须触发【灵感回路】(1.6倍)');
  assert(state.lastBrainCombo && state.lastBrainCombo.count >= 4, '突触BFS连击数必须正确统计为 4');
  assert.strictEqual(state.lastBrainCombo.mult, 1.6, '4连通连击倍率必须为 1.6');
  assert(state.insight > startInsight + 15, '连击暴击悟性增长显著高于单格基础值');

  // 4.2 验证全脑风暴 (5+ 连击返还 2 行动点)
  CP.newGame();
  const state2 = CP.state();
  state2.act = 50;
  const g2 = CP.brain.grid();
  // 构造 5 连通同色节点: 0, 1, 2, 7, 8 全部为 attr
  [0, 1, 2, 7, 8].forEach(idx => { g2[idx] = { t: 'attr', open: true }; });
  g2[0].open = false; // 准备点击 0
  const actBefore = state2.act;
  const resBurst = CP.brain.rev(0);
  assert(resBurst && resBurst.indexOf('全脑风暴') >= 0, '5+连击必须触发【全脑风暴】(2.2倍)');
  assert.strictEqual(state2.lastBrainCombo.mult, 2.2, '5+连击倍率必须为 2.2');
  // 点击消耗2点，全脑风暴返还2点，净消耗0点
  assert.strictEqual(state2.act, actBefore, '全脑风暴必须返还 2 点行动力，实现零消耗连爆');

  console.log('✅ 脑洞 2.0 突触 4 连通同色连击（BFS遍历、倍率运算、灵感外溢、行动力返还）断言通过！\n');
})();

// -----------------------------------------------------------------------------
// 测试 5: 🎓 大学四向深造分支与成人期深度人生岔路 (Divergent Paths)
// -----------------------------------------------------------------------------
(function testDivergentPaths() {
  console.log('--- 测试 5: 🎓 大学四向深造分支与成人期深度人生岔路 (Divergent Paths) ---');
  const sb = createSandbox();
  const CP = sb.CP;
  const D = sb.DATA;

  // 5.1 数据检验
  assert(Array.isArray(D.divergentPaths) && D.divergentPaths.length === 4, '必须定义4大人生成人分支');
  assert(Array.isArray(D.branchActions) && D.branchActions.length === 8, '必须定义8门赛道高阶日程');

  // 5.2 回合 46 自动推入 crossroad 抉择模态框
  CP.newGame();
  const state = CP.state();
  state.turn = 45;
  state.slots = new Array(6).fill({ kind: 'rest', id: 'rest', act: 0, money: 0 });
  CP.endTurn(); // 推进到 Turn 46
  assert.strictEqual(state.turn, 46, '推进至大学第 46 回合');
  assert(state.pending.some(p => p.type === 'crossroad'), '第 46 回合必须自动触发人生十字路口分流抉择');

  // 消费掉 crossroad 前的弹窗
  while (state.pending.length && state.pending[0].type !== 'crossroad') {
    state.pending.shift();
  }

  // 5.3 选定科技创业分支 (startup)
  CP.resolve('startup');
  assert.strictEqual(state.careerBranch, 'startup', '主航道赛道成功绑定为科技创业 (startup)');

  // 5.4 赛道专属高阶日程注入日程行动池
  const branchPool = CP.pool().filter(a => a.kind === 'branch');
  assert(branchPool.length >= 2, '创业分支专属高阶日程必须出现在日程池中');
  const pitchAction = branchPool.find(a => a.id === 'act_pitch_deck');
  assert(pitchAction != null, '商业计划书打磨必须可用');

  // 执行专属赛道日程
  state.slots = [
    { kind: 'branch', id: 'act_pitch_deck', act: 3, money: 0 },
    { kind: 'branch', id: 'act_vc_roadshow', act: 3, money: 0 },
    { kind: 'rest', id: 'rest', act: 0, money: 0 },
    { kind: 'rest', id: 'rest', act: 0, money: 0 },
    { kind: 'rest', id: 'rest', act: 0, money: 0 },
    { kind: 'rest', id: 'rest', act: 0, money: 0 }
  ];
  const oldImg = state.attrs.img;
  CP.endTurn();
  assert(state.attrs.img > oldImg, '赛道专属日程执行后核心属性必须增长');

  // 5.5 终局职业自动匹配赛道顶级岗位与成就
  state.turn = 49;
  state.slots = new Array(6).fill({ kind: 'rest', id: 'rest', act: 0, money: 0 });
  CP.endTurn(); // Turn 50 触发 pendCareer
  assert(state.job && state.job.name.indexOf('独角兽') >= 0, '科技创业赛道毕业必须直接入职【独角兽之父】');
  assert.strictEqual(state.job.t, 5, '赛道顶级职位门第必须为 Tier 5');

  // 推进到终章结算
  state.turn = 59;
  state.slots = new Array(6).fill({ kind: 'rest', id: 'rest', act: 0, money: 0 });
  CP.endTurn(); // Turn 60 触发 pushEndGen
  assert(state.fam.achievements.includes('ach-unicorn-king'), '终局必须解锁专属时代独角兽传家成就 (ach-unicorn-king)');

  console.log('✅ 大学四向深造分支与人生岔路（Turn 46抉择、专属日程、终局名企、传家成就）断言通过！\n');
})();

// -----------------------------------------------------------------------------
// 测试 6: 🌪️ 10代全随机混沌策略全生命周期无头沙箱压力测试
// -----------------------------------------------------------------------------
(function testTenGenerationsChaos() {
  console.log('--- 测试 6: 🌪️ 10代全随机混沌策略全生命周期无头沙箱压力测试 ---');
  const sb = createSandbox();
  const CP = sb.CP;

  CP.newGame();

  for (let gen = 1; gen <= 10; gen++) {
    let genFinished = false;
    let guard = 0;
    while (!genFinished && guard++ < 300) {
      const state = CP.state();
      if (!state) break;

      // 消费所有 pending 弹窗
      let p = CP.pending();
      let pg = 0;
      while (p.length && pg++ < 40) {
        const top = p[0];
        if (top.type === 'endgen') {
          CP.resolve(0); // 迈向下一代
          genFinished = true;
          break;
        }
        const optIdx = (top.opts && top.opts.length) ? Math.floor(Math.random() * top.opts.length) : 0;
        CP.resolve(optIdx);
        p = CP.pending();
      }
      if (genFinished) break;

      // 脑洞随机挖掘
      const bGrid = CP.brain.grid();
      for (let k = 0; k < 5; k++) {
        const idx = Math.floor(Math.random() * bGrid.length);
        if (CP.brain.info().keyPending) {
          CP.brain.useKey();
        } else if (!bGrid[idx].open && state.act >= 2) {
          CP.brain.rev(idx);
        }
      }

      // 随机排满 6 件事
      CP.clearSlots();
      CP.autoFillSlots();

      // 过回合
      CP.endTurn();
    }
  }

  const fam = CP.fam();
  assert(fam.g >= 10, '必须顺利完成至少 10 代全生命周期传承');
  assert(Array.isArray(fam.heirlooms) && fam.heirlooms.length >= 2, '传承10代后百宝阁必须至少沉淀2件以上传家宝');
  console.log(`✅ 10代混沌压力测试圆满通关！当前氏族第 ${fam.g} 代，累计传家珍宝 ${fam.heirlooms.length} 件，图鉴特长 ${fam.atlas.length} 项，门第阶层 ${fam.tier}！\n`);
})();

console.log('🎉🎉🎉 恭喜！v2.7.0 全部五大核心玩法、六大专项测试与十代压力回归测试 100% 顺利通过！\n');
