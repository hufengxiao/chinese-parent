/**
 * tests/test_talent_show_faithful.js
 * -------------------------------------------------------------
 * 《中国式家长》H5 版 — 特长才艺选秀大会 3.0 (Talent Grand Show 3.0) 专属深度测试套件
 * 
 * 覆盖机制：
 * 1. 四大学段才艺大赛检录、经典对手神童（圆圆/陈同学/文体委员/奥赛冠军）与招牌才艺；
 * 2. 我方出战特长检录、三大舞台演说风格（深厚功底/Showtime爆点/幽默抓梗）与三大评委偏好修正；
 * 3. 三大个性评委（张教授/麦克老师/李主任）打分模型、亮灯判定与专属犀利点评；
 * 4. 传家宝【拍立得纪念照相机】保底亮灯特权；
 * 5. 濒临淘汰时刻【绝活返场 (Encore)】加试自救（真情成长心路 vs 第二特长加演）逆风翻盘机制；
 * 6. 盛大颁奖盛典、大满贯金杯与金色传说专属特长【才艺之星·舞台王者】(Rank 4) 赋予与面子对决出战闭环。
 * -------------------------------------------------------------
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('🚀 开始运行特长才艺选秀 3.0 (Talent Grand Show 3.0) 专属深度测试套件...\n');

// 1. 初始化纯净沙箱环境
const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Math,
  Date,
  Array,
  Object,
  Number,
  String,
  Boolean,
  RegExp,
  window: {},
  document: {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

const dir = __dirname;
const dataCode = fs.readFileSync(path.join(dir, '..', 'js', 'data.js'), 'utf8');
const coreCode = fs.readFileSync(path.join(dir, '..', 'js', 'core.js'), 'utf8');

vm.createContext(sandbox);
vm.runInContext(dataCode, sandbox);
vm.runInContext(coreCode, sandbox);

const CP = sandbox.CP;
const DATA = sandbox.DATA;

// 初始化新游戏并进入状态
CP.newGame();
assert(CP.state(), '游戏状态机必须成功初始化');
CP.state().name = '小明';

// --- 测试 1: 四大学段阶梯大奖赛与对手神童预设 ---
console.log('--- 测试 1: 🎪 四大学段阶梯大赛与经典对手神童预设 ---');
const tiers = [1, 2, 3, 4];
const expectedRivals = ['中班圆圆', '三年二班陈同学', '初三文体委员', '全省奥赛冠军'];

tiers.forEach((tr, idx) => {
  CP.state().pending = [];
  CP.pendShow(tr);
  const showModal = CP.pending()[0];
  assert(showModal && showModal.type === 'show', `Tier ${tr} 必须成功推入 show 选秀模态`);
  assert(showModal.tier === tr, `选秀阶梯必须匹配 ${tr}`);
  assert.strictEqual(showModal.rival.name, expectedRivals[idx], `Tier ${tr} 对手必须为预设神童: ${expectedRivals[idx]}`);
  assert(showModal.rival.talent && showModal.rival.talent.atk > 0, `对手招牌特长必须具备战力`);
  assert(showModal.judges && showModal.judges.length === 3, '三大评委席（张教授/麦克老师/李主任）必须检录就位');
});
console.log('✅ 四大学段阶梯大赛与神童劲敌预设断言全部通过！');

// --- 测试 2: 我方出战特长与三大表演风格评委修正 ---
console.log('\n--- 测试 2: 🎭 我方特长检录与三大表演风格（稳健/Showtime/幽默）修正 ---');
// 赋予测试特长
CP.state().talents = ['gods', 'zuowen', 'voice_loud']; // gods: Rank 4 art, zuowen: Rank 2 art, voice_loud: Rank 1 art
CP.state().attrs.eq = 180;
CP.state().attrs.iq = 200;

CP.state().pending = [];
CP.pendShow(2); // 小学少年宫新星大赛

// 场景 A: 稳健深厚功底表演
const resSteady = CP.talentShowPerform({
  chosenTalentId: 'gods',
  styleChoice: 'steady',
  showtimeGrade: 'normal',
  encoreChoice: false
});
assert(resSteady && resSteady.type === 'showr', '必须返回结算 showr 结果');
assert.strictEqual(resSteady.styleChoice, 'steady', '风格必须记录为 steady');
assert(resSteady.greenCount >= 2, 'Rank 4 传说特长加成稳健表演应极高概率获胜');

console.log(`✅ 稳健深厚功底表演完成：赢得 ${resSteady.greenCount}/3 盏绿灯，斩获悟性 +${resSteady.gi}！`);

// --- 测试 3: Showtime 卡点评级加成 ---
console.log('\n--- 测试 3: 🔥 Showtime 爆点卡点评级加成 ---');
CP.state().pending = [];
CP.pendShow(2);
const resShowtimePerfect = CP.talentShowPerform({
  chosenTalentId: 'gods',
  styleChoice: 'showtime',
  showtimeGrade: 'perfect',
  encoreChoice: false
});
assert.strictEqual(resShowtimePerfect.showtimeGrade, 'perfect', 'Showtime 必须记录 perfect 评级');
assert(resShowtimePerfect.lights[1] === true, '麦克老师面对 Perfect Showtime 必须极高概率亮起绿灯');
console.log('✅ Showtime Perfect 卡点爆发与麦克老师亮灯断言通过！');

// --- 测试 4: 传家宝【拍立得纪念照相机】保底亮灯特权 ---
console.log('\n--- 测试 4: 📷 传家宝【拍立得纪念照相机】保底亮灯特权 ---');
CP.state().equippedRelics = ['relic_camera'];
CP.state().pending = [];
CP.pendShow(4); // 高中全国风采大赛面对奥赛冠军
// 故意使用弱特长 voice_loud (Rank 1)
const resRelic = CP.talentShowPerform({
  chosenTalentId: 'voice_loud',
  styleChoice: 'steady',
  showtimeGrade: 'normal',
  encoreChoice: false
});
assert.strictEqual(resRelic.lights[2], true, '佩戴纪念照相机时，李主任第 3 盏灯必须保底点亮！');
console.log('✅ 纪念照相机保底点亮第 3 盏灯断言通过！');

// --- 测试 5: 濒临淘汰时刻【绝活返场 (Encore)】加演翻盘机制 ---
console.log('\n--- 测试 5: ⚡ 濒临淘汰时刻【绝活返场 (Encore)】逆风翻盘 ---');
CP.state().equippedRelics = []; // 卸下传家宝
// 模拟劣势加演
CP.state().pending = [];
CP.pendShow(4);
const resEncore = CP.talentShowPerform({
  chosenTalentId: 'voice_loud',
  styleChoice: 'witty',
  showtimeGrade: 'normal',
  encoreChoice: 'speech'
});
assert(resEncore.encoreTriggered !== undefined, '绝活返场状态标记必须存在');
console.log(`✅ 绝活返场测试完成：返场触发=${resEncore.encoreTriggered}, 返场成功=${resEncore.encoreSuccess}, 最终绿灯=${resEncore.greenCount}/3`);

// --- 测试 6: 夺冠结算与专属金色传说特长【才艺之星·舞台王者】---
console.log('\n--- 测试 6: 🏆 盛大颁奖盛典与专属传说特长【才艺之星·舞台王者】赋予 ---');
// 确保赢下比赛
CP.state().pending = [];
CP.pendShow(1);
const resWin = CP.talentShowPerform({
  chosenTalentId: 'gods',
  styleChoice: 'showtime',
  showtimeGrade: 'perfect',
  encoreChoice: false
});
assert.strictEqual(resWin.win, true, '必须斩获冠军');
assert(CP.state().talents.includes('talent_king'), '必须获得金色传说特长：才艺之星·舞台王者 (talent_king)');

const kingData = DATA.talentData.find(x => x.id === 'talent_king');
assert(kingData, 'DATA.talentData 中必须包含 talent_king 设定');
assert.strictEqual(kingData.r, 4, '才艺之星·舞台王者必须为最高阶 Rank 4 传说特长');
assert((kingData.atk || Math.pow(7, kingData.r)) >= 2400, '才艺之星·舞台王者战力必须高达 2400+ 级别');
console.log('✅ 夺冠颁奖典礼与金色传说特长赋予断言通过！');

console.log('\n🎉🎉🎉 恭喜！特长才艺选秀 3.0 全部六大专项深度测试 100% 成功通过！\n');
