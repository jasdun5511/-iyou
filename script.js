// 你专属的葡文词汇库 (结合了一些学校、理科和开发相关的词汇)
const portugueseVocabulary = [
    { pt: "escola", zh: "学校", example: "Eu vou para a escola todos os dias. (我每天去学校。)" },
    { pt: "física", zh: "物理", example: "A prova de física é muito difícil. (物理考试很难。)" },
    { pt: "computador", zh: "电脑", example: "Eu uso o computador para programar. (我用电脑编程。)" },
    { pt: "desenvolvimento", zh: "开发 / 发展", example: "Estudo desenvolvimento de jogos. (我学习游戏开发。)" },
    { pt: "obrigado", zh: "谢谢 (男性说)", example: "Muito obrigado pela sua ajuda. (非常感谢你的帮助。)" }
];

let currentIndex = 0;

// 获取 DOM 元素
const homeView = document.getElementById('home-view');
const learningView = document.getElementById('learning-view');
const btnLearn = document.getElementById('btn-learn');
const btnBack = document.getElementById('btn-back');

// 卡片内元素
const flashcard = document.getElementById('flashcard');
const wordDetails = document.getElementById('word-details');
const elWordPt = document.getElementById('word-pt');
const elWordZh = document.getElementById('word-zh');
const elWordExample = document.getElementById('word-example');

// 底部按钮
const btnKnown = document.getElementById('btn-known');
const btnUnknown = document.getElementById('btn-unknown');

// 初始化首页数据
document.getElementById('learn-count').innerText = portugueseVocabulary.length;

// --- 视图切换逻辑 ---
btnLearn.addEventListener('click', () => {
    if (portugueseVocabulary.length === 0) return;
    homeView.classList.remove('active');
    homeView.classList.add('hidden');
    learningView.classList.remove('hidden');
    learningView.classList.add('active');
    loadWord();
});

btnBack.addEventListener('click', () => {
    learningView.classList.remove('active');
    learningView.classList.add('hidden');
    homeView.classList.remove('hidden');
    homeView.classList.add('active');
});

// --- 背单词逻辑 ---
function loadWord() {
    if (currentIndex >= portugueseVocabulary.length) {
        alert("恭喜！今天的单词已经背完了！");
        btnBack.click(); // 自动返回主页
        currentIndex = 0; // 重置进度
        return;
    }

    const currentWord = portugueseVocabulary[currentIndex];
    elWordPt.innerText = currentWord.pt;
    elWordZh.innerText = currentWord.zh;
    elWordExample.innerText = currentWord.example;
    
    // 每次加载新词时，隐藏中文和例句
    wordDetails.classList.remove('details-visible');
    wordDetails.classList.add('details-hidden');
}

// 点击卡片翻转（显示/隐藏详情）
flashcard.addEventListener('click', () => {
    if (wordDetails.classList.contains('details-hidden')) {
        wordDetails.classList.remove('details-hidden');
        wordDetails.classList.add('details-visible');
    } else {
        wordDetails.classList.remove('details-visible');
        wordDetails.classList.add('details-hidden');
    }
});

// 认识 / 不认识 按钮逻辑
btnKnown.addEventListener('click', () => {
    // 这里未来可以加入复杂的记忆算法，目前直接进入下一个
    currentIndex++;
    loadWord();
});

btnUnknown.addEventListener('click', () => {
    // 不认识的词，可以让它在最后再出现一次
    const failedWord = portugueseVocabulary.splice(currentIndex, 1)[0];
    portugueseVocabulary.push(failedWord);
    loadWord();
});
