"use client";

import FilterDropdown from "./FilterDropdown";
import FilterCheckboxList from "./FilterCheckboxList";
import { Button } from "@/components/ui/button";

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
  const ctas = [
    { id: "SHOP_NOW", label: "Shop Now" },
    { id: "LEARN_MORE", label: "Learn More" },
    { id: "BUY_NOW", label: "Buy Now" },
    { id: "ORDER_NOW", label: "Order Now" },
    { id: "GET_OFFER", label: "Get Offer" },
    { id: "SIGN_UP", label: "Sign Up" },
    { id: "DOWNLOAD", label: "Download" },
    { id: "WATCH_MORE", label: "Watch More" },
    { id: "CONTACT_US", label: "Contact Us" },
    { id: "BOOK_NOW", label: "Book Now" },
    { id: "GET_QUOTE", label: "Get Quote" },
    { id: "SUBSCRIBE", label: "Subscribe" },
    { id: "NO_BUTTON", label: "No Button" },
  ];

  const handleApply = () => {
    if (onApply) {
      onApply();
    }
  };

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
      
      <Button 
        type="button" 
        className="btn btn-primary w-100 apply-filters-btn mt-3"
        onClick={handleApply}
      >
        Appliquer les filtres
      </Button>
    </FilterDropdown>
  );
}
