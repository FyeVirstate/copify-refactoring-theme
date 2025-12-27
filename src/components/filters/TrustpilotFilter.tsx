"use client";

import { useState, useEffect } from "react";
import FilterDropdown from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterInputGroup from "./FilterInputGroup";
import { Button } from "@/components/ui/button";

interface TrustpilotFilterProps {
  minRating?: number;
  maxRating?: number;
  minReviews?: number;
  maxReviews?: number;
  onMinRatingChange?: (value: number | undefined) => void;
  onMaxRatingChange?: (value: number | undefined) => void;
  onMinReviewsChange?: (value: number | undefined) => void;
  onMaxReviewsChange?: (value: number | undefined) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: (overrideFilters?: { minTrustpilotRating?: number; maxTrustpilotRating?: number; minTrustpilotReviews?: number; maxTrustpilotReviews?: number }) => void;
  isActive?: boolean;
}

export default function TrustpilotFilter({ 
  minRating: externalMinRating,
  maxRating: externalMaxRating,
  minReviews: externalMinReviews,
  maxReviews: externalMaxReviews,
  onMinRatingChange,
  onMaxRatingChange,
  onMinReviewsChange,
  onMaxReviewsChange,
  onOpenChange, 
  onApply, 
  isActive 
}: TrustpilotFilterProps) {
  const [minRatingStr, setMinRatingStr] = useState(externalMinRating?.toString() || "");
  const [maxRatingStr, setMaxRatingStr] = useState(externalMaxRating?.toString() || "");
  const [minReviewsStr, setMinReviewsStr] = useState(externalMinReviews?.toString() || "");
  const [maxReviewsStr, setMaxReviewsStr] = useState(externalMaxReviews?.toString() || "");
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Sync with external values and reset preset when values are cleared
  useEffect(() => {
    setMinRatingStr(externalMinRating?.toString() || "");
    if (externalMinRating === undefined && externalMaxRating === undefined && 
        externalMinReviews === undefined && externalMaxReviews === undefined) {
      setActivePreset(null);
    }
  }, [externalMinRating, externalMaxRating, externalMinReviews, externalMaxReviews]);
  
  useEffect(() => {
    setMaxRatingStr(externalMaxRating?.toString() || "");
  }, [externalMaxRating]);
  
  useEffect(() => {
    setMinReviewsStr(externalMinReviews?.toString() || "");
  }, [externalMinReviews]);
  
  useEffect(() => {
    setMaxReviewsStr(externalMaxReviews?.toString() || "");
  }, [externalMaxReviews]);

  const handlePresetClick = (presetId: string) => {
    setActivePreset(presetId);
    
    let newMinRating: number | undefined;
    let newMaxRating: number | undefined;
    let newMinReviews: number | undefined;
    let newMaxReviews: number | undefined;
    
    switch (presetId) {
      case "high-rating":
        newMinRating = 4.5;
        newMaxRating = 5;
        newMinReviews = undefined;
        newMaxReviews = undefined;
        break;
      case "established":
        newMinRating = undefined;
        newMaxRating = undefined;
        newMinReviews = 100;
        newMaxReviews = undefined;
        break;
      case "trusted":
        newMinRating = 4.5;
        newMaxRating = 5;
        newMinReviews = 50;
        newMaxReviews = undefined;
        break;
    }
    
    setMinRatingStr(newMinRating?.toString() || "");
    setMaxRatingStr(newMaxRating?.toString() || "");
    setMinReviewsStr(newMinReviews?.toString() || "");
    setMaxReviewsStr(newMaxReviews?.toString() || "");
    
    // Update parent state immediately
    if (onMinRatingChange) onMinRatingChange(newMinRating);
    if (onMaxRatingChange) onMaxRatingChange(newMaxRating);
    if (onMinReviewsChange) onMinReviewsChange(newMinReviews);
    if (onMaxReviewsChange) onMaxReviewsChange(newMaxReviews);
    
    // Auto-apply when preset is selected - pass values directly to avoid timing issues
    if (onApply) {
      onApply({ minTrustpilotRating: newMinRating, maxTrustpilotRating: newMaxRating, minTrustpilotReviews: newMinReviews, maxTrustpilotReviews: newMaxReviews });
    }
  };

  const presets = [
    {
      id: "high-rating",
      icon: "ri-star-line",
      title: "Note élevée",
      description: "Note 4.5+ étoiles",
    },
    {
      id: "established",
      icon: "ri-shake-hands-line",
      title: "Marque établie",
      description: "100+ avis",
    },
    {
      id: "trusted",
      icon: "ri-shield-check-line",
      title: "Marque de confiance",
      description: "4.5+ étoiles et 50+ avis",
    },
  ];

  const hasValue = minRatingStr !== "" || maxRatingStr !== "" || minReviewsStr !== "" || maxReviewsStr !== "";

  return (
    <FilterDropdown
      label="Trustpilot"
      icon="ri-star-fill"
      onOpenChange={onOpenChange}
      isActive={isActive || hasValue}
      badge={hasValue ? 1 : undefined}
    >
      <p className="fw-500 mb-2">Trustpilot</p>
      <p className="fs-small fw-500 mb-2 text-muted">Préréglages</p>

      <FilterPresetGrid 
        presets={presets} 
        onPresetClick={handlePresetClick}
        activePreset={activePreset}
        columns={2}
      />

      <div className="border-t border-gray-200 dark:border-gray-700 my-3" />

      <div className="row g-2">
        <div className="col-6">
          <FilterInputGroup
            label="Note"
            minValue={minRatingStr}
            maxValue={maxRatingStr}
            onMinChange={(val) => {
              setMinRatingStr(val);
              setActivePreset(null);
              if (onMinRatingChange) onMinRatingChange(val ? parseFloat(val) : undefined);
            }}
            onMaxChange={(val) => {
              setMaxRatingStr(val);
              setActivePreset(null);
              if (onMaxRatingChange) onMaxRatingChange(val ? parseFloat(val) : undefined);
            }}
            minPlaceholder="Min"
            maxPlaceholder="5"
          />
        </div>
        <div className="col-6">
          <FilterInputGroup
            label="Nombre d'avis"
            minValue={minReviewsStr}
            maxValue={maxReviewsStr}
            onMinChange={(val) => {
              setMinReviewsStr(val);
              setActivePreset(null);
              if (onMinReviewsChange) onMinReviewsChange(val ? parseInt(val) : undefined);
            }}
            onMaxChange={(val) => {
              setMaxReviewsStr(val);
              setActivePreset(null);
              if (onMaxReviewsChange) onMaxReviewsChange(val ? parseInt(val) : undefined);
            }}
            minPlaceholder="Min"
            maxPlaceholder="∞"
          />
        </div>
      </div>

      <Button 
        className="w-100 mt-3" 
        onClick={() => onApply?.()}
      >
        Appliquer
      </Button>
    </FilterDropdown>
  );
}
