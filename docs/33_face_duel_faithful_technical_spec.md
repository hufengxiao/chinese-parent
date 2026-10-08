# 33. 原版还原·面子对决系统技术规范与架构设计 (Faithful Technical Specification)

> **对应版本**：v2.8.0+  
> **设计目标**：规范《中国式家长 H5》原版面子对决系统的状态机架构、数据协议扩展、伤害判定公式、UI/动效渲染协议及单元测试断言。

---

## 一、 数据结构与状态机模型 (`S.faceDuel`)

对决核心状态实体 `FaceDuelState` 全面规范化，引入回合阶段、特长单次消耗集合与保底技能逻辑：

```typescript
interface FaithfulFaceDuelState {
  n: number;                  // 场次索引 (0 ~ 4，分别对应表嫂、二姨、二舅妈、周阿姨、大姑)
  round: number;              // 当前交锋轮次 (1 ~ 6)
  maxRound: number;           // 最大轮次 (默认为 6 轮)
  phase: 'opp_turn' | 'player_turn' | 'finished'; // 回合生命周期
  myHp: number;               // 我方当前面子生命值 (0 ~ 300)
  maxMyHp: number;            // 我方面子生命值上限 (动态绑定当前家庭面子, 默认 200~300)
  momRage: number;            // 老妈怒气槽 (0 ~ 100)
  opp: {
    id: string;               // 对手唯一标识 ('biaosao' | 'eryi' | 'erjiuma' | 'zhouayi' | 'dagu')
    name: string;             // 对手姓名 (如 '远房表嫂')
    icon: string;             // 对手头像 ('👩' | '👱‍♀️' | '👵' | '👩‍🦱' | '👵‍🦳')
    style: string;            // 炫耀流派 ('早教优越' | '才艺培训' | '学科奥数' | '综合素质' | '名校保送')
    hp: number;               // 对手当前面子生命值
    maxHp: number;            // 对手面子生命值上限 (60 / 90 / 130 / 180 / 240)
    atk: number;              // 基础攻击伤害 (18 ~ 65)
    tilt: number;             // 心理破防槽 (0 ~ 100)
    lines: string[];          // 挑衅炫耀台词库
    tiltLines: string[];      // 破防台词库
  };
  hand: DuelCard[];           // 玩家本场可出战特长卡池 (所有已解锁特长 + 保底技能)
  usedCardIds: string[];      // 已消耗特长卡 ID 集合 (本场不可重复使用)
  activeSynergies: string[];  // 激活的特长羁绊标识集合
  logs: string[];             // 战斗播报历史
  oppCurrentLine?: string;    // 当前回合亲戚挑衅台词
  momCurrentLine?: string;    // 当前回合老妈回怼台词
  paralyzed: boolean;         // 对手是否破防石化瘫痪
  oppWeaken: number;          // 对手受削弱的攻击力比例 (如 0.4)
  finished: boolean;          // 对决是否已结束
  won: boolean;               // 我方是否获胜
  mvpTalent?: string;         // 本场 MVP 特长
  mvpDamage: number;          // MVP 特长单次最高输出
  totalDamageDealt: number;   // 累计输出伤害
}

interface DuelCard {
  id: string;                 // 卡牌唯一标识 ('t_xxx' | 'tact_polite' | 'tact_versal' | 'tact_defend')
  type: 'talent' | 'tactic' | 'fallback' | 'ult'; // 卡牌类型
  name: string;               // 显示名称
  icon: string;               // 图标
  r?: number;                 // 品质等级 (1:普通, 2:稀有, 3:史诗, 4:传说)
  cat?: string;               // 类别 ('stem' | 'art' | 'phy' | 'witty' | 'general')
  atkVal: number;             // 基础战力或预估伤害
  effectType?: 'normal' | 'crit' | 'weaken' | 'pierce' | 'defend';
  desc: string;               // 战术描述
  sub: string;                // 副标题 / 战力数值说明
  used?: boolean;             // 是否已被消耗
}
```

---

## 二、 算法公式与战斗判定协议

### 2.1 亲戚先攻伤害公式
回合开始时亲戚率先发动炫耀挑衅：
$$D_{\text{opp}} = \text{Round}\left(\text{OppAtk} \times (0.85 + \text{Random}(0, 0.3))\right) \times (1 - \text{Weaken})$$
- 若上一回合我方触发了史诗特长削弱效果（$\text{Weaken} = 0.40$），亲戚本次伤害直接扣减 $40\%$；
- 对手造成的伤害将转化为老妈怒气：$\Delta \text{MomRage} = \text{Round}(D_{\text{opp}} \times 0.5) + 10$。

### 2.2 玩家特长输出与品阶特殊效果公式
玩家选定一张未消耗的特长卡出战：
$$D_{\text{base}} = \begin{cases}
\text{RATK}[r] \times (0.95 + \text{Random}(0, 0.3)) & (\text{特长卡, } r \in [1,4]) \\
12 + \text{Random}(0, 8) & (\text{保底【客套赔笑】}) \\
35 + \frac{\text{IQ} + \text{EQ}}{10} + \text{Random}(0, 15) & (\text{凡尔赛冷嘲}) \\
20 + \text{Random}(5, 12) & (\text{谦虚防反}) \\
120 + \text{Random}(20, 40) & (\text{老妈大招})
\end{cases}$$

**品阶特效判定**：
- **Rank 1 (普通)**：造成常规伤害；
- **Rank 2 (稀有)**：有 $35\%$ 概率触发【暴击】：$D_{\text{final}} = \text{Round}(D_{\text{base}} \times 1.5)$，并使对手破防槽额外 $+15\%$；
- **Rank 3 (史诗)**：必定附加【心理压制】：造成高额伤害的同时，标记 $\text{oppWeaken} = 0.40$（对手下轮攻击减免 $40\%$）；
- **Rank 4 (传说)**：必定触发【降维打击】：伤害浮动系数上调为 $1.2 \sim 1.4$ 倍，且必定额外增加对手破防槽 $+35\%$，无视对手减伤。

### 2.3 特长单场单次消耗逻辑 (Single-Use Protocol)
- 玩家出牌结算完毕后：
  $$\text{usedCardIds}.\text{push}(\text{card.id})$$
- 重新刷新手牌状态，将该卡牌置为 `used = true`；
- 检查玩家剩余可用的特长卡：若所有特长均处于 `used = true`，则自动向卡牌栏首位注入保底卡【客套赔笑】。

---

## 三、 五大阶段对手数据表 (`D.rivals`)

对齐原版 5 场对决阶段，更新 `D.rivals`：

```javascript
rivals: [
  {
    id: 'biaosao',
    n: '远房表嫂',
    icon: '👩',
    face: 60,
    atk: 20,
    stage: 'kinder',
    style: '早教优越',
    l: [
      '我家小宝刚报了全外教双语早教班！',
      '两岁就能听懂全英文指令，厉害吧？',
      '早教费一个月八千，为了孩子值了！'
    ],
    tiltLines: [
      '表嫂有些发懵：“现在的孩子……都这么厉害吗？”',
      '表嫂勉强挤出笑容：“双语班老师没教过这个……”',
      '表嫂拉着孩子借口换尿布红着脸离席！'
    ]
  },
  {
    id: 'eryi',
    n: '二姨',
    icon: '👱‍♀️',
    face: 90,
    atk: 28,
    stage: 'pri',
    style: '才艺培训',
    l: [
      '女孩子嘛，气质最重要，我家孩子芭蕾都三级了！',
      '每个周末都去市少年宫练形体，老师天天夸！',
      '下个月还要去省电视台录少儿春晚呢！'
    ],
    tiltLines: [
      '二姨擦了擦汗：“咳……芭蕾注重的是形体美……”',
      '二姨表情开始僵硬：“现在的考试也不光看这个……”',
      '二姨借口赶着去上舞蹈小课，灰溜溜带着孩子走了！'
    ]
  },
  {
    id: 'erjiuma',
    n: '二舅妈',
    icon: '👵',
    face: 130,
    atk: 38,
    stage: 'junior',
    style: '学科奥数',
    l: [
      '这次期中全市统考，我家天天又是全校前三！',
      '天天每天刷两套奥数压轴题，脑子特别灵光！',
      '重点初中的名师都说天天有清北苗子相！'
    ],
    tiltLines: [
      '二舅妈推了推眼镜：“这题……这题答案肯定印错了！”',
      '二舅妈手抖了抖：“光会死做题有什么用……”',
      '二舅妈脸色铁青，嘟囔着“炉子上还炖着鸡汤”悻悻离席！'
    ]
  },
  {
    id: 'zhouayi',
    n: '周阿姨',
    icon: '👩‍🦱',
    face: 180,
    atk: 50,
    stage: 'senior_early',
    style: '综合素质',
    l: [
      '钢琴十级早考过了，上周刚作为学生代表去省里汇报！',
      '不仅成绩是年级前茅，还是校学生会文艺部长！',
      '名校自主招生名额基本十拿九稳了！'
    ],
    tiltLines: [
      '周阿姨干笑两声：“现在的年轻后生……真是不得了……”',
      '周阿姨强作镇定：“人生的路长着呢，看后劲……”',
      '周阿姨借口接领导重要工作电话，匆忙离席！'
    ]
  },
  {
    id: 'dagu',
    n: '大姑',
    icon: '👵‍🦳',
    face: 240,
    atk: 65,
    stage: 'senior_late',
    style: '名校保送',
    l: [
      '听说隔壁谁家孩子还在苦读，我家孙子常青藤面试都过了！',
      '全额奖学金！直接保送本硕连读！全家族的荣耀！',
      '教育还是要看家族底蕴，普通人家可比不起！'
    ],
    tiltLines: [
      '大姑目瞪口呆，茶杯里的水洒了一裤子！',
      '大姑捂着心口：“这……这不可能！这绝对是瞎猫碰上死耗子！”',
      '大姑彻底面子扫地，一言不发瘫坐在沙发上摆手认输！'
    ]
  }
]
```

---

## 四、 触发回合与时间线设计

在人生 48 回合中，面子对决将在以下 5 个标志性时间点爆发：
- **Turn 12 (幼儿园后期，约5岁)**：迎战【远房表嫂】（早教对决）；
- **Turn 20 (小学中期，约9岁)**：迎战【二姨】（才艺与特长对决）；
- **Turn 28 (初中初期，约13岁)**：迎战【二舅妈】（学科与奥数对决）；
- **Turn 36 (高中初期，约16岁)**：迎战【周阿姨】（素质与特长综合对决）；
- **Turn 42 (高考冲刺前夕，约17.5岁)**：迎战【大姑】（终极家族荣誉对决）。

*注：若用户旧存档在 Turn 14、20、28、36 触发，保留向下兼容映射。*

---

## 五、 UI 交互与渲染还原协议

1. **原版风格战场布局**：
   - 顶部：双方头像、面子血条数值、百分比动态填充；
   - 战场对峙区：亲戚头顶挑衅气泡、老妈反击气泡、受击震颤动效；
   - 中间：老妈怒气槽、对手破防槽；
   - 底部：横向滚动的【特长技能卡栏】，每张卡包含：
     - 品质边框颜色：普通（绿）、稀有（蓝）、史诗（紫）、传说（金）；
     - 特长名称与战力数值；
     - 专属特效角标（如【暴击】、【减伤】、【降维】）；
     - 已使用状态覆盖【已出战】印章并变灰禁用；
2. **结算战报卡片**：
   - 呈现全场 MVP 特长与最高伤害；
   - 呈现亲戚退场相声台词；
   - 呈现面子暴增点数与向父母索取指引提示。
