// src/PolygonDrawer.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PolygonDrawer = ({ canvasId, imageId, existingAnnotations, polygonClass, isDrawing }) => {
  const [points, setPoints] = useState([]);
  const [allPolygons, setAllPolygons] = useState([]);

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
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawPolygon = () => {
      // 清除畫布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 繪製圖像
      const img = document.getElementById('baseImage');
      if (img) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      // 繪製所有已保存的多邊形（僅限當前 imageId）
      allPolygons.filter(polygon => polygon.imageId === imageId).forEach(polygon => {
        ctx.beginPath();
        ctx.moveTo(polygon.points[0][0] * canvas.width, polygon.points[0][1] * canvas.height);
        for (let i = 1; i < polygon.points.length; i++) {
          ctx.lineTo(polygon.points[i][0] * canvas.width, polygon.points[i][1] * canvas.height);
        }
        ctx.closePath();
        ctx.fillStyle = classColors[polygonClass-1];
        ctx.fill();
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // 繪製正在繪製的多邊形
      if (points.length > 2) {
        ctx.beginPath();
        ctx.moveTo(points[0][0] * canvas.width, points[0][1] * canvas.height);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i][0] * canvas.width, points[i][1] * canvas.height);
        }
        ctx.closePath();
        ctx.fillStyle = classColors[polygonClass-1];
        ctx.fill();
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 繪製標記點
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point[0] * canvas.width, point[1] * canvas.height, 3, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      });

      // 繪製原本的標記
      existingAnnotations.forEach(annotation => {
        const color = classColors[annotation.class];
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

    drawPolygon();
  }, [points, allPolygons, imageId, existingAnnotations]);

  const handleCanvasClick = (e) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - rect.left) / canvas.width, 0), 1);
    const y = Math.min(Math.max((e.clientY - rect.top) / canvas.height, 0), 1);

    setPoints([...points, [x, y]]);
  };

  const handleKeyPress = (e) => {
    if (e.key === ' ') {
      savePolygon();
    } else if (e.key === 'Escape') {
      cancelDrawing();
    }
  };

  const savePolygon = () => {
    const data = {
      image_id: imageId,
      coordinates: points.flat(),
      class: polygonClass - 1
    };
    axios.post('http://localhost:5500/api/annotations', data)
      .then(response => {
        console.log('Polygon saved:', response.data);
        setAllPolygons([...allPolygons, { imageId, points }]);
        setPoints([]);
      })
      .catch(error => {
        console.error('Error saving polygon:', error);
      });
  };

  const cancelDrawing = () => {
    setPoints([]);
  };

  useEffect(() => {
    const canvas = document.getElementById(canvasId);
    if (isDrawing && canvas) {
      canvas.style.cursor = 'crosshair';
      canvas.addEventListener('click', handleCanvasClick);
      window.addEventListener('keydown', handleKeyPress);
    } else {
      if (canvas) {
        canvas.style.cursor = 'default';
        canvas.removeEventListener('click', handleCanvasClick);
      }
      window.removeEventListener('keydown', handleKeyPress);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('click', handleCanvasClick);
      }
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isDrawing, points, allPolygons]);

  return null; // 不再返回按钮
};

export default PolygonDrawer;
