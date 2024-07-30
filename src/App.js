import React from 'react';
import { BrowserRouter as Router, Route, Routes, NavLink } from 'react-router-dom';
import ForegroundApp from './ForegroundApp'; // 确保路径正确
import BackgroundApp from './BackgroundApp'; // 确保路径正确
import './App.css';

function MainApp() {
  return (
    <Router>
      <div className="App">
        <nav>
          <ul>
            <li><NavLink to="/" className="nav-link" activeClassName="active">前景圖片</NavLink></li>
            <li><NavLink to="/background" className="nav-link" activeClassName="active">背景圖片</NavLink></li>
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<ForegroundApp />} />
          <Route path="/background" element={<BackgroundApp />} />
        </Routes>
      </div>
    </Router>
  );
}

export default MainApp;
