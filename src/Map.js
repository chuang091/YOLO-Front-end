import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Rectangle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 設定 Marker 的圖標
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// 計算 zoom level 不同時的瓦片範圍
const convertTileCoordinates = (tileX17, tileY17, tileSize, scale15, scale17) => {
    // 轉換到 `zoom = 15` 的瓦片範圍
    const worldCoordinateX = tileX17 * tileSize / scale17;
    const worldCoordinateY = tileY17 * tileSize / scale17;

    const tileX15 = Math.floor(worldCoordinateX * scale15 / tileSize);
    const tileY15 = Math.floor(worldCoordinateY * scale15 / tileSize);

    const tileLngStart15 = (tileX15 / scale15) * 360 - 180;
    const tileLatStart15 = (Math.atan(Math.sinh(Math.PI * (1 - 2 * (tileY15 / scale15)))) * 180) / Math.PI;
    const tileLngEnd15 = ((tileX15 + 1) / scale15) * 360 - 180;
    const tileLatEnd15 = (Math.atan(Math.sinh(Math.PI * (1 - 2 * ((tileY15 + 1) / scale15)))) * 180) / Math.PI;

    return [
        [tileLatStart15, tileLngStart15],
        [tileLatEnd15, tileLngEnd15],
    ];
};

const MapComponent = () => {
    const position = [25.033, 121.5654]; // 台北市的經緯度
    const [highlightBounds, setHighlightBounds] = useState([]);

    useEffect(() => {
        // 從後端取得已標記的 zoom level = 17 的座標
        const fetchCoordinates = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/coordinate`);
                const data = await response.json();

                // 確保資料格式為 ["x_y", "x_y", ...]
                const tileCoordinates = data.map((coord) => {
                    const [x, y] = coord.split('_').map(Number);
                    return { x, y };
                });

                // 計算 zoom level = 15 的範圍
                const zoom15 = 15;
                const zoom17 = 17;
                const tileSize = 256;
                const scale15 = 1 << zoom15; // 2^15
                const scale17 = 1 << zoom17; // 2^17

                const bounds = tileCoordinates.map(({ x, y }) =>
                    convertTileCoordinates(x, y, tileSize, scale15, scale17)
                );

                setHighlightBounds(bounds);
            } catch (error) {
                console.error('Error fetching coordinates:', error);
            }
        };

        fetchCoordinates();
    }, []);

    return (
        <MapContainer center={position} zoom={15} style={{ height: '100vh', width: '100%' }}>
            <TileLayer
                url="https://gis.sinica.edu.tw/tileserver/file-exists.php?img=JM20K_1921-jpg-{z}-{x}-{y}"
            />
            {highlightBounds.map((bounds, index) => (
                <Rectangle
                    key={index}
                    bounds={bounds}
                    pathOptions={{ color: 'red', weight: 2, fillOpacity: 0.2 }}
                />
            ))}
        </MapContainer>
    );
};

export default MapComponent;