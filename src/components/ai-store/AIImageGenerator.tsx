"use client";

import React from 'react';

interface AIImageGeneratorProps {
  images: string[];
  aiContent: Record<string, unknown>;
  productId?: string | number;
  onImagesGenerated?: (images: Array<{ image_url: string; prompt: string; index: number }>) => void;
  onImageSelect?: (imageUrl: string) => void;
  className?: string;
}

/**
 * AIImageGenerator - Placeholder button for future AI image generation modal
 * 
 * NOTE: AI images are now generated AUTOMATICALLY during the store creation process
 * (in /api/ai/generate-store). This button will be used for a modal to regenerate
 * or create additional AI images in the future.
 */
export const AIImageGenerator: React.FC<AIImageGeneratorProps> = ({
  className = '',
}) => {
  // TODO: Implement modal for manual AI image regeneration
  const handleOpenModal = () => {
    // Future: Open modal for AI image generation
    console.log('[AIImageGenerator] Modal feature coming soon...');
  };

  return (
    <div className={`ai-image-generator ${className}`}>
      {/* Button only - modal coming soon */}
      <div 
        className="d-flex align-items-center justify-content-center p-3 rounded-3"
        style={{ 
          border: '2px dashed var(--bs-border-color)',
          backgroundColor: 'var(--bs-light)',
        }}
      >
        <button
          type="button"
          className="btn btn-outline-primary d-flex align-items-center gap-2"
          onClick={handleOpenModal}
          disabled // Disabled for now - modal coming soon
          title="Fonctionnalité bientôt disponible"
        >
          <i className="ri-sparkling-2-fill"></i>
          Générer des images avec l&apos;IA
        </button>
      </div>
    </div>
  );
};

export default AIImageGenerator;
