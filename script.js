// 严格按要求的数据结构
const wordData = {
    word: "capital",
    meanings: [
        {
            partOfSpeech: "n.",
            enDefinition: "the most important town or city in a country...",
            cnDefinition: "首都；国都",
            sentences: [
                { source: "广州版小学英语", en: "The <span>capital</span> of China is Beijing.", cn: "中国的首都是北京。", imageUrl: "https://images.unsplash.com/photo-1599571234909-29ed5d13204b?q=80&w=800&auto=format&fit=crop" },
                { source: "新闻例句", en: "He travelled to Washington, the <span>capital</span> of...", cn: "他前往美国首都...", imageUrl: "https://images.unsplash.com/photo-1617581629397-a72507c3de9e?q=80&w=800&auto=format&fit=crop" }
            ]
        },
        {
            partOfSpeech: "n.",
            enDefinition: "a large amount of money...",
            cnDefinition: "资本；资金",
            sentences: [
                { source: "海军罪案调查处", en: "Starting a business like this takes <span>capital</span>, right?", cn: "这种创业是需要资金的，对吧？", imageUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=800&auto=format&fit=crop" }
            ]
        },
        {
            partOfSpeech: "n.",
            enDefinition: "a letter of the form and size used to begin a sentence...",
            cnDefinition: "大写字母",
            sentences: [
                { source: "龙虾", en: "Please write your name clearly in <span>capital letters</span>...", cn: "请清楚地填上自己的姓名，全部大写...", imageUrl: "https://images.unsplash.com/photo-1503694978374-8a2fa686963a?q=80&w=800&auto=format&fit=crop" }
            ]
        }
    ]
};

// 状态管理
let currentMeaningIndex = 0;
let currentSentenceIndex = 0;

// DOM 获取
const modal = document.getElementById('immersive-modal');
const bgImage = document.getElementById('im-bg-image');
const sourceTag = document.getElementById('im-source-tag');
const upperTrack = document.getElementById('upper-track');
const upperDotsContainer = document.getElementById('upper-dots');
const lowerTrack = document.getElementById('lower-track');
const globalDotsContainer = document.getElementById('global-dots');

const upperWindow = document.getElementById('upper-window');
const lowerWindow = document.getElementById('lower-window');

// 辅助：高亮替换
function parseHighlight(text) {
    return text.replace(/<span>/g, '<span class="highlight">').replace(/<\/span>/g, '</span>');
}

// ================== 初始化与渲染 ==================

document.getElementById('btn-open-immersive').addEventListener('click', () => {
    currentMeaningIndex = 0;
    currentSentenceIndex = 0;
    
    renderLowerTrack();
    updateLowerSlider(); // 触发上层的第一次渲染
    
    modal.classList.remove('hidden');
});

document.getElementById('im-btn-close').addEventListener('click', () => {
    modal.classList.add('hidden');
});

// 渲染下层 (考义轨道，仅在初始化时生成一次)
function renderLowerTrack() {
    lowerTrack.innerHTML = '';
    const totalMeanings = wordData.meanings.length;
    
    wordData.meanings.forEach((meaning, idx) => {
        lowerTrack.innerHTML += `
            <div class="slider-slide">
                <div class="def-panel">
                    <p class="im-pos">${meaning.partOfSpeech}</p>
                    <p class="im-en-def">${meaning.enDefinition}</p>
                    <p class="im-zh-def">${meaning.cnDefinition}</p>
                    <div class="page-indicator">${idx + 1}/${totalMeanings}</div>
                </div>
            </div>
        `;
    });
}

// 渲染上层 (例句轨道，每次考义切换时重新生成)
function renderUpperTrack() {
    const meaning = wordData.meanings[currentMeaningIndex];
    upperTrack.innerHTML = '';
    
    meaning.sentences.forEach(sen => {
        upperTrack.innerHTML += `
            <div class="slider-slide">
                <p class="im-en-sentence">${parseHighlight(sen.en)}</p>
                <p class="im-zh-sentence">${sen.cn}</p>
            </div>
        `;
    });

    // 瞬间重置上层轨道位置，无动画
    upperTrack.style.transition = 'none';
    upperTrack.style.transform = `translateX(0%)`;
    void upperTrack.offsetWidth; // 强制重绘
    upperTrack.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)';
    
    updateUpperUI();
}

// ================== 更新视图状态 ==================

// 更新上层 UI (例句位置、指示点、来源、背景图)
function updateUpperUI() {
    const meaning = wordData.meanings[currentMeaningIndex];
    const sen = meaning.sentences[currentSentenceIndex];
    
    // 1. 滑动轨道
    upperTrack.style.transform = `translateX(-${currentSentenceIndex * 100}%)`;
    
    // 2. 更新来源标签
    sourceTag.innerText = sen.source;
    
    // 3. 更新背景图片
    bgImage.style.opacity = '0';
    setTimeout(() => {
        if(sen.imageUrl) {
            bgImage.src = sen.imageUrl;
            bgImage.style.opacity = '0.4';
        }
    }, 150);

    // 4. 更新局部小圆点
    upperDotsContainer.innerHTML = '';
    if (meaning.sentences.length > 1) {
        meaning.sentences.forEach((_, idx) => {
            upperDotsContainer.innerHTML += `<div class="dot ${idx === currentSentenceIndex ? 'active' : ''}"></div>`;
        });
    }
}

// 更新下层 UI (考义位置、全局胶囊点)
function updateLowerSlider() {
    // 滑动轨道
    lowerTrack.style.transform = `translateX(-${currentMeaningIndex * 100}%)`;
    
    // 渲染全局考义胶囊
    globalDotsContainer.innerHTML = '';
    const total = wordData.meanings.length;
    if (total > 1) {
        for(let i = 0; i < total; i++) {
            if (i === currentMeaningIndex) {
                globalDotsContainer.innerHTML += `<div class="global-dot capsule">考义</div>`;
            } else {
                globalDotsContainer.innerHTML += `<div class="global-dot"></div>`;
            }
        }
    }
    
    // 联动：下层切换，上层数据必须重构并归零
    currentSentenceIndex = 0;
    renderUpperTrack();
}

// ================== 二维滑动侦听器 ==================

const SWIPE_THRESHOLD = 40;

// 维度一：上层局部滑动
let upperStartX = 0;
upperWindow.addEventListener('touchstart', e => { upperStartX = e.touches[0].clientX; });
upperWindow.addEventListener('touchend', e => {
    let diff = e.changedTouches[0].clientX - upperStartX;
    const totalEx = wordData.meanings[currentMeaningIndex].sentences.length;
    
    if (totalEx > 1) {
        if (diff < -SWIPE_THRESHOLD && currentSentenceIndex < totalEx - 1) {
            currentSentenceIndex++;
            updateUpperUI();
        } else if (diff > SWIPE_THRESHOLD && currentSentenceIndex > 0) {
            currentSentenceIndex--;
            updateUpperUI();
        }
    }
});

// 维度二：下层全局滑动
let lowerStartX = 0;
lowerWindow.addEventListener('touchstart', e => { lowerStartX = e.touches[0].clientX; });
lowerWindow.addEventListener('touchend', e => {
    let diff = e.changedTouches[0].clientX - lowerStartX;
    const totalMeanings = wordData.meanings.length;
    
    if (totalMeanings > 1) {
        if (diff < -SWIPE_THRESHOLD && currentMeaningIndex < totalMeanings - 1) {
            currentMeaningIndex++;
            updateLowerSlider();
        } else if (diff > SWIPE_THRESHOLD && currentMeaningIndex > 0) {
            currentMeaningIndex--;
            updateLowerSlider();
        }
    }
});
