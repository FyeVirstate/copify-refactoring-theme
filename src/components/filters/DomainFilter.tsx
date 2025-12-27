"use client";

import FilterDropdown from "./FilterDropdown";
import FilterCheckboxList from "./FilterCheckboxList";
import { Button } from "@/components/ui/button";

interface DomainFilterProps {
  selectedDomains: string[];
  onDomainsChange: (domains: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: () => void;
  isActive?: boolean;
}

const allDomains = [
  { id: ".com", label: ".com" },
  { id: ".store", label: ".store" },
  { id: ".shop", label: ".shop" },
  { id: ".co", label: ".co" },
  { id: ".net", label: ".net" },
  { id: ".io", label: ".io" },
  { id: ".uk", label: ".uk" },
  { id: ".co.uk", label: ".co.uk" },
  { id: ".au", label: ".au" },
  { id: ".ca", label: ".ca" },
  { id: ".de", label: ".de" },
  { id: ".fr", label: ".fr" },
  { id: ".es", label: ".es" },
  { id: ".it", label: ".it" },
  { id: ".nl", label: ".nl" },
  { id: ".be", label: ".be" },
  { id: ".ch", label: ".ch" },
  { id: ".at", label: ".at" },
  { id: ".se", label: ".se" },
  { id: ".no", label: ".no" },
  { id: ".dk", label: ".dk" },
  { id: ".pl", label: ".pl" },
  { id: ".pt", label: ".pt" },
  { id: ".nz", label: ".nz" },
  { id: ".ie", label: ".ie" },
];

export default function DomainFilter({ 
  selectedDomains, 
  onDomainsChange,
  onOpenChange,
  onApply,
  isActive = false
}: DomainFilterProps) {

  return (
    <FilterDropdown
      label="Domaine"
      icon="ri-link"
      onOpenChange={onOpenChange}
      isActive={isActive || selectedDomains.length > 0}
      badge={selectedDomains.length > 0 ? selectedDomains.length : undefined}
    >
      <p className="fw-500 mb-2">Domaine</p>

      <FilterCheckboxList
        items={allDomains}
        selectedItems={selectedDomains}
        onItemsChange={onDomainsChange}
        searchPlaceholder="Rechercher un domaine..."
        showIncludeExclude={true}
        groupName="domainCheckboxes"
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
