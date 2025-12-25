"use client";

import { useEffect, useState } from "react";
import {
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

interface SmartDropdownContentProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  collisionPadding?: number;
  onOpenAutoFocus?: (e: Event) => void;
  mobileColumn?: "left" | "right" | "auto"; // Which column on mobile: left opens right, right opens left
  [key: string]: any;
}

export default function SmartDropdownContent({
  children,
  className,
  style,
  onClick,
  collisionPadding = 10,
  onOpenAutoFocus,
  mobileColumn = "auto",
  ...props
}: SmartDropdownContentProps) {
  const [align, setAlign] = useState<"start" | "end">("start");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Set alignment based on mobileColumn prop if provided
      if (mobile && mobileColumn !== "auto") {
        if (mobileColumn === "left") {
          setAlign("end"); // Left column: open to right
        } else {
          setAlign("start"); // Right column: open to left
        }
      } else if (!mobile) {
        setAlign("start"); // Desktop: always start
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileColumn]);

  const handleOpenAutoFocus = (e: Event) => {
    // Detect position when dropdown opens
    if (isMobile) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        // Find all open triggers
        const openTriggers = document.querySelectorAll('[data-state="open"]');
        if (openTriggers.length > 0) {
          // Get the last opened trigger (most recent)
          const trigger = openTriggers[openTriggers.length - 1];
          const rect = trigger.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          
          // Left column → open to right (align="end")
          // Right column → open to left (align="start")
          if (rect.left > viewportWidth / 2) {
            setAlign("start"); // Right column: open to left
          } else {
            setAlign("end"); // Left column: open to right
          }
        }
      }, 0);
    } else {
      // Desktop: always align to start
      setAlign("start");
    }
    
    // Call the original handler if provided
    if (onOpenAutoFocus) {
      onOpenAutoFocus(e);
    }
  };

  return (
    <DropdownMenuContent
      align={align}
      side="bottom"
      className={className}
      style={style}
      onClick={onClick}
      collisionPadding={collisionPadding}
      sideOffset={4}
      onCloseAutoFocus={handleOpenAutoFocus}
      {...props}
    >
      {children}
    </DropdownMenuContent>
  );
}

