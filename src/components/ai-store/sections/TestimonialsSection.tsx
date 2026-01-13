"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { AIInputField } from "./AIInputField";
import type { SectionProps } from "./types";

/**
 * Témoignages Section - matches Laravel _testimonial-marquee-section.blade.php
 */
export const TestimonialsSection: React.FC<SectionProps> = ({
  content,
  updateField,
  updateNestedField,
  regenerateField,
  regeneratingField,
}) => {
  const testimonials = content.testimonials || [];

  return (
    <div>
      {/* Section Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <p className="mb-0 fs-lg fw-600">Témoignages</p>
        <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
          <Trash2 size={16} />
        </button>
      </div>

      {/* En-tête */}
      <AIInputField
        label="En-tête"
        icon="ri-text"
        value={content.persuasiveContent?.header || ''}
        onChange={(val) => {
          const persuasiveContent = { ...content.persuasiveContent, header: val };
          updateField('persuasiveContent', persuasiveContent);
        }}
        onRegenerate={() => regenerateField('persuasiveContent.header', content.persuasiveContent?.header || '')}
        isRegenerating={regeneratingField === 'persuasiveContent.header'}
        placeholder="Not All Blue Light Glasses Are Created Equal"
      />

      {/* Description */}
      <AIInputField
        label="Description"
        icon="ri-file-text-line"
        type="textarea"
        rows={3}
        value={content.persuasiveContent?.paragraph || ''}
        onChange={(val) => {
          const persuasiveContent = { ...content.persuasiveContent, paragraph: val };
          updateField('persuasiveContent', persuasiveContent);
        }}
        onRegenerate={() => regenerateField('persuasiveContent.paragraph', content.persuasiveContent?.paragraph || '')}
        isRegenerating={regeneratingField === 'persuasiveContent.paragraph'}
        placeholder="Most clear lenses barely work..."
      />

      {/* Caractéristiques */}
      <AIInputField
        label="Caractéristiques"
        icon="ri-lightbulb-line"
        type="textarea"
        rows={3}
        value={content.whatMakesUsDifferentText || ''}
        onChange={(val) => updateField('whatMakesUsDifferentText', val)}
        onRegenerate={() => regenerateField('whatMakesUsDifferentText', content.whatMakesUsDifferentText || '')}
        isRegenerating={regeneratingField === 'whatMakesUsDifferentText'}
        placeholder="Most clear lenses barely work. Our performance lenses block what others can't—up to 99%."
      />

      {/* Divider */}
      <div className="horizontal-solid-divider border-top my-3"></div>

      {/* Testimonials Label */}
      <p className="mb-2 fs-small fw-500 text-muted">Témoignages</p>

      {/* Testimonials List */}
      {testimonials.slice(0, 5).map((testimonial, index) => (
        <div key={index} className="mb-4 p-3 border rounded">
          <div className="row mb-2">
            {/* Nom */}
            <div className="col-md-6">
              <label className="form-label text-dark fw-500 mb-1 fs-xs">Nom</label>
              <div className="position-relative input-with-regenerate">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={testimonial.name || ''}
                  onChange={(e) => updateNestedField('testimonials', index, 'name', e.target.value)}
                  placeholder="Marcus T."
                />
              </div>
            </div>
            {/* Titre du témoignage */}
            <div className="col-md-6">
              <label className="form-label text-dark fw-500 mb-1 fs-xs">Titre du témoignage</label>
              <div className="position-relative input-with-regenerate">
                <input
                  type="text"
                  className="form-control form-control-sm form-control-w-side-button"
                  value={testimonial.header || ''}
                  onChange={(e) => updateNestedField('testimonials', index, 'header', e.target.value)}
                  placeholder="Game changer for sleep"
                />
                <button
                  type="button"
                  className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-1 regenerate-field-btn"
                  onClick={() => regenerateField(`testimonials[${index}][header]`, testimonial.header || '')}
                  disabled={regeneratingField === `testimonials[${index}][header]`}
                >
                  {regeneratingField === `testimonials[${index}][header]` ? (
                    <i className="ri-loader-4-line regenerate-loading-icon spin-animation"></i>
                  ) : (
                    <i className="ri-sparkling-line regenerate-loading-icon"></i>
                  )}
                </button>
              </div>
            </div>
          </div>
          {/* Témoignages */}
          <div>
            <label className="form-label text-dark fw-500 mb-1 fs-xs">Témoignages</label>
            <div className="position-relative input-with-regenerate">
              <textarea
                className="form-control form-control-sm form-control-w-side-button"
                rows={2}
                value={testimonial.review || ''}
                onChange={(e) => updateNestedField('testimonials', index, 'review', e.target.value)}
                placeholder="Finally sleeping through the night. Red lenses work incredibly well."
              />
              <button
                type="button"
                className="btn position-absolute top-0 end-0 mt-2 me-2 p-1 regenerate-field-btn"
                onClick={() => regenerateField(`testimonials[${index}][review]`, testimonial.review || '')}
                disabled={regeneratingField === `testimonials[${index}][review]`}
                title="Régénérer avec IA"
              >
                {regeneratingField === `testimonials[${index}][review]` ? (
                  <i className="ri-loader-4-line regenerate-loading-icon spin-animation"></i>
                ) : (
                  <i className="ri-sparkling-line regenerate-loading-icon"></i>
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TestimonialsSection;
