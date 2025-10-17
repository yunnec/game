const BOARD_SIZE = 8;
const TILE_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

const GAME_STATES = {
    IDLE: 'idle',
    SWAPPING: 'swapping',
    RESOLVING: 'resolving'
};

let board = [];
let score = 0;
let moves = 30;
let selectedTile = null;
let gameState = GAME_STATES.IDLE;
let comboCount = 0;

const gameBoard = document.getElementById('gameBoard');
const scoreElement = document.getElementById('score');
const movesElement = document.getElementById('moves');
const newGameBtn = document.getElementById('newGameBtn');
const resetBtn = document.getElementById('resetBtn');

let touchStartX = 0;
let touchStartY = 0;
let touchedTile = null;

function initializeGame() {
    board = [];
    score = 0;
    moves = 30;
    selectedTile = null;
    gameState = GAME_STATES.IDLE;
    comboCount = 0;
    
    const existingCombo = document.querySelector('.combo-indicator');
    if (existingCombo) {
        existingCombo.remove();
    }
    
    updateScore();
    updateMoves();
    createBoard();
    ensureNoInitialMatches();
    renderBoard();
}

function createBoard() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        board[row] = [];
        for (let col = 0; col < BOARD_SIZE; col++) {
            board[row][col] = getRandomColor();
        }
    }
}

function ensureNoInitialMatches() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            while (hasMatchAtPosition(row, col)) {
                board[row][col] = getRandomColor();
            }
        }
    }
}

function hasMatchAtPosition(row, col) {
    const color = board[row][col];
    
    let horizontalCount = 1;
    let c = col - 1;
    while (c >= 0 && board[row][c] === color) {
        horizontalCount++;
        c--;
    }
    c = col + 1;
    while (c < BOARD_SIZE && board[row][c] === color) {
        horizontalCount++;
        c++;
    }
    
    if (horizontalCount >= 3) return true;
    
    let verticalCount = 1;
    let r = row - 1;
    while (r >= 0 && board[r][col] === color) {
        verticalCount++;
        r--;
    }
    r = row + 1;
    while (r < BOARD_SIZE && board[r][col] === color) {
        verticalCount++;
        r++;
    }
    
    return verticalCount >= 3;
}

function renderBoard() {
    gameBoard.innerHTML = '';
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const color = board[row][col];
            const tile = createTile(color, row, col);
            gameBoard.appendChild(tile);
        }
    }
}

function createTile(color, row, col) {
    const tile = document.createElement('div');
    tile.className = `tile tile-${color}`;
    tile.dataset.row = row;
    tile.dataset.col = col;
    tile.dataset.color = color;
    
    tile.addEventListener('click', () => handleTileClick(tile, row, col));
    tile.addEventListener('touchstart', handleTouchStart, { passive: false });
    tile.addEventListener('touchmove', handleTouchMove, { passive: false });
    tile.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return tile;
}

function getRandomColor() {
    const randomIndex = Math.floor(Math.random() * TILE_COLORS.length);
    return TILE_COLORS[randomIndex];
}

function handleTileClick(tile, row, col) {
    if (moves <= 0 || gameState !== GAME_STATES.IDLE) {
        return;
    }
    
    if (!selectedTile) {
        selectedTile = { tile, row, col };
        tile.classList.add('selected');
    } else {
        if (selectedTile.tile === tile) {
            selectedTile.tile.classList.remove('selected');
            selectedTile = null;
        } else if (isAdjacent(selectedTile.row, selectedTile.col, row, col)) {
            gameState = GAME_STATES.SWAPPING;
            const tile1 = selectedTile;
            const tile2 = { tile, row, col };
            selectedTile.tile.classList.remove('selected');
            selectedTile = null;
            
            swapTiles(tile1, tile2);
        } else {
            selectedTile.tile.classList.remove('selected');
            selectedTile = { tile, row, col };
            tile.classList.add('selected');
        }
    }
}

function handleTouchStart(event) {
    if (gameState !== GAME_STATES.IDLE || moves <= 0) {
        return;
    }
    
    event.preventDefault();
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchedTile = event.target;
}

function handleTouchMove(event) {
    event.preventDefault();
}

function handleTouchEnd(event) {
    if (!touchedTile || gameState !== GAME_STATES.IDLE || moves <= 0) {
        touchedTile = null;
        return;
    }
    
    event.preventDefault();
    const touch = event.changedTouches[0];
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const threshold = 30;
    
    const row = parseInt(touchedTile.dataset.row);
    const col = parseInt(touchedTile.dataset.col);
    
    let targetRow = row;
    let targetCol = col;
    
    if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0 && col < BOARD_SIZE - 1) {
                targetCol = col + 1;
            } else if (deltaX < 0 && col > 0) {
                targetCol = col - 1;
            }
        } else {
            if (deltaY > 0 && row < BOARD_SIZE - 1) {
                targetRow = row + 1;
            } else if (deltaY < 0 && row > 0) {
                targetRow = row - 1;
            }
        }
        
        if (targetRow !== row || targetCol !== col) {
            gameState = GAME_STATES.SWAPPING;
            const targetTile = gameBoard.children[targetRow * BOARD_SIZE + targetCol];
            swapTiles(
                { tile: touchedTile, row, col },
                { tile: targetTile, row: targetRow, col: targetCol }
            );
        }
    }
    
    touchedTile = null;
}

function isAdjacent(row1, col1, row2, col2) {
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

function swapTiles(tile1, tile2) {
    tile1.tile.classList.add('swapping');
    tile2.tile.classList.add('swapping');
    tile1.tile.setAttribute('data-sound', 'swap');
    
    const tempColor = board[tile1.row][tile1.col];
    board[tile1.row][tile1.col] = board[tile2.row][tile2.col];
    board[tile2.row][tile2.col] = tempColor;
    
    tile1.tile.dataset.color = board[tile1.row][tile1.col];
    tile1.tile.className = `tile tile-${board[tile1.row][tile1.col]} swapping`;
    
    tile2.tile.dataset.color = board[tile2.row][tile2.col];
    tile2.tile.className = `tile tile-${board[tile2.row][tile2.col]} swapping`;
    
    setTimeout(() => {
        tile1.tile.classList.remove('swapping');
        tile2.tile.classList.remove('swapping');
        
        const matches = findMatches();
        
        if (matches.length === 0) {
            board[tile1.row][tile1.col] = board[tile2.row][tile2.col];
            board[tile2.row][tile2.col] = tempColor;
            
            tile1.tile.dataset.color = board[tile1.row][tile1.col];
            tile1.tile.className = `tile tile-${board[tile1.row][tile1.col]} invalid-swap`;
            
            tile2.tile.dataset.color = board[tile2.row][tile2.col];
            tile2.tile.className = `tile tile-${board[tile2.row][tile2.col]} invalid-swap`;
            
            tile1.tile.setAttribute('data-sound', 'invalid');
            
            setTimeout(() => {
                tile1.tile.classList.remove('invalid-swap');
                tile2.tile.classList.remove('invalid-swap');
                gameState = GAME_STATES.IDLE;
            }, 300);
        } else {
            moves--;
            updateMoves();
            comboCount = 0;
            gameState = GAME_STATES.RESOLVING;
            processMatches();
        }
    }, 300);
}

function processMatches() {
    const matches = findMatches();
    
    if (matches.length > 0) {
        comboCount++;
        const comboMultiplier = comboCount;
        const matchScore = matches.length * 10 * comboMultiplier;
        score += matchScore;
        updateScore(matchScore);
        
        showComboIndicator(comboCount);
        
        if (matches.length > 0) {
            const firstMatch = matches[0];
            const tile = gameBoard.children[firstMatch.row * BOARD_SIZE + firstMatch.col];
            if (tile) {
                const rect = tile.getBoundingClientRect();
                showScorePopup(matchScore, rect.left + rect.width / 2, rect.top);
            }
        }
        
        matches.forEach(match => {
            const tile = gameBoard.children[match.row * BOARD_SIZE + match.col];
            if (tile) {
                tile.classList.add('matching');
                tile.setAttribute('data-sound', 'match');
            }
        });
        
        setTimeout(() => {
            removeMatches(matches);
            setTimeout(() => {
                applyGravity();
                setTimeout(() => {
                    processMatches();
                }, 400);
            }, 400);
        }, 500);
    } else {
        comboCount = 0;
        gameState = GAME_STATES.IDLE;
        checkGameOver();
    }
}

function findMatches() {
    const matches = [];
    const processed = new Set();
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const color = board[row][col];
            if (!color) continue;
            
            const horizontalMatches = getHorizontalMatches(row, col, color);
            const verticalMatches = getVerticalMatches(row, col, color);
            
            if (horizontalMatches.length >= 3) {
                horizontalMatches.forEach(match => {
                    const key = `${match.row},${match.col}`;
                    if (!processed.has(key)) {
                        matches.push(match);
                        processed.add(key);
                    }
                });
            }
            
            if (verticalMatches.length >= 3) {
                verticalMatches.forEach(match => {
                    const key = `${match.row},${match.col}`;
                    if (!processed.has(key)) {
                        matches.push(match);
                        processed.add(key);
                    }
                });
            }
        }
    }
    
    return matches;
}

function getHorizontalMatches(row, col, color) {
    const matches = [{ row, col }];
    
    for (let c = col + 1; c < BOARD_SIZE && board[row][c] === color; c++) {
        matches.push({ row, col: c });
    }
    
    return matches.length >= 3 ? matches : [];
}

function getVerticalMatches(row, col, color) {
    const matches = [{ row, col }];
    
    for (let r = row + 1; r < BOARD_SIZE && board[r][col] === color; r++) {
        matches.push({ row: r, col });
    }
    
    return matches.length >= 3 ? matches : [];
}

function removeMatches(matches) {
    matches.forEach(match => {
        board[match.row][match.col] = null;
        const tile = gameBoard.children[match.row * BOARD_SIZE + match.col];
        if (tile) {
            tile.classList.remove('matching');
            tile.classList.add('removed');
            tile.setAttribute('data-sound', 'remove');
        }
    });
}

function applyGravity() {
    for (let col = 0; col < BOARD_SIZE; col++) {
        let emptyRow = BOARD_SIZE - 1;
        
        for (let row = BOARD_SIZE - 1; row >= 0; row--) {
            if (board[row][col] !== null) {
                if (row !== emptyRow) {
                    board[emptyRow][col] = board[row][col];
                    board[row][col] = null;
                    
                    const movingTile = gameBoard.children[row * BOARD_SIZE + col];
                    const targetTile = gameBoard.children[emptyRow * BOARD_SIZE + col];
                    
                    if (movingTile && targetTile) {
                        targetTile.dataset.color = movingTile.dataset.color;
                        targetTile.className = `tile tile-${movingTile.dataset.color} falling`;
                        targetTile.classList.remove('removed');
                        targetTile.setAttribute('data-sound', 'fall');
                        
                        movingTile.dataset.color = '';
                        movingTile.className = 'tile';
                        movingTile.style.opacity = '0';
                    }
                }
                emptyRow--;
            }
        }
        
        for (let row = emptyRow; row >= 0; row--) {
            const color = getRandomColor();
            board[row][col] = color;
            
            const tile = gameBoard.children[row * BOARD_SIZE + col];
            if (tile) {
                tile.dataset.color = color;
                tile.className = `tile tile-${color} new-tile`;
                tile.classList.remove('removed');
                tile.setAttribute('data-sound', 'new');
            }
        }
    }
    
    setTimeout(() => {
        const allTiles = gameBoard.querySelectorAll('.tile');
        allTiles.forEach(tile => {
            tile.classList.remove('falling', 'new-tile');
        });
    }, 500);
}

function checkGameOver() {
    if (moves <= 0) {
        setTimeout(() => {
            alert(`Game Over! Your final score is ${score}`);
        }, 100);
    }
}

function updateScore(points = 0) {
    scoreElement.textContent = score;
    
    if (points > 0) {
        scoreElement.classList.add('score-bump');
        setTimeout(() => {
            scoreElement.classList.remove('score-bump');
        }, 400);
    }
}

function showScorePopup(points, x, y) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = `+${points}`;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.setAttribute('data-sound', 'score');
    
    document.body.appendChild(popup);
    
    setTimeout(() => {
        popup.remove();
    }, 1000);
}

function showComboIndicator(combo) {
    const existing = document.querySelector('.combo-indicator');
    if (existing) {
        existing.remove();
    }
    
    if (combo > 1) {
        const indicator = document.createElement('div');
        indicator.className = 'combo-indicator';
        indicator.textContent = `COMBO x${combo}!`;
        indicator.setAttribute('data-sound', 'combo');
        
        const container = document.querySelector('.game-board-container');
        container.appendChild(indicator);
        
        setTimeout(() => {
            indicator.remove();
        }, 2000);
    }
}

function updateMoves() {
    movesElement.textContent = moves;
}

function resetGame() {
    initializeGame();
}

newGameBtn.addEventListener('click', initializeGame);
resetBtn.addEventListener('click', resetGame);

initializeGame();
