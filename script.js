// ================= 序列 1：数据结构 =================
const vocabularyData = [
    { 
        pt: "mesmo", pos: "adv.", zh: "甚至，即使", phonetic: "/'mez.mu/", 
        example: { pt: "<strong>Mesmo</strong> na cidade, o trabalho era difícil.", zh: "即使在城市里，工作也很难找。" },
        meanings: [
            {
                pos: "adv.", enDef: "even, exactly", zhDef: "甚至，即使",source: "柯林斯词典",
                examples: [
                    { pt: "<strong>Mesmo</strong> na cidade, o trabajo era difícil.", zh: "即使在城市里，工作也很难找。" },
                    { pt: "Foi ele <strong>mesmo</strong> quem fez isso.", zh: "确实是他本人做的。" }
                ]
            },
            {
                pos: "adj.", enDef: "same, identical", zhDef: "同一个的", source: "广州版小学英语",
                examples: [
                    { pt: "Nós moramos na <strong>mesma</strong> rua.", zh: "我们住在同一条街上。" }
                ]
            }
        ]
    }
    // ... 可以添加更多单词
];

let learningQueue = vocabularyData.map(word => ({ ...word, stage: 0 }));
let learnedCount = 0;
let totalWords = learningQueue.length;
let currentWordObj = null;

// 二维滑动状态
let currentMeaningIndex = 0;
let currentExampleIndex = 0;
let startX = 0;

const views = { learning: document.getElementById('learning-view'), immersive: document.getElementById('immersive-modal') };
const els = {
    // 大卡片专属
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

// ================= 序列 2：沉浸大卡片核心系统 (二维滑动) =================

// 1. 打开卡片并初始化二维轨道
els.btnOpenImmersive.addEventListener('click', () => {
    // 使用 learningQueue 里的第一个词，或者你需要某种逻辑选择当前词
    currentWordObj = learningQueue[0];
    currentMeaningIndex = 0;
    currentExampleIndex = 0;
    
    // 初始化下层轨道
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
    
    // 弹性滑动位置归零
    els.lowerTrack.style.transition = 'none';
    els.lowerTrack.style.transform = `translateX(0%)`;
    void els.lowerTrack.offsetWidth;
    els.lowerTrack.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)';

    views.immersive.classList.replace('hidden', 'active');
});

// 2. 注入上层轨道数据
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
    els.upperSource.innerText = meaning.source || "词典例句";
}

// 3. 滑动位置更新
function updateUpperTransform() {
    els.upperTrack.style.transform = `translateX(-${currentExampleIndex * 100}%)`;
    const dots = els.upperDots.querySelectorAll('.dot');
    if (dots.length > 0) dots.forEach((dot, idx) => dot.classList.toggle('active', idx === currentExampleIndex));
}

function updateLowerTransform() {
    els.lowerTrack.style.transform = `translateX(-${currentMeaningIndex * 100}%)`;
    updateGlobalDots();
}

function updateGlobalDots() {
    els.globalDots.innerHTML = '';
    currentWordObj.meanings.forEach((_, idx) => {
        if (idx === currentMeaningIndex) {
            els.globalDots.innerHTML += `<span class="global-dot capsule">考义</span>`;
        } else {
            els.globalDots.innerHTML += `<span class="global-dot"></span>`;
        }
    });
}

// 自动高亮替换工具
function highlightYellow(text) {
    return text.replace(/<strong>/g, '<span class="highlight-yellow">').replace(/<\/strong>/g, '</span>');
}

// ================= 序列 3：二维滑动侦听 =================

// 上层例句滑动
els.upperWindow.addEventListener('touchstart', e => startX = e.changedTouches[0].screenX );
els.upperWindow.addEventListener('touchend', e => {
    let diff = e.changedTouches[0].screenX - startX;
    const meaning = currentWordObj.meanings[currentMeaningIndex];
    if (meaning.examples.length > 1) {
        if (diff < -40 && currentExampleIndex < meaning.examples.length - 1) currentExampleIndex++; 
        else if (diff > 40 && currentExampleIndex > 0) currentExampleIndex--; 
        updateUpperTransform();
    }
});

// 下层考义滑动
els.lowerWindow.addEventListener('touchstart', e => startX = e.changedTouches[0].screenX );
els.lowerWindow.addEventListener('touchend', e => {
    let diff = e.changedTouches[0].screenX - startX;
    if (currentWordObj.meanings.length > 1) {
        if (diff < -40 && currentMeaningIndex < currentWordObj.meanings.length - 1) {
            currentMeaningIndex++; updateLowerTransform();
            setTimeout(() => populateUpperTrack(currentMeaningIndex), 150); 
        } else if (diff > 40 && currentMeaningIndex > 0) {
            currentMeaningIndex--; updateLowerTransform();
            setTimeout(() => populateUpperTrack(currentMeaningIndex), 150);
        }
    }
});

// 底部操作
els.btnImClose.addEventListener('click', () => views.immersive.classList.replace('active', 'hidden'));
els.btnImNext.addEventListener('click', () => alert('下一词逻辑'));
