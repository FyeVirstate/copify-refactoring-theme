"use client";

import React from "react";
import { Trash2 } from "lucide-react";
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
}) => {
  return (
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
            className="form-control form-control-sm form-control-w-side-button"
            value={(content as any).specialOffer || ''}
            onChange={(e) => updateField('specialOffer', e.target.value)}
            placeholder="🎉 Livraison gratuite sur les commandes de plus de 50€ !"
          />
          <button
            type="button"
            className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-1 regenerate-field-btn"
            onClick={() => regenerateField('specialOffer', (content as any).specialOffer || '')}
            disabled={regeneratingField === 'specialOffer'}
          >
            {regeneratingField === 'specialOffer' ? (
              <i className="ri-loader-4-line regenerate-loading-icon spin-animation"></i>
            ) : (
              <i className="ri-sparkling-line regenerate-loading-icon"></i>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBarSection;
