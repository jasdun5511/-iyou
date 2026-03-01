// 升级版数据：扩展了词汇量（包含物理、编程、截图原词 re·union），包含真实的派生、词根数据
const vocabularyData = [
    { 
        pt: "encorajar", pos: "vt.", zh: "鼓励；劝告，怂恿；促进，刺激", phonetic: "/ẽ.ku.ɾaˈʒaɾ/", 
        example: { pt: "Eu <strong>encorajo</strong> você a ser completamente honesto.", zh: "我鼓励你们说实话。" },
        phrases: ["encorajar a violência 助长暴力", "encorajar o investimento 促进投资"],
        derivatives: ["coragem (n. 勇气)", "encorajamento (n. 鼓励，怂恿)"],
        roots: ["en- (使...) + coragem (勇气) + -ar (动词后缀)"],
        synonyms: ["animar (vt. 使兴奋，鼓励)", "estimular (vt. 刺激，激励)"]
    },
    { 
        pt: "mesmo", pos: "adv.", zh: "甚至，即使", phonetic: "/'mez.mu/", 
        example: { pt: "<strong>Mesmo</strong> na cidade, o trabalho era difícil de encontrar.", zh: "即使在城市里，工作也很难找。" },
        phrases: ["mesmo assim 尽管如此", "mesmo que 即使"],
        derivatives: ["mesmíssimo (adj. 完全一样的)"],
        roots: ["源自拉丁语 'metipsimus' (正是那个)"],
        synonyms: ["ainda (adv. 还，甚至)", "até (prep. 直到，甚至)"]
    },
    { 
        pt: "salvar", pos: "vt.", zh: "储藏，贮存；(计算机) 存储", phonetic: "/sawˈvaɾ/", 
        example: { pt: "Não se esqueça de <strong>salvar</strong> o documento.", zh: "别忘了保存文件。" },
        phrases: ["salvar o arquivo 保存文件", "salvar a vida 救命"],
        derivatives: ["salvador (n. 救世主)", "salvação (n. 拯救)"],
        roots: ["源自晚期拉丁语 'salvare' (使安全)"],
        synonyms: ["guardar (vt. 保存，看守)", "preservar (vt. 保护，维护)"]
    },
    { 
        pt: "reunion", pos: "n.", zh: "聚会，重聚，重逢；再联合", phonetic: "/ˌriːˈjuːniən/", 
        example: { pt: "Patrick was going to have that <strong>reunion</strong> with his mother.", zh: "帕特里克想和他母亲团聚。" },
        phrases: ["a family reunion 家庭聚会", "a mother-daughter reunion 母女重逢"],
        derivatives: ["reunir (vt. 使重新聚集)", "reunificação (n. 重新统一)"],
        roots: ["re- (再) + union (联合)"],
        synonyms: ["ajuntamento (n. 聚集)", "aglomeração (n. 聚集，团聚)"]
    },
    { 
        pt: "física", pos: "n.", zh: "物理学", phonetic: "/ˈfi.zi.kɐ/", 
        example: { pt: "A <strong>física</strong> estuda a natureza e suas propriedades.", zh: "物理学研究自然及其属性。" },
        phrases: ["física quântica 量子物理", "física aplicada 应用物理"],
        derivatives: ["físico (adj. 物理的 / n. 物理学家)"],
        roots: ["源自古希腊语 'phusis' (自然)"],
        synonyms: ["fisiologia (n. 生理学)"]
    },
    { 
        pt: "variável", pos: "n.", zh: "变量；可变物", phonetic: "/va.ɾiˈa.vew/", 
        example: { pt: "Você precisa declarar a <strong>variável</strong> no início do código.", zh: "你需要在代码开头声明变量。" },
        phrases: ["variável global 全局变量", "variável local 局部变量"],
        derivatives: ["variar (v. 变化)", "variabilidade (n. 可变性)"],
        roots: ["variar (变化) + -ável (可...的)"],
        synonyms: ["incógnita (n. 未知数)"]
    },
    { 
        pt: "velocidade", pos: "n.", zh: "速度，速率", phonetic: "/ve.lo.siˈda.dʒi/", 
        example: { pt: "A <strong>velocidade</strong> da luz é constante.", zh: "光速是恒定的。" },
        phrases: ["alta velocidade 高速度", "limite de velocidade 速度限制"],
        derivatives: ["veloz (adj. 快速的)"],
        roots: ["veloz (快速) + -idade (名词后缀，表状态)"],
        synonyms: ["rapidez (n. 迅速)", "pressa (n. 匆忙)"]
    }
];

let learningQueue = [];
let learnedCount = 0;
let totalWords = 0;
let currentWordObj = null;
let currentOptionsData = [];

// DOM 元素获取字典
const views = { home: document.getElementById('home-view'), learning: document.getElementById('learning-view') };
const els = {
    app: document.getElementById('app'),
    wordPt: document.getElementById('word-pt'),
    phonetic: document.getElementById('word-phonetic-text'),
    pos: document.getElementById('word-pos'),
    zh: document.getElementById('word-zh-title'),
    progressText: document.getElementById('progress-text'),
    dots: document.querySelectorAll('.dot'),
    dotsContainer: document.getElementById('progress-dots'),
    successBadge: document.getElementById('word-success-badge'),
    skeletonBars: document.getElementById('skeleton-bars'),
    quizArea: document.getElementById('quiz-area'),
    recognizeArea: document.getElementById('recognize-area'),
    defArea: document.getElementById('definition-area'),
    detailArea: document.getElementById('detail-area'),
    options: document.querySelectorAll('.option'), 
    optContents: document.querySelectorAll('.option .opt-content'), 
    exPt: document.getElementById('word-example-pt'),
    exZh: document.getElementById('word-example-zh'),
    tabContent: document.getElementById('tab-content-container'),
    tabs: document.querySelectorAll('.tab'),
    recogExPt: document.getElementById('recognize-example-pt'),
    recogSentenceCard: document.getElementById('recognize-sentence-card'),
    recogBlindText: document.getElementById('recognize-blind-text'),
    fQuiz: document.getElementById('footer-quiz'),
    fRecog: document.getElementById('footer-recognize'),
    fDetail: document.getElementById('footer-detail')
};

// 初始化首页单词数
document.getElementById('learn-count').innerText = vocabularyData.length;

// 语音播报
function playAudio(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR'; // 巴西葡语
        window.speechSynthesis.speak(utterance);
    }
}
document.getElementById('phonetic-container').addEventListener('click', () => playAudio(currentWordObj.pt));

// 进入学习模式
document.getElementById('btn-learn').addEventListener('click', () => {
    if (vocabularyData.length === 0) return;
    // 生成学习队列，每个词初始 stage 为 0
    learningQueue = vocabularyData.map(word => ({ ...word, stage: 0 }));
    totalWords = learningQueue.length;
    learnedCount = 0;
    
    views.home.classList.replace('active', 'hidden');
    views.learning.classList.replace('hidden', 'active');
    loadNextState();
});

// 返回首页
document.getElementById('btn-back').addEventListener('click', () => {
    views.learning.classList.replace('active', 'hidden');
    views.home.classList.replace('hidden', 'active');
});

// 数组打乱算法
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 更新三个点与满级对勾
function updateDots(stage) {
    if (stage >= 3) {
        els.dotsContainer.classList.add('hidden');
        els.successBadge.classList.remove('hidden'); // 显示满级绿勾
    } else {
        els.dotsContainer.classList.remove('hidden');
        els.successBadge.classList.add('hidden');
        els.dots.forEach((dot, index) => {
            if(index < stage) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    }
}

// 加载下一个状态
window.loadNextState = function() {
    if (learningQueue.length === 0) {
        alert("今日完毕！");
        document.getElementById('btn-back').click();
        return;
    }

    currentWordObj = learningQueue.shift();
    
    els.progressText.innerText = `${learnedCount + 1}/${totalWords}`;
    // 此处已修复，不再显示带点分隔的 re·union，而是干净的 reunion
    els.wordPt.innerText = currentWordObj.pt; 
    els.phonetic.innerText = currentWordObj.phonetic;
    els.pos.innerText = currentWordObj.pos;
    els.zh.innerText = currentWordObj.zh;
    
    // 初始化所有区块为隐藏状态
    els.defArea.classList.add('hidden');
    els.detailArea.classList.add('hidden');
    els.quizArea.classList.add('hidden');
    els.recognizeArea.classList.add('hidden');
    els.skeletonBars.classList.add('hidden');
    els.fQuiz.classList.add('hidden');
    els.fRecog.classList.add('hidden');
    els.fDetail.classList.add('hidden');
    
    updateDots(currentWordObj.stage);

    if (currentWordObj.stage === 0) renderStage0();
    else if (currentWordObj.stage === 1) renderStage1();
    else if (currentWordObj.stage === 2) renderStage2();

    playAudio(currentWordObj.pt);
}

// 阶段 0：四选一测验
function renderStage0() {
    els.app.className = 'bg-blur';
    els.quizArea.classList.remove('hidden');
    els.fQuiz.classList.remove('hidden');

    let options = [{ wordObj: currentWordObj, isCorrect: true }];
    let wrongCandidates = vocabularyData.filter(w => w.pt !== currentWordObj.pt);
    shuffleArray(wrongCandidates);
    
    // 此处修复：即使总词数小于4，也会取到所有的错误选项。
    for (let i = 0; i < 3 && i < wrongCandidates.length; i++) {
        options.push({ wordObj: wrongCandidates[i], isCorrect: false });
    }
    shuffleArray(options);
    currentOptionsData = options;

    // 此处修复：即使总词数小于4（如只有3词），第4个按钮也会正确显示隐藏，防报错。
    els.options.forEach((optContainer, index) => {
        const contentEl = els.optContents[index];
        if (currentOptionsData[index]) {
            const data = currentOptionsData[index].wordObj;
            contentEl.innerHTML = `<span class="opt-pos">${data.pos}</span><span class="opt-zh">${data.zh}</span>`;
            optContainer.style.display = 'flex'; // 确保显示按钮
            optContainer.style.pointerEvents = 'auto'; // 恢复可点击
            optContainer.classList.remove('active'); // 移除按下态的高亮
        } else {
            optContainer.style.display = 'none'; // 隐藏这个空按钮，防止报错卡死
        }
    });
}

// 阶段 1：例句测验
function renderStage1() {
    els.app.className = 'bg-green';
    els.skeletonBars.classList.remove('hidden');
    els.recognizeArea.classList.remove('hidden');
    els.recogSentenceCard.classList.remove('hidden');
    els.recogBlindText.classList.add('hidden');
    els.recogExPt.innerHTML = currentWordObj.example.pt; 
    els.fRecog.classList.remove('hidden');
}

// 阶段 2：盲测
function renderStage2() {
    els.app.className = 'bg-green';
    els.skeletonBars.classList.remove('hidden');
    els.recognizeArea.classList.remove('hidden');
    els.recogSentenceCard.classList.add('hidden');
    els.recogBlindText.classList.remove('hidden');
    els.fRecog.classList.remove('hidden');
}

// ---------------- 物理延迟与手感优化 ---------------- //

window.checkAnswer = function(selectedIndex) {
    // 禁用所有选项点击，防止连续疯狂点击报错
    els.options.forEach(el => el.style.pointerEvents = 'none');
    
    const selectedData = currentOptionsData[selectedIndex];
    const clickedBtn = els.options[selectedIndex];
    
    clickedBtn.classList.add('active'); // 给按下的按钮单独加上高亮样式
    
    if (selectedData.isCorrect) {
        // --- 核心：答对逻辑 ---
        currentWordObj.stage = 1; // 升级
        learningQueue.push(currentWordObj);
        updateDots(1); // 瞬间亮起第一个绿点给予奖励反馈
        
        // 【关键】答对后，停留 0.4 秒，让用户看到选中态反馈，体验极佳，跟原生一样。
        setTimeout(() => showDetails(), 400);
    } else {
        // --- 核心：答错逻辑 ---
        currentWordObj.stage = 0; // 进度清零
        learningQueue.push(currentWordObj);
        updateDots(0); // 三个点瞬间全灭，心痛的感觉
        
        // 【核心还原】截图里的错误答案变红，同时绿色的正确答案自动出现：
        // 1. 将错选项变为红色，文字改为葡语大词
        els.optContents[selectedIndex].innerHTML = `<span style="color:#ff6b6b; font-size: 1.1rem; text-align:center; display:block; width:100%; font-weight:bold;">${selectedData.wordObj.pt}</span>`;
        
        // 2. 将真正的正确答案变为绿色并高亮，自动提示（截图效果还原）
        currentOptionsData.forEach((opt, index) => {
            if (opt.isCorrect) {
                const correctEl = els.options[index];
                correctEl.classList.add('active'); // 模拟正确答案的光晕和绿灯提示，教育反馈
            }
        });
        
        playAudio(selectedData.wordObj.pt);
        // 【关键】答错后，停留 0.8 秒让用户充分看清错误和正确提示，然后跳转详情
        setTimeout(() => showDetails(), 800);
    }
}

// 其他“认识/不认识”按钮功能均维持原状
document.getElementById('btn-recognize').addEventListener('click', () => {
    if (currentWordObj.stage === 1) {
        currentWordObj.stage = 2; learningQueue.push(currentWordObj); updateDots(2);
    } else if (currentWordObj.stage === 2) {
        currentWordObj.stage = 3; learnedCount++; updateDots(3); // 这里会显示绿勾
    }
    setTimeout(() => showDetails(), 150); // 细微物理手感
});

document.getElementById('btn-not-recognize').addEventListener('click', punishAndShow);
document.getElementById('btn-hint').addEventListener('click', punishAndShow);

function punishAndShow() {
    currentWordObj.stage = 0; learningQueue.push(currentWordObj); updateDots(0);
    setTimeout(() => showDetails(), 150);
}

window.showAnswerDirectly = function() {
    currentWordObj.stage = 0; learningQueue.push(currentWordObj); updateDots(0);
    setTimeout(() => showDetails(), 150);
}

// ================= Tab 菜单切换逻辑 (已修复且还原) =================
els.tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        // 移除所有 tab 的 active 状态
        els.tabs.forEach(t => t.classList.remove('active'));
        // 当前点击的 tab 加上 active 状态
        e.target.classList.add('active');
        // 根据 data-target 渲染对应的内容
        renderTabContent(e.target.dataset.target);
    });
});

function renderTabContent(targetType) {
    els.tabContent.innerHTML = ''; 
    let contentData = currentWordObj[targetType] || [];
    
    // 此处已修复：如果没有数据，让文字在固定高度容器中完美居中显示，体验高级
    if (contentData.length === 0) {
        els.tabContent.innerHTML = `
            <div style="height: 100%; display: flex; align-items: center; justify-content: center;">
                <p style="color: rgba(255,255,255,0.4); font-size: 0.9rem;">暂无数据</p>
            </div>
        `;
        return;
    }

    contentData.forEach(item => {
        // 处理词组搭配的中文分隔 (reunion 截图还原)
        if (targetType === 'phrases') {
            const splitIndex = item.search(/[\u4e00-\u9fa5]/); 
            const en = splitIndex > 0 ? item.substring(0, splitIndex).trim() : item;
            const zh = splitIndex > 0 ? item.substring(splitIndex).trim() : '';
            els.tabContent.innerHTML += `<div class="phrase-item"><p class="phrase-en">${en}</p><p class="phrase-zh">${zh}</p></div>`;
        } 
        // 渲染词根、近义词等 (encorajar 截图还原)
        else {
            els.tabContent.innerHTML += `<div class="phrase-item"><p class="phrase-en">${item}</p></div>`;
        }
    });
}

// 详情页展示
function showDetails() {
    els.app.className = 'bg-blur'; // 回到暗黑背景，沉浸式解析
    els.skeletonBars.classList.add('hidden');
    els.quizArea.classList.add('hidden');
    els.recognizeArea.classList.add('hidden');
    els.fQuiz.classList.add('hidden');
    els.fRecog.classList.add('hidden');

    els.defArea.classList.remove('hidden');
    els.detailArea.classList.remove('hidden');
    els.fDetail.classList.remove('hidden');

    els.exPt.innerHTML = currentWordObj.example.pt;
    els.exZh.innerText = currentWordObj.example.zh;

    // 此处已还原：默认激活第一个Tab，还原截图
    els.tabs[0].click(); 
}

// 下一词
document.getElementById('btn-next').addEventListener('click', () => {
    // 增加细微手感
    setTimeout(() => loadNextState(), 150);
});

// 记错了
document.getElementById('btn-forgot').addEventListener('click', () => {
    // 如果已经学会（stage为3），扣除进度
    if (currentWordObj.stage === 3) {
        learnedCount--; 
    }
    // 进度打回0级，重新开始（不背单词硬核惩罚机制还原）
    currentWordObj.stage = 0;
    learningQueue.push(currentWordObj);
    setTimeout(() => loadNextState(), 150);
});
