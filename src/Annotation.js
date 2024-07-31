// src/Annotation.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Annotation.css';

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
  "9": "rgba(128, 128, 0, 0.5)",
  "10": "rgba(0, 128, 128, 0.5)"
};

function Annotation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedImages, images, annotations } = location.state || { selectedImages: [], images: [], annotations: [] };
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? selectedImages.length - 1 : prevIndex - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === selectedImages.length - 1 ? 0 : prevIndex + 1));
  };

  const handleBack = () => {
    navigate('/');
  };

  const drawAnnotations = (canvas, imageId) => {
    if (!annotations) return; // 防止annotations未定義
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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

  const currentImageId = selectedImages[currentIndex];
  const currentImage = images.find(image => image._id === currentImageId);

  useEffect(() => {
    if (currentImage) {
      const img = new Image();
      img.src = `data:image/jpeg;base64,${currentImage.data}`;
      img.onload = () => {
        const canvas = document.getElementById('annotationCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height); // 清理畫布
        ctx.drawImage(img, 0, 0, img.width, img.height);
        drawAnnotations(canvas, currentImageId);
      };
    }
  }, [currentIndex, currentImageId]);

  return (
    <div className="annotation-container">
      <button onClick={handleBack} className="back-button">回到上一頁</button>
      {currentImage ? (
        <div className="image-display">
          <button onClick={handlePrevious}>上一張</button>
          <div className="canvas-container">
            <canvas id="annotationCanvas"></canvas>
            <img src={`data:image/jpeg;base64,${currentImage.data}`} alt={currentImage.filename} className="annotation-image" />
          </div>
          <button onClick={handleNext}>下一張</button>
        </div>
      ) : (
        <p>沒有選擇的圖片</p>
      )}
      <div className="page-info">
        {currentIndex + 1} / {selectedImages.length}
      </div>
    </div>
  );
}

export default Annotation;
