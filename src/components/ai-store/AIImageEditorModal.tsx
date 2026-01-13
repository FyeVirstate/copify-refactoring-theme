'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Plus, ChevronLeft, ChevronRight, ImagePlus, Sparkles, Loader2 } from 'lucide-react';

// AI prompt presets (same as Laravel)
const AI_PROMPTS = {
  deleteLogo: "Remove every logo, brand mark, trademark text, or watermark from the image while maintaining all the aspects of the product image. Rebuild the underlying background cleanly and naturally so no trace of the original branding remains. Preserve the original lighting, texture, colors, proportions, and visual style for a seamless and realistic result.",
  removeBackground: "Remove the entire background cleanly while maintaining all the aspects of the product image. Preserve the subject with accurate edges, lighting, textures, and fine details. Replace the background with a smooth, uniform transparent or white backdrop. Keep the product's colors, contours, and natural shadows fully intact.",
  lifestyleImage: "Create a realistic lifestyle scene while maintaining all the aspects of the product image. Show the product being used naturally in everyday life with authentic lighting, candid composition, real environments, and subtle shadows and reflections. Ensure the product remains unchanged, accurately represented, and integrated into a genuine lifestyle photograph.",
  packshot: "Transform the image into a clean, professional packshot on a pure white background while maintaining all the aspects of the product image. Adjust to a new angle, composition, or framing without altering the product itself. Ensure crisp lighting, sharp focus, accurate colors, and a product-centered layout suitable for e-commerce.",
  productView: "Remove all visible logos, brand marks, watermark text, or identifying graphics while maintaining all the aspects of the product image. Restore the product's surface cleanly and realistically, preserving materials, lighting, textures, shapes, and colors. Ensure a seamless result with no added branding.",
  beforeAfter: "Create a clear before-and-after comparison showing the transformation or impact while maintaining all the aspects of the product image. Display both versions side by side in a clean, balanced composition with consistent lighting, perspective, and proportions so the difference is immediately visible and easy to compare.",
};

const TOOLBAR_BUTTONS = [
  { id: 'deleteLogo', icon: '🖼️', label: 'Supprimer le logo', prompt: AI_PROMPTS.deleteLogo },
  { id: 'removeBackground', icon: '🎭', label: "Supprimer l'arrière-plan", prompt: AI_PROMPTS.removeBackground },
  { id: 'lifestyleImage', icon: '🏠', label: 'Image de style de vie', prompt: AI_PROMPTS.lifestyleImage },
  { id: 'packshot', icon: '📷', label: 'Packshot', prompt: AI_PROMPTS.packshot },
  { id: 'productView', icon: '👁️', label: 'Vue produit', prompt: AI_PROMPTS.productView },
  { id: 'beforeAfter', icon: '⚡', label: 'Avant/Après', prompt: AI_PROMPTS.beforeAfter },
];

export interface AIImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  selectedImageUrl?: string | null;
  onImageGenerated?: (newImageUrl: string, originalImageUrl?: string) => void;
  productId?: number;
  isUploadMode?: boolean;
}

export function AIImageEditorModal({
  isOpen,
  onClose,
  images,
  selectedImageUrl,
  onImageGenerated,
  productId,
  isUploadMode = false,
}: AIImageEditorModalProps) {
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [activeToolbar, setActiveToolbar] = useState<string | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  // Initialize modal state when opened
  useEffect(() => {
    if (isOpen) {
      if (isUploadMode || !selectedImageUrl) {
        setShowPlaceholder(true);
        setCurrentImageUrl(null);
      } else {
        setShowPlaceholder(false);
        setCurrentImageUrl(selectedImageUrl);
      }
      setPrompt('');
      setActiveToolbar(null);
      setReferenceImageUrl(null);
    }
  }, [isOpen, selectedImageUrl, isUploadMode]);

  // Handle thumbnail click
  const handleThumbnailClick = (imageUrl: string) => {
    setCurrentImageUrl(imageUrl);
    setShowPlaceholder(false);
  };

  // Handle add button click (show placeholder)
  const handleAddClick = () => {
    setShowPlaceholder(true);
    setCurrentImageUrl(null);
  };

  // Handle placeholder click (open file picker)
  const handlePlaceholderClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file upload for main image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, use local URL - in production, upload to server
    const localUrl = URL.createObjectURL(file);
    setCurrentImageUrl(localUrl);
    setShowPlaceholder(false);

    // TODO: Upload to server and get permanent URL
    // const formData = new FormData();
    // formData.append('image', file);
    // const response = await fetch('/api/upload', { method: 'POST', body: formData });
    // const { url } = await response.json();
    // setCurrentImageUrl(url);
  };

  // Handle reference image upload
  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setReferenceImageUrl(localUrl);
  };

  // Handle toolbar button click
  const handleToolbarClick = (toolbarId: string, toolbarPrompt: string) => {
    setActiveToolbar(toolbarId);
    setPrompt(toolbarPrompt);
  };

  // Handle edit image
  const handleEditImage = async () => {
    if (!currentImageUrl) {
      alert('Veuillez sélectionner une image');
      return;
    }

    if (!prompt.trim()) {
      alert('Veuillez entrer une instruction');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_image: currentImageUrl,
          prompt: prompt,
          input_images: referenceImageUrl ? [referenceImageUrl] : [],
          num_images: 1,
          aspect_ratio: 'auto',
          output_format: 'png',
        }),
      });

      const data = await response.json();

      if (data.success && data.images?.length > 0) {
        const newImageUrl = data.images[0].url;
        setCurrentImageUrl(newImageUrl);
        
        // Callback to parent
        onImageGenerated?.(newImageUrl, selectedImageUrl || undefined);
      } else {
        alert(data.message || "Erreur lors de la modification de l'image");
      }
    } catch (error) {
      console.error('Error editing image:', error);
      alert("Erreur lors de la modification de l'image");
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll thumbnails
  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbnailContainerRef.current) {
      const scrollAmount = 200;
      thumbnailContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-editor-modal-overlay" onClick={onClose}>
      <div className="ai-editor-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="ai-editor-close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        {/* Top Bar with Credits */}
        <div className="ai-editor-top-bar">
          <div className="ai-editor-credits">
            <span className="credits-label">Crédits IA</span>
            <span className="credits-value">0/0</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="ai-editor-content">
          {/* Thumbnail Gallery */}
          <div className="ai-editor-thumbnails-wrapper">
            <button className="thumbnail-add-btn" onClick={handleAddClick}>
              <Plus size={24} />
            </button>
            <div className="thumbnail-divider" />
            
            <button 
              className="thumbnail-nav-btn thumbnail-nav-left"
              onClick={() => scrollThumbnails('left')}
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="ai-editor-thumbnails" ref={thumbnailContainerRef}>
              {images.map((img, index) => (
                <div 
                  key={index}
                  className={`thumbnail-item ${currentImageUrl === img ? 'active' : ''}`}
                  onClick={() => handleThumbnailClick(img)}
                >
                  <img src={img} alt={`Thumbnail ${index + 1}`} />
                </div>
              ))}
            </div>
            
            <button 
              className="thumbnail-nav-btn thumbnail-nav-right"
              onClick={() => scrollThumbnails('right')}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Main Image Display */}
          <div className="ai-editor-main-image">
            {showPlaceholder ? (
              <div className="ai-editor-placeholder" onClick={handlePlaceholderClick}>
                <div className="placeholder-content">
                  <div className="placeholder-text">Télécharger</div>
                  <div className="placeholder-text text-sub">ou</div>
                  <div className="placeholder-text">Générer nouveau avec IA</div>
                </div>
              </div>
            ) : currentImageUrl ? (
              <>
                <img 
                  src={currentImageUrl} 
                  alt="Image principale" 
                  style={{ filter: isLoading ? 'blur(10px)' : 'none' }}
                />
                {isLoading && (
                  <div className="ai-editing-loader">
                    <Sparkles size={16} />
                    <span>Modification en cours...</span>
                  </div>
                )}
              </>
            ) : null}
            
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* Actions Section */}
          <div className="ai-editor-actions">
            {/* Toolbar */}
            <div className="ai-editor-toolbar-wrapper">
              <div className="ai-editor-toolbar">
                {TOOLBAR_BUTTONS.map((btn) => (
                  <button
                    key={btn.id}
                    className={`toolbar-btn ${activeToolbar === btn.id ? 'active' : ''}`}
                    onClick={() => handleToolbarClick(btn.id, btn.prompt)}
                  >
                    <span>{btn.icon}</span>
                    <span>{btn.label}</span>
                  </button>
                ))}
              </div>
              <div className="ai-editor-toolbar-gradient" />
            </div>

            {/* Prompt Input */}
            <div className="ai-editor-prompt-section">
              <div className="prompt-input-container">
                <textarea
                  className="prompt-input"
                  placeholder="Entrez une instruction pour modifier..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                
                <div className="prompt-input-footer">
                  {referenceImageUrl && (
                    <div className="reference-thumbnail-container">
                      <img src={referenceImageUrl} alt="Reference" className="reference-thumbnail" />
                      <button 
                        className="remove-reference-btn"
                        onClick={() => setReferenceImageUrl(null)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  
                  <button 
                    className="upload-reference-btn"
                    onClick={() => referenceInputRef.current?.click()}
                  >
                    <ImagePlus size={14} />
                    {!referenceImageUrl && <span>Ajouter une image de référence</span>}
                  </button>
                  
                  <input 
                    ref={referenceInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleReferenceUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              {/* Edit Button */}
              <button 
                className="edit-image-btn"
                onClick={handleEditImage}
                disabled={isLoading || !currentImageUrl}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Modification...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Modifier l&apos;image actuelle</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIImageEditorModal;
