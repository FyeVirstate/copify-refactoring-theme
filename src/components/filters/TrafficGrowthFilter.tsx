"use client";

import { useState } from "react";
import FilterDropdown from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EvolutionTraficFilterProps {
  onOpenChange?: (open: boolean) => void;
}

export default function EvolutionTraficFilter({ onOpenChange }: EvolutionTraficFilterProps) {
  const [growthValue, setGrowthValue] = useState("");
  const [months, setMonths] = useState("3");

  const presets = [
    {
      id: "rapid-growth",
      icon: "ri-speed-up-line",
      title: "Mise à l'échelle rapide",
      description: "+50% derniers 3 mois",
    },
    {
      id: "slowdown",
      icon: "ri-arrow-down-line",
      title: "Ralentissement",
      description: "-10% derniers 3 mois",
    },
  ];

  return (
    <FilterDropdown
      icon="ri-line-chart-line"
      label="Évolution du trafic"
      title="Croissance du trafic"
      width="400px"
      onOpenChange={onOpenChange}
    >
      <FilterPresetGrid presets={presets} columns={2} />
      
      <div className="horizontal-dashed-divider mb-3"></div>
      
      <div className="mb-3">
        <label className="fs-small text-sub mb-2 d-block fw-500">Croissance</label>
        <select className="form-select mb-2" defaultValue="superior">
          <option value="superior">est supérieur à</option>
          <option value="inferior">est inférieur à</option>
          <option value="equal">est égal à</option>
        </select>
        <div className="d-flex align-items-center gap-2">
          <i className="ri-arrow-right-line text-primary"></i>
          <Input
            type="number"
            className="form-control design-2"
            placeholder="0"
            value={growthValue}
            onChange={(e) => setGrowthValue(e.target.value)}
            style={{ flex: 1 }}
          />
          <span className="fs-small">%</span>
          <span className="fs-small text-sub">dernier</span>
          <Input
            type="number"
            className="form-control design-2"
            placeholder="3"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            style={{ width: '80px' }}
          />
          <span className="fs-small">mois</span>
        </div>
      </div>
      
      <Button type="button" className="btn btn-primary w-100 apply-filters-btn">
        Appliquer
      </Button>
    </FilterDropdown>
  );
}

