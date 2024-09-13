import React, { useState } from 'react';
import axios from 'axios';
import './MarkImages.css'; // 引入 CSS 檔案

function MarkImages() {
  const [modalOpen, setModalOpen] = useState(false); // 控制彈出視窗
  const [selectedCount, setSelectedCount] = useState(10); // 默認選擇的數量
  const [customCount, setCustomCount] = useState(''); // 自訂數量

  // 打開彈窗
  const openModal = () => {
    setModalOpen(true);
  };

  // 關閉彈窗
  const closeModal = () => {
    setModalOpen(false);
  };

  // 處理數量選擇
  const handleCountSelection = (count) => {
    setSelectedCount(count);
    setCustomCount(''); // 清除自訂數量
  };

  // 處理自訂數量輸入
  const handleCustomCountChange = (event) => {
    setSelectedCount(event.target.value);
    setCustomCount(event.target.value);
  };

  // 開始標記：從後端獲取圖片
  const handleStartMarking = () => {
    const count = parseInt(selectedCount, 10);
    
    // 從後端請求 Pending 圖片數據
    axios.get(`http://localhost:5500/pending?count=${count}`)
      .then(response => {
        console.log('Fetched pending images:', response.data); // 暫時先 log 出來
      })
      .catch(error => {
        console.error('Error fetching pending images:', error);
      });

    closeModal(); // 關閉彈窗
  };

  return (
    <div>
      <button onClick={openModal} className="open-modal-btn">開始標記</button>

      {/* 彈窗內容 */}
      {modalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>選擇要標記的圖片數量</h2>
            <div className="button-group">
              <button
                onClick={() => handleCountSelection(10)}
                className={selectedCount === 10 ? 'count-btn active' : 'count-btn'}
              >
                10
              </button>
              <button
                onClick={() => handleCountSelection(50)}
                className={selectedCount === 50 ? 'count-btn active' : 'count-btn'}
              >
                50
              </button>
              <button
                onClick={() => handleCountSelection(100)}
                className={selectedCount === 100 ? 'count-btn active' : 'count-btn'}
              >
                100
              </button>
              <button
                onClick={() => handleCountSelection(200)}
                className={selectedCount === 200 ? 'count-btn active' : 'count-btn'}
              >
                200
              </button>
              <div>
                <label>
                  自訂:
                  <input
                    type="number"
                    value={customCount}
                    onChange={handleCustomCountChange}
                    placeholder="輸入數量"
                    className="custom-input"
                  />
                </label>
              </div>
            </div>
            <button onClick={handleStartMarking} className="action-btn">開始標記</button>
            <button onClick={closeModal} className="cancel-btn">取消</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarkImages;
