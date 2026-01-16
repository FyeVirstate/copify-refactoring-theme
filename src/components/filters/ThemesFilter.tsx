"use client";

import { useState, useEffect, useCallback } from "react";
import FilterDropdown, { FilterApplyButton } from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterCheckboxList from "./FilterCheckboxList";

interface ThemesFilterProps {
  selectedThemes: string[];
  onThemesChange: (themes: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: (overrideFilters?: { themes?: string }) => void;
  isActive?: boolean;
}

interface ThemeItem {
  id: string;
  label: string;
  count?: number;
}

// Fallback themes in case API fails
const fallbackThemes: ThemeItem[] = [
  { id: "Dawn", label: "Dawn" },
  { id: "Debut", label: "Debut" },
  { id: "Impulse", label: "Impulse" },
  { id: "Prestige", label: "Prestige" },
  { id: "Sense", label: "Sense" },
  { id: "Craft", label: "Craft" },
  { id: "Refresh", label: "Refresh" },
  { id: "Symmetry", label: "Symmetry" },
  { id: "Minimal", label: "Minimal" },
  { id: "Brooklyn", label: "Brooklyn" },
];

export default function ThemesFilter({ 
  selectedThemes, 
  onThemesChange,
  onOpenChange,
  onApply,
  isActive = false
}: ThemesFilterProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [themes, setThemes] = useState<ThemeItem[]>(fallbackThemes);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch themes from API
  const fetchThemes = useCallback(async () => {
    if (hasFetched) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/themes');
      const result = await response.json();
      
      if (result.success && result.data) {
        setThemes(result.data);
        setHasFetched(true);
      }
    } catch (error) {
      console.error('Failed to fetch themes:', error);
      // Keep fallback themes on error
    } finally {
      setLoading(false);
    }
  }, [hasFetched]);

  // Fetch themes when dropdown opens for the first time
  useEffect(() => {
    if (isOpen && !hasFetched) {
      fetchThemes();
    }
  }, [isOpen, hasFetched, fetchThemes]);

  // Reset preset when selectedThemes is cleared externally
  useEffect(() => {
    if (selectedThemes.length === 0) {
      setActivePreset(null);
    }
  }, [selectedThemes]);

  const handlePresetClick = (presetId: string) => {
    // Toggle off if same preset is clicked again
    if (activePreset === presetId) {
      setActivePreset(null);
      onThemesChange([]);
      if (onApply) {
        onApply({ themes: '' });
      }
      return;
    }
    
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

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  return (
    <FilterDropdown
      label="Thèmes"
      icon="ri-color-filter-line"
      onOpenChange={handleOpenChange}
      isActive={isActive || selectedThemes.length > 0}
      badge={selectedThemes.length > 0 ? selectedThemes.length : undefined}
      alignEndAtWidth={1200}
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
      
      {loading ? (
        <div className="text-center py-4 text-muted">
          <i className="ri-loader-4-line ri-spin me-2"></i>
          Chargement des thèmes...
        </div>
      ) : (
        <FilterCheckboxList
          items={themes}
          selectedItems={selectedThemes}
          onItemsChange={(items) => {
            setActivePreset(null);
            onThemesChange(items);
          }}
          searchPlaceholder="Rechercher des thèmes..."
          showIncludeExclude={true}
          groupName="themeCheckboxes"
        />
      )}
      
      <FilterApplyButton onClick={() => onApply?.()}>
        Appliquer
      </FilterApplyButton>
    </FilterDropdown>
  );
}
