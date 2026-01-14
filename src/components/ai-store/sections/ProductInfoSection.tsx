"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { AIInputField } from "./AIInputField";
import { RegenerateButton } from "./RegenerateButton";
import { ImageSelector } from "./ImageSelector";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { SectionProps } from "./types";

/**
 * Product Section - matches Laravel _product-section.blade.php
 * Maps to product-section-1 in theme
 */
export const ProductInfoSection: React.FC<SectionProps> = ({
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
  const productFeatures = (content.productFeatures as Array<{ title: string; text: string }>) || [];

  const updateProductFeature = (index: number, field: 'title' | 'text', value: string) => {
    const newFeatures = [...productFeatures];
    if (!newFeatures[index]) newFeatures[index] = { title: '', text: '' };
    newFeatures[index][field] = value;
    updateField('productFeatures', newFeatures);
  };

  // Helper to get field class names
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
          value={(content as any).productSectionHeading || ''}
          onChange={(val) => updateField('productSectionHeading', val)}
          onRegenerate={() => regenerateField('productSectionHeading', (content as any).productSectionHeading || '')}
          isRegenerating={regeneratingField === 'productSectionHeading'}
          isSuccess={successField === 'productSectionHeading'}
          isError={errorField === 'productSectionHeading'}
          disabled={!!regeneratingField}
          placeholder="Designed for comfort without sacrifice"
        />

        {/* Section Subheading */}
        <AIInputField
          label="Description de la Section"
          icon="ri-file-text-line"
          type="textarea"
          rows={2}
          value={(content as any).productSectionSubheading || ''}
          onChange={(val) => updateField('productSectionSubheading', val)}
          onRegenerate={() => regenerateField('productSectionSubheading', (content as any).productSectionSubheading || '')}
          isRegenerating={regeneratingField === 'productSectionSubheading'}
          isSuccess={successField === 'productSectionSubheading'}
          isError={errorField === 'productSectionSubheading'}
          disabled={!!regeneratingField}
          placeholder="Performance lenses built for men who live on screens but..."
        />

        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* Product Features - 4 features with title + text */}
        <div className="mb-4">
          <label className="form-label text-dark fw-500 mb-2 fs-xs">
            <i className="ri-list-check me-1 text-light-gray"></i>
            Liste des Avantages (4 max)
          </label>
          {[0, 1, 2, 3].map((index) => {
            const feature = productFeatures[index] || { title: '', text: '' };
            const titleFieldName = `productFeatures[${index}][title]`;
            const textFieldName = `productFeatures[${index}][text]`;
            
            return (
              <div key={index} className="mb-3">
                <details className="feature-accordion" open={index === 0}>
                  <summary className="form-label text-dark fw-500 mb-1 fs-xs cursor-pointer">
                    <i className="ri-arrow-right-s-line me-1"></i>
                    Avantage {index + 1}
                  </summary>
                  <div className="ps-3 pt-2">
                    {/* Feature Title */}
                    <div className="mb-2">
                      <label className="form-label text-muted mb-1 fs-xs">Titre</label>
                      <div className="position-relative input-with-regenerate">
                        <input
                          type="text"
                          className={getFieldClassName(titleFieldName, true)}
                          value={feature.title || ''}
                          onChange={(e) => updateProductFeature(index, 'title', e.target.value)}
                          placeholder={`Titre de l'avantage ${index + 1}`}
                          disabled={regeneratingField === titleFieldName}
                        />
                        <RegenerateButton
                          onClick={() => regenerateField(titleFieldName, feature.title || '')}
                          disabled={!!regeneratingField}
                          isRegenerating={regeneratingField === titleFieldName}
                          isError={errorField === titleFieldName}
                          position="middle"
                        />
                      </div>
                    </div>
                    {/* Feature Text */}
                    <div>
                      <label className="form-label text-muted mb-1 fs-xs">Description</label>
                      <div className="position-relative input-with-regenerate">
                        <input
                          type="text"
                          className={getFieldClassName(textFieldName, true)}
                          value={feature.text || ''}
                          onChange={(e) => updateProductFeature(index, 'text', e.target.value)}
                          placeholder={`Description de l'avantage ${index + 1}`}
                          disabled={regeneratingField === textFieldName}
                        />
                        <RegenerateButton
                          onClick={() => regenerateField(textFieldName, feature.text || '')}
                          disabled={!!regeneratingField}
                          isRegenerating={regeneratingField === textFieldName}
                          isError={errorField === textFieldName}
                          position="middle"
                        />
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            );
          })}
        </div>

        {/* Image Selection */}
        <ImageSelector
          images={images}
          selectedImages={(content.productSectionImage as string[]) || []}
          sectionLabel="Image de Notre Produit"
          inputType="checkbox"
          onSelect={(selected) => updateField('productSectionImage', selected)}
          onEditImage={onEditImage}
          onGenerateAI={onGenerateImage}
        />
      </div>
    </TooltipProvider>
  );
};

export default ProductInfoSection;
