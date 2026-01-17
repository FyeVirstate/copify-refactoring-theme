"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { RegenerateButton } from "./RegenerateButton";
import { ImageSelector } from "./ImageSelector";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { SectionProps } from "./types";

/**
 * Image With Text Section (Hero Home) - matches image-with-text.liquid
 * Used for Homepage Hero (top section)
 * Fields:
 * - heading (image-with-text__heading)
 * - text (paragraph)
 * - buttonText (button label)
 * - 5 benefit tags (custom_tags_cs)
 * - 3 guarantee texts (icon_text_cls_guarantee)
 * - image
 */
export const ImageWithTextSection: React.FC<SectionProps> = ({
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
  const imageWithText = content.imageWithText || {
    header: '',
    text: '',
    buttonText: '',
    tag1: '',
    tag2: '',
    tag3: '',
    tag4: '',
    tag5: '',
    guarantee1: '',
    guarantee2: '',
    guarantee3: '',
  };

  const updateImageWithText = (field: string, value: string) => {
    updateField('imageWithText', { ...imageWithText, [field]: value });
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
          <p className="mb-0 fs-lg fw-600">Héro</p>
          <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
            <Trash2 size={16} />
          </button>
        </div>

        {/* Title/Heading */}
        <div className="mb-3">
          <label className="form-label text-dark fw-500 mb-1 fs-xs">
            <i className="ri-text me-1 text-light-gray"></i>
            Titre de la section
          </label>
          <div className="position-relative input-with-regenerate">
            <input
              type="text"
              className={getFieldClassName('imageWithText.header', true)}
              value={imageWithText.header || ''}
              onChange={(e) => updateImageWithText('header', e.target.value)}
              placeholder="Designed for Real Moms Living Real Lives"
              maxLength={100}
              disabled={regeneratingField === 'imageWithText.header'}
            />
            <RegenerateButton
              onClick={() => regenerateField('imageWithText.header', imageWithText.header || '')}
              disabled={!!regeneratingField}
              isRegenerating={regeneratingField === 'imageWithText.header'}
              position="middle"
            />
          </div>
        </div>

        {/* Text Content */}
        <div className="mb-3">
          <label className="form-label text-dark fw-500 mb-1 fs-xs">
            <i className="ri-file-text-line me-1 text-light-gray"></i>
            Contenu du texte
          </label>
          <div className="position-relative input-with-regenerate">
            <textarea
              className={getFieldClassName('imageWithText.text', true)}
              rows={3}
              value={imageWithText.text || ''}
              onChange={(e) => updateImageWithText('text', e.target.value)}
              placeholder="Work, cook, play with your toddler, or simply relax while pumping..."
              maxLength={500}
              disabled={regeneratingField === 'imageWithText.text'}
            />
            <RegenerateButton
              onClick={() => regenerateField('imageWithText.text', imageWithText.text || '')}
              disabled={!!regeneratingField}
              isRegenerating={regeneratingField === 'imageWithText.text'}
              isError={errorField === 'imageWithText.text'}
              position="top"
            />
          </div>
        </div>

        {/* Button Text */}
        <div className="mb-3">
          <label className="form-label text-dark fw-500 mb-1 fs-xs">
            <i className="ri-cursor-line me-1 text-light-gray"></i>
            Texte du Bouton
          </label>
          <div className="position-relative input-with-regenerate">
            <input
              type="text"
              className={getFieldClassName('imageWithText.buttonText', true)}
              value={imageWithText.buttonText || 'Shop All Products'}
              onChange={(e) => updateImageWithText('buttonText', e.target.value)}
              placeholder="Shop All Products"
              disabled={regeneratingField === 'imageWithText.buttonText'}
            />
            <RegenerateButton
              onClick={() => regenerateField('imageWithText.buttonText', imageWithText.buttonText || '')}
              disabled={!!regeneratingField}
              isRegenerating={regeneratingField === 'imageWithText.buttonText'}
              isError={errorField === 'imageWithText.buttonText'}
              position="middle"
            />
          </div>
        </div>

        {/* Divider - Benefit Tags */}
        <div className="horizontal-solid-divider border-top my-3"></div>
        <p className="mb-2 fs-small fw-500 text-primary">Tags de bénéfices (badges)</p>

        {/* Benefit Tags 1-5 */}
        <div className="row g-2 mb-3">
          <div className="col-6">
            <input
              type="text"
              className="form-control form-control-sm"
              value={imageWithText.tag1 || ''}
              onChange={(e) => updateImageWithText('tag1', e.target.value)}
              placeholder="Tag 1 (ex: Hands-free design)"
              maxLength={50}
            />
          </div>
          <div className="col-6">
            <input
              type="text"
              className="form-control form-control-sm"
              value={imageWithText.tag2 || ''}
              onChange={(e) => updateImageWithText('tag2', e.target.value)}
              placeholder="Tag 2 (ex: USB rechargeable)"
              maxLength={50}
            />
          </div>
          <div className="col-6">
            <input
              type="text"
              className="form-control form-control-sm"
              value={imageWithText.tag3 || ''}
              onChange={(e) => updateImageWithText('tag3', e.target.value)}
              placeholder="Tag 3 (ex: Whisper-quiet)"
              maxLength={50}
            />
          </div>
          <div className="col-6">
            <input
              type="text"
              className="form-control form-control-sm"
              value={imageWithText.tag4 || ''}
              onChange={(e) => updateImageWithText('tag4', e.target.value)}
              placeholder="Tag 4 (ex: Adjustable levels)"
              maxLength={50}
            />
          </div>
          <div className="col-12">
            <input
              type="text"
              className="form-control form-control-sm"
              value={imageWithText.tag5 || ''}
              onChange={(e) => updateImageWithText('tag5', e.target.value)}
              placeholder="Tag 5 (ex: Fits all sizes)"
              maxLength={50}
            />
          </div>
        </div>

        {/* Divider - Guarantee Icons */}
        <div className="horizontal-solid-divider border-top my-3"></div>
        <p className="mb-2 fs-small fw-500 text-primary">Garanties (icônes sous le bouton)</p>

        {/* Guarantee Texts 1-3 */}
        <div className="mb-3">
          <div className="mb-2">
            <label className="form-label text-dark fw-500 mb-1 fs-xs">
              <i className="ri-shield-check-line me-1 text-light-gray"></i>
              Garantie 1
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={imageWithText.guarantee1 || ''}
              onChange={(e) => updateImageWithText('guarantee1', e.target.value)}
              placeholder="30-Night Risk-Free"
              maxLength={50}
            />
          </div>
          <div className="mb-2">
            <label className="form-label text-dark fw-500 mb-1 fs-xs">
              <i className="ri-truck-line me-1 text-light-gray"></i>
              Garantie 2
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={imageWithText.guarantee2 || ''}
              onChange={(e) => updateImageWithText('guarantee2', e.target.value)}
              placeholder="Free Shipping"
              maxLength={50}
            />
          </div>
          <div className="mb-2">
            <label className="form-label text-dark fw-500 mb-1 fs-xs">
              <i className="ri-refresh-line me-1 text-light-gray"></i>
              Garantie 3
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={imageWithText.guarantee3 || ''}
              onChange={(e) => updateImageWithText('guarantee3', e.target.value)}
              placeholder="Hassle-Free Returns"
              maxLength={50}
            />
          </div>
        </div>

        {/* Divider - Image */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* Image Selection */}
        <ImageSelector
          images={images}
          selectedImages={(content.imageWithTextImage ? [content.imageWithTextImage as string] : [])}
          sectionLabel="Image de la section"
          inputType="radio"
          onSelect={(selected) => updateField('imageWithTextImage', selected[0])}
          onEditImage={onEditImage}
          onGenerateAI={onGenerateImage}
        />
      </div>
    </TooltipProvider>
  );
};

export default ImageWithTextSection;
