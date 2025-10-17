const BOARD_SIZE = 8;
const TILE_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

let board = [];
let score = 0;
let moves = 30;
let selectedTile = null;

const gameBoard = document.getElementById('gameBoard');
const scoreElement = document.getElementById('score');
const movesElement = document.getElementById('moves');
const newGameBtn = document.getElementById('newGameBtn');
const resetBtn = document.getElementById('resetBtn');

function initializeGame() {
    board = [];
    score = 0;
    moves = 30;
    selectedTile = null;
    
    updateScore();
    updateMoves();
    createBoard();
}

function createBoard() {
    gameBoard.innerHTML = '';
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        board[row] = [];
        for (let col = 0; col < BOARD_SIZE; col++) {
            const color = getRandomColor();
            board[row][col] = color;
            
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
    
    return tile;
}

function getRandomColor() {
    const randomIndex = Math.floor(Math.random() * TILE_COLORS.length);
    return TILE_COLORS[randomIndex];
}

function handleTileClick(tile, row, col) {
    if (moves <= 0) {
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
            swapTiles(selectedTile, { tile, row, col });
            selectedTile.tile.classList.remove('selected');
            selectedTile = null;
        } else {
            selectedTile.tile.classList.remove('selected');
            selectedTile = { tile, row, col };
            tile.classList.add('selected');
        }
    }
}

function isAdjacent(row1, col1, row2, col2) {
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

function swapTiles(tile1, tile2) {
    const tempColor = board[tile1.row][tile1.col];
    board[tile1.row][tile1.col] = board[tile2.row][tile2.col];
    board[tile2.row][tile2.col] = tempColor;
    
    tile1.tile.dataset.color = board[tile1.row][tile1.col];
    tile1.tile.className = `tile tile-${board[tile1.row][tile1.col]}`;
    
    tile2.tile.dataset.color = board[tile2.row][tile2.col];
    tile2.tile.className = `tile tile-${board[tile2.row][tile2.col]}`;
    
    moves--;
    updateMoves();
    
    setTimeout(() => {
        checkMatches();
    }, 300);
}

function checkMatches() {
    const matches = findMatches();
    
    if (matches.length > 0) {
        const matchScore = matches.length * 10;
        score += matchScore;
        updateScore();
        
        matches.forEach(match => {
            const tile = gameBoard.children[match.row * BOARD_SIZE + match.col];
            if (tile) {
                tile.classList.add('matching');
            }
        });
        
        setTimeout(() => {
            removeMatches(matches);
            setTimeout(() => {
                fillEmptySpaces();
                setTimeout(() => {
                    checkMatches();
                }, 300);
            }, 200);
        }, 500);
    } else {
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
            tile.style.opacity = '0';
        }
    });
}

function fillEmptySpaces() {
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
                        targetTile.className = movingTile.className;
                        targetTile.style.opacity = '1';
                        
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
                tile.className = `tile tile-${color}`;
                tile.style.opacity = '1';
            }
        }
    }
}

function checkGameOver() {
    if (moves <= 0) {
        setTimeout(() => {
            alert(`Game Over! Your final score is ${score}`);
        }, 100);
    }
}

function updateScore() {
    scoreElement.textContent = score;
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
