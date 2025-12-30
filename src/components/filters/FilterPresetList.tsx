"use client";

import { ReactNode, useState } from "react";
import { useFilterDropdown } from "./FilterDropdown";

interface PresetItem {
  id: string;
  icon?: string;
  iconElement?: ReactNode;
  title: string;
  description?: string;
  onClick?: () => void;
}

interface FilterPresetListProps {
  title?: string;
  presets: PresetItem[];
  closeOnSelect?: boolean; // Auto-close dropdown when preset is selected
}

export default function FilterPresetList({ 
  title = "Préréglages", 
  presets,
  closeOnSelect = true
}: FilterPresetListProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const filterDropdown = useFilterDropdown();

  const handlePresetClick = (presetId: string, onClick?: () => void) => {
    setActivePreset(presetId);
    onClick?.();
    // Auto-close dropdown when preset is selected
    if (closeOnSelect) {
      filterDropdown?.closeDropdown();
    }
  };

  return (
    <div className="mb-3">
      <p className="fs-small text-sub mb-3 fw-500">{title}</p>
      <div className="d-flex flex-column gap-2 mb-3">
        {presets.map((preset) => {
          const isActive = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              className="preset-card w-100 text-start"
              onClick={() => handlePresetClick(preset.id, preset.onClick)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                border: isActive ? '2px solid #0E121B' : '1px solid #E1E4EA',
                borderRadius: '8px',
                backgroundColor: isActive ? '#0E121B' : 'white',
                color: isActive ? 'white' : '#525866',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#F5F7FA';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              {preset.iconElement ? (
                <div style={{ fontSize: '18px', lineHeight: '1', flexShrink: 0 }}>
                  {preset.iconElement}
                </div>
              ) : preset.icon ? (
                <i 
                  className={preset.icon} 
                  style={{ 
                    fontSize: '18px', 
                    color: isActive ? 'white' : '#99A0AE',
                    flexShrink: 0
                  }}
                ></i>
              ) : null}
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: '500', 
                  color: isActive ? 'white' : '#0E121B',
                  marginBottom: preset.description ? '2px' : '0',
                  lineHeight: '1.2'
                }}>
                  {preset.title}
                </div>
                {preset.description && (
                  <div style={{ 
                    fontSize: '11px', 
                    fontWeight: '400',
                    color: isActive ? 'rgba(255, 255, 255, 0.7)' : '#99A0AE',
                    lineHeight: '1.3'
                  }}>
                    {preset.description}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

