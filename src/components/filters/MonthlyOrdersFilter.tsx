"use client";

import { useState, useEffect } from "react";
import FilterDropdown, { useFilterDropdown, FilterApplyButton } from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterInputGroup from "./FilterInputGroup";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

interface MonthlyOrdersFilterProps {
  minOrders?: number;
  maxOrders?: number;
  onMinOrdersChange?: (value: number | undefined) => void;
  onMaxOrdersChange?: (value: number | undefined) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: (overrideFilters?: { minOrders?: number; maxOrders?: number }) => void;
  isActive?: boolean;
}

function MonthlyOrdersFilterContent({ 
  minOrders: externalMin,
  maxOrders: externalMax,
  onMinOrdersChange,
  onMaxOrdersChange,
  onApply,
}: Omit<MonthlyOrdersFilterProps, 'onOpenChange' | 'isActive'>) {
  const [minOrdersStr, setMinOrdersStr] = useState(externalMin?.toString() || "");
  const [maxOrdersStr, setMaxOrdersStr] = useState(externalMax?.toString() || "");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const dropdownContext = useFilterDropdown();

  useEffect(() => {
    setMinOrdersStr(externalMin?.toString() || "");
    if (externalMin === undefined) {
      setActivePreset(null);
    }
  }, [externalMin]);
  
  useEffect(() => {
    setMaxOrdersStr(externalMax?.toString() || "");
    if (externalMax === undefined && externalMin === undefined) {
      setActivePreset(null);
    }
  }, [externalMax, externalMin]);

  const handlePresetClick = (presetId: string) => {
    setActivePreset(presetId);
    
    let newMin: number | undefined;
    let newMax: number | undefined;
    
    switch (presetId) {
      case "new":
        newMin = 0;
        newMax = 500;
        break;
      case "rising":
        newMin = 500;
        newMax = 2000;
        break;
      case "established":
        newMin = 2000;
        newMax = 10000;
        break;
      case "dominant":
        newMin = 10000;
        newMax = undefined;
        break;
    }
    
    setMinOrdersStr(newMin?.toString() || "");
    setMaxOrdersStr(newMax?.toString() || "");
    
    if (onMinOrdersChange) onMinOrdersChange(newMin);
    if (onMaxOrdersChange) onMaxOrdersChange(newMax);
    
    if (onApply) {
      onApply({ minOrders: newMin, maxOrders: newMax });
    }
    
    dropdownContext?.closeDropdown();
  };

  const handleMinChange = (val: string) => {
    setMinOrdersStr(val);
    setActivePreset(null);
    if (onMinOrdersChange) {
      onMinOrdersChange(val ? parseInt(val) : undefined);
    }
  };

  const handleMaxChange = (val: string) => {
    setMaxOrdersStr(val);
    setActivePreset(null);
    if (onMaxOrdersChange) {
      onMaxOrdersChange(val ? parseInt(val) : undefined);
    }
  };

  const presets = [
    {
      id: "new",
      icon: "ri-seedling-line",
      title: "Nouveaux",
      description: "0 - 500 commandes/mois",
    },
    {
      id: "rising",
      icon: "ri-star-line",
      title: "Étoiles montantes",
      description: "500 - 2,000 commandes/mois",
    },
    {
      id: "established",
      icon: "ri-building-2-line",
      title: "Établis",
      description: "2,000 - 10,000 commandes/mois",
    },
    {
      id: "dominant",
      icon: "ri-vip-crown-2-line",
      title: "Dominants",
      description: "10,000+ commandes/mois",
    },
  ];

  return (
    <>
      <p className="fw-500 mb-2">Commandes mensuelles</p>
      <p className="fs-small fw-500 mb-2 text-muted">Préréglages</p>

      <FilterPresetGrid 
        presets={presets} 
        onPresetClick={handlePresetClick}
        activePreset={activePreset}
        columns={2}
      />
      
      <div className="border-t border-gray-200 dark:border-gray-700 my-3" />
      
      <FilterInputGroup
        label="Nombre de commandes par mois"
        minValue={minOrdersStr}
        maxValue={maxOrdersStr}
        onMinChange={handleMinChange}
        onMaxChange={handleMaxChange}
        minPlaceholder="Min"
        maxPlaceholder="∞"
      />
      
      <FilterApplyButton onClick={() => onApply?.()} />
    </>
  );
}

export default function MonthlyOrdersFilter({ 
  minOrders: externalMin,
  maxOrders: externalMax,
  onMinOrdersChange,
  onMaxOrdersChange,
  onOpenChange, 
  onApply, 
  isActive 
}: MonthlyOrdersFilterProps) {
  const isMobile = useIsMobile();
  const hasValue = externalMin !== undefined || externalMax !== undefined;

  return (
    <FilterDropdown
      label={isMobile ? "Commandes" : "Commandes mensuelles"}
      icon="ri-shopping-cart-line"
      onOpenChange={onOpenChange}
      isActive={isActive || hasValue}
      badge={hasValue ? 1 : undefined}
      alignEndAtWidth={1200}
    >
      <MonthlyOrdersFilterContent
        minOrders={externalMin}
        maxOrders={externalMax}
        onMinOrdersChange={onMinOrdersChange}
        onMaxOrdersChange={onMaxOrdersChange}
        onApply={onApply}
      />
    </FilterDropdown>
  );
}
