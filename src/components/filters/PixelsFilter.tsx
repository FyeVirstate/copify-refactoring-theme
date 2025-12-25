"use client";

import FilterDropdown from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterCheckboxList from "./FilterCheckboxList";
import { Button } from "@/components/ui/button";

interface PixelsFilterProps {
  selectedPixels: string[];
  onPixelsChange: (pixels: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: () => void;
  isActive?: boolean;
}

export default function PixelsFilter({ 
  selectedPixels, 
  onPixelsChange,
  onOpenChange,
  onApply,
  isActive = false
}: PixelsFilterProps) {
  const handlePresetClick = (presetId: string) => {
    switch (presetId) {
      case "social-ads":
        onPixelsChange(["TikTok", "Facebook", "Instagram", "Snapchat"]);
        break;
      case "search-display":
        onPixelsChange(["Google"]);
        break;
      case "emerging":
        onPixelsChange(["Pinterest", "Twitter", "Reddit", "Snapchat"]);
        break;
      case "main-platform":
        onPixelsChange(["Facebook", "Instagram", "Google"]);
        break;
    }
  };

  const presets = [
    {
      id: "social-ads",
      icon: "ri-group-line",
      title: "Publicités sociales",
      description: "Tiktok, Meta, Snapchat ...",
      onClick: () => handlePresetClick("social-ads"),
    },
    {
      id: "search-display",
      icon: "ri-search-line",
      title: "Recherche et Display",
      description: "Google",
      onClick: () => handlePresetClick("search-display"),
    },
    {
      id: "emerging",
      icon: "ri-notification-badge-line",
      title: "Canaux émergents",
      description: "Pinterest, Twitter, Reddit, Snapchat",
      onClick: () => handlePresetClick("emerging"),
    },
    {
      id: "main-platform",
      icon: "ri-check-line",
      title: "Plateforme principale",
      description: "Meta, Google",
      onClick: () => handlePresetClick("main-platform"),
    },
  ];

  const pixels = [
    { id: "TikTok", label: "TikTok" },
    { id: "Snapchat", label: "Snapchat" },
    { id: "Facebook", label: "Facebook" },
    { id: "Instagram", label: "Instagram" },
    { id: "Google", label: "Google" },
  ];

  return (
    <FilterDropdown
      icon="ri-focus-3-line"
      label="Pixels"
      title="Pixels"
      width="400px"
      onOpenChange={onOpenChange}
      isActive={isActive}
    >
      <FilterPresetGrid presets={presets} columns={2} />
      
      <div className="horizontal-dashed-divider mb-3"></div>
      
      <FilterCheckboxList
        items={pixels}
        selectedItems={selectedPixels}
        onItemsChange={onPixelsChange}
        searchPlaceholder="Rechercher des plateformes"
      />
      
      <Button 
        type="button" 
        className="btn btn-primary w-100 apply-filters-btn mt-3"
        onClick={() => {
          onApply?.();
          onOpenChange?.(false);
        }}
      >
        Appliquer
      </Button>
    </FilterDropdown>
  );
}

