"use client";

import { useState } from "react";
import FilterDropdown from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterInputGroup from "./FilterInputGroup";
import { Button } from "@/components/ui/button";

interface RevenuQuotidienFilterProps {
  onOpenChange?: (open: boolean) => void;
}

export default function RevenuQuotidienFilter({ onOpenChange }: RevenuQuotidienFilterProps) {
  const [minRevenue, setMinRevenue] = useState("");
  const [maxRevenue, setMaxRevenue] = useState("");

  const presets = [
    {
      id: "club-1k",
      icon: "ri-copper-diamond-line",
      title: "Club 1k par jour",
      description: "1 000 $/jour (~30k $/mois)",
    },
    {
      id: "club-3k",
      icon: "ri-star-line",
      title: "Club 3k par jour",
      description: "3 000 $/jour (~90k $/mois)",
    },
    {
      id: "club-5k",
      icon: "ri-thumb-up-line",
      title: "Club 5k par jour",
      description: "5 000 $/jour (~150k $/mois)",
    },
    {
      id: "six-figures",
      icon: "ri-trophy-line",
      title: "Boutique à 6 chiffres",
      description: "10k+ $/jour (~300k+ $/mois)",
    },
  ];

  return (
    <FilterDropdown
      icon="ri-money-dollar-circle-line"
      label="Revenu quotidien"
      title="Revenu quotidien"
      width="400px"
      onOpenChange={onOpenChange}
    >
      <FilterPresetGrid presets={presets} columns={2} />
      
      <div className="horizontal-dashed-divider mb-3"></div>
      
      <FilterInputGroup
        label="Revenu quotidien moyen"
        minValue={minRevenue}
        maxValue={maxRevenue}
        onMinChange={setMinRevenue}
        onMaxChange={setMaxRevenue}
      />
      
      <Button type="button" className="btn btn-primary w-100 apply-filters-btn">
        Appliquer les filtres
      </Button>
    </FilterDropdown>
  );
}

