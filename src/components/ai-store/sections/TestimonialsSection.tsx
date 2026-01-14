"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { AIInputField } from "./AIInputField";
import { RegenerateButton } from "./RegenerateButton";
import { TooltipProvider } from "@/components/ui/tooltip";
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
          isSuccess={successField === 'persuasiveContent.header'}
          isError={errorField === 'persuasiveContent.header'}
          disabled={!!regeneratingField}
          placeholder="Not All Blue Light Glasses Are Created Equal"
        />

        {/* Testimonials List */}
        {testimonials.slice(0, 5).map((testimonial, index) => {
          const nameField = `testimonials[${index}][name]`;
          const headerField = `testimonials[${index}][header]`;
          const reviewField = `testimonials[${index}][review]`;
          
          return (
            <div key={index} className="mb-4 p-3 border rounded">
              <div className="row mb-2">
                {/* Nom */}
                <div className="col-md-6">
                  <label className="form-label text-dark fw-500 mb-1 fs-xs">Nom</label>
                  <div className="position-relative input-with-regenerate">
                    <input
                      type="text"
                      className={getFieldClassName(nameField, true)}
                      value={testimonial.name || ''}
                      onChange={(e) => updateNestedField('testimonials', index, 'name', e.target.value)}
                      placeholder="Marcus T."
                      disabled={regeneratingField === nameField}
                    />
                    <RegenerateButton
                      onClick={() => regenerateField(nameField, testimonial.name || '')}
                      disabled={!!regeneratingField}
                      isRegenerating={regeneratingField === nameField}
                      isError={errorField === nameField}
                      position="middle"
                    />
                  </div>
                </div>
                {/* Titre du témoignage */}
                <div className="col-md-6">
                  <label className="form-label text-dark fw-500 mb-1 fs-xs">Titre du témoignage</label>
                  <div className="position-relative input-with-regenerate">
                    <input
                      type="text"
                      className={getFieldClassName(headerField, true)}
                      value={testimonial.header || ''}
                      onChange={(e) => updateNestedField('testimonials', index, 'header', e.target.value)}
                      placeholder="Game changer for sleep"
                      disabled={regeneratingField === headerField}
                    />
                    <RegenerateButton
                      onClick={() => regenerateField(headerField, testimonial.header || '')}
                      disabled={!!regeneratingField}
                      isRegenerating={regeneratingField === headerField}
                      position="middle"
                    />
                  </div>
                </div>
              </div>
              {/* Témoignages */}
              <div>
                <label className="form-label text-dark fw-500 mb-1 fs-xs">Témoignages</label>
                <div className="position-relative input-with-regenerate">
                  <textarea
                    className={getFieldClassName(reviewField, true)}
                    rows={2}
                    value={testimonial.review || ''}
                    onChange={(e) => updateNestedField('testimonials', index, 'review', e.target.value)}
                    placeholder="Finally sleeping through the night. Red lenses work incredibly well."
                    disabled={regeneratingField === reviewField}
                  />
                  <RegenerateButton
                    onClick={() => regenerateField(reviewField, testimonial.review || '')}
                    disabled={!!regeneratingField}
                    isRegenerating={regeneratingField === reviewField}
                    isError={errorField === reviewField}
                    position="top"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default TestimonialsSection;
