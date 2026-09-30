# 29. 班干部竞选 2.0 技术规范与架构设计 (Technical Specification)

> **对应版本**：v2.6.0+  
> **设计目标**：规范《中国式家长 H5》班干部竞选 2.0 的三大选民阵营模型、选票转化分配方程、状态机契约、聘书结算卡片渲染与测试断言。

---

## 一、 数据结构与状态机模型 (`S.election`)

```typescript
interface ElectionState {
  round: number;              // 1 ~ 3
  maxRound: number;           // 3
  myVotes: number;            // 我方累计票数 (0 ~ 50)
  targetVotes: number;        // 过半当选门槛 (26)
  totalVotes: number;         // 全班总票数 (50)
  rival: {
    name: string;
    title: string;
    icon: string;
    motto: string;
    votes: number;
    favBloc: 'studious' | 'middle' | 'rowdy';
  };
  blocs: {
    studious: ElectionBloc;   // 学霸尖子圈 (15票)
    middle: ElectionBloc;     // 中立吃瓜群众 (20票)
    rowdy: ElectionBloc;      // 后排活跃圈 (15票)
  };
  logs: string[];
  finished: boolean;
  won: boolean;
}

interface ElectionBloc {
  name: string;
  icon: string;
  total: number;
  myVotes: number;
  rivalVotes: number;
  remaining: number;
}
```

---

## 二、 票仓转化分配算法方程

### 2.1 玩家策略得票分配方程
设玩家选择策略 $o \in \{0, 1, 2, 3\}$：
- **$o = 0$【亲民路线·倾听心声】**：
  $$\Delta V_{\text{middle}} = \text{Clamp}(\text{RI}(6, 9) + \lfloor\text{EQ} / 40\rfloor, 0, \text{blocs.middle.remaining})$$
  $$\Delta V_{\text{studious}} = \text{Clamp}(\text{RI}(2, 4), 0, \text{blocs.studious.remaining})$$
  $$\Delta V_{\text{rowdy}} = \text{Clamp}(\text{RI}(1, 3), 0, \text{blocs.rowdy.remaining})$$
- **$o = 1$【才艺绝活·技惊四座】**：
  $$\Delta V_{\text{middle}} = \text{Clamp}(\text{RI}(5, 8) + \text{Rank}_{\text{best}} \times 2, 0, \text{blocs.middle.remaining})$$
  $$\Delta V_{\text{rowdy}} = \text{Clamp}(\text{RI}(3, 5), 0, \text{blocs.rowdy.remaining})$$
  $$\Delta V_{\text{studious}} = \text{Clamp}(\text{RI}(1, 3), 0, \text{blocs.studious.remaining})$$
- **$o = 2$【零食许诺·请客公关】**（消耗 20 元）：
  $$\Delta V_{\text{rowdy}} = \text{Clamp}(\text{RI}(8, 12), 0, \text{blocs.rowdy.remaining})$$
  $$\Delta V_{\text{middle}} = \text{Clamp}(\text{RI}(2, 4), 0, \text{blocs.middle.remaining})$$
  $$\Delta V_{\text{studious}} = \text{Clamp}(\text{RI}(0, 1), 0, \text{blocs.studious.remaining})$$
- **$o = 3$【严谨施政·学业互助】**：
  $$\Delta V_{\text{studious}} = \text{Clamp}(\text{RI}(7, 10) + \lfloor\text{IQ} / 40\rfloor, 0, \text{blocs.studious.remaining})$$
  $$\Delta V_{\text{middle}} = \text{Clamp}(\text{RI}(2, 4), 0, \text{blocs.middle.remaining})$$
  $$\Delta V_{\text{rowdy}} = \text{Clamp}(\text{RI}(0, 1), 0, \text{blocs.rowdy.remaining})$$

### 2.2 对手反制得票分配方程
对手依据 `favBloc` 从对应圈子及中立圈拉票：
$$\Delta V_{\text{rival}} = \text{RI}(5, 10)$$
优先扣除其优势阵营的 `remaining` 票数，其次从中立圈扣除。

---

## 三、 终局状态与任命聘书卡片 (`electionr`)

当 `round > 3` 或任意一方票数 $\ge 26$ 时，进入结算：
1. `won = myVotes >= rival.votes`；
2. 若获胜：发放面子 $+60$、满意 $+15$、全员 NPC 好感度 $+8$；
3. 推入 `type: 'electionr'` 结算模态框，由 `renderElectionResultModal` 渲染带红章的正式任命聘书。

---

## 四、 兼容性与回归规范

1. **老存档兼容**：若读取未包含 `blocs` 的竞选状态，在 `doElection` 中自动补全初始化；
2. **测试断言要求**：
   - 零食公关对后排圈吸票能力断言；
   - 严谨施政对学霸圈吸票能力断言；
   - 竞选获胜正式生成任命聘书战报；
   - 保持 27 项系统测试与族谱模拟 100% 绿灯。
