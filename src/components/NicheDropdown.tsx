"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface ApiCategory {
  id: number;
  name: string;
  shopCount?: number;
  children?: { id: number; name: string }[];
}

interface NicheCategory {
  id: number;
  name: string;
  subcategories?: { id: number; name: string }[];
}

interface PresetItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  // Use category names that match the database (English names)
  niches: string[];
}

// Presets use English names to match database categories exactly
// API categories: Health, Beauty & Fitness, Science, Travel, Adult, Smoking & Vaping, 
// Pets & Animals, Home & Garden, Consumer Electronics, Apparel, Games, etc.
const presets: PresetItem[] = [
  {
    id: "permanent",
    icon: "ri-check-double-line",
    title: "Permanent",
    description: "Fonctionne toujours",
    niches: ["Health", "Beauty & Fitness", "Science"],
  },
  {
    id: "impulse",
    icon: "ri-flashlight-line",
    title: "Achats impulsifs",
    description: "",
    niches: ["Adult", "Smoking & Vaping"],
  },
  {
    id: "subscription",
    icon: "ri-loop-left-line",
    title: "Adapté aux abonnements",
    description: "",
    niches: ["Health", "Beauty & Fitness", "Pets & Animals"],
  },
  {
    id: "seasonal",
    icon: "ri-calendar-check-line",
    title: "Gagnants saisonniers",
    description: "",
    niches: ["Travel", "Apparel"],
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
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dynamic categories from API
  const [categories, setCategories] = useState<NicheCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    if (hasFetched) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      
      if (result.success && result.data) {
        const mappedCategories: NicheCategory[] = result.data.map((cat: ApiCategory) => ({
          id: cat.id,
          name: cat.name,
          subcategories: cat.children?.map(child => ({
            id: child.id,
            name: child.name
          })) || []
        }));
        setCategories(mappedCategories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, [hasFetched]);

  // Fetch categories when dropdown opens
  useEffect(() => {
    if (isOpen && !hasFetched) {
      fetchCategories();
    }
  }, [isOpen, hasFetched, fetchCategories]);

  // Reset preset when selectedNiches is cleared externally
  useEffect(() => {
    if (selectedNiches.length === 0) {
      setActivePreset(null);
    }
  }, [selectedNiches]);
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
  };

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
    setActivePreset(null);
  };

  const handlePresetClick = (presetId: string, niches: string[]) => {
    // Toggle off if same preset is clicked again
    if (activePreset === presetId) {
      setActivePreset(null);
      onNichesChange([]);
      // Auto-apply when preset is deselected
      if (onApply) {
        setTimeout(() => {
          onApply();
          handleOpenChange(false);
        }, 150);
      }
      return;
    }
    
    setActivePreset(presetId);
    onNichesChange(niches);
    
    // Auto-apply when preset is selected and close dropdown
    if (onApply) {
      setTimeout(() => {
        onApply();
        handleOpenChange(false); // Close dropdown after applying preset
      }, 150);
    }
  };

  const handleSelectAll = () => {
    const allNiches = categories.flatMap(cat => 
      [cat.name, ...(cat.subcategories?.map(s => s.name) || [])]
    );
    onNichesChange(allNiches);
    setActivePreset(null);
  };

  const handleDeselectAll = () => {
    onNichesChange([]);
    setActivePreset(null);
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.subcategories?.some((sub) => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="dropdown dropdown-filter">
      <DropdownMenu modal={false} open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button 
            ref={triggerRef}
            className={`btn dropdown-btn dropdown-toggle ${isActive || selectedNiches.length > 0 ? 'filter-active' : ''}`}
            type="button" 
            variant="outline"
          >
            <i className="dropdown-icon ri-global-line"></i> Niche
            {selectedNiches.length > 0 && (
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
                {selectedNiches.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side="bottom"
        className="dropdown-menu p-3"
        style={{ width: '400px', maxWidth: 'calc(100vw - 20px)' }}
        onClick={(e) => e.stopPropagation()}
        collisionPadding={10}
        sideOffset={4}
      >
        <h5 className="mb-3 fw-600" style={{ color: '#0E121B', fontSize: '15px' }}>Niches</h5>
        
        {/* Presets Grid */}
        <div className="mb-3">
          <p className="fs-small text-sub mb-3 fw-500">Préréglages</p>
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px'
            }}
          >
            {presets.map((preset) => {
              const isPresetActive = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className="preset-card w-100 text-start"
                  onClick={() => handlePresetClick(preset.id, preset.niches)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px',
                    border: isPresetActive ? '2px solid #0E121B' : '1px solid #E1E4EA',
                    borderRadius: '8px',
                    backgroundColor: isPresetActive ? '#0E121B' : 'white',
                    color: isPresetActive ? 'white' : '#525866',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minHeight: '52px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isPresetActive) {
                      e.currentTarget.style.backgroundColor = '#F5F7FA';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isPresetActive) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <i 
                    className={preset.icon} 
                    style={{ 
                      fontSize: '18px', 
                      color: isPresetActive ? 'white' : '#99A0AE',
                      flexShrink: 0
                    }}
                  ></i>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '12.5px', 
                      fontWeight: '500', 
                      marginBottom: preset.description ? '2px' : '0',
                      color: isPresetActive ? 'white' : '#0E121B',
                      lineHeight: '1.2'
                    }}>
                      {preset.title}
                    </div>
                    {preset.description && (
                      <div style={{ 
                        fontSize: '10.5px', 
                        fontWeight: '400',
                        color: isPresetActive ? 'rgba(255, 255, 255, 0.7)' : '#99A0AE',
                        lineHeight: '1.2'
                      }}>
                        {preset.description}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="horizontal-dashed-divider mb-3"></div>
        
        {/* Search and Toggle */}
        <div className="d-flex align-items-center gap-2 mb-3">
        <Input
          type="text"
            className="form-control"
          placeholder="Rechercher une niche..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1 }}
        />
          <div className="d-flex gap-2">
            <Button 
              variant="link" 
              size="sm" 
              className="text-primary p-0 fs-small"
              onClick={handleSelectAll}
              type="button"
            >
              Tout incl.
            </Button>
            <Button 
              variant="link" 
              size="sm" 
              className="text-primary p-0 fs-small"
              onClick={handleDeselectAll}
              type="button"
            >
              Tout excl.
            </Button>
          </div>
        </div>
        
        {/* Categories list */}
        <div 
          className="checkboxes-wrapper p-3 border rounded mb-3" 
          style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: 'white' }}
        >
          {loading ? (
            <div className="text-center text-muted py-3">
              <i className="ri-loader-4-line ri-spin me-2"></i>
              Chargement des niches...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center text-muted py-3">
              Aucune niche trouvée
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.id}>
                <div className="form-check mb-1 d-flex align-items-start justify-content-between">
                  <div className="d-flex align-items-center">
                    {category.subcategories && category.subcategories.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-sm mt-0 p-0 me-1"
                        onClick={() => toggleCategory(category.name)}
                        style={{ fontSize: '10px', lineHeight: '1', color: '#212529', border: 'none', background: 'none' }}
                      >
                        <span style={{ color: '#212529' }}>{expandedCategories.includes(category.name) ? '▼' : '▶'}</span>
                      </button>
                    )}
                    <input
                      className="form-check-input small-check"
                      type="checkbox"
                      id={`niche-${category.id}`}
                      checked={selectedNiches.includes(category.name)}
                      onChange={() => handleNicheToggle(category.name)}
                    />
                    <label className="form-check-label fs-small text-dark ms-2" htmlFor={`niche-${category.id}`}>
                      {category.name}
                    </label>
                  </div>
                </div>
                
                {/* Subcategories */}
                {category.subcategories && category.subcategories.length > 0 && expandedCategories.includes(category.name) && (
                  <div className="ms-4 mb-2">
                    {category.subcategories.map((sub) => (
                      <div key={sub.id} className="form-check mb-1">
                        <input
                          className="form-check-input small-check"
                          type="checkbox"
                          id={`sub-niche-${sub.id}`}
                          checked={selectedNiches.includes(sub.name)}
                          onChange={() => handleNicheToggle(sub.name)}
                        />
                        <label className="form-check-label fs-small text-muted" htmlFor={`sub-niche-${sub.id}`}>
                          {sub.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <Button 
          type="button" 
          className="btn btn-primary w-100 apply-filters-btn"
          onClick={() => {
            onApply?.();
            handleOpenChange(false);
          }}
        >
          Appliquer
        </Button>
      </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
