"use client";

import React, { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RegenerateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isRegenerating?: boolean;
  position?: 'top' | 'middle';
  className?: string;
}

export const RegenerateButton: React.FC<RegenerateButtonProps> = ({
  onClick,
  disabled = false,
  isRegenerating = false,
  position = 'middle',
  className = '',
}) => {
  const [justRegenerated, setJustRegenerated] = useState(false);
  const prevIsRegeneratingRef = React.useRef(isRegenerating);

  // Détecter quand la régénération vient de se terminer
  useEffect(() => {
    // Si on passe de "en cours" à "terminé"
    if (prevIsRegeneratingRef.current === true && isRegenerating === false) {
      // La régénération vient de se terminer
      setJustRegenerated(true);
      const timer = setTimeout(() => {
        setJustRegenerated(false);
      }, 3000); // Afficher le message de succès pendant 3 secondes
      return () => clearTimeout(timer);
    }
    // Mettre à jour la référence
    prevIsRegeneratingRef.current = isRegenerating;
  }, [isRegenerating]);

  const tooltipText = justRegenerated ? "Régénération effectuée" : "Régénérer avec IA";
  const tooltipClassName = justRegenerated 
    ? "z-[99999] !bg-[#10b981] !text-white !text-xs !px-2 !py-1 !rounded !shadow-lg !border-none"
    : "z-[99999] !bg-[#333] !text-white !text-xs !px-2 !py-1 !rounded !shadow-lg !border-none";

  // Ajouter une classe au conteneur parent quand la régénération vient de se terminer
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (buttonRef.current) {
      const container = buttonRef.current.closest('.input-with-regenerate, .position-relative');
      if (container) {
        if (justRegenerated) {
          container.classList.add('just-regenerated');
        } else {
          container.classList.remove('just-regenerated');
        }
      }
    }
  }, [justRegenerated]);

  return (
    <Tooltip open={justRegenerated ? true : undefined}>
      <TooltipTrigger asChild>
        <button
          ref={buttonRef}
          type="button"
          className={`btn position-absolute ${position === 'top' ? 'top-0 mt-2' : 'top-50 translate-middle-y'} end-0 me-2 p-1 regenerate-field-btn ${className}`}
          onClick={onClick}
          disabled={disabled || isRegenerating}
        >
          {isRegenerating ? (
            <i className="ri-loader-4-line regenerate-loading-icon spin-animation"></i>
          ) : (
            <i className="ri-sparkling-line regenerate-loading-icon"></i>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className={tooltipClassName}
        sideOffset={4}
      >
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
};
