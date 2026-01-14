"use client";

import React from "react";
import { AIInputField } from "./AIInputField";
import { RegenerateButton } from "./RegenerateButton";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { SectionProps } from "./types";

/**
 * Featured Product Section (Product Information) - matches Laravel _product-info-section.blade.php
 * Maps to featured-product section in theme
 * Contains: Features, Reviews, Guarantee Badges, Images
 */
export const FeaturedProductSection: React.FC<SectionProps> = ({
  content,
  updateField,
  regenerateField,
  regeneratingField,
  successField,
  errorField,
}) => {
  // Récupérer les valeurs depuis le contenu existant
  const features = content.features || [];
  // Les avantages peuvent être dans advantages, benefits, ou productFeatures
  const advantages = (content as any).advantages || (content as any).benefits || [];
  const guarantees = content.guarantees || [];

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    updateField('features', newFeatures);
  };

  const updateAdvantage = (index: number, value: string) => {
    const newAdvantages = [...advantages];
    newAdvantages[index] = value;
    updateField('advantages', newAdvantages);
  };

  const updateGuarantee = (index: number, value: string) => {
    const newGuarantees = [...guarantees];
    newGuarantees[index] = value;
    updateField('guarantees', newGuarantees);
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
          <p className="mb-0 fs-lg fw-600">Informations sur le Produit</p>
          {/* No delete button - this section cannot be deleted/hidden */}
        </div>

        {/* Product Title */}
        <AIInputField
          label="Titre du produit"
          icon="ri-price-tag-line"
          value={content.title || ''}
          onChange={(val) => updateField('title', val)}
          onRegenerate={() => regenerateField('title', content.title || '')}
          isRegenerating={regeneratingField === 'title'}
          isSuccess={successField === 'title'}
          isError={errorField === 'title'}
          disabled={!!regeneratingField}
          placeholder="Product Title"
        />

        {/* Prix du vente du produit - ligne par ligne */}
        <div className="mb-3">
          <label className="form-label text-dark fw-500 mb-1 fs-xs">
            <i className="ri-price-tag-3-line me-1 text-light-gray"></i>
            Prix de vente du produit
          </label>
          <div className="position-relative">
            <input
              type="text"
              inputMode="decimal"
              className="form-control form-control-sm"
              value={content.price || ''}
              onChange={(e) => {
                const value = e.target.value.replace(',', '.');
                // Allow empty, numbers, and one decimal point
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  updateField('price', value === '' ? '' : value);
                }
              }}
              onBlur={(e) => {
                const value = parseFloat(e.target.value.replace(',', '.'));
                if (!isNaN(value)) {
                  updateField('price', value);
                }
              }}
              placeholder="69.90"
            />
          </div>
        </div>

        {/* Prix barré (ancien prix) - ligne par ligne */}
        <div className="mb-3">
          <label className="form-label text-dark fw-500 mb-1 fs-xs">
            <i className="ri-price-tag-2-line me-1 text-light-gray"></i>
            Prix barré (ancien prix)
          </label>
          <div className="position-relative">
            <input
              type="text"
              inputMode="decimal"
              className="form-control form-control-sm"
              value={content.compareAtPrice || content.compare_at_price || ''}
              onChange={(e) => {
                const value = e.target.value.replace(',', '.');
                // Allow empty, numbers, and one decimal point
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  updateField('compareAtPrice', value === '' ? '' : value);
                  updateField('compare_at_price', value === '' ? '' : value);
                }
              }}
              onBlur={(e) => {
                const value = parseFloat(e.target.value.replace(',', '.'));
                if (!isNaN(value)) {
                  updateField('compareAtPrice', value);
                  updateField('compare_at_price', value);
                }
              }}
              placeholder="174.90"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* Points de fonctionnalités (5) - ligne par ligne */}
        <div className="mb-4">
          <label className="form-label text-dark fw-500 mb-2 fs-xs">
            <i className="ri-checkbox-circle-line me-1 text-light-gray"></i>
            Points de fonctionnalités (5)
          </label>
          {[0, 1, 2, 3, 4].map((index) => {
            const fieldName = `features[${index}]`;
            return (
              <div key={index} className="mb-3">
                <label className="form-label text-dark fw-500 mb-1 fs-xs">Fonctionnalité {index + 1}</label>
                <div className="position-relative input-with-regenerate">
                  <input
                    type="text"
                    className={getFieldClassName(fieldName, true)}
                    value={features[index] || ''}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder={`Feature ${index + 1}`}
                    disabled={regeneratingField === fieldName}
                  />
                  <RegenerateButton
                    onClick={() => regenerateField(fieldName, features[index] || '')}
                    disabled={!!regeneratingField}
                    isRegenerating={regeneratingField === fieldName}
                    position="middle"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* Badges d'avantages (5) - ligne par ligne */}
        <div className="mb-4">
          <label className="form-label text-dark fw-500 mb-2 fs-xs">
            <i className="ri-checkbox-circle-line me-1 text-light-gray"></i>
            Badges d&apos;avantages (5)
          </label>
          {[0, 1, 2, 3, 4].map((index) => {
            const fieldName = `advantages[${index}]`;
            return (
              <div key={index} className="mb-3">
                <label className="form-label text-dark fw-500 mb-1 fs-xs">Avantage {index + 1}</label>
                <div className="position-relative input-with-regenerate">
                  <input
                    type="text"
                    className={getFieldClassName(fieldName, true)}
                    value={advantages[index] || ''}
                    onChange={(e) => updateAdvantage(index, e.target.value)}
                    placeholder={`Advantage ${index + 1}`}
                    disabled={regeneratingField === fieldName}
                  />
                  <RegenerateButton
                    onClick={() => regenerateField(fieldName, advantages[index] || '')}
                    disabled={!!regeneratingField}
                    isRegenerating={regeneratingField === fieldName}
                    isError={errorField === fieldName}
                    position="middle"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* Informations de notation - ligne par ligne */}
        <div className="mb-3">
          <label className="form-label text-dark fw-500 mb-1 fs-xs">
            <i className="ri-star-line me-1 text-light-gray"></i>
            Note des Avis
          </label>
          <div className="position-relative">
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              className="form-control form-control-sm"
              value={content.reviewRating || '4.8'}
              onChange={(e) => updateField('reviewRating', e.target.value)}
              placeholder="4.8"
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label text-dark fw-500 mb-1 fs-xs">
            <i className="ri-group-line me-1 text-light-gray"></i>
            Nombre d&apos;Avis
          </label>
          <div className="position-relative">
            <input
              type="number"
              min="0"
              className="form-control form-control-sm"
              value={content.reviewCount?.toString().replace(/,/g, '') || '3247'}
              onChange={(e) => {
                const value = e.target.value.replace(/,/g, '');
                updateField('reviewCount', value);
              }}
              placeholder="3247"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* Badges de Garantie (3) - ligne par ligne */}
        <div className="mb-3">
          <label className="form-label text-dark fw-500 mb-2 fs-xs">
            <i className="ri-shield-check-line me-1 text-light-gray"></i>
            Badges de Garantie (3)
          </label>
          {[0, 1, 2].map((index) => {
            const fieldName = `guarantees[${index}]`;
            return (
              <div key={index} className="mb-3">
                <label className="form-label text-dark fw-500 mb-1 fs-xs">Garantie {index + 1}</label>
                <div className="position-relative input-with-regenerate">
                  <input
                    type="text"
                    className={getFieldClassName(fieldName, true)}
                    value={guarantees[index] || ''}
                    onChange={(e) => updateGuarantee(index, e.target.value)}
                    placeholder={`Garantie ${index + 1}`}
                    disabled={regeneratingField === fieldName}
                  />
                  <RegenerateButton
                    onClick={() => regenerateField(fieldName, guarantees[index] || '')}
                    disabled={!!regeneratingField}
                    isRegenerating={regeneratingField === fieldName}
                    isError={errorField === fieldName}
                    position="middle"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* Fonctionnalité d'en-tête */}
        <AIInputField
          label="Fonctionnalité d&apos;en-tête"
          icon="ri-text"
          value={(content as any).featureHeader || content.featureHeader || ''}
          onChange={(val) => updateField('featureHeader', val)}
          onRegenerate={() => regenerateField('featureHeader', (content as any).featureHeader || '')}
          isRegenerating={regeneratingField === 'featureHeader'}
          isSuccess={successField === 'featureHeader'}
          isError={errorField === 'featureHeader'}
          disabled={!!regeneratingField}
          placeholder="Performance lenses built for men who live on screens but..."
        />

        {/* Divider */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* Product Description */}
        <AIInputField
          label="Description du produit"
          icon="ri-file-text-line"
          type="textarea"
          rows={4}
          value={content.description || ''}
          onChange={(val) => updateField('description', val)}
          onRegenerate={() => regenerateField('description', content.description || '')}
          isRegenerating={regeneratingField === 'description'}
          isSuccess={successField === 'description'}
          isError={errorField === 'description'}
          disabled={!!regeneratingField}
          placeholder="Describe your product..."
        />

        {/* Divider */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* Informations de livraison */}
        <AIInputField
          label="Informations de livraison"
          icon="ri-truck-line"
          type="textarea"
          rows={3}
          value={content.deliveryInformation || ''}
          onChange={(val) => updateField('deliveryInformation', val)}
          onRegenerate={() => regenerateField('deliveryInformation', content.deliveryInformation || '')}
          isRegenerating={regeneratingField === 'deliveryInformation'}
          isSuccess={successField === 'deliveryInformation'}
          isError={errorField === 'deliveryInformation'}
          disabled={!!regeneratingField}
          placeholder="Fast, reliable shipping to your door..."
        />

        {/* Divider */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* Comment ça marche */}
        <AIInputField
          label="Comment ça marche"
          icon="ri-lightbulb-line"
          type="textarea"
          rows={3}
          value={content.howItWorks || ''}
          onChange={(val) => updateField('howItWorks', val)}
          onRegenerate={() => regenerateField('howItWorks', content.howItWorks || '')}
          isRegenerating={regeneratingField === 'howItWorks'}
          isSuccess={successField === 'howItWorks'}
          isError={errorField === 'howItWorks'}
          disabled={!!regeneratingField}
          placeholder="Orange lenses block 85% of blue light..."
        />

        {/* Divider */}
        <div className="horizontal-solid-divider border-top my-3"></div>

        {/* Instructions */}
        <AIInputField
          label="Instructions"
          icon="ri-file-list-3-line"
          type="textarea"
          rows={3}
          value={content.instructions || ''}
          onChange={(val) => updateField('instructions', val)}
          onRegenerate={() => regenerateField('instructions', content.instructions || '')}
          isRegenerating={regeneratingField === 'instructions'}
          isSuccess={successField === 'instructions'}
          isError={errorField === 'instructions'}
          disabled={!!regeneratingField}
          placeholder="Wear orange lenses during screen time..."
        />
      </div>
    </TooltipProvider>
  );
};

export default FeaturedProductSection;
