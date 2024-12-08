import { useMapEvents } from 'react-leaflet';

const tileSize = 256;

// 將 `z-level=17` 瓦片座標轉換為 `z-level=15` 的經緯度範圍
export const convertTileCoordinates = (tileX17, tileY17, tileSize, scale15, scale17) => {
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

export const MapClickHandler = ({ addHighlight }) => {
    useMapEvents({
        click: (e) => {
            const zoom17 = 17;
            const zoom15 = 15;

            const scale17 = 1 << zoom17; // 2^17
            const scale15 = 1 << zoom15; // 2^15

            const { lat, lng } = e.latlng;

            // 計算 `z-level=17` 的瓦片座標
            const worldCoordinateX17 = ((lng + 180) / 360) * scale17 * tileSize;
            const worldCoordinateY17 =
                ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
                scale17 *
                tileSize;

            const tileX17 = Math.floor(worldCoordinateX17 / tileSize);
            const tileY17 = Math.floor(worldCoordinateY17 / tileSize);

            console.log(`Selected tile: x=${tileX17}, y=${tileY17}`);

            // 轉換到 `z-level=15` 的範圍
            const bounds = convertTileCoordinates(tileX17, tileY17, tileSize, scale15, scale17);

            // 新增高亮範圍與瓦片座標
            addHighlight(bounds, { x: tileX17, y: tileY17 });
        },
    });

    return null;
};
