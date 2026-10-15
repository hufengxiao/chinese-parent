/**
 * 中国式家长 H5 — Service Worker 离线缓存与故障兜底专项测试套件 (P0-4)
 * 验证：
 * 1. 缓存命中即刻返回 (SWR 后台静默刷新)
 * 2. 缓存未命中时网络拉取并写入缓存
 * 3. 缓存未命中 + 离线断网时，导航请求 (navigate) 兜底为 index.html 缓存或 503 HTML Response
 * 4. 缓存未命中 + 离线断网时，资源请求兜底为 504 Response
 * 5. 任何情况下绝对不得向 respondWith 传入 undefined 或 resolve(undefined)
 * 6. 非 GET 或跨域请求不劫持
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('🚀 开始运行 Service Worker 离线缓存与故障兜底专项测试套件 (P0-4)...\n');

// 构造模拟 Response 类
class MockResponse {
  constructor(body = '', init = {}) {
    this.body = body;
    this.status = init.status != null ? init.status : 200;
    this.statusText = init.statusText || (this.status === 200 ? 'OK' : 'Error');
    this.headers = new Map(Object.entries(init.headers || {}));
    this.ok = this.status >= 200 && this.status < 300;
  }
  clone() {
    return new MockResponse(this.body, {
      status: this.status,
      statusText: this.statusText,
      headers: Object.fromEntries(this.headers.entries())
    });
  }
  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }
}

// 构造模拟 Request 类
class MockRequest {
  constructor(url, init = {}) {
    this.url = url;
    this.method = init.method || 'GET';
    this.mode = init.mode || 'cors';
    this.headers = init.headers || {};
  }
}

// 构造 SW 测试沙箱环境
function createSwSandbox(options = {}) {
  const origin = options.origin || 'https://chinese-parent.pages.dev';
  const eventListeners = {};
  const cacheStorageMap = new Map();

  class MockCache {
    constructor(name) {
      this.name = name;
      this.store = new Map();
    }
    async match(req, opts) {
      const url = typeof req === 'string' ? req : req.url;
      // 支持直接匹配或规范化匹配
      if (this.store.has(url)) return this.store.get(url).clone();
      for (const [key, val] of this.store.entries()) {
        if (key.endsWith(url) || url.endsWith(key)) return val.clone();
      }
      return null;
    }
    async put(req, res) {
      const url = typeof req === 'string' ? req : req.url;
      this.store.set(url, res.clone());
    }
    async delete(req) {
      const url = typeof req === 'string' ? req : req.url;
      return this.store.delete(url);
    }
  }

  const defaultCache = new MockCache('chinese-parent-v3.0.0');
  cacheStorageMap.set('chinese-parent-v3.0.0', defaultCache);

  const mockCaches = {
    async open(name) {
      if (!cacheStorageMap.has(name)) {
        cacheStorageMap.set(name, new MockCache(name));
      }
      return cacheStorageMap.get(name);
    },
    async match(req, opts) {
      return defaultCache.match(req, opts);
    },
    async keys() {
      return Array.from(cacheStorageMap.keys());
    },
    async delete(name) {
      return cacheStorageMap.delete(name);
    }
  };

  const sandbox = {
    console: console,
    Math: Math,
    Date: Date,
    JSON: JSON,
    URL: URL,
    Promise: Promise,
    Response: MockResponse,
    Request: MockRequest,
    location: { origin },
    caches: mockCaches,
    self: null,
    fetch: options.fetch || (async () => new MockResponse('ok', { status: 200 })),
    addEventListener(type, handler) {
      if (!eventListeners[type]) eventListeners[type] = [];
      eventListeners[type].push(handler);
    },
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve() },
    _cacheStore: defaultCache.store,
    _getListeners: () => eventListeners
  };
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  const swCode = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
  vm.runInContext(swCode, sandbox);

  return sandbox;
}

// 辅助方法：触发 fetch 事件
async function dispatchFetch(sandbox, request) {
  const listeners = sandbox._getListeners().fetch || [];
  let respondedPromise = null;
  let responded = false;

  const event = {
    request,
    respondWith(promise) {
      responded = true;
      respondedPromise = Promise.resolve(promise);
    },
    waitUntil(promise) {}
  };

  for (const fn of listeners) {
    fn(event);
  }

  if (!responded) return { responded: false, response: null };
  const response = await respondedPromise;
  return { responded: true, response };
}

(async function runTests() {
  // ----------------------------------------------------
  // 测试 1: 缓存命中立即返回 (SWR)
  // ----------------------------------------------------
  console.log('--- 测试 1: 缓存命中立即返回与后台静默网络拉取 (SWR) ---');
  let networkFetchCalled = false;
  const sb1 = createSwSandbox({
    fetch: async () => {
      networkFetchCalled = true;
      return new MockResponse('updated from net', { status: 200 });
    }
  });
  // 预置缓存
  const assetUrl = 'https://chinese-parent.pages.dev/css/style.css';
  sb1._cacheStore.set(assetUrl, new MockResponse('cached body', { status: 200 }));

  const req1 = new MockRequest(assetUrl);
  const res1 = await dispatchFetch(sb1, req1);

  assert(res1.responded, 'fetch 事件必须调用 respondWith');
  assert(res1.response instanceof MockResponse, '返回值必须是有效的 Response 实例');
  assert.strictEqual(res1.response.status, 200, '状态码应为 200');
  const text1 = await res1.response.text();
  assert.strictEqual(text1, 'cached body', '缓存命中应即刻返回缓存中的内容');
  // 稍作等待验证后台 SWR fetch 被触发
  await new Promise(r => setTimeout(r, 20));
  assert(networkFetchCalled, '缓存命中时后台应静默触发 fetch 刷新缓存');
  console.log('✅ 测试 1 通过: 缓存命中即刻返回，SWR 后台拉取正常！');

  // ----------------------------------------------------
  // 测试 2: 缓存未命中但网络成功 -> 返回网络响应并存入缓存
  // ----------------------------------------------------
  console.log('\n--- 测试 2: 缓存未命中时在线网络拉取并写入缓存 ---');
  const sb2 = createSwSandbox({
    fetch: async () => new MockResponse('fresh network data', { status: 200 })
  });
  const req2 = new MockRequest('https://chinese-parent.pages.dev/js/data.js');
  const res2 = await dispatchFetch(sb2, req2);

  assert(res2.responded, 'fetch 事件必须调用 respondWith');
  assert(res2.response instanceof MockResponse, '返回值必须是有效的 Response 实例');
  assert.strictEqual(res2.response.status, 200);
  const text2 = await res2.response.text();
  assert.strictEqual(text2, 'fresh network data');
  // 检查是否已存入缓存
  await new Promise(r => setTimeout(r, 20));
  assert(sb2._cacheStore.has('https://chinese-parent.pages.dev/js/data.js'), '成功请求必须被写入缓存');
  console.log('✅ 测试 2 通过: 缓存未命中在线拉取成功并入库！');

  // ----------------------------------------------------
  // 测试 3: 缓存未命中 + 离线断网 -> 导航请求兜底 (P0-4 核心)
  // ----------------------------------------------------
  console.log('\n--- 测试 3: 缓存未命中 + 离线断网时导航请求 (navigate) 兜底 ---');
  // 场景 3a: 缓存中有 index.html，优先回退到 index.html
  const sb3a = createSwSandbox({
    fetch: async () => { throw new Error('TypeError: Failed to fetch (Offline)'); }
  });
  sb3a._cacheStore.set('./index.html', new MockResponse('<!DOCTYPE html><html>Cached Index</html>', { status: 200 }));
  const req3a = new MockRequest('https://chinese-parent.pages.dev/about', { mode: 'navigate' });
  const res3a = await dispatchFetch(sb3a, req3a);

  assert(res3a.responded, '离线导航请求必须调用 respondWith');
  assert(res3a.response !== undefined, '绝对严禁向 respondWith 传入 undefined');
  assert(res3a.response instanceof MockResponse, '离线兜底必须返回有效 Response 实例');
  assert.strictEqual(res3a.response.status, 200, '应返回预缓存的 index.html');
  const text3a = await res3a.response.text();
  assert(text3a.includes('Cached Index'), '内容应来自预缓存的 index.html');
  console.log('✅ 测试 3a 通过: 离线且缓存未命中时，navigate 请求成功回退到 index.html 预缓存！');

  // 场景 3b: 极端情况 index.html 亦未命中缓存，必须返回 503 HTML Response，绝不返回 undefined
  const sb3b = createSwSandbox({
    fetch: async () => { throw new Error('TypeError: Failed to fetch (Offline)'); }
  });
  const req3b = new MockRequest('https://chinese-parent.pages.dev/play', { mode: 'navigate' });
  const res3b = await dispatchFetch(sb3b, req3b);

  assert(res3b.responded, '极端离线导航必须调用 respondWith');
  assert(res3b.response !== undefined, '极端离线绝严禁返回 undefined');
  assert(res3b.response instanceof MockResponse, '必须返回有效 Response 对象');
  assert.strictEqual(res3b.response.status, 503, '无预缓存兜底时应返回 503');
  const text3b = await res3b.response.text();
  assert(text3b.includes('离线'), '503 HTML 必须包含离线提示文本');
  console.log('✅ 测试 3b 通过: 极端离线无 index.html 缓存时返回 503 HTML 兜底，拒绝崩溃！');

  // ----------------------------------------------------
  // 测试 4: 缓存未命中 + 离线断网 -> 静态资源请求兜底 (504 Gateway Timeout)
  // ----------------------------------------------------
  console.log('\n--- 测试 4: 缓存未命中 + 离线断网时静态资源请求返回 504 兜底 ---');
  const sb4 = createSwSandbox({
    fetch: async () => { throw new Error('TypeError: Failed to fetch (Offline)'); }
  });
  const req4 = new MockRequest('https://chinese-parent.pages.dev/icon-unknown.png', { mode: 'no-cors' });
  const res4 = await dispatchFetch(sb4, req4);

  assert(res4.responded, '资源请求必须调用 respondWith');
  assert(res4.response !== undefined, '资源请求失败绝不得返回 undefined');
  assert(res4.response instanceof MockResponse, '必须返回有效 Response 实例');
  assert.strictEqual(res4.response.status, 504, '资源请求离线失败应返回 504 状态码');
  assert.strictEqual(res4.response.statusText, 'Gateway Timeout (Offline)', 'statusText 应标明离线超时');
  console.log('✅ 测试 4 通过: 资源请求离线返回规范 504 Response，有效消除 respondWith 异常！');

  // ----------------------------------------------------
  // 测试 5: 非 GET 请求与跨域请求不予劫持
  // ----------------------------------------------------
  console.log('\n--- 测试 5: 非 GET 请求与跨域请求免劫持验证 ---');
  const sb5 = createSwSandbox();
  const postReq = new MockRequest('https://chinese-parent.pages.dev/api/save', { method: 'POST' });
  const postRes = await dispatchFetch(sb5, postReq);
  assert(!postRes.responded, 'POST 请求不得由 SW fetch 劫持');

  const crossReq = new MockRequest('https://api.github.com/repos/hufengxiao/chinese-parent', { method: 'GET' });
  const crossRes = await dispatchFetch(sb5, crossReq);
  assert(!crossRes.responded, '跨域请求不得由本 SW 劫持');
  console.log('✅ 测试 5 通过: POST 与跨域请求均放行由浏览器默认处理！');

  console.log('\n======================================================');
  console.log('🎉🎉🎉 恭喜！Service Worker 离线与兜底测试全部 100% 顺利通过！');
  console.log('======================================================\n');
})();
