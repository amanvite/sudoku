let solution = [];
let puzzle = [];
let selectedCell = null;
const table = document.getElementById("grid");
const msg = document.getElementById("message");

let secondsElapsed = 0;
let timerInterval = null;
let isTimerRunning = false;
let isGameWon = false;
const timerDisplay = document.getElementById("timer");

function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function updateTimerDisplay() {
    timerDisplay.innerText = formatTime(secondsElapsed);
}

function startTimer() {
    if (!isTimerRunning && !isGameWon) {
        isTimerRunning = true;
        timerInterval = setInterval(() => {
            secondsElapsed++;
            updateTimerDisplay();
        }, 1000);
    }
}

function stopTimer() {
    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
    }
}

function resetTimer() {
    stopTimer();
    secondsElapsed = 0;
    isGameWon = false;
    updateTimerDisplay();
    startTimer();
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        stopTimer();
        saveState(); 
    } else {
        if (!isGameWon) {
            startTimer();
        }
    }
});

function toggleMainMenu(event) {
    if (event) event.stopPropagation();
    const menuBtn = document.getElementById('menu-icon-btn');
    const mainMenu = document.getElementById('main-menu');
    if (menuBtn && mainMenu) {
        menuBtn.classList.toggle('open');
        mainMenu.classList.toggle('show');
    }
}

function toggleDropdown(event) {
    event.stopPropagation(); 
    const optionsMenu = document.getElementById('dropdown-options');
    const selectedBox = document.querySelector('.dropdown-selected');
    if(optionsMenu && selectedBox) {
        optionsMenu.classList.toggle('show');
        selectedBox.classList.toggle('open');
    }
}

function selectDifficulty(value, text) {
    document.getElementById('difficulty').value = value;
    
    const diffTextElem = document.getElementById('dropdown-text');
    if (diffTextElem) diffTextElem.innerText = text;
    
    document.querySelectorAll('.dropdown-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.innerText === text) opt.classList.add('selected');
    });

    document.querySelectorAll('.diff-opt').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.innerText === text) opt.classList.add('selected');
    });
    
    const optionsMenu = document.getElementById('dropdown-options');
    const selectedBox = document.querySelector('.dropdown-selected');
    if (optionsMenu && optionsMenu.classList.contains('show')) {
        optionsMenu.classList.remove('show');
        selectedBox.classList.remove('open');
    }

    newGame();
}

document.addEventListener('click', (e) => {
    const difficultyMenu = document.getElementById('dropdown-options');
    const difficultySelected = document.querySelector('.dropdown-selected');
    
    if (difficultyMenu && difficultyMenu.classList.contains('show') && difficultySelected && !difficultySelected.contains(e.target)) {
        difficultyMenu.classList.remove('show');
        difficultySelected.classList.remove('open');
    }

    const mainMenuBtn = document.getElementById('menu-icon-btn');
    const mainMenu = document.getElementById('main-menu');
    
    if (mainMenu && mainMenu.classList.contains('show') && mainMenuBtn && !mainMenuBtn.contains(e.target) && !mainMenu.contains(e.target)) {
        mainMenu.classList.remove('show');
        mainMenuBtn.classList.remove('open');
    }
});

function fireConfetti() {
    if (typeof confetti !== 'function') return;
    confetti({ particleCount: 150, spread: 80, origin: { x: 0, y: 0.6 }, angle: 60, zIndex: 3000 });
    confetti({ particleCount: 150, spread: 80, origin: { x: 1, y: 0.6 }, angle: 120, zIndex: 3000 });
}

function closeModalAndNewGame() {
    document.getElementById('victory-modal').classList.remove('show');
    newGame();
}

function saveState() {
    let currentState = [];
    for (let i = 0; i < 9; i++) {
        let row = [];
        for (let j = 0; j < 9; j++) {
            const input = document.getElementById(`cell-${i}-${j}`);
            if (input) {
                row.push({
                    value: input.value,
                    color: input.style.color
                });
            } else {
                row.push(null);
            }
        }
        currentState.push(row);
    }
    
    const gameData = {
        solution: solution,
        puzzle: puzzle,
        difficulty: document.getElementById("difficulty").value,
        currentState: currentState,
        msgText: msg.innerText,
        msgColor: msg.style.color,
        secondsElapsed: secondsElapsed, 
        isGameWon: isGameWon            
    };
    localStorage.setItem('sudokuGame', JSON.stringify(gameData));
}

function generateSudoku() {
    solution = Array.from({length: 9}, () => Array(9).fill(0));
    fillDiagonal();
    fillRemaining(0, 3);
    
    puzzle = solution.map(row => [...row]);
    let removeCount = parseInt(document.getElementById("difficulty").value); 
    while (removeCount > 0) {
        let i = Math.floor(Math.random() * 9);
        let j = Math.floor(Math.random() * 9);
        if (puzzle[i][j] !== 0) {
            puzzle[i][j] = 0;
            removeCount--;
        }
    }
}

function fillDiagonal() {
    for (let i = 0; i < 9; i += 3) {
        fillBox(i, i);
    }
}

function fillBox(rowStart, colStart) {
    let num;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            do {
                num = Math.floor(Math.random() * 9) + 1;
            } while (!unUsedInBox(rowStart, colStart, num));
            solution[rowStart + i][colStart + j] = num;
        }
    }
}

function unUsedInBox(rowStart, colStart, num) {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (solution[rowStart + i][colStart + j] === num) return false;
        }
    }
    return true;
}

function unUsedInRow(i, num) {
    for (let j = 0; j < 9; j++) {
        if (solution[i][j] === num) return false;
    }
    return true;
}

function unUsedInCol(j, num) {
    for (let i = 0; i < 9; i++) {
        if (solution[i][j] === num) return false;
    }
    return true;
}

function CheckIfSafe(i, j, num) {
    return unUsedInRow(i, num) && unUsedInCol(j, num) && unUsedInBox(i - i % 3, j - j % 3, num);
}

function fillRemaining(i, j) {
    if (j >= 9 && i < 8) { i = i + 1; j = 0; }
    if (i >= 9 && j >= 9) return true;
    if (i < 3) {
        if (j < 3) j = 3;
    } else if (i < 6) {
        if (j === Math.floor(i / 3) * 3) j = j + 3;
    } else {
        if (j === 6) {
            i = i + 1; j = 0;
            if (i >= 9) return true;
        }
    }
    for (let num = 1; num <= 9; num++) {
        if (CheckIfSafe(i, j, num)) {
            solution[i][j] = num;
            if (fillRemaining(i, j + 1)) return true;
            solution[i][j] = 0;
        }
    }
    return false;
}

function clearHighlights() {
    const tds = document.querySelectorAll('td');
    for (let i = 0; i < tds.length; i++) {
        tds[i].classList.remove('highlight', 'selected-cell');
    }
}

function highlightCells(r, c) {
    clearHighlights();
    const startRow = Math.floor(r / 3) * 3;
    const startCol = Math.floor(c / 3) * 3;
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const input = document.getElementById(`cell-${i}-${j}`);
            if (input && input.parentElement) {
                if (i === r && j === c) {
                    input.parentElement.classList.add('selected-cell');
                } else if (i === r || j === c || (i >= startRow && i < startRow + 3 && j >= startCol && j < startCol + 3)) {
                    input.parentElement.classList.add('highlight');
                }
            }
        }
    }
}

function renderGrid() {
    table.innerHTML = "";
    selectedCell = null;
    for (let i = 0; i < 9; i++) {
        const tr = document.createElement("tr");
        for (let j = 0; j < 9; j++) {
            const td = document.createElement("td");
            const val = puzzle[i][j];
            
            const input = document.createElement("input");
            input.type = "text";
            input.inputMode = "none";
            input.id = `cell-${i}-${j}`;
            
            if (val !== 0) {
                input.value = val;
                input.readOnly = true;
            }

            input.addEventListener('focus', () => {
                selectedCell = input;
                highlightCells(i, j);
            });

            input.addEventListener('input', () => {
                msg.innerText = "";
                input.style.color = "";
                input.value = input.value.replace(/[^1-9]/g, '');
                if (input.value.length > 1) input.value = input.value.slice(-1);
                autoCheckWin();
                saveState();
            });

            input.addEventListener('keydown', (e) => {
                let r = i, c = j;
                if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
                else if (e.key === 'ArrowDown') r = Math.min(8, r + 1);
                else if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
                else if (e.key === 'ArrowRight') c = Math.min(8, c + 1);
                else if (e.key === 'Backspace') {
                    input.value = "";
                    input.style.color = "";
                    msg.innerText = "";
                    autoCheckWin(); 
                    saveState();
                }
                
                if (r !== i || c !== j) {
                    document.getElementById(`cell-${r}-${c}`).focus();
                    e.preventDefault();
                }
            });

            td.appendChild(input);
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
}

function numPress(val) {
    if (selectedCell && !selectedCell.readOnly) {
        selectedCell.value = val;
        selectedCell.style.color = "";
        msg.innerText = "";
        selectedCell.focus();
        autoCheckWin();
        saveState();
    }
}

function autoCheckWin() {
    let allCorrect = true;
    let isFull = true;

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const input = document.getElementById(`cell-${i}-${j}`);
            if (!input.readOnly) {
                if (input.value === "") {
                    isFull = false;
                } else if (input.value != solution[i][j]) {
                    allCorrect = false;
                }
            }
        }
    }

    if (isFull) {
        msg.innerText = ""; 

        if (allCorrect) {
            if (!isGameWon) {
                isGameWon = true; 
                stopTimer();
                fireConfetti();
                
                document.getElementById('victory-time').innerText = formatTime(secondsElapsed);
                document.getElementById('v-diff').innerText = document.getElementById('dropdown-text').innerText;
                document.getElementById('victory-modal').classList.add('show');
            }
        } else {
            msg.innerText = "There are mistakes.";
        }

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const input = document.getElementById(`cell-${i}-${j}`);
                if (!input.readOnly) {
                    if (input.value == solution[i][j]) {
                        input.style.color = "var(--input-user)"; 
                    } else {
                        input.style.color = "var(--error-color)"; 
                    }
                }
            }
        }
    } else {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const input = document.getElementById(`cell-${i}-${j}`);
                if (!input.readOnly) {
                    input.style.color = "var(--input-user)";
                }
            }
        }
    }
}

function newGame() {
    msg.innerText = "";
    generateSudoku();
    renderGrid();
    clearHighlights();
    resetTimer(); 
    saveState();
}

function init() {
    const savedData = localStorage.getItem('sudokuGame');
    if (savedData) {
        const data = JSON.parse(savedData);
        solution = data.solution;
        puzzle = data.puzzle;
        
        const diffInput = document.getElementById("difficulty");
        if (data.difficulty) {
            diffInput.value = data.difficulty;
            let diffText = "Medium";
            if (data.difficulty == 30) diffText = "Easy";
            if (data.difficulty == 45) diffText = "Medium";
            if (data.difficulty == 55) diffText = "Hard";
            if (data.difficulty == 65) diffText = "Expert";
            
            const diffTextElem = document.getElementById("dropdown-text");
            if (diffTextElem) diffTextElem.innerText = diffText;
            
            document.querySelectorAll('.dropdown-option').forEach(opt => {
                opt.classList.remove('selected');
                if (opt.innerText === diffText) opt.classList.add('selected');
            });
            document.querySelectorAll('.diff-opt').forEach(opt => {
                opt.classList.remove('selected');
                if (opt.innerText === diffText) opt.classList.add('selected');
            });
        }
        
        if (data.secondsElapsed !== undefined) {
            secondsElapsed = data.secondsElapsed;
            isGameWon = data.isGameWon || false;
            updateTimerDisplay();
        }
        
        renderGrid();
        
        if (data.currentState) {
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    const input = document.getElementById(`cell-${i}-${j}`);
                    if (input && data.currentState[i][j]) {
                        if (!input.readOnly) {
                            input.value = data.currentState[i][j].value;
                            input.style.color = data.currentState[i][j].color;
                        }
                    }
                }
            }
        }
        
        if (data.msgText) {
            msg.innerText = data.msgText;
            msg.style.color = data.msgColor;
        }

        if (!isGameWon) {
            startTimer();
        }
    } else {
        newGame();
    }
}

init();