import axios from 'axios';

export const performObjectDetection = async (imageId, imageData) => {
    try {
        // 構建 POST 請求體
        const requestData = {
            image_name: imageId,   // 後端使用的是 image_name，所以我們將 imageId 傳遞為 image_name
            image_data: `data:image/jpeg;base64,${imageData}`  // 確保 image_data 是 base64 格式的
        };

        // 發送 POST 請求到 5500/process_image_od
        const response = await axios.post('http://localhost:5500/process_image_od', requestData);

        // 打印響應結果到控制台
        console.log(`Object detection result for image ID: ${imageId}`, response.data);

        // 返回響應的數據結構
        return response.data;
    } catch (error) {
        // 如果請求出錯，打印錯誤信息到控制台
        console.error(`Error during object detection for image ID: ${imageId}`, error);
        return [];
    }
};
