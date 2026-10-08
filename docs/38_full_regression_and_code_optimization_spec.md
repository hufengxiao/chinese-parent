# 《中国式家长》H5 版 — 全系统自动化测试与代码优化规范

> 文档编号：38  
> 版本：v3.0.0 系统强化版  
> 归属模块：质量保障体系 (QA) / 性能优化与回归验证  
> 状态：正式归档 (Approved)

---

## 一、质量保障与测试矩阵总览

为了保证纯原生 HTML5/JS 架构在无编译打包、全生命周期多代传承下的长期绝对稳定性，《中国式家长》H5 版建立了由 9 大无头自动化测试套件组成的立体质量回归体系：

```
                              【全系统自动化测试矩阵 (npm test)】
                                             │
      ┌──────────────────┬───────────────────┼───────────────────┬──────────────────┐
      ▼                  ▼                   ▼                   ▼                  ▼
[核心数值与玩法]    [全流程五代模拟]     [事件与题库合法性]    [日程排布与Toast]   [v2.7.0五大核心系统]
test_new_gameplay        sim.js             test_events       test_optimizations   test_v27_features
      │                  │                   │                   │                  │
      └──────────────────┼───────────────────┴───────────────────┴──────────────────┘
                         │
      ┌──────────────────┴───────────────────┬──────────────────┐
      ▼                                      ▼                  ▼
[面子对决 3.0 深度测试]                [班委竞选 3.0 深度测试] [特长选秀 3.0 深度测试]
test_face_duel_faithful            test_class_election    test_talent_show
                         │
                         ▼
        ★【v3.0.0 深度审计与防泄漏测试】★
            test_audit_and_optimizations
```

---

## 二、测试套件清单与验证维度

| 序号 | 测试脚本 | 测试重点与覆盖维度 |
|:---:|:---|:---|
| 1 | `test_new_gameplay.js` | 28 项核心机制深度断言：悟性打折、高考定档、相亲门槛、职业继承、脑洞层级、日程生命周期。 |
| 2 | `sim.js` | 5 代端到端闭环无头仿真：验证代际传承、天赋加成、门第跃迁、评级分布与家庭资产累计。 |
| 3 | `test_events.js` | 78 项全生命周期事件库结构、阶段覆盖率、正负收益数值合法性及容错断言。 |
| 4 | `test_optimizations.js` | 婴儿期排满多样性、小学动作退役、高压防崩溃调度、Toast 队列单次消费。 |
| 5 | `test_v27_features.js` | 4 大育儿风格、祖宅百宝阁配装、同窗校友人脉、脑洞 2.0 BFS 连锁、大学四向分流、10 代压力测试。 |
| 6 | `test_face_duel_faithful.js` | 五大经典亲戚数值、单场单次卡牌消耗、品阶特效（史诗削弱/传说降维）、破防石化跳过反击、MVP 结算。 |
| 7 | `test_class_election_faithful.js`| 三人同台赛马、三大指标长短板测定、5 轮演说博弈、针对揭短削弱、课桌弹幕、三道杠称号特长闭环。 |
| 8 | `test_talent_show_faithful.js` | 四大学段阶梯大赛、神童先行秀、三大表演风格、Showtime 卡点、照相机保底、绝活返场、金牌特长赋予。 |
| 9 | `test_audit_and_optimizations.js`| **30 代长程混沌压力测试**、模态定时器与事件监听防泄漏、异构老存档自愈、属性浮点数防御、WebAudio 节点断开。 |

---

## 三、30 代长程混沌压力测试规范

在 `test_audit_and_optimizations.js` 中，沙箱无头运行 30 代全生命周期模拟，跨度达到 $30 \times 60 = 1800$ 回合：
1. **纯整数约束断言**：
   六维属性（智商、情商、记忆、想象、体魄、魅力）、零花钱、面子、压力必须时刻保持为 `Number.isInteger(val)`，绝对防御由于百分比乘法或除法引入的小数。
2. **非负与无 NaN 约束**：
   任何运算结算后，属性绝不得出现 `NaN`、`null` 或未定义溢出。
3. **世代传承连续性**：
   每一代在第 60 回合结束必须稳健生成 `endgen` 待决项，并成功将家族图鉴特长与代际天赋递延至下一代。

---

## 四、模态生命周期与事件监听防泄漏规范

在 DOM 单页应用中，频繁切换的弹窗（面子对决、班委竞选、才艺选秀、收红包、更新日志）极易产生定时器和监听器泄漏。

### 1. 注册清理模式 (Registration Cleanup Pattern)
所有模态必须通过 `registerModalCleanup(fn)` 挂载本模态内部创建的异步资源：
```javascript
// ui.js 中的模态生命周期闭环
const activeModalCleanups = [];

function registerModalCleanup(fn) {
  if (typeof fn === 'function') activeModalCleanups.push(fn);
}

function clearActiveModalListeners() {
  if (hbTimer) { clearInterval(hbTimer); hbTimer = null; }
  if (hbKeyHandler) { window.removeEventListener('keydown', hbKeyHandler); hbKeyHandler = null; }
  while (activeModalCleanups.length > 0) {
    const fn = activeModalCleanups.pop();
    try { fn(); } catch(e) {}
  }
}
```

### 2. 异步时序短路拦截 (Safe Timeout Guard)
在包含连续异步动画的模态（如面子对决的受击与反击动画）中，必须使用 `safeTimeout` 包装器：
```javascript
const safeTimeout = (fn, delay) => {
  const t = setTimeout(() => {
    const curDuel = CP.faceDuel();
    const topPend = CP.pending()[0];
    // 若当前对决已被结算或顶部待决项已切换，直接短路放弃执行，防止覆写新模态
    if (!curDuel || !topPend || topPend.type !== 'face_duel') return;
    try { fn(); } catch(e) {}
  }, delay);
  duelTimers.push(t);
  return t;
};
```

---

## 五、WebAudio 音频图内存管理规范

WebAudio 的 `AudioContext` 在频繁触发音效（例如连击脑洞、快速推拉红包）时，若未主动释放节点，会在内部音频图中累积大量游离的 `GainNode` 与 `OscillatorNode`。

### 1. 节点生命周期释放闭环
```javascript
osc.connect(gain);
gain.connect(ctx.destination);

// 播放完毕事件触发时，立即断开图连接
osc.onended = () => {
  try {
    osc.disconnect();
    gain.disconnect();
  } catch(e) {}
};

osc.start();
osc.stop(ctx.currentTime + duration);
```

### 2. BGM 定时器防重入与音质防破音
- 每次启动 BGM 前必须执行 `stopBGM()` 清理旧定时器；
- 移动端切至后台或 AudioContext 处于 `suspended` 时，只在用户初次交互后静默恢复（`resume()`），不产生阻塞警告。
