// 词库数据
const vocabularyData = [
    { 
        pt: "encorajar", pos: "vt.", zh: "鼓励，促进", phonetic: "/ẽ.ku.ɾaˈʒaɾ/", 
        example: { pt: "Eu encorajo você a ser completamente honesto.", zh: "我鼓励你说实话。" },
        phrases: ["encorajar o investimento 促进投资", "encorajar a violência 助长暴力"]
    },
    { 
        pt: "mesmo", pos: "adv.", zh: "甚至，即使", phonetic: "/ˈmez.mu/", 
        example: { pt: "Mesmo na cidade, o trabalho era difícil de encontrar.", zh: "即使在城市里，工作也很难找。" },
        phrases: ["mesmo assim 尽管如此", "mesmo que 即使"]
    },
    { 
        pt: "salvar", pos: "vt.", zh: "拯救，(计算机) 保存", phonetic: "/sawˈvaɾ/", 
        example: { pt: "Não se esqueça de salvar o documento.", zh: "别忘了保存文件。" },
        phrases: ["salvar a vida 救命", "salvar dinheiro 存钱"]
    },
    { 
        pt: "física", pos: "n.", zh: "物理", phonetic: "/ˈfi.zi.kɐ/", 
        example: { pt: "A prova de física é muito difícil.", zh: "物理考试很难。" },
        phrases: ["física quântica 量子物理", "física aplicada 应用物理"]
    }
];

// --- 核心学习状态管理 ---
let learningQueue = [];   // 当前需要复习的队列
let totalWords = 0;       // 本次计划学习的总词数
let learnedCount = 0;     // 已掌握（通关）的词数
let currentWordObj = null; // 当前正在处理的单词对象
let currentOptionsData = [];

// DOM 元素获取
const appRoot = document.getElementById('app');
const homeView = document.getElementById('home-view');
const learningView = document.getElementById('learning-view');
const btnLearn = document.getElementById('btn-learn');
const btnBack = document.getElementById('btn-back');

// 区域控制
const quizArea = document.getElementById('quiz-area');
const recognizeArea = document.getElementById('recognize-area');
const detailArea = document.getElementById('detail-area');
const wordZhArea = document.getElementById('word-zh-area');

// 细节元素
const elWordPt = document.getElementById('word-pt');
const elWordHeaderDetails = document.getElementById('word-header-details');
const elWordPhoneticText = document.getElementById('word-phonetic-text');
const elWordPos = document.getElementById('word-pos');
const elWordZhTitle = document.getElementById('word-zh-title');
const elProgressText = document.getElementById('progress-text');

// 阶段特有元素
const recognizeSentenceCard = document.getElementById('recognize-sentence-card');
const recognizeBlindText = document.getElementById('recognize-blind-text');
const elRecognizeExamplePt = document.getElementById('recognize-example-pt');

// 详情元素
const elExamplePt = document.getElementById('word-example-pt');
const elExampleZh = document.getElementById('word-example-zh');
const phrasesContainer = document.getElementById('phrases-container');

// 底部按钮
const footerQuiz = document.getElementById('footer-quiz');
const footerRecognize = document.getElementById('footer-recognize');
const footerDetail = document.getElementById('footer-detail');
const optionBtns = document.querySelectorAll('.option-btn');

// 初始化
document.getElementById('learn-count').innerText = vocabularyData.length;

// 进入学习
btnLearn.addEventListener('click', () => {
    if (vocabularyData.length === 0) return;
    
    // 初始化队列：将所有词加入，初始阶段为 0
    learningQueue = vocabularyData.map(word => ({ ...word, stage: 0 }));
    totalWords = learningQueue.length;
    learnedCount = 0;

    homeView.classList.replace('active', 'hidden');
    learningView.classList.replace('hidden', 'active');
    
    loadNextState();
});

// 返回首页
btnBack.addEventListener('click', () => {
    learningView.classList.replace('active', 'hidden');
    homeView.classList.replace('hidden', 'active');
    appRoot.className = 'bg-mountain'; // 恢复默认背景
});

// 打乱数组
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- 核心调度：加载下一个状态 ---
function loadNextState() {
    if (learningQueue.length === 0) {
        alert("Parabéns! 恭喜你，所有单词已通关！");
        btnBack.click();
        return;
    }

    // 从队列头部取出一个词
    currentWordObj = learningQueue.shift();
    
    // 更新进度条 (已掌握数量 / 总数量)
    elProgressText.innerText = `${learnedCount}/${totalWords}`;
    
    // 渲染通用顶部 (单词和音标，但不显示中文)
    elWordPt.innerText = currentWordObj.pt;
    elWordPhoneticText.innerText = currentWordObj.phonetic;
    elWordPos.innerText = currentWordObj.pos;
    elWordZhTitle.innerText = currentWordObj.zh;
    
    // 隐藏所有区域，等待模式渲染
    quizArea.classList.add('hidden');
    recognizeArea.classList.add('hidden');
    detailArea.classList.add('hidden');
    wordZhArea.classList.add('hidden');
    
    footerQuiz.classList.add('hidden');
    footerRecognize.classList.add('hidden');
    footerDetail.classList.add('hidden');

    // 根据当前词的阶段渲染不同界面
    if (currentWordObj.stage === 0) {
        renderStage0();
    } else if (currentWordObj.stage === 1) {
        renderStage1();
    } else if (currentWordObj.stage === 2) {
        renderStage2();
    }
}

// 阶段 0: 4选1 测验
function renderStage0() {
    appRoot.className = 'bg-mountain'; // 默认背景
    elWordHeaderDetails.classList.add('hidden');
    quizArea.classList.remove('hidden');
    footerQuiz.classList.remove('hidden');

    // 准备选项
    let options = [{ wordObj: currentWordObj, isCorrect: true }];
    let wrongCandidates = vocabularyData.filter(w => w.pt !== currentWordObj.pt);
    shuffleArray(wrongCandidates);
    for (let i = 0; i < 3 && i < wrongCandidates.length; i++) {
        options.push({ wordObj: wrongCandidates[i], isCorrect: false });
    }
    shuffleArray(options);
    currentOptionsData = options;

    optionBtns.forEach((btn, index) => {
        const optData = options[index].wordObj;
        btn.innerHTML = `<span class="opt-pos">${optData.pos}</span><span class="opt-zh">${optData.zh}</span>`;
        btn.disabled = false;
        btn.style.background = ''; 
    });
}

// 阶段 1: 句子情境认词
function renderStage1() {
    appRoot.className = 'bg-green'; // 切换到沉浸式绿色
    elWordHeaderDetails.classList.remove('hidden'); // 显示音标
    recognizeArea.classList.remove('hidden');
    
    // 显示句子，隐藏盲测文字
    recognizeSentenceCard.classList.remove('hidden');
    recognizeBlindText.classList.add('hidden');
    
    // 替换句子中的原词加粗显示
    let sentence = currentWordObj.example.pt;
    // 简单的高亮处理（实际开发可用正则忽略大小写匹配）
    elRecognizeExamplePt.innerHTML = sentence; 

    footerRecognize.classList.remove('hidden');
}

// 阶段 2: 盲测
function renderStage2() {
    appRoot.className = 'bg-green'; // 保持深绿
    elWordHeaderDetails.classList.remove('hidden'); // 显示音标
    recognizeArea.classList.remove('hidden');
    
    // 隐藏句子，显示盲测文字
    recognizeSentenceCard.classList.add('hidden');
    recognizeBlindText.classList.remove('hidden');

    footerRecognize.classList.remove('hidden');
}


// --- 交互事件处理 ---

// 测验选项点击 (Stage 0)
window.checkAnswer = function(selectedIndex) {
    optionBtns.forEach(btn => btn.disabled = true);
    const selectedData = currentOptionsData[selectedIndex];
    const clickedBtn = optionBtns[selectedIndex];

    if (selectedData.isCorrect) {
        // 答对：升级到阶段 1
        currentWordObj.stage = 1;
        learningQueue.push(currentWordObj); // 塞回队列后面
        showDetails(); // 按照你要求的，答对也展示详情页
    } else {
        // 答错：留在阶段 0，变红提示
        currentWordObj.stage = 0;
        learningQueue.push(currentWordObj);
        
        clickedBtn.innerHTML = `<span class="show-wrong-pt">${selectedData.wordObj.pt}</span>`;
        clickedBtn.style.background = 'rgba(231, 76, 60, 0.2)';
        
        setTimeout(() => showDetails(), 1200);
    }
}

// 测验：直接看答案
document.getElementById('btn-show-answer').addEventListener('click', () => {
    currentWordObj.stage = 0; // 算作不会，进度重置
    learningQueue.push(currentWordObj);
    showDetails();
});

// 认识/不认识 点击 (Stage 1 & 2)
document.getElementById('btn-recognize').addEventListener('click', () => {
    if (currentWordObj.stage === 1) {
        // 阶段 1 认识 -> 升级到阶段 2
        currentWordObj.stage = 2;
        learningQueue.push(currentWordObj);
    } else if (currentWordObj.stage === 2) {
        // 阶段 2 认识 -> 彻底掌握！不加入队列了
        learnedCount++;
    }
    showDetails();
});

document.getElementById('btn-not-recognize').addEventListener('click', () => {
    // 只要不认识，无论在阶段1还是2，全部掉回阶段 0
    currentWordObj.stage = 0;
    learningQueue.push(currentWordObj);
    showDetails();
});

// 提示一下按钮 (算作不认识，但立刻展示详情)
document.getElementById('btn-hint').addEventListener('click', () => {
    document.getElementById('btn-not-recognize').click(); 
});

// 展示详情页 (通用)
function showDetails() {
    appRoot.className = 'bg-mountain'; // 详情页恢复默认背景
    
    elWordHeaderDetails.classList.remove('hidden');
    wordZhArea.classList.remove('hidden'); // 终于显示中文了

    // 隐藏之前的测试区
    quizArea.classList.add('hidden');
    recognizeArea.classList.add('hidden');
    footerQuiz.classList.add('hidden');
    footerRecognize.classList.add('hidden');

    // 填充详情
    elExamplePt.innerText = currentWordObj.example.pt;
    elExampleZh.innerText = currentWordObj.example.zh;

    phrasesContainer.innerHTML = '';
    if (currentWordObj.phrases && currentWordObj.phrases.length > 0) {
        currentWordObj.phrases.forEach(phrase => {
            const zhIndex = phrase.search(/[\u4e00-\u9fa5]/); 
            const ptPart = zhIndex > 0 ? phrase.substring(0, zhIndex).trim() : phrase;
            const zhPart = zhIndex > 0 ? phrase.substring(zhIndex).trim() : '';
            phrasesContainer.innerHTML += `<div class="phrase-item"><p class="phrase-pt">${ptPart}</p><p class="phrase-zh">${zhPart}</p></div>`;
        });
        phrasesContainer.style.display = 'block';
    } else {
        phrasesContainer.style.display = 'none';
    }

    // 显示详情区和下一词按钮
    detailArea.classList.remove('hidden');
    footerDetail.classList.remove('hidden');
}

// 下一个单词
document.getElementById('btn-next').addEventListener('click', () => {
    loadNextState();
});
