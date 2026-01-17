"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { RegenerateButton } from "./RegenerateButton";
import { ImageSelector } from "./ImageSelector";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { SectionProps } from "./types";

/**
 * Image with FAQ Section - matches theme_v4 image-faq.liquid
 * Maps to image-faq section in theme
 * Contains: heading, paragraph, image/video, collapsible FAQ items
 */
export const ImageFaqSection: React.FC<SectionProps> = ({
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
  // Get imageFaq data from content
  const imageFaq = (content as any).imageFaq || {
    heading: '',
    paragraph: '',
    faqItems: [],
  };

  const faqItems = imageFaq.faqItems || [];

  const updateImageFaq = (field: string, value: unknown) => {
    updateField('imageFaq', { ...imageFaq, [field]: value });
  };

  const updateFaqItem = (index: number, field: 'question' | 'content', value: string) => {
    const newFaqItems = [...faqItems];
    if (!newFaqItems[index]) newFaqItems[index] = { question: '', content: '' };
    newFaqItems[index][field] = value;
    updateImageFaq('faqItems', newFaqItems);
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
          <p className="mb-0 fs-lg fw-600">Image avec FAQ</p>
          <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
            <Trash2 size={16} />
          </button>
        </div>

        {/* Description */}
        <p className="text-muted fs-xs mb-3">
          Section avec image et FAQ collapsibles pour mettre en avant vos différences.
        </p>

        {/* Heading */}
        <div className="mb-3">
          <label className="form-label text-dark fw-500 mb-1 fs-xs">
            <i className="ri-text me-1 text-light-gray"></i>
            Titre de la section
          </label>
          <div className="position-relative input-with-regenerate">
            <input
              type="text"
              className={getFieldClassName('imageFaq.heading', true)}
              value={imageFaq.heading || ''}
              onChange={(e) => updateImageFaq('heading', e.target.value)}
              placeholder="Ce qui nous rend différents"
              disabled={regeneratingField === 'imageFaq.heading'}
            />
            <RegenerateButton
              onClick={() => regenerateField('imageFaq.heading', imageFaq.heading || '')}
              disabled={!!regeneratingField}
              isRegenerating={regeneratingField === 'imageFaq.heading'}
              position="middle"
            />
          </div>
          <small className="text-muted fs-xs mt-1 d-block">
            Utilisez &lt;span&gt;texte&lt;/span&gt; pour mettre en couleur une partie du titre
          </small>
        </div>

        {/* Paragraph */}
        <div className="mb-3">
          <label className="form-label text-dark fw-500 mb-1 fs-xs">
            <i className="ri-file-text-line me-1 text-light-gray"></i>
            Paragraphe
          </label>
          <div className="position-relative input-with-regenerate">
            <textarea
              className={getFieldClassName('imageFaq.paragraph', true)}
              rows={2}
              value={imageFaq.paragraph || ''}
              onChange={(e) => updateImageFaq('paragraph', e.target.value)}
              placeholder="Semelle épaisse et rembourrée + conception respirante = confort tout au long de la journée sans compromis."
              disabled={regeneratingField === 'imageFaq.paragraph'}
            />
            <RegenerateButton
              onClick={() => regenerateField('imageFaq.paragraph', imageFaq.paragraph || '')}
              disabled={!!regeneratingField}
              isRegenerating={regeneratingField === 'imageFaq.paragraph'}
              isError={errorField === 'imageFaq.paragraph'}
              position="top"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* FAQ Items - 4 collapsible items */}
        <div className="mb-4">
          <label className="form-label text-dark fw-500 mb-2 fs-xs">
            <i className="ri-question-answer-line me-1 text-light-gray"></i>
            FAQ Collapsibles (4 max)
          </label>
          {[0, 1, 2, 3].map((index) => {
            const faqItem = faqItems[index] || { question: '', content: '' };
            const questionFieldName = `imageFaq.faqItems[${index}].question`;
            const contentFieldName = `imageFaq.faqItems[${index}].content`;
            
            return (
              <div key={index} className="mb-3">
                <details className="feature-accordion" open={index === 0}>
                  <summary className="form-label text-dark fw-500 mb-1 fs-xs cursor-pointer">
                    <i className="ri-arrow-right-s-line me-1"></i>
                    FAQ {index + 1}
                  </summary>
                  <div className="ps-3 pt-2">
                    {/* Question */}
                    <div className="mb-2">
                      <label className="form-label text-muted mb-1 fs-xs">Question</label>
                      <div className="position-relative input-with-regenerate">
                        <input
                          type="text"
                          className={getFieldClassName(questionFieldName, true)}
                          value={faqItem.question || ''}
                          onChange={(e) => updateFaqItem(index, 'question', e.target.value)}
                          placeholder={`Question ${index + 1}`}
                          disabled={regeneratingField === questionFieldName}
                        />
                        <RegenerateButton
                          onClick={() => regenerateField(questionFieldName, faqItem.question || '')}
                          disabled={!!regeneratingField}
                          isRegenerating={regeneratingField === questionFieldName}
                          isError={errorField === questionFieldName}
                          position="middle"
                        />
                      </div>
                    </div>
                    {/* Content/Answer */}
                    <div>
                      <label className="form-label text-muted mb-1 fs-xs">Réponse</label>
                      <div className="position-relative input-with-regenerate">
                        <textarea
                          className={getFieldClassName(contentFieldName, true)}
                          rows={2}
                          value={faqItem.content || ''}
                          onChange={(e) => updateFaqItem(index, 'content', e.target.value)}
                          placeholder={`Réponse ${index + 1}`}
                          disabled={regeneratingField === contentFieldName}
                        />
                        <RegenerateButton
                          onClick={() => regenerateField(contentFieldName, faqItem.content || '')}
                          disabled={!!regeneratingField}
                          isRegenerating={regeneratingField === contentFieldName}
                          isError={errorField === contentFieldName}
                          position="top"
                        />
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* Image Selection */}
        <ImageSelector
          images={images}
          selectedImages={(content as any).imageFaqImage ? [(content as any).imageFaqImage as string] : []}
          sectionLabel="Image de la section"
          inputType="radio"
          onSelect={(selected) => updateField('imageFaqImage', selected[0])}
          onEditImage={onEditImage}
          onGenerateAI={onGenerateImage}
        />
      </div>
    </TooltipProvider>
  );
};

export default ImageFaqSection;
