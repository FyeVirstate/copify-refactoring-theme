"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { AIInputField } from "./AIInputField";
import { RegenerateButton } from "./RegenerateButton";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  successField,
  errorField,
}) => {
  const testimonials = content.testimonials || [];

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
          <p className="mb-0 fs-lg fw-600">Review</p>
          <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
            <Trash2 size={16} />
          </button>
        </div>

        {/* Reviews List - matches Laravel exactly */}
        {testimonials.slice(0, 4).map((testimonial, index) => {
          const headerField = `testimonials[${index}][header]`;
          const nameField = `testimonials[${index}][name]`;
          const reviewField = `testimonials[${index}][review]`;
          
          return (
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
                        className={getFieldClassName(headerField, true)}
                        value={testimonial.header || ''}
                        onChange={(e) => updateNestedField('testimonials', index, 'header', e.target.value)}
                        placeholder="En-tête"
                        disabled={regeneratingField === headerField}
                      />
                      <RegenerateButton
                        onClick={() => regenerateField(headerField, testimonial.header || '')}
                        disabled={!!regeneratingField}
                        isRegenerating={regeneratingField === headerField}
                        isError={errorField === headerField}
                        position="middle"
                      />
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
                        className={getFieldClassName(nameField, true)}
                        value={testimonial.name || ''}
                        onChange={(e) => updateNestedField('testimonials', index, 'name', e.target.value)}
                        placeholder="Auteur"
                        disabled={regeneratingField === nameField}
                      />
                      <RegenerateButton
                        onClick={() => regenerateField(nameField, testimonial.name || '')}
                        disabled={!!regeneratingField}
                        isRegenerating={regeneratingField === nameField}
                        position="middle"
                      />
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
                        className={getFieldClassName(reviewField, true)}
                        value={testimonial.review || ''}
                        onChange={(e) => updateNestedField('testimonials', index, 'review', e.target.value)}
                        placeholder="Description"
                        disabled={regeneratingField === reviewField}
                      />
                      <RegenerateButton
                        onClick={() => regenerateField(reviewField, testimonial.review || '')}
                        disabled={!!regeneratingField}
                        isRegenerating={regeneratingField === reviewField}
                        isError={errorField === reviewField}
                        position="middle"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="horizontal-solid-divider border-top mt-2"></div>
            </div>
          );
        })}

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
          isSuccess={successField === 'whyChooseUsText'}
          isError={errorField === 'whyChooseUsText'}
          disabled={!!regeneratingField}
          placeholder="Pourquoi les clients devraient choisir votre produit..."
        />
      </div>
    </TooltipProvider>
  );
};

export default ReviewsSection;
