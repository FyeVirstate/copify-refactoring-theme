"use client";

import { useState, useEffect } from "react";
import FilterDropdown, { FilterApplyButton } from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterInputGroup from "./FilterInputGroup";

interface TrafficGrowthFilterProps {
  minTrafficGrowth?: number;
  maxTrafficGrowth?: number;
  onMinTrafficGrowthChange?: (value: number | undefined) => void;
  onMaxTrafficGrowthChange?: (value: number | undefined) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: (overrideFilters?: { minTrafficGrowth?: number; maxTrafficGrowth?: number }) => void;
  isActive?: boolean;
}

export default function TrafficGrowthFilter({ 
  minTrafficGrowth: externalMin,
  maxTrafficGrowth: externalMax,
  onMinTrafficGrowthChange,
  onMaxTrafficGrowthChange,
  onOpenChange, 
  onApply, 
  isActive 
}: TrafficGrowthFilterProps) {
  const [minGrowthStr, setMinGrowthStr] = useState(externalMin?.toString() || "");
  const [maxGrowthStr, setMaxGrowthStr] = useState(externalMax?.toString() || "");
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Sync with external values and reset preset when values are cleared
  useEffect(() => {
    setMinGrowthStr(externalMin?.toString() || "");
    if (externalMin === undefined) {
      setActivePreset(null);
    }
  }, [externalMin]);
  
  useEffect(() => {
    setMaxGrowthStr(externalMax?.toString() || "");
    if (externalMax === undefined && externalMin === undefined) {
      setActivePreset(null);
    }
  }, [externalMax, externalMin]);

  const handlePresetClick = (presetId: string) => {
    // Toggle off if same preset is clicked again
    if (activePreset === presetId) {
      setActivePreset(null);
      setMinGrowthStr("");
      setMaxGrowthStr("");
      if (onMinTrafficGrowthChange) onMinTrafficGrowthChange(undefined);
      if (onMaxTrafficGrowthChange) onMaxTrafficGrowthChange(undefined);
      if (onApply) {
        onApply({ minTrafficGrowth: undefined, maxTrafficGrowth: undefined });
      }
      return;
    }
    
    setActivePreset(presetId);
    
    let newMin: number | undefined;
    let newMax: number | undefined;
    
    switch (presetId) {
      case "rapid":
        newMin = 100;
        newMax = undefined;
        break;
      case "sustained":
        newMin = 50;
        newMax = 100;
        break;
      case "upward":
        newMin = 10;
        newMax = 50;
        break;
    }
    
    setMinGrowthStr(newMin?.toString() || "");
    setMaxGrowthStr(newMax?.toString() || "");
    
    // Update parent state immediately
    if (onMinTrafficGrowthChange) onMinTrafficGrowthChange(newMin);
    if (onMaxTrafficGrowthChange) onMaxTrafficGrowthChange(newMax);
    
    // Auto-apply when preset is selected - pass values directly to avoid timing issues
    if (onApply) {
      onApply({ minTrafficGrowth: newMin, maxTrafficGrowth: newMax });
    }
  };

  const handleMinChange = (val: string) => {
    setMinGrowthStr(val);
    setActivePreset(null);
    if (onMinTrafficGrowthChange) {
      onMinTrafficGrowthChange(val ? parseInt(val) : undefined);
    }
  };

  const handleMaxChange = (val: string) => {
    setMaxGrowthStr(val);
    setActivePreset(null);
    if (onMaxTrafficGrowthChange) {
      onMaxTrafficGrowthChange(val ? parseInt(val) : undefined);
    }
  };

  const presets = [
    {
      id: "rapid",
      icon: "ri-rocket-2-line",
      title: "Mise à l'échelle rapide",
      description: "Croissance de +100%",
    },
    {
      id: "sustained",
      icon: "ri-line-chart-line",
      title: "Croissance soutenue",
      description: "Croissance de +50% à +100%",
    },
    {
      id: "upward",
      icon: "ri-arrow-up-line",
      title: "Tendance ascendante",
      description: "Croissance de +10% à +50%",
    },
  ];

  const hasValue = minGrowthStr !== "" || maxGrowthStr !== "";

  return (
    <FilterDropdown
      label="Évolution du trafic"
      icon="ri-line-chart-line"
      onOpenChange={onOpenChange}
      isActive={isActive || hasValue}
      badge={hasValue ? 1 : undefined}
    >
      <p className="fw-500 mb-2">Évolution du trafic</p>
      <p className="fs-small fw-500 mb-2 text-muted">Préréglages</p>

      <FilterPresetGrid 
        presets={presets} 
        onPresetClick={handlePresetClick}
        activePreset={activePreset}
        columns={2}
      />

      <div className="border-t border-gray-200 dark:border-gray-700 my-3" />

      <FilterInputGroup
        label="Taux de croissance (%)"
        minValue={minGrowthStr}
        maxValue={maxGrowthStr}
        onMinChange={handleMinChange}
        onMaxChange={handleMaxChange}
        minPlaceholder="Min"
        maxPlaceholder="∞"
        suffix="%"
      />
      
      <FilterApplyButton onClick={() => onApply?.()}>
        Appliquer
      </FilterApplyButton>
    </FilterDropdown>
  );
}
