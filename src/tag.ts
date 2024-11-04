import axios from 'axios';
  interface Image {
    id: string;
  }
  
  export const handleTagSelectedImages = (selectedImages: Image[],category: number, openModal: () => void): void => {
    openModal(); // 確保這裡的 openModal 是從父組件傳入的有效函數
    // do this after modal closes
    // Add an event listener to execute after the modal closes
    console.log(selectedImages);
    console.log(`Selected Category: ${category}`);
    // Call API to tag images
    axios.post('http://localhost:5500/tag_images', {
      images: Array.isArray(selectedImages) ? selectedImages.map((image: Image) => image.id) : [],
      category: category,
    })
    .then(response => {
      console.log('Images tagged successfully:', response.data);
    })
    .catch(error => {
      console.error('Error tagging images:', error);
    });
  };
  