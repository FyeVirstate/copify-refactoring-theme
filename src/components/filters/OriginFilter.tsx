"use client";

import { useState, useEffect } from "react";
import FilterDropdown, { FilterApplyButton } from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterCheckboxList from "./FilterCheckboxList";
import Image from "next/image";

interface OriginFilterProps {
  selectedOrigins: string[];
  onOriginsChange: (origins: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: (overrideFilters?: { origins?: string }) => void;
  isActive?: boolean;
}

// Country code to name mapping
const countries = [
  { code: "US", name: "États-Unis" },
  { code: "GB", name: "Royaume-Uni" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australie" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Allemagne" },
  { code: "NL", name: "Pays-Bas" },
  { code: "BE", name: "Belgique" },
  { code: "ES", name: "Espagne" },
  { code: "IT", name: "Italie" },
  { code: "CH", name: "Suisse" },
  { code: "AT", name: "Autriche" },
  { code: "IE", name: "Irlande" },
  { code: "NZ", name: "Nouvelle-Zélande" },
  { code: "SE", name: "Suède" },
  { code: "NO", name: "Norvège" },
  { code: "DK", name: "Danemark" },
  { code: "FI", name: "Finlande" },
  { code: "PL", name: "Pologne" },
  { code: "PT", name: "Portugal" },
  { code: "JP", name: "Japon" },
  { code: "KR", name: "Corée du Sud" },
  { code: "CN", name: "Chine" },
  { code: "SG", name: "Singapour" },
  { code: "HK", name: "Hong Kong" },
  { code: "AE", name: "Émirats Arabes Unis" },
  { code: "BR", name: "Brésil" },
  { code: "MX", name: "Mexique" },
  { code: "IN", name: "Inde" },
];

export default function OriginFilter({ 
  selectedOrigins, 
  onOriginsChange,
  onOpenChange,
  onApply,
  isActive = false
}: OriginFilterProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Reset preset when selectedOrigins is cleared externally
  useEffect(() => {
    if (selectedOrigins.length === 0) {
      setActivePreset(null);
    }
  }, [selectedOrigins]);

  const handlePresetClick = (presetId: string) => {
    // Toggle off if same preset is clicked again
    if (activePreset === presetId) {
      setActivePreset(null);
      onOriginsChange([]);
      if (onApply) {
        onApply({ origins: '' });
      }
      return;
    }
    
    let newOrigins: string[] = [];
    
    switch (presetId) {
      case "big4":
        newOrigins = ["US", "GB", "CA", "AU"];
        break;
      case "european":
        newOrigins = ["FR", "GB", "DE", "NL", "BE", "ES", "IT"];
        break;
      case "expats":
        newOrigins = ["IE"];
        break;
    }
    
    setActivePreset(presetId);
    onOriginsChange(newOrigins);
    
    // Auto-apply when preset is selected - pass values directly to avoid timing issues
    if (onApply) {
      onApply({ origins: newOrigins.join(',') });
    }
  };

  const presets = [
    {
      id: "big4",
      icon: "ri-verified-badge-line",
      title: "Big 4",
      description: "US, UK, Canada, Australie",
    },
    {
      id: "european",
      icon: "ri-money-euro-circle-line",
      title: "Européen",
      description: "FR, UK, DE, NL, BE, ES, IT",
    },
    {
      id: "expats",
      icon: "ri-funds-line",
      title: "Expats connus",
      description: "Irlande",
    },
  ];

  const countriesWithFlags = countries.map(country => ({
    id: country.code,
    label: country.name,
    icon: (
      <Image 
        src={`/flags/${country.code.toLowerCase()}.svg`} 
        alt={country.name} 
        width={20} 
        height={15}
        className="rounded"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    )
  }));

  return (
    <FilterDropdown
      label="Origine"
      icon="ri-home-4-line"
      onOpenChange={onOpenChange}
      isActive={isActive || selectedOrigins.length > 0}
      badge={selectedOrigins.length > 0 ? selectedOrigins.length : undefined}
      forceAlignEnd={true}
    >
      <p className="fw-500 mb-2">Origine</p>
      <p className="fs-small fw-500 mb-2 text-muted">Préréglages</p>

      <FilterPresetGrid 
        presets={presets} 
        onPresetClick={handlePresetClick}
        activePreset={activePreset}
        columns={2}
      />
      
      <div className="border-t border-gray-200 dark:border-gray-700 my-3" />
      
      <FilterCheckboxList
        items={countriesWithFlags}
        selectedItems={selectedOrigins}
        onItemsChange={(items) => {
          setActivePreset(null);
          onOriginsChange(items);
        }}
        searchPlaceholder="Rechercher un pays..."
        showIncludeExclude={true}
        groupName="originCheckboxes"
      />
      
      <FilterApplyButton onClick={() => onApply?.()}>
        Appliquer
      </FilterApplyButton>
    </FilterDropdown>
  );
}
