"use client";

interface PresetButtonProps {
  icon?: string;
  iconElement?: React.ReactNode;
  title: string;
  description?: string;
  onClick?: () => void;
  active?: boolean;
}

export default function PresetButton({ 
  icon, 
  iconElement,
  title, 
  description, 
  onClick,
  active = false 
}: PresetButtonProps) {
  return (
    <button
      type="button"
      className={`preset-button ${active ? 'active' : ''}`}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        border: active ? '2px solid #0E121B' : '1px solid #E1E4EA',
        borderRadius: '12px',
        backgroundColor: active ? '#0E121B' : 'white',
        color: active ? 'white' : '#525866',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = '#0E121B';
          e.currentTarget.style.backgroundColor = '#F5F7FA';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = '#E1E4EA';
          e.currentTarget.style.backgroundColor = 'white';
        }
      }}
    >
      {iconElement ? (
        <div style={{ fontSize: '24px', lineHeight: '1', flexShrink: 0 }}>
          {iconElement}
        </div>
      ) : icon ? (
        <i className={icon} style={{ fontSize: '24px', color: active ? 'white' : '#99A0AE' }}></i>
      ) : null}
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: '500', 
          marginBottom: description ? '4px' : '0',
          color: active ? 'white' : '#0E121B'
        }}>
          {title}
        </div>
        {description && (
          <div style={{ 
            fontSize: '13px', 
            fontWeight: '400',
            color: active ? 'rgba(255, 255, 255, 0.7)' : '#99A0AE'
          }}>
            {description}
          </div>
        )}
      </div>
    </button>
  );
}

