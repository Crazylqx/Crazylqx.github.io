const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const gameTitle = document.getElementById('game-title');
const gameMessage = document.getElementById('game-message');

// 定义每一格的大小
const gridSize = 20;

// 定义画布的尺寸
const gridWidth = 32;
const gridHeight = 20;
const canvasWidth = gridWidth * gridSize;
const canvasHeight = gridHeight * gridSize;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

const fps = 60;
const speed = 0.75;
const gravity = speed * speed * 1000 / fps / fps; // 1000 px/s^2
const jumpSpeed = speed * 320 / fps;    // 320 px/s
const xSpeed = speed * 100 / fps;       // 100 px/s

const maxScore = 520;
const scorePerPipe = 20;

const pipeGridXGap = 10;
const pipeXGap = pipeGridXGap * gridSize;
const pipeGridYGap = 6;

const pipesPerTreasure = 5;

// 信息
const hintMessage = '空格 / 单击：使飞机上升\nEsc：暂停\nR：重新开始';
const levelCompleteMessage = 'The game is cleared, but my love will forever go on...';
const retryMessage = '再来一次';

const gameOverMessage = [
    { score: 0, message: '你怎么开局就寄了_(:з」∠)_' },
    { score: 100, message: '就这？(╯°口°)╯︵ ┻━┻' },
    { score: 200, message: '你真菜(￢_￢)' },
    { score: 300, message: '有待提高啊...╮（￣▽￣）╭' },
    { score: 400, message: '别气馁，再接再厉(ง •̀_•́)ง' },
    { score: maxScore, message: '可惜，就差一点点(๑•̀ㅂ•́)و✧' },
];

const gameOverHint = 'press R to retry';

const missTreasureMessage = 'Uh oh! 你错过了什么～';

const treasureMessage = [
    '偷偷告诉你，我喜欢你呀♡',
    '送给你小心心 q(・ω< )ﾉ♥',
    '在想我吗？我也是(๑• . •๑)',
    '游戏可能是虚拟的，但是我的心是真的',
    '愿你像这飞机一样，越过阻碍，扶摇直上',
]


const heartImage = new Image();
const aircraftImage = new Image();
const backgroundImage = new Image();
const brickImage = new Image();

const player = {
    x: canvasWidth / 2,  // 初始 x 坐标 (在画布中间，并对齐到网格)
    y: canvasHeight / 2, // 初始 y 坐标 (在画布中间，并对齐到网格)
    size: gridSize,      // 方块的大小
    colorIndex: 0,
    yspeed: 0,
};

const pipes = [];
const treasures = [];

var updateTimer = null;
var nextPipeTime = 0;
var leftPipesForNextTreasure = pipesPerTreasure;
var isGameOver = false;
var score = 0;
var pipeCount = 0;
var treasureCount = 0;

var unloadedCount = 0;

function onResourceLoaded() {
    unloadedCount--;
    if (unloadedCount == 0) {
        onLoaded();
    }
}

function loadResources() {
    unloadedCount++;
    heartImage.src = 'img/heart.png';
    heartImage.onload = onResourceLoaded;
    unloadedCount++;
    aircraftImage.src = 'img/aircraft.png';
    aircraftImage.onload = onResourceLoaded;
    unloadedCount++;
    backgroundImage.src = 'img/background.png';
    backgroundImage.onload = onResourceLoaded;
    unloadedCount++;
    brickImage.src = 'img/brick.png';
    brickImage.onload = onResourceLoaded;
    unloadedCount++;
    document.fonts.ready.then(onResourceLoaded);
    unloadedCount++;
    window.onload = onResourceLoaded;
}

function resetGame() {
    if (updateTimer) {
        clearInterval(updateTimer);
        updateTimer = null;
    }
    nextPipeTime = 0;
    isGameOver = false;
    score = 0;
    pipeCount = 0;
    pipes.length = 0;
    treasureCount = 0;
    treasures.length = 0;
    player.x = canvasWidth / 2;
    player.y = canvasHeight / 2;
    player.yspeed = 0;
    gameMessage.innerText = retryMessage;
}

function createPipe() {
    if (pipeCount * scorePerPipe >= maxScore) {
        return;
    }
    const pipe = {
        x: canvasWidth,
        gridY: Math.floor(Math.random() * (gridHeight - pipeGridYGap)),
        colorIndex: Math.floor(Math.random() * 4 + 1),
        passed: false,
    }
    pipes.push(pipe);
    pipeCount++;
}

function createTreasure() {
    if (treasureCount >= treasureMessage.length) {
        return;
    }
    const treasure = {
        x: canvasWidth + pipeXGap / 2,
        gridY: Math.floor(Math.random() * (gridHeight - 1)) + 1,
        message: treasureMessage[treasureCount],
        passed: false,
    }
    treasures.push(treasure);
    treasureCount++;
}


function updatePlayer() {
    // 更新位置
    player.y += player.yspeed;
    if (player.y >= canvasHeight) {
        player.y = canvasHeight;
        player.yspeed = 0;
        if (score < maxScore) {
            gameOver();
        }
    } else if (player.y <= 0) {
        player.y = 0;
        player.yspeed = 0;
    }
    // 更新速度
    player.yspeed += gravity;
    if (score >= maxScore) {
        player.yspeed = (canvasHeight / 2 - player.y) / fps;
    }
}

function levelComplete() {
    gameMessage.innerText = levelCompleteMessage;
}

function updateScore(increment) {
    score += increment;
    document.getElementById('game-score').innerText = `Score: ${score}`;
    if (score == maxScore) {
        levelComplete();
    }
}

function onTreasure(message) {
    gameMessage.innerText = message;
}

function updatePipes() {
    for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i];
        pipe.x -= xSpeed;
        if (!pipe.passed && pipe.x + gridSize < player.x) {
            pipe.passed = true;
            updateScore(scorePerPipe);
        }
        if (pipe.x + gridSize < 0) {
            pipes.splice(i, 1);
        }
    }
    if (nextPipeTime < 0) {
        createPipe();
        nextPipeTime = pipeXGap / xSpeed;
        leftPipesForNextTreasure--;
        if (leftPipesForNextTreasure <= 0) {
            createTreasure();
            leftPipesForNextTreasure = pipesPerTreasure;
        }
    }
    nextPipeTime -= 1;
}

function updateTreasures() {
    for (let i = 0; i < treasures.length; i++) {
        const treasure = treasures[i];
        treasure.x -= xSpeed;
        if (!treasure.passed && treasure.x + gridSize < player.x) {
            treasure.passed = true;
            gameMessage.innerText = missTreasureMessage;
        }
        if (treasure.x + gridSize < 0) {
            treasures.splice(i, 1);
        }
    }
}

function hitPipeDetection(pipe) {
    if (player.x + player.size < pipe.x) {
        return false;
    }
    if (player.x > pipe.x + gridSize) {
        return false;
    }
    if (player.y < pipe.gridY * gridSize) {
        return true;
    }
    if (player.y + player.size > (pipe.gridY + pipeGridYGap) * gridSize) {
        return true;
    }
    return false;
}

function hitDetection() {
    for (let i = 0; i < pipes.length; i++) {
        if (hitPipeDetection(pipes[i])) {
            return true;
        }
    }
    return false;
}

function hitTreasureDetection(treasure) {
    if (player.x + player.size < treasure.x) {
        return false;
    }
    if (player.x > treasure.x + gridSize) {
        return false;
    }
    return player.y >= (treasure.gridY - 1) * gridSize && player.y + player.size <= (treasure.gridY + 1) * gridSize;
}

function treasureDetection() {
    for (let i = 0; i < treasures.length; i++) {
        if (hitTreasureDetection(treasures[i])) {
            onTreasure(treasures[i].message);
            treasures.splice(i, 1);
            return true;
        }
    }
    return false;
}

// 绘制一列方块
function drawColumn(x, y, height, colorIndex) {
    for (let i = 0; i < height; i++) {
        ctx.drawImage(brickImage, x, y + i * gridSize);
    }
}

function drawPlayer() {
    const width = aircraftImage.width / aircraftImage.height * gridSize;
    ctx.drawImage(aircraftImage, player.x, player.y, width, gridSize);
}

function drawPipe(x, gridY, colorIndex) {
    drawColumn(x, 0, gridY, colorIndex);
    drawColumn(x, (gridY + pipeGridYGap) * gridSize, (gridHeight - gridY - pipeGridYGap), colorIndex);
}

function drawPipes() {
    for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i];
        drawPipe(pipe.x, pipe.gridY, pipe.colorIndex);
    }
}

function drawTreasure(x, gridY) {
    ctx.drawImage(heartImage, x, gridY * gridSize);
}

function drawTreasures() {
    for (let i = 0; i < treasures.length; i++) {
        const treasure = treasures[i];
        drawTreasure(treasure.x, treasure.gridY);
    }
}
function drawGameOver() {
    const rectWidth = 320;
    const rectHeight = 54;
    ctx.fillStyle = 'red';
    ctx.fillRect(canvasWidth / 2 - rectWidth / 2, canvasHeight / 2 - rectHeight / 2, rectWidth, rectHeight);
    ctx.fillStyle = 'white';
    ctx.font = '36px fusion-pixel';
    ctx.textAlign = 'center';
    ctx.fillText(gameOverHint, canvasWidth / 2, canvasHeight / 2 + 9);
}


// 清除画布并重新绘制所有内容的函数
function redrawCanvas() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);
    drawPipes();
    drawTreasures();
    drawPlayer();
    if (isGameOver) {
        drawGameOver();
    }
}


function gameOver() {
    isGameOver = true;
    clearInterval(updateTimer);
    updateTimer = null;
    const message = gameOverMessage.find(item => score <= item.score);
    gameMessage.innerText = message.message;
    drawGameOver();
}

// 定时更新
function update() {
    updatePipes();
    updateTreasures();
    updatePlayer();
    redrawCanvas();
    if (hitDetection()) {
        gameOver();
    }
    treasureDetection();
}

function upUp() {
    if (updateTimer) {
        player.yspeed = -jumpSpeed;
    } else if (!isGameOver) {
        updateTimer = setInterval(update, 1000 / fps);
    }
}

// 监听键盘按下事件
function onKeyDown(event) {
    // 阻止方向键的默认滚动行为
    if ([' ', 'Escape', 'r'].includes(event.key)) {
        event.preventDefault();
    }

    switch (event.key) {
        case ' ':
            upUp();
            break;
        case 'Escape':
            if (updateTimer) {
                clearInterval(updateTimer);
                updateTimer = null;
            } else if (!isGameOver) {
                updateTimer = setInterval(update, 1000 / fps);
            }
            break;
        case 'r':
            resetGame();
            break;
    }
    redrawCanvas(); // 每次按键后重新绘制画布
}

function onMouseDown(event) {
    if (event.button === 0) {
        upUp();
    }
}

function updateMessagePosition() {
    if (!gameTitle || !gameMessage || !canvas) return;

    const titleRect = gameTitle.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    const titleBottom = titleRect.bottom;
    const canvasTop = canvasRect.top;

    const messageCenterY = titleBottom + (canvasTop - titleBottom) / 2;

    gameMessage.style.top = `${messageCenterY}px`;
}

function onLoaded() {
    // 定时器
    updateTimer = null;

    gameMessage.innerText = hintMessage;

    // 监听键盘按下事件
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);

    updateMessagePosition(); // 初始调用
    window.addEventListener('resize', updateMessagePosition); // 窗口大小调整时更新

    // 初始绘制
    redrawCanvas();
}

loadResources();
