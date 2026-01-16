"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CheckboxItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface FilterCheckboxListProps {
  items: CheckboxItem[];
  selectedItems: string[];
  onItemsChange: (items: string[]) => void;
  searchPlaceholder?: string;
  showToggleButtons?: boolean;
  showIncludeExclude?: boolean;
  maxHeight?: string;
  groupName?: string;
}

export default function FilterCheckboxList({
  items,
  selectedItems,
  onItemsChange,
  searchPlaceholder = "Rechercher...",
  showToggleButtons = true,
  showIncludeExclude = false,
  maxHeight = "200px",
  groupName,
}: FilterCheckboxListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    onItemsChange(items.map(item => item.id));
  };

  const handleDeselectAll = () => {
    onItemsChange([]);
  };

  const handleToggle = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      onItemsChange(selectedItems.filter(id => id !== itemId));
    } else {
      onItemsChange([...selectedItems, itemId]);
    }
  };

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <div className="position-relative flex-grow-1">
          <i 
            className="ri-search-line position-absolute" 
            style={{ 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#99A0AE',
              zIndex: 2,
              pointerEvents: 'none'
            }}
          ></i>
          <Input
            type="text"
            className="form-control"
            placeholder={searchPlaceholder}
            style={{ 
              paddingLeft: '40px',
              textIndent: '0px',
              position: 'relative',
              zIndex: 1,
              backgroundColor: 'white'
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {(showToggleButtons || showIncludeExclude) && (
          <div className="d-flex gap-2 flex-shrink-0">
            <Button 
              variant="link" 
              size="sm" 
              className="text-primary p-0 fs-small text-nowrap"
              onClick={handleSelectAll}
              type="button"
            >
              Tout incl.
            </Button>
            <Button 
              variant="link" 
              size="sm" 
              className="text-primary p-0 fs-small text-nowrap"
              onClick={handleDeselectAll}
              type="button"
            >
              Tout excl.
            </Button>
          </div>
        )}
      </div>
      
      <div 
        className="checkboxes-wrapper p-2 border rounded" 
        style={{ 
          maxHeight, 
          overflowY: 'auto',
          backgroundColor: 'white'
        }}
      >
        {filteredItems.map((item) => {
          const isSelected = selectedItems.includes(item.id);
          return (
            <div 
              key={item.id} 
              className="d-flex justify-content-between align-items-center"
              onClick={() => handleToggle(item.id)}
              style={{
                padding: '8px 12px',
                marginBottom: '2px',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: isSelected ? '#F0F5FF' : 'transparent',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#F5F7FA';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isSelected ? '#F0F5FF' : 'transparent';
              }}
            >
              <div className="d-flex align-items-center gap-2">
                {item.icon && <span style={{ flexShrink: 0 }}>{item.icon}</span>}
                <span 
                  className="fs-small fw-500" 
                  style={{ 
                    color: isSelected ? '#0E121B' : '#525866',
                    userSelect: 'none'
                  }}
                >
                  {item.label}
                </span>
              </div>
              <div className="d-flex" onClick={(e) => e.stopPropagation()}>
                <div className="form-check">
                  <input
                    className={`form-check-input small-check ${groupName ? `group-${groupName}` : ''}`}
                    type="checkbox"
                    id={`${groupName || 'checkbox'}-${item.id}`}
                    checked={isSelected}
                    onChange={() => handleToggle(item.id)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
        {filteredItems.length === 0 && (
          <p className="text-muted fs-small text-center mb-0 py-2">Aucun résultat trouvé</p>
        )}
      </div>
    </div>
  );
}
