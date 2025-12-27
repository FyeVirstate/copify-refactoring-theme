"use client";

import { useState, useEffect } from "react";
import FilterDropdown from "./FilterDropdown";
import FilterPresetGrid from "./FilterPresetGrid";
import FilterCheckboxList from "./FilterCheckboxList";
import { Button } from "@/components/ui/button";

interface ApplicationsFilterProps {
  selectedApplications: string[];
  onApplicationsChange: (applications: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: (overrideFilters?: { apps?: string }) => void;
  isActive?: boolean;
}

interface AppData {
  id: string;
  name: string;
  icon: string;
  categories: string[];
}

// Fallback static list if API fails
const fallbackApplications = [
  { id: "Klaviyo", label: "Klaviyo" },
  { id: "Loox", label: "Loox" },
  { id: "Judge.me", label: "Judge.me" },
  { id: "Vitals", label: "Vitals" },
  { id: "Oberlo", label: "Oberlo" },
  { id: "Privy", label: "Privy" },
  { id: "Smile.io", label: "Smile.io" },
  { id: "Yotpo", label: "Yotpo" },
  { id: "ReCharge", label: "ReCharge" },
  { id: "PageFly", label: "PageFly" },
  { id: "Shogun", label: "Shogun" },
  { id: "Gorgias", label: "Gorgias" },
  { id: "Zipify", label: "Zipify" },
  { id: "Bold", label: "Bold" },
  { id: "Stamped", label: "Stamped" },
  { id: "Omnisend", label: "Omnisend" },
  { id: "AfterShip", label: "AfterShip" },
  { id: "Back in Stock", label: "Back in Stock" },
  { id: "Okendo", label: "Okendo" },
  { id: "Rebuy", label: "Rebuy" },
];

// Category mappings for presets
const PRESET_CATEGORIES = {
  reviews: ["Reviews", "Product reviews", "Reviews & photos", "Photo reviews"],
  tracking: ["Order tracking", "Tracking", "Shipment tracking", "Delivery"],
  emails: ["Email marketing", "Email", "Marketing automation", "Newsletters"],
};

export default function ApplicationsFilter({ 
  selectedApplications, 
  onApplicationsChange,
  onOpenChange,
  onApply,
  isActive = false
}: ApplicationsFilterProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [applications, setApplications] = useState<{ id: string; label: string; icon?: string }[]>(fallbackApplications);
  const [appsData, setAppsData] = useState<AppData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reset preset when selectedApplications is cleared externally
  useEffect(() => {
    if (selectedApplications.length === 0) {
      setActivePreset(null);
    }
  }, [selectedApplications]);

  // Fetch apps from the API
  useEffect(() => {
    const fetchApps = async () => {
      try {
        const response = await fetch("/api/apps");
        if (response.ok) {
          const data = await response.json();
          setAppsData(data.apps || []);
          
          // Transform to checkbox list format
          const formattedApps = (data.apps || []).map((app: AppData) => ({
            id: app.name,
            label: app.name,
            icon: app.icon && app.icon !== "/img/icons/default-app.png" ? (
              <img 
                src={app.icon} 
                alt={app.name} 
                className="w-5 h-5 rounded object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : undefined,
          }));
          
          if (formattedApps.length > 0) {
            setApplications(formattedApps);
          }
        }
      } catch (error) {
        console.error("Failed to fetch apps:", error);
        // Keep using fallback applications
      } finally {
        setIsLoading(false);
      }
    };

    fetchApps();
  }, []);

  const handlePresetClick = (presetId: string) => {
    const categories = PRESET_CATEGORIES[presetId as keyof typeof PRESET_CATEGORIES] || [];
    
    // Filter apps that have any of the preset categories
    const matchingApps = appsData.filter((app) =>
      app.categories.some((cat) =>
        categories.some((presetCat) =>
          cat.toLowerCase().includes(presetCat.toLowerCase())
        )
      )
    );

    let newApps: string[];
    
    if (matchingApps.length > 0) {
      // Use apps from database matching the category
      newApps = matchingApps.map((app) => app.name);
    } else {
      // Fallback to hardcoded list if no database apps match
      switch (presetId) {
        case "reviews":
          newApps = ["Judge.me", "Loox", "Yotpo", "Stamped", "Okendo"];
          break;
        case "tracking":
          newApps = ["AfterShip"];
          break;
        case "emails":
          newApps = ["Klaviyo", "Omnisend", "Privy"];
          break;
        default:
          newApps = [];
      }
    }
    
    setActivePreset(presetId);
    onApplicationsChange(newApps);
    
    // Auto-apply when preset is selected - pass values directly to avoid timing issues
    if (onApply) {
      onApply({ apps: newApps.join(',') });
    }
  };

  const presets = [
    {
      id: "reviews",
      icon: "ri-chat-1-line",
      title: "Avis",
      description: "Judge.me, Loox, Yotpo...",
    },
    {
      id: "tracking",
      icon: "ri-crosshair-2-line",
      title: "Tracking",
      description: "AfterShip",
    },
    {
      id: "emails",
      icon: "ri-mail-line",
      title: "Emails",
      description: "Klaviyo, Omnisend, Privy",
    },
  ];

  return (
    <FilterDropdown
      label="Applications"
      icon="ri-apps-line"
      onOpenChange={onOpenChange}
      isActive={isActive || selectedApplications.length > 0}
      badge={selectedApplications.length > 0 ? selectedApplications.length : undefined}
    >
      <p className="fw-500 mb-2">Applications</p>
      <p className="fs-small fw-500 mb-2 text-muted">Préréglages</p>

      <FilterPresetGrid 
        presets={presets} 
        onPresetClick={handlePresetClick}
        activePreset={activePreset}
        columns={2}
      />

      <div className="border-t border-gray-200 dark:border-gray-700 my-3" />

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">Chargement...</span>
        </div>
      ) : (
      <FilterCheckboxList
        items={applications}
        selectedItems={selectedApplications}
          onItemsChange={(items) => {
            setActivePreset(null);
            onApplicationsChange(items);
          }}
          searchPlaceholder="Rechercher des applications..."
          showIncludeExclude={true}
          groupName="appsCheckboxes"
      />
      )}
      
      <Button 
        className="w-100 mt-3" 
        onClick={() => onApply?.()}
      >
        Appliquer
      </Button>
    </FilterDropdown>
  );
}
