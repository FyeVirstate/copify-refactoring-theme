"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, subYears } from "date-fns";
import { fr } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShopCreationFilterProps {
  value?: string;
  onChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: (overrideFilters?: { createdAt?: string }) => void;
  isActive?: boolean;
}

export default function ShopCreationFilter({
  value,
  onChange,
  onOpenChange,
  onApply,
  isActive = false,
}: ShopCreationFilterProps) {
  const [date, setDate] = useState<DateRange | undefined>();
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [align, setAlign] = useState<"start" | "end">("start");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      if (rect.left > viewportWidth / 2) {
        setAlign("start");
      } else {
        setAlign("end");
      }
    } else {
      setAlign("start");
    }
  }, [isMobile]);

  const handlePresetClick = (preset: string) => {
    const today = new Date();
    let range: DateRange | undefined;
    setActivePreset(preset);

    switch (preset) {
      case "last90":
        range = { from: subDays(today, 90), to: today };
        break;
      case "last180":
        range = { from: subDays(today, 180), to: today };
        break;
      case "lastYear":
        range = { from: subYears(today, 1), to: today };
        break;
      case "custom":
        range = undefined;
        break;
      default:
        range = undefined;
    }

    setDate(range);
    
    if (range?.from && range?.to && onChange) {
      const formatted = `${format(range.from, "MM/dd/yyyy")} - ${format(range.to, "MM/dd/yyyy")}`;
      onChange(formatted);
      
      // Auto-apply when preset is selected - pass value directly to avoid timing issues
      if (onApply) {
        onApply({ createdAt: formatted });
      }
    }
  };

  const handleApply = () => {
    if (date?.from && date?.to && onChange) {
      const formatted = `${format(date.from, "MM/dd/yyyy")} - ${format(date.to, "MM/dd/yyyy")}`;
      onChange(formatted);
    }
    onApply?.();
    onOpenChange?.(false);
  };

  const handleClear = () => {
    setDate(undefined);
    setActivePreset(null);
    if (onChange) {
      onChange("");
    }
  };

  const presetButtonStyle = (preset: string) => ({
    backgroundColor: activePreset === preset ? '#0E121B' : 'white',
    color: activePreset === preset ? 'white' : '#525866',
    border: activePreset === preset ? '2px solid #0E121B' : '1px solid #E1E4EA',
  });

  return (
    <div className="dropdown dropdown-filter">
      <DropdownMenu modal={false} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button 
            ref={triggerRef}
            className={`btn dropdown-btn dropdown-toggle ${isActive || !!value ? 'filter-active' : ''}`}
            type="button" 
            variant="outline"
          >
            <i className="dropdown-icon ri-calendar-line"></i> Création de la Boutique
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align={align}
          side="bottom"
          className="dropdown-menu p-3" 
          style={{ width: '600px', maxWidth: 'calc(100vw - 20px)' }} 
          onClick={(e) => e.stopPropagation()}
          collisionPadding={10}
          sideOffset={4}
        >
          <h5 className="mb-3 fw-600" style={{ color: '#0E121B', fontSize: '15px' }}>Création de la Boutique</h5>
          
          {/* Preset buttons in a sidebar style */}
          <div className="d-flex gap-3">
            {/* Left sidebar with presets */}
            <div className="d-flex flex-column gap-2" style={{ minWidth: '140px' }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-start justify-content-start"
                style={presetButtonStyle("last90")}
                onClick={() => handlePresetClick("last90")}
              >
                Last 90 Days
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-start justify-content-start"
                style={presetButtonStyle("last180")}
                onClick={() => handlePresetClick("last180")}
              >
                Last 180 Days
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-start justify-content-start"
                style={presetButtonStyle("lastYear")}
                onClick={() => handlePresetClick("lastYear")}
              >
                Last Year
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-start justify-content-start"
                style={presetButtonStyle("custom")}
                onClick={() => handlePresetClick("custom")}
              >
                Plage personnalisée
              </Button>
            </div>

            {/* Calendar */}
            <div style={{ flex: 1 }}>
              <Calendar
                mode="range"
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                locale={fr}
                className="rounded-md border-0"
              />
            </div>
          </div>

          {/* Date display */}
          {date?.from && (
            <div className="text-end mt-2 mb-2 fs-small text-sub">
              {date.to ? (
                <>
                  {format(date.from, "MM/dd/yyyy")} - {format(date.to, "MM/dd/yyyy")}
                </>
              ) : (
                format(date.from, "MM/dd/yyyy")
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="d-flex gap-2 mt-3 justify-content-end border-top pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="btn btn-secondary"
            >
              Effacer
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="btn btn-primary"
            >
              Appliquer
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

