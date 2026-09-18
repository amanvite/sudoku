import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SudokuGame from './pages/SudokuGame';
import Rules from './pages/Rules';
import Solution from './pages/Solution';

function App() {
  return (
    <Router basename="/sudoku"> {/* <-- Add basename here! */}
      <Routes>
        <Route path="/" element={<SudokuGame />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/solution" element={<Solution />} />
      </Routes>
    </Router>
  );
}

export default App;