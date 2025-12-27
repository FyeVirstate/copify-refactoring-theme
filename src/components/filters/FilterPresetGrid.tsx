"use client";

import { ReactNode, CSSProperties } from "react";

interface PresetItem {
  id: string;
  icon?: string;
  iconElement?: ReactNode;
  iconStyle?: CSSProperties;
  title: string;
  description?: string;
  onClick?: () => void;
}

interface FilterPresetGridProps {
  title?: string;
  presets: PresetItem[];
  columns?: 2 | 3 | 4;
  onPresetClick?: (presetId: string) => void;
  activePreset?: string | null;
  showTitle?: boolean;
}

export default function FilterPresetGrid({ 
  title = "Préréglages", 
  presets,
  columns = 2,
  onPresetClick,
  activePreset,
  showTitle = false
}: FilterPresetGridProps) {

  const handlePresetClick = (presetId: string, onClick?: () => void) => {
    onPresetClick?.(presetId);
    onClick?.();
  };

  return (
    <div className="mb-3">
      {showTitle && <p className="fs-small text-sub mb-3 fw-500">{title}</p>}
      <div 
        className="mb-3"
        style={{
          display: 'grid',
          gridTemplateColumns: columns === 2 ? 'repeat(2, 1fr)' : columns === 3 ? 'repeat(3, 1fr)' : columns === 4 ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
          gap: '8px'
        }}
      >
        {presets.map((preset) => {
          const isActive = activePreset === preset.id;
          return (
            <div key={preset.id}>
              <button
                type="button"
                className="preset-card w-100 text-start"
                onClick={() => handlePresetClick(preset.id, preset.onClick)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  border: isActive ? '2px solid #0E121B' : '1px solid #E1E4EA',
                  borderRadius: '8px',
                  backgroundColor: isActive ? '#0E121B' : 'white',
                  color: isActive ? 'white' : '#525866',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minHeight: '52px',
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
                  <div style={{ fontSize: '20px', lineHeight: '1', flexShrink: 0 }}>
                    {preset.iconElement}
                  </div>
                ) : preset.icon ? (
                  <i 
                    className={preset.icon} 
                    style={{ 
                      fontSize: '18px', 
                      color: isActive ? 'white' : '#99A0AE',
                      flexShrink: 0,
                      ...preset.iconStyle
                    }}
                  ></i>
                ) : null}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: '12.5px', 
                    fontWeight: '500', 
                    marginBottom: preset.description ? '2px' : '0',
                    color: isActive ? 'white' : '#0E121B',
                    lineHeight: '1.2'
                  }}>
                    {preset.title}
                  </div>
                  {preset.description && (
                    <div style={{ 
                      fontSize: '10.5px', 
                      fontWeight: '400',
                      color: isActive ? 'rgba(255, 255, 255, 0.7)' : '#99A0AE',
                      lineHeight: '1.2'
                    }}>
                      {preset.description}
                    </div>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
