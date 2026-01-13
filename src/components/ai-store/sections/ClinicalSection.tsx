"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { AIInputField } from "./AIInputField";
import { ImageSelector } from "./ImageSelector";
import type { SectionProps } from "./types";

/**
 * Clinical Section - matches Laravel _clinical-section.blade.php
 * Maps to pdp-statistics-column section in theme
 */
export const ClinicalSection: React.FC<SectionProps> = ({
  content,
  updateField,
  regenerateField,
  regeneratingField,
  images = [],
  onEditImage,
  onGenerateImage,
}) => {
  const clinicalResults = content.clinicalResults || [];

  const updateClinicalResult = (index: number, field: 'percentage' | 'description', value: string) => {
    const newResults = [...clinicalResults];
    if (!newResults[index]) newResults[index] = { percentage: '', description: '' };
    newResults[index][field] = value;
    updateField('clinicalResults', newResults);
  };

  return (
    <div>
      {/* Section Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <p className="mb-0 fs-lg fw-600">Section Clinique</p>
        <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Section Description */}
      <AIInputField
        label="Description"
        icon="ri-file-text-line"
        type="textarea"
        rows={4}
        value={content.persuasiveContent?.paragraph || ''}
        onChange={(val) => {
          const persuasiveContent = { ...content.persuasiveContent, paragraph: val };
          updateField('persuasiveContent', persuasiveContent);
        }}
        onRegenerate={() => regenerateField('persuasiveContent.paragraph', content.persuasiveContent?.paragraph || '')}
        isRegenerating={regeneratingField === 'persuasiveContent.paragraph'}
        placeholder="Clinical study results show..."
      />

      {/* Divider */}
      <div className="horizontal-solid-divider border-top my-3"></div>

      {/* Clinical Results */}
      {[0, 1, 2, 3].map((index) => {
        const result = clinicalResults[index] || { percentage: '', description: '' };
        return (
          <div key={index} className="mb-4">
            <p className="mb-1 fs-small fw-500 text-muted">Résultat Clinique {index + 1}</p>
            
            {/* Percentage */}
            <div className="mb-3">
              <label className="form-label text-dark fw-500 mb-1 fs-small">
                <i className="ri-percent-line me-1 text-light-gray"></i>
                Pourcentage
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={result.percentage || ''}
                onChange={(e) => updateClinicalResult(index, 'percentage', e.target.value)}
                placeholder="94%"
              />
            </div>

            {/* Description */}
            <div className="mb-3">
              <label className="form-label text-dark fw-500 mb-1 fs-small">
                <i className="ri-file-text-line me-1 text-light-gray"></i>
                Description
              </label>
              <div className="position-relative input-with-regenerate">
                <textarea
                  className="form-control form-control-sm form-control-w-side-button"
                  rows={2}
                  value={result.description || ''}
                  onChange={(e) => updateClinicalResult(index, 'description', e.target.value)}
                  placeholder="of users reported improved sleep quality"
                />
                <button
                  type="button"
                  className="btn position-absolute top-0 end-0 mt-2 me-2 p-1 regenerate-field-btn"
                  onClick={() => regenerateField(`clinicalResults[${index}][description]`, result.description || '')}
                  disabled={regeneratingField === `clinicalResults[${index}][description]`}
                >
                  {regeneratingField === `clinicalResults[${index}][description]` ? (
                    <i className="ri-loader-4-line regenerate-loading-icon spin-animation"></i>
                  ) : (
                    <i className="ri-sparkling-line regenerate-loading-icon"></i>
                  )}
                </button>
              </div>
            </div>

            {/* Divider */}
            {index < 3 && <div className="horizontal-solid-divider border-top mt-3"></div>}
          </div>
        );
      })}

      {/* Image Section */}
      <div className="horizontal-solid-divider border-top my-3"></div>
      <ImageSelector
        images={images}
        selectedImages={(content.selectedClinicalImage ? [content.selectedClinicalImage as string] : [])}
        sectionLabel="Image de Notre Produit"
        inputType="radio"
        onSelect={(selected) => updateField('selectedClinicalImage', selected[0])}
        onEditImage={onEditImage}
        onGenerateAI={onGenerateImage}
      />
    </div>
  );
};

export default ClinicalSection;
