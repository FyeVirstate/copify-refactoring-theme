"use client";

import { useState, useEffect } from "react";
import FilterDropdown, { useFilterDropdown, FilterApplyButton } from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterInputGroup from "./FilterInputGroup";

interface ActiveAdsFilterProps {
  minActiveAds?: number;
  maxActiveAds?: number;
  onMinActiveAdsChange?: (value: number | undefined) => void;
  onMaxActiveAdsChange?: (value: number | undefined) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: (overrideFilters?: { minActiveAds?: number; maxActiveAds?: number }) => void;
  isActive?: boolean;
}

function ActiveAdsFilterContent({ 
  minActiveAds: externalMin,
  maxActiveAds: externalMax,
  onMinActiveAdsChange,
  onMaxActiveAdsChange,
  onApply,
  activePreset,
  setActivePreset,
}: Omit<ActiveAdsFilterProps, 'onOpenChange' | 'isActive'> & {
  activePreset: string | null;
  setActivePreset: (preset: string | null) => void;
}) {
  const [minAdsStr, setMinAdsStr] = useState(externalMin?.toString() || "");
  const [maxAdsStr, setMaxAdsStr] = useState(externalMax?.toString() || "");
  const dropdownContext = useFilterDropdown();

  useEffect(() => {
    setMinAdsStr(externalMin?.toString() || "");
  }, [externalMin]);
  
  useEffect(() => {
    setMaxAdsStr(externalMax?.toString() || "");
  }, [externalMax]);

  const handlePresetClick = (presetId: string) => {
    // Toggle off if same preset is clicked again
    if (activePreset === presetId) {
      setActivePreset(null);
      setMinAdsStr("");
      setMaxAdsStr("");
      if (onMinActiveAdsChange) onMinActiveAdsChange(undefined);
      if (onMaxActiveAdsChange) onMaxActiveAdsChange(undefined);
      if (onApply) {
        onApply({ minActiveAds: undefined, maxActiveAds: undefined });
      }
      dropdownContext?.closeDropdown();
      return;
    }
    
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
    
    if (onMinActiveAdsChange) onMinActiveAdsChange(newMin);
    if (onMaxActiveAdsChange) onMaxActiveAdsChange(newMax);
    
    if (onApply) {
      onApply({ minActiveAds: newMin, maxActiveAds: newMax });
    }
    
    dropdownContext?.closeDropdown();
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

  return (
    <>
      <p className="fw-500 mb-2">Publicités actives</p>
      <p className="fs-small fw-500 mb-2 text-muted">Préréglages</p>

      <FilterPresetGrid 
        presets={presets} 
        onPresetClick={handlePresetClick}
        activePreset={activePreset}
        columns={2}
        closeOnSelect={false}
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

      <FilterApplyButton onClick={() => onApply?.()} />
    </>
  );
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
  const hasValue = externalMin !== undefined || externalMax !== undefined;
  
  // Lift activePreset state up to persist across dropdown open/close
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Reset preset when values are cleared externally
  useEffect(() => {
    if (externalMin === undefined && externalMax === undefined) {
      setActivePreset(null);
    }
  }, [externalMin, externalMax]);

  return (
    <FilterDropdown
      label="Publicités actives"
      icon="ri-megaphone-line"
      onOpenChange={onOpenChange}
      isActive={isActive || hasValue}
      badge={hasValue ? 1 : undefined}
      alignEndAtWidth={1200}
    >
      <ActiveAdsFilterContent
        minActiveAds={externalMin}
        maxActiveAds={externalMax}
        onMinActiveAdsChange={onMinActiveAdsChange}
        onMaxActiveAdsChange={onMaxActiveAdsChange}
        onApply={onApply}
        activePreset={activePreset}
        setActivePreset={setActivePreset}
      />
    </FilterDropdown>
  );
}
