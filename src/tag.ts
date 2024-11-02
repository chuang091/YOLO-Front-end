// 定義 Image 和 Tag 類型
interface Tag {
    isSelected?: boolean;
  }
  
  interface Image {
    tags: Tag[];
  }
  
  export const handleTagSelectedImages = (selectedImages: Image[], openModal: () => void): void => {
    console.log("選擇的圖片:", selectedImages);
    openModal(); // 確保這裡的 openModal 是從父組件傳入的有效函數
  };
  