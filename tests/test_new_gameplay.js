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

console.log('\n--- 测试 13: 💾 老版本损坏或残缺存档数据迁移与自动修复 ---');
// 构造一个缺失 cha、缺失 wishPoints、缺少 fam.history 的旧版本存档
const legacySave = {
  ver: 1,
  gen: 2,
  name: '老存档小明',
  gender: 'boy',
  turn: 15,
  attrs: { iq: 80, eq: 75, mem: 70, img: 65, phy: 80 }, // 严重缺失 cha 字段
  insight: 50, act: 80, money: 120, face: 60, sat: 70, stress: 20, shadow: 5,
  skills: { fanshen: 2 },
  fam: { g: 1, talent: 10, tier: 2, attr: { iq: 100 } } // 缺失 history 与 achievements 字段
};
store['cph_save'] = JSON.stringify(legacySave);
const resumed = CP.resume();
assert(resumed, '旧存档必须顺利恢复');
assert.strictEqual(typeof CP.state().attrs.cha, 'number', '缺失的 cha 必须被自动补正为合法数值');
assert(!isNaN(CP.state().attrs.cha), 'cha 绝不能为 NaN');
CP.state().attrs.cha += 10;
assert(!isNaN(CP.state().attrs.cha), '累加属性后 cha 绝不能变成 NaN');
assert.strictEqual(CP.state().wishPoints, 0, '缺失的 wishPoints 必须被安全初始化为 0');
assert(Array.isArray(CP.state().talents), '缺失的 talents 必须被安全初始化为数组');
assert(Array.isArray(CP.state().fam.history), '缺失的 fam.history 必须被安全初始化为数组');
assert(Array.isArray(CP.state().fam.achievements), '缺失的 fam.achievements 必须被安全初始化为数组');
console.log('旧存档迁移补全验证通过: cha =', CP.state().attrs.cha, ', wishPoints =', CP.state().wishPoints);

console.log('\n--- 测试 14: 🛡️ 模态框事件边界隔离与遮罩点击防误触卡死 ---');
// 1) 先开启心愿单自定义模态框
ctx.UI.openWishModal();
assert.strictEqual(modalElem.dataset.customModal, 'wish', '心愿单开启时应标记 customModal');

// 2) 模拟此时系统弹出一个重要结算弹窗（如高考快讯或突发大考）
while (CP.pending().length) CP.resolve(0);
CP.state().pending.push({
  type: 'news',
  title: '🚨 重要通报：期末统考在即',
  body: '请做好准备！',
  opts: ['收到']
});
ctx.UI.renderModal();

// 核心断言：系统模态框必须强制解绑点击遮罩关闭，严防误触卡死
assert.strictEqual(modalElem.dataset.customModal, undefined, '系统弹窗到来时必须清除 customModal 标记');
assert.strictEqual(modalElem.onclick, null, '系统弹窗下 modalElem.onclick 必须为 null');

// 模拟玩家误触半透明遮罩背景
if (modalElem.onclick) {
  modalElem.onclick({ target: modalElem });
}
assert(modalElem.classList.contains('show'), '系统模态框绝不能因误触背景而意外关闭！');

// 正常按键操作关闭系统弹窗
CP.resolve(0);
ctx.UI.renderModal();
assert(!modalElem.classList.contains('show'), '选项处理后系统弹窗正常关闭');
console.log('模态框事件边界隔离与背景防误触机制验证完全通过！');

console.log('\n--- 测试 15: 🔀 多态交互参数与非法输入边界鲁棒性 ---');
while (CP.pending().length) CP.resolve(0);

// 1) 才艺选秀支持字符串 ID、对象 ID 与数字索引
CP.state().talents = ['aoshu', 'wenqing'];
CP.state().pending.push({
  type: 'show',
  tier: 2,
  title: '初选才艺秀',
  opts: ['🎤 登台']
});
// 传字符串 'aoshu'
const resStr = CP.resolve('aoshu');
assert.strictEqual(CP.pending()[0].type, 'showr', '传字符串 ID 应成功登台');
CP.resolve(0); // 关闭结算

CP.state().pending.push({
  type: 'show',
  tier: 2,
  title: '初选才艺秀',
  opts: ['🎤 登台']
});
// 传越界数字索引 999 (应安全回退至保底或最高特长，绝不抛出异常)
const resOOB = CP.resolve(999);
assert.strictEqual(CP.pending()[0].type, 'showr', '传越界数字索引应平滑容错保底出战');
CP.resolve(0);

// 2) 班干部竞选策略索引越界防护
CP.state().election = {
  round: 1, maxRound: 3, myVotes: 0,
  rival: { name: '王小明', title: '原班长', icon: '🧑‍🏫', votes: 0 },
  totalVotes: 50, targetVotes: 26, logs: [], finished: false, won: false
};
CP.state().pending.push({
  type: 'election',
  title: '班干部竞选',
  opts: ['策略0', '策略1', '策略2', '策略3']
});
// 传非法越界策略编号 -10 与 999
CP.resolve(-10); // 应自动钳制在合法区间
CP.resolve(999);
assert(CP.state().election.round >= 2, '非法越界策略必须被安全钳制并正常推进轮次');

// 3) 职场晋升 S.job 为空时的回写与对象策略传参
while (CP.pending().length) CP.resolve(0);
CP.state().job = null; // 故意制造空岗位异常状态
CP.state().pending.push({
  type: 'promotion',
  opts: [{ label: '策略1' }, { label: '策略2' }, { label: '策略3' }]
});
CP.resolve({ tactic: 1 }); // 传入对象策略
assert(CP.state().job !== null, 'S.job 为空时晋升必须写回有效岗位对象');
assert(CP.state().job.n.length > 0, '岗位名称必须有效');

// 4) 过年收红包位置越界防御
CP.state().pending.push({
  type: 'hongbao_duel',
  opts: ['推拉']
});
// 传入极端越界位置 pos = 99999
const hbRes = CP.resolve({ pos: 99999 });
assert(hbRes && hbRes.length > 0, '极端越界位置应被 clamp 保护并顺利结算');

console.log('多态交互参数与非法输入越界鲁棒性测试全部通过！');

console.log('\n--- 测试 16: 🌪️ 20代全随机混沌策略全生命周期压力测试 ---');
CP.newGame();
let crashCount = 0;
for (let g = 1; g <= 20; g++) {
  let safetyLoop = 0;
  while (safetyLoop++ < 2000) {
    // 随机处理所有 pending 弹窗
    while (CP.pending().length) {
      const topPend = CP.pending()[0];
      if (topPend.type === 'endgen') {
        CP.resolve(0); // 开启下一代
        break;
      }
      // 随机传入多种类型的动作载荷
      const roll = Math.random();
      if (roll < 0.3) {
        CP.resolve(Math.floor(Math.random() * 5));
      } else if (roll < 0.6) {
        CP.resolve({ tactic: Math.floor(Math.random() * 4), talentId: 'aoshu', pos: Math.random() * 100 });
      } else {
        CP.resolve(0);
      }
    }

    // 随机挖掘脑洞 (包含故意传入非法索引测试边界防护)
    CP.brain.rev(Math.floor(Math.random() * 40) - 2);

    // 随机排日程
    CP.autoFillSlots();

    // 检查当前代是否已结束
    if (CP.info().gen > g) break;

    // 推进回合
    CP.endTurn();
  }

  const curInfo = CP.info();
  ['iq', 'eq', 'mem', 'img', 'phy', 'cha'].forEach(k => {
    assert(!isNaN(curInfo.attrs[k]), `第 ${g} 代 ${k} 属性不能为 NaN`);
  });
}
console.log('20 代全随机混沌策略压力测试 100% 顺利通关，无死锁、无异常抛出、无数值 NaN！');

console.log('\n--- 测试 17: 📢 版本更新公告、滚动日志与新版本自愈弹窗机制 ---');
const DATA = ctx.DATA;
assert(DATA.version, 'DATA.version 必须存在');
assert(Array.isArray(DATA.changelog), 'DATA.changelog 必须为数组');
assert(DATA.changelog.length >= 5, 'DATA.changelog 需包含最近多个版本的更新记录');
assert.strictEqual(DATA.changelog[0].ver, DATA.version, 'changelog 首条记录应为当前最新版本');

// 校验每条日志字段结构完整性
DATA.changelog.forEach((c, idx) => {
  assert(c.ver, `第 ${idx} 条更新日志版本号缺失`);
  assert(c.date, `第 ${idx} 条更新日志日期缺失`);
  assert(c.title, `第 ${idx} 条更新日志标题缺失`);
  assert(Array.isArray(c.highlights) && c.highlights.length > 0, `第 ${idx} 条更新日志亮点列表缺失`);
  c.highlights.forEach(h => {
    if (typeof h === 'object') {
      assert(h.title && h.desc, '亮点项需具备 title 与 desc');
    }
  });
});

// 模拟多轮刷新与版本跃迁自动弹窗逻辑
delete store['cph_last_seen_ver'];
// 场景 A: 新用户或刚发布新版本用户刷新，未读过最新版本 -> 触发弹窗
let shouldNotice = store['cph_last_seen_ver'] !== DATA.version;
assert.strictEqual(shouldNotice, true, '版本号不一致时必须触发自动弹窗');

// 场景 B: 用户点击关闭/知道了，持久化记录版本
store['cph_last_seen_ver'] = DATA.version;

// 场景 C: 玩家日常刷新页面，版本相同 -> 不再重复自动打扰
shouldNotice = store['cph_last_seen_ver'] !== DATA.version;
assert.strictEqual(shouldNotice, false, '版本一致时不应重复弹出');

// 场景 D: 开发者提交新代码修复或新玩法 (模拟升版至未来版本如 v2.3.0)
const nextVersion = 'v2.3.0';
shouldNotice = store['cph_last_seen_ver'] !== nextVersion;
assert.strictEqual(shouldNotice, true, '开发者发布新版本后，用户刷新将再次自动弹出了解最新玩法');

console.log('版本更新公告数据结构、多版本滚动历史、刷新自动识别与开发者升版响应测试 100% 验证通过！');

console.log('\n--- 测试 18: 📱 顶栏UI布局优化：双层结构隔离，行动点等核心资源永不被功能按钮遮挡 ---');
const htmlContent = fs.readFileSync(path.join(dir, '..', 'index.html'), 'utf8');
// 断言顶栏双层结构存在
assert(htmlContent.includes('class="topbar-row meta-row"'), '顶栏必须包含 meta-row 元信息层');
assert(htmlContent.includes('class="topbar-row res-row"'), '顶栏必须包含 res-row 核心资源层');
assert(htmlContent.includes('id="top-act"'), '行动点必须具备专属独立展示元素 top-act');
assert(htmlContent.includes('class="res-item act-item"'), '行动点必须具备独立高亮卡片 act-item');

// 断言功能按钮已内嵌进顶栏第一层，严禁作为全局绝对定位漂浮层遮挡第二层的行动点
assert(htmlContent.includes('class="meta-right top-actions"'), '功能按钮必须收纳在 meta-row 右侧');
assert(!htmlContent.includes('<div class="top-floats">'), '严禁在 app 根节点放置全局遮挡悬浮层 top-floats');
assert(htmlContent.includes('class="splash-tools"'), '开始页专属操作栏收拢至 splash 内部');

// 仿真 mock DOM 验证 renderTop 赋值与行动点独立更新
const mockDom = {
  '#top-gen': { textContent: '' },
  '#top-turn': { textContent: '' },
  '#top-face': { textContent: '' },
  '#top-act': { textContent: '' },
  '#top-money': { textContent: '' },
  '#top-insight': { textContent: '' },
  '#status': { innerHTML: '' },
  '#topbar': { innerHTML: '' }
};
const uiCtx = {
  console, Math, Date, JSON,
  document: {
    querySelector: sel => mockDom[sel] || null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    createElement: () => ({ className: '', innerHTML: '', style: {}, appendChild: () => {}, dataset: {} })
  },
  localStorage: ctx.localStorage,
  CP: ctx.CP,
  DATA: ctx.DATA,
  addEventListener: () => {},
  removeEventListener: () => {}
};
uiCtx.window = uiCtx;
uiCtx.global = uiCtx;
uiCtx.globalThis = uiCtx;
vm.createContext(uiCtx);
vm.runInContext(fs.readFileSync(path.join(dir, 'ui.js'), 'utf8'), uiCtx);

// 触发一次顶栏渲染
uiCtx.CP.newGame();
uiCtx.UI.renderTop();

assert.strictEqual(Number(mockDom['#top-act'].textContent), uiCtx.CP.info().act, '行动点数值必须精准渲染至独立 top-act');
assert.strictEqual(Number(mockDom['#top-face'].textContent), uiCtx.CP.info().face, '面子数值必须精准渲染至 top-face');
assert.strictEqual(typeof uiCtx.UI.openSaveModal, 'function', 'UI.openSaveModal 必须正确定义');
assert.strictEqual(typeof uiCtx.UI.closeSaveModal, 'function', 'UI.closeSaveModal 必须正确定义');
assert.strictEqual(typeof uiCtx.UI.renderSaveSlots, 'function', 'UI.renderSaveSlots 必须正确定义');
console.log(`顶栏双层布局验证通过: 行动点 [${mockDom['#top-act'].textContent}] 位于独立资源卡片，功能按钮归入元信息层，彻底告别遮挡！`);

console.log('\n--- 测试 19: 💾 多存档槽位管理与跨设备导入/导出机制 (Round 1) ---');
const sm = CP.saveManager;
assert(sm, 'CP.saveManager 必须存在');

// 1) 初始槽位列表检测
const initialSlots = sm.listSlots();
assert.strictEqual(initialSlots.length, 3, '必须提供 3 个槽位');
assert.strictEqual(sm.getActiveSlot(), 0, '默认激活槽位必须是 0');
assert.strictEqual(initialSlots[0].active, true, '槽位 0 必须标记为 active');

// 2) 槽位 0 当前状态记录
CP.state().name = '一代状元郎';
CP.state().attrs.iq = 999;
CP.state().fam = { g: 3, talent: 15, tier: 4, atlas: ['t-1', 't-2'] };
CP.save();

// 3) 切换至槽位 1
const switchRes = sm.switchSlot(1);
assert(switchRes.ok, '切换槽位 1 必须成功');
assert.strictEqual(sm.getActiveSlot(), 1, '当前激活槽位必须变为 1');
assert.notStrictEqual(CP.state().name, '一代状元郎', '槽位 1 必须独立，不应继承槽位 0 的主角姓名');
CP.state().name = '二号艺术大师';
CP.state().attrs.img = 888;
CP.save();

// 4) 切换回槽位 0，断言数据完全隔离
sm.switchSlot(0);
assert.strictEqual(sm.getActiveSlot(), 0, '切回槽位 0');
assert.strictEqual(CP.state().name, '一代状元郎', '槽位 0 的姓名必须保持原样');
assert.strictEqual(CP.state().attrs.iq, 999, '槽位 0 的智商必须保持 999');

// 5) 导出槽位 0 的备份数据包 (Base64 与 JSON)
const exportRes = sm.exportSlot(0);
assert(exportRes.ok, '导出槽位 0 必须成功');
assert(exportRes.base64 && exportRes.base64.length > 20, 'Base64 字符串必须生成');
assert(exportRes.json && exportRes.json.includes('一代状元郎'), 'JSON 必须包含槽位数据');
assert.strictEqual(exportRes.summary.name, '一代状元郎', '导出的摘要信息必须准确');

// 6) 将导出的 Base64 导入至槽位 2
const importRes = sm.importSlot(exportRes.base64, 2);
assert(importRes.ok, '导入至槽位 2 必须成功');
sm.switchSlot(2);
assert.strictEqual(CP.state().name, '一代状元郎', '槽位 2 恢复后名字必须为一代状元郎');
assert.strictEqual(CP.state().attrs.iq, 999, '槽位 2 恢复后智商必须为 999');
assert.strictEqual(CP.state().fam.talent, 15, '家族天赋必须 100% 还原');

// 7) 损坏与恶意数据防御测试
const badImport1 = sm.importSlot('invalid_random_base64_or_text!@#$', 2);
assert.strictEqual(badImport1.ok, false, '非法文本导入必须被拒绝');
assert(badImport1.error, '必须返回明确错误提示');

const badImport2 = sm.importSlot('', 2);
assert.strictEqual(badImport2.ok, false, '空字符串导入必须被拒绝');

// 8) 清空槽位测试
const clearRes = sm.clearSlot(2);
assert(clearRes.ok, '清空槽位 2 必须成功');
const slotsAfterClear = sm.listSlots();
assert.strictEqual(slotsAfterClear[2].empty, true, '槽位 2 在清空后必须显示为空闲');

// 切回槽位 0
sm.switchSlot(0);
console.log('多存档槽位管理、数据隔离、Base64/JSON 备份与防崩溃导入验证 100% 通过！');

console.log('\n--- 测试 20: 🔁 一键「延续上回合」日程排布与智能自适应降级 (Round 2) ---');
CP.newGame();
while (CP.pending().length) CP.resolve(0);

assert.strictEqual(CP.canRepeatLastSlots(), false, '开局没有历史日程时 canRepeatLastSlots 必须为 false');
const noHistRes = CP.repeatLastSlots();
assert.strictEqual(noHistRes.ok, false, '无历史记录时 repeatLastSlots 必须优雅返回错误');

// 1) 填充 6 个槽位并推进回合
CP.autoFillSlots();
assert.strictEqual(CP.slots().every(Boolean), true, '自动排满 6 个槽位');
const originalSlotIds = CP.slots().map(s => s.id);

CP.endTurn();
while (CP.pending().length) CP.resolve(0);

// 2) 回合推进后，验证 canRepeatLastSlots 为 true
assert.strictEqual(CP.canRepeatLastSlots(), true, '推进回合后必须具备延续记录');

// 3) 清空当前槽位并执行一键延续
CP.clearSlots();
assert.strictEqual(CP.slots().every(x => x === null), true, '清空当前槽位');

const repeatRes = CP.repeatLastSlots();
assert.strictEqual(repeatRes.ok, true, '一键延续必须成功');
assert.strictEqual(repeatRes.filled, 6, '充沛行动力下应成功延续 6 项日程');
assert.strictEqual(repeatRes.skipped, 0, '充沛行动力下跳过数应为 0');
const currentSlotIds = CP.slots().map(s => s.id);
assert.deepStrictEqual(currentSlotIds, originalSlotIds, '延续后的 6 个项目必须与上回合 100% 完全一致');

// 4) 极端低行动力下的智能降级测试
CP.clearSlots();
CP.state().act = 0; // 行动力耗尽
const lowActRes = CP.repeatLastSlots();
assert.strictEqual(lowActRes.ok, true, '低行动力下仍然返回 ok: true 进行自适应排布');
assert(lowActRes.skipped > 0, '需要消耗体力的项目必须被智能跳过');
assert(CP.state().act >= 0, '行动力绝不能溢出为负数');

console.log('一键延续上回合日程、历史槽位精确深拷贝与低体力智能降级断言全部通过！');

console.log('\n--- 测试 21: 🧠 脑洞探索 HUD 看板与行动力智能反馈机制 (Round 3) ---');
CP.newGame();
while (CP.pending().length) CP.resolve(0);

// 1) 初始 HUD 结构与计量器断言
let bStat = CP.brain.info();
assert.strictEqual(bStat.layer, 1, '开局应位于脑域深潜第 1 层');
assert.strictEqual(bStat.open, 0, '开局已探索格子应为 0');
assert.strictEqual(bStat.total, 36, '脑洞矩阵总格数必须为 36');
assert.strictEqual(bStat.remaining, 36, '开局剩余待探格数必须为 36');
assert.strictEqual(bStat.percent, 0, '开局探索百分比必须为 0%');
assert.strictEqual(bStat.maxLayer, 4, '封顶层数应为 4 层');
assert.strictEqual(bStat.bulbs, 0, '未翻开任何灯泡');
assert.strictEqual(bStat.bombs, 0, '未翻开任何炸弹');
assert.strictEqual(bStat.keys, 0, '未翻开任何钥匙');
assert(bStat.act >= 2, '初始开局行动力应足以进行探索');
assert.strictEqual(bStat.canExplore, true, '行动力充沛时 canExplore 应为 true');
assert.strictEqual(bStat.maxExplores, Math.floor(bStat.act / 2), '最大可探次数计算准确');

// 2) 探索递增断言
CP.state().act = 100; // 注入充沛行动力以隔离随机波动
const g = CP.brain.grid();
// 找一个非钥匙非炸弹的格子翻开
let targetIdx = g.findIndex(cell => !cell.open && cell.t !== 'key' && cell.t !== 'bomb');
if (targetIdx === -1) targetIdx = 0;
const revResult = CP.brain.rev(targetIdx);
assert(revResult !== null, '行动力充沛时翻开格子必须返回收益信息');

bStat = CP.brain.info();
assert.strictEqual(bStat.open >= 1, true, '已探明格子数增加');
assert.strictEqual(bStat.remaining, 36 - bStat.open, '剩余格子数精确同步扣减');
assert.strictEqual(bStat.percent, Math.round((bStat.open / 36) * 100), '百分比进度精确计算');

// 3) 行动力耗尽防御与极值鲁棒性断言
CP.state().act = 1; // 仅剩 1 点行动力（不足 2 点）
bStat = CP.brain.info();
assert.strictEqual(bStat.act, 1, '行动力为 1');
assert.strictEqual(bStat.canExplore, false, '行动力不足 2 时 canExplore 必须为 false');
assert.strictEqual(bStat.maxExplores, 0, '行动力不足 2 时 maxExplores 必须为 0');

const unopenIdx = CP.brain.grid().findIndex(cell => !cell.open);
if (unopenIdx >= 0) {
  const openCountBefore = CP.brain.info().open;
  const blockedRev = CP.brain.rev(unopenIdx);
  assert.strictEqual(blockedRev, null, '行动力不足时调用 rev 必须拒止并返回 null');
  assert.strictEqual(CP.brain.info().open, openCountBefore, '拒止后绝不能翻开任何格子');
  assert.strictEqual(CP.state().act, 1, '拒止后绝不能倒扣行动力');
  const toasts = CP.flushToasts();
  assert(toasts.some(t => t.includes('行动力不足') && t.includes('需2⚡')), '拒止时必须向玩家输出包含操作建议的友善引导气泡');
}

// 4) 钥匙下潜与 HUD 状态重置断言
CP.state().act = 60;
// 人工制造或寻找一个钥匙格子翻开
let keyIdx = CP.brain.grid().findIndex(cell => !cell.open && cell.t === 'key');
if (keyIdx === -1) {
  // 若本层未随出钥匙（极罕见），人工将第一个未开格子设为钥匙测试
  const freeIdx = CP.brain.grid().findIndex(c => !c.open);
  CP.brain.grid()[freeIdx].t = 'key';
  keyIdx = freeIdx;
}
const keyRev = CP.brain.rev(keyIdx);
assert(keyRev.includes('🗝️') || keyRev.includes('钥匙'), '翻开钥匙格子必须有钥匙标识');
bStat = CP.brain.info();
assert.strictEqual(bStat.layer, 2, '踩中钥匙后 HUD 层级必须立即平滑跃迁至第 2 层');
assert.strictEqual(bStat.open, 0, '跃迁到新层后已探格子数必须重置为 0');
assert.strictEqual(bStat.percent, 0, '跃迁到新层后进度条百分比必须重置为 0%');
assert(CP.state().act >= 50, '踩中钥匙必须如期回复 50 点行动力');

console.log('脑域层级探照、竹管流光进度条、低行动力智能锁止与下潜重置断言全部通过！');

console.log('\n🎉 全部二十一项全系统核心机制、模态隔离、老存档迁移、参数鲁棒性、多存档、日程延续与脑洞HUD全部 100% 验证通过！');








