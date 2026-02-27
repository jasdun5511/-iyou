// 这里预留给你未来填入葡文词汇
// 数据格式示例：{ pt: 'olá', zh: '你好', example: 'Olá, como você está?' }
const portugueseVocabulary = [
    { pt: "obrigado", zh: "谢谢" },
    { pt: "por favor", zh: "请" },
    // 你可以继续往这里添加...
];

// 获取 DOM 元素
const btnLearn = document.getElementById('btn-learn');
const btnReview = document.getElementById('btn-review');

// 添加点击事件
btnLearn.addEventListener('click', () => {
    // 这里未来可以编写跳转到学习界面的逻辑
    // 比如隐藏当前主界面，显示背单词的 UI
    alert('准备开始学习葡文啦！你目前有 ' + portugueseVocabulary.length + ' 个单词。');
});

btnReview.addEventListener('click', () => {
    if (document.querySelector('#btn-review .count').innerText === '0') {
        alert('今天还没有需要复习的单词哦，干得漂亮！');
    } else {
        alert('进入复习模式！');
    }
});
