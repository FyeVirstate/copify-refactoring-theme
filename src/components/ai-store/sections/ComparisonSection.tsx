"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { RegenerateButton } from "./RegenerateButton";
import { ImageSelector } from "./ImageSelector";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { SectionProps } from "./types";

interface ComparisonFeature {
  feature: string;
  us: boolean | string;
  others: boolean | string;
}

// Helper to normalize boolean values (can be 'yes'/'no'/'partial' or true/false)
const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'yes' || value === 'true';
  return false;
};

// Convert checkbox to storage format ('yes'/'no')
const fromBoolean = (value: boolean): string => value ? 'yes' : 'no';

/**
 * Comparison Section - matches Laravel _comparison-section.blade.php
 * Maps to pdp-comparison-table section in theme
 */
export const ComparisonSection: React.FC<SectionProps> = ({
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
  // Get comparison data from content (can be at root level or nested)
  const rawComparison = (content as any).comparison || {};
  
  // Build comparison object with defaults
  const comparison = {
    heading: rawComparison.heading || (content as any).comparisonHeading || 'Why Choose Us?',
    subheading: rawComparison.subheading || (content as any).comparisonSubheading || "Here's why we're the industry leader",
    our_name: rawComparison.our_name || (content as any).comparisonOurName || content.title || 'Our Product',
    others_name: rawComparison.others_name || (content as any).comparisonOthersName || 'Others',
    features: rawComparison.features || (content as any).comparisonFeatures || [
      { feature: 'Premium Quality Materials', us: 'yes', others: 'no' },
      { feature: 'Free Shipping Included', us: 'yes', others: 'no' },
      { feature: '30-Day Money Back Guarantee', us: 'yes', others: 'partial' },
      { feature: '24/7 Customer Support', us: 'yes', others: 'no' },
      { feature: '', us: 'yes', others: 'no' },
    ]
  };

  const updateComparison = (field: string, value: any) => {
    updateField('comparison', { ...comparison, [field]: value });
  };

  const updateComparisonFeature = (index: number, field: keyof ComparisonFeature, value: any) => {
    const newFeatures = [...(comparison.features || [])];
    if (!newFeatures[index]) {
      newFeatures[index] = { feature: '', us: 'no', others: 'no' };
    }
    // Store as 'yes'/'no' for compatibility with contentMapping
    if (field === 'us' || field === 'others') {
      newFeatures[index][field] = fromBoolean(value);
    } else {
      newFeatures[index][field] = value;
    }
    updateComparison('features', newFeatures);
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
          <p className="mb-0 fs-lg fw-600">Tableau Comparatif</p>
          <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
            <Trash2 size={16} />
          </button>
        </div>

        {/* Section Heading */}
        <div className="mb-3">
          <label className="form-label text-dark fw-500 mb-1 fs-small">
            <i className="ri-text me-1 text-light-gray"></i>
            Titre de la Section
          </label>
          <div className="position-relative input-with-regenerate">
            <input
              type="text"
              className={getFieldClassName('comparison.heading', true)}
              value={comparison.heading || ''}
              onChange={(e) => updateComparison('heading', e.target.value)}
              placeholder="Why Choose Us?"
              disabled={regeneratingField === 'comparison.heading'}
            />
            <RegenerateButton
              onClick={() => regenerateField('comparison.heading', comparison.heading || '')}
              disabled={!!regeneratingField}
              isRegenerating={regeneratingField === 'comparison.heading'}
              isError={errorField === 'comparison.heading'}
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
            <input
              type="text"
              className={getFieldClassName('comparison.subheading', true)}
              value={comparison.subheading || ''}
              onChange={(e) => updateComparison('subheading', e.target.value)}
              placeholder="Here's why we're the industry leader"
              disabled={regeneratingField === 'comparison.subheading'}
            />
            <RegenerateButton
              onClick={() => regenerateField('comparison.subheading', comparison.subheading || '')}
              disabled={!!regeneratingField}
              isRegenerating={regeneratingField === 'comparison.subheading'}
              isError={errorField === 'comparison.subheading'}
              position="middle"
            />
          </div>
        </div>

        {/* Product Names - side by side */}
        <div className="row mb-3">
          <div className="col-6">
            <label className="form-label text-dark fw-500 mb-1 fs-small">
              Nom de Notre Produit
            </label>
            <div className="position-relative input-with-regenerate">
              <input
                type="text"
                className={getFieldClassName('comparison.our_name', true)}
                value={comparison.our_name || ''}
                onChange={(e) => updateComparison('our_name', e.target.value)}
                placeholder="Our Product"
                disabled={regeneratingField === 'comparison.our_name'}
              />
              <RegenerateButton
                onClick={() => regenerateField('comparison.our_name', comparison.our_name || '')}
                disabled={!!regeneratingField}
                isRegenerating={regeneratingField === 'comparison.our_name'}
                isError={errorField === 'comparison.our_name'}
                position="middle"
              />
            </div>
          </div>
          <div className="col-6">
            <label className="form-label text-dark fw-500 mb-1 fs-small">
              Autres
            </label>
            <div className="position-relative input-with-regenerate">
              <input
                type="text"
                className={getFieldClassName('comparison.others_name', true)}
                value={comparison.others_name || ''}
                onChange={(e) => updateComparison('others_name', e.target.value)}
                placeholder="Others"
                disabled={regeneratingField === 'comparison.others_name'}
              />
              <RegenerateButton
                onClick={() => regenerateField('comparison.others_name', comparison.others_name || '')}
                disabled={!!regeneratingField}
                isRegenerating={regeneratingField === 'comparison.others_name'}
                position="middle"
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* Image de Notre Produit */}
        <p className="mb-2 fs-small fw-500 text-primary">Image de Notre Produit</p>
        <ImageSelector
          images={images}
          selectedImages={(content.comparisonOurImage ? [content.comparisonOurImage as string] : [])}
          sectionLabel="Image de Notre Produit"
          inputType="radio"
          onSelect={(selected) => updateField('comparisonOurImage', selected[0])}
          onEditImage={onEditImage}
          onGenerateAI={onGenerateImage}
        />

        {/* Divider */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* Image des Autres */}
        <p className="mb-2 fs-small fw-500 text-primary">Image des Autres</p>
        <ImageSelector
          images={images}
          selectedImages={(content.comparisonOthersImage ? [content.comparisonOthersImage as string] : [])}
          sectionLabel="Image des Autres"
          inputType="radio"
          onSelect={(selected) => updateField('comparisonOthersImage', selected[0])}
          onEditImage={onEditImage}
          onGenerateAI={onGenerateImage}
        />

        {/* Divider */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* Comparison Features */}
        <div className="mb-4">
          <label className="form-label text-dark fw-500 mb-2 fs-small">
            Caractéristiques Comparatives (5)
          </label>
          {[0, 1, 2, 3, 4].map((index) => {
            const feature = (comparison.features || [])[index] || { feature: '', us: 'no', others: 'no' };
            const featureField = `comparison.features[${index}]`;
            
            return (
              <div key={index} className="row mb-2 align-items-center">
                <div className="col-6">
                  <div className="position-relative input-with-regenerate">
                    <input
                      type="text"
                      className={getFieldClassName(featureField, true)}
                      value={feature.feature || ''}
                      onChange={(e) => updateComparisonFeature(index, 'feature', e.target.value)}
                      placeholder="Nom de la caractéristique"
                      disabled={regeneratingField === featureField}
                    />
                    <RegenerateButton
                      onClick={() => regenerateField(featureField, feature.feature || '')}
                      disabled={!!regeneratingField}
                      isRegenerating={regeneratingField === featureField}
                      isError={errorField === featureField}
                      position="middle"
                    />
                  </div>
                </div>
                <div className="col-3 text-center">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={toBoolean(feature.us)}
                      onChange={(e) => updateComparisonFeature(index, 'us', e.target.checked)}
                    />
                    <label className="form-check-label fs-xs">Nous</label>
                  </div>
                </div>
                <div className="col-3 text-center">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={toBoolean(feature.others)}
                      onChange={(e) => updateComparisonFeature(index, 'others', e.target.checked)}
                    />
                    <label className="form-check-label fs-xs">Autres</label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ComparisonSection;
