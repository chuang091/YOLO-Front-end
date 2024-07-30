import React from 'react';
import ReactDOM from 'react-dom';
import MainApp from './App'; // 确保路径正确
import './index.css';

ReactDOM.render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>,
  document.getElementById('root')
);
