import React, { useState } from 'react';

interface CategorySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (category: number, images: Image[]) => void;
  selectedImages: Image[];
  title?: string;
  categories?: number[];
}

interface Image {
  id: string;
}

const CategorySelectorModal: React.FC<CategorySelectorModalProps> = ({
  isOpen,
  onClose,
  onStart,
  selectedImages,
  title = '選擇要標記的類別',
  categories = [1, 2, 3, 4],
}) => {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const handleCategorySelection = (category: number) => {
    setSelectedCategory(category);
  };

  const handleStart = () => {
    console.log('Selected Images:', selectedImages);
    if (selectedCategory !== null) {
      onStart(selectedCategory, selectedImages);
      onClose(); // 關閉 Modal
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal" style={{ zIndex: 999999 }}>
      <div className="modal-content">
        <h2>{title}</h2>
        <div className="button-group">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategorySelection(category)}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            >
              類別 {category}
            </button>
          ))}
        </div>
        <button
          onClick={handleStart}
          className="action-btn"
          disabled={selectedCategory === null}
        >
          開始標記
        </button>
        <button onClick={onClose} className="cancel-btn">取消</button>
      </div>
    </div>
  );
};

export default CategorySelectorModal;
