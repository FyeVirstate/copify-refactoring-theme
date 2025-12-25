"use client";

import FilterDropdown from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterCheckboxList from "./FilterCheckboxList";
import { Button } from "@/components/ui/button";

interface LangueFilterProps {
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: () => void;
  isActive?: boolean;
}

export default function LangueFilter({ 
  selectedLanguages, 
  onLanguagesChange,
  onOpenChange,
  onApply,
  isActive 
}: LangueFilterProps) {
  const presets = [
    {
      id: "main-languages",
      icon: "ri-global-line",
      title: "Langues principales",
      description: "Anglais, Français, Espagnol, Allemand",
    },
    {
      id: "eu-non-english",
      icon: "ri-euro-line",
      title: "Européen non-anglophone",
      description: "Français, Espagnol, Allemand, Polonais, Norvégien ...",
    },
    {
      id: "non-alphabetic",
      icon: "ri-translate-2",
      title: "Langues non alphabétiques",
      description: "Chinois, Japonais, Arabe..",
    },
  ];

  const languages = [
    { id: "English", label: "English" },
    { id: "Spanish", label: "Spanish" },
    { id: "French", label: "French" },
    { id: "German", label: "German" },
    { id: "Norwegian", label: "Norwegian" },
  ];

  const handleApply = () => {
    if (onApply) {
      onApply();
    }
  };

  return (
    <FilterDropdown
      icon="ri-translate"
      label="Langue"
      title="Langue"
      width="400px"
      onOpenChange={onOpenChange}
      isActive={isActive || selectedLanguages.length > 0}
    >
      <FilterPresetGrid presets={presets} columns={2} />
      
      <div className="horizontal-dashed-divider mb-3"></div>
      
      <FilterCheckboxList
        items={languages}
        selectedItems={selectedLanguages}
        onItemsChange={onLanguagesChange}
        searchPlaceholder="Rechercher des langues"
      />
      
      <Button 
        type="button" 
        className="btn btn-primary w-100 apply-filters-btn mt-3"
        onClick={handleApply}
      >
        Appliquer
      </Button>
    </FilterDropdown>
  );
}
