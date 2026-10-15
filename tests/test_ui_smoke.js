/**
 * 中国式家长 H5 — UI 层冒烟测试套件 (tests/test_ui_smoke.js)
 * 验证：
 * 1. 在 DOM mock 环境下加载 data.js, core.js, ui.js 无任何语法或引用异常
 * 2. CPH 命名空间与 UI 核心对象完整挂载
 * 3. closeManual() 方法存在且能正常关闭攻略手册模态框 (#manual-modal)
 * 4. renderCrossroadModal 正常运行，CP.ANAME / CP.attrName 属性名称正常映射无 ReferenceError
 * 5. esc() XSS 防御函数转义规则完备
 * 6. UI.renderTop() 顶栏组件在正常与恶意输入下均能安全渲染
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('🚀 开始运行 UI 冒烟测试套件 (tests/test_ui_smoke.js)...\n');

// 1. 构建轻量且健壮的 DOM / Web API 沙箱
function createSmokeSandbox() {
  const elements = {};
  const docListeners = [];
  const winListeners = [];

  class MockAudioNode {
    connect() {}
    disconnect() {}
  }

  class MockAudioParam {
    setValueAtTime() {}
    exponentialRampToValueAtTime() {}
  }

  class MockAudioContext {
    constructor() {
      this.state = 'running';
      this.currentTime = 0;
      this.destination = new MockAudioNode();
    }
    createOscillator() {
      return {
        frequency: new MockAudioParam(),
        connect() {},
        disconnect() {},
        start() {},
        stop() {}
      };
    }
    createGain() {
      return {
        gain: new MockAudioParam(),
        connect() {},
        disconnect() {}
      };
    }
    suspend() { this.state = 'suspended'; }
    resume() { this.state = 'running'; }
  }

  function makeMockElement(tag, id = '', className = '') {
    const el = {
      tagName: tag.toUpperCase(),
      id: id,
      hidden: false,
      classList: {
        _classes: new Set(className ? className.split(' ').filter(Boolean) : []),
        add(...cls) { cls.forEach(c => this._classes.add(c)); },
        remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
        contains(c) { return this._classes.has(c); },
        toggle(c) {
          if (this._classes.has(c)) this._classes.delete(c);
          else this._classes.add(c);
        }
      },
      style: {},
      dataset: {},
      _children: [],
      _innerHTML: '',
      get children() { return this._children; },
      get innerHTML() {
        if (this._innerHTML) return this._innerHTML;
        if (this._children.length > 0) {
          return this._children.map(c => c.outerHTML || c.innerHTML).join('');
        }
        return '';
      },
      set innerHTML(val) {
        this._innerHTML = String(val);
        if (val === '') this._children = [];
      },
      get textContent() {
        return this._innerHTML.replace(/<[^>]*>/g, '');
      },
      set textContent(val) {
        this._innerHTML = String(val).replace(/[&<>"']/g, c => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
      },
      appendChild(child) {
        this._children.push(child);
        return child;
      },
      removeChild(child) {
        const i = this._children.indexOf(child);
        if (i >= 0) this._children.splice(i, 1);
        return child;
      },
      querySelector(sel) {
        if (sel === '.cr-select-btn') return { onclick: null };
        return null;
      },
      querySelectorAll() {
        return [];
      },
      addEventListener() {},
      removeEventListener() {}
    };
    return el;
  }

  const documentMock = {
    hidden: false,
    addEventListener(evt, fn) { docListeners.push({ evt, fn }); },
    removeEventListener(evt, fn) {
      const i = docListeners.findIndex(l => l.evt === evt && l.fn === fn);
      if (i >= 0) docListeners.splice(i, 1);
    },
    createElement(tag) { return makeMockElement(tag); },
    querySelector(sel) {
      if (!elements[sel]) {
        const idMatch = sel.match(/^#([\w-]+)$/);
        const id = idMatch ? idMatch[1] : '';
        elements[sel] = makeMockElement('div', id);
      }
      return elements[sel];
    },
    querySelectorAll(sel) {
      return [];
    }
  };

  const sandbox = {
    console: console,
    Math: Math,
    Date: Date,
    JSON: JSON,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    RegExp: RegExp,
    Set: Set,
    Map: Map,
    Promise: Promise,
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (t) => clearTimeout(t),
    setInterval: (fn, ms) => setInterval(fn, ms),
    clearInterval: (t) => clearInterval(t),
    AudioContext: MockAudioContext,
    document: documentMock,
    addEventListener(evt, fn) { winListeners.push({ evt, fn }); },
    removeEventListener(evt, fn) {
      const i = winListeners.findIndex(l => l.evt === evt && l.fn === fn);
      if (i >= 0) winListeners.splice(i, 1);
    },
    localStorage: {
      _store: {},
      getItem(k) { return this._store[k] !== undefined ? this._store[k] : null; },
      setItem(k, v) { this._store[k] = String(v); },
      removeItem(k) { delete this._store[k]; }
    }
  };

  sandbox.window = sandbox;
  sandbox.global = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);

  return { sandbox, elements };
}

// ----------------------------------------------------
// 测试 1: 脚本加载与无异常初始化
// ----------------------------------------------------
console.log('--- 测试 1: 加载 data.js, core.js, ui.js 冒烟验证 ---');
const { sandbox, elements } = createSmokeSandbox();

assert.doesNotThrow(() => {
  const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
  vm.runInContext(dataCode, sandbox);
}, 'data.js 必须无语法/执行错误');

assert.doesNotThrow(() => {
  const coreCode = fs.readFileSync(path.join(__dirname, '../js/core.js'), 'utf8');
  vm.runInContext(coreCode, sandbox);
}, 'core.js 必须无语法/执行错误');

assert.doesNotThrow(() => {
  const uiCode = fs.readFileSync(path.join(__dirname, '../js/ui.js'), 'utf8');
  vm.runInContext(uiCode, sandbox);
}, 'ui.js 必须无语法/执行错误');

assert(sandbox.CPH, 'window.CPH 必须挂载');
assert(sandbox.CPH.DATA, 'CPH.DATA 必须挂载');
assert(sandbox.CPH.CP, 'CPH.CP 必须挂载');
assert(sandbox.CPH.UI, 'CPH.UI 必须挂载');
console.log('✅ 测试 1 通过: data.js, core.js, ui.js 成功无报错加载并完成命名空间挂载！');

// ----------------------------------------------------
// 测试 2: 验证 closeManual 存在且能正确关闭手册
// ----------------------------------------------------
console.log('\n--- 测试 2: 验证 closeManual() 存在与手册模态框关闭 ---');
assert(typeof sandbox.closeManual === 'function', '全局必须导出 closeManual 函数');
assert(typeof sandbox.UI.closeManual === 'function', 'UI 命名空间必须导出 closeManual 函数');

const manualModal = sandbox.document.querySelector('#manual-modal');
manualModal.hidden = false;
manualModal.classList.remove('hidden');

sandbox.closeManual();

assert.strictEqual(manualModal.hidden, true, '#manual-modal.hidden 必须被置为 true');
assert(manualModal.classList.contains('hidden'), '#manual-modal classList 必须包含 "hidden"');
console.log('✅ 测试 2 通过: closeManual() 成功关闭手册模态框！');

// ----------------------------------------------------
// 测试 3: 验证 renderCrossroadModal 与 ANAME / attrName 映射 (P0-1)
// ----------------------------------------------------
console.log('\n--- 测试 3: 验证 renderCrossroadModal 与 ANAME/attrName 属性名称正常映射 ---');
sandbox.CP.newGame();

// 验证 CP 上存在 ANAME 或 attrName
assert(sandbox.CP.ANAME || typeof sandbox.CP.attrName === 'function', 'CP 必须导出 ANAME 或 attrName');

const crossroadModal = sandbox.document.querySelector('#crossroad-modal');
assert.doesNotThrow(() => {
  sandbox.UI.renderCrossroadModal({}, crossroadModal);
}, 'renderCrossroadModal 严禁抛出 ReferenceError: ANAME is not defined');

assert(crossroadModal.classList.contains('show'), '模态框必须添加 show 样式类');
const modalHtml = crossroadModal.innerHTML;
// 验证四向分支均被渲染
assert(modalHtml.includes('🎓 人生十字路口'), '必须包含人生十字路口标题');
assert(modalHtml.includes('核心属性'), '必须包含核心属性标签');
// 验证六维属性中文映射生效 (不是显示未翻译的英文 'iq', 'eq' 等)
assert(/智商|情商|记忆|想象|体魄|魅力/.test(modalHtml), '核心属性必须映射为中文汉字名称而非原始英文键');
console.log('✅ 测试 3 通过: renderCrossroadModal 顺利渲染，ANAME/attrName 属性中文映射正确！');

// ----------------------------------------------------
// 测试 4: 验证 Universal HTML Escaper esc() XSS 防御
// ----------------------------------------------------
console.log('\n--- 测试 4: 验证 esc() Universal HTML Escaper XSS 防御 ---');
const esc = sandbox.esc;
assert(typeof esc === 'function', 'esc 函数必须存在');

assert.strictEqual(esc(null), '', 'esc(null) 应返回空字符串');
assert.strictEqual(esc(undefined), '', 'esc(undefined) 应返回空字符串');
assert.strictEqual(esc(''), '', 'esc("") 应返回空字符串');
assert.strictEqual(esc(0), '0', 'esc(0) 应返回 "0"');
assert.strictEqual(esc(42), '42', 'esc(42) 应返回 "42"');

// 关键 XSS 向量测试
const xssPayload = '<script>alert("XSS & \'attack\'")</script>';
const escaped = esc(xssPayload);
assert(!escaped.includes('<'), '转义后不得包含原始 <');
assert(!escaped.includes('>'), '转义后不得包含原始 >');
assert(!escaped.includes('"'), '转义后不得包含原始 "');
assert(!escaped.includes("'"), "转义后不得包含原始 '");
assert.strictEqual(
  escaped,
  '&lt;script&gt;alert(&quot;XSS &amp; &#39;attack&#39;&quot;)&lt;/script&gt;',
  '必须转义为合规 HTML 实体'
);
console.log('✅ 测试 4 通过: esc() XSS 字符转义完备有效！');

// ----------------------------------------------------
// 测试 5: 验证 UI.renderTop 在正常与恶意输入下无崩溃
// ----------------------------------------------------
console.log('\n--- 测试 5: 验证 UI.renderTop 正常与边界渲染冒烟 ---');
assert.doesNotThrow(() => {
  sandbox.UI.renderTop();
}, '初始状态下 renderTop 必须无报错');

// 注入恶意姓名
sandbox.CP.state().name = '<img src=x onerror=stealCookie()>';
assert.doesNotThrow(() => {
  sandbox.UI.renderTop();
}, '恶意角色姓名下 renderTop 必须安全渲染且无报错');
const topGen = sandbox.document.querySelector('#top-gen');
assert(!topGen.innerHTML.includes('<img'), '顶栏严禁包含未转义的 <img> 注入');
console.log('✅ 测试 5 通过: UI.renderTop 冒烟渲染与注入防御全部正常！');

// 清理 WebAudio BGM 定时器，确保 Node 事件循环顺利退出
if (sandbox.sound && typeof sandbox.sound.stopBGM === 'function') {
  sandbox.sound.stopBGM();
}

console.log('\n======================================================');
console.log('🎉🎉🎉 恭喜！UI 冒烟测试套件全部 100% 顺利通过！');
console.log('======================================================\n');

process.exit(0);
