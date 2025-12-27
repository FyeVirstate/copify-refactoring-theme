"use client";

import { useState, useEffect } from "react";
import FilterDropdown from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterCheckboxList from "./FilterCheckboxList";
import { Button } from "@/components/ui/button";

interface ThemesFilterProps {
  selectedThemes: string[];
  onThemesChange: (themes: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: (overrideFilters?: { themes?: string }) => void;
  isActive?: boolean;
}

const allThemes = [
  { id: "Dawn", label: "Dawn" },
  { id: "Debut", label: "Debut" },
  { id: "Impulse", label: "Impulse" },
  { id: "Prestige", label: "Prestige" },
  { id: "Trademark", label: "Trademark" },
  { id: "Rise", label: "Rise" },
  { id: "Refresh", label: "Refresh" },
  { id: "Sense", label: "Sense" },
  { id: "Craft", label: "Craft" },
  { id: "Crave", label: "Crave" },
  { id: "Colorblock", label: "Colorblock" },
  { id: "Ride", label: "Ride" },
  { id: "Taste", label: "Taste" },
  { id: "Studio", label: "Studio" },
  { id: "Publisher", label: "Publisher" },
  { id: "Symmetry", label: "Symmetry" },
  { id: "Minimal", label: "Minimal" },
  { id: "Brooklyn", label: "Brooklyn" },
  { id: "Narrative", label: "Narrative" },
  { id: "Venture", label: "Venture" },
  { id: "Supply", label: "Supply" },
  { id: "Simple", label: "Simple" },
  { id: "Express", label: "Express" },
  { id: "Boundless", label: "Boundless" },
];

export default function ThemesFilter({ 
  selectedThemes, 
  onThemesChange,
  onOpenChange,
  onApply,
  isActive = false
}: ThemesFilterProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Reset preset when selectedThemes is cleared externally
  useEffect(() => {
    if (selectedThemes.length === 0) {
      setActivePreset(null);
    }
  }, [selectedThemes]);

  const handlePresetClick = (presetId: string) => {
    let newThemes: string[] = [];
    
    switch (presetId) {
      case "paid":
        newThemes = ["Impulse", "Prestige", "Trademark", "Symmetry"];
        break;
      case "free":
        newThemes = ["Dawn", "Debut", "Minimal", "Simple", "Boundless"];
        break;
    }
    
    setActivePreset(presetId);
    onThemesChange(newThemes);
    
    // Auto-apply when preset is selected - pass values directly to avoid timing issues
    if (onApply) {
      onApply({ themes: newThemes.join(',') });
    }
  };

  const presets = [
    {
      id: "paid",
      icon: "ri-money-dollar-circle-line",
      title: "Payant",
      description: "Impulse, Prestige, Trademark...",
    },
    {
      id: "free",
      icon: "ri-creative-commons-nc-line",
      title: "Gratuit",
      description: "Dawn, Debut, Minimal...",
    },
  ];

  return (
    <FilterDropdown
      label="Thèmes"
      icon="ri-color-filter-line"
      onOpenChange={onOpenChange}
      isActive={isActive || selectedThemes.length > 0}
      badge={selectedThemes.length > 0 ? selectedThemes.length : undefined}
    >
      <p className="fw-500 mb-2">Thèmes</p>
      <p className="fs-small fw-500 mb-2 text-muted">Préréglages</p>

      <FilterPresetGrid 
        presets={presets} 
        onPresetClick={handlePresetClick}
        activePreset={activePreset}
        columns={2}
      />

      <div className="border-t border-gray-200 dark:border-gray-700 my-3" />

      <FilterCheckboxList
        items={allThemes}
        selectedItems={selectedThemes}
        onItemsChange={(items) => {
          setActivePreset(null);
          onThemesChange(items);
        }}
        searchPlaceholder="Rechercher des thèmes..."
        showIncludeExclude={true}
        groupName="themeCheckboxes"
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
