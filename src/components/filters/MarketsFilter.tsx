"use client";

import FilterDropdown from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterCheckboxList from "./FilterCheckboxList";
import { Button } from "@/components/ui/button";

interface MarchesFilterProps {
  selectedCountries: string[];
  onCountriesChange: (countries: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: () => void;
  isActive?: boolean;
}

export default function MarchesFilter({ 
  selectedCountries, 
  onCountriesChange,
  onOpenChange,
  onApply,
  isActive = false
}: MarchesFilterProps) {
  const handlePresetClick = (presetId: string) => {
    switch (presetId) {
      case "big-4":
        onCountriesChange(["US", "GB", "CA", "AU"]);
        break;
      case "eu":
        onCountriesChange(["FR", "DE", "ES", "IT", "NL", "BE", "PT", "AT"]);
        break;
      case "untapped":
        onCountriesChange(["MX", "BR", "IN", "PH", "ZA"]);
        break;
    }
  };

  const presets = [
    {
      id: "big-4",
      icon: "ri-global-line",
      title: "Les 4 grands",
      description: "USA, UK, Canada, Australie",
      onClick: () => handlePresetClick("big-4"),
    },
    {
      id: "eu",
      icon: "ri-euro-line",
      title: "UE",
      description: "Pays européens",
      onClick: () => handlePresetClick("eu"),
    },
    {
      id: "untapped",
      icon: "ri-map-pin-line",
      title: "Marchés inexploités",
      description: "Marchés à faible concurrence",
      onClick: () => handlePresetClick("untapped"),
    },
  ];

  const countries = [
    { id: "US", label: "États-Unis", icon: <img src="/flags/us.svg" alt="US" style={{ width: '20px', height: '15px', marginRight: '8px' }} /> },
    { id: "GB", label: "Royaume-Uni", icon: <img src="/flags/gb.svg" alt="GB" style={{ width: '20px', height: '15px', marginRight: '8px' }} /> },
    { id: "FR", label: "France", icon: <img src="/flags/fr.svg" alt="FR" style={{ width: '20px', height: '15px', marginRight: '8px' }} /> },
    { id: "DE", label: "Allemagne", icon: <img src="/flags/de.svg" alt="DE" style={{ width: '20px', height: '15px', marginRight: '8px' }} /> },
    { id: "CA", label: "Canada", icon: <img src="/flags/ca.svg" alt="CA" style={{ width: '20px', height: '15px', marginRight: '8px' }} /> },
  ];

  return (
    <FilterDropdown
      icon="ri-store-line"
      label="Marchés"
      title="Marchés"
      width="400px"
      onOpenChange={onOpenChange}
      isActive={isActive}
    >
      <FilterPresetGrid presets={presets} columns={2} />
      
      <div className="horizontal-dashed-divider mb-3"></div>
      
      <div className="mb-3">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="uniqueMarket"
          />
          <label className="form-check-label fs-small" htmlFor="uniqueMarket">
            Uniquement les boutiques où l'un de vos marchés sélectionnés est leur #1
          </label>
        </div>
      </div>
      
      <FilterCheckboxList
        items={countries}
        selectedItems={selectedCountries}
        onItemsChange={onCountriesChange}
        searchPlaceholder="Rechercher devise, pays..."
      />
      
      <Button 
        type="button" 
        className="btn btn-primary w-100 apply-filters-btn mt-3"
        onClick={() => {
          onApply?.();
          onOpenChange?.(false);
        }}
      >
        Appliquer
      </Button>
    </FilterDropdown>
  );
}

