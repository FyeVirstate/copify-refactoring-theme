"use client";

import { useState, useEffect } from "react";
import FilterDropdown, { FilterApplyButton } from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterCheckboxList from "./FilterCheckboxList";
import Image from "next/image";

interface MarketsFilterProps {
  selectedCountries: string[];
  onCountriesChange: (countries: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: (overrideFilters?: { country?: string }) => void;
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
  { code: "SA", name: "Arabie Saoudite" },
  { code: "BR", name: "Brésil" },
  { code: "MX", name: "Mexique" },
  { code: "IN", name: "Inde" },
  { code: "ZA", name: "Afrique du Sud" },
  { code: "RU", name: "Russie" },
  { code: "TR", name: "Turquie" },
  { code: "TH", name: "Thaïlande" },
  { code: "ID", name: "Indonésie" },
  { code: "MY", name: "Malaisie" },
  { code: "PH", name: "Philippines" },
  { code: "VN", name: "Vietnam" },
];

export default function MarketsFilter({ 
  selectedCountries, 
  onCountriesChange,
  onOpenChange,
  onApply,
  isActive = false
}: MarketsFilterProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Reset preset when selectedCountries is cleared externally
  useEffect(() => {
    if (selectedCountries.length === 0) {
      setActivePreset(null);
    }
  }, [selectedCountries]);

  const handlePresetClick = (presetId: string) => {
    let newCountries: string[] = [];
    
    switch (presetId) {
      case "anglophone":
        newCountries = ["US", "GB", "CA", "AU", "NZ", "IE"];
        break;
      case "europe":
        newCountries = ["FR", "DE", "GB", "ES", "IT", "NL", "BE", "CH", "AT"];
        break;
      case "asia":
        newCountries = ["JP", "KR", "CN", "SG", "HK", "TH", "ID", "MY", "PH", "VN"];
        break;
      case "mena":
        newCountries = ["AE", "SA"];
        break;
    }
    
    setActivePreset(presetId);
    onCountriesChange(newCountries);
    
    // Auto-apply when preset is selected - pass values directly to avoid timing issues
    if (onApply) {
      onApply({ country: newCountries.join(',') });
    }
  };

  const presets = [
    {
      id: "anglophone",
      icon: "ri-verified-badge-line",
      title: "Anglophone",
      description: "US, UK, CA, AU, NZ, IE",
    },
    {
      id: "europe",
      icon: "ri-money-euro-circle-line",
      title: "Europe",
      description: "FR, DE, UK, ES, IT...",
    },
    {
      id: "asia",
      icon: "ri-earth-line",
      title: "Asie",
      description: "JP, KR, CN, SG...",
    },
    {
      id: "mena",
      icon: "ri-building-line",
      title: "MENA",
      description: "UAE, Arabie Saoudite",
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
      label="Marchés"
      icon="ri-earth-line"
      onOpenChange={onOpenChange}
      isActive={isActive || selectedCountries.length > 0}
      badge={selectedCountries.length > 0 ? selectedCountries.length : undefined}
      forceAlignEnd={true}
    >
      <p className="fw-500 mb-2">Marchés</p>
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
        selectedItems={selectedCountries}
        onItemsChange={(items) => {
          setActivePreset(null);
          onCountriesChange(items);
        }}
        searchPlaceholder="Rechercher un pays..."
        showIncludeExclude={true}
        groupName="marketsCheckboxes"
      />
      
      <FilterApplyButton onClick={() => onApply?.()}>
        Appliquer
      </FilterApplyButton>
    </FilterDropdown>
  );
}
