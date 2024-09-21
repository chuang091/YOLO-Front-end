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
    "0": "1",
    "1": "2",
    "2": "4",
    "3": "3",
    "4": "6",
    "5": "7",
    "6": "8",
    "7": "5"
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

          // Convert the segment coordinates into a CSS clip-path polygon
          const polygonPoints = xSegments.map((x, index) => `${x * 100}% ${ySegments[index] * 100}%`).join(', ');

          // Apply the clip-path CSS to create the polygon
          polygonDiv.style.clipPath = `polygon(${polygonPoints})`;
          polygonDiv.style.width = '100%'; // Full container width
          polygonDiv.style.height = '100%'; // Full container height

          // Handle click-to-save functionality
          polygonDiv.onclick = async () => {
            polygonDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';  // Update the visual after click
            polygonDiv.style.borderColor = 'black';

            // Save annotation by calling the API
            try {
              const response = await axios.post('http://localhost:5500/api/annotations', {
                image_id: imageId,
                coordinates: [
                  xSegments[0], ySegments[0], 
                  xSegments[1], ySegments[1], 
                  xSegments[2], ySegments[2], 
                  xSegments[3], ySegments[3]
                ],
                class: classMap[segment.class] || 'unknown'
              });
              console.log('Annotation saved:', response.data);
            } catch (error) {
              console.error('Error saving annotation:', error);
            }
          };

          container.appendChild(polygonDiv);
        }
      });
    }
  }, [containerId, imageId, isSegmentationEnabled, segmentationResults]);

  return null;
}

export default InstanceSegmentation;
