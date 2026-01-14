"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { AIInputField } from "./AIInputField";
import { RegenerateButton } from "./RegenerateButton";
import { ImageSelector } from "./ImageSelector";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  successField,
  errorField,
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
          isSuccess={successField === 'benefitsHeading'}
          isError={errorField === 'benefitsHeading'}
          disabled={!!regeneratingField}
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
          isSuccess={successField === 'benefitsParagraph'}
          isError={errorField === 'benefitsParagraph'}
          disabled={!!regeneratingField}
          placeholder="Performance lenses built for men who live on screens but..."
        />

        {/* Divider */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* Benefits List */}
        <p className="mb-2 fs-small fw-500 text-muted">Liste des Avantages (4 max)</p>
        {[0, 1, 2, 3].map((index) => {
          const fieldName = `benefits[${index}]`;
          return (
            <div key={index} className="mb-3">
              <label className="form-label text-dark fw-500 mb-1 fs-xs">
                <i className="ri-check-line me-1 text-light-gray"></i>
                Avantage {index + 1}
              </label>
              <div className="position-relative input-with-regenerate">
                <input
                  type="text"
                  className={getFieldClassName(fieldName, true)}
                  value={benefits[index] || ''}
                  onChange={(e) => updateBenefit(index, e.target.value)}
                  placeholder={`Reduce Eye Strain`}
                  disabled={regeneratingField === fieldName}
                />
                <RegenerateButton
                  onClick={() => regenerateField(fieldName, benefits[index] || '')}
                  disabled={!!regeneratingField}
                  isRegenerating={regeneratingField === fieldName}
                  isError={errorField === fieldName}
                  position="middle"
                />
              </div>
            </div>
          );
        })}

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
    </TooltipProvider>
  );
};

export default BenefitsSection;
