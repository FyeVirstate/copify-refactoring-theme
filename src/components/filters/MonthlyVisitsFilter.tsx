"use client";

import { useState } from "react";
import FilterDropdown from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterInputGroup from "./FilterInputGroup";
import { Button } from "@/components/ui/button";

interface VisitesMensuellesFilterProps {
  onOpenChange?: (open: boolean) => void;
}

export default function VisitesMensuellesFilter({ onOpenChange }: VisitesMensuellesFilterProps) {
  const [minVisits, setMinVisits] = useState("");
  const [maxVisits, setMaxVisits] = useState("");

  const presets = [
    {
      id: "test",
      icon: "ri-test-tube-line",
      title: "Test",
      description: "Entre 1K et 50K",
    },
    {
      id: "scaling",
      icon: "ri-rocket-line",
      title: "Mise à l'échelle",
      description: "50K et plus",
    },
  ];

  return (
    <FilterDropdown
      icon="ri-group-line"
      label="Visites mensuelles"
      title="Visites mensuelles"
      width="400px"
      onOpenChange={onOpenChange}
    >
      <FilterPresetGrid presets={presets} columns={2} />
      
      <div className="horizontal-dashed-divider mb-3"></div>
      
      <FilterInputGroup
        label="Nombre de visites par mois"
        minValue={minVisits}
        maxValue={maxVisits}
        onMinChange={setMinVisits}
        onMaxChange={setMaxVisits}
        minPlaceholder="Min"
        maxPlaceholder="∞"
      />
      
      <Button type="button" className="btn btn-primary w-100 apply-filters-btn">
        Appliquer les filtres
      </Button>
    </FilterDropdown>
  );
}

