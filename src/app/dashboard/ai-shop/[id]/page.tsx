"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, RefreshCw, Eye, EyeOff, Maximize2, Minimize2, ArrowLeft, Save, Trash2, ExternalLink } from "lucide-react";

// Reusable component for input with inline regenerate button (matching Laravel design)
interface AIInputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'number';
  rows?: number;
  hint?: string;
  showRegenerateButton?: boolean;
}

const AIInputField: React.FC<AIInputFieldProps> = ({
  label,
  value,
  onChange,
  onRegenerate,
  isRegenerating,
  placeholder,
  type = 'text',
  rows = 4,
  hint,
  showRegenerateButton = true,
}) => {
  return (
    <div className="mb-3">
      <label className="form-label text-dark fw-500 mb-1 fs-small">{label}</label>
      <div className="position-relative">
        {type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`form-control ${showRegenerateButton ? 'form-control-w-side-button' : ''}`}
            placeholder={placeholder}
            rows={rows}
          />
        ) : type === 'number' ? (
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="form-control"
            placeholder={placeholder}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`form-control ${showRegenerateButton ? 'form-control-w-side-button' : ''}`}
            placeholder={placeholder}
          />
        )}
        {showRegenerateButton && (
          <button
            type="button"
            className={`btn position-absolute ${type === 'textarea' ? 'top-0 mt-2' : 'top-50 translate-middle-y'} end-0 me-2 p-1 regenerate-field-btn`}
            onClick={onRegenerate}
            disabled={isRegenerating}
            title="Régénérer par IA"
          >
            {isRegenerating ? (
              <i className="ri-loader-4-line fs-5 spin-animation"></i>
            ) : (
              <i className="ri-sparkling-line fs-5"></i>
            )}
          </button>
        )}
      </div>
      {hint && <small className="text-muted">{hint}</small>}
    </div>
  );
};

interface AIContent {
  title: string;
  description: string;
  price?: number;
  compareAtPrice?: number;
  compare_at_price?: number;
  header?: string;
  subheading?: string;
  featureHeader?: string;
  mainCatchyText: string;
  subMainCatchyText: string;
  features: string[];
  benefits: string[];
  productFeatures?: Array<{ title: string; text: string }>;
  testimonials: Array<{ header: string; review: string; name: string }>;
  faq: Array<{ question: string; answer: string }>;
  images: string[];
  language: string;
  deliveryInformation?: string;
  howItWorks?: string;
  instructions?: string;
  whyChooseUsText?: string;
  productSectionHeading?: string;
  productSectionSubheading?: string;
  [key: string]: unknown;
}

interface GeneratedProduct {
  id: number;
  title: string;
  productUrl: string;
  description: string | null;
  category: string | null;
  language: string | null;
  source: string;
  type: string;
  aiContent: AIContent;
  productContent: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export default function AIShopEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const productId = params?.id as string;

  const [product, setProduct] = useState<GeneratedProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("product-section");
  
  // Preview panel state
  const [showPreview, setShowPreview] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true); // Start with loading state since iframe has no initial src
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [regeneratingField, setRegeneratingField] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [pageType, setPageType] = useState<'product' | 'home'>('product');
  const [themeKey, setThemeKey] = useState('theme_v4');
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Editable content state
  const [editedContent, setEditedContent] = useState<Partial<AIContent>>({});

  // Helper function to convert hex to RGB string (e.g., "111,78,84")
  // Defined here so it's available before loadProduct
  const hexToRgbString = useCallback((hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '111,78,84'; // fallback
    return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
  }, []);

  // Load product data
  const loadProduct = useCallback(async () => {
    if (!productId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/ai/generate-store/${productId}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load product');
      }

      const data = await response.json();
      setProduct(data.product);
      // Ensure default colors and fonts are set if not present in aiContent
      const aiContent = data.product.aiContent || {};
      const defaultContent = {
        primary_color_picker: '#6f6254',
        tertiary_color_picker: '#e6e1dc',
        font_family_input: 'Inter',
        ...aiContent,
      };
      // Ensure RGB values are calculated
      if (!defaultContent.primary_rgbcolor_picker && defaultContent.primary_color_picker) {
        defaultContent.primary_rgbcolor_picker = hexToRgbString(defaultContent.primary_color_picker as string);
      }
      if (!defaultContent.tertiary_rgbcolor_picker && defaultContent.tertiary_color_picker) {
        defaultContent.tertiary_rgbcolor_picker = hexToRgbString(defaultContent.tertiary_color_picker as string);
      }
      setEditedContent(defaultContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  }, [productId, hexToRgbString]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  // Refresh preview when content changes - uses debouncing for real-time updates
  const refreshPreview = useCallback(async () => {
    if (previewIframeRef.current) {
      setIsPreviewLoading(true);
      
      try {
        // Send current edited content to get real-time preview
        const response = await fetch('/api/ai/liquid-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aiShopId: productId,
            editedContent: {
              ...editedContent,
              page_type: pageType,
              theme_key: themeKey,
            },
          }),
        });
        
        if (response.ok) {
          const html = await response.text();
          // Create a blob URL for the preview iframe
          const blob = new Blob([html], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          
          // Clean up previous blob URL if it exists
          if (previewIframeRef.current.src.startsWith('blob:')) {
            URL.revokeObjectURL(previewIframeRef.current.src);
          }
          
          // Setting src will trigger iframe onLoad which sets isPreviewLoading to false
          previewIframeRef.current.src = url;
        } else {
          // Fallback to GET if POST fails
          const previewUrl = `/api/ai/liquid-preview?product_id=${productId}&page_type=${pageType}&theme=${themeKey}&t=${Date.now()}`;
          previewIframeRef.current.src = previewUrl;
        }
      } catch (error) {
        console.error('Preview refresh error:', error);
        // Fallback to GET on error
        const previewUrl = `/api/ai/liquid-preview?product_id=${productId}&page_type=${pageType}&theme=${themeKey}&t=${Date.now()}`;
        previewIframeRef.current.src = previewUrl;
      }
    }
  }, [productId, pageType, themeKey, editedContent]);

  // Debounced preview refresh when content changes (for real-time updates)
  const debouncedRefreshRef = useRef<NodeJS.Timeout | null>(null);
  // Store refresh function in a ref to avoid infinite loops
  const refreshPreviewRef = useRef(refreshPreview);
  refreshPreviewRef.current = refreshPreview;
  
  const triggerDebouncedRefresh = useCallback(() => {
    if (debouncedRefreshRef.current) {
      clearTimeout(debouncedRefreshRef.current);
    }
    // Show loading immediately when content changes
    setIsPreviewLoading(true);
    debouncedRefreshRef.current = setTimeout(() => {
      refreshPreviewRef.current();
    }, 800); // 800ms debounce for real-time preview (faster than before)
  }, []);

  // Auto-refresh preview ONLY when product loads or showPreview changes (not on refreshPreview change)
  // Use ref to avoid dependency on refreshPreview which changes with editedContent
  const productLoadedRef = useRef(false);
  useEffect(() => {
    if (product && showPreview && !productLoadedRef.current) {
      productLoadedRef.current = true;
      const timer = setTimeout(() => {
        refreshPreviewRef.current();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [product, showPreview]);

  // Real-time preview when editedContent changes (debounced)
  // Use a ref for content comparison to avoid infinite loops
  const lastEditedContentRef = useRef<string>('');
  const initialLoadRef = useRef(true);
  
  useEffect(() => {
    const contentStr = JSON.stringify(editedContent);
    // Skip initial load and only trigger on actual content changes
    if (product && showPreview && contentStr !== lastEditedContentRef.current) {
      if (!initialLoadRef.current) {
        triggerDebouncedRefresh();
      } else {
        initialLoadRef.current = false;
      }
      lastEditedContentRef.current = contentStr;
    }
  }, [editedContent, product, showPreview, triggerDebouncedRefresh]);

  // Regenerate a field using AI
  const regenerateField = async (fieldName: string, currentValue: string) => {
    setRegeneratingField(fieldName);
    try {
      const response = await fetch('/api/ai/regenerate-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldName,
          currentValue,
          productTitle: editedContent.title,
          productDescription: editedContent.description,
          language: editedContent.language || 'fr',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate');
      }

      const data = await response.json();
      if (data.newValue) {
        updateField(fieldName, data.newValue);
        setSuccessMessage(`${fieldName} régénéré avec succès !`);
        setTimeout(() => setSuccessMessage(null), 2000);
      }
    } catch (err) {
      console.error('Regeneration error:', err);
      setError('Échec de la régénération. Veuillez réessayer.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setRegeneratingField(null);
    }
  };

  // Update a field in the edited content
  const updateField = (field: string, value: unknown) => {
    setEditedContent(prev => {
      const updates: Record<string, unknown> = { [field]: value };
      
      // When updating color pickers, also update RGB values for theme CSS
      if (field === 'primary_color_picker' && typeof value === 'string') {
        updates.primary_rgbcolor_picker = hexToRgbString(value);
      }
      if (field === 'tertiary_color_picker' && typeof value === 'string') {
        updates.tertiary_rgbcolor_picker = hexToRgbString(value);
      }
      
      return { ...prev, ...updates };
    });
  };

  // Update nested field (e.g., testimonials[0].review)
  const updateNestedField = (field: string, index: number, subField: string, value: string) => {
    setEditedContent(prev => {
      const array = [...(prev[field] as Array<Record<string, string>> || [])];
      if (array[index]) {
        array[index] = { ...array[index], [subField]: value };
      }
      return { ...prev, [field]: array };
    });
  };

  // Update array field (e.g., features[0])
  const updateArrayField = (field: string, index: number, value: string) => {
    setEditedContent(prev => {
      const array = [...(prev[field] as string[] || [])];
      array[index] = value;
      return { ...prev, [field]: array };
    });
  };

  // Save changes
  const handleSave = async () => {
    if (!productId) return;

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/ai/generate-store/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiContent: editedContent,
          productName: editedContent.title,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      setSuccessMessage('Modifications enregistrées !');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Content/Styles tab state (matches Laravel Customize panel)
  const [editorTab, setEditorTab] = useState<'content' | 'styles'>('content');
  
  // Accordion state for Styles tab (React-controlled instead of Bootstrap)
  const [openStyleAccordion, setOpenStyleAccordion] = useState<string | null>('colorPalette');
  
  // Sections for navigation - these IDs must match the activeSection checks in the content panels
  // Product page sections (page produit)
  const productPageSections = [
    { id: 'product-section', label: 'Product Section', icon: 'ri-shopping-bag-line' },
    { id: 'review', label: 'Chronologie', icon: 'ri-star-line' },
    { id: 'timeline', label: 'Timeline', icon: 'ri-time-line' },
    { id: 'product-information', label: 'Informations sur le produit', icon: 'ri-file-info-line' },
    { id: 'what-makes-us-different', label: 'Ce qui rend notre site diff...', icon: 'ri-medal-line' },
    { id: 'clinical-section', label: 'Section clinique', icon: 'ri-test-tube-line' },
    { id: 'faqs', label: 'FAQs', icon: 'ri-question-answer-line' },
    { id: 'comparison-table', label: 'Tableau Comparatif', icon: 'ri-table-line' },
  ];

  // Home page sections (page d'accueil)
  const homePageSections = [
    { id: 'hero', label: 'Section Hero', icon: 'ri-image-line' },
    { id: 'review', label: 'Bandeau Témoignages', icon: 'ri-chat-quote-line' },
    { id: 'timeline', label: 'Timeline Points', icon: 'ri-time-line' },
    { id: 'product-section', label: 'Featured Product', icon: 'ri-shopping-bag-line' },
    { id: 'what-makes-us-different', label: 'Benefits', icon: 'ri-checkbox-circle-line' },
    { id: 'clinical-section', label: 'Statistics', icon: 'ri-bar-chart-line' },
    { id: 'faqs', label: 'Image FAQ', icon: 'ri-question-answer-line' },
    { id: 'comparison-table', label: 'Tableau Comparatif', icon: 'ri-table-line' },
    { id: 'images', label: 'Images & Media', icon: 'ri-gallery-line' },
  ];

  // Select sections based on current page type
  const defaultSections = pageType === 'home' ? homePageSections : productPageSections;

  // Section ordering state (can be reordered via drag & drop)
  const [sectionOrder, setSectionOrder] = useState<string[]>(defaultSections.map(s => s.id));
  
  // Hidden sections state (sections toggled off)
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());
  
  // Reset section order when page type changes
  useEffect(() => {
    const newSections = pageType === 'home' ? homePageSections : productPageSections;
    setSectionOrder(newSections.map(s => s.id));
    setHiddenSections(new Set());
  }, [pageType]);
  
  // Get ordered sections based on sectionOrder
  const themeSections = sectionOrder
    .map(id => defaultSections.find(s => s.id === id))
    .filter((s): s is typeof defaultSections[0] => s !== undefined);

  // Toggle section visibility
  const toggleSectionVisibility = (sectionId: string) => {
    setHiddenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      // Update editedContent with hidden_sections for API
      setEditedContent(prevContent => ({
        ...prevContent,
        hidden_sections: Array.from(newSet),
      }));
      return newSet;
    });
  };

  // Move section up in order
  const moveSectionUp = (sectionId: string) => {
    setSectionOrder(prev => {
      const index = prev.indexOf(sectionId);
      if (index <= 0) return prev;
      const newOrder = [...prev];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      // Update editedContent with section_order for API
      setEditedContent(prevContent => ({
        ...prevContent,
        section_order: newOrder,
      }));
      return newOrder;
    });
  };

  // Move section down in order
  const moveSectionDown = (sectionId: string) => {
    setSectionOrder(prev => {
      const index = prev.indexOf(sectionId);
      if (index < 0 || index >= prev.length - 1) return prev;
      const newOrder = [...prev];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      // Update editedContent with section_order for API
      setEditedContent(prevContent => ({
        ...prevContent,
        section_order: newOrder,
      }));
      return newOrder;
    });
  };

  // Legacy sections mapping for backwards compatibility
  const sections = [
    { id: 'general', label: 'Général', icon: 'ri-file-text-line' },
    { id: 'hero', label: 'Hero Section', icon: 'ri-layout-top-line' },
    { id: 'features', label: 'Caractéristiques', icon: 'ri-list-check-2' },
    { id: 'testimonials', label: 'Témoignages', icon: 'ri-chat-quote-line' },
    { id: 'faq', label: 'FAQ', icon: 'ri-question-line' },
    { id: 'images', label: 'Images', icon: 'ri-image-line' },
  ];

  if (isLoading) {
    return (
      <>
        <DashboardHeader
          title="Éditer la boutique"
          subtitle="Chargement..."
          icon="fa-brands fa-shopify"
          iconType="icon"
          showSearch={false}
          showStats={false}
        />
        <div className="bg-white home-content-wrapper">
          <div className="container-fluid px-4 py-5 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error && !product) {
    return (
      <>
        <DashboardHeader
          title="Éditer la boutique"
          subtitle="Erreur"
          icon="fa-brands fa-shopify"
          iconType="icon"
          showSearch={false}
          showStats={false}
        />
        <div className="bg-white home-content-wrapper">
          <div className="container-fluid px-4 py-5">
            <div className="alert alert-danger">{error}</div>
            <Button onClick={() => router.push('/dashboard/ai-shop')}>
              Retour à la liste
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        title={product?.title || "Éditer la boutique"}
        subtitle="Personnalisez votre boutique IA"
        icon="fa-brands fa-shopify"
        iconType="icon"
        showSearch={false}
        showStats={false}
      >
        <div className="d-flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/ai-shop')}
          >
            <i className="ri-arrow-left-line me-1"></i>
            Retour
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Enregistrement...
              </>
            ) : (
              <>
                <i className="ri-save-line me-1"></i>
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </DashboardHeader>

      <div className="bg-white home-content-wrapper">
        <div className="container-fluid px-2 px-md-4 py-4">
          {/* Messages */}
          {error && (
            <div className="alert alert-danger mb-4">
              <i className="ri-error-warning-line me-2"></i>{error}
              <button type="button" className="btn-close float-end" onClick={() => setError(null)}></button>
            </div>
          )}
          {successMessage && (
            <div className="alert alert-success mb-4">
              <i className="ri-check-line me-2"></i>{successMessage}
            </div>
          )}

          <div className="row">
            {/* Sidebar Navigation - Laravel Style with Content/Styles tabs */}
            <div className="col-lg-2 mb-4">
              <div className="card border-0 shadow-sm sticky-top" style={{ top: '1rem' }}>
                <div className="card-body p-0">
                  {/* Content/Styles Tabs (matches Laravel) */}
                  <div className="customize-tabs border-bottom">
                    <nav className="nav nav-tabs border-0">
                      <button
                        className={`nav-link customize-tab ${editorTab === 'content' ? 'active' : ''}`}
                        onClick={() => setEditorTab('content')}
                      >
                        Content
                      </button>
                      <button
                        className={`nav-link customize-tab ${editorTab === 'styles' ? 'active' : ''}`}
                        onClick={() => setEditorTab('styles')}
                      >
                        Styles
                      </button>
                    </nav>
                  </div>

                  {editorTab === 'content' && (
                    <div className="p-3">
                      {/* Add new section button (matches Laravel) */}
                      <button className="btn btn-outline-primary w-100 mb-3 d-flex align-items-center justify-content-center gap-2">
                        <i className="ri-add-line"></i>
                        Add new section
                      </button>

                      {/* Section List - Vertical tabs like Laravel */}
                      <nav className="section-nav">
                        {themeSections.map((section, index) => (
                          <div 
                            key={section.id} 
                            className={`section-nav-item ${hiddenSections.has(section.id) ? 'section-hidden' : ''}`}
                          >
                            {/* Reorder buttons */}
                            <div className="section-reorder-btns">
                              <button 
                                className="btn btn-sm p-0 section-move-btn"
                                onClick={() => moveSectionUp(section.id)}
                                disabled={index === 0}
                                title="Move up"
                              >
                                <i className="ri-arrow-up-s-line"></i>
                              </button>
                              <button 
                                className="btn btn-sm p-0 section-move-btn"
                                onClick={() => moveSectionDown(section.id)}
                                disabled={index === themeSections.length - 1}
                                title="Move down"
                              >
                                <i className="ri-arrow-down-s-line"></i>
                              </button>
                            </div>
                            
                            <button
                              className={`section-nav-btn ${activeSection === section.id ? 'active' : ''}`}
                              onClick={() => setActiveSection(section.id)}
                            >
                              <span className="d-flex align-items-center">
                                <i className={`${section.icon} me-2`}></i>
                                <span style={{ opacity: hiddenSections.has(section.id) ? 0.5 : 1 }}>
                                  {section.label}
                                </span>
                              </span>
                            </button>
                            
                            {/* Visibility toggle button */}
                            <button 
                              className="section-visibility-btn"
                              onClick={() => toggleSectionVisibility(section.id)}
                              title={hiddenSections.has(section.id) ? "Show section" : "Hide section"}
                            >
                              <i className={hiddenSections.has(section.id) ? "ri-eye-off-line text-muted" : "ri-eye-line text-muted"}></i>
                            </button>
                          </div>
                        ))}
                      </nav>
                    </div>
                  )}

                  {editorTab === 'styles' && (
                    <div className="p-3">
                      {/* Font Family Accordion */}
                      <div className="accordion mb-3" id="stylesAccordion">
                        <div className="accordion-item border-0">
                          <h2 className="accordion-header">
                  <button
                              className={`accordion-button ${openStyleAccordion !== 'font' ? 'collapsed' : ''} bg-light rounded py-2 px-3`}
                              type="button"
                              onClick={() => setOpenStyleAccordion(openStyleAccordion === 'font' ? null : 'font')}
                            >
                              <i className="ri-font-size me-2"></i>
                              <span className="fw-500 small">Police de Caractères</span>
                            </button>
                          </h2>
                          {openStyleAccordion === 'font' && (
                            <div className="accordion-body px-0 pt-3">
                              <p className="small text-muted mb-2">Sélectionnez une police pour votre boutique</p>
                              <div className="d-flex gap-2 flex-wrap">
                                {['Inter', 'Karla', 'Poppins', 'Montserrat', 'Roboto'].map(font => (
                                  <label key={font} className="font-option-label">
                                    <input 
                                      type="radio" 
                                      name="font_family" 
                                      value={font}
                                      checked={(editedContent.font_family_input as string) === font}
                                      onChange={(e) => updateField('font_family_input', e.target.value)}
                                      className="d-none"
                                    />
                                    <div className={`font-option-box ${(editedContent.font_family_input as string) === font ? 'active' : ''}`}>
                                      <span className="checkmark"><i className="ri-check-line"></i></span>
                                      <p className="fw-500 fs-5 mb-1" style={{ fontFamily: font }}>Ag</p>
                                      <p className="small text-muted mb-0">{font}</p>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Import Colors Accordion */}
                        <div className="accordion-item border-0 mt-2">
                          <h2 className="accordion-header">
                            <button 
                              className={`accordion-button ${openStyleAccordion !== 'importColors' ? 'collapsed' : ''} bg-light rounded py-2 px-3`}
                              type="button"
                              onClick={() => setOpenStyleAccordion(openStyleAccordion === 'importColors' ? null : 'importColors')}
                            >
                              <i className="ri-palette-line me-2"></i>
                              <span className="fw-500 small">Importer les couleurs d&apos;un site concurrent</span>
                            </button>
                          </h2>
                          {openStyleAccordion === 'importColors' && (
                            <div className="accordion-body px-0 pt-3">
                              <p className="small text-muted mb-2">Entrez le domaine pour importer ses couleurs</p>
                              <input 
                                type="text" 
                                className="form-control form-control-sm mb-2" 
                                placeholder="exemple.com"
                              />
                              <button className="btn btn-primary btn-sm">
                                <i className="ri-download-line me-1"></i> Importer
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Color Palette Accordion */}
                        <div className="accordion-item border-0 mt-2">
                          <h2 className="accordion-header">
                            <button 
                              className={`accordion-button ${openStyleAccordion !== 'colorPalette' ? 'collapsed' : ''} bg-light rounded py-2 px-3`}
                              type="button"
                              onClick={() => setOpenStyleAccordion(openStyleAccordion === 'colorPalette' ? null : 'colorPalette')}
                            >
                              <i className="ri-color-filter-line me-2"></i>
                              <span className="fw-500 small">Choisissez des couleurs pour votre site</span>
                            </button>
                          </h2>
                          {openStyleAccordion === 'colorPalette' && (
                            <div className="accordion-body px-0 pt-3">
                              {/* Preset Color Palettes */}
                              <div className="d-flex gap-2 flex-wrap mb-3">
                                {[
                                  { primary: '#6f6254', tertiary: '#e6e1dc' },
                                  { primary: '#374732', tertiary: '#d9e3d4' },
                                  { primary: '#8c1c25', tertiary: '#f1dada' },
                                  { primary: '#e9572d', tertiary: '#fff6e8' },
                                  { primary: '#4E2500', tertiary: '#FFF0DD' },
                                  { primary: '#4e7a9b', tertiary: '#e0eef5' },
                                  { primary: '#9a4e34', tertiary: '#ebddd3' },
                                ].map((palette, i) => (
                                  <button 
                                    key={i}
                                    type="button"
                                    className="btn btn-sm p-1 border rounded"
                                    onClick={() => {
                                      updateField('primary_color_picker', palette.primary);
                                      updateField('tertiary_color_picker', palette.tertiary);
                                    }}
                                  >
                                    <span className="d-inline-block rounded-circle me-1" style={{ width: 20, height: 20, backgroundColor: palette.primary }}></span>
                                    <span className="d-inline-block rounded-circle" style={{ width: 20, height: 20, backgroundColor: palette.tertiary }}></span>
                                  </button>
                                ))}
                              </div>

                              {/* Generate Colors Button */}
                              <button 
                                className="btn btn-sm mb-3 text-white"
                                style={{ 
                                  background: 'linear-gradient(135deg, #4e7a9b, #6f6254)',
                                  borderRadius: 20,
                                  padding: '6px 14px'
                                }}
                              >
                                <i className="ri-refresh-line me-1"></i>
                                Générer de nouvelles couleurs
                              </button>

                              {/* Action Color */}
                              <div className="mb-3">
                                <p className="fw-500 small mb-0">Couleur d&apos;action</p>
                                <p className="small text-muted mb-2">Utilisez dans les boutons et les liens et plus pour mettre en évidence et évoquer</p>
                                <div className="d-flex align-items-center gap-2">
                                  <label 
                                    className="color-picker-label rounded"
                                    style={{ 
                                      width: 36, 
                                      height: 36, 
                                      backgroundColor: (editedContent.primary_color_picker as string) || '#6f6254',
                                      cursor: 'pointer',
                                      position: 'relative',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <input 
                                      type="color" 
                                      value={(editedContent.primary_color_picker as string) || '#6f6254'}
                                      onChange={(e) => updateField('primary_color_picker', e.target.value)}
                                      style={{ 
                                        position: 'absolute', 
                                        width: '200%', 
                                        height: '200%', 
                                        top: '-50%', 
                                        left: '-50%',
                                        cursor: 'pointer'
                                      }}
                                    />
                                  </label>
                                  <input 
                                    type="text" 
                                    className="form-control form-control-sm" 
                                    style={{ width: 90 }}
                                    value={(editedContent.primary_color_picker as string) || '#6f6254'}
                                    onChange={(e) => updateField('primary_color_picker', e.target.value)}
                                    maxLength={7}
                                  />
                                </div>
                              </div>

                              {/* Surface Color */}
                              <div>
                                <p className="fw-500 small mb-0">Couleur de surface</p>
                                <p className="small text-muted mb-2">Utilisez en arrière-plan de la barre d&apos;annonces et plus</p>
                                <div className="d-flex align-items-center gap-2">
                                  <label 
                                    className="color-picker-label rounded"
                                    style={{ 
                                      width: 36, 
                                      height: 36, 
                                      backgroundColor: (editedContent.tertiary_color_picker as string) || '#e6e1dc',
                                      cursor: 'pointer',
                                      position: 'relative',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <input 
                                      type="color" 
                                      value={(editedContent.tertiary_color_picker as string) || '#e6e1dc'}
                                      onChange={(e) => updateField('tertiary_color_picker', e.target.value)}
                                      style={{ 
                                        position: 'absolute', 
                                        width: '200%', 
                                        height: '200%', 
                                        top: '-50%', 
                                        left: '-50%',
                                        cursor: 'pointer'
                                      }}
                                    />
                                  </label>
                                  <input 
                                    type="text" 
                                    className="form-control form-control-sm" 
                                    style={{ width: 90 }}
                                    value={(editedContent.tertiary_color_picker as string) || '#e6e1dc'}
                                    onChange={(e) => updateField('tertiary_color_picker', e.target.value)}
                                    maxLength={7}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Navigation buttons */}
                      <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditorTab('content')}>
                          Retour
                        </button>
                        <button className="btn btn-primary btn-sm">
                          Suivant
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Preview Toggle at bottom */}
                  <div className="border-top p-2">
                    <button
                      className={`nav-link text-start w-100 rounded ${showPreview ? 'text-primary' : ''}`}
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? <Eye className="me-2" size={16} /> : <EyeOff className="me-2" size={16} />}
                    {showPreview ? 'Masquer aperçu' : 'Afficher aperçu'}
                  </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className={showPreview ? "col-lg-3" : "col-lg-10"}>
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  {/* Product Section (matches Laravel _product-section.blade.php) */}
                  {activeSection === 'product-section' && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <p className="mb-0 fs-5 fw-600">Product Section</p>
                        <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Section Heading */}
                      <AIInputField
                        label="Section Heading"
                        value={editedContent.productSectionHeading || editedContent.header || ''}
                        onChange={(val) => updateField('productSectionHeading', val)}
                        onRegenerate={() => regenerateField('productSectionHeading', editedContent.productSectionHeading || '')}
                        isRegenerating={regeneratingField === 'productSectionHeading'}
                        placeholder="Enter product section heading"
                      />

                      {/* Section Subheading */}
                      <AIInputField
                        label="Section Subheading"
                        value={editedContent.productSectionSubheading || editedContent.subheading || ''}
                        onChange={(val) => updateField('productSectionSubheading', val)}
                        onRegenerate={() => regenerateField('productSectionSubheading', editedContent.productSectionSubheading || '')}
                        isRegenerating={regeneratingField === 'productSectionSubheading'}
                        placeholder="Enter product section subheading"
                      />

                      {/* Product Features (4 features with title and description) */}
                      {[0, 1, 2, 3].map((index) => {
                        const features = (editedContent.productFeatures as Array<{ title: string; text: string }>) || [];
                        const feature = features[index] || { title: '', text: '' };
                        return (
                          <div key={index}>
                            <label className="form-label text-dark fw-500 mb-1 fs-small">
                              Product Features {index + 1}
                            </label>
                            <div className="mb-3">
                              <div className="position-relative mb-2">
                                <input
                                  type="text"
                                  className="form-control form-control-w-side-button"
                                  value={feature.title || ''}
                                  onChange={(e) => {
                                    const newFeatures = [...features];
                                    if (!newFeatures[index]) newFeatures[index] = { title: '', text: '' };
                                    newFeatures[index].title = e.target.value;
                                    updateField('productFeatures', newFeatures);
                                  }}
                                  placeholder="Feature title"
                                />
                                <button
                                  type="button"
                                  className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-1 regenerate-field-btn"
                                  onClick={() => regenerateField(`productFeatures[${index}][title]`, feature.title || '')}
                                  disabled={regeneratingField === `productFeatures[${index}][title]`}
                                >
                                  {regeneratingField === `productFeatures[${index}][title]` ? (
                                    <i className="ri-loader-4-line fs-5 spin-animation"></i>
                                  ) : (
                                    <i className="ri-sparkling-line fs-5"></i>
                                  )}
                                </button>
                              </div>
                              <div className="position-relative">
                                <input
                                  type="text"
                                  className="form-control form-control-w-side-button"
                                  value={feature.text || ''}
                                  onChange={(e) => {
                                    const newFeatures = [...features];
                                    if (!newFeatures[index]) newFeatures[index] = { title: '', text: '' };
                                    newFeatures[index].text = e.target.value;
                                    updateField('productFeatures', newFeatures);
                                  }}
                                  placeholder="Feature description"
                                />
                                <button
                                  type="button"
                                  className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-1 regenerate-field-btn"
                                  onClick={() => regenerateField(`productFeatures[${index}][text]`, feature.text || '')}
                                  disabled={regeneratingField === `productFeatures[${index}][text]`}
                                >
                                  {regeneratingField === `productFeatures[${index}][text]` ? (
                                    <i className="ri-loader-4-line fs-5 spin-animation"></i>
                                  ) : (
                                    <i className="ri-sparkling-line fs-5"></i>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Image Selection Section */}
                      <div className="mb-3">
                        <button className="btn btn-outline-primary mb-2">
                          <i className="ri-sparkling-line me-2"></i>
                          Generate image with AI
                        </button>
                        <p className="text-muted small mb-2">Select which product images you would like to add</p>
                        <div className="row g-2">
                          {(editedContent.images || []).slice(0, 9).map((image, index) => (
                            <div key={index} className="col-4 col-md-3">
                              <div className="position-relative product-image-card">
                                <img
                                  src={image}
                                  alt={`Product ${index + 1}`}
                                  className="img-fluid rounded"
                                  style={{ aspectRatio: '1', objectFit: 'cover' }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/img_not_found.png';
                                  }}
                                />
                                <button className="btn btn-sm btn-dark position-absolute bottom-0 start-0 end-0 product-image-edit-btn">
                                  Edit with AI
                                </button>
                              </div>
                            </div>
                          ))}
                          {(editedContent.images || []).length > 9 && (
                            <div className="col-4 col-md-3">
                              <div className="d-flex align-items-center justify-content-center bg-light rounded h-100" style={{ aspectRatio: '1' }}>
                                <span className="fw-500 text-muted">+{(editedContent.images || []).length - 9}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* General/Legacy Section - Product Information */}
                  {activeSection === 'general' && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <p className="mb-0 fs-5 fw-600">Product Information</p>
                        <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Product Title */}
                      <AIInputField
                        label="Product Title"
                        value={editedContent.title || ''}
                        onChange={(val) => updateField('title', val)}
                        onRegenerate={() => regenerateField('title', editedContent.title || '')}
                        isRegenerating={regeneratingField === 'title'}
                        placeholder="Product Name"
                      />

                      {/* Price Fields (no regenerate buttons) */}
                      <div className="row">
                        <div className="col-md-6">
                          <AIInputField
                            label="Price"
                            value={String(editedContent.price || '')}
                            onChange={(val) => updateField('price', parseFloat(val) || 0)}
                            onRegenerate={() => {}}
                            isRegenerating={false}
                            placeholder="29.99"
                            type="number"
                            showRegenerateButton={false}
                          />
                        </div>
                        <div className="col-md-6">
                          <AIInputField
                            label="Compare at Price"
                            value={String(editedContent.compareAtPrice || editedContent.compare_at_price || '')}
                            onChange={(val) => updateField('compareAtPrice', parseFloat(val) || 0)}
                            onRegenerate={() => {}}
                            isRegenerating={false}
                            placeholder="49.99"
                            type="number"
                            showRegenerateButton={false}
                          />
                        </div>
                      </div>

                      {/* Product Description */}
                      <AIInputField
                        label="Product Description"
                        value={editedContent.description || ''}
                        onChange={(val) => updateField('description', val)}
                        onRegenerate={() => regenerateField('description', editedContent.description || '')}
                        isRegenerating={regeneratingField === 'description'}
                        placeholder="Describe your product..."
                        type="textarea"
                        rows={4}
                      />

                      {/* Delivery Information */}
                      <AIInputField
                        label="Delivery Information"
                        value={editedContent.deliveryInformation || ''}
                        onChange={(val) => updateField('deliveryInformation', val)}
                        onRegenerate={() => regenerateField('deliveryInformation', editedContent.deliveryInformation || '')}
                        isRegenerating={regeneratingField === 'deliveryInformation'}
                        placeholder="Free shipping on orders over $50..."
                        type="textarea"
                        rows={4}
                      />

                      {/* How It Works */}
                      <AIInputField
                        label="How It Works"
                        value={editedContent.howItWorks || ''}
                        onChange={(val) => updateField('howItWorks', val)}
                        onRegenerate={() => regenerateField('howItWorks', editedContent.howItWorks || '')}
                        isRegenerating={regeneratingField === 'howItWorks'}
                        placeholder="Simply follow these steps..."
                        type="textarea"
                        rows={4}
                      />

                      {/* Instructions */}
                      <AIInputField
                        label="Instructions"
                        value={editedContent.instructions || ''}
                        onChange={(val) => updateField('instructions', val)}
                        onRegenerate={() => regenerateField('instructions', editedContent.instructions || '')}
                        isRegenerating={regeneratingField === 'instructions'}
                        placeholder="For best results..."
                        type="textarea"
                        rows={4}
                      />
                    </div>
                  )}

                  {/* Review Section (matches Laravel _reviews-section.blade.php) */}
                  {activeSection === 'review' && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <p className="mb-0 fs-5 fw-600">Review</p>
                        <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      {(editedContent.testimonials || []).slice(0, 4).map((testimonial, index) => (
                        <div key={index} className="mb-3">
                          <label className="form-label text-dark fw-500 mb-1 fs-small">
                            Review {index + 1}
                            </label>
                          <div className="mb-2">
                            <div className="position-relative mb-2">
                                  <input
                                    type="text"
                                    className="form-control form-control-w-side-button"
                                value={testimonial.name || ''}
                                onChange={(e) => updateNestedField('testimonials', index, 'name', e.target.value)}
                                placeholder="Author name"
                                  />
                                  <button
                                    type="button"
                                    className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-1 regenerate-field-btn"
                                onClick={() => regenerateField(`testimonials[${index}][name]`, testimonial.name || '')}
                                disabled={regeneratingField === `testimonials[${index}][name]`}
                                  >
                                {regeneratingField === `testimonials[${index}][name]` ? (
                                      <i className="ri-loader-4-line fs-5 spin-animation"></i>
                                    ) : (
                                      <i className="ri-sparkling-line fs-5"></i>
                                    )}
                                  </button>
                                </div>
                                <div className="position-relative">
                                  <input
                                    type="text"
                                    className="form-control form-control-w-side-button"
                                value={testimonial.review || ''}
                                onChange={(e) => updateNestedField('testimonials', index, 'review', e.target.value)}
                                placeholder="Review text"
                                  />
                                  <button
                                    type="button"
                                    className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-1 regenerate-field-btn"
                                onClick={() => regenerateField(`testimonials[${index}][review]`, testimonial.review || '')}
                                disabled={regeneratingField === `testimonials[${index}][review]`}
                                  >
                                {regeneratingField === `testimonials[${index}][review]` ? (
                                      <i className="ri-loader-4-line fs-5 spin-animation"></i>
                                    ) : (
                                      <i className="ri-sparkling-line fs-5"></i>
                                    )}
                                  </button>
                                </div>
                              </div>
                          <div className="horizontal-solid-divider border-top mt-2"></div>
                          </div>
                        ))}
                      </div>
                  )}

                  {/* Timeline Section */}
                  {activeSection === 'timeline' && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <p className="mb-0 fs-5 fw-600">Timeline</p>
                        <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <AIInputField
                        label="Timeline Header"
                        value={editedContent.mainCatchyText || ''}
                        onChange={(val) => updateField('mainCatchyText', val)}
                        onRegenerate={() => regenerateField('mainCatchyText', editedContent.mainCatchyText || '')}
                        isRegenerating={regeneratingField === 'mainCatchyText'}
                        placeholder="Your Journey to Success"
                      />
                      
                      <div className="text-muted small mb-3">
                        <i className="ri-information-line me-1"></i>
                        Timeline steps are auto-generated based on product type
                      </div>
                    </div>
                  )}

                  {/* Product Information Section */}
                  {activeSection === 'product-information' && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <p className="mb-0 fs-5 fw-600">Product Information</p>
                        <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
                          <Trash2 size={16} />
                              </button>
                            </div>

                      <AIInputField
                        label="Section Header"
                        value={editedContent.header || ''}
                        onChange={(val) => updateField('header', val)}
                        onRegenerate={() => regenerateField('header', editedContent.header || '')}
                        isRegenerating={regeneratingField === 'header'}
                        placeholder="Why Choose Our Product?"
                      />

                      <AIInputField
                        label="Section Subheading"
                        value={editedContent.subheading || ''}
                        onChange={(val) => updateField('subheading', val)}
                        onRegenerate={() => regenerateField('subheading', editedContent.subheading || '')}
                        isRegenerating={regeneratingField === 'subheading'}
                        placeholder="Discover the benefits that make us unique"
                      />

                      <AIInputField
                        label="Product Description"
                        value={editedContent.description || ''}
                        onChange={(val) => updateField('description', val)}
                        onRegenerate={() => regenerateField('description', editedContent.description || '')}
                        isRegenerating={regeneratingField === 'description'}
                        placeholder="Describe your product..."
                        type="textarea"
                        rows={4}
                      />

                      <AIInputField
                        label="How To Use"
                        value={editedContent.instructions || ''}
                        onChange={(val) => updateField('instructions', val)}
                        onRegenerate={() => regenerateField('instructions', editedContent.instructions || '')}
                        isRegenerating={regeneratingField === 'instructions'}
                        placeholder="Instructions for use..."
                        type="textarea"
                        rows={4}
                      />

                      <AIInputField
                        label="Delivery Information"
                        value={editedContent.deliveryInformation || ''}
                        onChange={(val) => updateField('deliveryInformation', val)}
                        onRegenerate={() => regenerateField('deliveryInformation', editedContent.deliveryInformation || '')}
                        isRegenerating={regeneratingField === 'deliveryInformation'}
                        placeholder="Shipping and delivery details..."
                        type="textarea"
                        rows={4}
                      />

                      <AIInputField
                        label="How It Works"
                        value={editedContent.howItWorks || ''}
                        onChange={(val) => updateField('howItWorks', val)}
                        onRegenerate={() => regenerateField('howItWorks', editedContent.howItWorks || '')}
                        isRegenerating={regeneratingField === 'howItWorks'}
                        placeholder="Explain how your product works..."
                        type="textarea"
                        rows={4}
                      />
                        </div>
                      )}

                  {/* What Makes Us Different Section */}
                  {activeSection === 'what-makes-us-different' && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <p className="mb-0 fs-5 fw-600">What Makes Us Different</p>
                        <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <AIInputField
                        label="Section Header"
                        value={editedContent.featureHeader || ''}
                        onChange={(val) => updateField('featureHeader', val)}
                        onRegenerate={() => regenerateField('featureHeader', editedContent.featureHeader || '')}
                        isRegenerating={regeneratingField === 'featureHeader'}
                        placeholder="What Makes Us Different"
                      />

                      <AIInputField
                        label="Why Choose Us"
                        value={editedContent.whyChooseUsText || ''}
                        onChange={(val) => updateField('whyChooseUsText', val)}
                        onRegenerate={() => regenerateField('whyChooseUsText', editedContent.whyChooseUsText || '')}
                        isRegenerating={regeneratingField === 'whyChooseUsText'}
                        placeholder="Why customers should choose your product..."
                        type="textarea"
                        rows={4}
                      />

                      {/* Benefits */}
                      <label className="form-label text-dark fw-500 mb-2 fs-small">Key Benefits</label>
                      {(editedContent.benefits || []).slice(0, 4).map((benefit, index) => (
                        <div key={index} className="position-relative mb-2">
                              <input
                                type="text"
                                className="form-control form-control-w-side-button"
                                value={benefit}
                                onChange={(e) => updateArrayField('benefits', index, e.target.value)}
                                placeholder={`Benefit ${index + 1}`}
                              />
                              <button
                                type="button"
                                className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-1 regenerate-field-btn"
                                onClick={() => regenerateField(`benefits[${index}]`, benefit)}
                                disabled={regeneratingField === `benefits[${index}]`}
                              >
                                {regeneratingField === `benefits[${index}]` ? (
                                  <i className="ri-loader-4-line fs-5 spin-animation"></i>
                                ) : (
                                  <i className="ri-sparkling-line fs-5"></i>
                                )}
                              </button>
                            </div>
                          ))}
                    </div>
                  )}

                  {/* Clinical Section */}
                  {activeSection === 'clinical-section' && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <p className="mb-0 fs-5 fw-600">Clinical Section</p>
                        <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <AIInputField
                        label="Clinical Header"
                        value={editedContent.mainCatchyText || ''}
                        onChange={(val) => updateField('mainCatchyText', val)}
                        onRegenerate={() => regenerateField('mainCatchyText', editedContent.mainCatchyText || '')}
                        isRegenerating={regeneratingField === 'mainCatchyText'}
                        placeholder="Clinically Proven Results"
                      />

                      <AIInputField
                        label="Clinical Subheader"
                        value={editedContent.subMainCatchyText || ''}
                        onChange={(val) => updateField('subMainCatchyText', val)}
                        onRegenerate={() => regenerateField('subMainCatchyText', editedContent.subMainCatchyText || '')}
                        isRegenerating={regeneratingField === 'subMainCatchyText'}
                        placeholder="Backed by science and customer satisfaction"
                      />

                      <div className="text-muted small">
                        <i className="ri-information-line me-1"></i>
                        Statistics are auto-generated based on product data
                                </div>
                              </div>
                  )}

                  {/* Hero Section (legacy) */}
                  {activeSection === 'hero' && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <p className="mb-0 fs-5 fw-600">Hero Section</p>
                        <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
                          <Trash2 size={16} />
                                  </button>
                                </div>
                      
                      <AIInputField
                        label="Main Catchy Text"
                        value={editedContent.mainCatchyText || ''}
                        onChange={(val) => updateField('mainCatchyText', val)}
                        onRegenerate={() => regenerateField('mainCatchyText', editedContent.mainCatchyText || '')}
                        isRegenerating={regeneratingField === 'mainCatchyText'}
                        placeholder="Transform Your Daily Life"
                        hint="Maximum 8 words recommended"
                      />

                      <AIInputField
                        label="Sub Catchy Text"
                        value={editedContent.subMainCatchyText || ''}
                        onChange={(val) => updateField('subMainCatchyText', val)}
                        onRegenerate={() => regenerateField('subMainCatchyText', editedContent.subMainCatchyText || '')}
                        isRegenerating={regeneratingField === 'subMainCatchyText'}
                        placeholder="Discover the solution that changes everything"
                        hint="Maximum 12 words recommended"
                      />
                    </div>
                  )}


                  {/* FAQs Section (matches Laravel theme) */}
                  {(activeSection === 'faqs' || activeSection === 'faq') && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <p className="mb-0 fs-5 fw-600">FAQs</p>
                        <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      {(editedContent.faq || []).map((item, index) => (
                        <div key={index} className="mb-3">
                          <label className="form-label text-dark fw-500 mb-2 fs-small">
                            <i className="ri-question-line me-1 text-muted"></i>
                            Question {index + 1}
                          </label>
                          
                          {/* Question */}
                          <div className="position-relative mb-2">
                            <input
                              type="text"
                              className="form-control form-control-w-side-button"
                              value={item.question || ''}
                              onChange={(e) => updateNestedField('faq', index, 'question', e.target.value)}
                              placeholder="How does it work?"
                            />
                            <button
                              type="button"
                              className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-1 regenerate-field-btn"
                              onClick={() => regenerateField(`faq[${index}][question]`, item.question || '')}
                              disabled={regeneratingField === `faq[${index}][question]`}
                              title="Régénérer par IA"
                            >
                              {regeneratingField === `faq[${index}][question]` ? (
                                <i className="ri-loader-4-line fs-5 spin-animation"></i>
                              ) : (
                                <i className="ri-sparkling-line fs-5"></i>
                              )}
                            </button>
                          </div>
                          
                          {/* Answer */}
                          <div className="position-relative mb-2">
                            <textarea
                              className="form-control form-control-w-side-button"
                              rows={3}
                              value={item.answer || ''}
                              onChange={(e) => updateNestedField('faq', index, 'answer', e.target.value)}
                              placeholder="Here's how..."
                            />
                            <button
                              type="button"
                              className="btn position-absolute top-0 end-0 mt-2 me-2 p-1 regenerate-field-btn"
                              onClick={() => regenerateField(`faq[${index}][answer]`, item.answer || '')}
                              disabled={regeneratingField === `faq[${index}][answer]`}
                              title="Régénérer par IA"
                            >
                              {regeneratingField === `faq[${index}][answer]` ? (
                                <i className="ri-loader-4-line fs-5 spin-animation"></i>
                              ) : (
                                <i className="ri-sparkling-line fs-5"></i>
                              )}
                            </button>
                          </div>
                          
                          <div className="horizontal-solid-divider border-top mt-3"></div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comparison Table Section */}
                  {activeSection === 'comparison-table' && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <p className="mb-0 fs-5 fw-600">Comparison Table</p>
                        <button className="btn btn-link icon-text-sub text-decoration-none" type="button">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <AIInputField
                        label="Table Header"
                        value={editedContent.header || 'Why Choose Us Over Others?'}
                        onChange={(val) => updateField('header', val)}
                        onRegenerate={() => regenerateField('header', editedContent.header || '')}
                        isRegenerating={regeneratingField === 'header'}
                        placeholder="Why Choose Us Over Others?"
                      />

                      <AIInputField
                        label="Table Subheader"
                        value={editedContent.subheading || 'See how we stack up against ordinary products'}
                        onChange={(val) => updateField('subheading', val)}
                        onRegenerate={() => regenerateField('subheading', editedContent.subheading || '')}
                        isRegenerating={regeneratingField === 'subheading'}
                        placeholder="See how we stack up against ordinary products"
                      />

                      {/* Comparison Features */}
                      <label className="form-label text-dark fw-500 mb-2 fs-small">Comparison Features</label>
                      {(editedContent.features || []).slice(0, 5).map((feature, index) => (
                        <div key={index} className="position-relative mb-2">
                          <input
                            type="text"
                            className="form-control form-control-w-side-button"
                            value={feature}
                            onChange={(e) => updateArrayField('features', index, e.target.value)}
                            placeholder={`Feature ${index + 1}`}
                          />
                          <button
                            type="button"
                            className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-1 regenerate-field-btn"
                            onClick={() => regenerateField(`features[${index}]`, feature)}
                            disabled={regeneratingField === `features[${index}]`}
                          >
                            {regeneratingField === `features[${index}]` ? (
                              <i className="ri-loader-4-line fs-5 spin-animation"></i>
                            ) : (
                              <i className="ri-sparkling-line fs-5"></i>
                            )}
                          </button>
                        </div>
                      ))}

                      <div className="text-muted small mt-3">
                        <i className="ri-information-line me-1"></i>
                        Checkmarks are automatically assigned to &quot;Our Product&quot; column
                      </div>
                    </div>
                  )}

                  {/* Images Section */}
                  {activeSection === 'images' && (
                    <div>
                      <h5 className="fw-600 mb-4">Images du produit</h5>
                      
                      <div className="row">
                        {(editedContent.images || []).slice(0, 8).map((image, index) => (
                          <div key={index} className="col-6 col-md-3 mb-3">
                            <div className="card h-100">
                              <img
                                src={image}
                                alt={`Image ${index + 1}`}
                                className="card-img-top"
                                style={{ height: '150px', objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/img_not_found.png';
                                }}
                              />
                              <div className="card-body p-2 text-center">
                                <small className="text-muted">Image {index + 1}</small>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {(editedContent.images || []).length === 0 && (
                        <div className="alert alert-info">
                          <i className="ri-information-line me-2"></i>
                          Aucune image disponible. Les images seront récupérées depuis le produit source.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            {showPreview && (
              <div className="col-lg-7 mb-4">
                <div 
                  className={`card border-0 shadow-sm sticky-top ${previewExpanded ? 'preview-expanded' : ''}`}
                  style={{ 
                    top: '1rem',
                    height: previewExpanded ? '90vh' : 'calc(100vh - 120px)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* Preview Header - Laravel style */}
                  <div className="card-header bg-light border-bottom d-flex align-items-center justify-content-between py-2 px-3">
                    {/* Left: Page Type & Theme Selectors */}
                    <div className="d-flex align-items-center gap-2">
                      <select
                        className="form-select form-select-sm page-toggle"
                        value={pageType}
                        onChange={(e) => {
                          setPageType(e.target.value as 'product' | 'home');
                          // Use ref to get latest refreshPreview with updated pageType
                          setTimeout(() => refreshPreviewRef.current(), 200);
                        }}
                        style={{ maxWidth: '140px', fontSize: '0.8rem' }}
                      >
                        <option value="product">Product Page</option>
                        <option value="home">Home Page</option>
                      </select>
                      <select
                        className="form-select form-select-sm"
                        value={themeKey}
                        onChange={(e) => {
                          setThemeKey(e.target.value);
                          // Use ref to get latest refreshPreview with updated themeKey
                          setTimeout(() => refreshPreviewRef.current(), 200);
                        }}
                        style={{ maxWidth: '100px', fontSize: '0.8rem' }}
                      >
                        <option value="theme_v4">Theme V4</option>
                        <option value="theme_v3">Theme V3</option>
                      </select>
                    </div>

                    {/* Center: Device Toggle */}
                    <div className="preview-device-toggle d-flex">
                      <button
                        type="button"
                        className={`preview-device-btn ${previewDevice === 'mobile' ? 'active' : ''}`}
                        onClick={() => setPreviewDevice('mobile')}
                      >
                        Mobile
                      </button>
                      <button
                        type="button"
                        className={`preview-device-btn ${previewDevice === 'desktop' ? 'active' : ''}`}
                        onClick={() => setPreviewDevice('desktop')}
                      >
                        Desktop
                      </button>
                    </div>

                    {/* Right: Actions */}
                    <div className="d-flex gap-1 align-items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={refreshPreview}
                        disabled={isPreviewLoading}
                        title="Rafraîchir l'aperçu"
                        className="p-1"
                      >
                        <RefreshCw size={14} className={isPreviewLoading ? 'spin-animation' : ''} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewExpanded(!previewExpanded)}
                        title={previewExpanded ? 'Réduire' : 'Agrandir'}
                        className="p-1"
                      >
                        {previewExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                      </Button>
                      <a
                        href={`/api/ai/liquid-preview?product_id=${productId}&page_type=${pageType}&theme=${themeKey}&t=${Date.now()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 ms-2"
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        title="Voir la boutique"
                      >
                        <ExternalLink size={12} />
                        <span className="d-none d-xl-inline">Voir la boutique</span>
                      </a>
                    </div>
                  </div>
                  
                  {/* Preview Content */}
                  <div className="card-body p-0 position-relative d-flex justify-content-center" style={{ height: 'calc(100% - 50px)', backgroundColor: '#e8e8e8' }}>
                    <div 
                      className={`preview-iframe-wrapper ${previewDevice === 'mobile' ? 'preview-mobile' : 'preview-desktop'}`}
                      style={{
                        width: previewDevice === 'mobile' ? '375px' : '100%',
                        height: '100%',
                        transition: 'width 0.3s ease',
                        backgroundColor: '#fff',
                        boxShadow: previewDevice === 'mobile' ? '0 4px 20px rgba(0,0,0,0.15)' : 'none',
                        borderRadius: previewDevice === 'mobile' ? '20px' : '0',
                        overflow: 'hidden',
                        marginTop: previewDevice === 'mobile' ? '10px' : '0',
                        marginBottom: previewDevice === 'mobile' ? '10px' : '0',
                        position: 'relative',
                      }}
                    >
                      {/* Skeleton Loading Overlay */}
                      {isPreviewLoading && (
                        <div 
                          className="preview-skeleton-overlay"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: '#ffffff',
                            zIndex: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                          }}
                        >
                          {/* Skeleton Announcement Bar */}
                          <div style={{ 
                            width: '100%', 
                            height: '32px', 
                            background: 'linear-gradient(90deg, #e8e4df 0%, #f0ece8 50%, #e8e4df 100%)',
                            backgroundSize: '200% 100%',
                            animation: 'skeleton-shimmer 1.5s infinite',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <div style={{ width: '60%', height: '10px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '4px' }}></div>
                          </div>
                          
                          {/* Skeleton Header */}
                          <div style={{ 
                            padding: '12px 16px', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            borderBottom: '1px solid #f0f0f0'
                          }}>
                            <div style={{ width: '80px', height: '20px', backgroundColor: '#e9ecef', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                              <div style={{ width: '20px', height: '20px', backgroundColor: '#e9ecef', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                              <div style={{ width: '20px', height: '20px', backgroundColor: '#e9ecef', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                            </div>
                          </div>
                          
                          {/* Skeleton Main Content - scrollable area */}
                          <div style={{ flex: 1, padding: '16px', overflow: 'hidden' }}>
                            {/* Product Image */}
                            <div style={{ 
                              width: '100%', 
                              aspectRatio: '1', 
                              backgroundColor: '#f5f5f5', 
                              borderRadius: '12px', 
                              marginBottom: '12px',
                              background: 'linear-gradient(90deg, #f0f0f0 0%, #f8f8f8 50%, #f0f0f0 100%)',
                              backgroundSize: '200% 100%',
                              animation: 'skeleton-shimmer 1.5s infinite',
                            }}></div>
                            
                            {/* Thumbnails */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                              {[1,2,3,4].map(i => (
                                <div key={i} style={{ 
                                  width: '56px', 
                                  height: '56px', 
                                  backgroundColor: '#f0f0f0', 
                                  borderRadius: '8px', 
                                  animation: 'skeleton-pulse 1.5s infinite',
                                  animationDelay: `${i * 0.1}s`
                                }}></div>
                              ))}
                            </div>
                            
                            {/* Product Title */}
                            <div style={{ width: '75%', height: '20px', backgroundColor: '#e9ecef', borderRadius: '4px', marginBottom: '10px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                            
                            {/* Price */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                              <div style={{ width: '60px', height: '24px', backgroundColor: '#e9ecef', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                              <div style={{ width: '50px', height: '16px', backgroundColor: '#f0f0f0', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                            </div>
                            
                            {/* Description */}
                            <div style={{ marginBottom: '20px' }}>
                              <div style={{ width: '100%', height: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '8px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                              <div style={{ width: '95%', height: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '8px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                              <div style={{ width: '80%', height: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                            </div>
                            
                            {/* CTA Button */}
                            <div style={{ 
                              width: '100%', 
                              height: '48px', 
                              background: 'linear-gradient(90deg, #d4cfc8 0%, #e0dbd5 50%, #d4cfc8 100%)',
                              backgroundSize: '200% 100%',
                              borderRadius: '24px', 
                              animation: 'skeleton-shimmer 1.5s infinite',
                              marginBottom: '16px'
                            }}></div>
                            
                            {/* Trust badges */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                              {[1,2,3].map(i => (
                                <div key={i} style={{ 
                                  width: '50px', 
                                  height: '30px', 
                                  backgroundColor: '#f5f5f5', 
                                  borderRadius: '4px',
                                  animation: 'skeleton-pulse 1.5s infinite',
                                  animationDelay: `${i * 0.15}s`
                                }}></div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Loading indicator */}
                          <div style={{ 
                            position: 'absolute', 
                            bottom: '20px', 
                            left: '50%', 
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}>
                            <div className="spinner-border spinner-border-sm text-secondary" role="status" style={{ width: '14px', height: '14px' }}>
                              <span className="visually-hidden">Chargement...</span>
                            </div>
                            <span style={{ fontSize: '12px', color: '#666' }}>Chargement de l&apos;aperçu...</span>
                          </div>
                        </div>
                      )}
                      <iframe
                        ref={previewIframeRef}
                        className="w-100 h-100 border-0"
                        style={{
                          backgroundColor: '#fff',
                          opacity: isPreviewLoading ? 0 : 1,
                          transition: 'opacity 0.3s ease',
                        }}
                        onLoad={() => setIsPreviewLoading(false)}
                        title="Aperçu de la boutique"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom styles for the editor */}
      <style jsx global>{`
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes skeleton-pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        .preview-skeleton-overlay {
          animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .preview-expanded {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100vh !important;
          z-index: 1050 !important;
          margin: 0 !important;
          border-radius: 0 !important;
        }
        
        .regenerate-btn {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .form-group-with-ai:hover .regenerate-btn {
          opacity: 1;
        }
        
        .nav-pills .nav-link.active {
          background-color: #2563eb;
          color: white;
        }
        
        .nav-pills .nav-link {
          color: #6b7280;
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
        }
        
        .nav-pills .nav-link:hover:not(.active) {
          background-color: #f3f4f6;
        }
        
        /* Input field with side button for regenerate */
        .form-control-w-side-button {
          padding-right: 50px !important;
        }
        
        /* Regenerate field button styling (Laravel style) */
        .regenerate-field-btn {
          background: transparent;
          border: none;
          color: #6c757d;
          transition: all 0.2s ease;
          opacity: 0.6;
        }
        
        .regenerate-field-btn:hover {
          color: #2563eb;
          opacity: 1;
          transform: scale(1.1);
        }
        
        .regenerate-field-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        
        .regenerate-field-btn i {
          display: block;
        }
        
        /* Small label styling */
        .fs-small {
          font-size: 0.85rem;
        }
        
        .fs-xs {
          font-size: 0.75rem;
        }
        
        /* Icon text styling */
        .icon-text-sub {
          color: #6c757d;
        }
        
        .icon-text-sub:hover {
          color: #dc3545;
        }
        
        /* Horizontal divider */
        .horizontal-solid-divider {
          margin: 1rem 0;
        }
        
        /* Preview device toggle (Laravel style) */
        .preview-device-toggle {
          background-color: #e9ecef;
          border-radius: 6px;
          padding: 2px;
          display: flex;
        }
        
        .preview-device-btn {
          padding: 4px 12px;
          font-size: 0.75rem;
          font-weight: 500;
          border: none;
          background: transparent;
          color: #6c757d;
          border-radius: 4px;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .preview-device-btn:hover {
          color: #333;
        }
        
        .preview-device-btn.active {
          background-color: #fff;
          color: #333;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        /* Page toggle select */
        .page-toggle {
          border: 1px solid #dee2e6;
          font-weight: 500;
        }
        
        /* Dropdown styling with visible arrows */
        .form-select {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 0.5rem center;
          background-size: 12px 10px;
          padding-right: 1.75rem;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }
        
        .form-select-sm {
          padding-right: 1.5rem;
          background-position: right 0.4rem center;
          background-size: 10px 8px;
        }
        
        /* Preview iframe wrapper for mobile device frame */
        .preview-iframe-wrapper.preview-mobile {
          position: relative;
        }
        
        .preview-iframe-wrapper.preview-mobile::before {
          content: '';
          position: absolute;
          top: 5px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 4px;
          background: #333;
          border-radius: 2px;
          z-index: 10;
        }
        
        /* Customize tabs (matches Laravel) */
        .customize-tabs {
          padding: 0;
        }
        
        .customize-tabs .nav-tabs {
          border: none;
          display: flex;
          gap: 0;
        }
        
        .customize-tab {
          flex: 1;
          text-align: center;
          padding: 12px 16px;
          font-weight: 500;
          font-size: 14px;
          color: #6c757d;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .customize-tab:hover {
          color: #333;
          background: #f8f9fa;
        }
        
        .customize-tab.active {
          color: #2563eb;
          border-bottom-color: #2563eb;
          background: transparent;
        }
        
        /* Font option styling (Laravel style) */
        .font-option-label {
          cursor: pointer;
          display: block;
        }
        
        .font-option-box {
          padding: 10px 14px;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          text-align: center;
          transition: all 0.2s ease;
          position: relative;
          min-width: 70px;
        }
        
        .font-option-box:hover {
          border-color: #2563eb;
          background-color: #f8f9fa;
        }
        
        .font-option-box.active {
          border-color: #2563eb;
          background-color: #eff6ff;
        }
        
        .font-option-box .checkmark {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 18px;
          height: 18px;
          background: #2563eb;
          border-radius: 50%;
          display: none;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
        }
        
        .font-option-box.active .checkmark {
          display: flex;
        }
        
        /* Color picker styling */
        .color-picker-label {
          display: block;
          border: 2px solid #dee2e6;
          transition: all 0.2s ease;
        }
        
        .color-picker-label:hover {
          border-color: #2563eb;
          transform: scale(1.05);
        }
        
        /* Accordion styling for styles tab */
        .accordion-button:not(.collapsed) {
          color: #333;
          background-color: #f8f9fa;
        }
        
        .accordion-button:focus {
          box-shadow: none;
          border-color: transparent;
        }
        
        .accordion-button::after {
          width: 14px;
          height: 14px;
          background-size: 14px;
        }
        
        /* Section navigation (matches Laravel accordion style) */
        .section-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .section-nav-item {
          display: flex;
          align-items: center;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        
        .section-nav-item:hover {
          background: #f3f4f6;
        }
        
        .section-nav-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 500;
          color: #4b5563;
          background: transparent;
          border: none;
          text-align: left;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        
        .section-nav-btn:hover {
          color: #1f2937;
        }
        
        .section-nav-btn.active {
          background: #eff6ff;
          color: #2563eb;
        }
        
        .section-nav-btn i {
          font-size: 15px;
          opacity: 0.7;
        }
        
        .section-delete-btn {
          padding: 6px 8px;
          background: transparent;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          border-radius: 4px;
          opacity: 0;
          transition: all 0.2s ease;
        }
        
        .section-nav-item:hover .section-delete-btn {
          opacity: 1;
        }
        
        .section-delete-btn:hover {
          color: #ef4444;
          background: #fef2f2;
        }
        
        /* Section reorder buttons */
        .section-reorder-btns {
          display: flex;
          flex-direction: column;
          gap: 0;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .section-nav-item:hover .section-reorder-btns {
          opacity: 1;
        }
        
        .section-move-btn {
          padding: 0;
          width: 18px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .section-move-btn:hover:not(:disabled) {
          color: #2563eb;
          background: #eff6ff;
        }
        
        .section-move-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        
        .section-move-btn i {
          font-size: 14px;
        }
        
        /* Section visibility toggle */
        .section-visibility-btn {
          padding: 4px 6px;
          background: transparent;
          border: none;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s ease;
          border-radius: 4px;
        }
        
        .section-nav-item:hover .section-visibility-btn {
          opacity: 1;
        }
        
        .section-visibility-btn:hover {
          background: #f3f4f6;
        }
        
        .section-visibility-btn i {
          font-size: 14px;
        }
        
        /* Hidden section state */
        .section-nav-item.section-hidden {
          opacity: 0.6;
        }
        
        .section-nav-item.section-hidden .section-nav-btn {
          background: #f9fafb;
        }
        
        .section-nav-item.section-hidden .section-visibility-btn {
          opacity: 1;
        }
        
        /* Product image card */
        .product-image-card {
          border-radius: 8px;
          overflow: hidden;
        }
        
        .product-image-edit-btn {
          opacity: 0;
          transition: opacity 0.2s ease;
          font-size: 11px;
          padding: 4px 8px;
          margin: 4px;
          border-radius: 4px;
        }
        
        .product-image-card:hover .product-image-edit-btn {
          opacity: 1;
        }
      `}</style>
    </>
  );
}

