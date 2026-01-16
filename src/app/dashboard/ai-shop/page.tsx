"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/DashboardHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStats } from "@/contexts/StatsContext";

// Types
interface GeneratedShop {
  id: number;
  title: string;
  productUrl: string;
  image: string;
  language: string;
  type: string;
  source: string;
  category: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  shopifyUrl?: string;
  createdAt: string;
}

// Loading stages configuration
const LOADING_STAGES = [
  { id: 1, text: '(1/4) Récupération des données produit...', textEn: '(1/4) Fetching product data...' },
  { id: 2, text: '(2/4) Génération du contenu IA...', textEn: '(2/4) Generating AI content...' },
  { id: 3, text: '(3/4) Création de la boutique...', textEn: '(3/4) Creating store...' },
  { id: 4, text: '(4/4) Génération des images IA...', textEn: '(4/4) Generating AI images...' },
];

// URL validation types
type UrlType = 'aliexpress' | 'amazon' | 'shopify' | 'unknown';
type UrlValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

interface UrlValidationResult {
  status: UrlValidationStatus;
  type: UrlType;
  message: string;
}

// Detect URL type (mirrors Laravel detectUrlType)
function detectUrlType(url: string): UrlType {
  if (!url || typeof url !== 'string') return 'unknown';
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // AliExpress pattern - supports .com, .us, .ru, .fr and other regional domains
  const aliexpressRegex = /aliexpress\.[a-z]{2,3}\/item\/(\d+)\.html/i;
  if (aliexpressRegex.test(trimmedUrl)) {
    return 'aliexpress';
  }
  
  // Amazon pattern - check for ASIN in URL
  const amazonPatterns = [
    /amazon\.[a-z.]+\/dp\/([A-Z0-9]{10})/i,
    /amazon\.[a-z.]+\/gp\/product\/([A-Z0-9]{10})/i,
    /amazon\.[a-z.]+\/.*\/dp\/([A-Z0-9]{10})/i,
    /amzn\.[a-z.]+\/([A-Z0-9]{10})/i,
  ];
  for (const pattern of amazonPatterns) {
    if (pattern.test(url)) {
      return 'amazon';
    }
  }
  
  // Shopify pattern - any domain with /products/ path
  const shopifyRegex1 = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,61}\/products\/[0-9a-zA-Z-]{1,}/i;
  const shopifyRegex2 = /^(https?:\/\/)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,61}\/(collections\/[a-zA-Z0-9-]+\/)?products\/[0-9a-zA-Z-]{1,}/i;
  
  if (shopifyRegex1.test(url) || shopifyRegex2.test(url) || url.includes('/products/')) {
    return 'shopify';
  }
  
  return 'unknown';
}

// Beautify URL for validation (doesn't modify user input)
// Only called before submitting, not while typing
function beautifyUrlForValidation(url: string): string {
  if (!url || typeof url !== 'string') return url;
  
  let cleaned = url.trim();
  
  // Add https:// if missing (for validation purposes only)
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }
  
  return cleaned;
}

// Extract domain from URL for favicon
function extractDomainFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  try {
    // Add https:// if missing for proper parsing
    let urlToParse = url.trim();
    if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
      urlToParse = 'https://' + urlToParse;
    }
    
    const urlObj = new URL(urlToParse);
    let domain = urlObj.hostname;
    
    // Remove www. prefix
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }
    
    return domain;
  } catch (e) {
    return null;
  }
}

// Get favicon URL using Google's favicon service
function getFaviconUrl(url: string): string {
  const domain = extractDomainFromUrl(url);
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

// Clean URL - trim everything after .html or .htm for ALL URLs
// Also remove query parameters (utm_source, etc.) and fragments from product URLs
// This matches Laravel behavior where URLs are cleaned before processing
function cleanProductUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;
  
  let cleaned = url.trim();
  
  // Trim everything after .html or .htm (including query params, fragments, etc.)
  // This works for AliExpress, Amazon, and any other URLs with .html/.htm
  // Example: https://fr.aliexpress.com/item/1005009828380377.html?spm=a2g0o...&gps-id=...
  // Becomes: https://fr.aliexpress.com/item/1005009828380377.html
  
  // Check for .html first (more common)
  const htmlIndex = cleaned.indexOf('.html');
  if (htmlIndex !== -1) {
    cleaned = cleaned.substring(0, htmlIndex + 5); // +5 to include ".html"
    return cleaned;
  }
  
  // Check for .htm (less common but exists)
  const htmIndex = cleaned.indexOf('.htm');
  if (htmIndex !== -1) {
    // Make sure it's not part of .html
    if (cleaned.charAt(htmIndex + 4) !== 'l') {
      cleaned = cleaned.substring(0, htmIndex + 4); // +4 to include ".htm"
      return cleaned;
    }
  }
  
  // For Amazon URLs, clean to just the product page
  const urlType = detectUrlType(cleaned);
  if (urlType === 'amazon') {
    // Extract ASIN from various Amazon URL formats
    const asinPatterns = [
      /amazon\.([a-z.]+)\/dp\/([A-Z0-9]{10})/i,
      /amazon\.([a-z.]+)\/gp\/product\/([A-Z0-9]{10})/i,
      /amazon\.([a-z.]+)\/.*\/dp\/([A-Z0-9]{10})/i,
    ];
    
    for (const pattern of asinPatterns) {
      const match = cleaned.match(pattern);
      if (match) {
        const domain = match[1];
        const asin = match[2];
        cleaned = `https://www.amazon.${domain}/dp/${asin}`;
        return cleaned;
      }
    }
  }
  
  // For Shopify and other product URLs, remove query parameters and fragments
  // This cleans URLs like: https://store.com/products/product-name?utm_source=...&variant=123
  // To: https://store.com/products/product-name
  // Also works for any URL with /products/ or /collections/ paths
  if (cleaned.includes('/products/') || cleaned.includes('/collections/')) {
    try {
      const urlObj = new URL(cleaned.startsWith('http') ? cleaned : 'https://' + cleaned);
      // Remove all query params and hash
      cleaned = urlObj.origin + urlObj.pathname;
      // Remove trailing slash if any
      if (cleaned.endsWith('/')) {
        cleaned = cleaned.slice(0, -1);
      }
    } catch (e) {
      // If URL parsing fails, try simple string manipulation
      const questionIndex = cleaned.indexOf('?');
      if (questionIndex !== -1) {
        cleaned = cleaned.substring(0, questionIndex);
      }
      const hashIndex = cleaned.indexOf('#');
      if (hashIndex !== -1) {
        cleaned = cleaned.substring(0, hashIndex);
      }
    }
  }
  
  return cleaned;
}

interface AIContent {
  // Basic product info
  title: string;
  description: string;
  price: string;
  compareAtPrice?: string;
  images: string[];
  store_name?: string;
  
  // Hero Section (img-with-txt)
  mainCatchyText?: string;
  subMainCatchyText?: string;
  features?: string[];
  reviewRating?: string;
  reviewCount?: string;
  guarantees?: string[];
  landingPageImage?: string;
  
  // Product Info Section (featured-product)
  header?: string;
  subheading?: string;
  featureHeader?: string;
  deliveryInformation?: string;
  howItWorks?: string;
  instructions?: string;
  productFeatures?: { title: string; text: string }[];
  
  // Benefits Section (pdp-benefits)
  benefitsHeading?: string;
  benefitsParagraph?: string;
  benefits?: { icon?: string; title?: string; text: string }[];
  benefitsImage?: string;
  whatMakesUsDifferentText?: string;
  
  // Clinical/Statistics Section (pdp-statistics-column)
  persuasiveContent?: {
    header?: string;
    paragraph?: string;
    image?: string;
  };
  clinicalResults?: { percentage: string; description: string }[];
  statisticsImage?: string;
  
  // Timeline Section (timeline-points)
  timelineHeading?: string;
  timeline?: { timeframe: string; description: string }[];
  timelineImage?: string;
  
  // Comparison Section (pdp-comparison-table)
  comparison?: {
    heading?: string;
    subheading?: string;
    our_name?: string;
    others_name?: string;
    features?: { feature: string; us: boolean; others: boolean }[];
  };
  comparisonImage?: string;
  
  // FAQ Section (image-faq)
  faq?: { question: string; answer: string }[];
  faqHeading?: string;
  faqImage?: string;
  
  // Reviews/Testimonials Section (product-reviews)
  testimonials?: { name?: string; author?: string; review?: string; text?: string; header?: string; rating?: number }[];
  
  // Announcement Bar
  specialOffer?: string;
  
  // Video Grid Section
  videoGrid?: {
    heading?: string;
    subheading?: string;
  };
  
  // Image with Text Section
  imageWithText?: {
    header?: string;
    text?: string;
  };
  imageWithTextImage?: string;
  
  // Newsletter Section
  newsletterHeading?: string;
  newsletterText?: string;
  
  // Styles
  font_family_input?: string;
  primary_color_picker?: string;
  tertiary_color_picker?: string;
  primary_rgbcolor_picker?: string;
  tertiary_rgbcolor_picker?: string;
}

// Step indicator component with animations
function StepIndicator({ 
  currentStep, 
  steps 
}: { 
  currentStep: number; 
  steps: { id: number; icon: string; label: string }[] 
}) {
  return (
    <ul className="nav nav-pills-rounded align-items-center gap-2 justify-content-center mb-0 d-none d-lg-flex">
      {steps.map((step, index) => (
        <li key={step.id} className="d-flex align-items-center">
          {index > 0 && (
            <i 
              className="ri-arrow-right-s-line mx-2" 
              style={{ color: '#99a0ae', fontSize: '16px' }}
            ></i>
          )}
          <button
            type="button"
            className={`nav-link fw-500 d-flex align-items-center transition-all ${
              currentStep === step.id ? 'active' : ''
            } ${currentStep > step.id ? 'completed' : ''}`}
            disabled={currentStep < step.id}
            style={{
              opacity: currentStep < step.id ? 0.5 : 1,
              cursor: currentStep < step.id ? 'not-allowed' : 'pointer',
              padding: '8px 16px',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              backgroundColor: currentStep === step.id ? '#335cff' : currentStep > step.id ? '#e8f4ff' : 'transparent',
              color: currentStep === step.id ? '#fff' : currentStep > step.id ? '#335cff' : '#525866',
              border: 'none',
            }}
          >
            <i className={`${step.icon} me-2`} style={{ fontSize: '14px' }}></i>
            <span className="fs-small">{step.id}. {step.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// Mobile step header
function MobileStepHeader({ 
  currentStep, 
  steps,
  onBack,
  onNext,
  canGoBack,
  canGoNext,
  isLoading
}: { 
  currentStep: number;
  steps: { id: number; icon: string; label: string }[];
  onBack: () => void;
  onNext: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  isLoading: boolean;
}) {
  const currentStepData = steps.find(s => s.id === currentStep);
  
  return (
    <div className="mobile-step-header d-lg-none">
      <div className="d-flex align-items-center justify-content-between px-3 py-2">
        <div className="d-flex align-items-center gap-2">
          <button 
            type="button" 
            className="btn btn-sm btn-secondary"
            onClick={onBack}
            disabled={!canGoBack}
            style={{ minWidth: '40px' }}
          >
            <i className="ri-arrow-left-line"></i>
          </button>
          <div className="mobile-step-title">
            <span className="fw-500">{currentStepData?.label || ''}</span>
          </div>
        </div>
        <button 
          type="button" 
          className="btn btn-sm btn-primary"
          onClick={onNext}
          disabled={!canGoNext || isLoading}
        >
          {isLoading ? (
            <span className="spinner-border spinner-border-sm" role="status"></span>
          ) : currentStep === 4 ? (
            <>Publier <i className="ri-arrow-right-line ms-1"></i></>
          ) : (
            <>Suivant <i className="ri-arrow-right-line ms-1"></i></>
          )}
        </button>
      </div>
    </div>
  );
}

// Image selection component with animations
function ImageSelector({ 
  images, 
  selectedImages, 
  onSelect,
  disabled
}: { 
  images: string[]; 
  selectedImages: string[];
  onSelect: (images: string[]) => void;
  disabled?: boolean;
}) {
  const toggleImage = (img: string) => {
    if (disabled) return;
    if (selectedImages.includes(img)) {
      onSelect(selectedImages.filter(i => i !== img));
    } else {
      onSelect([...selectedImages, img]);
    }
  };

  return (
    <div className="image-grid-list row g-3">
      {images.map((img, idx) => (
        <div key={idx} className="col-6 col-md-4 col-lg-3">
          <div 
            className={`image-card position-relative ${selectedImages.includes(img) ? 'selected' : ''}`}
            onClick={() => toggleImage(img)}
            style={{ 
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <div 
              className="custom-image-radio"
              style={{
                border: selectedImages.includes(img) ? '2px solid #335cff' : '1px solid #e1e4ea',
                borderRadius: '12px',
                overflow: 'hidden',
                aspectRatio: '1',
                transition: 'all 0.2s ease',
                transform: selectedImages.includes(img) ? 'scale(1)' : 'scale(0.98)',
              }}
            >
              <img 
                src={img} 
                alt={`Product ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/img_not_found.png';
                }}
              />
              {selectedImages.includes(img) && (
                <div 
                  className="position-absolute"
                  style={{
                    top: '8px',
                    right: '8px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#335cff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'scaleIn 0.2s ease',
                  }}
                >
                  <i className="ri-check-line text-white" style={{ fontSize: '14px' }}></i>
                </div>
              )}
            </div>
            <div 
              className="position-absolute text-center"
              style={{ 
                bottom: '8px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(14,18,27,0.6)',
                backdropFilter: 'blur(4px)',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '11px',
                color: '#fff',
              }}
            >
              {idx + 1}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Calculate SVG circle progress
function calculateProgress(used: number, limit: number): { 
  dasharray: string; 
  dashoffset: number; 
  text: string;
  isLimitReached: boolean;
  color: string;
} {
  const circumference = 2 * Math.PI * 12;
  const progress = limit > 0 ? Math.min(used / limit, 1) : 0;
  const dashoffset = circumference * (1 - progress);
  const isLimitReached = limit > 0 && used >= limit;
  return {
    dasharray: `${circumference}`,
    dashoffset,
    text: `${used}/${limit}`,
    isLimitReached,
    color: isLimitReached ? '#ef4444' : '#0c6cfb',
  };
}

// AI Input Field with Regenerate Button
function AIInputField({
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  labelIcon,
  fieldName,
  onRegenerate,
  rows = 3,
  className = '',
}: {
  type?: 'text' | 'textarea' | 'number';
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  labelIcon?: string;
  fieldName: string;
  onRegenerate?: (fieldName: string, currentValue: string) => Promise<string>;
  rows?: number;
  className?: string;
}) {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    if (!onRegenerate || isRegenerating) return;
    setIsRegenerating(true);
    try {
      const newValue = await onRegenerate(fieldName, String(value));
      if (newValue) {
        onChange(newValue);
      }
    } catch (error) {
      console.error('Failed to regenerate field:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label className="form-label text-dark fw-500 mb-1 fs-small">
          {labelIcon && <i className={`${labelIcon} me-1 text-muted`}></i>}
          {label}
        </label>
      )}
      <div className="input-with-ai-btn">
        {type === 'textarea' ? (
          <textarea
            className="form-control form-control-w-side-button"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
          />
        ) : (
          <input
            type={type}
            className="form-control form-control-w-side-button"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        )}
        {onRegenerate && (
          <button
            type="button"
            className={`regenerate-field-btn ${isRegenerating ? 'loading' : ''}`}
            onClick={handleRegenerate}
            disabled={isRegenerating}
            title="Régénérer avec IA"
          >
            <i className="ri-sparkling-line fs-5 regenerate-loading-icon"></i>
          </button>
        )}
      </div>
    </div>
  );
}

// Loading Animation Component with particles and progress (matching Laravel design)
function GenerationLoader({
  isVisible,
  productUrl,
  progress,
  currentStage,
  previewData,
}: {
  isVisible: boolean;
  productUrl: string;
  progress: number;
  currentStage: number;
  previewData?: { title?: string; description?: string; image?: string; price?: string } | null;
}) {
  if (!isVisible) return null;

  return (
    <div className="generation-loader position-relative mx-auto" style={{ maxWidth: '600px', marginTop: '60px' }}>
      {/* Floating spark icon - centered above title */}
      <div className="d-flex justify-content-center mb-3">
        <div className="floating-spark-icon-centered">
          <span className="primary-gradient-color-2 sparkling-icon">
            <i className="ri-sparkling-2-fill"></i>
          </span>
        </div>
      </div>

      {/* Title - centered below icon */}
      <p 
        className="mb-3 fw-500 primary-gradient-tri-color text-center"
        style={{
          fontSize: '1.5rem',
          background: 'linear-gradient(90deg, #476CFF, #0C6CFB, #a897ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Génération de votre boutique....
      </p>

      {/* URL Input Display with favicon */}
      <div className="mb-3 w-100">
        <div className="position-relative">
          {/* Favicon prefix (left side) */}
          {productUrl && extractDomainFromUrl(productUrl) && (
            <div 
              className="position-absolute"
              style={{
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                pointerEvents: 'none'
              }}
            >
              <img 
                src={getFaviconUrl(productUrl)}
                alt=""
                style={{
                  width: '20px',
                  height: '20px',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <input 
            type="text" 
            className="form-control ai-shop-url-input has-favicon" 
            style={{ backgroundColor: '#f6f8fa', paddingLeft: productUrl && extractDomainFromUrl(productUrl) ? '44px' : '12px' }}
            disabled 
            value={productUrl.length > 60 ? productUrl.substring(0, 60) + '...' : productUrl}
          />
        </div>
      </div>

      {/* Loading Stage Indicator with percentage on same line */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="fw-500 text-primary fs-6">
          {LOADING_STAGES[currentStage - 1]?.text || 'Chargement...'}
        </span>
        <span className="fw-bold fs-6" style={{ color: '#525866' }}>
          {Math.round(progress)}%
        </span>
      </div>

      {/* Stage Dots */}
      <div className="d-flex justify-content-center gap-1 mb-3">
        {LOADING_STAGES.map((stage, index) => (
          <span 
            key={stage.id}
            className={`stage-dot ${currentStage >= stage.id ? 'active' : ''}`}
            title={stage.text}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: currentStage >= stage.id 
                ? 'linear-gradient(91.46deg, #0c6cfb 1.25%, #a897ff 99.5%)' 
                : '#e0e5f0',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="progress mb-3" style={{ height: '24px', borderRadius: '12px', overflow: 'hidden' }}>
        <div 
          className="progress-bar progress-bar-striped progress-bar-animated progress-bar-gradient"
          role="progressbar" 
          style={{ 
            width: `${progress}%`,
            backgroundImage: 'linear-gradient(135deg, hsla(0,0%,100%,.15) 25%, transparent 25%, transparent 50%, hsla(0,0%,100%,.15) 50%, hsla(0,0%,100%,.15) 75%, transparent 75%, transparent), linear-gradient(91.46deg, #0c6cfb 1.25%, #a897ff 99.5%)',
            backgroundSize: '24px 24px, 100% 100%',
            transition: 'width 0.3s ease',
          }}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        ></div>
      </div>

      {/* Skeleton Preview Card (like Laravel loading-placeholder) */}
      <div className="loading-placeholder p-3 d-flex gap-3">
        {/* Image skeleton - shows actual image if available */}
        <div 
          className="loading-placeholder-img flex-shrink-0"
          style={previewData?.image ? {
            backgroundImage: `url(${previewData.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : undefined}
        />
        
        {/* Text content */}
        <div className="w-100 d-flex flex-column justify-content-center">
          {/* Loading state (skeleton) */}
          {!previewData?.title ? (
            <div className="ai-generated-details-loading">
              <div className="loading-placeholder-text loading-placeholder-text-title mb-4" />
              <div className="loading-placeholder-text loading-placeholder-text-detail small-h w-50 mb-3" />
              <div className="loading-placeholder-text loading-placeholder-text-price small-h w-25" />
            </div>
          ) : (
            /* Actual product details (shown after API response) */
            <div 
              className="ai-generated-details"
              style={{ animation: 'fadeIn 0.5s ease-in-out' }}
            >
              <p className="fs-lg fw-600 mb-3" style={{ color: '#0E121B' }}>
                {previewData.title.length > 60 ? previewData.title.substring(0, 60) + '...' : previewData.title}
              </p>
              {previewData.description && (
                <p className="mb-2 text-sub fs-small" style={{ color: '#6B7280' }}>
                  {previewData.description.length > 100 ? previewData.description.substring(0, 100) + '...' : previewData.description}
                </p>
              )}
              {previewData.price && (
                <p className="text-soft fw-600 mb-0" style={{ color: '#335CFF' }}>
                  {previewData.price}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// Languages config
const LANGUAGES = [
  { code: 'en', name: 'Anglais', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Espagnol', flag: '🇪🇸' },
  { code: 'de', name: 'Allemand', flag: '🇩🇪' },
  { code: 'it', name: 'Italien', flag: '🇮🇹' },
  { code: 'pt', name: 'Portugais', flag: '🇵🇹' },
];

// Steps config
const STEPS = [
  { id: 1, icon: 'ri-link', label: 'Importer' },
  { id: 2, icon: 'ri-image-line', label: 'Sélectionner' },
  { id: 3, icon: 'ri-settings-4-line', label: 'Personnaliser' },
  { id: 4, icon: 'ri-upload-cloud-line', label: 'Publier' },
];

// Font families for Styles tab
const FONT_FAMILIES = [
  { name: 'Inter', class: 'font-inter', link: 'https://fonts.cdnfonts.com/css/inter' },
  { name: 'Roboto', class: 'font-roboto', link: 'https://fonts.cdnfonts.com/css/roboto' },
  { name: 'Space Grotesk', class: 'font-space-grotesk', link: 'https://fonts.cdnfonts.com/css/space-grotesk' },
  { name: 'DM Sans', class: 'font-dm-sans', link: 'https://fonts.cdnfonts.com/css/dm-sans' },
  { name: 'Montserrat', class: 'font-montserrat', link: 'https://fonts.cdnfonts.com/css/montserrat' },
  { name: 'Be Vietnam Pro', class: 'font-be-vietnam', link: 'https://fonts.cdnfonts.com/css/be-vietnam-pro' },
  { name: 'Karla', class: 'font-karla', link: 'https://fonts.cdnfonts.com/css/karla' },
  { name: 'Poppins', class: 'font-poppins', link: 'https://fonts.cdnfonts.com/css/poppins' },
];

// Color presets for Styles tab
const COLOR_PRESETS = [
  { primary: '#6f6254', tertiary: '#e6e1dc' },
  { primary: '#374732', tertiary: '#d9e3d4' },
  { primary: '#8c1c25', tertiary: '#f1dada' },
  { primary: '#e9572d', tertiary: '#fff6e8' },
  { primary: '#4E2500', tertiary: '#FFF0DD' },
  { primary: '#4e7a9b', tertiary: '#e0eef5' },
  { primary: '#9a4e34', tertiary: '#ebddd3' },
];

export default function AIShopPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Import
  const [productUrl, setProductUrl] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState(1);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previewDataLoadedRef = useRef<boolean>(false);
  
  // URL validation state
  const [urlValidation, setUrlValidation] = useState<UrlValidationResult>({
    status: 'idle',
    type: 'unknown',
    message: ''
  });
  const urlValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const urlTrimTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [displayUrl, setDisplayUrl] = useState(""); // URL displayed in input (may have extra chars)
  
  // Preview data for skeleton loader
  const [previewData, setPreviewData] = useState<{
    title?: string;
    description?: string;
    image?: string;
    price?: string;
  } | null>(null);
  
  // Step 2: Select images
  const [aiContent, setAiContent] = useState<AIContent | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [storeName, setStoreName] = useState("");
  
  // Step 3: Customize
  const [activeSection, setActiveSection] = useState<string | null>('productInfo');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('mobile');
  const [activeTab, setActiveTab] = useState<'content' | 'styles'>('content');
  const [pageView, setPageView] = useState<'product_page' | 'home_page'>('product_page');
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [previewKey, setPreviewKey] = useState<number>(Date.now());
  
  // Step 4: Publish
  const [isPushing, setIsPushing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  
  // Common state
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generationHistory, setGenerationHistory] = useState<GeneratedShop[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [generatedProductId, setGeneratedProductId] = useState<number | null>(null);
  const [showAllImages, setShowAllImages] = useState(false);

  // Use global stats context
  const { stats, loading, refreshStats } = useStats();
  const storeProgress = stats ? calculateProgress(stats.storeGeneration.used, stats.storeGeneration.limit) : null;

  // Load generation history
  const loadHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch('/api/ai/generate-store?perPage=50');
      if (response.ok) {
        const data = await response.json();
        setGenerationHistory(data.products || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.ai-shop-lang-dropdown') && !target.closest('.position-absolute.bg-white')) {
        setShowLangDropdown(false);
      }
    };
    if (showLangDropdown) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showLangDropdown]);

  // Refresh preview when content changes (debounced)
  useEffect(() => {
    if (generatedProductId && currentStep === 3) {
      const timer = setTimeout(() => {
        setPreviewKey(Date.now());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [aiContent, generatedProductId, currentStep]);

  // Check if user has credits
  const credits = stats?.storeGeneration.isUnlimited ? -1 : (stats?.storeGeneration.limit ?? 0) - (stats?.storeGeneration.used ?? 0);
  const hasCredits = stats?.storeGeneration.isUnlimited || credits > 0;

  // URL validation handler with debounce (like Laravel - doesn't modify input)
  const validateProductUrl = useCallback(async (url: string, skipTrimCheck: boolean = false) => {
    // Clear previous timeout
    if (urlValidationTimeoutRef.current) {
      clearTimeout(urlValidationTimeoutRef.current);
    }
    
    // Empty URL
    if (!url.trim()) {
      setUrlValidation({ status: 'idle', type: 'unknown', message: '' });
      return;
    }
    
    // Show validating state (loader icon)
    setUrlValidation({ status: 'validating', type: 'unknown', message: '' });
    
    // Debounce validation (like Laravel setTimeout 500ms)
    urlValidationTimeoutRef.current = setTimeout(async () => {
      // Clean URL for validation (trim after .html/.htm)
      const cleanedUrl = cleanProductUrl(url);
      const urlForValidation = beautifyUrlForValidation(cleanedUrl);
      const urlType = detectUrlType(urlForValidation);
      
      console.log('[URL Validation] Type detected:', urlType, 'URL:', urlForValidation);
      
      // Check if URL has extra characters after .html/.htm
      const hasExtraAfterHtml = (url.includes('.html') && url.indexOf('.html') + 5 < url.length) ||
                                (url.includes('.htm') && !url.includes('.html') && url.indexOf('.htm') + 4 < url.length);
      
      if (hasExtraAfterHtml && !skipTrimCheck) {
        // URL has extra characters after .html/.htm - don't show error, just validate the cleaned version
        // The trim will happen automatically after a delay or on blur
        const cleanedForCheck = cleanProductUrl(urlForValidation);
        const cleanedType = detectUrlType(beautifyUrlForValidation(cleanedForCheck));
        
        if (cleanedType === 'aliexpress' || cleanedType === 'amazon' || cleanedType === 'shopify') {
          // Valid URL structure, just needs trimming - show validating state
          setUrlValidation({ status: 'validating', type: cleanedType, message: '' });
          return;
        }
      }
      
      if (urlType === 'aliexpress') {
        // Validate AliExpress URL format - check if it has .html/.htm
        // Supports .com, .us, .ru, .fr and other regional domains
        const aliRegex = /aliexpress\.[a-z]{2,3}\/item\/(\d+)\.html?/i;
        if (aliRegex.test(urlForValidation)) {
          setUrlValidation({
            status: 'valid',
            type: 'aliexpress',
            message: 'URL de produit valide.'
          });
        } else {
          // Check if it's partially valid (missing .html ending)
          const partialRegex = /aliexpress\.[a-z]{2,3}\/item\/(\d+)/i;
          if (partialRegex.test(urlForValidation)) {
            setUrlValidation({
              status: 'invalid',
              type: 'aliexpress',
              message: 'L\'URL doit se terminer par .html'
            });
          } else {
            setUrlValidation({
              status: 'invalid',
              type: 'aliexpress',
              message: 'Format URL AliExpress invalide. Ex: aliexpress.com/item/123456.html'
            });
          }
        }
      } else if (urlType === 'amazon') {
        setUrlValidation({
          status: 'valid',
          type: 'amazon',
          message: 'URL de produit valide.'
        });
      } else if (urlType === 'shopify') {
        // Validate Shopify URL - must have /products/ path
        if (urlForValidation.includes('/products/')) {
          setUrlValidation({
            status: 'valid',
            type: 'shopify',
            message: 'URL de produit valide.'
          });
        } else {
          setUrlValidation({
            status: 'invalid',
            type: 'shopify',
            message: 'L\'URL doit contenir /products/'
          });
        }
      } else {
        // Check if it's just a domain without product path
        const isDomainOnly = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}(\/)?$/i.test(urlForValidation);
        
        if (isDomainOnly) {
          setUrlValidation({
            status: 'invalid',
            type: 'unknown',
            message: 'Veuillez entrer un lien de produit, pas juste un domaine'
          });
        } else {
          setUrlValidation({
            status: 'invalid',
            type: 'unknown',
            message: 'Veuillez saisir une URL de page de produit AliExpress, Amazon ou Shopify valide'
          });
        }
      }
    }, 500); // 500ms debounce like Laravel
  }, []);

  // Handle URL input change - show full URL, trim after delay
  const handleUrlChange = useCallback((value: string) => {
    // Clear any existing trim timeout
    if (urlTrimTimeoutRef.current) {
      clearTimeout(urlTrimTimeoutRef.current);
    }
    
    // Update display URL (shows what user types)
    setDisplayUrl(value);
    setProductUrl(value);
    
    // Validate the URL
    validateProductUrl(value);
    
    // Check if URL has extra characters after .html/.htm
    const hasExtraAfterHtml = (value.includes('.html') && value.indexOf('.html') + 5 < value.length) ||
                              (value.includes('.htm') && !value.includes('.html') && value.indexOf('.htm') + 4 < value.length);
    
    if (hasExtraAfterHtml) {
      // Auto-trim after 2.5 seconds (like Laravel - let user see full URL briefly)
      urlTrimTimeoutRef.current = setTimeout(() => {
        const cleanedUrl = cleanProductUrl(value);
        if (cleanedUrl !== value) {
          setDisplayUrl(cleanedUrl);
          setProductUrl(cleanedUrl);
          validateProductUrl(cleanedUrl, true); // Skip trim check since we just trimmed
        }
      }, 2500); // 2.5 seconds delay
    }
  }, [validateProductUrl]);

  // Handle URL paste - clean the URL immediately after paste
  const handleUrlPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    // Clear any existing trim timeout
    if (urlTrimTimeoutRef.current) {
      clearTimeout(urlTrimTimeoutRef.current);
    }
    
    // Show full URL first, then trim after delay
    setDisplayUrl(pastedText);
    setProductUrl(pastedText);
    validateProductUrl(pastedText);
    
    // Auto-trim after 2.5 seconds
    urlTrimTimeoutRef.current = setTimeout(() => {
      const cleanedUrl = cleanProductUrl(pastedText);
      if (cleanedUrl !== pastedText) {
        setDisplayUrl(cleanedUrl);
        setProductUrl(cleanedUrl);
        validateProductUrl(cleanedUrl, true);
      }
    }, 2500);
  }, [validateProductUrl]);

  // Handle URL blur - clean the URL immediately when user finishes typing
  const handleUrlBlur = useCallback(() => {
    // Clear any pending trim timeout
    if (urlTrimTimeoutRef.current) {
      clearTimeout(urlTrimTimeoutRef.current);
    }
    
    if (displayUrl || productUrl) {
      const currentUrl = displayUrl || productUrl;
      const cleanedUrl = cleanProductUrl(currentUrl);
      
      if (cleanedUrl !== currentUrl) {
        // Trim immediately on blur
        setDisplayUrl(cleanedUrl);
        setProductUrl(cleanedUrl);
        validateProductUrl(cleanedUrl, true);
      } else {
        // Just validate if no trimming needed
        validateProductUrl(cleanedUrl, true);
      }
    }
  }, [displayUrl, productUrl, validateProductUrl]);

  // Initialize displayUrl with productUrl
  useEffect(() => {
    if (!displayUrl && productUrl) {
      setDisplayUrl(productUrl);
    }
  }, [productUrl, displayUrl]);

  // Cleanup validation timeout on unmount
  useEffect(() => {
    return () => {
      if (urlValidationTimeoutRef.current) {
        clearTimeout(urlValidationTimeoutRef.current);
      }
      if (urlTrimTimeoutRef.current) {
        clearTimeout(urlTrimTimeoutRef.current);
      }
    };
  }, []);

  // Get language flag
  const getLanguageFlag = (lang: string) => {
    return LANGUAGES.find(l => l.code === lang)?.flag || '🌐';
  };

  // Get relative time in French (e.g., "il y a 1 heure", "il y a 12 minutes")
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 30) return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    if (diffMonths < 12) return `il y a ${diffMonths} mois`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Step 1: Generate AI content
  const handleGenerate = async () => {
    // Clean URL before generating (ensure we use the trimmed version)
    const currentUrl = displayUrl || productUrl;
    const cleanedUrl = cleanProductUrl(currentUrl);
    
    // Update both URLs to cleaned version
    if (cleanedUrl !== currentUrl) {
      setDisplayUrl(cleanedUrl);
      setProductUrl(cleanedUrl);
    }
    
    const finalUrl = cleanedUrl || productUrl;
    
    if (!finalUrl.trim()) {
      setError("Veuillez entrer l'URL d'un produit");
      return;
    }

    // Check URL validation status
    if (urlValidation.status !== 'valid') {
      setError(urlValidation.message || "Veuillez entrer une URL de produit valide");
      return;
    }

    const urlType = detectUrlType(finalUrl);
    console.log('[Generate] Starting generation for URL type:', urlType, 'URL:', finalUrl);

    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    setGenerationStage(1);
    setPreviewData(null);
    previewDataLoadedRef.current = false;

    // Function to quickly fetch product data and display it immediately
    const fetchProductPreviewData = async () => {
      try {
        // Call the preview API endpoint
        const previewResponse = await fetch('/api/ai/fetch-product-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productUrl: finalUrl }),
        });

        if (previewResponse.ok) {
          const previewData = await previewResponse.json();
          
          if (previewData.success && previewData.title) {
            const priceDisplay = previewData.price 
              ? `€ ${typeof previewData.price === 'number' ? previewData.price.toFixed(2) : previewData.price}` 
              : undefined;
            
            setPreviewData({
              title: previewData.title,
              description: previewData.description || '',
              image: previewData.image || null,
              price: priceDisplay,
            });
            
            // Mark as loaded and update to stage 2 since we have product data
            previewDataLoadedRef.current = true;
            setGenerationStage(2);
            setGenerationProgress(40);
          }
        }
      } catch (err) {
        console.log('[Preview] Could not fetch preview data:', err);
        // Don't fail the whole process if preview fetch fails
      }
    };

    // Fetch product preview data immediately (non-blocking)
    fetchProductPreviewData();

    // Start progress animation
    // Phase 1: 0-40% (scraping) over ~15 seconds
    // Phase 2: 40-70% (AI copywriting) over ~20 seconds  
    // Phase 3: 70-90% (store creation) over ~10 seconds
    // Phase 4: 90-99% (finalizing) until API responds
    
    let progress = 0;
    const startTime = Date.now();
    
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      // Dynamic stages based on elapsed time
      if (elapsed < 15000) {
        // Stage 1: Scraping (0-15s) -> 0-40%
        // Only set stage 1 if preview data hasn't been loaded yet
        if (!previewDataLoadedRef.current) {
          setGenerationStage(1);
        }
        progress = Math.min(40, (elapsed / 15000) * 40);
      } else if (elapsed < 35000) {
        // Stage 2: AI Copywriting (15-35s) -> 40-70%
        setGenerationStage(2);
        progress = 40 + Math.min(30, ((elapsed - 15000) / 20000) * 30);
      } else if (elapsed < 50000) {
        // Stage 3: Store Creation (35-50s) -> 70-90%
        setGenerationStage(3);
        progress = 70 + Math.min(20, ((elapsed - 35000) / 15000) * 20);
      } else {
        // Stage 4: Finalizing (50s+) -> 90-99%
        setGenerationStage(4);
        progress = Math.min(99, 90 + ((elapsed - 50000) / 30000) * 9);
      }
      
      setGenerationProgress(progress);
    }, 100);

    try {
      const response = await fetch('/api/ai/generate-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productUrl: finalUrl, 
          language: selectedLanguage 
        }),
      });

      const data = await response.json();

      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération');
      }

      // Update previewData with returned product data (like Laravel does)
      // This will override the quick preview with final AI-generated content
      const aiContentData = data.aiContent || data.product || {};
      const productDataResponse = data.productData || {};
      
      // Get the first image from aiContent, productData, or productResponse
      const firstImage = aiContentData.images?.[0] || 
                        productDataResponse.images?.[0] || 
                        data.product?.images?.[0];
      
      // Get price from aiContent or product data
      const price = aiContentData.price || data.product?.price;
      const priceDisplay = price ? `€ ${typeof price === 'number' ? price.toFixed(2) : price}` : undefined;
      
      // Use AI-generated description if available, otherwise use original
      const description = aiContentData.description || aiContentData.tagline || '';
      
      setPreviewData({
        title: aiContentData.title || data.product?.title || 'Product',
        description: description,
        image: firstImage,
        price: priceDisplay,
      });
      
      previewDataLoadedRef.current = true;

      // Complete progress
      setGenerationProgress(100);
      
      // Longer delay to show the completed skeleton with product data (like Laravel)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Refresh stats and history before redirect
      refreshStats();
      loadHistory();
      
      // Redirect to the proper editor page instead of showing duplicate steps 2/3
      router.push(`/dashboard/ai-shop/${data.productId}`);
      
    } catch (err) {
      // Clear progress interval on error
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setError(err instanceof Error ? err.message : "Erreur lors de la génération");
      setGenerationProgress(0);
      setGenerationStage(1);
    } finally {
      setIsGenerating(false);
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Step 4: Push to Shopify
  const handlePushToShopify = async () => {
    if (!generatedProductId) {
      setError("Aucun produit généré à publier");
      return;
    }

    setIsPushing(true);
    setPublishProgress(10);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setPublishProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('/api/ai/push-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId: generatedProductId,
          method: 'template',
          publish: false
        }),
      });

      clearInterval(progressInterval);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la publication');
      }

      setPublishProgress(100);
      setSuccessMessage("Boutique publiée avec succès sur Shopify !");
      
      // Reset and go back to step 1
      setTimeout(() => {
        setCurrentStep(1);
        setAiContent(null);
        setSelectedImages([]);
        setStoreName("");
        setProductUrl("");
        setGeneratedProductId(null);
        setPublishProgress(0);
        loadHistory();
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la publication");
      setPublishProgress(0);
    } finally {
      setIsPushing(false);
    }
  };

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
    if (name.includes('catchy') || name.includes('hero') || name.includes('main')) return 'headline';
    if (name.includes('guarantee') || name.includes('badge')) return 'benefit';
    if (name.includes('offer') || name.includes('announcement')) return 'headline';
    
    // Default to text
    return 'text';
  };

  // Regenerate individual field with AI
  const handleRegenerateField = async (fieldName: string, currentValue: string): Promise<string> => {
    try {
      // Infer field type from field name
      const fieldType = inferFieldType(fieldName);
      
      const response = await fetch('/api/ai/regenerate-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldName,
          currentValue,
          fieldType,
          productTitle: aiContent?.title || '',
          productDescription: aiContent?.description || '',
          language: selectedLanguage || 'fr', // Default to French
          seed: currentValue,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate');
      }

      return data.newValue || currentValue;
    } catch (error) {
      console.error('Regenerate field error:', error);
      return currentValue;
    }
  };

  // Navigation
  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 1: return !!aiContent;
      case 2: return selectedImages.length > 0;
      case 3: return true;
      case 4: return false;
      default: return false;
    }
  }, [currentStep, aiContent, selectedImages.length]);

  const handleNext = () => {
    if (currentStep === 4) {
      handlePushToShopify();
    } else if (canGoNext) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Section types for customization - matches Laravel/Rails sections
  const SECTION_TYPES = [
    { id: 'productInfo', icon: 'ri-price-tag-3-line', name: 'Infos produit', sectionType: 'featured-product' },
    { id: 'hero', icon: 'ri-layout-top-line', name: 'Section héro', sectionType: 'img-with-txt' },
    { id: 'benefits', icon: 'ri-thumb-up-line', name: 'Avantages', sectionType: 'pdp-benefits' },
    { id: 'testimonials', icon: 'ri-star-line', name: 'Avis clients', sectionType: 'product-reviews' },
    { id: 'timeline', icon: 'ri-time-line', name: 'Timeline', sectionType: 'timeline-points' },
    { id: 'clinical', icon: 'ri-donut-chart-fill', name: 'Statistiques', sectionType: 'pdp-statistics-column' },
    { id: 'comparison', icon: 'ri-table-line', name: 'Comparaison', sectionType: 'pdp-comparison-table' },
    { id: 'faq', icon: 'ri-question-answer-line', name: 'FAQ', sectionType: 'image-faq' },
    { id: 'styles', icon: 'ri-palette-line', name: 'Styles', sectionType: 'styles' },
  ];

  return (
    <>
      {/* Custom CSS for animations */}
      <style jsx global>{`
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes hoverUpDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes shimmer {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes sparkle {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(10deg) scale(1.1); }
          75% { transform: rotate(-10deg) scale(1.1); }
        }
        @keyframes progress-bar-stripes-new {
          0% { background-position: -24px 0, 0 0; }
          100% { background-position: 0 0, 0 0; }
        }
        
        .step-content-enter {
          animation: fadeIn 0.3s ease-out;
        }
        .image-card:hover .custom-image-radio {
          transform: scale(1) !important;
          border-color: #335cff !important;
        }
        .section-nav-item {
          transition: all 0.2s ease;
        }
        .section-nav-item:hover {
          background-color: rgba(153, 160, 174, 0.1);
        }
        .section-nav-item.active {
          background-color: rgba(51, 92, 255, 0.1);
          color: #335cff;
        }
        /* Hide drag handle and visibility button by default, show on hover */
        .section-nav-item .section-drag-handle {
          display: none;
        }
        .section-nav-item:hover .section-drag-handle {
          display: inline-block;
        }
        .section-nav-item .section-visibility-btn {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .section-nav-item:hover .section-visibility-btn {
          opacity: 1;
        }
        /* Custom font check input styling */
        .custom-font-check-input {
          transition: all 0.2s ease;
        }
        .custom-font-check-input:hover {
          border-color: #335cff !important;
        }
        /* Color preset button styling */
        .preset-color-btn:active,
        .preset-color-btn:focus {
          border-color: #0e121b !important;
        }
        /* Edit image AI button */
        .edit-image-ai-btn {
          opacity: 0;
          transition: all 0.2s ease;
        }
        .image-card:hover .edit-image-ai-btn {
          opacity: 1;
        }
        
        /* Regenerate Field Button */
        .regenerate-field-btn {
          background: transparent;
          border: none;
          color: #99a0ae;
          transition: all 0.2s ease;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }
        .regenerate-field-btn:hover {
          background: rgba(51, 92, 255, 0.1);
          color: #335cff;
        }
        .regenerate-field-btn:hover .regenerate-loading-icon {
          animation: sparkle 1s ease-in-out infinite;
        }
        .regenerate-field-btn.loading .regenerate-loading-icon {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        
        /* Form control with side button */
        .form-control-w-side-button {
          padding-right: 40px !important;
        }
        
        /* Input wrapper for AI regenerate */
        .input-with-ai-btn {
          position: relative;
        }
        .input-with-ai-btn .regenerate-field-btn {
          position: absolute;
          top: 50%;
          right: 8px;
          transform: translateY(-50%);
        }
        .input-with-ai-btn textarea + .regenerate-field-btn {
          top: 8px;
          transform: none;
        }
        
        /* Section header with delete button */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .section-header .delete-section-btn {
          color: #99a0ae;
          transition: color 0.2s ease;
        }
        .section-header .delete-section-btn:hover {
          color: #dc3545;
        }
        
        /* Horizontal divider */
        .horizontal-solid-divider {
          border-bottom: 1px solid #e5e7eb;
          margin: 1rem 0;
        }
        .mobile-step-header {
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        /* Generation Loader Styles */
        .generation-loader .floating-spark-icon-centered {
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: linear-gradient(135deg, #f0f4ff 0%, #e8f0ff 100%);
          box-shadow: 0 12px 27px 0 rgba(53,120,227,.15);
        }
        .generation-loader .floating-spark-icon-centered .sparkling-icon {
          font-size: 28px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(90deg, #476CFF, #0C6CFB);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: sparkle 2s ease-in-out infinite;
        }
        .generation-loader .progress-bar-striped {
          background-size: 24px 24px, 100% 100% !important;
          animation: progress-bar-stripes-new 1s linear infinite !important;
        }
        
        /* Stage Dots */
        .stage-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #dee2e6;
          transition: all 0.3s ease;
        }
        .stage-dot.active {
          background-color: #335cff;
          transform: scale(1.2);
        }
        .stage-dot.completed {
          background-color: #28a745;
        }
        
        /* Preview iframe */
        .preview-frame {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #fff;
          overflow: hidden;
        }
        .preview-frame iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        
        /* Preview Device Toggle - Match Laravel */
        .preview-device-toggle {
          display: none;
          background-color: #e4e4e7;
          border-radius: 8px;
          padding: 4px;
        }
        @media (min-width: 1300px) {
          .preview-device-toggle {
            display: flex;
          }
        }
        .preview-device-btn {
          background: transparent;
          border: none;
          padding: 2px 16px;
          font-size: 14px;
          color: #6b7280;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .preview-device-btn:hover {
          color: #374151;
        }
        .preview-device-btn.active {
          background-color: #fff;
          color: #111827;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        /* Preview Panel Container */
        #AIStorePreview {
          height: calc(100vh - 115px);
          width: inherit;
        }
        #AIStorePreview.preview-mobile .preview-ifram-wrapper {
          width: 500px;
          margin: 0 auto;
        }
        #AIStorePreview.preview-desktop .preview-ifram-wrapper {
          width: 100%;
        }
        .preview-ifram-wrapper {
          transition: width 0.3s ease;
        }
        .preview-ifram-wrapper iframe {
          border: none;
        }
        
        /* Content Editor Wrapper - Match Laravel */
        .content-editor-wrapper {
          position: relative;
          height: calc(100vh - 156px);
          display: flex;
          flex-direction: column;
          width: 400px;
        }
        .content-editor {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding-bottom: 100px;
        }
        .step-buttons-wrapper {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: #fff;
          padding: 16px;
          border-top: 1px solid #e4e4e7;
          z-index: 10;
        }
        
        /* Section Navigation Menu - Match Laravel */
        .content-menu-wrapper .content-menu-items-tab {
          width: 300px;
          border-right: 1px solid #e4e4e7;
          padding: 10px;
          flex-wrap: nowrap !important;
          flex-direction: column;
        }
        .content-menu-wrapper .content-menu-item-link {
          transition: all 0.3s;
          color: #525866;
          background-color: #fff;
          border: none;
          border-radius: 10px;
          padding: 8px 30px 8px 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .content-menu-wrapper .content-menu-item-link.active {
          background-color: rgba(153, 160, 174, 0.1);
          color: #335cff;
        }
        .content-menu-wrapper .content-menu-item-link.active .item-link-icon {
          color: #335cff;
        }
        .content-menu-wrapper .content-menu-item-link.active .item-link-right-arrow {
          opacity: 1;
        }
        .content-menu-wrapper .content-menu-item-link .item-link-icon {
          color: #99a0ae;
        }
        .content-menu-wrapper .content-menu-item-link .item-link-right-arrow {
          right: 8px;
          top: 12px;
          opacity: 0;
          color: #99a0ae;
        }
        
        /* Add New Section Button */
        .btn-add-new-section {
          padding: 8px;
        }
        .btn-add-new-section:hover {
          background-color: rgba(153, 160, 174, 0.1);
        }
        
        /* Sortable Section Navigation */
        .sortable-section-nav {
          display: flex;
          flex-direction: column;
        }
        .section-nav-item-ghost {
          opacity: 0.4;
          background: rgba(51, 92, 255, 0.1);
          border-radius: 8px;
        }
        .section-nav-item-drag {
          background: #fff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-radius: 8px;
        }
        
        /* Page Toggle Dropdown */
        .page-toggle {
          padding: 0.375rem 2.25rem 0.375rem 0.75rem;
          height: 34px;
        }
        
        /* Responsive adjustments */
        @media (min-width: 992px) and (max-width: 1400px) {
          #AIStorePreview {
            width: 350px !important;
          }
          .content-menu-items-tab {
            width: 240px !important;
          }
        }
        
        @media only screen and (max-width: 768px) {
          .generation-loader .floating-spark-icon-centered {
            width: 60px;
            height: 60px;
          }
          .generation-loader .floating-spark-icon-centered .sparkling-icon {
            font-size: 24px;
          }
          #AIStorePreview {
            width: 100% !important;
          }
        }
      `}</style>

      <DashboardHeader
        title="Créez votre boutique avec l'IA"
        subtitle="Créez une boutique Shopify optimisée en quelques secondes"
        icon="fa-brands fa-shopify"
        iconType="icon"
        showSearch={false}
        showStats={false}
      >
        {/* Step Navigation for Desktop */}
        {currentStep > 1 && (
          <StepIndicator currentStep={currentStep} steps={STEPS} />
        )}
        
        {/* Credits Display */}
        {currentStep === 1 && (
          loading ? (
            <div className="progress-circle d-flex gap-2 flex-column flex-md-row" style={{ opacity: 0.5 }}>
              <div className="progress-circle-wrapper">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
              <div className="progress-details">
                <div className="progress-text text-muted">...</div>
                <div className="progress-label">Chargement</div>
              </div>
            </div>
          ) : stats?.storeGeneration.isUnlimited ? (
            <div className="progress-circle-unli d-flex gap-2 flex-column flex-md-row">
              <div className="progress-circle-wrapper">
                <i className="ri-infinity-fill"></i>
              </div>
              <div className="progress-details">
                <div className="progress-text">∞</div>
                <div className="progress-label">Génération de boutique</div>
              </div>
            </div>
          ) : stats ? (
            <div 
              className="progress-circle d-flex gap-2 flex-column flex-md-row"
              data-progress={stats.storeGeneration.used}
              data-total={stats.storeGeneration.limit}
            >
              <div className="progress-circle-wrapper">
                <svg width="32px" height="32px">
                  <circle className="progress-background circle-2" cx="16" cy="16" r="12"></circle>
                  <circle 
                    className="progress-bar-circle circle-2" 
                    cx="16" cy="16" r="12" 
                    stroke={storeProgress?.color || '#0c6cfb'}
                    strokeDasharray={storeProgress?.dasharray}
                    strokeDashoffset={storeProgress?.dashoffset}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                  ></circle>
                </svg>
              </div>
              <div className="progress-details">
                <div className="progress-text" style={{ color: storeProgress?.isLimitReached ? '#ef4444' : undefined }}>{storeProgress?.text}</div>
                <div className="progress-label">Génération de boutique</div>
              </div>
            </div>
          ) : null
        )}
      </DashboardHeader>

      {/* Mobile Step Header */}
      {currentStep > 1 && (
        <MobileStepHeader
          currentStep={currentStep}
          steps={STEPS}
          onBack={handleBack}
          onNext={handleNext}
          canGoBack={currentStep > 1}
          canGoNext={canGoNext || currentStep === 4}
          isLoading={isGenerating || isPushing}
        />
      )}

      <div className="bg-white home-content-wrapper">
        <div className="container-fluid px-2 px-md-4 py-4">
          
          {/* Error Message */}
          {error && (
            <div className="alert alert-danger mx-auto mb-4 d-flex justify-content-between align-items-center" style={{ maxWidth: '900px' }}>
              <span><i className="ri-error-warning-line me-2"></i>{error}</span>
              <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="alert alert-success mx-auto mb-4 d-flex justify-content-between align-items-center" style={{ maxWidth: '900px' }}>
              <span><i className="ri-check-line me-2"></i>{successMessage}</span>
              <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)}></button>
            </div>
          )}

          {/* ==================== STEP 1: IMPORT ==================== */}
          {currentStep === 1 && (
            <div className="step-content-enter">
              {/* Show loading animation when generating */}
              {isGenerating ? (
                <GenerationLoader
                  isVisible={isGenerating}
                  productUrl={productUrl}
                  progress={generationProgress}
                  currentStage={generationStage}
                  previewData={previewData}
                />
              ) : (
                <>
                  {/* Hero Section */}
                  <div className="text-center mx-auto" style={{ maxWidth: '900px', marginTop: '40px', marginBottom: '50px' }}>
                    <h2 className="fw-400 mb-3" style={{ fontSize: 'clamp(20px, 5vw, 26px)', color: '#0E121B' }}>
                      Créez votre boutique en quelques secondes avec{' '}
                      <span style={{
                        background: 'linear-gradient(90deg, #476CFF 0%, #0C6CFB 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontWeight: 600
                      }}>CopyfyAI</span>
                      <sup>
                        <span className="badge bg-success-new ms-2 align-middle" style={{ fontSize: '10px', fontWeight: 500, verticalAlign: 'super' }}>
                          NEW
                        </span>
                      </sup>
                    </h2>
                    <p className="text-sub mb-0" style={{ fontSize: '15px', lineHeight: '1.6', color: '#6B7280' }}>
                      Transformez un lien de produit en boutique qui convertie. Collez votre lien{' '}
                      <span className="export-aliexpress-gradient">AliExpress</span>,{' '}
                      <span className="export-shopify-gradient">Shopify</span> ou{' '}
                      <span style={{ background: 'linear-gradient(90deg, #FF9900, #FF6600)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Amazon</span> ci-dessous, générez et personnalisez.
                    </p>
                  </div>

                  {/* Input Section */}
                  <div className="ai-shop-input-wrapper mx-auto">
                    <div className="ai-shop-input-section">
                      <div className="position-relative" style={{ flexGrow: 1, width: '400px', maxWidth: '100%' }}>
                        {/* Favicon prefix (left side) */}
                        {displayUrl && extractDomainFromUrl(displayUrl) && (
                          <div 
                            className="position-absolute"
                            style={{
                              left: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 10,
                              pointerEvents: 'none' // Don't block clicks
                            }}
                          >
                            <img 
                              src={getFaviconUrl(displayUrl)}
                              alt=""
                              style={{
                                width: '20px',
                                height: '20px',
                                objectFit: 'contain'
                              }}
                              onError={(e) => {
                                // Hide favicon on error
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <Input
                          type="text"
                          className={`ai-shop-url-input form-control design-2 ${displayUrl && extractDomainFromUrl(displayUrl) ? 'has-favicon' : ''} ${urlValidation.status === 'valid' ? 'validation-valid' : ''} ${urlValidation.status === 'invalid' ? 'validation-invalid' : ''} ${urlValidation.status === 'validating' ? 'validation-validating' : ''}`}
                          placeholder="https://www.aliexpress.com/item/10050082978909342.html"
                          value={displayUrl}
                          onChange={(e) => handleUrlChange(e.target.value)}
                          onBlur={handleUrlBlur}
                          onPaste={handleUrlPaste}
                          disabled={isGenerating || !hasCredits}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isGenerating && hasCredits && urlValidation.status === 'valid') {
                              handleGenerate();
                            }
                          }}
                          style={{
                            transition: 'border-color 0.2s ease, color 0.2s ease'
                          }}
                        />
                        {/* Validation loader - right side icon */}
                        {urlValidation.status === 'validating' && (
                          <span 
                            className="position-absolute" 
                            style={{ 
                              right: '12px', 
                              top: '50%', 
                              transform: 'translateY(-50%)',
                              color: '#335cff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <i className="ri-loader-4-line spin-animation" style={{ fontSize: '18px' }}></i>
                          </span>
                        )}
                        {/* Success checkmark */}
                        {urlValidation.status === 'valid' && (
                          <span 
                            className="position-absolute" 
                            style={{ 
                              right: '12px', 
                              top: '50%', 
                              transform: 'translateY(-50%)',
                              color: '#10b981',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <i className="ri-checkbox-circle-fill" style={{ fontSize: '18px' }}></i>
                          </span>
                        )}
                      </div>

                      {/* Custom Language Dropdown with Flag Images */}
                      <div className="position-relative" style={{ width: 'auto' }}>
                        <div 
                          className="ai-shop-lang-dropdown form-select design-2 d-flex align-items-center gap-2"
                          onClick={() => !isGenerating && setShowLangDropdown(!showLangDropdown)}
                          style={{
                            borderColor: '#e1e4ea',
                            borderWidth: '1px',
                            height: '48px',
                            minWidth: '150px',
                            cursor: isGenerating ? 'not-allowed' : 'pointer',
                            opacity: isGenerating ? 0.6 : 1
                          }}
                        >
                          <img 
                            src={`/flags/${selectedLanguage === 'en' ? 'gb' : selectedLanguage}.svg`}
                            alt=""
                            style={{ 
                              width: '22px', 
                              height: '16px', 
                              objectFit: 'cover', 
                              borderRadius: '2px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}
                          />
                          <span style={{ fontSize: '14px' }}>{LANGUAGES.find(l => l.code === selectedLanguage)?.name}</span>
                        </div>
                        
                        {/* Dropdown Menu */}
                        {showLangDropdown && (
                          <div 
                            className="position-absolute bg-white shadow-sm"
                            style={{
                              top: '100%',
                              left: 0,
                              right: 0,
                              marginTop: '4px',
                              borderRadius: '8px',
                              border: '1px solid #e1e4ea',
                              zIndex: 1000,
                              overflow: 'hidden'
                            }}
                          >
                            {LANGUAGES.map(lang => (
                              <div
                                key={lang.code}
                                className="d-flex align-items-center gap-2 px-3 py-2"
                                onClick={() => {
                                  setSelectedLanguage(lang.code);
                                  setShowLangDropdown(false);
                                }}
                                style={{
                                  cursor: 'pointer',
                                  backgroundColor: selectedLanguage === lang.code ? '#f0f7ff' : 'transparent',
                                  transition: 'background-color 0.15s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f7fa'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedLanguage === lang.code ? '#f0f7ff' : 'transparent'}
                              >
                                <img 
                                  src={`/flags/${lang.code === 'en' ? 'gb' : lang.code}.svg`}
                                  alt=""
                                  style={{ 
                                    width: '22px', 
                                    height: '16px', 
                                    objectFit: 'cover', 
                                    borderRadius: '2px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                  }}
                                />
                                <span style={{ fontSize: '14px' }}>{lang.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={handleGenerate}
                        className="ai-shop-generate-btn btn apply-filters-btn"
                        disabled={isGenerating || urlValidation.status !== 'valid' || !hasCredits}
                        style={{
                          backgroundColor: '#0C6CFB',
                          borderColor: '#0C6CFB',
                          color: '#fff',
                          fontWeight: 500,
                          height: '48px',
                          padding: '0 20px',
                          borderRadius: '8px',
                          border: 'none',
                          transition: 'all 0.3s ease-in',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.backgroundColor = '#0a5ae0';
                            e.currentTarget.style.borderColor = '#0a5ae0';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.backgroundColor = '#0C6CFB';
                            e.currentTarget.style.borderColor = '#0C6CFB';
                          }
                        }}
                      >
                        {isGenerating ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>
                            Génération...
                          </>
                        ) : (
                          <>
                            <i className="ri-sparkling-line" style={{ fontSize: '16px' }}></i>
                            Générer
                          </>
                        )}
                      </Button>
                    </div>

                    {/* URL Validation Message - close to input, no margin-top */}
                    {urlValidation.status === 'valid' && (
                      <div className="url-validation-message success d-flex align-items-center gap-2" style={{ marginTop: '4px', marginBottom: 0 }}>
                        <i className="ri-checkbox-circle-fill" style={{ color: '#10b981', fontSize: '14px' }}></i>
                        <span style={{ color: '#10b981', fontSize: '13px', fontWeight: 400 }}>{urlValidation.message}</span>
                      </div>
                    )}
                    {urlValidation.status === 'invalid' && (
                      <div className="url-validation-message error d-flex align-items-center gap-2" style={{ marginTop: '4px', marginBottom: 0 }}>
                        <i className="ri-error-warning-fill" style={{ color: '#ef4444', fontSize: '14px' }}></i>
                        <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: 400 }}>{urlValidation.message}</span>
                      </div>
                    )}

                    {/* Shopify Setup Notice */}
                    {!session?.user?.shopifyDomain && (
                      <div className="alert alert-info mt-3 mx-auto" style={{ maxWidth: '600px' }}>
                        <i className="ri-information-line me-2"></i>
                        <a href="/dashboard/settings" className="alert-link">Connectez votre boutique Shopify</a>
                        {' '}dans les paramètres pour utiliser cette fonctionnalité.
                      </div>
                    )}

                    {!hasCredits && !loading && (
                      <div className="alert alert-warning mt-3 mx-auto" style={{ maxWidth: '600px' }}>
                        <i className="ri-coins-line me-2"></i>
                        Vous avez atteint votre limite de génération.{' '}
                        <a href="/dashboard/settings" className="alert-link">Passez au plan supérieur</a>
                        {' '}pour plus de crédits.
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* History Section - hidden when generating */}
              {!isGenerating && (
              <div className="table-view mx-auto mt-5" style={{ maxWidth: '1200px' }}>
                <h3 className="fs-normal fw-600 mb-4">Historique</h3>

                <div className="table-wrapper" style={{ overflowX: 'auto', paddingBottom: '50px' }}>
                  <Table className="table mb-0" style={{ minWidth: '700px', border: '1px solid #dee2e6', borderRadius: '8px', borderCollapse: 'separate', borderSpacing: 0, overflow: 'hidden' }}>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: 'rgba(245, 247, 250, 1)' }}>
                        <TableHead className="fw-500 py-3 px-3 border-bottom" style={{ color: '#525866', fontSize: '13px', fontWeight: 500, backgroundColor: 'rgba(245, 247, 250, 1)' }}>Les produits</TableHead>
                        <TableHead className="fw-500 py-3 px-3 text-center border-bottom" style={{ color: '#525866', fontSize: '13px', fontWeight: 500, backgroundColor: 'rgba(245, 247, 250, 1)' }}>Langue du site</TableHead>
                        <TableHead className="fw-500 py-3 px-3 text-center border-bottom" style={{ color: '#525866', fontSize: '13px', fontWeight: 500, backgroundColor: 'rgba(245, 247, 250, 1)' }}>Type</TableHead>
                        <TableHead className="fw-500 py-3 px-3 border-bottom" style={{ color: '#525866', fontSize: '13px', fontWeight: 500, backgroundColor: 'rgba(245, 247, 250, 1)' }}>Dernière mise à jour</TableHead>
                        <TableHead className="fw-500 py-3 px-3 text-end border-bottom" style={{ color: '#525866', fontSize: '13px', fontWeight: 500, backgroundColor: 'rgba(245, 247, 250, 1)' }}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingHistory ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Chargement...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : generationHistory.length > 0 ? (
                        generationHistory.map((item) => (
                          <TableRow key={item.id} className="table-row-hover" style={{ borderBottom: '1px solid #e9ecef' }}>
                            <TableCell className="align-middle py-3 px-3">
                              <div className="d-flex align-items-center gap-3">
                                <div className="position-relative">
                                  <img 
                                    src={item.image} 
                                    alt={item.title} 
                                    className="rounded" 
                                    style={{ width: '56px', height: '56px', objectFit: 'cover', border: '1px solid #e9ecef' }} 
                                    onError={(e) => { (e.target as HTMLImageElement).src = '/img_not_found.png'; }} 
                                  />
                                </div>
                                <div>
                                  <p className="mb-1 fw-500" style={{ fontSize: '14px', color: '#212529' }}>{item.title}</p>
                                  <a 
                                    href={item.productUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-decoration-none d-flex align-items-center gap-2" 
                                    style={{ fontSize: '12px', color: '#6c757d' }}
                                  >
                                    {/* Favicon */}
                                    {extractDomainFromUrl(item.productUrl) && (
                                      <img 
                                        src={getFaviconUrl(item.productUrl)}
                                        alt=""
                                        style={{
                                          width: '14px',
                                          height: '14px',
                                          objectFit: 'contain',
                                          flexShrink: 0
                                        }}
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <span>
                                      {item.productUrl.length > 30 ? item.productUrl.substring(0, 30) + '...' : item.productUrl}
                                    </span>
                                  </a>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="align-middle py-3 px-3 text-center">
                              {/* Real flag image */}
                              <img 
                                src={`/flags/${item.language === 'en' ? 'gb' : item.language}.svg`}
                                alt={getLanguageFlag(item.language)}
                                style={{ width: '28px', height: '20px', objectFit: 'cover', borderRadius: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}
                                onError={(e) => {
                                  // Fallback to emoji if flag not found
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  const span = document.createElement('span');
                                  span.textContent = getLanguageFlag(item.language);
                                  span.style.fontSize = '20px';
                                  (e.target as HTMLImageElement).parentElement?.appendChild(span);
                                }}
                              />
                            </TableCell>
                            <TableCell className="align-middle py-3 px-3 text-center">
                              <span 
                                className="badge px-3 py-2" 
                                style={{ 
                                  backgroundColor: '#0d6efd', 
                                  color: '#fff', 
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  fontWeight: 500
                                }}
                              >
                                Boutique
                              </span>
                            </TableCell>
                            <TableCell className="align-middle py-3 px-3" style={{ color: '#6c757d', fontSize: '13px' }}>
                              {getRelativeTime(item.createdAt)}
                            </TableCell>
                            <TableCell className="align-middle py-3 px-3 text-end">
                              <a 
                                href={`/dashboard/ai-shop/${item.id}`} 
                                className="btn btn-secondary text-decoration-none d-inline-flex align-items-center gap-2"
                                style={{ 
                                  border: '1px solid #e2e5eb',
                                  borderRadius: '8px',
                                  fontSize: '15px',
                                  fontWeight: "medium",
                                  color: 'black',
                                  backgroundColor: '#FFFFFF',
                                  boxShadow: '0px 2px 2px 0px rgba(164, 172, 185, 0.2)',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.boxShadow = '0px 2px 4px 0px rgba(164, 172, 185, 0.6)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.boxShadow = '0px 2px 2px 0px rgba(164, 172, 185, 0.2)';
                                }}
                              >
                                <i className="ri-pencil-line me-1" style={{ fontSize: '14px', color: '#a4acb9' }}></i>
                                Configurer
                              </a>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-5">
                            <div className="d-flex flex-column align-items-center gap-3">
                              <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '56px', height: '56px', backgroundColor: '#EFF6FF' }}>
                                <i className="ri-store-2-line" style={{ fontSize: '28px', color: '#0d6efd' }}></i>
                              </div>
                              <div>
                                <h4 className="fw-600 fs-normal mb-1">Aucune boutique générée</h4>
                                <p className="text-sub fs-small mb-0">Entrez un lien de produit AliExpress, Shopify ou Amazon pour créer votre première boutique.</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              )}
            </div>
          )}

          {/* ==================== STEP 2: SELECT IMAGES ==================== */}
          {currentStep === 2 && aiContent && (
            <div className="step-content-enter mx-auto" style={{ maxWidth: '900px' }}>
              {/* Store Name - Centered */}
              <div className="text-center mb-4">
                <label className="form-label fw-500 fs-small text-muted mb-2">
                  Nom de votre boutique (peut être modifié à tout moment)
                </label>
                <Input
                  type="text"
                  className="form-control text-center fw-600"
                  style={{ maxWidth: '300px', margin: '0 auto', fontSize: '1.2rem' }}
                  value={storeName || 'YOUR BRAND'}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="YOUR BRAND"
                />
              </div>

              {/* Generate AI Image Button */}
              <div className="text-center mb-4 p-4 border rounded" style={{ backgroundColor: '#fafafa' }}>
                <button className="btn btn-outline-secondary">
                  <i className="ri-magic-line me-2"></i>
                  Générer une image avec l&apos;IA
                </button>
              </div>

              {/* Image Selection */}
              <div className="mb-4">
                <p className="fw-500 fs-small text-dark mb-2">Sélectionnez les images du produit que vous souhaitez ajouter</p>
                <p className="text-muted fs-xs mb-3">
                  <i className="ri-information-line me-1"></i>
                  Conseil: Vous pouvez réorganiser les images en les faisant glisser dans l&apos;ordre de votre choix.
                </p>
                
                {/* Images Grid with "Modifier avec IA" buttons */}
                {(() => {
                  const allImages = aiContent.images || [];
                  const INITIAL_IMAGES_COUNT = 10;
                  const displayedImages = showAllImages ? allImages : allImages.slice(0, INITIAL_IMAGES_COUNT);
                  const hiddenImagesCount = allImages.length - INITIAL_IMAGES_COUNT;
                  
                  return (
                    <>
                      <div className="row g-3" data-image-grid>
                        {displayedImages.map((image, idx) => (
                          <div key={idx} className="col-6 col-md-4 col-lg-3 image-card">
                            <label className="radio-container d-block position-relative" style={{ cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                className="d-none"
                                checked={selectedImages.includes(image)}
                                onChange={() => {
                                  if (selectedImages.includes(image)) {
                                    setSelectedImages(selectedImages.filter(i => i !== image));
                                  } else {
                                    setSelectedImages([...selectedImages, image]);
                                  }
                                }}
                              />
                              <div 
                                className={`custom-image-radio rounded overflow-hidden border ${selectedImages.includes(image) ? 'border-primary border-2' : ''}`}
                                style={{ aspectRatio: '1' }}
                              >
                                <img 
                                  src={image} 
                                  alt={`Product ${idx + 1}`}
                                  className="w-100 h-100"
                                  style={{ objectFit: 'cover' }}
                                />
                                {/* Checkmark */}
                                {selectedImages.includes(image) && (
                                  <div 
                                    className="position-absolute d-flex align-items-center justify-content-center rounded-circle bg-primary"
                                    style={{ top: '8px', right: '8px', width: '24px', height: '24px' }}
                                  >
                                    <i className="ri-check-line text-white fs-small"></i>
                                  </div>
                                )}
                                {/* Edit with AI button */}
                                <button
                                  type="button"
                                  className="edit-image-ai-btn position-absolute"
                                  style={{ 
                                    bottom: '8px', 
                                    right: '8px',
                                    background: 'rgba(14, 18, 27, 0.24)',
                                    backdropFilter: 'blur(4px)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '4px 12px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // TODO: Implement AI image editing
                                    console.log('Edit image with AI:', image);
                                  }}
                                >
                                  <i className="ri-magic-line me-1"></i>
                                  Modifier avec IA
                                </button>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                      
                      {/* See more/less images button */}
                      {allImages.length > INITIAL_IMAGES_COUNT && (
                        <div className="text-center mt-3">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm px-4 py-2"
                            style={{
                              borderRadius: '20px',
                              fontSize: '14px',
                              fontWeight: 500,
                            }}
                            onClick={() => setShowAllImages(!showAllImages)}
                          >
                            <i className={`ri-arrow-${showAllImages ? 'up' : 'down'}-line me-2`}></i>
                            {showAllImages 
                              ? 'Voir moins d\'images' 
                              : `Voir plus d'images (${hiddenImagesCount})`
                            }
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Navigation Buttons */}
              <div className="d-none d-lg-flex justify-content-between align-items-center pt-4 border-top">
                <Button variant="outline" onClick={handleBack}>
                  Retour
                </Button>
                <Button onClick={handleNext} disabled={selectedImages.length === 0}>
                  Suivant
                </Button>
              </div>
            </div>
          )}

          {/* ==================== STEP 3: CUSTOMIZE ==================== */}
          {currentStep === 3 && aiContent && (
            <div className="step-content-enter customize-ai-store">
              <div className="d-flex content-menu-wrapper" style={{ height: 'calc(100vh - 115px)' }}>
                {/* Left Sidebar: Section Navigation Only */}
                <div className="d-none d-lg-flex flex-column content-menu-items-tab flex-shrink-0" style={{ width: '280px', borderRight: '1px solid #e5e7eb', height: '100%', overflowY: 'auto' }}>
                  <div className="p-3">
                    {/* Add New Section Button */}
                    <button 
                      className="btn btn-link btn-add-new-section text-decoration-none text-start w-100 p-2 mb-2 rounded"
                      style={{ background: 'transparent' }}
                      onClick={() => setShowAddSectionModal(true)}
                    >
                      <i className="ri-add-circle-line me-2 fs-lg text-muted"></i>
                      <span className="fw-500 text-dark">Add new section</span>
                    </button>

                    {/* Section Navigation - Sortable */}
                    <div id="sortableSectionNav" className="sortable-section-nav d-flex flex-column gap-1">
                      {SECTION_TYPES.map(section => (
                        <div 
                          key={section.id} 
                          className={`section-nav-item d-flex align-items-center gap-2 rounded position-relative`}
                          data-section-id={section.id}
                          data-section-type={section.id}
                        >
                          {/* Drag Handle */}
                          <i className="ri-draggable section-drag-handle text-muted" style={{ fontSize: '16px', cursor: 'grab', padding: '8px 4px' }}></i>
                          
                          <button
                            type="button"
                            className={`content-menu-item-link d-flex align-items-center gap-2 flex-grow-1 text-start border-0 bg-transparent py-2 px-1 rounded ${activeSection === section.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(section.id)}
                          >
                            <i className={`${section.icon} item-link-icon ${activeSection === section.id ? 'text-primary' : 'text-muted'}`} style={{ fontSize: '16px' }}></i>
                            <span className={`fs-small fw-500 ${activeSection === section.id ? 'text-primary' : ''}`}>{section.name}</span>
                            <i className="ri-arrow-right-s-line item-link-right-arrow ms-auto text-muted" style={{ opacity: activeSection === section.id ? 1 : 0 }}></i>
                          </button>

                          {/* Visibility Toggle */}
                          <button 
                            className="btn btn-sm section-visibility-btn p-1"
                            title="Toggle visibility"
                          >
                            <i className="ri-eye-line text-muted"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Middle: Content/Styles Wrapper with Editor */}
                <div className="content-editor-wrapper d-flex flex-column" style={{ width: '400px', height: '100%', borderRight: '1px solid #e5e7eb' }}>
                  {/* Content/Styles Tab Headers */}
                  <ul className="nav nav-tabs nav-pills custom-nav-line px-3 gap-4 border-bottom flex-shrink-0" role="tablist">
                    <li className="nav-item" role="presentation">
                      <button 
                        className={`nav-link px-0 pb-3 pt-2 border-0 bg-transparent fw-500 fs-small ${activeTab === 'content' ? 'active text-primary' : 'text-dark'}`}
                        onClick={() => setActiveTab('content')}
                        style={{ borderBottom: activeTab === 'content' ? '2px solid #335cff' : 'none' }}
                      >
                        Content
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button 
                        className={`nav-link px-0 pb-3 pt-2 border-0 bg-transparent fw-500 fs-small ${activeTab === 'styles' ? 'active text-primary' : 'text-dark'}`}
                        onClick={() => setActiveTab('styles')}
                        style={{ borderBottom: activeTab === 'styles' ? '2px solid #335cff' : 'none' }}
                      >
                        Styles
                      </button>
                    </li>
                  </ul>

                  {/* Content Editor Area - Scrollable */}
                  <div className="content-editor flex-grow-1 p-4" style={{ overflowY: 'auto' }}>
                    {/* Content Tab - Section Editor */}
                    {activeTab === 'content' && (
                      <div className="tab-content">
                        {/* Section Header */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="mb-0 fs-lg fw-600">
                            {SECTION_TYPES.find(s => s.id === activeSection)?.name || 'Section'}
                          </h5>
                          <button className="btn btn-link text-muted text-decoration-none p-0" type="button">
                            <i className="ri-delete-bin-6-line fs-5"></i>
                          </button>
                        </div>

                        {activeSection === 'productInfo' && (
                          <div className="section-content">
                            <AIInputField
                              label="En-tête de section"
                              value={aiContent.header || ''}
                              onChange={(val) => setAiContent({ ...aiContent, header: val })}
                              placeholder="Découvrez notre produit"
                              fieldName="header"
                              onRegenerate={handleRegenerateField}
                            />
                            
                            <AIInputField
                              label="Sous-titre"
                              value={aiContent.subheading || ''}
                              onChange={(val) => setAiContent({ ...aiContent, subheading: val })}
                              placeholder="Une solution innovante"
                              fieldName="subheading"
                              onRegenerate={handleRegenerateField}
                            />

                            <AIInputField
                              label="Titre du produit"
                              value={aiContent.title || ''}
                              onChange={(val) => setAiContent({ ...aiContent, title: val })}
                              fieldName="title"
                              onRegenerate={handleRegenerateField}
                            />

                            {/* Prices - no AI regenerate */}
                            <div className="row mb-3">
                              <div className="col-6">
                                <label className="form-label text-dark fw-500 mb-1 fs-small">Prix</label>
                                <Input
                                  type="text"
                                  value={aiContent.price || ''}
                                  onChange={(e) => setAiContent({ ...aiContent, price: e.target.value })}
                                  className="form-control"
                                />
                              </div>
                              <div className="col-6">
                                <label className="form-label text-dark fw-500 mb-1 fs-small">Prix barré</label>
                                <Input
                                  type="text"
                                  value={aiContent.compareAtPrice || ''}
                                  onChange={(e) => setAiContent({ ...aiContent, compareAtPrice: e.target.value })}
                                  className="form-control"
                                  placeholder="99.99"
                                />
                              </div>
                            </div>

                            <AIInputField
                              type="textarea"
                              label="Description"
                              value={aiContent.description || ''}
                              onChange={(val) => setAiContent({ ...aiContent, description: val })}
                              placeholder="Décrivez votre produit..."
                              fieldName="description"
                              onRegenerate={handleRegenerateField}
                            />
                          </div>
                        )}

                        {activeSection === 'hero' && (
                          <div className="section-content">
                            <AIInputField
                              label="Texte accrocheur principal"
                              value={aiContent.mainCatchyText || ''}
                              onChange={(val) => setAiContent({ ...aiContent, mainCatchyText: val })}
                              placeholder="Votre titre principal"
                              fieldName="mainCatchyText"
                              onRegenerate={handleRegenerateField}
                            />
                            <AIInputField
                              label="Sous-texte"
                              value={aiContent.subMainCatchyText || ''}
                              onChange={(val) => setAiContent({ ...aiContent, subMainCatchyText: val })}
                              placeholder="Votre sous-titre"
                              fieldName="subMainCatchyText"
                              onRegenerate={handleRegenerateField}
                            />
                          </div>
                        )}

                        {activeSection === 'benefits' && (
                          <div className="section-content">
                            <AIInputField
                              label="Titre des bénéfices"
                              value={aiContent.benefitsHeading || ''}
                              onChange={(val) => setAiContent({ ...aiContent, benefitsHeading: val })}
                              placeholder="Pourquoi nous choisir"
                              fieldName="benefitsHeading"
                              onRegenerate={handleRegenerateField}
                            />
                            {(aiContent.benefits || []).map((benefit: string, idx: number) => (
                              <AIInputField
                                key={idx}
                                label={`Bénéfice ${idx + 1}`}
                                value={benefit}
                                onChange={(val) => {
                                  const newBenefits = [...(aiContent.benefits || [])];
                                  newBenefits[idx] = val;
                                  setAiContent({ ...aiContent, benefits: newBenefits });
                                }}
                                fieldName={`benefits[${idx}]`}
                                onRegenerate={handleRegenerateField}
                              />
                            ))}
                          </div>
                        )}

                        {activeSection === 'testimonials' && (
                          <div className="section-content">
                            {(aiContent.testimonials || []).slice(0, 4).map((testimonial: { header?: string; name?: string; review?: string }, idx: number) => (
                              <div key={idx} className="mb-4 pb-3 border-bottom">
                                <p className="fw-500 fs-small text-muted mb-2">
                                  <i className="ri-chat-quote-line me-1"></i>Avis {idx + 1}
                                </p>
                                <AIInputField
                                  label="Titre"
                                  value={testimonial.header || ''}
                                  onChange={(val) => {
                                    const newTestimonials = [...(aiContent.testimonials || [])];
                                    newTestimonials[idx] = { ...testimonial, header: val };
                                    setAiContent({ ...aiContent, testimonials: newTestimonials });
                                  }}
                                  fieldName={`testimonials[${idx}].header`}
                                  onRegenerate={handleRegenerateField}
                                />
                                <AIInputField
                                  label="Nom"
                                  value={testimonial.name || ''}
                                  onChange={(val) => {
                                    const newTestimonials = [...(aiContent.testimonials || [])];
                                    newTestimonials[idx] = { ...testimonial, name: val };
                                    setAiContent({ ...aiContent, testimonials: newTestimonials });
                                  }}
                                  fieldName={`testimonials[${idx}].name`}
                                  onRegenerate={handleRegenerateField}
                                />
                                <AIInputField
                                  type="textarea"
                                  label="Avis"
                                  value={testimonial.review || ''}
                                  onChange={(val) => {
                                    const newTestimonials = [...(aiContent.testimonials || [])];
                                    newTestimonials[idx] = { ...testimonial, review: val };
                                    setAiContent({ ...aiContent, testimonials: newTestimonials });
                                  }}
                                  fieldName={`testimonials[${idx}].review`}
                                  onRegenerate={handleRegenerateField}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {activeSection === 'faq' && (
                          <div className="section-content">
                            {(aiContent.faq || []).map((item: { question?: string; answer?: string }, idx: number) => (
                              <div key={idx} className="mb-4 pb-3 border-bottom">
                                <p className="fw-500 fs-small text-muted mb-2">FAQ {idx + 1}</p>
                                <AIInputField
                                  label="Question"
                                  value={item.question || ''}
                                  onChange={(val) => {
                                    const newFaq = [...(aiContent.faq || [])];
                                    newFaq[idx] = { ...item, question: val };
                                    setAiContent({ ...aiContent, faq: newFaq });
                                  }}
                                  fieldName={`faq[${idx}].question`}
                                  onRegenerate={handleRegenerateField}
                                />
                                <AIInputField
                                  type="textarea"
                                  label="Réponse"
                                  value={item.answer || ''}
                                  onChange={(val) => {
                                    const newFaq = [...(aiContent.faq || [])];
                                    newFaq[idx] = { ...item, answer: val };
                                    setAiContent({ ...aiContent, faq: newFaq });
                                  }}
                                  fieldName={`faq[${idx}].answer`}
                                  onRegenerate={handleRegenerateField}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Other sections - placeholder */}
                        {!['productInfo', 'hero', 'benefits', 'testimonials', 'faq'].includes(activeSection || '') && (
                          <div className="section-content">
                            <p className="text-muted">Éditeur de section en cours de développement...</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Styles Tab */}
                    {activeTab === 'styles' && (
                    <div className="p-3">
                      {/* Font Family Accordion */}
                      <div className="accordion mb-4" id="stylesAccordion">
                        <div className="accordion-item border-0 border-bottom">
                          <h2 className="accordion-header">
                            <button 
                              className="accordion-button collapsed bg-transparent px-0" 
                              type="button" 
                              data-bs-toggle="collapse" 
                              data-bs-target="#fontCollapse"
                            >
                              <i className="ri-font-size me-2 text-muted"></i>
                              <span className="fw-500 fs-small">Police de Caractères</span>
                            </button>
                          </h2>
                          <div id="fontCollapse" className="accordion-collapse collapse">
                            <div className="accordion-body px-0 pt-2 pb-4">
                              <p className="fs-small text-muted mb-3">Sélectionnez la police de caractères pour votre boutique</p>
                              <div className="d-flex gap-2 flex-wrap">
                                {FONT_FAMILIES.map(font => (
                                  <label key={font.name} className="radio-container" style={{ cursor: 'pointer' }}>
                                    <input 
                                      type="radio" 
                                      name="font_family" 
                                      value={font.name}
                                      checked={(aiContent.font_family_input || 'Inter') === font.name}
                                      onChange={() => setAiContent({ ...aiContent, font_family_input: font.name })}
                                      className="d-none"
                                    />
                                    <div 
                                      className={`custom-font-check-input text-center p-2 rounded border ${(aiContent.font_family_input || 'Inter') === font.name ? 'border-primary' : 'border-light'}`}
                                      style={{ width: '100px', background: '#fff', position: 'relative' }}
                                    >
                                      {(aiContent.font_family_input || 'Inter') === font.name && (
                                        <span 
                                          className="position-absolute bg-primary rounded-circle d-flex align-items-center justify-content-center"
                                          style={{ width: '18px', height: '18px', top: '6px', right: '6px' }}
                                        >
                                          <i className="ri-check-line text-white" style={{ fontSize: '12px' }}></i>
                                        </span>
                                      )}
                                      <p className="fw-500 fs-2 mb-1" style={{ fontFamily: font.name }}>Ag</p>
                                      <p className="fs-xs text-muted mb-0">{font.name}</p>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Import Brand Colors */}
                        <div className="accordion-item border-0 border-bottom">
                          <h2 className="accordion-header">
                            <button 
                              className="accordion-button collapsed bg-transparent px-0" 
                              type="button" 
                              data-bs-toggle="collapse" 
                              data-bs-target="#importBrandCollapse"
                            >
                              <i className="ri-palette-line me-2 text-muted"></i>
                              <span className="fw-500 fs-small">Importer les couleurs d'un site concurrent</span>
                            </button>
                          </h2>
                          <div id="importBrandCollapse" className="accordion-collapse collapse">
                            <div className="accordion-body px-0 pt-2 pb-4">
                              <Input 
                                type="text"
                                placeholder="ex: apple.com"
                                className="form-control mb-2"
                              />
                              <Button variant="outline" size="sm">Importer</Button>
                            </div>
                          </div>
                        </div>

                        {/* Set Brand Colors */}
                        <div className="accordion-item border-0">
                          <h2 className="accordion-header">
                            <button 
                              className="accordion-button bg-transparent px-0" 
                              type="button" 
                              data-bs-toggle="collapse" 
                              data-bs-target="#colorsCollapse"
                            >
                              <i className="ri-color-filter-line me-2 text-muted"></i>
                              <span className="fw-500 fs-small">Choisissez des couleurs pour votre site</span>
                            </button>
                          </h2>
                          <div id="colorsCollapse" className="accordion-collapse collapse show">
                            <div className="accordion-body px-0 pt-2 pb-4">
                              {/* Color Presets */}
                              <div className="d-flex gap-2 flex-wrap mb-3">
                                {COLOR_PRESETS.map((preset, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    className="btn p-1 rounded-pill border"
                                    style={{ background: '#fff' }}
                                    onClick={() => setAiContent({ 
                                      ...aiContent, 
                                      primary_color_picker: preset.primary,
                                      tertiary_color_picker: preset.tertiary
                                    })}
                                  >
                                    <span 
                                      className="d-inline-block" 
                                      style={{ 
                                        width: '20px', 
                                        height: '20px', 
                                        background: preset.primary,
                                        borderRadius: '10px 0 0 10px'
                                      }}
                                    ></span>
                                    <span 
                                      className="d-inline-block" 
                                      style={{ 
                                        width: '20px', 
                                        height: '20px', 
                                        background: preset.tertiary,
                                        borderRadius: '0 10px 10px 0'
                                      }}
                                    ></span>
                                  </button>
                                ))}
                              </div>

                              {/* Generate New Colors Button */}
                              <button
                                type="button"
                                className="btn btn-sm mb-4 text-white"
                                style={{ 
                                  background: 'linear-gradient(135deg, #4e7a9b, #6f6254)',
                                  borderRadius: '20px',
                                  padding: '8px 16px'
                                }}
                              >
                                <i className="ri-refresh-line me-2"></i>
                                Générer de nouvelles couleurs
                              </button>

                              {/* Action Color */}
                              <div className="mb-3">
                                <p className="mb-0 fw-500 fs-small">Couleur d'action</p>
                                <p className="mb-2 fs-xs text-muted">Utilisez-la dans les boutons et les liens et plus pour mettre en évidence et souligner</p>
                                <div className="d-flex align-items-center gap-2">
                                  <label 
                                    className="rounded-circle d-flex align-items-center justify-content-center overflow-hidden border"
                                    style={{ 
                                      width: '28px', 
                                      height: '28px', 
                                      background: aiContent.primary_color_picker || '#6f6254',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <input 
                                      type="color"
                                      value={aiContent.primary_color_picker || '#6f6254'}
                                      onChange={(e) => setAiContent({ ...aiContent, primary_color_picker: e.target.value })}
                                      style={{ opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                    />
                                  </label>
                                  <Input
                                    type="text"
                                    value={aiContent.primary_color_picker || '#6f6254'}
                                    onChange={(e) => setAiContent({ ...aiContent, primary_color_picker: e.target.value })}
                                    className="form-control"
                                    style={{ width: '100px' }}
                                    maxLength={7}
                                  />
                                </div>
                              </div>

                              {/* Surface Color */}
                              <div>
                                <p className="mb-0 fw-500 fs-small">Couleur de surface</p>
                                <p className="mb-2 fs-xs text-muted">Utilisez-la dans la barre d'annonces et plus</p>
                                <div className="d-flex align-items-center gap-2">
                                  <label 
                                    className="rounded-circle d-flex align-items-center justify-content-center overflow-hidden border"
                                    style={{ 
                                      width: '28px', 
                                      height: '28px', 
                                      background: aiContent.tertiary_color_picker || '#e6e1dc',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <input 
                                      type="color"
                                      value={aiContent.tertiary_color_picker || '#e6e1dc'}
                                      onChange={(e) => setAiContent({ ...aiContent, tertiary_color_picker: e.target.value })}
                                      style={{ opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                    />
                                  </label>
                                  <Input
                                    type="text"
                                    value={aiContent.tertiary_color_picker || '#e6e1dc'}
                                    onChange={(e) => setAiContent({ ...aiContent, tertiary_color_picker: e.target.value })}
                                    className="form-control"
                                    style={{ width: '100px' }}
                                    maxLength={7}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>

                  {/* Step Navigation Buttons - Inside Content Editor Wrapper */}
                  <div className="step-buttons-wrapper d-flex justify-content-end align-items-center gap-2 p-3 border-top bg-white flex-shrink-0">
                    <Button variant="outline" onClick={handleBack}>
                      Retour
                    </Button>
                    <Button onClick={handleNext}>
                      Suivant
                    </Button>
                  </div>
                </div>

                {/* Preview Panel - AIStorePreview */}
                <div 
                  id="AIStorePreview"
                  className={`d-none d-lg-flex flex-column flex-grow-1 bg-weak-50 ${previewDevice === 'mobile' ? 'preview-mobile' : 'preview-desktop'}`}
                  style={{ backgroundColor: '#f9fafb' }}
                >
                  {/* Preview Header Bar */}
                  <div className="preview-btn-wrapper border-bottom px-3 d-flex justify-content-between align-items-center bg-white" style={{ height: '46px' }}>
                    {/* Left: Page & Theme selectors */}
                    <div className="d-flex align-items-center gap-2">
                      <select 
                        id="pageToggle"
                        className="form-select page-toggle fs-small btn btn-secondary"
                        value={pageView}
                        onChange={(e) => setPageView(e.target.value as 'product_page' | 'home_page')}
                        style={{ maxWidth: '140px', height: '34px' }}
                      >
                        <option value="product_page">Page de prod</option>
                        <option value="home_page">Page d&apos;accueil</option>
                      </select>
                      <select 
                        id="themeSelector"
                        className="form-select fs-small d-none"
                        style={{ maxWidth: '110px', height: '34px' }}
                        defaultValue="theme_v4"
                      >
                        <option value="theme_v4">Theme V4</option>
                        <option value="theme_v3">Theme V3</option>
                      </select>
                    </div>
                    
                    {/* Center: Mobile/Desktop Toggle */}
                    <div id="previewDeviceToggle" className="preview-device-toggle d-none d-xl-flex">
                      <button 
                        type="button"
                        className={`preview-device-btn ${previewDevice === 'mobile' ? 'active' : ''}`}
                        data-device="mobile"
                        onClick={() => setPreviewDevice('mobile')}
                      >
                        Mobile
                      </button>
                      <button 
                        type="button"
                        className={`preview-device-btn ${previewDevice === 'desktop' ? 'active' : ''}`}
                        data-device="desktop"
                        onClick={() => setPreviewDevice('desktop')}
                      >
                        Desktop
                      </button>
                    </div>
                    
                    {/* Right: View Store Link */}
                    <a 
                      id="preview_link_btn"
                      href="#" 
                      className="btn btn-secondary fw-normal d-flex align-items-center gap-1"
                      style={{ height: '34px', fontSize: '14px' }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="ri-external-link-line"></i>
                      <span className="d-none d-xl-inline">Voir la boutique</span>
                    </a>
                  </div>
                  
                  {/* Preview Iframe Container */}
                  <div 
                    id="previewiframeWrapper" 
                    className="preview-ifram-wrapper p-3 d-flex justify-content-center mx-auto flex-grow-1"
                    style={{ 
                      width: previewDevice === 'mobile' ? '500px' : '100%',
                      transition: 'width 0.3s ease',
                      overflow: 'auto',
                    }}
                  >
                    {generatedProductId ? (
                      <iframe
                        id="shopPreviewIframe"
                        className="radius-12 bg-white"
                        src={`/api/ai/liquid-preview?product_id=${generatedProductId}&page_type=${pageView === 'home_page' ? 'home' : 'product'}&t=${previewKey}`}
                        style={{ 
                          width: '100%', 
                          height: 'calc(100vh - 280px)', 
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: previewDevice === 'mobile' ? '0 4px 20px rgba(0,0,0,0.1)' : 'none',
                        }}
                        title="Aperçu de la boutique"
                      />
                    ) : (
                      <div 
                        id="iframeLodingSkeleton"
                        className="is-loading w-100 d-flex align-items-center justify-content-center"
                        style={{ height: '500px', maxWidth: '390px', borderRadius: '12px', background: '#e9ecef' }}
                      >
                        <div className="text-center text-muted">
                          <i className="ri-store-2-line mb-3" style={{ fontSize: '48px', opacity: 0.3 }}></i>
                          <p className="fw-500">Aperçu en temps réel</p>
                          <p className="fs-small">L&apos;aperçu de votre boutique apparaîtra ici</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== STEP 4: PUBLISH ==================== */}
          {currentStep === 4 && aiContent && (
            <div className="step-content-enter">
              {/* Warning Banner */}
              <div className="alert alert-warning alert-dismissible mb-0 rounded-0 py-2 px-4" role="alert">
                <i className="ri-alert-line me-2"></i>
                <span className="fs-small">
                  Remarque: Une fois votre theme mis à jour sur Shopify, vous pourrez le personnaliser et l&apos;optimiser pour qu&apos;il corresponde parfaitement à votre marque.
                </span>
                <button type="button" className="btn-close py-2" data-bs-dismiss="alert"></button>
              </div>

              <div className="d-flex" style={{ minHeight: 'calc(100vh - 250px)' }}>
                {/* Left Panel - Summary */}
                <div className="d-none d-lg-block p-4" style={{ width: '400px', borderRight: '1px solid #e5e7eb' }}>
                  <div className="text-center mb-4">
                    <div 
                      className="d-flex align-items-center justify-content-center mx-auto rounded-circle mb-3"
                      style={{ width: '64px', height: '64px', backgroundColor: '#EFF6FF' }}
                    >
                      <i className="ri-rocket-line" style={{ fontSize: '32px', color: '#335cff' }}></i>
                    </div>
                    <h4 className="fw-600 mb-2">Prêt à publier ?</h4>
                    <p className="text-muted fs-small">
                      Votre boutique <strong>{storeName || aiContent.title}</strong> est prête à être mise à jour sur Shopify.
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="card border mb-4">
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center gap-3 mb-3">
                        {selectedImages[0] && (
                          <img 
                            src={selectedImages[0]} 
                            alt="Product" 
                            className="rounded"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          />
                        )}
                        <div>
                          <h6 className="fw-600 mb-1">{aiContent.title}</h6>
                          <p className="text-muted mb-0 fs-xs">{aiContent.price}</p>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between fs-xs text-muted">
                        <span><i className="ri-image-line me-1"></i>{selectedImages.length} images</span>
                        <span><i className="ri-translate-2 me-1"></i>{LANGUAGES.find(l => l.code === selectedLanguage)?.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {isPushing && (
                    <div className="mb-4">
                      <div className="progress" style={{ height: '6px' }}>
                        <div 
                          className="progress-bar progress-bar-animated"
                          role="progressbar" 
                          style={{ width: `${publishProgress}%`, backgroundColor: '#335cff' }}
                        ></div>
                      </div>
                      <p className="text-muted fs-xs mt-2 text-center">
                        Publication en cours... {publishProgress}%
                      </p>
                    </div>
                  )}

                  {/* Shopify Connection Warning */}
                  {!session?.user?.shopifyDomain && (
                    <div className="alert alert-info text-start mb-4 py-2 px-3">
                      <i className="ri-information-line me-2"></i>
                      <span className="fs-small">Vous devez connecter votre boutique Shopify avant de pouvoir publier.</span>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="d-flex flex-column gap-2">
                    <Button variant="outline" onClick={handleBack} disabled={isPushing} className="w-100">
                      Retour
                    </Button>
                    <Button 
                      onClick={session?.user?.shopifyDomain ? handlePushToShopify : undefined}
                      disabled={isPushing}
                      className="w-100 btn-primary d-flex align-items-center justify-content-center gap-2"
                    >
                      {isPushing ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          Publication...
                        </>
                      ) : (
                        <>
                          <img src="/img/shopify-logo-min.png" width="18" height="18" alt="Shopify" />
                          {session?.user?.shopifyDomain ? 'Mettre à jour le thème' : 'Connecter votre Shopify'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Right Panel - Full Preview */}
                <div 
                  className="flex-grow-1 d-flex flex-column" 
                  style={{ backgroundColor: '#f0f2f5' }}
                >
                  {/* Preview Header */}
                  <div className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center bg-white" style={{ height: '46px' }}>
                    <div className="d-flex align-items-center gap-2">
                      <select 
                        className="form-select form-select-sm"
                        style={{ width: '140px', height: '34px' }}
                        defaultValue="product_page"
                      >
                        <option value="product_page">Page de prod</option>
                        <option value="home_page">Page d&apos;accueil</option>
                      </select>
                      <select 
                        className="form-select form-select-sm d-none d-xl-block"
                        style={{ width: '100px', height: '34px' }}
                        defaultValue="theme_v4"
                      >
                        <option value="theme_v4">Theme V</option>
                      </select>
                    </div>
                    <div 
                      className="preview-device-toggle d-none d-xl-flex p-1 rounded"
                      style={{ backgroundColor: '#e4e4e7' }}
                    >
                      <button 
                        className={`btn btn-sm px-3 ${previewDevice === 'mobile' ? 'bg-white shadow-sm' : ''}`}
                        onClick={() => setPreviewDevice('mobile')}
                        style={{ borderRadius: '6px' }}
                      >
                        Mobile
                      </button>
                      <button 
                        className={`btn btn-sm px-3 ${previewDevice === 'desktop' ? 'bg-white shadow-sm' : ''}`}
                        onClick={() => setPreviewDevice('desktop')}
                        style={{ borderRadius: '6px' }}
                      >
                        Desktop
                      </button>
                    </div>
                    <a 
                      href="#" 
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="ri-external-link-line"></i>
                      <span className="d-none d-xl-inline">Voir la boutique</span>
                    </a>
                  </div>

                  {/* Preview Iframe */}
                  <div 
                    className="flex-grow-1 d-flex justify-content-center p-3 overflow-auto"
                  >
                    <div 
                      className="preview-frame bg-white shadow-sm rounded overflow-hidden"
                      style={{ 
                        width: previewDevice === 'mobile' ? '375px' : '100%',
                        maxWidth: previewDevice === 'mobile' ? '375px' : '1200px',
                        height: 'calc(100vh - 350px)',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {generatedProductId ? (
                        <iframe
                          id="step4PreviewIframe"
                          src={`/api/ai/liquid-preview?product_id=${generatedProductId}&page_type=${pageView === 'home_page' ? 'home' : 'product'}&t=${previewKey}`}
                          style={{ width: '100%', height: '100%', border: 'none' }}
                          title="Aperçu de la boutique"
                        />
                      ) : (
                        <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                          <i className="ri-store-2-line mb-3" style={{ fontSize: '48px', opacity: 0.3 }}></i>
                          <p className="fw-500">Aperçu indisponible</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
