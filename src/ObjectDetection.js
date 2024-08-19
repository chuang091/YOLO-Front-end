import React, { useEffect } from 'react';

function ObjectDetection({ canvasId, imageId, imageData, isObjectDetectionEnabled, detectionResults }) {
    useEffect(() => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

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

        ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除畫布
        if (isObjectDetectionEnabled && detectionResults[imageId]) {


            // 渲染偵測結果
            detectionResults[imageId].forEach(result => {
                const point = result["box"];
                const width = Math.abs(point.x2 - point.x1);
                const height = Math.abs(point.y2 - point.y1);
                // 設置類別顏色
                const classColor = classColors[result["class"]] || 'rgba(255, 255, 255, 0.5)'; // 默認顏色為白色透明
                ctx.fillStyle = classColor;  // 設置填充顏色
                ctx.strokeStyle = classColor; // 設置邊框顏色
            
                // 繪製並填充矩形
                ctx.beginPath();
                ctx.rect(
                    point.x1 * canvas.width, // 起始 x 座標
                    point.y1 * canvas.height, // 起始 y 座標
                    width * canvas.width, // 矩形寬度
                    height * canvas.height // 矩形高度
                );
                ctx.fill(); // 填充矩形
                ctx.lineWidth = 2;
                ctx.stroke(); // 繪製矩形邊框
            });
            
        }
    }, [canvasId, imageId, imageData, isObjectDetectionEnabled, detectionResults]);

    return null; // 這裡不需要渲染任何 DOM 元素，只是操作 canvas
}

export default ObjectDetection;
