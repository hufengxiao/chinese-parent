# 23. 过年收红包技术开发规范与排期评估文档 (Technical Spec & Roadmap)

> 对应玩法：第22章 过年收红包推拉对决 (Hongbao Duel)  
> 文档版本：v2.5.0  
> 状态：实施就绪 (Implementation Ready)

---

## 一、 系统架构与数据流图

```
 ┌────────────────────────────────────────────────────────┐
 │                      数据与事件层                       │
 │  nextTurn() (回合 7, 13, 21, 27, 35, 39)                │
 │         │                                              │
 │         ▼                                              │
 │  pendHongbao(t) ──> 生成带力学Profile的事件对象 pending │
 └─────────────────────────┬──────────────────────────────┘
                           │
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │                      表现与物理层                       │
 │  ui.js: renderHongbaoModal(p, m)                       │
 │    ├─ 物理动力学循环 (30fps / dt=33ms)                  │
 │    │    v = (v + F_drift + F_gust + Impulse) * D       │
 │    │    pos = clamp(pos + v * dt, 4, 96)               │
 │    ├─ 键盘/触控输入监听 (Space, ←, →, Touch)            │
 │    ├─ 倒计时器 (8.0s 递减, 最后 2.2s 冲刺警报)          │
 │    └─ 状态机与音效 (win, fail, pop, click)              │
 └─────────────────────────┬──────────────────────────────┘
                           │ 倒计时归零或决胜点击
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │                      结算与回归层                       │
 │  CP.resolve({ pos }) ──> 校验动态黄金区 [gMin, gMax]   │
 │         │                                              │
 │         ▼                                              │
 │  S.money, S.face, S.sat 结算 ──> Toast 与主界面全量刷新 │
 └────────────────────────────────────────────────────────┘
```

---

## 二、 物理引擎算法设计

### 2.1 运动学离散微积分方程
物理循环每隔 $\Delta t = 33\,\text{ms}$（约 30 FPS）执行一次状态演算，通过**双频正弦振荡波 + 向心弹簧回复力 + 极端边缘拦截反弹**构建真实的来回拔河跳动效果：

$$F_{\text{total}} = A_1 \sin(\omega_1 t) + A_2 \cos(\omega_2 t) + F_{\text{bias}} - k_{\text{spring}} (\text{pos} - \text{center}) + F_{\text{bounce}} + F_{\text{gust}}$$

$$v_{t+1} = \left(v_t + F_{\text{total}} \times 0.28 + I_{\text{player}}\right) \times D$$

$$\text{pos}_{t+1} = \text{clamp}\left(\text{pos}_t + v_{t+1} \times 0.48, \, 5, \, 95\right)$$

- $A_1 \sin(\omega_1 t) + A_2 \cos(\omega_2 t)$：长辈硬塞与老妈阻拦的复合周期波（周期 $2.0 \sim 2.6\,\text{s}$），使红包在不同区域之间自然来回荡漾；
- $-k_{\text{spring}}(\text{pos} - \text{center})$：向心弹簧回复力，偏离黄金中心越远反向力越强，防止滑入死角；
- $F_{\text{bounce}}$：极端边界防线反弹，当游标触及 $>82\%$ 或 $<18\%$ 时触发强烈回弹，确保绝不卡死；
- $I_{\text{player}}$：玩家点击施加的微冲量（$\pm 8.5\%$）；
- $D$：惯性阻尼系数（$0.90$）。

---

## 三、 接口与数据契约规范

### 3.1 事件对象数据模型 (`S.pending[i]`)
在 `js/core.js` 中生成的待决事件结构：

```typescript
interface HongbaoPendingEvent {
  type: 'hongbao_duel';
  title: string;
  rel: string;             // 亲戚称谓，如 '大姑妈'
  quote: string;           // 亲戚台词
  momQuote: string;        // 母亲推辞台词
  body: string;            // 事件剧情简述
  
  // 动力学配置
  driftForce: number;      // 基准偏置推力 (-2.0 ~ +2.0)
  goldenMin: number;       // 黄金区间左边界 (如 45)
  goldenMax: number;       // 黄金区间右边界 (如 69)
  startPos: number;        // 初始脱靶位置 (如 22)
  gustChance: number;      // 阵风触发概率 (0.35)
  gustPower: number;       // 阵风推力 (4.0)
  amountBase: number;      // 基础压岁钱基数
  difficulty: number;      // 年龄综合难度系数
}
```

### 3.2 结算调用契约 (`CP.resolve(arg)`)
- **常规调用**：`CP.resolve({ pos: number })`，传入当前结算时刻游标的位置；
- **快速跳过**：`CP.resolve({ pos: goldenCenter, skipped: true })`；
- **向下兼容**：若传入 `arg` 为数字索引（如旧版 `0, 1, 2`），则自动映射为预设典型位置，确保历史存档与旧测试 $100\%$ 兼容。

---

## 四、 工作量与风险评估 (Risk Assessment)

| 模块 / 风险点 | 严重级 | 影响面 | 防御对策 |
| :--- | :---: | :--- | :--- |
| **物理循环定时器泄露** | 高 | 界面切换或关闭模态框时，定时器仍在后台空转 | 严格在模态框挂载前清空 `hbTimer`，并重写 `finishHb` 确保无论何种分支退出均执行 `clearInterval`。 |
| **按键连点性能颠簸** | 中 | 玩家高频狂点空格或屏幕导致 DOM 频繁重绘 | 游标位移采用 GPU 加速的 `transform: translateX(...)` 或绝对定位轻量赋值，不触发布局 Reflow。 |
| **多分辨率与移动端溢出** | 中 | 手机竖屏下左右推拉按钮排版拥挤 | 采用 `flex` 弹性伸缩和针对 `@media (max-width: 600px)` 的触控高度优化。 |
| **测试套件回归破坏** | 高 | 现有 27 项自动化测试断言失效 | 保持 `CP.resolve()` 默认边界 fallback（无自定义区间时默认 38~68），确保旧测试全绿。 |

---

## 五、 四阶段开发排期与里程碑 (Roadmap & Schedule)

| 阶段 | 交付物与目标 | 核心文件 | 质量标准 |
| :--- | :--- | :--- | :--- |
| **Phase 1: 文档与标准建立 (本轮)** | 玩法设计文档 (`docs/22`) 与技术规范文档 (`docs/23`) 建立 | `docs/22_hongbao_minigame_design.md`<br>`docs/23_hongbao_technical_spec.md` | 原版机制对齐，参数公式闭环 |
| **Phase 2: 核心引擎与数据升级** | 亲戚性格矩阵、阶段难度计算、`core.js` 动态区间判定 | `js/core.js` | 单元测试数据兼容，无未定义属性 |
| **Phase 3: 物理微操与交互视听** | 30fps 阻尼运动学、双键微调、键盘监听、呼吸灯效与音效 | `js/ui.js`<br>`css/style.css` | 告别开局躺赢，操作流畅顺滑 |
| **Phase 4: 全量测试与集成回归** | 自动化测试用例扩展，27项系统测试 + 多代仿真回归 | `tests/test_new_gameplay.js` | 4 大测试套件 100% 绿灯 |
