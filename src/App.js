// src/MainApp.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, NavLink } from 'react-router-dom';
import ForegroundApp from './ForegroundApp'; // 確保路徑正確
import BackgroundApp from './BackgroundApp'; // 確保路徑正確
import Annotation from './Annotation';
import './App.css';

function MainApp() {
  return (
    <Router>
      <div className="App">
        <nav>
          <ul>
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                前景圖片
              </NavLink>
            </li>
            <li>
              <NavLink to="/background" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                背景圖片
              </NavLink>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<ForegroundApp />} />
          <Route path="/background" element={<BackgroundApp />} />
          <Route path="/annotation" element={<Annotation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default MainApp;
