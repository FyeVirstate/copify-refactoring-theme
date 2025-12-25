"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface NicheCategory {
  name: string;
  subcategories?: string[];
}

const nicheCategories: NicheCategory[] = [
  {
    name: "Voyage",
    subcategories: ["Voyage d'affaires", "Voyage en famille", "Voyage solo"]
  },
  {
    name: "Science",
    subcategories: ["Biologie", "Physique", "Chimie"]
  },
  {
    name: "Santé",
    subcategories: ["Soins bucco-dentaires", "Santé des femmes", "Santé reproductive"]
  },
  {
    name: "Fumer et vaper",
  },
  {
    name: "Adulte",
  },
  {
    name: "Sécurité et survie",
    subcategories: ["Équipement de survie", "Sécurité personnelle"]
  },
];

interface NicheDropdownProps {
  selectedNiches: string[];
  onNichesChange: (niches: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: () => void;
  isActive?: boolean;
}

export default function NicheDropdown({ selectedNiches, onNichesChange, onOpenChange, onApply, isActive = false }: NicheDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [align, setAlign] = useState<"start" | "end">("start");
  const [isMobile, setIsMobile] = useState(false);
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
  };
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

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

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((name) => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleNicheToggle = (niche: string) => {
    if (selectedNiches.includes(niche)) {
      onNichesChange(selectedNiches.filter((n) => n !== niche));
    } else {
      onNichesChange([...selectedNiches, niche]);
    }
  };

  const filteredCategories = nicheCategories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.subcategories?.some((sub) => sub.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="dropdown dropdown-filter">
      <DropdownMenu modal={false} open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button 
            ref={triggerRef}
            className={`btn dropdown-btn dropdown-toggle ${isActive ? 'filter-active' : ''}`}
            type="button" 
            variant="outline"
          >
            <i className="dropdown-icon ri-ancient-gate-line"></i> Niche
          </Button>
        </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side="bottom"
        className="dropdown-menu p-2 text-muted"
        style={{ width: '300px', maxWidth: 'calc(100vw - 20px)', maxHeight: '400px', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
        collisionPadding={10}
        sideOffset={4}
      >
        <Input
          type="text"
          className="form-control mb-3"
          placeholder="Rechercher une niche..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="checkboxes-wrapper mb-3">
          {filteredCategories.map((category, index) => (
            <div key={index}>
              <div className="form-check mb-1 d-flex align-items-start justify-content-between">
                <div className="d-flex align-items-center">
                  <input
                    className="form-check-input small-check"
                    type="checkbox"
                    id={`niche-${index}`}
                    checked={selectedNiches.includes(category.name)}
                    onChange={() => handleNicheToggle(category.name)}
                  />
                  <label className="form-check-label fs-small text-dark" htmlFor={`niche-${index}`}>
                    {category.name}
                  </label>
                </div>
                {category.subcategories && category.subcategories.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-sm mt-0 p-0"
                    onClick={() => toggleCategory(category.name)}
                    style={{ fontSize: '10px', lineHeight: '1', color: '#212529' }}
                  >
                    <span style={{ color: '#212529' }}>{expandedCategories.includes(category.name) ? '▼' : '▶'}</span>
                  </button>
                )}
              </div>
              
              {/* Subcategories */}
              {category.subcategories && expandedCategories.includes(category.name) && (
                <div className="ms-3 mb-2">
                  {category.subcategories.map((sub, subIndex) => (
                    <div key={subIndex} className="form-check mb-1">
                      <input
                        className="form-check-input small-check"
                        type="checkbox"
                        id={`sub-niche-${index}-${subIndex}`}
                        checked={selectedNiches.includes(sub)}
                        onChange={() => handleNicheToggle(sub)}
                      />
                      <label className="form-check-label fs-small text-muted" htmlFor={`sub-niche-${index}-${subIndex}`}>
                        {sub}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <Button 
          type="button" 
          className="btn btn-primary w-100 apply-filters-btn"
          onClick={() => {
            onApply?.();
            handleOpenChange(false);
          }}
        >
          Appliquer les filtres
        </Button>
      </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

