"use client";

import { useState } from "react";
import FilterDropdown from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterInputGroup from "./FilterInputGroup";
import { Button } from "@/components/ui/button";

interface ProduitsFilterProps {
  onOpenChange?: (open: boolean) => void;
}

export default function ProduitsFilter({ onOpenChange }: ProduitsFilterProps) {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minCatalog, setMinCatalog] = useState("");
  const [maxCatalog, setMaxCatalog] = useState("");

  const presets = [
    {
      id: "low-price",
      icon: "ri-money-dollar-circle-line",
      title: "Prix bas",
      description: "Moins de $80",
    },
    {
      id: "small-catalog",
      icon: "ri-store-3-line",
      title: "Petit catalogue",
      description: "Moins de 50 articles",
    },
    {
      id: "high-price",
      icon: "ri-money-dollar-circle-line",
      title: "Prix élevé",
      description: "$100 et plus",
    },
    {
      id: "large-catalog",
      icon: "ri-store-3-line",
      title: "Grand catalogue",
      description: "50 articles et plus",
    },
  ];

  return (
    <FilterDropdown
      icon="ri-price-tag-3-line"
      label="Produits"
      title="Produits"
      width="400px"
      onOpenChange={onOpenChange}
    >
      <FilterPresetGrid presets={presets} columns={2} />
      
      <div className="horizontal-dashed-divider mb-3"></div>
      
      <div className="row g-3 mb-3">
        <div className="col-6">
          <FilterInputGroup
            label="Prix moyen"
            minValue={minPrice}
            maxValue={maxPrice}
            onMinChange={setMinPrice}
            onMaxChange={setMaxPrice}
            minPlaceholder="Min"
            maxPlaceholder="Max"
          />
        </div>
        <div className="col-6">
          <FilterInputGroup
            label="Taille du catalogue"
            minValue={minCatalog}
            maxValue={maxCatalog}
            onMinChange={setMinCatalog}
            onMaxChange={setMaxCatalog}
            minPlaceholder="Min"
            maxPlaceholder="Max"
          />
        </div>
      </div>
      
      <Button type="button" className="btn btn-primary w-100 apply-filters-btn">
        Appliquer
      </Button>
    </FilterDropdown>
  );
}

