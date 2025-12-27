"use client";

import { useState, useEffect } from "react";
import FilterDropdown from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterInputGroup from "./FilterInputGroup";
import { Button } from "@/components/ui/button";

interface ActiveAdsFilterProps {
  minActiveAds?: number;
  maxActiveAds?: number;
  onMinActiveAdsChange?: (value: number | undefined) => void;
  onMaxActiveAdsChange?: (value: number | undefined) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: (overrideFilters?: { minActiveAds?: number; maxActiveAds?: number }) => void;
  isActive?: boolean;
}

export default function ActiveAdsFilter({ 
  minActiveAds: externalMin,
  maxActiveAds: externalMax,
  onMinActiveAdsChange,
  onMaxActiveAdsChange,
  onOpenChange, 
  onApply, 
  isActive 
}: ActiveAdsFilterProps) {
  const [minAdsStr, setMinAdsStr] = useState(externalMin?.toString() || "");
  const [maxAdsStr, setMaxAdsStr] = useState(externalMax?.toString() || "");
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Sync with external values and reset preset when values are cleared
  useEffect(() => {
    setMinAdsStr(externalMin?.toString() || "");
    if (externalMin === undefined) {
      setActivePreset(null);
    }
  }, [externalMin]);
  
  useEffect(() => {
    setMaxAdsStr(externalMax?.toString() || "");
    if (externalMax === undefined && externalMin === undefined) {
      setActivePreset(null);
    }
  }, [externalMax, externalMin]);

  const handlePresetClick = (presetId: string) => {
    setActivePreset(presetId);
    
    let newMin: number | undefined;
    let newMax: number | undefined;
    
    switch (presetId) {
      case "test":
        newMin = 1;
        newMax = 10;
        break;
      case "scaling":
        newMin = 10;
        newMax = 50;
        break;
      case "dominants":
        newMin = 50;
        newMax = 200;
        break;
      case "established":
        newMin = 200;
        newMax = undefined;
        break;
    }
    
    setMinAdsStr(newMin?.toString() || "");
    setMaxAdsStr(newMax?.toString() || "");
    
    // Update parent state immediately
    if (onMinActiveAdsChange) onMinActiveAdsChange(newMin);
    if (onMaxActiveAdsChange) onMaxActiveAdsChange(newMax);
    
    // Auto-apply when preset is selected - pass values directly to avoid timing issues
    if (onApply) {
      onApply({ minActiveAds: newMin, maxActiveAds: newMax });
    }
  };

  const handleMinChange = (val: string) => {
    setMinAdsStr(val);
    setActivePreset(null);
    if (onMinActiveAdsChange) {
      onMinActiveAdsChange(val ? parseInt(val) : undefined);
    }
  };

  const handleMaxChange = (val: string) => {
    setMaxAdsStr(val);
    setActivePreset(null);
    if (onMaxActiveAdsChange) {
      onMaxActiveAdsChange(val ? parseInt(val) : undefined);
    }
  };

  const presets = [
    {
      id: "test",
      icon: "ri-test-tube-line",
      title: "Test",
      description: "1 - 10 pubs actives",
    },
    {
      id: "scaling",
      icon: "ri-line-chart-line",
      title: "Mise à l'échelle",
      description: "10 - 50 pubs actives",
    },
    {
      id: "dominants",
      icon: "ri-bar-chart-fill",
      title: "Dominants",
      description: "50 - 200 pubs actives",
    },
    {
      id: "established",
      icon: "ri-building-2-line",
      title: "Marques établies",
      description: "200+ pubs actives",
    },
  ];

  const hasValue = minAdsStr !== "" || maxAdsStr !== "";

  return (
    <FilterDropdown
      label="Publicités actives"
      icon="ri-megaphone-line"
      onOpenChange={onOpenChange}
      isActive={isActive || hasValue}
      badge={hasValue ? 1 : undefined}
      alignEndAtWidth={1200}
    >
      <p className="fw-500 mb-2">Publicités actives</p>
      <p className="fs-small fw-500 mb-2 text-muted">Préréglages</p>

      <FilterPresetGrid 
        presets={presets} 
        onPresetClick={handlePresetClick}
        activePreset={activePreset}
        columns={2}
      />
      
      <div className="border-t border-gray-200 dark:border-gray-700 my-3" />

          <FilterInputGroup
        label="Nombre de publicités actives"
        minValue={minAdsStr}
        maxValue={maxAdsStr}
        onMinChange={handleMinChange}
        onMaxChange={handleMaxChange}
        minPlaceholder="Min"
        maxPlaceholder="∞"
      />

            <Button 
        className="w-100 mt-3" 
        onClick={() => onApply?.()}
      >
        Appliquer
      </Button>
    </FilterDropdown>
  );
}
