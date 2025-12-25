"use client";

import { useState } from "react";
import FilterDropdown from "./FilterDropdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DatesFilterProps {
  onOpenChange?: (open: boolean) => void;
  onApply?: () => void;
  isActive?: boolean;
}

export default function DatesFilter({ onOpenChange, onApply, isActive }: DatesFilterProps) {
  const [copyfyDate, setCopyfyDate] = useState("");
  const [adsDate, setAdsDate] = useState("");

  const handleApply = () => {
    if (onApply) {
      onApply();
    }
  };

  return (
    <FilterDropdown
      icon="ri-calendar-line"
      label="Dates"
      title="Dates"
      width="400px"
      onOpenChange={onOpenChange}
      isActive={isActive || !!(copyfyDate || adsDate)}
    >
      <div className="mb-3">
        <label className="fs-small text-sub mb-2 d-block fw-500">
          <i className="ri-calendar-line me-2"></i>
          Début de la campagne publicitaire
        </label>
        <Input
          type="date"
          className="form-control design-2"
          value={copyfyDate}
          onChange={(e) => setCopyfyDate(e.target.value)}
        />
      </div>
      
      <div className="mb-3">
        <label className="fs-small text-sub mb-2 d-block fw-500">
          <i className="ri-calendar-line me-2"></i>
          Date ajoutée sur Copyfy
        </label>
        <Input
          type="date"
          className="form-control design-2"
          value={adsDate}
          onChange={(e) => setAdsDate(e.target.value)}
        />
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
