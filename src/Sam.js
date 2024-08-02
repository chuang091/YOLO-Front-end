// src/Sam.js
import React, { useEffect, useState } from 'react';

const Sam = ({ canvasId, imageId, existingAnnotations }) => {
  const [points, setPoints] = useState([]);
  const [rightClickPoints, setRightClickPoints] = useState([]);

  useEffect(() => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawSam = () => {
      // 清除畫布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 繪製圖像
      const img = document.getElementById('baseImage');
      if (img) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      // 繪製標記點
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point[0] * canvas.width, point[1] * canvas.height, 3, 0, 2 * Math.PI);
        ctx.fillStyle = 'green';
        ctx.fill();
      });

      // 繪製右鍵點
      rightClickPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point[0] * canvas.width, point[1] * canvas.height, 3, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      });

      // 繪製原本的標記
      existingAnnotations.forEach(annotation => {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
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

    drawSam();
  }, [points, rightClickPoints, imageId, existingAnnotations]);

  const handleCanvasClick = (e) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - rect.left) / canvas.width, 0), 1);
    const y = Math.min(Math.max((e.clientY - rect.top) / canvas.height, 0), 1);

    if (e.button === 0) {
      // 左鍵
      setPoints([...points, [x, y]]);
    } else if (e.button === 2) {
      // 右鍵
      setRightClickPoints([...rightClickPoints, [x, y]]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === ' ') {
      console.log('Confirmed points:', points, rightClickPoints);
      setPoints([]);
      setRightClickPoints([]);
    } else if (e.key === 'Escape') {
      console.log('Cancelled drawing');
      setPoints([]);
      setRightClickPoints([]);
    }
  };

  useEffect(() => {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      canvas.style.cursor = 'crosshair';
      canvas.addEventListener('mousedown', handleCanvasClick);
      window.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      if (canvas) {
        canvas.style.cursor = 'default';
        canvas.removeEventListener('mousedown', handleCanvasClick);
      }
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [points, rightClickPoints]);

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  useEffect(() => {
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return null; // 不再返回按钮
};

export default Sam;
