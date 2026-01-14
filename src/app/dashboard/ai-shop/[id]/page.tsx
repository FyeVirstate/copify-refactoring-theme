"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
// DashboardHeader removed - using custom header for AI store editor
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, RefreshCw, Eye, EyeOff, Maximize2, Minimize2, ArrowLeft, Save, Trash2, ExternalLink } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";

// Import extracted styles (copy the <style jsx global> content to this file)
import "@/styles/ai-shop-editor.css";
import "@/styles/ai-image-editor-modal.css";

// Import AI Image Editor Modal
import { AIImageEditorModal } from "@/components/ai-store/AIImageEditorModal";

// Import Section Components
import {
  TestimonialsSection,
  HeroSection,
  ProductInfoSection,
  FAQSection,
  ClinicalSection,
  BenefitsSection,
  ReviewsSection,
  ImageSelector,
  TimelineSection,
  ComparisonSection,
  ImageWithTextSection,
  FeaturedProductSection,
  AnnouncementBarSection,
  VideoGridSection,
} from "@/components/ai-store/sections";

// Import AI Image Generator
// AIImageGenerator import removed - AI images are now generated automatically during store creation
// import { AIImageGenerator } from "@/components/ai-store/AIImageGenerator";

// ========================================
// SECTION DEFINITIONS (outside component to prevent infinite loops)
// Match Laravel sortableSectionNav exactly (French labels from translate.php)
// ========================================

// Product page sections - EXACT ORDER FROM LARAVEL (matching screenshot)
// Each section maps to a specific part of the live preview
const PRODUCT_PAGE_SECTIONS = [
  { id: 'product-information', label: 'Informations sur le produit', icon: 'ri-price-tag-3-line' },  // 1. First section in preview
  { id: 'review', label: 'Témoignages', icon: 'ri-text-spacing' },                                     // 2. Reviews/testimonials - FIRST testimonials section
  { id: 'timeline', label: 'Comment Faire', icon: 'ri-time-line' },                                   // 3. Timeline/How it works
  { id: 'what-makes-us-different', label: 'Caractéristiques', icon: 'ri-thumb-up-line' },            // 4. Benefits/Features
  { id: 'comparison-table', label: 'Tableau Comparatif', icon: 'ri-table-line' },                    // 5. Comparison table
  { id: 'clinical-section', label: 'Statistiques', icon: 'ri-donut-chart-fill' },                    // 6. Statistics/Clinical
  { id: 'testimonials-marquee', label: 'Témoignages', icon: 'ri-star-line' },                        // 7. Black bar testimonials (star icon) - JUST BEFORE HERO
  { id: 'hero', label: 'Héro', icon: 'ri-layout-top-line' },                                          // 8. Hero section
  { id: 'faqs', label: 'FAQ', icon: 'ri-question-answer-line' },                                     // 9. FAQ - last
];

// Home page sections (page d'accueil) - Same order for consistency
const HOME_PAGE_SECTIONS = [
  { id: 'announcement-bar', label: 'Barre d\'annonce', icon: 'ri-megaphone-line' },
  { id: 'product-information', label: 'Informations sur le produit', icon: 'ri-price-tag-3-line' },
  { id: 'review', label: 'Témoignages', icon: 'ri-text-spacing' },                                     // FIRST testimonials section
  { id: 'timeline', label: 'Comment Faire', icon: 'ri-time-line' },
  { id: 'what-makes-us-different', label: 'Caractéristiques', icon: 'ri-thumb-up-line' },
  { id: 'comparison-table', label: 'Tableau Comparatif', icon: 'ri-table-line' },
  { id: 'clinical-section', label: 'Statistiques', icon: 'ri-donut-chart-fill' },
  { id: 'testimonials-marquee', label: 'Témoignages', icon: 'ri-star-line' },                        // SECOND testimonials section (black bar) - JUST BEFORE HERO
  { id: 'hero', label: 'Héro', icon: 'ri-layout-top-line' },
  { id: 'faqs', label: 'FAQ', icon: 'ri-question-answer-line' },
  { id: 'image-with-text', label: 'Image avec Texte', icon: 'ri-image-2-line' },
  { id: 'video-grid', label: 'Grille Vidéo', icon: 'ri-video-line' },
];

// Map sidebar section IDs to theme section types (matching Laravel sectionTypeMap exactly)
// Defined outside component to prevent re-creation on every render
// 
// NOTE: theme_v4 template sections:
// - pdp-main-product: Main product info section
// - header-with-marquee: Testimonial cards with reviewer names (first Témoignages)
// - marquee: Black bar with scrolling text (second Témoignages)
// - There is NO product-reviews section in theme_v4!
const SECTION_TYPE_MAP: Record<string, string> = {
  // Product Page Sections
  'product-information': 'pdp-main-product',          // First section - product info
  'featured-product': 'pdp-main-product',
  'general': 'featured-product',
  // First Témoignages - testimonial cards with names (text-spacing icon)
  'review': 'header-with-marquee',                    // Testimonial cards section
  'reviews': 'header-with-marquee',
  'product-reviews': 'header-with-marquee',
  'timeline': 'timeline-points',                      // Comment Faire / How it works
  'what-makes-us-different': 'pdp-benefits',          // Caractéristiques / Benefits
  'comparison-table': 'pdp-comparison-table',         // Tableau Comparatif
  'pdp-comparison-table': 'pdp-comparison-table',
  'clinical-section': 'pdp-statistics-column',        // Statistiques
  // Second Témoignages - black bar marquee (star icon)
  'testimonials-marquee': 'marquee',                  // Black bar scrolling text
  'hero': 'img-with-txt',                             // Hero section
  'faqs': 'faq',                                      // FAQ section
  'faq': 'faq',
  'image-faq': 'image-faq',
  'product-section': 'product-section-1',             // Product section (last)
  
  // Homepage Sections
  'testimonials': 'header-with-marquee',
  'header-with-marquee': 'header-with-marquee',
  'middle-page': 'header-with-marquee',
  'video-grid': 'video-gris-slider',
  'video-gris-slider': 'video-gris-slider',
  'image-with-text': 'image-with-text',
  'newsletter': 'custom-newsletter',
  
  // Other Sections
  'images': 'product-images',
  'announcement-bar': 'announcement-bar',
  'rich-text': 'rich-text',
};

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
  icon?: string; // Remixicon class like "ri-text" or "ri-file-text-line"
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
  icon,
}) => {
  return (
    <div className="mb-3">
      <label className="form-label text-dark fw-500 mb-1 fs-xs">
        {icon && <i className={`${icon} me-1 text-light-gray`}></i>}
        {label}
      </label>
      <div className="position-relative input-with-regenerate">
        {type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`form-control form-control-sm ${showRegenerateButton ? 'form-control-w-side-button' : ''}`}
            placeholder={placeholder}
            rows={rows}
          />
        ) : type === 'number' ? (
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="form-control form-control-sm"
            placeholder={placeholder}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`form-control form-control-sm ${showRegenerateButton ? 'form-control-w-side-button' : ''}`}
            placeholder={placeholder}
          />
        )}
        {showRegenerateButton && (
          <button
            type="button"
            className={`btn position-absolute ${type === 'textarea' ? 'top-0 mt-2' : 'top-50 translate-middle-y'} end-0 me-2 p-1 regenerate-field-btn`}
            onClick={onRegenerate}
            disabled={isRegenerating}
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            title="Régénérer avec IA"
          >
            {isRegenerating ? (
              <i className="ri-loader-4-line regenerate-loading-icon spin-animation"></i>
            ) : (
              <i className="ri-sparkling-line regenerate-loading-icon"></i>
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
  const [activeSection, setActiveSection] = useState("product-information");
  
  // Step navigation - Start at step 2 (Sélectionner) when editing existing store
  const [currentStep, setCurrentStep] = useState(2);
  
  // Step 2: Image selection state
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [allOriginalImages, setAllOriginalImages] = useState<string[]>([]); // Keep ALL images for Step 2 display
  const [storeName, setStoreName] = useState("YOUR BRAND");
  const [showAllImages, setShowAllImages] = useState(false);
  // showAIGenerator removed - AI images are now generated automatically during store creation
  const [aiGeneratedImages, setAiGeneratedImages] = useState<Array<{ image_url: string; prompt: string; index: number }>>([]); // Store AI generated images
  const INITIAL_IMAGES_COUNT = 9; // Show 9 images initially (matching Laravel), then "+X" for more
  
  // AI Image Editor Modal state
  const [isAIEditorOpen, setIsAIEditorOpen] = useState(false);
  const [aiEditorSelectedImage, setAiEditorSelectedImage] = useState<string | null>(null);
  const [aiEditorIsUploadMode, setAiEditorIsUploadMode] = useState(false);
  
  // Preview panel state
  const [showPreview, setShowPreview] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true); // Start with loading state since iframe has no initial src
  const [showAnnouncementBanner, setShowAnnouncementBanner] = useState(true); // Yellow info banner
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [regeneratingField, setRegeneratingField] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [pageType, setPageType] = useState<'product' | 'home'>('product');
  const [themeKey, setThemeKey] = useState('theme_v4');
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // ========================================
  // WYSIWYG Preview Communication Functions
  // ========================================

  // Send message to preview iframe for section highlight/scroll
  // noHighlight = true means scroll only, don't show the blue box (used after edit refresh)
  const scrollPreviewToSection = useCallback((sectionId: string, noHighlight: boolean = false) => {
    const iframe = previewIframeRef.current;
    console.log('[WYSIWYG] scrollPreviewToSection called:', sectionId, 'noHighlight:', noHighlight, 'iframe:', !!iframe);
    if (iframe && iframe.contentWindow) {
      const sectionType = SECTION_TYPE_MAP[sectionId] || sectionId;
      console.log('[WYSIWYG] Sending postMessage to iframe:', { type: 'scrollToSection', sectionType, noHighlight });
      iframe.contentWindow.postMessage({
        type: 'scrollToSection',
        sectionType: sectionType,
        noHighlight: noHighlight
      }, '*');
    } else {
      console.log('[WYSIWYG] iframe or contentWindow not available');
    }
  }, []);

  // Highlight a specific input in the preview
  const highlightPreviewInput = useCallback((inputName: string, sectionId: string) => {
    const iframe = previewIframeRef.current;
    if (iframe && iframe.contentWindow) {
      const sectionType = SECTION_TYPE_MAP[sectionId] || sectionId;
      iframe.contentWindow.postMessage({
        type: 'highlightInput',
        inputName: inputName,
        sectionType: sectionType
      }, '*');
    }
  }, []);

  // Clear highlight in preview
  const clearPreviewHighlight = useCallback(() => {
    const iframe = previewIframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'clearHighlight'
      }, '*');
    }
  }, []);

  // Hidden sections state (sections toggled off) - declared early for use in callbacks
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());

  // Handle section hover - scroll preview to section (only if section is visible)
  const handleSectionHover = useCallback((sectionId: string) => {
    // Don't scroll/highlight if section is hidden
    if (hiddenSections.has(sectionId)) {
      return;
    }
    scrollPreviewToSection(sectionId);
  }, [scrollPreviewToSection, hiddenSections]);

  // Handle section leave - clear highlight
  const handleSectionLeave = useCallback(() => {
    clearPreviewHighlight();
  }, [clearPreviewHighlight]);

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
      
      // Get all product images
      const allImages: string[] = aiContent.images || [];
      const imgCount = allImages.length;
      
      // Initialize default images for each section if not already set
      const defaultSectionImages: Record<string, string | undefined> = {};
      
      if (imgCount > 0) {
        // Hero/Landing page image
        if (!aiContent.selectedHeroImage && !aiContent.landingPageImage) {
          defaultSectionImages.selectedHeroImage = allImages[0];
        }
        // Statistics/Clinical image
        if (!aiContent.selectedClinicalImage && !aiContent.clinicalImage && !aiContent.statisticsImage) {
          defaultSectionImages.selectedClinicalImage = allImages[Math.min(3, imgCount - 1)];
        }
        // Benefits images
        if (!aiContent.selectedBenefitsImage && !aiContent.benefitsImage) {
          defaultSectionImages.selectedBenefitsImage = allImages[Math.min(1, imgCount - 1)];
        }
        if (!aiContent.selectedBenefitsImage2) {
          defaultSectionImages.selectedBenefitsImage2 = allImages[Math.min(2, imgCount - 1)];
        }
        // Timeline image
        if (!aiContent.timelineImage) {
          defaultSectionImages.timelineImage = allImages[Math.min(4, imgCount - 1)];
        }
        // FAQ image
        if (!aiContent.faqImage) {
          defaultSectionImages.faqImage = allImages[Math.min(2, imgCount - 1)];
        }
        // Comparison images
        if (!aiContent.comparisonOurImage && !aiContent.comparisonImage) {
          defaultSectionImages.comparisonOurImage = allImages[0];
        }
        if (!aiContent.comparisonOthersImage) {
          defaultSectionImages.comparisonOthersImage = allImages[Math.min(1, imgCount - 1)];
        }
        // Image with text
        if (!aiContent.imageWithTextImage) {
          defaultSectionImages.imageWithTextImage = allImages[Math.min(2, imgCount - 1)];
        }
        // Product Information images
        if (!aiContent.productInfoImage1) {
          defaultSectionImages.productInfoImage1 = allImages[0];
        }
        if (!aiContent.productInfoImage2) {
          defaultSectionImages.productInfoImage2 = allImages[Math.min(1, imgCount - 1)];
        }
        if (!aiContent.productInfoImage3) {
          defaultSectionImages.productInfoImage3 = allImages[Math.min(2, imgCount - 1)];
        }
      }
      
      // Get store name from aiContent or product title - ensure it's always set
      const storeNameValue = aiContent.store_name || data.product.title || 'YOUR BRAND';
      
      // Check if AI suggested colors are available (from color palette analysis)
      const suggestedColors = aiContent.suggestedColors || aiContent.colorPalette;
      const defaultPrimaryColor = suggestedColors?.primary || '#6f6254';
      const defaultAccentColor = suggestedColors?.accent || suggestedColors?.secondary || '#e6e1dc';
      
      // Log if AI colors are being used
      if (suggestedColors) {
        console.log('[AI Store] 🎨 Using AI-suggested color palette:', suggestedColors.name || 'Custom');
      }
      
      // Build default content with AI colors prioritized
      const baseContent = {
        font_family_input: 'Inter',
        ...defaultSectionImages,
        ...aiContent,
        // Ensure store_name is always set
        store_name: storeNameValue,
      };
      
      // Apply AI-suggested colors (override defaults or aiContent if they weren't set)
      const defaultContent = {
        ...baseContent,
        primary_color_picker: (baseContent as Record<string, unknown>).primary_color_picker || defaultPrimaryColor,
        tertiary_color_picker: (baseContent as Record<string, unknown>).tertiary_color_picker || defaultAccentColor,
      };
      // Ensure RGB values are calculated
      if (!defaultContent.primary_rgbcolor_picker && defaultContent.primary_color_picker) {
        defaultContent.primary_rgbcolor_picker = hexToRgbString(defaultContent.primary_color_picker as string);
      }
      if (!defaultContent.tertiary_rgbcolor_picker && defaultContent.tertiary_color_picker) {
        defaultContent.tertiary_rgbcolor_picker = hexToRgbString(defaultContent.tertiary_color_picker as string);
      }
      // Ensure product-information is never in hidden_sections (clean it if present)
      if (defaultContent.hidden_sections && Array.isArray(defaultContent.hidden_sections)) {
        defaultContent.hidden_sections = (defaultContent.hidden_sections as string[]).filter(
          id => id !== 'product-information' && id !== 'featured-product'
        );
      }
      
      setEditedContent(defaultContent);
      
      // Initialize hidden sections state (excluding product-information)
      if (defaultContent.hidden_sections && Array.isArray(defaultContent.hidden_sections)) {
        const cleanedHidden = (defaultContent.hidden_sections as string[]).filter(
          id => id !== 'product-information' && id !== 'featured-product'
        );
        setHiddenSections(new Set(cleanedHidden));
      }
      
      // Initialize Step 2 state from loaded product - only first 5 selected by default (like Laravel)
      if (aiContent.images && aiContent.images.length > 0) {
        // Store ALL original images for Step 2 display
        setAllOriginalImages(aiContent.images);
        // Only select first 5 images by default, matching Laravel behavior
        const initialSelected = aiContent.selectedMainImages || aiContent.images.slice(0, 5);
        setSelectedImages(initialSelected);
      }
      if (aiContent.store_name || data.product.title) {
        setStoreName(aiContent.store_name || data.product.title || 'YOUR BRAND');
      }
      
      // Load AI generated images from database (if they exist)
      // AI images are NOT added to selectedImages (main product images)
      // They are ONLY used for section previews (hero, benefits, clinical, etc.)
      const rawAiImages = data.product.aiGeneratedImages;
      // Handle both Laravel format { recommended_images: [...] } and direct array format
      let aiImagesArray: Array<{ image_url: string; prompt?: string; index?: number }> = [];
      if (rawAiImages) {
        if (Array.isArray(rawAiImages)) {
          // Direct array format
          aiImagesArray = rawAiImages;
        } else if (rawAiImages.recommended_images && Array.isArray(rawAiImages.recommended_images)) {
          // Laravel format - DON'T reverse, keep original order for correct section mapping
          aiImagesArray = rawAiImages.recommended_images;
        }
      }
      
      if (aiImagesArray.length > 0) {
        console.log('[AI Shop Editor] Loading AI generated images for sections:', aiImagesArray.length);
        
        // REVERSE the AI images array (like Laravel does)
        const reversedAiImages = [...aiImagesArray].reverse();
        setAiGeneratedImages(reversedAiImages);
        
        // Map AI images to section-specific fields based on Laravel order (REVERSED):
        // After reverse: index 0 = PACKSHOT, 1 = BEFORE/AFTER, 2 = PACKSHOT 2, 3 = LIFESTYLE, 4 = LIFESTYLE 2
        // But for section mapping, we use the ORIGINAL order:
        // Index 0: LIFESTYLE 2 → selectedHeroImage (landing page)
        // Index 1: LIFESTYLE → selectedBenefitsImage
        // Index 2: PACKSHOT 2 → productInfoImage1 / imageWithTextImage
        // Index 3: BEFORE/AFTER → selectedClinicalImage (statistics)
        // Index 4: PACKSHOT → timelineImage
        const sectionImageMappings: Record<string, string> = {};
        
        // Helper to check if an image is from the original product images (not user-selected)
        const originalImages = new Set(allImages);
        const isOriginalImage = (url: string | undefined) => url && originalImages.has(url);
        
        // Use ORIGINAL order for section mapping (not reversed)
        if (aiImagesArray[0]?.image_url) {
          const currentHero = aiContent.selectedHeroImage || defaultSectionImages.selectedHeroImage;
          if (!currentHero || isOriginalImage(currentHero as string)) {
            sectionImageMappings.selectedHeroImage = aiImagesArray[0].image_url;
          }
        }
        if (aiImagesArray[1]?.image_url) {
          const currentBenefits = aiContent.selectedBenefitsImage || defaultSectionImages.selectedBenefitsImage;
          if (!currentBenefits || isOriginalImage(currentBenefits as string)) {
            sectionImageMappings.selectedBenefitsImage = aiImagesArray[1].image_url;
          }
        }
        if (aiImagesArray[2]?.image_url) {
          const currentImageWithText = aiContent.imageWithTextImage || defaultSectionImages.imageWithTextImage;
          if (!currentImageWithText || isOriginalImage(currentImageWithText as string)) {
            sectionImageMappings.imageWithTextImage = aiImagesArray[2].image_url;
          }
        }
        if (aiImagesArray[3]?.image_url) {
          const currentClinical = aiContent.selectedClinicalImage || defaultSectionImages.selectedClinicalImage;
          if (!currentClinical || isOriginalImage(currentClinical as string)) {
            sectionImageMappings.selectedClinicalImage = aiImagesArray[3].image_url;
          }
        }
        if (aiImagesArray[4]?.image_url) {
          const currentTimeline = aiContent.timelineImage || defaultSectionImages.timelineImage;
          if (!currentTimeline || isOriginalImage(currentTimeline as string)) {
            sectionImageMappings.timelineImage = aiImagesArray[4].image_url;
          }
        }
        
        // Update editedContent with AI image mappings
        setEditedContent(prev => ({
          ...prev,
          ...sectionImageMappings,
        }));
        
        console.log('[AI Shop Editor] AI images mapped to sections:', Object.keys(sectionImageMappings));
        
        // Get AI image URLs in REVERSED order for display
        const aiImageUrls = reversedAiImages.map((img) => img.image_url).filter(Boolean);
        
        // Add AI images at the BEGINNING of allOriginalImages (REVERSED order)
        setAllOriginalImages(prev => {
          const existingUrls = new Set(prev);
          const uniqueAiUrls = aiImageUrls.filter((url: string) => !existingUrls.has(url));
          // AI images FIRST, then original images
          return [...uniqueAiUrls, ...prev];
        });
        
        // ONLY select AI images (not original product images)
        setSelectedImages(aiImageUrls);
        console.log('[AI Shop Editor] Selected only AI images:', aiImageUrls.length);
      }
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
  // Only trigger when on step 3 where preview is visible
  // Use ref to avoid dependency on refreshPreview which changes with editedContent
  const productLoadedRef = useRef(false);
  useEffect(() => {
    if (product && showPreview && currentStep === 3 && !productLoadedRef.current) {
      productLoadedRef.current = true;
      const timer = setTimeout(() => {
        refreshPreviewRef.current();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [product, showPreview, currentStep]);

  // Real-time preview when editedContent changes (debounced)
  // Use a ref for content comparison to avoid infinite loops
  const lastEditedContentRef = useRef<string>('');
  const initialLoadRef = useRef(true);
  
  useEffect(() => {
    const contentStr = JSON.stringify(editedContent);
    // Skip initial load and only trigger on actual content changes
    // Also only trigger when on step 3 (Customize) where preview is visible
    if (product && showPreview && currentStep === 3 && contentStr !== lastEditedContentRef.current) {
      if (!initialLoadRef.current) {
        triggerDebouncedRefresh();
      } else {
        initialLoadRef.current = false;
      }
      lastEditedContentRef.current = contentStr;
    }
  }, [editedContent, product, showPreview, currentStep, triggerDebouncedRefresh]);

  // Infer field type from field name (matches Laravel data-field-type approach)
  const inferFieldType = (fieldName: string): string => {
    const name = fieldName.toLowerCase();
    
    // Title fields
    if (name === 'title' || name.includes('heading') || name.includes('header')) return 'headline';
    
    // Description fields
    if (name === 'description' || name.includes('paragraph') || name.includes('subheading')) return 'description';
    if (name.includes('submain') || name.includes('sub_main')) return 'description';
    
    // Benefit fields
    if (name.includes('benefit') || name.includes('advantage')) return 'benefit';
    
    // Feature fields
    if (name.includes('feature') || name.includes('functionality')) return 'feature';
    
    // Testimonial fields
    if (name.includes('testimonial') || name.includes('review')) return 'testimonial';
    
    // FAQ fields
    if (name.includes('question')) return 'question';
    if (name.includes('answer') || name.includes('faq')) return 'faq';
    
    // Shipping/Delivery
    if (name.includes('delivery') || name.includes('shipping')) return 'shipping';
    
    // Timeline fields
    if (name.includes('timeframe') || name.includes('step') || name.includes('period')) return 'timeline_step';
    if (name.includes('timeline') && name.includes('description')) return 'timeline_description';
    
    // Statistics/Clinical
    if (name.includes('percentage') || name.includes('percent') || name.includes('stat')) return 'percentage';
    if (name.includes('clinical') || name.includes('result')) return 'stat_description';
    
    // Special sections
    if (name.includes('catchy') || name.includes('main')) return 'headline';
    if (name.includes('guarantee') || name.includes('badge')) return 'benefit';
    if (name.includes('offer') || name.includes('announcement')) return 'headline';
    
    // Button text (CTA)
    if (name.includes('button') || name.includes('cta')) return 'button_cta';
    
    // Default to text
    return 'text';
  };

  // Track which field was successfully regenerated (for green border)
  const [successField, setSuccessField] = useState<string | null>(null);
  // Track which field has an error (for red border)
  const [errorField, setErrorField] = useState<string | null>(null);

  // Regenerate a field using AI
  const regenerateField = async (fieldName: string, currentValue: string) => {
    // Block if already regenerating another field
    if (regeneratingField) {
      return;
    }

    setRegeneratingField(fieldName);
    setSuccessField(null);
    setErrorField(null);
    
    try {
      // Infer field type from field name
      const fieldType = inferFieldType(fieldName);
      
      const response = await fetch('/api/ai/regenerate-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldName,
          currentValue: currentValue || '', // Allow empty - AI will generate
          fieldType,
          productTitle: editedContent.title,
          productDescription: editedContent.description,
          language: product?.language || editedContent.language || 'en',
          seed: currentValue || '',
          generateIfEmpty: !currentValue || currentValue.trim() === '', // Flag for API
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate');
      }

      const data = await response.json();
      if (data.newValue) {
        // Pattern 1: Nested array fields like "testimonials[0][header]", "faq[0][question]"
        const nestedArrayMatch = fieldName.match(/^(\w+)\[(\d+)\]\[(\w+)\]$/);
        // Pattern 2: Simple array fields like "features[0]", "benefits[0]"
        const simpleArrayMatch = fieldName.match(/^(\w+)\[(\d+)\]$/);
        // Pattern 3: Dot notation like "comparison.heading", "persuasiveContent.paragraph"
        const dotMatch = fieldName.match(/^(\w+)\.(\w+)$/);
        
        if (nestedArrayMatch) {
          // Handle nested array fields: testimonials[0][header]
          const [, arrayName, indexStr, subField] = nestedArrayMatch;
          const index = parseInt(indexStr, 10);
          setEditedContent(prev => {
            const array = [...(prev[arrayName] as Array<Record<string, string>> || [])];
            if (array[index]) {
              array[index] = { ...array[index], [subField]: data.newValue };
            } else {
              // Create the item if it doesn't exist
              while (array.length <= index) {
                array.push({});
              }
              array[index] = { [subField]: data.newValue };
            }
            return { ...prev, [arrayName]: array };
          });
        } else if (simpleArrayMatch) {
          // Handle simple array fields: features[0], benefits[0]
          const [, arrayName, indexStr] = simpleArrayMatch;
          const index = parseInt(indexStr, 10);
          setEditedContent(prev => {
            // Handle field name aliases (advantages can come from benefits)
            let sourceArray = prev[arrayName];
            let targetField = arrayName;
            
            if (!Array.isArray(sourceArray)) {
              if (arrayName === 'advantages' && Array.isArray(prev['benefits'])) {
                sourceArray = prev['benefits'];
                targetField = 'benefits';
              } else if (arrayName === 'benefits' && Array.isArray(prev['advantages'])) {
                sourceArray = prev['advantages'];
                targetField = 'advantages';
              }
            }
            
            if (Array.isArray(sourceArray)) {
              const newArray = [...sourceArray];
              newArray[index] = data.newValue;
              return { ...prev, [targetField]: newArray };
            }
            
            console.warn(`Array field '${arrayName}' not found in content`);
            return prev;
          });
        } else if (dotMatch) {
          // Handle dot notation: comparison.heading, persuasiveContent.paragraph
          const [, objectName, subField] = dotMatch;
          setEditedContent(prev => {
            const obj = (prev[objectName] as Record<string, unknown>) || {};
            return { ...prev, [objectName]: { ...obj, [subField]: data.newValue } };
          });
        } else {
          // Simple field name
          updateField(fieldName, data.newValue);
        }
        // Set success for THIS specific field
        setSuccessField(fieldName);
        setTimeout(() => setSuccessField(null), 2000);
      }
    } catch (err) {
      console.error('Regeneration error:', err);
      // Set error for THIS specific field (not global error)
      setErrorField(fieldName);
      setTimeout(() => setErrorField(null), 3000);
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

  // Navigate to step 2 - sync store_name from editedContent
  const goToStep2 = useCallback(() => {
    // Sync store_name from editedContent back to storeName state
    if (editedContent.store_name) {
      setStoreName(editedContent.store_name as string);
    }
    setCurrentStep(2);
  }, [editedContent.store_name]);

  // Navigate to step 3 - sync store_name to editedContent and refresh preview
  const goToStep3 = useCallback(() => {
    setEditedContent(prev => ({
      ...prev,
      selectedMainImages: selectedImages,
      store_name: storeName,
    }));
    setCurrentStep(3);
    // Refresh preview after a short delay to ensure step change is complete
    setTimeout(() => {
      refreshPreviewRef.current();
    }, 300);
  }, [selectedImages, storeName]);

  // Navigate to step 4
  const goToStep4 = useCallback(() => {
    setCurrentStep(4);
    // Refresh preview after going to step 4
    setTimeout(() => refreshPreviewRef.current(), 300);
  }, []);

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
  
  // Color palette state
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState<number | null>(null); // null = AI palette, 0+ = preset palettes
  const [generatedPalettes, setGeneratedPalettes] = useState<Array<{ primary: string; tertiary: string }>>([]);
  const [isGeneratingColors, setIsGeneratingColors] = useState(false);
  
  // Function to lighten a hex color (same as Laravel) - moved up for useMemo
  const lightenColorFn = (hex: string): string => {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, Math.floor(r + (255 - r) * 0.7));
    g = Math.min(255, Math.floor(g + (255 - g) * 0.7));
    b = Math.min(255, Math.floor(b + (255 - b) * 0.7));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  // AI-suggested color palette from product analysis (if available)
  const aiColorPalette = useMemo(() => {
    const content = editedContent as Record<string, unknown>;
    const suggestedColors = (content?.suggestedColors || content?.colorPalette) as { 
      primary?: string; 
      accent?: string; 
      secondary?: string; 
      name?: string; 
      description?: string; 
    } | undefined;
    
    if (suggestedColors?.primary) {
      return {
        primary: suggestedColors.primary,
        tertiary: suggestedColors.accent || suggestedColors.secondary || lightenColorFn(suggestedColors.primary),
        name: suggestedColors.name || 'Palette IA',
        description: suggestedColors.description || 'Palette générée par IA basée sur le produit'
      };
    }
    return null;
  }, [editedContent]);
  
  // Preset color palettes (same as Laravel)
  const presetPalettes = [
    { primary: '#6f6254', tertiary: '#e6e1dc' },
    { primary: '#374732', tertiary: '#d9e3d4' },
    { primary: '#8c1c25', tertiary: '#f1dada' },
    { primary: '#e9572d', tertiary: '#fff6e8' },
    { primary: '#4E2500', tertiary: '#FFF0DD' },
    { primary: '#4e7a9b', tertiary: '#e0eef5' },
    { primary: '#9a4e34', tertiary: '#ebddd3' },
  ];
  
  // Function to lighten a hex color (same as Laravel)
  const lightenColor = (hex: string): string => {
    // Convert hex to RGB
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    
    // Lighten by mixing with white (increase by 70%)
    r = Math.min(255, Math.floor(r + (255 - r) * 0.7));
    g = Math.min(255, Math.floor(g + (255 - g) * 0.7));
    b = Math.min(255, Math.floor(b + (255 - b) * 0.7));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  // Generate new color palettes using Huemint API (same as Laravel)
  const generateColorPalettes = async () => {
    setIsGeneratingColors(true);
    
    // Get current primary color as seed
    const currentPrimary = (editedContent.primary_color_picker as string) || '#ffffff';
    
    const jsonData = {
      mode: "transformer",
      num_colors: 4,
      temperature: "1.5",
      num_results: 10,
      adjacency: ["0", "65", "45", "35", "65", "0", "35", "65", "45", "35", "0", "35", "35", "65", "35", "0"],
      palette: [currentPrimary, "-", "-", "-"]
    };
    
    try {
      const response = await fetch('https://api.huemint.com/color', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
      });
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const newPalettes = data.results.map((result: { palette: string[] }) => {
          const primaryColor = result.palette[3]; // Use tertiary as primary (same as Laravel)
          const tertiaryColor = lightenColor(primaryColor);
          return { primary: primaryColor, tertiary: tertiaryColor };
        });
        setGeneratedPalettes(newPalettes);
      }
    } catch (error) {
      console.error('Error generating color palettes:', error);
    } finally {
      setIsGeneratingColors(false);
    }
  };
  
  // Handle palette selection
  const handlePaletteSelect = (palette: { primary: string; tertiary: string }, index: number, isGenerated: boolean = false) => {
    if (isGenerated) {
      setSelectedPaletteIndex(presetPalettes.length + index);
    } else {
      setSelectedPaletteIndex(index);
    }
    updateField('primary_color_picker', palette.primary);
    updateField('tertiary_color_picker', palette.tertiary);
  };
  
  // Add Section Modal State
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [selectedSectionToAdd, setSelectedSectionToAdd] = useState<string | null>(null);
  const [sectionSearchQuery, setSectionSearchQuery] = useState('');
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [previewState, setPreviewState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [sectionPreviewHtml, setSectionPreviewHtml] = useState<string | null>(null);
  const addSectionBtnRef = useRef<HTMLButtonElement>(null);

  // All available sections that can be added - grouped by category (matching Laravel)
  const availableSections: { category: string; sections: { id: string; type: string; label: string; icon: string }[] }[] = [
    {
      category: 'CART',
      sections: [
        { id: 'cart-notification-button', type: 'cart-notification-button', label: 'Cart Notification Button', icon: 'ri-notification-line' },
        { id: 'cart-notification-product', type: 'cart-notification-product', label: 'Cart Notification Product', icon: 'ri-shopping-cart-line' },
        { id: 'main-cart-items', type: 'main-cart-items', label: 'Main Cart Items', icon: 'ri-shopping-bag-line' },
      ]
    },
    {
      category: 'COLLECTION',
      sections: [
        { id: 'collection-list', type: 'collection-list', label: 'Collection List', icon: 'ri-list-check' },
        { id: 'featured-collection', type: 'featured-collection', label: 'Featured Collection', icon: 'ri-star-line' },
        { id: 'main-collection-banner', type: 'main-collection-banner', label: 'Main Collection Banner', icon: 'ri-image-line' },
      ]
    },
    {
      category: 'CONTENT',
      sections: [
        { id: 'collapsible-content', type: 'collapsible-content', label: 'Collapsible Content', icon: 'ri-arrow-down-s-line' },
        { id: 'contact-form', type: 'contact-form', label: 'Contact Form', icon: 'ri-mail-line' },
        { id: 'custom-liquid', type: 'custom-liquid', label: 'Custom Liquid', icon: 'ri-code-line' },
        { id: 'image-banner', type: 'image-banner', label: 'Image Banner', icon: 'ri-image-2-line' },
        { id: 'image-faq', type: 'image-faq', label: 'Image FAQ', icon: 'ri-question-answer-line' },
        { id: 'image-with-text', type: 'image-with-text', label: 'Image with Text', icon: 'ri-image-2-line' },
        { id: 'img-with-txt', type: 'img-with-txt', label: 'Hero Section', icon: 'ri-layout-top-line' },
        { id: 'multicolumn', type: 'multicolumn', label: 'Multicolumn', icon: 'ri-layout-column-line' },
        { id: 'multirow', type: 'multirow', label: 'Multirow', icon: 'ri-layout-row-line' },
        { id: 'rich-text', type: 'rich-text', label: 'Rich Text', icon: 'ri-text' },
        { id: 'slideshow', type: 'slideshow', label: 'Slideshow', icon: 'ri-slideshow-line' },
        { id: 'video', type: 'video', label: 'Video', icon: 'ri-video-line' },
      ]
    },
    {
      category: 'HEADER',
      sections: [
        { id: 'announcement-bar', type: 'announcement-bar', label: 'Announcement Bar', icon: 'ri-notification-line' },
        { id: 'header', type: 'header', label: 'Header', icon: 'ri-layout-top-2-line' },
      ]
    },
    {
      category: 'PRODUCT',
      sections: [
        { id: 'featured-product', type: 'featured-product', label: 'Featured Product', icon: 'ri-price-tag-3-line' },
        { id: 'main-product-custom', type: 'main-product-custom', label: 'Main Product Custom', icon: 'ri-box-3-line' },
        { id: 'pdp-benefits', type: 'pdp-benefits', label: 'PDP Benefits', icon: 'ri-thumb-up-line' },
        { id: 'pdp-comparison-table', type: 'pdp-comparison-table', label: 'Comparison Table', icon: 'ri-table-line' },
        { id: 'pdp-statistics-column', type: 'pdp-statistics-column', label: 'Statistics Column', icon: 'ri-donut-chart-fill' },
        { id: 'product-compare', type: 'product-compare', label: 'Product Compare', icon: 'ri-scales-line' },
        { id: 'product-results', type: 'product-results', label: 'Product Results', icon: 'ri-bar-chart-line' },
        { id: 'product-reviews', type: 'product-reviews', label: 'Product Reviews', icon: 'ri-star-line' },
        { id: 'product-section-1', type: 'product-section-1', label: 'Product Section', icon: 'ri-box-3-line' },
        { id: 'related-products', type: 'related-products', label: 'Related Products', icon: 'ri-links-line' },
        { id: 'timeline-points', type: 'timeline-points', label: 'Timeline Points', icon: 'ri-time-line' },
      ]
    },
    {
      category: 'SOCIAL PROOF',
      sections: [
        { id: 'header-with-marquee', type: 'header-with-marquee', label: 'Header with Marquee', icon: 'ri-text-spacing' },
        { id: 'marquee', type: 'marquee', label: 'Marquee', icon: 'ri-text-spacing' },
        { id: 'video-gris-slider', type: 'video-gris-slider', label: 'Video Grid Slider', icon: 'ri-video-line' },
      ]
    },
    {
      category: 'FOOTER',
      sections: [
        { id: 'footer', type: 'footer', label: 'Footer', icon: 'ri-layout-bottom-line' },
        { id: 'custom-newsletter', type: 'custom-newsletter', label: 'Newsletter', icon: 'ri-mail-send-line' },
      ]
    },
  ];

  // Filter sections based on search query
  const filteredAvailableSections = availableSections.map(category => ({
    ...category,
    sections: category.sections.filter(section =>
      section.label.toLowerCase().includes(sectionSearchQuery.toLowerCase()) ||
      section.type.toLowerCase().includes(sectionSearchQuery.toLowerCase())
    )
  })).filter(category => category.sections.length > 0);

  // Handle section selection in add modal and load preview
  const handleSelectSectionToAdd = async (sectionType: string) => {
    console.log('[Frontend] Selecting section:', sectionType);
    setSelectedSectionToAdd(sectionType);
    setPreviewState('loading');
    setSectionPreviewHtml(null);
    
    try {
      console.log('[Frontend] Fetching section preview for:', sectionType, 'productId:', params.id);
      const response = await fetch('/api/ai/section-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: params.id,
          sectionType: sectionType,
          themeKey: 'theme_v4'
        })
      });
      
      console.log('[Frontend] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Frontend] Response data:', { success: data.success, htmlLength: data.html?.length || 0 });
        
        if (data.success && data.html) {
          setSectionPreviewHtml(data.html);
          setPreviewState('loaded');
          console.log('[Frontend] Preview loaded successfully');
        } else {
          console.log('[Frontend] Invalid response - setting error state');
          setPreviewState('error');
        }
      } else {
        const errorText = await response.text();
        console.error('[Frontend] Response not OK:', response.status, errorText);
        setPreviewState('error');
      }
    } catch (error) {
      console.error('[Frontend] Error loading section preview:', error);
      setPreviewState('error');
    }
  };

  // Add the selected section to the list
  const handleAddSection = () => {
    if (!selectedSectionToAdd) return;
    
    // Find the section details from availableSections
    let sectionToAdd: { id: string; type: string; label: string; icon: string } | null = null;
    for (const category of availableSections) {
      const found = category.sections.find(s => s.type === selectedSectionToAdd);
      if (found) {
        sectionToAdd = found;
        break;
      }
    }
    
    if (sectionToAdd) {
      // Create a unique ID for the new section
      const newSectionId = `${sectionToAdd.id}-${Date.now()}`;
      
      // Create the new section object
      const newSection = { 
        id: newSectionId, 
        label: sectionToAdd.label, 
        icon: sectionToAdd.icon,
        type: sectionToAdd.type
      };
      
      // Add to dynamic sections list
      setDynamicSections(prev => [...prev, newSection]);
      
      // Add to section order
      setSectionOrder(prev => [...prev, newSectionId]);
      
      // Update editedContent with the new section order
      setEditedContent(prevContent => ({
        ...prevContent,
        section_order: [...sectionOrder, newSectionId],
      }));
      
      // Set as active section
      setActiveSection(newSectionId);
    }
    
    // Close modal and reset
    setShowAddSectionModal(false);
    setSelectedSectionToAdd(null);
    setSectionSearchQuery('');
    setPreviewState('idle');
    setSectionPreviewHtml(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const popup = document.querySelector('.add-section-popup');
      const btn = document.querySelector('.btn-add-new-section');
      if (showAddSectionModal && popup && btn && 
          !popup.contains(e.target as Node) && 
          !btn.contains(e.target as Node)) {
        setShowAddSectionModal(false);
        setSelectedSectionToAdd(null);
        setSectionSearchQuery('');
        setPreviewState('idle');
        setSectionPreviewHtml(null);
      }
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAddSectionModal) {
        setShowAddSectionModal(false);
        setSelectedSectionToAdd(null);
        setSectionSearchQuery('');
        setPreviewState('idle');
        setSectionPreviewHtml(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showAddSectionModal]);

  // Select sections based on current page type (use constants defined outside component)
  const defaultSections = pageType === 'home' ? HOME_PAGE_SECTIONS : PRODUCT_PAGE_SECTIONS;

  // Section ordering state (can be reordered via drag & drop)
  const [sectionOrder, setSectionOrder] = useState<string[]>(defaultSections.map(s => s.id));
  
  // Dynamically added sections (keeps track of sections added via modal)
  const [dynamicSections, setDynamicSections] = useState<Array<{ id: string; label: string; icon: string; type: string }>>([]);
  
  // Drag & drop state
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  
  // Reset section order when page type changes
  useEffect(() => {
    const sections = pageType === 'home' ? HOME_PAGE_SECTIONS : PRODUCT_PAGE_SECTIONS;
    setSectionOrder(sections.map(s => s.id));
    setHiddenSections(new Set());
    setDynamicSections([]);
  }, [pageType]);
  
  // Ensure product-information is never hidden (even if loaded from database)
  // Check and clean hidden_sections when editedContent changes
  useEffect(() => {
    const hiddenSectionsArray = (editedContent.hidden_sections as string[]) || [];
    if (hiddenSectionsArray.includes('product-information') || hiddenSectionsArray.includes('featured-product')) {
      const cleaned = hiddenSectionsArray.filter(id => id !== 'product-information' && id !== 'featured-product');
      setEditedContent(prev => ({
        ...prev,
        hidden_sections: cleaned,
      }));
      setHiddenSections(new Set(cleaned));
    }
  }, [editedContent.hidden_sections]);
  
  // Get ordered sections based on sectionOrder (includes both default and dynamic sections)
  const themeSections = sectionOrder
    .map(id => {
      // First check default sections
      const defaultSection = defaultSections.find(s => s.id === id);
      if (defaultSection) return defaultSection;
      // Then check dynamically added sections
      const dynamicSection = dynamicSections.find(s => s.id === id);
      if (dynamicSection) return dynamicSection;
      return undefined;
    })
    .filter((s): s is { id: string; label: string; icon: string; type?: string } => s !== undefined);

  // Toggle section visibility
  const toggleSectionVisibility = (sectionId: string) => {
    // Prevent hiding/deleting "product-information" section - it's required
    if (sectionId === 'product-information' || sectionId === 'featured-product') {
      return;
    }
    
    setHiddenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      // Ensure product-information is never in hidden_sections
      newSet.delete('product-information');
      newSet.delete('featured-product');
      
      // Update editedContent with hidden_sections for API
      setEditedContent(prevContent => ({
        ...prevContent,
        hidden_sections: Array.from(newSet).filter(id => id !== 'product-information' && id !== 'featured-product'),
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
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-3 text-muted">Chargement de l&apos;éditeur...</p>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '100vh' }}>
        <div className="alert alert-danger mb-3">{error}</div>
        <Button onClick={() => router.push('/dashboard/ai-shop')}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      {/* Fixed Header - matches Laravel .dashboard-header exactly */}
      <div className="dashboard-header d-flex gap-3 align-items-center justify-content-between w-100 bg-white" style={{ padding: '20px 10px', borderBottom: '1px solid rgb(225, 228, 234)' }}>
        {/* Left: Dashboard Title */}
        <div className="dashboard-title d-flex align-items-center">
          <div className="dashboard-title-img d-flex align-items-center justify-content-center" style={{ 
            width: '28px', 
            height: '28px', 
            backgroundColor: 'rgb(12, 108, 251)', 
            border: '1px solid rgb(38, 67, 182)',
            borderRadius: '4px',
            marginRight: '6px',
            padding: '4px'
          }}>
            <i className="ri-shopping-bag-4-line text-white" style={{ fontSize: '14px' }}></i>
          </div>
          <div>
            <p className="dashboard-title-main mb-0" style={{ fontSize: '1.2em', fontWeight: 600, lineHeight: '27.8px', whiteSpace: 'nowrap', color: '#0e121b' }}>Créez votre boutique avec l&apos;IA</p>
          </div>
        </div>

        {/* Step Navigation - Desktop (matches Laravel nav-pills-rounded) */}
        <div className="flex-grow-1 d-none d-lg-flex justify-content-center">
          <ul className="nav nav-pills-rounded align-items-center gap-2 justify-content-center mb-0" role="tablist">
            <li className="nav-item d-flex align-items-center">
              <button 
                className={`nav-link step-pill fw-500 d-flex align-items-center ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
                onClick={() => router.push('/dashboard/ai-shop')}
                style={{ opacity: 0.7, cursor: 'pointer' }}
              >
                <i className="ri-link nav-icon me-2"></i><span className="nav-text fs-small">1. Charger</span>
              </button>
            </li>
            <i className="ri-arrow-right-s-line mx-1" style={{ color: '#99a0ae' }}></i>
            <li className="nav-item d-flex align-items-center">
              <button 
                className={`nav-link step-pill fw-500 d-flex align-items-center ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
                onClick={goToStep2}
              >
                <i className="ri-file-check-line nav-icon me-2"></i><span className="nav-text fs-small">2. Sélectionner</span>
              </button>
            </li>
            <i className="ri-arrow-right-s-line mx-1" style={{ color: '#99a0ae' }}></i>
            <li className="nav-item d-flex align-items-center">
              <button 
                className={`nav-link step-pill fw-500 d-flex align-items-center ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}
                onClick={() => currentStep >= 2 && goToStep3()}
                style={{ opacity: currentStep < 2 ? 0.5 : 1, cursor: currentStep < 2 ? 'not-allowed' : 'pointer' }}
              >
                <i className="ri-settings-4-line nav-icon me-2"></i><span className="nav-text fs-small">3. Personnaliser</span>
              </button>
            </li>
            <i className="ri-arrow-right-s-line mx-1" style={{ color: '#99a0ae' }}></i>
            <li className="nav-item d-flex align-items-center">
              <button 
                className={`nav-link step-pill fw-500 d-flex align-items-center ${currentStep === 4 ? 'active' : ''}`}
                onClick={() => currentStep >= 3 && goToStep4()}
                style={{ opacity: currentStep < 3 ? 0.5 : 1, cursor: currentStep < 3 ? 'not-allowed' : 'pointer' }}
              >
                <i className="ri-export-line nav-icon me-2"></i><span className="nav-text fs-small">4. Mettre à jour le thème</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Right: AI Credits Indicator - same pattern as export page */}
        <div className="ai-balance-wrapper d-flex align-items-center gap-2 p-1">
          <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background circle */}
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="3"
            />
            {/* Progress circle */}
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#335CFF"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 16}`}
              strokeDashoffset={2 * Math.PI * 16}
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
          </svg>
          <div className="d-flex flex-column" style={{ lineHeight: 1.2 }}>
            <span className="fw-600" style={{ fontSize: '14px', color: '#0E121B' }}>0/0</span>
            <span style={{ fontSize: '12px', color: '#6B7280', whiteSpace: 'nowrap' }}>Crédits IA utilisés</span>
          </div>
        </div>
      </div>

      <div className="ai-store-container" style={{ height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
        {/* Messages - positioned absolute */}
        {error && (
          <div className="alert alert-danger mb-0 mx-3 mt-2 py-2" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
            <i className="ri-error-warning-line me-2"></i>{error}
            <button type="button" className="btn-close float-end" onClick={() => setError(null)}></button>
          </div>
        )}
        {/* Success message removed - now shown in tooltip */}

        {/* ==================== STEP 2: SELECT IMAGES ==================== */}
        {currentStep === 2 && product && (
          <div className="step-2-content" style={{ height: '100%', overflowY: 'auto', backgroundColor: '#fff' }}>
            <div className="mx-auto px-2 pb-5" style={{ maxWidth: '840px' }}>
              {/* Store Name Input */}
              <div className="mb-3 pt-3">
                <label className="form-label text-dark fw-500 mb-2 fs-small">
                  Nom de votre boutique (peut être modifié à tout moment)
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="YOUR BRAND"
                />
              </div>

              {/* AI Image Generator Section */}
              <div 
                className="ai-generate-section mb-4"
                style={{
                  border: '1px dashed #CACFD8',
                  background: '#F5F7FA',
                  borderRadius: '12px',
                  padding: '20px',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* AI Image Generator Button - Opens AI Editor Modal in upload mode */}
                <div className="text-center">
                  <button 
                    className="btn upload-image-btn d-inline-flex align-items-center gap-2"
                    onClick={() => {
                      setAiEditorSelectedImage(null);
                      setAiEditorIsUploadMode(true);
                      setIsAIEditorOpen(true);
                    }}
                    title="Générer ou modifier une image avec l'IA"
                    style={{ 
                      position: 'relative',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      boxShadow: 'none',
                      overflow: 'visible',
                      zIndex: 1,
                      background: 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Glow effect background */}
                    <span style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      right: '8px',
                      bottom: '8px',
                      background: 'linear-gradient(90deg, #a0cbff, #d1bdff, #f4c2ff, #ffb9a2, #a0cbff)',
                      borderRadius: '16px',
                      zIndex: -2,
                      filter: 'blur(8px)',
                      opacity: 0.5
                    }}></span>
                    {/* White background */}
                    <span style={{
                      position: 'absolute',
                      border: '1px solid #e2e5eb',
                      top: '2px',
                      left: '2px',
                      right: '2px',
                      bottom: '2px',
                      background: '#ffffff',
                      borderRadius: '10px',
                      zIndex: -1
                    }}></span>
                    <i className="ri-sparkling-line" style={{ color: '#7c3aed', position: 'relative', zIndex: 1 }}></i>
                    <span className="text-dark" style={{ position: 'relative', zIndex: 1 }}>Générer des images avec l&apos;IA</span>
                  </button>
                </div>
              </div>

              {/* Image Selection Section */}
              <div className="mb-5 pt-4">
                <p className="fs-small fw-500 mb-1">Sélectionnez les images du produit que vous souhaitez ajouter</p>
                <p className="fs-small mb-3">
                  <strong>Conseil:</strong> <i className="ri-drag-drop-line"></i> Vous pouvez réorganiser les images en les faisant glisser dans l&apos;ordre de votre choix.
                </p>

                {/* Images Grid - CSS Grid matching Laravel */}
                {(() => {
                  // Use allOriginalImages to always show ALL images, not just selected ones
                  const allImages = allOriginalImages.length > 0 ? allOriginalImages : (allOriginalImages.length > 0 ? allOriginalImages : ((editedContent.images as string[]) || []));
                  const visibleCount = showAllImages ? allImages.length : Math.min(9, allImages.length);
                  const displayedImages = allImages.slice(0, visibleCount);
                  const remainingCount = allImages.length - 9;
                  const hasMoreImages = allImages.length > 9;

                  return (
                    <>
                      <div 
                        className="image-grid-list"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                          gap: '8px',
                          position: 'relative',
                          marginBottom: '20px'
                        }}
                      >
                        {displayedImages.map((image, idx) => {
                          const isFirstImage = idx === 0;
                          const isNinthCard = idx === 8 && hasMoreImages && !showAllImages;
                          const isSelected = selectedImages.includes(image);
                          
                          return (
                            <div 
                              key={idx}
                              className="image-card"
                              style={{
                                position: 'relative',
                                aspectRatio: '1',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                userSelect: 'none',
                                minWidth: '130px',
                                cursor: 'pointer',
                                ...(isFirstImage ? { gridColumn: 'span 2', gridRow: 'span 2' } : {})
                              }}
                              onClick={() => {
                                if (isNinthCard) {
                                  setShowAllImages(true);
                                } else if (isSelected) {
                                  setSelectedImages(selectedImages.filter(img => img !== image));
                                } else {
                                  setSelectedImages([...selectedImages, image]);
                                }
                              }}
                            >
                              <label className="radio-container" style={{ width: '100%', height: '100%', margin: 0, display: 'block' }}>
                                <div 
                                  className="custom-image-radio"
                                  style={{
                                    borderRadius: '8px',
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: '#fff',
                                    border: '1px solid #e1e4ea',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    transform: 'scale(0.98)',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {/* Checkmark */}
                                  <span 
                                    className="checkmark"
                                    style={{
                                      position: 'absolute',
                                      top: '4px',
                                      right: '4px',
                                      backgroundColor: isSelected ? '#335cff' : 'white',
                                      borderRadius: '50%',
                                      border: isSelected ? 'none' : '1px solid #e1e4ea',
                                      width: '24px',
                                      height: '24px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      zIndex: 10
                                    }}
                                  >
                                    {isSelected && <i className="ri-check-line" style={{ color: '#fff', fontSize: '14px' }}></i>}
                                  </span>

                                  {/* Upload Image Wrapper */}
                                  <div 
                                    className="upload-image-wrapper"
                                    style={{
                                      borderRadius: '8px',
                                      backgroundColor: '#f5f7fa',
                                      height: '100%',
                                      width: '100%',
                                      overflow: 'hidden',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <img 
                                      src={image} 
                                      alt={`Product ${idx + 1}`}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      onError={(e) => { (e.target as HTMLImageElement).src = '/img_not_found.png'; }}
                                    />
                                    {/* AI Generated Badge - Only show for AI generated images */}
                                    {aiGeneratedImages.some(img => img.image_url === image) && (
                                      <span 
                                        className="badge position-absolute ai-generated-badge"
                                        style={{
                                          top: '8px',
                                          left: '8px',
                                          backgroundColor: '#8b5cf6',
                                          borderRadius: '6px',
                                          padding: '4px 6px',
                                          zIndex: 5
                                        }}
                                        title="Généré par IA"
                                      >
                                        <i className="ri-sparkling-2-fill text-white" style={{ fontSize: '12px' }}></i>
                                      </span>
                                    )}
                                  </div>

                                  {/* Edit with AI Button */}
                                  {!isNinthCard && (
                                    <button 
                                      type="button"
                                      className="edit-image-ai-btn"
                                      style={{
                                        position: 'absolute',
                                        bottom: '4px',
                                        right: '4px',
                                        fontSize: '10px',
                                        borderRadius: '12px',
                                        padding: '4px 10px',
                                        background: 'rgba(14, 18, 27, 0.24)',
                                        backdropFilter: 'blur(4px)',
                                        WebkitBackdropFilter: 'blur(4px)',
                                        color: '#ffffff',
                                        border: 'none',
                                        cursor: 'pointer',
                                        zIndex: 20,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        pointerEvents: 'auto',
                                        whiteSpace: 'nowrap'
                                      }}
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        e.preventDefault();
                                        // Open AI Editor Modal with this image selected
                                        setAiEditorSelectedImage(img);
                                        setAiEditorIsUploadMode(false);
                                        setIsAIEditorOpen(true);
                                      }}
                                    >
                                      {/* broom-sparkle.svg icon */}
                                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="edit-ai-icon" style={{ width: '15px', height: '15px', objectFit: 'contain', flexShrink: 0 }}>
                                        <path fillRule="evenodd" clipRule="evenodd" d="M11.8383 2.66061C12.0539 2.87476 12.0539 3.22197 11.8383 3.43612L8.61619 6.63615C8.93442 7.03077 9.11798 7.46176 9.18138 7.91246C9.26647 8.51743 9.12831 9.10744 8.89554 9.63256C8.43531 10.6708 7.55186 11.5775 6.88643 12.1056C6.43915 12.4608 5.84081 12.5924 5.27776 12.4331C3.33725 11.8848 2.20398 10.2675 2.00281 8.28228C1.97304 7.98851 2.18283 7.72406 2.47739 7.68406C3.10593 7.59871 3.48107 7.25775 4.27401 6.4602C5.28603 5.44169 6.72229 5.30257 7.78335 5.91228L11.0574 2.66061C11.2731 2.44646 11.6227 2.44646 11.8383 2.66061ZM5.08222 7.20851C5.07476 7.21581 5.06733 7.22319 5.05993 7.23064L5.05979 7.23078C5.0488 7.24183 5.03785 7.25286 5.02691 7.26386C4.43134 7.86305 3.90732 8.39026 3.17175 8.64262C3.44743 10.0221 4.29417 11.0149 5.57996 11.3783L5.58021 11.3783C5.78754 11.437 6.01842 11.3907 6.19682 11.249L6.19705 11.2488C6.66963 10.8737 7.23641 10.302 7.629 9.66994C7.09573 9.31686 6.53234 8.86855 5.98715 8.30138L5.98684 8.30106C5.63673 7.93625 5.33756 7.56754 5.08222 7.20851ZM6.05886 6.67912C6.26827 6.96449 6.50912 7.25563 6.7859 7.54407C7.20948 7.98473 7.6455 8.3445 8.06521 8.6375C8.10497 8.43782 8.11328 8.24603 8.08771 8.0642C8.04094 7.73175 7.87445 7.38315 7.4801 7.03961L7.47992 7.03946C7.10923 6.71625 6.58387 6.57463 6.05886 6.67912Z" fill="white"/>
                                        <path d="M13.8825 10.1583L12.83 9.8075L12.4792 8.755C12.365 8.415 11.8025 8.415 11.6883 8.755L11.3375 9.8075L10.285 10.1583C10.115 10.215 10 10.3742 10 10.5533C10 10.7325 10.115 10.8917 10.285 10.9483L11.3375 11.2992L11.6883 12.3517C11.745 12.5217 11.905 12.6367 12.0842 12.6367C12.2633 12.6367 12.4225 12.5217 12.48 12.3517L12.8308 11.2992L13.8833 10.9483C14.0533 10.8917 14.1683 10.7325 14.1683 10.5533C14.1683 10.3742 14.0525 10.215 13.8825 10.1583Z" fill="white"/>
                                        <path d="M4.57748 2.91089L3.78915 2.64839L3.52581 1.85922C3.44081 1.60422 3.01831 1.60422 2.93331 1.85922L2.66998 2.64839L1.88165 2.91089C1.75415 2.95339 1.66748 3.07255 1.66748 3.20755C1.66748 3.34255 1.75415 3.46172 1.88165 3.50422L2.66998 3.76672L2.93331 4.55589C2.97581 4.68339 3.09498 4.76922 3.22915 4.76922C3.36331 4.76922 3.48331 4.68255 3.52498 4.55589L3.78831 3.76672L4.57665 3.50422C4.70415 3.46172 4.79081 3.34255 4.79081 3.20755C4.79081 3.07255 4.70498 2.95339 4.57748 2.91089Z" fill="white"/>
                                        <path d="M6.875 2.5C7.22018 2.5 7.5 2.22018 7.5 1.875C7.5 1.52982 7.22018 1.25 6.875 1.25C6.52982 1.25 6.25 1.52982 6.25 1.875C6.25 2.22018 6.52982 2.5 6.875 2.5Z" fill="white"/>
                                      </svg>
                                      <span>Modifier avec IA</span>
                                    </button>
                                  )}

                                  {/* View More Overlay on 9th card */}
                                  {isNinthCard && (
                                    <div 
                                      className="view-more-overlay"
                                      style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'rgba(0, 0, 0, 0.5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        zIndex: 5,
                                        borderRadius: '8px'
                                      }}
                                    >
                                      <span className="view-more-count" style={{ color: '#fff', fontSize: '24px', fontWeight: 600 }}>
                                        +{remainingCount}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </label>
                            </div>
                          );
                        })}

                        {/* View Less Card */}
                        {showAllImages && hasMoreImages && (
                          <div 
                            className="image-card view-less-card"
                            style={{
                              position: 'relative',
                              aspectRatio: '1',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              minWidth: '130px',
                              cursor: 'pointer'
                            }}
                            onClick={() => setShowAllImages(false)}
                          >
                            <div 
                              className="view-less-btn"
                              style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px dashed #CACFD8',
                                borderRadius: '8px',
                                background: '#F5F7FA',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <i className="ri-arrow-up-s-line" style={{ fontSize: '20px', color: '#6b7280' }}></i>
                              <span style={{ fontSize: '12px', color: '#6b7280' }}>Montrer Moins</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Navigation Buttons */}
              <div className="d-flex justify-content-end align-items-center gap-2 pt-4 border-top">
                <button 
                  className="btn"
                  style={{ 
                    border: '1px solid #e1e4ea', 
                    borderRadius: '8px', 
                    padding: '8px 20px',
                    color: '#525866',
                    backgroundColor: '#fff'
                  }}
                  onClick={() => router.push('/dashboard/ai-shop')}
                >
                  Retour
                </button>
                <button 
                  className="btn btn-primary"
                  style={{ 
                    backgroundColor: '#0d6efd', 
                    borderColor: '#0d6efd',
                    color: '#fff',
                    borderRadius: '8px', 
                    padding: '8px 24px',
                  }}
                  onClick={goToStep3}
                  disabled={selectedImages.length === 0}
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== STEP 3: CUSTOMIZE ==================== */}
        {currentStep === 3 && (
        <div className="d-flex" style={{ height: '100%', overflow: 'hidden' }}>
            {/* Left Panel Container - holds sidebar + content editor + footer */}
            <div className="left-panel-container" style={{ 
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              height: '100%',
              width: editorTab === 'styles' ? '760px' : '800px',
            }}>
              {/* Top Row - Sidebar + Content Editor */}
              <div className="left-panel-top-row" style={{ 
                display: 'flex',
                flex: '1 1 0',
                minHeight: 0,
                overflow: 'hidden',
              }}>
            {/* Left Sidebar - Section Navigation (matches Laravel: wider sidebar) */}
            {/* When Styles tab is active, sidebar expands to fill space of content editor */}
            <div className="content-menu-sidebar bg-white" style={{ 
              width: editorTab === 'styles' ? '760px' : '300px', 
              minWidth: editorTab === 'styles' ? '760px' : '300px', 
              flexShrink: 0, 
              height: '100%',
              overflow: 'hidden', 
              display: 'flex', 
              flexDirection: 'column'
            }}>
              {/* Content/Styles Tabs - Fixed height 46px to align with Preview header */}
              <div style={{ height: '46px', minHeight: '46px', borderBottom: '1px solid #e4e4e7', display: 'flex', alignItems: 'flex-end', paddingLeft: '12px', paddingRight: '12px' }}>
                <button
                  className="bg-transparent border-0 fs-small fw-500"
                  onClick={() => setEditorTab('content')}
                  type="button"
                  style={{
                    color: editorTab === 'content' ? '#0f0f0f' : '#525866',
                    position: 'relative',
                    paddingBottom: '10px',
                    marginRight: '16px',
                  }}
                >
                  Content
                  {editorTab === 'content' && (
                    <span style={{
                      position: 'absolute',
                      bottom: '-1px',
                      left: 0,
                      right: 0,
                      height: '2px',
                      backgroundColor: '#0d6efd',
                    }} />
                  )}
                </button>
                <button
                  className="bg-transparent border-0 fs-small fw-500"
                  onClick={() => setEditorTab('styles')}
                  type="button"
                  style={{
                    color: editorTab === 'styles' ? '#0f0f0f' : '#525866',
                    position: 'relative',
                    paddingBottom: '10px',
                  }}
                >
                  Styles
                  {editorTab === 'styles' && (
                    <span style={{
                      position: 'absolute',
                      bottom: '-1px',
                      left: 0,
                      right: 0,
                      height: '2px',
                      backgroundColor: '#0d6efd',
                    }} />
                  )}
                </button>
              </div>

              {editorTab === 'content' && (
                <div className="flex-grow-1 overflow-auto border-end" style={{ padding: '10px' }}>
                  {/* Add new section button - aligned with section items */}
                  <button 
                    ref={addSectionBtnRef}
                    className="btn-add-new-section w-100"
                    onClick={() => {
                      if (!showAddSectionModal && addSectionBtnRef.current) {
                        const rect = addSectionBtnRef.current.getBoundingClientRect();
                        setPopupPosition({
                          top: rect.bottom + 4,
                          left: rect.left
                        });
                      }
                      setShowAddSectionModal(!showAddSectionModal);
                    }}
                  >
                    <i className="ri-add-circle-line item-link-icon"></i>
                    <span className="section-label">Add new section</span>
                  </button>

                  {/* Section List - Matches Laravel sortable-section-nav */}
                  <nav className="sortable-section-nav d-flex flex-column">
                    {themeSections.map((section, index) => (
                      <div 
                        key={section.id} 
                        className={`section-nav-item ${hiddenSections.has(section.id) ? 'hidden-section' : ''} ${activeSection === section.id ? 'active' : ''} ${draggingIndex === index ? 'dragging' : ''}`}
                        data-section-type={SECTION_TYPE_MAP[section.id] || section.id}
                        draggable={section.id !== 'product-information' && section.id !== 'featured-product'}
                        onDragStart={(e) => {
                          // Prevent dragging product-information section
                          if (section.id === 'product-information' || section.id === 'featured-product') {
                            e.preventDefault();
                            return;
                          }
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', section.id);
                          setDraggingIndex(index);
                        }}
                        onDragEnd={() => {
                          setDraggingIndex(null);
                          // Sync section_order to editedContent for API when drag ends
                          setSectionOrder(currentOrder => {
                            setEditedContent(prevContent => ({
                              ...prevContent,
                              section_order: currentOrder,
                            }));
                            return currentOrder;
                          });
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          
                          // Réordonner en temps réel pendant le drag
                          if (draggingIndex !== null && draggingIndex !== index) {
                            const newOrder = [...sectionOrder];
                            const [removed] = newOrder.splice(draggingIndex, 1);
                            newOrder.splice(index, 0, removed);
                            setSectionOrder(newOrder);
                            setDraggingIndex(index);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDraggingIndex(null);
                          // Update editedContent with section_order for API on drop
                          setEditedContent(prevContent => ({
                            ...prevContent,
                            section_order: sectionOrder,
                          }));
                        }}
                        onMouseEnter={() => {
                          // Only hover/scroll if section is visible
                          if (!hiddenSections.has(section.id)) {
                            handleSectionHover(section.id);
                          }
                        }}
                        onMouseLeave={() => {
                          // Only clear highlight if section was visible
                          if (!hiddenSections.has(section.id)) {
                            handleSectionLeave();
                          }
                        }}
                      >
                        {/* Icon wrapper - contains both icons in same space */}
                        <div className="icon-wrapper">
                          <i className={`${section.icon} section-icon`}></i>
                          <i className="ri-draggable section-drag-icon"></i>
                        </div>
                        
                        <button
                          className={`content-menu-item-link ${activeSection === section.id ? 'active' : ''}`}
                          onClick={() => setActiveSection(section.id)}
                        >
                          {section.label}
                        </button>
                        
                        {/* Visibility toggle button - appears on hover, hidden for first section (product-information) */}
                        {section.id !== 'product-information' && (
                          <button 
                            className="section-visibility-btn"
                            onClick={(e) => { e.stopPropagation(); toggleSectionVisibility(section.id); }}
                            title={hiddenSections.has(section.id) ? "Show section" : "Hide section"}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              {hiddenSections.has(section.id) ? (
                                <>
                                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                  <line x1="1" y1="1" x2="23" y2="23"/>
                                </>
                              ) : (
                                <>
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </>
                              )}
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </nav>
                </div>
              )}

                  {editorTab === 'styles' && (
                    <div className="p-3">
                      {/* Styles Accordion - matches Laravel custom-accordion-style-1 */}
                      <div className="accordion custom-accordion-style-1 mb-5" id="stylesAccordion">
                        <div className={`accordion-item ${openStyleAccordion === 'font' ? 'active' : ''}`}>
                          <h2 className="accordion-header">
                  <button
                              className={`accordion-button ${openStyleAccordion !== 'font' ? 'collapsed' : ''}`}
                              type="button"
                              onClick={() => setOpenStyleAccordion(openStyleAccordion === 'font' ? null : 'font')}
                            >
                              <i className="ri-font-size"></i>
                              <span>Police de Caractères</span>
                            </button>
                          </h2>
                          {openStyleAccordion === 'font' && (
                            <div className="accordion-body">
                              <p className="small text-dark mb-3 mt-2">Sélectionnez la police de caractères pour votre boutique</p>
                              <div className="font-options-grid">
                                {['Inter', 'Roboto', 'Space Grotesk', 'DM Sans', 'Montserrat', 'Be Vietnam Pro', 'Karla', 'Poppins'].map(font => (
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
                                      <span className="font-preview" style={{ fontFamily: font }}>Ag</span>
                                      <span className="font-name">{font}</span>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Import Colors Accordion */}
                        <div className={`accordion-item ${openStyleAccordion === 'importColors' ? 'active' : ''}`}>
                          <h2 className="accordion-header">
                            <button 
                              className={`accordion-button ${openStyleAccordion !== 'importColors' ? 'collapsed' : ''}`}
                              type="button"
                              onClick={() => setOpenStyleAccordion(openStyleAccordion === 'importColors' ? null : 'importColors')}
                            >
                              <i className="ri-palette-line"></i>
                              <span>Importer les couleurs d&apos;un site concurrent</span>
                            </button>
                          </h2>
                          {openStyleAccordion === 'importColors' && (
                            <div className="accordion-body">
                              <p className="small text-dark mb-2">Entrez le domaine pour importer ses couleurs</p>
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
                        <div className={`accordion-item ${openStyleAccordion === 'colorPalette' ? 'active' : ''}`}>
                          <h2 className="accordion-header">
                            <button 
                              className={`accordion-button ${openStyleAccordion !== 'colorPalette' ? 'collapsed' : ''}`}
                              type="button"
                              onClick={() => setOpenStyleAccordion(openStyleAccordion === 'colorPalette' ? null : 'colorPalette')}
                            >
                              <i className="ri-color-filter-line"></i>
                              <span>Choisissez des couleurs pour votre site</span>
                            </button>
                          </h2>
                          {openStyleAccordion === 'colorPalette' && (
                            <div className="accordion-body">
                              {/* AI Color Palette Section (if available) */}
                              {aiColorPalette && (
                                <div className="mb-3">
                                  <p className="small text-muted mb-2 d-flex align-items-center gap-2">
                                    <span className="badge bg-primary" style={{ fontSize: '10px', padding: '3px 6px' }}>IA</span>
                                    Palette suggérée par l&apos;IA pour ce produit
                                  </p>
                                  <div className="d-flex flex-column" style={{ width: 'fit-content' }}>
                                    <button 
                                      type="button"
                                      className="btn p-0 d-flex"
                                      style={{
                                        outline: selectedPaletteIndex === null ? '2px solid #0d6efd' : 'none',
                                        outlineOffset: '2px',
                                        borderRadius: '0.375rem',
                                        padding: 0,
                                        background: 'transparent',
                                        transition: 'all 0.15s ease',
                                        border: 'none'
                                      }}
                                      onClick={() => {
                                        setSelectedPaletteIndex(null);
                                        updateField('primary_color_picker', aiColorPalette.primary);
                                        updateField('tertiary_color_picker', aiColorPalette.tertiary);
                                      }}
                                      title={aiColorPalette.description}
                                    >
                                      <span className="d-inline-block" style={{ width: 22, height: 22, backgroundColor: aiColorPalette.primary, borderRadius: '0.375rem 0 0 0.375rem' }}></span>
                                      <span className="d-inline-block" style={{ width: 22, height: 22, backgroundColor: aiColorPalette.tertiary, borderRadius: '0 0.375rem 0.375rem 0' }}></span>
                                    </button>
                                    <span className="text-primary mt-1" style={{ fontSize: '11px' }}>Palette IA</span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Preset Palettes */}
                              <p className="small text-muted mb-2">Palettes prédéfinies</p>
                              <div className="d-flex gap-2 flex-wrap mb-3">
                                {presetPalettes.map((palette, i) => (
                                  <button 
                                    key={i}
                                    type="button"
                                    className="btn p-0 d-flex"
                                    style={{
                                      outline: selectedPaletteIndex === i ? '2px solid #0d6efd' : 'none',
                                      outlineOffset: '2px',
                                      borderRadius: '0.375rem',
                                      padding: 0,
                                      background: 'transparent',
                                      transition: 'all 0.15s ease',
                                      border: 'none'
                                    }}
                                    onClick={() => handlePaletteSelect(palette, i)}
                                  >
                                    <span className="d-inline-block" style={{ width: 22, height: 22, backgroundColor: palette.primary, borderRadius: '0.375rem 0 0 0.375rem' }}></span>
                                    <span className="d-inline-block" style={{ width: 22, height: 22, backgroundColor: palette.tertiary, borderRadius: '0 0.375rem 0.375rem 0' }}></span>
                                  </button>
                                ))}
                              </div>

                              {/* Generate Colors Button */}
                              <button 
                                className="btn btn-sm mb-2 text-white"
                                style={{ 
                                  background: 'linear-gradient(135deg, #4e7a9b, #6f6254)',
                                  borderRadius: 25,
                                  padding: '8px 16px',
                                  fontWeight: 500,
                                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                                  transition: 'all 0.3s ease'
                                }}
                                onClick={generateColorPalettes}
                                disabled={isGeneratingColors}
                              >
                                {isGeneratingColors ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Génération...
                                  </>
                                ) : (
                                  <>
                                    <i className="ri-refresh-line me-2"></i>
                                Générer de nouvelles couleurs
                                  </>
                                )}
                              </button>

                              {/* Generated Palettes */}
                              {generatedPalettes.length > 0 && (
                                <div className="mt-3 mb-3">
                                  <p className="small text-muted mb-2">Palettes de couleurs générées</p>
                                  <div className="d-flex gap-2 flex-wrap">
                                    {generatedPalettes.map((palette, i) => (
                                      <button 
                                        key={`gen-${i}`}
                                        type="button"
                                        className="btn p-0 d-flex"
                                        style={{
                                          outline: selectedPaletteIndex === (presetPalettes.length + i) ? '2px solid #0d6efd' : 'none',
                                          outlineOffset: '2px',
                                          borderRadius: '0.375rem',
                                          padding: 0,
                                          background: 'transparent',
                                          transition: 'all 0.15s ease',
                                          border: 'none'
                                        }}
                                        onClick={() => handlePaletteSelect(palette, i, true)}
                                      >
                                        <span className="d-inline-block" style={{ width: 22, height: 22, backgroundColor: palette.primary, borderRadius: '0.375rem 0 0 0.375rem' }}></span>
                                        <span className="d-inline-block" style={{ width: 22, height: 22, backgroundColor: palette.tertiary, borderRadius: '0 0.375rem 0.375rem 0' }}></span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Action Color */}
                              <div className="mb-3">
                                <p className="fw-500 small mb-0">Couleur d&apos;action</p>
                                <p className="small text-dark mb-2">Utilisez dans les boutons et les liens et plus pour mettre en évidence et évoquer</p>
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
                                <p className="small text-dark mb-2">Utilisez en arrière-plan de la barre d&apos;annonces et plus</p>
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

                    </div>
                  )}

                  {/* Preview Toggle at bottom - hidden by default, toggle on mobile only */}
                  <div className="border-top p-2 d-lg-none">
                    <button
                      className={`btn btn-sm w-100 ${showPreview ? 'btn-outline-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? <Eye className="me-2" size={14} /> : <EyeOff className="me-2" size={14} />}
                      {showPreview ? 'Masquer aperçu' : 'Afficher aperçu'}
                    </button>
                  </div>
            </div>

            {/* Main Content Editor Area - only visible when Content tab is active */}
            {editorTab === 'content' && (
            <div 
              className="content-editor-wrapper bg-white" 
              style={{ 
                width: '500px', 
                minWidth: '500px',
                flexShrink: 0, 
                height: '100%', 
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Empty header row - same height as tabs (46px), continuous border line */}
              <div style={{ 
                height: '46px', 
                minHeight: '46px',
                borderBottom: '1px solid #e4e4e7',
                flexShrink: 0,
              }} />
              {/* Form content area - scrolls independently, leaves space for footer */}
              <div className="content-editor p-3 border-end">
                  {/* Product Section (matches Laravel _product-section.blade.php) */}
                  {activeSection === 'product-section' && (
                    <ProductInfoSection
                      content={editedContent as any}
                      updateField={updateField}
                      updateNestedField={updateNestedField}
                      regenerateField={regenerateField}
                      regeneratingField={regeneratingField}
                      successField={successField}
                      errorField={errorField}
                      images={allOriginalImages.length > 0 ? allOriginalImages : ((editedContent.images as string[]) || [])}
                    />
                  )}

                  {/* General/Legacy Section - Product Information */}
                  {activeSection === 'general' && (
                    <FeaturedProductSection
                      content={editedContent as any}
                      updateField={updateField}
                      updateNestedField={updateNestedField}
                      regenerateField={regenerateField}
                      regeneratingField={regeneratingField}
                      successField={successField}
                      errorField={errorField}
                    />
                      )}

                  {/* Review Section - INVERTED: First testimonials displays TestimonialsSection (black bar content) */}
                  {activeSection === 'review' && (
                    <TestimonialsSection
                      content={editedContent as any}
                      updateField={updateField}
                      updateNestedField={updateNestedField}
                      regenerateField={regenerateField}
                      regeneratingField={regeneratingField}
                      successField={successField}
                      errorField={errorField}
                    />
                  )}

                  {/* Timeline Section */}
                  {activeSection === 'timeline' && (
                    <TimelineSection
                      content={editedContent as any}
                      updateField={updateField}
                      updateNestedField={updateNestedField}
                      regenerateField={regenerateField}
                      regeneratingField={regeneratingField}
                      successField={successField}
                      errorField={errorField}
                      images={allOriginalImages.length > 0 ? allOriginalImages : ((editedContent.images as string[]) || [])}
                      onEditImage={(imageUrl) => {
                        setAiEditorSelectedImage(imageUrl);
                        setAiEditorIsUploadMode(false);
                        setIsAIEditorOpen(true);
                      }}
                      onGenerateImage={() => {
                        setAiEditorSelectedImage(null);
                        setAiEditorIsUploadMode(true);
                        setIsAIEditorOpen(true);
                      }}
                    />
                  )}

                  {/* Product Information Section */}
                  {(activeSection === 'product-information' || activeSection === 'featured-product') && (
                    <FeaturedProductSection
                      content={editedContent as any}
                      updateField={updateField}
                      updateNestedField={updateNestedField}
                      regenerateField={regenerateField}
                      regeneratingField={regeneratingField}
                      successField={successField}
                      errorField={errorField}
                    />
                      )}

                  {/* What Makes Us Different Section */}
                  {activeSection === 'what-makes-us-different' && (
                    <BenefitsSection
                      content={editedContent as any}
                      updateField={updateField}
                      updateNestedField={updateNestedField}
                      regenerateField={regenerateField}
                      regeneratingField={regeneratingField}
                      successField={successField}
                      errorField={errorField}
                      images={allOriginalImages.length > 0 ? allOriginalImages : ((editedContent.images as string[]) || [])}
                      onEditImage={(imageUrl) => {
                        setAiEditorSelectedImage(imageUrl);
                        setAiEditorIsUploadMode(false);
                        setIsAIEditorOpen(true);
                      }}
                      onGenerateImage={() => {
                        setAiEditorSelectedImage(null);
                        setAiEditorIsUploadMode(true);
                        setIsAIEditorOpen(true);
                      }}
                    />
                  )}

                  {/* Clinical Section */}
                  {activeSection === 'clinical-section' && (
                    <ClinicalSection
                      content={editedContent as any}
                      updateField={updateField}
                      updateNestedField={updateNestedField}
                      regenerateField={regenerateField}
                      regeneratingField={regeneratingField}
                      successField={successField}
                      errorField={errorField}
                      images={allOriginalImages.length > 0 ? allOriginalImages : ((editedContent.images as string[]) || [])}
                      onEditImage={(imageUrl) => {
                        setAiEditorSelectedImage(imageUrl);
                        setAiEditorIsUploadMode(false);
                        setIsAIEditorOpen(true);
                      }}
                      onGenerateImage={() => {
                        setAiEditorSelectedImage(null);
                        setAiEditorIsUploadMode(true);
                        setIsAIEditorOpen(true);
                      }}
                    />
                  )}

                  {/* Hero Section */}
                  {activeSection === 'hero' && (
                    <HeroSection
                      content={editedContent as any}
                      updateField={updateField}
                      updateNestedField={updateNestedField}
                      regenerateField={regenerateField}
                      regeneratingField={regeneratingField}
                      successField={successField}
                      errorField={errorField}
                      images={allOriginalImages.length > 0 ? allOriginalImages : ((editedContent.images as string[]) || [])}
                      onEditImage={(imageUrl) => {
                        setAiEditorSelectedImage(imageUrl);
                        setAiEditorIsUploadMode(false);
                        setIsAIEditorOpen(true);
                      }}
                      onGenerateImage={() => {
                        setAiEditorSelectedImage(null);
                        setAiEditorIsUploadMode(true);
                        setIsAIEditorOpen(true);
                      }}
                    />
                  )}


                  {/* FAQs Section */}
                  {(activeSection === 'faqs' || activeSection === 'faq') && (
                    <FAQSection
                      content={editedContent as any}
                      updateField={updateField}
                      updateNestedField={updateNestedField}
                      regenerateField={regenerateField}
                      regeneratingField={regeneratingField}
                      successField={successField}
                      errorField={errorField}
                      images={allOriginalImages.length > 0 ? allOriginalImages : ((editedContent.images as string[]) || [])}
                      onEditImage={(imageUrl) => {
                        setAiEditorSelectedImage(imageUrl);
                        setAiEditorIsUploadMode(false);
                        setIsAIEditorOpen(true);
                      }}
                      onGenerateImage={() => {
                        setAiEditorSelectedImage(null);
                        setAiEditorIsUploadMode(true);
                        setIsAIEditorOpen(true);
                      }}
                    />
                  )}

                  {/* Comparison Table Section */}
                  {(activeSection === 'comparison-table' || activeSection === 'pdp-comparison-table') && (
                    <ComparisonSection
                      content={editedContent as any}
                      updateField={updateField}
                      updateNestedField={updateNestedField}
                      regenerateField={regenerateField}
                      regeneratingField={regeneratingField}
                      successField={successField}
                      errorField={errorField}
                      images={allOriginalImages.length > 0 ? allOriginalImages : ((editedContent.images as string[]) || [])}
                      onEditImage={(imageUrl) => {
                        setAiEditorSelectedImage(imageUrl);
                        setAiEditorIsUploadMode(false);
                        setIsAIEditorOpen(true);
                      }}
                      onGenerateImage={() => {
                        setAiEditorSelectedImage(null);
                        setAiEditorIsUploadMode(true);
                        setIsAIEditorOpen(true);
                      }}
                    />
                  )}

                  {/* Image with Text Section */}
                  {activeSection === 'image-with-text' && (
                    <ImageWithTextSection
                      content={editedContent as any}
                      updateField={updateField}
                      updateNestedField={updateNestedField}
                      regenerateField={regenerateField}
                      regeneratingField={regeneratingField}
                      successField={successField}
                      errorField={errorField}
                      images={allOriginalImages.length > 0 ? allOriginalImages : ((editedContent.images as string[]) || [])}
                      onEditImage={(imageUrl) => {
                        setAiEditorSelectedImage(imageUrl);
                        setAiEditorIsUploadMode(false);
                        setIsAIEditorOpen(true);
                      }}
                      onGenerateImage={() => {
                        setAiEditorSelectedImage(null);
                        setAiEditorIsUploadMode(true);
                        setIsAIEditorOpen(true);
                      }}
                    />
                  )}

                  {/* Testimonials Section - INVERTED: Second testimonials displays ReviewsSection (product reviews content) */}
                  {(activeSection === 'testimonials' || activeSection === 'testimonials-marquee' || activeSection === 'header-with-marquee' || activeSection === 'middle-page') && (
                    <ReviewsSection
                      content={editedContent as any}
                      updateField={updateField}
                      updateNestedField={updateNestedField}
                      regenerateField={regenerateField}
                      regeneratingField={regeneratingField}
                      successField={successField}
                      errorField={errorField}
                    />
                  )}

                  {/* Images Section */}
                  {activeSection === 'images' && (
                    <ImageSelector
                      images={allOriginalImages.length > 0 ? allOriginalImages : ((editedContent.images as string[]) || [])}
                      sectionLabel="Images du Produit"
                      inputType="checkbox"
                      sortable={true}
                      canGenerateAI={true}
                      maxVisible={12}
                      onSelect={(selected) => updateField('selectedMainImages', selected)}
                      onGenerateAI={() => {
                        setAiEditorSelectedImage(null);
                        setAiEditorIsUploadMode(true);
                        setIsAIEditorOpen(true);
                      }}
                      onEditImage={(imageUrl) => {
                        setAiEditorSelectedImage(imageUrl);
                        setAiEditorIsUploadMode(false);
                        setIsAIEditorOpen(true);
                      }}
                    />
                  )}

                  {/* Announcement Bar Section */}
                  {activeSection === 'announcement-bar' && (
                    <AnnouncementBarSection
                      content={editedContent as any}
                      updateField={updateField}
                      updateNestedField={updateNestedField}
                      regenerateField={regenerateField}
                      regeneratingField={regeneratingField}
                      successField={successField}
                      errorField={errorField}
                    />
                  )}

                  {/* Video Grid Section */}
                  {(activeSection === 'video-grid' || activeSection === 'video-gris-slider') && (
                    <VideoGridSection
                      content={editedContent as any}
                      updateField={updateField}
                      updateNestedField={updateNestedField}
                      regenerateField={regenerateField}
                      regeneratingField={regeneratingField}
                      successField={successField}
                      errorField={errorField}
                      images={allOriginalImages.length > 0 ? allOriginalImages : ((editedContent.images as string[]) || [])}
                    />
                  )}
                              </div>
                        </div>
                      )}
                    </div>
              {/* End of left-panel-top-row */}

            {/* Step Buttons Footer - spans full width of left panel (sidebar + content editor) */}
            <div className="step-buttons-wrapper d-flex justify-content-end align-items-center gap-2" style={{ 
              flexShrink: 0,
              backgroundColor: '#fff',
              padding: '16px',
              borderTop: '1px solid rgb(228, 228, 231)',
              height: '65px',
            }}>
              <button 
                className="btn btn-secondary" 
                type="button" 
                style={{ 
                  backgroundColor: '#fff',
                  borderColor: '#d1d5db',
                  color: '#374151',
                }}
                onClick={() => {
                  // If in Styles tab → go to Content tab
                  // If in Content tab → go to Step 2
                  if (editorTab === 'styles') {
                    setEditorTab('content');
                  } else {
                    goToStep2();
                  }
                }}
              >
                Retour
              </button>
              <button 
                className="btn btn-primary" 
                type="button" 
                style={{ backgroundColor: '#0d6efd', borderColor: '#0d6efd' }}
                onClick={() => {
                  // If in Content tab → go to Styles tab
                  // If in Styles tab → go to Step 4
                  if (editorTab === 'content') {
                    setEditorTab('styles');
                  } else {
                    goToStep4();
                  }
                }}
              >
                Suivant
              </button>
            </div>
              </div>
            {/* End of left-panel-container */}

            {/* Preview Panel - takes remaining space (matches Laravel #AIStorePreview) */}
            <div 
              className={`preview-panel bg-weak-50 flex-grow-1 ${!showPreview ? 'd-none d-lg-block' : ''}`}
              id="AIStorePreview"
              style={{ height: '100%', overflow: 'hidden', backgroundColor: '#f5f7fa', overscrollBehavior: 'contain' }}
            >
                <div 
                  className={`h-100 d-flex flex-column ${previewExpanded ? 'preview-expanded' : ''}`}
                  style={{ transition: 'all 0.3s ease' }}
                >
                  {/* Preview Header - Laravel style (preview-btn-wrapper) - same bg as preview */}
                  <div className="preview-btn-wrapper border-bottom d-flex align-items-center justify-content-between px-3" style={{ height: '46px', backgroundColor: '#f5f7fa' }}>
                    {/* Left: Page Type Selector Only - matches Laravel dropdown */}
                    <div className="d-flex align-items-center gap-2">
                      <select
                        className="form-select page-toggle"
                        value={pageType}
                        onChange={(e) => {
                          setPageType(e.target.value as 'product' | 'home');
                          setTimeout(() => refreshPreviewRef.current(), 200);
                        }}
                      >
                        <option value="product">Page de produit</option>
                        <option value="home">Page d&apos;accueil</option>
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

                    {/* Right: View Store Link */}
                    <a
                      href={`/api/ai/liquid-preview?product_id=${productId}&page_type=${pageType}&theme=${themeKey}&t=${Date.now()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary fw-normal d-flex align-items-center gap-2"
                      style={{ fontSize: '13px', padding: '6px 12px', color: '#525866', backgroundColor: '#fff', border: '1px solid #e1e4ea' }}
                    >
                      <i className="ri-external-link-line" style={{ fontSize: '14px' }}></i>
                      <span>Voir la boutique</span>
                    </a>
                  </div>
                  
                  {/* Preview Content - bg matches Laravel bg-weak-50 = #f5f7fa */}
                  <div className="preview-iframe-container flex-grow-1 position-relative d-flex justify-content-center" style={{ backgroundColor: '#f5f7fa', overflow: 'hidden', overscrollBehavior: 'contain' }}>
                    <div 
                      className={`preview-iframe-wrapper ${previewDevice === 'mobile' ? 'preview-mobile' : 'preview-desktop'}`}
                      style={{
                        width: previewDevice === 'mobile' ? '470px' : '95%',
                        height: '95%',
                        transition: 'width 0.3s ease',
                        backgroundColor: '#fff',
                        overscrollBehavior: 'contain',
                        boxShadow: previewDevice === 'mobile' ? '0 4px 20px rgba(0,0,0,0.15)' : 'none',
                        borderRadius: previewDevice === 'mobile' ? '20px' : '20px',
                        overflow: 'hidden',
                        marginTop: previewDevice === 'mobile' ? '20px' : '20px',
                        marginBottom: previewDevice === 'mobile' ? '10px' : '10px',
                        position: 'relative',
                      }}
                    >
                      {/* Skeleton Loading Overlay - Clean white/gray with theme accent */}
                      {isPreviewLoading && (() => {
                        // Get theme colors for skeleton accents only
                        const primaryColor = (editedContent.primary_color_picker as string) || '#6f6254';
                        
                        return (
                        <div 
                          className="preview-skeleton-overlay"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: '#fafafa',
                            zIndex: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'auto',
                            borderRadius: 'inherit',
                          }}
                        >
                          {/* Skeleton Announcement Bar - uses theme primary */}
                          <div style={{ 
                            width: '100%', 
                            height: '32px', 
                            backgroundColor: primaryColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <div style={{ width: '60%', height: '10px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '4px' }}></div>
                          </div>
                          
                          {/* Skeleton Header - white background */}
                          <div style={{ 
                            padding: '12px 16px', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            borderBottom: '1px solid #e5e5e5',
                            backgroundColor: '#ffffff',
                            flexShrink: 0,
                          }}>
                            <div style={{ width: '80px', height: '20px', backgroundColor: '#e5e5e5', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                              <div style={{ width: '20px', height: '20px', backgroundColor: '#e5e5e5', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                              <div style={{ width: '20px', height: '20px', backgroundColor: '#e5e5e5', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                            </div>
                          </div>
                          
                          {/* Skeleton Main Content - white/light gray */}
                          <div style={{ flex: 1, padding: '16px', overflow: 'auto', backgroundColor: '#ffffff' }}>
                            {/* Product Image */}
                            <div style={{ 
                              width: '100%', 
                              aspectRatio: '1', 
                              borderRadius: '12px', 
                              marginBottom: '12px',
                              background: 'linear-gradient(90deg, #f0f0f0 0%, #e5e5e5 50%, #f0f0f0 100%)',
                              backgroundSize: '200% 100%',
                              animation: 'skeleton-shimmer 1.5s infinite',
                            }}></div>
                            
                            {/* Thumbnails */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                              {[1,2,3,4].map(i => (
                                <div key={i} style={{ 
                                  width: '56px', 
                                  height: '56px', 
                                  backgroundColor: '#ebebeb', 
                                  borderRadius: '8px', 
                                  animation: 'skeleton-pulse 1.5s infinite',
                                  animationDelay: `${i * 0.1}s`
                                }}></div>
                              ))}
                            </div>
                            
                            {/* Product Title */}
                            <div style={{ width: '75%', height: '20px', backgroundColor: '#e5e5e5', borderRadius: '4px', marginBottom: '10px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                            
                            {/* Price */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                              <div style={{ width: '60px', height: '24px', backgroundColor: '#e0e0e0', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                              <div style={{ width: '50px', height: '16px', backgroundColor: '#ebebeb', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                            </div>
                            
                            {/* Description */}
                            <div style={{ marginBottom: '20px' }}>
                              <div style={{ width: '100%', height: '12px', backgroundColor: '#ebebeb', borderRadius: '4px', marginBottom: '8px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                              <div style={{ width: '95%', height: '12px', backgroundColor: '#ebebeb', borderRadius: '4px', marginBottom: '8px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                              <div style={{ width: '80%', height: '12px', backgroundColor: '#ebebeb', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                            </div>
                            
                            {/* CTA Button - uses theme primary color */}
                            <div style={{ 
                              width: '100%', 
                              height: '48px', 
                              background: `linear-gradient(90deg, ${primaryColor}90 0%, ${primaryColor} 50%, ${primaryColor}90 100%)`,
                              backgroundSize: '200% 100%',
                              borderRadius: '24px', 
                              animation: 'skeleton-shimmer 1.5s infinite',
                              marginBottom: '16px'
                            }}></div>
                            
                            {/* Trust badges */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
                              {[1,2,3].map(i => (
                                <div key={i} style={{ 
                                  width: '50px', 
                                  height: '30px', 
                                  backgroundColor: '#f0f0f0', 
                                  borderRadius: '4px',
                                  animation: 'skeleton-pulse 1.5s infinite',
                                  animationDelay: `${i * 0.15}s`
                                }}></div>
                              ))}
                            </div>
                            
                            {/* Extra sections to fill height */}
                            <div style={{ marginTop: '32px' }}>
                              <div style={{ width: '50%', height: '24px', backgroundColor: '#e5e5e5', borderRadius: '4px', marginBottom: '16px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                              <div style={{ width: '100%', height: '120px', backgroundColor: '#f5f5f5', borderRadius: '12px', marginBottom: '24px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                              
                              <div style={{ width: '40%', height: '24px', backgroundColor: '#e5e5e5', borderRadius: '4px', marginBottom: '16px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
                                {[1,2,3,4].map(i => (
                                  <div key={i} style={{ 
                                    height: '80px', 
                                    backgroundColor: '#f5f5f5', 
                                    borderRadius: '8px',
                                    animation: 'skeleton-pulse 1.5s infinite',
                                    animationDelay: `${i * 0.1}s`
                                  }}></div>
                                ))}
                              </div>
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
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}>
                            <div className="spinner-border spinner-border-sm" role="status" style={{ width: '14px', height: '14px', color: '#666666' }}>
                              <span className="visually-hidden">Chargement...</span>
                            </div>
                            <span style={{ fontSize: '12px', color: '#555555' }}>Chargement de l&apos;aperçu...</span>
                          </div>
                        </div>
                        );
                      })()}
                      <iframe
                        ref={previewIframeRef}
                        className="w-100 h-100 border-0"
                        style={{
                          backgroundColor: '#fff',
                          opacity: isPreviewLoading ? 0 : 1,
                          transition: 'opacity 0.3s ease',
                          overscrollBehavior: 'contain',
                        }}
                        onLoad={() => {
                          setIsPreviewLoading(false);
                          // After preview loads, scroll to the active section (without highlight!)
                          // Small delay to ensure iframe content is fully rendered
                          setTimeout(() => {
                            if (activeSection) {
                              // noHighlight=true: only scroll, don't show blue box during edit
                              scrollPreviewToSection(activeSection, true);
                            }
                          }, 300);
                        }}
                        title="Aperçu de la boutique"
                      />
                    </div>
                  </div>
                </div>
            </div>
          </div>
        )}
        {/* End of Step 3 conditional */}

        {/* ==================== STEP 4: METTRE À JOUR LE THÈME ==================== */}
        {currentStep === 4 && (
          <div className="d-flex flex-column" style={{ height: '100%', overflow: 'hidden' }}>
            {/* Preview Header - same as step 3 */}
            <div className="preview-btn-wrapper border-bottom d-flex align-items-center justify-content-between px-3" style={{ height: '46px', backgroundColor: '#f5f7fa', flexShrink: 0 }}>
              {/* Left: Page Type Selector */}
              <div className="d-flex align-items-center gap-2">
                <select
                  className="form-select page-toggle"
                  value={pageType}
                  onChange={(e) => {
                    setPageType(e.target.value as 'product' | 'home');
                    setTimeout(() => refreshPreviewRef.current(), 200);
                  }}
                >
                  <option value="product">Page de produit</option>
                  <option value="home">Page d&apos;accueil</option>
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

              {/* Right: View Store Link */}
              <a
                href={`/api/ai/liquid-preview?product_id=${productId}&page_type=${pageType}&theme=${themeKey}&t=${Date.now()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary fw-normal d-flex align-items-center gap-2"
                style={{ fontSize: '13px', padding: '6px 12px', color: '#525866', backgroundColor: '#fff', border: '1px solid #e1e4ea' }}
              >
                <i className="ri-external-link-line" style={{ fontSize: '14px' }}></i>
                <span>Voir la boutique</span>
              </a>
            </div>

            {/* Preview Content Area - Full width */}
            <div className="flex-grow-1 d-flex flex-column position-relative" style={{ backgroundColor: '#f5f7fa', overflow: 'hidden' }}>
              {/* Yellow Announcement Banner - Inside preview area like margin-top */}
              {showAnnouncementBanner && (
                <div className="d-flex justify-content-center" style={{ marginTop: '16px', flexShrink: 0 }}>
                  <div 
                    style={{ 
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffecb5',
                      borderRadius: '8px',
                      fontSize: '13px',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#664d03'
                    }}
                  >
                    <i className="ri-alert-line" style={{ fontSize: '16px', marginRight: '8px' }}></i>
                    <span>Remarque: Une fois votre thème mis à jour sur Shopify, vous pouvez le personnaliser et l&apos;optimiser pour qu&apos;il corresponde parfaitement à votre marque.</span>
                    <span 
                      style={{ marginLeft: '12px', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
                      onClick={() => setShowAnnouncementBanner(false)}
                    >×</span>
                  </div>
                </div>
              )}

              {/* Preview iframe container */}
              <div className="flex-grow-1 d-flex justify-content-center" style={{ padding: '16px' }}>
                <div 
                  className={`preview-iframe-wrapper ${previewDevice === 'mobile' ? 'preview-mobile' : 'preview-desktop'}`}
                  style={{
                    width: previewDevice === 'mobile' ? '470px' : '100%',
                    maxWidth: '1400px',
                    height: '100%',
                    transition: 'width 0.3s ease',
                    backgroundColor: '#fff',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {/* Skeleton Loading - same as step 3 */}
                  {isPreviewLoading && (() => {
                    const primaryColor = (editedContent.primary_color_picker as string) || '#6f6254';
                    return (
                      <div 
                        className="preview-skeleton-overlay"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: '#fafafa',
                          zIndex: 10,
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'auto',
                          borderRadius: 'inherit',
                        }}
                      >
                        {/* Skeleton Announcement Bar */}
                        <div style={{ 
                          width: '100%', 
                          height: '32px', 
                          backgroundColor: primaryColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <div style={{ width: '60%', height: '10px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '4px' }}></div>
                        </div>
                        
                        {/* Skeleton Header */}
                        <div style={{ 
                          padding: '12px 16px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          borderBottom: '1px solid #e5e5e5',
                          backgroundColor: '#ffffff',
                          flexShrink: 0,
                        }}>
                          <div style={{ width: '80px', height: '20px', backgroundColor: '#e5e5e5', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                          <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ width: '20px', height: '20px', backgroundColor: '#e5e5e5', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                            <div style={{ width: '20px', height: '20px', backgroundColor: '#e5e5e5', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                          </div>
                        </div>
                        
                        {/* Skeleton Main Content */}
                        <div style={{ flex: 1, padding: '16px', overflow: 'auto', backgroundColor: '#ffffff' }}>
                          <div style={{ 
                            width: '100%', 
                            aspectRatio: '1', 
                            borderRadius: '12px', 
                            marginBottom: '12px',
                            background: 'linear-gradient(90deg, #f0f0f0 0%, #e5e5e5 50%, #f0f0f0 100%)',
                            backgroundSize: '200% 100%',
                            animation: 'skeleton-shimmer 1.5s infinite',
                          }}></div>
                          
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            {[1,2,3,4].map(i => (
                              <div key={i} style={{ 
                                width: '56px', 
                                height: '56px', 
                                backgroundColor: '#ebebeb', 
                                borderRadius: '8px', 
                                animation: 'skeleton-pulse 1.5s infinite',
                              }}></div>
                            ))}
                          </div>
                          
                          <div style={{ width: '75%', height: '20px', backgroundColor: '#e5e5e5', borderRadius: '4px', marginBottom: '10px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ width: '60px', height: '24px', backgroundColor: '#e0e0e0', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                            <div style={{ width: '50px', height: '16px', backgroundColor: '#ebebeb', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite' }}></div>
                          </div>
                          
                          <div style={{ 
                            width: '100%', 
                            height: '48px', 
                            background: `linear-gradient(90deg, ${primaryColor}90 0%, ${primaryColor} 50%, ${primaryColor}90 100%)`,
                            backgroundSize: '200% 100%',
                            borderRadius: '24px', 
                            animation: 'skeleton-shimmer 1.5s infinite',
                          }}></div>
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
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          <div className="spinner-border spinner-border-sm" role="status" style={{ width: '14px', height: '14px', color: '#666666' }}>
                            <span className="visually-hidden">Chargement...</span>
                          </div>
                          <span style={{ fontSize: '12px', color: '#555555' }}>Chargement de l&apos;aperçu...</span>
                        </div>
                      </div>
                    );
                  })()}
                  <iframe
                    ref={previewIframeRef}
                    className="preview-iframe"
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
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

            {/* Bottom Buttons - Retour and Connectez votre Shopify */}
            <div 
              className="d-flex justify-content-end align-items-center gap-3 px-4" 
              style={{ 
                height: '80px', 
                backgroundColor: '#fff', 
                borderTop: '1px solid #e4e4e7',
                flexShrink: 0
              }}
            >
              <button 
                className="btn btn-secondary" 
                type="button" 
                style={{ 
                  backgroundColor: '#fff',
                  borderColor: '#d1d5db',
                  color: '#374151',
                  padding: '10px 24px',
                  fontSize: '14px',
                  height: '44px'
                }}
                onClick={() => {
                  setEditorTab('styles');
                  setCurrentStep(3);
                  // Refresh preview after returning to step 3
                  setTimeout(() => refreshPreviewRef.current(), 300);
                }}
              >
                Retour
              </button>
              <button 
                className="btn btn-primary d-flex align-items-center justify-content-center gap-2" 
                type="button" 
                style={{ 
                  backgroundColor: '#0d6efd', 
                  borderColor: '#0d6efd',
                  color: '#fff',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  height: '44px'
                }}
                onClick={() => {
                  // TODO: Implement Shopify connection
                  alert('Connexion à Shopify - Fonctionnalité à venir');
                }}
              >
                <img src="/img/shopify-logo-min.png" width="18" height="18" alt="Shopify" />
                <span>Connectez votre Shopify</span>
              </button>
            </div>
          </div>
        )}
        {/* End of Step 4 conditional */}
        </div>

      {/* Add Section Popup - rendered outside overflow containers */}
      {showAddSectionModal && (
        <div className="add-section-popup-overlay" onClick={() => setShowAddSectionModal(false)}>
          <div 
            className="add-section-popup show" 
            style={{ top: popupPosition.top, left: popupPosition.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="add-section-popup-container">
              <div className="add-section-popup-content">
                {/* Left side - Section list */}
                <div className="add-section-list">
                  <div className="section-search-wrapper">
                    <i className="ri-search-line"></i>
                    <input 
                      type="text" 
                      className="section-search-input"
                      placeholder="Search sections"
                      value={sectionSearchQuery}
                      onChange={(e) => setSectionSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="section-items-list">
                    {filteredAvailableSections.map((category) => (
                      <div key={category.category} className="section-category">
                        <div className="section-category-header">{category.category}</div>
                        {category.sections.map((section) => (
                          <button
                            key={section.id}
                            type="button"
                            className={`section-item ${selectedSectionToAdd === section.type ? 'active' : ''}`}
                            onClick={() => handleSelectSectionToAdd(section.type)}
                          >
                            <i className={`${section.icon} section-item-icon`}></i>
                            <span>{section.label}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Right side - Preview area */}
                <div className="add-section-preview">
                  <div className="section-preview-content" id="sectionPreviewContent">
                    {previewState === 'idle' && (
                      <div className="section-preview-placeholder">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span>Select a section to preview</span>
                      </div>
                    )}
                    {previewState === 'loading' && (
                      <div className="section-preview-loading">
                        <div className="spinner-border spinner-border-sm" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <span>Loading preview...</span>
                      </div>
                    )}
                    {previewState === 'loaded' && sectionPreviewHtml && (
                      <iframe
                        className="section-preview-iframe"
                        srcDoc={sectionPreviewHtml}
                        title="Section Preview"
                      />
                    )}
                    {previewState === 'error' && (
                      <div className="section-preview-placeholder">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21,15 16,10 5,21"></polyline>
                        </svg>
                        <span>Preview not available</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Footer */}
              <div className="add-section-popup-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAddSectionModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm"
                  disabled={!selectedSectionToAdd}
                  onClick={handleAddSection}
                >
                  <i className="ri-add-line me-1"></i>
                  Add Section
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Image Editor Modal */}
      <AIImageEditorModal
        isOpen={isAIEditorOpen}
        onClose={() => {
          setIsAIEditorOpen(false);
          setAiEditorSelectedImage(null);
          setAiEditorIsUploadMode(false);
        }}
        images={allOriginalImages}
        selectedImageUrl={aiEditorSelectedImage}
        isUploadMode={aiEditorIsUploadMode}
        productId={product?.id}
        onImageGenerated={(newImageUrl, originalImageUrl) => {
          // Add new generated image to the lists
          setAllOriginalImages(prev => [newImageUrl, ...prev]);
          setAiGeneratedImages(prev => [{
            image_url: newImageUrl,
            prompt: 'AI Generated',
            index: prev.length
          }, ...prev]);
          
          // Select the new image
          setSelectedImages(prev => {
            if (!prev.includes(newImageUrl)) {
              return [newImageUrl, ...prev];
            }
            return prev;
          });
          
          // If editing an existing image, replace it in selections
          if (originalImageUrl) {
            setSelectedImages(prev => 
              prev.map(img => img === originalImageUrl ? newImageUrl : img)
            );
          }
          
          // Update the current image in the modal
          setAiEditorSelectedImage(newImageUrl);
          
          // Show success message
          setSuccessMessage('Image générée avec succès!');
          setTimeout(() => setSuccessMessage(null), 3000);
        }}
      />
    </TooltipProvider>
  );
}

