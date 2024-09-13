import React, { useState } from 'react';
import axios from 'axios';

function UploadImage() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 將文件轉換為 Base64
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files); // 獲取多個文件
    const readers = [];

    files.forEach(file => {
      const reader = new FileReader();
      readers.push(
        new Promise((resolve, reject) => {
          reader.onloadend = () => {
            resolve(reader.result); // 返回 Base64 結果
          };
          reader.onerror = reject;
        })
      );
      reader.readAsDataURL(file); // 讀取文件為 Base64
    });

    Promise.all(readers).then(results => {
      setSelectedFiles(results); // 設置選擇的多個 Base64 圖片
    }).catch(error => {
      setErrorMessage('文件讀取失敗');
    });
  };

  // 上傳圖片到後端
  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      setErrorMessage('請選擇至少一張圖片再上傳');
      return;
    }

    const uploadPromises = selectedFiles.map((file, index) => {
      return axios.post('http://localhost:5500/upload', { image: file }, {
        onUploadProgress: progressEvent => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prevProgress => ({
            ...prevProgress,
            [index]: progress,
          }));
        }
      });
    });

    Promise.all(uploadPromises)
      .then(() => {
        setUploadSuccess(true);
        setErrorMessage('');
      })
      .catch(() => {
        setUploadSuccess(false);
        setErrorMessage('上傳失敗，請重試');
      });
  };

  return (
    <div>
      <h2>上傳圖片</h2>
      <input type="file" multiple onChange={handleFileChange} /> {/* 支持多選 */}
      {selectedFiles.length > 0 && (
        <div>
          <p>已選擇 {selectedFiles.length} 張圖片，準備上傳</p>
          <button onClick={handleUpload}>上傳</button>
        </div>
      )}
      {Object.keys(uploadProgress).length > 0 && (
        <div>
          {selectedFiles.map((file, index) => (
            <div key={index}>
              <p>圖片 {index + 1} 上傳進度：{uploadProgress[index] || 0}%</p>
              <progress value={uploadProgress[index] || 0} max="100" />
            </div>
          ))}
        </div>
      )}
      {uploadSuccess && <p>圖片上傳成功！</p>}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </div>
  );
}

export default UploadImage;
