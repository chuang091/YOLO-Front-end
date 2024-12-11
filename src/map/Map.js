import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Rectangle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapClickHandler } from "./MapClickHandler"; // 點擊處理模組
import { useNavigate } from "react-router-dom"; // 導航函數
import { convertTileCoordinates } from "./MapClickHandler"; // 瓦片座標轉換函數

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});
const MapComponent = () => {
  const navigate = useNavigate(); // 獲取導航函數
  const position = [25.033, 121.5654]; // 台北市的經緯度
  const [highlightBounds, setHighlightBounds] = useState([]); // 儲存高亮範圍
  const [selectedTiles, setSelectedTiles] = useState([]); // 儲存選中的瓦片座標

  // 獲取已標記的座標
  useEffect(() => {
    const fetchCoordinates = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/coordinate`);
            const data = await response.json();

            const tileCoordinates = data.map((coord) => {
                const [x, y] = coord.split('_').map(Number);
                return { x, y };
            });

            const zoom15 = 15;
            const zoom17 = 17;
            const tileSize = 256;
            const scale15 = 1 << zoom15; // 2^15
            const scale17 = 1 << zoom17; // 2^17

            const bounds = tileCoordinates.map(({ x, y }) =>
                convertTileCoordinates(x, y, tileSize, scale15, scale17)
            );

            setHighlightBounds(bounds); // 更新已標記範圍
        } catch (error) {
            console.error('Error fetching coordinates:', error);
        }
    };

    fetchCoordinates();
}, []);

  const handleNavigation = (batchData) => {
    // 將多張影像處理後的資料打包為 `fetchedImages`
    const fetchedImages = batchData.map((data) => ({
      data: data.image, // Base64 數據
      filename: `${data.filename}`, // 後端返回的檔案名
      _id: data._id, // 從後端返回的數據中獲取 `_id`
    }));

    // 使用 `navigate` 導航至標註頁面
    navigate("/annotation", {
      state: {
        images: fetchedImages,
        selectedImages: fetchedImages.map((img) => img._id), // 所有選中的影像 `_id`
      },
    });
  };

  // 新增高亮範圍和瓦片座標
  const addHighlight = (bounds, tile) => {
    setHighlightBounds((prevBounds) => [...prevBounds, bounds]);
    setSelectedTiles((prevTiles) => [...prevTiles, tile]);
  };

  // 按下按鈕發送已選瓦片座標到後端
  const submitSelection = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/resolve_image_batch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tiles: selectedTiles }),
        }
      );

      const responseData = await response.json();
      handleNavigation(responseData.results); // 將後端返回的結果傳入導航函數
      // 根據需要處理返回的數據
    } catch (error) {
      console.error("Error submitting selection:", error);
    }
  };

  return (
    <>
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer url="https://gis.sinica.edu.tw/tileserver/file-exists.php?img=JM20K_1921-jpg-{z}-{x}-{y}" />
        <MapClickHandler addHighlight={addHighlight} />
        {highlightBounds.map((bounds, index) => (
          <Rectangle
            key={index}
            bounds={bounds}
            pathOptions={{ color: "red", weight: 2, fillOpacity: 0.2 }}
          />
        ))}
      </MapContainer>
      <div style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'row',  // 水平排列
          }}>
        <button
          onClick={submitSelection}
          
        >
          Submit Selection
        </button>
        <p>Selected Tiles Count: {selectedTiles.length}</p>
      </div>
    </>
  );
};

export default MapComponent;
