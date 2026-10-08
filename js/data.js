/* ============================================================
 * 中国式家长 H5 — 游戏数据 (Data)
 * 原创恶搞向内容。字段约定:
 *   attr: {iq智商 eq情商 mem记忆 img想象 phy体魄 cha魅力}
 *   eff : attr + {insight悟性 act行动 money钱 face面子 sat满意 stress压力
 *                 shadow心理阴影 exam考分加成 mood心态}
 *   tal : {id:特长id, p:概率(升到该级时判定)}
 * ============================================================ */
'use strict';
var DATA = {

/* ---------- 课程(学习) ---------- */
courses: [
  // 婴儿期
  {id:'fanshen', name:'翻身', icon:'🤸', phase:'baby',    attr:{phy:2},      stress:2, sat:3, ap:0, hint:'基础动作'},
  {id:'paxing',  name:'爬行',  icon:'🐿️', phase:'baby',  attr:{phy:1,img:1}, stress:2, sat:3, ap:0},
  {id:'shuohua', name:'学说话',icon:'🗣️', phase:'baby',  attr:{eq:2,iq:1},   stress:3, sat:3, ap:0},
  {id:'zoulu',   name:'学走路',icon:'🚶', phase:'baby',  attr:{phy:2},       stress:3, sat:2, ap:0},
  {id:'wanju',   name:'摆弄玩具',icon:'🧸', phase:'baby', attr:{img:2,iq:1}, stress:1, sat:0, ap:0},
  {id:'gushi',   name:'听妈妈讲故事',icon:'📖', phase:'baby', attr:{eq:2,img:1}, stress:1, sat:4, ap:0},

  // 幼儿园
  {id:'pinyin',  name:'拼音识字',icon:'🔤', phase:'kinder', attr:{mem:2,iq:1}, ex:'cn', stress:2, sat:2, ap:0},
  {id:'shuzi',   name:'数数 1~100',icon:'🔢', phase:'kinder', attr:{iq:2,mem:1}, ex:'ma', stress:2, sat:2, ap:0},
  {id:'ertong',  name:'儿歌练唱',icon:'🎵', phase:'kinder', attr:{img:2,eq:1}, ex:'ar', stress:1, sat:3, ap:0},
  {id:'tuya',    name:'涂鸦',icon:'🖍️', phase:'kinder', attr:{img:2}, stress:1, sat:2, ap:0, tal:{id:'tuyasha', p:.35}},
  {id:'tiyuk',   name:'幼儿园体育',icon:'🤸', phase:'kinder', attr:{phy:2}, ex:'pe', stress:3, sat:2, ap:0},
  {id:'legao',   name:'搭积木',icon:'🧱', phase:'kinder', attr:{img:2,iq:1}, stress:1, sat:2, ap:0},
  {id:'dianziqin',name:'电子琴',icon:'🎹', phase:'kinder', attr:{img:2,eq:1}, money:25, stress:4, sat:2, ap:0, tal:{id:'qintong', p:.4}},
  {id:'niyann',  name:'橡皮泥',icon:'🧈', phase:'kinder', attr:{img:2}, stress:2, sat:-1, ap:0, tal:{id:'niuba', p:.4}},

  // 小学
  {id:'cn-shizi', name:'语文·识字', icon:'📝', phase:'pri', attr:{mem:2,iq:1}, ex:'cn', stress:3, sat:2},
  {id:'cn-gushi', name:'语文·背古诗', icon:'🏮', phase:'pri', attr:{mem:2,eq:1}, ex:'cn', stress:3, sat:2, tal:{id:'gushiren', p:.12}},
  {id:'cn-riji',  name:'语文·写日记', icon:'✍️', phase:'pri', attr:{img:2,mem:1}, ex:'cn', stress:3, sat:2, tal:{id:'xiaozuojia', p:.1}},
  {id:'ma-sze',   name:'数学·四则运算', icon:'🔢', phase:'pri', attr:{iq:3}, ex:'ma', stress:3, sat:2},
  {id:'ma-ying',  name:'数学·应用题', icon:'📐', phase:'pri', attr:{iq:3,img:1}, ex:'ma', stress:4, sat:2},
  {id:'en-dan',   name:'英语·字母单词', icon:'🔤', phase:'pri', attr:{mem:3}, ex:'en', stress:3, sat:2, tal:{id:'danci', p:.12}},
  {id:'en-ouyu',  name:'英语·日常口语', icon:'💬', phase:'pri', attr:{mem:2,eq:1}, ex:'en', stress:3, sat:2},
  {id:'sc-ziran', name:'自然常识', icon:'🔭', phase:'pri', attr:{iq:2,img:1}, ex:'sc', stress:3, sat:2},
  {id:'pe-pri',   name:'体育课', icon:'🏃', phase:'pri', attr:{phy:3}, ex:'pe', stress:3, sat:3},
  {id:'art-pri',  name:'美术课', icon:'🎨', phase:'pri', attr:{img:3}, stress:3, sat:2, tal:{id:'xiaohuajia', p:.12}},
  {id:'diannao',  name:'电脑入门', icon:'👨‍💻', phase:'pri', attr:{iq:2,img:1}, stress:3, sat:-1, tal:{id:'chengxuyuan', p:.18}},
  {id:'wuxia',    name:'武侠小说', icon:'🗡️', phase:'pri', attr:{img:2,mem:1}, stress:2, sat:-2, tal:{id:'jianghu', p:.15}},

  // 初中
  {id:'cn-mingzhu', name:'语文·名著阅读', icon:'📚', phase:'junior', attr:{mem:3,img:1}, ex:'cn', stress:4, sat:2, tal:{id:'wenqing', p:.12}},
  {id:'cn-zuowen', name:'语文·作文进阶', icon:'🪶', phase:'junior', attr:{img:3,mem:1}, ex:'cn', stress:4, sat:2, tal:{id:'zuowen', p:.12}},
  {id:'ma-hanshu', name:'数学·代与函数', icon:'📈', phase:'junior', attr:{iq:4}, ex:'ma', stress:4, sat:2, tal:{id:'aoshu', p:.12}},
  {id:'ma-aoshu',  name:'数学·奥数入门', icon:'💡', phase:'junior', attr:{iq:4,img:1}, ex:'ma', stress:5, sat:2},
  {id:'en-gram',   name:'英语·语法',   icon:'📘', phase:'junior', attr:{mem:4}, ex:'en', stress:4, sat:2},
  {id:'en-tingli', name:'英语·听力',   icon:'🎧', phase:'junior', attr:{mem:3,eq:1}, ex:'en', stress:4, sat:2},
  {id:'sc-wuli',   name:'物理·入门',   icon:'⚡', phase:'junior', attr:{iq:4,mem:1}, ex:'sc', stress:4, sat:2, tal:{id:'wulidashi', p:.12}},
  {id:'sc-huax',   name:'化学·入门',   icon:'🧪', phase:'junior', attr:{iq:3,mem:2}, ex:'sc', stress:4, sat:2},
  {id:'sc-sheng',  name:'生物·常识',   icon:'🧬', phase:'junior', attr:{mem:4}, ex:'sc', stress:3, sat:2},
  {id:'so-ls',     name:'历史·故事',   icon:'🏛️', phase:'junior', attr:{mem:3,eq:1}, ex:'so', stress:3, sat:2, tal:{id:'shuo', p:.1}},
  {id:'so-dili',   name:'地理·中国',   icon:'🗺️', phase:'junior', attr:{mem:3,img:1}, ex:'so', stress:3, sat:2},
  {id:'t-zhongkao', name:'体育·中考训练', icon:'✊', phase:'junior', attr:{phy:4}, ex:'pe', stress:4, sat:2, tal:{id:'yundong', p:.1}},

  // 高中
  {id:'g-gao-cn',  name:'语文·高考冲刺', icon:'📖', phase:'senior', attr:{mem:4}, ex:'cn', stress:5, sat:2},
  {id:'g-gao-ma',  name:'数学·压轴专题', icon:'🧮', phase:'senior', attr:{iq:5}, ex:'ma', stress:6, sat:2, tal:{id:'jiazui', p:.1}},
  {id:'g-gao-en',  name:'英语·高考英语', icon:'🗽', phase:'senior', attr:{mem:5}, ex:'en', stress:5, sat:2},
  {id:'g-lizhi',   name:'理综·压轴',    icon:'🔬', phase:'senior', attr:{iq:5,mem:2}, ex:'sc', stress:6, sat:2},
  {id:'g-wenz',    name:'文综·史地政',  icon:'🏯', phase:'senior', attr:{mem:5,eq:1}, ex:'so', stress:5, sat:2},
  {id:'g-wusan',   name:'五年高考三年模拟', icon:'📕', phase:'senior', attr:{mem:1}, ex:'all', stress:6, sat:1, money:20},
  {id:'g-huanggang', name:'黄冈密卷(限量特供)', icon:'📗', phase:'senior', attr:{mem:1,iq:1}, ex:'all+', stress:7, sat:1, money:30, begOnly:true},
  {id:'g-yikao',   name:'艺考集训', icon:'🎭', phase:'senior', attr:{img:5,cha:1}, ex:'art', stress:5, sat:1, tal:{id:'yishujia', p:.12}},
  {id:'g-tiyu',    name:'体育·专项训练', icon:'🏋️', phase:'senior', attr:{phy:5}, ex:'pe', stress:6, sat:1, tal:{id:'yundong', p:.12}},
  {id:'g-wanxiu',  name:'晚自习·沉淀', icon:'🌙', phase:'senior', attr:{mem:2,eq:1}, stress:3, sat:2},

  // 大学
  {id:'u-gao',   name:'高等数学线代',icon:'🎓', phase:'college', attr:{iq:5,mem:2}, stress:3, sat:2},
  {id:'u-zhuan', name:'专业课·绩点大作战',icon:'📚', phase:'college', attr:{mem:4,iq:2}, stress:3, sat:2},
  {id:'u-art',   name:'创作·作品集',icon:'🎨', phase:'college', attr:{img:5,cha:1}, stress:3, sat:2},
  {id:'u-cs',    name:'计算机·算法与全栈',icon:'💻', phase:'college', attr:{iq:6,mem:3}, stress:4, sat:2, tal:{id:'chengxuyuan', p:.2}},
  {id:'u-med',   name:'医学·临床解剖实操',icon:'🩺', phase:'college', attr:{mem:6,phy:3}, stress:4, sat:2},
  {id:'u-fin',   name:'商科·量化金融与投行',icon:'💹', phase:'college', attr:{eq:6,cha:3}, stress:4, sat:2},
  {id:'u-film',  name:'传媒·视听语言与导演',icon:'🎬', phase:'college', attr:{img:6,cha:3}, stress:4, sat:2, tal:{id:'yishujia', p:.2}},
  {id:'u-eng',   name:'工科·理论力学与攻坚',icon:'⚙️', phase:'college', attr:{iq:6,phy:3}, stress:4, sat:2, tal:{id:'gongchengshi', p:.2}},
  {id:'u-paper', name:'学术论文与文献精读', icon:'📑', phase:'college', attr:{iq:8,mem:5}, stress:4, sat:3},
],

/* ---------- 娱乐 ---------- */
plays: [
  {id:'pl-che',    name:'玩具小车',      icon:'🚗', phase:'baby', attr:{img:1},   stress:-2, sat:-1},
  {id:'pl-maimai', name:'躲猫猫',       icon:'🙈', phase:'baby', attr:{phy:1},   stress:-2, sat:-1},
  {id:'pl-cartoon',name:'动画片',       icon:'📺', phase:'kinder', attr:{img:1},  stress:-3, sat:-2},
  {id:'pl-huat',   name:'滑梯',         icon:'🛝', phase:'kinder', attr:{phy:1},  stress:-2, sat:-1},
  {id:'pl-paopao', name:'吹泡泡',       icon:'🫧', phase:'kinder', attr:{img:1},  stress:-2, sat:-1},
  {id:'pl-lego',   name:'乐高积木',      icon:'🧩', phase:'pri', attr:{iq:1,img:1}, stress:-2, sat:-1},
  {id:'pl-janghu', name:'武侠小说',      icon:'🗡️', phase:'pri', attr:{img:1,mem:1}, stress:-2, sat:-1, tal:{id:'jianghu'}},
  {id:'pl-games',  name:'小霸王学习机',  icon:'🎮', phase:'pri', attr:{iq:1,img:1}, stress:-3, sat:-2, tal:{id:'games'}},
  {id:'pl-zx',     name:'追星',         icon:'🌟', phase:'junior', attr:{cha:2,eq:1}, stress:-3, sat:-2},
  {id:'pl-oju',    name:'偶像剧',       icon:'💕', phase:'junior', attr:{eq:1,cha:1}, stress:-3, sat:-2},
  {id:'pl-wang',   name:'网吧五连躺',    icon:'🖥️', phase:'junior', attr:{}, stress:-4, sat:-3},
  {id:'pl-lanq',   name:'球场单挑',      icon:'🏀', phase:'junior', attr:{phy:2}, stress:-3, sat:-1},
  {id:'pl-sleep',  name:'睡大觉',        icon:'😴', phase:'junior', attr:{}, stress:-5, sat:-2},
  {id:'pl-library',name:'泡图书馆',      icon:'🏛️', phase:'senior', attr:{mem:2}, stress:-2, sat:0},
  {id:'pl-shetuan',name:'学生社团',      icon:'🎪', phase:'senior', attr:{cha:2}, stress:-2, sat:-1},
  {id:'pl-ktv',    name:'KTV麦霸',      icon:'🎤', phase:'senior', attr:{cha:1,eq:1}, stress:-4, sat:-2, money:15},
  {id:'pl-bing',   name:'网吧通宵',      icon:'🌃', phase:'senior', attr:{}, stress:-2, sat:-2, money:20},
  {id:'pl-college',name:'社团出摊',      icon:'🎪', phase:'college', attr:{cha:1,eq:1}, stress:-2, sat:-1},
  {id:'pl-pao',    name:'夜跑撸铁',      icon:'🏃', phase:'college', attr:{phy:2}, stress:-2, sat:0},
  {id:'pl-lab',    name:'导师实验室攻坚',icon:'🔬', phase:'college', attr:{iq:4,mem:2}, stress:3, sat:2},
  {id:'pl-interview',name:'秋招群面模拟',icon:'👔', phase:'college', attr:{eq:3,cha:3}, stress:2, sat:1},
  {id:'pl-startup',name:'创客空间路演',  icon:'🚀', phase:'college', attr:{cha:4,eq:2}, stress:4, sat:1},
  {id:'pl-work-ot',   name:'赶项目KPI',      icon:'💻', phase:'work', attr:{iq:2,eq:1}, stress:3, sat:2},
  {id:'pl-work-fish', name:'带薪摸鱼',      icon:'☕', phase:'work', attr:{eq:1}, stress:-6, sat:-1},
  {id:'pl-work-cert', name:'考专业证书',    icon:'📜', phase:'work', attr:{iq:2,mem:2}, stress:2, sat:1},
  {id:'pl-work-banquet',name:'高端商务宴请', icon:'🍷', phase:'work', attr:{eq:2,cha:2}, stress:-2, sat:1, money:35},
],

/* 打工(初中起) */
payjobs: [
  {id:'pj-fly',  name:'发传单',        icon:'📄', phase:'junior',  money:30, stress:2, attr:{phy:1}},
  {id:'pj-tutor',name:'给低年级补课',  icon:'🧑‍🏫', phase:'junior',  money:45, stress:2, attr:{iq:1,eq:1}},
  {id:'pj-net',  name:'网吧夜班网管',  icon:'🖥️', phase:'junior',  money:35, stress:-1, attr:{}},
  {id:'pj-int',  name:'公司实习打杂',  icon:'💼', phase:'college', money:90, stress:3, attr:{eq:2}},
  {id:'pj-tech-int', name:'头部大厂技术实习', icon:'💻', phase:'college', money:140, stress:4, attr:{iq:3,eq:2}},
  {id:'pj-campus-lead', name:'校园合伙人地推', icon:'📣', phase:'college', money:120, stress:3, attr:{eq:2,cha:2}},
],

/* ---------- 特长(图鉴/价格=稀有度系数) ---------- r: 1普 2稀 3史 4传说, cat: art艺术/stem学科/witty趣味/phy体育 */
talentData: [
  {id:'tuyasha',     n:'小涂鸦师',   icon:'🖍️', r:1, cat:'art',   src:'涂鸦'},
  {id:'gushiren',    n:'古诗背篓',   icon:'🏮', r:1, cat:'art',   src:'背古诗'},
  {id:'danci',       n:'单词背篓',   icon:'🔤', r:1, cat:'stem',  src:'英语单词'},
  {id:'xiaozuojia',  n:'日记小作家',  icon:'✍️', r:1, cat:'art',   src:'写日记'},
  {id:'wulidashi',   n:'物理小咖',   icon:'⚡', r:1, cat:'stem',  src:'物理入门'},
  {id:'shuo',        n:'说书先生',   icon:'🏛️', r:1, cat:'art',   src:'历史故事'},
  {id:'jianghu',      n:'武侠迷',     icon:'🗡️', r:1, cat:'witty', src:'武侠小说'},
  {id:'qintong',     n:'琴童',       icon:'🎹', r:2, cat:'art',   src:'电子琴'},
  {id:'niuba',       n:'捏泥巴小当家',icon:'🧈', r:2, cat:'art',   src:'橡皮泥'},
  {id:'aoshu',       n:'奥数苗子',   icon:'💡', r:2, cat:'stem',  src:'代与函数·奥数'},
  {id:'wenqing',     n:'文青',       icon:'📚', r:2, cat:'art',   src:'名著阅读'},
  {id:'zuowen',      n:'写作小将',   icon:'🪶', r:2, cat:'art',   src:'作文进阶'},
  {id:'xiaohuajia',  n:'少儿画家',   icon:'🎨', r:2, cat:'art',   src:'美术课'},
  {id:'yishujia',    n:'艺术细胞',   icon:'🎭', r:2, cat:'art',   src:'艺考集训'},
  {id:'chengxuyuan', n:'代码初学者', icon:'💻', r:2, cat:'stem',  src:'电脑入门'},
  {id:'games',     n:'小霸王游戏王', icon:'👾', r:2, cat:'witty', src:'小霸王'},
  {id:'yundong',   n:'运动健儿',   icon:'🏃', r:2, cat:'phy',   src:'体育课'},
  {id:'jiazui',    n:'压轴题杀手', icon:'🧮', r:3, cat:'stem',  src:'数学压轴'},
  {id:'gongchengshi', n:'工程师之魂', icon:'⚙️', r:3, cat:'stem',  src:'理论力学与攻坚'},
  {id:'gods',       n:'五指琴魔',   icon:'🎹', r:4, cat:'art',   src:'钢琴十级'},
  {id:'nianshen',    n:'捏泥成神',   icon:'🧸', r:4, cat:'art',   src:'橡皮泥大师'},
  {id:'gaokao',      n:'状元苗子',   icon:'👑', r:4, cat:'stem',  src:'高考'},
],

/* ---------- 随机事件 ---------- props: phases 适用阶段数组 */
events: [
  // 原有经典事件
  {id:'ev-sick',  n:'拉肚子', d:'体育课跑完猛灌冰水,回家肚子咕噜咕噜。妈妈熬了黑乎乎的姜汤。\n"看你下次还敢不敢乱喝!"', type:'rand', p:['baby','kinder','pri'], eff:{phy:-1,eq:1,stress:-2}},
  {id:'ev-other', n:'别人家的孩子', d:'王阿姨来串门,全程直播她儿子又考了年级第一,你说董×π(×)。', type:'rand', p:['pri','junior','senior'], eff:{face:-8,stress:2,mem:1}},
  {id:'ev-beep',  n:'老爸的收音机', d:'爸爸的收音机放着评书,你坐着听了一下午,腿坐麻了。', type:'rand', p:['baby','kinder'], eff:{img:2,mem:1,stress:-2}},
  {id:'ev-pig',   n:'拾金不昧', d:'放学路上捡到 5 块钱,你交给了民警叔叔,收到表扬横幅(并没有)。', type:'rand', p:['pri','junior'], eff:{face:8,cha:2}},
  {id:'ev-cat',   n:'狗子和猫', d:'天桥上有人遛柴犬,你蹲着看了半小时,作业没写。', type:'rand', p:['kinder','pri'], eff:{img:2,eq:1,stress:-3, sat:-2}},
  {id:'ev-extra', n:'补习班试听', d:'妈妈给你报了个"快乐英语"试听课,你快乐地睡着了。', type:'choice', p:['pri','junior'], opts:[
    {t:'认真听讲', e:{mem:4,stress:3,sat:2}},
    {t:'低头做数学题', e:{iq:4,stress:3,sat:-1}},
    {t:'画小恐龙', e:{img:4,stress:-2,sat:-2}},
  ]},
  {id:'ev-renzao', n:'发卷子要签名', d:'数学卷子 62 分,老师让家长签字,你握着卷子手心发汗。', type:'choice', p:['pri','junior','senior'], opts:[
    {t:'如实坦白', e:{eq:3,stress:2,sat:2}},
    {t:'模仿家长签字', e:{img:3,face:-5,sat:-2}},
    {t:'说下周考试再签', e:{stress:5, sat:-3}},
  ]},
  {id:'ev-hongbao', n:'过年收红包', d:'大姨塞你红包,你爸妈疯狂推辞三连:"哎呀使不得使不得——"', type:'choice', p:['kinder','pri','junior','senior'], opts:[
    {t:'一起推辞(嘴甜)', e:{eq:3,face:5}},
    {t:'直接接过来', e:{money:60,face:-8, sat:-2}},
    {t:'等大人推完再收', e:{eq:2,money:40}},
  ]},
  {id:'ev-fight', n:'同学打架', d:'隔壁班俩同学为了一块橡皮在走廊打架,你在旁边吃瓜。', type:'choice', p:['pri','junior'], opts:[
    {t:'劝架', e:{eq:3,phy:-2,face:4}},
    {t:'报告老师', e:{eq:1,face:2,stress:1}},
    {t:'假装路过', e:{}},
  ]},
  {id:'ev-school', n:'选班干部', d:'班主任问谁想当劳动委员,你心动了一下。', type:'choice', p:['pri','junior'], opts:[
    {t:'举手自荐', e:{eq:4,cha:3,stress:2,face:8}},
    {t:'让大家选我', e:{eq:2,stress:2}},
    {t:'装看不见', e:{}},
  ]},
  {id:'ev-pet', n:'想养狗', d:'你朝爸妈疯狂暗示想养小狗,他们装作看不见。', type:'choice', p:['kinder','pri'], opts:[
    {t:'写保证书', e:{eq:2,img:2,face:2}},
    {t:'躺地上哭(误)', e:{eq:-3,stress:-3,sat:-3}},
    {t:'放弃', e:{}},
  ]},
  {id:'ev-wn', n:'晚自习走神', d:'晚自习的窗边,一只蝴蝶停在你课本上。', type:'rand', p:['senior'], eff:{img:4,stress:-2,mem:-2}},
  {id:'ev-gk', n:'神秘学长', d:'高三学长把笔记本借给你,扉页写着: "别慌,世界很大。"', type:'rand', p:['senior'], eff:{stress:-5,eq:4}},
  {id:'ev-soft', n:'班主任谈心', d:'班主任拍了拍你的肩:"最近压力不小吧,喝口热水。"', type:'rand', p:['senior','junior'], eff:{stress:-4,eq:3}},
  {id:'ev-bad', n:'被冤枉', d:'班里丢了东西,有人怀疑是你——你气到睡不着。', type:'choice', p:['junior','senior'], opts:[
    {t:'冷静摆证据', e:{eq:3,face:4,stress:2}},
    {t:'找老师澄清', e:{face:2,stress:1}},
    {t:'忍了', e:{stress:5, face:-3}},
  ]},
  {id:'ev-direction', n:'理想宣言', d:'老师让大家说说 30 年后的自己,你说:"我要做个快乐的大人。"', type:'rand', p:['senior','college'], eff:{cha:3,eq:3}},
  {id:'ev-qiu', n:'秋游钱的勇气', d:'学校春游,妈妈抠门说"下回再去",你抱大腿也没用,只好蹲门口看队伍出发。', type:'rand', p:['pri'], eff:{stress:3,img:2,face:-2}},

  /* ================= 婴儿期 (0-3岁) ================= */
  {id:'ev-baby-zhuazhou', n:'抓周大典', d:'满周岁亲戚围了一圈，面前摆着钢笔、算盘、玩具枪、存折和大葱。全家人屏息凝神看你伸手！', type:'choice', p:['baby'], opts:[
    {t:'抓起英雄钢笔', e:{iq:3,mem:2,face:4}},
    {t:'抓红灿灿的存折', e:{eq:3,money:20,face:3}},
    {t:'一把抱住大葱', e:{phy:4,img:2,sat:2}},
  ]},
  {id:'ev-baby-yimiao', n:'接种预防针', d:'社区卫生院阿姨拿出了锃亮的针筒，排在前面的几个小胖墩已经开始撕心裂肺地嚎啕大哭。', type:'choice', p:['baby'], opts:[
    {t:'坚决忍住不哭', e:{phy:3,face:5,stress:1}},
    {t:'跟着大家一起哇哇大哭', e:{eq:2,sat:3,stress:-2}},
    {t:'好奇盯着针筒流口水', e:{iq:3,img:2}},
  ]},
  {id:'ev-baby-baba', n:'开口第一声', d:'爸爸晃着拨浪鼓拼命引导：“叫爸爸！”，妈妈端着温牛奶温柔示意：“先叫妈妈！”。', type:'choice', p:['baby'], opts:[
    {t:'甜甜地喊“妈妈”', e:{eq:3,sat:4}},
    {t:'响亮地叫“爸爸”', e:{iq:2,money:15,face:2}},
    {t:'噗噜噜吐口水泡泡', e:{img:3,stress:-2}},
  ]},
  {id:'ev-baby-huhu', n:'辅食初体验', d:'妈妈把菠菜、南瓜和鳕鱼打成了深绿色的糊糊，声称是“全面补充微量元素的大师级配方”。', type:'rand', p:['baby'], eff:{phy:3,sat:3,stress:1}},
  {id:'ev-baby-dujia', n:'磨牙神功', d:'刚长出两颗乳牙，小嘴在崭新的实木茶几边缘狠狠啃了一圈，留下一排清晰的小牙印。', type:'choice', p:['baby'], opts:[
    {t:'扑进妈妈怀里卖萌', e:{eq:3,cha:2,sat:1}},
    {t:'假装不是自己咬的', e:{iq:3,stress:2}},
    {t:'哇地一声先哭为敬', e:{eq:2,stress:-2}},
  ]},
  {id:'ev-baby-koushao', n:'半夜嘘嘘曲', d:'深夜老爸睡眼惺忪给你把尿，口哨吹了十分钟，你毫无动静，他自己先憋不住跑去了洗手间。', type:'rand', p:['baby'], eff:{eq:2,img:2,stress:-2}},

  /* ================= 幼儿园 (3-6岁) ================= */
  {id:'ev-kin-wushui', n:'午睡装睡', d:'午休时间全班拉起小窗帘，保育员老师在走廊轻声巡视，你精神抖擞翻来覆去根本睡不着。', type:'choice', p:['kinder'], opts:[
    {t:'闭紧双眼一动不动装睡', e:{eq:3,stress:-2}},
    {t:'悄悄戳同桌的肉嘟嘟小脸', e:{eq:2,img:3,sat:-2}},
    {t:'举手报告想去上厕所', e:{iq:2,act:5,face:-2}},
  ]},
  {id:'ev-kin-pingguo', n:'分苹果风波', d:'老师洗了一大盆新鲜苹果分给大家，最顶上有一个红彤彤特别硕大的大苹果。', type:'choice', p:['kinder'], opts:[
    {t:'发扬孔融让梨挑选小的', e:{eq:4,face:5,sat:3}},
    {t:'眼疾手快抢下大红苹果', e:{phy:2,eq:-2,sat:-2}},
    {t:'礼貌把大苹果推给身边伙伴', e:{eq:3,cha:3,face:3}},
  ]},
  {id:'ev-kin-honghua', n:'小红花擂台', d:'墙上公布栏的小红花评比，你和小明并列第一，还差最后一朵就能摘得本月全勤标兵。', type:'choice', p:['kinder'], opts:[
    {t:'主动帮老师擦小椅子叠被子', e:{eq:3,insight:15,face:4}},
    {t:'上课积极举手大声抢答', e:{iq:3,mem:2,face:4}},
    {t:'从家里偷偷带五角星贴纸', e:{img:3,face:-6,stress:3}},
  ]},
  {id:'ev-kin-kaifang', n:'亲子才艺秀', d:'幼儿园开放日汇报演出，全班排练儿歌童谣，全场家长举着手机摄像机围在台下。', type:'choice', p:['kinder'], opts:[
    {t:'站在最前排卖力放声领唱', e:{cha:4,face:6,stress:2}},
    {t:'老老实实扮演安静的小蘑菇', e:{eq:3,stress:-3}},
    {t:'中途忘词朝台下老爸做鬼脸', e:{img:3,face:2,stress:-2}},
  ]},
  {id:'ev-kin-tiaoshi', n:'胡萝卜大作战', d:'午餐盘里盛了满满一勺炒胡萝卜丁，这是你从小到大最拒绝咽下去的“黑暗料理”。', type:'choice', p:['kinder'], opts:[
    {t:'趁老师转身悄悄塞给同桌', e:{iq:2,eq:3,sat:-1}},
    {t:'屏住呼吸一口吞下猛灌水', e:{phy:3,stress:2,sat:3}},
    {t:'把胡萝卜摆成小汽车造型慢慢吃', e:{img:4,stress:-1}},
  ]},
  {id:'ev-kin-jimu', n:'城堡保卫战', d:'你好不容易搭起了一座三层高的七彩乐高大城堡，隔壁班小霸王狂奔过来想要一脚踩塌。', type:'choice', p:['kinder'], opts:[
    {t:'张开双臂挺身而出英勇护城', e:{phy:4,face:4,stress:2}},
    {t:'拉住他邀请他一起搭建城门', e:{eq:4,cha:3}},
    {t:'大喊“老师救命”智取正义', e:{iq:3,stress:-2}},
  ]},

  /* ================= 小学期 (6-12岁) ================= */
  {id:'ev-pri-lingjin', n:'忘带红领巾', d:'周一清晨全校升旗仪式，站在校门口纠察队学长面前，你突然发现脖子上空空如也！', type:'choice', p:['pri'], opts:[
    {t:'飞奔去校门口小卖部买一条', e:{money:-5,iq:2,face:2}},
    {t:'向高年级熟人学长借备用领巾', e:{eq:4,stress:2}},
    {t:'缩紧脖子跟在大队伍后面硬闯', e:{img:3,face:-5,stress:4}},
  ]},
  {id:'ev-pri-shuihu', n:'水浒卡风云', d:'小浣熊干脆面风靡全校，只要集齐108将就能换绝版山地自行车！你攥着零钱直奔小卖部。', type:'choice', p:['pri'], opts:[
    {t:'一发入魂开出闪卡“豹子头林冲”', e:{face:8,money:-6,stress:-3}},
    {t:'与后排同学以卡换卡互通有无', e:{eq:4,iq:2}},
    {t:'专心捏碎干脆面撒调料粉吃面', e:{phy:2,money:-6,sat:-2}},
  ]},
  {id:'ev-pri-canbao', n:'蚕宝宝物语', d:'科学老师发了一盒白白胖胖的蚕宝宝，食量惊人，家门口小公园的桑树叶快被薅秃了。', type:'choice', p:['pri'], opts:[
    {t:'放学骑自行车远征寻觅桑树林', e:{phy:3,img:2,insight:15}},
    {t:'尝试喂莴笋叶观察反应', e:{iq:3,stress:2}},
    {t:'用奥特曼贴纸找同学换一包桑叶', e:{eq:4,money:-5}},
  ]},
  {id:'ev-pri-sanbaxian', n:'课桌三八线', d:'同桌用修正液在课桌正中间划下一道笔直的分界线，扬言“越界一毫米就没收铅笔”。', type:'choice', p:['pri'], opts:[
    {t:'严守规矩井水不犯河水', e:{eq:2,mem:2}},
    {t:'趁同桌不注意用胳膊肘越界挑衅', e:{phy:3,stress:3,sat:-2}},
    {t:'赠送半块香香橡皮握手言和', e:{eq:4,cha:3}},
  ]},
  {id:'ev-pri-dasaochu', n:'粉笔灰风暴', d:'放学大扫除，劳动委员指派你负责清洁黑板。你端着两块黑板擦在走廊窗边大力对拍！', type:'rand', p:['pri'], eff:{phy:2,img:2,sat:2,stress:-1}},
  {id:'ev-pri-tiaocao', n:'跳蚤市场摆摊', d:'少先队大队部组织校园跳蚤市场，你在水泥操场铺开塑料布，摆出旧玩具和连环画。', type:'choice', p:['pri'], opts:[
    {t:'扯开嗓子激情叫卖买二送一', e:{eq:4,money:25,face:3}},
    {t:'与隔壁摊位互通有无置换珍藏', e:{iq:3,img:3,money:10}},
    {t:'佛系静坐等待有缘人问价', e:{mem:2,money:5}},
  ]},
  {id:'ev-pri-wenju', n:'惊天动地一声响', d:'自习课教室安静得掉根针都听得见，你的双层大铁文具盒滑落桌面，“哐啷”震颤整层楼。', type:'rand', p:['pri'], eff:{face:-4,stress:3,phy:1}},
  {id:'ev-pri-xuegao', n:'冰箱光明大冰砖', d:'炎热夏日午后，老妈买了一整块家庭装光明冰砖雪糕藏在冷冻柜最底层。', type:'choice', p:['pri'], opts:[
    {t:'拿不锈钢汤匙偷偷刮去平整一层', e:{iq:3,stress:-2,sat:-1}},
    {t:'豪迈挖走一大半再用冷水浇平表面', e:{img:3,stress:3,sat:-3}},
    {t:'乖乖等待全家人晚饭后按份切分', e:{eq:3,sat:4}},
  ]},
  {id:'ev-pri-shuangbai', n:'双百大饼', d:'期末复习动员会上老爸许诺：“这次期末语文数学考双百，暑假带你去欢乐谷吃洋快餐！”', type:'choice', p:['pri'], opts:[
    {t:'秉烛夜读死磕课本所有练习题', e:{iq:4,mem:4,stress:3,insight:20}},
    {t:'认真梳理错题本重点突击易错点', e:{iq:3,exam:2}},
    {t:'提前在笔记本上画好过山车游玩路线', e:{img:4,stress:-3}},
  ]},

  /* ================= 初中期 (12-15岁) ================= */
  {id:'ev-jun-feizhuliu', n:'火星文个性签名', d:'QQ空间盛行繁体火星文与悲伤签名：“侞淉噯，請罙噯；若卟噯，請囄幵”。大家都在攀比空间装扮。', type:'choice', p:['junior'], opts:[
    {t:'换上深奥忧伤的火星文长签名', e:{img:4,cha:2,face:-2}},
    {t:'开启隐身模式默默围观好友动态', e:{eq:3,iq:2}},
    {t:'用古风文言文写一句原创格言反讽', e:{mem:4,iq:3,face:4}},
  ]},
  {id:'ev-jun-mp3', n:'袖口穿线的旋律', d:'攒了两个月零用钱买的二手MP3，耳机线顺着校服袖管巧妙引到掌心，手托腮假装沉思。', type:'choice', p:['junior'], opts:[
    {t:'伴着周杰伦的《晴天》飞速刷代数题', e:{img:4,stress:-4,iq:2}},
    {t:'分享一只耳塞给窗边心仪的同学', e:{eq:4,cha:4,face:3}},
    {t:'音量开太大被班主任当场缴械', e:{stress:5,money:-20,face:-5}},
  ]},
  {id:'ev-jun-kuijiao', n:'校服裤脚大改造', d:'班里掀起一股风潮，大家都去街口老裁缝铺花5块钱把拖沓的校服裤腿裁成修身收脚裤。', type:'choice', p:['junior'], opts:[
    {t:'紧随潮流改窄裤腿挽起脚踝', e:{cha:4,face:3,sat:-3}},
    {t:'坚决保留宽松原版图个透气自在', e:{phy:2,sat:3}},
    {t:'在纯白校服后背手绘二次元涂鸦', e:{img:4,stress:-2,face:2}},
  ]},
  {id:'ev-jun-tiyu', n:'中考体测冲锋', d:'初三体育模拟测评，一千米跑道上狂风刮得脸生疼，体育老师手握秒表严阵以待。', type:'choice', p:['junior'], opts:[
    {t:'全程匀速跟跑最后一百米极限冲刺', e:{phy:5,exam:3,stress:2}},
    {t:'紧贴内道紧跟长跑尖子生节奏', e:{iq:3,phy:3}},
    {t:'趁转弯处盲区偷偷抄近道切弯', e:{phy:1,face:-4,stress:3}},
  ]},
  {id:'ev-jun-tongzhuo', n:'神级同桌降临', d:'新学期重排桌次，班主任竟然安排你和年级第一的学霸同桌，全班投来羡慕与起哄的目光。', type:'choice', p:['junior'], opts:[
    {t:'每天课间虚心请教数理化解题思路', e:{iq:5,insight:25,stress:2}},
    {t:'分享私藏零食建立坚实友谊', e:{eq:4,cha:3,face:3}},
    {t:'正襟危坐生怕在学霸面前露怯', e:{mem:3,stress:2}},
  ]},
  {id:'ev-jun-zhiriyuan', n:'主题黑板报竞赛', d:'校迎新黑板报评比，团支书力邀你挑起大梁，在教室后方十米黑板上大展拳脚。', type:'choice', p:['junior'], opts:[
    {t:'主笔绘制气势磅礴的彩色粉笔大画', e:{img:5,cha:3,face:5}},
    {t:'用工整的仿宋体抄写名家励志段落', e:{mem:4,eq:2,insight:20}},
    {t:'担任后勤总管调配粉笔擦洗水桶', e:{phy:3,eq:3}},
  ]},
  {id:'ev-jun-jiazhanghui', n:'家长会后的沉寂', d:'期中考全校家长会散场，爸妈脸色凝重从走廊走出来，手里攥着成绩单。', type:'rand', p:['junior'], eff:{eq:3,stress:4,iq:2}},
  {id:'ev-jun-wuxia', n:'桌底金庸江湖', d:'一本掉了封面的武侠小说在男生之间悄悄传阅，每个人限借一天，错过了就要等下个月。', type:'choice', p:['junior'], opts:[
    {t:'课本竖起遮挡通宵沉醉降龙十八掌', e:{img:5,mem:2,stress:-3,sat:-2}},
    {t:'在草稿纸上整理江湖各门派招式谱系', e:{img:3,insight:20}},
    {t:'仗义放哨提醒沉迷同学防范巡查', e:{eq:4,face:3}},
  ]},

  /* ================= 高中期 (15-18岁) ================= */
  {id:'ev-sen-baiduan', n:'百日誓师大会', d:'红底金字的“高考倒计时100天”横幅挂满礼堂，激昂的交响乐在大喇叭里震撼回荡。', type:'choice', p:['senior'], opts:[
    {t:'热血沸腾振臂高呼宣誓誓词', e:{iq:4,exam:4,stress:4}},
    {t:'沉着冷静在笔记本上重构复习计划', e:{iq:5,insight:30,stress:1}},
    {t:'侧头捕捉同伴眼神中的拼搏与泪光', e:{eq:4,cha:2}},
  ]},
  {id:'ev-sen-tingdian', n:'突如其来的停电狂欢', d:'夏夜自习室风扇吱呀转动，整座高三教学楼突然毫无征兆跳闸，黑暗中全校爆发欢呼！', type:'choice', p:['senior'], opts:[
    {t:'跑到走廊趴在栏杆上大声呐喊释放压抑', e:{stress:-8,phy:3,face:2}},
    {t:'掏出抽屉里备用的台灯继续刷高考真题', e:{iq:5,mem:4,insight:25}},
    {t:'趴在窗台上与身旁好友轻声畅聊大学憧憬', e:{eq:5,cha:3,stress:-5}},
  ]},
  {id:'ev-sen-wusan', n:'翻烂的五年高考', d:'不知不觉做完了整整四大本《五年高考三年模拟》，厚厚的草稿纸在脚边堆了半人高。', type:'rand', p:['senior'], eff:{iq:4,mem:4,insight:35,stress:-2}},
  {id:'ev-sen-shili', n:'体检视力表大营救', d:'高考全身体检，几个高度近视同僚在视力检测室外拼了命记忆最下面两行的E字开口方向。', type:'choice', p:['senior'], opts:[
    {t:'施展过目不忘神技顺利背下整行开口', e:{mem:5,iq:2,stress:-1}},
    {t:'坦然摘镜据实测定接受真实视力', e:{phy:3,money:-30,stress:-2}},
    {t:'悄悄咳嗽给前面的同伴提示方向', e:{eq:4,face:3}},
  ]},
  {id:'ev-sen-liuyan', n:'硬壳同学录', d:'毕业前夕课桌上悄然多了一本装帧精美的硬皮留言册，每页都是专属于青春的密语。', type:'choice', p:['senior'], opts:[
    {t:'饱含深情写下三千字青春长文回顾', e:{eq:5,cha:4,face:3}},
    {t:'画上一幅全班同学的卡通合影彩蛋', e:{img:5,stress:-3,face:3}},
    {t:'在最隐秘的一角写下未曾言明的告白', e:{cha:5,stress:2,shadow:-5}},
  ]},
  {id:'ev-sen-sixiang', n:'最后一节语文课', d:'讲完试卷最后一道大题，班主任放下粉笔靠在讲台前：“你们再看看书，我再看看你们。”', type:'rand', p:['senior'], eff:{eq:5,stress:-6,insight:30}},
  {id:'ev-sen-yaowang', n:'熟悉考场', d:'高考前一天下午来到考点熟悉考场，金色的夕阳照在“沉着应考，再创辉煌”的横幅上。', type:'choice', p:['senior'], opts:[
    {t:'仔细核验洗手间、饮水处与考场座位', e:{iq:3,mem:3,exam:3}},
    {t:'闭目深呼吸把心率调整到最佳应试状态', e:{stress:-6,phy:3}},
    {t:'在校门口小摊买个大葱夹定胜糕讨口彩', e:{money:-10,eq:3,exam:2}},
  ]},

  /* ================= 大学期 (18-22岁) ================= */
  {id:'ev-col-qiangke', n:'教务网抢课大溃败', d:'新学期通选课早上8点准时开放，全校宿舍狂敲F5导致教务系统当场崩溃，好课瞬间灰飞烟灭。', type:'choice', p:['college'], opts:[
    {t:'退而求其次捡漏《中外茶道与养生》', e:{eq:4,img:3,stress:-3}},
    {t:'编写自动化脚本疯狂挂机捡退课名额', e:{iq:4,stress:3,act:5}},
    {t:'拿着特批表软磨硬泡找教授申请手动加课', e:{eq:5,face:4,insight:20}},
  ]},
  {id:'ev-col-wotan', n:'大学宿舍卧谈会', d:'深夜熄灯断网之后，上下铺的六个年轻人仰面躺在床上，开启了横跨哲学与人生的深度对谈。', type:'choice', p:['college'], opts:[
    {t:'激情预测未来科技行业发展新风口', e:{iq:5,insight:30,face:3}},
    {t:'畅想十年后各自开什么豪车重聚校园', e:{img:5,cha:3,stress:-4}},
    {t:'两分钟鼾声大作化身全寝睡眠冠军', e:{phy:4,stress:-5}},
  ]},
  {id:'ev-col-fuda', n:'高数期末量子突击', d:'平时听课云里雾里，期末考试前夜走廊长明灯下，全楼道都在抓狂背诵拉格朗日中值定理。', type:'choice', p:['college'], opts:[
    {t:'通宵刷完三套往年期末真题死记题型', e:{iq:5,mem:5,stress:5}},
    {t:'请学霸室友吃全套夜宵换取划重点压题', e:{eq:5,insight:25,money:-20}},
    {t:'佛系默念“只要胆子大，一周过高数”', e:{img:4,stress:-3,shadow:2}},
  ]},
  {id:'ev-col-shetuan', n:'百团大战招新盛典', d:'金秋九月林荫道两侧两百个学生社团摆摊竞技，吉他弹唱、武术套路、无人机表演眼花缭乱。', type:'choice', p:['college'], opts:[
    {t:'加入摇滚吉他社苦练才艺吸引目光', e:{cha:6,img:3,money:-50}},
    {t:'竞聘校团委外联部锻炼商业赞助洽谈', e:{eq:6,face:6,insight:20}},
    {t:'报名ACM算法竞赛实验室闭关钻研', e:{iq:6,mem:3,insight:35}},
  ]},
  {id:'ev-col-shixi', n:'大厂实习群面', d:'投了上百家知名企业的暑期管培生，终于收到一家头部大厂的无领导小组讨论面试通知。', type:'choice', p:['college'], opts:[
    {t:'穿上正装气场全开担任小组Time-keeper', e:{eq:5,face:6,money:80}},
    {t:'用详实的数据洞察力挽狂澜指引方案', e:{iq:6,insight:30,money:100}},
    {t:'作为总结陈词代表赢得面试官一致赞赏', e:{cha:5,eq:4,money:70}},
  ]},
  {id:'ev-col-dabian', n:'毕业论文终极答辩', d:'讲台投影仪上展示着你的毕业设计，几位德高望重的教授端坐在前排，突然针对样本量提出灵魂质问。', type:'choice', p:['college'], opts:[
    {t:'沉着对答列举数十篇SCI顶级文献印证', e:{iq:6,mem:4,face:8}},
    {t:'虚心受教恳切感谢专家评委点拨指正', e:{eq:6,face:4,stress:-3}},
    {t:'搬出指导老师亲自制定的技术路线顶雷', e:{iq:4,eq:4,stress:-2}},
  ]},
  {id:'ev-col-sanhuo', n:'毕业季散伙宴', d:'大学食堂二楼大圆桌，大家碰杯高呼未来可期，曾经的欢笑与迷茫在这一夜化为难舍的泪水。', type:'rand', p:['college'], eff:{eq:6,cha:4,stress:-8,face:5}},

  /* ================= 工作/职场期 (22-30岁) ================= */
  {id:'ev-wrk-subway', n:'早八换乘站生死时速', d:'周一清晨西直门地铁换乘大厅，人头攒动水泄不通，列车关门提示音正急促闪烁。', type:'choice', p:['work'], opts:[
    {t:'侧身借力身轻如燕挤进最后门缝', e:{phy:4,stress:3,money:20}},
    {t:'戴上降噪耳机专心听行业分析音频播客', e:{iq:4,insight:30,stress:-2}},
    {t:'一咬牙破费预约网约车保全从容优雅', e:{money:-35,stress:-4,face:2}},
  ]},
  {id:'ev-wrk-dabing', n:'深夜老板的战略大饼', d:'周五晚上十点，公司核心群突然弹出老板三千字长信：“年轻人要有格局，公司敲钟在即人人股份！”', type:'choice', p:['work'], opts:[
    {t:'秒回收到并带头在群内跟帖表决心', e:{eq:6,face:5,sat:3}},
    {t:'锁屏熄灯洗洗睡了，坚守打工人身心健康', e:{phy:4,stress:-6,money:-10}},
    {t:'截图转给猎头评估当下跳槽溢价空间', e:{iq:5,insight:25,stress:-3}},
  ]},
  {id:'ev-wrk-nianhui', n:'公司年会幸运锦鲤', d:'年会大厅觥筹交错，舞台大屏幕开始抽取年度特等奖——纯金金条与全套苹果数码全家桶！', type:'choice', p:['work'], opts:[
    {t:'登台献唱一曲惊艳全场引发全员欢呼', e:{cha:6,eq:4,face:8,money:50}},
    {t:'埋头大吃大喝专挑帝王蟹和三文鱼下手', e:{phy:4,stress:-5,money:20}},
    {t:'喜提三等奖扫地机器人转手二手平台变现', e:{money:120,face:4,stress:-3}},
  ]},
  {id:'ev-wrk-jiaban', n:'S级项目交付喜讯', d:'闭门攻坚两星期的核心业务系统顺利上线，客户总裁亲自致电表彰，追加了下期战略订单。', type:'choice', p:['work'], opts:[
    {t:'笑纳丰厚的阶段性攻坚奖金与利润分成', e:{money:200,face:8,phy:-2}},
    {t:'借此战绩正式向VP申请提拔晋升职级', e:{iq:5,eq:5,face:10}},
    {t:'向HR申请连休调休狠狠补觉三天', e:{phy:6,stress:-10}},
  ]},
  {id:'ev-wrk-zufang', n:'租房中介斗智斗勇', d:'租约到期准备搬家，黑中介借口地板轻微磨损要求扣除全部押金，气氛剑拔弩张。', type:'choice', p:['work'], opts:[
    {t:'调出入住高清对比视频依据合同硬核维权', e:{iq:5,eq:4,money:80,face:5}},
    {t:'拨打市民服务热线与消协寻求仲裁协助', e:{eq:5,phy:3,money:60}},
    {t:'破财免灾抓紧搬入新居避免耗费心神', e:{money:-50,stress:4,shadow:2}},
  ]},
  {id:'ev-wrk-moyu', n:'带薪摸鱼的艺术', d:'午后三点阳光洒在工位，电脑屏幕被繁复的甘特图与分析看板占满，键盘噼啪作响。', type:'rand', p:['work'], eff:{img:4,stress:-5,phy:2}},
  {id:'ev-wrk-xianjin', n:'商务宴请偶遇旧识', d:'陪同客户在五星级酒店宴会厅敬酒，隔壁包厢走出来的集团总裁竟然是当年的初中同窗。', type:'choice', p:['work'], opts:[
    {t:'大方递上名片幽默叙旧促成两家深度合作', e:{eq:6,face:8,insight:25}},
    {t:'互加私人微信约定周末去打高尔夫网球', e:{eq:4,cha:4,phy:3}},
    {t:'默契颔首微笑致意保持克制与分寸感', e:{mem:3,stress:2}},
  ]},

  {id:'ev-wrk-internet-boom', n:'移动互联网时代风口', d:'移动互联网浪潮澎湃而至，智能终端爆发式增长。一家崭露头角的科技初创公司向你抛出早期核心员工橄榄枝并承诺丰厚期权池！', type:'choice', p:['work'], opts:[
    {t:'毅然投身创业潮加盟科技先锋', e:{money:300,face:20,stress:10,iq:15}},
    {t:'留守成熟头部大厂稳扎稳打', e:{money:120,stress:-10,sat:15,eq:10}}
  ]},
  {id:'ev-wrk-media-wave', n:'自媒体短视频新蓝海', d:'业余时间，你尝试将自己的行业干货与生活洞察剪辑为系列视频，其中一条深度解析突然引爆全网算法，单夜点赞破百万！', type:'choice', p:['work'], opts:[
    {t:'精心打造个人品牌孵化爆款IP', e:{money:200,cha:25,img:20,face:15}},
    {t:'当做修身养性的业余生活小插曲', e:{stress:-15,eq:15,sat:10}}
  ]},
  {id:'ev-wrk-school-house', n:'重点学区房置业攻坚', d:'为给下一代抢占前沿起跑线，房产顾问与双方长辈反复催促你锁定对口省重点小学与初中的黄金学区房。', type:'choice', p:['work','home'], opts:[
    {t:'倾尽全家积蓄锁定核心学区房', e:{money:-150,face:25,sat:20,stress:15}},
    {t:'坚持因材施教拒绝房奴内卷', e:{stress:-20,money:100,eq:18}}
  ]},
  {id:'ev-wrk-industry-pivot', n:'行业周期重组大洗牌', d:'宏观经济与产业周期交替，集团宣布开展大刀阔斧的业务重组与编制优化，所在部门面临生死存亡的关键抉择……', type:'choice', p:['work'], opts:[
    {t:'亮出硬核技术绝活逆势带队破局', e:{iq:20,phy:15,face:25,money:150}},
    {t:'拿满优化补偿金体面转身开启自由职业', e:{money:280,stress:-20,img:15}}
  ]},
  {id:'ev-wrk-parents-health', n:'父母体检报告的深谈', d:'繁重的工作间隙，老家寄来了父母的年度体检单。岁月不饶人，指标上悄然多了几处标红异常，父母却电话里连称“一切都好不用挂念”……', type:'choice', p:['work','home'], opts:[
    {t:'立即预约三甲专家号请假陪同复查', e:{money:-60,sat:35,shadow:-15,eq:20}},
    {t:'寄送名贵滋补药品与智能监测设备', e:{money:-80,sat:20,face:15}}
  ]},

  /* ================= 成家立业期 (30+岁) ================= */
  {id:'ev-hom-cuihun', n:'七大姑八大姨催婚局', d:'大年初二老家客厅，姑妈姨妈嗑着瓜子布下天罗地网，连珠炮般盘问成家进度与存款情况。', type:'choice', p:['home'], opts:[
    {t:'嘴甜敬酒顺势将焦点转移至表弟考研成绩', e:{eq:6,face:6,stress:-2}},
    {t:'拿出年终理财成绩单与体检报告震慑全场', e:{iq:5,money:150,face:10}},
    {t:'敞开心扉真诚分享个人生活节奏赢得理解', e:{eq:5,sat:4,stress:2}},
  ]},
  {id:'ev-hom-xiangqin', n:'奇葩相亲遇险记', d:'亲友引荐的相亲饭局，对方一坐下就掏出一份手写清单，提出彩礼翻倍且婚后工资卡全权保管。', type:'choice', p:['home'], opts:[
    {t:'微笑着示意服务员各付各账礼貌起身告辞', e:{eq:5,cha:5,face:6}},
    {t:'以其人之道还治其人之身展开严密逻辑辩难', e:{iq:5,face:4,stress:-3}},
    {t:'借口公司突发紧急系统故障火速开溜', e:{img:4,stress:-4}},
  ]},
  {id:'ev-hom-fenzi', n:'金秋红色炸弹连发', d:'国庆长假还没开始，微信里接连跳出六张结婚请柬，银行卡余额即将遭受狂轰滥炸。', type:'choice', p:['home'], opts:[
    {t:'豪迈包下吉利大红包稳稳维系多年铁杆交情', e:{money:-150,face:12,eq:5}},
    {t:'按照市场标准行情随礼并送上诚挚手写祝福', e:{money:-80,face:6,eq:3}},
    {t:'托故外地出差发个喜庆电子贺卡寄去心意', e:{money:-40,stress:-2,face:2}},
  ]},
  {id:'ev-hom-juhui', n:'二十年同学大聚餐', d:'老班长张罗的初高中聚会，昔日穿着宽大校服的青葱少年们如今大多已为人父母。', type:'choice', p:['home'], opts:[
    {t:'云淡风轻谈吐不凡成为席间谈话核心', e:{iq:6,cha:6,face:10}},
    {t:'与当年死党勾肩搭背回味无忧无虑的青葱岁月', e:{eq:6,stress:-8,cha:4}},
    {t:'坐在转盘角落安静享受满桌佳肴美酒', e:{phy:3,money:30,stress:-3}},
  ]},
  {id:'ev-hom-maifang', n:'安家置业大抉择', d:'全家人围坐在沙发前反复商议，到底该倾尽所有置办学区老破小，还是入手远郊大平层。', type:'choice', p:['home'], opts:[
    {t:'果断出手核心区重点学区房抢占先机', e:{iq:6,exam:5,face:10,money:-200}},
    {t:'选择依山傍水的大平层提升全家起居品质', e:{phy:6,stress:-8,face:8,money:-150}},
    {t:'保持充沛现金流坚持租房拒绝被房贷捆绑', e:{img:6,money:200,stress:-6,face:-4}},
  ]},
  {id:'ev-hom-peihu', n:'岁月静好之念', d:'周末午后陪同父母在林荫道散步，夕阳将两代人的影子拉得很长很长。', type:'rand', p:['home'], eff:{eq:8,sat:8,stress:-10,face:6}},
],

/* 阶段时钟与升学 */
phases: {
  name: t => t<=8?'婴儿期': t<=14?'幼儿园':t<=24?'小学':t<=32?'初中':t<=44?'高中':t<=50?'大学':t<=57?'工作了':'成家后',
  baby:1, kinder:9, pri:15, junior:25, senior:33, college:45, work:51, end:58,
},

/* 阶段蜕变与成长画卷配置 */
phaseTransitions: {
  kinder: {
    turn: 9,
    prevName: '婴儿期',
    prevIcon: '👶',
    nextName: '幼儿园',
    nextIcon: '🎒',
    ceremony: '👶 🍼 ➜ 🎒 🖍️',
    title: '告别襁褓 · 背上小书包！',
    story: '那个整天在爬行垫上翻滚、抓着拨浪鼓傻笑的小团子长大了！父母把你送进了双语幼儿园，你第一次学会了自己拿勺吃饭，和小伙伴手拉手排排坐。',
    unlocks: [
      '🏅 开启【成绩小红花】与第一次面子对决（第12回合）',
      '🎤 登台【幼儿园才艺小舞台】展示拿手绝技',
      '🧺 解锁【向父母索取】心愿物品（电子琴、游戏机等）'
    ],
    gift: { insight: 30, act: 20 },
    giftDesc: '阶段成长礼：悟性+30，行动+20！'
  },
  pri: {
    turn: 15,
    prevName: '幼儿园',
    prevIcon: '🎒',
    nextName: '小学',
    nextIcon: '🏫',
    ceremony: '🎒 🖍️ ➜ 🏫 📝 🧣',
    title: '系上红领巾 · 义务教育起航！',
    story: '小学的校门在清脆的铃声中打开，胸前飘扬着鲜艳的红领巾。抽屉里有了带锁的文具盒，爸妈也开始把“期末双百”挂在嘴边。真正的求学之路就此拉开序幕！',
    unlocks: [
      '🛒 【校园小卖部】开张！课外书、补脑品、文具随心选购',
      '💰 开启【每回合零花钱】发放，门第越高零钱越丰厚',
      '🗳️ 解锁【竞选班干部（第18回合）】与【期末大考（第24回合）】'
    ],
    gift: { insight: 45, act: 25, money: 30 },
    giftDesc: '阶段成长礼：悟性+45，行动+25，开学零花+30元！'
  },
  junior: {
    turn: 25,
    prevName: '小学',
    prevIcon: '🏫',
    nextName: '初中',
    nextIcon: '🏢',
    ceremony: '🏫 📝 ➜ 🏢 📚 🚲',
    title: '青葱岁月 · 少年心事渐浓！',
    story: '换上宽松宽大的蓝白校服，个头蹿得飞快。课桌里的课本多了物理、化学与几何，黑板右上角写下了倒计时。窗外的知了声中，你有了属于自己的秘密和心仪的背影。',
    unlocks: [
      '👥 【同学往来】社交解禁！聊天送礼积累好感度，种下未来的羁绊',
      '💼 解锁【课外打工】，用行动力自己挣零钱',
      '🎯 迎接决定人生高中的命运分流【中考大关（第32回合）】'
    ],
    gift: { insight: 60, act: 30, money: 50 },
    giftDesc: '阶段成长礼：悟性+60，行动+30，青春零花+50元！'
  },
  senior: {
    turn: 33,
    prevName: '初中',
    prevIcon: '🏢',
    nextName: '高中',
    nextIcon: '🏛️',
    ceremony: '🏢 📚 ➜ 🏛️ 🎓 🔥',
    title: '无悔青春 · 高考终极冲刺！',
    story: '桌角堆成小山般的五年高考三年模拟，晚自习窗边吹进的夏夜晚风。全家人的目光都汇聚到了你身上，每一分掌握度都将在决定命运的考场上绽放光彩！',
    unlocks: [
      '🔥 全面开启【语数英理综文综】高考六科压轴冲刺',
      '🏆 参加全省【终极盛大选秀（第41回合）】，赢取丰厚面子与悟性',
      '🎓 迎接人生大考【高考大关（第44回合，满分20000分）】！'
    ],
    gift: { insight: 80, act: 40 },
    giftDesc: '阶段成长礼：悟性+80，行动+40，全神贯注冲刺！'
  },
  college: {
    turn: 45,
    epilogue: true,
    prevName: '高中',
    prevIcon: '🏛️',
    nextName: '大学',
    nextIcon: '🎓',
    ceremony: '🏛️ 🔥 ➜ 🎓 💻 🍻',
    title: '放飞象牙塔 · 终章启幕！',
    story: '高考放榜，拿到录取通知书的那一刻，父母眼角泛着泪光与骄傲。离开家乡踏入大学校园，没有了做不完的试卷，面对广阔天地，你开始决定自己想成为什么样的人。\n\n🎬【终章启幕】——高考落幕，属于这一代的人生已进入最后一幕：大学修业、职场拼搏、成家立业与代际传承，每一步都在为你的结局与家族下一代写下注脚。',
    unlocks: [
      '📚 自由选修高阶大学专业课与作品集创作',
      '💼 开启高质量【企业实习】，积累职场前置门槛',
      '💍 深入恋爱交往，为终身伴侣与下一代底蕴奠基'
    ],
    gift: { insight: 100, act: 40, money: 100 },
    giftDesc: '阶段成长礼：悟性+100，行动+40，开学生活费+100元！'
  },
  work: {
    turn: 51,
    epilogue: true,
    prevName: '大学',
    prevIcon: '🎓',
    nextName: '步入职场',
    nextIcon: '👔',
    ceremony: '🎓 💻 ➜ 👔 💼 📈',
    title: '告别校园 · 跻身社会大潮！',
    story: '收起学士服，穿上正装工牌。月薪准时到账，租房、水电、人情世故，你从被呵护的孩子变成了独当一面的大人，用双手构筑属于自己的立足之地。',
    unlocks: [
      '💵 按月领取丰厚职级薪资，累积家族原始资本',
      '🏆 职级晋升、社会地位提升',
      '🏡 积攒积蓄，为下一代的阶层跃升打下坚实地基'
    ],
    gift: { act: 40, money: 200 },
    giftDesc: '阶段成长礼：行动+40，起步启动金+200元！'
  },
  home: {
    turn: 58,
    epilogue: true,
    prevName: '职场',
    prevIcon: '👔',
    nextName: '成家立业',
    nextIcon: '🏡',
    ceremony: '👔 💼 ➜ 🏡 💍 💑',
    title: '三十而立 · 传承生命火炬！',
    story: '拼搏多年，生活逐渐沉淀下安稳的暖意。无论是相濡以沫的校园恋人，还是投缘相知的相亲伴侣，家的港湾已经筑就，生命的火炬即将传向下一代。',
    unlocks: [
      '💍 缔结终身良缘，伴侣基因深度融入下一代天赋',
      '🧬 汇总家族图鉴与毕生功绩，生成家族传家档案',
      '👶 准备迎接新生命，开启代际阶层跃升！'
    ],
    gift: { act: 50, money: 300 },
    giftDesc: '阶段成长礼：行动+50，成家基金+300元！'
  }
},

/* ---------- 职业 ---------- */
jobs: [
  {id:'j-bao',  n:'小区保安', icon:'🛡️', t:0, req:{any:40},       money:30,  d:'站得笔直,是世界第九大奇迹。'},
  {id:'j-fly',   n:'流水线工人', icon:'🏭', t:0, req:{any:80},    money:40,  d:'螺丝打螺丝,螺丝打螺丝。'},
  {id:'j-zero',  n:'网约车司机', icon:'🚕', t:0, req:{any:100},   money:50,  d:'这座城市的路,你闭着眼都能开。'},
  {id:'j-paom',  n:'外卖骑手',   icon:'🛵', t:1, req:{phy:120,any:200}, money:55, d:'准时率 99%,餐都已迟到。'},
  {id:'j-shop',  n:'便利店店员', icon:'🏪', t:1, req:{any:200},   money:60,  d:'"欢迎光临"说了 8000 遍,练习了微笑。'},
  {id:'j-chugui',n:'底层白领',   icon:'💻', t:1, req:{iq:200,any:260}, money:75, d:'Excel 熟练得都能当六边形战士。'},
  {id:'j-realtor',n:'房产中介',  icon:'🏠', t:2, req:{eq:220,cha:150}, money:120, d:'看房 100 套,成交 1 套,梦想是卖掉一栋楼。'},
  {id:'j-cook',   n:'厨师',      icon:'🍳', t:2, req:{phy:260,img:150}, money:110, d:'颠勺颠的是生活。'},
  {id:'j-tea',    n:'小学老师',  icon:'👩‍🏫', t:2, req:{eq:280,mem:220}, money:115, d:'作业批改到深夜,还要看微信家长群。'},
  {id:'j-gov',    n:'基层公务员', icon:'🏛️', t:2, req:{eq:240,mem:260}, money:130, d:'为人民服务。'},
  {id:'j-nurse',  n:'护士',      icon:'💉', t:2, req:{mem:260,phy:200}, money:120},
  {id:'j-design', n:'设计师',    icon:'🎨', t:3, req:{img:360,cha:150}, money:150},
  {id:'j-dev',    n:'程序员',    icon:'👨‍💻', t:3, req:{iq:380,mem:300}, money:200},
  {id:'j-doctor', n:'医生',      icon:'🩺', t:3, req:{iq:400,mem:380}, money:220},
  {id:'j-lawyer', n:'律师',      icon:'⚖️', t:3, req:{iq:360,eq:340}, money:210},
  {id:'j-media',  n:'网红主播',  icon:'📱', t:3, req:{cha:500,img:260}, money:250},
  {id:'j-athl',   n:'职业运动员',icon:'🏅', t:4, req:{phy:600}, money:280},
  {id:'j-sci',    n:'科研工作者',icon:'🔬', t:4, req:{iq:560,mem:420}, money:260},
  {id:'j-pro',    n:'大学教授',  icon:'🎓', t:4, req:{iq:520,mem:520,img:300}, money:300},
  {id:'j-star',   n:'演艺明星',  icon:'🌟', t:4, req:{cha:620,img:420,eq:300}, money:400},
  {id:'j-founder',n:'创业老板',  icon:'🚀', t:4, req:{eq:400,iq:400,cha:200}, money:450},
  {id:'j-first',  n:'首富',      icon:'💰', t:5, req:{iq:780,eq:500,img:400,mem:700,phy:300,cha:400, special:'💎 全维度碾压'}, money:1000},
],

/* 面子对决的对手 (原版五大经典亲戚与挑战阵营) */
rivals: [
  {
    id: 'biaosao',
    n: '远房表嫂',
    icon: '👩',
    face: 280,
    atk: 30,
    stage: 'kinder',
    style: '早教优越',
    l: [
      '我家小宝刚报了全外教双语早教班，全英文沉浸式教学！',
      '两岁就能背二阶魔方口诀，早教老师天天夸是小天才！',
      '早教费一个月八千八，为人父母嘛，不能让孩子输在起跑线上！'
    ],
    tiltLines: [
      '表嫂有些发懵：“现在的孩子……都这么厉害吗……”',
      '表嫂勉强挤出笑容：“双语班老师可没教过这个……”',
      '表嫂拉着孩子借口换尿布红着脸离席！'
    ]
  },
  {
    id: 'eryi',
    n: '二姨',
    icon: '👱‍♀️',
    face: 300,
    atk: 38,
    stage: 'pri',
    style: '才艺培训',
    l: [
      '女孩子嘛，气质最重要，我家孩子芭蕾早过三级了！',
      '每个周末市少年宫特训，名师一对一指点！',
      '下个月还要代表少儿艺术团去省电视台录节目呢！'
    ],
    tiltLines: [
      '二姨擦了擦额头：“咳……芭蕾注重的是形体美……”',
      '二姨表情开始僵硬：“现在的考核也不光看这个……”',
      '二姨借口赶着去上舞蹈小课，灰溜溜带着孩子走了！'
    ]
  },
  {
    id: 'erjiuma',
    n: '二舅妈',
    icon: '👵',
    face: 320,
    atk: 45,
    stage: 'junior',
    style: '学科奥数',
    l: [
      '这次期中全市统考，我家天天又是全校前三！',
      '每天刷两套奥数压轴题，脑子转得比计算机还快！',
      '重点中学的教导主任说了，天天是妥妥的清北苗子！'
    ],
    tiltLines: [
      '二舅妈推了推老花镜：“这题……这题答案肯定印错了！”',
      '二舅妈手有些发抖：“光会死做题有什么用……”',
      '二舅妈脸色铁青，嘟囔着‘炉子上炖着鸡汤’悻悻离席！'
    ]
  },
  {
    id: 'zhouayi',
    n: '周阿姨',
    icon: '👩‍🦱',
    face: 360,
    atk: 52,
    stage: 'senior_early',
    style: '综合素质',
    l: [
      '钢琴十级早考过了，上周刚作为学生代表去省里汇报演说！',
      '不仅成绩年级前茅，还是校学生会文艺部长兼辩论队队长！',
      '名校自主招生推荐名额，基本十拿九稳了！'
    ],
    tiltLines: [
      '周阿姨干笑两声：“现在的后生……真是不得了……”',
      '周阿姨强作镇定：“人生的路长着呢，还得看后劲……”',
      '周阿姨借口接领导重要电话，匆忙离席！'
    ]
  },
  {
    id: 'dagu',
    n: '大姑',
    icon: '👵‍🦳',
    face: 400,
    atk: 62,
    stage: 'senior_late',
    style: '名校保送',
    l: [
      '听说隔壁谁家孩子还在苦读，我家孙子常青藤面试都过了！',
      '全额奖学金！直接保送本硕连读！全家族的无上荣耀！',
      '教育还是要看家族底蕴与人脉，普通人家可比不起！'
    ],
    tiltLines: [
      '大姑目瞪口呆，茶杯里的水洒了一裤子！',
      '大姑捂着心口：“这……这不可能！这绝对是瞎猫碰上死耗子！”',
      '大姑彻底颜面扫地，一言不发瘫坐在沙发上摆手认输！'
    ]
  },
  /* 经典邻里对手兼备 */
  {
    id: 'wangyi',
    n: '王姨的学霸儿子',
    icon: '🧑‍🎓',
    face: 220,
    atk: 48,
    style: '学神压制',
    l: ['我家孩子奥数满分', '全校大榜第一名', '每天刷题到深夜'],
    tiltLines: [
      '王姨抹了抹额头冷汗：“这题……这题小明昨晚也做过……”',
      '王姨语无伦次：“不可能！绝对不可能！肯定是题看错了！”',
      '王姨脸色铁青，借口家里炉子炖着老鸭汤悻悻离席！'
    ]
  },
  {
    id: 'fang',
    n: '有钱叔叔的孩子',
    icon: '👦',
    face: 180,
    atk: 42,
    style: '凡尔赛炫富',
    l: ['钢琴早过十级了', '双语幼儿园直升外校', '暑假刚去欧洲游学'],
    tiltLines: [
      '叔叔干笑两声：“咳咳，学得再多，有我家斯坦威贵吗……”',
      '叔叔擦了擦汗：“小孩子别太要强，我们家主打素质教育……”',
      '叔叔借口接跨国投资电话，灰溜溜钻进奔驰车走了！'
    ]
  },
  {
    id: 'liu',
    n: '隔壁刘婶的孙女',
    icon: '👧',
    face: 150,
    atk: 35,
    style: '美育战士',
    l: ['市少儿舞蹈金奖', '长得标致还懂事', '每次来都主动洗碗'],
    tiltLines: [
      '刘婶嘴角抽搐：“现在的小孩……都这么卷了吗……”',
      '刘婶强行挽尊：“光死念书有什么用，女孩子得会体贴人……”',
      '刘婶尴尬地拉着孙女：“回去了回去了，跳舞课快迟到了！”'
    ]
  },
  {
    id: 'chen',
    n: '表哥家小孙子',
    icon: '👶',
    face: 100,
    atk: 25,
    style: '天才婴儿',
    l: ['三岁就能背唐诗三百首', '心算比大人还快', '邻居都夸是神童'],
    tiltLines: [
      '表哥愣在原地，怀里的神童突然哇哇大哭起来！',
      '表哥尴尬拍抚：“孩子认生……这叫大器晚成懂不懂……”',
      '表哥抱着哭闹的孩子红着脸匆匆告辞！'
    ]
  }
],

/* 特长羁绊表 (Face Duel 2.0 Synergy) */
talentSynergies: [
  {
    id: 'synergy_stem',
    n: '理科降维打击',
    icon: '⚡',
    reqCats: ['stem', 'stem'],
    bonusDmg: 0.35,
    tiltBonus: 25,
    desc: '数理逻辑严丝合缝，直接贯穿对手防线！',
    quote: '“这道压轴题全省只有三个人做出来，正是不才在下！”'
  },
  {
    id: 'synergy_art',
    n: '文质彬彬',
    icon: '📜',
    reqCats: ['art', 'art'],
    bonusDmg: 0.30,
    healBonus: 25,
    desc: '才情横溢诗书气华，给对手以精神层面的降维陶冶！',
    quote: '“腹有诗书气自华，闲云潭影日悠悠。长辈见笑了。”'
  },
  {
    id: 'synergy_witty',
    n: '人间清醒破功',
    icon: '💡',
    reqCats: ['witty'],
    weakenOpp: 0.45,
    desc: '机智拆台，让对手的吹嘘当场卡壳破功！',
    quote: '“您家孩子这么优秀，怎么没去保送少年班呢？”'
  },
  {
    id: 'synergy_phy',
    n: '阳光健将',
    icon: '🏃',
    reqCats: ['phy'],
    bonusDmg: 0.25,
    tiltBonus: 20,
    desc: '体魄强健神采飞扬，以蓬勃朝气压制全场攀比！',
    quote: '“身体是革命的本钱！一口气跑五公里不带喘的！”'
  }
],

/* 同学(可攻略) */
npcs: [
  {id:'summer', n:'苏软软', icon:'🌸', gender:'女', like:['妮妮\'s饼干','彩笔','棒棒糖'], bonus:{eq:20, img:25}, intro:'后排安静的女孩,抽屉里贴满可爱贴纸。', phase:'kinder', quotes:{ like:'“哇！你怎么知道我一直在找这个！手账正好用得上，谢谢你~”', normal:'“谢谢你的小礼物，我很喜欢！”', meet:'正坐在窗边静静画着手账……' }},
  {id:'shenhan', n:'沈寒', icon:'❄️', gender:'男', like:['经典游戏卡','重点鞋','运动饮料'], bonus:{phy:30, eq:15}, intro:'校队后卫,高冷话少但球风极其霸气。', phase:'junior', quotes:{ like:'“谢了兄弟！下半场篮球赛我们好好配合。”', normal:'“谢了，先放桌上吧。”', meet:'正在球场边单手转球。' }},
  {id:'xiaomei', n:'夏小美', icon:'🍡', gender:'女', like:['毛绒玩具','西瓜冰','辣条'], bonus:{eq:25, cha:20}, intro:'爱笑开心果,笑声一响全班都被治愈。', phase:'pri', quotes:{ like:'“哈哈哈哈太棒啦！我最喜欢这个了，放学一起吃呀！”', normal:'“哇塞，给我的吗？太感动啦！”', meet:'正和前排同学笑得前仰后合。' }},
  {id:'lizhen', n:'李振', icon:'🔥', gender:'男', like:['重点鞋','运动饮料','辣条'], bonus:{phy:35, eq:15}, intro:'热血体委,运动会上为班级屡创辉煌。', phase:'junior', quotes:{ like:'“好哥们儿！够义气，下次体测1000米我罩你！”', normal:'“谢啦，下次打球叫你！”', meet:'正在操场上给班级搬矿泉水。' }},
  {id:'yuanyuan', n:'媛媛', icon:'🧸', gender:'女', like:['奶茶兑换券','彩虹卷笔刀','毛绒玩具'], bonus:{cha:35, eq:20}, intro:'喜欢化妆和精致可爱事物的前桌。', phase:'junior', quotes:{ like:'“哇塞好可爱！你眼光真好，明天我带奶茶分你一半~”', normal:'“谢谢你呀，你人真体贴~”', meet:'正对着小圆镜整理刘海。' }},
  {id:'kongde', n:'孔德', icon:'🤠', gender:'男', like:['单筒望远镜','三年模拟','课外书'], bonus:{iq:35, mem:20}, intro:'天文社社长,理科奇才,偶尔中二。', phase:'senior', quotes:{ like:'“知音啊！这套资料正好解决了我的物理疑难，太感谢了！”', normal:'“收到！多谢同学互助。”', meet:'正在黑板上推演宇宙引力公式。' }},
  {id:'qixue', n:'棋子', icon:'🎮', gender:'女', like:['经典游戏卡','棒棒糖','辣条'], bonus:{iq:30, img:25}, intro:'电竞梦想家少女,操场联机开黑女王。', phase:'senior', quotes:{ like:'“够意思！今晚连机开黑我带你吃鸡上大分！”', normal:'“谢啦！回头有空开黑找我。”', meet:'正低头研究掌机上的格斗出招表。' }},
],

/* 商店 */
store: [
  {id:'st-candy', n:'棒棒糖', icon:'🍭', price:5,  eff:{stress:-2}},
  {id:'st-latiao',n:'辣条',   icon:'🌶️', price:8,  eff:{stress:-3, phy:-1}},
  {id:'st-ice',   n:'西瓜冰', icon:'🍉', price:10, eff:{stress:-4}},
  {id:'st-book',  n:'课外书', icon:'📖', price:30, eff:{insight:15}},
  {id:'st-cai',   n:'彩笔',   icon:'🖍️', price:25, eff:{img:6}},
  {id:'st-juice', n:'运动饮料',icon:'🧃', price:15, eff:{act:15}},
  {id:'st-brain', n:'补脑品', icon:'🧠', price:60, eff:{insight:60}},
  {id:'st-veryc', n:'补习班代金券', icon:'🎟️', price:80, eff:{insight:100}},
  {id:'st-pad',   n:'彩虹卷笔刀', icon:'🖊️', price:20, eff:{img:3,eq:2}},
  {id:'st-macha', n:'坤坤牌打气筒', icon:'💊', price:40, eff:{stress:-20, eq:3}},
  {id:'st-toy',   n:'毛绒玩具', icon:'🧸', price:35, eff:{eq:5}},
  {id:'st-shoes', n:'重点鞋',    icon:'👟', price:80, eff:{phy:8}},
  {id:'st-bk',    n:'三年模拟',  icon:'📙', price:70, eff:{exam:40}},
  {id:'st-biscuit',n:'妮妮\'s饼干',icon:'🍪', price:15, eff:{stress:-3, sat:2}},
  {id:'st-card',  n:'经典游戏卡',icon:'🕹️', price:25, eff:{img:4, stress:-5}},
  {id:'st-tea',   n:'奶茶兑换券',icon:'🧋', price:20, eff:{stress:-4, eq:2}},
  {id:'st-glass', n:'单筒望远镜',icon:'🔭', price:50, eff:{iq:5, mem:3}},
],

/* 索取 (向父母索取物资/道具) */
begs: [
  {id:'bg-yaoz',      n:'儿童电子琴',   icon:'🎹', face:30,  sat:20, w:0.65, eff:{img:5, eq:3}, desc:'以培养高雅情操为由，软磨硬泡'},
  {id:'bg-cart',      n:'小霸王游戏机', icon:'🎮', face:60,  sat:35, w:0.55, eff:{iq:4, img:4, stress:-15}, desc:'“妈，这个真的是拿来学五笔打字的！”'},
  {id:'bg-ccd',       n:'全套漫画大全', icon:'📚', face:25,  sat:15, w:0.70, eff:{img:6, stress:-20}, desc:'期末考前进补一点精神食粮'},
  {id:'bg-rw',        n:'品牌运动跑鞋', icon:'👟', face:80,  sat:30, w:0.50, eff:{phy:8, cha:4}, desc:'穿上它感觉体育中考稳了'},
  {id:'bg-piano',     n:'真木立式大钢琴',icon:'🎼', face:150, sat:55, w:0.35, eff:{cha:12, img:10, sat:15}, desc:'全家的大投资，亲戚串门都要看你弹一曲'},
  {id:'bg-huanggang', n:'黄冈密卷强化版',icon:'📗', face:90, sat:40, w:0.65, eff:{iq:8, mem:8, exam:35}, desc:'主动要试卷做，父母热泪盈眶欣然准奏'},
],

/* 大学专业方向与学院体系 */
majors: [
  {id:'cs',  n:'计算机与人工智能', icon:'💻', desc:'算法代码与前沿科技，直通大厂架构师与独角兽CEO', bonus:{iq:15, img:10}, matchJobs:['j-code','j-ai','j-game','j-first','j-vp']},
  {id:'med', n:'临床医学与现代医疗', icon:'🩺', desc:'救死扶伤与医学科研，直通三甲主刀名医与医药巨子', bonus:{mem:15, phy:10}, matchJobs:['j-doc','j-teach','j-ceo','j-first']},
  {id:'fin', n:'经济金融与商学院', icon:'📈', desc:'资本运作与商业领袖，直通投行合伙人与时代首富', bonus:{eq:15, cha:10}, matchJobs:['j-first','j-vp','j-ceo','j-law','j-boss']},
  {id:'art', n:'数字传媒与视听艺术', icon:'🎬', desc:'编导创作与视觉风潮，直通知名导演、大作家与影帝', bonus:{img:15, cha:10}, matchJobs:['j-art','j-star','j-stream','j-first']},
  {id:'eng', n:'大国重器与硬核工科', icon:'⚙️', desc:'精密制造与前沿探索，直通总工程师与大国工匠', bonus:{iq:12, mem:12}, matchJobs:['j-code','j-first','j-teach','j-gov']},
],

/* 家族传家荣誉成就 */
achievements: [
  {id:'ach-gk-top',      n:'状元及第',   icon:'🥇', desc:'高考斩获 19000 分以上，登顶清北', perk:'后代初始悟性 +20'},
  {id:'ach-first-rich',  n:'时代首富',   icon:'👑', desc:'达成全行业终极顶点「首富」职业', perk:'后代每回合额外零花 +50'},
  {id:'ach-love-true',   n:'青梅竹马',   icon:'💖', desc:'与学生时代校园恋人终成眷属', perk:'后代情商与魅力成长 +10%'},
  {id:'ach-talent-all',  n:'技惊四座',   icon:'🌟', desc:'单代累计领悟 8 项以上特长技能', perk:'面子对决伤害提升 20%'},
  {id:'ach-gen-5',       n:'百年望族',   icon:'🏛️', desc:'家族火炬连续传承达 5 代以上', perk:'全属性先天遗传系数提升至 25%'},
  {id:'ach-zero-break',  n:'寒门逆袭',   icon:'🚀', desc:'以工薪阶层起步逆袭考入985或任高级职务', perk:'后代初始面子 +35'},
  {id:'ach-perfect-life',n:'完美人生',   icon:'💎', desc:'单代人生综合评分达到 90 分以上', perk:'下一代所有基础属性 +10'},
  {id:'ach-academic-giant', n:'国士无双', icon:'🔭', desc:'完成学术深造路线并当选领军科学家', perk:'后代初始智商与记忆 +30'},
  {id:'ach-statesman-pillar', n:'中流砥柱', icon:'🏛️', desc:'完成选调考公路线并官至市长主政', perk:'后代初始家庭面子 +50'},
  {id:'ach-unicorn-king', n:'时代骄子', icon:'🦄', desc:'完成科技创业路线打造百亿独角兽', perk:'后代开局压岁钱额外 +200'},
  {id:'ach-industry-leader', n:'商业航母', icon:'💼', desc:'完成行业领军路线成为集团总裁', perk:'后代成年每月工资额外 +30%'},
],

/* 高考分数线档位 */
gk: [
  {min:0,     n:'专科线', t:'大专院校'},
  {min:6000,  n:'二本线', t:'普通本科'},
  {min:10000, n:'一本线', t:'老牌一本'},
  {min:14000, n:'211线', t:'武大同期'},
  {min:17000, n:'985线', t:'985 高校'},
  {min:19000, n:'清北线', t:'清北'},
],

/* 新手交互指引步骤配置 */
tutorialSteps: [
  {
    step: 1,
    id: 'status',
    target: '#status',
    tab: 'plan',
    title: '👶 1. 认识人生成长指标',
    body: '顶栏展示你的五维基础（智商/情商/记忆/想象/体魄/魅力）与资源。<br><br>下方进度条至关重要：<br><b>• 父母满意度</b>：低于15%会被训斥扣属性，≥75%有额外支持。<br><b>• 压力值</b>：全排学习会导致压力破表，转化为<b>心理阴影</b>（满100将直接精神崩溃BE）！',
    btn: '下一步：去挖脑洞 👉'
  },
  {
    step: 2,
    id: 'tab-brain',
    target: '#tabs button[data-tab="brain"]',
    tab: 'plan',
    title: '🧠 2. 脑洞是悟性之源',
    body: '学习各项技能需要消耗知识货币——<b>「悟性💡」</b>。<br><br>点击底部的<b>【🧠 脑洞】</b>，翻开灵感网格，积累悟性与属性吧！',
    btn: '进入脑洞 🚀',
    action: 'switch-tab-brain'
  },
  {
    step: 3,
    id: 'brain-grid',
    target: '#brain-grid',
    tab: 'brain',
    title: '💡 3. 翻开灵感格子',
    body: '每翻开一格消耗 2⚡ 行动力：<br><b>• 💡 悟性灯泡</b>：大幅增加悟性点数。<br><b>• 🗝️ 钥匙</b>：直通下一层并回复 50 行动力！<br><b>• 💥 炸弹</b>：瞬间连环爆破周围格子。<br>试着点开几个格子探索吧！',
    btn: '下一步：去安排日程 📅',
    action: 'switch-tab-plan'
  },
  {
    step: 4,
    id: 'plan-schedule',
    target: '#slotBoard',
    tab: 'plan',
    title: '📘 4. 研习技能与安排六件事',
    body: '有了悟性后，在上方【💡 研习新技能】板块可解锁新课（属性越高享悟性折扣）！<br><br>已掌握的课程与娱乐可以<b>无限次重复</b>填入上方的 6 个槽位。点击“⚡ 自动排满”或手动点击下方项目皆可！',
    btn: '下一步：推进人生 🌟'
  },
  {
    step: 5,
    id: 'turn-end',
    target: '#stage',
    tab: 'plan',
    title: '🎉 5. 推进回合与新手礼包',
    body: '填满 6 个格子后，点击<b>「✅ 过完这一天」</b>即可推进半年人生！<br><br>恭喜你已经掌握了中国式家长的核心生存法则！特为你发放<b>【新手启蒙礼包】</b>（悟性+25，行动+25）助你起飞！',
    btn: '领取礼包，开启开挂人生 🎒',
    action: 'finish'
  }
],

/* 家长备忘录手册 (常驻攻略知识库) */
manual: [
  {
    id: 'loop',
    title: '核心玩法循环',
    icon: '🎯',
    summary: '挖脑洞 → 学技能 → 安排六件事 → 推进回合',
    content: '游戏按“回合”推进，每回合代表约半年。每回合标准行动循环为：<br><br>' +
      '<b>1. 挖脑洞</b>：翻格子收集悟性💡与属性，找钥匙🗝️通往深层并恢复体力。<br>' +
      '<b>2. 研习新技能</b>：消耗悟性学习新课程。五维属性越高，享受的折扣越大（最高可减免75%消耗）！<br>' +
      '<b>3. 安排六件事</b>：将已掌握的学习、娱乐、打工等项目自由排入6个槽位（可重复排课）。<br>' +
      '<b>4. 状态结算与大事件</b>：推进回合，迎来期末考、选秀、红包、竞选或面子对决。'
  },
  {
    id: 'stats',
    title: '数值平衡与防崩溃',
    icon: '⚖️',
    summary: '父母满意度、压力控制与心理阴影防线',
    content: '<b>• 父母满意度</b>：学习类课程能提高满意度，纯娱乐会降低满意度。满意度低于15%会被长辈连夜训诫扣减智商；满意度达到80%时可获得索取奖励。<br><br>' +
      '<b>• 压力值</b>：高强度学习会导致压力剧增，娱乐和睡大觉能释放压力。<br><br>' +
      '<b>• 心理阴影与生命线</b>：回合结束时若压力超过100%，溢出压力将永久转化为<b>心理阴影</b>！心理阴影达到100%时将触发【💔 BE·精神崩溃】结局，导致本代人生直接结束！'
  },
  {
    id: 'face',
    title: '特长选秀与面子对决',
    icon: '🏆',
    summary: '特长稀有度攻击力与选秀夺冠诀窍',
    content: '<b>• 特长领悟</b>：在日程中反复深入练习课程、体验高级娱乐或达成关键事件，均有机会觉醒特长牌！<br><br>' +
      '<b>• 面子对决伤害体系</b>：特长稀有度决定攻击力：<br>' +
      '  - ⚪ 普通：基础伤害 7 点<br>' +
      '  - 🔵 稀有：基础伤害 49 点<br>' +
      '  - 🟣 史诗：基础伤害 343 点<br>' +
      '  - 🟡 传说：基础伤害 2401 点（秒杀全场）！<br><br>' +
      '<b>• 特长选秀</b>：从幼儿园到高中共有4次选秀舞台。携带最高稀有度特长出战，夺冠可获高达500点悟性与大额面子！'
  },
  {
    id: 'exam',
    title: '考试升学与高考大关',
    icon: '🎓',
    summary: '中考分流、六科掌握度与高考两万满分',
    content: '<b>• 中考（第32回合）</b>：按各科掌握度分流至“职高 / 普高 / 重点”。考入重点高中可获得大幅的高中考分Buff与面子奖励。<br><br>' +
      '<b>• 高考（第44回合）</b>：人生大考，满分20000分！分数计算结合语数英物化生各科掌握度等级以及智商、记忆力属性加成。<br><br>' +
      '<b>• 录取分数线</b>：<br>' +
      '  - 专科：< 6000 分<br>' +
      '  - 二本：6000 ~ 10000 分<br>' +
      '  - 一本：10000 ~ 14000 分<br>' +
      '  - 211：14000 ~ 17000 分<br>' +
      '  - 985：17000 ~ 19000 分<br>' +
      '  - 清北：≥ 19000 分（解锁传说特长）！'
  },
  {
    id: 'lineage',
    title: '世代传承与家族底蕴',
    icon: '🧬',
    summary: '家族特长图鉴、先天遗传与阶层跨越',
    content: '<b>• 家族特长图鉴</b>：所有代数收集到的特长都会永久保存在家族档案中，越聚越多。<br><br>' +
      '<b>• 先天属性继承</b>：后代出生时自动继承上一代约 18% 的五维属性点数，且家族收录的特长总数越多，后代每回合属性自动成长速度越快！<br><br>' +
      '<b>• 门第与零花钱</b>：上一代的最终职业阶层将直接决定下一代开局的家庭门第（白手起家 → 温饱 → 小康 → 中产 → 高收入 → 领军精英）以及每回合发放的零花钱！'
  }
],

/* ---------- 家庭育儿流派系统 (v2.7) ---------- */
parentingStyles: [
  {
    id: 'tiger',
    name: '严父虎妈',
    icon: '📚',
    motto: '“少壮不努力，老大徒伤悲！”',
    desc: '学业日程行动点消耗-1，考试冲刺加成+25%，自然压力+5/回，禁绝娱乐索取。',
    actDiscountKinds: ['learn'],
    actDiscountVal: 1,
    turnStressMod: 5,
    examBuffBonus: 25,
    begFavor: { learn: 0.35, play: -1.0 }
  },
  {
    id: 'buddhist',
    name: '佛系散养',
    icon: '🍃',
    motto: '“健康开心就好，平淡是福。”',
    desc: '自然压力-8/回，阴影封顶60绝不崩溃，体魄成长+20%，每月零花钱-20%。',
    turnStressMod: -8,
    shadowCap: 60,
    phyGrowthBonus: 0.2,
    moneyRatio: 0.8,
    begFavor: { play: 0.30 }
  },
  {
    id: 'elite',
    name: '卷王世家',
    icon: '⭐',
    motto: '“要么不做，要做就必须第一！”',
    desc: '开局面子+50，开局零花钱+120，对决与选秀战力+25%，考试选秀非前列满意度-25。',
    initFace: 50,
    initMoney: 120,
    combatDamageRatio: 1.25,
    begFaceThresholdAdd: 25
  },
  {
    id: 'democratic',
    name: '民主知心',
    icon: '🤝',
    motto: '“我们永远是你最坚实的后盾。”',
    desc: '行动力上限+20，情商魅力成长+15%，满意度保底50，索取失败无心理阴影。',
    maxActBonus: 20,
    socialGrowthBonus: 0.15,
    minSat: 50
  }
],

/* ---------- 传家宝典籍与祖宅百宝阁 (v2.7) ---------- */
relics: [
  { id: 'relic_bike', n: '先祖的二八大杠', icon: '🚲', r: 3, desc: '行动力上限+30，每回合行动力恢复+10', perk: { maxAct: 30, actRegen: 10 } },
  { id: 'relic_paper', n: '黄冈状元手抄密卷', icon: '📜', r: 4, desc: '学习掌握度速度+25%，考分基础加成+350', perk: { learnSpeed: 0.25, examBase: 350 } },
  { id: 'relic_stock', n: '首富的原始股凭单', icon: '📈', r: 4, desc: '成年工资与分红+40%，开局压岁钱+150', perk: { salaryRatio: 0.4, seedMoney: 150 } },
  { id: 'relic_racket', n: '妈妈的双喜乒乓拍', icon: '🏓', r: 3, desc: '体魄+35，面子对决反弹伤害+40%', perk: { phy: 35, reflectRatio: 0.4 } },
  { id: 'relic_camera', n: '老海鸥胶片单反', icon: '📷', r: 3, desc: '想象魅力+30，选秀默认保底赠送1盏绿灯', perk: { img: 30, cha: 30, freeShowLight: 1 } },
  { id: 'relic_scarf', n: '青梅竹马手织围巾', icon: '🧣', r: 4, desc: '情商+35，全员初始好感+20，相亲求婚必成', perk: { eq: 35, initAff: 20, marryGuaranteed: true } },
  { id: 'relic_medal', n: '三道杠大队长红臂章', icon: '🎖️', r: 3, desc: '家庭面子开局+50，竞选演说基础得票+30%', perk: { face: 50, electionVoteRatio: 0.3 } },
  { id: 'relic_teapot', n: '祖传紫砂养生壶', icon: '🍵', r: 3, desc: '每回合压力自然消除+10，阴影恶化率-50%', perk: { stressRelief: 10, shadowMitigate: 0.5 } }
],

/* ---------- 同窗校友成年动态与人脉技能 (v2.7) ---------- */
alumniPerks: [
  {
    id: 'summer',
    adultTitle: '知名概念设计师',
    company: '新锐数字艺术工作室',
    skillName: '视觉概念赋能',
    skillDesc: '消耗15悟性，想象力+40，面子+25',
    cost: { insight: 15 },
    reward: { img: 40, face: 25 },
    quote: '“设计灵感就像捕风，和你聊完我又有新想法了！”'
  },
  {
    id: 'shenhan',
    adultTitle: '职业篮球运动员',
    company: '省男子职业篮球队',
    skillName: '体能强化特训',
    skillDesc: '消耗20行动力，体魄+45，压力-30',
    cost: { act: 20 },
    reward: { phy: 45, stress: -30 },
    quote: '“汗水从不骗人，走，上场跟我狠狠练一组折返跑！”'
  },
  {
    id: 'xiaomei',
    adultTitle: '百万MCN创始人',
    company: '星火泛娱乐传媒',
    skillName: '全网流量引爆',
    skillDesc: '消耗50元零花，面子+60，职场答辩好评加持',
    cost: { money: 50 },
    reward: { face: 60, promoBonus: 10 },
    quote: '“老同学的事就是我的头条！全网流量直接给你拉满！”'
  },
  {
    id: 'kongde',
    adultTitle: '国家实验室首席科学家',
    company: '国家深空与量子研究院',
    skillName: '顶尖前沿算力',
    skillDesc: '消耗25悟性，智商+50，记忆+30',
    cost: { insight: 25 },
    reward: { iq: 50, mem: 30 },
    quote: '“科学的尽头是浪漫，这套交叉算法模型你拿去参考。”'
  },
  {
    id: 'yuanyuan',
    adultTitle: '金牌猎头合伙人',
    company: '光辉国际人才咨询',
    skillName: '高阶职场内推',
    skillDesc: '消耗15行动力，月薪永久+80元，晋升几率提升',
    cost: { act: 15 },
    reward: { salaryAdd: 80, eq: 20 },
    quote: '“你的综合能力在市场上是稀缺标的，我亲自为你背书！”'
  },
  {
    id: 'lizhen',
    adultTitle: '硬核硬科技创投合伙人',
    company: '同创伟业资本',
    skillName: '创投资本跟投',
    skillDesc: '消耗30行动力，本回合零钱暴增200元',
    cost: { act: 30 },
    reward: { money: 200, cha: 20 },
    quote: '“认准你的方向，这笔天使跟投资金立即划拨到位！”'
  },
  {
    id: 'qixue',
    adultTitle: '全球电竞冠军队总教练',
    company: 'EDG电子竞技俱乐部',
    skillName: '通宵解压开黑',
    skillDesc: '消耗10行动力+15元，压力全部清零，情商与想象+25',
    cost: { act: 10, money: 15 },
    reward: { stressClear: true, eq: 25, img: 25 },
    quote: '“别把弦绷得太紧，今晚带你一命通关重温青春狂欢！”'
  }
],

/* ---------- 大学四向深造分支与成人期高阶日程 (v2.7) ---------- */
divergentPaths: [
  {
    id: 'academia',
    name: '🎓 硕博深造 · 科学巨匠',
    desc: '专精学术攻坚与前沿理论，通往两院院士与终身教授之巅。',
    focusAttrs: ['iq', 'mem'],
    badge: '国士无双',
    salaryBase: 650,
    jobTitle: '领军科学家'
  },
  {
    id: 'civil',
    name: '🏛️ 选调考公 · 经世济民',
    desc: '投身基层选调与机关施政，情商魅力兼备，通往主政一方之枢。',
    focusAttrs: ['eq', 'cha'],
    badge: '中流砥柱',
    salaryBase: 500,
    jobTitle: '市长主政'
  },
  {
    id: 'startup',
    name: '🚀 科技创业 · 时代独角兽',
    desc: '勇立时代潮头，经历天使融资洗礼，打造百亿估值硬核企业。',
    focusAttrs: ['img', 'phy'],
    badge: '时代骄子',
    salaryBase: 900,
    jobTitle: '独角兽之父'
  },
  {
    id: 'corporate',
    name: '💼 行业领军 · 大厂金领',
    desc: '深耕行业龙头企业，掌舵核心战略业务，稳健年薪百万。',
    focusAttrs: ['iq', 'eq'],
    badge: '商业合伙人',
    salaryBase: 800,
    jobTitle: '集团总裁'
  }
],
branchActions: [
  { id: 'act_paper_top', name: '顶刊SCI攻坚', icon: '📑', branch: 'academia', act: 3, attr: { iq: 35, mem: 25 }, insight: 15, stress: 8, tone: 'learn', desc: '攻关权威核心学术期刊' },
  { id: 'act_national_lab', name: '国家重大科研论证', icon: '🔬', branch: 'academia', act: 3, attr: { iq: 45 }, face: 20, stress: 10, tone: 'learn', desc: '参与国家级重大课题' },
  { id: 'act_civil_exam', name: '申论策论研习', icon: '📜', branch: 'civil', act: 3, attr: { eq: 30, mem: 25 }, stress: 6, tone: 'learn', desc: '研习公共治理与策论公文' },
  { id: 'act_grassroots', name: '基层民生走访调研', icon: '🚶‍♂️', branch: 'civil', act: 3, attr: { eq: 40, cha: 30 }, sat: 10, stress: 8, tone: 'learn', desc: '深入一线倾听民声' },
  { id: 'act_pitch_deck', name: '商业计划书打磨', icon: '📊', branch: 'startup', act: 3, attr: { img: 35, iq: 20 }, stress: 8, tone: 'learn', desc: '打磨核心商业壁垒与盈利模型' },
  { id: 'act_vc_roadshow', name: '顶级创投融资路演', icon: '🎙️', branch: 'startup', act: 3, attr: { cha: 40 }, money: 200, stress: 15, tone: 'job', desc: '面向顶级天使投资人脱稿路演' },
  { id: 'act_corp_strategy', name: '跨国战略项目谈判', icon: '🤝', branch: 'corporate', act: 3, attr: { eq: 35, iq: 30 }, stress: 10, tone: 'learn', desc: '主导集团关键商业合作谈判' },
  { id: 'act_tech_deliver', name: '核心系统架构重构', icon: '💻', branch: 'corporate', act: 3, attr: { iq: 25, phy: 20 }, money: 150, stress: 12, tone: 'job', desc: '带领技术团队攻坚大型分布式系统' }
],

/* ---------- 游戏版本与更新日志 ---------- */
version: 'v2.8.5',
changelog: [
  {
    ver: 'v2.8.5',
    date: '2026-10-08',
    title: '街机格斗 · 面子对决 3.0 与交锋台词特写震撼登场',
    tag: '重大更新',
    desc: '深度进化原版面子对决（Face Battle）至 3.0 街机格斗版！街机双层残影血条、双向突进受创闪红、怒气必杀爆发、K.O.慢放定格图章，以及巨型红绿漫画对峙气泡与震撼居中台词横幅全线实装！并全面强化每次更新自动唤起通知机制。',
    highlights: [
      {
        icon: '🥊',
        title: '街机格斗打击感：双层残影血条与突进受创闪红',
        desc: '重构对决血条为街机残影过渡（Hit-lag），出招双方双向突进冲刺，受击方即刻震颤后仰闪红并喷射暴击跳字！'
      },
      {
        icon: '💬',
        title: '交锋台词醒目化：巨型漫画对话气泡与居中特写横幅',
        desc: '亲戚挑衅与我方回怼升级为大号漫画对白气泡（深赤红 vs 翡翠绿），配合招式徽章与居中全屏特写横幅，动态逐字浮现与全屏微震，戏剧张力拉满！'
      },
      {
        icon: '🔥',
        title: '老妈怒气必杀爆发与 K.O. 慢动作定格',
        desc: '承受挑衅蓄满怒气释放【全区优秀典型】毁灭打击；战胜对手触发 1.2 秒街机 slow-motion 慢镜头，并重重砸下朱红金边【K.O.】定格印章！'
      },
      {
        icon: '🏆',
        title: '才艺选秀结算弹窗置顶防插队',
        desc: '修复选秀夺冠后结算弹窗被随机成长事件插队拦截的问题，确保登台、三灯全亮、夺冠公报全流程连贯呈现！'
      },
      {
        icon: '📢',
        title: '每次发版自动唤起与自愈感知机制',
        desc: '严格规范发版机制与版本探测，每次代码更新后玩家刷新页面将 100% 自动置顶弹出全新更新日志与特性速览，不再遗漏任何精彩内容！'
      }
    ]
  },
  {
    ver: 'v2.8.0',
    date: '2026-10-08',
    title: '原汁原味 · 原版面子对决经典还原大升级',
    tag: '经典还原',
    desc: '深度对齐《中国式家长》原版面子对决（Face Battle）精髓！原版五大亲戚阵容登场、特长单场单次出战消耗、品质专属暴击/削弱/降维真伤、保底客套赔笑、亲戚挑衅气泡与索取成长飞轮全面闭环实装！',
    highlights: [
      {
        icon: '👵',
        title: '五大经典亲戚登门对决',
        desc: '远房表嫂(早教优越)、二姨(才艺培训)、二舅妈(学科奥数)、周阿姨(综合素质)、大姑(名校保送)五场标志性人生大考全线实装！'
      },
      {
        icon: '🃏',
        title: '特长单场单次消耗制',
        desc: '每项已学特长在一场对决中只能使用一次，出战后即刻变灰锁定并加盖【已出战】印章，深度考验平日特长积累与临场出牌策略！'
      },
      {
        icon: '✨',
        title: '特长品阶专属原版特效',
        desc: 'Rank 1 普通稳定输出，Rank 2 稀有 35% 震撼暴击，Rank 3 史诗深度压制削弱对手攻击 40%，Rank 4 传说降维破防直取首级！'
      },
      {
        icon: '😅',
        title: '特长耗尽保底【客套赔笑】',
        desc: '特长全部打光或未学特长时，系统提供唯一的中国式人情世故保底招式，化解尴尬勉强反击，绝不卡死！'
      },
      {
        icon: '💬',
        title: '现场交锋气泡与索取正向飞轮',
        desc: '战场实时渲染亲戚炫耀台词与老妈犀利回怼气泡；终局战报增设【向父母索取】进阶指南，形成面子提升解锁高阶器材特长的完美成长飞轮！'
      }
    ]
  },
  {
    ver: 'v2.7.0',
    date: '2026-10-08',
    title: '重磅年度资料片 · 育儿流派/祖宅百宝阁/校友人脉/脑洞2.0连击/大学四向人生岔路',
    tag: '年度资料片',
    desc: '全面实装五大深度玩法体系！从四大育儿风格流派、世代传承祖宅百宝阁，到同窗成人期校友人脉羁绊、脑洞2.0神经突触连锁共鸣，以及大学期四向深造与成人期职业岔路，构筑多维度家族兴衰史诗！',
    highlights: [
      {
        icon: '🏠',
        title: '家庭育儿风格流派',
        desc: '虎妈狼爸、佛系放养、精英鸡娃、民主伙伴四大特色育儿流派随机降临，赋予专属被动特权与真实家庭成长阻力！'
      },
      {
        icon: '🏺',
        title: '传家宝与祖宅百宝阁',
        desc: '老式凤凰单车、首届高考准考证、原始股认购证等8大稀世传家宝，祖宅百宝阁陈列，双槽位装备世代永续加成！'
      },
      {
        icon: '👥',
        title: '同窗校友圈与成人人脉',
        desc: '成年步入大学与职场后，昔日同窗好友转化为各领域行业精英，关键时刻提供学术引荐、融资背书、政务咨询与资源倾斜！'
      },
      {
        icon: '🧠',
        title: '脑洞 2.0 神经突触连击共鸣',
        desc: '同色邻接连击倍率机制爆发！3+连锁触发潜意识蔓延，5+连锁激活高维顿悟并返还行动点，点亮特色脑域奇迹！'
      },
      {
        icon: '🎓',
        title: '大学四向深造与人生岔路',
        desc: '高考后开启学术深造、政界公职、创业风投、名企骨干四向专业分支，解锁专属进阶行动与四大顶级人生终局成就！'
      }
    ]
  },
  {
    ver: 'v2.6.1',
    date: '2026-09-30',
    title: '体验升级 · 日程学段生命周期过滤与幼年动作退役',
    tag: '最新',
    desc: '深度对齐 Steam 原版法则：告别高龄还在地上爬行翻身的荒诞体验！建立严格学段动作过滤、刚升阶段平滑过渡兜底与大学高阶专业技能职场终身保留体系。',
    highlights: [
      {
        icon: '👶',
        title: '幼年基础动作彻底退役隐退',
        desc: '翻身、爬行、学说话、学走路、玩具与讲故事仅在婴儿期出现！进入幼儿园及后续阶段后彻底隐退，告别初高中与职场依然翻身的违和感！'
      },
      {
        icon: '🎒',
        title: '学段学科更迭与过渡保底',
        desc: '日程面板按小学、初中、高中当前学段展示对应学科，列表清爽专注；刚升阶段未学当期新课时，智能提供上一学段平滑过渡兜底，防空置防卡死！'
      },
      {
        icon: '💼',
        title: '大学专业技能职场终生深造',
        desc: '大学研习的计算机算法、学术论文、量化金融、工科攻坚等专业技能在职场期继续保留，作为职业技能提升与打工日程无缝协同！'
      },
      {
        icon: '🏷️',
        title: '排课面板学段动态感知标签',
        desc: '日程行动池标题随学段动态呈现（幼儿园学业/小学学业/初中学业/高中备考/大学深造/职场研习），沉浸感全面提升！'
      }
    ]
  },
  {
    ver: 'v2.6.0',
    date: '2026-09-30',
    title: '重磅特辑 · 全系小游戏 2.0 终极重塑 (面子对决/特长选秀/班干部竞选)',
    tag: '重大更新',
    desc: '基于过年收红包的五步重塑方法论，全系统三大经典小游戏全面进化！特长手牌卡组与四大羁绊、Showtime 节拍演出与绝活加演、三大选民阵营博弈与光荣三道杠聘书全线实装！',
    highlights: [
      {
        icon: '⚔️',
        title: '面子对决 2.0：手牌构筑与老妈必杀',
        desc: '特长卡牌化出招，四大流派羁绊强力加成！对手心理破防值达 100% 触发当场石化瘫痪跳回合，老妈怒气爆发释放全区优秀典型毁灭暴击！'
      },
      {
        icon: '🌟',
        title: '特长选秀 2.0：Showtime 节拍与绝活返场',
        desc: '张教授/麦克/李主任三大评委差异化审美偏好！登台触发 3.5 秒 Showtime 节拍点题微操，濒危淘汰边缘还可消耗体力触发【绝活加演 (Encore)】绝境翻盘！'
      },
      {
        icon: '🗳️',
        title: '班干部竞选 2.0：三大选民阵营与任命聘书',
        desc: '全班 50 票细分为学霸尖子圈、中立吃瓜圈与后排活跃圈！策略相互克制（零食收割后排、学术拿下学霸），终局颁发光荣三道杠正式任命聘书！'
      },
      {
        icon: '🏆',
        title: '沉浸式战果公报与多端按键闭环',
        desc: '各大游戏均彻底告别瞬闭弹窗，由专属战报卡片、评委金牌与大印章公报承接，全面支持鼠标点击与键盘 Space / Enter 便捷确认！'
      }
    ]
  },
  {
    ver: 'v2.5.0',
    date: '2026-09-30',
    title: '春节特辑 · 过年收红包推拉动态平衡与原版QTE拔河对决',
    tag: '历史',
    desc: '深度复刻《中国式家长》原版红包拔河精髓！引入亲戚性格物理力学Profile、阻尼惯性微操、脱靶开局、最后1.5秒冲刺与键盘空格/方向键连击对抗！',
    highlights: [
      {
        icon: '🧧',
        title: '原版QTE动态拔河阻尼物理引擎',
        desc: '彻底告别开局躺赢与无脑结算！游标受长辈推力、客套反向力、空气阻尼与实时微冲量共同作用，真实还原指尖拉扯的微妙人情世故。'
      },
      {
        icon: '👥',
        title: '亲戚性格动力学与阶段难度梯度',
        desc: '热情大姑妈（持续猛塞）、假意客套二叔（暗中缩手）、豪爽表舅（波动振荡与冲刺）各具特色；从幼儿期到高中冲刺期难度阶梯收紧！'
      },
      {
        icon: '⌨️',
        title: '多端微操与冲刺心跳决胜',
        desc: '支持键盘空格键 (Space) 与 ← / → 连续敲击对抗，倒计时最后 1.5 秒进入泛红心跳冲刺，并贴心提供保底跳过选项。'
      }
    ]
  },
  {
    ver: 'v2.4.0',
    date: '2026-09-30',
    title: '体验升级 · 属性动效直观化与脑洞钥匙两段式下潜',
    tag: '历史',
    desc: '全新上线顶部属性增长实时动态浮标特效、脑洞钥匙聚焦锁定与两段式下潜机制，并精修家族记忆录弹窗正圆视觉细节！',
    highlights: [
      {
        icon: '✨',
        title: '顶部属性与资源增长动态浮标',
        desc: '引入属性变动 Diff 引擎，六维属性与四大核心资源增长时，卡片上方冒出翠绿/金色 +N 浮动徽章并伴随温和呼吸脉冲光效，数值成长直观清晰！'
      },
      {
        icon: '🗝️',
        title: '脑洞钥匙两段式聚焦与手动下潜',
        desc: '挖出钥匙（直挖或炸弹波及）后盘面不再突兀跳刷！钥匙格子显露并进入金色聚焦脉冲锁定状态，点击高亮钥匙才正式开启通道下潜，告别误触与跳闪。'
      },
      {
        icon: '🎨',
        title: '弹窗正圆几何形态与排版精修',
        desc: '修复家族记忆录及各系统弹窗右上角关闭按钮，锁定 aspect-ratio 比例消除弹性形变，确保全设备视口下绝对正圆。'
      }
    ]
  },
  {
    ver: 'v2.3.0',
    date: '2026-09-29',
    title: '百年传承 · 华夏人生全景宏图大更新 (7 大演进里程碑全面收官)',
    tag: '里程碑',
    desc: '全方位重构七大核心演进系统：树状家族图谱、双向同学羁绊、原生中国风BGM、大学深造大厂实习与时代浪潮大抉择！',
    highlights: [
      {
        icon: '📜',
        title: '百年家族树状画卷与当代苗裔',
        desc: '宗祠图谱全面革新为纵深青墨代际树状枝脉，高亮标定开基始祖与历代先祖荣誉图章，在世苗裔实时联动生平。'
      },
      {
        icon: '👥',
        title: '同学五阶羁绊、偶发约会与信物',
        desc: '好感度突破 100 封顶进阶至 150 青梅竹马，触发突发放学邀约大事件；高三终局互赠专属绝版毕业信物注入永久属性！'
      },
      {
        icon: '🎵',
        title: '原生 WebAudio 中国风五声 BGM',
        desc: '宫商角徵羽音律算法实时合成，支持三态切换与历史按键无缝兼容；新增高考终局、选秀夺冠与终身大事高潮专属音效！'
      },
      {
        icon: '🎓',
        title: '大学深造、大厂实习与时代风口',
        desc: '新增考研论文精读、导师实验室攻坚、秋招群面与头部大厂实习；新增移动互联风口、自媒体爆款、学区房置业等中年重大抉择！'
      },
      {
        icon: '🔁',
        title: '一键延续日程与智能自适应降级',
        desc: '一键秒复用上回合六项日程安排；当体力不足时自动智能降级至低体力消耗替代项，大幅提升后期游玩舒适度。'
      },
      {
        icon: '🧠',
        title: '脑洞探索 HUD 看板与行动力反馈',
        desc: '新增实时神经突触深度探照、竹管流光层级指示器、低行动力智能禁用遮罩与真实下潜震颤反馈。'
      }
    ]
  },
  {
    ver: 'v2.2.0',
    date: '2026-09-29',
    title: '家族记忆录 · 多存档槽位管理与跨端导入导出 (Round 1)',
    tag: '重要',
    desc: '正式上线独立 3 存档槽位系统、Base64 文本码跨端复制迁移与本地 JSON 离线安全备份！',
    highlights: [
      {
        icon: '💾',
        title: '3 独立游戏存档槽位',
        desc: '支持在槽位 1、槽位 2、槽位 3 之间自由切换，各自拥有独立的主角属性、人生阶段与百年家族谱系，支持多路线同时探索。'
      },
      {
        icon: '📋',
        title: '跨设备一键复制与恢复',
        desc: '支持一键生成 Base64 存档码，微信/QQ 粘贴即可在手机与电脑之间秒级迁移游戏进度，告别丢档焦虑。'
      },
      {
        icon: '📦',
        title: '离线 JSON 备份与老存档无损升迁',
        desc: '支持下载与读取本地 .json 存档文件；老玩家进入游戏自动无缝迁移至槽位 1，数据安全保驾护航。'
      }
    ]
  },
  {
    ver: 'v2.1.1',
    date: '2026-09-29',
    title: '顶栏UI双层重构与行动点防遮挡优化',
    tag: '优化',
    desc: '彻底解决右上角功能按钮遮挡行动力点数的问题，顶栏重构为元信息层与四维核心资源层。',
    highlights: [
      {
        icon: '⚡',
        title: '行动点与核心资源独立呈现',
        desc: '重构顶栏为双层架构，四维资源（面子/行动/零钱/悟性）采用专属卡片网格，高亮显示行动力点数，彻底告别遮挡。'
      },
      {
        icon: '🛠️',
        title: '功能工具栏内嵌归位',
        desc: '公告、教程、音效三枚按钮内嵌至顶栏第一层右侧，开始页操作栏收拢至 splash 内部，剔除全局漂浮层。'
      },
      {
        icon: '📱',
        title: '移动端窄屏自适应优化',
        desc: '适配 320px~520px 全尺寸屏幕，排版规整对称，点击交互与数据读取更加舒适清爽。'
      }
    ]
  },
  {
    ver: 'v2.1.0',
    date: '2026-09-28',
    title: '全系统逻辑防御加固 & 模态与存档安全大升级',
    tag: '优化',
    desc: '深度修复界面事件穿透泄漏、老存档迁移空值修复、参数防穿透以及 PWA 离线运行稳定性。',
    highlights: [
      {
        icon: '🛡️',
        title: '模态框事件边界隔离',
        desc: '彻底修复遮罩点击事件残留导致高考、竞选、选秀等核心系统弹窗意外关闭中断卡死的问题。'
      },
      {
        icon: '💾',
        title: '老存档无损自愈迁移',
        desc: '自动修复旧版本或残缺存档中缺失的魅力(cha)、心愿点、家族历史与日志等关键数据，杜绝 NaN 与白屏报错。'
      },
      {
        icon: '💼',
        title: '职场晋升持久化与入参防御',
        desc: '强化年中职级答辩晋升数据持久化至家族谱系，对红包、选秀、竞选等多态交互入参增加边界区间截断保护。'
      },
      {
        icon: '⚡',
        title: 'PWA 离线 Service Worker 加固',
        desc: '升级离线缓存架构为 v2，使用 Promise.allSettled 容错加载机制，弱网与断网环境下极速秒开畅玩。'
      }
    ]
  },
  {
    ver: 'v2.0.0',
    date: '2026-09-27',
    title: '特长选秀、班干部竞选、浪漫求婚与职场答辩',
    tag: '重大更新',
    desc: '全生命周期沉浸感大版本！四大全新专属博弈舞台上线，开启多样化成长路线。',
    highlights: [
      {
        icon: '🌟',
        title: '特长才艺选秀大会交互舞台',
        desc: '四大成长阶段自主检录特长登台竞技，三位性格迥异的评委举牌亮灯（💡亮灯/❌灭灯），赢取悟性大奖与丰厚面子！'
      },
      {
        icon: '🗳️',
        title: '班干部三向竞选演说博弈',
        desc: '班级讲台直面竞争对手，亲民/才艺/零食/施政四大经典策略多轮拉票，角逐班级中队长任命公报！'
      },
      {
        icon: '💘',
        title: '校园恋人浪漫求婚 & 长辈相亲角',
        desc: '高好感同窗专属告白立绘与深情语录，公园相亲角三大职业相亲对象，伴侣先天天赋全额遗传给下一代！'
      },
      {
        icon: '💼',
        title: '职场期年中绩效考核与晋升答辩',
        desc: '解锁赶项目/带薪摸鱼/考证书等职场日程；年中答辩三大攻坚策略，晋升主管/总监/合伙人，月薪暴涨！'
      },
      {
        icon: '📱',
        title: '脑洞连环爆炸震屏 & PWA 离线运行',
        desc: '挖出炸弹触发真实贝塞尔曲线屏幕震颤与周边8格连锁爆破；支持添加到桌面作为独立 App 离线极速运行。'
      }
    ]
  },
  {
    ver: 'v1.3.0',
    date: '2026-09-26',
    title: '过年红包推拉、面子对决回合制与同学送礼深度交互',
    tag: '趣味玩法',
    desc: '深度还原中国式过年与人情世故，带来趣味横生的动态博弈体验。',
    highlights: [
      {
        icon: '🧧',
        title: '过年收红包推拉动态平衡',
        desc: '“使不得”与“真不要”之间的客套拉扯！精准把握指针停在黄金平衡区，赢取双倍压岁钱与亲友赞叹。'
      },
      {
        icon: '⚔️',
        title: '亲友面子对决回合制交锋',
        desc: '面对亲戚的凡尔赛炫耀，运用见招拆招、借力打力与特长绝技展开心理防线博弈，击溃对方气势。'
      },
      {
        icon: '👥',
        title: '同学社交背包定向送礼',
        desc: '10位性格迥异的同窗好友，专属喜好暴击台词，赠送心仪礼物好感度大幅翻倍！'
      },
      {
        icon: '🎁',
        title: '向父母索取独立面板与心愿单',
        desc: '全新独立心愿单货架，自由查看全套大件心愿（全套漫画、任天堂游戏机、山地车），预览成功率与属性增益。'
      }
    ]
  },
  {
    ver: 'v1.2.0',
    date: '2026-09-25',
    title: '高考志愿梯度填报与百年家族谱系成就系统',
    tag: '系统更新',
    desc: '高考升学与家族代际传承体系全面进化。',
    highlights: [
      {
        icon: '🎓',
        title: '高考志愿梯度填报',
        desc: '满分20000分！语数英物化生六科考分结合，填报985/211/双一流大学，毕业对口解锁高级专业技能。'
      },
      {
        icon: '📜',
        title: '百年家族谱系树与成就墙',
        desc: '历代族谱代际生平追溯，解锁高考状元、商界首富、白手起家等12项家族永久成就。'
      }
    ]
  },
  {
    ver: 'v1.1.0',
    date: '2026-09-24',
    title: '全阶段事件题库扩充与成长节奏平衡',
    tag: '内容扩充',
    desc: '扩充 73 组全成长阶段事件分支，优化日程自动排满防崩溃算法。',
    highlights: [
      {
        icon: '📖',
        title: '73 组全阶段专属事件题库',
        desc: '从婴儿期抓周、幼儿园换牙、初中中考分流到高中模考与大学社团，生活细节全面覆盖。'
      }
    ]
  },
  {
    ver: 'v1.0.0',
    date: '2026-09-20',
    title: '中国式家长 H5 自娱版正式上线',
    tag: '首发上线',
    desc: '从出生到高考再到成家立业与世代传承，原生纯前端单机养成模拟器正式上线！',
    highlights: [
      {
        icon: '👶',
        title: '经典成长模拟循环',
        desc: '脑洞探索、日程安排、德智体美劳全方位属性平衡、特长领悟与世代底蕴传承。'
      }
    ]
  }
]
};