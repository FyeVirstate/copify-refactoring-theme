"use client";

import { ReactNode, useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilterDropdownProps {
  icon: string;
  label: string;
  title?: string;
  children: ReactNode;
  width?: string;
  onOpenChange?: (open: boolean) => void;
  isActive?: boolean;
  badge?: number;
}

export default function FilterDropdown({
  icon,
  label,
  title,
  children,
  width = "480px",
  onOpenChange,
  isActive = false,
  badge,
}: FilterDropdownProps) {
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
    // ONLY apply smart alignment on mobile
    if (isMobile && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      // On mobile, check if button is in left or right column
      // Left column → open to right (align="end")
      // Right column → open to left (align="start")
      if (rect.left > viewportWidth / 2) {
        setAlign("start"); // Right column: open to left
      } else {
        setAlign("end"); // Left column: open to right
      }
    } else {
      // Desktop: always align to start (like it was before)
      setAlign("start");
    }
  }, [isMobile]);

  return (
    <div className="dropdown dropdown-filter">
      <DropdownMenu modal={false} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button 
            ref={triggerRef}
            className={`btn dropdown-btn dropdown-toggle ${isActive ? 'filter-active' : ''}`}
            type="button" 
            variant="outline"
          >
            <i className={`dropdown-icon ${icon}`}></i> {label}
            {badge !== undefined && badge > 0 && (
              <span 
                className="filter-rounded-tag ms-1"
                style={{
                  backgroundColor: '#0E121B',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '20px'
                }}
              >
                {badge}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align={align}
          side="bottom"
          className="dropdown-menu p-3" 
          style={{ width, maxWidth: 'calc(100vw - 20px)' }} 
          onClick={(e) => e.stopPropagation()}
          collisionPadding={10}
          sideOffset={4}
        >
          {title && <h5 className="mb-3 fw-600" style={{ color: '#0E121B', fontSize: '15px' }}>{title}</h5>}
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
