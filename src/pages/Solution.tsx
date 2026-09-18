import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Solution() {
    const [solutionGrid, setSolutionGrid] = useState<number[][]>([]);
    const [message, setMessage] = useState('Live Solution Tracker');

    const loadSolution = () => {
        const savedData = localStorage.getItem('sudokuGame');
        if (savedData) {
            const data = JSON.parse(savedData);
            if (data.solution && data.solution.length === 9) {
                setSolutionGrid(data.solution);
                setMessage('Live Solution Tracker');
            } else {
                setSolutionGrid([]);
                setMessage('No active game found. Start a game first.');
            }
        } else {
            setSolutionGrid([]);
            setMessage('No active game found. Start a game first.');
        }
    };

    useEffect(() => {
        loadSolution();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'sudokuGame') {
                loadSolution();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return (
        <div>
            <nav className="top-navbar">
                <div className="nav-content">
                    <div className="nav-left">
                        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-color)' }}>
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            <h2>Sudoku</h2>
                        </Link>
                    </div>
                    <div className="nav-right">
                        <Link to="/" className="dropdown-selected new-game-btn" style={{ textDecoration: 'none' }}>
                            <span>Play Now</span>
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="main-content">
                <div className="app-container" style={{ maxWidth: 'min(90vw, 50vh)', margin: '0 auto' }}>
                    <div className="stats-bar">
                        <div id="message" style={{ color: 'var(--text-color)', fontWeight: 600, textAlign: 'center', width: '100%' }}>{message}</div>
                    </div>
                    
                    <div className="board-container">
                        <table>
                            <tbody>
                                {solutionGrid.map((row, i) => (
                                    <tr key={i}>
                                        {row.map((val, j) => (
                                            <td key={j}>
                                                <input 
                                                    type="text" 
                                                    value={val !== 0 ? val : ''} 
                                                    readOnly 
                                                    className="given-cell" 
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <footer className="app-footer">
                <p>&copy; 2026. All rights reserved.</p>
            </footer>
        </div>
    );
}