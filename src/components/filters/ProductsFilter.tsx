"use client";

import { useState, useEffect } from "react";
import FilterDropdown from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterInputGroup from "./FilterInputGroup";
import { Button } from "@/components/ui/button";

interface ProductsFilterProps {
  minPrice?: number;
  maxPrice?: number;
  minCatalogSize?: number;
  maxCatalogSize?: number;
  onMinPriceChange?: (value: number | undefined) => void;
  onMaxPriceChange?: (value: number | undefined) => void;
  onMinCatalogSizeChange?: (value: number | undefined) => void;
  onMaxCatalogSizeChange?: (value: number | undefined) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: (overrideFilters?: { minPrice?: number; maxPrice?: number; minCatalogSize?: number; maxCatalogSize?: number }) => void;
  isActive?: boolean;
}

export default function ProductsFilter({ 
  minPrice: externalMinPrice,
  maxPrice: externalMaxPrice,
  minCatalogSize: externalMinCatalog,
  maxCatalogSize: externalMaxCatalog,
  onMinPriceChange,
  onMaxPriceChange,
  onMinCatalogSizeChange,
  onMaxCatalogSizeChange,
  onOpenChange, 
  onApply, 
  isActive 
}: ProductsFilterProps) {
  const [minPriceStr, setMinPriceStr] = useState(externalMinPrice?.toString() || "");
  const [maxPriceStr, setMaxPriceStr] = useState(externalMaxPrice?.toString() || "");
  const [minCatalogStr, setMinCatalogStr] = useState(externalMinCatalog?.toString() || "");
  const [maxCatalogStr, setMaxCatalogStr] = useState(externalMaxCatalog?.toString() || "");
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Sync with external values and reset preset when values are cleared
  useEffect(() => {
    setMinPriceStr(externalMinPrice?.toString() || "");
    if (externalMinPrice === undefined && externalMaxPrice === undefined && 
        externalMinCatalog === undefined && externalMaxCatalog === undefined) {
      setActivePreset(null);
    }
  }, [externalMinPrice, externalMaxPrice, externalMinCatalog, externalMaxCatalog]);
  
  useEffect(() => {
    setMaxPriceStr(externalMaxPrice?.toString() || "");
  }, [externalMaxPrice]);
  
  useEffect(() => {
    setMinCatalogStr(externalMinCatalog?.toString() || "");
  }, [externalMinCatalog]);
  
  useEffect(() => {
    setMaxCatalogStr(externalMaxCatalog?.toString() || "");
  }, [externalMaxCatalog]);

  const handlePresetClick = (presetId: string) => {
    setActivePreset(presetId);
    
    let newMinPrice: number | undefined;
    let newMaxPrice: number | undefined;
    let newMinCatalog: number | undefined;
    let newMaxCatalog: number | undefined;
    
    switch (presetId) {
      case "low-price":
        newMinPrice = 0;
        newMaxPrice = 80;
        newMinCatalog = undefined;
        newMaxCatalog = undefined;
        break;
      case "high-price":
        newMinPrice = 100;
        newMaxPrice = undefined;
        newMinCatalog = undefined;
        newMaxCatalog = undefined;
        break;
      case "small-catalog":
        newMinPrice = undefined;
        newMaxPrice = undefined;
        newMinCatalog = 0;
        newMaxCatalog = 50;
        break;
      case "large-catalog":
        newMinPrice = undefined;
        newMaxPrice = undefined;
        newMinCatalog = 50;
        newMaxCatalog = undefined;
        break;
    }
    
    setMinPriceStr(newMinPrice?.toString() || "");
    setMaxPriceStr(newMaxPrice?.toString() || "");
    setMinCatalogStr(newMinCatalog?.toString() || "");
    setMaxCatalogStr(newMaxCatalog?.toString() || "");
    
    // Update parent state immediately
    if (onMinPriceChange) onMinPriceChange(newMinPrice);
    if (onMaxPriceChange) onMaxPriceChange(newMaxPrice);
    if (onMinCatalogSizeChange) onMinCatalogSizeChange(newMinCatalog);
    if (onMaxCatalogSizeChange) onMaxCatalogSizeChange(newMaxCatalog);
    
    // Auto-apply when preset is selected - pass values directly to avoid timing issues
    if (onApply) {
      onApply({ minPrice: newMinPrice, maxPrice: newMaxPrice, minCatalogSize: newMinCatalog, maxCatalogSize: newMaxCatalog });
    }
  };

  const presets = [
    {
      id: "low-price",
      icon: "ri-money-dollar-circle-line",
      title: "Prix bas",
      description: "Moins de $80",
    },
    {
      id: "high-price",
      icon: "ri-money-dollar-circle-line",
      title: "Prix élevé",
      description: "$100 et plus",
    },
    {
      id: "small-catalog",
      icon: "ri-shopping-bag-3-line",
      title: "Petit catalogue",
      description: "Moins de 50 articles",
    },
    {
      id: "large-catalog",
      icon: "ri-shopping-bag-3-line",
      title: "Grand catalogue",
      description: "50 articles et plus",
    },
  ];

  const hasValue = minPriceStr !== "" || maxPriceStr !== "" || minCatalogStr !== "" || maxCatalogStr !== "";

  return (
    <FilterDropdown
      label="Produits"
      icon="ri-price-tag-3-line"
      onOpenChange={onOpenChange}
      isActive={isActive || hasValue}
      badge={hasValue ? 1 : undefined}
    >
      <p className="fw-500 mb-2">Produits</p>
      <p className="fs-small fw-500 mb-2 text-muted">Préréglages</p>

      <FilterPresetGrid 
        presets={presets} 
        onPresetClick={handlePresetClick}
        activePreset={activePreset}
        columns={2}
      />

      <div className="border-t border-gray-200 dark:border-gray-700 my-3" />

      <div className="row g-2">
        <div className="col-6">
          <FilterInputGroup
            label="Prix moyen"
            minValue={minPriceStr}
            maxValue={maxPriceStr}
            onMinChange={(val) => {
              setMinPriceStr(val);
              setActivePreset(null);
              if (onMinPriceChange) onMinPriceChange(val ? parseFloat(val) : undefined);
            }}
            onMaxChange={(val) => {
              setMaxPriceStr(val);
              setActivePreset(null);
              if (onMaxPriceChange) onMaxPriceChange(val ? parseFloat(val) : undefined);
            }}
            minPlaceholder="Min"
            maxPlaceholder="Max"
            prefix="$"
          />
        </div>
        <div className="col-6">
          <FilterInputGroup
            label="Taille du catalogue"
            minValue={minCatalogStr}
            maxValue={maxCatalogStr}
            onMinChange={(val) => {
              setMinCatalogStr(val);
              setActivePreset(null);
              if (onMinCatalogSizeChange) onMinCatalogSizeChange(val ? parseInt(val) : undefined);
            }}
            onMaxChange={(val) => {
              setMaxCatalogStr(val);
              setActivePreset(null);
              if (onMaxCatalogSizeChange) onMaxCatalogSizeChange(val ? parseInt(val) : undefined);
            }}
            minPlaceholder="Min"
            maxPlaceholder="Max"
          />
        </div>
      </div>

      <Button 
        className="w-100 mt-3" 
        onClick={() => onApply?.()}
      >
        Appliquer
      </Button>
    </FilterDropdown>
  );
}
