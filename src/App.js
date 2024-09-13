import React from 'react';
import { BrowserRouter as Router, Route, Routes, NavLink } from 'react-router-dom';
import ForegroundApp from './ForegroundApp';
import BackgroundApp from './BackgroundApp';
import Annotation from './Annotation';
import Dashboard from './Dashboard';
import UploadImage from './UploadImage'; // 新增的組件
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
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/upload" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                上傳圖片
              </NavLink>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<ForegroundApp />} />
          <Route path="/background" element={<BackgroundApp />} />
          <Route path="/annotation" element={<Annotation />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<UploadImage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default MainApp;
