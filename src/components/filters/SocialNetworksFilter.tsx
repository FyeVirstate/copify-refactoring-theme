"use client";

import FilterDropdown from "./FilterDropdown";
import FilterCheckboxList from "./FilterCheckboxList";
import { Button } from "@/components/ui/button";

interface ReseauxSociauxFilterProps {
  selectedSocialNetworks: string[];
  onSocialNetworksChange: (networks: string[]) => void;
  onOpenChange?: (open: boolean) => void;
}

export default function ReseauxSociauxFilter({ 
  selectedSocialNetworks, 
  onSocialNetworksChange,
  onOpenChange 
}: ReseauxSociauxFilterProps) {
  const socialNetworks = [
    { id: "Facebook", label: "Facebook" },
    { id: "Instagram", label: "Instagram" },
    { id: "TikTok", label: "TikTok" },
    { id: "YouTube", label: "YouTube" },
    { id: "Pinterest", label: "Pinterest" },
    { id: "Twitter", label: "Twitter" },
  ];

  return (
    <FilterDropdown
      icon="ri-share-line"
      label="Réseaux sociaux"
      title="Réseaux sociaux"
      width="400px"
      onOpenChange={onOpenChange}
    >
      <FilterCheckboxList
        items={socialNetworks}
        selectedItems={selectedSocialNetworks}
        onItemsChange={onSocialNetworksChange}
        searchPlaceholder="Rechercher des réseaux..."
      />
      
      <Button type="button" className="btn btn-primary w-100 apply-filters-btn mt-3">
        Appliquer
      </Button>
    </FilterDropdown>
  );
}

