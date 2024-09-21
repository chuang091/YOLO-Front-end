import React, { useEffect } from 'react';
import './InstanceSegmentation.css';

function InstanceSegmentation({ containerId, imageId, isSegmentationEnabled, segmentationResults }) {
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
          polygonDiv.style.border = `2px solid rgba(0, 255, 0, 0.8)`; // Optional border color to visualize the edges
          polygonDiv.style.backgroundColor = 'rgba(0, 255, 0, 0.3)'; // Optional background color for the mask

          // Generate the `clip-path` CSS property based on the polygon points
          const polygonPoints = xSegments.map((x, index) => `${x * 100}% ${ySegments[index] * 100}%`).join(', ');
          polygonDiv.style.clipPath = `polygon(${polygonPoints})`;

          polygonDiv.style.width = '100%'; // Full width of the container
          polygonDiv.style.height = '100%'; // Full height of the container

          container.appendChild(polygonDiv);
        }
      });
    }
  }, [containerId, imageId, isSegmentationEnabled, segmentationResults]);

  return null;
}

export default InstanceSegmentation;
