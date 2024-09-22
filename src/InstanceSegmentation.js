import React, { useEffect } from 'react';
import axios from 'axios';
import './InstanceSegmentation.css';

function InstanceSegmentation({ containerId, imageId, isSegmentationEnabled, segmentationResults }) {
  // Color mapping for each class
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

  // Reverse class map for saving annotations
  const classMap = {
    "0": "0",
    "1": "1",
    "2": "2",
    "3": "3",
    "4": "4",
    "5": "5",
    "6": "6",
    "7": "7",
    "8": "8"
  };

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear any previous segmentation masks
    container.innerHTML = '';

    if (isSegmentationEnabled) {
      const segmentationData = segmentationResults[imageId];
      if (!segmentationData || !Array.isArray(segmentationData)) return;

      segmentationData.forEach((segment) => {
        if (segment.segments) {
          const { x: xSegments, y: ySegments } = segment.segments;

          const polygonDiv = document.createElement('div');
          polygonDiv.className = 'segmentation-polygon';
polygonDiv.style.position = 'absolute';
polygonDiv.style.border = `2px solid ${classColors[segment.class] || 'rgba(255, 255, 255, 0.5)'}`;
polygonDiv.style.backgroundColor = `${classColors[segment.class] || 'rgba(255, 255, 255, 0.5)'}`;
polygonDiv.style.opacity = 0.5;
polygonDiv.style.pointerEvents = 'auto';  // 確保可點擊
polygonDiv.style.zIndex = '10';  // 設置較高的 z-index，確保其在頂層

const polygonPoints = xSegments.map((x, index) => `${x * 100}% ${ySegments[index] * 100}%`).join(', ');
polygonDiv.style.clipPath = `polygon(${polygonPoints})`;

// 添加儲存狀態標記
polygonDiv.isSaved = false;

polygonDiv.ondblclick = async () => {
  // 如果已經儲存過，則跳過儲存
  if (polygonDiv.isSaved) {
    console.log('This segmentation is already saved.');
    return;
  }

  polygonDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  polygonDiv.style.borderColor = 'black';

  try {
    // 發送請求儲存分割區域
    const response = await axios.post('http://localhost:5500/api/annotations', {
      image_id: imageId,
      coordinates: xSegments.flatMap((x, index) => [x, ySegments[index]]),  // 展開座標
      class: classMap[segment.class] || 'unknown'  // 發送分割區域的 class
    });
    console.log('Annotation saved:', response.data);

    // 標記該區域已經儲存
    polygonDiv.isSaved = true;

    // 將 z-index 減少，使下一層的 mask 變為可點擊
    polygonDiv.style.zIndex -= 1;
  } catch (error) {
    console.error('Error saving annotation:', error);
  }
};

// 將分割區域添加到容器中
container.appendChild(polygonDiv);

        }
      });
    }
  }, [containerId, imageId, isSegmentationEnabled, segmentationResults]);

  return null;
}

export default InstanceSegmentation;
