import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ClubManagement from './pages/ClubManagement';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/clubs" element={<ClubManagement />} />
      </Routes>
    </Router>
  );
}

export default App;