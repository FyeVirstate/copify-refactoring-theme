"use client";

import { useState } from "react";
import FilterDropdown from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterInputGroup from "./FilterInputGroup";
import { Button } from "@/components/ui/button";

interface TrustpilotFilterProps {
  onOpenChange?: (open: boolean) => void;
}

export default function TrustpilotFilter({ onOpenChange }: TrustpilotFilterProps) {
  const [minRating, setMinRating] = useState("");
  const [maxRating, setMaxRating] = useState("");
  const [minReviews, setMinReviews] = useState("");
  const [maxReviews, setMaxReviews] = useState("");

  const presets = [
    {
      id: "high-rating",
      icon: "ri-star-line",
      title: "Note élevée",
      description: "Note 4.5+ étoiles",
    },
    {
      id: "established",
      icon: "ri-shield-check-line",
      title: "Marque établie",
      description: "100+ avis",
    },
    {
      id: "trusted",
      icon: "ri-verified-badge-line",
      title: "Marque de confiance",
      description: "Note 4.5+, 50+ avis",
    },
  ];

  return (
    <FilterDropdown
      icon="ri-star-line"
      label="Trustpilot"
      title="Trustpilot"
      width="400px"
      onOpenChange={onOpenChange}
    >
      <FilterPresetGrid presets={presets} columns={2} />
      
      <div className="horizontal-dashed-divider mb-3"></div>
      
      <div className="row g-3 mb-3">
        <div className="col-6">
          <FilterInputGroup
            label="Note"
            minValue={minRating}
            maxValue={maxRating}
            onMinChange={setMinRating}
            onMaxChange={setMaxRating}
            maxPlaceholder="5"
          />
        </div>
        <div className="col-6">
          <FilterInputGroup
            label="Nombre d'avis"
            minValue={minReviews}
            maxValue={maxReviews}
            onMinChange={setMinReviews}
            onMaxChange={setMaxReviews}
            maxPlaceholder="∞"
          />
        </div>
      </div>
      
      <Button type="button" className="btn btn-primary w-100 apply-filters-btn">
        Appliquer
      </Button>
    </FilterDropdown>
  );
}

