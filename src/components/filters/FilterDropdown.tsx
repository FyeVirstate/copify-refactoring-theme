"use client";

import { ReactNode, useRef, useState, useEffect } from "react";
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
  forceAlignEnd?: boolean; // Force dropdown to open left (align="end") on all screen sizes
  alignEndAtWidth?: number; // Open left when viewport <= this width (e.g. 1394)
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
  forceAlignEnd = false,
  alignEndAtWidth,
}: FilterDropdownProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [align, setAlign] = useState<"start" | "end">("start");
  const [alignOffset, setAlignOffset] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth <= 768);
      setViewportWidth(window.innerWidth);
    };
    
    checkViewport();
    window.addEventListener('resize', checkViewport);
    
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Mobile alignment - same logic as before, works for ALL filters
  useEffect(() => {
    if (isMobile && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      
      // Left column (button on left) → open to right (align="end")
      // Right column (button on right) → open to left (align="start")
      if (rect.left > vw / 2) {
        setAlign("start");
      } else {
        setAlign("end");
      }
      setAlignOffset(0); // Always 0 on mobile
    }
  }, [isMobile]);

  // Desktop alignment
  useEffect(() => {
    if (!isMobile && triggerRef.current) {
      // Check if we should open left based on breakpoint OR forceAlignEnd
      const shouldOpenLeft = forceAlignEnd || (alignEndAtWidth && viewportWidth <= alignEndAtWidth);
      
      if (shouldOpenLeft) {
        // Open left: use negative offset to align right edge
        const buttonWidth = triggerRef.current.offsetWidth;
        const dropdownWidth = parseInt(width) || 480;
        setAlignOffset(-(dropdownWidth - buttonWidth));
        setAlign("start");
      } else {
        // Normal: open right
        setAlign("start");
        setAlignOffset(0);
      }
    }
  }, [isMobile, forceAlignEnd, alignEndAtWidth, viewportWidth, width]);
  
  // Compute if we should open left for collision settings
  const shouldOpenLeft = forceAlignEnd || (alignEndAtWidth && viewportWidth <= alignEndAtWidth && !isMobile);

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
          alignOffset={alignOffset}
          side="bottom"
          className="dropdown-menu p-3" 
          style={{ 
            width: isMobile ? 'calc(100vw - 32px)' : width, 
            maxWidth: 'calc(100vw - 20px)'
          }} 
          onClick={(e) => e.stopPropagation()}
          collisionPadding={isMobile ? 16 : (shouldOpenLeft ? 0 : 16)}
          sideOffset={4}
          avoidCollisions={isMobile || !shouldOpenLeft}
        >
          {title && <h5 className="mb-3 fw-600" style={{ color: '#0E121B', fontSize: '15px' }}>{title}</h5>}
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
