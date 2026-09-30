# 25. 面子对决 2.0 技术规范与架构设计 (Technical Specification)

> **对应版本**：v2.5.0+  
> **设计目标**：规范《中国式家长 H5》面子对决 2.0 的状态机模型、数据结构扩展、伤害判定公式、UI/动效渲染协议及单元测试断言。

---

## 一、 状态机与数据结构模型 (`S.faceDuel`)

对决状态对象 `S.faceDuel` 升级为具备完整卡组、怒气、破防与羁绊的状态实体：

```typescript
interface FaceDuelState {
  n: number;                  // 场次索引 (0 ~ 3)
  round: number;              // 当前交锋轮次 (1 ~ 4)
  maxRound: number;           // 最大轮次 (4)
  myHp: number;               // 我方当前面子生命值 (0 ~ 400)
  maxMyHp: number;            // 我方面子上限 (400)
  momRage: number;            // 老妈怒气槽 (0 ~ 100)
  opp: {
    id: string;               // 对手唯一标识 ('wangyi' | 'fang' | 'liu' | 'chen')
    name: string;             // 对手姓名 (如 '王姨的学霸儿子')
    icon: string;             // 对手头像 ('🧑‍🎓' | '👦' | '👧' | '👶')
    style: string;            // 炫耀流派
    hp: number;               // 对手当前面子生命值
    maxHp: number;            // 对手面子生命值上限
    atk: number;              // 基础反击伤害 (35 ~ 55)
    tilt: number;             // 对手心理破防槽 (0 ~ 100)
    lines: string[];          // 炫耀台词库
    tiltLines: string[];      // 破防台词库
  };
  hand: DuelCard[];           // 玩家当前可选出招手牌 (3 ~ 4 张)
  activeSynergies: string[];  // 激活的特长羁绊标识集合
  logs: string[];             // 战斗公报文本流
  defending: boolean;         // 本轮是否处于谦虚防反状态
  finished: boolean;          // 对决是否已结束
  won: boolean;               // 我方是否获胜
  mvpTalent?: string;         // 本场 MVP 特长
  totalDamageDealt: number;   // 累计输出伤害
}

interface DuelCard {
  id: string;                 // 卡牌唯一标识 ('t_xxx' | 'tact_versal' | 'tact_defend' | 'mom_ult')
  type: 'talent' | 'tactic' | 'ult'; // 卡牌类型
  name: string;               // 显示名称
  icon: string;               // 卡牌图标
  atkVal: number;             // 基础战力或预估伤害
  category?: 'stem' | 'art' | 'phy' | 'witty' | 'general';
  desc: string;               // 战术描述
  sub: string;                // 副标题 / 战力数值说明
  synergy?: string;           // 触发的羁绊标签
}
```

---

## 二、 核心算法与伤害判定方程

### 2.1 玩家伤害输出公式
$$D_{\text{base}} = \begin{cases}
\text{RATK}[\text{Rank}] \times (0.95 + \text{Random}(0, 0.35)) & (\text{特长卡}) \\
35 + \frac{\text{IQ} + \text{EQ}}{8} + \text{Random}(0, 15) & (\text{凡尔赛冷嘲}) \\
25 + \text{Random}(5, 15) & (\text{谦虚防反}) \\
120 + \text{Random}(20, 40) & (\text{老妈大招})
\end{cases}$$

### 2.2 羁绊加成与破防加成
$$\text{Damage}_{\text{final}} = D_{\text{base}} \times (1 + \text{Bonus}_{\text{synergy}}) \times (1 + \text{Bonus}_{\text{tilt}})$$
- $\text{Bonus}_{\text{synergy}}$：若触发 `SYNERGY_STEM` 加成 $+35\%$，若触发 `SYNERGY_ART` 加成 $+30\%$；
- $\text{Bonus}_{\text{tilt}}$：若对手处于当场破防状态（$\text{tilt} \ge 100\%$），伤害额外加成 $+30\%$。

### 2.3 对手破防槽增量公式
$$\Delta \text{Tilt} = \text{Round}\left(\frac{\text{Damage}_{\text{final}}}{8}\right) + (\text{isSynergy} ? 25 : 0) + (\text{isDefended} ? 20 : 0)$$

### 2.4 对手反击减伤与瘫痪判定
- 若对手 $\text{Tilt} \ge 100\%$：
  - 对手处于【当场石化/语无伦次】状态，$\text{Damage}_{\text{opp}} = 0$；
  - 破防槽重置回 $0\%$。
- 若我方处于【谦虚防反】状态：
  - $\text{Damage}_{\text{opp}} = \text{Round}(\text{Damage}_{\text{opp}} \times 0.35)$；
  - 我方回复面子 $+35$ 点，老妈怒气 $+25\%$。

---

## 三、 接口与事件生命周期协议

### 3.1 对决入口：`pendFace(n)`
1. 获取对手档案（`D.rivals[n % 4]`）；
2. 检索玩家特长库，按战力排序筛选前 3 张，与通用战术牌组合成 4 张手牌；
3. 识别当前特长库中的两两羁绊；
4. 构造完整对决状态推入 `S.pending` 队列。

### 3.2 对决出招：`faceDuelStep(cardIdx)`
1. 读取所选手牌并结算伤害与破防；
2. 触发动效与伤害跳字渲染；
3. 检查对手是否濒危（$\text{opp.hp} \le 0$）；
4. 执行对手反击或破防瘫痪判定；
5. 更新老妈怒气值；
6. 检查终局轮次，若结束则调用战报结算卡片。

### 3.3 结算卡片：`renderFaceDuelResult`
1. 呈现双方残余血量与对决胜负大徽章；
2. 呈现 MVP 特长牌及羁绊光环；
3. 呈现老妈与亲戚的退场台词相声对话；
4. 确认按钮绑定 `renderAll()`。

---

## 四、 兼容性与回归规范

1. **老存档兼容**：若读取未包含 `tilt` 或 `momRage` 的旧对决存档，在 `faceDuelStep` 时自动以默认值 $0$ 兜底自愈；
2. **测试断言要求**：
   - 必须通过特长手牌检录与羁绊触发验证；
   - 必须通过破防瘫痪与免伤跳回合断言；
   - 必须通过老妈大招蓄满与爆发判定；
   - `npm test` 27 项既有系统测试 100% 保持绿灯。
