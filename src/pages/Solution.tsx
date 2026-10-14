import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Solution() {
    const [solutionGrid, setSolutionGrid] = useState<number[][]>([]);
    const [originalGrid, setOriginalGrid] = useState<number[][]>([]);
    const [status, setStatus] = useState<'empty' | 'calculating' | 'ready'>('empty');

    useEffect(() => {
        const loadData = () => {
            const savedData = localStorage.getItem('sudokuGame');
            if (savedData) {
                const data = JSON.parse(savedData);
                if (data.solution && data.solution.length === 9 && data.puzzle) {
                    setSolutionGrid(data.solution);
                    setOriginalGrid(data.puzzle);
                    setStatus('calculating');
                    
                    // Simulate an algorithmic calculation sequence
                    setTimeout(() => {
                        setStatus('ready');
                    }, 1400);
                    return;
                }
            }
            setStatus('empty');
        };

        loadData();
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'sudokuGame') loadData();
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return (
        <div>
            <style>
                {`
                    @keyframes popIn {
                        0% { opacity: 0; transform: scale(0.3); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                    @keyframes scan {
                        0% { top: -10%; }
                        50% { top: 105%; }
                        100% { top: -10%; }
                    }
                    @keyframes pulseText {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.4; }
                    }
                `}
            </style>

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
                            <span>Return to Game</span>
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="main-content" style={{ paddingBottom: '60px' }}>
                <div className="app-container" style={{ maxWidth: '440px', margin: '0 auto' }}>
                    
                    <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-color)', marginBottom: '8px', letterSpacing: '-0.5px' }}>Solution Engine</h1>
                        
                        {status === 'ready' && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--selected-bg)', padding: '6px 16px', borderRadius: '20px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--input-user)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--input-user)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grid Solved</span>
                            </div>
                        )}
                    </div>

                    {status === 'calculating' && (
                        <div style={{ 
                            position: 'relative', 
                            width: '100%', 
                            aspectRatio: '1/1', 
                            border: '2px solid var(--nav-border)', 
                            borderRadius: '12px', 
                            overflow: 'hidden', 
                            backgroundColor: 'var(--bg-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div style={{ 
                                position: 'absolute', 
                                left: 0, 
                                right: 0, 
                                height: '2px', 
                                background: 'var(--input-user)', 
                                animation: 'scan 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite', 
                                boxShadow: '0 0 20px 4px rgba(37, 99, 235, 0.4)' 
                            }}></div>
                            
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--input-user)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', animation: 'pulseText 1.5s infinite' }}>
                                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                                <line x1="6" y1="6" x2="6.01" y2="6"></line>
                                <line x1="6" y1="18" x2="6.01" y2="18"></line>
                            </svg>
                            <div style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', animation: 'pulseText 1.5s infinite' }}>
                                Running Algorithm
                            </div>
                        </div>
                    )}

                    {status === 'ready' && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(9, 1fr)',
                            width: '100%',
                            aspectRatio: '1/1',
                            border: '3px solid var(--text-color)',
                            backgroundColor: 'var(--bg-color)',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            boxShadow: '0 12px 32px rgba(0,0,0,0.06)'
                        }}>
                            {solutionGrid.map((row, i) => (
                                row.map((val, j) => {
                                    const isGiven = originalGrid[i] && originalGrid[i][j] !== 0;
                                    const isRightThick = (j + 1) % 3 === 0 && j !== 8;
                                    const isBottomThick = (i + 1) % 3 === 0 && i !== 8;

                                    return (
                                        <div key={`${i}-${j}`} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRight: isRightThick ? '2px solid var(--text-color)' : (j === 8 ? 'none' : '1px solid var(--nav-border)'),
                                            borderBottom: isBottomThick ? '2px solid var(--text-color)' : (i === 8 ? 'none' : '1px solid var(--nav-border)'),
                                            fontSize: 'clamp(16px, 5.5vw, 26px)',
                                            fontWeight: isGiven ? 800 : 600,
                                            color: isGiven ? 'var(--text-color)' : 'var(--input-user)',
                                            backgroundColor: isGiven ? 'transparent' : 'rgba(37, 99, 235, 0.04)',
                                            // The mathematical stagger effect:
                                            animation: !isGiven ? `popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${((i * 9) + j) * 0.012}s both` : 'none'
                                        }}>
                                            {val}
                                        </div>
                                    );
                                })
                            ))}
                        </div>
                    )}

                    {status === 'empty' && (
                        <div style={{
                            marginTop: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '64px 24px',
                            background: 'var(--numpad-bg)',
                            borderRadius: '16px',
                            border: '1px dashed var(--nav-border)'
                        }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', opacity: 0.5 }}>
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="3" y1="9" x2="21" y2="9"></line>
                                <line x1="3" y1="15" x2="21" y2="15"></line>
                                <line x1="9" y1="3" x2="9" y2="21"></line>
                                <line x1="15" y1="3" x2="15" y2="21"></line>
                            </svg>
                            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-color)', marginBottom: '8px' }}>Memory Clear</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5, marginBottom: '24px' }}>
                                The engine requires an active game instance. Start playing a puzzle to calculate its logic path here.
                            </p>
                            <Link to="/" style={{
                                background: 'var(--text-color)',
                                color: 'var(--bg-color)',
                                textDecoration: 'none',
                                padding: '12px 28px',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '14px',
                                transition: 'transform 0.2s ease'
                            }}>
                                Initialize New Game
                            </Link>
                        </div>
                    )}

                </div>
            </div>

            <footer className="app-footer" style={{ position: 'fixed', bottom: 0, width: '100%', background: 'var(--bg-color)', borderTop: '1px solid var(--nav-border)' }}>
                <p>&copy; 2026. All rights reserved.</p>
            </footer>
        </div>
    );
}