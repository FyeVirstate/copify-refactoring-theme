"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { AIInputField } from "./AIInputField";
import { ImageSelector } from "./ImageSelector";
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

  return (
    <div>
      {/* Section Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <p className="mb-0 fs-lg fw-600">Product Section</p>
        <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Section Heading */}
      <div className="mb-3">
        <label className="form-label text-dark fw-500 mb-1 fs-xs">Titre de la section</label>
        <div className="position-relative input-with-regenerate">
          <input
            type="text"
            className="form-control form-control-sm form-control-w-side-button"
            value={(content as any).productSectionHeading || ''}
            onChange={(e) => updateField('productSectionHeading', e.target.value)}
            placeholder="Product Section Heading"
          />
          <button
            type="button"
            className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-1 regenerate-field-btn"
            onClick={() => regenerateField('productSectionHeading', (content as any).productSectionHeading || '')}
            disabled={regeneratingField === 'productSectionHeading'}
          >
            {regeneratingField === 'productSectionHeading' ? (
              <i className="ri-loader-4-line regenerate-loading-icon spin-animation"></i>
            ) : (
              <i className="ri-sparkling-line regenerate-loading-icon"></i>
            )}
          </button>
        </div>
      </div>

      {/* Section Subheading */}
      <div className="mb-3">
        <label className="form-label text-dark fw-500 mb-1 fs-xs">Sous-titre de la section</label>
        <div className="position-relative input-with-regenerate">
          <input
            type="text"
            className="form-control form-control-sm form-control-w-side-button"
            value={(content as any).productSectionSubheading || ''}
            onChange={(e) => updateField('productSectionSubheading', e.target.value)}
            placeholder="Product Section Subheading"
          />
          <button
            type="button"
            className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-1 regenerate-field-btn"
            onClick={() => regenerateField('productSectionSubheading', (content as any).productSectionSubheading || '')}
            disabled={regeneratingField === 'productSectionSubheading'}
          >
            {regeneratingField === 'productSectionSubheading' ? (
              <i className="ri-loader-4-line regenerate-loading-icon spin-animation"></i>
            ) : (
              <i className="ri-sparkling-line regenerate-loading-icon"></i>
            )}
          </button>
        </div>
      </div>

      {/* Product Features - 4 features with title + text */}
      <div className="mb-4">
        {[0, 1, 2, 3].map((index) => {
          const feature = productFeatures[index] || { title: '', text: '' };
          return (
            <div key={index}>
              <label className="form-label text-dark fw-500 mb-2 fs-xs">
                Caractéristiques du produit {index + 1}
              </label>
              <div className="row mb-3 gy-2 mb-4">
                {/* Feature Title */}
                <div className="col-12">
                  <div className="position-relative input-with-regenerate">
                    <input
                      type="text"
                      className="form-control form-control-sm form-control-w-side-button"
                      value={feature.title || ''}
                      onChange={(e) => updateProductFeature(index, 'title', e.target.value)}
                      placeholder="Titre de la fonctionnalité"
                    />
                    <button
                      type="button"
                      className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-1 regenerate-field-btn"
                      onClick={() => regenerateField(`productFeatures[${index}][title]`, feature.title || '')}
                      disabled={regeneratingField === `productFeatures[${index}][title]`}
                    >
                      {regeneratingField === `productFeatures[${index}][title]` ? (
                        <i className="ri-loader-4-line regenerate-loading-icon spin-animation"></i>
                      ) : (
                        <i className="ri-sparkling-line regenerate-loading-icon"></i>
                      )}
                    </button>
                  </div>
                </div>
                {/* Feature Text */}
                <div className="col-12">
                  <div className="position-relative input-with-regenerate">
                    <input
                      type="text"
                      className="form-control form-control-sm form-control-w-side-button"
                      value={feature.text || ''}
                      onChange={(e) => updateProductFeature(index, 'text', e.target.value)}
                      placeholder="Description de la fonctionnalité"
                    />
                    <button
                      type="button"
                      className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-1 regenerate-field-btn"
                      onClick={() => regenerateField(`productFeatures[${index}][text]`, feature.text || '')}
                      disabled={regeneratingField === `productFeatures[${index}][text]`}
                    >
                      {regeneratingField === `productFeatures[${index}][text]` ? (
                        <i className="ri-loader-4-line regenerate-loading-icon spin-animation"></i>
                      ) : (
                        <i className="ri-sparkling-line regenerate-loading-icon"></i>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="horizontal-solid-divider border-top mb-3"></div>
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
  );
};

export default ProductInfoSection;
