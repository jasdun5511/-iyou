// 升级版数据：重点加入了 allExamples 数组，支持多考义（不同意思）的左右滑动切换
const vocabularyData = [
    { 
        pt: "mesmo", pos: "adv.", zh: "甚至，即使", phonetic: "/'mez.mu/", 
        // allExamples 存放该词的所有考义和例句
        allExamples: [
            { title: "adv. 甚至，即使", pt: "<strong>Mesmo</strong> na cidade, o trabalho era difícil de encontrar.", zh: "即使在城市里，工作也很难找。" },
            { title: "adj. 同一个的", pt: "Nós moramos na <strong>mesma</strong> rua.", zh: "我们住在同一条街上。" },
            { title: "pron. (强调) 自己", pt: "Eu <strong>mesmo</strong> fiz o bolo.", zh: "我自己做了蛋糕。" }
        ],
        phrases: ["mesmo assim 尽管如此", "mesmo que 即使"],
        derivatives: ["mesmíssimo (adj. 完全一样的)"],
        roots: ["源自拉丁语 'metipsimus' (正是那个)"],
        synonyms: ["ainda (adv. 还，甚至)", "até (prep. 直到，甚至)"]
    },
    { 
        pt: "encorajar", pos: "vt.", zh: "鼓励；劝告，怂恿；促进，刺激", phonetic: "/ẽ.ku.ɾaˈʒaɾ/", 
        allExamples: [
            { title: "vt. 鼓励，怂恿", pt: "Eu <strong>encorajo</strong> você a ser completamente honesto.", zh: "我鼓励你们说实话。" },
            { title: "vt. 促进，刺激", pt: "O governo deve <strong>encorajar</strong> o investimento estrangeiro.", zh: "政府应该促进外国投资。" }
        ],
        phrases: ["encorajar a violência 助长暴力", "encorajar o investimento 促进投资"],
        derivatives: ["coragem (n. 勇气)", "encorajamento (n. 鼓励，怂恿)"],
        roots: ["en- (使...) + coragem (勇气) + -ar (动词后缀)"],
        synonyms: ["animar (vt. 使兴奋)", "estimular (vt. 刺激)"]
    },
    { 
        pt: "salvar", pos: "vt.", zh: "储藏，贮存；(计算机) 存储", phonetic: "/sawˈvaɾ/", 
        allExamples: [
            { title: "vt. (计算机) 存储", pt: "Não se esqueça de <strong>salvar</strong> o documento.", zh: "别忘了保存文件。" },
            { title: "vt. 拯救，救助", pt: "O médico conseguiu <strong>salvar</strong> a vida do paciente.", zh: "医生成功挽救了病人的生命。" }
        ],
        phrases: ["salvar o arquivo 保存文件", "salvar a vida 救命"],
        derivatives: ["salvador (n. 救世主)", "salvação (n. 拯救)"],
        roots: ["源自晚期拉丁语 'salvare' (使安全)"],
        synonyms: ["guardar (vt. 保存)", "resgatar (vt. 营救)"]
    },
    { 
        pt: "física", pos: "n.", zh: "物理学", phonetic: "/ˈfi.zi.kɐ/", 
        allExamples: [
            { title: "n. 物理学", pt: "A <strong>física</strong> estuda a natureza e suas propriedades.", zh: "物理学研究自然及其属性。" }
        ],
        phrases: ["física quântica 量子物理", "física aplicada 应用物理"],
        derivatives: ["físico (adj. 物理的)"],
        roots: ["源自古希腊语 'phusis' (自然)"],
        synonyms: []
    }
];

let learningQueue = [];
let learnedCount = 0;
let totalWords = 0;
let currentWordObj = null;
let currentOptionsData = [];

// === 轮播图专属状态 ===
let currentSlideIndex = 0;
let touchStartX = 0;
let touchEndX = 0;

// DOM 元素获取
const views = { 
    home: document.getElementById('home-view'), 
    learning: document.getElementById('learning-view'),
    gallery: document.getElementById('gallery-view') 
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
    galleryContent: document.getElementById('gallery-content'),
    carouselWrapper: document.getElementById('meaning-carousel'),
    carouselDots: document.getElementById('carousel-dots')
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

// 因为 CSS 使用了 column-reverse，所以在 DOM 里的第一个点，其实是在最下方！
// 完美实现了“由下往上”逐个亮起的效果
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
    // 取该词第一个意思的葡语例句展示
    els.recogExPt.innerHTML = currentWordObj.allExamples[0].pt; 
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

// 选项交互与颜色反馈
window.checkAnswer = function(selectedIndex) {
    els.options.forEach(el => el.style.pointerEvents = 'none');
    
    const selectedData = currentOptionsData[selectedIndex];
    const clickedBtn = els.options[selectedIndex];
    
    clickedBtn.classList.add('active'); 
    
    if (selectedData.isCorrect) {
        currentWordObj.stage = 1; 
        learningQueue.push(currentWordObj);
        updateDots(1); 
        setTimeout(() => showDetails(), 400); // 物理延迟
    } else {
        currentWordObj.stage = 0; 
        learningQueue.push(currentWordObj);
        updateDots(0); 
        
        // 【核心交互还原】选错的答案文字变红
        els.optContents[selectedIndex].innerHTML = `<span style="color:#ff6b6b; font-size: 1.1rem; text-align:center; display:block; width:100%; font-weight:bold;">${selectedData.wordObj.pt}</span>`;
        
        // 自动在正确的答案上亮起绿色小灯提示
        currentOptionsData.forEach((opt, index) => {
            if (opt.isCorrect) {
                els.options[index].classList.add('active'); 
            }
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

// ================= Tab 菜单交互 =================
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
        els.tabContent.innerHTML = `
            <div style="height: 100%; display: flex; align-items: center; justify-content: center;">
                <p style="color: rgba(255,255,255,0.4); font-size: 0.9rem;">暂无数据</p>
            </div>
        `;
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


// ================= 核心：考义轮播与滑动算法 =================
function renderCarousel() {
    els.carouselWrapper.innerHTML = '';
    els.carouselDots.innerHTML = '';
    currentSlideIndex = 0; // 重置到第一张

    const examples = currentWordObj.allExamples;
    
    // 生成卡片和底部翻页圆点
    examples.forEach((ex, index) => {
        const titleHtml = ex.title ? `<span class="meaning-tag">${ex.title}</span>` : '';
        els.carouselWrapper.innerHTML += `
            <div class="carousel-slide">
                ${titleHtml}
                <p class="en-text">${ex.pt}</p>
                <p class="zh-text">${ex.zh}</p>
            </div>
        `;
        
        // 如果多于一个意思，才生成底部指示小圆点
        if (examples.length > 1) {
            els.carouselDots.innerHTML += `<span class="page-dot ${index === 0 ? 'active' : ''}"></span>`;
        }
    });

    updateCarouselTransform();
}

function updateCarouselTransform() {
    els.carouselWrapper.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
    // 更新点点高亮
    const dots = els.carouselDots.querySelectorAll('.page-dot');
    if (dots.length > 0) {
        dots.forEach((dot, idx) => {
            idx === currentSlideIndex ? dot.classList.add('active') : dot.classList.remove('active');
        });
    }
}

// 触摸滑动事件监听
els.carouselWrapper.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
});

els.carouselWrapper.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleCarouselSwipe();
});

function handleCarouselSwipe() {
    const minSwipeDistance = 40; // 滑动触发距离
    const examplesLen = currentWordObj.allExamples.length;
    
    // 只有在考义多于1个的时候才允许滑动
    if (examplesLen > 1) {
        // 向左划 (看下一张)
        if (touchEndX < touchStartX - minSwipeDistance) {
            if (currentSlideIndex < examplesLen - 1) currentSlideIndex++;
        }
        // 向右划 (看上一张)
        if (touchEndX > touchStartX + minSwipeDistance) {
            if (currentSlideIndex > 0) currentSlideIndex--;
        }
        updateCarouselTransform();
    }
}
// =========================================================


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

    // 渲染带有滑动功能的例句区
    renderCarousel();

    els.tabs[0].click(); 
}

// 下一词与记错了
document.getElementById('btn-next').addEventListener('click', () => {
    setTimeout(() => loadNextState(), 150);
});

document.getElementById('btn-forgot').addEventListener('click', () => {
    if (currentWordObj.stage === 3) learnedCount--; 
    currentWordObj.stage = 0;
    learningQueue.push(currentWordObj);
    setTimeout(() => loadNextState(), 150);
});

// ================= 画廊系统 =================
document.getElementById('btn-open-gallery').addEventListener('click', () => {
    views.learning.classList.replace('active', 'hidden');
    views.gallery.classList.replace('hidden', 'active');
    
    els.galleryContent.innerHTML = '';
    
    currentWordObj.allExamples.forEach(ex => {
        const titleHtml = ex.title ? `<div class="gallery-card-title">${ex.title}</div>` : '';
        els.galleryContent.innerHTML += `
            <div class="gallery-card">
                ${titleHtml}
                <p class="en-text">${ex.pt}</p>
                <p class="zh-text">${ex.zh}</p>
            </div>
        `;
    });

    if (currentWordObj.phrases && currentWordObj.phrases.length > 0) {
        let phrasesHtml = `<div class="gallery-card"><div class="gallery-card-title">词组搭配</div>`;
        currentWordObj.phrases.forEach(item => {
            const splitIndex = item.search(/[\u4e00-\u9fa5]/); 
            const en = splitIndex > 0 ? item.substring(0, splitIndex).trim() : item;
            const zh = splitIndex > 0 ? item.substring(splitIndex).trim() : '';
            phrasesHtml += `<div class="phrase-item"><p class="phrase-en">${en}</p><p class="phrase-zh">${zh}</p></div>`;
        });
        phrasesHtml += `</div>`;
        els.galleryContent.innerHTML += phrasesHtml;
    }
});

document.getElementById('btn-back-gallery').addEventListener('click', () => {
    views.gallery.classList.replace('active', 'hidden');
    views.learning.classList.replace('hidden', 'active');
});
