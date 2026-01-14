'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Plus, ChevronLeft, ChevronRight, ImagePlus, Sparkles, Loader2, ShoppingCart } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

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
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [activeToolbar, setActiveToolbar] = useState<string | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReferenceLoading, setIsReferenceLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'upload' | 'edit' | 'generate'>('edit');
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [isTextToImageMode, setIsTextToImageMode] = useState(false);
  const [textToImagePrompt, setTextToImagePrompt] = useState('');
  const [credits, setCredits] = useState<{ used: number; limit: number }>({ used: 0, limit: 0 });
  const [isBuyingCredits, setIsBuyingCredits] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const toolbarContainerRef = useRef<HTMLDivElement>(null);

  // Fetch credits on mount and when modal opens
  const fetchCredits = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/credits');
      const data = await response.json();
      if (data.success && data.data?.credits) {
        const remaining = data.data.credits.imageGeneration || 0;
        const limit = data.data.limits?.imageGeneration || 0;
        const used = limit - remaining;
        setCredits({ used: Math.max(0, used), limit: Math.max(remaining, limit) });
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  }, []);

  // Buy credits - redirect to Stripe
  const handleBuyCredits = async () => {
    setIsBuyingCredits(true);
    try {
      const currentPath = window.location.pathname;
      const response = await fetch('/api/ai/credits/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl: currentPath }),
      });
      const data = await response.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        toastError('Erreur lors de la création du paiement');
        setIsBuyingCredits(false);
      }
    } catch (error) {
      console.error('Failed to buy credits:', error);
      toastError('Erreur lors de la création du paiement');
      setIsBuyingCredits(false);
    }
  };

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
      setIsTextToImageMode(false);
      setTextToImagePrompt('');
      // Fetch credits when modal opens
      fetchCredits();
    }
  }, [isOpen, selectedImageUrl, isUploadMode, fetchCredits]);

  // Handle text-to-image generation
  const handleTextToImage = async () => {
    if (!textToImagePrompt.trim()) {
      toastWarning('Veuillez entrer une description pour générer une image');
      return;
    }

    setLoadingType('generate');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/text-to-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToImagePrompt,
          aspect_ratio: '1:1',
          num_images: 1,
        }),
      });

      const data = await response.json();

      if (data.success && data.images?.length > 0) {
        const newImageUrl = data.images[0].url;
        setCurrentImageUrl(newImageUrl);
        setShowPlaceholder(false);
        setIsTextToImageMode(false);
        
        // Update credits after successful generation
        if (typeof data.remainingCredits === 'number') {
          setCredits(prev => ({ ...prev, limit: data.remainingCredits }));
        } else {
          fetchCredits();
        }
        
        // Callback to parent
        onImageGenerated?.(newImageUrl);
      } else if (data.code === 'INSUFFICIENT_CREDITS') {
        // Show warning toast with buy prompt
        toastWarning("Crédits IA insuffisants. Cliquez sur 'Acheter des crédits IA' pour en obtenir plus.", 6000);
      } else {
        toastError(data.message || "Erreur lors de la génération de l'image");
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toastError("Erreur lors de la génération de l'image");
    } finally {
      setIsLoading(false);
    }
  };

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

  // Upload image to FAL storage and get public URL
  const uploadToFalStorage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/ai/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (data.success && data.url) {
        return data.url;
      }
      console.error('Upload failed:', data.message);
      return null;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  // Handle file upload for main image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingType('upload');
    setIsLoading(true);
    setShowPlaceholder(false);
    
    // Show local preview while uploading
    const localUrl = URL.createObjectURL(file);
    setCurrentImageUrl(localUrl);

    // Upload to FAL storage for public URL
    const publicUrl = await uploadToFalStorage(file);
    if (publicUrl) {
      setCurrentImageUrl(publicUrl);
    }
    
    setIsLoading(false);
  };

  // Handle reference image upload (separate loading state - doesn't affect main image)
  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReferenceLoading(true);
    
    // Upload to FAL storage for public URL
    const publicUrl = await uploadToFalStorage(file);
    if (publicUrl) {
      setReferenceImageUrl(publicUrl);
    }
    
    setIsReferenceLoading(false);
  };

  // Handle toolbar button click
  const handleToolbarClick = (toolbarId: string, toolbarPrompt: string) => {
    setActiveToolbar(toolbarId);
    setPrompt(toolbarPrompt);
  };

  // Convert blob URL to base64 for upload
  const blobUrlToBase64 = async (blobUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  // Upload blob URL to FAL storage
  const uploadBlobToFal = async (blobUrl: string): Promise<string | null> => {
    try {
      const base64 = await blobUrlToBase64(blobUrl);
      if (!base64) return null;

      const response = await fetch('/api/ai/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64 }),
      });

      const data = await response.json();
      return data.success ? data.url : null;
    } catch {
      return null;
    }
  };

  // Handle edit image
  const handleEditImage = async () => {
    if (!currentImageUrl) {
      toastWarning('Veuillez sélectionner une image');
      return;
    }

    if (!prompt.trim()) {
      toastWarning('Veuillez entrer une instruction');
      return;
    }

    setLoadingType('edit');
    setIsLoading(true);

    try {
      // If source image is a blob URL, upload it first
      let sourceUrl = currentImageUrl;
      if (currentImageUrl.startsWith('blob:')) {
        const uploadedUrl = await uploadBlobToFal(currentImageUrl);
        if (!uploadedUrl) {
          toastError("Erreur lors du téléchargement de l'image");
          setIsLoading(false);
          return;
        }
        sourceUrl = uploadedUrl;
        setCurrentImageUrl(sourceUrl);
      }

      // If reference image is a blob URL, upload it first
      let refUrl = referenceImageUrl;
      if (referenceImageUrl?.startsWith('blob:')) {
        const uploadedRef = await uploadBlobToFal(referenceImageUrl);
        if (uploadedRef) {
          refUrl = uploadedRef;
          setReferenceImageUrl(refUrl);
        }
      }

      const response = await fetch('/api/ai/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_image: sourceUrl,
          prompt: prompt,
          input_images: refUrl ? [refUrl] : [],
          num_images: 1,
          aspect_ratio: 'auto',
          output_format: 'png',
        }),
      });

      const data = await response.json();

      if (data.success && data.images?.length > 0) {
        const newImageUrl = data.images[0].url;
        setCurrentImageUrl(newImageUrl);
        
        // Update credits after successful edit
        if (typeof data.remainingCredits === 'number') {
          setCredits(prev => ({ ...prev, limit: data.remainingCredits }));
        } else {
          fetchCredits();
        }
        
        // Callback to parent
        onImageGenerated?.(newImageUrl, selectedImageUrl || undefined);
      } else if (data.code === 'INSUFFICIENT_CREDITS') {
        // Show warning toast with buy prompt
        toastWarning("Crédits IA insuffisants. Cliquez sur 'Acheter des crédits IA' pour en obtenir plus.", 6000);
      } else {
        toastError(data.message || "Erreur lors de la modification de l'image");
      }
    } catch (error) {
      console.error('Error editing image:', error);
      toastError("Erreur lors de la modification de l'image");
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

  // Scroll toolbar
  const scrollToolbar = (direction: 'left' | 'right') => {
    if (toolbarContainerRef.current) {
      const scrollAmount = 200;
      toolbarContainerRef.current.scrollBy({
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

        {/* Top Bar with Credits - Same design as step 2 */}
        <div className="ai-editor-top-bar" style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end', paddingRight: '60px' }}>
          {/* Credits Display */}
          <div className="ai-editor-credits" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', padding: '8px 16px', borderRadius: '47px' }}>
            <svg width="32" height="32" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="3"
              />
              {/* Progress circle */}
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke={credits.limit > 0 ? '#335CFF' : '#dc3545'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 16}`}
                strokeDashoffset={credits.limit > 0 ? 2 * Math.PI * 16 * (1 - Math.min(1, credits.limit / Math.max(15, credits.limit + credits.used))) : 2 * Math.PI * 16}
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: '14px', color: credits.limit > 0 ? '#fff' : '#dc3545', fontWeight: 600 }}>{credits.limit}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', whiteSpace: 'nowrap' }}>Crédits IA</span>
            </div>
          </div>
          
          {/* Buy Credits Button */}
          <button
            onClick={handleBuyCredits}
            disabled={isBuyingCredits}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: '#0d6efd',
              border: 'none',
              borderRadius: '47px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 500,
              cursor: isBuyingCredits ? 'not-allowed' : 'pointer',
              opacity: isBuyingCredits ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {isBuyingCredits ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ShoppingCart size={14} />
            )}
            <span>Acheter des crédits IA</span>
          </button>
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
              isTextToImageMode ? (
                /* Text-to-Image Mode */
                <div className="ai-editor-text-to-image" style={{ 
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '24px', background: 'rgba(14, 18, 27, 0.24)', borderRadius: '16px'
                }}>
                  <Sparkles size={48} style={{ opacity: 0.5, marginBottom: '12px', color: 'rgba(255,255,255,0.8)' }} />
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '16px', textAlign: 'center' }}>
                    Décrivez l&apos;image que vous souhaitez générer
                  </div>
                  <textarea
                    value={textToImagePrompt}
                    onChange={(e) => setTextToImagePrompt(e.target.value)}
                    disabled={isLoading}
                    placeholder="Ex: Un jogging sportif noir sur fond blanc, style professionnel..."
                    style={{
                      width: '100%', maxWidth: '400px', height: '100px',
                      background: 'rgba(14, 18, 27, 0.4)', border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '14px',
                      resize: 'none', marginBottom: '16px',
                      opacity: isLoading ? 0.5 : 1, cursor: isLoading ? 'not-allowed' : 'text'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => setIsTextToImageMode(false)}
                      style={{
                        padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)',
                        background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '13px'
                      }}
                    >
                      Retour
                    </button>
                    <button
                      onClick={handleTextToImage}
                      disabled={isLoading || !textToImagePrompt.trim()}
                      style={{
                        padding: '10px 20px', borderRadius: '8px', border: 'none',
                        background: '#0d6efd', color: '#fff', cursor: 'pointer', fontSize: '13px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        opacity: isLoading || !textToImagePrompt.trim() ? 0.5 : 1
                      }}
                    >
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      Générer
                    </button>
                  </div>
                </div>
              ) : (
                /* Upload or Generate Mode */
                <div className="ai-editor-placeholder" style={{ 
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(14, 18, 27, 0.24)', border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px', gap: '16px'
                }}>
                  <button
                    onClick={handlePlaceholderClick}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                      padding: '24px 48px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.3)',
                      borderRadius: '12px', cursor: 'pointer', color: 'rgba(255,255,255,0.8)'
                    }}
                  >
                    <ImagePlus size={36} style={{ opacity: 0.7 }} />
                    <span style={{ fontSize: '14px' }}>Télécharger une image</span>
                  </button>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>ou</div>
                  <button
                    onClick={() => setIsTextToImageMode(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '12px 24px', background: '#0d6efd', border: 'none',
                      borderRadius: '8px', cursor: 'pointer', color: '#fff', fontSize: '14px'
                    }}
                  >
                    <Sparkles size={18} />
                    Générer avec IA (texte → image)
                  </button>
                </div>
              )
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
                    <span>
                      {loadingType === 'upload' ? "Upload de l'image en cours..." : 
                       loadingType === 'generate' ? "Génération en cours..." : 
                       "Modification en cours..."}
                    </span>
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

          {/* Actions Section - Hide when in text-to-image mode or showing placeholder */}
          {!isTextToImageMode && !showPlaceholder && (
            <div className="ai-editor-actions">
              {/* Toolbar with scroll arrows */}
              <div className="ai-editor-toolbar-wrapper">
                <button 
                  className="toolbar-nav-btn toolbar-nav-left"
                  onClick={() => scrollToolbar('left')}
                  type="button"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div className="ai-editor-toolbar" ref={toolbarContainerRef}>
                  {TOOLBAR_BUTTONS.map((btn) => (
                    <button
                      key={btn.id}
                      className={`toolbar-btn ${activeToolbar === btn.id ? 'active' : ''}`}
                      onClick={() => handleToolbarClick(btn.id, btn.prompt)}
                      type="button"
                    >
                      <i className={`ri-${btn.id === 'deleteLogo' ? 'image-edit' : btn.id === 'removeBackground' ? 'eraser' : btn.id === 'lifestyleImage' ? 'home-heart' : btn.id === 'packshot' ? 'camera' : btn.id === 'productView' ? 'eye' : 'arrow-left-right'}-line`} style={{ fontSize: '14px' }}></i>
                      <span>{btn.label}</span>
                    </button>
                  ))}
                </div>
                
                <button 
                  className="toolbar-nav-btn toolbar-nav-right"
                  onClick={() => scrollToolbar('right')}
                  type="button"
                >
                  <ChevronRight size={16} />
                </button>
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
                      disabled={isReferenceLoading}
                      style={{ opacity: isReferenceLoading ? 0.7 : 1 }}
                    >
                      {isReferenceLoading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Upload en cours...</span>
                        </>
                      ) : (
                        <>
                          <ImagePlus size={14} />
                          {!referenceImageUrl && <span>Ajouter une image de référence</span>}
                        </>
                      )}
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
          )}
        </div>
      </div>
    </div>
  );
}

export default AIImageEditorModal;
