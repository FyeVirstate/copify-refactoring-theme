"use client";

import FilterDropdown from "./FilterDropdown";
import FilterCheckboxList from "./FilterCheckboxList";
import { Button } from "@/components/ui/button";

interface DomaineFilterProps {
  selectedDomains: string[];
  onDomainsChange: (domains: string[]) => void;
  onOpenChange?: (open: boolean) => void;
}

export default function DomaineFilter({ 
  selectedDomains, 
  onDomainsChange,
  onOpenChange 
}: DomaineFilterProps) {
  const domains = [
    { id: ".com", label: ".com" },
    { id: ".store", label: ".store" },
    { id: ".uk", label: ".uk" },
    { id: ".co.uk", label: ".co.uk" },
    { id: ".ch", label: ".ch" },
  ];

  return (
    <FilterDropdown
      icon="ri-links-line"
      label="Domaine"
      title="Domaine"
      width="400px"
      onOpenChange={onOpenChange}
    >
      <FilterCheckboxList
        items={domains}
        selectedItems={selectedDomains}
        onItemsChange={onDomainsChange}
        searchPlaceholder="Rechercher un domaine"
      />
      
      <Button type="button" className="btn btn-primary w-100 apply-filters-btn mt-3">
        Appliquer
      </Button>
    </FilterDropdown>
  );
}

