import React, { useEffect } from 'react';
import axios from 'axios';
import './InstanceSegmentation.css';
import classColors from './classcolors.ts';

function InstanceSegmentation({ containerId, imageId, isSegmentationEnabled, segmentationResults }) {

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
      console.log('segmentationData:', segmentationData);

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
    const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/annotations`, {
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
