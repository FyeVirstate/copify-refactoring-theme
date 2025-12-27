"use client";

import { useState, useEffect } from "react";
import FilterDropdown from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterCheckboxList from "./FilterCheckboxList";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface LanguageFilterProps {
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: (overrideFilters?: { languages?: string }) => void;
  isActive?: boolean;
}

// Language to flag mapping
const languageFlags: Record<string, string> = {
  "English": "gb",
  "French": "fr",
  "Spanish": "es",
  "German": "de",
  "Italian": "it",
  "Portuguese": "pt",
  "Dutch": "nl",
  "Polish": "pl",
  "Norwegian": "no",
  "Swedish": "se",
  "Danish": "dk",
  "Finnish": "fi",
  "Chinese": "cn",
  "Japanese": "jp",
  "Korean": "kr",
  "Arabic": "sa",
  "Russian": "ru",
  "Turkish": "tr",
  "Hindi": "in",
  "Thai": "th",
  "Vietnamese": "vn",
  "Indonesian": "id",
  "Greek": "gr",
  "Czech": "cz",
  "Hungarian": "hu",
  "Romanian": "ro",
};

const allLanguages = [
  "English", "French", "Spanish", "German", "Italian", "Portuguese",
  "Dutch", "Polish", "Norwegian", "Swedish", "Danish", "Finnish",
  "Chinese", "Japanese", "Korean", "Arabic", "Russian", "Turkish",
  "Hindi", "Thai", "Vietnamese", "Indonesian", "Greek", "Czech",
  "Hungarian", "Romanian"
];

export default function LanguageFilter({ 
  selectedLanguages, 
  onLanguagesChange,
  onOpenChange,
  onApply,
  isActive = false
}: LanguageFilterProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Reset preset when selectedLanguages is cleared externally
  useEffect(() => {
    if (selectedLanguages.length === 0) {
      setActivePreset(null);
    }
  }, [selectedLanguages]);

  const handlePresetClick = (presetId: string) => {
    let newLanguages: string[] = [];
    
    switch (presetId) {
      case "main":
        newLanguages = ["English", "French", "Spanish", "German"];
        break;
      case "european-non-english":
        newLanguages = ["French", "Spanish", "German", "Polish", "Norwegian", "Italian", "Portuguese"];
        break;
      case "non-alphabetic":
        newLanguages = ["Chinese", "Japanese", "Arabic", "Korean", "Thai"];
        break;
    }
    
    setActivePreset(presetId);
    onLanguagesChange(newLanguages);
    
    // Auto-apply when preset is selected - pass values directly to avoid timing issues
    if (onApply) {
      onApply({ languages: newLanguages.join(',') });
    }
  };

  const presets = [
    {
      id: "main",
      icon: "ri-verified-badge-line",
      title: "Langues principales",
      description: "Anglais, Français, Espagnol, Allemand",
    },
    {
      id: "european-non-english",
      icon: "ri-money-euro-circle-line",
      title: "Européen non-anglophone",
      description: "Français, Espagnol, Allemand, Polonais...",
    },
    {
      id: "non-alphabetic",
      icon: "ri-earth-line",
      title: "Langues non alphabétiques",
      description: "Chinois, Japonais, Arabe...",
    },
  ];

  const languagesWithFlags = allLanguages.map(lang => ({
    id: lang,
    label: lang,
    icon: languageFlags[lang] ? (
      <Image 
        src={`/flags/${languageFlags[lang]}.svg`} 
        alt={lang} 
        width={20} 
        height={15}
        className="rounded"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    ) : undefined
  }));

  return (
    <FilterDropdown
      label="Langue"
      icon="ri-translate-2"
      onOpenChange={onOpenChange}
      isActive={isActive || selectedLanguages.length > 0}
      badge={selectedLanguages.length > 0 ? selectedLanguages.length : undefined}
    >
      <p className="fw-500 mb-2">Langue</p>
      <p className="fs-small fw-500 mb-2 text-muted">Préréglages</p>

      <FilterPresetGrid 
        presets={presets} 
        onPresetClick={handlePresetClick}
        activePreset={activePreset}
        columns={2}
      />
      
      <div className="border-t border-gray-200 dark:border-gray-700 my-3" />
      
      <FilterCheckboxList
        items={languagesWithFlags}
        selectedItems={selectedLanguages}
        onItemsChange={(items) => {
          setActivePreset(null);
          onLanguagesChange(items);
        }}
        searchPlaceholder="Rechercher une langue..."
        showIncludeExclude={true}
        groupName="languageCheckboxes"
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
