// ================= Tab 菜单切换逻辑 =================
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
    
    // 如果没有数据，让文字在固定高度的容器中完美垂直居中
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
        } 
        else {
            els.tabContent.innerHTML += `<div class="phrase-item"><p class="phrase-en">${item}</p></div>`;
        }
    });
}
