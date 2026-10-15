/**
 * tests/test_code_review_fixes.js
 * -------------------------------------------------------------
 * 针对代码审查报告 (code-review-report.html) 中 core.js 核心逻辑与结算专项修复的深度回归断言套件
 * 
 * 覆盖修复项：
 * 1. P0-1: CP API 导出 ANAME, attrName, attrNames
 * 2. P0-3: importSlot 存档名称 XSS 防护与清洗校验 (typeof 校验、HTML 标签剥离、长度截断 1~16、空值回退 '无名')
 * 3. P1-1: 特长才艺选秀 3.0 绝活返场 (Encore) 幂等性防御（增量结算防止双重奖励入账、showr 模态框原地替换防止叠层、resolvePend 清理 showSettled 标记）
 * 4. P1-2: 祖宅百宝阁传家宝词条统一 (applyOneRelic / removeOneRelic)，涵盖 maxAct、seedMoney、五维与面子加成，以及 newGame 基线行动力重置顺序修复
 * 5. P1-5: 存档写入收敛至单一统一助手函数 writeSlot(slot, saveStr, famStr)
 * 6. P1-9: resolvePend 挂起态 default 分支捕获未知类型并输出 console.warn
 * 7. P2-1: electionFinish 班委竞选终局函数空值守卫 (!S || !S.election)
 * 8. P2-2: 删除未调用的死代码 showResult(tier)
 * 9. P2-3: 面子对决 faceDuelStep 消除魔法数字 actionIdx === 4 与真实手牌冲突，仅按字符串判定老妈大招
 * 10. P3-1: 平滑年龄算法修复：第 57 回合 28 岁 -> 第 58 回合成家后平滑过渡至 29 岁 (29 + Math.floor((t - 58) / 2))
 * -------------------------------------------------------------
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('🚀 开始运行 core.js 代码审查缺陷修复深度回归测试套件...\n');

function createFreshSandbox() {
  const store = {};
  const warnLogs = [];
  const sandbox = {
    console: {
      log: () => {},
      error: () => {},
      warn: (...args) => { warnLogs.push(args.join(' ')); }
    },
    setTimeout: (fn) => { if (typeof fn === 'function') fn(); },
    clearTimeout: () => {},
    setInterval: (fn) => 1,
    clearInterval: () => {},
    Math,
    Date,
    Array,
    Object,
    Number,
    String,
    Boolean,
    RegExp,
    Set,
    window: {},
    document: {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => []
    },
    localStorage: {
      _data: store,
      getItem(k) { return k in this._data ? this._data[k] : null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; },
      clear() { for (const k in this._data) delete this._data[k]; }
    }
  };
  sandbox.window = sandbox;
  sandbox.global = sandbox;
  sandbox.globalThis = sandbox;
  sandbox._warnLogs = warnLogs;

  const dir = path.join(__dirname, '..', 'js');
  const dataCode = fs.readFileSync(path.join(dir, 'data.js'), 'utf8');
  const coreCode = fs.readFileSync(path.join(dir, 'core.js'), 'utf8');

  vm.createContext(sandbox);
  vm.runInContext(dataCode, sandbox);
  vm.runInContext(coreCode, sandbox);

  return sandbox;
}

// =============================================================
// 测试 1: P0-1 属性名称映射与导出完备性 (ANAME / attrName / attrNames)
// =============================================================
(function testAttrNameExport() {
  console.log('--- 测试 1: P0-1 属性名称映射导出 (ANAME, attrName, attrNames) ---');
  const sb = createFreshSandbox();
  const CP = sb.CP;

  assert(CP.ANAME && typeof CP.ANAME === 'object', 'CP 必须导出 ANAME 对象');
  assert.strictEqual(CP.ANAME.iq, '智商', 'ANAME.iq 映射为 智商');
  assert.strictEqual(CP.ANAME.eq, '情商', 'ANAME.eq 映射为 情商');
  assert.strictEqual(CP.ANAME.mem, '记忆力', 'ANAME.mem 映射为 记忆力');
  assert.strictEqual(CP.ANAME.img, '想象力', 'ANAME.img 映射为 想象力');
  assert.strictEqual(CP.ANAME.phy, '体魄', 'ANAME.phy 映射为 体魄');
  assert.strictEqual(CP.ANAME.cha, '魅力', 'ANAME.cha 映射为 魅力');

  assert.strictEqual(typeof CP.attrName, 'function', 'CP 必须导出 attrName 函数');
  assert.strictEqual(CP.attrName('iq'), '智商');
  assert.strictEqual(CP.attrName('eq'), '情商');
  assert.strictEqual(CP.attrName('unknown_key'), 'unknown_key', '未识别键原样返回');

  assert.strictEqual(typeof CP.attrNames, 'function', 'CP 必须导出 attrNames 函数');
  const namesCopy = CP.attrNames();
  assert.strictEqual(namesCopy.phy, '体魄');
  namesCopy.phy = '修改体魄';
  assert.strictEqual(CP.ANAME.phy, '体魄', 'attrNames 应返回独立浅拷贝，不影响源字典');

  assert.strictEqual(sb.global.ANAME && sb.global.ANAME.iq, '智商', 'global 作用域必须兼容挂载 ANAME 以免 UI 裸引用抛 ReferenceError');

  console.log('✅ P0-1: ANAME, attrName, attrNames 导出与兜底映射断言通过！');
})();

// =============================================================
// 测试 2: P0-3 importSlot 存档名称清洗与 XSS 注入防御
// =============================================================
(function testImportSlotSanitization() {
  console.log('\n--- 测试 2: P0-3 importSlot 存档名称清洗与 XSS 注入防御 ---');
  const sb = createFreshSandbox();
  const CP = sb.CP;

  // 1) 带有恶意 HTML 标签注入的存档
  const maliciousSave = {
    magic: 'CPH_SAVE_PACKAGE',
    ver: 1,
    turn: 10,
    save: {
      ver: 1,
      turn: 10,
      attrs: { iq: 100, eq: 100, mem: 100, img: 100, phy: 100, cha: 100 },
      name: '<script>alert("xss")</script>张三<img src=x onerror=alert(1)>',
      gen: 1
    },
    fam: { g: 0, talent: 0, heirlooms: [] }
  };
  const jsonStr = JSON.stringify(maliciousSave);
  const res = CP.saveManager.importSlot(jsonStr, 1);
  assert(res.ok, '合法包结构的存档应导入成功');

  const loaded = CP.saveManager.listSlots()[1];
  assert(loaded && loaded.name, '槽位 1 应当有存档');
  assert(!loaded.name.includes('<script>'), '存档名称严禁包含 script 标签');
  assert(!loaded.name.includes('<img'), '存档名称严禁包含 img 标签');
  assert.strictEqual(loaded.name, 'alert("xss")张三', 'HTML 标签剥离后保留纯文本内容');

  // 2) 纯 HTML 标签剥离后为空 -> 回退兜底为 '无名'
  const tagOnlySave = {
    ver: 1,
    turn: 5,
    attrs: { iq: 50 },
    name: '<div><span></span></div>'
  };
  const res2 = CP.saveManager.importSlot(JSON.stringify(tagOnlySave), 2);
  assert(res2.ok);
  const loaded2 = CP.saveManager.listSlots()[2];
  assert.strictEqual(loaded2.name, '无名', '标签全被剥离为空后必须回退为「无名」');

  // 3) 超长名称截断至 16 字符
  const longNameSave = {
    ver: 1,
    turn: 5,
    attrs: { iq: 50 },
    name: '这是一个超级超级超级超级超级长的非法名称测试'
  };
  CP.saveManager.importSlot(JSON.stringify(longNameSave), 1);
  const loadedLong = CP.saveManager.listSlots()[1];
  assert(loadedLong.name.length <= 16, '存档名称最长不得超过 16 字符');
  assert.strictEqual(loadedLong.name, '这是一个超级超级超级超级超级长的', '超长名称必须截断前 16 字符');

  // 4) 非字符串类型防御
  const numNameSave = {
    ver: 1,
    turn: 5,
    attrs: { iq: 50 },
    name: 123456
  };
  CP.saveManager.importSlot(JSON.stringify(numNameSave), 1);
  const loadedNum = CP.saveManager.listSlots()[1];
  assert.strictEqual(loadedNum.name, '无名', '非字符串名称必须安全回退为「无名」');

  console.log('✅ P0-3: importSlot 存档名称 HTML 剥离、空值兜底与 16 字符截断断言通过！');
})();

// =============================================================
// 测试 3: P1-1 特长选秀绝活返场 (Encore) 幂等性防御与弹窗防叠层
// =============================================================
(function testTalentShowEncoreIdempotency() {
  console.log('\n--- 测试 3: P1-1 特长选秀绝活返场 (Encore) 幂等性与弹窗防叠层 ---');
  const sb = createFreshSandbox();
  const CP = sb.CP;

  CP.newGame();
  CP.state().pending = [];
  CP.state().talents = ['voice_loud'];
  CP.state().insight = 100;
  CP.state().face = 100;

  // 挂起小学选秀
  CP.pendShow(1);
  assert.strictEqual(CP.pending().length, 1, '挂起选秀后 pending 应有 1 个项');
  assert.strictEqual(CP.pending()[0].type, 'show');

  // 模拟弱特长仅点亮 1 盏灯 (1 盏灯判定劣势，触发 Encore 加演)
  let rollCount = 0;
  const origRandom = sb.Math.random;
  sb.Math.random = () => {
    rollCount++;
    return rollCount === 3 ? 0.01 : 0.99;
  };

  // 步骤 1: 首次登台表演 (UI 第一次调用 talentShowPerform: reveal 阶段，encoreChoice: false)
  const resReveal = CP.talentShowPerform({
    chosenTalentId: 'voice_loud',
    styleChoice: 'steady',
    showtimeGrade: 'normal',
    encoreChoice: false
  });

  assert(resReveal, '首次表演必须返回结果');
  assert.strictEqual(resReveal.type, 'showr');
  assert.strictEqual(resReveal.win, false, '劣势下未能夺冠');
  assert.strictEqual(CP.pending().length, 1, '旧 show 项应被替换为单个 showr 项，pending 长度仍为 1');
  assert.strictEqual(CP.pending()[0].type, 'showr');

  const insightAfterReveal = CP.state().insight;
  const faceAfterReveal = CP.state().face;
  const firstGi = resReveal.gi;
  const firstGf = resReveal.gf;
  assert.strictEqual(insightAfterReveal, 100 + firstGi, '初次结算发放基础纪念奖悟性');
  assert.strictEqual(faceAfterReveal, 100 + firstGf, '初次结算发放基础纪念奖面子');

  // 验证一次性结算标记已记录
  assert(CP.state().flags && CP.state().flags.showSettled_1, '状态必须记录 showSettled_1 结算元数据');

  // 步骤 2: 玩家选择加演返场 (UI 第二次调用 talentShowPerform: encore 阶段)
  // 模拟 Encore 成功 (让 Math.random = 0.01)
  sb.Math.random = () => 0.01;
  const resEncore = CP.talentShowPerform({
    chosenTalentId: 'voice_loud',
    styleChoice: 'steady',
    showtimeGrade: 'normal',
    encoreChoice: 'speech'
  });
  sb.Math.random = origRandom;

  assert(resEncore, '返场调用必须返回结果');
  assert.strictEqual(resEncore.encoreTriggered, true, '返场必须被触发');
  assert.strictEqual(resEncore.encoreSuccess, true, '返场判定成功');
  assert.strictEqual(resEncore.win, true, '翻盘绿灯达标夺得冠军');

  // 核心防御断言 1: 弹窗模态框严禁叠层 (pending.length 必须保持 1，原地替换)
  assert.strictEqual(CP.pending().length, 1, 'Encore 返场后结果模态框必须原地更新，严禁 push 两个 showr！');
  assert.strictEqual(CP.pending()[0].win, true, '当前待决模态框应已更新为夺冠战报');

  // 核心防御断言 2: 数值只补齐增量差额 (deltaGi / deltaGf)，绝不重复加上第一轮的基数！
  const expectedTotalGi = resEncore.gi;
  const expectedTotalGf = resEncore.gf;
  assert.strictEqual(CP.state().insight, 100 + expectedTotalGi, '选秀全流程累计悟性必须等于最终夺冠悟性，严禁双倍重复结算');
  assert.strictEqual(CP.state().face, 100 + expectedTotalGf, '选秀全流程累计面子必须等于最终夺冠面子，严禁双倍重复结算');

  // 步骤 3: 玩家走下舞台 (resolve 走完 showr)
  const resolveRes = CP.resolve();
  assert.strictEqual(resolveRes, '走下选秀舞台');
  assert.strictEqual(CP.pending().length, 0, '挂起弹窗顺利出队');
  assert(!CP.state().flags.showSettled_1, '选秀完成后，showSettled_1 临时标记必须被安全销毁清理');

  console.log('✅ P1-1: Talent Show Encore 幂等增量结算、弹窗防叠层与标记清理断言通过！');
})();

// =============================================================
// 测试 4: P1-2 祖宅百宝阁传家宝词条统一与开局行动力覆盖修复
// =============================================================
(function testRelicPerksUnificationAndNewGameAct() {
  console.log('\n--- 测试 4: P1-2 传家宝词条统一 (maxAct/seedMoney) 与 newGame 行动力修复 ---');
  const sb = createFreshSandbox();
  const CP = sb.CP;

  // 1) 佩戴 / 卸下二八大杠 (relic_bike: maxAct: 30)
  CP.newGame();
  const baseAct = CP.state().act;
  CP.state().fam.heirlooms = ['relic_bike', 'relic_stock', 'relic_racket'];
  CP.state().equippedRelics = [];

  const equipBikeRes = CP.heirlooms.equip('relic_bike');
  assert.strictEqual(equipBikeRes, true, '装备二八大杠成功');
  assert.strictEqual(CP.state().act, baseAct + 30, '手工佩戴二八大杠后行动力上限必须立刻 +30');

  const unequipBikeRes = CP.heirlooms.unequip('relic_bike');
  assert.strictEqual(unequipBikeRes, true, '卸下二八大杠成功');
  assert.strictEqual(CP.state().act, baseAct, '卸下二八大杠后行动力上限必须精准扣除回退 30');

  // 2) 佩戴 / 卸下原始股凭单 (relic_stock: seedMoney: 150)
  const baseMoney = CP.state().money;
  const equipStockRes = CP.heirlooms.equip('relic_stock');
  assert.strictEqual(equipStockRes, true, '装备原始股凭单成功');
  assert.strictEqual(CP.state().money, baseMoney + 150, '手工佩戴原始股凭单后压岁钱必须立刻 +150');

  const unequipStockRes = CP.heirlooms.unequip('relic_stock');
  assert.strictEqual(unequipStockRes, true, '卸下原始股凭单成功');
  assert.strictEqual(CP.state().money, baseMoney, '卸下原始股凭单后压岁钱必须精准扣回 150');

  // 3) 佩戴 / 卸下乒乓球拍 (relic_racket: phy: 35)
  const basePhy = CP.state().attrs.phy;
  CP.heirlooms.equip('relic_racket');
  assert.strictEqual(CP.state().attrs.phy, basePhy + 35, '佩戴乒乓球拍体魄+35');
  CP.heirlooms.unequip('relic_racket');
  assert.strictEqual(CP.state().attrs.phy, basePhy, '卸下乒乓球拍体魄精准扣减 35');

  // 4) newGame() 新代开局已佩戴二八大杠时，行动力加成绝不被覆盖回 100
  // 模拟家族已解锁二八大杠并由继承佩戴
  const fakeFam = {
    g: 1,
    name: '先祖',
    heirlooms: ['relic_bike'],
    talent: 0,
    tier: 1
  };
  CP.writeSlot(0, null, JSON.stringify(fakeFam));
  CP.newGame();

  const newGenState = CP.state();
  assert(newGenState.equippedRelics.includes('relic_bike'), '开局应继承佩戴二八大杠');
  // 基线 100 + 二八大杠 30 = 130 (若有 democratic 风格还会 +20 达到 150)
  assert(newGenState.act >= 130, `新代继承佩戴二八大杠后开局行动力应 >= 130，实际为: ${newGenState.act} (已证明未被 S.act=100 抹杀)`);

  console.log('✅ P1-2: 传家宝 applyOneRelic/removeOneRelic 词条统一与 newGame act 保全断言通过！');
})();

// =============================================================
// 测试 5: P1-5 writeSlot 单一写槽位与冗余兼容键同步
// =============================================================
(function testWriteSlotConsolidation() {
  console.log('\n--- 测试 5: P1-5 writeSlot 统一收敛与冗余键安全同步 ---');
  const sb = createFreshSandbox();
  const CP = sb.CP;
  const LS = sb.localStorage;

  assert.strictEqual(typeof CP.writeSlot, 'function', 'CP 必须导出 writeSlot 函数');
  assert.strictEqual(typeof CP.saveManager.writeSlot, 'function', 'saveManager 必须提供 writeSlot 接口');

  // 槽位 0: 必须同时写入 cph_save 与 cph_save_0, 以及 cph_fam 与 cph_fam_0
  const saveJson0 = JSON.stringify({ name: '测试0代', turn: 1 });
  const famJson0 = JSON.stringify({ g: 0, talent: 1 });
  CP.writeSlot(0, saveJson0, famJson0);

  assert.strictEqual(LS.getItem('cph_save'), saveJson0, 'cph_save 主键必须写入');
  assert.strictEqual(LS.getItem('cph_save_0'), saveJson0, 'cph_save_0 兼容副键必须同步写入');
  assert.strictEqual(LS.getItem('cph_fam'), famJson0, 'cph_fam 宗祠主键必须写入');
  assert.strictEqual(LS.getItem('cph_fam_0'), famJson0, 'cph_fam_0 宗祠副键必须同步写入');

  // 槽位 1: 写入独立键 cph_save_1, cph_fam_1，绝不污染槽位 0
  const saveJson1 = JSON.stringify({ name: '测试1代', turn: 10 });
  const famJson1 = JSON.stringify({ g: 1, talent: 3 });
  CP.writeSlot(1, saveJson1, famJson1);

  assert.strictEqual(LS.getItem('cph_save_1'), saveJson1);
  assert.strictEqual(LS.getItem('cph_fam_1'), famJson1);
  assert.strictEqual(LS.getItem('cph_save'), saveJson0, '槽位 1 写入绝不可覆盖槽位 0');

  console.log('✅ P1-5: writeSlot 统一多槽位与兼容键双写收敛断言通过！');
})();

// =============================================================
// 测试 6: P1-9 resolvePend default 分支告警捕获
// =============================================================
(function testResolvePendDefaultWarning() {
  console.log('\n--- 测试 6: P1-9 resolvePend default 未识别类型 console.warn 警告 ---');
  const sb = createFreshSandbox();
  const CP = sb.CP;

  CP.newGame();
  CP.state().pending = [{ type: 'mystery_alien_event_404', text: '外星事件' }];

  const res = CP.resolve();
  assert.strictEqual(res, '继续', '未识别类型出队返回「继续」');
  assert.strictEqual(CP.state().pending.length, 0, '未识别项顺利出队');

  const logs = sb._warnLogs;
  const hasWarn = logs.some(l => l.includes('[CP] 未处理的 pend 类型:') && l.includes('mystery_alien_event_404'));
  assert(hasWarn, '控制台必须打印明确的 [CP] 未处理的 pend 类型: mystery_alien_event_404 告警');

  console.log('✅ P1-9: resolvePend default 分支异常告警捕获断言通过！');
})();

// =============================================================
// 测试 7: P2-1 electionFinish 空值守卫安全校验
// =============================================================
(function testElectionFinishNullSafety() {
  console.log('\n--- 测试 7: P2-1 electionFinish 空状态 (!S || !S.election) 守卫 ---');
  const sb = createFreshSandbox();
  const CP = sb.CP;

  // 1) S.election 为 null 时的调用
  CP.newGame();
  CP.state().election = null;
  assert.doesNotThrow(() => {
    const res = CP.electionFinish();
    assert.strictEqual(res, null, 'S.election 为 null 时应安全返回 null');
  }, 'S.election 为 null 时绝不可抛 TypeError');

  // 2) S 为 null 时的调用 (已重置或未开始)
  CP.resetAll();
  assert.doesNotThrow(() => {
    const res = CP.electionFinish();
    assert.strictEqual(res, null, 'S 为 null 时应安全返回 null');
  }, 'S 为 null 时绝不可抛 TypeError: Cannot read properties of null');

  console.log('✅ P2-1: electionFinish 空值防崩守卫断言通过！');
})();

// =============================================================
// 测试 8: P2-2 删除死代码 showResult(tier)
// =============================================================
(function testDeadCodeShowResultRemoval() {
  console.log('\n--- 测试 8: P2-2 删除死代码 showResult ---');
  const sb = createFreshSandbox();
  const CP = sb.CP;

  assert.strictEqual(typeof sb.showResult, 'undefined', '全局作用域中 showResult 死代码已被彻底删除');
  assert.strictEqual(typeof CP.showResult, 'undefined', 'CP 模块导出中严禁存在 showResult 冗余死代码');

  console.log('✅ P2-2: showResult 死代码清理断言通过！');
})();

// =============================================================
// 测试 9: P2-3 faceDuelStep 消除魔法数字 actionIdx === 4
// =============================================================
(function testFaceDuelStepMomUltCheck() {
  console.log('\n--- 测试 9: P2-3 faceDuelStep 消除魔法数字 actionIdx === 4 冲突 ---');
  const sb = createFreshSandbox();
  const CP = sb.CP;

  CP.newGame();
  CP.pendFace(1); // 开启第一阶段对决 (远房表嫂)
  const duel = CP.faceDuel();
  assert(duel, '面子对决必须已挂载');

  // 手动构建 5 张以上手牌，索引 4 (第 5 张) 是真实特长牌
  duel.momRage = 100; // 满怒气
  const fifthCard = { id: 'test_card_5', type: 'talent', name: '少年宫演讲', r: 3, cat: 'art', atkVal: 80, used: false };
  duel.hand = [
    { id: 'c1', type: 'talent', name: '卡1', r: 1, atkVal: 20, used: false },
    { id: 'c2', type: 'talent', name: '卡2', r: 1, atkVal: 20, used: false },
    { id: 'c3', type: 'talent', name: '卡3', r: 1, atkVal: 20, used: false },
    { id: 'c4', type: 'talent', name: '卡4', r: 1, atkVal: 20, used: false },
    fifthCard
  ];

  // 场景 A: 玩家点击手牌索引 4 (第 5 张牌)
  // 修复前：由于 actionIdx === 4 && duel.momRage >= 100，会被误识别为「老妈大招」并清空怒气！
  // 修复后：数字 4 严格指代手牌 4，老妈大招仅由 'mom' 或 'mom_ult' 触发
  CP.faceAction(4);
  assert.strictEqual(fifthCard.used, true, '点击索引 4 必须正确出战第 5 张特长牌');
  assert.strictEqual(duel.momRage, 100, '出战第 5 张牌时，老妈怒气严禁被误扣！仍应保持 100 满怒');

  // 场景 B: 显式出战老妈必杀 (传入 'mom' 或 'mom_ult')
  CP.faceAction('mom');
  assert(duel.lastAction && duel.lastAction.isMomUlt, '传入 mom 指令时，lastAction 必须记录 isMomUlt 为 true');
  const hasUltLog = duel.logs.some(l => l.includes('老妈必杀爆发'));
  assert(hasUltLog, '战斗日志必须记录老妈必杀爆发');

  console.log('✅ P2-3: faceDuelStep 消除数字 4 语义冲突，老妈必杀字符串指令断言通过！');
})();

// =============================================================
// 测试 10: P3-1 ageOf 回合 57 -> 58 平滑过渡断言
// =============================================================
(function testAgeOfSmoothTransition() {
  console.log('\n--- 测试 10: P3-1 ageOf 职场期转成家期 (Turn 57->58) 平滑过渡 ---');
  const sb = createFreshSandbox();
  const CP = sb.CP;

  CP.newGame();

  // 职场期最后几回合
  CP.state().turn = 55;
  assert.strictEqual(CP.info().age, 26, 'Turn 55 应为 26 岁');
  CP.state().turn = 56;
  assert.strictEqual(CP.info().age, 27, 'Turn 56 应为 27 岁');
  CP.state().turn = 57;
  assert.strictEqual(CP.info().age, 28, 'Turn 57 (职场终局) 应为 28 岁');

  // 成家立业第一回合 (Turn 58)
  // 修复前：30 + Math.floor((58-58)/2) = 30 岁，丢失了 29 岁！
  // 修复后：29 + Math.floor((58-58)/2) = 29 岁！
  CP.state().turn = 58;
  assert.strictEqual(CP.info().age, 29, 'Turn 58 (成家第一回合) 必须平滑承接为 29 岁，绝不可直接跳 30 岁！');

  CP.state().turn = 59;
  assert.strictEqual(CP.info().age, 29, 'Turn 59 每两回合长一岁，仍为 29 岁');

  CP.state().turn = 60;
  assert.strictEqual(CP.info().age, 30, 'Turn 60 步入 30 岁 (三十而立)');

  CP.state().turn = 62;
  assert.strictEqual(CP.info().age, 31, 'Turn 62 步入 31 岁');

  console.log('✅ P3-1: ageOf 28岁 -> 29岁 -> 30岁 平滑时钟过渡断言通过！');
})();

console.log('\n======================================================');
console.log('🎉🎉🎉 恭喜！全部 10 项核心审查缺陷修复深度验证 100% 顺利通过！');
console.log('======================================================\n');
