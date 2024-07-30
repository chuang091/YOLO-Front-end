import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './Annotation.css';

function Annotation() {
  const location = useLocation();
  const { state } = location;
  const { selectedImages } = state || { selectedImages: [] };

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [vertexNodesR, setVertexNodesR] = useState([]);
  const [coordinatesArray, setCoordinatesArray] = useState([]);
  const [actionArray, setActionArray] = useState([]);
  const [currentPtype, setCurrentPtype] = useState(1);
  const [currentMode, setCurrentMode] = useState(1);
  const imageDisplayRef = useRef(null);
  const [tempPolygonR, setTempPolygonR] = useState([]);
  const allPolygonsDetails = useRef([]);
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

  useEffect(() => {
    console.log("Received parameters:", selectedImages);
    
    if (selectedImages.length > 0) {
      displayImage(0);
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setCoordinatesArray([]);
        setActionArray([]);
        document.querySelectorAll('.segment-mark, .prediction-area').forEach(el => el.remove());
      }
      if (event.code === "Space" && currentMode === 1) {
        setVertexNodesR((prev) => [...prev, { points: tempPolygonR.flat(), ptype: currentPtype - 1 }]);
        const imageName = selectedImages[currentImageIndex]?.filename;
        if (imageName) {
          savePolygonData(vertexNodesR, 512, imageName);
        }
        setCoordinatesArray([]);
        setActionArray([]);
        document.querySelectorAll('.segment-mark').forEach(el => el.remove());
        document.querySelectorAll('.prediction-area').forEach(el => {
          el.classList.remove('prediction-area');
          el.classList.add('annotated-area');
          el.style.backgroundColor = 'rgba(255, 255, 0, 0.5)';
        });
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedImages, currentMode, tempPolygonR, vertexNodesR, currentPtype]);

  const getColorByPtype = (ptype) => {
    switch (ptype) {
      case "0":
        return 'rgba(255, 0, 0, 0.5)';
      case "1":
        return 'rgba(0, 255, 0, 0.5)';
      case "2":
        return 'rgba(0, 0, 255, 0.5)';
      case "3":
        return 'rgba(255, 255, 0, 0.5)';
      case "4":
        return 'rgba(0, 255, 255, 0.5)';
      case "5":
        return 'rgba(255, 0, 255, 0.5)';
      case "6":
        return 'rgba(128, 0, 0, 0.5)';
      case "7":
        return 'rgba(0, 128, 0, 0.5)';
      case "8":
        return 'rgba(0, 0, 128, 0.5)';
      case "9":
        return 'rgba(128, 128, 0.5)';
      case "10":
        return 'rgba(0, 128, 128, 0.5)';
      default:
        return 'rgba(0, 0, 255, 0.5)';
    }
  };

  const displayImage = async (index) => {
    if (index >= 0 && index < selectedImages.length) {
      clearAllData();
      document.querySelectorAll('.prediction-area').forEach(e => e.remove());
      document.querySelectorAll('.YOLO-area').forEach(e => e.remove());

      const imageData = selectedImages[index]?.data;
      if (imageData) {
        imageDisplayRef.current.src = `data:image/jpeg;base64,${imageData}`;
        setCurrentImageIndex(index);
        const imageName = selectedImages[index]?.filename;

        await processImage(imageData, imageName);

      }
    }
  };

  const processImage = (imageData, imageName) => {
    return fetch('http://localhost:5500/process_image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_data: imageData, image_name: imageName }),
    });
  };

  const createPolygonDiv = (annotation, imageName) => {
    const points = annotation.coordinates.map((coord, idx) => {
      if (idx % 2 === 0) return `${coord * 100}%`;
      return `${annotation.coordinates[idx - 1] * 100}% ${coord * 100}%`;
    }).join(', ');

    const pointsArray = annotation.coordinates.flatMap((coord, idx) => {
      return coord * 512;
    });

    const polygonDiv = document.createElement('div');
    polygonDiv.className = 'YOLO-area';
    polygonDiv.style.position = 'absolute';
    polygonDiv.style.top = '0';
    polygonDiv.style.left = '0';
    polygonDiv.style.width = '100%';
    polygonDiv.style.height = '100%';
    polygonDiv.style.clipPath = `polygon(${points})`;
    polygonDiv.style.backgroundColor = classColors[annotation.class.toString()];

    polygonDiv.addEventListener('click', function () {
      if (currentMode === 2) {
        setVertexNodesR((prev) => [...prev, { points: pointsArray, ptype: annotation.class }]);
        savePolygonData(vertexNodesR, 512, imageName);
        this.style.backgroundColor = 'rgba(255, 255, 0, 0.5)';
      }
    });

    polygonDiv.addEventListener('contextmenu', function (event) {
      if (currentMode === 2) {
        event.preventDefault();
        this.remove();
      }
    });

    document.getElementById('image-container').appendChild(polygonDiv);
  };

  const clearAllData = () => {
    setVertexNodesR([]);
    document.querySelectorAll('.vertex-node, .polygon-container').forEach((container) => container.remove());
  };

  const savePolygonData = (vertexNodes, size, imageName) => {
    const formattedData = vertexNodes.map((polygon) => {
      const points = [];
      for (let i = 0; i < polygon.points.length; i += 2) {
        points.push([polygon.points[i], polygon.points[i + 1]]);
      }
      return `${polygon.ptype} ${points.map(([x, y]) => `${(x / size)} ${(y / size)}`).join(' ')}`;
    }).join('\n');

    const formData = new FormData();
    formData.append("data", formattedData);
    formData.append("imageName", imageName);

    fetch("http://localhost:5500/save-polygon-data", {
      method: "POST",
      body: formData,
    }).then((response) => response.json()).then((data) => console.log(data)).catch((error) => console.error("Error:", error));
  };

  const handleAnnotationClick = () => {
    console.log("Saving Annotations...");
    const imageName = selectedImages[currentImageIndex]?.filename;
    if (imageName) {
      savePolygonData(vertexNodesR, 512, imageName);
    }
  };

  const handlePrev = () => {
    if (currentImageIndex > 0) {
      saveCurrentImagePolygons();
      setCurrentImageIndex(currentImageIndex - 1);
      setVertexNodesR(allPolygonsDetails.current[currentImageIndex - 1] || []);
      clearPolygonsOnScreen();
      displayImage(currentImageIndex - 1);
      redrawPolygonsForCurrentImage();
    }
  };

  const handleNext = () => {
    if (currentImageIndex < selectedImages.length - 1) {
      saveCurrentImagePolygons();
      setCurrentImageIndex(currentImageIndex + 1);
      setVertexNodesR(allPolygonsDetails.current[currentImageIndex + 1] || []);
      clearPolygonsOnScreen();
      displayImage(currentImageIndex + 1);
      redrawPolygonsForCurrentImage();
    }
  };

  const saveCurrentImagePolygons = () => {
    allPolygonsDetails.current[currentImageIndex] = [...vertexNodesR];
    clearPolygonsOnScreen();
  };

  const clearPolygonsOnScreen = () => {
    document.querySelectorAll('.segment-mark, .annotated-area').forEach(el => el.remove());
  };

  const redrawPolygonsForCurrentImage = () => {
    const polygons = allPolygonsDetails.current[currentImageIndex] || [];
    polygons.forEach(polygon => drawPolygon(polygon));
  };

  const drawPolygon = (polygon) => {
    let points = [];
    for (let i = 0; i < polygon.points.length; i += 2) {
      points.push(`${polygon.points[i]}px ${polygon.points[i + 1]}px`);
    }
    const pointsString = points.join(', ');

    const polygonDiv = document.createElement('div');
    polygonDiv.className = 'annotated-area';
    polygonDiv.style.position = 'absolute';
    polygonDiv.style.top = '0';
    polygonDiv.style.left = '0';
    polygonDiv.style.pointerEvents = 'none';
    polygonDiv.style.width = '100%';
    polygonDiv.style.height = '100%';
    polygonDiv.style.clipPath = `polygon(${pointsString})`;
    polygonDiv.style.backgroundColor = getColorByPtype(polygon.ptype.toString());
    polygonDiv.style.pointerEvents = 'none';

    const imageContainer = document.getElementById('image-container');
    if (imageContainer) {
      imageContainer.appendChild(polygonDiv);
    }
  };

  const handleMouseUp = (event) => {
    if (currentMode !== 1) return;

    disableContextMenu();
    const imageContainer = document.getElementById('image-container');
    const segmentPoint = document.createElement('div');
    segmentPoint.id = 'segment-point';
    segmentPoint.style.position = 'absolute';
    segmentPoint.style.top = '0';
    segmentPoint.style.left = '0';
    segmentPoint.style.width = '100%';
    segmentPoint.style.height = '100%';
    segmentPoint.style.pointerEvents = 'none';
    imageContainer.style.position = 'relative';
    imageContainer.appendChild(segmentPoint);
    const imageName = selectedImages[currentImageIndex]?.filename;
    if (!imageName) return;
    
    const rect = imageContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const actionValue = (event.button === 2) ? 0 : 1;
    setCoordinatesArray((prev) => [...prev, [x, y]]);
    setActionArray((prev) => [...prev, actionValue]);
    const coordinatesJson = JSON.stringify(coordinatesArray);
    const actionJson = JSON.stringify(actionArray);
    const markSize = 10;
    const markX = x - markSize / 2;
    const markY = y - markSize / 2;

    const markElement = document.createElement('div');
    markElement.className = 'segment-mark';
    markElement.style.left = markX + 'px';
    markElement.style.top = markY + 'px';
    markElement.style.position = 'absolute';
    markElement.style.width = `${markSize}px`;
    markElement.style.height = `${markSize}px`;
    markElement.style.backgroundColor = actionValue === 1 ? 'green' : 'red';
    segmentPoint.appendChild(markElement);

    fetch('http://localhost:5500/sam', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_name: imageName, points: coordinatesJson, actions: actionJson }),
    }).then(response => response.json()).then(data => {
      setTempPolygonR(data);
      document.querySelectorAll('.prediction-area').forEach(e => e.remove());
      const polygonCoords = data;
      const points = polygonCoords.map(([x, y]) => `${x}px ${y}px`).join(', ');

      const polygonDiv = document.createElement('div');
      polygonDiv.className = 'prediction-area';
      polygonDiv.style.position = 'absolute';
      polygonDiv.style.top = '0';
      polygonDiv.style.left = '0';
      polygonDiv.style.width = '100%';
      polygonDiv.style.height = '100%';
      polygonDiv.style.clipPath = `polygon(${points})`;
      polygonDiv.style.backgroundColor = getColorByPtype(currentPtype.toString());
      polygonDiv.style.pointerEvents = 'none';

      document.getElementById('image-container').appendChild(polygonDiv);
    }).catch(error => {
      console.error('Error:', error);
    });
  };

  const disableContextMenu = () => {
    document.addEventListener('contextmenu', function (event) {
      event.preventDefault();
    });
  };

  const handlePtypeClick = (event, ptype) => {
    event.preventDefault();
    document.querySelector('.ptype.active').classList.remove('active');
    event.currentTarget.parentElement.classList.add('active');
    setCurrentPtype(ptype);
    console.log(`Selected ptype: ${ptype}`);
  };

  return (
    <div className="Annotation" onMouseUp={handleMouseUp}>
      <div className="control-group">
        <button id="prev" onClick={handlePrev}>上一頁</button>
        <button id="next" onClick={handleNext}>下一頁</button>
        <button id="save-button" onClick={handleAnnotationClick}>儲存標註</button>
        <div id="image-counter">{currentImageIndex + 1} / {selectedImages.length}</div>
      </div>
      <div className="image-container" id="image-container">
        <img id="image-display" alt="圖片預覽" ref={imageDisplayRef} />
      </div>
      <div className="sidebar">
        <button id="polygon-mode" className="active" onClick={() => setCurrentMode(0)}>
          <span className="iconify theme--light white--text" data-icon="mdi-vector-polygon"></span>
        </button>
        <button id="robot-mode" onClick={() => setCurrentMode(1)}>
          <span className="iconify" data-icon="mdi-robot"></span>
        </button>
        <button id="model-mode" onClick={() => setCurrentMode(2)}>
          <span className="iconify" data-icon="mdi-robot"></span>
        </button>
      </div>

      <nav aria-label="Page navigation">
        <ul className="pagination" id="pagination">
          {['聚落', '田地', '草地', '墓地', '荒地', '茶園'].map((text, index) => (
            <li key={index} className={`ptype ${index === 0 ? 'active' : ''}`} data-ptype={index + 1}>
              <a className="ptypeBtn" data-ptype={index + 1} href="#" onClick={(e) => handlePtypeClick(e, index + 1)}>
                {text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <script src="//code.iconify.design/1/1.0.6/iconify.min.js"></script>
    </div>
  );
}

export default Annotation;
