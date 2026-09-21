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
],

/* 打工(初中起) */
payjobs: [
  {id:'pj-fly',  name:'发传单',        icon:'📄', phase:'junior',  money:30, stress:2, attr:{phy:1}},
  {id:'pj-tutor',name:'给低年级补课',  icon:'🧑‍🏫', phase:'junior',  money:45, stress:2, attr:{iq:1,eq:1}},
  {id:'pj-net',  name:'网吧夜班网管',  icon:'🖥️', phase:'junior',  money:35, stress:-1, attr:{}},
  {id:'pj-int',  name:'公司实习打杂',  icon:'💼', phase:'college', money:90, stress:3, attr:{eq:2}},
],

/* ---------- 特长(图鉴/价格=稀有度系数) ---------- r: 1普 2稀 3史 4传说 */
talentData: [
  {id:'tuyasha',     n:'小涂鸦师',   icon:'🖍️', r:1, src:'涂鸦'},
  {id:'gushiren',    n:'古诗背篓',   icon:'🏮', r:1, src:'背古诗'},
  {id:'danci',       n:'单词背篓',   icon:'🔤', r:1, src:'英语单词'},
  {id:'xiaozuojia',  n:'日记小作家',  icon:'✍️', r:1, src:'写日记'},
  {id:'wulidashi',   n:'物理小咖',   icon:'⚡', r:1, src:'物理入门'},
  {id:'shuo',        n:'说书先生',   icon:'🏛️', r:1, src:'历史故事'},
  {id:'jianghu',      n:'武侠迷',     icon:'🗡️', r:1, src:'武侠小说'},
  {id:'qintong',     n:'琴童',       icon:'🎹', r:2, src:'电子琴'},
  {id:'niuba',       n:'捏泥巴小当家',icon:'🧈', r:2, src:'橡皮泥'},
  {id:'aoshu',       n:'奥数苗子',   icon:'💡', r:2, src:'代与函数·奥数'},
  {id:'wenqing',     n:'文青',       icon:'📚', r:2, src:'名著阅读'},
  {id:'zuowen',      n:'写作小将',   icon:'🪶', r:2, src:'作文进阶'},
  {id:'xiaohuajia',  n:'少儿画家',   icon:'🎨', r:2, src:'美术课'},
  {id:'yishujia',    n:'艺术细胞',   icon:'🎭', r:2, src:'艺考集训'},
  {id:'chengxuyuan', n:'代码初学者', icon:'💻', r:2, src:'电脑入门'},
  {id:'games',     n:'小霸王游戏王', icon:'👾', r:2, src:'小霸王'},
  {id:'yundong',   n:'运动健儿',   icon:'🏃', r:2, src:'体育课'},
  {id:'jiazui',    n:'压轴题杀手', icon:'🧮', r:3, src:'数学压轴'},
  {id:'gods',       n:'五指琴魔',   icon:'🎹', r:4, src:'钢琴十级'},
  {id:'nianshen',    n:'捏泥成神',   icon:'🧸', r:4, src:'橡皮泥大师'},
  {id:'gaokao',      n:'状元苗子',   icon:'👑', r:4, src:'高考'},
],

/* ---------- 随机事件 ---------- props: phases 适用阶段数组 */
events: [
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
],

/* 阶段时钟与升学 */
phases: {
  name: t => t<=8?'婴儿期': t<=14?'幼儿园':t<=24?'小学':t<=32?'初中':t<=44?'高中':t<=50?'大学':t<=57?'工作了':'成家后',
  baby:1, kinder:9, pri:15, junior:25, senior:33, college:45, work:51, end:58,
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

/* 面子对决的对手 */
rivals: [
  {id:'wangyi', n:'王姨的学霸儿子', icon:'🧑‍🎓', face:300, l:['史诗特长','奥数金牌','全科满分'], style:'学神'},
  {id:'fang', n:'有钱叔叔的孩子', icon:'👦', face:200, l:['钢琴十级','双语幼儿园'], style:'凡尔赛'},
  {id:'liu', n:'隔壁刘婶的孙女', icon:'👧', face:180, l:['舞蹈比赛第一','长得还好看'], style:'美育战士'},
  {id:'chen', n:'表哥家小孙子', icon:'👶', face:120, l:['三岁背诗五十首'], style:'天才婴儿'},
],

/* 同学(可攻略) */
npcs: [
  {id:'summer', n:'苏软软', icon:'🌸', gender:'女', like:['妮妮\'s饼干','荧光笔'], intro:'后排安静的女孩,抽屉里贴满贴纸。', phase:'kinder'},
  {id:'shenhan', n:'沈寒', icon:'❄️', gender:'男', like:['游戏卡','篮球'], intro:'校队后卫,话少但很可靠。', phase:'junior'},
  {id:'xiaomei', n:'夏小美', icon:'🍡', gender:'女', like:['漫画书','小熊玩偶'], intro:'爱笑,笑声一响全班都知道。', phase:'pri'},
  {id:'lizhen', n:'李振', icon:'🔥', gender:'男', like:['跑鞋','游戏机'], intro:'体育委员,运动会上发光。', phase:'junior'},
  {id:'yuanyuan', n:'媛媛', icon:'🧸', gender:'女', like:['奶茶券','化妆品'], intro:'喜欢化妆和可爱的东西。', phase:'junior'},
  {id:'kongde', n:'孔德', icon:'🤠', gender:'男', like:['望远镜','漫画'], intro:'天文社社长,偶尔中二。', phase:'senior'},
  {id:'qixue', n:'棋子', icon:'🎮', gender:'女', like:['游戏卡','漫画'], intro:'电竞梦想家,操场上开黑王。', phase:'senior'},
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

/* 高考分数线档位 */
gk: [
  {min:0,     n:'专科线', t:'大专院校'},
  {min:6000,  n:'二本线', t:'普通本科'},
  {min:10000, n:'一本线', t:'老牌一本'},
  {min:14000, n:'211线', t:'武大同期'},
  {min:17000, n:'985线', t:'985 高校'},
  {min:19000, n:'清北线', t:'清北'},
],
};