import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

const MAX_MISTAKES = 3;

type CellData = {
    val: string;
    isGiven: boolean;
    color: string;
};

type DifficultyStats = {
    solved: number;
    bestTime: number | null;
    flawless: number;
};

type PerformanceData = {
    Easy: DifficultyStats;
    Medium: DifficultyStats;
    Hard: DifficultyStats;
    Expert: DifficultyStats;
};

const defaultStats: PerformanceData = {
    Easy: { solved: 0, bestTime: null, flawless: 0 },
    Medium: { solved: 0, bestTime: null, flawless: 0 },
    Hard: { solved: 0, bestTime: null, flawless: 0 },
    Expert: { solved: 0, bestTime: null, flawless: 0 }
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
    const [difficultyText, setDifficultyText] = useState<'Easy' | 'Medium' | 'Hard' | 'Expert'>('Medium');
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
    const [isNewRecord, setIsNewRecord] = useState(false);

    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
    const [analytics, setAnalytics] = useState<PerformanceData>(() => {
        const saved = localStorage.getItem('sudokuAnalytics');
        return saved ? JSON.parse(saved) : defaultStats;
    });

    useEffect(() => {
        document.body.classList.remove('dark-mode');
        localStorage.removeItem('sudokuTheme');
    }, []);

    const startNewGame = useCallback((diffVal: number, diffText: 'Easy' | 'Medium' | 'Hard' | 'Expert') => {
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
        setIsNewRecord(false);
        setSelectedCell(null);
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('sudokuGame');
        if (saved) {
            const data = JSON.parse(saved);
            setSolution(data.solution);
            setDifficultyValue(data.difficulty);
            const loadedDiffText = data.difficulty === 30 ? 'Easy' : data.difficulty === 45 ? 'Medium' : data.difficulty === 55 ? 'Hard' : 'Expert';
            setDifficultyText(loadedDiffText);
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
        let interval: number;
        if (!isGameOver && !isGameWon && solution.length > 0) {
            interval = window.setInterval(() => setSecondsElapsed(s => s + 1), 1000);
        }
        return () => window.clearInterval(interval);
    }, [isGameOver, isGameWon, solution]);

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
            triggerWin(currentMistakes);
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

    const triggerWin = (finalMistakes: number) => {
        setIsGameWon(true);
        confetti({ particleCount: 150, spread: 80, origin: { x: 0, y: 0.6 }, angle: 60, zIndex: 3000 });
        confetti({ particleCount: 150, spread: 80, origin: { x: 1, y: 0.6 }, angle: 120, zIndex: 3000 });

        const currentDiffStats = analytics[difficultyText];
        const prevBest = currentDiffStats.bestTime;
        const recordAchieved = prevBest === null || secondsElapsed < prevBest;
        setIsNewRecord(recordAchieved);

        const updatedAnalytics: PerformanceData = {
            ...analytics,
            [difficultyText]: {
                solved: currentDiffStats.solved + 1,
                bestTime: recordAchieved ? secondsElapsed : prevBest,
                flawless: finalMistakes === 0 ? currentDiffStats.flawless + 1 : currentDiffStats.flawless
            }
        };

        setAnalytics(updatedAnalytics);
        localStorage.setItem('sudokuAnalytics', JSON.stringify(updatedAnalytics));
    };

    const resetAnalytics = () => {
        setAnalytics(defaultStats);
        localStorage.setItem('sudokuAnalytics', JSON.stringify(defaultStats));
    };

    const totalSolved = analytics.Easy.solved + analytics.Medium.solved + analytics.Hard.solved + analytics.Expert.solved;
    const totalFlawless = analytics.Easy.flawless + analytics.Medium.flawless + analytics.Hard.flawless + analytics.Expert.flawless;

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
                                <a href="#" className="mobile-menu-leaderboard" onClick={(e) => { e.preventDefault(); setIsAnalyticsOpen(true); }}>Performance Analytics</a>
                            </div>
                        </div>
                        <h2>Sudoku</h2>
                    </div>

                    <div className="nav-right">
                        <button className="leaderboard-btn hide-on-mobile" onClick={() => setIsAnalyticsOpen(true)}>Performance Analytics</button>

                        <div className="custom-dropdown">
                            <div className={`dropdown-selected new-game-btn ${isDropdownOpen ? 'open' : ''}`} onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }}>
                                <span>New Game</span>
                                <svg className="chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                            <div className={`dropdown-options ${isDropdownOpen ? 'show' : ''}`}>
                                <div className={`dropdown-option ${difficultyValue === 30 ? 'selected' : ''}`} onClick={() => startNewGame(30, 'Easy')}>Easy</div>
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
                        <p>This popular Japanese puzzle game is based entirely on logic. The goal is to fill a 9x9 grid with numbers so that every row, column, and 3x3 box contains all digits from 1 to 9. Playing daily improves your concentration and logical deduction.</p>
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
                            <span>Personal Best</span>
                            <strong>{analytics[difficultyText].bestTime !== null ? formatTime(analytics[difficultyText].bestTime!) : formatTime(secondsElapsed)}</strong>
                        </div>
                    </div>
                    {isNewRecord && (
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--input-user)', marginBottom: '16px' }}>
                            New Personal Record!
                        </div>
                    )}
                    <button onClick={() => startNewGame(difficultyValue, difficultyText)}>Play Again</button>
                </div>
            </div>

            <div className={`modal ${isAnalyticsOpen ? 'show' : ''}`} onClick={() => setIsAnalyticsOpen(false)}>
                <div className="modal-content lb-elite-card" onClick={(e) => e.stopPropagation()}>
                    <div className="lb-elite-header">
                        <div>
                            <h2 className="lb-title">Performance Analytics</h2>
                            <p className="lb-subtitle">Personal Practice Benchmarks</p>
                        </div>
                        <button className="lb-elite-close" onClick={() => setIsAnalyticsOpen(false)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <div className="lb-elite-profile">
                        <div className="lb-profile-view" style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', padding: '4px 0' }}>
                            <div>
                                <span className="lb-profile-label" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Solved</span>
                                <strong style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-color)' }}>{totalSolved}</strong>
                            </div>
                            <div style={{ borderLeft: '1px solid var(--nav-border)' }}></div>
                            <div>
                                <span className="lb-profile-label" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Flawless Games</span>
                                <strong style={{ fontSize: '22px', fontWeight: 800, color: 'var(--input-user)' }}>{totalFlawless}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="leaderboard-container">
                        <div className="leaderboard-list">
                            {(['Easy', 'Medium', 'Hard', 'Expert'] as const).map((level) => {
                                const stat = analytics[level];
                                return (
                                    <div className="lb-row" key={level} style={{ alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
                                        <div className="lb-details">
                                            <div className="lb-name" style={{ fontSize: '16px', fontWeight: 700, marginBottom: '2px' }}>{level}</div>
                                            <div className="lb-diff" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {stat.solved} Completed &bull; {stat.flawless} Flawless
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Best Time</span>
                                            <div className="lb-score" style={{ fontSize: '16px', fontWeight: 800 }}>
                                                {stat.bestTime !== null ? formatTime(stat.bestTime) : '--:--'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ padding: '16px 24px 8px', textAlign: 'right', borderTop: '1px solid var(--nav-border)', marginTop: '8px' }}>
                        <button
                            onClick={resetAnalytics}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Reset Analytics Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}