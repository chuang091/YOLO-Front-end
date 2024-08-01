// src/PolygonDrawer.js
import React, { useEffect, useState } from 'react';

const PolygonDrawer = ({ canvasId, imageId }) => {
  const [points, setPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [allPolygons, setAllPolygons] = useState([]);

  useEffect(() => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawPolygon = () => {
      const img = document.getElementById('baseImage');
      if (img) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      allPolygons.forEach(polygon => {
        ctx.beginPath();
        ctx.moveTo(polygon[0][0] * canvas.width, polygon[0][1] * canvas.height);
        for (let i = 1; i < polygon.length; i++) {
          ctx.lineTo(polygon[i][0] * canvas.width, polygon[i][1] * canvas.height);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      if (points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0][0] * canvas.width, points[0][1] * canvas.height);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i][0] * canvas.width, points[i][1] * canvas.height);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point[0] * canvas.width, point[1] * canvas.height, 3, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      });
    };

    drawPolygon();
  }, [points, allPolygons]);

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
    console.log('Polygon points:', points);
    setAllPolygons([...allPolygons, points]);
    setPoints([]);
  };

  const cancelDrawing = () => {
    setPoints([]);
  };

  useEffect(() => {
    if (isDrawing) {
      document.body.style.cursor = 'crosshair';
      window.addEventListener('click', handleCanvasClick);
      window.addEventListener('keydown', handleKeyPress);
    } else {
      document.body.style.cursor = 'default';
      window.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('keydown', handleKeyPress);
    }

    return () => {
      window.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('keydown', handleKeyPress);
      document.body.style.cursor = 'default';
    };
  }, [isDrawing, points, allPolygons]);

  return (
    <button onClick={() => setIsDrawing(!isDrawing)}>
      {isDrawing ? '停止繪製多邊形' : '繪製多邊形'}
    </button>
  );
};

export default PolygonDrawer;
