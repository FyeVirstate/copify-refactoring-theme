"use client";

import FilterDropdown from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterCheckboxList from "./FilterCheckboxList";
import { Button } from "@/components/ui/button";

interface OrigineFilterProps {
  selectedOrigins: string[];
  onOriginsChange: (origins: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: () => void;
  isActive?: boolean;
}

export default function OrigineFilter({ 
  selectedOrigins, 
  onOriginsChange,
  onOpenChange,
  onApply,
  isActive 
}: OrigineFilterProps) {
  const presets = [
    {
      id: "big-4",
      icon: "ri-global-line",
      title: "Les 4 grands",
      description: "USA, UK, Canada, Australie",
    },
    {
      id: "european",
      icon: "ri-euro-line",
      title: "Européen",
      description: "Pays européens",
    },
    {
      id: "expats",
      icon: "ri-flight-takeoff-line",
      title: "Expatriés connus",
      description: "EAU, Singapour, Malte, Thaïlande",
    },
  ];

  const countries = [
    { 
      id: "US", 
      label: "États-Unis", 
      icon: <img src="/flags/us.svg" alt="US" style={{ width: '20px', height: '15px', marginRight: '8px' }} /> 
    },
    { 
      id: "GB", 
      label: "Royaume-Uni", 
      icon: <img src="/flags/gb.svg" alt="GB" style={{ width: '20px', height: '15px', marginRight: '8px' }} /> 
    },
    { 
      id: "FR", 
      label: "France", 
      icon: <img src="/flags/fr.svg" alt="FR" style={{ width: '20px', height: '15px', marginRight: '8px' }} /> 
    },
    { 
      id: "DE", 
      label: "Allemagne", 
      icon: <img src="/flags/de.svg" alt="DE" style={{ width: '20px', height: '15px', marginRight: '8px' }} /> 
    },
    { 
      id: "CA", 
      label: "Canada", 
      icon: <img src="/flags/ca.svg" alt="CA" style={{ width: '20px', height: '15px', marginRight: '8px' }} /> 
    },
  ];

  const handleApply = () => {
    if (onApply) {
      onApply();
    }
  };

  return (
    <FilterDropdown
      icon="ri-earth-line"
      label="Origine"
      title="Origine"
      width="400px"
      onOpenChange={onOpenChange}
      isActive={isActive || selectedOrigins.length > 0}
    >
      <FilterPresetGrid presets={presets} columns={2} />
      
      <div className="horizontal-dashed-divider mb-3"></div>
      
      <FilterCheckboxList
        items={countries}
        selectedItems={selectedOrigins}
        onItemsChange={onOriginsChange}
        searchPlaceholder="Rechercher devise, pays..."
      />
      
      <Button 
        type="button" 
        className="btn btn-primary w-100 apply-filters-btn mt-3"
        onClick={handleApply}
      >
        Appliquer
      </Button>
    </FilterDropdown>
  );
}
