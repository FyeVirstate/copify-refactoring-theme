"use client";

import { useState, useEffect } from "react";
import FilterDropdown, { useFilterDropdown, FilterApplyButton } from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterInputGroup from "./FilterInputGroup";

interface MonthlyVisitsFilterProps {
  minTraffic?: number;
  maxTraffic?: number;
  onMinTrafficChange?: (value: number | undefined) => void;
  onMaxTrafficChange?: (value: number | undefined) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: (overrideFilters?: { minTraffic?: number; maxTraffic?: number }) => void;
  isActive?: boolean;
}

function MonthlyVisitsFilterContent({ 
  minTraffic: externalMin,
  maxTraffic: externalMax,
  onMinTrafficChange,
  onMaxTrafficChange,
  onApply,
  activePreset,
  setActivePreset,
}: Omit<MonthlyVisitsFilterProps, 'onOpenChange' | 'isActive'> & {
  activePreset: string | null;
  setActivePreset: (preset: string | null) => void;
}) {
  const [minVisitsStr, setMinVisitsStr] = useState(externalMin?.toString() || "");
  const [maxVisitsStr, setMaxVisitsStr] = useState(externalMax?.toString() || "");
  const dropdownContext = useFilterDropdown();

  useEffect(() => {
    setMinVisitsStr(externalMin?.toString() || "");
  }, [externalMin]);
  
  useEffect(() => {
    setMaxVisitsStr(externalMax?.toString() || "");
  }, [externalMax]);

  const handlePresetClick = (presetId: string) => {
    // Toggle off if same preset is clicked again
    if (activePreset === presetId) {
      setActivePreset(null);
      setMinVisitsStr("");
      setMaxVisitsStr("");
      if (onMinTrafficChange) onMinTrafficChange(undefined);
      if (onMaxTrafficChange) onMaxTrafficChange(undefined);
      if (onApply) {
        onApply({ minTraffic: undefined, maxTraffic: undefined });
      }
      dropdownContext?.closeDropdown();
      return;
    }
    
    setActivePreset(presetId);
    
    let newMin: number | undefined;
    let newMax: number | undefined;
    
    switch (presetId) {
      case "test":
        newMin = 0;
        newMax = 50000;
        break;
      case "scaling":
        newMin = 50000;
        newMax = 500000;
        break;
      case "dominants":
        newMin = 500000;
        newMax = 2000000;
        break;
      case "established":
        newMin = 2000000;
        newMax = undefined;
        break;
    }
    
    setMinVisitsStr(newMin?.toString() || "");
    setMaxVisitsStr(newMax?.toString() || "");
    
    if (onMinTrafficChange) onMinTrafficChange(newMin);
    if (onMaxTrafficChange) onMaxTrafficChange(newMax);
    
    if (onApply) {
      onApply({ minTraffic: newMin, maxTraffic: newMax });
    }
    
    dropdownContext?.closeDropdown();
  };

  const handleMinChange = (val: string) => {
    setMinVisitsStr(val);
    setActivePreset(null);
    if (onMinTrafficChange) {
      onMinTrafficChange(val ? parseInt(val) : undefined);
    }
  };

  const handleMaxChange = (val: string) => {
    setMaxVisitsStr(val);
    setActivePreset(null);
    if (onMaxTrafficChange) {
      onMaxTrafficChange(val ? parseInt(val) : undefined);
    }
  };

  const presets = [
    {
      id: "test",
      icon: "ri-seedling-line",
      title: "Test",
      description: "0 - 50K visiteurs/mois",
    },
    {
      id: "scaling",
      icon: "ri-line-chart-line",
      title: "Mise à l'échelle",
      description: "50K - 500K visiteurs/mois",
    },
    {
      id: "dominants",
      icon: "ri-bar-chart-fill",
      title: "Dominants",
      description: "500K - 2M visiteurs/mois",
    },
    {
      id: "established",
      icon: "ri-building-2-line",
      title: "Marques établies",
      description: "2M+ visiteurs/mois",
    },
  ];

  return (
    <>
      <p className="fw-500 mb-2">Visites mensuelles</p>
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
        label="Nombre de visiteurs par mois"
        minValue={minVisitsStr}
        maxValue={maxVisitsStr}
        onMinChange={handleMinChange}
        onMaxChange={handleMaxChange}
        minPlaceholder="Min"
        maxPlaceholder="∞"
      />
      
      <FilterApplyButton onClick={() => onApply?.()} />
    </>
  );
}

export default function MonthlyVisitsFilter({ 
  minTraffic: externalMin,
  maxTraffic: externalMax,
  onMinTrafficChange,
  onMaxTrafficChange,
  onOpenChange, 
  onApply, 
  isActive 
}: MonthlyVisitsFilterProps) {
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
      label="Visites mensuelles"
      icon="ri-group-line"
      onOpenChange={onOpenChange}
      isActive={isActive || hasValue}
      badge={hasValue ? 1 : undefined}
      alignEndAtWidth={992}
    >
      <MonthlyVisitsFilterContent
        minTraffic={externalMin}
        maxTraffic={externalMax}
        onMinTrafficChange={onMinTrafficChange}
        onMaxTrafficChange={onMaxTrafficChange}
        onApply={onApply}
        activePreset={activePreset}
        setActivePreset={setActivePreset}
      />
    </FilterDropdown>
  );
}
