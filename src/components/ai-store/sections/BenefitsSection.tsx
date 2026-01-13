"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { AIInputField } from "./AIInputField";
import { ImageSelector } from "./ImageSelector";
import type { SectionProps } from "./types";

/**
 * Benefits Section (Caractéristiques) - matches Laravel _benefits-section.blade.php
 * Maps to pdp-benefits section in theme
 */
export const BenefitsSection: React.FC<SectionProps> = ({
  content,
  updateField,
  regenerateField,
  regeneratingField,
  images = [],
  onEditImage,
  onGenerateImage,
}) => {
  const benefits = content.benefits || [];

  const updateBenefit = (index: number, value: string) => {
    const newBenefits = [...benefits];
    newBenefits[index] = value;
    updateField('benefits', newBenefits);
  };

  return (
    <div>
      {/* Section Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <p className="mb-0 fs-lg fw-600">Caractéristiques</p>
        <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Section Heading */}
      <AIInputField
        label="Titre de la Section"
        icon="ri-text"
        value={content.benefitsHeading || content.featureHeader || 'What Makes Us Different'}
        onChange={(val) => updateField('benefitsHeading', val)}
        onRegenerate={() => regenerateField('benefitsHeading', content.benefitsHeading || '')}
        isRegenerating={regeneratingField === 'benefitsHeading'}
        placeholder="What Makes Us Different"
      />

      {/* Section Description/Paragraph */}
      <AIInputField
        label="Description de la Section"
        icon="ri-file-text-line"
        type="textarea"
        rows={2}
        value={content.benefitsParagraph || ''}
        onChange={(val) => updateField('benefitsParagraph', val)}
        onRegenerate={() => regenerateField('benefitsParagraph', content.benefitsParagraph || '')}
        isRegenerating={regeneratingField === 'benefitsParagraph'}
        placeholder="Performance lenses built for men who live on screens but..."
      />

      {/* Divider */}
      <div className="horizontal-solid-divider border-top my-3"></div>

      {/* Benefits List */}
      <p className="mb-2 fs-small fw-500 text-muted">Liste des Avantages (4 max)</p>
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="mb-3">
          <label className="form-label text-dark fw-500 mb-1 fs-xs">
            <i className="ri-check-line me-1 text-light-gray"></i>
            Avantage {index + 1}
          </label>
          <div className="position-relative input-with-regenerate">
            <input
              type="text"
              className="form-control form-control-sm form-control-w-side-button"
              value={benefits[index] || ''}
              onChange={(e) => updateBenefit(index, e.target.value)}
              placeholder={`Reduce Eye Strain`}
            />
            <button
              type="button"
              className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-1 regenerate-field-btn"
              onClick={() => regenerateField(`benefits[${index}]`, benefits[index] || '')}
              disabled={regeneratingField === `benefits[${index}]`}
            >
              {regeneratingField === `benefits[${index}]` ? (
                <i className="ri-loader-4-line regenerate-loading-icon spin-animation"></i>
              ) : (
                <i className="ri-sparkling-line regenerate-loading-icon"></i>
              )}
            </button>
          </div>
        </div>
      ))}

      {/* Divider */}
      <div className="horizontal-solid-divider border-top my-3"></div>

      {/* Image 1 - Image de Notre Produit */}
      <p className="mb-2 fs-small fw-500 text-primary">Image de Notre Produit</p>
      <ImageSelector
        images={images}
        selectedImages={(content.selectedBenefitsImage ? [content.selectedBenefitsImage as string] : [])}
        sectionLabel="Image de Notre Produit"
        inputType="radio"
        onSelect={(selected) => updateField('selectedBenefitsImage', selected[0])}
        onEditImage={onEditImage}
        onGenerateAI={onGenerateImage}
      />

      {/* Divider */}
      <div className="horizontal-solid-divider border-top my-3"></div>

      {/* Image 2 - Image Secondaire */}
      <p className="mb-2 fs-small fw-500 text-primary">Image Secondaire</p>
      <ImageSelector
        images={images}
        selectedImages={(content.selectedBenefitsImage2 ? [content.selectedBenefitsImage2 as string] : [])}
        sectionLabel="Image Secondaire"
        inputType="radio"
        onSelect={(selected) => updateField('selectedBenefitsImage2', selected[0])}
        onEditImage={onEditImage}
        onGenerateAI={onGenerateImage}
      />
    </div>
  );
};

export default BenefitsSection;
