"use client";

import { useState } from "react";
import FilterDropdown from "./FilterDropdown";
import { Button } from "@/components/ui/button";

interface AdStatusFilterProps {
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: () => void;
  isActive?: boolean;
}

export default function AdStatusFilter({ 
  selectedStatus: externalSelectedStatus,
  onStatusChange,
  onOpenChange,
  onApply,
  isActive 
}: AdStatusFilterProps) {
  const [internalSelectedStatus, setInternalSelectedStatus] = useState<string>("");
  
  const selectedStatus = externalSelectedStatus ?? internalSelectedStatus;
  
  const handleStatusChange = (status: string) => {
    if (onStatusChange) {
      onStatusChange(status);
    } else {
      setInternalSelectedStatus(status);
    }
  };

  const handleApply = () => {
    if (onApply) {
      onApply();
    }
  };

  return (
    <FilterDropdown
      icon="ri-checkbox-circle-line"
      label="Statut Publicité"
      title="Statut Publicité"
      width="400px"
      onOpenChange={onOpenChange}
      isActive={isActive || !!selectedStatus}
    >
      <div className="mb-3">
        <div className="form-check mb-2">
          <input
            className="form-check-input"
            type="radio"
            name="adStatus"
            id="statusActive"
            value="active"
            checked={selectedStatus === "active"}
            onChange={(e) => handleStatusChange(e.target.value)}
          />
          <label className="form-check-label fs-small" htmlFor="statusActive">
            Actif
          </label>
        </div>
        <div className="form-check mb-2">
          <input
            className="form-check-input"
            type="radio"
            name="adStatus"
            id="statusInactive"
            value="inactive"
            checked={selectedStatus === "inactive"}
            onChange={(e) => handleStatusChange(e.target.value)}
          />
          <label className="form-check-label fs-small" htmlFor="statusInactive">
            Inactif
          </label>
        </div>
        <div className="form-check mb-2">
          <input
            className="form-check-input"
            type="radio"
            name="adStatus"
            id="statusAll"
            value="all"
            checked={selectedStatus === "all" || selectedStatus === ""}
            onChange={(e) => handleStatusChange(e.target.value)}
          />
          <label className="form-check-label fs-small" htmlFor="statusAll">
            Tous
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
