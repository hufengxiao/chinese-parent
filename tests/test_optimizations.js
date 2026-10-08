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

console.log('--- 测试 1: 婴儿期开局自动排满多样性与去重复 ---');
CP.newGame();
assert.strictEqual(CP.state().turn, 1, '开局第1回合');
CP.autoFillSlots();
const s1 = CP.slots();
console.log('Turn 1 slots:', s1.map(x => x ? x.id : null));
assert.strictEqual(s1.every(Boolean), true, '6个槽位均已排满');
// 验证不全是翻身，也不全是睡大觉
const fanshenCount = s1.filter(x => x.id === 'fanshen').length;
const restCount = s1.filter(x => x.id === 'rest').length;
console.log(`fanshen count: ${fanshenCount}, rest count: ${restCount}`);
assert(fanshenCount < 6, '婴儿期自动排满绝不能全是翻身！');
assert(restCount < 6, '婴儿期有充足行动力时绝不能全是睡大觉！');
assert(fanshenCount <= 3, '婴儿期翻身至多排2-3次');
// 验证包含玩具或娱乐项目以平衡压力与属性
const playOrToy = s1.some(x => x.id === 'wanju' || x.id.startsWith('pl-'));
assert(playOrToy, '应包含玩具或娱乐项目');

console.log('--- 测试 2: 掌握新技能后，自动排满绝不倒退回翻身 ---');
// 模拟升到小学阶段 (回合 16)
CP.state().turn = 16;
// 研习小学课程：数学四则运算、语文背古诗、英语单词
CP.state().learnedCourses.push('ma-sze', 'cn-gushi', 'en-dan');
CP.clearSlots();
CP.autoFillSlots();
const s2 = CP.slots();
console.log('小学阶段 slots:', s2.map(x => x ? x.id : null));
const priFanshen = s2.filter(x => x.id === 'fanshen').length;
console.log(`小学阶段翻身出现次数: ${priFanshen}`);
assert.strictEqual(priFanshen, 0, '到了小学阶段，自动排满绝对不应该排入婴儿翻身！');
const priRest = s2.filter(x => x.id === 'rest').length;
assert(priRest < 4, '小学阶段充沛体力时不可滥排睡大觉');

console.log('--- 测试 3: 高压情境下自动排满的劳逸结合与防崩溃机制 ---');
CP.state().turn = 35; // 高中
CP.state().stress = 75; // 高压
CP.state().learnedCourses.push('g-gao-ma', 'g-gao-cn', 'g-gao-en');
CP.clearSlots();
CP.autoFillSlots();
const s3 = CP.slots();
console.log('高压高中 slots:', s3.map(x => x ? x.id : null));
// 高压下应主动排入减压娱乐或休息，但不应全部是睡大觉
const seniorRest = s3.filter(x => x.id === 'rest').length;
const seniorPlay = s3.filter(x => x.kind === 'play').length;
const seniorLearn = s3.filter(x => x.kind === 'learn').length;
console.log(`高压高中: 学习=${seniorLearn}, 娱乐=${seniorPlay}, 休息=${seniorRest}`);
assert(seniorPlay + seniorRest >= 2, '高压情境必须包含娱乐或休息降压');
assert(seniorRest < 6, '高压情境下绝不可全是睡大觉');
assert(seniorLearn > 0, '高压情境下仍需有计划推进高考冲刺学习');

console.log('--- 测试 4: Toast 队列与单次消费机制 ---');
CP.toast('测试提示信息 1');
CP.toast('测试提示信息 2');
const flushed1 = Array.from(CP.flushToasts());
assert.strictEqual(JSON.stringify(flushed1), JSON.stringify(['测试提示信息 1', '测试提示信息 2']), '第1次消费应获取所有新消息');

// 关键测试：当没有新消息时，后续操作不应重复获取老消息（彻底根治旧提示重复遮挡视线缺陷）
const flushed2 = Array.from(CP.flushToasts());
assert.strictEqual(flushed2.length, 0, '第2次消费（无新消息时）必须返回空数组！');

console.log('--- 测试 5: 漏洞修复与边界防御全面回归断言 ---');
// 1. 槽位0完全重置
store['cph_save_0'] = JSON.stringify({ gen: 99, turn: 50 });
store['cph_fam_0'] = JSON.stringify({ g: 99 });
CP.resetAll();
assert.strictEqual(store['cph_save_0'], undefined, 'resetAll必须彻底清除槽位0的遗留存档');
CP.restartLineage();
assert.strictEqual(store['cph_fam_0'], undefined, 'restartLineage必须彻底清除槽位0的家族传承');

// 2. resolvePend 未知类型安全跳过 (default fallback)
CP.newGame();
while (CP.pending().length) CP.resolve(0);
CP.state().pending.push({ type: 'unknown_future_event_type', opts: ['关闭'] });
assert.strictEqual(CP.pending().length, 1);
const pendRes = CP.resolve(0);
assert.strictEqual(pendRes, '继续', '未知pending类型应触发default保底优雅退出');
assert.strictEqual(CP.pending().length, 0, '未知pending类型应被正常shift出队列，严禁死锁卡死');

// 3. endTurn 必须返回 undefined (正常) 或 false (槽位未满)
CP.clearSlots();
assert.strictEqual(CP.endTurn(), false, '未满槽位应返回 false');
CP.autoFillSlots();
assert.strictEqual(CP.endTurn(), undefined, '排满槽位应正常执行且返回 undefined');

// 4. S=null 防御
CP.resetAll();
assert.strictEqual(CP.state(), null);
assert.doesNotThrow(() => {
  CP.addSlot({ kind: 'rest', id: 'rest' });
  CP.endTurn();
  CP.chat('summer');
  CP.gift('summer', 'perfume');
  CP.buy('bg-huanggang');
  CP.brain.rev(0);
  CP.brain.info();
}, 'S为null时各大核心API绝不可抛出未捕获TypeError异常');

console.log('所有新逻辑单元测试全部通过！');

