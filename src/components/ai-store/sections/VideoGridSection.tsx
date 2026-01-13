"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { ImageSelector } from "./ImageSelector";
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

  return (
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
            className="form-control form-control-sm form-control-w-side-button"
            value={videoGrid.heading || ''}
            onChange={(e) => updateVideoGrid('heading', e.target.value)}
            placeholder="Stop Losing Because of Bad Wi-Fi"
          />
          <button
            type="button"
            className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-1 regenerate-field-btn"
            onClick={() => regenerateField('videoGrid[heading]', videoGrid.heading || '')}
            disabled={regeneratingField === 'videoGrid[heading]'}
          >
            {regeneratingField === 'videoGrid[heading]' ? (
              <i className="ri-loader-4-line regenerate-loading-icon spin-animation"></i>
            ) : (
              <i className="ri-sparkling-line regenerate-loading-icon"></i>
            )}
          </button>
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
            className="form-control form-control-sm form-control-w-side-button"
            rows={2}
            value={videoGrid.subheading || ''}
            onChange={(e) => updateVideoGrid('subheading', e.target.value)}
            placeholder="Your skills deserve a connection that keeps up"
          />
          <button
            type="button"
            className="btn position-absolute top-0 end-0 mt-2 me-2 p-1 regenerate-field-btn"
            onClick={() => regenerateField('videoGrid[subheading]', videoGrid.subheading || '')}
            disabled={regeneratingField === 'videoGrid[subheading]'}
          >
            {regeneratingField === 'videoGrid[subheading]' ? (
              <i className="ri-loader-4-line regenerate-loading-icon spin-animation"></i>
            ) : (
              <i className="ri-sparkling-line regenerate-loading-icon"></i>
            )}
          </button>
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
  );
};

export default VideoGridSection;
