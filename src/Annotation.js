// src/Annotation.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SlidingPane from 'react-sliding-pane';
import 'react-sliding-pane/dist/react-sliding-pane.css';
import './Annotation.css';
import PolygonDrawer from './PolygonDrawer';
import Sam from './Sam';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';  

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

const setImage = (imageData, imageName) => {
  return fetch('http://localhost:5500/set_image2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image_data: imageData, image_name: imageName }),
  });
};

function Annotation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedImages, images, annotations } = location.state || { selectedImages: [], images: [], annotations: [] };
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaneOpen, setIsPaneOpen] = useState(false);
  const [hoveredAnnotation, setHoveredAnnotation] = useState(null);
  const [polygonClass, setPolygonClass] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false); // 控制繪製多邊形模式
  const [isSamModel, setIsSamModel] = useState(false); // 控制 SAM 模式
  const [progress, setProgress] = useState(0); // 進度條進度
  const [progressStatus, setProgressStatus] = useState("處理中..."); // 進度條狀態

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
    if (!annotations) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = document.getElementById('baseImage');
    if (img) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    const imageAnnotations = annotations.filter(annotation => annotation.image_id === imageId);

    imageAnnotations.forEach(annotation => {
      const color = annotation === hoveredAnnotation ? 'rgba(255, 0, 0, 0.8)' : (classColors[annotation.class] || 'rgba(255, 255, 255, 0.5)');
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
  const currentAnnotations = annotations.filter(annotation => annotation.image_id === currentImageId);

  useEffect(() => {
    if (currentImage) {
      const img = new Image();
      img.id = 'baseImage';
      img.src = `data:image/jpeg;base64,${currentImage.data}`;
      img.onload = () => {
        const canvas = document.getElementById('annotationCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, img.width, img.height);
        drawAnnotations(canvas, currentImageId);
      };
    }
  }, [currentIndex, currentImageId, hoveredAnnotation, annotations]);

  const handleClassChange = (e) => {
    setPolygonClass(Number(e.target.getAttribute('data-ptype')));
    document.querySelectorAll('.ptype').forEach(li => li.classList.remove('active'));
    e.target.parentElement.classList.add('active');
  };

  const handleDeleteAnnotation = (id) => {
    axios.delete(`http://localhost:5500/api/annotations/${id}`)
      .then(response => {
        console.log('Annotation deleted:', response.data);
        const updatedAnnotations = annotations.filter(annotation => annotation._id !== id);
        setHoveredAnnotation(null); 
        drawAnnotations(document.getElementById('annotationCanvas'), currentImageId);
      })
      .catch(error => {
        console.error('Error deleting annotation:', error);
      });
  };

  const handleToggleDrawing = () => {
    setIsDrawing(!isDrawing);
    if (!isDrawing) {
      setIsSamModel(false); // 禁用 SAM 模式
    }
  };

  const handleToggleSamModel = () => {
    setIsSamModel(!isSamModel);
    if (!isSamModel) {
      setIsDrawing(false); // 禁用繪製多邊形模式
    }
  };

  const processAllImages = async () => {
    for (let i = 0; i < selectedImages.length; i++) {
      const image = images.find(img => img._id === selectedImages[i]);
      if (image) {
        console.log(`處理圖片: ${image.filename}`);
        await setImage(image.data, image.filename);
        console.log(`已設定圖片: ${image.filename}`);
        setProgress(((i + 1) / selectedImages.length) * 100);
      }
    }
    setProgressStatus("已完成");
  };

  useEffect(() => {
    processAllImages();
  }, [selectedImages, images]);

  return (
    <div className={`annotation-container ${isPaneOpen ? 'pane-open' : ''}`}>
      <div className="toolbar">
        <ul className="pagination" id="pagination">
          <li className="ptype active" data-ptype="1"><button className="ptypeBtn" data-ptype="1" onClick={handleClassChange}>聚落</button></li>
          <li className="ptype" data-ptype="2"><button className="ptypeBtn" data-ptype="2" onClick={handleClassChange}>田地</button></li>
          <li className="ptype" data-ptype="3"><button className="ptypeBtn" data-ptype="3" onClick={handleClassChange}>草地</button></li>
          <li className="ptype" data-ptype="4"><button className="ptypeBtn" data-ptype="4" onClick={handleClassChange}>墓地</button></li>
          <li className="ptype" data-ptype="5"><button className="ptypeBtn" data-ptype="5" onClick={handleClassChange}>荒地</button></li>
          <li className="ptype" data-ptype="6"><button className="ptypeBtn" data-ptype="6" onClick={handleClassChange}>茶園</button></li>
        </ul>
        <button onClick={handleToggleDrawing}>{isDrawing ? '停止繪製多邊形' : '繪製多邊形'}</button>
        <button onClick={handleToggleSamModel}>{isSamModel ? '停止 SAM 模式' : '啟動 SAM 模式'}</button>
      </div>
      <button onClick={handleBack} className="back-button">回到上一頁</button>
      <button onClick={() => setIsPaneOpen(true)} className="annotations-button">查看標記</button>
      {currentImage ? (
        <div className="image-display">
          <button onClick={handlePrevious}>上一張</button>
          <div className="canvas-container">
            <canvas id="annotationCanvas"></canvas>
            <img id="baseImage" src={`data:image/jpeg;base64,${currentImage.data}`} alt={currentImage.filename} className="annotation-image" style={{ display: 'none' }} />
          </div>
          <button onClick={handleNext}>下一張</button>
        </div>
      ) : (
        <p>沒有選擇的圖片</p>
      )}
      <div className="page-info">
        {currentIndex + 1} / {selectedImages.length}
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          <div className="progress-text">{progressStatus}</div>
        </div>
      </div>
      <SlidingPane
        isOpen={isPaneOpen}
        title="標記列表"
        from="right"
        width="30%"
        onRequestClose={() => setIsPaneOpen(false)}
        onAfterOpen={() => document.querySelector('.annotation-container').classList.add('pane-open')}
        onAfterClose={() => document.querySelector('.annotation-container').classList.remove('pane-open')}
      >
        <ul className="annotation-list">
          {currentAnnotations.map((annotation, index) => (
            <li 
              key={index}
              onMouseEnter={() => setHoveredAnnotation(annotation)}
              onMouseLeave={() => setHoveredAnnotation(null)}
            >
              類別: {annotation.class}, ID: {annotation._id}
              <button className="delete-button" onClick={() => handleDeleteAnnotation(annotation._id)}>
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </li>
          ))}
        </ul>
      </SlidingPane>
      <PolygonDrawer canvasId="annotationCanvas" imageId={currentImageId} existingAnnotations={currentAnnotations} polygonClass={polygonClass} isDrawing={isDrawing} />
      <Sam canvasId="annotationCanvas" imageId={currentImageId} existingAnnotations={currentAnnotations} isSamModel={isSamModel} />
    </div>
  );
}

export default Annotation;
