"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { RegenerateButton } from "./RegenerateButton";
import { ImageSelector } from "./ImageSelector";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { SectionProps } from "./types";

/**
 * Image With Text Section - matches Laravel _image-with-text-section.blade.php
 * Maps to image-with-text section in theme
 */
export const ImageWithTextSection: React.FC<SectionProps> = ({
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
  const imageWithText = content.imageWithText || {
    header: '',
    text: '',
  };

  const updateImageWithText = (field: string, value: string) => {
    updateField('imageWithText', { ...imageWithText, [field]: value });
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
          <p className="mb-0 fs-lg fw-600">Image avec Texte</p>
          <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
            <Trash2 size={16} />
          </button>
        </div>

        {/* Header */}
        <div className="mb-3">
          <label className="form-label text-dark fw-500 mb-1 fs-xs">
            <i className="ri-text me-1 text-light-gray"></i>
            Titre de la section
          </label>
          <div className="position-relative input-with-regenerate">
            <input
              type="text"
              className={getFieldClassName('imageWithText.header', true)}
              value={imageWithText.header || ''}
              onChange={(e) => updateImageWithText('header', e.target.value)}
              placeholder="Section Header"
              maxLength={60}
              disabled={regeneratingField === 'imageWithText.header'}
            />
            <RegenerateButton
              onClick={() => regenerateField('imageWithText.header', imageWithText.header || '')}
              disabled={!!regeneratingField}
              isRegenerating={regeneratingField === 'imageWithText.header'}
              position="middle"
            />
          </div>
        </div>

        {/* Text Content */}
        <div className="mb-3">
          <label className="form-label text-dark fw-500 mb-1 fs-xs">
            <i className="ri-file-text-line me-1 text-light-gray"></i>
            Contenu du texte
          </label>
          <div className="position-relative input-with-regenerate">
            <textarea
              className={getFieldClassName('imageWithText.text', true)}
              rows={3}
              value={imageWithText.text || ''}
              onChange={(e) => updateImageWithText('text', e.target.value)}
              placeholder="Content text for this section"
              maxLength={150}
              disabled={regeneratingField === 'imageWithText.text'}
            />
            <RegenerateButton
              onClick={() => regenerateField('imageWithText.text', imageWithText.text || '')}
              disabled={!!regeneratingField}
              isRegenerating={regeneratingField === 'imageWithText.text'}
              isError={errorField === 'imageWithText.text'}
              position="top"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* Image Selection */}
        <ImageSelector
          images={images}
          selectedImages={(imageWithText.imageWithTextImage ? [imageWithText.imageWithTextImage as string] : [])}
          sectionLabel="Image de Notre Produit"
          inputType="radio"
          onSelect={(selected) => updateField('imageWithTextImage', selected[0])}
          onEditImage={onEditImage}
          onGenerateAI={onGenerateImage}
        />
      </div>
    </TooltipProvider>
  );
};

export default ImageWithTextSection;
