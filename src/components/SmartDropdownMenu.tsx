"use client";

import { useState, useEffect, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface SmartDropdownMenuProps {
  trigger: {
    icon: string;
    label: string;
  };
  content: {
    className?: string;
    style?: React.CSSProperties;
    children: React.ReactNode;
  };
  modal?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function SmartDropdownMenu({
  trigger,
  content,
  modal = false,
  onOpenChange,
}: SmartDropdownMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [align, setAlign] = useState<"start" | "end">("start");
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (open && isMobile && triggerRef.current) {
      // Calculate alignment BEFORE opening
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      if (rect.left > viewportWidth / 2) {
        setAlign("start"); // Right column: open to left
      } else {
        setAlign("end"); // Left column: open to right
      }
    } else if (!isMobile) {
      setAlign("start"); // Desktop: always align to start
    }
    
    setIsOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
  };

  return (
    <div className="dropdown dropdown-filter">
      <DropdownMenu modal={modal} open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button 
            ref={triggerRef}
            className="btn dropdown-btn dropdown-toggle" 
            type="button" 
            variant="outline"
          >
            <i className={`dropdown-icon ${trigger.icon}`}></i> {trigger.label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          side="bottom"
          className={content.className}
          style={content.style}
          onClick={(e) => e.stopPropagation()}
          collisionPadding={10}
          sideOffset={4}
        >
          {content.children}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

