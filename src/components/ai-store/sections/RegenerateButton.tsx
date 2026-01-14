"use client";

import React, { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RegenerateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isRegenerating?: boolean;
  isError?: boolean;  // New: show error state
  position?: 'top' | 'middle';
  className?: string;
}

export const RegenerateButton: React.FC<RegenerateButtonProps> = ({
  onClick,
  disabled = false,
  isRegenerating = false,
  isError = false,
  position = 'middle',
  className = '',
}) => {
  const [justRegenerated, setJustRegenerated] = useState(false);
  const [showError, setShowError] = useState(false);
  const prevIsRegeneratingRef = React.useRef(isRegenerating);
  const prevIsErrorRef = React.useRef(isError);

  // Detect when regeneration just finished (success)
  useEffect(() => {
    if (prevIsRegeneratingRef.current === true && isRegenerating === false && !isError) {
      setJustRegenerated(true);
      const timer = setTimeout(() => {
        setJustRegenerated(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    prevIsRegeneratingRef.current = isRegenerating;
  }, [isRegenerating, isError]);

  // Detect error state
  useEffect(() => {
    if (isError && !prevIsErrorRef.current) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    prevIsErrorRef.current = isError;
  }, [isError]);

  // Determine tooltip text and style
  let tooltipText = "Régénérer avec IA";
  let tooltipClassName = "z-[99999] !bg-[#333] !text-white !text-xs !px-2 !py-1 !rounded !shadow-lg !border-none";
  
  if (showError) {
    tooltipText = "Échec de la régénération";
    tooltipClassName = "z-[99999] !bg-[#ef4444] !text-white !text-xs !px-2 !py-1 !rounded !shadow-lg !border-none";
  } else if (justRegenerated) {
    tooltipText = "Régénération effectuée";
    tooltipClassName = "z-[99999] !bg-[#10b981] !text-white !text-xs !px-2 !py-1 !rounded !shadow-lg !border-none";
  }

  // Add class to parent container for visual feedback
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (buttonRef.current) {
      const container = buttonRef.current.closest('.input-with-regenerate, .position-relative');
      if (container) {
        if (justRegenerated) {
          container.classList.add('just-regenerated');
          container.classList.remove('just-errored');
        } else if (showError) {
          container.classList.add('just-errored');
          container.classList.remove('just-regenerated');
        } else {
          container.classList.remove('just-regenerated');
          container.classList.remove('just-errored');
        }
      }
    }
  }, [justRegenerated, showError]);

  // Build button class - add is-regenerating when THIS button is actively regenerating
  const buttonClass = `btn position-absolute ${position === 'top' ? 'top-0 mt-2' : 'top-50 translate-middle-y'} end-0 me-2 p-1 regenerate-field-btn ${isRegenerating ? 'is-regenerating' : ''} ${justRegenerated ? 'just-regenerated-btn' : ''} ${showError ? 'has-error-btn' : ''} ${className}`;

  return (
    <Tooltip open={justRegenerated || showError ? true : undefined}>
      <TooltipTrigger asChild>
        <button
          ref={buttonRef}
          type="button"
          className={buttonClass}
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
