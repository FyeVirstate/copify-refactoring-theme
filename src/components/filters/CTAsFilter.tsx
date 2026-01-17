"use client";

import FilterDropdown, { FilterApplyButton } from "./FilterDropdown";
import FilterCheckboxList from "./FilterCheckboxList";

interface CTAsFilterProps {
  selectedCTAs: string[];
  onCTAsChange: (ctas: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: () => void;
  isActive?: boolean;
}

export default function CTAsFilter({ 
  selectedCTAs, 
  onCTAsChange,
  onOpenChange,
  onApply,
  isActive 
}: CTAsFilterProps) {
  // CTA values must match EXACTLY what's stored in the database
  // These values come from the Laravel codebase (ads_filter_new.blade.php)
  const ctas = [
    { id: "Shop Now", label: "Shop Now" },
    { id: "Learn More", label: "Learn More" },
    { id: "Buy Now", label: "Buy Now" },
    { id: "Order Now", label: "Order Now" },
    { id: "Get Offer", label: "Get Offer" },
    { id: "Call Now", label: "Call Now" },
    { id: "View product", label: "View Product" },
    { id: "Sign Up", label: "Sign Up" },
    { id: "Download", label: "Download" },
    { id: "Watch More", label: "Watch More" },
    { id: "Contact Us", label: "Contact Us" },
    { id: "Book Now", label: "Book Now" },
    { id: "Get Quote", label: "Get Quote" },
    { id: "Subscribe", label: "Subscribe" },
  ];

  return (
    <FilterDropdown
      icon="ri-mouse-line"
      label="CTAs"
      title="CTAs"
      width="400px"
      onOpenChange={onOpenChange}
      isActive={isActive || selectedCTAs.length > 0}
    >
      <FilterCheckboxList
        items={ctas}
        selectedItems={selectedCTAs}
        onItemsChange={onCTAsChange}
        searchPlaceholder="Rechercher des CTAs..."
        showToggleButtons={false}
      />
      
      <FilterApplyButton onClick={() => onApply?.()}>
        Appliquer les filtres
      </FilterApplyButton>
    </FilterDropdown>
  );
}
