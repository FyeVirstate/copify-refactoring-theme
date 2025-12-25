"use client";

import { useState } from "react";
import FilterDropdown from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterInputGroup from "./FilterInputGroup";
import { Button } from "@/components/ui/button";

interface PublicitesActivesFilterProps {
  onOpenChange?: (open: boolean) => void;
}

export default function PublicitesActivesFilter({ onOpenChange }: PublicitesActivesFilterProps) {
  const [minActive, setMinActive] = useState("");
  const [maxActive, setMaxActive] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");

  const presets = [
    {
      id: "test",
      icon: "ri-test-tube-line",
      title: "Test",
      description: "5 - 10 publicités actives",
    },
    {
      id: "scaling",
      icon: "ri-rocket-line",
      title: "Mise à l'échelle",
      description: "50 - 100 publicités actives",
    },
    {
      id: "validation",
      icon: "ri-checkbox-circle-line",
      title: "Validation",
      description: "10 - 50 publicités actives",
    },
    {
      id: "confirmed",
      icon: "ri-check-double-line",
      title: "Confirmé",
      description: "100+ publicités actives",
    },
  ];

  const periods = [
    "Dernières 24h",
    "Derniers 3 jours",
    "Derniers 7 jours",
    "Derniers 30 jours",
    "Derniers 3 mois",
    "Derniers 6 mois",
    "Dernière année"
  ];

  return (
    <FilterDropdown
      icon="ri-megaphone-line"
      label="Publicités actives"
      title="Produits"
      width="400px"
      onOpenChange={onOpenChange}
    >
      <FilterPresetGrid presets={presets} columns={2} />
      
      <div className="horizontal-dashed-divider mb-3"></div>
      
      <div className="row g-3 mb-3">
        <div className="col-6">
          <FilterInputGroup
            label="Publicités actives"
            minValue={minActive}
            maxValue={maxActive}
            onMinChange={setMinActive}
            onMaxChange={setMaxActive}
          />
        </div>
        <div className="col-6">
          <FilterInputGroup
            label="Publicités totales"
            minValue={minTotal}
            maxValue={maxTotal}
            onMinChange={setMinTotal}
            onMaxChange={setMaxTotal}
          />
        </div>
      </div>
      
      <div className="mb-3">
        <label className="fs-small text-sub mb-2 d-block fw-500">Période</label>
        <div className="d-flex flex-wrap gap-2">
          {periods.map((period) => (
            <Button 
              key={period}
              variant="outline" 
              size="sm" 
              className="btn btn-outline-custom-pill rounded-pill"
              type="button"
            >
              {period}
            </Button>
          ))}
        </div>
      </div>
      
      <Button type="button" className="btn btn-primary w-100 apply-filters-btn">
        Appliquer
      </Button>
    </FilterDropdown>
  );
}

