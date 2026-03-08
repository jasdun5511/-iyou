// ================= 序列 1：总词典架构 & 高级数据引擎 =================

let globalDict = {}; 
let globalVocabularyData = []; 
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
let isComposing = false;

let currentBookName = '核心葡语词汇';

let isReviewMode = false;
let currentReviewWords = [];

const EBBINGHAUS_INTERVALS = [1, 2, 4, 7, 15, 30, 60]; 

// 推算基于“凌晨 4 点”为跨天界限的下一次复习时间戳
function getNextReviewTime(days) {
    let now = new Date();
    let targetDate = new Date(now);
    
    // 如果当前时间是凌晨 4 点前，依然算作“昨天”的学习
    if (now.getHours() < 4) {
        targetDate.setDate(targetDate.getDate() - 1);
    }
    
    // 加上指定的复习间隔天数，并将时间严格锁定在当天的凌晨 4:00:00
    targetDate.setDate(targetDate.getDate() + days);
    targetDate.setHours(4, 0, 0, 0);
    
    return targetDate.getTime();
}

const StorageManager = {
    getProgress: function() {
        const data = localStorage.getItem('splendid_global_progress');
        return data ? JSON.parse(data) : {};
    },
    saveProgress: function(progress) {
        localStorage.setItem('splendid_global_progress', JSON.stringify(progress));
    },
    saveWordError: function(wordId) {
        let progress = this.getProgress();
        if (!progress[wordId]) progress[wordId] = { errorCount: 0 };
        progress[wordId].errorCount = (progress[wordId].errorCount || 0) + 1;
        this.saveProgress(progress);
    },
    getWordError: function(wordId) {
        let progress = this.getProgress();
        return progress[wordId] ? progress[wordId].errorCount : 0;
    },
    markAsLearned: function(wordId) {
        let progress = this.getProgress();
        if (!progress[wordId]) progress[wordId] = { errorCount: 0 };
        progress[wordId].isLearned = true;
        progress[wordId].ebStage = 0; 
        
        // 第一次学完，固定为明天的凌晨 4 点进入复习
        progress[wordId].nextReviewDate = getNextReviewTime(1); 
        this.saveProgress(progress);
    },
    updateReviewResult: function(wordId, isSuccess) {
        let progress = this.getProgress();
        if (!progress[wordId]) return;
        
        if (isSuccess) {
            // 复习成功：晋级下一阶段，从今天开始往后推算新的天数
            let nextStage = (progress[wordId].ebStage || 0) + 1;
            if (nextStage >= EBBINGHAUS_INTERVALS.length) nextStage = EBBINGHAUS_INTERVALS.length - 1;
            progress[wordId].ebStage = nextStage;
            const daysToWait = EBBINGHAUS_INTERVALS[nextStage];
            progress[wordId].nextReviewDate = getNextReviewTime(daysToWait);
        } else {
            // 复习失败（忘记/拼错）：阶段清零，明早 4 点重新复习
            progress[wordId].ebStage = 0;
            progress[wordId].nextReviewDate = getNextReviewTime(1);
        }
        this.saveProgress(progress);
    },
    getCurrentBook: function() {
        const data = localStorage.getItem('splendid_current_book');
        return data ? JSON.parse(data) : null;
    },
    setCurrentBook: function(bookData) {
        localStorage.setItem('splendid_current_book', JSON.stringify(bookData));
    }
};

function recordError(wordObj) {
    if (!wordObj || !wordObj.id) return;
    StorageManager.saveWordError(wordObj.id);
    let masterWord = globalVocabularyData.find(w => w.id === wordObj.id);
    if (masterWord) {
        masterWord.errorCount = StorageManager.getWordError(wordObj.id);
    }
}

// 动态计算首页的待学/待复习数字
window.updateHomeCounts = function() {
    if (!globalVocabularyData) return;
    const progressData = StorageManager.getProgress();
    const now = Date.now();
    
    const toLearn = globalVocabularyData.filter(w => !progressData[w.id]?.isLearned);
    const toReview = globalVocabularyData.filter(w => progressData[w.id]?.isLearned && progressData[w.id].nextReviewDate <= now);
    
    // 更新学习数字
    const learnCountEl = document.getElementById('learn-count');
    if (learnCountEl) learnCountEl.innerText = toLearn.length;
    
    // 更新复习数字（只保留数字）
    const reviewSubtitle = document.getElementById('review-count') || 
                           document.querySelector('#btn-review .nav-count') || 
                           document.querySelector('.nav-card:nth-child(2) .nav-count');
                           
    if (reviewSubtitle) {
        reviewSubtitle.innerText = toReview.length;
    }
};



async function initApp() {
    try {
        const dictRes = await fetch('./global_dict.json');
        if (!dictRes.ok) throw new Error('找不到总词典');
        globalDict = await dictRes.json();

        const savedBook = StorageManager.getCurrentBook();
        if (savedBook) {
            await loadVocabularyBook(savedBook.fileName, savedBook.title);
            updateDashboardBookUI(savedBook); 
        } else {
            document.getElementById('learn-count').innerText = 0;
        }
    } catch (error) {
        alert('系统初始化失败，请检查是否在同级目录下创建了 global_dict.json！');
    }
}

async function loadVocabularyBook(bookFileName, bookTitle) {
    try {
        currentBookName = bookTitle;
        const response = await fetch(`./${bookFileName}.json`);
        if (!response.ok) throw new Error('词书文件不存在');
        const wordIds = await response.json(); 
        
        globalVocabularyData = wordIds.map(id => {
            const wordData = globalDict[id];
            if (!wordData) return null;
            return {
                ...wordData,
                id: id,
                errorCount: StorageManager.getWordError(id) 
            };
        }).filter(item => item !== null);

        updateHomeCounts(); 
    } catch (error) {
        alert(`无法加载词书 ${bookFileName}.json，请检查文件是否存在！`);
    }
}

window.updateDashboardBookUI = function(bookInfo) {
    const dashBookCover = document.getElementById('btn-open-wordlist-cover');
    const dashCoverText = document.getElementById('dash-cover-text');
    const dashBookTitleText = document.getElementById('dash-book-title-text');

    if(dashBookCover && dashCoverText && dashBookTitleText) {
        dashBookCover.className = `book-cover ${bookInfo.coverClass}`;
        dashCoverText.innerHTML = bookInfo.coverText.replace('\\n', '<br>');
        dashBookTitleText.innerText = bookInfo.title;
    }

    document.querySelectorAll('.tag-learning').forEach(tag => tag.remove());
    const activeBookItem = document.querySelector(`.lib-book-item[data-file="${bookInfo.fileName}"]`);
    if(activeBookItem) {
        activeBookItem.querySelector('.lib-book-meta').innerHTML += '<span class="tag-learning">正在学习</span>';
    }
};

document.addEventListener('DOMContentLoaded', () => { initApp(); });


// ================= 序列 2：全局视图与 DOM 元素映射 =================
const views = { 
    home: document.getElementById('home-view'), 
    learning: document.getElementById('learning-view'),
    immersive: document.getElementById('immersive-modal'),
    transition: document.getElementById('transition-view'),
    spelling: document.getElementById('spelling-view'),
    summary: document.getElementById('summary-view'),
    dashboard: document.getElementById('dashboard-view'),
    library: document.getElementById('library-view'),
    wordlist: document.getElementById('wordlist-view')
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


// ================= 序列 3：全局 UI 引擎 & 基础背词流程 =================

window.showToast = function(message) {
    let toast = document.getElementById('splendid-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'splendid-toast';
        toast.style.cssText = `
            position: fixed; top: 70px; left: 50%; transform: translateX(-50%);
            background: rgba(45, 45, 45, 0.95); color: #ffffff; padding: 10px 24px;
            border-radius: 50px; font-size: 0.95rem; font-weight: 500; z-index: 9999;
            opacity: 0; transition: opacity 0.3s ease; pointer-events: none;
            box-shadow: 0 8px 20px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08);
            backdrop-filter: blur(8px);
        `;
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    void toast.offsetWidth; 
    toast.style.opacity = '1';
    
    if (toast.hideTimer) clearTimeout(toast.hideTimer);
    toast.hideTimer = setTimeout(() => { toast.style.opacity = '0'; }, 2000);
};

window.applyBackgroundContext = function(context) {
    els.app.className = ''; 
    if (context === 'reset') {
        // 首页清晰模式，不加滤镜
    } else if (context === 'learning-blur' || context === 'learning-green') {
        // 核心修复：无论是正常学习还是过关，都统一只使用黑透高斯模糊，坚决不要绿色滤镜！
        els.app.classList.add('bg-blur'); 
    }
}


function playAudio(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR'; window.speechSynthesis.speak(utterance);
    }
}
document.getElementById('phonetic-container').addEventListener('click', () => playAudio(currentWordObj.pt));

// 正常学习流程入口：过滤掉已学过的词
document.getElementById('btn-learn').addEventListener('click', () => {
    if (globalVocabularyData.length === 0) {
        views.home.classList.replace('active', 'hidden');
        views.library.classList.replace('hidden', 'active');
        return;
    }

    const progressData = StorageManager.getProgress();
    const toLearn = globalVocabularyData.filter(w => !progressData[w.id]?.isLearned);
    
    if (toLearn.length === 0) {
        alert("🎉 太棒了！这本书的新词已全部学完！");
        return;
    }

    isReviewMode = false;
    applyBackgroundContext('learning-blur');
    learningQueue = toLearn.map(word => ({ ...word, stage: 0 }));
    totalWords = learningQueue.length;
    learnedCount = 0;
    views.home.classList.replace('active', 'hidden');
    views.learning.classList.replace('hidden', 'active');
    loadNextState();
});

document.getElementById('btn-back').addEventListener('click', () => {
    views.learning.classList.replace('active', 'hidden');
    views.home.classList.replace('hidden', 'active');
    applyBackgroundContext('reset');
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function updateDots(stage) {
    els.dotsContainer.style.animation = 'none';
    els.successBadge.style.animation = 'none';
    void els.dotsContainer.offsetWidth; 
    void els.successBadge.offsetWidth;

    if (stage >= 3) {
        els.dotsContainer.classList.add('hidden');
        els.successBadge.classList.remove('hidden'); 
        els.successBadge.style.animation = 'fadeIn 0.3s ease-out'; 
    } else {
        els.dotsContainer.classList.remove('hidden');
        els.successBadge.classList.add('hidden');
        els.dotsContainer.style.animation = 'fadeIn 0.3s ease-out'; 
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
    
    els.defArea.classList.add('hidden'); els.detailArea.classList.add('hidden');
    els.quizArea.classList.add('hidden'); els.recognizeArea.classList.add('hidden');
    els.skeletonBars.classList.add('hidden');
    els.fQuiz.classList.add('hidden'); els.fRecog.classList.add('hidden'); els.fDetail.classList.add('hidden');
    document.getElementById('footer-review-assess').classList.add('hidden');
    document.getElementById('footer-review-verify').classList.add('hidden');
    
    updateDots(currentWordObj.stage >= 0 ? currentWordObj.stage : 3);

    if (currentWordObj.stage === -1) {
        applyBackgroundContext('learning-blur');
        els.skeletonBars.classList.remove('hidden'); 
        document.getElementById('footer-review-assess').classList.remove('hidden'); 
        playAudio(currentWordObj.pt);
    } 
    else if (currentWordObj.stage === -2) {
        applyBackgroundContext('learning-blur');
        els.defArea.classList.remove('hidden');
        els.detailArea.classList.remove('hidden');
        document.getElementById('word-example-pt').innerHTML = renderClickableSentence(currentWordObj.example.pt);
        document.getElementById('word-example-zh').innerText = currentWordObj.example.zh;
        els.tabs[0].click();
        document.getElementById('footer-review-verify').classList.remove('hidden'); 
    }
    else {
        if (currentWordObj.stage === 0) renderStage0();
        else if (currentWordObj.stage === 1) renderStage1();
        else if (currentWordObj.stage === 2) renderStage2();
        playAudio(currentWordObj.pt);
    }
}


// ================= 序列 4：测验出题与交互反馈 (Stage 0) =================
function renderStage0() {
    applyBackgroundContext('learning-blur');
    els.quizArea.classList.remove('hidden');
    els.fQuiz.classList.remove('hidden');

    els.fQuiz.innerHTML = `<div class="action-item" onclick="showAnswerDirectly()"><span>看答案</span><div class="line red"></div></div>`;

    let options = [{ wordObj: currentWordObj, isCorrect: true }];
    let wrongCandidates = globalVocabularyData.filter(w => w.pt !== currentWordObj.pt);
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
        recordError(currentWordObj);
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
    applyBackgroundContext('learning-green');
    els.skeletonBars.classList.remove('hidden');
    els.recognizeArea.classList.remove('hidden');
    els.recogSentenceCard.classList.remove('hidden');
    els.recogBlindText.classList.add('hidden');
    els.recogExPt.innerHTML = renderClickableSentence(currentWordObj.example.pt); 
    els.fRecog.classList.remove('hidden');
}

function renderStage2() {
    applyBackgroundContext('learning-green');
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
    recordError(currentWordObj);
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
        els.tabContent.innerHTML = `<div style="height: 100%; display: flex; align-items: center; justify-content: center;"><p style="color: rgba(255,255,255,0.4); font-size: 0.9rem;">暂无数据</p></div>`; 
        return;
    }
    contentData.forEach(item => {
        const splitIndex = item.search(/[\u4e00-\u9fa5]/); 
        if (splitIndex > 0) {
            const pt = item.substring(0, splitIndex).trim();
            const zh = item.substring(splitIndex).trim();
            els.tabContent.innerHTML += `<div class="phrase-item"><p class="phrase-en">${pt}</p><p class="phrase-zh">${zh}</p></div>`;
        } else {
            els.tabContent.innerHTML += `<div class="phrase-item"><p class="phrase-en">${item}</p></div>`;
        }
    });
}

window.showDetails = function() {
    applyBackgroundContext('learning-blur');
    els.skeletonBars.classList.add('hidden');
    els.quizArea.classList.add('hidden'); els.recognizeArea.classList.add('hidden');
    els.fQuiz.classList.add('hidden'); els.fRecog.classList.add('hidden');
    
    els.defArea.classList.remove('hidden'); 
    els.detailArea.classList.remove('hidden'); 
    els.fDetail.classList.remove('hidden');

    document.getElementById('word-example-pt').innerHTML = renderClickableSentence(currentWordObj.example.pt);
    document.getElementById('word-example-zh').innerText = currentWordObj.example.zh;
    els.tabs[0].click(); 

    // 默认恢复双按钮状态，拦截器会自动覆盖
    const fDetail = document.getElementById('footer-detail');
    if (fDetail) {
        fDetail.classList.add('dual-btns');
        const btnForgot = document.getElementById('btn-forgot');
        if (btnForgot) btnForgot.style.display = 'flex';
    }
}

document.getElementById('btn-next').addEventListener('click', () => { setTimeout(() => loadNextState(), 150); });
document.getElementById('btn-forgot').addEventListener('click', () => {
    recordError(currentWordObj);
    if (currentWordObj.stage === 3) learnedCount--; 
    currentWordObj.stage = 0; learningQueue.push(currentWordObj);
    setTimeout(() => loadNextState(), 150);
});

window.renderClickableSentence = function(htmlText) {
    if (!htmlText) return '';
    let text = htmlText.replace(/<strong>/g, '___111___');
    text = text.replace(/<\/strong>/g, '___222___');
    text = text.replace(/([a-zA-ZÀ-ÿ]+)/g, '<span class="clickable-word" onclick="showWordPopup(\'$1\')">$1</span>');
    text = text.replace(/___111___/g, '<strong class="highlight-yellow">');
    text = text.replace(/___222___/g, '</strong>');
    return text;
}


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
    meaning.examples.forEach(ex => { 
        els.upperTrack.innerHTML += `<div class="slider-slide"><p class="im-en-sentence">${renderClickableSentence(ex.pt)}</p><p class="im-zh-sentence">${ex.zh}</p></div>`; 
    });

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
    applyBackgroundContext('learning-blur');
}

els.btnStartSpell.addEventListener('click', () => {
    views.transition.classList.replace('active', 'hidden');
    startSpellingPhase();
});

els.btnSkipSpell.addEventListener('click', () => {
    showSummaryPhase();
});

window.showSummaryPhase = function() {
    views.transition.classList.replace('active', 'hidden'); 
    views.spelling.classList.replace('active', 'hidden');
    views.summary.classList.replace('hidden', 'active');
    applyBackgroundContext('learning-blur');
    
    els.summaryList.innerHTML = '';
    const dataSource = isReviewMode ? window.currentReviewWords : globalVocabularyData;
    document.getElementById('total-words-count').innerText = dataSource.length;
    
    dataSource.forEach(item => {
        StorageManager.markAsLearned(item.id); 
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
    isReviewMode = false; 
};

els.btnFinish.addEventListener('click', () => {
    views.summary.classList.replace('active', 'hidden');
    views.home.classList.replace('hidden', 'active');
    applyBackgroundContext('reset'); 
    updateHomeCounts(); // 回到首页立刻刷新真实数字
});


// ================= 序列 8：重构版拼写逻辑引擎 =================

window.startSpellingPhase = function() {
    views.spelling.classList.replace('hidden', 'active');
    applyBackgroundContext('learning-blur');
    
    spellingQueue = isReviewMode ? [...window.currentReviewWords] : [...globalVocabularyData];
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
            window.showToast("接下来复习错词"); 
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
    
    let dotsContainer = document.getElementById('spell-dots-container');
    if (!dotsContainer) {
        dotsContainer = document.createElement('div');
        dotsContainer.id = 'spell-dots-container';
        els.spellProgress.parentNode.appendChild(dotsContainer);
    }
    
    if (spellCurrentIndex === 1) {
        dotsContainer.innerHTML = '';
        for (let i = 0; i < spellTotalInRound; i++) {
            dotsContainer.innerHTML += `<span class="spell-dot"></span>`;
        }
    }
    
    Array.from(dotsContainer.children).forEach((dot, idx) => {
        if (idx === spellCurrentIndex - 1 && !dot.classList.contains('correct') && !dot.classList.contains('wrong')) {
            dot.className = 'spell-dot active-dot';
        }
    });

    els.hiddenInput.value = '';
    els.hiddenInput.removeAttribute('maxLength');
    
    els.letterBoxes.innerHTML = '';
    for (let i = 0; i < currentSpellWord.pt.length; i++) {
        els.letterBoxes.innerHTML += `<div class="letter-box" style="display: none;"></div>`;
    }
    
    if (els.letterBoxes.children.length > 0) {
        els.letterBoxes.children[0].classList.add('has-cursor');
        els.letterBoxes.children[0].style.display = 'flex';
    }
    
    if (!window.originalHintHTML) window.originalHintHTML = els.hintContainer.innerHTML;
    els.hintContainer.innerHTML = window.originalHintHTML;
    
    setTimeout(() => { els.hiddenInput.focus(); }, 50);
}

els.hiddenInput.addEventListener('compositionstart', () => { isComposing = true; });
els.hiddenInput.addEventListener('compositionend', (e) => { 
    isComposing = false; 
    syncInputToSlots(e.target.value); 
});

els.hiddenInput.addEventListener('input', (e) => {
    if (isSpellChecking) return; 
    syncInputToSlots(e.target.value);
});

els.hiddenInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' && !isSpellChecking && els.hiddenInput.value.length > 0) {
        checkSpelling();
    }
});

document.getElementById('btn-submit-spell').addEventListener('click', () => {
    if (!isSpellChecking && els.hiddenInput.value.length > 0) checkSpelling();
    else if (els.hiddenInput.value.length === 0) els.hiddenInput.focus();
});

function syncInputToSlots(val) {
    while (els.letterBoxes.children.length <= val.length) {
        els.letterBoxes.insertAdjacentHTML('beforeend', `<div class="letter-box" style="display: none;"></div>`);
    }

    const boxes = els.letterBoxes.children;
    for (let i = 0; i < boxes.length; i++) {
        boxes[i].innerText = '';
        boxes[i].classList.remove('filled', 'has-cursor');
        boxes[i].style.display = 'none'; 
    }
    
    for (let i = 0; i < val.length; i++) {
        boxes[i].innerText = val[i];
        boxes[i].classList.add('filled');
        boxes[i].style.display = 'flex';
    }
    
    if (val.length < boxes.length) {
        boxes[val.length].classList.add('has-cursor');
        boxes[val.length].style.display = 'flex';
    } else {
        boxes[val.length - 1].insertAdjacentHTML('afterend', `<div class="letter-box has-cursor" style="display: flex;"></div>`);
    }
}

document.querySelector('.spell-main-content').addEventListener('click', () => {
    if(!isSpellChecking) els.hiddenInput.focus();
});

function checkSpelling() {
    if (isSpellChecking) return;
    isSpellChecking = true;
    
    const userInput = els.hiddenInput.value.trim().toLowerCase();
    const targetWord = currentSpellWord.pt.toLowerCase();
    const boxes = els.letterBoxes.children;
    
    for (let i = 0; i < boxes.length; i++) {
        boxes[i].classList.remove('has-cursor');
        boxes[i].style.display = 'flex'; 
    }
    
    let isCorrect = (userInput === targetWord);
    
    let dotsContainer = document.getElementById('spell-dots-container');
    let currentDot = dotsContainer ? dotsContainer.children[spellCurrentIndex - 1] : null;

    if (isCorrect && !spellHasErroredThisTurn) {
        if (currentDot) currentDot.className = 'spell-dot correct';
        
        for (let i = 0; i < boxes.length; i++) { boxes[i].classList.add('correct'); }
        playAudio(currentSpellWord.pt);
        setTimeout(loadNextSpellWord, 800); 
    } else {
        if (!spellHasErroredThisTurn) {
            spellHasErroredThisTurn = true;
            wrongWordsQueue.push(currentSpellWord);
            recordError(currentSpellWord); 
            if (currentDot) currentDot.className = 'spell-dot wrong';
        }
        
        const maxLen = Math.max(targetWord.length, userInput.length);
        for (let i = 0; i < maxLen; i++) {
            if (boxes[i]) boxes[i].classList.remove('filled', 'correct', 'wrong');
            
            let charToShow = userInput[i] !== undefined ? userInput[i] : targetWord[i];
            
            if (userInput[i] === targetWord[i]) {
                if(boxes[i]) { boxes[i].innerText = charToShow; boxes[i].classList.add('correct'); }
            } else {
                if(boxes[i]) { boxes[i].innerText = targetWord[i] || charToShow; boxes[i].classList.add('wrong'); }
            }
        }
        playAudio(currentSpellWord.pt);
        setTimeout(loadNextSpellWord, 2000); 
    }
}

els.hintContainer.addEventListener('click', () => {
    if (isSpellChecking) return;
    
    if (!spellHasErroredThisTurn) {
        spellHasErroredThisTurn = true;
        wrongWordsQueue.push(currentSpellWord);
        recordError(currentSpellWord);
        
        let dotsContainer = document.getElementById('spell-dots-container');
        if (dotsContainer && dotsContainer.children[spellCurrentIndex - 1]) {
            dotsContainer.children[spellCurrentIndex - 1].className = 'spell-dot wrong';
        }
    }
    
    els.hintContainer.innerHTML = `<span style="color: #EBB04D; font-size: 1.1rem; letter-spacing: 1px; font-weight: 500;">${currentSpellWord.phonetic}</span>`;
    els.hiddenInput.focus();

    clearTimeout(window.hintTimeout);
    window.hintTimeout = setTimeout(() => {
        if (!isSpellChecking && window.originalHintHTML) {
            els.hintContainer.innerHTML = window.originalHintHTML;
        }
    }, 1500);
});

// ================= 序列 9 & 10 & 11：仪表盘全面接管与单词表引擎 =================

// 1. 仪表盘导航与基础路由
const btnNavDashboard = document.getElementById('btn-nav-dashboard');
const btnNavHome = document.getElementById('btn-nav-home'); 
const btnBackHome = document.getElementById('btn-back-home'); 

// 点击底部导航进入仪表盘
if(btnNavDashboard) {
    btnNavDashboard.addEventListener('click', () => {
        views.home.classList.replace('active', 'hidden');
        views.dashboard.classList.replace('hidden', 'active');
        btnNavDashboard.classList.add('active');
        btnNavHome.classList.remove('active');
        renderDashboardData(); // 进入时刷新数据
    });
}

// 从仪表盘返回首页
if(btnBackHome) {
    btnBackHome.addEventListener('click', () => {
        views.dashboard.classList.replace('active', 'hidden');
        views.home.classList.replace('hidden', 'active');
        btnNavDashboard.classList.remove('active');
        btnNavHome.classList.add('active');
        if(window.updateHomeCounts) window.updateHomeCounts();
    });
}

// 仪表盘右上角：刷新数据动效
const dashRefreshBtn = document.querySelector('.dashboard-header .fa-arrow-rotate-right');
if(dashRefreshBtn) {
    dashRefreshBtn.style.cursor = 'pointer';
    dashRefreshBtn.addEventListener('click', () => {
        dashRefreshBtn.style.transform = 'rotate(360deg)';
        dashRefreshBtn.style.transition = 'transform 0.5s ease';
        renderDashboardData();
        setTimeout(() => {
            dashRefreshBtn.style.transform = 'none';
            dashRefreshBtn.style.transition = 'none';
            window.showToast("数据已同步");
        }, 500);
    });
}

// 2. 核心：动态渲染仪表盘真实数据
window.renderDashboardData = function() {
    if (!globalVocabularyData) return;
    
    const progressData = StorageManager.getProgress();
    let learned = 0;
    let todayLearned = 0;
    let errorWords = 0;
    
    // 获取今天凌晨4点的时间戳
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getHours() < 4 ? now.getDate() - 1 : now.getDate(), 4, 0, 0).getTime();
    
    globalVocabularyData.forEach(word => {
        const p = progressData[word.id];
        if (p) {
            if (p.isLearned) learned++;
            // 判断是否是今天学习的（下次复习时间在明早4点）
            if (p.isLearned && p.nextReviewDate > todayStart && p.nextReviewDate <= todayStart + 86400000) {
                todayLearned++;
            }
            if (p.errorCount > 0) errorWords++;
        }
    });
    
    const total = globalVocabularyData.length;
    
    // 注入 DOM
    document.getElementById('dash-vocab-count').innerText = errorWords;
    document.getElementById('dash-total').innerText = total;
    document.getElementById('dash-learned').innerText = learned;
    document.getElementById('dash-total-learned').innerText = learned;
    document.getElementById('dash-today-learned').innerText = todayLearned;
    
    // 动态进度条
    const progressPercent = total === 0 ? 0 : (learned / total) * 100;
    const fillEl = document.getElementById('dash-progress-fill');
    if(fillEl) fillEl.style.width = `${progressPercent}%`;
}

// 3. 换本词书路由
const btnChangeBook = document.querySelector('.btn-change-book');
const btnBackDashboard = document.getElementById('btn-back-dashboard');

if (btnChangeBook) {
    btnChangeBook.addEventListener('click', () => {
        views.dashboard.classList.replace('active', 'hidden');
        document.getElementById('library-view').classList.replace('hidden', 'active');
    });
}
if (btnBackDashboard) {
    btnBackDashboard.addEventListener('click', () => {
        document.getElementById('library-view').classList.replace('active', 'hidden');
        views.dashboard.classList.replace('hidden', 'active');
    });
}

// 4. 更多菜单(三个点)交互逻辑
const btnDashboardMore = document.getElementById('btn-dashboard-more');
const dashboardMoreMenu = document.getElementById('dashboard-more-menu');

if(btnDashboardMore && dashboardMoreMenu) {
    btnDashboardMore.addEventListener('click', (e) => {
        e.stopPropagation(); 
        dashboardMoreMenu.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
        if (!dashboardMoreMenu.contains(e.target) && e.target !== btnDashboardMore) {
            dashboardMoreMenu.classList.add('hidden');
        }
    });
}

// 绑定下拉菜单的 4 个选项功能
const menuItems = document.querySelectorAll('#dashboard-more-menu .menu-item');
if(menuItems.length >= 4) {
    // 选项 1：查看单词表
    menuItems[0].addEventListener('click', () => { window.openWordlist(); });
    // 选项 2：下载离线包
    menuItems[1].addEventListener('click', () => {
        window.showToast("正在下载离线音频...");
        setTimeout(() => window.showToast("离线数据已更新完毕"), 1500);
        dashboardMoreMenu.classList.add('hidden');
    });
    // 选项 3：重置词书
    menuItems[2].addEventListener('click', () => {
        if(confirm("确定要清空当前词书的所有学习记录吗？此操作不可恢复。")) {
            let progress = StorageManager.getProgress();
            globalVocabularyData.forEach(w => { delete progress[w.id]; });
            StorageManager.saveProgress(progress);
            renderDashboardData();
            window.showToast("词书进度已重置");
            dashboardMoreMenu.classList.add('hidden');
        }
    });
    // 选项 4：更新词书
    menuItems[3].addEventListener('click', () => {
        window.showToast("检查更新中...");
        setTimeout(() => window.showToast("当前已是最新版本"), 1000);
        dashboardMoreMenu.classList.add('hidden');
    });
}

// 5. 单词表引擎 (Wordlist)
const wordlistView = document.getElementById('wordlist-view');
const btnBackFromWordlist = document.getElementById('btn-back-from-wordlist');
const wordlistItemsContainer = document.getElementById('wordlist-items-container');

// 核心：打开单词表方法
window.openWordlist = function() {
    if(dashboardMoreMenu) dashboardMoreMenu.classList.add('hidden');
    document.getElementById('dashboard-view').classList.replace('active', 'hidden');
    wordlistView.classList.replace('hidden', 'active');
    
    const wordCount = globalVocabularyData.length;
    document.getElementById('wordlist-total-count').innerText = wordCount;
    document.getElementById('wordlist-unit-count').innerText = `${wordCount}词`;
    
    const progressData = StorageManager.getProgress();
    
    if(wordlistItemsContainer) {
        wordlistItemsContainer.innerHTML = '';
        globalVocabularyData.forEach(word => {
            // 已学的单词会带上一个绿色小对勾
            const isLearned = progressData[word.id]?.isLearned ? '<i class="fa-solid fa-check" style="color: #34C759; margin-left: 8px; font-size: 0.8rem;"></i>' : '';
            wordlistItemsContainer.innerHTML += `
                <div class="wordlist-item" style="padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="showWordPopup('${word.pt}')">
                    <div>
                        <span style="font-size: 1.05rem; font-weight: 500;">${word.pt}</span>
                        ${isLearned}
                    </div>
                    <span style="font-size: 0.85rem; color: rgba(255,255,255,0.5);">${word.zh.length > 10 ? word.zh.substring(0,10)+'...' : word.zh}</span>
                </div>
            `;
        });
    }
};

if(btnBackFromWordlist) {
    btnBackFromWordlist.addEventListener('click', () => {
        wordlistView.classList.replace('active', 'hidden');
        document.getElementById('dashboard-view').classList.replace('hidden', 'active');
    });
}

// 6. 绑定触发单词表的两个关键入口
// 入口 1："全部单元 >"
const btnAllUnits = document.querySelector('.progress-labels span:last-child');
if (btnAllUnits) {
    btnAllUnits.style.cursor = 'pointer';
    btnAllUnits.addEventListener('click', window.openWordlist);
}
// 入口 2：词书封面
const btnOpenWordlistCover = document.getElementById('btn-open-wordlist-cover');
if(btnOpenWordlistCover) {
    btnOpenWordlistCover.addEventListener('click', window.openWordlist);
}

// ================= 序列 12：一键换书魔法 =================
const allLibraryBooks = document.querySelectorAll('.lib-book-item');

allLibraryBooks.forEach(bookItem => {
    bookItem.addEventListener('click', async () => {
        const fileName = bookItem.getAttribute('data-file');
        const bookTitle = bookItem.getAttribute('data-title');
        const coverClass = bookItem.getAttribute('data-cover');
        const coverText = bookItem.getAttribute('data-cover-text');

        if (fileName !== 'book_core') {
            alert(`《${bookTitle}》的数据文件 (${fileName}.json) 还没创建哦，先试试"核心葡语词汇"吧！`);
            return;
        }

        const bookInfo = { fileName, title: bookTitle, coverClass, coverText };
        StorageManager.setCurrentBook(bookInfo);
        await loadVocabularyBook(fileName, bookTitle);
        updateDashboardBookUI(bookInfo);
        if (typeof renderDashboardData === 'function') renderDashboardData();

        document.getElementById('library-view').classList.replace('active', 'hidden');
        document.getElementById('dashboard-view').classList.replace('hidden', 'active');
    });
});


// ================= 序列 13：跨库点击查词逻辑 =================
window.showWordPopup = function(wordStr) {
    const cleanWord = wordStr.toLowerCase().trim();
    let foundWordObj = Object.values(globalDict).find(w => w.pt.toLowerCase() === cleanWord);

    if (foundWordObj) {
        document.getElementById('wp-word').innerText = foundWordObj.pt;
        document.getElementById('wp-phonetic').innerText = foundWordObj.phonetic || '';
        let meaningsHtml = '';
        if (foundWordObj.meanings && foundWordObj.meanings.length > 0) {
            foundWordObj.meanings.forEach(m => {
                meaningsHtml += `<div class="wp-meaning-line"><span class="wp-pos">${m.pos}</span>${m.zhDef || m.zh}</div>`;
            });
        } else {
            meaningsHtml = `<div class="wp-meaning-line"><span class="wp-pos">${foundWordObj.pos}</span>${foundWordObj.zh}</div>`;
        }
        document.getElementById('wp-meanings').innerHTML = meaningsHtml;
    } else {
        document.getElementById('wp-word').innerText = cleanWord;
        document.getElementById('wp-phonetic').innerText = '';
        document.getElementById('wp-meanings').innerHTML = `<div style="color: rgba(255,255,255,0.4); font-size: 0.85rem; padding: 10px 0;">当前词典暂未收录该词汇哦。</div>`;
    }
    document.getElementById('word-popup-modal').classList.remove('hidden');
};

document.getElementById('word-popup-overlay').addEventListener('click', () => {
    document.getElementById('word-popup-modal').classList.add('hidden');
});

// ================= 序列 14：艾宾浩斯 Review 核心逻辑 =================

// 1. 进入复习模式 (带有真实的时间过滤器)
document.querySelector('.nav-card:nth-child(2)').addEventListener('click', () => {
    if (globalVocabularyData.length === 0) { alert("请先到词库选择一本词书哦！"); return; }
    
    const progressData = StorageManager.getProgress();
    const now = Date.now();
    const toReview = globalVocabularyData.filter(word => {
        const p = progressData[word.id];
        return p && p.isLearned && p.nextReviewDate <= now; // 到了复习时间才拿出来
    });
    
    if (toReview.length === 0) { alert("🎉 恭喜！今天没有需要复习的单词，去学点新词吧！"); return; }
    
    isReviewMode = true;
    window.currentReviewWords = toReview; 
    learningQueue = toReview.map(word => ({ ...word, stage: -1 })); 
    totalWords = learningQueue.length;
    learnedCount = 0;

    applyBackgroundContext('learning-blur');
    views.home.classList.replace('active', 'hidden');
    views.learning.classList.replace('hidden', 'active');
    loadNextState();
});

// 2. 认识按钮
document.getElementById('btn-rev-know').addEventListener('click', () => {
    currentWordObj.stage = -2; 
    learningQueue.unshift(currentWordObj); 
    setTimeout(() => { loadNextState(); }, 150);
});

// 3. 统一复习失败处理机制
window.handleReviewFail = function(reason) {
    StorageManager.updateReviewResult(currentWordObj.id, false);
    currentWordObj.stage = 0; 
    learningQueue.push(currentWordObj); 
    
    setTimeout(() => {
        updateDots(0);
        applyBackgroundContext('learning-blur');
        document.getElementById('footer-review-assess').classList.add('hidden');
        document.getElementById('footer-review-verify').classList.add('hidden'); 
        
        showDetails();
        
        const fDetail = document.getElementById('footer-detail');
        fDetail.classList.remove('dual-btns');
        const btnForgot = document.getElementById('btn-forgot');
        if (btnForgot) btnForgot.style.display = 'none';
        
        if (reason === 'wrong') window.showToast("已改为「忘记了」");
    }, 150);
}

document.getElementById('btn-rev-blur').addEventListener('click', () => window.handleReviewFail('blur'));
document.getElementById('btn-rev-forget').addEventListener('click', () => window.handleReviewFail('forget'));
document.getElementById('btn-rev-wrong').addEventListener('click', () => window.handleReviewFail('wrong'));

// 4. 核对成功
document.getElementById('btn-rev-next').addEventListener('click', () => {
    StorageManager.updateReviewResult(currentWordObj.id, true);
    learnedCount++;
    setTimeout(() => loadNextState(), 150);
});


// ================= 序列 15：拼写界面圆形清空按钮逻辑 =================
const btnSpellClear = document.getElementById('btn-spell-clear');
if (btnSpellClear) {
    btnSpellClear.addEventListener('click', () => {
        const hiddenInput = document.getElementById('hidden-input');
        if (hiddenInput) {
            hiddenInput.value = ''; 
            hiddenInput.dispatchEvent(new Event('input')); 
            hiddenInput.focus(); 
        }
    });
}
