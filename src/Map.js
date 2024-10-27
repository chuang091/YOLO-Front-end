import React, { useState } from 'react';
import { MapContainer, TileLayer, useMapEvents, Rectangle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 設定 Marker 的圖標
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Coordinates = [];

const MapClickHandler = ({ setBounds }) => {
    useMapEvents({
        click: (e) => {
            const zoom15 = 15;
            const zoom17 = 17;
            const tileSize = 256;
            const { lat, lng } = e.latlng;


            // 計算 zoom = 15 的瓦片範圍
            const scale15 = 1 << zoom15;
            const worldCoordinateX15 = ((lng + 180) / 360) * scale15 * tileSize;
            const worldCoordinateY15 =
                ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
                scale15 *
                tileSize;

            const tileX15 = Math.floor(worldCoordinateX15 / tileSize);
            const tileY15 = Math.floor(worldCoordinateY15 / tileSize);

            // 計算瓦片的邊界經緯度 (zoom = 15)
            const tileLngStart15 = (tileX15 / scale15) * 360 - 180;
            const tileLatStart15 = (Math.atan(Math.sinh(Math.PI * (1 - 2 * (tileY15 / scale15)))) * 180) / Math.PI;
            const tileLngEnd15 = ((tileX15 + 1) / scale15) * 360 - 180;
            const tileLatEnd15 = (Math.atan(Math.sinh(Math.PI * (1 - 2 * ((tileY15 + 1) / scale15)))) * 180) / Math.PI;

            // 設定高亮的矩形範圍 (zoom = 15)
            setBounds([
                [tileLatStart15, tileLngStart15],
                [tileLatEnd15, tileLngEnd15],
            ]);

            // 計算左上角點對應 zoom = 17 的瓦片座標
            const scale17 = 1 << zoom17;

            // 左上角的經緯度
            const topLeftLat = tileLatStart15;
            const topLeftLng = tileLngStart15;

            // 左上角經緯度轉換為 zoom = 17 下的瓦片座標
            const worldCoordinateX17 = ((topLeftLng + 180) / 360) * scale17 * tileSize;
            const worldCoordinateY17 =
                ((1 - Math.log(Math.tan((topLeftLat * Math.PI) / 180) + 1 / Math.cos((topLeftLat * Math.PI) / 180)) / Math.PI) / 2) *
                scale17 *
                tileSize;

            const tileX17 = Math.floor(worldCoordinateX17 / tileSize);
            const tileY17 = Math.floor(worldCoordinateY17 / tileSize);

            Coordinates.push([tileX17, tileY17]);
            if (Coordinates.length > 2) {
                Coordinates.shift();
            }
            // Ensure coordinates[0] is the top-left tile coordinates
            // Ensure coordinates[1] is the bottom-right tile coordinates
            if (Coordinates.length === 2) {
                const [coord1, coord2] = Coordinates;
                const topLeft = [
                    Math.min(coord1[0], coord2[0]),
                    Math.min(coord1[1], coord2[1]),
                ];
                const bottomRight = [
                    Math.max(coord1[0], coord2[0]),
                    Math.max(coord1[1], coord2[1]),
                ];
                Coordinates[0] = topLeft;
                Coordinates[1] = bottomRight;
            }

            console.log(Coordinates);

            // log zoom = 17 的左上角瓦片座標
            console.log(`Zoom 17 Top-Left Tile Coordinates: x: ${tileX17}, y: ${tileY17}, z: ${zoom17}`);
        },
    });

    return null;
};

const MapComponent = () => {
    const position = [25.033, 121.5654]; // 台北市的經緯度
    const [highlightBounds, setHighlightBounds] = useState(null);

    return (
        <MapContainer center={position} zoom={15} style={{ height: '100vh', width: '100%' }}>
            <TileLayer
                url="https://gis.sinica.edu.tw/tileserver/file-exists.php?img=JM20K_1921-jpg-{z}-{x}-{y}"
            />
            <MapClickHandler setBounds={setHighlightBounds} />
            {highlightBounds && (
                <Rectangle
                    bounds={highlightBounds}
                    pathOptions={{ color: 'red', weight: 2, fillOpacity: 0.2 }} // 使用紅色邊框來突出顯示
                />
            )}
        </MapContainer>
    );
};

export default MapComponent;
