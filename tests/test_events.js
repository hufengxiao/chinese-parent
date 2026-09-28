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

const D = ctx.DATA;
const CP = ctx.CP;

console.log('--- 测试 1: 验证事件库规模与阶段覆盖率 ---');
assert(D.events.length >= 60, `事件总数应达到设计规划的60+，实际: ${D.events.length}`);
console.log(`事件总数: ${D.events.length}`);

const phases = ['baby', 'kinder', 'pri', 'junior', 'senior', 'college', 'work', 'home'];
const phaseCounts = {};
phases.forEach(ph => {
  const count = D.events.filter(e => (e.p || []).includes(ph)).length;
  phaseCounts[ph] = count;
  assert(count >= 5, `阶段 ${ph} 的事件储备数量过少 (${count} < 5)`);
});
console.log('各阶段事件数量分布:', phaseCounts);

console.log('--- 测试 2: 验证事件结构与数值字段合法性 ---');
const allowedKeys = new Set([
  'iq', 'eq', 'mem', 'img', 'phy', 'cha',
  'insight', 'act', 'money', 'face', 'sat', 'stress', 'shadow', 'exam'
]);

D.events.forEach(ev => {
  assert(ev.id && typeof ev.id === 'string', `事件缺少id: ${JSON.stringify(ev)}`);
  assert(ev.n && typeof ev.n === 'string', `事件缺少标题: ${ev.id}`);
  assert(ev.d && typeof ev.d === 'string', `事件缺少描述: ${ev.id}`);
  assert(Array.isArray(ev.p) && ev.p.length > 0, `事件缺少适用阶段: ${ev.id}`);

  if (ev.type === 'rand') {
    assert(ev.eff && typeof ev.eff === 'object', `随机事件缺少eff: ${ev.id}`);
    Object.keys(ev.eff).forEach(k => {
      assert(allowedKeys.has(k), `随机事件 ${ev.id} 包含未定义的属性/资源键: ${k}`);
      assert(typeof ev.eff[k] === 'number', `随机事件 ${ev.id} 的 ${k} 必须为数值`);
    });
  } else if (ev.type === 'choice') {
    assert(Array.isArray(ev.opts) && ev.opts.length >= 2, `抉择事件选项不足2个: ${ev.id}`);
    ev.opts.forEach((o, optIdx) => {
      assert(o.t && typeof o.t === 'string', `抉择事件 ${ev.id} 选项${optIdx}缺少文案`);
      if (o.e) {
        Object.keys(o.e).forEach(k => {
          assert(allowedKeys.has(k), `抉择事件 ${ev.id} 选项${optIdx} 包含未定义键: ${k}`);
          assert(typeof o.e[k] === 'number', `抉择事件 ${ev.id} 选项${optIdx} 的 ${k} 必须为数值`);
        });
      }
    });
  } else {
    throw new Error(`未知事件类型: ${ev.type} in ${ev.id}`);
  }
});

console.log('--- 测试 3: 模拟所有事件生效与数值结算容错 ---');
CP.newGame();
D.events.forEach(ev => {
  if (ev.type === 'rand') {
    // 模拟 applyEff
    CP.state().pending.push({ type: 'news', title: ev.n, body: ev.d, opts: ['好'] });
    CP.resolve(0);
  } else if (ev.type === 'choice') {
    ev.opts.forEach((o, idx) => {
      CP.state().pending.push({
        type: 'choice',
        title: ev.n,
        body: ev.d,
        opts: ev.opts.map(opt => ({ label: opt.t, eff: opt.e }))
      });
      CP.resolve(idx);
    });
  }
});

console.log('所有事件题库单元测试与结算模拟全部顺利通过！');
