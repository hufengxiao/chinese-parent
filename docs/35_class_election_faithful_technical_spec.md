# 35. 班委竞选 3.0 技术规范与架构设计 (Technical Specification)

> **对应版本**：v2.9.0+  
> **设计目标**：规范《中国式家长 H5》班委竞选 3.0 的数据模型、三人同台博弈引擎、三大指标方程、AI 行为树决策器、弹幕渲染器与聘书结算体系。

---

## 一、 数据结构与状态模型契约 (`S.election`)

```typescript
type MetricKey = 'teacher' | 'peer' | 'moral'; // 师生关系 | 群众基础 | 品德表率

interface Candidate {
  id: 'player' | 'rivalA' | 'rivalB';
  name: string;
  title: string;
  avatar: string;
  isPlayer: boolean;
  metrics: {
    teacher: number;  // 师生关系评估分 (0 ~ 100)
    peer: number;     // 群众基础评估分 (0 ~ 100)
    moral: number;    // 品德表率评估分 (0 ~ 100)
  };
  strength: MetricKey; // 优势长板
  weakness: MetricKey; // 劣势短板
  votes: number;       // 当前支持票数 (0 ~ 50)
  targetVotes: number; // 目标过半门槛 (26)
  status: 'normal' | 'targeted' | 'applauded' | 'booed';
}

interface ClassroomDesk {
  id: number;
  row: number;
  col: number;
  avatar: string;
  name: string;
  mood: 'happy' | 'clap' | 'doubt' | 'sleep' | 'neutral';
  bubble?: string;
}

interface Election3State {
  version: '3.0';
  round: number;          // 1 ~ 5
  maxRound: number;       // 5
  totalVotes: number;     // 50
  targetVotes: number;    // 26
  candidates: Candidate[];// 玩家、王小明、赵小刚
  desks: ClassroomDesk[]; // 课桌同学席位 (8~10名代表同学)
  logs: string[];         // 黑板报实时发言速记
  finished: boolean;
  rank: 1 | 2 | 3;        // 最终名次
  won: boolean;           // 是否第一名
  awardedTitle?: string;  // 获得的职位特长
}
```

---

## 二、 指标运算与票数转化分配方程

### 2.1 初始指标与优势/劣势生成方程
玩家初始评估：
$$\text{metric}_{\text{teacher}} = \text{Clamp}(20 + \lfloor\text{EQ} / 4\rfloor, 10, 80)$$
$$\text{metric}_{\text{peer}} = \text{Clamp}(20 + \lfloor\text{CHA} / 4\rfloor + (\text{S.money} > 30 ? 10 : 0), 10, 80)$$
$$\text{metric}_{\text{moral}} = \text{Clamp}(20 + \lfloor\text{IQ} / 4\rfloor + \text{Rank}_{\text{best}} \times 5, 10, 80)$$

比较三大指标：最高者为 $\text{strength}$，最低者为 $\text{weakness}$。

对手设定：
- **王小明**：$\text{strength} = \text{'moral'}$ (品德85), $\text{weakness} = \text{'peer'}$ (群众35), 师生60
- **赵小刚**：$\text{strength} = \text{'peer'}$ (群众85), $\text{weakness} = \text{'teacher'}$ (师生30), 品德45

### 2.2 玩家策略得票转化方程
每回合总票池 50 票根据三位候选人的相对吸引力重新分配：
设候选人 $i$ 在当前回合获得的策略加分 $\Delta S_i$：
- **自我宣传**：若宣传自身优势项，$\Delta S = 18 \times 1.4 = 25$；若宣传劣势项，$\Delta S = 8$ 且 $30\%$ 概率遭嘘；
- **亲近老师**：$\Delta \text{metric}_{\text{teacher}} = 15 + \lfloor\text{EQ}/30\rfloor$；
- **亲近群众**：消耗 20 元零钱，$\Delta \text{metric}_{\text{peer}} = 22$；若零钱不足，通过才艺/幽默转化 $+14$；
- **揭短抨击**：指定目标候选人 $j$（如领先的对手），针对其劣势项攻击：
  目标候选人 $\Delta \text{metric}_{\text{weakness}} = -20$，其得票流失 $3 \sim 6$ 票分流给我方和另一对手；若攻击失败（$20\%$ 概率被老师批评），我方扣 3 票。
- **暗中孤立 / 联合拉票**：削弱第一名群众支持度，分化摇摆票。

### 2.3 AI 对手决策行为树 (AI Behavioral Tree)
1. **领跑防守**：若自己是第一名且领先第二名 $> 5$ 票，优先执行【自我宣传】扩大优势；
2. **反扑围剿**：若自己不是第一名，且第一名候选人票数 $\ge 18$：
   - 有 $60\%$ 概率对第一名发动【揭短抨击】；
   - 有 $40\%$ 概率强化自身优势项吸票；
3. **针对劣势**：AI 揭短必然命中目标的劣势指标（王小明抨击赵小刚纪律差，赵小刚抨击王小明小报告）。

---

## 三、 教室全景渲染与弹幕触发机

### 3.1 弹幕气泡池 (Chatter Pool)
- **支持鼓掌类**：“太牛了！”、“我投你！”、“这必须支持！”、“听着很有道理！”
- **起哄吐槽类**：“哈哈又在吹牛了”、“老师在看着呢！”、“真的假的啊？”、“我怎么听说不是这样？”
- **零食诱惑类**：“有辣条我就投！”、“雪糕带我一个！”、“说话算话啊！”
- **揭短震惊类**：“卧槽居然抄作业？”、“抓现行了！”、“太刺激了吧！”

### 3.2 渲染流程
1. 顶部：绿色黑板 `el-blackboard-top`，展示标语、倒计时与粉笔粉刷特效；
2. 中部：三名候选人讲台台阶立牌，彩色血条式票数柱状图，标有【优势】/【劣势】徽章；
3. 下部：课桌排座 `el-classroom-desks`，随机 8 位同班同学动态表情与向上浮动漫画对话气泡；
4. 底部：策略操作手牌网格（自我宣传、亲近老师、发动群众、揭短攻击、真诚表态）。

---

## 四、 结算与特长奖励契约

在 `electionFinish()` 中：
- 第 1 名：`rank = 1, won = true`，面子 $+100$，悟性 $+300$，满意 $+25$，好感 $+12$，赋予特长 `el_leader` (威风凛凛一班之长)；
- 第 2 名：`rank = 2, won = false`，面子 $+50$，悟性 $+180$，满意 $+15$，好感 $+6$，赋予特长 `el_deputy` (班级得力臂膀)；
- 第 3 名：`rank = 3, won = false`，面子 $+20$，悟性 $+80$，体魄 $+20$，好感 $+3$，赋予特长 `el_labor` (包干区总管)。

---

## 五、 测试覆盖与向后兼容

1. **测试文件**：新建 `tests/test_class_election_faithful.js`；
2. **断言点**：
   - 三候选人模型、三大指标初值计算与优势/劣势判定；
   - 5 回合状态推进与得票过半提早终局机制；
   - 自我宣传优势加成与揭短攻击削弱；
   - AI 对手动态决策；
   - 三档职位任命结算、奖励发放与专属特长赋予；
3. **无损兼容**：如果遇到老存档旧版 `election`，在读取与初始化时自动自愈转入 3.0 模型。
