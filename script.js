// 数据带 displayPt，用于像 re·union 一样拆分显示，如果不拆就写普通单词
const vocabularyData = [
    { 
        displayPt: "re·union", pt: "reunion", pos: "n.", zh: "聚会，重聚，重逢；再联合", phonetic: "/ˌriːˈjuːniən/", 
        example: { pt: "Patrick was going to have that <strong>reunion</strong> with his mother.", zh: "帕特里克想和他母亲团聚。" },
        phrases: ["a family reunion 家庭聚会", "a mother-daughter reunion 母女重逢"]
    },
    { 
        displayPt: "mesmo", pt: "mesmo", pos: "adv.", zh: "甚至，即使", phonetic: "/'mez.mu/", 
        example: { pt: "<strong>Mesmo</strong> na cidade, o trabalho era difícil de encontrar.", zh: "即使在城市里，工作也很难找。" },
        phrases: ["mesmo assim 尽管如此", "mesmo que 即使"]
    },
    { 
        displayPt: "en·cour·age", pt: "encorajar", pos: "vt.", zh: "鼓励；劝告，怂恿；促进，刺激", phonetic: "/ẽ.ku.ɾaˈʒaɾ/", 
        example: { pt: "Eu <strong>encorajo</strong> você a ser completamente honesto.", zh: "我鼓励你们说实话。" },
        phrases: ["encorajar a violência 助长暴力", "encorajar o investimento 促进投资"]
    }
];

let learningQueue = [];
let learnedCount = 0;
let totalWords = 0;
let currentWordObj = null;
let currentOptionsData = [];

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
    options: document.querySelectorAll('.option .opt-content'),
    exPt: document.getElementById('word-example-pt'),
    exZh: document.getElementById('word-example-zh'),
    phrases: document.getElementById('phrases-container'),
    recogExPt: document.getElementById('recognize-example-pt'),
    recogSentenceCard: document.getElementById('recognize-sentence-card'),
    recogBlindText: document.getElementById('recognize-blind-text'),
    fQuiz: document.getElementById('footer-quiz'),
    fRecog: document.getElementById('footer-recognize'),
    fDetail: document.getElementById('footer-detail')
};

document.getElementById('learn-count').innerText = vocabularyData.length;

function playAudio(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR'; window.speechSynthesis.speak(utterance);
    }
}
document.getElementById('phonetic-container').addEventListener('click', () => playAudio(currentWordObj.pt));

document.getElementById('btn-learn').addEventListener('click', () => {
    if (vocabularyData.length === 0) return;
    learningQueue = vocabularyData.map(word => ({ ...word, stage: 0 }));
    totalWords = learningQueue.length;
    learnedCount = 0;
    views.home.classList.replace('active', 'hidden');
    views.learning.classList.replace('hidden', 'active');
    loadNextState();
});

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

// UI 核心更新逻辑
function updateDots(stage) {
    // 满级：显示对勾，隐藏点点
    if (stage >= 3) {
        els.dotsContainer.classList.add('hidden');
        els.successBadge.classList.remove('hidden');
    } else {
        els.dotsContainer.classList.remove('hidden');
        els.successBadge.classList.add('hidden');
        els.dots.forEach((dot, index) => {
            if(index < stage) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    }
}

window.loadNextState = function() {
    if (learningQueue.length === 0) {
        alert("今日完毕！");
        document.getElementById('btn-back').click();
        return;
    }

    currentWordObj = learningQueue.shift();
    els.progressText.innerText = `${learnedCount + 1}/${totalWords}`;
    els.wordPt.innerText = currentWordObj.displayPt || currentWordObj.pt; // 使用带点分隔的词
    els.phonetic.innerText = currentWordObj.phonetic;
    els.pos.innerText = currentWordObj.pos;
    els.zh.innerText = currentWordObj.zh;
    
    // 初始化全隐藏
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

function renderStage0() {
    els.app.className = 'bg-blur';
    els.quizArea.classList.remove('hidden');
    els.fQuiz.classList.remove('hidden');

    let options = [{ wordObj: currentWordObj, isCorrect: true }];
    let wrongCandidates = vocabularyData.filter(w => w.pt !== currentWordObj.pt);
    shuffleArray(wrongCandidates);
    for (let i = 0; i < 3 && i < wrongCandidates.length; i++) {
        options.push({ wordObj: wrongCandidates[i], isCorrect: false });
    }
    shuffleArray(options);
    currentOptionsData = options;

    els.options.forEach((optEl, index) => {
        // 模拟骨架屏选项
        if (index === 3 && Math.random() > 0.6) {
            optEl.innerHTML = `<div class="skeleton-line short"></div><div class="skeleton-line long"></div>`;
            currentOptionsData[index] = { isCorrect: false, isEmpty: true };
        } else {
            const data = currentOptionsData[index].wordObj;
            optEl.innerHTML = `<span class="opt-pos">${data.pos}</span><span class="opt-zh">${data.zh}</span>`;
        }
        optEl.parentElement.style.pointerEvents = 'auto';
        optEl.parentElement.classList.remove('active'); // 清除上次的高亮
    });
}

function renderStage1() {
    els.app.className = 'bg-green';
    els.skeletonBars.classList.remove('hidden');
    els.recognizeArea.classList.remove('hidden');
    els.recogSentenceCard.classList.remove('hidden');
    els.recogBlindText.classList.add('hidden');
    els.recogExPt.innerHTML = currentWordObj.example.pt; 
    els.fRecog.classList.remove('hidden');
}

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
    const parentOpts = document.querySelectorAll('.option');
    parentOpts.forEach(el => el.style.pointerEvents = 'none');
    
    const selectedData = currentOptionsData[selectedIndex];
    const clickedBtn = parentOpts[selectedIndex];
    
    clickedBtn.classList.add('active'); // 按下态的高亮保持
    
    if (selectedData.isCorrect) {
        currentWordObj.stage = 1; 
        learningQueue.push(currentWordObj);
        updateDots(1);
        
        // 【关键】答对后，停留 0.4 秒让用户看到选中态，再进入详情
        setTimeout(() => showDetails(), 400);
    } else {
        currentWordObj.stage = 0; 
        learningQueue.push(currentWordObj);
        updateDots(0);
        
        if (!selectedData.isEmpty) {
            els.options[selectedIndex].innerHTML = `<span style="color:#ff6b6b; font-size: 1.1rem; text-align:center; display:block; width:100%; font-weight:bold;">${selectedData.wordObj.pt}</span>`;
        }
        playAudio(selectedData.wordObj.pt);
        // 【关键】答错后，停留 0.8 秒
        setTimeout(() => showDetails(), 800);
    }
}

// “认识/不认识” 按钮交互
document.getElementById('btn-recognize').addEventListener('click', () => {
    if (currentWordObj.stage === 1) {
        currentWordObj.stage = 2; learningQueue.push(currentWordObj); updateDots(2);
    } else if (currentWordObj.stage === 2) {
        currentWordObj.stage = 3; learnedCount++; updateDots(3); // 这里会显示满级绿勾
    }
    // 增加细微延迟 150ms 体验更佳
    setTimeout(() => showDetails(), 150);
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

// 详情页展示
function showDetails() {
    els.app.className = 'bg-blur'; // 回到暗黑背景
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

    els.phrases.innerHTML = '';
    if (currentWordObj.phrases.length > 0) {
        currentWordObj.phrases.forEach(p => {
            const splitIndex = p.search(/[\u4e00-\u9fa5]/); 
            const en = splitIndex > 0 ? p.substring(0, splitIndex).trim() : p;
            const zh = splitIndex > 0 ? p.substring(splitIndex).trim() : '';
            els.phrases.innerHTML += `<div class="phrase-item"><p class="phrase-en">${en}</p><p class="phrase-zh">${zh}</p></div>`;
        });
    }
}

// 【关键】下一词：增加 150ms 的物理延迟，不要瞬间一切换
document.getElementById('btn-next').addEventListener('click', () => {
    setTimeout(() => loadNextState(), 150);
});

// “记错了” 按钮功能：从满级/任意级直接打回 0 级，塞回队列
document.getElementById('btn-forgot').addEventListener('click', () => {
    if (currentWordObj.stage === 3) {
        learnedCount--; // 如果已经算学会了，扣除进度
    }
    currentWordObj.stage = 0;
    learningQueue.push(currentWordObj);
    setTimeout(() => loadNextState(), 150);
});
