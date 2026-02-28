// 升级版数据：去掉了强加的音节拆分点，加入了真实的派生、词根和近义词数据
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
    tabContent: document.getElementById('tab-content-container'),
    tabs: document.querySelectorAll('.tab'),
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

function updateDots(stage) {
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
    // 移除了带点分隔的逻辑，直接显示纯净单词
    els.wordPt.innerText = currentWordObj.pt; 
    els.phonetic.innerText = currentWordObj.phonetic;
    els.pos.innerText = currentWordObj.pos;
    els.zh.innerText = currentWordObj.zh;
    
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

    // 移除了随机空选项的逻辑，老老实实渲染 4 个选项
    els.options.forEach((optEl, index) => {
        const data = currentOptionsData[index].wordObj;
        optEl.innerHTML = `<span class="opt-pos">${data.pos}</span><span class="opt-zh">${data.zh}</span>`;
        optEl.parentElement.style.pointerEvents = 'auto';
        optEl.parentElement.classList.remove('active');
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

window.checkAnswer = function(selectedIndex) {
    const parentOpts = document.querySelectorAll('.option');
    parentOpts.forEach(el => el.style.pointerEvents = 'none');
    
    const selectedData = currentOptionsData[selectedIndex];
    const clickedBtn = parentOpts[selectedIndex];
    
    clickedBtn.classList.add('active');
    
    if (selectedData.isCorrect) {
        currentWordObj.stage = 1; 
        learningQueue.push(currentWordObj);
        updateDots(1);
        setTimeout(() => showDetails(), 400);
    } else {
        currentWordObj.stage = 0; 
        learningQueue.push(currentWordObj);
        updateDots(0);
        
        els.options[selectedIndex].innerHTML = `<span style="color:#ff6b6b; font-size: 1.1rem; text-align:center; display:block; width:100%; font-weight:bold;">${selectedData.wordObj.pt}</span>`;
        playAudio(selectedData.wordObj.pt);
        setTimeout(() => showDetails(), 800);
    }
}

document.getElementById('btn-recognize').addEventListener('click', () => {
    if (currentWordObj.stage === 1) {
        currentWordObj.stage = 2; learningQueue.push(currentWordObj); updateDots(2);
    } else if (currentWordObj.stage === 2) {
        currentWordObj.stage = 3; learnedCount++; updateDots(3);
    }
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

// ================= Tab 菜单切换逻辑 =================
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
    els.tabContent.innerHTML = ''; // 清空内容
    let contentData = currentWordObj[targetType] || [];
    
    if (contentData.length === 0) {
        els.tabContent.innerHTML = `<p style="color: rgba(255,255,255,0.4); font-size: 0.9rem; text-align: center; padding: 10px 0;">暂无数据</p>`;
        return;
    }

    contentData.forEach(item => {
        // 处理词组搭配的格式 (前面外语，后面中文)
        if (targetType === 'phrases') {
            const splitIndex = item.search(/[\u4e00-\u9fa5]/); 
            const en = splitIndex > 0 ? item.substring(0, splitIndex).trim() : item;
            const zh = splitIndex > 0 ? item.substring(splitIndex).trim() : '';
            els.tabContent.innerHTML += `<div class="phrase-item"><p class="phrase-en">${en}</p><p class="phrase-zh">${zh}</p></div>`;
        } 
        // 处理派生、词根、近义词的格式
        else {
            els.tabContent.innerHTML += `<div class="phrase-item"><p class="phrase-en">${item}</p></div>`;
        }
    });
}

// 详情页展示
function showDetails() {
    els.app.className = 'bg-blur'; 
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

    // 默认触发“词组搭配”的 Tab 显示
    els.tabs[0].click(); 
}

document.getElementById('btn-next').addEventListener('click', () => {
    setTimeout(() => loadNextState(), 150);
});

document.getElementById('btn-forgot').addEventListener('click', () => {
    if (currentWordObj.stage === 3) {
        learnedCount--; 
    }
    currentWordObj.stage = 0;
    learningQueue.push(currentWordObj);
    setTimeout(() => loadNextState(), 150);
});
