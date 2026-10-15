/**
 * 中国式家长 H5 — 统一测试运行器 (tests/run_all.js) (P0-5)
 *
 * 特性：
 * 1. 顺序执行全量测试套件
 * 2. 具备容错隔离机制：任一套件失败不中断后续套件执行，完整收集所有结果
 * 3. 统计各套件执行耗时 (ms)、退出码与状态 (PASS / FAIL)
 * 4. 汇总格式化输出整洁的结果公报看板
 * 5. 若有任一套件失败则聚合退出码为 1，全部通过退出码为 0
 * 6. 支持命令行参数过滤运行指定套件 (如 `node tests/run_all.js smoke`)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ALL_SUITES = [
  'tests/test_new_gameplay.js',
  'tests/sim.js',
  'tests/test_events.js',
  'tests/test_optimizations.js',
  'tests/test_v27_features.js',
  'tests/test_face_duel_faithful.js',
  'tests/test_class_election_faithful.js',
  'tests/test_talent_show_faithful.js',
  'tests/test_audit_and_optimizations.js',
  'tests/test_code_review_fixes.js',
  'tests/test_ui_security_audit.js',
  'tests/test_ui_smoke.js',
  'tests/test_sw_offline.js'
];

// 命令行过滤参数支持
const filterArg = process.argv[2] ? process.argv[2].toLowerCase() : null;
const suitesToRun = filterArg
  ? ALL_SUITES.filter(s => s.toLowerCase().includes(filterArg))
  : ALL_SUITES;

if (suitesToRun.length === 0) {
  console.error(`⚠️ 未找到匹配 "${filterArg}" 的测试套件！可选套件列表：\n${ALL_SUITES.map(s => '  - ' + s).join('\n')}`);
  process.exit(1);
}

console.log('='.repeat(80));
console.log(' 🎮 中国式家长 H5 · 统一自动化测试运行器 (Unified Test Runner)');
console.log(` 📋 待执行套件数: ${suitesToRun.length} 个`);
console.log('='.repeat(80));

const results = [];
const overallStartTime = Date.now();

for (let i = 0; i < suitesToRun.length; i++) {
  const suiteRel = suitesToRun[i];
  const suitePath = path.resolve(__dirname, '..', suiteRel);
  const suiteName = path.basename(suiteRel);
  const suiteIdx = i + 1;

  console.log(`\n[${suiteIdx}/${suitesToRun.length}] ▶ 正在执行: ${suiteRel} ...`);
  console.log('-'.repeat(80));

  if (!fs.existsSync(suitePath)) {
    console.error(`❌ 文件不存在: ${suitePath}`);
    results.push({
      rel: suiteRel,
      name: suiteName,
      status: 'FAIL',
      code: -1,
      duration: 0,
      error: `File not found: ${suiteRel}`
    });
    continue;
  }

  const startMs = Date.now();
  const spawnRes = spawnSync(process.execPath, [suitePath], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 50 * 1024 * 1024
  });
  const duration = Date.now() - startMs;

  if (spawnRes.stdout) {
    process.stdout.write(spawnRes.stdout);
  }
  if (spawnRes.stderr) {
    process.stderr.write(spawnRes.stderr);
  }

  const passed = spawnRes.status === 0;
  let errorSummary = '';
  if (!passed) {
    if (spawnRes.error) {
      errorSummary = spawnRes.error.message;
    } else if (spawnRes.stderr) {
      const errLines = spawnRes.stderr.trim().split('\n').filter(Boolean);
      errorSummary = errLines.slice(0, 3).join(' | ');
    } else {
      errorSummary = `Exited with code ${spawnRes.status}`;
    }
  }

  results.push({
    rel: suiteRel,
    name: suiteName,
    status: passed ? 'PASS' : 'FAIL',
    code: spawnRes.status !== null ? spawnRes.status : -1,
    duration,
    error: errorSummary
  });

  const statusLabel = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${suiteIdx}/${suitesToRun.length}] ${statusLabel} (${duration}ms) -> ${suiteRel}`);
}

const overallDuration = ((Date.now() - overallStartTime) / 1000).toFixed(2);
const passedCount = results.filter(r => r.status === 'PASS').length;
const failedCount = results.filter(r => r.status === 'FAIL').length;

// 格式化输出看板
console.log('\n\n' + '='.repeat(88));
console.log('                          📊 测试执行结果公报看板');
console.log('='.repeat(88));
console.log(
  ' #  ' +
  '测试套件 (Suite)'.padEnd(38) +
  '状态'.padEnd(10) +
  '耗时'.padEnd(12) +
  '退出码'.padEnd(10) +
  '说明'
);
console.log('-'.repeat(88));

results.forEach((r, idx) => {
  const numStr = String(idx + 1).padStart(2);
  const suiteStr = r.rel.padEnd(38);
  const statusStr = (r.status === 'PASS' ? 'PASS' : 'FAIL').padEnd(10);
  const durationStr = `${r.duration}ms`.padEnd(12);
  const codeStr = String(r.code).padEnd(10);
  const noteStr = r.status === 'PASS' ? 'OK' : (r.error || 'ERROR');
  console.log(` ${numStr}  ${suiteStr}${statusStr}${durationStr}${codeStr}${noteStr}`);
});

console.log('-'.repeat(88));
console.log(
  ` 总计: ${results.length} 套件 | ` +
  `✅ 通过: ${passedCount} | ` +
  `❌ 失败: ${failedCount} | ` +
  `⏱️ 总耗时: ${overallDuration}s`
);
console.log('='.repeat(88));

if (failedCount > 0) {
  console.error(`\n💥 有 ${failedCount} 个测试套件执行失败，请检查上方日志详情！`);
  process.exit(1);
} else {
  console.log(`\n🎉 恭喜！全部 ${passedCount} 个测试套件顺利 100% 通过！`);
  process.exit(0);
}
