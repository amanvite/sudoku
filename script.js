const firebaseConfig = {
    apiKey: "AIzaSyBkhwZMpfLzXxLovi1L_-lhJCdJM2Rwdt4",
    authDomain: "sudoku-5c3a3.firebaseapp.com",
    projectId: "sudoku-5c3a3",
    storageBucket: "sudoku-5c3a3.firebasestorage.app",
    messagingSenderId: "377907321708",
    appId: "1:377907321708:web:1e3156a88ef310a531b149"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
db.enablePersistence().catch(() => {});

let playerId = localStorage.getItem('sudokuPlayerId');
if (!playerId) {
    playerId = 'pid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sudokuPlayerId', playerId);
}

let solution = [];
let puzzle = [];
let selectedCell = null;
const table = document.getElementById("grid");

let secondsElapsed = 0;
let timerInterval = null;
let isTimerRunning = false;
let isGameWon = false;
let isGameOver = false;

let mistakesCount = 0;
const MAX_MISTAKES = 3;

const timerDisplay = document.getElementById("timer");

let usernameCheckTimeout = null;

async function initializeUsername() {
    let playerName = localStorage.getItem('sudokuPlayerName');
    if (!playerName) {
        let isAvailable = false;
        let attempts = 0;
        while (!isAvailable && attempts < 5) {
            playerName = "Player" + Math.floor(Math.random() * 100000);
            try {
                const docRef = db.collection("usernames").doc(playerName.toLowerCase());
                const docSnap = await docRef.get();
                if (!docSnap.exists) {
                    await docRef.set({ original: playerName, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
                    localStorage.setItem('sudokuPlayerName', playerName);
                    isAvailable = true;
                }
            } catch (e) {
                localStorage.setItem('sudokuPlayerName', playerName);
                isAvailable = true;
            }
            attempts++;
        }
    }
}

initializeUsername();

function updateMistakesDisplay() {
    document.getElementById('mistakes-display').innerText = `${mistakesCount}/${MAX_MISTAKES}`;
}

function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function updateTimerDisplay() {
    timerDisplay.innerText = formatTime(secondsElapsed);
}

function startTimer() {
    if (!isTimerRunning && !isGameWon && !isGameOver) {
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
    isGameOver = false;
    updateTimerDisplay();
    startTimer();
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        stopTimer();
        saveState(); 
    } else {
        if (!isGameWon && !isGameOver) {
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
    document.getElementById('current-difficulty-display').innerText = text;
    
    document.querySelectorAll('.dropdown-option').forEach(opt => {
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
    
    const lbModal = document.getElementById('leaderboard-modal');
    if (lbModal && e.target === lbModal) {
        closeLeaderboard();
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

function closeGameOverAndNewGame() {
    document.getElementById('game-over-modal').classList.remove('show');
    newGame();
}

function toggleEditMode(isEditing) {
    const displayPanel = document.getElementById('lb-user-display');
    const editPanel = document.getElementById('lb-user-edit');
    const input = document.getElementById('inline-username-input');
    const statusBox = document.getElementById('inline-username-status');
    const saveBtn = document.getElementById('inline-save-btn');

    if (isEditing) {
        displayPanel.classList.add('hidden');
        editPanel.classList.remove('hidden');
        input.value = localStorage.getItem('sudokuPlayerName') || "";
        statusBox.innerText = "";
        statusBox.className = "status-msg";
        saveBtn.disabled = true;
        saveBtn.innerText = "Save";
        input.focus();
    } else {
        displayPanel.classList.remove('hidden');
        editPanel.classList.add('hidden');
    }
}

function checkUsernameAvailability() {
    const input = document.getElementById('inline-username-input');
    const newName = input.value.trim();
    const currentName = localStorage.getItem('sudokuPlayerName') || "";
    const statusBox = document.getElementById('inline-username-status');
    const saveBtn = document.getElementById('inline-save-btn');

    clearTimeout(usernameCheckTimeout);
    saveBtn.disabled = true;

    if (newName === currentName) {
        statusBox.innerText = "";
        statusBox.className = "status-msg";
        return;
    }

    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (!newName) {
        statusBox.innerText = "";
        return;
    }
    if (!alphanumericRegex.test(newName)) {
        statusBox.innerText = "Letters and numbers only.";
        statusBox.className = "status-msg msg-error";
        return;
    }

    statusBox.innerText = "Checking...";
    statusBox.className = "status-msg";

    usernameCheckTimeout = setTimeout(async () => {
        try {
            const docRef = db.collection("usernames").doc(newName.toLowerCase());
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                statusBox.innerText = "Taken!";
                statusBox.className = "status-msg msg-error";
            } else {
                statusBox.innerText = "Available!";
                statusBox.className = "status-msg msg-success";
                saveBtn.disabled = false; 
            }
        } catch (error) {
            statusBox.innerText = "Connection error.";
            statusBox.className = "status-msg msg-error";
        }
    }, 500); 
}

async function confirmInlineUsername() {
    const input = document.getElementById('inline-username-input');
    const newName = input.value.trim();
    const oldName = localStorage.getItem('sudokuPlayerName');
    const statusBox = document.getElementById('inline-username-status');
    const saveBtn = document.getElementById('inline-save-btn');

    saveBtn.disabled = true;
    saveBtn.innerText = "Saving...";

    try {
        await db.collection("usernames").doc(newName.toLowerCase()).set({
            original: newName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        const batch = db.batch();
        
        const idSnapshot = await db.collection("leaderboard").where("playerId", "==", playerId).get();
        idSnapshot.forEach((doc) => {
            batch.update(doc.ref, { name: newName });
        });

        if (oldName && oldName !== newName) {
            const nameSnapshot = await db.collection("leaderboard").where("name", "==", oldName).get();
            nameSnapshot.forEach((doc) => {
                const data = doc.data();
                if (!data.playerId || data.playerId === playerId) {
                    batch.update(doc.ref, { name: newName, playerId: playerId });
                }
            });
        }

        await batch.commit();
        localStorage.setItem('sudokuPlayerName', newName);

        document.getElementById('lb-current-name').innerText = newName;
        statusBox.innerText = "Saved successfully!";
        statusBox.className = "status-msg msg-success";
        
        setTimeout(() => {
            toggleEditMode(false);
            showLeaderboard(); 
        }, 600);

    } catch(e) {
        statusBox.innerText = "Failed to save.";
        statusBox.className = "status-msg msg-error";
        saveBtn.innerText = "Save";
        saveBtn.disabled = false;
    }
}

async function showLeaderboard() {
    const placeholder = document.getElementById('leaderboard-placeholder');
    if (!document.getElementById('leaderboard-modal')) {
        try {
            const response = await fetch('leaderboard.html');
            if (!response.ok) throw new Error('Network response was not ok');
            placeholder.innerHTML = await response.text();
        } catch (error) {
            alert("Could not load leaderboard. Please check your connection.");
            return;
        }
    }

    document.getElementById('leaderboard-modal').classList.add('show');
    
    const playerName = localStorage.getItem('sudokuPlayerName') || "Loading...";
    document.getElementById('lb-current-name').innerText = playerName;
    
    toggleEditMode(false);

    const listBody = document.getElementById('leaderboard-body');
    listBody.innerHTML = '<div class="lb-msg">Loading top scores...</div>';
    
    db.collection("leaderboard").orderBy("points", "desc").limit(10).get().then((querySnapshot) => {
        listBody.innerHTML = '';
        if (querySnapshot.empty) {
            listBody.innerHTML = '<div class="lb-msg">No scores yet! Be the first to solve a puzzle.</div>';
            return;
        }
        
        let rank = 1;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            let rankClass = "lb-rank";
            let rankIcon = rank;
            if (rank === 1) { rankClass += " rank-1"; rankIcon = "🥇"; }
            else if (rank === 2) { rankClass += " rank-2"; rankIcon = "🥈"; }
            else if (rank === 3) { rankClass += " rank-3"; rankIcon = "🥉"; }

            const isMe = (data.playerId === playerId) || (!data.playerId && data.name === playerName);
            const displayName = isMe ? playerName : data.name;
            const nameDisplay = isMe 
                ? `${displayName} <span style="font-size: 11px; color: var(--input-user); background: var(--selected-bg); padding: 2px 6px; border-radius: 10px; margin-left: 6px; font-weight: 800;">You</span>` 
                : displayName;

            const row = document.createElement('div');
            row.className = 'lb-row';
            row.innerHTML = `
                <div class="${rankClass}">${rankIcon}</div>
                <div class="lb-details">
                    <div class="lb-name">${nameDisplay}</div>
                    <div class="lb-diff">${data.difficulty} &bull; ${formatTime(data.time)}</div>
                </div>
                <div class="lb-score">${data.points}</div>
            `;
            listBody.appendChild(row);
            rank++;
        });
    }).catch(() => {
        listBody.innerHTML = '<div class="lb-msg" style="color: var(--error-color);">Unable to load scores. Check your connection.</div>';
    });
}

function closeLeaderboard() {
    const modal = document.getElementById('leaderboard-modal');
    if (modal) {
        modal.classList.remove('show');
    }
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
        mistakesCount: mistakesCount,
        secondsElapsed: secondsElapsed, 
        isGameWon: isGameWon,
        isGameOver: isGameOver            
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

function checkInputMistake(r, c, input) {
    if (input.value === "") {
        input.style.color = "";
        return;
    }
    
    if (input.value != solution[r][c]) {
        mistakesCount++;
        updateMistakesDisplay();
        input.style.color = "var(--error-color)";
        
        if (mistakesCount >= MAX_MISTAKES) {
            isGameOver = true;
            stopTimer();
            document.getElementById('game-over-modal').classList.add('show');
            const inputs = document.querySelectorAll('#grid input');
            inputs.forEach(inp => inp.readOnly = true);
        }
    } else {
        input.style.color = "var(--input-user)";
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
                if (isGameOver || isGameWon) {
                    input.value = "";
                    return;
                }
                input.style.color = "";
                input.value = input.value.replace(/[^1-9]/g, '');
                if (input.value.length > 1) input.value = input.value.slice(-1);
                
                checkInputMistake(i, j, input);
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
                    if (isGameOver || isGameWon) return;
                    input.value = "";
                    input.style.color = "";
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
    if (isGameOver || isGameWon) return;
    if (selectedCell && !selectedCell.readOnly) {
        selectedCell.value = val;
        selectedCell.style.color = "";
        selectedCell.focus();
        
        let r = parseInt(selectedCell.id.split('-')[1]);
        let c = parseInt(selectedCell.id.split('-')[2]);
        
        checkInputMistake(r, c, selectedCell);
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

    if (isFull && allCorrect && !isGameWon && !isGameOver) {
        isGameWon = true; 
        stopTimer();
        fireConfetti();
        
        let diffVal = document.getElementById("difficulty").value;
        let diffText = "Medium";
        let pointsEarned = 225;
        
        if (diffVal == 30) { diffText = "Easy"; pointsEarned = 50; }
        if (diffVal == 45) { diffText = "Medium"; pointsEarned = 225; }
        if (diffVal == 55) { diffText = "Hard"; pointsEarned = 1250; }
        if (diffVal == 65) { diffText = "Expert"; pointsEarned = 2500; }

        let totalScore = parseInt(localStorage.getItem('sudokuTotalScore')) || 0;
        totalScore += pointsEarned;
        localStorage.setItem('sudokuTotalScore', totalScore);

        let playerName = localStorage.getItem('sudokuPlayerName');

        db.collection("leaderboard").add({
            playerId: playerId,
            name: playerName,
            difficulty: diffText,
            points: pointsEarned,
            time: secondsElapsed,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(() => {});
        
        document.getElementById('victory-time').innerText = formatTime(secondsElapsed);
        document.getElementById('v-diff').innerText = diffText;
        document.getElementById('victory-points').innerText = pointsEarned;
        document.getElementById('victory-modal').classList.add('show');
    }
}

function newGame() {
    isGameWon = false;
    isGameOver = false;
    mistakesCount = 0;
    updateMistakesDisplay();
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
            
            document.getElementById('current-difficulty-display').innerText = diffText;
            
            document.querySelectorAll('.dropdown-option').forEach(opt => {
                opt.classList.remove('selected');
                if (opt.innerText === diffText) opt.classList.add('selected');
            });
        }
        
        if (data.secondsElapsed !== undefined) {
            secondsElapsed = data.secondsElapsed;
            isGameWon = data.isGameWon || false;
            updateTimerDisplay();
        }
        
        if (data.mistakesCount !== undefined) {
            mistakesCount = data.mistakesCount;
        } else {
            mistakesCount = 0;
        }
        updateMistakesDisplay();

        if (data.isGameOver !== undefined) {
            isGameOver = data.isGameOver;
        } else {
            isGameOver = false;
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
        
        if (isGameOver) {
            const inputs = document.querySelectorAll('#grid input');
            inputs.forEach(inp => inp.readOnly = true);
            document.getElementById('game-over-modal').classList.add('show');
        } else if (!isGameWon) {
            startTimer();
        }
    } else {
        document.getElementById('current-difficulty-display').innerText = "Medium";
        newGame();
    }
}

init();