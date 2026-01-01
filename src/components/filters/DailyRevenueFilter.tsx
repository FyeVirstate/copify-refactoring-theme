"use client";

import { useState, useEffect } from "react";
import FilterDropdown, { useFilterDropdown, FilterApplyButton } from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterInputGroup from "./FilterInputGroup";

interface DailyRevenueFilterProps {
  minRevenue?: number;
  maxRevenue?: number;
  onMinRevenueChange?: (value: number | undefined) => void;
  onMaxRevenueChange?: (value: number | undefined) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: (overrideFilters?: { minRevenue?: number; maxRevenue?: number }) => void;
  isActive?: boolean;
}

// Inner component that uses the dropdown context
function DailyRevenueFilterContent({
  minRevenue: externalMin,
  maxRevenue: externalMax,
  onMinRevenueChange,
  onMaxRevenueChange,
  onApply, 
}: Omit<DailyRevenueFilterProps, 'onOpenChange' | 'isActive'>) {
  const [minRevenueStr, setMinRevenueStr] = useState(externalMin?.toString() || "");
  const [maxRevenueStr, setMaxRevenueStr] = useState(externalMax?.toString() || "");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const dropdownContext = useFilterDropdown();

  // Sync with external values and reset preset when values are cleared
  useEffect(() => {
    setMinRevenueStr(externalMin?.toString() || "");
    if (externalMin === undefined) {
      setActivePreset(null);
    }
  }, [externalMin]);
  
  useEffect(() => {
    setMaxRevenueStr(externalMax?.toString() || "");
    if (externalMax === undefined && externalMin === undefined) {
      setActivePreset(null);
    }
  }, [externalMax, externalMin]);

  const handlePresetClick = (presetId: string) => {
    setActivePreset(presetId);
    
    let newMin: number | undefined;
    let newMax: number | undefined;
    
    switch (presetId) {
      case "club-1k":
        newMin = 1000;
        newMax = undefined;
        break;
      case "club-3k":
        newMin = 3000;
        newMax = undefined;
        break;
      case "club-5k":
        newMin = 5000;
        newMax = undefined;
        break;
      case "six-figures":
        newMin = 10000;
        newMax = undefined;
        break;
    }
    
    setMinRevenueStr(newMin?.toString() || "");
    setMaxRevenueStr(newMax?.toString() || "");
    
    if (onMinRevenueChange) onMinRevenueChange(newMin);
    if (onMaxRevenueChange) onMaxRevenueChange(newMax);
    
    if (onApply) {
      onApply({ minRevenue: newMin, maxRevenue: newMax });
    }
    
    // Close dropdown after preset selection
    dropdownContext?.closeDropdown();
  };

  const handleMinChange = (val: string) => {
    setMinRevenueStr(val);
    setActivePreset(null);
    if (onMinRevenueChange) {
      onMinRevenueChange(val ? parseInt(val) : undefined);
    }
  };

  const handleMaxChange = (val: string) => {
    setMaxRevenueStr(val);
    setActivePreset(null);
    if (onMaxRevenueChange) {
      onMaxRevenueChange(val ? parseInt(val) : undefined);
    }
  };

  const presets = [
    {
      id: "club-1k",
      icon: "ri-copper-diamond-line",
      title: "Club 1k par jour",
      description: "1,000 $/jour (~30k $/mois)",
    },
    {
      id: "club-3k",
      icon: "ri-star-line",
      title: "Club 3k par jour",
      description: "3,000 $/jour (~90k $/mois)",
    },
    {
      id: "club-5k",
      icon: "ri-vip-crown-line",
      title: "Club 5k par jour",
      description: "5,000 $/jour (~150k $/mois)",
    },
    {
      id: "six-figures",
      icon: "ri-trophy-line",
      title: "Boutique à 6 chiffres",
      description: "10k+ $/jour (~300k+ $/mois)",
    },
  ];

  return (
    <>
      <p className="fw-500 mb-2">Revenu quotidien</p>
      <p className="fs-small fw-500 mb-2 text-muted">Préréglages</p>

      <FilterPresetGrid 
        presets={presets} 
        onPresetClick={handlePresetClick}
        activePreset={activePreset}
        columns={2}
      />
      
      <div className="border-t border-gray-200 dark:border-gray-700 my-3" />
      
      <FilterInputGroup
        label="Revenu quotidien"
        minValue={minRevenueStr}
        maxValue={maxRevenueStr}
        onMinChange={handleMinChange}
        onMaxChange={handleMaxChange}
        minPlaceholder="Min"
        maxPlaceholder="∞"
        prefix="$"
      />
      
      <FilterApplyButton onClick={() => onApply?.()} />
    </>
  );
}

export default function DailyRevenueFilter({ 
  minRevenue: externalMin,
  maxRevenue: externalMax,
  onMinRevenueChange,
  onMaxRevenueChange,
  onOpenChange, 
  onApply, 
  isActive 
}: DailyRevenueFilterProps) {
  const hasValue = externalMin !== undefined || externalMax !== undefined;

  return (
    <FilterDropdown
      label="Revenu quotidien"
      icon="ri-money-dollar-circle-line"
      onOpenChange={onOpenChange}
      isActive={isActive || hasValue}
      badge={hasValue ? 1 : undefined}
      alignEndAtWidth={992}
    >
      <DailyRevenueFilterContent
        minRevenue={externalMin}
        maxRevenue={externalMax}
        onMinRevenueChange={onMinRevenueChange}
        onMaxRevenueChange={onMaxRevenueChange}
        onApply={onApply}
      />
    </FilterDropdown>
  );
}
