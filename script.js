// ================= 序列 1：升维版数据结构 (支持二维考义滑动) =================
const vocabularyData = [
    { 
        pt: "mesmo", pos: "adv.", zh: "甚至，即使", phonetic: "/'mez.mu/", 
        // 详情页主卡片默认展示的兜底例句
        example: { pt: "<strong>Mesmo</strong> na cidade, o trabalho era difícil.", zh: "即使在城市里，工作也很难找。" },
        phrases: ["mesmo assim 尽管如此", "mesmo que 即使"],
        derivatives: ["mesmíssimo (adj. 完全一样的)"],
        roots: ["源自拉丁语 'metipsimus'"],
        synonyms: ["ainda (adv. 还，甚至)", "até (prep. 直到，甚至)"],
        
        // 【核心大更新】：沉浸式大卡片的二维数据源
        meanings: [
            {
                pos: "adv.",
                enDef: "even, exactly",
                zhDef: "甚至，即使",
                examples: [
                    { source: "柯林斯词典", pt: "<strong>Mesmo</strong> na cidade, o trabalho era difícil.", zh: "即使在城市里，工作也很难找。" },
                    { source: "日常口语", pt: "Foi ele <strong>mesmo</strong> quem fez isso.", zh: "确实是他本人做的。" }
                ]
            },
            {
                pos: "adj.",
                enDef: "same, identical",
                zhDef: "同一个的",
                examples: [
                    { source: "广州版小学英语", pt: "Nós moramos na <strong>mesma</strong> rua.", zh: "我们住在同一条街上。" }
                ]
            },
            {
                pos: "pron.",
                enDef: "oneself",
                zhDef: "(强调) 自己",
                examples: [
                    { source: "基础语法", pt: "Eu <strong>mesmo</strong> fiz o bolo.", zh: "我自己做了蛋糕。" }
                ]
            }
        ]
    },
    { 
        pt: "encorajar", pos: "vt.", zh: "鼓励；劝告，怂恿", phonetic: "/ẽ.ku.ɾaˈʒaɾ/", 
        example: { pt: "Eu <strong>encorajo</strong> você a ser completamente honesto.", zh: "我鼓励你们说实话。" },
        phrases: ["encorajar a violência 助长暴力", "encorajar o investimento 促进投资"],
        derivatives: ["coragem (n. 勇气)", "encorajamento (n. 鼓励，怂恿)"],
        roots: ["en- (使...) + coragem (勇气) + -ar (动词后缀)"],
        synonyms: ["animar (vt. 使兴奋)"],
        
        meanings: [
            {
                pos: "vt.",
                enDef: "encourage, advise",
                zhDef: "鼓励，怂恿",
                examples: [
                    { source: "TED 演讲", pt: "Eu <strong>encorajo</strong> você a ser completamente honesto.", zh: "我鼓励你们说实话。" },
                    { source: "牛津词典", pt: "Meus pais sempre me <strong>encorajaram</strong> a estudar.", zh: "我父母总是鼓励我学习。" }
                ]
            },
            {
                pos: "vt.",
                enDef: "promote, stimulate",
                zhDef: "促进，刺激",
                examples: [
                    { source: "经济学人", pt: "O governo deve <strong>encorajar</strong> o investimento estrangeiro.", zh: "政府应该促进外国投资。" }
                ]
            }
        ]
    }
];

// ================= 序列 2：全局状态与 DOM 元素 =================
let learningQueue = [];
let learnedCount = 0;
let totalWords = 0;
let currentWordObj = null;
let currentOptionsData = [];

// 沉浸大卡片 (Modal) 的双维滑动状态
let currentMeaningIndex = 0;
let currentExampleIndex = 0;

const views = { 
    home: document.getElementById('home-view'), 
    learning: document.getElementById('learning-view'),
    immersive: document.getElementById('immersive-modal') // 大卡片视图
};

const els = {
    // 基础元素
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
    tabContent: document.getElementById('tab-content-container'),
    tabs: document.querySelectorAll('.tab'),
    recogExPt: document.getElementById('recognize-example-pt'),
    recogSentenceCard: document.getElementById('recognize-sentence-card'),
    recogBlindText: document.getElementById('recognize-blind-text'),
    fQuiz: document.getElementById('footer-quiz'),
    fRecog: document.getElementById('footer-recognize'),
    fDetail: document.getElementById('footer-detail'),
    
    // 大卡片元素 (Immersive Modal)
    btnOpenImmersive: document.getElementById('btn-open-immersive'),
    upperLayer: document.getElementById('upper-layer-container'),
    lowerLayer: document.getElementById('lower-layer-container'),
    upperSource: document.getElementById('upper-source-tag'),
    imEnSentence: document.getElementById('im-en-sentence'),
    imZhSentence: document.getElementById('im-zh-sentence'),
    upperDots: document.getElementById('upper-dots'),
    imPos: document.getElementById('im-pos'),
    imEnDef: document.getElementById('im-en-def'),
    imZhDef: document.getElementById('im-zh-def'),
    meaningCounter: document.getElementById('meaning-counter'),
    globalDots: document.getElementById('global-dots'),
    btnImClose: document.getElementById('im-btn-close'),
    btnImNext: document.getElementById('im-btn-next-word')
};

document.getElementById('learn-count').innerText = vocabularyData.length;

// ================= 序列 3：基础背词逻辑与手感控制 =================
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

    els.options.forEach((optContainer, index) => {
        const contentEl = els.optContents[index];
        if (currentOptionsData[index]) {
            const data = currentOptionsData[index].wordObj;
            contentEl.innerHTML = `<span class="opt-pos">${data.pos}</span><span class="opt-zh">${data.zh}</span>`;
            optContainer.style.display = 'flex'; 
            optContainer.style.pointerEvents = 'auto'; 
            optContainer.classList.remove('active'); 
        } else {
            optContainer.style.display = 'none'; 
        }
    });
}

function renderStage1() {
    els.app.className = 'bg-green';
    els.skeletonBars.classList.remove('hidden');
    els.recognizeArea.classList.remove('hidden');
    els.recogSentenceCard.classList.remove('hidden');
    els.recogBlindText.classList.add('hidden');
    
    // 取目标词第一个高亮替换
    els.recogExPt.innerHTML = highlightYellow(currentWordObj.example.pt); 
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
    els.options.forEach(el => el.style.pointerEvents = 'none');
    
    const selectedData = currentOptionsData[selectedIndex];
    const clickedBtn = els.options[selectedIndex];
    clickedBtn.classList.add('active'); 
    
    if (selectedData.isCorrect) {
        currentWordObj.stage = 1; learningQueue.push(currentWordObj); updateDots(1); 
        setTimeout(() => showDetails(), 400); 
    } else {
        currentWordObj.stage = 0; learningQueue.push(currentWordObj); updateDots(0); 
        els.optContents[selectedIndex].innerHTML = `<span style="color:#ff6b6b; font-size: 1.1rem; text-align:center; display:block; width:100%; font-weight:bold;">${selectedData.wordObj.pt}</span>`;
        
        currentOptionsData.forEach((opt, index) => {
            if (opt.isCorrect) els.options[index].classList.add('active'); 
        });
        
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

// 底部 Tab 菜单
els.tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        els.tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        renderTabContent(e.target.dataset.target);
    });
});

function renderTabContent(targetType) {
    els.tabContent.innerHTML = ''; 
    let contentData = currentWordObj[targetType] || [];
    
    if (contentData.length === 0) {
        els.tabContent.innerHTML = `<div style="height: 100%; display: flex; align-items: center; justify-content: center;"><p style="color: rgba(255,255,255,0.4); font-size: 0.9rem;">暂无数据</p></div>`;
        return;
    }

    contentData.forEach(item => {
        if (targetType === 'phrases') {
            const splitIndex = item.search(/[\u4e00-\u9fa5]/); 
            const en = splitIndex > 0 ? item.substring(0, splitIndex).trim() : item;
            const zh = splitIndex > 0 ? item.substring(splitIndex).trim() : '';
            els.tabContent.innerHTML += `<div class="phrase-item"><p class="phrase-en">${en}</p><p class="phrase-zh">${zh}</p></div>`;
        } else {
            els.tabContent.innerHTML += `<div class="phrase-item"><p class="phrase-en">${item}</p></div>`;
        }
    });
}

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

    // 将 <strong> 替换为自带黄色的 span
    document.getElementById('word-example-pt').innerHTML = highlightYellow(currentWordObj.example.pt);
    document.getElementById('word-example-zh').innerText = currentWordObj.example.zh;

    els.tabs[0].click(); 
}

// 下一词
document.getElementById('btn-next').addEventListener('click', () => {
    setTimeout(() => loadNextState(), 150);
});
document.getElementById('btn-forgot').addEventListener('click', () => {
    if (currentWordObj.stage === 3) learnedCount--; 
    currentWordObj.stage = 0; learningQueue.push(currentWordObj);
    setTimeout(() => loadNextState(), 150);
});

// ================= 序列 4：高亮辅助函数 =================
function highlightYellow(text) {
    return text.replace(/<strong>/g, '<span class="highlight-yellow">').replace(/<\/strong>/g, '</span>');
}


// ================= 序列 5：沉浸大卡片核心系统 (二维滑动) =================

// 1. 打开大卡片
els.btnOpenImmersive.addEventListener('click', () => {
    // 若没有 meanings 数据，直接 return
    if (!currentWordObj.meanings || currentWordObj.meanings.length === 0) return;
    
    currentMeaningIndex = 0;
    currentExampleIndex = 0;
    
    views.learning.classList.replace('active', 'hidden');
    views.immersive.classList.replace('hidden', 'active');
    
    renderImmersiveModal();
});

// 2. 渲染整个 Modal 
function renderImmersiveModal() {
    renderImmersiveUpper(); // 渲染上层 (例句区)
    renderImmersiveLower(); // 渲染下层 (释义与考义切换区)
}

// 2.1 渲染上层 (同义不同句)
function renderImmersiveUpper() {
    const meaning = currentWordObj.meanings[currentMeaningIndex];
    const ex = meaning.examples[currentExampleIndex];
    
    els.upperSource.innerText = ex.source || "词典例句";
    els.imEnSentence.innerHTML = highlightYellow(ex.pt);
    els.imZhSentence.innerText = ex.zh;
    
    // 动态生成上层圆点
    els.upperDots.innerHTML = '';
    if (meaning.examples.length > 1) {
        meaning.examples.forEach((_, idx) => {
            els.upperDots.innerHTML += `<span class="dot ${idx === currentExampleIndex ? 'active' : ''}"></span>`;
        });
    }
}

// 2.2 渲染下层 (不同释义，考义)
function renderImmersiveLower() {
    const meaning = currentWordObj.meanings[currentMeaningIndex];
    const totalMeanings = currentWordObj.meanings.length;
    
    els.imPos.innerText = meaning.pos;
    els.imEnDef.innerText = meaning.enDef;
    els.imZhDef.innerText = meaning.zhDef;
    
    // 右下角 1/9 指示器
    els.meaningCounter.innerText = `${currentMeaningIndex + 1}/${totalMeanings}`;
    
    // 底部全局考义圆点/胶囊
    els.globalDots.innerHTML = '';
    if (totalMeanings > 1) {
        currentWordObj.meanings.forEach((_, idx) => {
            if (idx === currentMeaningIndex) {
                els.globalDots.innerHTML += `<span class="global-dot capsule">考义</span>`;
            } else {
                els.globalDots.innerHTML += `<span class="global-dot"></span>`;
            }
        });
    }
}

// ================= 序列 6：二维滑动监听 =================

// 上层滑动 (切换例句)
let upperTouchStartX = 0;
els.upperLayer.addEventListener('touchstart', e => { upperTouchStartX = e.changedTouches[0].screenX; });
els.upperLayer.addEventListener('touchend', e => {
    let touchEndX = e.changedTouches[0].screenX;
    let diff = touchEndX - upperTouchStartX;
    
    const meaning = currentWordObj.meanings[currentMeaningIndex];
    const totalEx = meaning.examples.length;
    
    if (totalEx > 1) {
        if (diff < -40 && currentExampleIndex < totalEx - 1) {
            // 向左划，下一句
            currentExampleIndex++;
            renderImmersiveUpper();
        } else if (diff > 40 && currentExampleIndex > 0) {
            // 向右划，上一句
            currentExampleIndex--;
            renderImmersiveUpper();
        }
    }
});

// 下层滑动 (切换考义/释义)
let lowerTouchStartX = 0;
els.lowerLayer.addEventListener('touchstart', e => { lowerTouchStartX = e.changedTouches[0].screenX; });
els.lowerLayer.addEventListener('touchend', e => {
    let touchEndX = e.changedTouches[0].screenX;
    let diff = touchEndX - lowerTouchStartX;
    
    const totalMeanings = currentWordObj.meanings.length;
    
    if (totalMeanings > 1) {
        if (diff < -40 && currentMeaningIndex < totalMeanings - 1) {
            // 向左划，下一个释义
            currentMeaningIndex++;
            currentExampleIndex = 0; // 重置该释义的例句到第一句
            renderImmersiveModal();
        } else if (diff > 40 && currentMeaningIndex > 0) {
            // 向右划，上一个释义
            currentMeaningIndex--;
            currentExampleIndex = 0; 
            renderImmersiveModal();
        }
    }
});

// ================= 序列 7：大卡片底部按钮 =================
els.btnImClose.addEventListener('click', () => {
    views.immersive.classList.replace('active', 'hidden');
    views.learning.classList.replace('hidden', 'active');
});

els.btnImNext.addEventListener('click', () => {
    views.immersive.classList.replace('active', 'hidden');
    views.learning.classList.replace('hidden', 'active');
    setTimeout(() => loadNextState(), 150); // 丝滑切到下个单词
});
