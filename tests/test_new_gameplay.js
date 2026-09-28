'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const dir = path.join(__dirname, '..', 'js');
const store = {};
const ctx = {
  console: console,
  Math, Date, JSON,
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
  },
};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(dir, 'data.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(dir, 'core.js'), 'utf8'), ctx);

const CP = ctx.CP;

console.log('--- 测试 1: 🧧 过年收红包推拉动态平衡结算 ---');
CP.newGame();
while (CP.pending().length) CP.resolve(0); // 清理开局 intro

const initMoney = CP.state().money;
const initFace = CP.state().face;

// 模拟触发红包
CP.state().pending.push({
  type: 'hongbao_duel',
  title: '🧧 过年收红包 · 推拉拉扯战',
  rel: '大姑妈',
  opts: [
    { label: '🤝 适度推脱，见好就收 (黄金平衡)' },
    { label: '✋ 坚决推辞到底 (推脱过猛)' },
    { label: '🤲 一把夺入囊中 (急切贪婪)' }
  ]
});

// 验证黄金平衡区间 (pos = 50)
const resGolden = CP.resolve({ pos: 50 });
assert(resGolden.includes('进退得体') || resGolden.includes('红包推拉大师'), '得体区间应获得大师评价');
assert(CP.state().face >= initFace + 20, '得体区间家庭面子增加+20');
assert(CP.state().money >= initMoney + 180, '得体区间应拿到180元以上红包');
console.log('黄金平衡结算断言通过:', resGolden);

// 验证推脱过猛 (pos = 15)
CP.state().pending.push({ type: 'hongbao_duel', title: '🧧 过年收红包', opts: ['好'] });
const mBefore = CP.state().money;
const resOverRefuse = CP.resolve({ pos: 15 });
assert(resOverRefuse.includes('推辞得过于逼真') || resOverRefuse.includes('0 元'), '推脱过猛拿到0元');
assert.strictEqual(CP.state().money, mBefore, '推脱过猛零钱不变');
console.log('推脱过猛结算断言通过:', resOverRefuse);

console.log('\n--- 测试 2: ⚔️ 面子对决交互回合制战斗 ---');
CP.state().turn = 28;
while (CP.pending().length) CP.resolve(0);
// 手动研习一门特长
CP.state().talents = ['aoshu'];
// 触发面子对决
CP.state().faceDuel = {
  n: 0,
  opp: { id: 'wangyi', name: '王阿姨', hp: 300, maxHp: 300, atk: 45, lines: ['我家小明奥数金牌'] },
  myHp: 400, maxMyHp: 400, round: 1, maxRound: 4, logs: [],
  defending: false, distracted: false, finished: false, won: false
};
CP.state().pending.push({
  type: 'face_duel',
  title: '⚔️ 家族面子大对决 vs 王阿姨',
  opts: [
    { label: '🌟 亮出主打特长' },
    { label: '😏 凡尔赛冷嘲热讽' },
    { label: '🛡️ 谦虚客套并反弹' },
    { label: '📢 战术干扰' }
  ]
});

// 第1轮：出招谦虚防守 (index 2)
CP.resolve(2);
assert(CP.state().faceDuel.myHp > 350, '防守回合应受到大幅减伤且回复气势');
console.log('第1轮交锋战斗日志:', CP.state().faceDuel.logs.slice(-2));

// 第2轮：出招凡尔赛心理反击 (index 1)
CP.resolve(1);
console.log('第2轮交锋战斗日志:', CP.state().faceDuel.logs.slice(-2));

// 第3轮：亮出特长攻击 (index 0)
CP.resolve(0);
console.log('第3轮交锋战斗日志:', CP.state().faceDuel.logs.slice(-2));

console.log('面子对决多轮交锋验证顺利通过！');

console.log('\n--- 测试 3: 👥 同学社交背包定向送礼与喜好暴击 ---');
while (CP.pending().length) CP.resolve(0);
// 切换为男主以匹配女同学
CP.state().gender = 'boy';
// 购买礼物进背包
CP.state().money = 200;
const shopList = CP.shop();
assert(shopList.length > 0, '商店商品列表正常');
CP.buy('st-biscuit');
assert(CP.bag()['st-biscuit'] >= 1, '购买后应存入背包');

// 送给喜欢饼干的苏软软
const giftRes = CP.giftItem('summer', 'st-biscuit');
assert.strictEqual(giftRes.isFav, true, '送出偏好礼物应触发喜好暴击');
assert(giftRes.g >= 22, '喜好暴击好感度增加应大于等于22');
assert(giftRes.quote.length > 0, '应返回专属感谢台词');
assert.strictEqual((CP.bag()['st-biscuit'] || 0), 0, '赠送后背包道具应被扣减');
console.log('社交送礼喜好暴击验证通过:', giftRes);

console.log('\n--- 测试 4: 🎁 向父母索取独立面板与心愿机制 ---');
CP.state().wishPoints = 2;
CP.state().face = 100;
CP.state().sat = 85;
// 索取漫画大全 (face: 25)
const wishRes = CP.begWish('bg-ccd');
assert(wishRes.name === '全套漫画大全', '索取目标匹配');
assert.strictEqual(CP.wishPoints(), 1, '索取后扣除1次索取点数');
console.log('独立索取心愿验证通过:', wishRes);

console.log('\n--- 测试 5: 🎓 高考志愿填报与专业对口职场加成 ---');
while (CP.pending().length) CP.resolve(0);
CP.state().pending.push({
  type: 'gaokao_apply',
  title: '🎓 高考放榜 & 志愿填报',
  score: 18000,
  opts: [{ id: 'cs' }, { id: 'med' }, { id: 'fin' }]
});
CP.resolve(0); // 选择计算机专业
assert.strictEqual(CP.state().major, 'cs', '专业成功设定为计算机');
assert(CP.state().learnedCourses.includes('u-cs'), '应自动解锁计算机专业高级课程');
console.log('高考专业填报与技能解锁验证通过！');

console.log('\n--- 测试 6: 📜 家族百年谱系树与成就系统 ---');
// 模拟世代交接
while (CP.pending().length) CP.resolve(0);
CP.state().turn = 59;
CP.state().gaokaoScore = 19500;
CP.state().job = { id: 'j-first', n: '首富', icon: '💰', t: 5 };
CP.state().spouse = { name: '苏软软', tag: '校园恋人' };
CP.autoFillSlots();
CP.endTurn();
assert.strictEqual(CP.pending()[0].type, 'endgen', '回合60应触发世代终章');
CP.resolve(0); // 触发 nextGen

const fam = CP.fam();
assert(fam.history && fam.history.length >= 1, '家族历代谱系应记录祖先');
const ancestor = fam.history[0];
assert.strictEqual(ancestor.job, '首富', '祖先职业正确');
assert.strictEqual(ancestor.spouse, '苏软软', '祖先配偶正确');
assert(fam.achievements.includes('ach-gk-top'), '应解锁状元及第成就');
assert(fam.achievements.includes('ach-first-rich'), '应解锁时代首富成就');
assert(fam.achievements.includes('ach-love-true'), '应解锁青梅竹马成就');
console.log('家族谱系记录:', fam.history[0]);
console.log('家族解锁成就列表:', fam.achievements);

console.log('\n--- 测试 7: 🌟 特长才艺选秀大会交互舞台与三评委亮灯 ---');
while (CP.pending().length) CP.resolve(0);
CP.state().turn = 31; // 初中青春季才艺汇演 (Tier 3)
CP.state().talents = ['aoshu', 'wenqing', 'jiazui']; // 拥有 Rank 2 和 Rank 3 特长
const talentList = CP.talentsList();
assert.strictEqual(talentList.length, 3, '应检录出3项掌握特长');

// 触发选秀
CP.state().pending.push({
  type: 'show',
  tier: 3,
  title: '初中青春季才艺汇演',
  judges: [
    { name: '张教授', icon: '🧐' },
    { name: '麦克老师', icon: '🕶️' },
    { name: '李主任', icon: '👩‍🏫' },
  ],
  rival: {
    name: '初三文体委员',
    talent: { id: 'qintong', n: '琴童', r: 2, icon: '🎹', atk: 49 }
  },
  opts: ['🎤 登台一展风采']
});

const preInsight = CP.state().insight;
// 派出身怀史诗特长【压轴题杀手】(Rank 3) 出战
const showRes = CP.resolve({ talentId: 'jiazui' });
assert(CP.pending().length > 0 && CP.pending()[0].type === 'showr', '表演后应进入结算模态框');
const showrModal = CP.pending()[0];
assert(Array.isArray(showrModal.lights) && showrModal.lights.length === 3, '应包含三位评委亮灯数据');
assert(Array.isArray(showrModal.judgeQuotes) && showrModal.judgeQuotes.length === 3, '应包含三位评委点评');
assert(showrModal.gi >= 40, '应获得选秀悟性奖励');
console.log('选秀表现结算:', {
  win: showrModal.win,
  greenCount: showrModal.greenCount,
  lights: showrModal.lights,
  mine: showrModal.mine.n,
  rival: showrModal.rival.talent.n,
  gi: showrModal.gi,
  gf: showrModal.gf,
  quotes: showrModal.judgeQuotes
});

// 点击走下舞台完成选秀
CP.resolve(0);
assert.strictEqual(CP.pending().length, 0, '走下舞台后模态框已关闭');
assert(CP.state().insight >= preInsight + 40, '悟性已成功发放');
console.log('特长才艺选秀专属交互舞台与三评委亮灯验证完全通过！');

console.log('\n--- 测试 8: 🗳️ 班干部三向竞选演说策略博弈台 ---');
while (CP.pending().length) CP.resolve(0);
CP.state().turn = 18;
CP.state().attrs.eq = 120;
CP.state().attrs.iq = 120;
CP.state().money = 100;
CP.state().talents = ['aoshu'];
const preFace = CP.state().face;

// 触发班干部竞选
CP.state().pending.push({
  type: 'election',
  title: '🗳️ 班干部三向竞选演说大会',
  opts: [
    { label: '🤝 亲民路线·倾听心声' },
    { label: '🌟 才艺展示·硬核特长' },
    { label: '🍭 零食许诺·请客公关' },
    { label: '📜 严密施政·学业互助' }
  ]
});
// 手动同步初始化 election 数据模型
CP.state().election = {
  round: 1, maxRound: 3, myVotes: 0,
  rival: { name: '王小明', title: '原班长', icon: '🧑‍🏫', motto: '带领全班第一！', votes: 0 },
  totalVotes: 50, targetVotes: 26, logs: [], finished: false, won: false
};

// 第1轮演说: 出招亲民路线 (index 0)
CP.resolve(0);
const el1 = CP.state().election;
assert(el1.myVotes > 0, '第1轮演说应斩获票数');
assert(el1.rival.votes > 0, '对手也应拉到选票');
assert.strictEqual(el1.round, 2, '应进入第2轮');
console.log('第1轮拉票得票:', el1.myVotes, '对手:', el1.rival.votes);

// 持续演说拉票直到决出胜负 (过半门槛或3轮结标)
let safety = 0;
while (!CP.state().election.finished && safety++ < 5) {
  CP.resolve(1);
}
assert(CP.state().election.finished, '竞选演说必须决出胜负并结算完成');
assert(CP.pending().length > 0 && CP.pending()[0].type === 'news', '应弹出竞选终局任命公报');
const newsModal = CP.pending()[0];
console.log('竞选终局得票: 我方 ' + CP.state().election.myVotes + ' vs 对手 ' + CP.state().election.rival.votes);
console.log('竞选结果公报:', newsModal.title, newsModal.body.split('\n')[0]);

// 确认就任并关闭任命公报
CP.resolve(0);
assert.strictEqual(CP.pending().length, 0, '就任后任命公报应已关闭');
console.log('班干部竞选演说多轮博弈与胜选任命验证全部通过！');

console.log('\n--- 测试 9: 💘 终局浪漫求婚与长辈相亲角专属舞台 ---');
while (CP.pending().length) CP.resolve(0);

// 1) 验证校园恋人浪漫求婚
CP.state().turn = 58;
CP.state().npcAff = { summer: 85 };
const preFaceM = CP.state().face;

// 触发求婚节点
CP.state().pending.push({
  type: 'marry',
  title: '💍 从校服到婚纱 · 浪漫求婚时刻',
  isCampus: true,
  cand: {
    id: 'summer',
    name: '苏软软',
    icon: '🌸',
    aff: 85,
    intro: '后排安静的女孩',
    bonus: { eq: 20, img: 25 },
    quote: '我一直在等你这句话……'
  },
  opts: ['💍 拿出钻戒，单膝跪地浪漫求婚！', '🍂 顺其自然，互道珍重 (专注事业)']
});

const marryModal = CP.pending()[0];
assert(marryModal.isCampus, '应正确识别为校园恋人求婚模式');
assert.strictEqual(marryModal.cand.name, '苏软软', '求婚对象应为苏软软');
assert.strictEqual(marryModal.cand.bonus.eq, 20, '应附带情商+20遗传加成');

// 拿出钻戒求婚 (index 0)
const proposeRes = CP.resolve(0);
assert(CP.state().spouse, '求婚成功后必须确立配偶');
assert.strictEqual(CP.state().spouse.tag, '校园恋人', '配偶标签应为校园恋人');
assert.strictEqual(CP.state().spouse.name, '苏软软', '配偶姓名应为苏软软');
assert.strictEqual(CP.state().spouse.bonus.eq, 20, '配偶专属遗传基因应成功绑定');
assert.strictEqual(CP.state().face, preFaceM + 40, '求婚成功家庭面子增加40');
console.log('校园恋人浪漫求婚验证通过:', proposeRes);

// 2) 验证长辈公园相亲角
while (CP.pending().length) CP.resolve(0);
CP.state().spouse = null;
CP.state().npcAff = {}; // 无校园羁绊
CP.state().face = 200;
CP.state().attrs.cha = 150;

CP.state().pending.push({
  type: 'marry',
  title: '💌 长辈公园相亲角 · 婚恋大抉择',
  isCampus: false,
  prob: 1.0, // 设定100%成功率以确保单元测试确定性
  blindCandidates: [
    { id: 'blind-doc', name: '三甲医院林医生', icon: '🩺', tag: '三甲名医', bonus: { iq: 20, mem: 15 } },
    { id: 'blind-gov', name: '机关单位李骨干', icon: '🏛️', tag: '体制内精英', bonus: { eq: 20, cha: 15 } }
  ],
  opts: ['约见林医生', '约见李骨干']
});

const blindModal = CP.pending()[0];
assert(!blindModal.isCampus, '应正确识别为相亲角模式');
assert.strictEqual(blindModal.blindCandidates.length, 2, '应包含相亲候选人列表');

// 约见林医生 (index 0)
const blindRes = CP.resolve(0);
assert(CP.state().spouse, '相亲成功后应确立配偶');
assert.strictEqual(CP.state().spouse.name, '三甲医院林医生', '应与林医生结为连理');
assert.strictEqual(CP.state().spouse.tag, '相亲良缘', '标签应为相亲良缘');
console.log('公园长辈相亲角约见相亲验证通过:', blindRes);

console.log('\n--- 测试 10: 💼 职场期年中绩效考核与晋升答辩 ---');
while (CP.pending().length) CP.resolve(0);

// 1) 验证职场专属娱乐日程
CP.state().turn = 52; // work 阶段
const workPlays = ['pl-work-ot', 'pl-work-fish', 'pl-work-cert', 'pl-work-banquet'];
const pList = CP.pool();
workPlays.forEach(pid => {
  const p = ctx.DATA.plays.find(x => x.id === pid);
  assert(p, '必须存在职场日程: ' + pid);
  assert(pList.some(item => item.id === pid), '职场期必须允许选择日程: ' + p.name);
});
console.log('职场期日程 (赶项目/带薪摸鱼/考专业证书/高端商务宴请) 检录可用！');

// 2) 验证 Turn 54 触发年中绩效考核与职级跃迁
CP.state().job = { id: 'prog', n: '软件开发工程师', icon: '💻', t: 1 };
CP.state().workSalary = 300;
CP.state().attrs.iq = 400; // 超高智商确保高绩效晋升
CP.state().attrs.mem = 400;
const preJobSalary = CP.state().workSalary;
const preJobFace = CP.state().face;

// 触发晋升考评
CP.state().turn = 54;
CP.state().pending.push({
  type: 'promotion',
  title: '💼 职场年中绩效考核与晋升答辩',
  job: CP.state().job,
  curTier: CP.state().job.t,
  salary: CP.state().workSalary,
  opts: [
    { label: '🚀 主攻业务突破与技术硬实力', sub: '依赖智商与记忆' },
    { label: '🤝 强调跨部门统筹与领导力', sub: '依赖情商与魅力' },
    { label: '📈 亮出攻坚克难与抗压战绩', sub: '依赖体魄与执行力' }
  ]
});

const promoModal = CP.pending()[0];
assert.strictEqual(promoModal.type, 'promotion', '应为 promotion 模态框');
assert.strictEqual(promoModal.curTier, 1, '当前 Tier 为 1');

// 答辩选择: 业务突破与硬实力 (index 0)
const promoRes = CP.resolve(0);
assert.strictEqual(CP.pending().length, 0, '答辩后模态框已关闭');
assert.strictEqual(CP.state().job.t, 2, '考核 S+ 后职级应晋升为 Tier 2');
assert(CP.state().job.n.includes('资深'), '岗位名称应冠以晋升级别前缀: ' + CP.state().job.n);
assert.strictEqual(CP.state().workSalary, Math.round(preJobSalary * 1.5), '晋升后月薪应暴涨 1.5 倍');
assert.strictEqual(CP.state().face, preJobFace + 50, '晋升成功后家庭面子应加 50');
console.log('年中绩效考核与职级擢升结算验证通过:\n' + promoRes);

console.log('\n--- 测试 11: 📱 脑洞连环爆炸机制与 PWA 离线应用支持 ---');
// 1) 验证脑洞连环爆破机制
CP.state().act = 50;
const brainObj = CP.brain.grid();
// 将索引 14 (r=2, c=2) 设为炸弹
brainObj[14].t = 'bomb';
brainObj[14].open = false;
// 保证周边 8 格未开
const r0 = 2, c0 = 2;
const surroundingIndices = [];
for (let j = 0; j < 36; j++) {
  if (j === 14) continue;
  const rj = Math.floor(j / 6), cj = j % 6;
  if (Math.abs(rj - r0) <= 1 && Math.abs(cj - c0) <= 1) {
    brainObj[j].open = false;
    brainObj[j].t = 'bulb'; // 设为灯泡便于断言
    surroundingIndices.push(j);
  }
}
assert.strictEqual(surroundingIndices.length, 8, '中心炸弹周边应有8个邻格');

const bombRes = CP.brain.rev(14);
assert(bombRes && bombRes.includes('💥'), '翻开炸弹应返回连环爆破反馈: ' + bombRes);
assert(brainObj[14].open, '炸弹自身应被翻开');
surroundingIndices.forEach(idx => {
  assert(brainObj[idx].open, '炸弹周边格子必须全部被连环波及翻开: 格子' + idx);
});
console.log('脑洞连环爆破与周边8格连锁翻开验证通过:', bombRes);

// 2) 验证 PWA manifest.json 与图标资源
const manifestPath = path.join(__dirname, '..', 'manifest.json');
assert(fs.existsSync(manifestPath), 'manifest.json 必须存在');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert.strictEqual(manifest.display, 'standalone', 'PWA 必须支持独立应用窗口');
assert(manifest.name && manifest.short_name, 'PWA 必须声明名称');
assert(manifest.icons && manifest.icons.length >= 3, 'PWA 必须包含图标数组');

const iconSvgPath = path.join(__dirname, '..', 'icon.svg');
const icon192Path = path.join(__dirname, '..', 'icon-192.png');
const icon512Path = path.join(__dirname, '..', 'icon-512.png');
assert(fs.existsSync(iconSvgPath) && fs.statSync(iconSvgPath).size > 100, 'icon.svg 必须有效');
assert(fs.existsSync(icon192Path) && fs.statSync(icon192Path).size > 100, 'icon-192.png 必须有效');
assert(fs.existsSync(icon512Path) && fs.statSync(icon512Path).size > 100, 'icon-512.png 必须有效');

// 3) 验证 Service Worker sw.js
const swPath = path.join(__dirname, '..', 'sw.js');
assert(fs.existsSync(swPath), 'sw.js 必须存在');
const swContent = fs.readFileSync(swPath, 'utf8');
assert(swContent.includes('PRECACHE_ASSETS'), 'Service Worker 必须声明预缓存静态资源');
assert(swContent.includes('caches.open'), 'Service Worker 必须支持离线缓存');
console.log('PWA 离线桌面与移动端应用配置 (manifest.json, sw.js, 图标集) 验证通过！');

console.log('\n--- 测试 12: 🎁 索取大件心愿面板渲染与0机会状态鲁棒性 ---');
// 建立轻量级 DOM Mock 测试 UI 层 openWishModal
const modalClassList = new Set();
let modalDataSet = {};
let modalChildren = [];
let modalInnerHtml = '';

const modalElem = {
  classList: {
    add: c => modalClassList.add(c),
    remove: c => modalClassList.delete(c),
    contains: c => modalClassList.has(c)
  },
  dataset: modalDataSet,
  children: modalChildren,
  appendChild: c => modalChildren.push(c),
  set innerHTML(val) { modalInnerHtml = val; if (val === '') modalChildren = []; },
  get innerHTML() { return modalInnerHtml; }
};

ctx.document = {
  querySelector: sel => (sel === '#modal' ? modalElem : { classList: { add: () => {}, remove: () => {} }, innerHTML: '', appendChild: () => {} }),
  querySelectorAll: () => [],
  createElement: tag => ({
    tagName: tag,
    className: '',
    innerHTML: '',
    style: {},
    children: [],
    appendChild(child) { this.children.push(child); }
  }),
  addEventListener: () => {}
};
ctx.AudioContext = class { createOscillator() { return { connect: () => {}, frequency: { setValueAtTime: () => {} } }; } createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; } };

// 加载 ui.js
vm.runInContext(fs.readFileSync(path.join(dir, 'ui.js'), 'utf8'), ctx);

// 设置索取机会为 0
CP.state().wishPoints = 0;
ctx.UI.openWishModal();

assert(modalElem.classList.contains('show'), '心愿模态框必须具备 show 类名');
assert.strictEqual(modalElem.dataset.customModal, 'wish', '心愿模态框标记必须为 wish');
assert(modalChildren.length > 0, '心愿模态框内容必须成功渲染（严禁白屏/仅模糊）');

const bodyElem = modalChildren[0];
const wishGrid = bodyElem.children.find(c => c.className === 'wish-grid');
assert(wishGrid, '必须包含 wish-grid 心愿列表容器');
assert.strictEqual(wishGrid.children.length, 6, '必须完整渲染 6 项大件心愿卡片');

const cardFirst = wishGrid.children[0];
const btnFirst = cardFirst.children.find(c => c.tagName === 'button');
assert(btnFirst, '心愿卡片必须存在操作按钮');
assert.strictEqual(btnFirst.textContent, '暂无次数', '0次数时按钮文本应为暂无次数');
assert(btnFirst.disabled, '0次数时按钮必须禁用');
console.log('0机会下点击心愿单渲染成功，全量卡片正常呈现，严禁白屏与函数未定义错误！');

console.log('\n🎉 全部五轮核心机制扩充、选秀/竞选/求婚/职场晋升/脑洞爆炸/PWA与心愿单渲染测试全部 100% 验证通过！');



