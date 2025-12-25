"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, subYears } from "date-fns";
import { fr } from "date-fns/locale";
import { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function DateRangePicker({
  value,
  onChange,
  placeholder = "Sélectionner une date",
  className = "",
  isOpen: externalIsOpen,
  onOpenChange: externalOnOpenChange,
}: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState<"left" | "right">("left");
  const [isMobile, setIsMobile] = useState(false);
  
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnOpenChange || setInternalIsOpen;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePresetClick = (preset: string) => {
    const today = new Date();
    let range: DateRange | undefined;

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
      default:
        range = undefined;
    }

    setDate(range);
    
    if (range?.from && range?.to && onChange) {
      const formatted = `${format(range.from, "MM/dd/yyyy")} - ${format(range.to, "MM/dd/yyyy")}`;
      onChange(formatted);
    }
  };

  const handleApply = () => {
    if (date?.from && date?.to && onChange) {
      const formatted = `${format(date.from, "MM/dd/yyyy")} - ${format(date.to, "MM/dd/yyyy")}`;
      onChange(formatted);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setDate(undefined);
    if (onChange) {
      onChange("");
    }
  };

  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleInputClick = () => {
    if (!isOpen) {
      // Determine position based on element location (mobile only)
      if (isMobile && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        // Left column → open to right
        // Right column → open to left
        if (rect.left > viewportWidth / 2) {
          setPopupPosition("left"); // Right column: align left
        } else {
          setPopupPosition("right"); // Left column: align right
        }
      } else {
        setPopupPosition("left"); // Desktop: always align left
      }
      
      setIsOpen(true);
      // Keep focus on input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="form-control-w-icon position-relative date-range-picker-wrapper">
      <div className="position-relative">
        <input
          ref={inputRef}
          type="text"
          className={`form-control design-2 date-range-input ${className}`}
          style={{ 
            width: '100%', 
            cursor: 'text',
            paddingLeft: '38px'
          }}
          value={value || ""}
          placeholder={placeholder}
          onFocus={() => {
            setIsOpen(true);
          }}
          onChange={(e) => {
            if (onChange) {
              onChange(e.target.value);
            }
          }}
        />
        <span 
          className="form-control-icon position-absolute" 
          style={{ 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            pointerEvents: 'none',
            zIndex: 10,
            color: '#6c757d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <i className="ri-calendar-check-line" style={{ fontSize: '16px', lineHeight: '1' }}></i>
        </span>
      </div>
      
      {isOpen && (
        <div 
          className="position-absolute bg-white border rounded shadow-lg date-range-popup"
          style={{ 
            top: '100%',
            ...(popupPosition === "left" ? { left: '0' } : { right: '0' }),
            marginTop: '4px',
            zIndex: 50,
            width: '600px',
            maxWidth: '95vw',
            display: 'block',
            opacity: 1,
            visibility: 'visible',
            pointerEvents: 'auto'
          }}
        >
          <div className="p-3">
          {/* Preset buttons */}
          <div className="mb-3 d-flex gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="btn btn-outline-custom-pill rounded-pill"
              onClick={() => handlePresetClick("last90")}
            >
              Last 90 Days
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="btn btn-outline-custom-pill rounded-pill"
              onClick={() => handlePresetClick("last180")}
            >
              Last 180 Days
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="btn btn-outline-custom-pill rounded-pill"
              onClick={() => handlePresetClick("lastYear")}
            >
              Last Year
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="btn btn-outline-custom-pill rounded-pill active"
            >
              Plage personnalisée
            </Button>
          </div>

          {/* Calendar */}
          <Calendar
            mode="range"
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            locale={fr}
            className="rounded-md border-0"
          />

          {/* Date display */}
          {date?.from && (
            <div className="text-center mt-2 mb-2 fs-small text-sub">
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
              className="btn btn-primary !bg-[#0c6cfb] !text-white hover:!bg-[#0c6cfb]"
            >
              Appliquer
            </Button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}

