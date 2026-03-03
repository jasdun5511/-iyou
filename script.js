// ================= 序列 1：升维版数据结构 (支持二维考义滑动) =================
const vocabularyData = [
    { 
        pt: "mesmo", pos: "adv.", zh: "甚至，即使", phonetic: "/'mez.mu/", 
        example: { pt: "<strong>Mesmo</strong> na cidade, o trabalho era difícil.", zh: "即使在城市里，工作也很难找。" },
        phrases: ["mesmo assim 尽管如此", "mesmo que 即使"],
        derivatives: ["mesmíssimo (adj. 完全一样的)"],
        roots: ["源自拉丁语 'metipsimus'"],
        synonyms: ["ainda (adv. 还，甚至)", "até (prep. 直到，甚至)"],
        
        // 【核心】：沉浸式大卡片的二维数据源
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

// 【沉浸式 Modal 的双维滑动状态】
let currentMeaningIndex = 0;
let currentExampleIndex = 0;

const views = { 
    home: document.getElementById('home-view'), 
    learning: document.getElementById('learning-view'),
    immersive: document.getElementById('immersive-modal') 
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
    
    // 【大卡片专属元素】
    btnOpenImmersive: document.getElementById('btn-open-immersive'),
    upperWindow: document.getElementById('upper-window'),
    upperTrack: document.getElementById('upper-track'),
    lowerWindow: document.getElementById('lower-window'),
    lowerTrack: document.getElementById('lower-track'),
    upperSource: document.getElementById('upper-source-tag'),
    upperDots: document.getElementById('upper-dots'),
    globalDots: document.getElementById('global-dots'),
    btnImClose: document.getElementById('im-btn-close'),
    btnImNext: document.getElementById('im-btn-next-word')
};

document.getElementById('learn-count').innerText = vocabularyData.length;

// ================= 序列 3：基础背词与流程控制 =================
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


// ================= 序列 4：测验出题与交互反馈逻辑 (核心重构) =================

function renderStage0() {
    els.app.className = 'bg-blur';
    els.quizArea.classList.remove('hidden');
    els.fQuiz.classList.remove('hidden');

    // 每次进入新词时，重置底部按钮为默认的“看答案”
    els.fQuiz.innerHTML = `
        <div class="action-item" onclick="showAnswerDirectly()">
            <span>看答案</span><div class="line red"></div>
        </div>
    `;

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
        
        // 核心：清空上一题可能残留的 wrong/correct 背景色、描边以及双语内容
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
    els.options.forEach(el => el.style.pointerEvents = 'none'); // 选完锁死其他选项
    
    const selectedData = currentOptionsData[selectedIndex];
    const clickedBtn = els.options[selectedIndex];
    
    if (selectedData.isCorrect) {
        currentWordObj.stage = 1; learningQueue.push(currentWordObj); updateDots(1); 
        
        // 选对时：框体变淡淡的绿色，显示双语
        clickedBtn.classList.add('correct');
        els.optContents[selectedIndex].innerHTML = `
            <div class="opt-bilingual">
                <span class="opt-pt-text">${selectedData.wordObj.pt}</span>
                <span class="opt-zh-text">${selectedData.wordObj.pos} ${selectedData.wordObj.zh}</span>
            </div>
        `;
        
        // 选对则保留自动跳转体验
        setTimeout(() => showDetails(), 400); 
    } else {
        currentWordObj.stage = 0; learningQueue.push(currentWordObj); updateDots(0); 
        
        // 1. 选错时：你点错的框体变淡淡的红色，显示那个错误单词的双语
        clickedBtn.classList.add('wrong');
        els.optContents[selectedIndex].innerHTML = `
            <div class="opt-bilingual">
                <span class="opt-pt-text">${selectedData.wordObj.pt}</span>
                <span class="opt-zh-text">${selectedData.wordObj.pos} ${selectedData.wordObj.zh}</span>
            </div>
        `;
        
        // 2. 自动显示正确答案：正确的框体变淡淡的绿色，显示正确单词的双语
        currentOptionsData.forEach((opt, index) => {
            if (opt.isCorrect) {
                const correctBtn = els.options[index];
                correctBtn.classList.add('correct');
                els.optContents[index].innerHTML = `
                    <div class="opt-bilingual">
                        <span class="opt-pt-text">${opt.wordObj.pt}</span>
                        <span class="opt-zh-text">${opt.wordObj.pos} ${opt.wordObj.zh}</span>
                    </div>
                `;
            }
        });
        
        playAudio(selectedData.wordObj.pt);
        
        // 3. 核心交互修改：不再自动跳转！
        // 将底部按钮替换为“查看详情”，让用户自己对比看明白后，手动点击进入下一页
        els.fQuiz.innerHTML = `
            <div class="action-item" onclick="showDetails()" style="animation: fadeIn 0.3s;">
                <span style="color: #fff; font-weight: 500;">查看详情</span>
                <div class="line" style="background-color: #f39c12;"></div>
            </div>
        `;
    }
}


// ================= 序列 5：复习认词与详情逻辑 =================
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

// 底部 Tab
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

window.showDetails = function() {
    els.app.className = 'bg-blur'; 
    els.skeletonBars.classList.add('hidden');
    els.quizArea.classList.add('hidden');
    els.recognizeArea.classList.add('hidden');
    els.fQuiz.classList.add('hidden');
    els.fRecog.classList.add('hidden');
    els.defArea.classList.remove('hidden');
    els.detailArea.classList.remove('hidden');
    els.fDetail.classList.remove('hidden');

    document.getElementById('word-example-pt').innerHTML = highlightYellow(currentWordObj.example.pt);
    document.getElementById('word-example-zh').innerText = currentWordObj.example.zh;
    els.tabs[0].click(); 
}

document.getElementById('btn-next').addEventListener('click', () => { setTimeout(() => loadNextState(), 150); });
document.getElementById('btn-forgot').addEventListener('click', () => {
    if (currentWordObj.stage === 3) learnedCount--; 
    currentWordObj.stage = 0; learningQueue.push(currentWordObj);
    setTimeout(() => loadNextState(), 150);
});

// 自动高亮替换工具
function highlightYellow(text) {
    return text.replace(/<strong>/g, '<span class="highlight-yellow">').replace(/<\/strong>/g, '</span>');
}


// ================= 序列 6：沉浸大卡片核心系统 (二维滑动) =================

els.btnOpenImmersive.addEventListener('click', () => {
    if (!currentWordObj.meanings || currentWordObj.meanings.length === 0) return;
    
    currentMeaningIndex = 0;
    currentExampleIndex = 0;
    
    // 初始化下层轨道 (释义卡片列队)
    els.lowerTrack.innerHTML = '';
    currentWordObj.meanings.forEach((meaning, idx) => {
        els.lowerTrack.innerHTML += `
            <div class="slider-slide">
                <div class="def-panel">
                    <p class="im-pos">${meaning.pos}</p>
                    <p class="im-en-def">${meaning.enDef}</p>
                    <p class="im-zh-def">${meaning.zhDef}</p>
                    <div class="meaning-counter">${idx + 1}/${currentWordObj.meanings.length}</div>
                </div>
            </div>
        `;
    });

    updateGlobalDots();
    populateUpperTrack(0); 
    
    // 强制清除旧的 transform (瞬间归零)
    els.lowerTrack.style.transition = 'none';
    els.lowerTrack.style.transform = `translateX(0%)`;
    void els.lowerTrack.offsetWidth;
    els.lowerTrack.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)';

    views.learning.classList.replace('active', 'hidden');
    views.immersive.classList.replace('hidden', 'active');
});

function populateUpperTrack(meaningIdx) {
    const meaning = currentWordObj.meanings[meaningIdx];
    currentExampleIndex = 0; 
    
    els.upperTrack.innerHTML = '';
    meaning.examples.forEach(ex => {
        els.upperTrack.innerHTML += `
            <div class="slider-slide">
                <p class="im-en-sentence">${highlightYellow(ex.pt)}</p>
                <p class="im-zh-sentence">${ex.zh}</p>
            </div>
        `;
    });

    els.upperDots.innerHTML = '';
    if (meaning.examples.length > 1) {
        meaning.examples.forEach((_, idx) => {
            els.upperDots.innerHTML += `<span class="dot ${idx === 0 ? 'active' : ''}"></span>`;
        });
    }

    els.upperTrack.style.transition = 'none';
    els.upperTrack.style.transform = `translateX(0%)`;
    void els.upperTrack.offsetWidth;
    els.upperTrack.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)';
    
    els.upperSource.innerText = meaning.examples[0].source || "词典例句";
}

function updateUpperTransform() {
    els.upperTrack.style.transform = `translateX(-${currentExampleIndex * 100}%)`;
    const dots = els.upperDots.querySelectorAll('.dot');
    if (dots.length > 0) {
        dots.forEach((dot, idx) => dot.classList.toggle('active', idx === currentExampleIndex));
    }
    const currentEx = currentWordObj.meanings[currentMeaningIndex].examples[currentExampleIndex];
    els.upperSource.innerText = currentEx.source || "词典例句";
}

function updateLowerTransform() {
    els.lowerTrack.style.transform = `translateX(-${currentMeaningIndex * 100}%)`;
    updateGlobalDots();
}

function updateGlobalDots() {
    els.globalDots.innerHTML = '';
    const total = currentWordObj.meanings.length;
    if (total > 1) {
        for(let i=0; i<total; i++) {
            if (i === currentMeaningIndex) {
                els.globalDots.innerHTML += `<span class="global-dot capsule">考义</span>`;
            } else {
                els.globalDots.innerHTML += `<span class="global-dot"></span>`;
            }
        }
    }
}


// ================= 序列 7：手势滑动侦听 (Touch Events) =================

let startX = 0;
const SWIPE_THRESHOLD = 40; 

els.upperWindow.addEventListener('touchstart', e => { startX = e.changedTouches[0].screenX; });
els.upperWindow.addEventListener('touchend', e => {
    let diff = e.changedTouches[0].screenX - startX;
    const totalEx = currentWordObj.meanings[currentMeaningIndex].examples.length;
    
    if (totalEx > 1) {
        if (diff < -SWIPE_THRESHOLD && currentExampleIndex < totalEx - 1) {
            currentExampleIndex++; 
            updateUpperTransform();
        } else if (diff > SWIPE_THRESHOLD && currentExampleIndex > 0) {
            currentExampleIndex--; 
            updateUpperTransform();
        }
    }
});

els.lowerWindow.addEventListener('touchstart', e => { startX = e.changedTouches[0].screenX; });
els.lowerWindow.addEventListener('touchend', e => {
    let diff = e.changedTouches[0].screenX - startX;
    const totalMeanings = currentWordObj.meanings.length;
    
    if (totalMeanings > 1) {
        if (diff < -SWIPE_THRESHOLD && currentMeaningIndex < totalMeanings - 1) {
            currentMeaningIndex++;
            updateLowerTransform();
            setTimeout(() => { populateUpperTrack(currentMeaningIndex); }, 150); 
            
        } else if (diff > SWIPE_THRESHOLD && currentMeaningIndex > 0) {
            currentMeaningIndex--;
            updateLowerTransform();
            setTimeout(() => { populateUpperTrack(currentMeaningIndex); }, 150);
        }
    }
});


// ================= 序列 8：大卡片底部操作 =================
els.btnImClose.addEventListener('click', () => {
    views.immersive.classList.replace('active', 'hidden');
    views.learning.classList.replace('hidden', 'active');
});

els.btnImNext.addEventListener('click', () => {
    views.immersive.classList.replace('active', 'hidden');
    views.learning.classList.replace('hidden', 'active');
    setTimeout(() => loadNextState(), 150); 
});
