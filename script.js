// 还原截图数据的词库
const vocabularyData = [
    { 
        pt: "mesmo", pos: "adv.", zh: "甚至，即使", phonetic: "/'mez.mu/", 
        example: { pt: "<strong>Mesmo</strong> na cidade, o trabalho era difícil de encontrar.", zh: "即使在城市里，工作也很难找。" },
        phrases: ["mesmo assim 尽管如此", "mesmo que 即使"]
    },
    { 
        pt: "encorajar", pos: "vt.", zh: "鼓励；劝告，怂恿；促进，刺激", phonetic: "/ẽ.ku.ɾaˈʒaɾ/", 
        example: { pt: "Eu <strong>encorajo</strong> você a ser completamente honesto.", zh: "我鼓励你们说实话。" },
        phrases: ["encorajar a violência 助长暴力", "encorajar o investimento 促进投资"]
    },
    { 
        pt: "salvar", pos: "vt.", zh: "储藏，贮存；(计算机) 存储", phonetic: "/sawˈvaɾ/", 
        example: { pt: "Não se esqueça de <strong>salvar</strong> o documento.", zh: "别忘了保存文件。" },
        phrases: ["salvar o arquivo 保存文件"]
    }
];

let learningQueue = [];
let learnedCount = 0;
let totalWords = 0;
let currentWordObj = null;
let currentOptionsData = [];

// DOM 获取
const views = { home: document.getElementById('home-view'), learning: document.getElementById('learning-view') };
const els = {
    wordPt: document.getElementById('word-pt'),
    phonetic: document.getElementById('word-phonetic-text'),
    pos: document.getElementById('word-pos'),
    zh: document.getElementById('word-zh-title'),
    progressText: document.getElementById('progress-text'),
    dots: document.querySelectorAll('.dot'),
    quizArea: document.getElementById('quiz-area'),
    defArea: document.getElementById('definition-area'),
    detailArea: document.getElementById('detail-area'),
    options: document.querySelectorAll('.option .opt-content'),
    exPt: document.getElementById('word-example-pt'),
    exZh: document.getElementById('word-example-zh'),
    phrases: document.getElementById('phrases-container'),
    footerQuiz: document.getElementById('footer-quiz'),
    footerNext: document.getElementById('footer-next')
};

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

// 进入学习
document.getElementById('btn-learn').addEventListener('click', () => {
    if (vocabularyData.length === 0) return;
    learningQueue = vocabularyData.map(word => ({ ...word, stage: 0 }));
    totalWords = learningQueue.length;
    learnedCount = 0;
    views.home.classList.replace('active', 'hidden');
    views.learning.classList.replace('hidden', 'active');
    loadNextState();
});

// 返回
document.getElementById('btn-back').addEventListener('click', () => {
    views.learning.classList.replace('active', 'hidden');
    views.home.classList.replace('hidden', 'active');
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 更新垂直小灰点/绿点
function updateDots(stage) {
    els.dots.forEach((dot, index) => {
        if(index < stage) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

// 核心加载逻辑
window.loadNextState = function() {
    if (learningQueue.length === 0) {
        alert("今日完毕！");
        document.getElementById('btn-back').click();
        return;
    }

    currentWordObj = learningQueue.shift();
    els.progressText.innerText = `${learnedCount + 1}/${totalWords}`;
    els.wordPt.innerText = currentWordObj.pt;
    els.phonetic.innerText = currentWordObj.phonetic;
    els.pos.innerText = currentWordObj.pos;
    els.zh.innerText = currentWordObj.zh;
    
    // 初始化UI显示状态
    els.defArea.classList.add('hidden');
    els.detailArea.classList.add('hidden');
    els.quizArea.classList.remove('hidden');
    els.footerNext.classList.add('hidden');
    els.footerQuiz.classList.remove('hidden');
    
    updateDots(currentWordObj.stage);
    renderQuizOptions();
    playAudio(currentWordObj.pt);
}

function renderQuizOptions() {
    let options = [{ wordObj: currentWordObj, isCorrect: true }];
    let wrongCandidates = vocabularyData.filter(w => w.pt !== currentWordObj.pt);
    shuffleArray(wrongCandidates);
    for (let i = 0; i < 3 && i < wrongCandidates.length; i++) {
        options.push({ wordObj: wrongCandidates[i], isCorrect: false });
    }
    shuffleArray(options);
    currentOptionsData = options;

    els.options.forEach((optEl, index) => {
        // 这里模拟不背单词，有一定几率出现空的“骨架屏”占位符
        if (index === 3 && Math.random() > 0.5) {
            optEl.innerHTML = `<div class="skeleton-line short"></div><div class="skeleton-line long"></div>`;
            // 给这个空选项绑定一个必定错误的伪数据
            currentOptionsData[index] = { isCorrect: false, isEmpty: true };
        } else {
            const data = currentOptionsData[index].wordObj;
            optEl.innerHTML = `<span class="opt-pos">${data.pos}</span><span class="opt-zh">${data.zh}</span>`;
        }
        optEl.parentElement.style.pointerEvents = 'auto'; // 恢复点击
    });
}

window.checkAnswer = function(selectedIndex) {
    // 禁用所有选项点击
    document.querySelectorAll('.option').forEach(el => el.style.pointerEvents = 'none');
    
    const selectedData = currentOptionsData[selectedIndex];
    
    if (selectedData.isCorrect) {
        currentWordObj.stage = 1; 
        learningQueue.push(currentWordObj);
        updateDots(1); // 亮一颗绿点
        showDetails();
    } else {
        currentWordObj.stage = 0; 
        learningQueue.push(currentWordObj);
        updateDots(0); // 清零灰点
        
        // 如果选错了，且不是空选项，才闪烁红色
        if (!selectedData.isEmpty) {
            els.options[selectedIndex].innerHTML = `<span style="color:#ff6b6b; font-size: 1.1rem; text-align:center; display:block; width:100%; font-weight:bold;">${selectedData.wordObj.pt}</span>`;
        }
        setTimeout(() => showDetails(), 800);
    }
}

window.showAnswerDirectly = function() {
    currentWordObj.stage = 0;
    learningQueue.push(currentWordObj);
    updateDots(0);
    showDetails();
}

function showDetails() {
    els.quizArea.classList.add('hidden');
    els.footerQuiz.classList.add('hidden');
    
    // 显示释义和卡片
    els.defArea.classList.remove('hidden');
    els.detailArea.classList.remove('hidden');
    els.footerNext.classList.remove('hidden');

    // 填充卡片数据
    els.exPt.innerHTML = currentWordObj.example.pt;
    els.exZh.innerText = currentWordObj.example.zh;

    els.phrases.innerHTML = '';
    if (currentWordObj.phrases.length > 0) {
        currentWordObj.phrases.forEach(p => {
            const splitIndex = p.search(/[\u4e00-\u9fa5]/); 
            const en = splitIndex > 0 ? p.substring(0, splitIndex).trim() : p;
            const zh = splitIndex > 0 ? p.substring(splitIndex).trim() : '';
            els.phrases.innerHTML += `<div class="phrase-item"><p class="phrase-en">${en}</p><p class="phrase-zh">${zh}</p></div>`;
        });
        els.phrases.style.display = 'block';
    } else {
        els.phrases.style.display = 'none';
    }
}
