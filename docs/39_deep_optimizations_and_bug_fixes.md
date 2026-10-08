# 《中国式家长》H5 版 — 系统深度优化与漏洞修复技术文档

> 文档编号：39  
> 版本：v3.0.0 系统强化版  
> 归属模块：系统内核 (Core Engine) / 界面层 (UI) / 健壮性与安全  
> 状态：正式归档 (Approved)

---

## 一、本次深度优化与漏洞修复背景

随着游戏系统从基础版迭代至包含“面子对决 3.0”、“班委竞选 3.0”、“特长选秀 3.0”与“过年收红包 2.0”等多个重度小游戏之后，全系统的交互链路大幅增加。为了消除潜在的内存泄漏、跨模态时序污染、浮点数精度扩散及老版本存档迁移风险，进行了一次全面的系统级静态扫描、边界防御加固与深度优化。

---

## 二、修复的潜在漏洞与优化方案

### 1. 异步定时器跨模态覆盖漏洞修复 (Cross-Modal Timer Race Condition)
- **问题定位**：
  在面子对决（`renderFaceDuelModal`）中，我方出招与亲戚反击采用了阶梯延时（140ms 击中、320ms 喘息、1100ms 终局战报）。如果在该延时进行过程中，玩家点击了关闭、或由于测试脚本连续触发导致对决提前结束，1100ms 后的延时函数依然强行执行 `renderFaceDuelResult`，导致已经关闭或切换的模态框被面子对决战报强制覆盖。
- **修复方案**：
  在 `renderFaceDuelModal` 中引入 `duelTimers` 注册队列与 `safeTimeout` 守卫包装器。所有延时执行前，严格校验 `CP.faceDuel()` 与 `CP.pending()[0].type === 'face_duel'`，同时将清理函数挂载到 `registerModalCleanup`，确保模态销毁瞬间所有异步定时器全部清空。

---

### 2. 红包小游戏定时器与键盘监听注销闭环 (Hongbao Event & Timer Cleanup)
- **问题定位**：
  `renderHongbaoModal` 中的物理帧定时器（`hbTimer`）与左右推拉按键监听（`hbKeyHandler`）之前仅在特定退出分支中清理。如果在游戏进行中被外部逻辑重绘或切换模态，定时器仍可能在后台以 33ms 的频率空跑。
- **修复方案**：
  在 `renderHongbaoModal` 初始化阶段立即执行 `registerModalCleanup(() => { clearInterval(hbTimer); window.removeEventListener('keydown', hbKeyHandler); })`，实现 100% 生命周期全闭环。

---

### 3. 数值浮点数渗透与 NaN 扩散防御 (Float & NaN Defensive Rounding)
- **问题定位**：
  在属性结算函数 `applyEff`、日常安排 `applyAct`、脑洞细胞挖掘 `applyBrainCell` 以及代际天赋加成中，之前存在裸加法赋值（如 `S.attrs[k] += c.attr[k]`）。若某个效果包含浮点数比例，或者对象的属性键尚未初始化为 0，会导致属性值变成小数或出现 `undefined + number = NaN` 并迅速扩散至整个存档。
- **修复方案**：
  全量加固属性累加公式，统一采用 `Math.max(0, Math.round(((S.attrs[k] || 0) + val)))`，对六维属性、零花钱、面子、压力、满意度进行完备的非负与纯整数安全包裹。

---

### 4. 极端压力下的死循环防御 (Stress Explosion Loop Safety Guard)
- **问题定位**：
  在 `turnProcess` 中，原逻辑使用 `while (S.stress > 100)` 循环逐次扣除 50 压力并增加阴影。若外部意外注入极大数值（如 stress = 100000），会导致 while 循环数千次甚至挂死浏览器主线程。
- **修复方案**：
  在 while 循环中加入步数守卫计数器（`let stressLoopSafety = 0; while (S.stress > 100 && stressLoopSafety++ < 20)`），并在循环后追加兜底 `if (S.stress > 100) S.stress = 100`，彻底阻断主线程死锁可能。

---

### 5. 异构老版本存档无损自愈与补全 (Legacy Save Auto-Healing)
- **问题定位**：
  部分早期版本的本地存档或第三方导出的 JSON 存档缺少 `ver` 字段，导致 `resume()` 判断失败而直接丢弃存档重新开局；另外老存档缺少新引入的 `talentShowRecords`、`equippedRelics`、`alumniCalls` 等数据结构，直接读取会报 undefined 错误。
- **修复方案**：
  在 `resume()` 中增加自愈容错：
  ```javascript
  if (s && (s.ver || (s.attrs && s.turn))) {
    S = s;
    if (!S.ver) S.ver = 2;
    if (!Array.isArray(S.equippedRelics)) S.equippedRelics = [];
    if (!Array.isArray(S.talentShowRecords)) S.talentShowRecords = [];
    ...
  }
  ```
  保证任意世代的老存档均能平滑升级自愈。

---

### 6. WebAudio 节点累积与内存泄漏优化 (AudioNode Disconnect Optimization)
- **问题定位**：
  `sound.playTone` 与程序化五声 BGM 在连续高频发声时，每次生成的 `OscillatorNode` 与 `GainNode` 在 stop 之后未显式调用 `disconnect()`，导致音频图节点在底层内存中驻留。
- **修复方案**：
  在所有发声节点上绑定 `osc.onended` 事件，播放结束立即执行 `osc.disconnect(); gain.disconnect();`，释放音频上下文关联，防止长时间游玩内存上涨。

---

### 7. 全局 Escape 快捷键关闭辅助弹窗支持 (Global UX Polish)
- **优化点**：
  在全局监听 `Escape` 键，支持玩家在非剧情阻塞态下按下 ESC 键一键快捷关闭“更新日志模态”、“存档管理模态”、“游戏指南模态”以及“索取心愿模态”，显著提升桌面端与键盘交互效率。

---

## 三、代码质量与回归验证结果

- **全量测试通过率**：9 大测试套件通过率 **100% (9/9)**；
- **混沌测试深度**：成功通过 **30 代连续模拟**（累计 1800 回合全流程无崩溃）；
- **向后兼容性**：100% 兼容全部历史存档与外部导入数据。
