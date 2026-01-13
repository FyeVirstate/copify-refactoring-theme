"use client";

import React from "react";
import { RegenerateButton } from "./RegenerateButton";
import { TooltipProvider } from "@/components/ui/tooltip";

interface AIInputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'number';
  rows?: number;
  icon?: string;
  showRegenerateButton?: boolean;
  hint?: string;
}

export const AIInputField: React.FC<AIInputFieldProps> = ({
  label,
  value,
  onChange,
  onRegenerate,
  isRegenerating = false,
  placeholder,
  type = 'text',
  rows = 4,
  icon,
  showRegenerateButton = true,
  hint,
}) => {
  return (
    <TooltipProvider>
      <div className="mb-3">
        <label className="form-label text-dark fw-500 mb-1 fs-xs">
          {icon && <i className={`${icon} me-1 text-light-gray`}></i>}
          {label}
        </label>
        <div className="position-relative input-with-regenerate">
          {type === 'textarea' ? (
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={`form-control form-control-sm ${showRegenerateButton ? 'form-control-w-side-button' : ''} ${isRegenerating ? 'field-regenerating' : ''}`}
              placeholder={placeholder}
              rows={rows}
              disabled={isRegenerating}
            />
          ) : type === 'number' ? (
            <input
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="form-control form-control-sm"
              placeholder={placeholder}
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={`form-control form-control-sm ${showRegenerateButton ? 'form-control-w-side-button' : ''} ${isRegenerating ? 'field-regenerating' : ''}`}
              placeholder={placeholder}
              disabled={isRegenerating}
            />
          )}
          {showRegenerateButton && onRegenerate && type !== 'number' && (
            <RegenerateButton
              onClick={onRegenerate}
              disabled={isRegenerating}
              isRegenerating={isRegenerating}
              position={type === 'textarea' ? 'top' : 'middle'}
            />
          )}
        </div>
        {hint && <small className="text-muted">{hint}</small>}
      </div>
    </TooltipProvider>
  );
};

export default AIInputField;
