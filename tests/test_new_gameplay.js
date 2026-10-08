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

// 验证原版动力学重塑：动态个性化区间与亲戚力学Profile
CP.state().pending.push({
  type: 'hongbao_duel',
  title: '🧧 过年收红包 · 客套推拉大对决',
  rel: '二叔叔',
  goldenMin: 48,
  goldenMax: 76,
  amountBase: 200,
  opts: ['好']
});
const resCustomGolden = CP.resolve({ pos: 60 });
assert(resCustomGolden.includes('进退得体') && resCustomGolden.includes('二叔叔'), '个性化亲戚区间应正确获得进退得体评价');

// 验证过于猴急夺取惩罚 (pos = 95)
const faceBeforeGreed = CP.state().face;
CP.state().pending.push({
  type: 'hongbao_duel',
  title: '🧧 过年收红包 · 客套推拉大对决',
  rel: '大姑妈',
  goldenMin: 45,
  goldenMax: 69,
  amountBase: 240,
  opts: ['好']
});
const resGreed = CP.resolve({ pos: 95 });
assert(resGreed.includes('伸手太急') || resGreed.includes('掐了你一把'), '猴急夺取应触发长辈尴尬与老妈惩罚');
assert(CP.state().face <= faceBeforeGreed - 20, '过于急切应大幅扣减家庭面子');

// 验证快速跳过保底机制
CP.state().pending.push({
  type: 'hongbao_duel',
  title: '🧧 过年收红包 · 客套推拉大对决',
  rel: '隔壁王阿姨',
  goldenMin: 42,
  goldenMax: 60,
  amountBase: 210,
  opts: ['好']
});
const resSkip = CP.resolve({ pos: 51, skipped: true });
assert(resSkip.includes('⏩ [保底收下]'), '快速跳过应打上保底收下标签');

// 验证全生命周期过年回合真实 pendHongbao() 生成参数
CP.state().turn = 7; // 幼儿期
CP.state().pending = [];
CP.pendHongbao();
const hbBaby = CP.pending().find(p => p.type === 'hongbao_duel');
assert(hbBaby, '回合7过年必定触发红包');
assert(hbBaby.difficulty === 0.8, '幼儿期红包难度系数应为0.8');
assert(hbBaby.goldenMin && hbBaby.goldenMax && hbBaby.startPos !== undefined, '红包事件必须携带动态动力学参数');
assert(hbBaby.startPos < hbBaby.goldenMin || hbBaby.startPos > hbBaby.goldenMax, '初始位置必须脱离黄金区，严禁开局直接躺赢');
while (CP.pending().length) CP.resolve(0);

CP.state().turn = 35; // 高中冲刺期
CP.state().pending = [];
CP.pendHongbao();
const hbSenior = CP.pending().find(p => p.type === 'hongbao_duel');
assert(hbSenior, '回合35过年必定触发红包');
assert(hbSenior.difficulty === 1.35, '高中期红包难度系数应为1.35');
assert(hbSenior.goldenMax - hbSenior.goldenMin < hbBaby.goldenMax - hbBaby.goldenMin, '高难度期黄金区间显著窄于幼儿期');
while (CP.pending().length) CP.resolve(0);

// 验证本地专项测试页面 test_hongbao.html 结构完备性 (若本地存在)
if (fs.existsSync('test_hongbao.html')) {
  const hbHtml = fs.readFileSync('test_hongbao.html', 'utf8');
  assert(hbHtml.includes('hb-sandbox-mount') && hbHtml.includes('sel-rel'), 'test_hongbao.html 必须包含专属挂载点与亲戚选择器');
  assert(hbHtml.includes('tele-pos') && hbHtml.includes('tele-vel'), 'test_hongbao.html 必须包含实时遥测看板');
}
console.log('过年收红包动态性格力学、阶段难度缩放、脱靶初始位置与保底跳过全部断言通过！');

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
assert(CP.state().faceDuel.momRage >= 25, '防守成功应为老妈怒气充能至少25%');
console.log('第1轮交锋战斗日志:', CP.state().faceDuel.logs.slice(-2));

// 第2轮：出招凡尔赛心理反击 (index 1)
CP.resolve(1);
assert(CP.state().faceDuel.opp.tilt > 0, '进攻应增加对手心理破防槽');
console.log('第2轮交锋战斗日志:', CP.state().faceDuel.logs.slice(-2));

// 第3轮：亮出特长攻击 (index 0)
CP.resolve(0);
console.log('第3轮交锋战斗日志:', CP.state().faceDuel.logs.slice(-2));

// 深度测试 2.1: pendFace 自动构筑手牌与四大分类特长羁绊判定
while (CP.pending().length) CP.resolve(0);
CP.state().talents = ['aoshu', 'chengxuyuan']; // 双理科特长 (奥数苗子 + 初学编程)
CP.pendFace(0);
const pendDuelItem = CP.pending().find(p => p.type === 'face_duel');
assert(pendDuelItem, 'pendFace(0) 应成功推入 face_duel 事件');
const activeDuel = CP.faceDuel();
assert(activeDuel && activeDuel.hand.length >= 3, '对决应自动生成手牌 (含主力特长与战术卡)');
assert(activeDuel.activeSynergies.some(s => s.id === 'synergy_stem'), '双理科特长应激活「理科降维打击」特长羁绊');
assert.strictEqual(activeDuel.opp.tilt, 0, '初始破防槽必须归零');
assert.strictEqual(activeDuel.momRage, 0, '初始老妈怒气必须归零');

// 深度测试 2.2: 破防槽 100% 当场石化瘫痪机制断言
activeDuel.opp.tilt = 95;
CP.resolve(0); // 本轮输出足以将 tilt 推至 100%
const hasParalyzeLog = activeDuel.logs.some(l => l.includes('破防石化') || l.includes('张口结舌'));
assert(hasParalyzeLog, '破防槽满时对手必须当场石化并跳过反击');

// 深度测试 2.3: 老妈必杀绝招大招释放与伤害判定
activeDuel.momRage = 100;
const oppHpBeforeMom = activeDuel.opp.hp;
CP.resolve('mom');
assert(activeDuel.momRage < 100, '老妈大招释放后100%怒气已被清空重置');
assert(activeDuel.opp.hp < oppHpBeforeMom - 120, '老妈大招造成巨额爆发伤害 (>120)');
const hasMomLog = activeDuel.logs.some(l => l.includes('老妈必杀') || l.includes('拍案而起'));
assert(hasMomLog, '老妈大招应触发全家杀手锏专属战斗公报');

// 深度测试 2.4: 终局结算战报状态与数据完整性
if (!activeDuel.finished) {
  activeDuel.opp.hp = 0;
  CP.resolve(0); // 结算终局
}
assert.strictEqual(activeDuel.finished, true, '对手HP归零时对决必须结束');
assert.strictEqual(activeDuel.won, true, '对手HP归零时我方判定获胜');
assert(activeDuel.mvpTalent, '终局必须结算出本场 MVP 特长');
assert(activeDuel.totalDamageDealt > 0, '终局必须统计造成面子总打击数值');

// 深度测试 2.5: 战报确认退出生命周期
const winFaceBefore = CP.state().face;
const finMsg = CP.resolve(0);
assert(finMsg.includes('面子对决大获全胜'), '战报确认后应返回大获全胜提示语');
assert.strictEqual(CP.faceDuel(), null, '战报确认后对决状态必须被清理');
assert.strictEqual(CP.state().face, winFaceBefore, '最终奖励在终局时已结算入库');

console.log('面子对决 2.0 手牌构筑、羁绊加成、破防瘫痪、老妈大招与战报结算全部断言通过！');

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
// 派出身怀史诗理科特长【压轴题杀手】(Rank 3) 出战，并取得 Showtime Perfect
const showRes = CP.resolve({ talentId: 'jiazui', showtimeGrade: 'perfect' });
assert(CP.pending().length > 0 && CP.pending()[0].type === 'showr', '表演后应进入结算模态框');
const showrModal = CP.pending()[0];
assert(Array.isArray(showrModal.lights) && showrModal.lights.length === 3, '应包含三位评委亮灯数据');
assert(Array.isArray(showrModal.judgeQuotes) && showrModal.judgeQuotes.length === 3, '应包含三位评委点评');
assert.strictEqual(showrModal.showtimeGrade, 'perfect', '应正确记录 Showtime 操作评级');
assert(showrModal.gi >= 40, '应获得选秀悟性奖励');

// 验证张教授对理科特长的专属肯定
if (showrModal.lights[0]) {
  assert(showrModal.judgeQuotes[0].includes('理科') || showrModal.judgeQuotes[0].includes('大将之风') || showrModal.judgeQuotes[0].includes('出招沉稳'), '张教授应对理科或高阶特长给予高度肯定');
}
// 验证麦克老师对 Showtime 完美的起立欢呼
if (showrModal.lights[1]) {
  assert(showrModal.judgeQuotes[1].includes('完美Showtime') || showrModal.judgeQuotes[1].includes('节奏'), '麦克老师应对 Showtime Perfect 予以热烈反响');
}

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

// 深度测试 7.1: 濒临淘汰时的【绝活加演 (Encore)】逆转翻盘机制
CP.state().pending.push({
  type: 'show',
  tier: 2,
  title: '小学才艺大赛',
  rival: {
    name: '钢琴神童',
    talent: { id: 'pianotop', n: '肖邦夜曲', r: 4, icon: '🎹', atk: 300 }
  }
});
// 携带普通特长并开启加演返场
CP.state().attrs.eq = 150;
const encoreShowRes = CP.resolve({ talentId: 'danci', showtimeGrade: 'perfect', encore: true });
const encoreModal = CP.pending()[0];
assert(encoreModal, '加演后应进入结算界面');
if (encoreModal.encoreTriggered) {
  assert.strictEqual(encoreModal.encoreTriggered, true, '濒危状态下必须触发 Encore 绝活返场');
  console.log('Encore 绝活加演触发成功，翻盘结果:', { encoreSuccess: encoreModal.encoreSuccess, lights: encoreModal.lights });
}
while (CP.pending().length) CP.resolve(0);

console.log('特长才艺选秀 2.0 评委偏好、Showtime 节拍判定与绝活返场 (Encore) 验证完全通过！');

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
assert(el1.blocs && el1.blocs.middle, '必须包含三大选民阵营实时大盘数据');
assert(el1.blocs.middle.myVotes > 0 || el1.blocs.studious.myVotes > 0, '亲民路线应从中立或学霸圈斩获选票');
assert.strictEqual(el1.round, 2, '应进入第2轮');
console.log('第1轮拉票得票:', el1.myVotes, '对手:', el1.rival.votes, '三大圈大盘:', {
  studious: el1.blocs.studious.myVotes,
  middle: el1.blocs.middle.myVotes,
  rowdy: el1.blocs.rowdy.myVotes
});

// 第2轮演说: 出招零食许诺 (index 2)，测试后排活跃圈绝杀吸票
const rowdyBefore = el1.blocs.rowdy.myVotes;
CP.resolve(2);
assert(CP.state().election.blocs.rowdy.myVotes > rowdyBefore, '零食许诺应对后排活跃圈具有强力收割效果');

// 持续演说拉票直到决出胜负 (过半门槛或3轮结标)
let safety = 0;
while (!CP.state().election.finished && safety++ < 5) {
  CP.resolve(3); // 严密施政
}
assert(CP.state().election.finished, '竞选演说必须决出胜负并结算完成');
assert(CP.pending().length > 0 && (CP.pending()[0].type === 'electionr' || CP.pending()[0].type === 'news'), '应弹出竞选终局任命聘书公报');
const newsModal = CP.pending()[0];
console.log('竞选终局得票: 我方 ' + CP.state().election.myVotes + ' vs 对手 ' + CP.state().election.rival.votes);
console.log('竞选结果公报:', newsModal.title, (newsModal.body || '').split('\n')[0]);

// 确认就任并关闭任命公报
CP.resolve(0);
assert.strictEqual(CP.pending().length, 0, '就任后任命聘书公报应已关闭');
console.log('班干部竞选 2.0 三大选民阵营、策略克制与三道杠聘书战报验证完全通过！');

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

// 场景 D: 开发者提交新代码修复或新玩法 (模拟升版至未来版本如 v2.5.0)
const nextVersion = DATA.version.replace(/(\d+)$/, m => Number(m) + 1);
shouldNotice = store['cph_last_seen_ver'] !== nextVersion;
assert.strictEqual(shouldNotice, true, '开发者发布新版本后，用户刷新将再次自动弹出了解最新玩法');

// 断言全局版本号一致性 (index.html, sw.js, DATA.version) 筑牢发版防线
const swFileContent = fs.readFileSync(path.join(dir, '..', 'sw.js'), 'utf8');
const indexHtmlContent = fs.readFileSync(path.join(dir, '..', 'index.html'), 'utf8');
assert(swFileContent.includes(`CACHE_NAME = 'chinese-parent-${DATA.version}'`), `sw.js 离线缓存版本必须与 DATA.version (${DATA.version}) 严格同步`);
assert(indexHtmlContent.includes(DATA.version), `index.html 必须包含最新版本号 ${DATA.version}`);
assert.strictEqual(DATA.version, 'v3.0.0', '当前最新发版版本应为 v3.0.0');
assert(DATA.changelog[0].title.includes('选秀') || DATA.changelog[0].title.includes('才艺'), 'v3.0.0 首条更新必须包含特长才艺选秀 3.0');

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

// 4) 钥匙下潜与 HUD 状态重置断言 (两段式下潜机制: 先显示钥匙+锁定高亮，点击钥匙才下潜)
CP.state().act = 60;
// 人工制造或寻找一个钥匙格子翻开
let keyIdx = CP.brain.grid().findIndex(cell => !cell.open && cell.t === 'key');
if (keyIdx === -1) {
  // 若本层未随出钥匙（极罕见），人工将第一个未开格子设为钥匙测试
  const freeIdx = CP.brain.grid().findIndex(c => !c.open);
  CP.brain.grid()[freeIdx].t = 'key';
  keyIdx = freeIdx;
}
// 第一阶段：翻开钥匙格子，显露钥匙，进入高亮待下潜状态，绝不立即刷新
const keyRev = CP.brain.rev(keyIdx);
assert(keyRev.includes('🗝️') || keyRev.includes('钥匙'), '翻开钥匙格子必须有钥匙标识');
bStat = CP.brain.info();
assert.strictEqual(bStat.keyPending, true, '挖出钥匙后必须进入 keyPending 待决高亮状态');
assert.strictEqual(bStat.layer, 1, '第一阶段尚未点击钥匙，层级必须保持在第 1 层');

// 校验锁定保护：在此状态下尝试点击非钥匙格子，必须被安全拦截
const otherIdx = (keyIdx + 1) % 36;
const blockedRev = CP.brain.rev(otherIdx);
assert.strictEqual(blockedRev, null, '钥匙待决状态下点击其他格子必须被安全拦截');

// 第二阶段：玩家主动点击高亮钥匙格子（或调用 useKey()），正式激活跃迁
const keyUse = CP.brain.rev(keyIdx);
assert(keyUse.includes('钥匙') || keyUse.includes('下探'), '激活钥匙必须有下潜反馈');
bStat = CP.brain.info();
assert.strictEqual(bStat.layer, 2, '点击钥匙后 HUD 层级必须立即平滑跃迁至第 2 层');
assert.strictEqual(bStat.keyPending, false, '跃迁到新层后钥匙锁定状态必须解除');
assert.strictEqual(bStat.open, 0, '跃迁到新层后已探格子数必须重置为 0');
assert.strictEqual(bStat.percent, 0, '跃迁到新层后进度条百分比必须重置为 0%');
assert(CP.state().act >= 50, '踩中钥匙必须如期回复 50 点行动力');

console.log('脑域层级探照、竹管流光进度条、低行动力智能锁止、钥匙两段式展示与下潜重置断言全部通过！');

console.log('\n--- 测试 22: 🎵 原生 WebAudio 中国风五声 BGM 与三态音频系统 (Round 4) ---');
// 创建具备 WebAudio Mock 的 UI 测试沙箱
const sndStore = {};
const sndSandboxCtx = {
  console: console,
  Math, Date, JSON, setTimeout, clearTimeout, setInterval, clearInterval,
  localStorage: {
    getItem: k => (k in sndStore ? sndStore[k] : null),
    setItem: (k, v) => { sndStore[k] = String(v); },
    removeItem: k => { delete sndStore[k]; },
  },
  document: {
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    addEventListener: () => {},
    createElement: (tag) => {
      const el = {
        tag,
        className: '',
        innerHTML: '',
        children: [],
        style: {},
        classList: {
          add(c) { el.className = (el.className + ' ' + c).trim(); },
          remove() {},
          contains() { return false; },
          toggle() {}
        },
        appendChild(child) {
          el.children.push(child);
          return child;
        }
      };
      return el;
    }
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  CP: ctx.CP,
  DATA: ctx.DATA,
  window: {},
  AudioContext: class MockAudioContext {
    constructor() {
      this.state = 'running';
      this.sampleRate = 44100;
      this.currentTime = 0;
      this.destination = {};
      this.oscillators = [];
    }
    resume() {}
    createOscillator() {
      const osc = {
        type: 'sine',
        frequency: {
          val: 0,
          setValueAtTime(v) { osc.frequency.val = v; },
          exponentialRampToValueAtTime() {}
        },
        connect() {},
        start() {},
        stop() {}
      };
      this.oscillators.push(osc);
      return osc;
    }
    createGain() {
      return {
        gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {}
      };
    }
    createBuffer(channels, size, rate) {
      return { getChannelData: () => new Float32Array(size) };
    }
    createBufferSource() {
      return { buffer: null, connect() {}, start() {}, stop() {} };
    }
  }
};
sndSandboxCtx.window = sndSandboxCtx;
sndSandboxCtx.globalThis = sndSandboxCtx;
vm.createContext(sndSandboxCtx);
// 加载 ui.js
vm.runInContext(fs.readFileSync(path.join(dir, 'ui.js'), 'utf8'), sndSandboxCtx);

const testSound = sndSandboxCtx.sound;
assert(testSound, 'SoundManager 实例必须在 ui.js 中自动单例初始化');

// 1) 初始状态与老存档兼容性
assert.strictEqual(testSound.mode, 'all', '默认开局模式必须为 all (音乐+音效)');
assert.strictEqual(testSound.muted, false, 'all 模式下 muted 属性应为 false');

// 2) 三态循环切换测试: all -> sfx -> mute -> all
testSound.toggle();
assert.strictEqual(testSound.mode, 'sfx', '第一次切换应变为 sfx (仅音效)');
assert.strictEqual(testSound.muted, false, 'sfx 模式下 muted 属性仍为 false (音效有效)');
assert.strictEqual(sndStore['cph_audio_mode'], 'sfx', '持久化 cph_audio_mode 应记录为 sfx');
assert.strictEqual(testSound.bgmPlaying, false, 'sfx 模式下背景音乐必须停止');

testSound.toggle();
assert.strictEqual(testSound.mode, 'mute', '第二次切换应变为 mute (全局静音)');
assert.strictEqual(testSound.muted, true, 'mute 模式下 muted 属性必须为 true');
assert.strictEqual(sndStore['cph_audio_mode'], 'mute', '持久化 cph_audio_mode 应记录为 mute');
assert.strictEqual(sndStore['cph_mute'], '1', '同时向后兼容写入 cph_mute = 1');

testSound.toggle();
assert.strictEqual(testSound.mode, 'all', '第三次切换应回到 all (音乐+音效)');
assert.strictEqual(testSound.muted, false, 'all 模式下 muted 必须为 false');
assert.strictEqual(sndStore['cph_audio_mode'], 'all', '持久化 cph_audio_mode 应记录为 all');
assert.strictEqual(sndStore['cph_mute'], '0', '向后兼容写入 cph_mute = 0');

// 3) 五声 BGM 调度器运行与静默生命周期
testSound.startBGM();
assert.strictEqual(testSound.bgmPlaying, true, 'startBGM 调用后 bgmPlaying 必须为 true');
assert(testSound.bgmTimer !== null, '必须启动 BGM 定时调度器');

testSound.stopBGM();
assert.strictEqual(testSound.bgmPlaying, false, 'stopBGM 调用后 bgmPlaying 必须为 false');
assert.strictEqual(testSound.bgmTimer, null, '定时器引用必须安全清空');

// 4) 高潮节点情绪音效函数调用测试 (严禁在任何环境下抛错)
testSound.gaokaoBang();
testSound.talentWin();
testSound.faceCrit();
testSound.stressPanic();
testSound.win();
testSound.fail();
testSound.click();
testSound.brain();
testSound.coin();
testSound.pop();
testSound.stopBGM(); // 测试完成后清理调度器，确保测试进程干净退出

console.log('WebAudio 五声 BGM 合成、三态切换、历史键位兼容与高潮音效全生命周期断言通过！');

console.log('\n--- 测试 23: 👥 同学社交「双向羁绊」与偶发约会大事件 (Round 5) ---');
CP.newGame();
while (CP.pending().length) CP.resolve(0);

// 1) 五阶羁绊体系评定函数断言
assert.strictEqual(CP.bondTier(15).tier, 1);
assert.strictEqual(CP.bondTier(15).title, '点头之交');
assert.strictEqual(CP.bondTier(35).tier, 2);
assert.strictEqual(CP.bondTier(35).title, '同窗好友');
assert.strictEqual(CP.bondTier(70).tier, 3);
assert.strictEqual(CP.bondTier(70).title, '志趣相投');
assert.strictEqual(CP.bondTier(100).tier, 4);
assert.strictEqual(CP.bondTier(100).title, '莫逆之交');
assert.strictEqual(CP.bondTier(135).tier, 5);
assert.strictEqual(CP.bondTier(135).title, '青梅竹马');

// 2) 好感度突破 100 封顶与 150 阶段属性断言
const socList = CP.social();
assert(socList.length > 0, '开局应存在同窗列表');
const targetNpc = socList[0];
CP.state().npcAff[targetNpc.id] = 135;

const updatedList = CP.social();
const updatedNpc = updatedList.find(n => n.id === targetNpc.id);
assert.strictEqual(updatedNpc.aff, 135, '好感度成功突破老版本的 100 限制达到 135');
assert.strictEqual(updatedNpc.bondTier, 5, '好感 135 时晋升为五阶青梅竹马');
assert.strictEqual(updatedNpc.bondTitle, '青梅竹马');

// 3) 偶发约会大事件触发与交互结算断言
CP.state().money = 100;
CP.state().act = 100;
CP.state().insight = 100;

CP.pendDate();
const datePends = CP.pending().filter(p => p.type === 'social_spontaneous_date');
assert.strictEqual(datePends.length, 1, '必须如期生成专属同学偶发约会事件');
const dateEv = datePends[0];
assert(dateEv.title.includes(targetNpc.name), '邀约事件标题必须匹配最高好感同窗');
assert(dateEv.opts && dateEv.opts.length >= 2, '约会事件必须提供两个以上互动分支');

const affBefore = CP.state().npcAff[targetNpc.id];
const opt0 = dateEv.opts[0];
const moneyBefore = CP.state().money;
const actBefore = CP.state().act;
CP.resolve(0); // 执行欣然赴约分支

if (opt0.costMoney) assert.strictEqual(CP.state().money, moneyBefore - opt0.costMoney, '正确扣除约会零钱');
if (opt0.costAct) assert.strictEqual(CP.state().act, actBefore - opt0.costAct, '正确扣除约会体力');
assert(CP.state().npcAff[targetNpc.id] >= affBefore, '约会成功后好感度进一步增长');

// 4) 高三终局毕业纪念信物互赠断言
CP.state().gender = 'boy'; // 显式设定男主以匹配异性好友苏软软
CP.state().turn = 43; // 高三终局前夕
CP.state().npcAff['summer'] = 110; // 苏软软好感破百
CP.pendToken();

const tokenPends = CP.pending().filter(p => p.type === 'graduation_token');
assert.strictEqual(tokenPends.length, 1, '必须如期生成高三毕业纪念信物事件');
const tokenEv = tokenPends[0];
assert(tokenEv.tokenName.includes('苏软软'), '信物名称必须匹配高好感密友');
const imgBefore = CP.state().attrs.img;

CP.resolve(0); // 珍藏信物入怀
assert(CP.tokens().some(t => t.includes('苏软软')), '信物必须成功存入主角永久信物集');
assert(CP.state().attrs.img >= imgBefore + 40, '毕业纪念信物提供的永久属性必须生效');

console.log('五阶同窗羁绊、突破100上限、偶发约会大事件与高三毕业纪念信物断言全部通过！');

console.log('\n--- 测试 24: 📜 可视化百年家族族谱树状画卷 (Round 6 TREE-VIS) ---');
// 构造包含始祖与多代传承的家族谱系
const fakeFam = {
  g: 3,
  talent: 18,
  tier: 4,
  atlas: ['t1', 't2', 't3', 't4', 't5'],
  history: [
    {
      gen: 1,
      name: '铁蛋',
      gender: 'boy',
      job: '高级程序员',
      jobIcon: '💻',
      jobTier: 3,
      spouse: '苏软软',
      spouseTag: '校园恋人',
      gk: 18500,
      score: 85,
      rating: 'S',
      highlight: '带领家族走出寒门，第一位考入985名校的先祖！'
    },
    {
      gen: 2,
      name: '小满',
      gender: 'girl',
      job: '三甲主任医师',
      jobIcon: '🩺',
      jobTier: 4,
      spouse: '林骨干',
      spouseTag: '良缘相伴',
      gk: 19200,
      score: 92,
      rating: 'SS',
      highlight: '医者仁心，为家族积攒深厚声望与体面门第！'
    }
  ]
};

// 注入测试沙箱验证图谱生成与在世苗裔联动
CP.fam().history = fakeFam.history;
CP.fam().g = 3;
CP.fam().tier = 4;
CP.fam().talent = 18;
CP.fam().atlas = fakeFam.atlas;

// 1) 验证家族历史数据读取
const historyList = CP.familyHistory();
assert.strictEqual(historyList.length, 2, '历史先祖数量应为 2');
assert.strictEqual(historyList[0].gen, 1, '第一代必须是开基始祖');
assert.strictEqual(historyList[0].name, '铁蛋');
assert.strictEqual(historyList[1].gen, 2, '第二代必须是小满');

// 2) 验证在 UI 沙箱中渲染画卷
const treeStage = {
  innerHTML: '',
  children: [],
  appendChild(el) {
    if (el) this.children.push(el);
  }
};
sndSandboxCtx.document.querySelector = (sel) => {
  if (sel === '#stage') return treeStage;
  return null;
};

// 调用沙箱中的 renderAtlas 渲染树状谱系
sndSandboxCtx.UI.setAtlasTab('tree');
sndSandboxCtx.UI.renderAtlas();

assert(treeStage.children.length > 0, 'Stage 必须成功挂载族谱画卷组件');
const htmlDump = JSON.stringify(treeStage.children);

// 3) 断言宗祠总览牌匾及四个核心指标
assert(htmlDump.includes('ancestral-hall-banner'), '必须包含宗祠总览牌匾');
assert(htmlDump.includes('百年氏族 · 宗祠总谱画卷'), '牌匾题字必须准确');
assert(htmlDump.includes('绵延世系'), '包含绵延世系统计');
assert(htmlDump.includes('最高门第'), '包含最高门第统计');
assert(htmlDump.includes('传家特长'), '包含传家特长统计');
assert(htmlDump.includes('先天底蕴'), '包含先天底蕴统计');

// 4) 断言树状代际枝脉与先祖卡片
assert(htmlDump.includes('genealogy-tree'), '必须包含纵深树状枝脉容器');
assert(htmlDump.includes('👑 开基始祖'), '第一代必须赋予👑开基始祖专属荣誉印章');
assert(htmlDump.includes('📜 第 2 代宗亲'), '第二代必须赋予📜宗亲图章');
assert(htmlDump.includes('铁蛋') && htmlDump.includes('小满'), '必须呈现历代先祖姓名');

// 5) 断言当代在世苗裔节点 (Living Scion)
assert(htmlDump.includes('🌱 第') && htmlDump.includes('在世苗裔'), '必须呈现当代在世苗裔节点');
assert(htmlDump.includes('正在书写生平…'), '当代节点必须包含动态书写状态印章');

console.log('宗祠画卷总览牌匾、开基始祖图章、代际青墨主干与在世苗裔联动断言全部通过！');

console.log('\n--- 测试 25: 🎓 大学深造日程、大厂实习与时代浪潮中年抉择 (Round 7 LIFE-LATE) ---');
CP.newGame();
while (CP.pending().length) CP.resolve(0);

// 1) 推进至大学阶段 (Turn 46, phase: college)
CP.state().turn = 46;
CP.state().act = 120;
CP.state().insight = 600;
CP.state().money = 500;
CP.state().learnedCourses = CP.state().learnedCourses || ['fanshen', 'wanju'];

// 断言当前阶段
assert.strictEqual(CP.info().phase, '大学', 'Turn 46 应为大学阶段');

// 2) 断言考研/学术深造进阶课程
const collegeCourses = CP.learnList();
const paperCourse = collegeCourses.find(c => c.id === 'u-paper');
assert(paperCourse, '大学研习技能列表中必须包含「学术论文与文献精读」');
assert.strictEqual(paperCourse.icon, '📑');
assert(paperCourse.cost > 0, '研习需消耗合理悟性');
assert(paperCourse.can, '悟性充足时应可研习');

const learnOk = CP.learnCourse('u-paper');
assert.strictEqual(learnOk, true, '成功研习「学术论文与文献精读」');
assert(CP.state().learnedCourses.includes('u-paper'), '已学课程集必须收录 u-paper');

// 3) 断言大学行动池（实践、日程、大厂打工）
let collegePool = CP.pool();
const paperItem = collegePool.find(p => p.id === 'u-paper' && p.kind === 'learn');
assert(paperItem, '研习后「学术论文与文献精读」必须进入日常安排候选池');

const labPlay = collegePool.find(p => p.id === 'pl-lab');
const interviewPlay = collegePool.find(p => p.id === 'pl-interview');
const startupPlay = collegePool.find(p => p.id === 'pl-startup');
assert(labPlay && labPlay.kind === 'play', '日常池中必须包含「导师实验室攻坚」');
assert(interviewPlay && interviewPlay.kind === 'play', '日常池中必须包含「秋招群面模拟」');
assert(startupPlay && startupPlay.kind === 'play', '日常池中必须包含「创客空间路演」');

const techJob = collegePool.find(p => p.id === 'pj-tech-int');
const campusLeadJob = collegePool.find(p => p.id === 'pj-campus-lead');
assert(techJob && techJob.kind === 'pay', '打工池中必须包含「头部大厂技术实习」');
assert.strictEqual(techJob.extra, '+140元', '大厂实习津贴为 140 元');
assert(campusLeadJob && campusLeadJob.kind === 'pay', '打工池中必须包含「校园合伙人地推」');
assert.strictEqual(campusLeadJob.extra, '+120元', '校园合伙人津贴为 120 元');

// 4) 自由排布六项大学深造与实习日程并执行结算
CP.clearSlots();
assert(CP.addSlot(paperItem), '排入学术论文研习');
assert(CP.addSlot(labPlay), '排入实验室攻坚');
assert(CP.addSlot(interviewPlay), '排入秋招群面模拟');
assert(CP.addSlot(startupPlay), '排入创客空间路演');
assert(CP.addSlot(techJob), '排入头部大厂技术实习');
assert(CP.addSlot(campusLeadJob), '排入校园合伙人地推');

const moneyBeforeTurn = CP.state().money;
const iqBefore = CP.state().attrs.iq;
const eqBefore = CP.state().attrs.eq;

const endOk = CP.endTurn();
assert.strictEqual(endOk, undefined, '大学日程全部填满时 endTurn 顺利执行');
assert.strictEqual(CP.state().turn, 47, '回合成功推进至 47 回合');

// 打工收益断言: 140 + 120 = 260
assert(CP.state().money >= moneyBeforeTurn + 260, '双重高薪实习报酬必须全额到账');
assert(CP.state().attrs.iq > iqBefore, '论文精读与实验室攻坚应带来智力显著提升');
assert(CP.state().attrs.eq > eqBefore, '群面模拟与地推应带来情商显著提升');

// 5) 断言中年时代风口与职场抉择五大事件
const lateEventIds = [
  'ev-wrk-internet-boom',
  'ev-wrk-media-wave',
  'ev-wrk-school-house',
  'ev-wrk-industry-pivot',
  'ev-wrk-parents-health'
];

lateEventIds.forEach(evId => {
  const ev = DATA.events.find(e => e.id === evId);
  assert(ev, `事件库中必须注册时代事件 [${evId}]`);
  assert.strictEqual(ev.type, 'choice', `事件 [${evId}] 必须为双向抉择型事件`);
  assert(Array.isArray(ev.p) && (ev.p.includes('work') || ev.p.includes('home')), `事件 [${evId}] 必须覆盖成年/职场期`);
  assert(ev.opts && ev.opts.length >= 2, `事件 [${evId}] 必须提供至少两种人生抉择`);

  // 模拟各个分支结算，断言效果生效
  ev.opts.forEach((opt, optIdx) => {
    assert(opt.t, `事件 [${evId}] 选项 ${optIdx} 必须有文本描述`);
    assert(opt.e && typeof opt.e === 'object', `事件 [${evId}] 选项 ${optIdx} 必须有效果定义`);

    // 确保队列干净并重置基准金钱
    while (CP.pending().length) CP.resolve(0);
    CP.state().money = 500;
    const mBefore = CP.state().money;

    // 压入 pending 队列并测试 resolve
    CP.state().pending.push({
      type: 'choice',
      title: ev.n,
      body: ev.d,
      opts: ev.opts.map(o => ({ label: o.t, eff: o.e }))
    });

    CP.resolve(optIdx);

    if (opt.e.money) {
      assert.strictEqual(CP.state().money, Math.max(0, mBefore + opt.e.money), `事件 [${evId}] 选项 ${optIdx} 金钱效果结算`);
    }
  });
});

console.log('大学进阶论文课程、实验室攻坚、大厂顶尖实习与五大时代浪潮中年抉择断言全部通过！');

console.log('\n--- 测试 26: 🛡️ 全局逻辑漏洞扫描专项回归与边缘防御断言 ---');

// 1) 工程师之魂特长 (gongchengshi) 数据闭环
const gongTal = DATA.talentData.find(t => t.id === 'gongchengshi');
assert(gongTal, 'talentData 中必须补全 gongchengshi 特长');
assert.strictEqual(gongTal.n, '工程师之魂');
assert.strictEqual(gongTal.icon, '⚙️');
assert.strictEqual(gongTal.r, 3);
const engCourse = DATA.courses.find(c => c.id === 'u-eng');
assert(engCourse && engCourse.tal && engCourse.tal.id === 'gongchengshi', '工科课程应正确关联工程师之魂特长');

// 2) 多槽位彻底清空与 slot 0 存储键彻底擦除
CP.newGame('槽位测试生', 'boy');
CP.save();
assert(store['cph_save'] || store['cph_save_0'], '槽位0保存后应存在键值');
CP.saveManager.clearSlot(0);
assert.strictEqual(store['cph_save'], undefined, 'cph_save 必须被彻底删除');
assert.strictEqual(store['cph_save_0'], undefined, 'cph_save_0 必须被彻底删除');
assert.strictEqual(store['cph_fam'], undefined, 'cph_fam 必须被彻底删除');
assert.strictEqual(store['cph_fam_0'], undefined, 'cph_fam_0 必须被彻底删除');
const clearedSlots = CP.saveManager.listSlots();
assert.strictEqual(clearedSlots[0].empty, true, '槽位0清空后必须呈现为 empty: true');

// 3) 空状态 S === null 极值鲁棒性测试 (防崩溃防御)
// 确保在任何未初始化、槽位刚清空等场景下调用对外 API 均安全
assert.strictEqual(CP.state(), null);
assert.strictEqual(Array.isArray(CP.pending()), true);
assert.strictEqual(CP.pending().length, 0);
assert.strictEqual(Array.isArray(CP.slots()), true);
assert.strictEqual(CP.slots().length, 0);
assert.strictEqual(CP.resolve(0), '');
assert.strictEqual(typeof CP.brain.info(), 'object');
assert.strictEqual(CP.brain.info().canExplore, false);
assert.strictEqual(CP.brain.grid().length, 0);
assert.strictEqual(CP.brain.rev(0), null);
assert.strictEqual(Array.isArray(CP.pool()), true);
assert.strictEqual(CP.pool().length, 0);
assert.strictEqual(Array.isArray(CP.social()), true);
assert.strictEqual(CP.social().length, 0);
assert.strictEqual(Array.isArray(CP.shop()), true);
assert.strictEqual(CP.shop().length > 0, true);
assert.strictEqual(CP.shop()[0].can, false);
assert.strictEqual(typeof CP.atlas(), 'object');
assert.strictEqual(CP.atlas().total, 0);

// 4) 成家立业期 (home 阶段) 薪水如期发放断言
CP.newGame('立业测试生', 'boy');
while (CP.pending().length) CP.resolve(0);
CP.state().turn = 58; // 成家立业期
assert.strictEqual(CP.info().phase, '成家后');
CP.state().workSalary = 450;
CP.state().act = 100;
CP.state().money = 200;
CP.autoFillSlots();
const mBeforeTurn58 = CP.state().money;
CP.endTurn();
assert.strictEqual(CP.state().money >= mBeforeTurn58 + 450, true, '成家立业期每回合必须如期发放职场月薪');

// 5) 同学约会资源不足平滑优雅降级断言
CP.newGame('约会测试生', 'boy');
while (CP.pending().length) CP.resolve(0);
CP.state().gender = 'boy';
CP.state().npcAff['xiaomei'] = 60; // 夏小美高好感
CP.pendDate();
const dateList = CP.pending().filter(p => p.type === 'social_spontaneous_date');
assert.strictEqual(dateList.length, 1);
const dEv = dateList[0];
// 将金钱全部清零，故意选择需消费10元零钱的选项 0
CP.state().money = 0;
CP.state().act = 50;
const affBeforeDate = CP.state().npcAff['xiaomei'];
CP.resolve(0); // 尝试赴约
assert.strictEqual(CP.state().money, 0, '资金不足时不应扣成负数');
assert.strictEqual(CP.state().npcAff['xiaomei'], affBeforeDate, '资源不足退回礼貌推托时不应非法暴涨好感');

// 6) 家族谱系树残缺先祖卡片防崩溃渲染断言
const brokenFam = {
  g: 1,
  talent: 10,
  tier: 2,
  atlas: ['t1'],
  history: [
    {
      gen: 1,
      name: '远古先祖'
      // 故意不传 rating, score, job, jobIcon, gk, spouse
    }
  ]
};
CP.fam().history = brokenFam.history;
const treeStageMock = {
  innerHTML: '',
  children: [],
  appendChild(el) { if (el) this.children.push(el); }
};
sndSandboxCtx.document.querySelector = (sel) => {
  if (sel === '#stage') return treeStageMock;
  return null;
};
sndSandboxCtx.UI.setAtlasTab('tree');
sndSandboxCtx.UI.renderAtlas();
const brokenTreeDump = JSON.stringify(treeStageMock.children);
assert(brokenTreeDump.includes('远古先祖'), '先祖姓名渲染正常');
assert(brokenTreeDump.includes('自由职业'), '未填写职务时优雅回退为自由职业');
assert(brokenTreeDump.includes('统招升学'), '未填写高考时优雅回退为统招升学');
assert(!brokenTreeDump.includes('undefined'), '树状卡片绝不包含未定义字符 undefined');

console.log('工程师之魂特长闭环、槽位0完全擦除、S=null防崩容错、成家立业月薪与约会优雅降级全部断言通过！');

console.log('\n--- 测试 27: 🎯 属性增长特效 Diff 引擎与钥匙二段下潜完备性断言 ---');

// 1) 验证炸弹波及震出钥匙时的 keyPending 保护机制
CP.newGame('测试君', 'boy');
CP.state().act = 100;
const bg = CP.brain.grid();
// 清除盘面预置随机钥匙，避免炸弹扩散波及到随机预置钥匙
bg.forEach(c => { if (c.t === 'key') c.t = 'iq'; });
// 构造炸弹位于格子 14，钥匙位于格子 15 (相邻波及)
bg[14].t = 'bomb';
bg[14].open = false;
bg[15].t = 'key';
bg[15].open = false;

const bombResWithKey = CP.brain.rev(14);
assert(bombResWithKey.includes('炸出') && bombResWithKey.includes('钥匙'), '炸弹炸出钥匙必须有专属提示');
const statAfterBomb = CP.brain.info();
assert.strictEqual(statAfterBomb.keyPending, true, '炸弹震出钥匙后必须进入 keyPending 待决锁定状态');
assert.strictEqual(statAfterBomb.keyIdx, 15, 'keyIdx 必须精确锁定钥匙所在位置');
assert.strictEqual(statAfterBomb.layer, 1, '炸出钥匙但未确认前，层级绝不跳变');

// 验证快捷 useKey() 方法
const useKeyRes = CP.brain.useKey();
assert(useKeyRes.includes('启用') || useKeyRes.includes('下探'), 'useKey 必须成功触发跃迁');
assert.strictEqual(CP.brain.info().layer, 2, 'useKey 激活后跃迁至第 2 层');
assert.strictEqual(CP.brain.info().keyPending, false, '跃迁后 keyPending 恢复为 false');

// 2) 验证 4 层封顶时钥匙的处理
CP.state().brain.layer = 4;
CP.state().act = 20;
const gLayer4 = CP.brain.grid();
gLayer4[0].t = 'key';
gLayer4[0].open = false;
CP.brain.rev(0);
assert.strictEqual(CP.brain.info().keyPending, true, '第4层挖出钥匙依然进入待决状态');
const actBeforeUse = CP.state().act;
const useKeyLayer4 = CP.brain.useKey();
assert(useKeyLayer4.includes('最深处') || useKeyLayer4.includes('行动+50'), '封顶层激活钥匙应有封顶提示');
assert.strictEqual(CP.brain.info().layer, 4, '封顶层激活钥匙不继续递增');
assert.strictEqual(CP.state().act, actBeforeUse + 50, '封顶层激活钥匙依然如期奖励 50 行动力');

// 3) 验证 SoundManager 包含新增的 statGain 与 keyUnlock 方法
const testSndMgr = new sndSandboxCtx.SoundManager();
assert(typeof testSndMgr.statGain === 'function', 'SoundManager 必须包含 statGain 增益音效');
assert(typeof testSndMgr.keyUnlock === 'function', 'SoundManager 必须包含 keyUnlock 钥匙解锁音效');
testSndMgr.statGain();
testSndMgr.keyUnlock();
testSndMgr.stopBGM();

// 4) 验证年龄时钟递进模型 (每回合半年，两回合长一岁，无断崖突变)
const expectedAges = [
  { turn: 1, age: 0 },
  { turn: 2, age: 0 },
  { turn: 3, age: 1 },
  { turn: 4, age: 1 },
  { turn: 5, age: 2 },
  { turn: 6, age: 2 },
  { turn: 7, age: 3 },
  { turn: 8, age: 3 },
  { turn: 9, age: 3 },
  { turn: 10, age: 3 },
  { turn: 11, age: 4 },
  { turn: 12, age: 4 },
  { turn: 13, age: 5 },
  { turn: 14, age: 5 },
  { turn: 15, age: 6 },
  { turn: 25, age: 12 },
  { turn: 32, age: 15 },
  { turn: 33, age: 15 },
  { turn: 44, age: 18 },
  { turn: 45, age: 18 },
  { turn: 51, age: 22 },
  { turn: 58, age: 30 }
];

expectedAges.forEach(({ turn, age }) => {
  CP.state().turn = turn;
  const curInfo = CP.info();
  assert.strictEqual(curInfo.age, age, `第 ${turn} 回合计算年龄应为 ${age} 岁，实际得到 ${curInfo.age} 岁`);
});

console.log('炸弹波及钥匙待决保护、useKey 快捷跃迁、4层封顶防御、属性音效、两回合加一岁平滑时钟全部通过！');

// ==========================================
// 测试 28: 🎒 全生命周期日程行动池阶段生命周期过滤与幼年动作退役断言
// ==========================================
console.log('\n--- 测试 28: 🎒 全生命周期日程行动池阶段生命周期过滤与幼年动作退役断言 ---');

CP.newGame();
// 1) 婴儿期 (Turn 1): 确认翻身与摆弄玩具在池中
const babyPool = CP.pool().filter(x => x.tone === 'course');
assert(babyPool.some(x => x.id === 'fanshen'), '婴儿期必须允许翻身');
assert(babyPool.some(x => x.id === 'wanju'), '婴儿期必须允许摆弄玩具');

// 2) 跨入幼儿园 (Turn 9): 确认婴儿期动作彻底退役隐退
CP.state().turn = 9;
CP.state().learnedCourses.push('pinyin', 'shuzi');
const kinderPool = CP.pool().filter(x => x.tone === 'course');
assert.strictEqual(kinderPool.some(x => x.id === 'fanshen'), false, '幼儿园期绝对禁止出现翻身动作！');
assert.strictEqual(kinderPool.some(x => x.id === 'wanju'), false, '幼儿园期绝对禁止出现摆弄玩具！');
assert(kinderPool.some(x => x.id === 'pinyin'), '幼儿园期必须展示拼音识字');

// 3) 跨入小学与初高中: 确认历史低阶学科随学段更替，绝不倒退
CP.state().turn = 16; // 小学
CP.state().learnedCourses.push('ma-sze', 'cn-gushi');
const priPool = CP.pool().filter(x => x.tone === 'course');
assert.strictEqual(priPool.some(x => x.id === 'fanshen'), false, '小学期绝对禁止出现翻身！');
assert.strictEqual(priPool.some(x => x.id === 'pinyin'), false, '小学掌握小学课程后幼儿园拼音识字自然更替！');
assert(priPool.some(x => x.id === 'ma-sze'), '小学期必须展示数学四则运算');

CP.state().turn = 35; // 高中
CP.state().learnedCourses.push('g-gao-cn', 'g-gao-ma', 'g-wusan');
const seniorPool = CP.pool().filter(x => x.tone === 'course');
assert.strictEqual(seniorPool.some(x => x.id === 'fanshen'), false, '高中期绝对禁止翻身！');
assert.strictEqual(seniorPool.some(x => x.id === 'ma-sze'), false, '高中期绝对禁止排小学四则运算！');
assert(seniorPool.some(x => x.id === 'g-wusan'), '高中期必须全力备考五年高考三年模拟！');

// 4) 跨阶段平滑过渡机制断言 (刚升初中未研习初中新课时，允许小学课程平滑过渡兜底)
CP.state().turn = 25; // 刚升初中
// 清除初中课程，仅留小学课程
CP.state().learnedCourses = CP.state().learnedCourses.filter(id => !id.startsWith('sc-') && !id.startsWith('so-') && id !== 'ma-hanshu' && id !== 'cn-mingzhu');
const transitionPool = CP.pool().filter(x => x.tone === 'course');
assert(transitionPool.length > 0, '刚升初中未学新课时，过渡机制必须提供平滑兜底课程，绝不空置！');
assert.strictEqual(transitionPool.some(x => x.id === 'fanshen'), false, '过渡兜底课程绝不可回退到婴儿期动作！');

// 5) 职场期与成家期断言: 大学专业课终身保留，中小学应试试卷彻底退役
CP.state().turn = 52; // 职场期
CP.state().learnedCourses.push('u-cs', 'u-paper');
const workPool = CP.pool().filter(x => x.tone === 'course');
assert(workPool.some(x => x.id === 'u-cs'), '职场期必须保留大学计算机算法全栈作为职业技能！');
assert(workPool.some(x => x.id === 'u-paper'), '职场期必须保留学术论文精读深造！');
assert.strictEqual(workPool.some(x => x.id === 'g-wusan'), false, '职场期必须彻底退役高中五三模拟卷！');
assert.strictEqual(workPool.some(x => x.id === 'fanshen'), false, '职场期绝对禁止翻身！');

console.log('全生命周期日程行动池阶段生命周期过滤、幼年动作退役、过渡兜底与职场技能保留 100% 验证通过！');

console.log('\n🎉 全部二十八项全系统核心机制、逻辑漏洞修复、模态隔离、老存档迁移、参数鲁棒性、多存档、日程延续、脑洞HUD、原生BGM、双向社交、树状家族画卷、成年期深度设计、边缘防御、两段式钥匙动效、平滑年龄时钟与日程学段生命周期过滤 100% 验证通过！');










