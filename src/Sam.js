// src/Sam.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import classColors from './classcolors.ts';

const Sam = ({ canvasId, imageId, existingAnnotations, isSamModel, polygonClass }) => {
  const [points, setPoints] = useState([]);
  const [actions, setActions] = useState([]);
  const [samResult, setSamResult] = useState([]);

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

      if (samResult.length > 0) {
        ctx.beginPath();
        ctx.moveTo(samResult[0][0], samResult[0][1]);
        for (let i = 1; i < samResult.length; i++) {
          ctx.lineTo(samResult[i][0], samResult[i][1]);
        }
        ctx.closePath();
        ctx.fillStyle = classColors[polygonClass - 1];
        ctx.fill();
      } else {
        console.log('samResult is empty');
      }

      points.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point[0], point[1], 3, 0, 2 * Math.PI);
        ctx.fillStyle = actions[index] === 1 ? 'green' : 'red';
        ctx.fill();
      });

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

    drawSamResult();
  }, [points, actions, samResult, existingAnnotations, imageId, polygonClass]);

  const handleCanvasClick = async (e) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);

    const newPoints = [...points, [x, y]];
    const newActions = [...actions, e.button === 2 ? 0 : 1]; // 右鍵紅色（0），左鍵綠色（1）
    setPoints(newPoints);
    setActions(newActions);

    const data = await sendSamRequest(newPoints, newActions);
    setSamResult(data);
  };

  const handleKeyPress = async (e) => {
    if (e.key === 'Escape') {
      clearAll();
    }
    if (e.key === ' ') {
      if (points.length > 0) {
        const data = await sendSamRequest(points, actions); // 确保获取最新的 samResult
        await saveAnnotation(data);
        clearAll();
      } else {
        console.log('No points to save');
      }
    }
  };

  const clearAll = () => {
    setPoints([]);
    setActions([]);
    setSamResult([]);
    document.querySelectorAll('.segment-point').forEach(e => e.remove());
  };

  const saveAnnotation = async (samResultToSave) => {
    if (!samResultToSave || samResultToSave.length === 0) {
      console.log('No samResult to save');
      return;
    }

    const canvas = document.getElementById(canvasId);
    const normalizedResult = samResultToSave.map(([x, y]) => [x / canvas.width, y / canvas.height]);

    const data = {
      image_id: imageId,
      coordinates: normalizedResult.flat(),
      class: polygonClass-1
    };
    console.log('Saving annotation:', data);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/annotations`, data);
      console.log('Annotation saved:', response.data);
      return response.data;  // 返回 Promise
    } catch (error) {
      console.error('Error saving annotation:', error);
      throw error;  // 拋出錯誤以便調用處理
    }
  };

  const sendSamRequest = (newPoints, newActions) => {
    const imageElement = document.getElementById('baseImage');
    const imageName = imageElement ? imageElement.alt : '';
    const coordinatesJson = JSON.stringify(newPoints);
    const actionJson = JSON.stringify(newActions);

    return fetch(`${process.env.REACT_APP_API_BASE_URL}/sam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_name: imageName, points: coordinatesJson, actions: actionJson }),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Sam result:', data);
        return data;
      })
      .catch(error => {
        console.error('Error:', error);
        throw error;
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
