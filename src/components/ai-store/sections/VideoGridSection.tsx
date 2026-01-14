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

  const updateVideoGrid = (field: string, value: string) => {
    updateField('videoGrid', { ...videoGrid, [field]: value });
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
              placeholder="Stop Losing Because of Bad Wi-Fi"
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
              placeholder="Your skills deserve a connection that keeps up"
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

        {/* Image/Video Selection */}
        <ImageSelector
          images={images}
          selectedImages={(content.videoGridImages as string[]) || []}
          sectionLabel="Image de Notre Produit"
          inputType="checkbox"
          sortable={true}
          onSelect={(selected) => updateField('videoGridImages', selected)}
          onEditImage={onEditImage}
          onGenerateAI={onGenerateImage}
        />
      </div>
    </TooltipProvider>
  );
};

export default VideoGridSection;
