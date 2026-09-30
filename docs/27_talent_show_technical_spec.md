# 27. 特长才艺选秀 2.0 技术规范与架构设计 (Technical Specification)

> **对应版本**：v2.6.0+  
> **设计目标**：规范《中国式家长 H5》特长才艺选秀 2.0 的算法模型、评委偏好判定方程、Showtime 交互状态机、Encore 返场机制与测试断言。

---

## 一、 数据结构与状态模型

### 1.1 选秀事件挂载状态 (`m.type === 'show'`)
```typescript
interface TalentShowEvent {
  type: 'show';
  title: string;
  tier: number;               // 1: 幼儿园, 2: 小学, 3: 初中, 4: 高中
  rival: {
    name: string;
    talent: {
      id: string;
      n: string;
      r: number;
      icon: string;
      cat?: 'stem' | 'art' | 'witty' | 'phy';
      atk: number;
    };
  };
  judges: Array<{
    id: 'zhang' | 'mike' | 'li';
    name: string;
    icon: string;
    title: string;
    style: string;
    motto: string;
  }>;
}
```

### 1.2 选秀结算状态 (`m.type === 'showr'`)
```typescript
interface TalentShowResult {
  type: 'showr';
  tier: number;
  title: string;
  win: boolean;
  greenCount: number;         // 0 ~ 3
  lights: [boolean, boolean, boolean];
  showtimeScore: 'perfect' | 'good' | 'normal';
  encoreTriggered: boolean;   // 是否触发了绝活加演
  encoreSuccess: boolean;     // 绝活加演是否翻盘成功
  judgeQuotes: string[];
  danmaku: string[];
  mine: TalentItem;
  rival: RivalItem;
  gi: number;                 // 悟性奖励
  gf: number;                 // 面子变动
  body: string;
  opts: string[];
}
```

---

## 二、 核心算法与评委判定方程

### 2.1 基础胜率对比
设我方特长阶级为 $R_{\text{mine}}$，对手特长阶级为 $R_{\text{rival}}$，基础胜率基准：
$$P_{\text{base}} = \begin{cases}
0.75 + (R_{\text{mine}} - R_{\text{rival}}) \times 0.20 & (R_{\text{mine}} \ge R_{\text{rival}}) \\
0.25 - (R_{\text{rival}} - R_{\text{mine}}) \times 0.10 & (R_{\text{mine}} < R_{\text{rival}})
\end{cases}$$
$P_{\text{base}}$ 严格截断在区间 $[0.08, 0.95]$ 内。

### 2.2 Showtime 演出加成
设玩家在 Showtime 阶段的操作评级为 $S$：
$$\Delta P_{\text{showtime}} = \begin{cases}
+0.25 & (S = \text{perfect}) \\
+0.12 & (S = \text{good}) \\
0 & (S = \text{normal})
\end{cases}$$

### 2.3 评委个性化流派偏好加权
每个评委 $j \in \{\text{zhang}, \text{mike}, \text{li}\}$ 的亮灯概率：
$$P_j = \text{Clamp}(P_{\text{base}} + \Delta P_{\text{showtime}} + B_j(\text{cat}_{\text{mine}}, R_{\text{mine}}), 0.05, 0.98)$$

评委偏好矩阵 $B_j$ 规则：
1. **张教授 ($j = \text{zhang}$)**：
   $$B_{\text{zhang}} = (\text{cat} = \text{'stem'} ? 0.20 : 0) + (R \ge 3 ? 0.15 : 0) - (\text{cat} = \text{'witty'} ? 0.18 : 0)$$
2. **麦克老师 ($j = \text{mike}$)**：
   $$B_{\text{mike}} = ((\text{cat} \in \{\text{'art'}, \text{'witty'}, \text{'phy'}\}) ? 0.22 : 0) + (S = \text{perfect} ? 0.15 : 0) - (R \le 1 ? 0.10 : 0)$$
3. **李主任 ($j = \text{li}$)**：
   $$B_{\text{li}} = (R = 1 ? 0.15 : 0) + (\text{cat} = \text{'phy'} ? 0.12 : 0) + 0.10$$

### 2.4 绝活返场 (Encore) 翻盘判定
当且仅当前判定绿灯数 $\text{greenCount} \le 1$ 且玩家确认消耗 25 体力执行加演时：
$$P_{\text{encore}} = 0.50 + (\text{attrs.eq} / 200) + (S = \text{perfect} ? 0.15 : 0)$$
若掷骰命中，则随机选择一位灭灯的评委翻转为绿灯（$\text{lights}[k] = \text{true}$），$\text{greenCount} \leftarrow \text{greenCount} + 1$。
若此时 $\text{greenCount} \ge 2$，则胜负直接逆转为 $\text{win} = \text{true}$！

---

## 三、 生命周期与测试断言

1. **`talentShowPerform(chosenId, showtimeGrade, encoreChoice)`**：
   - 必须兼容老式无参数调用（默认 `showtimeGrade = 'normal'`, `encoreChoice = false`）；
   - 正确计算三评委偏好加成；
   - 正确结算悟性、面子与战报；
2. **测试断言要求**：
   - STEM 特长在张教授席位胜率显著提升；
   - Showtime Perfect 显著提升麦克老师亮灯率；
   - 绝活返场成功翻转灭灯；
   - 全系统 27 项既有单元测试与 5 代族谱模拟 100% 保持绿灯。
