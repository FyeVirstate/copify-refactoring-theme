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
  selectedDate?: string; // Alternative prop name
  onDateChange?: (value: string | undefined) => void; // Alternative prop name
  onOpenChange?: (open: boolean) => void;
  onApply?: (overrideFilters?: { shopCreationDate?: string }) => void;
  isActive?: boolean;
}

export default function ShopCreationFilter({
  value,
  onChange,
  selectedDate,
  onDateChange,
  onOpenChange,
  onApply,
  isActive = false,
}: ShopCreationFilterProps) {
  // Support both prop naming conventions
  const effectiveValue = value || selectedDate;
  const handleChange = (val: string) => {
    if (onChange) onChange(val);
    if (onDateChange) onDateChange(val || undefined);
  };
  const [date, setDate] = useState<DateRange | undefined>();
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [align, setAlign] = useState<"start" | "end">("start");
  const [alignOffset, setAlignOffset] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  
  const ALIGN_END_AT_WIDTH = 1394; // Open left when viewport <= this width

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth <= 768);
      setViewportWidth(window.innerWidth);
    };
    
    checkViewport();
    window.addEventListener('resize', checkViewport);
    
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Mobile alignment - based on button position
  useEffect(() => {
    if (isMobile && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      
      if (rect.left > vw / 2) {
        setAlign("start"); // Right column: opens left
      } else {
        setAlign("end"); // Left column: opens right
      }
      setAlignOffset(0);
    }
  }, [isMobile]);

  // Desktop alignment - check if we need to open left at certain breakpoint
  useEffect(() => {
    if (!isMobile && triggerRef.current) {
      const shouldOpenLeft = viewportWidth <= ALIGN_END_AT_WIDTH;
      
      if (shouldOpenLeft) {
        const buttonWidth = triggerRef.current.offsetWidth;
        const dropdownWidth = 600; // width of the dropdown
        setAlignOffset(-(dropdownWidth - buttonWidth));
        setAlign("start");
      } else {
        setAlign("start");
        setAlignOffset(0);
      }
    }
  }, [isMobile, viewportWidth]);
  
  const shouldOpenLeft = !isMobile && viewportWidth <= ALIGN_END_AT_WIDTH;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

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
    
    if (range?.from && range?.to) {
      const formatted = `${format(range.from, "MM/dd/yyyy")} - ${format(range.to, "MM/dd/yyyy")}`;
      handleChange(formatted);
      
      // Auto-apply when preset is selected - pass value directly to avoid timing issues
      if (onApply) {
        onApply({ shopCreationDate: formatted });
      }
    }
  };

  const handleApply = () => {
    if (date?.from && date?.to) {
      const formatted = `${format(date.from, "MM/dd/yyyy")} - ${format(date.to, "MM/dd/yyyy")}`;
      handleChange(formatted);
      if (onApply) {
        onApply({ shopCreationDate: formatted });
      }
    } else {
      onApply?.();
    }
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const handleClear = () => {
    setDate(undefined);
    setActivePreset(null);
    handleChange("");
  };

  const presetButtonStyle = (preset: string) => ({
    backgroundColor: activePreset === preset ? '#0E121B' : 'white',
    color: activePreset === preset ? 'white' : '#525866',
    border: activePreset === preset ? '2px solid #0E121B' : '1px solid #E1E4EA',
  });

  return (
    <div className="dropdown dropdown-filter">
      <DropdownMenu modal={false} open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button 
            ref={triggerRef}
            className={`btn dropdown-btn dropdown-toggle ${isActive || !!effectiveValue ? 'filter-active' : ''}`}
            type="button" 
            variant="outline"
          >
            <i className="dropdown-icon ri-calendar-line"></i> {isMobile ? 'Création' : 'Création de la Boutique'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align={align}
          alignOffset={alignOffset}
          side="bottom"
          className="dropdown-menu p-3" 
          style={{ width: isMobile ? 'calc(100vw - 32px)' : '600px', maxWidth: 'calc(100vw - 20px)' }} 
          onClick={(e) => e.stopPropagation()}
          collisionPadding={isMobile ? 16 : (shouldOpenLeft ? 0 : 16)}
          sideOffset={4}
          avoidCollisions={isMobile || !shouldOpenLeft}
        >
          <h5 className="mb-3 fw-600" style={{ color: '#0E121B', fontSize: '15px' }}>Création de la Boutique</h5>
          
          {/* Preset buttons in a horizontal row at the top */}
          <div className="d-flex flex-wrap gap-2 mb-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              style={presetButtonStyle("last90")}
              onClick={() => handlePresetClick("last90")}
            >
              90 derniers jours
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              style={presetButtonStyle("last180")}
              onClick={() => handlePresetClick("last180")}
            >
              180 derniers jours
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              style={presetButtonStyle("lastYear")}
              onClick={() => handlePresetClick("lastYear")}
            >
              Dernière année
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              style={presetButtonStyle("custom")}
              onClick={() => handlePresetClick("custom")}
            >
              Plage personnalisée
            </Button>
          </div>

          {/* Calendar */}
          <div>
            <Calendar
              mode="range"
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
              locale={fr}
              className="rounded-md border-0"
              modifiersStyles={{
                today: {
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  fontWeight: '600',
                  borderRadius: '6px'
                }
              }}
            />
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

