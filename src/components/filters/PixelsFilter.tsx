"use client";

import { useState, useEffect } from "react";
import FilterDropdown from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterCheckboxList from "./FilterCheckboxList";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface PixelsFilterProps {
  selectedPixels: string[];
  onPixelsChange: (pixels: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: (overrideFilters?: { pixels?: string }) => void;
  isActive?: boolean;
}

const allPixels = [
  { id: "TikTok", label: "TikTok", logo: "/img/socials/tiktok.svg" },
  { id: "Snapchat", label: "Snapchat", logo: "/img/socials/snapchat.svg" },
  { id: "Facebook", label: "Facebook", logo: "/img/socials/facebook.svg" },
  { id: "Instagram", label: "Instagram", logo: "/img/socials/instagram.svg" },
  { id: "Google", label: "Google", logo: "/img/socials/google.svg" },
  { id: "Twitter", label: "Twitter", logo: "/img/socials/twitter-x-line.svg" },
  { id: "Pinterest", label: "Pinterest", logo: "/img/socials/pinterest.svg" },
  { id: "Reddit", label: "Reddit", logo: "/img/socials/reddit.svg" },
  { id: "TripleWhale", label: "Triple Whale", logo: "/img/socials/triple-whale.svg" },
  { id: "Applovin", label: "Applovin", logo: "/img/socials/applovin.svg" },
];

export default function PixelsFilter({ 
  selectedPixels, 
  onPixelsChange,
  onOpenChange,
  onApply,
  isActive = false
}: PixelsFilterProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Reset preset when selectedPixels is cleared externally
  useEffect(() => {
    if (selectedPixels.length === 0) {
      setActivePreset(null);
    }
  }, [selectedPixels]);

  const handlePresetClick = (presetId: string) => {
    let newPixels: string[] = [];
    
    switch (presetId) {
      case "social-ads":
        newPixels = ["TikTok", "Facebook", "Instagram", "Snapchat"];
        break;
      case "search-display":
        newPixels = ["Google"];
        break;
      case "emerging":
        newPixels = ["Pinterest", "Twitter", "Reddit", "Snapchat"];
        break;
      case "main-platforms":
        newPixels = ["Google", "Facebook", "Instagram"];
        break;
    }
    
    setActivePreset(presetId);
    onPixelsChange(newPixels);
    
    // Auto-apply when preset is selected - pass values directly to avoid timing issues
    if (onApply) {
      onApply({ pixels: newPixels.join(',') });
    }
  };

  const presets = [
    {
      id: "social-ads",
      icon: "ri-rss-line",
      title: "Social Ads",
      description: "TikTok, Facebook, Instagram, Snapchat",
    },
    {
      id: "search-display",
      icon: "ri-search-line",
      title: "Search & Display",
      description: "Google",
    },
    {
      id: "emerging",
      icon: "ri-funds-line",
      title: "Canaux émergents",
      description: "Pinterest, Twitter, Reddit, Snapchat",
    },
    {
      id: "main-platforms",
      icon: "ri-verified-badge-line",
      title: "Plateformes principales",
      description: "Google, Facebook, Instagram",
    },
  ];

  const pixelsWithIcons = allPixels.map(pixel => ({
    ...pixel,
    icon: (
      <Image 
        src={pixel.logo} 
        alt={pixel.label} 
        width={20} 
        height={20}
        className="rounded"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    )
  }));

  return (
    <FilterDropdown
      label="Pixels"
      icon="ri-route-line"
      onOpenChange={onOpenChange}
      isActive={isActive || selectedPixels.length > 0}
      badge={selectedPixels.length > 0 ? selectedPixels.length : undefined}
    >
      <p className="fw-500 mb-2">Pixels</p>
      <p className="fs-small fw-500 mb-2 text-muted">Préréglages</p>

      <FilterPresetGrid 
        presets={presets} 
        onPresetClick={handlePresetClick}
        activePreset={activePreset}
        columns={2}
      />

      <div className="border-t border-gray-200 dark:border-gray-700 my-3" />

      <FilterCheckboxList
        items={pixelsWithIcons}
        selectedItems={selectedPixels}
        onItemsChange={(items) => {
          setActivePreset(null);
          onPixelsChange(items);
        }}
        searchPlaceholder="Rechercher des pixels..."
        showIncludeExclude={true}
        groupName="pixelsCheckboxes"
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
