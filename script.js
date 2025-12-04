// --- 游戏配置 ---
const GRID_SIZE = 8; // 棋盘尺寸：8x8
const NUM_TYPES = 5; // 方块类型数量（1到5）
const BOARD = document.getElementById('game-board');
const SCORE_DISPLAY = document.getElementById('score');
const HINT_DISPLAY = document.getElementById('hint');

// 游戏状态变量
let gameBoard = []; // 二维数组表示棋盘数据
let score = 0;
let firstSelectedSquare = null; // 存储第一个被点击的方块

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
    // 使用方块类型作为显示内容，方便调试
    square.textContent = type; 
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
function handleSquareClick(event) {
    const square = event.target;
    
    // 首次点击
    if (!firstSelectedSquare) {
        firstSelectedSquare = square;
        square.classList.add('selected');
        HINT_DISPLAY.textContent = '已选中第一个，请点击相邻的第二个方块进行交换。';
        return;
    }

    // 第二次点击（点击的是同一个方块）
    if (firstSelectedSquare === square) {
        firstSelectedSquare.classList.remove('selected');
        firstSelectedSquare = null;
        HINT_DISPLAY.textContent = '点击并拖动两个相邻方块进行交换。';
        return;
    }

    // 第二次点击（点击的是相邻的方块）
    if (areAdjacent(firstSelectedSquare, square)) {
        // 移除选中状态
        firstSelectedSquare.classList.remove('selected');
        
        // 执行交换
        swapSquares(firstSelectedSquare, square);
        
        // 清除选中状态，等待动画完成（使用 setTimeout 模拟等待）
        firstSelectedSquare = null;
        HINT_DISPLAY.textContent = '正在检查消除...';
        
        // 延迟执行消除逻辑，让玩家看到交换动作
        setTimeout(processMatches, 300);

    } else {
        // 第二次点击（点击的不是相邻方块）
        firstSelectedSquare.classList.remove('selected');
        firstSelectedSquare = square; // 将新的方块设为第一个选中
        square.classList.add('selected');
        HINT_DISPLAY.textContent = '请点击一个**相邻**的方块！';
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

    // 必须是行差为1或列差为1，且另一个差为0 (上下左右相邻)
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * 交换两个方块的数据和视觉位置
 * @param {HTMLElement} s1 
 * @param {HTMLElement} s2 
 */
function swapSquares(s1, s2) {
    const r1 = parseInt(s1.dataset.row);
    const c1 = parseInt(s1.dataset.col);
    const r2 = parseInt(s2.dataset.row);
    const c2 = parseInt(s2.dataset.col);

    // 1. 交换 gameBoard 数组中的数据
    [gameBoard[r1][c1], gameBoard[r2][c2]] = [gameBoard[r2][c2], gameBoard[r1][c1]];

    // 2. 交换 DOM 元素中的类名和文本内容，模拟视觉交换
    const type1 = gameBoard[r1][c1];
    const type2 = gameBoard[r2][c2];

    s1.classList.remove(`type-${type2}`);
    s1.classList.add(`type-${type1}`);
    s1.textContent = type1;

    s2.classList.remove(`type-${type1}`);
    s2.classList.add(`type-${type2}`);
    s2.textContent = type2;
    
    // 注意：这里没有真正交换 DOM 元素的位置，而是原地修改了样式。
    // 如果需要更复杂的动画，可能需要使用 CSS transform 或更高级的库。
}


// --- 核心函数：消除逻辑 ---

/**
 * 查找并处理棋盘上的所有消除组合
 */
async function processMatches() {
    let matchesFound = false;

    // 循环直到没有新的消除
    do {
        matchesFound = false;
        
        // 1. 查找所有消除组合
        const matchedSquares = findMatches();

        if (matchedSquares.length > 0) {
            matchesFound = true;
            HINT_DISPLAY.textContent = `发现 ${matchedSquares.length} 个方块被消除！`;
            
            // 2. 移除被消除的方块
            removeMatches(matchedSquares);
            
            // 3. 更新得分
            updateScore(score + matchedSquares.length * 10);
            
            // 等待一段时间让玩家看到消除动画/效果（模拟）
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 4. 下落和填充
            dropAndFill();
            
            // 等待下落和填充动画（模拟）
            await new Promise(resolve => setTimeout(resolve, 500));
            
            drawBoard(); // 重新渲染棋盘
        }
    } while (matchesFound); // 如果有消除，继续循环检查新的连锁消除

    // 如果没有发现任何消除，则这次交换是无效的，需要将方块换回去
    // 简便起见，本例中只要交换成功，即使没有消除也不换回。
    // 在真实游戏中，如果交换后没有消除，需要撤销交换。
    
    HINT_DISPLAY.textContent = '点击并拖动两个相邻方块进行交换。';
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
                for (let k = 0; k < GRID_SIZE; k++) {
                    if (gameBoard[r][c+k] === type) {
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
                for (let k = 0; k < GRID_SIZE; k++) {
                    if (gameBoard[r+k][c] === type) {
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
 * 将匹配到的方块在 gameBoard 数组中标记为“空”（用 0 表示）
 * @param {Array<{row: number, col: number}>} matchedSquares 
 */
function removeMatches(matchedSquares) {
    matchedSquares.forEach(({row, col}) => {
        // 将方块类型设为 0 表示空位
        gameBoard[row][col] = 0; 
    });
}

/**
 * 处理方块下落和新方块填充
 */
function dropAndFill() {
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

// --- 启动游戏 ---
initializeBoard();