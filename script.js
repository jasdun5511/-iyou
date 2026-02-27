// 全新词库：支持音标、词性、例句、词组搭配
const portugueseVocabulary = [
    { 
        pt: "escola", pos: "n.", zh: "学校", phonetic: "/isˈkɔ.lɐ/", 
        example: { pt: "Eu vou para a escola todos os dias.", zh: "我每天去学校。" },
        phrases: ["escola pública 公立学校", "escola particular 私立学校"]
    },
    { 
        pt: "física", pos: "n.", zh: "物理", phonetic: "/ˈfi.zi.kɐ/", 
        example: { pt: "A prova de física é muito difícil.", zh: "物理考试很难。" },
        phrases: ["física quântica 量子物理", "física aplicada 应用物理"]
    },
    { 
        pt: "desenvolvimento", pos: "n.", zh: "开发，发展", phonetic: "/de.zẽ.vol.viˈmẽ.tu/", 
        example: { pt: "Estudo desenvolvimento de software.", zh: "我学习软件开发。" },
        phrases: ["desenvolvimento web Web开发", "desenvolvimento sustentável 可持续发展"]
    },
    { 
        pt: "encorajar", pos: "v.", zh: "鼓励，促进", phonetic: "/ẽ.ku.ɾaˈʒaɾ/", 
        example: { pt: "O professor encoraja os alunos.", zh: "老师鼓励学生们。" },
        phrases: ["encorajar alguém a fazer 鼓励某人做某事", "encorajar o investimento 促进投资"]
    },
    { 
        pt: "velocidade", pos: "n.", zh: "速度", phonetic: "/ve.lo.siˈda.dʒi/", 
        example: { pt: "A velocidade da luz é constante.", zh: "光速是恒定的。" },
        phrases: ["alta velocidade 高速", "limite de velocidade 限速"]
    }
];

let currentIndex = 0;
let currentOptionsData = []; // 保存当前生成的4个选项数据

// DOM 元素获取
const homeView = document.getElementById('home-view');
const learningView = document.getElementById('learning-view');
const btnLearn = document.getElementById('btn-learn');
const btnBack = document.getElementById('btn-back');

// 学习界面元素
const elProgressText = document.getElementById('progress-text');
const elWordPt = document.getElementById('word-pt');
const elWordHeaderDetails = document.getElementById('word-header-details');
const elWordPhoneticText = document.getElementById('word-phonetic-text');
const elWordPos = document.getElementById('word-pos');
const elWordZhTitle = document.getElementById('word-zh-title');

const quizArea = document.getElementById('quiz-area');
const optionBtns = document.querySelectorAll('.option-btn');
const detailArea = document.getElementById('detail-area');

const elExamplePt = document.getElementById('word-example-pt');
const elExampleZh = document.getElementById('word-example-zh');
const phrasesContainer = document.getElementById('phrases-container');

const btnShowAnswer = document.getElementById('btn-show-answer');
const btnNext = document.getElementById('btn-next');

// 初始化
document.getElementById('learn-count').innerText = portugueseVocabulary.length;

// 视图切换
btnLearn.addEventListener('click', () => {
    if (portugueseVocabulary.length === 0) return;
    homeView.classList.replace('active', 'hidden');
    learningView.classList.replace('hidden', 'active');
    loadWord();
});

btnBack.addEventListener('click', () => {
    learningView.classList.replace('active', 'hidden');
    homeView.classList.replace('hidden', 'active');
});

// 打乱数组算法
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 加载单词与生成选项
function loadWord() {
    if (currentIndex >= portugueseVocabulary.length) {
        alert("Parabéns! 今日任务完成！");
        btnBack.click();
        currentIndex = 0;
        return;
    }

    const currentWord = portugueseVocabulary[currentIndex];
    elProgressText.innerText = `${currentIndex + 1}/${portugueseVocabulary.length}`;
    
    // 顶部单词
    elWordPt.innerText = currentWord.pt;
    
    // 隐藏详情，展示测验区
    elWordHeaderDetails.classList.add('hidden');
    detailArea.classList.add('hidden');
    quizArea.classList.remove('hidden');
    
    // 底部按钮切换
    btnShowAnswer.classList.remove('hidden');
    btnNext.classList.add('hidden');

    // 准备4个选项数据 (1对3错)
    let options = [{ wordObj: currentWord, isCorrect: true }];
    let wrongCandidates = portugueseVocabulary.filter(w => w.pt !== currentWord.pt);
    shuffleArray(wrongCandidates);
    
    for (let i = 0; i < 3 && i < wrongCandidates.length; i++) {
        options.push({ wordObj: wrongCandidates[i], isCorrect: false });
    }
    shuffleArray(options);
    currentOptionsData = options; // 保存全局以便点击时比对

    // 渲染选项按钮
    optionBtns.forEach((btn, index) => {
        const optData = options[index].wordObj;
        // 渲染词性和中文
        btn.innerHTML = `<span class="opt-pos">${optData.pos}</span><span class="opt-zh">${optData.zh}</span>`;
        btn.disabled = false;
        btn.style.background = ''; // 重置背景
    });
}

// 选项点击判断逻辑
window.checkAnswer = function(selectedIndex) {
    optionBtns.forEach(btn => btn.disabled = true); // 禁用所有按钮
    const selectedData = currentOptionsData[selectedIndex];
    const clickedBtn = optionBtns[selectedIndex];

    if (selectedData.isCorrect) {
        // 答对：直接丝滑进入详情页
        showDetails();
    } else {
        // 答错：按照你的要求，按钮内容变成该错误选项对应的【葡文单词】
        clickedBtn.innerHTML = `<span class="show-wrong-pt">${selectedData.wordObj.pt}</span>`;
        clickedBtn.style.background = 'rgba(231, 76, 60, 0.2)'; // 微微泛红
        
        // 错题惩罚：塞回数组末尾
        const failedWord = portugueseVocabulary.splice(currentIndex, 1)[0];
        portugueseVocabulary.push(failedWord);
        currentIndex--; 

        // 停留 1.2 秒让用户看清这个葡文，然后进入详情页
        setTimeout(() => {
            showDetails();
        }, 1200);
    }
}

// 主动看答案
btnShowAnswer.addEventListener('click', () => {
    // 算作不会，塞入队尾复习
    const failedWord = portugueseVocabulary.splice(currentIndex, 1)[0];
    portugueseVocabulary.push(failedWord);
    currentIndex--;
    showDetails();
});

// 进入详情页 (展示音标、例句、词组)
function showDetails() {
    const currentWord = portugueseVocabulary[currentIndex < 0 ? 0 : currentIndex]; // 防止负数越界
    
    // 填充顶部详情
    elWordPhoneticText.innerText = currentWord.phonetic;
    elWordPos.innerText = currentWord.pos;
    elWordZhTitle.innerText = currentWord.zh;
    elWordHeaderDetails.classList.remove('hidden');

    // 填充例句
    elExamplePt.innerText = currentWord.example.pt;
    elExampleZh.innerText = currentWord.example.zh;

    // 填充词组搭配
    phrasesContainer.innerHTML = ''; // 清空旧数据
    if (currentWord.phrases && currentWord.phrases.length > 0) {
        currentWord.phrases.forEach(phrase => {
            const parts = phrase.split(' '); // 简单拆分葡文和中文(假设数据用空格分隔了中文)
            // 简单处理：找到第一个中文字符的索引
            const zhIndex = phrase.search(/[\u4e00-\u9fa5]/); 
            const ptPart = zhIndex > 0 ? phrase.substring(0, zhIndex).trim() : phrase;
            const zhPart = zhIndex > 0 ? phrase.substring(zhIndex).trim() : '';

            phrasesContainer.innerHTML += `
                <div class="phrase-item">
                    <p class="phrase-pt">${ptPart}</p>
                    <p class="phrase-zh">${zhPart}</p>
                </div>
            `;
        });
        phrasesContainer.style.display = 'block';
    } else {
        phrasesContainer.style.display = 'none';
    }

    // 切换界面显示
    quizArea.classList.add('hidden');
    detailArea.classList.remove('hidden');
    btnShowAnswer.classList.add('hidden');
    btnNext.classList.remove('hidden');
}

// 下一个单词
btnNext.addEventListener('click', () => {
    currentIndex++;
    loadWord();
});
