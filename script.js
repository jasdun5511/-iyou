// ================= 序列 1：升维版数据结构与全局状态 =================
const vocabularyData = [
    { 
        pt: "mesmo", pos: "adv.", zh: "甚至，即使", phonetic: "/'mez.mu/", errorCount: 0,
        example: { pt: "<strong>Mesmo</strong> na cidade, o trabalho era difícil.", zh: "即使在城市里，工作也很难找。" },
        phrases: ["mesmo assim 尽管如此", "mesmo que 即使"],
        derivatives: ["mesmíssimo (adj. 完全一样的)"],
        roots: ["源自拉丁语 'metipsimus'"],
        synonyms: ["ainda (adv. 还，甚至)", "até (prep. 直到，甚至)"],
        meanings: [
            { pos: "adv.", enDef: "even, exactly", zhDef: "甚至，即使", examples: [{ source: "柯林斯词典", pt: "<strong>Mesmo</strong> na cidade, o trabalho era difícil.", zh: "即使在城市里，工作也很难找。" }] },
            { pos: "adj.", enDef: "same, identical", zhDef: "同一个的", examples: [{ source: "小学教材", pt: "Nós moramos na <strong>mesma</strong> rua.", zh: "我们住在同一条街上。" }] },
            { pos: "pron.", enDef: "oneself", zhDef: "(强调) 自己", examples: [{ source: "基础语法", pt: "Eu <strong>mesmo</strong> fiz o bolo.", zh: "我自己做了蛋糕。" }] }
        ]
    },
    { 
        pt: "encorajar", pos: "vt.", zh: "鼓励；劝告，怂恿", phonetic: "/ẽ.ku.ɾaˈʒaɾ/", errorCount: 0,
        example: { pt: "Eu <strong>encorajo</strong> você a ser completamente honesto.", zh: "我鼓励你们说实话。" },
        phrases: ["encorajar a violência 助长暴力", "encorajar o investimento 促进投资"],
        derivatives: ["coragem (n. 勇气)", "encorajamento (n. 鼓励，怂恿)"],
        roots: ["en- (使...) + coragem (勇气) + -ar (动词后缀)"],
        synonyms: ["animar (vt. 使兴奋)"],
        meanings: [
            { pos: "vt.", enDef: "encourage, advise", zhDef: "鼓励，怂恿", examples: [{ source: "TED 演讲", pt: "Eu <strong>encorajo</strong> você a ser completamente honesto.", zh: "我鼓励你们说实话。" }] },
            { pos: "vt.", enDef: "promote, stimulate", zhDef: "促进，刺激", examples: [{ source: "经济学人", pt: "O governo deve <strong>encorajar</strong> o investimento estrangeiro.", zh: "政府应该促进外国投资。" }] }
        ]
    }
];

let learningQueue = [];
let learnedCount = 0;
let totalWords = 0;
let currentWordObj = null;
let currentOptionsData = [];

let currentMeaningIndex = 0;
let currentExampleIndex = 0;

let spellingQueue = [];
let wrongWordsQueue = [];
let currentSpellWord = null;
let spellCurrentIndex = 0;
let spellTotalInRound = 0;
let spellHasErroredThisTurn = false;
let isSpellChecking = false;
let isComposing = false; // 拼写状态标记：处理葡语特殊字符组合输入


// ================= 序列 2：全局视图与 DOM 元素映射 =================
const views = { 
    home: document.getElementById('home-view'), 
    learning: document.getElementById('learning-view'),
    immersive: document.getElementById('immersive-modal'),
    transition: document.getElementById('transition-view'),
    spelling: document.getElementById('spelling-view'),
    summary: document.getElementById('summary-view')
};

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
    tabContent: document.getElementById('tab-content-container'),
    tabs: document.querySelectorAll('.tab'),
    recogExPt: document.getElementById('recognize-example-pt'),
    recogSentenceCard: document.getElementById('recognize-sentence-card'),
    recogBlindText: document.getElementById('recognize-blind-text'),
    fQuiz: document.getElementById('footer-quiz'),
    fRecog: document.getElementById('footer-recognize'),
    fDetail: document.getElementById('footer-detail'),
    
    btnOpenImmersive: document.getElementById('btn-open-immersive'),
    upperWindow: document.getElementById('upper-window'),
    upperTrack: document.getElementById('upper-track'),
    lowerWindow: document.getElementById('lower-window'),
    lowerTrack: document.getElementById('lower-track'),
    upperSource: document.getElementById('upper-source-tag'),
    upperDots: document.getElementById('upper-dots'),
    globalDots: document.getElementById('global-dots'),
    btnImClose: document.getElementById('im-btn-close'),
    btnImNext: document.getElementById('im-btn-next-word'),

    btnStartSpell: document.getElementById('btn-start-spell'),
    btnSkipSpell: document.getElementById('btn-skip-spell'),

    // 重构版拼写 UI 元素
    btnCloseSpell: document.getElementById('btn-close-spell'),
    spellProgress: document.getElementById('spell-progress-text'),
    spellMeaning: document.getElementById('spell-word-meaning'),
    letterBoxes: document.getElementById('letter-boxes'),
    hiddenInput: document.getElementById('hidden-input'),
    hintContainer: document.getElementById('hint-container'),
    bulbIcon: document.getElementById('bulb-icon'),
    
    summaryList: document.getElementById('summary-list'),
    totalCount: document.getElementById('total-words-count'),
    btnFinish: document.getElementById('btn-finish')
};

document.getElementById('learn-count').innerText = vocabularyData.length;


// ================= 序列 3：基础背词发音与流程控制 =================
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
    vocabularyData.forEach(w => w.errorCount = 0);
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
        showTransitionPhase();
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


// ================= 序列 4：测验出题与交互反馈 (Stage 0) =================
function renderStage0() {
    els.app.className = 'bg-blur';
    els.quizArea.classList.remove('hidden');
    els.fQuiz.classList.remove('hidden');

    els.fQuiz.innerHTML = `<div class="action-item" onclick="showAnswerDirectly()"><span>看答案</span><div class="line red"></div></div>`;

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
        optContainer.classList.remove('wrong', 'correct', 'active');
        contentEl.innerHTML = '';
        
        if (currentOptionsData[index]) {
            const data = currentOptionsData[index].wordObj;
            contentEl.innerHTML = `<span class="opt-pos">${data.pos}</span><span class="opt-zh">${data.zh}</span>`;
            optContainer.style.display = 'flex'; 
            optContainer.style.pointerEvents = 'auto'; 
        } else {
            optContainer.style.display = 'none'; 
        }
    });
}

window.checkAnswer = function(selectedIndex) {
    els.options.forEach(el => el.style.pointerEvents = 'none'); 
    const selectedData = currentOptionsData[selectedIndex];
    const clickedBtn = els.options[selectedIndex];
    
    if (selectedData.isCorrect) {
        currentWordObj.stage = 1; learningQueue.push(currentWordObj); updateDots(1); 
        clickedBtn.classList.add('correct');
        els.optContents[selectedIndex].innerHTML = `<div class="opt-bilingual"><span class="opt-pt-text">${selectedData.wordObj.pt}</span><span class="opt-zh-text">${selectedData.wordObj.pos} ${selectedData.wordObj.zh}</span></div>`;
        setTimeout(() => showDetails(), 400); 
    } else {
        let masterWord = vocabularyData.find(w => w.pt === currentWordObj.pt);
        if (masterWord) masterWord.errorCount++;

        currentWordObj.stage = 0; learningQueue.push(currentWordObj); updateDots(0); 
        clickedBtn.classList.add('wrong');
        els.optContents[selectedIndex].innerHTML = `<div class="opt-bilingual"><span class="opt-pt-text">${selectedData.wordObj.pt}</span><span class="opt-zh-text">${selectedData.wordObj.pos} ${selectedData.wordObj.zh}</span></div>`;
        
        currentOptionsData.forEach((opt, index) => {
            if (opt.isCorrect) {
                const correctBtn = els.options[index]; correctBtn.classList.add('correct');
                els.optContents[index].innerHTML = `<div class="opt-bilingual"><span class="opt-pt-text">${opt.wordObj.pt}</span><span class="opt-zh-text">${opt.wordObj.pos} ${opt.wordObj.zh}</span></div>`;
            }
        });
        
        playAudio(selectedData.wordObj.pt);
        els.fQuiz.innerHTML = `<div class="action-item" onclick="showDetails()" style="animation: fadeIn 0.3s;"><span style="color: #fff; font-weight: 500;">查看详情</span><div class="line" style="background-color: #f39c12;"></div></div>`;
    }
}


// ================= 序列 5：复习认词与详情逻辑 (Stage 1-3) =================
function renderStage1() {
    els.app.className = 'bg-green';
    els.skeletonBars.classList.remove('hidden');
    els.recognizeArea.classList.remove('hidden');
    els.recogSentenceCard.classList.remove('hidden');
    els.recogBlindText.classList.add('hidden');
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

document.getElementById('btn-recognize').addEventListener('click', () => {
    if (currentWordObj.stage === 1) { currentWordObj.stage = 2; learningQueue.push(currentWordObj); updateDots(2); } 
    else if (currentWordObj.stage === 2) { currentWordObj.stage = 3; learnedCount++; updateDots(3); }
    setTimeout(() => showDetails(), 150); 
});

document.getElementById('btn-not-recognize').addEventListener('click', punishAndShow);
document.getElementById('btn-hint').addEventListener('click', punishAndShow);

function punishAndShow() {
    let masterWord = vocabularyData.find(w => w.pt === currentWordObj.pt);
    if (masterWord) masterWord.errorCount++;
    currentWordObj.stage = 0; learningQueue.push(currentWordObj); updateDots(0);
    setTimeout(() => showDetails(), 150);
}

window.showAnswerDirectly = function() { punishAndShow(); }

els.tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        els.tabs.forEach(t => t.classList.remove('active')); e.target.classList.add('active');
        renderTabContent(e.target.dataset.target);
    });
});

function renderTabContent(targetType) {
    els.tabContent.innerHTML = ''; 
    let contentData = currentWordObj[targetType] || [];
    if (contentData.length === 0) {
        els.tabContent.innerHTML = `<div style="height: 100%; display: flex; align-items: center; justify-content: center;"><p style="color: rgba(255,255,255,0.4); font-size: 0.9rem;">暂无数据</p></div>`; return;
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

window.showDetails = function() {
    els.app.className = 'bg-blur'; els.skeletonBars.classList.add('hidden');
    els.quizArea.classList.add('hidden'); els.recognizeArea.classList.add('hidden');
    els.fQuiz.classList.add('hidden'); els.fRecog.classList.add('hidden');
    els.defArea.classList.remove('hidden'); els.detailArea.classList.remove('hidden'); els.fDetail.classList.remove('hidden');

    document.getElementById('word-example-pt').innerHTML = highlightYellow(currentWordObj.example.pt);
    document.getElementById('word-example-zh').innerText = currentWordObj.example.zh;
    els.tabs[0].click(); 
}

document.getElementById('btn-next').addEventListener('click', () => { setTimeout(() => loadNextState(), 150); });
document.getElementById('btn-forgot').addEventListener('click', () => {
    let masterWord = vocabularyData.find(w => w.pt === currentWordObj.pt);
    if (masterWord) masterWord.errorCount++;
    if (currentWordObj.stage === 3) learnedCount--; 
    currentWordObj.stage = 0; learningQueue.push(currentWordObj);
    setTimeout(() => loadNextState(), 150);
});

function highlightYellow(text) { return text.replace(/<strong>/g, '<span class="highlight-yellow">').replace(/<\/strong>/g, '</span>'); }


// ================= 序列 6：沉浸大卡片与物理滑动 =================
els.btnOpenImmersive.addEventListener('click', () => {
    if (!currentWordObj.meanings || currentWordObj.meanings.length === 0) return;
    currentMeaningIndex = 0; currentExampleIndex = 0;
    
    els.lowerTrack.innerHTML = '';
    currentWordObj.meanings.forEach((meaning, idx) => {
        els.lowerTrack.innerHTML += `<div class="slider-slide"><div class="def-panel"><p class="im-pos">${meaning.pos}</p><p class="im-en-def">${meaning.enDef}</p><p class="im-zh-def">${meaning.zhDef}</p><div class="meaning-counter">${idx + 1}/${currentWordObj.meanings.length}</div></div></div>`;
    });

    updateGlobalDots(); populateUpperTrack(0); 
    
    els.lowerTrack.style.transition = 'none'; els.lowerTrack.style.transform = `translateX(0%)`; void els.lowerTrack.offsetWidth;
    els.lowerTrack.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)';

    views.learning.classList.replace('active', 'hidden'); views.immersive.classList.replace('hidden', 'active');
});

function populateUpperTrack(meaningIdx) {
    const meaning = currentWordObj.meanings[meaningIdx]; currentExampleIndex = 0; 
    els.upperTrack.innerHTML = '';
    meaning.examples.forEach(ex => { els.upperTrack.innerHTML += `<div class="slider-slide"><p class="im-en-sentence">${highlightYellow(ex.pt)}</p><p class="im-zh-sentence">${ex.zh}</p></div>`; });

    els.upperDots.innerHTML = '';
    if (meaning.examples.length > 1) { meaning.examples.forEach((_, idx) => { els.upperDots.innerHTML += `<span class="dot ${idx === 0 ? 'active' : ''}"></span>`; }); }

    els.upperTrack.style.transition = 'none'; els.upperTrack.style.transform = `translateX(0%)`; void els.upperTrack.offsetWidth;
    els.upperTrack.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)';
    els.upperSource.innerText = meaning.examples[0].source || "词典例句";
}

function updateUpperTransform() {
    els.upperTrack.style.transform = `translateX(-${currentExampleIndex * 100}%)`;
    const dots = els.upperDots.querySelectorAll('.dot');
    if (dots.length > 0) { dots.forEach((dot, idx) => dot.classList.toggle('active', idx === currentExampleIndex)); }
    els.upperSource.innerText = currentWordObj.meanings[currentMeaningIndex].examples[currentExampleIndex].source || "词典例句";
}

function updateLowerTransform() {
    els.lowerTrack.style.transform = `translateX(-${currentMeaningIndex * 100}%)`; updateGlobalDots();
}

function updateGlobalDots() {
    els.globalDots.innerHTML = '';
    const total = currentWordObj.meanings.length;
    if (total > 1) {
        for(let i=0; i<total; i++) {
            if (i === currentMeaningIndex) els.globalDots.innerHTML += `<span class="global-dot capsule">考义</span>`;
            else els.globalDots.innerHTML += `<span class="global-dot"></span>`;
        }
    }
}

const SWIPE_THRESHOLD = 50; 
let upperStartX = 0; let upperIsDragging = false;
els.upperWindow.addEventListener('touchstart', e => { upperStartX = e.touches[0].screenX; upperIsDragging = true; els.upperTrack.style.transition = 'none'; });
els.upperWindow.addEventListener('touchmove', e => {
    if (!upperIsDragging) return;
    let diff = e.touches[0].screenX - upperStartX;
    const totalEx = currentWordObj.meanings[currentMeaningIndex].examples.length;
    if ((currentExampleIndex === 0 && diff > 0) || (currentExampleIndex === totalEx - 1 && diff < 0)) diff = diff * 0.25; 
    els.upperTrack.style.transform = `translateX(calc(-${currentExampleIndex * 100}% + ${diff}px))`;
});
els.upperWindow.addEventListener('touchend', e => {
    if (!upperIsDragging) return; upperIsDragging = false;
    let diff = e.changedTouches[0].screenX - upperStartX;
    const totalEx = currentWordObj.meanings[currentMeaningIndex].examples.length;
    els.upperTrack.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)';
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
        if (diff < 0 && currentExampleIndex < totalEx - 1) currentExampleIndex++; 
        else if (diff > 0 && currentExampleIndex > 0) currentExampleIndex--; 
    }
    updateUpperTransform(); 
});

let lowerStartX = 0; let lowerIsDragging = false;
els.lowerWindow.addEventListener('touchstart', e => { lowerStartX = e.touches[0].screenX; lowerIsDragging = true; els.lowerTrack.style.transition = 'none'; });
els.lowerWindow.addEventListener('touchmove', e => {
    if (!lowerIsDragging) return;
    let diff = e.touches[0].screenX - lowerStartX;
    const totalMeanings = currentWordObj.meanings.length;
    if ((currentMeaningIndex === 0 && diff > 0) || (currentMeaningIndex === totalMeanings - 1 && diff < 0)) diff = diff * 0.25; 
    els.lowerTrack.style.transform = `translateX(calc(-${currentMeaningIndex * 100}% + ${diff}px))`;
});
els.lowerWindow.addEventListener('touchend', e => {
    if (!lowerIsDragging) return; lowerIsDragging = false;
    let diff = e.changedTouches[0].screenX - lowerStartX;
    const totalMeanings = currentWordObj.meanings.length;
    els.lowerTrack.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)';
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
        if (diff < 0 && currentMeaningIndex < totalMeanings - 1) {
            currentMeaningIndex++; updateLowerTransform(); setTimeout(() => { populateUpperTrack(currentMeaningIndex); }, 150); 
        } else if (diff > 0 && currentMeaningIndex > 0) {
            currentMeaningIndex--; updateLowerTransform(); setTimeout(() => { populateUpperTrack(currentMeaningIndex); }, 150);
        } else { updateLowerTransform(); }
    } else { updateLowerTransform(); }
});

els.btnImClose.addEventListener('click', () => { views.immersive.classList.replace('active', 'hidden'); views.learning.classList.replace('hidden', 'active'); });
els.btnImNext.addEventListener('click', () => { views.immersive.classList.replace('active', 'hidden'); views.learning.classList.replace('hidden', 'active'); setTimeout(() => loadNextState(), 150); });


// ================= 序列 7：过渡阶段与小结视图 =================
function showTransitionPhase() {
    views.learning.classList.replace('active', 'hidden');
    views.transition.classList.replace('hidden', 'active');
}

els.btnStartSpell.addEventListener('click', () => {
    views.transition.classList.replace('active', 'hidden');
    startSpellingPhase();
});

els.btnSkipSpell.addEventListener('click', () => {
    views.transition.classList.replace('active', 'hidden');
    showSummaryPhase();
});

function showSummaryPhase() {
    views.spelling.classList.replace('active', 'hidden');
    views.summary.classList.replace('hidden', 'active');
    els.summaryList.innerHTML = '';
    
    vocabularyData.forEach(item => {
        const errCount = item.errorCount || 0;
        const errorClass = errCount === 0 ? 'summary-error zero' : 'summary-error';
        const errorText = errCount === 0 ? '完美' : `错 ${errCount} 次`;
        
        els.summaryList.innerHTML += `
            <div class="summary-item">
                <span class="summary-word">${item.pt}</span>
                <span class="${errorClass}">${errorText}</span>
            </div>
        `;
    });
}

els.btnFinish.addEventListener('click', () => {
    views.summary.classList.replace('active', 'hidden');
    views.home.classList.replace('hidden', 'active');
});


// ================= 序列 8：重构版拼写逻辑引擎 (兼容葡语键盘) =================
function startSpellingPhase() {
    views.spelling.classList.replace('hidden', 'active');
    spellingQueue = [...vocabularyData];
    wrongWordsQueue = [];
    spellCurrentIndex = 0;
    spellTotalInRound = spellingQueue.length;
    els.totalCount.innerText = spellTotalInRound;
    loadNextSpellWord();
}

els.btnCloseSpell.addEventListener('click', () => {
    if (confirm('确定要退出拼写直接看小结吗？')) {
        showSummaryPhase();
    }
});

function loadNextSpellWord() {
    if (spellingQueue.length === 0) {
        if (wrongWordsQueue.length > 0) {
            alert("接下来复习错词"); 
            spellingQueue = [...wrongWordsQueue];
            wrongWordsQueue = [];
            spellCurrentIndex = 0;
            spellTotalInRound = spellingQueue.length;
        } else {
            showSummaryPhase(); return;
        }
    }

    currentSpellWord = spellingQueue.shift();
    spellCurrentIndex++;
    spellHasErroredThisTurn = false;
    isSpellChecking = false;
    
    updateSpellUI();
}

function updateSpellUI() {
    els.spellProgress.innerText = `${spellCurrentIndex}/${spellTotalInRound}`;
    els.spellMeaning.innerText = `${currentSpellWord.pos} ${currentSpellWord.zh}`;
    
    // 初始化隐藏的 input
    els.hiddenInput.value = '';
    els.hiddenInput.disabled = false;
    els.hiddenInput.maxLength = currentSpellWord.pt.length;
    
    // 动态生成字母槽
    els.letterBoxes.innerHTML = '';
    for (let i = 0; i < currentSpellWord.pt.length; i++) {
        els.letterBoxes.innerHTML += `<div class="letter-box"></div>`;
    }
    
    // 延迟聚焦，确保移动端视图渲染完毕后拉起键盘
    setTimeout(() => { els.hiddenInput.focus(); }, 300);
}

// 防弹级：解决移动端键盘组合输入（葡语特殊字符）
els.hiddenInput.addEventListener('compositionstart', () => { isComposing = true; });
els.hiddenInput.addEventListener('compositionend', (e) => { 
    isComposing = false; 
    syncInputToSlots(e.target.value); 
});

// 监听标准输入
els.hiddenInput.addEventListener('input', (e) => {
    syncInputToSlots(e.target.value);
    // 当输入长度达到目标，且没有在进行组合输入时，自动触发判定
    if (!isComposing && e.target.value.length === currentSpellWord.pt.length) {
        setTimeout(() => checkSpelling(), 150);
    }
});

// 核心同步函数：将真实 input 的值拆解到自定义字母槽中
function syncInputToSlots(val) {
    const boxes = els.letterBoxes.children;
    // 先清空所有槽位状态
    for (let i = 0; i < boxes.length; i++) {
        boxes[i].innerText = '';
        boxes[i].classList.remove('filled');
    }
    // 重新填入当前字符
    for (let i = 0; i < val.length; i++) {
        if (boxes[i]) {
            boxes[i].innerText = val[i];
            boxes[i].classList.add('filled');
        }
    }
}

// 确保用户点击屏幕空白处也能重新唤起键盘
document.querySelector('.spell-main-content').addEventListener('click', () => {
    if(!isSpellChecking) els.hiddenInput.focus();
});

function checkSpelling() {
    if (isSpellChecking) return;
    isSpellChecking = true;
    
    els.hiddenInput.blur(); 
    els.hiddenInput.disabled = true; // 锁定输入，防止动画期间乱点
    
    const userInput = els.hiddenInput.value.trim().toLowerCase();
    const targetWord = currentSpellWord.pt.toLowerCase();
    const boxes = els.letterBoxes.children;
    
    let isCorrect = (userInput === targetWord);

    if (isCorrect && !spellHasErroredThisTurn) {
        for (let i = 0; i < boxes.length; i++) { boxes[i].classList.add('correct'); }
        playAudio(currentSpellWord.pt);
        setTimeout(loadNextSpellWord, 800); 
    } else {
        if (!spellHasErroredThisTurn) recordSpellError();
        
        for (let i = 0; i < targetWord.length; i++) {
            boxes[i].classList.remove('filled', 'correct', 'wrong');
            if (userInput[i] === targetWord[i]) {
                boxes[i].innerText = targetWord[i];
                boxes[i].classList.add('correct');
            } else {
                boxes[i].innerText = targetWord[i];
                boxes[i].classList.add('wrong'); 
            }
        }
        playAudio(currentSpellWord.pt);
        setTimeout(loadNextSpellWord, 2000); 
    }
}

function recordSpellError() {
    spellHasErroredThisTurn = true;
    wrongWordsQueue.push(currentSpellWord);
    
    let masterWord = vocabularyData.find(w => w.pt === currentSpellWord.pt);
    if (masterWord) masterWord.errorCount++;
}

els.hintContainer.addEventListener('click', () => {
    if (isSpellChecking) return;
    if (!spellHasErroredThisTurn) recordSpellError();
    
    // 提示时闪烁灯泡并自动填入正确拼写
    els.bulbIcon.style.backgroundColor = 'rgba(255,255,255,0.2)';
    setTimeout(() => { els.bulbIcon.style.backgroundColor = 'transparent'; }, 300);
    
    els.hiddenInput.value = currentSpellWord.pt;
    syncInputToSlots(currentSpellWord.pt);
    checkSpelling(); // 提示完直接判错并进入下一题
});
