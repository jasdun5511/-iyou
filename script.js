// 词库 (严格按照截图样式准备数据)
const vocabularyData = [
    { 
        pt: "encorajar", pos: "vt.", zh: "鼓励；劝告，怂恿；促进，刺激", phonetic: "/ẽ.ku.ɾaˈʒaɾ/", 
        example: { pt: "Eu <strong>encorajo</strong> você a ser completamente honesto.", zh: "我鼓励你们说实话。" },
        phrases: ["encorajar a violência 助长暴力", "encorajar o investimento 促进投资", "encorajar alguém a fazer 鼓励某人做某事"]
    },
    { 
        pt: "mesmo", pos: "adv.", zh: "甚至，即使", phonetic: "/ˈmez.mu/", 
        example: { pt: "<strong>Mesmo</strong> na cidade, o trabalho era difícil de encontrar.", zh: "即使在城市里，工作也很难找。" },
        phrases: ["mesmo assim 尽管如此", "mesmo que 即使"]
    },
    { 
        pt: "salvar", pos: "vt.", zh: "储藏，贮存；(计算机) 存储", phonetic: "/sawˈvaɾ/", 
        example: { pt: "Não se esqueça de <strong>salvar</strong> o documento.", zh: "别忘了保存文件。" },
        phrases: ["salvar o arquivo 保存文件", "salvar a vida 救命"]
    }
];

let learningQueue = [];
let learnedCount = 0;
let totalWords = 0;
let currentWordObj = null;
let currentOptionsData = [];

// DOM 元素获取
const appRoot = document.getElementById('app');
const homeView = document.getElementById('home-view');
const learningView = document.getElementById('learning-view');
const btnLearn = document.getElementById('btn-learn');
const btnBack = document.getElementById('btn-back');

const dots = document.querySelectorAll('.dot');
const skeletonBars = document.getElementById('skeleton-bars');
const elWordPt = document.getElementById('word-pt');
const elWordPhoneticText = document.getElementById('word-phonetic-text');
const elWordPos = document.getElementById('word-pos');
const elWordZhTitle = document.getElementById('word-zh-title');
const elProgressText = document.getElementById('progress-text');

const quizArea = document.getElementById('quiz-area');
const recognizeArea = document.getElementById('recognize-area');
const detailArea = document.getElementById('detail-area');
const wordZhArea = document.getElementById('word-zh-area');

const recognizeSentenceCard = document.getElementById('recognize-sentence-card');
const recognizeBlindText = document.getElementById('recognize-blind-text');
const elRecognizeExamplePt = document.getElementById('recognize-example-pt');

const elExamplePt = document.getElementById('word-example-pt');
const elExampleZh = document.getElementById('word-example-zh');
const phrasesContainer = document.getElementById('phrases-container');
const optionBtns = document.querySelectorAll('.option-btn');

document.getElementById('learn-count').innerText = vocabularyData.length;

// 语音播报
function playAudio(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR'; 
        window.speechSynthesis.speak(utterance);
    }
}
document.getElementById('phonetic-container').addEventListener('click', () => playAudio(currentWordObj.pt));
document.getElementById('word-pt').addEventListener('click', () => playAudio(currentWordObj.pt));


btnLearn.addEventListener('click', () => {
    if (vocabularyData.length === 0) return;
    learningQueue = vocabularyData.map(word => ({ ...word, stage: 0 }));
    totalWords = learningQueue.length;
    learnedCount = 0;

    homeView.classList.replace('active', 'hidden');
    learningView.classList.replace('hidden', 'active');
    loadNextState();
});

btnBack.addEventListener('click', () => {
    learningView.classList.replace('active', 'hidden');
    homeView.classList.replace('hidden', 'active');
    appRoot.className = 'bg-dark';
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 核心：更新三个点的UI状态
function updateDotsUI(stage) {
    dots.forEach((dot, index) => {
        if (index < stage) {
            dot.classList.add('active'); // 亮绿灯
        } else {
            dot.classList.remove('active'); // 变灰
        }
    });
}

function loadNextState() {
    if (learningQueue.length === 0) {
        alert("Parabéns! 今日词汇已全部掌握！");
        btnBack.click();
        return;
    }

    currentWordObj = learningQueue.shift();
    
    // 更新顶部进度
    elProgressText.innerText = `${learnedCount + 1}/${totalWords}`;
    
    // 渲染单词和音标
    elWordPt.innerText = currentWordObj.pt;
    elWordPhoneticText.innerText = currentWordObj.phonetic;
    elWordPos.innerText = currentWordObj.pos;
    elWordZhTitle.innerText = currentWordObj.zh;
    
    // 隐藏所有区域
    quizArea.classList.add('hidden');
    recognizeArea.classList.add('hidden');
    detailArea.classList.add('hidden');
    wordZhArea.classList.add('hidden');
    skeletonBars.classList.add('hidden');
    
    document.getElementById('footer-quiz').classList.add('hidden');
    document.getElementById('footer-recognize').classList.add('hidden');
    document.getElementById('footer-detail').classList.add('hidden');

    // 同步点点进度
    updateDotsUI(currentWordObj.stage);

    if (currentWordObj.stage === 0) renderStage0();
    else if (currentWordObj.stage === 1) renderStage1();
    else if (currentWordObj.stage === 2) renderStage2();

    playAudio(currentWordObj.pt); 
}

function renderStage0() {
    appRoot.className = 'bg-dark'; // 暗背景
    skeletonBars.classList.add('hidden');
    quizArea.classList.remove('hidden');
    document.getElementById('footer-quiz').classList.remove('hidden');

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

function renderStage1() {
    appRoot.className = 'bg-green'; // 绿色背景 (同截图3)
    skeletonBars.classList.remove('hidden'); // 显示灰色占位条
    recognizeArea.classList.remove('hidden');
    recognizeSentenceCard.classList.remove('hidden');
    recognizeBlindText.classList.add('hidden');
    elRecognizeExamplePt.innerHTML = currentWordObj.example.pt; 
    document.getElementById('footer-recognize').classList.remove('hidden');
}

function renderStage2() {
    appRoot.className = 'bg-dark-green'; // 深绿色背景 (同截图4)
    skeletonBars.classList.remove('hidden'); // 显示灰色占位条
    recognizeArea.classList.remove('hidden');
    recognizeSentenceCard.classList.add('hidden');
    recognizeBlindText.classList.remove('hidden');
    document.getElementById('footer-recognize').classList.remove('hidden');
}

// --- 交互判题逻辑 ---

window.checkAnswer = function(selectedIndex) {
    optionBtns.forEach(btn => btn.disabled = true);
    const selectedData = currentOptionsData[selectedIndex];
    const clickedBtn = optionBtns[selectedIndex];

    if (selectedData.isCorrect) {
        currentWordObj.stage = 1; // 进度+1
        learningQueue.push(currentWordObj);
        updateDotsUI(1); // 瞬间亮起一颗绿点给予奖励反馈
        showDetails();
    } else {
        currentWordObj.stage = 0; // 进度清零
        learningQueue.push(currentWordObj);
        updateDotsUI(0); // 瞬间全灰
        
        clickedBtn.innerHTML = `<span class="show-wrong-pt">${selectedData.wordObj.pt}</span>`;
        clickedBtn.style.background = 'rgba(231, 76, 60, 0.2)';
        playAudio(selectedData.wordObj.pt);
        setTimeout(() => showDetails(), 1200);
    }
}

document.getElementById('btn-show-answer').addEventListener('click', () => {
    currentWordObj.stage = 0; // 进度清零
    learningQueue.push(currentWordObj);
    updateDotsUI(0);
    showDetails();
});

document.getElementById('btn-recognize').addEventListener('click', () => {
    if (currentWordObj.stage === 1) {
        currentWordObj.stage = 2; // 进度+1
        learningQueue.push(currentWordObj);
        updateDotsUI(2);
    } else if (currentWordObj.stage === 2) {
        currentWordObj.stage = 3; // 满级
        learnedCount++;
        updateDotsUI(3); // 3点全绿！
    }
    showDetails();
});

// 不管在哪个阶段，点“不认识”或“提示一下”，进度全部清零
document.getElementById('btn-not-recognize').addEventListener('click', punishAndShow);
document.getElementById('btn-hint').addEventListener('click', punishAndShow);

function punishAndShow() {
    currentWordObj.stage = 0; // 进度清零
    learningQueue.push(currentWordObj);
    updateDotsUI(0); // 瞬间全灰，心痛的感觉
    showDetails();
}

function showDetails() {
    appRoot.className = 'bg-dark'; // 回到暗色背景 (同截图5)
    skeletonBars.classList.add('hidden'); // 隐藏占位条
    wordZhArea.classList.remove('hidden'); // 显示真实翻译

    quizArea.classList.add('hidden');
    recognizeArea.classList.add('hidden');
    document.getElementById('footer-quiz').classList.add('hidden');
    document.getElementById('footer-recognize').classList.add('hidden');

    elExamplePt.innerHTML = currentWordObj.example.pt;
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

    detailArea.classList.remove('hidden');
    document.getElementById('footer-detail').classList.remove('hidden');
}

document.getElementById('btn-next').addEventListener('click', () => {
    loadNextState();
});
