"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { AIInputField } from "./AIInputField";
import { ImageSelector } from "./ImageSelector";
import type { SectionProps } from "./types";

/**
 * FAQ Section - matches Laravel _faq-section.blade.php
 * Maps to image-faq section in theme
 */
export const FAQSection: React.FC<SectionProps> = ({
  content,
  updateField,
  updateNestedField,
  regenerateField,
  regeneratingField,
  images = [],
  onEditImage,
  onGenerateImage,
}) => {
  const faqItems = content.faq || [];

  return (
    <div>
      {/* Section Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <p className="mb-0 fs-lg fw-600">FAQs</p>
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
            className="form-control form-control-sm form-control-w-side-button"
            value={(content as any).faqHeading || 'Questions Fréquemment Posées'}
            onChange={(e) => updateField('faqHeading', e.target.value)}
            placeholder="Questions Fréquemment Posées"
          />
          <button
            type="button"
            className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-1 regenerate-field-btn"
            onClick={() => regenerateField('faqHeading', (content as any).faqHeading || '')}
            disabled={regeneratingField === 'faqHeading'}
          >
            {regeneratingField === 'faqHeading' ? (
              <i className="ri-loader-4-line regenerate-loading-icon spin-animation"></i>
            ) : (
              <i className="ri-sparkling-line regenerate-loading-icon"></i>
            )}
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="horizontal-solid-divider border-top my-3"></div>

      {/* FAQ Items - 5 items like Laravel */}
      <p className="mb-2 fs-small fw-500 text-muted">Éléments FAQ</p>
      {[0, 1, 2, 3, 4].map((index) => {
        const item = faqItems[index] || { question: '', answer: '' };
        return (
          <div key={index} className="mb-4">
            {/* Question */}
            <div className="mb-3">
              <label className="form-label text-dark fw-500 mb-1 fs-small">
                <i className="ri-questionnaire-line me-1 text-light-gray"></i>
                Question
              </label>
              <div className="position-relative input-with-regenerate">
                <input
                  type="text"
                  className="form-control form-control-sm form-control-w-side-button"
                  value={item.question || ''}
                  onChange={(e) => updateNestedField('faq', index, 'question', e.target.value)}
                  placeholder="Question"
                />
                <button
                  type="button"
                  className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-1 regenerate-field-btn"
                  onClick={() => regenerateField(`faq[${index}][question]`, item.question || '')}
                  disabled={regeneratingField === `faq[${index}][question]`}
                >
                  {regeneratingField === `faq[${index}][question]` ? (
                    <i className="ri-loader-4-line regenerate-loading-icon spin-animation"></i>
                  ) : (
                    <i className="ri-sparkling-line regenerate-loading-icon"></i>
                  )}
                </button>
              </div>
            </div>

            {/* Answer */}
            <div className="mb-3">
              <label className="form-label text-dark fw-500 mb-1 fs-small">
                <i className="ri-lightbulb-line me-1 text-light-gray"></i>
                Réponse
              </label>
              <div className="position-relative input-with-regenerate">
                <textarea
                  className="form-control form-control-sm form-control-w-side-button"
                  rows={2}
                  value={item.answer || ''}
                  onChange={(e) => updateNestedField('faq', index, 'answer', e.target.value)}
                  placeholder="Réponse"
                />
                <button
                  type="button"
                  className="btn position-absolute top-0 end-0 mt-2 me-2 p-1 regenerate-field-btn"
                  onClick={() => regenerateField(`faq[${index}][answer]`, item.answer || '')}
                  disabled={regeneratingField === `faq[${index}][answer]`}
                >
                  {regeneratingField === `faq[${index}][answer]` ? (
                    <i className="ri-loader-4-line regenerate-loading-icon spin-animation"></i>
                  ) : (
                    <i className="ri-sparkling-line regenerate-loading-icon"></i>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Divider */}
      <div className="horizontal-solid-divider border-top my-3"></div>

      {/* Image Selection */}
      <ImageSelector
        images={images}
        selectedImages={(content.faqImage ? [content.faqImage as string] : [])}
        sectionLabel="Image de Notre Produit"
        inputType="radio"
        onSelect={(selected) => updateField('faqImage', selected[0])}
        onEditImage={onEditImage}
        onGenerateAI={onGenerateImage}
      />
    </div>
  );
};

export default FAQSection;
