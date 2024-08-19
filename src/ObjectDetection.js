import React, { useEffect } from 'react';
import axios from 'axios';
import './ObjectDetection.css'; // 确保你有一个用于样式的 CSS 文件

function ObjectDetection({ containerId, imageId, imageName, imageData, isObjectDetectionEnabled, detectionResults }) {
    useEffect(() => {
        const container = document.getElementById(containerId);
        if (!container) return;

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

        // 清空之前的矩形
        container.innerHTML = '';

        if (isObjectDetectionEnabled && detectionResults[imageId]) {
            detectionResults[imageId].forEach((result, index) => {
                const point = result["box"];
                const width = `${(point.x2 - point.x1) * 100}%`;
                const height = `${(point.y2 - point.y1) * 100}%`;
                const left = `${point.x1 * 100}%`;
                const top = `${point.y1 * 100}%`;

                // 创建矩形 div
                const rectDiv = document.createElement('div');
                rectDiv.className = 'detection-rectangle';
                rectDiv.style.width = width;
                rectDiv.style.height = height;
                rectDiv.style.left = left;
                rectDiv.style.top = top;
                rectDiv.style.backgroundColor = classColors[result["class"]] || 'rgba(255, 255, 255, 0.5)';
                rectDiv.style.borderColor = classColors[result["class"]] || 'rgba(255, 255, 255, 0.5)';
                rectDiv.style.pointerEvents = 'auto';

                // 处理双击事件
                rectDiv.ondblclick = async () => {
                    rectDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                    rectDiv.style.borderColor = 'black';

                    // 保存该对象的标注数据
                    const data = `${result.class} ${result.box.x1} ${result.box.y1} ${result.box.x2} ${result.box.y2}`;
                    const formData = new FormData();
                    formData.append('data', data);
                    formData.append('imageName', imageName);

                    try {
                        await axios.post('http://localhost:5500/save-polygon-data', formData);
                        alert('Annotation saved successfully');
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
