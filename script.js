// 升级版词库：包含你可能用得到的物理、编程及日常词汇
const vocabularyData = [
    { 
        pt: "cinemática", pos: "n.", zh: "运动学", phonetic: "/si.neˈma.tʃi.kɐ/", 
        example: { pt: "A cinemática estuda o movimento dos corpos.", zh: "运动学研究物体的运动。" },
        phrases: ["fórmula da cinemática 运动学公式"]
    },
    { 
        pt: "aceleração", pos: "n.", zh: "加速度", phonetic: "/a.se.le.ɾaˈsɐ̃w/", 
        example: { pt: "A aceleração da gravidade é aproximadamente 9,8 m/s².", zh: "重力加速度约为 9.8 m/s²。" },
        phrases: ["aceleração constante 匀加速度"]
    },
    { 
        pt: "variável", pos: "n./adj.", zh: "变量，可变的", phonetic: "/va.ɾiˈa.vew/", 
        example: { pt: "Precisamos declarar a variável no código.", zh: "我们需要在代码中声明变量。" },
        phrases: ["variável global 全局变量", "custo variável 可变成本"]
    },
    { 
        pt: "encorajar", pos: "vt.", zh: "鼓励，促进", phonetic: "/ẽ.ku.ɾaˈʒaɾ/", 
        example: { pt: "Eu encorajo você a não desistir.", zh: "我鼓励你不要放弃。" },
        phrases: ["encorajar o estudo 鼓励学习"]
    }
];

let learningQueue = [];
let totalWords = 0;
let learnedCount = 0;
let currentWordObj = null;
let currentOptionsData = [];

// DOM 元素 (基本保持不变)
const appRoot = document.getElementById('app');
const homeView = document.getElementById('home-view');
const learningView = document.getElementById('learning-view');
const btnLearn = document.getElementById('btn-learn');
const btnBack = document.getElementById('btn-back');

const quizArea = document.getElementById('quiz-area');
const recognizeArea = document.getElementById('recognize-area');
const detailArea = document.getElementById('detail-area');
const wordZhArea = document.getElementById('word-zh-area');

const elWordPt = document.getElementById('word-pt');
const elWordHeaderDetails = document.getElementById('word-header-details');
const elWordPhoneticText = document.getElementById('word-phonetic-text');
const elWordPos = document.getElementById('word-pos');
const elWordZhTitle = document.getElementById('word-zh-title');
const elProgressText = document.getElementById('progress-text');
const elProgressBar = document.getElementById('progress-bar'); // 新增进度条元素

const recognizeSentenceCard = document.getElementById('recognize-sentence-card');
const recognizeBlindText = document.getElementById('recognize-blind-text');
const elRecognizeExamplePt = document.getElementById('recognize-example-pt');
const elExamplePt = document.getElementById('word-example-pt');
const elExampleZh = document.getElementById('word-example-zh');
const phrasesContainer = document.getElementById('phrases-container');

const footerQuiz = document.getElementById('footer-quiz');
const footerRecognize = document.getElementById('footer-recognize');
const footerDetail = document.getElementById('footer-detail');
const optionBtns = document.querySelectorAll('.option-btn');

document.getElementById('learn-count').innerText = vocabularyData.length;

// --- 新增：语音播报功能 (Web Speech API) ---
function playAudio(text) {
    // 检查浏览器是否支持
    if ('speechSynthesis' in window) {
        // 取消当前正在播放的语音
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR'; // 设定为巴西葡语
        utterance.rate = 0.9;     // 稍微放慢一点语速，适合学习
        window.speechSynthesis.speak(utterance);
    } else {
        console.log("你的浏览器不支持语音播报");
    }
}

// 绑定点击发音事件
document.getElementById('btn-play-audio').addEventListener('click', () => playAudio(currentWordObj.pt));
document.getElementById('word-pt').addEventListener('click', () => playAudio(currentWordObj.pt));
document.getElementById('phonetic-container').addEventListener('click', () => playAudio(currentWordObj.pt));


btnLearn.addEventListener('click', () => {
    if (vocabularyData.length === 0) return;
    learningQueue = vocabularyData.map(word => ({ ...word, stage: 0 }));
    totalWords = learningQueue.length;
    learnedCount = 0;
    
    // 初始化进度条
    elProgressBar.style.width = '0%';

    homeView.classList.replace('active', 'hidden');
    learningView.classList.replace('hidden', 'active');
    loadNextState();
});

btnBack.addEventListener('click', () => {
    learningView.classList.replace('active', 'hidden');
    homeView.classList.replace('hidden', 'active');
    appRoot.className = 'bg-mountain';
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function loadNextState() {
    if (learningQueue.length === 0) {
        elProgressBar.style.width = '100%';
        setTimeout(() => {
            alert("Parabéns! 今日词汇已全部掌握！");
            btnBack.click();
        }, 300);
        return;
    }

    currentWordObj = learningQueue.shift();
    
    // 更新文字进度和进度条动画
    elProgressText.innerText = `${learnedCount}/${totalWords}`;
    const progressPercent = (learnedCount / totalWords) * 100;
    elProgressBar.style.width = `${progressPercent}%`;
    
    elWordPt.innerText = currentWordObj.pt;
    elWordPhoneticText.innerText = currentWordObj.phonetic;
    elWordPos.innerText = currentWordObj.pos;
    elWordZhTitle.innerText = currentWordObj.zh;
    
    quizArea.classList.add('hidden');
    recognizeArea.classList.add('hidden');
    detailArea.classList.add('hidden');
    wordZhArea.classList.add('hidden');
    
    footerQuiz.classList.add('hidden');
    footerRecognize.classList.add('hidden');
    footerDetail.classList.add('hidden');

    if (currentWordObj.stage === 0) renderStage0();
    else if (currentWordObj.stage === 1) renderStage1();
    else if (currentWordObj.stage === 2) renderStage2();

    // 自动发音 (如果觉得每次切词都发音太吵，可以注释掉这行，改为纯手动点击顶部发音)
    playAudio(currentWordObj.pt); 
}

function renderStage0() {
    appRoot.className = 'bg-mountain';
    elWordHeaderDetails.classList.add('hidden');
    quizArea.classList.remove('hidden');
    footerQuiz.classList.remove('hidden');

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
    appRoot.className = 'bg-green';
    elWordHeaderDetails.classList.remove('hidden');
    recognizeArea.classList.remove('hidden');
    recognizeSentenceCard.classList.remove('hidden');
    recognizeBlindText.classList.add('hidden');
    elRecognizeExamplePt.innerHTML = currentWordObj.example.pt; 
    footerRecognize.classList.remove('hidden');
}

function renderStage2() {
    appRoot.className = 'bg-green';
    elWordHeaderDetails.classList.remove('hidden');
    recognizeArea.classList.remove('hidden');
    recognizeSentenceCard.classList.add('hidden');
    recognizeBlindText.classList.remove('hidden');
    footerRecognize.classList.remove('hidden');
}

window.checkAnswer = function(selectedIndex) {
    optionBtns.forEach(btn => btn.disabled = true);
    const selectedData = currentOptionsData[selectedIndex];
    const clickedBtn = optionBtns[selectedIndex];

    if (selectedData.isCorrect) {
        currentWordObj.stage = 1;
        learningQueue.push(currentWordObj);
        showDetails();
    } else {
        currentWordObj.stage = 0;
        learningQueue.push(currentWordObj);
        clickedBtn.innerHTML = `<span class="show-wrong-pt">${selectedData.wordObj.pt}</span>`;
        clickedBtn.style.background = 'rgba(231, 76, 60, 0.2)';
        
        // 如果选错了，朗读一下正确的发音强化记忆
        playAudio(selectedData.wordObj.pt);
        setTimeout(() => showDetails(), 1200);
    }
}

document.getElementById('btn-show-answer').addEventListener('click', () => {
    currentWordObj.stage = 0;
    learningQueue.push(currentWordObj);
    showDetails();
});

document.getElementById('btn-recognize').addEventListener('click', () => {
    if (currentWordObj.stage === 1) {
        currentWordObj.stage = 2;
        learningQueue.push(currentWordObj);
    } else if (currentWordObj.stage === 2) {
        learnedCount++; // 彻底掌握！进度条会在这里前进
    }
    showDetails();
});

document.getElementById('btn-not-recognize').addEventListener('click', () => {
    currentWordObj.stage = 0;
    learningQueue.push(currentWordObj);
    showDetails();
});

document.getElementById('btn-hint').addEventListener('click', () => {
    document.getElementById('btn-not-recognize').click(); 
});

function showDetails() {
    appRoot.className = 'bg-mountain';
    elWordHeaderDetails.classList.remove('hidden');
    wordZhArea.classList.remove('hidden');

    quizArea.classList.add('hidden');
    recognizeArea.classList.add('hidden');
    footerQuiz.classList.add('hidden');
    footerRecognize.classList.add('hidden');

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

    detailArea.classList.remove('hidden');
    footerDetail.classList.remove('hidden');
}

document.getElementById('btn-next').addEventListener('click', () => {
    loadNextState();
});
