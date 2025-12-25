"use client";

import FilterDropdown from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterCheckboxList from "./FilterCheckboxList";
import { Button } from "@/components/ui/button";

interface ThemesFilterProps {
  selectedThemes: string[];
  onThemesChange: (themes: string[]) => void;
  onOpenChange?: (open: boolean) => void;
}

export default function ThemesFilter({ 
  selectedThemes, 
  onThemesChange,
  onOpenChange 
}: ThemesFilterProps) {
  const presets = [
    {
      id: "paid",
      icon: "ri-money-dollar-circle-line",
      title: "Payant",
    },
    {
      id: "free",
      icon: "ri-gift-line",
      title: "Gratuit",
    },
  ];

  const themes = [
    { id: "trademark", label: "trademark" },
    { id: "dawn", label: "dawn" },
    { id: "rise", label: "rise" },
    { id: "impulse", label: "impulse" },
    { id: "refresh", label: "refresh" },
  ];

  return (
    <FilterDropdown
      icon="ri-palette-line"
      label="Thèmes"
      title="Thèmes"
      width="400px"
      onOpenChange={onOpenChange}
    >
      <FilterPresetGrid presets={presets} columns={2} />
      
      <div className="horizontal-dashed-divider mb-3"></div>
      
      <FilterCheckboxList
        items={themes}
        selectedItems={selectedThemes}
        onItemsChange={onThemesChange}
        searchPlaceholder="Rechercher des thèmes"
      />
      
      <Button type="button" className="btn btn-primary w-100 apply-filters-btn mt-3">
        Appliquer
      </Button>
    </FilterDropdown>
  );
}

