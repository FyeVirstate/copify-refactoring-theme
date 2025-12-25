"use client";

import FilterDropdown from "./FilterDropdown";
import FilterCheckboxList from "./FilterCheckboxList";
import { Button } from "@/components/ui/button";

interface ApplicationsFilterProps {
  selectedApplications: string[];
  onApplicationsChange: (applications: string[]) => void;
  onOpenChange?: (open: boolean) => void;
}

export default function ApplicationsFilter({ 
  selectedApplications, 
  onApplicationsChange,
  onOpenChange 
}: ApplicationsFilterProps) {
  const applications = [
    { id: "Klaviyo", label: "Klaviyo" },
    { id: "Loox", label: "Loox" },
    { id: "Judge.me", label: "Judge.me" },
    { id: "Vitals", label: "Vitals" },
  ];

  return (
    <FilterDropdown
      icon="ri-apps-line"
      label="Applications"
      title="Applications"
      width="400px"
      onOpenChange={onOpenChange}
    >
      <FilterCheckboxList
        items={applications}
        selectedItems={selectedApplications}
        onItemsChange={onApplicationsChange}
        searchPlaceholder="Rechercher des applications"
      />
      
      <Button type="button" className="btn btn-primary w-100 apply-filters-btn mt-3">
        Appliquer
      </Button>
    </FilterDropdown>
  );
}

