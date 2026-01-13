"use client";

import React, { useState, useRef, useEffect } from "react";

interface ImageSelectorProps {
  images: string[];
  selectedImages?: string[];
  onSelect?: (images: string[]) => void;
  inputName?: string;
  inputType?: 'radio' | 'checkbox';
  maxVisible?: number;
  sectionLabel?: string;
  canGenerateAI?: boolean;
  onGenerateAI?: () => void;
  onEditImage?: (imageUrl: string) => void;
  sortable?: boolean;
}

/**
 * Image Selector Component - matches Laravel enhanced-upload-ai-image-with-list.blade.php
 * Grid layout with first image 2x2, +N counter overlay, "Modifier avec IA" button
 */
export const ImageSelector: React.FC<ImageSelectorProps> = ({
  images = [],
  selectedImages = [],
  onSelect,
  inputType = 'checkbox',
  maxVisible = 9,
  sectionLabel = "Image de la Section",
  canGenerateAI = true,
  onGenerateAI,
  onEditImage,
  sortable = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<string[]>(() => {
    // Initialize with selectedImages if provided, otherwise first image for radio or first 5 for checkbox
    if (selectedImages && selectedImages.length > 0) {
      return selectedImages;
    }
    if (inputType === 'radio' && images.length > 0) {
      return [images[0]];
    }
    return images.slice(0, 5);
  });
  const gridRef = useRef<HTMLDivElement>(null);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});
  
  // Sync with selectedImages prop when it changes from parent
  useEffect(() => {
    if (selectedImages !== undefined) {
      // Always sync, even if empty array (to handle deselection)
      setSelected(selectedImages.length > 0 ? selectedImages : []);
    }
  }, [selectedImages]);

  const totalImages = images.length;
  const showViewMore = totalImages > maxVisible && !expanded;
  const hiddenCount = totalImages - maxVisible;
  const visibleImages = expanded ? images : images.slice(0, maxVisible);

  // Position the overlay on the 9th card
  useEffect(() => {
    if (showViewMore && gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.image-card:not(.view-less-card)');
      const ninthCard = cards[maxVisible - 1] as HTMLElement;
      if (ninthCard) {
        const gridRect = gridRef.current.getBoundingClientRect();
        const cardRect = ninthCard.getBoundingClientRect();
        setOverlayStyle({
          position: 'absolute',
          top: cardRect.top - gridRect.top,
          left: cardRect.left - gridRect.left,
          width: cardRect.width,
          height: cardRect.height,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 15,
          borderRadius: '8px',
        });
      }
    } else {
      // Clear overlay when not showing view more
      setOverlayStyle({});
    }
  }, [showViewMore, maxVisible, expanded]);

  const handleSelect = (imageUrl: string, event?: React.MouseEvent | React.ChangeEvent) => {
    // Prevent default to avoid form submission issues
    if (event) {
      event.preventDefault();
    }
    
    let newSelected: string[];
    if (inputType === 'radio') {
      newSelected = [imageUrl];
    } else {
      if (selected.includes(imageUrl)) {
        newSelected = selected.filter(img => img !== imageUrl);
      } else {
        newSelected = [...selected, imageUrl];
      }
    }
    
    console.log('[ImageSelector] Selection changed:', { imageUrl, newSelected, inputType });
    setSelected(newSelected);
    
    // Always call onSelect to update parent
    if (onSelect) {
      onSelect(newSelected);
    }
  };

  const isSelected = (imageUrl: string) => selected.includes(imageUrl);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="mb-5 pt-4 image-uploader">
      {/* Section Label */}
      <p className="form-label text-dark fw-500 mb-3 fs-xs">
        {sectionLabel}
      </p>

      {/* Upload Box / Generate AI Button - centered like Step 2 */}
      {canGenerateAI && (
        <div className="upload-box mb-4" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <button 
            className="btn upload-image-btn" 
            type="button"
            onClick={onGenerateAI}
          >
            <i className="ri-sparkling-line text-purple"></i>
            <span className="text-dark"> Générer une image avec l&apos;IA</span>
          </button>
        </div>
      )}

      {/* Selection Text */}
      <p className="fs-small fw-500 mb-2">Sélectionnez les images du produit que vous souhaitez ajouter</p>
      {sortable && (
        <p className="fs-small text-muted mb-3">
          <strong>Conseil:</strong> <i className="ri-drag-drop-line"></i> Vous pouvez réorganiser les images en les faisant glisser dans l&apos;ordre de votre choix.
        </p>
      )}

      {/* Image Grid */}
      <div ref={gridRef} className={`image-grid-list ${expanded ? 'expanded' : ''}`}>
        {visibleImages.map((image, index) => {
          const isFeatured = index === 0;

          return (
            <div 
              key={`${image}-${index}`}
              className={`image-card ${isFeatured ? 'featured' : ''} ${sortable ? 'sortable-item' : ''} ${isSelected(image) ? 'selected' : ''}`}
              data-index={index}
              onClick={(e) => handleSelect(image, e)}
              style={{ cursor: 'pointer' }}
            >
              <div className="radio-container">
                <input
                  type={inputType}
                  name="section-image"
                  value={image}
                  checked={isSelected(image)}
                  onChange={(e) => handleSelect(image, e)}
                  style={{ display: 'none' }}
                />
                <div className={`custom-image-radio ${isSelected(image) ? 'checked' : ''}`}>
                  <span className={`checkmark ${isSelected(image) ? 'visible' : ''}`}>
                    <i className="ri-check-line check-icon"></i>
                  </span>
                  <div className="upload-image-wrapper">
                    <img 
                      src={image} 
                      className="img-fluid" 
                      alt={`Product image ${index + 1}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/img_not_found.png';
                      }}
                    />
                    {/* AI Generated Badge - show on first few images */}
                    {index < 2 && (
                      <span className="badge position-absolute top-0 start-0 m-2 ai-generated-badge">
                        <i className="ri-sparkling-2-fill"></i>
                      </span>
                    )}
                  </div>

                  {/* Edit with AI Button */}
                  <button 
                    type="button" 
                    className="edit-image-ai-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onEditImage) {
                        onEditImage(image);
                      }
                    }}
                  >
                    <i className="ri-sparkling-line edit-ai-icon"></i>
                    <span>Modifier avec IA</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* View More Overlay - positioned on 9th card */}
        {showViewMore && (
          <div 
            className="view-more-overlay positioned"
            onClick={() => setExpanded(true)}
            style={overlayStyle}
          >
            <span className="view-more-count">+{hiddenCount}</span>
          </div>
        )}

        {/* View Less Card */}
        {expanded && totalImages > maxVisible && (
          <div 
            className="image-card view-less-card"
            onClick={() => setExpanded(false)}
          >
            <div className="view-less-btn">
              <i className="ri-arrow-up-s-line"></i>
              <span>Voir moins</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageSelector;
