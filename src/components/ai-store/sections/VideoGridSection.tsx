"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { RegenerateButton } from "./RegenerateButton";
import { ImageSelector } from "./ImageSelector";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { SectionProps } from "./types";

/**
 * Video Grid Section - matches Laravel _video-grid-section.blade.php
 * Maps to video-gris-slider section in theme
 * Contains a grid of 4 images/videos
 */
export const VideoGridSection: React.FC<SectionProps> = ({
  content,
  updateField,
  regenerateField,
  regeneratingField,
  successField,
  errorField,
  images = [],
  onEditImage,
  onGenerateImage,
}) => {
  const videoGrid = (content as any).videoGrid || {
    heading: '',
    subheading: '',
  };

  // Get current grid images (array of 4)
  const videoGridImages = (content.videoGridImages as string[]) || [];

  const updateVideoGrid = (field: string, value: string) => {
    updateField('videoGrid', { ...videoGrid, [field]: value });
  };

  // Update a specific grid image by index
  const updateGridImage = (index: number, imageUrl: string | undefined) => {
    const newImages = [...videoGridImages];
    // Ensure array has enough slots
    while (newImages.length <= index) {
      newImages.push('');
    }
    newImages[index] = imageUrl || '';
    updateField('videoGridImages', newImages);
  };

  // Helper to get field class names with success/error states
  const getFieldClassName = (fieldName: string, hasButton = true) => {
    let className = 'form-control form-control-sm';
    if (hasButton) className += ' form-control-w-side-button';
    if (regeneratingField === fieldName) className += ' field-regenerating';
    if (successField === fieldName) className += ' field-success';
    if (errorField === fieldName) className += ' field-error';
    return className;
  };

  return (
    <TooltipProvider>
      <div>
        {/* Section Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="mb-0 fs-lg fw-600">Section Grille Vidéo</p>
          <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
            <Trash2 size={16} />
          </button>
        </div>

        {/* Description */}
        <p className="text-muted fs-xs mb-3">
          Grille de 4 images pour mettre en valeur vos témoignages visuels.
        </p>

        {/* Section Heading */}
        <div className="mb-3">
          <label className="form-label text-dark fw-500 mb-1 fs-small">
            <i className="ri-text me-1 text-light-gray"></i>
            Titre de la section
          </label>
          <div className="position-relative input-with-regenerate">
            <input
              type="text"
              className={getFieldClassName('videoGrid.heading', true)}
              value={videoGrid.heading || ''}
              onChange={(e) => updateVideoGrid('heading', e.target.value)}
              placeholder="Nos clients ne peuvent s'arrêter de parler de nous"
              disabled={regeneratingField === 'videoGrid.heading'}
            />
            <RegenerateButton
              onClick={() => regenerateField('videoGrid.heading', videoGrid.heading || '')}
              disabled={!!regeneratingField}
              isRegenerating={regeneratingField === 'videoGrid.heading'}
              position="middle"
            />
          </div>
        </div>

        {/* Subheading */}
        <div className="mb-3">
          <label className="form-label text-dark fw-500 mb-1 fs-small">
            <i className="ri-file-text-line me-1 text-light-gray"></i>
            Sous-titre
          </label>
          <div className="position-relative input-with-regenerate">
            <textarea
              className={getFieldClassName('videoGrid.subheading', true)}
              rows={2}
              value={videoGrid.subheading || ''}
              onChange={(e) => updateVideoGrid('subheading', e.target.value)}
              placeholder="Des histoires qui prouvent que notre produit fait des miracles."
              disabled={regeneratingField === 'videoGrid.subheading'}
            />
            <RegenerateButton
              onClick={() => regenerateField('videoGrid.subheading', videoGrid.subheading || '')}
              disabled={!!regeneratingField}
              isRegenerating={regeneratingField === 'videoGrid.subheading'}
              isError={errorField === 'videoGrid.subheading'}
              position="top"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* 4 Image Selections - One for each grid position */}
        <div className="mb-4">
          <label className="form-label text-dark fw-500 mb-2 fs-xs">
            <i className="ri-layout-grid-line me-1 text-light-gray"></i>
            Images de la grille (4)
          </label>
          <p className="text-muted fs-xs mb-3">
            Sélectionnez une image pour chaque position de la grille.
          </p>

          {[0, 1, 2, 3].map((index) => {
            const currentImage = videoGridImages[index] || '';
            
            return (
              <div key={index} className="mb-3">
                <details className="feature-accordion" open={index === 0}>
                  <summary className="form-label text-dark fw-500 mb-1 fs-xs cursor-pointer">
                    <i className="ri-arrow-right-s-line me-1"></i>
                    Image {index + 1}
                    {currentImage && <span className="badge bg-success ms-2">Sélectionnée</span>}
                  </summary>
                  <div className="ps-3 pt-2">
                    <ImageSelector
                      images={images}
                      selectedImages={currentImage ? [currentImage] : []}
                      sectionLabel={`Image ${index + 1} de la grille`}
                      inputType="radio"
                      onSelect={(selected) => updateGridImage(index, selected[0])}
                      onEditImage={onEditImage}
                      onGenerateAI={onGenerateImage}
                    />
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default VideoGridSection;
