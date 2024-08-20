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
                    /*
                    @bp.route('/api/annotations', methods=['POST'])
                        def add_annotation():
                            data = request.json
                            annotation = {
                                'image_id': data['image_id'],
                                'coordinates': data['coordinates'],
                                'class': data['class']
                            }
                            print(annotation)
                            result = annotations_col.insert_one(annotation)
                            annotation['_id'] = str(result.inserted_id)
                            return jsonify(annotation), 201*/

                    //建立一個映射 field , grass, wasteland, grave, tree, bamboo, dryland, tea
                    //reverse class map
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
                        const response = await axios.post('http://localhost:5500/api/annotations', {
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
