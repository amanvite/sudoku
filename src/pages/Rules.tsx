import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Rules() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div onClick={() => setIsMenuOpen(false)}>
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
                                <Link to="/">Play Game</Link>
                                <Link to="/solution">Solution</Link>
                            </div>
                        </div>
                        <h2>Sudoku</h2>
                    </div>
                    <div className="nav-right">
                        <Link to="/" style={{ textDecoration: 'none' }}>
                            <button className="leaderboard-btn">Play Now</button>
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="main-content">
                <div className="rules-page-container">
                    <div className="rules-hero">
                        <h1>How to Play</h1>
                        <p>Sudoku is a logic-based number placement puzzle. You don't need arithmetic skills to play, just logical deduction!</p>
                    </div>

                    <div className="rules-section">
                        <h2>The Golden Rules</h2>
                        <p className="rules-subtext">A standard Sudoku puzzle consists of a 9x9 grid divided into nine 3x3 smaller grids (boxes). To win, you must satisfy three conditions:</p>
                        
                        <div className="rule-cards">
                            <div className="rule-card">
                                <div className="rule-icon">1</div>
                                <h3>Rows</h3>
                                <p>Every horizontal row must contain the numbers from 1 to 9 exactly once.</p>
                            </div>
                            <div className="rule-card">
                                <div className="rule-icon">2</div>
                                <h3>Columns</h3>
                                <p>Every vertical column must contain the numbers from 1 to 9 exactly once.</p>
                            </div>
                            <div className="rule-card">
                                <div className="rule-icon">3</div>
                                <h3>Boxes</h3>
                                <p>Every 3x3 sub-grid (box) must contain the numbers from 1 to 9 exactly once.</p>
                            </div>
                        </div>
                    </div>

                    <div className="tips-section">
                        <h2>Pro Tips for Beginners</h2>
                        
                        <div className="tip-box">
                            <div className="tip-header">
                                <span className="tip-badge">Tip 1</span>
                                <strong>Look for the easy wins first</strong>
                            </div>
                            <p>Scan rows, columns, and boxes that are almost full. If a row already has 8 numbers filled in, it's very easy to deduce the 9th.</p>
                        </div>
                        
                        <div className="tip-box">
                            <div className="tip-header">
                                <span className="tip-badge">Tip 2</span>
                                <strong>Use process of elimination</strong>
                            </div>
                            <p>If you are trying to figure out what goes in a specific cell, look at its intersecting row, column, and box. Eliminate any numbers that already exist in those areas.</p>
                        </div>
                        
                        <div className="tip-box">
                            <div className="tip-header">
                                <span className="tip-badge">Tip 3</span>
                                <strong>Don't guess</strong>
                            </div>
                            <p>Sudoku requires absolutely no guessing. If you aren't 100% sure a number belongs in a cell, leave it blank and look elsewhere. A single wrong guess will break the puzzle.</p>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="app-footer">
                <p>&copy; 2026. All rights reserved.</p>
            </footer>
        </div>
    );
}