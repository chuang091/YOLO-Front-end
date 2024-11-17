import React, { useEffect } from 'react';
import axios from 'axios';
import './ObjectDetection.css'; 
import classColors from './classcolors.ts';

function ObjectDetection({ containerId, imageId, imageName, imageData, isObjectDetectionEnabled, detectionResults }) {
    useEffect(() => {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (!Array.isArray(detectionResults[imageId])) return;
        


        if (!detectionResults[imageId]) return;

        // 清空之前的矩形
        container.innerHTML = '';
        // set time out
        // 1. 1s
        if (isObjectDetectionEnabled && detectionResults[imageId]) {
          console.log('detectionResults[imageId]:', detectionResults[imageId]);
            detectionResults[imageId].forEach((result, index) => {
                const point = result["box"];
                const width = `${(point.x2 - point.x1) * 100}%`;
                const height = `${(point.y2 - point.y1) * 100}%`;
                const left = `${point.x1 * 100}%`;
                const top = `${point.y1 * 100}%`;
                const rectDiv = document.createElement('div');
                rectDiv.className = 'detection-rectangle';
                rectDiv.style.width = width;
                rectDiv.style.height = height;
                rectDiv.style.left = left;
                rectDiv.style.top = top;
                rectDiv.style.backgroundColor = classColors[result["class"]] || 'rgba(255, 255, 255, 0.5)';
                rectDiv.style.borderColor = classColors[result["class"]] || 'rgba(255, 255, 255, 0.5)';
                rectDiv.style.pointerEvents = 'auto';
                rectDiv.ondblclick = async () => {
                    rectDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                    rectDiv.style.borderColor = 'black';
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
                    try {
                        const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/annotations`, {
                            image_id: imageId,
                            coordinates: [point.x1,point.y1,point.x2,point.y1,point.x2,point.y2,point.x1,point.y2],
                            // call class map result["name"] to get the class name
                            class: classMap[result["class"]] || 'unknown'
                        });
                        console.log('Annotation saved:', response.data);
                    } catch (error) {
                        console.error('Error saving annotation:', error);
                    }
                };

                container.appendChild(rectDiv);
            });
        }
    }, [containerId, imageId, imageData, isObjectDetectionEnabled, detectionResults]);

    return null;
}

export default ObjectDetection;