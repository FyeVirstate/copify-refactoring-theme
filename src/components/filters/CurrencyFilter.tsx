"use client";

import FilterDropdown from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterCheckboxList from "./FilterCheckboxList";
import { Button } from "@/components/ui/button";

interface DeviseFilterProps {
  selectedCurrencies: string[];
  onCurrenciesChange: (currencies: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: () => void;
  isActive?: boolean;
}

export default function DeviseFilter({ 
  selectedCurrencies, 
  onCurrenciesChange,
  onOpenChange,
  onApply,
  isActive = false
}: DeviseFilterProps) {
  const handlePresetClick = (presetId: string) => {
    switch (presetId) {
      case "main-currencies":
        onCurrenciesChange(["USD", "EUR", "GBP", "AUD", "CAD"]);
        break;
      case "eu":
        onCurrenciesChange(["EUR"]);
        break;
      case "hidden-ecommerce":
        onCurrenciesChange(["MXN", "BRL", "NOK", "SEK", "AED"]);
        break;
    }
  };

  const presets = [
    {
      id: "main-currencies",
      icon: "ri-coins-line",
      title: "Principales",
      description: "USD, EUR, GBP, AUS, CAD",
      onClick: () => handlePresetClick("main-currencies"),
    },
    {
      id: "eu",
      icon: "ri-euro-line",
      title: "UE",
      description: "Euro €",
      onClick: () => handlePresetClick("eu"),
    },
    {
      id: "hidden-ecommerce",
      icon: "ri-bank-line",
      title: "E-commerce caché",
      description: "MXN, BRL, NOK, SEK, AED",
      onClick: () => handlePresetClick("hidden-ecommerce"),
    },
  ];

  const currencies = [
    { 
      id: "USD", 
      label: "USD", 
      icon: <img src="/flags/us.svg" alt="USD" style={{ width: '20px', height: '15px', marginRight: '8px' }} /> 
    },
    { 
      id: "EUR", 
      label: "EUR", 
      icon: <img src="/flags/eu.svg" alt="EUR" style={{ width: '20px', height: '15px', marginRight: '8px' }} /> 
    },
    { 
      id: "GBP", 
      label: "GBP", 
      icon: <img src="/flags/gb.svg" alt="GBP" style={{ width: '20px', height: '15px', marginRight: '8px' }} /> 
    },
    { 
      id: "CAD", 
      label: "CAD", 
      icon: <img src="/flags/ca.svg" alt="CAD" style={{ width: '20px', height: '15px', marginRight: '8px' }} /> 
    },
    { 
      id: "AUD", 
      label: "AUD", 
      icon: <img src="/flags/au.svg" alt="AUD" style={{ width: '20px', height: '15px', marginRight: '8px' }} /> 
    },
  ];

  return (
    <FilterDropdown
      icon="ri-money-dollar-circle-line"
      label="Devise"
      title="Devise"
      width="400px"
      onOpenChange={onOpenChange}
      isActive={isActive}
    >
      <FilterPresetGrid presets={presets} columns={2} />
      
      <div className="horizontal-dashed-divider mb-3"></div>
      
      <FilterCheckboxList
        items={currencies}
        selectedItems={selectedCurrencies}
        onItemsChange={onCurrenciesChange}
        searchPlaceholder="Rechercher une devise"
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

