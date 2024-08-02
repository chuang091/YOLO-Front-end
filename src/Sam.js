// src/Sam.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Sam = ({ canvasId, imageId, existingAnnotations, isSamModel }) => {
  const [points, setPoints] = useState([]);
  const [actions, setActions] = useState([]);
  const [samResult, setSamResult] = useState(null);

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

    const drawSamResult = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const img = document.getElementById('baseImage');
      if (img) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      if (samResult) {
        ctx.beginPath();
        ctx.moveTo(samResult[0][0] , samResult[0][1] );
        for (let i = 1; i < samResult.length; i++) {
          ctx.lineTo(samResult[i][0] , samResult[i][1] );
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.fill();
      }

      points.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point[0], point[1] , 3, 0, 2 * Math.PI);
        ctx.fillStyle = actions[index] === 1 ? 'green' : 'red';
        ctx.fill();
      });

      existingAnnotations.forEach(annotation => {
        const color = classColors[annotation.class];
        ctx.beginPath();
        ctx.fillStyle = color;
        const coords = annotation.coordinates;
        if (coords.length >= 4) {
          ctx.moveTo(coords[0]*canvas.width, coords[1]*canvas.height);
 
            for (let i = 2; i < coords.length; i += 2) {
            ctx.lineTo(coords[i]*canvas.width, coords[i + 1]*canvas.height );
          }
          ctx.closePath();
          ctx.fill();
        }
      });
    };

    drawSamResult();
  }, [points, actions, samResult, existingAnnotations, imageId]);

  const handleCanvasClick = (e) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);

    const newPoints = [...points, [x, y]];
    const newActions = [...actions, e.button === 2 ? 0 : 1]; // 右鍵紅色（0），左鍵綠色（1）
    console.log(newPoints, newActions);
    setPoints(newPoints);
    setActions(newActions);


    sendSamRequest(newPoints, newActions);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      setPoints([]);
      setActions([]);
      setSamResult(null);
      document.querySelectorAll('.segment-point').forEach(e => e.remove());
    }
  };

  const sendSamRequest = (newPoints, newActions) => {
    const imageElement = document.getElementById('baseImage');
    const imageName = imageElement ? imageElement.alt : '';
    const coordinatesJson = JSON.stringify(newPoints);
    const actionJson = JSON.stringify(newActions);

    fetch('http://localhost:5500/sam', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_name: imageName, points: coordinatesJson, actions: actionJson }),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Sam result:', data);
        setSamResult(data);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  };

  useEffect(() => {
    const canvas = document.getElementById(canvasId);
    if (isSamModel && canvas) {
      canvas.style.cursor = 'crosshair';
      canvas.addEventListener('mouseup', handleCanvasClick);
      window.addEventListener('keydown', handleKeyPress);
      canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // 禁用右鍵菜單
    } else {
      if (canvas) {
        canvas.style.cursor = 'default';
        canvas.removeEventListener('mouseup', handleCanvasClick);
      }
      window.removeEventListener('keydown', handleKeyPress);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('mouseup', handleCanvasClick);
      }
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isSamModel, points, actions]);

  return null;
};

export default Sam;
