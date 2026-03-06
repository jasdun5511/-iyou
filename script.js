// ================= 全新序列 1：总词典架构 & 高级数据引擎 =================

let globalDict = {}; // 存放世界上所有的葡语单词字典库！
let globalVocabularyData = []; // 当前选中的词书中的单词列表 (拼装后)
let learningQueue = [];
let learnedCount = 0;
let totalWords = 0;
let currentWordObj = null;
let currentOptionsData = [];

let currentMeaningIndex = 0;
let currentExampleIndex = 0;

// 拼写相关状态
let spellingQueue = [];
let wrongWordsQueue = [];
let currentSpellWord = null;
let spellCurrentIndex = 0;
let spellTotalInRound = 0;
let spellHasErroredThisTurn = false;
let isSpellChecking = false;
let isComposing = false;

// 当前词书名称
let currentBookName = '核心葡语词汇';

// --- 核心：全局进度管理器 (跨词书同步进度) ---
const StorageManager = {
    getProgress: function() {
        const data = localStorage.getItem('splendid_global_progress');
        return data ? JSON.parse(data) : {};
    },
    // 保存单个单词的错误次数 (不管在哪本书错的，都记在 ID 头上)
    saveWordError: function(wordId) {
        let progress = this.getProgress();
        if (!progress[wordId]) progress[wordId] = { errorCount: 0 };
        progress[wordId].errorCount += 1;
        localStorage.setItem('splendid_global_progress', JSON.stringify(progress));
    },
    // 读取单词的错误次数
    getWordError: function(wordId) {
        let progress = this.getProgress();
        return progress[wordId] ? progress[wordId].errorCount : 0;
    }
};

// 统一的错误记录函数
function recordError(wordObj) {
    if (!wordObj || !wordObj.id) return;
    StorageManager.saveWordError(wordObj.id);
    let masterWord = globalVocabularyData.find(w => w.id === wordObj.id);
    if (masterWord) {
        masterWord.errorCount = StorageManager.getWordError(wordObj.id);
    }
}

// --- 核心：系统初始化 (启动时加载总词典) ---
async function initApp() {
    try {
        console.log("正在加载全局总词典 global_dict.json ...");
        const dictRes = await fetch('./global_dict.json');
        if (!dictRes.ok) throw new Error('找不到总词典');
        
        globalDict = await dictRes.json();
        console.log(`总词典加载成功！共包含 ${Object.keys(globalDict).length} 个词条。`);

        // 词典加载完后，自动去加载默认的“核心葡语词汇”目录
        await loadVocabularyBook('book_core', '核心葡语词汇');
        
    } catch (error) {
        console.error('初始化失败:', error);
        alert('系统初始化失败，请检查是否在同级目录下创建了 global_dict.json！');
    }
}

// --- 核心：加载特定词书 (动态拼装数据) ---
async function loadVocabularyBook(bookFileName, bookTitle) {
    try {
        console.log(`正在加载词书目录: ${bookFileName}.json ...`);
        currentBookName = bookTitle;
        
        const response = await fetch(`./${bookFileName}.json`);
        if (!response.ok) throw new Error('词书文件不存在');
        
        const wordIds = await response.json(); // 提取纯 ID 数组: ["pt_0001", "pt_0002"]
        
        // 🚀 数据拼装魔法：拿着 ID 去总词典找详情，再融合本地错题记录
        globalVocabularyData = wordIds.map(id => {
            const wordData = globalDict[id];
            if (!wordData) {
                console.warn(`警告：词书里包含了总词典中不存在的 ID -> ${id}`);
                return null; // 过滤掉找不到的死链
            }
            return {
                ...wordData,
                id: id, // 把 ID 塞回对象里方便后续操作
                errorCount: StorageManager.getWordError(id) // 绑定跨书同步的进度！
            };
        }).filter(item => item !== null);

        console.log(`《${bookTitle}》拼装完毕！包含单词数:`, globalVocabularyData.length);
        
        // 更新首页显示的数字
        document.getElementById('learn-count').innerText = globalVocabularyData.length;
        
    } catch (error) {
        console.error('加载词书出错:', error);
        alert(`无法加载词书 ${bookFileName}.json，请检查文件是否存在！`);
    }
}

// 启动系统
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});



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
    if (globalVocabularyData.length === 0) {
        alert("词书还未加载完成，请稍后再试！");
        return;
    }
    learningQueue = globalVocabularyData.map(word => ({ ...word, stage: 0 }));
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
        // 记录错误持久化
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
    recordError(currentWordObj);
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
    
    // 从 globalVocabularyData 读取最新的错误次数渲染
    globalVocabularyData.forEach(item => {
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


// ================= 序列 8：重构版拼写逻辑引擎 (无缝键盘+手动提交) =================
function startSpellingPhase() {
    views.spelling.classList.replace('hidden', 'active');
    spellingQueue = [...globalVocabularyData];
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
    
    els.hiddenInput.value = '';
    els.hiddenInput.maxLength = currentSpellWord.pt.length;
    
    els.letterBoxes.innerHTML = '';
    for (let i = 0; i < currentSpellWord.pt.length; i++) {
        els.letterBoxes.innerHTML += `<div class="letter-box"></div>`;
    }
    
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
    if (!isSpellChecking && els.hiddenInput.value.length > 0) {
        checkSpelling();
    } else if (els.hiddenInput.value.length === 0) {
        els.hiddenInput.focus();
    }
});

function syncInputToSlots(val) {
    const boxes = els.letterBoxes.children;
    for (let i = 0; i < boxes.length; i++) {
        boxes[i].innerText = '';
        boxes[i].classList.remove('filled');
    }
    for (let i = 0; i < val.length; i++) {
        if (boxes[i]) {
            boxes[i].innerText = val[i];
            boxes[i].classList.add('filled');
        }
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
    
    let isCorrect = (userInput === targetWord);

    if (isCorrect && !spellHasErroredThisTurn) {
        for (let i = 0; i < boxes.length; i++) { boxes[i].classList.add('correct'); }
        playAudio(currentSpellWord.pt);
        setTimeout(loadNextSpellWord, 800); 
    } else {
        if (!spellHasErroredThisTurn) {
            spellHasErroredThisTurn = true;
            wrongWordsQueue.push(currentSpellWord);
            recordError(currentSpellWord); // 拼写错误记录持久化
        }
        
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

els.hintContainer.addEventListener('click', () => {
    if (isSpellChecking) return;
    if (!spellHasErroredThisTurn) {
        spellHasErroredThisTurn = true;
        wrongWordsQueue.push(currentSpellWord);
        recordError(currentSpellWord);
    }
    
    els.bulbIcon.style.backgroundColor = 'rgba(255,255,255,0.2)';
    setTimeout(() => { els.bulbIcon.style.backgroundColor = 'transparent'; }, 300);
    
    els.hiddenInput.value = currentSpellWord.pt;
    syncInputToSlots(currentSpellWord.pt);
    checkSpelling(); 
});


// ================= 序列 9：数据仪表盘路由与动态统计 =================
const btnNavDashboard = document.getElementById('btn-nav-dashboard');
const btnNavHome = document.getElementById('btn-nav-home'); 
const btnBackHome = document.getElementById('btn-back-home'); 

btnNavDashboard.addEventListener('click', () => {
    views.home.classList.replace('active', 'hidden');
    views.dashboard.classList.replace('hidden', 'active');
    
    btnNavDashboard.classList.add('active');
    btnNavHome.classList.remove('active');
    
    renderDashboardData();
});

btnBackHome.addEventListener('click', () => {
    views.dashboard.classList.replace('active', 'hidden');
    views.home.classList.replace('hidden', 'active');
    
    btnNavDashboard.classList.remove('active');
    btnNavHome.classList.add('active');
});

function renderDashboardData() {
    // 动态统计生词本数量 (依靠 localStorage 中的 errorCount)
    const vocabCount = globalVocabularyData.filter(word => word.errorCount > 0).length;
    document.getElementById('dash-vocab-count').innerText = vocabCount;

    const totalWordsCount = globalVocabularyData.length;
    document.getElementById('dash-total').innerText = totalWordsCount;
    document.getElementById('dash-learned').innerText = learnedCount;
    
    document.getElementById('dash-today-learned').innerText = learnedCount;
    document.getElementById('dash-total-learned').innerText = learnedCount;

    const progressPercent = totalWordsCount === 0 ? 0 : (learnedCount / totalWordsCount) * 100;
    setTimeout(() => {
        document.getElementById('dash-progress-fill').style.width = `${progressPercent}%`;
    }, 50);
}


// ================= 序列 10：词库视图路由交互 =================
const btnChangeBook = document.querySelector('.btn-change-book');
const btnBackDashboard = document.getElementById('btn-back-dashboard');

if (btnChangeBook) {
    btnChangeBook.addEventListener('click', () => {
        views.dashboard.classList.replace('active', 'hidden');
        views.library.classList.replace('hidden', 'active');
    });
}

if (btnBackDashboard) {
    btnBackDashboard.addEventListener('click', () => {
        views.library.classList.replace('active', 'hidden');
        views.dashboard.classList.replace('hidden', 'active');
    });
}


// ================= 序列 11：仪表盘菜单与单词表视图 =================
const btnDashboardMore = document.getElementById('btn-dashboard-more');
const dashboardMoreMenu = document.getElementById('dashboard-more-menu');
const btnOpenWordlistCover = document.getElementById('btn-open-wordlist-cover');
const btnMenuWordlist = document.getElementById('btn-menu-wordlist');

const wordlistView = document.getElementById('wordlist-view');
const btnBackFromWordlist = document.getElementById('btn-back-from-wordlist');
const wordlistItemsContainer = document.getElementById('wordlist-items-container');
const wordlistTotalCount = document.getElementById('wordlist-total-count');
const wordlistUnitCount = document.getElementById('wordlist-unit-count');

btnDashboardMore.addEventListener('click', (e) => {
    e.stopPropagation(); 
    dashboardMoreMenu.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
    if (!dashboardMoreMenu.contains(e.target) && e.target !== btnDashboardMore) {
        dashboardMoreMenu.classList.add('hidden');
    }
});

function openWordlist() {
    dashboardMoreMenu.classList.add('hidden');
    
    document.getElementById('dashboard-view').classList.replace('active', 'hidden');
    wordlistView.classList.replace('hidden', 'active');
    
    // 动态渲染词书数据
    const wordCount = globalVocabularyData.length;
    wordlistTotalCount.innerText = wordCount;
    wordlistUnitCount.innerText = `${wordCount}词`;
    
    wordlistItemsContainer.innerHTML = '';
    globalVocabularyData.forEach(word => {
        wordlistItemsContainer.innerHTML += `
            <div class="wordlist-item">${word.pt} <span style="font-size:0.85rem; color:rgba(255,255,255,0.4); margin-left:10px;">${word.zh}</span></div>
        `;
    });
}

btnOpenWordlistCover.addEventListener('click', openWordlist);
btnMenuWordlist.addEventListener('click', openWordlist);

btnBackFromWordlist.addEventListener('click', () => {
    wordlistView.classList.replace('active', 'hidden');
    document.getElementById('dashboard-view').classList.replace('hidden', 'active');
});

// ================= JS 序列 12：一键换书魔法 =================

const allLibraryBooks = document.querySelectorAll('.lib-book-item');
const dashBookCover = document.getElementById('btn-open-wordlist-cover');
const dashCoverText = document.getElementById('dash-cover-text');
const dashBookTitleText = document.getElementById('dash-book-title-text');

allLibraryBooks.forEach(bookItem => {
    bookItem.addEventListener('click', async () => {
        // 1. 读取这本书挂载的“隐形密码”
        const fileName = bookItem.getAttribute('data-file');
        const bookTitle = bookItem.getAttribute('data-title');
        const coverClass = bookItem.getAttribute('data-cover');
        const coverText = bookItem.getAttribute('data-cover-text');

        // 如果你还没建 book_hujiao.json，就拦截一下提示
        if (fileName !== 'book_core') {
            alert(`《${bookTitle}》的数据文件 (${fileName}.json) 还没创建哦，先试试"核心葡语词汇"吧！`);
            return;
        }

        // 2. 调用我们之前写好的神级架构：重新加载词典目录！
        await loadVocabularyBook(fileName, bookTitle);

        // 3. 瞬间替换仪表盘的 UI (封面颜色、封面字、大标题)
        dashBookCover.className = `book-cover ${coverClass}`;
        // 处理换行符（如果含有 \n 则替换为 <br>）
        dashCoverText.innerHTML = coverText.replace('\\n', '<br>');
        dashBookTitleText.innerText = bookTitle;

        // 4. 更新“正在学习”的橙色 Tag 位置
        document.querySelectorAll('.tag-learning').forEach(tag => tag.remove());
        bookItem.querySelector('.lib-book-meta').innerHTML += '<span class="tag-learning">正在学习</span>';

        // 5. 刷新仪表盘数字
        renderDashboardData();

        // 6. 丝滑退回仪表盘
        document.getElementById('library-view').classList.replace('active', 'hidden');
        document.getElementById('dashboard-view').classList.replace('hidden', 'active');
    });
});
