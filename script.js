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

// 获取以凌晨4点为界限的真实“今天”的日期字符串 (YYYY-MM-DD)
function getTodayDateKey() {
    let now = new Date();
    if (now.getHours() < 4) now.setDate(now.getDate() - 1);
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}

function formatDateKey(dateObj) {
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
}

function getNextReviewTime(days) {
    let now = new Date();
    let targetDate = new Date(now);
    if (now.getHours() < 4) targetDate.setDate(targetDate.getDate() - 1);
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
    // 新增：获取时长和签到数据
    getStats: function() {
        const data = localStorage.getItem('splendid_user_stats');
        return data ? JSON.parse(data) : { dates: [], timeByDate: {}, totalTime: 0 };
    },
    // 新增：保存时长和签到数据
    saveStats: function(stats) {
        localStorage.setItem('splendid_user_stats', JSON.stringify(stats));
    },
    // 新增：增加有效学习时长，并自动点亮签到日历
    addActiveTime: function(seconds) {
        let stats = this.getStats();
        let dateKey = getTodayDateKey();
        
        stats.totalTime = (stats.totalTime || 0) + seconds;
        stats.timeByDate[dateKey] = (stats.timeByDate[dateKey] || 0) + seconds;
        
        if (!stats.dates.includes(dateKey)) stats.dates.push(dateKey);
        this.saveStats(stats);
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
        progress[wordId].nextReviewDate = getNextReviewTime(1); 
        this.saveProgress(progress);
    },
    updateReviewResult: function(wordId, isSuccess) {
        let progress = this.getProgress();
        if (!progress[wordId]) return;
        
        if (isSuccess) {
            let nextStage = (progress[wordId].ebStage || 0) + 1;
            if (nextStage >= EBBINGHAUS_INTERVALS.length) nextStage = EBBINGHAUS_INTERVALS.length - 1;
            progress[wordId].ebStage = nextStage;
            const daysToWait = EBBINGHAUS_INTERVALS[nextStage];
            progress[wordId].nextReviewDate = getNextReviewTime(daysToWait);
        } else {
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
    if (masterWord) masterWord.errorCount = StorageManager.getWordError(wordObj.id);
}

window.updateHomeCounts = function() {
    if (!globalVocabularyData) return;
    const progressData = StorageManager.getProgress();
    const now = Date.now();
    
    const toLearn = globalVocabularyData.filter(w => !progressData[w.id]?.isLearned);
    const toReview = globalVocabularyData.filter(w => progressData[w.id]?.isLearned && progressData[w.id].nextReviewDate <= now);
    
    const learnCountEl = document.getElementById('learn-count');
    if (learnCountEl) learnCountEl.innerText = toLearn.length;
    
    const reviewSubtitle = document.getElementById('review-count') || 
                           document.querySelector('#btn-review .nav-count') || 
                           document.querySelector('.nav-card:nth-child(2) .nav-count');
                           
    if (reviewSubtitle) reviewSubtitle.innerText = toReview.length;
};

// ================= 超苛刻时长追踪引擎 =================
let lastInteractionTime = Date.now();

// 监听一切能证明“人还在”的操作
['click', 'touchstart', 'keydown', 'scroll'].forEach(evt => {
    document.addEventListener(evt, () => lastInteractionTime = Date.now(), {passive: true});
});

function startStrictTimeTracker() {
    setInterval(() => {
        const isLearningActive = document.getElementById('learning-view')?.classList.contains('active');
        const isSpellingActive = document.getElementById('spelling-view')?.classList.contains('active');
        
        // 只有在学习页或拼写页才算
        if (!isLearningActive && !isSpellingActive) return;
        
        // 苛刻条件：超过 30 秒无操作，彻底冻结时间计算
        if (Date.now() - lastInteractionTime < 30000) {
            StorageManager.addActiveTime(1); // 加 1 秒
        }
    }, 1000);
}

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
        
        startStrictTimeTracker(); // 启动时长追踪系统

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
            return { ...wordData, id: id, errorCount: StorageManager.getWordError(id) };
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
        // 首页清晰模式，无模糊
    } else if (context === 'learning-blur' || context === 'learning-green') {
        els.app.classList.add('bg-blur'); // 统一只用高级黑透模糊，拒绝变绿
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

// 【新增】批次引擎：专门用来记住“这一组”有哪些词
StorageManager.getLearningSession = function() {
    const data = localStorage.getItem('splendid_learning_session');
    return data ? JSON.parse(data) : null;
};
StorageManager.saveLearningSession = function(session) {
    if (!session) localStorage.removeItem('splendid_learning_session');
    else localStorage.setItem('splendid_learning_session', JSON.stringify(session));
};

window.saveCurrentSessionProgress = function() {
    if (isReviewMode || !globalVocabularyData || globalVocabularyData.length === 0) return;
    
    let progress = StorageManager.getProgress();
    let hasChanges = false;
    
    // 只保存本批次中还没学满的词的绿点状态
    if (currentWordObj && currentWordObj.id && currentWordObj.stage < 3) {
        if (!progress[currentWordObj.id]) progress[currentWordObj.id] = { errorCount: 0 };
        progress[currentWordObj.id].currentStage = currentWordObj.stage;
        hasChanges = true;
    }
    learningQueue.forEach(w => {
        if (!progress[w.id]) progress[w.id] = { errorCount: 0 };
        progress[w.id].currentStage = w.stage;
        hasChanges = true;
    });
    
    if (hasChanges) StorageManager.saveProgress(progress);
};

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveCurrentSessionProgress();
});

document.getElementById('btn-learn').addEventListener('click', () => {
    if (globalVocabularyData.length === 0) {
        views.home.classList.replace('active', 'hidden');
        views.library.classList.replace('hidden', 'active');
        return;
    }

    const progressData = StorageManager.getProgress();
    const allToLearn = globalVocabularyData.filter(w => !progressData[w.id]?.isLearned);
    
    let session = StorageManager.getLearningSession();
    
    // 如果没有正在进行的批次，或者批次为空，则新建一组（上限 10 个词）
    if (!session || session.type !== 'learn' || session.totalIds.length === 0) {
        if (allToLearn.length === 0) {
            alert("🎉 太棒了！这本书的新词已全部学完！");
            return;
        }
        const newBatch = allToLearn.slice(0, 10); // 每次提取 10 个
        session = {
            type: 'learn',
            totalIds: newBatch.map(w => w.id),
            finishedIds: []
        };
        StorageManager.saveLearningSession(session);
    }
    
    isReviewMode = false;
    applyBackgroundContext('learning-blur');
    
    // 锁定本批次的完整单词，供拼写和小结使用
    window.currentLearningWords = session.totalIds.map(id => globalVocabularyData.find(w => w.id === id)).filter(Boolean);
    
    // 防止词书切换导致数据丢失
    if (window.currentLearningWords.length === 0) {
        StorageManager.saveLearningSession(null);
        document.getElementById('btn-learn').click();
        return;
    }
    
    // 剔除这 10 个词中已经学完的，剩下的放入队列
    const remainingIds = session.totalIds.filter(id => !session.finishedIds.includes(id));
    if (remainingIds.length === 0) {
        showTransitionPhase(); 
        return;
    }

    learningQueue = remainingIds.map(id => {
        const word = window.currentLearningWords.find(w => w.id === id);
        let savedStage = progressData[id]?.currentStage || 0;
        if (savedStage >= 3) savedStage = 2; // 安全兜底
        return { ...word, stage: savedStage };
    });
    
    totalWords = session.totalIds.length;        // 分母永远是 10（或这一组的总数）
    learnedCount = session.finishedIds.length;   // 分子是本组已完成的个数
    
    views.home.classList.replace('active', 'hidden');
    views.learning.classList.replace('hidden', 'active');
    loadNextState();
});

document.getElementById('btn-back').addEventListener('click', () => {
    saveCurrentSessionProgress(); 
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
    // 进度全满：打上完成烙印，并记入本批次已完成列表
    if (!isReviewMode && currentWordObj && currentWordObj.id && currentWordObj.stage >= 3) {
        let progress = StorageManager.getProgress();
        if (!progress[currentWordObj.id]) progress[currentWordObj.id] = { errorCount: 0 };
        
        progress[currentWordObj.id].isLearned = true; 
        progress[currentWordObj.id].ebStage = 0;
        
        let now = new Date();
        let targetDate = new Date(now);
        if (now.getHours() < 4) targetDate.setDate(targetDate.getDate() - 1);
        targetDate.setDate(targetDate.getDate() + 1);
        targetDate.setHours(4, 0, 0, 0);
        
        progress[currentWordObj.id].nextReviewDate = targetDate.getTime();
        delete progress[currentWordObj.id].currentStage; 
        StorageManager.saveProgress(progress);

        // 更新本批次分母
        let session = StorageManager.getLearningSession();
        if (session && session.type === 'learn') {
            if (!session.finishedIds.includes(currentWordObj.id)) {
                session.finishedIds.push(currentWordObj.id);
                StorageManager.saveLearningSession(session);
                learnedCount = session.finishedIds.length; // 动态更新顶部进度！
            }
        }
    }

    if (learningQueue.length === 0) {
        currentWordObj = null; 
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
    document.getElementById('learning-view').classList.replace('active', 'hidden');
    document.getElementById('transition-view').classList.replace('hidden', 'active');
    applyBackgroundContext('learning-blur');
}

document.getElementById('btn-start-spell').addEventListener('click', () => {
    document.getElementById('transition-view').classList.replace('active', 'hidden');
    if (window.startSpellingPhase) {
        window.startSpellingPhase();
    }
});

document.getElementById('btn-skip-spell').addEventListener('click', () => {
    showSummaryPhase();
});

window.showSummaryPhase = function() {
    document.getElementById('transition-view').classList.replace('active', 'hidden'); 
    document.getElementById('spelling-view').classList.replace('active', 'hidden');
    document.getElementById('summary-view').classList.replace('hidden', 'active');
    applyBackgroundContext('learning-blur');
    
    let summaryList = document.getElementById('summary-list');
    if (summaryList) summaryList.innerHTML = '';
    
    // 核心：不再展示全书，只展示刚才学的这一批（或复习的这一批）
    const dataSource = isReviewMode ? window.currentReviewWords : window.currentLearningWords;
    
    const countEl = document.getElementById('total-words-count');
    if (countEl && dataSource) countEl.innerText = dataSource.length;
    
    if (dataSource && summaryList) {
        dataSource.forEach(item => {
            const errCount = item.errorCount || 0;
            const errorText = errCount === 0 ? '完美' : `错 ${errCount} 次`;
            const errorColor = errCount === 0 ? '#34C759' : '#E74C3C'; // 0错变绿，有错变红
            
            summaryList.innerHTML += `
                <div class="summary-item" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <span class="summary-word" style="font-size: 1.1rem; font-weight: 500;">${item.pt}</span>
                    <span class="summary-error" style="color: ${errorColor}; font-size: 0.9rem; font-weight: 600;">${errorText}</span>
                </div>
            `;
        });
    }
    isReviewMode = false; 
};

document.getElementById('btn-finish').addEventListener('click', () => {
    // 核心：点击完成，清空本地记录的批次，下次再点 Learn 将抓取新的 10 个词！
    if (StorageManager && StorageManager.saveLearningSession) {
        StorageManager.saveLearningSession(null); 
    }
    
    document.getElementById('summary-view').classList.replace('active', 'hidden');
    document.getElementById('home-view').classList.replace('hidden', 'active');
    applyBackgroundContext('reset'); 
    
    // 回到主页后立刻刷新数字
    if(window.updateHomeCounts) window.updateHomeCounts();
});



// ================= 序列 8：重构版拼写逻辑引擎 =================

window.startSpellingPhase = function() {
    views.spelling.classList.replace('hidden', 'active');
    applyBackgroundContext('learning-blur');
    
    // 核心：只拼写当前批次的 10 个词，彻底告别全书拼写！
    spellingQueue = isReviewMode ? [...window.currentReviewWords] : [...window.currentLearningWords];
    wrongWordsQueue = [];
    spellCurrentIndex = 0;
    spellTotalInRound = spellingQueue.length;
    
    let spellProgressEl = document.getElementById('spell-progress-text');
    if(spellProgressEl) spellProgressEl.innerText = `1/${spellTotalInRound}`;
    
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

if(btnNavDashboard) {
    btnNavDashboard.addEventListener('click', () => {
        views.home.classList.replace('active', 'hidden');
        document.getElementById('dashboard-view').classList.replace('hidden', 'active');
        btnNavDashboard.classList.add('active');
        btnNavHome.classList.remove('active');
        renderDashboardData(); 
    });
}

if(btnBackHome) {
    btnBackHome.addEventListener('click', () => {
        document.getElementById('dashboard-view').classList.replace('active', 'hidden');
        views.home.classList.replace('hidden', 'active');
        btnNavDashboard.classList.remove('active');
        btnNavHome.classList.add('active');
        if(window.updateHomeCounts) window.updateHomeCounts();
    });
}

// 仪表盘刷新交互
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

// 2. 核心：动态渲染仪表盘真实数据（包含时长与日历）
window.renderDashboardData = function() {
    if (!globalVocabularyData) return;
    
    // --- 单词数据处理 ---
    const progressData = StorageManager.getProgress();
    let learned = 0, todayLearned = 0, errorWords = 0;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getHours() < 4 ? now.getDate() - 1 : now.getDate(), 4, 0, 0).getTime();
    
    globalVocabularyData.forEach(word => {
        const p = progressData[word.id];
        if (p) {
            if (p.isLearned) learned++;
            if (p.isLearned && p.nextReviewDate > todayStart && p.nextReviewDate <= todayStart + 86400000) todayLearned++;
            if (p.errorCount > 0) errorWords++;
        }
    });
    
    const total = globalVocabularyData.length;
    document.getElementById('dash-vocab-count').innerText = errorWords;
    document.getElementById('dash-total').innerText = total;
    document.getElementById('dash-learned').innerText = learned;
    document.getElementById('dash-total-learned').innerText = learned;
    document.getElementById('dash-today-learned').innerText = todayLearned;
    
    const fillEl = document.getElementById('dash-progress-fill');
    if(fillEl) fillEl.style.width = `${total === 0 ? 0 : (learned / total) * 100}%`;

    // --- 时长处理 ---
    const stats = StorageManager.getStats();
    const todayKey = getTodayDateKey();
    const todayMins = Math.floor((stats.timeByDate[todayKey] || 0) / 60);
    const totalMins = Math.floor((stats.totalTime || 0) / 60);

    const dataValueSpans = document.querySelectorAll('.data-item .data-value span:first-child');
    if(dataValueSpans.length >= 4) {
        dataValueSpans[2].innerText = todayMins; // 今日总时长
        dataValueSpans[3].innerText = totalMins; // 累计总时长
    }

    // --- 签到与日历处理 ---
    let streak = 0;
    let checkDate = new Date();
    if (checkDate.getHours() < 4) checkDate.setDate(checkDate.getDate() - 1);
    
    // 计算连签 (回溯法)
    if (stats.dates.includes(formatDateKey(checkDate))) {
        streak++;
        while(true) {
            checkDate.setDate(checkDate.getDate() - 1);
            if (stats.dates.includes(formatDateKey(checkDate))) streak++; else break;
        }
    } else {
        checkDate.setDate(checkDate.getDate() - 1);
        if (stats.dates.includes(formatDateKey(checkDate))) {
            streak++;
            while(true) {
                checkDate.setDate(checkDate.getDate() - 1);
                if (stats.dates.includes(formatDateKey(checkDate))) streak++; else break;
            }
        }
    }

    const streakTag = document.querySelector('.streak-tag');
    if (streakTag) streakTag.innerHTML = `连续签到 ${streak} 天 <i class="fa-solid fa-chevron-right" style="font-size: 0.7rem;"></i>`;

    // 渲染本周动态日历
    const calContainer = document.querySelector('.calendar-days');
    if (calContainer) {
        calContainer.innerHTML = '';
        const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        
        let curr = new Date();
        if (curr.getHours() < 4) curr.setDate(curr.getDate() - 1);
        let dayOfWeek = curr.getDay(); 
        let diffToMonday = curr.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        let startOfWeek = new Date(curr.setDate(diffToMonday));

        for (let i = 0; i < 7; i++) {
            let d = new Date(startOfWeek);
            d.setDate(d.getDate() + i);
            let dKey = formatDateKey(d);
            
            let isToday = (dKey === todayKey);
            let isStudied = stats.dates.includes(dKey);
            
            let cls = isToday ? 'cal-day active' : 'cal-day';
            let dayText = isToday ? '今' : d.getDate();
            let studiedStyle = (isStudied && !isToday) ? 'color: #EBB04D; font-weight: 600;' : '';
            let dotHtml = isStudied ? `<div style="width: 4px; height: 4px; background: #EBB04D; border-radius: 50%; margin: 2px auto 0;"></div>` : `<div style="height: 6px;"></div>`;
            
            calContainer.innerHTML += `
                <div class="${cls}">
                    <span class="w">${dayNames[d.getDay()]}</span>
                    <span class="d" style="${studiedStyle}">${dayText}</span>
                    ${dotHtml}
                </div>
            `;
        }
    }
}

// 3. 换本词书路由
const btnChangeBook = document.querySelector('.btn-change-book');
const btnBackDashboard = document.getElementById('btn-back-dashboard');

if (btnChangeBook) {
    btnChangeBook.addEventListener('click', () => {
        document.getElementById('dashboard-view').classList.replace('active', 'hidden');
        document.getElementById('library-view').classList.replace('hidden', 'active');
    });
}
if (btnBackDashboard) {
    btnBackDashboard.addEventListener('click', () => {
        document.getElementById('library-view').classList.replace('active', 'hidden');
        document.getElementById('dashboard-view').classList.replace('hidden', 'active');
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

const menuItems = document.querySelectorAll('#dashboard-more-menu .menu-item');
if(menuItems.length >= 4) {
    menuItems[0].addEventListener('click', () => { window.openWordlist(); });
    menuItems[1].addEventListener('click', () => {
        window.showToast("正在下载离线音频...");
        setTimeout(() => window.showToast("离线数据已更新完毕"), 1500);
        dashboardMoreMenu.classList.add('hidden');
    });
    
    // 选项 3：重置词书（核心修复点）
    menuItems[2].addEventListener('click', () => {
        if(confirm("确定要清空当前词书的所有学习记录吗？此操作不可恢复。")) {
            let progress = StorageManager.getProgress();
            globalVocabularyData.forEach(w => { delete progress[w.id]; });
            StorageManager.saveProgress(progress);
            
            // 【绝杀修复】：重置进度的同时，立刻摧毁当前的“10词批次记忆”
            if (StorageManager.saveLearningSession) {
                StorageManager.saveLearningSession(null);
            }
            
            renderDashboardData();
            window.showToast("词书进度已彻底重置");
            dashboardMoreMenu.classList.add('hidden');
        }
    });
    
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

const btnAllUnits = document.querySelector('.progress-labels span:last-child');
if (btnAllUnits) {
    btnAllUnits.style.cursor = 'pointer';
    btnAllUnits.addEventListener('click', window.openWordlist);
}
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

// ================= JS 序列 16：终极修复（自动保存、防卡死、彻底重置） =================

// 1. 修复：无痕退出 & 自动保存拼写进度
window.exitLearningSession = function() {
    try {
        // 【核心修复 1】：如果你没做拼写直接退出，系统会自动把已进入拼写队列的词打上“已学”标签，完美白嫖进度！
        if (typeof StorageManager !== 'undefined' && typeof spellingQueue !== 'undefined' && spellingQueue.length > 0) {
            spellingQueue.forEach(w => {
                StorageManager.markAsLearned(w.id);
            });
        }

        // 彻底清空内存队列
        learningQueue = [];
        spellingQueue = [];
        learnedCount = 0;
        if (typeof isReviewMode !== 'undefined') isReviewMode = false;

        // 暴力重置所有视图状态（防重叠/窜台）
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
            v.classList.add('hidden');
        });
        
        // 返回主页
        const homeView = document.getElementById('home-view');
        if (homeView) {
            homeView.classList.remove('hidden');
            homeView.classList.add('active');
        }
        
        // 清理滤镜
        const appEl = document.getElementById('app');
        if (appEl) appEl.className = ''; 
        
    } catch (err) {
        console.error("退出清理时发生错误：", err);
        window.location.reload(); 
    }
};

// 2. 修复：拼写页面点击空白处“键盘消失”导致的假死 (确认不了也删不了)
const spellViewEl = document.getElementById('spelling-view');
if (spellViewEl) {
    spellViewEl.addEventListener('click', (e) => {
        // 【核心修复 2】：只要点击的不是底部按钮，就强制把焦点拉回输入框，弹出键盘，绝不卡死！
        if (!e.target.closest('.spell-footer') && !e.target.closest('.spell-header')) {
            const hiddenInput = document.getElementById('hidden-input');
            if (hiddenInput) {
                hiddenInput.focus();
            }
        }
    });
}

// 3. 重新绑定顶部返回按钮和X号按钮，抹除旧的错误事件
function rebindExitButton(btnId) {
    const btn = document.getElementById(btnId);
    if (btn) {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            exitLearningSession();
        });
    }
}
rebindExitButton('btn-back'); // 学习页返回
rebindExitButton('btn-close-spell'); // 拼写页叉号

// 4. 彻底重写 Learn 按钮：每次点击保证是绝对干净的新环境
const btnLearnHome = document.getElementById('btn-learn');
if (btnLearnHome) {
    const newBtnLearn = btnLearnHome.cloneNode(true);
    btnLearnHome.parentNode.replaceChild(newBtnLearn, btnLearnHome);
    
    newBtnLearn.addEventListener('click', () => {
        if (!globalVocabularyData || globalVocabularyData.length === 0) {
            alert("请先到词库选择一本词书哦！");
            return;
        }
        
        // 【核心修复 3】：点击瞬间强制清空残留排队和UI，绝对不会再直接弹出拼写界面！
        learningQueue = [];
        spellingQueue = [];
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
            v.classList.add('hidden');
        });
        
        // 筛选未学过的词
        const progressData = StorageManager.getProgress() || {};
        const unlearnedWords = globalVocabularyData.filter(w => !progressData[w.id]?.isLearned);
        
        if (unlearnedWords.length === 0) {
            alert("🎉 太棒了！这本书你已经全部学完啦！");
            document.getElementById('home-view').classList.remove('hidden');
            document.getElementById('home-view').classList.add('active');
            return;
        }

        // 注入干净的队列
        learningQueue = unlearnedWords.slice(0, 10).map(w => ({ ...w, stage: 0 }));
        totalWords = learningQueue.length;
        learnedCount = 0;
        if (typeof isReviewMode !== 'undefined') isReviewMode = false;
        
        // 安全进入学习视图
        document.getElementById('learning-view').classList.remove('hidden');
        document.getElementById('learning-view').classList.add('active');
        
        if(typeof loadNextState === 'function') loadNextState();
    });
}
