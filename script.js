// --- 游戏配置 ---
const GRID_SIZE = 8; // 棋盘尺寸：8x8
const NUM_TYPES = 5; // 方块类型数量（1到NUM_TYPES）
const BOARD_WRAPPER = document.getElementById('game-board-wrapper'); // 新增：用于包裹棋盘的 div
const BOARD = document.getElementById('game-board');
const SCORE_DISPLAY = document.getElementById('score');
const HINT_DISPLAY = document.getElementById('hint');
const BGM_AUDIO = document.getElementById('bgMusic');
const MUSIC_TOGGLE_BUTTON = document.getElementById('musicToggle');

// Font Awesome 宝石图标列表
const GEM_ICONS = [
    'fas fa-gem',         // 默认宝石
    'fas fa-star',        // 星星
    'fas fa-heart',       // 心形
    'fas fa-moon',        // 月亮
    'fas fa-sun',         // 太阳
    'fas fa-crown'        // 皇冠 (如果 NUM_TYPES > 5)
];

// 游戏状态变量
let gameBoard = []; // 二维数组表示棋盘数据
let score = 0;
let firstSelectedSquare = null; // 存储第一个被点击的方块
let isProcessing = false; // 防止在动画期间重复点击

// 音乐播放状态
let isMusicPlaying = false;

// 设置 CSS Grid 的列数
BOARD.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;

// --- 核心函数：创建方块 ---

/**
 * 随机生成一个方块类型（1到NUM_TYPES）
 * @returns {number} 方块类型
 */
function getRandomType() {
    return Math.floor(Math.random() * NUM_TYPES) + 1;
}

/**
 * 创建一个方块的 HTML 元素
 * @param {number} type 方块类型
 * @param {number} row 行索引
 * @param {number} col 列索引
 * @returns {HTMLElement} 方块 div 元素
 */
function createSquareElement(type, row, col) {
    const square = document.createElement('div');
    square.classList.add('square', `type-${type}`);
    
    // 使用 Font Awesome 图标代替数字
    const icon = document.createElement('i');
    icon.className = GEM_ICONS[type - 1] || GEM_ICONS[0]; // 根据类型选择图标，或使用默认
    square.appendChild(icon);

    square.dataset.row = row;
    square.dataset.col = col;
    square.addEventListener('click', handleSquareClick);
    return square;
}

// --- 核心函数：初始化棋盘 ---

/**
 * 填充初始棋盘，确保没有立即消除的组合
 */
function initializeBoard() {
    gameBoard = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        gameBoard[r] = [];
        for (let c = 0; c < GRID_SIZE; c++) {
            let type;
            do {
                type = getRandomType();
                // 确保新的方块不会立即与左边两个或上面两个形成消除
            } while (isMatchAt(r, c, type));
            gameBoard[r][c] = type;
        }
    }
    drawBoard();
    updateScore(0);
    HINT_DISPLAY.textContent = '点击两个相邻宝石进行交换';
}

/**
 * 检查在 (r, c) 位置放入指定 type 的方块是否会立即形成三消
 * (只检查左边和上面，因为其他方向还未填充)
 * @param {number} r - 行索引
 * @param {number} c - 列索引
 * @param {number} type - 要检查的方块类型
 * @returns {boolean} 是否会形成消除
 */
function isMatchAt(r, c, type) {
    // 检查横向（左边）
    if (c >= 2 && gameBoard[r][c-1] === type && gameBoard[r][c-2] === type) {
        return true;
    }
    // 检查纵向（上面）
    if (r >= 2 && gameBoard[r-1][c] === type && gameBoard[r-2][c] === type) {
        return true;
    }
    return false;
}


// --- 核心函数：渲染棋盘 ---

/**
 * 根据 gameBoard 数组更新 DOM 界面
 */
function drawBoard() {
    BOARD.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const type = gameBoard[r][c];
            const square = createSquareElement(type, r, c);
            BOARD.appendChild(square);
        }
    }
}

// --- 核心函数：点击处理 ---

/**
 * 处理方块点击事件
 * @param {Event} event 
 */
async function handleSquareClick(event) {
    if (isProcessing) return; // 如果正在处理，忽略点击

    const square = event.currentTarget; // 使用 currentTarget 获取绑定事件的元素
    
    // 首次点击
    if (!firstSelectedSquare) {
        firstSelectedSquare = square;
        square.classList.add('selected');
        HINT_DISPLAY.textContent = '已选中第一个宝石，请点击相邻的第二个。';
        return;
    }

    // 第二次点击（点击的是同一个方块）
    if (firstSelectedSquare === square) {
        firstSelectedSquare.classList.remove('selected');
        firstSelectedSquare = null;
        HINT_DISPLAY.textContent = '点击两个相邻宝石进行交换。';
        return;
    }

    // 第二次点击（点击的是相邻的方块）
    if (areAdjacent(firstSelectedSquare, square)) {
        isProcessing = true; // 开始处理，锁定点击
        firstSelectedSquare.classList.remove('selected');
        
        // 1. 模拟视觉交换动画 (可以添加CSS动画)
        await animateSwap(firstSelectedSquare, square);

        // 2. 交换 gameBoard 数组中的数据
        swapGameData(firstSelectedSquare, square);
        
        // 3. 检查交换后是否有消除
        const hasMatch = await processMatches();

        if (!hasMatch) {
            HINT_DISPLAY.textContent = '没有消除，正在撤销交换...';
            // 如果没有消除，撤销交换 (数据和视觉)
            await animateSwap(square, firstSelectedSquare); // 动画换回
            swapGameData(square, firstSelectedSquare); // 数据换回
            HINT_DISPLAY.textContent = '没有消除，请尝试其他组合。';
        }

        firstSelectedSquare = null;
        isProcessing = false; // 处理完毕，解锁点击
        HINT_DISPLAY.textContent = '点击两个相邻宝石进行交换';

    } else {
        // 第二次点击（点击的不是相邻方块）
        firstSelectedSquare.classList.remove('selected');
        firstSelectedSelectedSquare = square; // 将新的方块设为第一个选中
        square.classList.add('selected');
        HINT_DISPLAY.textContent = '请点击一个**相邻**的宝石！';
    }
}

/**
 * 检查两个方块是否相邻
 * @param {HTMLElement} s1 
 * @param {HTMLElement} s2 
 * @returns {boolean}
 */
function areAdjacent(s1, s2) {
    const r1 = parseInt(s1.dataset.row);
    const c1 = parseInt(s1.dataset.col);
    const r2 = parseInt(s2.dataset.row);
    const c2 = parseInt(s2.dataset.col);

    const rowDiff = Math.abs(r1 - r2);
    const colDiff = Math.abs(c1 - c2);

    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * 交换两个方块在 gameBoard 数组中的数据
 * @param {HTMLElement} s1 
 * @param {HTMLElement} s2 
 */
function swapGameData(s1, s2) {
    const r1 = parseInt(s1.dataset.row);
    const c1 = parseInt(s1.dataset.col);
    const r2 = parseInt(s2.dataset.row);
    const c2 = parseInt(s2.dataset.col);

    // 交换 gameBoard 数组中的数据
    [gameBoard[r1][c1], gameBoard[r2][c2]] = [gameBoard[r2][c2], gameBoard[r1][c1]];
}

/**
 * 模拟方块交换的视觉动画
 * @param {HTMLElement} s1 
 * @param {HTMLElement} s2 
 * @returns {Promise<void>}
 */
async function animateSwap(s1, s2) {
    const r1 = parseInt(s1.dataset.row);
    const c1 = parseInt(s1.dataset.col);
    const r2 = parseInt(s2.dataset.row);
    const c2 = parseInt(s2.dataset.col);

    // 计算移动距离 (单位 vw 或 vh 避免硬编码像素值)
    // 这里我们直接用 CSS Grid 的相对位置来处理
    const s1Rect = s1.getBoundingClientRect();
    const s2Rect = s2.getBoundingClientRect();
    const dx = s2Rect.left - s1Rect.left;
    const dy = s2Rect.top - s1Rect.top;

    s1.style.transform = `translate(${dx}px, ${dy}px)`;
    s2.style.transform = `translate(${-dx}px, ${-dy}px)`;

    await new Promise(resolve => setTimeout(() => {
        s1.style.transform = ''; // 清除 transform
        s2.style.transform = ''; // 清除 transform
        // 立即更新 DOM 以匹配 gameBoard 的新状态，否则会导致视觉错乱
        updateSquareDOM(s1, gameBoard[r1][c1]); // 更新s1的外观到它现在的数据
        updateSquareDOM(s2, gameBoard[r2][c2]); // 更新s2的外观到它现在的数据
        resolve();
    }, 200)); // 动画持续时间
}

/**
 * 根据新的方块类型更新 DOM 元素的外观
 * @param {HTMLElement} squareElement 
 * @param {number} newType 
 */
function updateSquareDOM(squareElement, newType) {
    // 移除所有旧的 type-X 类
    squareElement.className = 'square'; 
    // 添加新的 type-X 类
    squareElement.classList.add(`type-${newType}`);
    // 更新图标
    squareElement.innerHTML = '';
    const icon = document.createElement('i');
    icon.className = GEM_ICONS[newType - 1] || GEM_ICONS[0];
    squareElement.appendChild(icon);
}


// --- 核心函数：消除逻辑 ---

/**
 * 查找并处理棋盘上的所有消除组合
 * @returns {Promise<boolean>} 是否有消除发生
 */
async function processMatches() {
    let matchesFoundInLoop = false; // 本轮循环是否有消除
    let totalMatchesFound = false; // 整个过程是否有消除

    // 循环直到没有新的消除
    do {
        matchesFoundInLoop = false;
        
        // 1. 查找所有消除组合
        const matchedSquares = findMatches();

        if (matchedSquares.length > 0) {
            matchesFoundInLoop = true;
            totalMatchesFound = true; // 只要有一次消除，就设为 true
            HINT_DISPLAY.textContent = `发现 ${matchedSquares.length} 个宝石被消除！`;
            
            // 2. 视觉移除被消除的方块 (添加消失动画)
            await animateRemoveMatches(matchedSquares);
            
            // 3. 更新得分
            updateScore(score + matchedSquares.length * 10);
            
            // 4. 数据移除被消除的方块 (设为 0)
            removeMatchesData(matchedSquares);

            // 5. 下落和填充
            await dropAndFill();
            
            drawBoard(); // 重新渲染棋盘
            
            // 等待一段时间让新的方块稳定下来，如果立刻又消除，会接着处理
            await new Promise(resolve => setTimeout(resolve, 300));

        }
    } while (matchesFoundInLoop); // 如果有消除，继续循环检查新的连锁消除

    return totalMatchesFound;
}

/**
 * 查找棋盘上所有横向或纵向的 3 个或更多相同的方块
 * @returns {Array<{row: number, col: number}>} 所有需要消除的方块坐标
 */
function findMatches() {
    const matches = new Set(); // 使用 Set 确保坐标唯一

    // 检查所有横向组合
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c <= GRID_SIZE - 3; c++) {
            const type = gameBoard[r][c];
            if (type === 0) continue; // 跳过空位

            if (type === gameBoard[r][c+1] && type === gameBoard[r][c+2]) {
                // 找到一个三消组合
                for (let k = 0; k < GRID_SIZE; k++) { // 扩展查找所有连续的相同方块
                    if (c + k < GRID_SIZE && gameBoard[r][c+k] === type) {
                        matches.add(`${r},${c+k}`);
                    } else {
                        break;
                    }
                }
            }
        }
    }

    // 检查所有纵向组合
    for (let c = 0; c < GRID_SIZE; c++) {
        for (let r = 0; r <= GRID_SIZE - 3; r++) {
            const type = gameBoard[r][c];
            if (type === 0) continue; // 跳过空位

            if (type === gameBoard[r+1][c] && type === gameBoard[r+2][c]) {
                // 找到一个三消组合
                for (let k = 0; k < GRID_SIZE; k++) { // 扩展查找所有连续的相同方块
                    if (r + k < GRID_SIZE && gameBoard[r+k][c] === type) {
                        matches.add(`${r+k},${c}`);
                    } else {
                        break;
                    }
                }
            }
        }
    }
    
    // 将 Set 转换为坐标对象的数组
    const result = Array.from(matches).map(coord => {
        const [r, c] = coord.split(',').map(Number);
        return {row: r, col: c};
    });

    return result;
}

/**
 * 播放消除动画并移除 DOM 元素
 * @param {Array<{row: number, col: number}>} matchedSquares 
 * @returns {Promise<void>}
 */
async function animateRemoveMatches(matchedSquares) {
    const promises = matchedSquares.map(({row, col}) => {
        const squareElement = BOARD.children[row * GRID_SIZE + col];
        if (squareElement) {
            squareElement.classList.add('fade-out'); // 添加消失动画类
            return new Promise(resolve => setTimeout(() => {
                squareElement.remove(); // 动画结束后移除 DOM
                resolve();
            }, 300)); // 动画持续时间
        }
        return Promise.resolve();
    });
    await Promise.all(promises);
}


/**
 * 将匹配到的方块在 gameBoard 数组中标记为“空”（用 0 表示）
 * @param {Array<{row: number, col: number}>} matchedSquares 
 */
function removeMatchesData(matchedSquares) {
    matchedSquares.forEach(({row, col}) => {
        gameBoard[row][col] = 0; 
    });
}

/**
 * 处理方块下落和新方块填充
 * @returns {Promise<void>}
 */
async function dropAndFill() {
    // 1. 处理下落
    for (let c = 0; c < GRID_SIZE; c++) {
        let emptyCount = 0;
        // 从底部向上遍历
        for (let r = GRID_SIZE - 1; r >= 0; r--) {
            if (gameBoard[r][c] === 0) {
                emptyCount++; // 发现空位
            } else if (emptyCount > 0) {
                // 如果当前方块上方有空位，则让它下落
                gameBoard[r + emptyCount][c] = gameBoard[r][c];
                gameBoard[r][c] = 0; // 原位置设为空

                // 尝试添加下落动画 (可选，比较复杂，这里只做简单更新)
                // const oldSquareElement = BOARD.children[r * GRID_SIZE + c];
                // const newSquareElement = BOARD.children[(r + emptyCount) * GRID_SIZE + c];
                // if (oldSquareElement && newSquareElement) {
                //     oldSquareElement.classList.add('dropping');
                //     // 实际动画逻辑需要更复杂的位置计算和 CSS transform
                // }
            }
        }
    }

    // 2. 填充顶部空位
    for (let c = 0; c < GRID_SIZE; c++) {
        for (let r = 0; r < GRID_SIZE; r++) {
            if (gameBoard[r][c] === 0) {
                // 在顶部空位生成新的随机方块
                gameBoard[r][c] = getRandomType();
            }
        }
    }
    await new Promise(resolve => setTimeout(resolve, 200)); // 模拟下落时间
}

// --- 实用函数 ---

/**
 * 更新并显示得分
 * @param {number} newScore 
 */
function updateScore(newScore) {
    score = newScore;
    SCORE_DISPLAY.textContent = score;
}

// --- 音乐控制 ---
MUSIC_TOGGLE_BUTTON.addEventListener('click', () => {
    if (isMusicPlaying) {
        BGM_AUDIO.pause();
        MUSIC_TOGGLE_BUTTON.textContent = '🎶 开启音乐';
    } else {
        BGM_AUDIO.play();
        MUSIC_TOGGLE_BUTTON.textContent = '🔇 关闭音乐';
    }
    isMusicPlaying = !isMusicPlaying;
});

// 首次用户交互后尝试播放音乐
document.addEventListener('DOMContentLoaded', () => {
    // 自动播放通常需要用户交互，所以先暂停，等待用户点击按钮
    BGM_AUDIO.pause();
    BGM_AUDIO.volume = 0.3; // 设置音量
});


// --- 启动游戏 ---
initializeBoard();

