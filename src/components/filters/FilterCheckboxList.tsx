"use client";

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
  maxHeight?: string;
}

export default function FilterCheckboxList({
  items,
  selectedItems,
  onItemsChange,
  searchPlaceholder = "Rechercher...",
  showToggleButtons = true,
  maxHeight = "200px",
}: FilterCheckboxListProps) {
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
        <Input
          type="text"
          className="form-control"
          placeholder={searchPlaceholder}
          style={{ flex: 1 }}
        />
        {showToggleButtons && (
          <div className="d-flex gap-2">
            <Button 
              variant="link" 
              size="sm" 
              className="text-primary p-0 fs-small"
              onClick={handleSelectAll}
              type="button"
            >
              Tout incl.
            </Button>
            <Button 
              variant="link" 
              size="sm" 
              className="text-primary p-0 fs-small"
              onClick={handleDeselectAll}
              type="button"
            >
              Tout excl.
            </Button>
          </div>
        )}
      </div>
      
      <div 
        className="checkboxes-wrapper p-3 border rounded" 
        style={{ 
          maxHeight, 
          overflowY: 'auto',
          backgroundColor: 'white'
        }}
      >
        {items.map((item) => (
          <div key={item.id} className="form-check">
            <input
              className="form-check-input small-check"
              type="checkbox"
              id={item.id}
              checked={selectedItems.includes(item.id)}
              onChange={() => handleToggle(item.id)}
            />
            <label className="form-check-label fs-small text-dark" htmlFor={item.id}>
              {item.icon && <span className="me-2">{item.icon}</span>}
              {item.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

