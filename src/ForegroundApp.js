import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './App.css';

import { handleTagSelectedImages } from './tag.ts'; // 引入新功能組件
import CategorySelectorModal from './modal.tsx';
import classColors from './classcolors.ts';

function ForegroundApp() {
  const [images, setImages] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [imagesToShow, setImagesToShow] = useState(100);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const navigate = useNavigate();
  // 開啟和關閉模態框的函數
  const openModal = () => {
    console.log("開啟模態框");
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    axios.get('http://localhost:5500/api/annotations')
      .then(response => {
        console.log('Fetched annotations:', response.data);
        const fetchedAnnotations = response.data;
        setAnnotations(fetchedAnnotations);

        axios.get('http://localhost:5500/api/images')
          .then(response => {
            console.log(response.data, fetchedAnnotations);
            const filteredImage = response.data.filter(image => fetchedAnnotations.some(annotation => annotation.image_id === image._id));
            console.log('filteredImage', filteredImage);
            const imagesWithIndex = filteredImage.map((item, index) => ({
              ...item,
              index,
            }));
            console.log('Fetched images:', imagesWithIndex);
            setImages(imagesWithIndex);

            setTimeout(() => {
              setIsDataLoaded(true);
            }, 2000);
          })
          .catch(error => {
            console.error('There was an error fetching the images!', error);
          });
      })
      .catch(error => {
        console.error('There was an error fetching the annotations!', error);
      });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMoreImages();
      }
    });

    const trigger = document.querySelector('.load-more-trigger');
    if (trigger) {
      observer.observe(trigger);
    }

    return () => {
      if (trigger) {
        observer.disconnect();
      }
    };
  }, [imagesToShow, images]);

  const loadMoreImages = () => {
    setImagesToShow(prev => Math.min(prev + 1000, images.length));
  };

  const handleNavigateToAnnotation = () => {
    navigate('/annotation', { state: { selectedImages: Array.from(selectedImages), images, annotations } });
  };

  const drawAnnotations = (canvas, imageId) => {
    const ctx = canvas.getContext('2d');
    const imageAnnotations = annotations.filter(annotation => annotation.image_id === imageId);

    imageAnnotations.forEach(annotation => {
      const color = classColors[annotation.class] || 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.fillStyle = color;
      const coords = annotation.coordinates;
      if (coords.length >= 4) {
        ctx.moveTo(coords[0] * canvas.width, coords[1] * canvas.height);
        for (let i = 2; i < coords.length; i += 2) {
          ctx.lineTo(coords[i] * canvas.width, coords[i + 1] * canvas.height);
        }
        ctx.closePath();
        ctx.fill();
      }
    });
  };

  const handleDownloadAllImages = () => {
    images.forEach(image => {
      const link = document.createElement('a');
      link.href = `data:image/jpeg;base64,${image.data}`;
      link.download = `${image.filename}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleImageLoad = (event, imageId) => {
    const canvas = event.target.nextSibling;
    const ctx = canvas.getContext('2d');
    const img = event.target;

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);
    drawAnnotations(canvas, imageId);
  };

  const handleImageClick = (event, imageId, index) => {
    // 如果按下 Ctrl 鍵，則添加或刪除單個項目
    console.log(index);
    if (event.ctrlKey || event.metaKey) {
      setSelectedImages(prevSelectedImages => {
        const newSelectedImages = new Set(prevSelectedImages);
        if (newSelectedImages.has(imageId)) {
          newSelectedImages.delete(imageId);
        } else {
          newSelectedImages.add(imageId);
        }
        setLastSelectedIndex(index);
        return newSelectedImages;
      });
    }
    // 如果按下 Shift 鍵，則執行範圍選擇
    else if (event.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);

      setSelectedImages(prevSelectedImages => {
        const newSelectedImages = new Set(prevSelectedImages);
        for (let i = start; i <= end; i++) {
          newSelectedImages.add(images[i]._id);
        }
        console.log(newSelectedImages);
        return newSelectedImages;
      });
    }
    // 如果沒有按下任何特殊鍵，僅選擇當前項目
    else {
      setSelectedImages(new Set([imageId]));
      setLastSelectedIndex(index);
    }
  };

  const handleDoubleClick = (imageId) => {
    axios.delete(`http://localhost:5500/api/images/${imageId}`)
      .then(response => {
        console.log('Deleted image and annotations:', response.data);
        const updatedImages = images.filter(image => image._id !== imageId);
        const updatedAnnotations = annotations.filter(annotation => annotation.image_id !== imageId);
        setImages(updatedImages);
        setAnnotations(updatedAnnotations);
        setSelectedImages(prevSelectedImages => {
          const newSelectedImages = new Set(prevSelectedImages);
          newSelectedImages.delete(imageId);
          return newSelectedImages;
        });
      })
      .catch(error => {
        console.error('There was an error deleting the image and annotations!', error);
      });
  };

  const handleDeleteSelectedImages = () => {
    selectedImages.forEach(imageId => {
      handleDoubleClick(imageId);
    });
  };

  const handelTagClick = () => {
    handleTagSelectedImages(openModal);
  };

  const annotatedImageCount = images.filter(image => annotations.some(annotation => annotation.image_id === image._id)).length;

  return (
    <div className="App">
      <div className="header">
        <h1>圖片和標記數據檢視平台</h1>
        <button onClick={handleDownloadAllImages}>下載所有圖片</button>
        <button onClick={handleDeleteSelectedImages}>刪除選中的圖片</button>
        <button onClick={handelTagClick}>標記為已選擇</button>
        {isModalOpen && (
          <CategorySelectorModal
            isOpen={isModalOpen}
            onClose={closeModal}
            onStart={(category, images) => {
              setSelectedCategory(category);
              console.log('選擇的類別:', category);
              console.log('選中的圖片:', images);
            }}
            selectedImages={Array.from(selectedImages)}
          />
        )}
        <button onClick={handleNavigateToAnnotation} disabled={selectedImages.size === 0}>
          前往標記頁面
        </button>
        <div className="stats">
          <p>總圖片數量: {images.length}</p>
          <p>帶標記的圖片數量: {annotatedImageCount}</p>
        </div>
      </div>
      {isDataLoaded ? (
        <div className="image-gallery">
          {images
            .filter(image => annotations.some(annotation => annotation.image_id === image._id)) // 確保圖片有標記
            .slice(0, imagesToShow)  // 控制顯示數量
            .map((image, index) => (
              <div
                key={image._id || index}
                className={`image-container ${selectedImages.has(image._id) ? 'selected' : ''}`}
                onClick={(e) => handleImageClick(e, image._id, image.index)}
                onDoubleClick={() => handleDoubleClick(image._id)}
              >
                {image.data ? (
                  <>
                    <div className="image-name">{image.filename}</div>
                    <img
                      src={`data:image/jpeg;base64,${image.data}`}
                      alt={image.filename}
                      className="hidden-image"
                      onLoad={(e) => handleImageLoad(e, image._id)}
                    />
                    <canvas className="image-canvas"></canvas>
                  </>
                ) : (
                  <p>圖片數據缺失</p>
                )}
              </div>
            ))}
          <div className="load-more-trigger"></div>
        </div>
      ) : (
        <p>加載中...</p>
      )}
    </div>
  );
}

export default ForegroundApp;
