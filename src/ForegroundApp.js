// src/ForegroundApp.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './App.css';

function ForegroundApp() {
  const [images, setImages] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5500/api/images')
      .then(response => {
        console.log('Fetched images:', response.data);
        setImages(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the images!', error);
      });

    axios.get('http://localhost:5500/api/annotations')
      .then(response => {
        console.log('Fetched annotations:', response.data);
        setAnnotations(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the annotations!', error);
      });

    setTimeout(() => {
      setIsDataLoaded(true);
    }, 2000);
  }, []);

  const handleNavigateToAnnotation = () => {
    navigate('/annotation', { state: { selectedImages: Array.from(selectedImages), images, annotations } });
  };

  const classColors = {
    "0": "rgba(255, 0, 0, 0.5)",
    "1": "rgba(0, 255, 0, 0.5)",
    "2": "rgba(0, 0, 255, 0.5)",
    "3": "rgba(255, 255, 0, 0.5)",
    "4": "rgba(0, 255, 255, 0.5)",
    "5": "rgba(255, 0, 255, 0.5)",
    "6": "rgba(128, 0, 0, 0.5)",
    "7": "rgba(0, 128, 0, 0.5)",
    "8": "rgba(0, 0, 128, 0.5)",
    "9": "rgba(128, 128, 0.5)",
    "10": "rgba(0, 128, 128, 0.5)"
  };

  const drawAnnotations = (canvas, imageId) => {
    const ctx = canvas.getContext('2d');
    const imageAnnotations = annotations.filter(annotation => annotation.image_id === imageId);

    imageAnnotations.forEach(annotation => {
      const color = classColors[annotation.class] || 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.fillStyle = color;
      const coords = annotation.coordinates;
      if (coords.length >= 4) {
        ctx.moveTo(coords[0] * canvas.width, coords[1] * canvas.height);
        for (let i = 2; i < coords.length; i += 2) {
          ctx.lineTo(coords[i] * canvas.width, coords[i + 1] * canvas.height);
        }
        ctx.closePath();
        ctx.fill();
      }
    });
  };

  const handleDownloadAllImages = () => {
    images.forEach(image => {
      const link = document.createElement('a');
      link.href = `data:image/jpeg;base64,${image.data}`;
      link.download = `${image.filename}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleImageLoad = (event, imageId) => {
    const canvas = event.target.nextSibling;
    const ctx = canvas.getContext('2d');
    const img = event.target;

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);
    drawAnnotations(canvas, imageId);
  };

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

  const handleDoubleClick = (imageId) => {
    axios.delete(`http://localhost:5500/api/images/${imageId}`)
      .then(response => {
        console.log('Deleted image and annotations:', response.data);
        const updatedImages = images.filter(image => image._id !== imageId);
        const updatedAnnotations = annotations.filter(annotation => annotation.image_id !== imageId);
        setImages(updatedImages);
        setAnnotations(updatedAnnotations);
        setSelectedImages(prevSelectedImages => {
          const newSelectedImages = new Set(prevSelectedImages);
          newSelectedImages.delete(imageId);
          return newSelectedImages;
        });
      })
      .catch(error => {
        console.error('There was an error deleting the image and annotations!', error);
      });
  };

  const handleDeleteSelectedImages = () => {
    selectedImages.forEach(imageId => {
      handleDoubleClick(imageId);
    });
  };

  const annotatedImageCount = images.filter(image => annotations.some(annotation => annotation.image_id === image._id)).length;

  return (
    <div className="App">
      <div className="header">
        <h1>圖片和標記數據檢視平台</h1>
        <button onClick={handleDownloadAllImages}>下載所有圖片</button>
        <button onClick={handleDeleteSelectedImages}>刪除選中的圖片</button>
        <button onClick={handleNavigateToAnnotation} disabled={selectedImages.size === 0}>
          前往標記頁面
        </button>
        <div className="stats">
          <p>總圖片數量: {images.length}</p>
          <p>帶標記的圖片數量: {annotatedImageCount}</p>
        </div>
      </div>
      {isDataLoaded ? (
        <div className="image-gallery">
          {images.filter(image => annotations.some(annotation => annotation.image_id === image._id)).map((image, index) => (
            <div
              key={image._id || index}
              className={`image-container ${selectedImages.has(image._id) ? 'selected' : ''}`}
              onClick={(e) => handleImageClick(e, image._id)}
              onDoubleClick={() => handleDoubleClick(image._id)}
            >
              {image.data ? (
                <>
                  <div className="image-name">{image.filename}</div>
                  <img 
                    src={`data:image/jpeg;base64,${image.data}`} 
                    alt={image.filename} 
                    className="hidden-image"
                    onLoad={(e) => handleImageLoad(e, image._id)}
                  />
                  <canvas className="image-canvas"></canvas>
                </>
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

export default ForegroundApp;