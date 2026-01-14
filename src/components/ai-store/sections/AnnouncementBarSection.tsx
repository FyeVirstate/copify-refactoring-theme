"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { RegenerateButton } from "./RegenerateButton";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { SectionProps } from "./types";

/**
 * Announcement Bar Section - matches Laravel _announcement-bar-section.blade.php
 * Maps to announcement-bar section in theme
 */
export const AnnouncementBarSection: React.FC<SectionProps> = ({
  content,
  updateField,
  regenerateField,
  regeneratingField,
  successField,
  errorField,
}) => {
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
          <p className="mb-0 fs-lg fw-600">Barre d&apos;Annonce</p>
          <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
            <Trash2 size={16} />
          </button>
        </div>

        {/* Description */}
        <p className="text-muted fs-xs mb-3">
          Affichez une offre spéciale ou un message important en haut de votre boutique.
        </p>

        {/* Announcement Text */}
        <div className="mb-3">
          <label className="form-label text-dark fw-500 mb-1 fs-xs">
            <i className="ri-notification-2-line me-1 text-light-gray"></i>
            Texte de l&apos;annonce
          </label>
          <div className="position-relative input-with-regenerate">
            <input
              type="text"
              className={getFieldClassName('specialOffer', true)}
              value={(content as any).specialOffer || ''}
              onChange={(e) => updateField('specialOffer', e.target.value)}
              placeholder="🎉 Livraison gratuite sur les commandes de plus de 50€ !"
              disabled={regeneratingField === 'specialOffer'}
            />
            <RegenerateButton
              onClick={() => regenerateField('specialOffer', (content as any).specialOffer || '')}
              disabled={!!regeneratingField}
              isRegenerating={regeneratingField === 'specialOffer'}
              isError={errorField === 'specialOffer'}
              position="middle"
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AnnouncementBarSection;
