import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SlidingPane from 'react-sliding-pane';
import 'react-sliding-pane/dist/react-sliding-pane.css';
import './Annotation.css';
import PolygonDrawer from './PolygonDrawer';
import Sam from './Sam';
import ObjectDetection from './ObjectDetection';
import InstanceSegmentation from './InstanceSegmentation';
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

// Function to process and set an image on the server
const setImage = async (imageData, imageName) => {
  try {
    await axios.post('http://localhost:5500/set_image2', {
      image_data: imageData,
      image_name: imageName
    });
    console.log(`Image ${imageName} set successfully.`);
  } catch (error) {
    console.error('Error setting image:', error);
  }
};

// Function to fetch object detection results
const fetchObjectDetection = async (imageData, imageName, imageID, setDetectionResults) => {
  try {
    const requestData = {
      image_name: imageID,
      image_data: `data:image/jpeg;base64,${imageData}`
    };
    const response = await axios.post('http://localhost:5500/process_image_od', requestData);
    setDetectionResults(prev => ({
      ...prev,
      [imageID]: response.data
    }));
    console.log(`Object detection result for image ID: ${imageName}`, response.data);
  } catch (error) {
    console.error('Error fetching object detection:', error);
  }
};

// Function to fetch instance segmentation results
const fetchInstanceSegmentation = async (imageData, imageName, imageID, setSegmentationResults) => {
  try {
    const requestData = {
      image_name: imageID,
      image_data: `data:image/jpeg;base64,${imageData}`
    };
    const response = await axios.post('http://localhost:5500/process_image', requestData);
    setSegmentationResults(prev => ({
      ...prev,
      [imageID]: response.data
    }));
    console.log(`Instance segmentation result for image ID: ${imageName}`, response.data);
  } catch (error) {
    console.error('Error fetching instance segmentation:', error);
  }
};

function Annotation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedImages, images, annotations = [] } = location.state || { selectedImages: [], images: [], annotations: [] };
  const [currentIndex, setCurrentIndex] = useState(0);
  const [detectionResults, setDetectionResults] = useState({});
  const [segmentationResults, setSegmentationResults] = useState({});
  const [hoveredAnnotation, setHoveredAnnotation] = useState(null);
  const [polygonClass, setPolygonClass] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSamModel, setIsSamModel] = useState(false);
  const [isObjectDetectionEnabled, setIsObjectDetectionEnabled] = useState(false);
  const [isSegmentationEnabled, setIsSegmentationEnabled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("處理中...");
  const [isPaneOpen, setIsPaneOpen] = useState(false);


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

  const handleToggleObjectDetection = () => {
    setIsObjectDetectionEnabled(!isObjectDetectionEnabled);
    if (!isObjectDetectionEnabled) {
      const detectionCanvas = document.getElementById('detectionCanvas');
      if (detectionCanvas) {
        const detectionCtx = detectionCanvas.getContext('2d');
        detectionCtx.clearRect(0, 0, detectionCanvas.width, detectionCanvas.height);
      }
    }
  };

  const handleToggleSegmentation = () => {
    setIsSegmentationEnabled(!isSegmentationEnabled);
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
      setIsSamModel(false);
    }
  };

  const handleToggleSamModel = () => {
    setIsSamModel(!isSamModel);
    if (!isSamModel) {
      setIsDrawing(false);
    }
  };

  // Process all selected images
  const processAllImages = async () => {
    for (let i = 0; i < selectedImages.length; i++) {
      const image = images.find(img => img._id === selectedImages[i]);
      if (image) {
        console.log(`處理圖片: ${image.filename}`);
        await setImage(image.data, image.filename);
        await fetchObjectDetection(image.data, image.filename, image._id, setDetectionResults);
        await fetchInstanceSegmentation(image.data, image.filename, image._id, setSegmentationResults);
        console.log(`已檢測實例分割: ${image.filename}`);
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
          <li className="ptype" data-ptype="7"><button className="ptypeBtn" data-ptype="7" onClick={handleClassChange}>樹林</button></li>
          <li className="ptype" data-ptype="8"><button className="ptypeBtn" data-ptype="8" onClick={handleClassChange}>竹林</button></li>
          <li className="ptype" data-ptype="9"><button className="ptypeBtn" data-ptype="9" onClick={handleClassChange}>旱地</button></li>
          <li className="ptype" data-ptype="10"><button className="ptypeBtn" data-ptype="10" onClick={handleClassChange}>樹竹</button></li>
        </ul>
        <button onClick={handleToggleDrawing}>{isDrawing ? '停止繪製多邊形' : '繪製多邊形'}</button>
        <button onClick={handleToggleSamModel}>{isSamModel ? '停止 SAM 模式' : '啟動 SAM 模式'}</button>
        <div className="ios-switch">
          <label>
          實例分割   
            <input type="checkbox" checked={isSegmentationEnabled} onChange={handleToggleSegmentation} />
            <span className="slider round"></span>
          </label>
        </div>
        <div className="ios-switch">
          <label>
            物體檢測   
            <input type="checkbox" checked={isObjectDetectionEnabled} onChange={handleToggleObjectDetection} />
            <span className="slider round"></span>
          </label>
        </div>
      </div>
      <button onClick={handleBack} className="back-button">回到上一頁</button>
      <button onClick={() => setIsPaneOpen(true)} className="annotations-button">查看標記</button>
      {currentImage ? (
        <div className="image-display">
          <button onClick={handlePrevious}>上一張</button>
          <div className="canvas-container">
            <div id="detectionContainer" className="image-display"></div>
            <div id="segmentationContainer" className="segmentation-container"></div>
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
      <Sam canvasId="annotationCanvas" imageId={currentImageId} existingAnnotations={currentAnnotations} isSamModel={isSamModel} polygonClass={polygonClass} />
      <ObjectDetection
        containerId="detectionContainer"
        imageId={currentImageId}
        imageName={currentImage.filename}
        imageData={currentImage.data}
        isObjectDetectionEnabled={isObjectDetectionEnabled}
        detectionResults={detectionResults}
      />
      <InstanceSegmentation
        containerId="segmentationContainer"
        imageId={currentImageId}
        imageName={currentImage.filename}
        imageData={currentImage.data}
        isSegmentationEnabled={isSegmentationEnabled}
        segmentationResults={segmentationResults}
      />
    </div>
  );
}

export default Annotation;
