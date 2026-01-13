"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { AIInputField } from "./AIInputField";
import type { SectionProps } from "./types";

/**
 * Reviews Section - matches Laravel _reviews-section.blade.php
 * Maps to product-reviews section in theme
 */
export const ReviewsSection: React.FC<SectionProps> = ({
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
        <p className="mb-0 fs-lg fw-600">Review</p>
        <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Reviews List - matches Laravel exactly */}
      {testimonials.slice(0, 4).map((testimonial, index) => (
        <div key={index} className="mb-3">
          <div className="row gx-2 gx-xl-3">
            {/* Review Header/Title */}
            <div className="col-12">
              <div className="mb-3">
                <label className="form-label text-dark fw-500 mb-1 fs-small">
                  <i className="ri-chat-quote-line me-1 text-light-gray"></i>
                  Review {index + 1}
                </label>
                <div className="position-relative input-with-regenerate">
                  <input
                    type="text"
                    className="form-control form-control-sm form-control-w-side-button mb-2"
                    value={testimonial.header || ''}
                    onChange={(e) => updateNestedField('testimonials', index, 'header', e.target.value)}
                    placeholder="En-tête"
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

            {/* Author Name */}
            <div className="col-12">
              <div className="mb-3">
                <label className="form-label text-dark fw-500 mb-1 fs-small">
                  <i className="ri-user-line me-1 text-light-gray"></i>
                  Auteur
                </label>
                <div className="position-relative input-with-regenerate">
                  <input
                    type="text"
                    className="form-control form-control-sm form-control-w-side-button mb-2"
                    value={testimonial.name || ''}
                    onChange={(e) => updateNestedField('testimonials', index, 'name', e.target.value)}
                    placeholder="Auteur"
                  />
                  <button
                    type="button"
                    className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-1 regenerate-field-btn"
                    onClick={() => regenerateField(`testimonials[${index}][name]`, testimonial.name || '')}
                    disabled={regeneratingField === `testimonials[${index}][name]`}
                  >
                    {regeneratingField === `testimonials[${index}][name]` ? (
                      <i className="ri-loader-4-line regenerate-loading-icon spin-animation"></i>
                    ) : (
                      <i className="ri-sparkling-line regenerate-loading-icon"></i>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Review Description */}
            <div className="col-12">
              <div className="mb-1">
                <label className="form-label text-dark fw-500 mb-1 fs-small">Description</label>
                <div className="position-relative input-with-regenerate">
                  <input
                    type="text"
                    className="form-control form-control-sm form-control-w-side-button mb-2"
                    value={testimonial.review || ''}
                    onChange={(e) => updateNestedField('testimonials', index, 'review', e.target.value)}
                    placeholder="Description"
                  />
                  <button
                    type="button"
                    className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-1 regenerate-field-btn"
                    onClick={() => regenerateField(`testimonials[${index}][review]`, testimonial.review || '')}
                    disabled={regeneratingField === `testimonials[${index}][review]`}
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
          </div>
          <div className="horizontal-solid-divider border-top mt-2"></div>
        </div>
      ))}

      {/* Why Choose Us */}
      <AIInputField
        label="Pourquoi nous choisir"
        icon="ri-question-line"
        type="textarea"
        rows={4}
        value={(content as any).whyChooseUsText || ''}
        onChange={(val) => updateField('whyChooseUsText', val)}
        onRegenerate={() => regenerateField('whyChooseUsText', (content as any).whyChooseUsText || '')}
        isRegenerating={regeneratingField === 'whyChooseUsText'}
        placeholder="Pourquoi les clients devraient choisir votre produit..."
      />
    </div>
  );
};

export default ReviewsSection;
