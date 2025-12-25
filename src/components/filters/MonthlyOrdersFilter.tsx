"use client";

import { useState } from "react";
import FilterDropdown from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterInputGroup from "./FilterInputGroup";
import { Button } from "@/components/ui/button";

interface CommandesMensuellesFilterProps {
  onOpenChange?: (open: boolean) => void;
}

export default function CommandesMensuellesFilter({ onOpenChange }: CommandesMensuellesFilterProps) {
  const [minOrders, setMinOrders] = useState("");
  const [maxOrders, setMaxOrders] = useState("");

  const presets = [
    {
      id: "new",
      icon: "ri-seedling-line",
      title: "Nouveaux",
      description: "0 - 500 commandes par mois",
    },
    {
      id: "rising",
      icon: "ri-star-line",
      title: "Étoiles montantes",
      description: "500 - 5K commandes par mois",
    },
    {
      id: "established",
      icon: "ri-thumb-up-line",
      title: "Acteurs établis",
      description: "5K - 20K commandes par mois",
    },
    {
      id: "leaders",
      icon: "ri-trophy-line",
      title: "Leaders du marché",
      description: "20K+ commandes par mois",
    },
  ];

  return (
    <FilterDropdown
      icon="ri-shopping-cart-line"
      label="Commandes mensuelles"
      title="Commandes mensuelles"
      width="400px"
      onOpenChange={onOpenChange}
    >
      <FilterPresetGrid presets={presets} columns={2} />
      
      <div className="horizontal-dashed-divider mb-3"></div>
      
      <FilterInputGroup
        label="Nombre de commandes par mois"
        minValue={minOrders}
        maxValue={maxOrders}
        onMinChange={setMinOrders}
        onMaxChange={setMaxOrders}
      />
      
      <Button type="button" className="btn btn-primary w-100 apply-filters-btn">
        Appliquer les filtres
      </Button>
    </FilterDropdown>
  );
}

