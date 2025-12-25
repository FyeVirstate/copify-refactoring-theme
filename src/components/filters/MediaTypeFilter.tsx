"use client";

import { useState } from "react";
import FilterDropdown from "./FilterDropdown";
import { Button } from "@/components/ui/button";

interface MediaTypeFilterProps {
  selectedType?: string;
  onTypeChange?: (type: string) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: () => void;
  isActive?: boolean;
}

export default function MediaTypeFilter({ 
  selectedType: externalSelectedType,
  onTypeChange,
  onOpenChange,
  onApply,
  isActive 
}: MediaTypeFilterProps) {
  const [internalSelectedType, setInternalSelectedType] = useState<string>("");
  
  const selectedType = externalSelectedType ?? internalSelectedType;
  
  const handleTypeChange = (type: string) => {
    if (onTypeChange) {
      onTypeChange(type);
    } else {
      setInternalSelectedType(type);
    }
  };

  const handleApply = () => {
    if (onApply) {
      onApply();
    }
  };

  return (
    <FilterDropdown
      icon="ri-video-line"
      label="Type de média"
      title="Type de média"
      width="400px"
      onOpenChange={onOpenChange}
      isActive={isActive || !!selectedType}
    >
      <div className="mb-3">
        <div className="form-check mb-2">
          <input
            className="form-check-input"
            type="radio"
            name="mediaType"
            id="mediaImage"
            value="image"
            checked={selectedType === "image"}
            onChange={(e) => handleTypeChange(e.target.value)}
          />
          <label className="form-check-label fs-small" htmlFor="mediaImage">
            Image
          </label>
        </div>
        <div className="form-check mb-2">
          <input
            className="form-check-input"
            type="radio"
            name="mediaType"
            id="mediaVideo"
            value="video"
            checked={selectedType === "video"}
            onChange={(e) => handleTypeChange(e.target.value)}
          />
          <label className="form-check-label fs-small" htmlFor="mediaVideo">
            Vidéo
          </label>
        </div>
        <div className="form-check mb-2">
          <input
            className="form-check-input"
            type="radio"
            name="mediaType"
            id="mediaCarousel"
            value="carousel"
            checked={selectedType === "carousel"}
            onChange={(e) => handleTypeChange(e.target.value)}
          />
          <label className="form-check-label fs-small" htmlFor="mediaCarousel">
            Carousel
          </label>
        </div>
        <div className="form-check mb-2">
          <input
            className="form-check-input"
            type="radio"
            name="mediaType"
            id="mediaCollection"
            value="collection"
            checked={selectedType === "collection"}
            onChange={(e) => handleTypeChange(e.target.value)}
          />
          <label className="form-check-label fs-small" htmlFor="mediaCollection">
            Collection
          </label>
        </div>
      </div>
      
      <Button 
        type="button" 
        className="btn btn-primary w-100 apply-filters-btn"
        onClick={handleApply}
      >
        Appliquer les filtres
      </Button>
    </FilterDropdown>
  );
}
