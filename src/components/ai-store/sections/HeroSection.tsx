"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { AIInputField } from "./AIInputField";
import { RegenerateButton } from "./RegenerateButton";
import { ImageSelector } from "./ImageSelector";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { SectionProps } from "./types";

/**
 * Hero Section (Landing Page) - Simple version with just Title, Paragraph, Button, Image
 * Maps to img-with-txt section in theme
 */
export const HeroSection: React.FC<SectionProps> = ({
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
          <p className="mb-0 fs-lg fw-600">Héro</p>
          <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
            <Trash2 size={16} />
          </button>
        </div>

        {/* Section Title */}
        <AIInputField
          label="Titre de la Section"
          icon="ri-text"
          value={content.mainCatchyText || ''}
          onChange={(val) => updateField('mainCatchyText', val)}
          onRegenerate={() => regenerateField('mainCatchyText', content.mainCatchyText || '')}
          isRegenerating={regeneratingField === 'mainCatchyText'}
          isSuccess={successField === 'mainCatchyText'}
          isError={errorField === 'mainCatchyText'}
          disabled={!!regeneratingField}
          placeholder="Protect Your Eyes From Screen Burnout Daily"
        />

        {/* Section Paragraph */}
        <AIInputField
          label="Paragraphe de la Section"
          icon="ri-file-text-line"
          type="textarea"
          rows={2}
          value={content.subMainCatchyText || ''}
          onChange={(val) => updateField('subMainCatchyText', val)}
          onRegenerate={() => regenerateField('subMainCatchyText', content.subMainCatchyText || '')}
          isRegenerating={regeneratingField === 'subMainCatchyText'}
          isSuccess={successField === 'subMainCatchyText'}
          isError={errorField === 'subMainCatchyText'}
          disabled={!!regeneratingField}
          placeholder="Performance eyewear engineered to block harmful light wavelengths effectively"
        />

        {/* Button Text - with regenerate */}
        <div className="mb-3">
          <label className="form-label text-dark fw-500 mb-1 fs-xs">
            <i className="ri-cursor-line me-1 text-light-gray"></i>
            Texte du Bouton
          </label>
          <div className="position-relative input-with-regenerate">
            <input
              type="text"
              className={getFieldClassName('heroButtonText', true)}
              value={content.heroButtonText || 'Shop All Products'}
              onChange={(e) => updateField('heroButtonText', e.target.value)}
              placeholder="Shop All Products"
              disabled={regeneratingField === 'heroButtonText'}
            />
            <RegenerateButton
              onClick={() => regenerateField('heroButtonText', content.heroButtonText || '')}
              disabled={!!regeneratingField}
              isRegenerating={regeneratingField === 'heroButtonText'}
              isError={errorField === 'heroButtonText'}
              position="middle"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* Image Selection - Image de la Section */}
        <p className="mb-2 fs-small fw-500 text-primary">Image de la Section</p>
        <ImageSelector
          images={images}
          selectedImages={(content.selectedHeroImage ? [content.selectedHeroImage as string] : [])}
          sectionLabel="Image de Notre Produit"
          inputType="radio"
          onSelect={(selected) => updateField('selectedHeroImage', selected[0])}
          onEditImage={onEditImage}
          onGenerateAI={onGenerateImage}
        />
      </div>
    </TooltipProvider>
  );
};

export default HeroSection;
