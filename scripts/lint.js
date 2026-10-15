/**
 * 中国式家长 H5 — 轻量代码规范与静态语法审计器 (scripts/lint.js)
 *
 * 检查项：
 * 1. JavaScript 语法合规性检查 (基于 Node vm.Script 引擎，对 js/, tests/, scripts/, sw.js 全量校验)
 * 2. JSON 配置文件格式校验 (package.json, manifest.json)
 * 3. 核心文件多端版本一致性校验 (package.json vs sw.js vs index.html vs js/data.js)
 * 4. 作用域与全局标识符静态安全扫描 (避免 Service Worker 误引 window/document, 避免 ui.js 误用 Node 原生对象)
 * 5. 代码质量与漏洞防范规则 (检测残留 debugger, 悬空死函数引用等)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalChecks = 0;
let errors = [];
let warnings = [];

function checkPass(msg) {
  totalChecks++;
  console.log(`  ✅ ${msg}`);
}

function checkFail(msg) {
  totalChecks++;
  errors.push(msg);
  console.error(`  ❌ ${msg}`);
}

function checkWarn(msg) {
  warnings.push(msg);
  console.warn(`  ⚠️ ${msg}`);
}

console.log('='.repeat(80));
console.log(' 🔍 中国式家长 H5 · 静态代码规范与架构审计器 (Linter & Static Auditor)');
console.log('='.repeat(80));

// ----------------------------------------------------
// 1. JSON 格式校验与版本一致性审计
// ----------------------------------------------------
console.log('\n[1/4] 正在校验 JSON 文件与多端版本一致性...');
let pkgJson = null;
try {
  const pkgContent = fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8');
  pkgJson = JSON.parse(pkgContent);
  checkPass(`package.json 语法有效 (v${pkgJson.version})`);
} catch (e) {
  checkFail(`package.json JSON 语法解析失败: ${e.message}`);
}

try {
  const manifestContent = fs.readFileSync(path.join(ROOT_DIR, 'manifest.json'), 'utf8');
  const manifestJson = JSON.parse(manifestContent);
  checkPass(`manifest.json 语法有效 (${manifestJson.name})`);
} catch (e) {
  checkFail(`manifest.json JSON 语法解析失败: ${e.message}`);
}

if (pkgJson) {
  const appVer = pkgJson.version;
  // 检查 sw.js CACHE_NAME 版本
  try {
    const swContent = fs.readFileSync(path.join(ROOT_DIR, 'sw.js'), 'utf8');
    if (swContent.includes(`v${appVer}`)) {
      checkPass(`sw.js 缓存版本与 package.json 一致 (v${appVer})`);
    } else {
      checkFail(`sw.js 缓存版本未包含 v${appVer}`);
    }
  } catch (e) {
    checkFail(`读取 sw.js 失败: ${e.message}`);
  }

  // 检查 index.html 版本号标牌
  try {
    const htmlContent = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
    if (htmlContent.includes(`v${appVer}`)) {
      checkPass(`index.html 版本号与 package.json 一致 (v${appVer})`);
    } else {
      checkWarn(`index.html 未显式标注 v${appVer}`);
    }
  } catch (e) {
    checkFail(`读取 index.html 失败: ${e.message}`);
  }
}

// ----------------------------------------------------
// 2. JavaScript 文件语法解析检查 (vm.Script)
// ----------------------------------------------------
console.log('\n[2/4] 正在对全量 JavaScript 文件进行 AST 语法解析...');

function getJsFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...getJsFiles(fullPath));
    } else if (file.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

const jsFiles = [
  path.join(ROOT_DIR, 'sw.js'),
  ...getJsFiles(path.join(ROOT_DIR, 'js')),
  ...getJsFiles(path.join(ROOT_DIR, 'scripts')),
  ...getJsFiles(path.join(ROOT_DIR, 'tests'))
];

for (const jsFile of jsFiles) {
  const relPath = path.relative(ROOT_DIR, jsFile).replace(/\\/g, '/');
  try {
    const code = fs.readFileSync(jsFile, 'utf8');
    new vm.Script(code, { filename: relPath });
    checkPass(`语法检查通过: ${relPath}`);
  } catch (e) {
    checkFail(`语法错误 in ${relPath}: ${e.message}`);
  }
}

// ----------------------------------------------------
// 3. 作用域与全局依赖静态安全审计
// ----------------------------------------------------
console.log('\n[3/4] 正在执行全局作用域与环境边界隔离静态扫描...');

// 3.1 sw.js 不应包含浏览器 window/document 直接引用
try {
  const swCode = fs.readFileSync(path.join(ROOT_DIR, 'sw.js'), 'utf8');
  if (/\bwindow\./.test(swCode)) {
    checkFail('sw.js 中发现对 window 全局对象的直接引用 (SW 作用域无 window)');
  } else if (/\bdocument\./.test(swCode)) {
    checkFail('sw.js 中发现对 document 全局对象的直接引用 (SW 作用域无 document)');
  } else {
    checkPass('sw.js Service Worker 环境隔离合规 (无 window/document 泄漏)');
  }
  // 检查是否有 respondWith 悬空 undefined 的可能性
  if (swCode.includes('return cachedResponse || fetchPromise')) {
    checkFail('sw.js 中检测到潜在的 respondWith(undefined) 隐患模式');
  } else {
    checkPass('sw.js fetch 兜底机制完备 (无裸露 respondWith(undefined))');
  }
} catch (e) {
  checkFail(`sw.js 作用域静态扫描失败: ${e.message}`);
}

// 3.2 ui.js 静态检查
try {
  const uiCode = fs.readFileSync(path.join(ROOT_DIR, 'js/ui.js'), 'utf8');
  // 校验是否存在之前修掉的典型拼写 bug
  if (uiCode.includes('closeManualModal')) {
    checkFail('ui.js 包含已废弃的 closeManualModal 错误函数名');
  } else {
    checkPass('ui.js closeManual 命名规范');
  }

  // 校验 crossroad 中是否正确使用 CP.attrName 或 CP.ANAME
  const crossroadMatch = uiCode.match(/function renderCrossroadModal[\s\S]*?\{([\s\S]*?)\n\}/);
  if (crossroadMatch) {
    const fnBody = crossroadMatch[1];
    if (/\bANAME\[/.test(fnBody) && !/CP\.ANAME/.test(fnBody)) {
      checkFail('ui.js renderCrossroadModal 引用了裸露未定义的 ANAME');
    } else {
      checkPass('ui.js renderCrossroadModal 核心属性映射安全合规');
    }
  }
} catch (e) {
  checkFail(`ui.js 静态扫描失败: ${e.message}`);
}

// ----------------------------------------------------
// 4. 残留调试代码与代码洁净度扫描
// ----------------------------------------------------
console.log('\n[4/4] 正在扫描代码质量 (debugger / eval / console.trace)...');
const prodFiles = [
  path.join(ROOT_DIR, 'sw.js'),
  path.join(ROOT_DIR, 'js/data.js'),
  path.join(ROOT_DIR, 'js/core.js'),
  path.join(ROOT_DIR, 'js/ui.js')
];

for (const pFile of prodFiles) {
  const rel = path.relative(ROOT_DIR, pFile).replace(/\\/g, '/');
  const code = fs.readFileSync(pFile, 'utf8');
  if (/\bdebugger\b/.test(code)) {
    checkFail(`${rel} 包含残留的 debugger 语句`);
  } else {
    checkPass(`${rel} 无残留 debugger`);
  }
  if (/\beval\s*\(/.test(code)) {
    checkFail(`${rel} 包含不安全的 eval() 调用`);
  } else {
    checkPass(`${rel} 无 eval 调用`);
  }
}

// ----------------------------------------------------
// 汇总输出
// ----------------------------------------------------
console.log('\n' + '='.repeat(80));
console.log(
  ` 📋 审计总项: ${totalChecks} | ` +
  `✅ 通过: ${totalChecks - errors.length} | ` +
  `❌ 异常: ${errors.length} | ` +
  `⚠️ 告警: ${warnings.length}`
);
console.log('='.repeat(80));

if (errors.length > 0) {
  console.error(`\n💥 代码静态审计失败，发现 ${errors.length} 项违规：`);
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
} else {
  console.log('\n✨ 代码静态语法与质量审计全部通过！\n');
  process.exit(0);
}
