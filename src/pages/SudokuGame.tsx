import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { db, firebase } from '../firebase';

let playerId = localStorage.getItem('sudokuPlayerId');
if (!playerId) {
    playerId = 'pid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('sudokuPlayerId', playerId);
}

const MAX_MISTAKES = 3;

type CellData = {
    val: string;
    isGiven: boolean;
    color: string;
};

function createPuzzle(removeCount: number) {
    let sol = Array.from({ length: 9 }, () => Array(9).fill(0));

    function unUsedInBox(rowStart: number, colStart: number, num: number) {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (sol[rowStart + i][colStart + j] === num) return false;
            }
        }
        return true;
    }

    function unUsedInRow(i: number, num: number) {
        for (let j = 0; j < 9; j++) {
            if (sol[i][j] === num) return false;
        }
        return true;
    }

    function unUsedInCol(j: number, num: number) {
        for (let i = 0; i < 9; i++) {
            if (sol[i][j] === num) return false;
        }
        return true;
    }

    function CheckIfSafe(i: number, j: number, num: number) {
        return unUsedInRow(i, num) && unUsedInCol(j, num) && unUsedInBox(i - (i % 3), j - (j % 3), num);
    }

    function fillBox(rowStart: number, colStart: number) {
        let num;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                do {
                    num = Math.floor(Math.random() * 9) + 1;
                } while (!unUsedInBox(rowStart, colStart, num));
                sol[rowStart + i][colStart + j] = num;
            }
        }
    }

    function fillDiagonal() {
        for (let i = 0; i < 9; i += 3) fillBox(i, i);
    }

    function fillRemaining(i: number, j: number): boolean {
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
                sol[i][j] = num;
                if (fillRemaining(i, j + 1)) return true;
                sol[i][j] = 0;
            }
        }
        return false;
    }

    fillDiagonal();
    fillRemaining(0, 3);

    let puz = sol.map(row => [...row]);
    let count = removeCount;
    while (count > 0) {
        let i = Math.floor(Math.random() * 9);
        let j = Math.floor(Math.random() * 9);
        if (puz[i][j] !== 0) {
            puz[i][j] = 0;
            count--;
        }
    }

    return { solution: sol, puzzle: puz };
}

export default function SudokuGame() {
    const [difficultyText, setDifficultyText] = useState('Medium');
    const [difficultyValue, setDifficultyValue] = useState(45);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [grid, setGrid] = useState<CellData[][]>([]);
    const [solution, setSolution] = useState<number[][]>([]);
    const [selectedCell, setSelectedCell] = useState<{ r: number, c: number } | null>(null);

    const [mistakesCount, setMistakesCount] = useState(0);
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isGameWon, setIsGameWon] = useState(false);
    const [victoryPoints, setVictoryPoints] = useState(0);

    const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
    const [lbUsername, setLbUsername] = useState('');
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [inlineInput, setInlineInput] = useState('');
    const [inlineStatus, setInlineStatus] = useState({ msg: '', type: '' });
    const [isSavingUsername, setIsSavingUsername] = useState(false);
    const [usernameCheckTimeout, setUsernameCheckTimeout] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const initUser = async () => {
            let pName = localStorage.getItem('sudokuPlayerName');
            if (!pName) {
                let isAvail = false;
                let attempts = 0;
                while (!isAvail && attempts < 5) {
                    pName = "Player" + Math.floor(Math.random() * 100000);
                    try {
                        const docRef = db.collection("usernames").doc(pName.toLowerCase());
                        const docSnap = await docRef.get();
                        if (!docSnap.exists) {
                            await docRef.set({ original: pName, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
                            localStorage.setItem('sudokuPlayerName', pName);
                            isAvail = true;
                        }
                    } catch (e) {
                        localStorage.setItem('sudokuPlayerName', pName);
                        isAvail = true;
                    }
                    attempts++;
                }
            }
            setLbUsername(pName || 'Unknown');
        };
        initUser();
    }, []);

    const startNewGame = useCallback((diffVal: number, diffText: string) => {
        const { solution: newSol, puzzle: newPuz } = createPuzzle(diffVal);
        setSolution(newSol);

        const newGrid = newPuz.map(row => row.map(val => ({
            val: val === 0 ? '' : val.toString(),
            isGiven: val !== 0,
            color: ''
        })));

        setGrid(newGrid);
        setDifficultyValue(diffVal);
        setDifficultyText(diffText);
        setMistakesCount(0);
        setSecondsElapsed(0);
        setIsGameOver(false);
        setIsGameWon(false);
        setSelectedCell(null);
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('sudokuGame');
        if (saved) {
            const data = JSON.parse(saved);
            setSolution(data.solution);
            setDifficultyValue(data.difficulty);
            setDifficultyText(data.difficulty === 30 ? 'Easy' : data.difficulty === 45 ? 'Medium' : data.difficulty === 55 ? 'Hard' : 'Expert');
            setSecondsElapsed(data.secondsElapsed || 0);
            setMistakesCount(data.mistakesCount || 0);
            setIsGameOver(data.isGameOver || false);
            setIsGameWon(data.isGameWon || false);

            if (data.puzzle && data.puzzle.length > 0) {
                const newGrid: CellData[][] = [];
                for (let i = 0; i < 9; i++) {
                    const row: CellData[] = [];
                    for (let j = 0; j < 9; j++) {
                        const isGiven = data.puzzle[i][j] !== 0;
                        let val = '';
                        let color = '';
                        if (isGiven) {
                            val = data.puzzle[i][j].toString();
                        } else if (data.currentState && data.currentState[i][j]) {
                            val = data.currentState[i][j].value;
                            color = data.currentState[i][j].color;
                        }
                        row.push({ val, isGiven, color });
                    }
                    newGrid.push(row);
                }
                setGrid(newGrid);
            } else {
                startNewGame(45, 'Medium');
            }
        } else {
            startNewGame(45, 'Medium');
        }
    }, [startNewGame]);

    useEffect(() => {
        if (solution.length === 0 || grid.length === 0) return;
        const currentState = grid.map(row => row.map(cell => ({
            value: cell.isGiven ? '' : cell.val,
            color: cell.color
        })));

        const puzzle = grid.map(row => row.map(cell => cell.isGiven ? parseInt(cell.val) : 0));

        const gameData = {
            solution,
            puzzle,
            difficulty: difficultyValue,
            currentState,
            mistakesCount,
            secondsElapsed,
            isGameWon,
            isGameOver
        };
        localStorage.setItem('sudokuGame', JSON.stringify(gameData));
    }, [grid, secondsElapsed, mistakesCount, isGameOver, isGameWon, solution, difficultyValue]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (!isGameOver && !isGameWon && solution.length > 0) {
            interval = setInterval(() => setSecondsElapsed(s => s + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isGameOver, isGameWon, solution.length]);

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleInput = (r: number, c: number, value: string) => {
        if (isGameOver || isGameWon || grid[r][c].isGiven) return;

        let newVal = value.replace(/[^1-9]/g, '');
        if (newVal.length > 1) newVal = newVal.slice(-1);

        const newGrid = grid.map(row => [...row]);
        const cell = { ...newGrid[r][c], val: newVal, color: '' };

        if (newVal === '') {
            newGrid[r][c] = cell;
            setGrid(newGrid);
            return;
        }

        let currentMistakes = mistakesCount;
        if (parseInt(newVal) !== solution[r][c]) {
            cell.color = 'var(--error-color)';
            currentMistakes += 1;
            setMistakesCount(currentMistakes);
            if (currentMistakes >= MAX_MISTAKES) {
                setIsGameOver(true);
            }
        } else {
            cell.color = 'var(--input-user)';
        }

        newGrid[r][c] = cell;
        setGrid(newGrid);

        let isFull = true;
        let allCorrect = true;
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (!newGrid[i][j].isGiven) {
                    if (newGrid[i][j].val === '') {
                        isFull = false;
                    } else if (parseInt(newGrid[i][j].val) !== solution[i][j]) {
                        allCorrect = false;
                    }
                }
            }
        }

        if (isFull && allCorrect && currentMistakes < MAX_MISTAKES) {
            triggerWin();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, r: number, c: number) => {
        let nr = r, nc = c;
        if (e.key === 'ArrowUp') nr = Math.max(0, r - 1);
        else if (e.key === 'ArrowDown') nr = Math.min(8, r + 1);
        else if (e.key === 'ArrowLeft') nc = Math.max(0, c - 1);
        else if (e.key === 'ArrowRight') nc = Math.min(8, c + 1);
        else if (e.key === 'Backspace') {
            handleInput(r, c, '');
            return;
        }

        if (nr !== r || nc !== c) {
            document.getElementById(`cell-${nr}-${nc}`)?.focus();
            e.preventDefault();
        }
    };

    const triggerWin = () => {
        setIsGameWon(true);
        confetti({ particleCount: 150, spread: 80, origin: { x: 0, y: 0.6 }, angle: 60, zIndex: 3000 });
        confetti({ particleCount: 150, spread: 80, origin: { x: 1, y: 0.6 }, angle: 120, zIndex: 3000 });

        let points = 225;
        if (difficultyValue === 30) points = 50;
        if (difficultyValue === 55) points = 1250;
        if (difficultyValue === 65) points = 2500;
        setVictoryPoints(points);

        let totalScore = parseInt(localStorage.getItem('sudokuTotalScore') || '0');
        localStorage.setItem('sudokuTotalScore', (totalScore + points).toString());

        const pName = localStorage.getItem('sudokuPlayerName') || 'Unknown';
        db.collection("leaderboard").add({
            playerId: playerId,
            name: pName,
            difficulty: difficultyText,
            points: points,
            time: secondsElapsed,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(() => {});
    };

    const fetchLeaderboard = () => {
        setLeaderboardData([]);
        db.collection("leaderboard").orderBy("points", "desc").limit(10).get().then((querySnapshot) => {
            const data = querySnapshot.docs.map(doc => doc.data());
            setLeaderboardData(data);
        }).catch(() => {});
    };

    const openLeaderboard = () => {
        setIsLeaderboardOpen(true);
        setLbUsername(localStorage.getItem('sudokuPlayerName') || 'Unknown');
        setIsEditingUsername(false);
        fetchLeaderboard();
    };

    const handleUsernameCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value.trim();
        setInlineInput(e.target.value);
        
        if (usernameCheckTimeout) clearTimeout(usernameCheckTimeout);
        setIsSavingUsername(true);

        const currentName = localStorage.getItem('sudokuPlayerName') || "";
        if (newName === currentName) {
            setInlineStatus({ msg: '', type: '' });
            return;
        }

        const alphanumericRegex = /^[a-zA-Z0-9]+$/;
        if (!newName) {
            setInlineStatus({ msg: '', type: '' });
            return;
        }
        if (!alphanumericRegex.test(newName)) {
            setInlineStatus({ msg: 'Letters and numbers only.', type: 'msg-error' });
            return;
        }

        setInlineStatus({ msg: 'Checking...', type: '' });

        const timeout = setTimeout(async () => {
            try {
                const docSnap = await db.collection("usernames").doc(newName.toLowerCase()).get();
                if (docSnap.exists) {
                    setInlineStatus({ msg: 'Taken!', type: 'msg-error' });
                } else {
                    setInlineStatus({ msg: 'Available!', type: 'msg-success' });
                    setIsSavingUsername(false);
                }
            } catch (error) {
                setInlineStatus({ msg: 'Connection error.', type: 'msg-error' });
            }
        }, 500);
        setUsernameCheckTimeout(timeout);
    };

    const confirmUsernameChange = async () => {
        const newName = inlineInput.trim();
        const oldName = localStorage.getItem('sudokuPlayerName');
        setIsSavingUsername(true);
        setInlineStatus({ msg: 'Saving...', type: '' });

        try {
            await db.collection("usernames").doc(newName.toLowerCase()).set({
                original: newName,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            const batch = db.batch();
            const idSnapshot = await db.collection("leaderboard").where("playerId", "==", playerId).get();
            idSnapshot.forEach((doc) => batch.update(doc.ref, { name: newName }));

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
            setLbUsername(newName);
            setInlineStatus({ msg: 'Saved successfully!', type: 'msg-success' });
            
            setTimeout(() => {
                setIsEditingUsername(false);
                fetchLeaderboard();
            }, 600);

        } catch (e) {
            setInlineStatus({ msg: 'Failed to save.', type: 'msg-error' });
            setIsSavingUsername(false);
        }
    };

    return (
        <div onClick={() => { setIsMenuOpen(false); setIsDropdownOpen(false); }}>
            <nav className="top-navbar">
                <div className="nav-content">
                    <div className="nav-left">
                        <div className="menu-wrapper">
                            <div className={`menu-icon-btn ${isMenuOpen ? 'open' : ''}`} onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}>
                                <svg className="menu-icon-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="3" y1="6" x2="21" y2="6" className="line-1"></line>
                                    <line x1="3" y1="12" x2="21" y2="12" className="line-2"></line>
                                    <line x1="3" y1="18" x2="21" y2="18" className="line-3"></line>
                                </svg>
                            </div>
                            <div className={`main-menu ${isMenuOpen ? 'show' : ''}`}>
                                <Link to="/rules">Rules</Link>
                                <Link to="/solution">Solution</Link>
                                <a href="#" className="mobile-menu-leaderboard" onClick={(e) => { e.preventDefault(); openLeaderboard(); }}>Leaderboard</a>
                            </div>
                        </div>
                        <h2>Sudoku</h2>
                    </div>

                    <div className="nav-right">
                        <button className="leaderboard-btn hide-on-mobile" onClick={openLeaderboard}>Leaderboard</button>

                        <div className="custom-dropdown">
                            <div className={`dropdown-selected new-game-btn ${isDropdownOpen ? 'open' : ''}`} onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }}>
                                <span>New Game</span>
                                <svg className="chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                            <div className={`dropdown-options ${isDropdownOpen ? 'show' : ''}`}>
                                <div className="dropdown-option" onClick={() => startNewGame(30, 'Easy')}>Easy</div>
                                <div className={`dropdown-option ${difficultyValue === 45 ? 'selected' : ''}`} onClick={() => startNewGame(45, 'Medium')}>Medium</div>
                                <div className={`dropdown-option ${difficultyValue === 55 ? 'selected' : ''}`} onClick={() => startNewGame(55, 'Hard')}>Hard</div>
                                <div className={`dropdown-option ${difficultyValue === 65 ? 'selected' : ''}`} onClick={() => startNewGame(65, 'Expert')}>Expert</div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="main-content">
                <div className="app-container">
                    <div className="game-core-area">
                        
                        <div className={`local-modal ${isGameOver ? 'show' : ''}`}>
                            <div className="modal-content sudoku-game-over-card">
                                <h2>Game Over</h2>
                                <p>You have made 3 mistakes and lost this game</p>
                                <div className="go-buttons">
                                    <button className="primary-new-game-btn" onClick={() => startNewGame(difficultyValue, difficultyText)}>New Game</button>
                                </div>
                            </div>
                        </div>

                        <div className="stats-bar">
                            <div className="stats-col stats-left">
                                <span className="timer-label">Difficulty</span>
                                <span className="stats-value">{difficultyText}</span>
                            </div>
                            <div className="stats-col stats-center">
                                <span className="timer-label">Mistakes</span>
                                <span className="stats-value">{mistakesCount}/{MAX_MISTAKES}</span>
                            </div>
                            <div className="stats-col stats-right">
                                <span className="timer-label">Time</span>
                                <span className="stats-value">{formatTime(secondsElapsed)}</span>
                            </div>
                        </div>

                        <div className="board-container">
                            <table id="grid">
                                <tbody>
                                    {grid.map((row, i) => (
                                        <tr key={i}>
                                            {row.map((cell, j) => {
                                                const isSelected = selectedCell?.r === i && selectedCell?.c === j;
                                                const isHighlight = selectedCell && !isSelected && 
                                                    (selectedCell.r === i || selectedCell.c === j || 
                                                    (Math.floor(i/3) === Math.floor(selectedCell.r/3) && Math.floor(j/3) === Math.floor(selectedCell.c/3)));

                                                return (
                                                    <td key={j} className={`${isSelected ? 'selected-cell' : ''} ${isHighlight ? 'highlight' : ''}`}>
                                                        <input
                                                            id={`cell-${i}-${j}`}
                                                            type="text"
                                                            inputMode="none"
                                                            autoComplete="off"
                                                            spellCheck={false}
                                                            value={cell.val}
                                                            readOnly={cell.isGiven || isGameOver || isGameWon}
                                                            className={cell.isGiven ? 'given-cell' : 'user-cell'}
                                                            style={{ color: cell.color }}
                                                            onFocus={() => setSelectedCell({r: i, c: j})}
                                                            onTouchStart={(e) => {
                                                                if (!cell.isGiven) {
                                                                    e.preventDefault();
                                                                    setSelectedCell({r: i, c: j});
                                                                    (document.activeElement as HTMLElement)?.blur();
                                                                }
                                                            }}
                                                            onChange={(e) => handleInput(i, j, e.target.value)}
                                                            onKeyDown={(e) => handleKeyDown(e, i, j)}
                                                        />
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="numpad">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button key={num} onClick={() => {
                                    if (selectedCell) handleInput(selectedCell.r, selectedCell.c, num.toString());
                                }}>{num}</button>
                            ))}
                            <button className="del-btn" onClick={() => {
                                if (selectedCell) handleInput(selectedCell.r, selectedCell.c, '');
                            }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                                    <line x1="18" y1="9" x2="12" y2="15"></line>
                                    <line x1="12" y1="9" x2="18" y2="15"></line>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="home-about-container">
                        <h2>About Sudoku</h2>
                        <p>This popular Japanese puzzle game is based entirely on logic. The goal is to fill a 9x9 grid with numbers so that every row, column, and 3x3 box contains all digits from 1 to 9. Playing daily improves your concentration and brain power. Start a game now to make it your favorite online puzzle.</p>
                    </div>
                </div>
            </div>

            <footer className="app-footer">
                <p>&copy; 2026. All rights reserved.</p>
            </footer>

            <div className={`modal ${isGameWon ? 'show' : ''}`}>
                <div className="modal-content victory-card">
                    <div className="trophy">🏆</div>
                    <h2>Puzzle Solved!</h2>
                    <div className="victory-details">
                        <div className="v-stat">
                            <span>Difficulty</span>
                            <strong>{difficultyText}</strong>
                        </div>
                        <div className="v-stat">
                            <span>Time</span>
                            <strong>{formatTime(secondsElapsed)}</strong>
                        </div>
                        <div className="v-stat">
                            <span>+Points</span>
                            <strong>{victoryPoints}</strong>
                        </div>
                    </div>
                    <button onClick={() => startNewGame(difficultyValue, difficultyText)}>Play Again</button>
                </div>
            </div>

            <div className={`modal ${isLeaderboardOpen ? 'show' : ''}`} onClick={() => setIsLeaderboardOpen(false)}>
                <div className="modal-content lb-elite-card" onClick={(e) => e.stopPropagation()}>
                    <div className="lb-elite-header">
                        <div>
                            <h2 className="lb-title">Leaderboard</h2>
                            <p className="lb-subtitle">Global Top 10 Scores</p>
                        </div>
                        <button className="lb-elite-close" onClick={() => setIsLeaderboardOpen(false)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <div className="lb-elite-profile">
                        {!isEditingUsername ? (
                            <div className="lb-profile-view">
                                <div className="lb-profile-info">
                                    <span className="lb-profile-label">Current Player</span>
                                    <strong>{lbUsername}</strong>
                                </div>
                                <button className="lb-elite-edit-btn" onClick={() => { setInlineInput(lbUsername); setInlineStatus({msg:'', type:''}); setIsEditingUsername(true); }}>
                                    <span>Edit</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                </button>
                            </div>
                        ) : (
                            <div className="lb-profile-edit">
                                <div className="lb-edit-flex">
                                    <div className="lb-input-wrapper">
                                        <input type="text" id="inline-username-input" autoFocus autoComplete="off" spellCheck="false" maxLength={15} value={inlineInput} onChange={handleUsernameCheck} placeholder="New username" />
                                        <div className={`status-msg ${inlineStatus.type}`}>{inlineStatus.msg}</div>
                                    </div>
                                    <div className="lb-action-wrapper">
                                        <button className="lb-elite-cancel" onClick={() => setIsEditingUsername(false)}>Cancel</button>
                                        <button className="lb-elite-save" disabled={isSavingUsername} onClick={confirmUsernameChange}>Save</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="leaderboard-container">
                        <div className="leaderboard-list">
                            {leaderboardData.length === 0 ? (
                                <div className="lb-msg">Loading top scores...</div>
                            ) : (
                                leaderboardData.map((data, index) => {
                                    const rank = index + 1;
                                    let rankClass = "lb-rank";
                                    let rankIcon: React.ReactNode = rank;
                                    if (rank === 1) { rankClass += " rank-1"; rankIcon = "🥇"; }
                                    else if (rank === 2) { rankClass += " rank-2"; rankIcon = "🥈"; }
                                    else if (rank === 3) { rankClass += " rank-3"; rankIcon = "🥉"; }

                                    const isMe = (data.playerId === playerId) || (!data.playerId && data.name === lbUsername);

                                    return (
                                        <div className="lb-row" key={index}>
                                            <div className={rankClass}>{rankIcon}</div>
                                            <div className="lb-details">
                                                <div className="lb-name">
                                                    {isMe ? lbUsername : data.name} 
                                                    {isMe && <span style={{fontSize: '11px', color: 'var(--input-user)', background: 'var(--selected-bg)', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px', fontWeight: 800}}>You</span>}
                                                </div>
                                                <div className="lb-diff">{data.difficulty} &bull; {formatTime(data.time)}</div>
                                            </div>
                                            <div className="lb-score">{data.points}</div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}