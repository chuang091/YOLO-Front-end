import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function BackgroundApp() {
  const [images, setImages] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [downloadPath, setDownloadPath] = useState('C:/Users/chuan/OneDrive/桌面/臺灣寶圖專題/images');

  useEffect(() => {
    axios.get('http://localhost:5500/api/background_images')
      .then(response => {
        console.log('Fetched background images:', response.data);
        setImages(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the background images!', error);
      });

    setTimeout(() => {
      setIsDataLoaded(true);
    }, 2000);
  }, []);

  const handleImageClick = (event, imageId) => {
    if (event.shiftKey) {
      setSelectedImages(prevSelectedImages => {
        const newSelectedImages = new Set(prevSelectedImages);
        if (newSelectedImages.has(imageId)) {
          newSelectedImages.delete(imageId);
        } else {
          newSelectedImages.add(imageId);
        }
        return newSelectedImages;
      });
    } else {
      setSelectedImages(new Set([imageId]));
    }
  };

  const handleDeleteSelectedImages = () => {
    selectedImages.forEach(imageId => {
      axios.delete(`http://localhost:5500/api/background_images/${imageId}`)
        .then(response => {
          console.log('Deleted background image:', response.data);
          setImages(images.filter(image => image._id !== imageId));
          setSelectedImages(prevSelectedImages => {
            const newSelectedImages = new Set(prevSelectedImages);
            newSelectedImages.delete(imageId);
            return newSelectedImages;
          });
        })
        .catch(error => {
          console.error('There was an error deleting the background image!', error);
        });
    });
  };

  const handleDownloadAllImages = () => {
    images.forEach(image => {
      const link = document.createElement('a');
      link.href = `data:image/jpeg;base64,${image.data}`;
      link.download = `${downloadPath}/${image.filename}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleDownloadPathChange = (event) => {
    setDownloadPath(event.target.value);
  };

  return (
    <div className="App">
      <div className="header">
        <h1>背景圖片監控平台</h1>
        <div>
          <input
            type="text"
            placeholder="輸入下載路徑"
            value={downloadPath}
            onChange={handleDownloadPathChange}
          />
          <button onClick={handleDownloadAllImages}>下載所有圖片</button>
          <button onClick={handleDeleteSelectedImages}>刪除選中的圖片</button>
        </div>
      </div>
      {isDataLoaded ? (
        <div className="image-gallery">
          {images.map((image, index) => (
            <div
              key={image._id || index}
              className={`image-container ${selectedImages.has(image._id) ? 'selected' : ''}`}
              onClick={(e) => handleImageClick(e, image._id)}
              onDoubleClick={() => handleImageClick({ shiftKey: true }, image._id)}
            >
              {image.data ? (
                <img 
                  src={`data:image/jpeg;base64,${image.data}`} 
                  alt={image.filename} 
                  className="image-canvas"
                />
              ) : (
                <p>圖片數據缺失</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>加載中...</p>
      )}
    </div>
  );
}

export default BackgroundApp;
