"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { AIInputField } from "./AIInputField";
import { RegenerateButton } from "./RegenerateButton";
import { ImageSelector } from "./ImageSelector";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  successField,
  errorField,
  images = [],
  onEditImage,
  onGenerateImage,
}) => {
  const faqItems = content.faq || [];

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
          <p className="mb-0 fs-lg fw-600">FAQs</p>
          <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
            <Trash2 size={16} />
          </button>
        </div>

        {/* Section Heading */}
        <AIInputField
          label="Titre de la Section"
          icon="ri-text"
          value={(content as any).faqHeading || 'Questions Fréquemment Posées'}
          onChange={(val) => updateField('faqHeading', val)}
          onRegenerate={() => regenerateField('faqHeading', (content as any).faqHeading || '')}
          isRegenerating={regeneratingField === 'faqHeading'}
          isSuccess={successField === 'faqHeading'}
          isError={errorField === 'faqHeading'}
          disabled={!!regeneratingField}
          placeholder="Questions Fréquemment Posées"
        />

        {/* Divider */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* FAQ Items - 5 items like Laravel */}
        <p className="mb-2 fs-small fw-500 text-muted">Éléments FAQ</p>
        {[0, 1, 2, 3, 4].map((index) => {
          const item = faqItems[index] || { question: '', answer: '' };
          const questionField = `faq[${index}][question]`;
          const answerField = `faq[${index}][answer]`;
          
          return (
            <div key={index} className="mb-4">
              {/* Question */}
              <div className="mb-3">
                <label className="form-label text-dark fw-500 mb-1 fs-small">
                  <i className="ri-questionnaire-line me-1 text-light-gray"></i>
                  Question {index + 1}
                </label>
                <div className="position-relative input-with-regenerate">
                  <input
                    type="text"
                    className={getFieldClassName(questionField, true)}
                    value={item.question || ''}
                    onChange={(e) => updateNestedField('faq', index, 'question', e.target.value)}
                    placeholder="Question"
                    disabled={regeneratingField === questionField}
                  />
                  <RegenerateButton
                    onClick={() => regenerateField(questionField, item.question || '')}
                    disabled={!!regeneratingField}
                    isRegenerating={regeneratingField === questionField}
                    isError={errorField === questionField}
                    position="middle"
                  />
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
                    className={getFieldClassName(answerField, true)}
                    rows={2}
                    value={item.answer || ''}
                    onChange={(e) => updateNestedField('faq', index, 'answer', e.target.value)}
                    placeholder="Réponse"
                    disabled={regeneratingField === answerField}
                  />
                  <RegenerateButton
                    onClick={() => regenerateField(answerField, item.answer || '')}
                    disabled={!!regeneratingField}
                    isRegenerating={regeneratingField === answerField}
                    isError={errorField === answerField}
                    position="top"
                  />
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
    </TooltipProvider>
  );
};

export default FAQSection;
