"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardHeader from "@/components/DashboardHeader";
import { useStats } from "@/contexts/StatsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MarketsFilter,
  PerformanceScoreFilter,
  DatesFilter,
  CTAsFilter,
  ActiveAdsFilter,
  MonthlyVisitsFilter,
  TrafficGrowthFilter,
  DailyRevenueFilter,
  MonthlyOrdersFilter,
  ShopCreationFilter,
  CurrencyFilter,
  PixelsFilter,
  OriginFilter,
  LanguageFilter,
  DomainFilter,
  TrustpilotFilter,
  ThemesFilter,
  ApplicationsFilter,
  SocialNetworksFilter,
  ProductsFilter,
} from "@/components/filters";
import { getActiveAdsRangeFromScores } from "@/components/filters/PerformanceScoreFilter";
import NicheDropdown from "@/components/NicheDropdown";
import FilterDropdown, { FilterApplyButton } from "@/components/filters/FilterDropdown";
import { useAds, AdsFilters } from "@/lib/hooks/use-ads";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import TutorialModal, { TUTORIAL_CONFIGS } from "@/components/TutorialModal";
import ShopAnalyticsDrawer from "@/components/ShopAnalyticsDrawer";
import DebugPanel from "@/components/DebugPanel";

// Sort options for ads - "Pertinence" shows videos first then best scoring ads
const SORT_OPTIONS = [
  { value: "recommended", label: "Pertinence", icon: "ri-sparkling-line" },
  { value: "start_date", label: "Plus recentes", icon: "ri-calendar-line" },
  { value: "estimated_monthly", label: "Chiffre d'affaires", icon: "ri-money-euro-circle-line" },
  { value: "last_month_visits", label: "Portee", icon: "ri-eye-line" },
  { value: "growth_rate", label: "Croissance", icon: "ri-arrow-up-circle-line" },
  { value: "trending", label: "Tendance", icon: "ri-fire-line" },
];

// Removed PER_PAGE_OPTIONS - using infinite scroll

// Interface for user stats
interface UserStats {
  plan: {
    identifier: string;
    title: string;
    isOnTrial: boolean;
    isExpired: boolean;
    trialDaysRemaining: number;
  };
}

// Toast Alert Component
interface ToastAlert {
  id: string;
  type: 'success' | 'error' | 'info' | 'limit';
  message: string;
  shopUrl?: string;
  shopId?: number;
}

function ToastAlerts({ alerts, onDismiss, onViewShop }: { 
  alerts: ToastAlert[]; 
  onDismiss: (id: string) => void;
  onViewShop?: (shopId: number) => void;
}) {
  const getAlertStyles = (type: 'success' | 'error' | 'info' | 'limit') => {
    switch(type) {
      case 'error':
      case 'limit':
        return { backgroundColor: '#dc3545', color: '#fff' };
      case 'success':
        return { backgroundColor: '#212529', color: '#fff' };
      case 'info':
      default:
        return { backgroundColor: '#ffc107', color: '#212529' };
    }
  };

  return (
    <div className="position-fixed" style={{ top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, width: 'auto', maxWidth: 'calc(100% - 40px)' }}>
      {alerts.map((alert) => {
        const alertStyles = getAlertStyles(alert.type);
        return (
          <div
            key={alert.id}
            className="mb-2"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              ...alertStyles,
            }}
          >
            {/* Icon */}
            {alert.type === 'success' && (
              <i className="ri-checkbox-circle-fill" style={{ fontSize: '18px', color: '#fff', flexShrink: 0 }}></i>
            )}
            {(alert.type === 'error' || alert.type === 'limit') && (
              <i className="ri-error-warning-fill" style={{ fontSize: '18px', color: '#fff', flexShrink: 0 }}></i>
            )}
            {alert.type === 'info' && (
              <i className="ri-information-fill" style={{ fontSize: '18px', color: '#212529', flexShrink: 0 }}></i>
            )}
            
            {/* Message */}
            <span style={{ fontSize: '14px', color: alertStyles.color, flexShrink: 1 }}>
              {alert.message}
            </span>
            
            {/* Action Button */}
            {alert.type === 'success' && alert.shopId && onViewShop && (
              <button 
                className="btn btn-sm" 
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)', 
                  border: 'none', 
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  padding: '6px 12px',
                  borderRadius: '6px',
                }}
                onClick={() => onViewShop(alert.shopId!)}
              >
                Voir la boutique
              </button>
            )}
            {(alert.type === 'error' || alert.type === 'limit') && (
              <Link 
                href="/dashboard/plans" 
                className="btn btn-sm" 
                style={{ 
                  backgroundColor: '#fff', 
                  border: 'none', 
                  color: '#212529',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  padding: '6px 12px',
                  borderRadius: '6px',
                }}
              >
                Débloquer l&apos;accès complet
              </Link>
            )}
            
            {/* Close Button */}
            {alert.type !== 'limit' && (
              <button 
                onClick={() => onDismiss(alert.id)}
                style={{ 
                  background: 'transparent',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  opacity: 0.7,
                }}
              >
                <i 
                  className="ri-close-line" 
                  style={{ 
                    fontSize: '20px', 
                    color: alert.type === 'info' ? '#212529' : '#fff',
                  }}
                ></i>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Ad Card Skeleton - Improved with animation
function AdCardSkeleton() {
  return (
    <div className="post-wrapper border-gray-thin position-relative bg-white p-0 rounded overflow-hidden">
      <div className="d-flex justify-content-between align-items-start gap-3 p-3 border-bottom">
        <div className="d-flex gap-2">
          <div className="skeleton-box rounded-circle" style={{ width: '40px', height: '40px' }}></div>
          <div>
            <div className="skeleton-box rounded mb-1" style={{ width: '100px', height: '14px' }}></div>
            <div className="skeleton-box rounded" style={{ width: '80px', height: '12px' }}></div>
          </div>
        </div>
        <div className="skeleton-box rounded" style={{ width: '28px', height: '28px' }}></div>
      </div>
      <div className="p-3 pb-0">
        <div className="skeleton-box rounded mb-2" style={{ width: '100%', height: '14px' }}></div>
        <div className="skeleton-box rounded" style={{ width: '70%', height: '14px' }}></div>
      </div>
      {/* Media placeholder with 9:16 aspect ratio hint */}
      <div className="skeleton-box" style={{ width: '100%', aspectRatio: '1/1.2', minHeight: '280px' }}></div>
      <div className="p-3">
        <div className="skeleton-box rounded mb-2" style={{ width: '100%', height: '38px' }}></div>
        <div className="d-flex gap-2">
          <div className="skeleton-box rounded flex-grow-1" style={{ height: '38px' }}></div>
          <div className="skeleton-box rounded" style={{ width: '38px', height: '38px' }}></div>
        </div>
      </div>
    </div>
  );
}

// Ad Description with expandable "Voir plus"
function AdDescription({ body }: { body: string }) {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 100;
  const shouldTruncate = body.length > maxLength;
  
  return (
    <div className="px-3 py-2">
      <p className="text-gray fs-xs mb-0" style={{ lineHeight: '1.5' }}>
        {expanded || !shouldTruncate ? body : `${body.substring(0, maxLength)}...`}
        {shouldTruncate && (
          <button 
            type="button"
            onClick={() => setExpanded(!expanded)} 
            className="text-primary fw-500 ms-1 border-0 bg-transparent p-0"
            style={{ fontSize: 'inherit', cursor: 'pointer' }}
          >
            {expanded ? 'Voir moins' : 'Voir Plus'}
          </button>
        )}
      </p>
    </div>
  );
}

// Ad Image with proper error handling (not too aggressive)
function AdImage({ imageLink }: { imageLink: string }) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  if (hasError) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '250px', background: '#f5f5f5', color: '#aaa' }}>
        <i className="ri-image-line" style={{ fontSize: '40px' }}></i>
        <span style={{ fontSize: '13px', marginTop: '8px' }}>Image non disponible</span>
      </div>
    );
  }
  
  return (
    <>
      <a href={imageLink} download className="download-video btn border-white bg-white rounded-8 border position-absolute" style={{ top: '10px', right: '10px', zIndex: 10 }} title="Download">
        <i className="ri-download-2-fill fs-xs"></i>
      </a>
      {isLoading && (
        <div className="skeleton-box position-absolute" style={{ top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}></div>
      )}
      <img 
        src={imageLink} 
        alt="Ad"
        style={{ 
          width: '100%', 
          display: 'block', 
          maxHeight: '450px', 
          objectFit: 'contain',
          backgroundColor: '#f8f9fa'
        }}
        onLoad={() => setIsLoading(false)}
        onError={() => { setHasError(true); setIsLoading(false); }}
      />
    </>
  );
}

// Memoized Ad Card component to prevent unnecessary re-renders
interface AdCardProps {
  ad: any;
  index: number;
  isTracked: boolean;
  onTrackShop: (shopId: number, shopUrl?: string) => Promise<boolean>;
  onToggleFavorite: (adId: number) => void;
  getActiveDays: (firstSeenDate: string | null, lastSeenDate?: string | null) => number;
  onOpenAnalytics: (shopId: number, shopUrl?: string, shopName?: string) => void;
}

const AdCard = React.memo(function AdCard({ ad, index, isTracked: initialIsTracked, onTrackShop, onToggleFavorite, getActiveDays, onOpenAnalytics }: AdCardProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [isTracked, setIsTracked] = useState(initialIsTracked);
  const [isFavorited, setIsFavorited] = useState(ad.isFavorited);
  
  // Use API-calculated activeDays, fallback to frontend calculation if 0
  const activeDays = ad.activeDays > 0 ? ad.activeDays : getActiveDays(ad.firstSeenDate || ad.startDate, ad.lastSeenDate || ad.endDate);
  
  const handleTrackClick = async () => {
    if (!ad.shopId || isTracking) return;
    
    // If already tracked, just open the drawer
    if (isTracked) {
      onOpenAnalytics(ad.shopId, ad.shopUrl || ad.targetUrl, ad.pageName || ad.shopName);
      return;
    }
    
    setIsTracking(true);
    try {
      const success = await onTrackShop(ad.shopId, ad.shopUrl || undefined);
      if (success) {
        setIsTracked(true);
        // Don't auto-open drawer - user must click "Voir l'analyse"
      }
    } finally {
      setIsTracking(false);
    }
  };
  
  const handleFavoriteClick = () => {
    setIsFavorited(!isFavorited);
    onToggleFavorite(Number(ad.id));
  };

  return (
    <div className="post-wrapper border-gray-thin position-relative bg-white p-0 rounded">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start gap-3 p-3 border-bottom">
        <div className="d-flex gap-2">
          <img 
            src={ad.pageId ? `https://graph.facebook.com/${ad.pageId}/picture?type=square` : '/img_not_found.png'} 
            alt={ad.shopName || 'Ad'}
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
            onError={(e) => { (e.target as HTMLImageElement).src = '/img_not_found.png'; }}
          />
          <div>
            <h4 className="fs-small mb-0 fw-500">{(ad.pageName || ad.shopName || 'Unknown')?.substring(0, 25)}{(ad.pageName || ad.shopName || '')?.length > 25 ? '...' : ''}</h4>
            {/* Active days status */}
            <div className="d-flex align-items-center gap-1">
              <span className={`${ad.isActive ? 'bg-success' : 'bg-secondary'}`} style={{ width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block' }}></span>
              <span className={`fs-xs ${ad.isActive ? 'text-success' : 'text-secondary'} fw-normal`}>
                {ad.isActive ? `Active pendant ${activeDays} jours` : 'Inactive'}
              </span>
            </div>
            {/* Live Ads count */}
            {ad.shopActiveAds > 0 && (
              <div className="d-flex align-items-center gap-1 mt-1">
                <span className="fs-xs text-primary fw-500">
                  {ad.shopActiveAds} Live Ads
                </span>
                <i className="ri-advertisement-line text-primary" style={{ fontSize: '12px' }}></i>
              </div>
            )}
          </div>
        </div>
        {/* Meta Icon - with gray background like Laravel */}
        {ad.adLibraryUrl && (
          <a href={ad.adLibraryUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm d-flex align-items-center justify-content-center" title="Voir sur Meta" style={{ width: '32px', height: '32px', padding: 0, background: '#f5f7fa', borderRadius: '6px', border: 'none' }}>
            <i className="ri-meta-line" style={{ fontSize: '14px', color: '#525866' }}></i>
          </a>
        )}
      </div>

      {/* Description with Voir Plus */}
      {ad.body && (
        <AdDescription body={ad.body} />
      )}

      {/* Media Preview - Natural height like Laravel */}
      <div className="post-box rounded-0 position-relative">
        {ad.mediaType === 'video' && ad.videoUrl ? (
          <>
            {/* Download button */}
            <button 
              type="button"
              className="download-video btn border-white bg-white rounded-8 border"
              onClick={() => {
                const link = document.createElement('a');
                link.href = ad.videoUrl!;
                link.download = `ad-${ad.id}`;
                link.target = '_blank';
                link.click();
              }}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 10,
                padding: '6px 10px',
              }}
              title="Télécharger"
            >
              <i className="ri-download-2-fill fs-xs"></i>
            </button>
            <video 
              width="100%"
              controls
              className="video-bg"
              preload="none"
              poster={ad.videoPreview || ad.imageLink || undefined}
              style={{ display: 'block', width: '100%' }}
            >
              <source src={ad.videoUrl} type="video/mp4" />
              Votre navigateur ne supporte pas les vidéos.
            </video>
          </>
        ) : ad.imageLink ? (
          <>
            {/* Download button for image */}
            <button 
              type="button"
              className="download-video btn border-white bg-white rounded-8 border"
              onClick={() => {
                const link = document.createElement('a');
                link.href = ad.imageLink!;
                link.download = `ad-${ad.id}`;
                link.target = '_blank';
                link.click();
              }}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 10,
                padding: '6px 10px',
              }}
              title="Télécharger"
            >
              <i className="ri-download-2-fill fs-xs"></i>
            </button>
            <img 
              src={ad.imageLink} 
              alt="" 
              style={{ width: '100%', display: 'block' }} 
              onError={(e) => { 
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                // Hide broken image and show placeholder
                target.style.display = 'none';
                const placeholder = document.createElement('div');
                placeholder.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:250px;color:#9ca3af;font-size:14px;background:#f3f4f6';
                placeholder.innerHTML = '<i class="ri-image-line" style="font-size:40px"></i><span style="margin-top:8px">Image non disponible</span>';
                target.parentElement?.appendChild(placeholder);
              }}
            />
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '250px', color: '#9ca3af', fontSize: 14, background: '#f3f4f6' }}>
            <i className="ri-image-line" style={{ fontSize: '40px' }}></i>
            <span style={{ marginTop: '8px' }}>Image non disponible</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3">
        {/* Voir la boutique - With box shadow */}
        <a 
          href={ad.shopUrl ? `https://${ad.shopUrl.replace(/^https?:\/\//, '')}` : '#'} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn btn-outline-secondary w-100 mb-2 d-flex align-items-center justify-content-center gap-2"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0', height: '38px', fontSize: '13px' }}
        >
          <i className="ri-external-link-line"></i>
          Voir la boutique
        </a>
        
        {/* Suivre + Save - Same height buttons */}
        <div className="d-flex gap-2" style={{ height: '38px' }}>
          {ad.shopId && (
            isTracked ? (
              <button 
                type="button" 
                onClick={handleTrackClick} 
                className="btn flex-grow-1 d-flex align-items-center justify-content-center gap-1" 
                style={{ 
                  height: '38px', 
                  fontSize: '13px',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 500,
                }}
              >
                <i className="ri-line-chart-line"></i>
                Voir l&apos;analyse
              </button>
            ) : isTracking ? (
              <button type="button" className="btn btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-1" style={{ height: '38px' }} disabled>
                <span className="spinner-border spinner-border-sm"></span>
              </button>
            ) : (
              <button type="button" onClick={handleTrackClick} className="btn btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-1" style={{ height: '38px', fontSize: '13px' }}>
                <i className="ri-focus-3-line"></i>
                Suivre les données de la boutique
              </button>
            )
          )}
          {/* Save button - Same height as Suivre button */}
          <button 
            type="button"
            onClick={handleFavoriteClick}
            className="btn d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: '38px',
              height: '38px',
              padding: 0,
              backgroundColor: isFavorited ? 'rgba(12, 108, 251, 0.1)' : '#fff',
              color: isFavorited ? '#0c6cfb' : '#6c757d',
              border: '1px solid',
              borderColor: isFavorited ? '#0c6cfb' : '#e0e0e0',
              borderRadius: '6px',
            }}
            title={isFavorited ? 'Retirer des favoris' : 'Enregistrer'}
          >
            <i className={`ri-bookmark-${isFavorited ? 'fill' : 'line'}`} style={{ fontSize: '16px' }}></i>
          </button>
        </div>
      </div>
    </div>
  );
});

// Preset configs
const PRESET_CONFIGS: Record<string, Partial<AdsFilters>> = {
  fr_market: { country: 'FR', sortBy: 'recommended' },
  us_market: { country: 'US', sortBy: 'recommended' },
  recent_winners: { sortBy: 'most_recent', status: 'active' },
};

// Active filter interface
interface ActiveFilter {
  id: string;
  label: string;
  key: string;
  value?: string;
}

export default function AdsPage() {
  const router = useRouter();
  const { refreshStats } = useStats();
  const [searchText, setSearchText] = useState("");
  const [appliedSearchText, setAppliedSearchText] = useState("");
  const [activePreset, setActivePreset] = useState("");
  const [trackedShopIds, setTrackedShopIds] = useState<Set<number>>(new Set());
  const [toastAlerts, setToastAlerts] = useState<ToastAlert[]>([]);
  const [euTransparency, setEuTransparency] = useState(false);
  const [savedAdsDrawerOpen, setSavedAdsDrawerOpen] = useState(false);
  const [savedAds, setSavedAds] = useState<any[]>([]);
  const [loadingSavedAds, setLoadingSavedAds] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  
  // Analytics drawer state
  const [analyticsDrawerOpen, setAnalyticsDrawerOpen] = useState(false);
  const [analyticsShopId, setAnalyticsShopId] = useState<number | null>(null);
  const [analyticsShopUrl, setAnalyticsShopUrl] = useState<string | undefined>();
  const [analyticsShopName, setAnalyticsShopName] = useState<string | undefined>();
  
  // Filter states
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedCTAs, setSelectedCTAs] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedMediaType, setSelectedMediaType] = useState("");
  const [minActiveAds, setMinActiveAds] = useState<number | undefined>();
  const [maxActiveAds, setMaxActiveAds] = useState<number | undefined>();
  const [selectedPerformanceScores, setSelectedPerformanceScores] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("recommended");
  
  // New filter states (from Top Boutiques/Produits)
  const [minTraffic, setMinTraffic] = useState<number | undefined>();
  const [maxTraffic, setMaxTraffic] = useState<number | undefined>();
  const [minTrafficGrowth, setMinTrafficGrowth] = useState<number | undefined>();
  const [maxTrafficGrowth, setMaxTrafficGrowth] = useState<number | undefined>();
  const [minRevenue, setMinRevenue] = useState<number | undefined>();
  const [maxRevenue, setMaxRevenue] = useState<number | undefined>();
  const [minOrders, setMinOrders] = useState<number | undefined>();
  const [maxOrders, setMaxOrders] = useState<number | undefined>();
  const [shopCreationDate, setShopCreationDate] = useState<string | undefined>();
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [selectedPixels, setSelectedPixels] = useState<string[]>([]);
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [minTrustpilotRating, setMinTrustpilotRating] = useState<number | undefined>();
  const [maxTrustpilotRating, setMaxTrustpilotRating] = useState<number | undefined>();
  const [minTrustpilotReviews, setMinTrustpilotReviews] = useState<number | undefined>();
  const [maxTrustpilotReviews, setMaxTrustpilotReviews] = useState<number | undefined>();
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectedSocialNetworks, setSelectedSocialNetworks] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [minCatalogSize, setMinCatalogSize] = useState<number | undefined>();
  const [maxCatalogSize, setMaxCatalogSize] = useState<number | undefined>();
  
  // Saved searches state
  const [savedSearches, setSavedSearches] = useState<Array<{ id: number; name: string; filters: Record<string, unknown> }>>([]);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");
  const [saveSearchLoading, setSaveSearchLoading] = useState(false);
  const [saveSearchSuccess, setSaveSearchSuccess] = useState(false);
  const [activeSavedSearchId, setActiveSavedSearchId] = useState<number | null>(null);
  
  // Infinite scroll settings
  const [perPage] = useState(25);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Build filters - memoized for TanStack Query
  const filters = useMemo((): AdsFilters => {
    const f: AdsFilters = { sortBy, sortOrder };
    if (appliedSearchText) f.search = appliedSearchText;
    if (selectedCountries.length) f.country = selectedCountries.join(',');
    if (selectedNiches.length) f.category = selectedNiches.join(',');
    if (selectedCTAs.length) f.ctas = selectedCTAs.join(',');
    if (selectedStatus !== 'all') f.status = selectedStatus;
    if (selectedMediaType) f.mediaType = selectedMediaType;
    
    // Performance Score filter overrides minActiveAds/maxActiveAds
    if (selectedPerformanceScores.length > 0) {
      const scoreRange = getActiveAdsRangeFromScores(selectedPerformanceScores);
      if (scoreRange.min !== undefined) f.minActiveAds = scoreRange.min;
      if (scoreRange.max !== undefined) f.maxActiveAds = scoreRange.max;
    } else {
      if (minActiveAds !== undefined) f.minActiveAds = minActiveAds;
      if (maxActiveAds !== undefined) f.maxActiveAds = maxActiveAds;
    }
    if (euTransparency) f.euTransparency = true;
    
    if (minTraffic !== undefined) f.minVisits = minTraffic;
    if (maxTraffic !== undefined) f.maxVisits = maxTraffic;
    if (minTrafficGrowth !== undefined) f.minGrowth = minTrafficGrowth;
    if (maxTrafficGrowth !== undefined) f.maxGrowth = maxTrafficGrowth;
    if (minRevenue !== undefined) f.minRevenue = minRevenue;
    if (maxRevenue !== undefined) f.maxRevenue = maxRevenue;
    if (minOrders !== undefined) f.minOrders = minOrders;
    if (maxOrders !== undefined) f.maxOrders = maxOrders;
    if (shopCreationDate) f.shopCreationDate = shopCreationDate;
    if (selectedCurrencies.length) f.currencies = selectedCurrencies.join(',');
    if (selectedPixels.length) f.pixels = selectedPixels.join(',');
    if (selectedOrigins.length) f.origins = selectedOrigins.join(',');
    if (selectedLanguages.length) f.languages = selectedLanguages.join(',');
    if (selectedDomains.length) f.domains = selectedDomains.join(',');
    if (minTrustpilotRating !== undefined) f.minTrustpilotRating = minTrustpilotRating;
    if (maxTrustpilotRating !== undefined) f.maxTrustpilotRating = maxTrustpilotRating;
    if (minTrustpilotReviews !== undefined) f.minTrustpilotReviews = minTrustpilotReviews;
    if (maxTrustpilotReviews !== undefined) f.maxTrustpilotReviews = maxTrustpilotReviews;
    if (selectedThemes.length) f.themes = selectedThemes.join(',');
    if (selectedApps.length) f.apps = selectedApps.join(',');
    if (selectedSocialNetworks.length) f.socialNetworks = selectedSocialNetworks.join(',');
    if (minPrice !== undefined) f.minPrice = minPrice;
    if (maxPrice !== undefined) f.maxPrice = maxPrice;
    if (minCatalogSize !== undefined) f.minCatalogSize = minCatalogSize;
    if (maxCatalogSize !== undefined) f.maxCatalogSize = maxCatalogSize;
    
    return f;
  }, [sortBy, sortOrder, appliedSearchText, selectedCountries, selectedNiches, selectedCTAs, 
      selectedStatus, selectedMediaType, minActiveAds, maxActiveAds, selectedPerformanceScores, euTransparency,
      minTraffic, maxTraffic, minTrafficGrowth, maxTrafficGrowth, minRevenue, maxRevenue,
      minOrders, maxOrders, shopCreationDate, selectedCurrencies, selectedPixels,
      selectedOrigins, selectedLanguages, selectedDomains, minTrustpilotRating,
      maxTrustpilotRating, minTrustpilotReviews, maxTrustpilotReviews, selectedThemes,
      selectedApps, selectedSocialNetworks, minPrice, maxPrice, minCatalogSize, maxCatalogSize]);

  // Use ads hook with TanStack Query (infinite scroll)
  const { 
    ads, 
    pagination, 
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
    error, 
    toggleFavorite,
    invalidateAds,
  } = useAds(filters, 1, perPage);

  // Load saved searches on mount
  useEffect(() => {
    const loadSavedSearches = async () => {
      try {
        const res = await fetch('/api/saved-searches?type=ads');
        const data = await res.json();
        if (data.success && data.data) {
          setSavedSearches(data.data);
        }
      } catch (error) {
        console.error('Failed to load saved searches:', error);
      }
    };
    loadSavedSearches();
  }, []);

  // Save current search
  const handleSaveSearch = async () => {
    if (!saveSearchName.trim()) return;
    
    setSaveSearchLoading(true);
    setSaveSearchSuccess(false);
    
    try {
      const filtersToSave = {
        selectedCountries, selectedNiches, selectedCTAs, selectedStatus, selectedMediaType,
        minActiveAds, maxActiveAds, selectedPerformanceScores, euTransparency, sortBy, sortOrder,
        minTraffic, maxTraffic, minTrafficGrowth, maxTrafficGrowth, minRevenue, maxRevenue,
        minOrders, maxOrders, shopCreationDate, selectedCurrencies, selectedPixels,
        selectedOrigins, selectedLanguages, selectedDomains, minTrustpilotRating,
        maxTrustpilotRating, minTrustpilotReviews, maxTrustpilotReviews, selectedThemes,
        selectedApps, selectedSocialNetworks, minPrice, maxPrice, minCatalogSize, maxCatalogSize,
        searchText: appliedSearchText,
      };
      
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveSearchName.trim(),
          type: 'ads',
          filters: filtersToSave,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setSaveSearchSuccess(true);
        setSavedSearches(prev => [data.data, ...prev]);
        setTimeout(() => {
          setShowSaveSearchModal(false);
          setSaveSearchName("");
          setSaveSearchSuccess(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to save search:', error);
    } finally {
      setSaveSearchLoading(false);
    }
  };

  // Delete a saved search
  const handleDeleteSavedSearch = async (id: number) => {
    try {
      const res = await fetch(`/api/saved-searches?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSavedSearches(prev => prev.filter(s => s.id !== id));
        // Clear active state if deleting the active search
        if (activeSavedSearchId === id) {
          setActiveSavedSearchId(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete saved search:', error);
    }
  };

  // Apply a saved search
  const handleApplySavedSearch = (searchId: number, filters: Record<string, unknown>) => {
    // Set active saved search
    setActiveSavedSearchId(searchId);
    
    // Apply all filter values from the saved search (use defaults for missing values)
    setSelectedCountries((filters.selectedCountries as string[]) || []);
    setSelectedNiches((filters.selectedNiches as string[]) || []);
    setSelectedCTAs((filters.selectedCTAs as string[]) || []);
    setSelectedStatus((filters.selectedStatus as string) || "all");
    setSelectedMediaType((filters.selectedMediaType as string) || "");
    setMinActiveAds(filters.minActiveAds as number | undefined);
    setMaxActiveAds(filters.maxActiveAds as number | undefined);
    setSelectedPerformanceScores((filters.selectedPerformanceScores as string[]) || []);
    setEuTransparency((filters.euTransparency as boolean) || false);
    setSortBy((filters.sortBy as string) || "recommended");
    setSortOrder((filters.sortOrder as 'desc' | 'asc') || 'desc');
    setMinTraffic(filters.minTraffic as number | undefined);
    setMaxTraffic(filters.maxTraffic as number | undefined);
    setMinTrafficGrowth(filters.minTrafficGrowth as number | undefined);
    setMaxTrafficGrowth(filters.maxTrafficGrowth as number | undefined);
    setMinRevenue(filters.minRevenue as number | undefined);
    setMaxRevenue(filters.maxRevenue as number | undefined);
    setMinOrders(filters.minOrders as number | undefined);
    setMaxOrders(filters.maxOrders as number | undefined);
    setShopCreationDate((filters.shopCreationDate as string) || undefined);
    setSelectedCurrencies((filters.selectedCurrencies as string[]) || []);
    setSelectedPixels((filters.selectedPixels as string[]) || []);
    setSelectedOrigins((filters.selectedOrigins as string[]) || []);
    setSelectedLanguages((filters.selectedLanguages as string[]) || []);
    setSelectedDomains((filters.selectedDomains as string[]) || []);
    setMinTrustpilotRating(filters.minTrustpilotRating as number | undefined);
    setMaxTrustpilotRating(filters.maxTrustpilotRating as number | undefined);
    setMinTrustpilotReviews(filters.minTrustpilotReviews as number | undefined);
    setMaxTrustpilotReviews(filters.maxTrustpilotReviews as number | undefined);
    setSelectedThemes((filters.selectedThemes as string[]) || []);
    setSelectedApps((filters.selectedApps as string[]) || []);
    setSelectedSocialNetworks((filters.selectedSocialNetworks as string[]) || []);
    setMinPrice(filters.minPrice as number | undefined);
    setMaxPrice(filters.maxPrice as number | undefined);
    setMinCatalogSize(filters.minCatalogSize as number | undefined);
    setMaxCatalogSize(filters.maxCatalogSize as number | undefined);
    // Always reset search text (to saved value or empty)
    const savedSearchText = (filters.searchText as string) || "";
    setSearchText(savedSearchText);
    setAppliedSearchText(savedSearchText);
  };

  // Infinite scroll - Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, loadMore]);

  // Toast functions
  const addToast = (type: ToastAlert['type'], message: string, shopUrl?: string, shopId?: number) => {
    const id = Date.now().toString();
    setToastAlerts(prev => [...prev, { id, type, message, shopUrl, shopId }]);
    if (type !== 'limit') setTimeout(() => setToastAlerts(prev => prev.filter(a => a.id !== id)), 5000);
  };

  const dismissToast = (id: string) => setToastAlerts(prev => prev.filter(a => a.id !== id));

  // Fetch tracked shops
  useEffect(() => {
    const fetchTrackedShops = async () => {
      try {
        const res = await fetch('/api/track?page=1&perPage=100');
        const data = await res.json();
        if (data.success && data.data) {
          setTrackedShopIds(new Set<number>(data.data.map((item: { shopId: number }) => item.shopId)));
        }
      } catch (err) {
        console.error('Failed to fetch tracked shops:', err);
      }
    };
    fetchTrackedShops();
  }, []);

  // Fetch user stats to get trial days remaining
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const res = await fetch('/api/user/stats');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.stats) {
            setUserStats(data.stats);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user stats:', err);
      }
    };
    fetchUserStats();
  }, []);

  // Fetch saved ads when drawer opens
  useEffect(() => {
    if (savedAdsDrawerOpen) fetchSavedAds();
  }, [savedAdsDrawerOpen]);

  const fetchSavedAds = async () => {
    setLoadingSavedAds(true);
    try {
      const res = await fetch('/api/ads/favorite?page=1&perPage=50');
      const data = await res.json();
      if (data.success && data.data) setSavedAds(data.data);
    } catch (err) {
      console.error('Failed to fetch saved ads:', err);
    } finally {
      setLoadingSavedAds(false);
    }
  };


  const handleSearch = () => {
    setAppliedSearchText(searchText);
    invalidateAds();
  };

  const handleApplyFilters = (overrideFilters?: Partial<AdsFilters>) => {
    setActivePreset('');
    // Apply any override filters to local state
    if (overrideFilters) {
      if (overrideFilters.minVisits !== undefined) setMinTraffic(overrideFilters.minVisits);
      if (overrideFilters.maxVisits !== undefined) setMaxTraffic(overrideFilters.maxVisits);
      if (overrideFilters.minGrowth !== undefined) setMinTrafficGrowth(overrideFilters.minGrowth);
      if (overrideFilters.maxGrowth !== undefined) setMaxTrafficGrowth(overrideFilters.maxGrowth);
    }
    invalidateAds();
  };

  const resetFilters = () => {
    setSearchText("");
    setAppliedSearchText("");
    setSelectedCountries([]);
    setSelectedNiches([]);
    setSelectedCTAs([]);
    setSelectedStatus("all");
    setSelectedMediaType("");
    setMinActiveAds(undefined);
    setMaxActiveAds(undefined);
    setSelectedPerformanceScores([]);
    setSortBy("recommended");
    setSortOrder("desc");
    setActivePreset("");
    setEuTransparency(false);
    
    // Reset new filters
    setMinTraffic(undefined);
    setMaxTraffic(undefined);
    setMinTrafficGrowth(undefined);
    setMaxTrafficGrowth(undefined);
    setMinRevenue(undefined);
    setMaxRevenue(undefined);
    setMinOrders(undefined);
    setMaxOrders(undefined);
    setShopCreationDate(undefined);
    setSelectedCurrencies([]);
    setSelectedPixels([]);
    setSelectedOrigins([]);
    setSelectedLanguages([]);
    setSelectedDomains([]);
    setMinTrustpilotRating(undefined);
    setMaxTrustpilotRating(undefined);
    setMinTrustpilotReviews(undefined);
    setMaxTrustpilotReviews(undefined);
    setSelectedThemes([]);
    setSelectedApps([]);
    setSelectedSocialNetworks([]);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setMinCatalogSize(undefined);
    setMaxCatalogSize(undefined);
    setActiveSavedSearchId(null);
    
    // Reset and refetch
    invalidateAds();
  };

  const applyPreset = (preset: string) => {
    if (activePreset === preset) {
      resetFilters();
      return;
    }
    setActivePreset(preset);
    const config = PRESET_CONFIGS[preset];
    setSelectedCountries(config.country ? config.country.split(',') : []);
    setSelectedStatus(config.status || 'all');
    if (config.sortBy) setSortBy(config.sortBy);
    // Refetch with new filters
    invalidateAds();
  };

  const handleTrackShop = async (shopId: number, shopUrl?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId }),
      });
      const data = await res.json();
      
      if (data.success) {
        setTrackedShopIds(prev => new Set(prev).add(shopId));
        addToast('success', `${shopUrl || 'La boutique'} a été ajouté à vos boutiques suivies`, shopUrl, shopId);
        // Refresh navbar stats
        refreshStats();
        return true;
      } else if (data.error === 'Already tracking') {
        setTrackedShopIds(prev => new Set(prev).add(shopId));
        addToast('info', `${shopUrl || 'Cette boutique'} est déjà dans vos boutiques suivies`, shopUrl, shopId);
        return true;
      } else if (data.limitReached) {
        addToast('limit', 'Vous avez atteint la limite maximale de boutiques à suivre.');
        return false;
      } else {
        addToast('error', data.message || 'Erreur lors du suivi');
        return false;
      }
    } catch (err) {
      addToast('error', 'Erreur lors du suivi de la boutique');
      return false;
    }
  };

  const handleViewShop = (shopId: number) => router.push(`/dashboard/track/${shopId}`);

  const handleOpenAnalytics = (shopId: number, shopUrl?: string, shopName?: string) => {
    setAnalyticsShopId(shopId);
    setAnalyticsShopUrl(shopUrl);
    setAnalyticsShopName(shopName);
    setAnalyticsDrawerOpen(true);
  };

  const handleToggleFavorite = async (adId: number) => {
    toggleFavorite(adId, {
      onSuccess: (result) => {
        if (result.data.isFavorited) {
          addToast('success', 'Publicite ajoutee a vos favoris');
        } else {
          addToast('info', 'Publicite retiree de vos favoris');
        }
        if (savedAdsDrawerOpen) fetchSavedAds();
      },
      onError: () => {
        addToast('error', 'Erreur lors de la sauvegarde');
      }
    });
  };

  const getActiveDays = (firstSeenDate: string | null, lastSeenDate?: string | null) => {
    if (!firstSeenDate) return 0;
    const start = new Date(firstSeenDate);
    const end = lastSeenDate ? new Date(lastSeenDate) : new Date();
    return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "-";
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  // Build active filters for display
  const activeFilters: ActiveFilter[] = [];
  if (appliedSearchText) activeFilters.push({ id: 'search', label: `Recherche: ${appliedSearchText}`, key: 'search' });
  selectedCountries.forEach(c => activeFilters.push({ id: `country-${c}`, label: c, key: 'country', value: c }));
  selectedNiches.forEach(n => activeFilters.push({ id: `niche-${n}`, label: n, key: 'niche', value: n }));
  selectedCTAs.forEach(c => activeFilters.push({ id: `cta-${c}`, label: c, key: 'cta', value: c }));
  if (selectedStatus !== 'all') activeFilters.push({ id: 'status', label: selectedStatus === 'active' ? 'Actives' : 'Inactives', key: 'status' });
  if (selectedMediaType) activeFilters.push({ id: 'mediaType', label: selectedMediaType === 'video' ? 'Vidéo' : 'Image', key: 'mediaType' });
  if (euTransparency) activeFilters.push({ id: 'eu', label: 'EU Transparency', key: 'eu' });
  
  // New filters active tags
  if (minTraffic !== undefined || maxTraffic !== undefined) {
    activeFilters.push({ id: 'traffic', label: `Visites: ${minTraffic || 0} - ${maxTraffic || '∞'}`, key: 'traffic' });
  }
  if (minTrafficGrowth !== undefined || maxTrafficGrowth !== undefined) {
    activeFilters.push({ id: 'trafficGrowth', label: `Évolution trafic: ${minTrafficGrowth || 0}% - ${maxTrafficGrowth || '∞'}%`, key: 'trafficGrowth' });
  }
  if (minRevenue !== undefined || maxRevenue !== undefined) {
    activeFilters.push({ id: 'revenue', label: `Revenu: ${minRevenue || 0}€ - ${maxRevenue || '∞'}€`, key: 'revenue' });
  }
  if (minOrders !== undefined || maxOrders !== undefined) {
    activeFilters.push({ id: 'orders', label: `Commandes: ${minOrders || 0} - ${maxOrders || '∞'}`, key: 'orders' });
  }
  if (minActiveAds !== undefined || maxActiveAds !== undefined) {
    activeFilters.push({ id: 'activeAds', label: `Pubs actives: ${minActiveAds || 0} - ${maxActiveAds || '∞'}`, key: 'activeAds' });
  }
  if (shopCreationDate) activeFilters.push({ id: 'shopCreation', label: `Création: ${shopCreationDate}`, key: 'shopCreation' });
  selectedCurrencies.forEach(c => activeFilters.push({ id: `currency-${c}`, label: c, key: 'currency', value: c }));
  selectedPixels.forEach(p => activeFilters.push({ id: `pixel-${p}`, label: p, key: 'pixel', value: p }));
  selectedOrigins.forEach(o => activeFilters.push({ id: `origin-${o}`, label: o, key: 'origin', value: o }));
  selectedLanguages.forEach(l => activeFilters.push({ id: `language-${l}`, label: l, key: 'language', value: l }));
  selectedDomains.forEach(d => activeFilters.push({ id: `domain-${d}`, label: d, key: 'domain', value: d }));
  if (minTrustpilotRating !== undefined || maxTrustpilotRating !== undefined || minTrustpilotReviews !== undefined || maxTrustpilotReviews !== undefined) {
    activeFilters.push({ id: 'trustpilot', label: `Trustpilot: ${minTrustpilotRating || 0}★ - ${maxTrustpilotRating || 5}★`, key: 'trustpilot' });
  }
  selectedThemes.forEach(t => activeFilters.push({ id: `theme-${t}`, label: t, key: 'theme', value: t }));
  selectedApps.forEach(a => activeFilters.push({ id: `app-${a}`, label: a, key: 'app', value: a }));
  selectedSocialNetworks.forEach(s => activeFilters.push({ id: `social-${s}`, label: s, key: 'social', value: s }));
  if (minPrice !== undefined || maxPrice !== undefined) {
    activeFilters.push({ id: 'price', label: `Prix: ${minPrice || 0}€ - ${maxPrice || '∞'}€`, key: 'price' });
  }
  if (minCatalogSize !== undefined || maxCatalogSize !== undefined) {
    activeFilters.push({ id: 'catalogSize', label: `Catalogue: ${minCatalogSize || 0} - ${maxCatalogSize || '∞'}`, key: 'catalogSize' });
  }

  const removeFilter = (key: string, value?: string) => {
    if (key === 'search') { setSearchText(""); setAppliedSearchText(""); }
    else if (key === 'country' && value) setSelectedCountries(prev => prev.filter(c => c !== value));
    else if (key === 'niche' && value) setSelectedNiches(prev => prev.filter(n => n !== value));
    else if (key === 'cta' && value) setSelectedCTAs(prev => prev.filter(c => c !== value));
    else if (key === 'status') setSelectedStatus('all');
    else if (key === 'mediaType') setSelectedMediaType('');
    else if (key === 'eu') setEuTransparency(false);
    else if (key === 'traffic') { setMinTraffic(undefined); setMaxTraffic(undefined); }
    else if (key === 'trafficGrowth') { setMinTrafficGrowth(undefined); setMaxTrafficGrowth(undefined); }
    else if (key === 'revenue') { setMinRevenue(undefined); setMaxRevenue(undefined); }
    else if (key === 'orders') { setMinOrders(undefined); setMaxOrders(undefined); }
    else if (key === 'activeAds') { setMinActiveAds(undefined); setMaxActiveAds(undefined); }
    else if (key === 'shopCreation') setShopCreationDate(undefined);
    else if (key === 'currency' && value) setSelectedCurrencies(prev => prev.filter(c => c !== value));
    else if (key === 'pixel' && value) setSelectedPixels(prev => prev.filter(p => p !== value));
    else if (key === 'origin' && value) setSelectedOrigins(prev => prev.filter(o => o !== value));
    else if (key === 'language' && value) setSelectedLanguages(prev => prev.filter(l => l !== value));
    else if (key === 'domain' && value) setSelectedDomains(prev => prev.filter(d => d !== value));
    else if (key === 'trustpilot') { setMinTrustpilotRating(undefined); setMaxTrustpilotRating(undefined); setMinTrustpilotReviews(undefined); setMaxTrustpilotReviews(undefined); }
    else if (key === 'theme' && value) setSelectedThemes(prev => prev.filter(t => t !== value));
    else if (key === 'app' && value) setSelectedApps(prev => prev.filter(a => a !== value));
    else if (key === 'social' && value) setSelectedSocialNetworks(prev => prev.filter(s => s !== value));
    else if (key === 'price') { setMinPrice(undefined); setMaxPrice(undefined); }
    else if (key === 'catalogSize') { setMinCatalogSize(undefined); setMaxCatalogSize(undefined); }
    setTimeout(handleApplyFilters, 0);
  };

  return (
    <>
      <ToastAlerts alerts={toastAlerts} onDismiss={dismissToast} onViewShop={handleViewShop} />

      <DashboardHeader
        title="Top Publicités"
        subtitle="Découvrez les meilleures publicités identifiées par notre IA"
        showTutorialButton={true}
        onTutorialClick={() => setShowTutorialModal(true)}
        icon="ri-advertisement-line"
        iconType="icon"
        showStats={false}
        showLimitedStats={true}
      >
        <button 
          onClick={() => setSavedAdsDrawerOpen(true)}
          className="btn btn-primary d-flex align-items-center gap-2"
          style={{ backgroundColor: '#0c6cfb', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: '500' }}
        >
          <i className="ri-bookmark-line"></i>
          Publicités enregistrées
        </button>
      </DashboardHeader>

      {/* Tutorial Modal */}
      <TutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
        config={TUTORIAL_CONFIGS.ads}
      />

      <div className="bg-white home-content-wrapper">
        <div className="p-3 px-md-4">
          
          {/* Trial Alert Banner - Only show for trial users */}
          {userStats?.plan?.isOnTrial && (
            <div
              className="info-alert-box mb-3"
              style={{
                background: 'linear-gradient(90deg, #fef9e7 0%, #fef9e7 100%)',
                border: '1px solid #f9e79f',
                borderRadius: '8px',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap'
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <i className="ri-information-line" style={{ color: '#f1c40f', fontSize: '20px' }}></i>
                <span style={{ color: '#7d6608', fontSize: '14px' }}>
                  Il vous reste <strong style={{ color: '#d4ac0d' }}>5</strong> recherches avec filtres sur votre essai gratuit (<strong style={{ color: '#d4ac0d' }}>{userStats.plan.trialDaysRemaining} jours</strong>).
                </span>
              </div>
              <Link href="/dashboard/plans" className="btn btn-primary btn-sm fw-500" style={{ whiteSpace: 'nowrap', padding: '8px 16px' }}>
                Débloquer l&apos;accès complet
              </Link>
            </div>
          )}
          
          {/* Search Bar */}
          <div className="mb-3 pb-1 d-flex gap-2 pt-2 flex-wrap flex-sm-nowrap">
            <div className="mb-0 form-control-w-icon position-relative d-flex align-items-center" style={{ flex: '1 1 auto', minWidth: 0 }}>
              <img src="/img/search-icon.svg" className="form-control-icon position-absolute" style={{ zIndex: 1, left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px' }} alt="" />
              <Input
                type="text"
                className="form-control design-2"
                style={{ paddingLeft: '38px', height: '40px', width: '100%' }}
                placeholder="Rechercher par mots clés..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button type="button" className="btn btn-primary apply-filters-btn" style={{ height: '40px', flexShrink: 0 }} onClick={handleSearch}>
              Rechercher
            </Button>
          </div>

          {/* Presets */}
          <div   >
            <p className="text-uppercase fs-xs text-light-gray fw-500 mb-2">PRÉRÉGLAGES INTELLIGENTS</p>
            <div className="d-flex align-items-start mb-4" id="filter-box">
              <div className="d-flex w-100 overflow-auto me-4 filter-tag-box">
                <ul className="nav nav-pills d-flex flex-nowrap gap-2" role="tablist" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li className="nav-item" role="presentation">
                    <button className={`btn p-0 smart-filter-preset ${activePreset === 'fr_market' ? 'active' : ''}`} type="button" onClick={() => applyPreset('fr_market')}>
                      <div className={`filter-tag ${activePreset === 'fr_market' ? 'active' : ''}`}>
                        <span className="fi fi-fr" style={{ width: '16px', height: '12px', borderRadius: '2px' }}></span>
                        <span className="ms-1">Marché FR</span>
                      </div>
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className={`btn p-0 smart-filter-preset ${activePreset === 'recent_winners' ? 'active' : ''}`} type="button" onClick={() => applyPreset('recent_winners')}>
                      <div className={`filter-tag ${activePreset === 'recent_winners' ? 'active' : ''}`}>
                        <span>🔥</span>
                        <span className="ms-1">Récents Winner</span>
                      </div>
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className={`btn p-0 smart-filter-preset ${activePreset === 'us_market' ? 'active' : ''}`} type="button" onClick={() => applyPreset('us_market')}>
                      <div className={`filter-tag ${activePreset === 'us_market' ? 'active' : ''}`}>
                        <span className="fi fi-us" style={{ width: '16px', height: '12px', borderRadius: '2px' }}></span>
                        <span className="ms-1">Marché US</span>
                      </div>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Filters Grid */}
          <div   >
            <p className="text-uppercase fs-xs text-light-gray fw-500 mb-2 mt-1">FILTRES</p>
            <div className="filters-grid mb-3">
              {/* Filtres spécifiques aux publicités */}
              <PerformanceScoreFilter 
                selectedScores={selectedPerformanceScores} 
                onScoresChange={setSelectedPerformanceScores} 
                onOpenChange={() => {}} 
                onApply={handleApplyFilters} 
                isActive={selectedPerformanceScores.length > 0} 
              />
              <CTAsFilter selectedCTAs={selectedCTAs} onCTAsChange={setSelectedCTAs} onOpenChange={() => {}} onApply={handleApplyFilters} isActive={selectedCTAs.length > 0} />
              
              {/* Type de média - Radio style */}
              <FilterDropdown icon="ri-video-line" label="Type de média" title="Type de média" width="250px" isActive={!!selectedMediaType}>
                <div className="mb-3">
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="radio" name="mediaType" id="mediaAll" value="" checked={!selectedMediaType} onChange={() => setSelectedMediaType("")} />
                    <label className="form-check-label fs-small" htmlFor="mediaAll">Tout</label>
                  </div>
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="radio" name="mediaType" id="mediaImage" value="image" checked={selectedMediaType === "image"} onChange={(e) => setSelectedMediaType(e.target.value)} />
                    <label className="form-check-label fs-small" htmlFor="mediaImage">Image</label>
                  </div>
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="radio" name="mediaType" id="mediaVideo" value="video" checked={selectedMediaType === "video"} onChange={(e) => setSelectedMediaType(e.target.value)} />
                    <label className="form-check-label fs-small" htmlFor="mediaVideo">Vidéo</label>
                  </div>
                </div>
                <FilterApplyButton onClick={handleApplyFilters}>Appliquer les filtres</FilterApplyButton>
              </FilterDropdown>
              
              {/* Statut Publicité - Radio style */}
              <FilterDropdown icon="ri-checkbox-circle-line" label="Statut Publicité" title="Statut Publicité" width="250px" isActive={selectedStatus !== 'all'}>
                <div className="mb-3">
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="radio" name="adStatus" id="statusAll" value="all" checked={selectedStatus === "all"} onChange={(e) => setSelectedStatus(e.target.value)} />
                    <label className="form-check-label fs-small" htmlFor="statusAll">Tout</label>
                  </div>
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="radio" name="adStatus" id="statusActive" value="active" checked={selectedStatus === "active"} onChange={(e) => setSelectedStatus(e.target.value)} />
                    <label className="form-check-label fs-small" htmlFor="statusActive">Actif</label>
                  </div>
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="radio" name="adStatus" id="statusInactive" value="inactive" checked={selectedStatus === "inactive"} onChange={(e) => setSelectedStatus(e.target.value)} />
                    <label className="form-check-label fs-small" htmlFor="statusInactive">Inactif</label>
                  </div>
                </div>
                <FilterApplyButton onClick={handleApplyFilters}>Appliquer les filtres</FilterApplyButton>
              </FilterDropdown>

              {/* Filtres communs avec Top Boutiques/Produits */}
              <ProductsFilter
                minPrice={minPrice}
                maxPrice={maxPrice}
                minCatalogSize={minCatalogSize}
                maxCatalogSize={maxCatalogSize}
                onMinPriceChange={setMinPrice}
                onMaxPriceChange={setMaxPrice}
                onMinCatalogSizeChange={setMinCatalogSize}
                onMaxCatalogSizeChange={setMaxCatalogSize}
                onOpenChange={() => {}}
                onApply={handleApplyFilters}
                isActive={minPrice !== undefined || maxPrice !== undefined || minCatalogSize !== undefined || maxCatalogSize !== undefined}
              />
              <TrafficGrowthFilter
                minTrafficGrowth={minTrafficGrowth}
                maxTrafficGrowth={maxTrafficGrowth}
                onMinTrafficGrowthChange={setMinTrafficGrowth}
                onMaxTrafficGrowthChange={setMaxTrafficGrowth}
                onOpenChange={() => {}}
                onApply={(overrideFilters) => {
                  if (overrideFilters) {
                    // Transform minTrafficGrowth/maxTrafficGrowth to minGrowth/maxGrowth for API
                    handleApplyFilters({
                      minGrowth: overrideFilters.minTrafficGrowth,
                      maxGrowth: overrideFilters.maxTrafficGrowth
                    });
                  } else {
                    handleApplyFilters();
                  }
                }}
                isActive={minTrafficGrowth !== undefined || maxTrafficGrowth !== undefined}
              />
              <MonthlyVisitsFilter
                minTraffic={minTraffic}
                maxTraffic={maxTraffic}
                onMinTrafficChange={setMinTraffic}
                onMaxTrafficChange={setMaxTraffic}
                onOpenChange={() => {}}
                onApply={(overrideFilters) => {
                  if (overrideFilters) {
                    // Transform minTraffic/maxTraffic to minVisits/maxVisits for API
                    handleApplyFilters({
                      minVisits: overrideFilters.minTraffic,
                      maxVisits: overrideFilters.maxTraffic
                    });
                  } else {
                    handleApplyFilters();
                  }
                }}
                isActive={minTraffic !== undefined || maxTraffic !== undefined}
              />
              <ActiveAdsFilter 
                minActiveAds={minActiveAds} 
                maxActiveAds={maxActiveAds} 
                onMinActiveAdsChange={setMinActiveAds}
                onMaxActiveAdsChange={setMaxActiveAds}
                onOpenChange={() => {}} 
                onApply={handleApplyFilters} 
                isActive={minActiveAds !== undefined || maxActiveAds !== undefined} 
              />
              <ShopCreationFilter
                selectedDate={shopCreationDate}
                onDateChange={setShopCreationDate}
                onOpenChange={() => {}}
                onApply={handleApplyFilters}
                isActive={!!shopCreationDate}
              />
              <MarketsFilter 
                selectedCountries={selectedCountries} 
                onCountriesChange={setSelectedCountries} 
                onOpenChange={() => {}} 
                onApply={handleApplyFilters} 
                isActive={selectedCountries.length > 0} 
              />
              <NicheDropdown 
                selectedNiches={selectedNiches} 
                onNichesChange={setSelectedNiches} 
                onApply={handleApplyFilters} 
                isActive={selectedNiches.length > 0} 
              />
              <MonthlyOrdersFilter
                minOrders={minOrders}
                maxOrders={maxOrders}
                onMinOrdersChange={setMinOrders}
                onMaxOrdersChange={setMaxOrders}
                onOpenChange={() => {}}
                onApply={handleApplyFilters}
                isActive={minOrders !== undefined || maxOrders !== undefined}
              />
              <DailyRevenueFilter
                minRevenue={minRevenue}
                maxRevenue={maxRevenue}
                onMinRevenueChange={setMinRevenue}
                onMaxRevenueChange={setMaxRevenue}
                onOpenChange={() => {}}
                onApply={handleApplyFilters}
                isActive={minRevenue !== undefined || maxRevenue !== undefined}
              />
              <CurrencyFilter
                selectedCurrencies={selectedCurrencies}
                onCurrenciesChange={setSelectedCurrencies}
                onOpenChange={() => {}}
                onApply={handleApplyFilters}
                isActive={selectedCurrencies.length > 0}
              />
              <PixelsFilter
                selectedPixels={selectedPixels}
                onPixelsChange={setSelectedPixels}
                onOpenChange={() => {}}
                onApply={handleApplyFilters}
                isActive={selectedPixels.length > 0}
              />
              <OriginFilter
                selectedOrigins={selectedOrigins}
                onOriginsChange={setSelectedOrigins}
                onOpenChange={() => {}}
                onApply={handleApplyFilters}
                isActive={selectedOrigins.length > 0}
              />
              <LanguageFilter
                selectedLanguages={selectedLanguages}
                onLanguagesChange={setSelectedLanguages}
                onOpenChange={() => {}}
                onApply={handleApplyFilters}
                isActive={selectedLanguages.length > 0}
              />
              <DomainFilter
                selectedDomains={selectedDomains}
                onDomainsChange={setSelectedDomains}
                onOpenChange={() => {}}
                onApply={handleApplyFilters}
                isActive={selectedDomains.length > 0}
              />
              <TrustpilotFilter
                minRating={minTrustpilotRating}
                maxRating={maxTrustpilotRating}
                minReviews={minTrustpilotReviews}
                maxReviews={maxTrustpilotReviews}
                onMinRatingChange={setMinTrustpilotRating}
                onMaxRatingChange={setMaxTrustpilotRating}
                onMinReviewsChange={setMinTrustpilotReviews}
                onMaxReviewsChange={setMaxTrustpilotReviews}
                onOpenChange={() => {}}
                onApply={handleApplyFilters}
                isActive={minTrustpilotRating !== undefined || maxTrustpilotRating !== undefined || minTrustpilotReviews !== undefined || maxTrustpilotReviews !== undefined}
              />
              <ThemesFilter
                selectedThemes={selectedThemes}
                onThemesChange={setSelectedThemes}
                onOpenChange={() => {}}
                onApply={handleApplyFilters}
                isActive={selectedThemes.length > 0}
              />
              <ApplicationsFilter
                selectedApplications={selectedApps}
                onApplicationsChange={setSelectedApps}
                onOpenChange={() => {}}
                onApply={handleApplyFilters}
                isActive={selectedApps.length > 0}
              />
              <SocialNetworksFilter
                selectedSocialNetworks={selectedSocialNetworks}
                onSocialNetworksChange={setSelectedSocialNetworks}
                onOpenChange={() => {}}
                onApply={handleApplyFilters}
                isActive={selectedSocialNetworks.length > 0}
              />
            </div>

            {/* Active Filters Tags - Like Top Products */}
            {activeFilters.length > 0 && (
              <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                {activeFilters.map((filter) => (
                  <div 
                    key={filter.id} 
                    className="d-flex align-items-center gap-1" 
                    style={{ 
                      backgroundColor: 'rgba(12, 108, 251, 0.1)', 
                      border: '1px solid rgba(12, 108, 251, 0.3)',
                      color: '#0c6cfb',
                      padding: '6px 10px',
                      borderRadius: '20px',
                      fontSize: '13px',
                    }}
                  >
                    <i className="ri-price-tag-3-line" style={{ fontSize: '12px' }}></i>
                    <span>{filter.label}</span>
                    <button 
                      type="button"
                      onClick={() => removeFilter(filter.key, filter.value)}
                      style={{ background: 'none', border: 'none', color: '#0c6cfb', padding: 0, marginLeft: '4px', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={resetFilters}
                  style={{
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    border: '1px solid rgba(220, 53, 69, 0.3)',
                    color: '#dc3545',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <i className="ri-filter-off-line"></i> Réinitialiser les filtres
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveSearchModal(true)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #0c6cfb',
                    color: '#0c6cfb',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <i className="ri-save-line"></i> Enregistrer les filtres
                </button>
              </div>
            )}

            {/* Saved Searches Display */}
            {savedSearches.length > 0 && (
              <div className="d-flex align-items-center gap-2 mt-3 flex-wrap">
                <span style={{ 
                  backgroundColor: '#8B5CF6', 
                  color: '#fff', 
                  padding: '6px 12px', 
                  borderRadius: '20px', 
                  fontSize: '12px', 
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <i className="ri-bookmark-line"></i>
                  Recherches enregistrées :
                </span>
                {savedSearches.map((search) => {
                  const isActive = activeSavedSearchId === search.id;
                  return (
                  <button
                    key={search.id}
                    type="button"
                    onClick={() => handleApplySavedSearch(search.id, search.filters)}
                    style={{
                      backgroundColor: isActive ? '#8B5CF6' : '#F3E8FF',
                      border: isActive ? '2px solid #7C3AED' : '1px solid #DDD6FE',
                      color: isActive ? '#fff' : '#7C3AED',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: isActive ? '600' : '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isActive ? '0 2px 8px rgba(139, 92, 246, 0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isActive && <i className="ri-check-line" style={{ fontSize: '14px' }}></i>}
                    {search.name}
                    <span 
                      onClick={(e) => { e.stopPropagation(); handleDeleteSavedSearch(search.id); }}
                      style={{ 
                        cursor: 'pointer', 
                        opacity: 0.7,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <i className="ri-close-line" style={{ fontSize: '14px' }}></i>
                    </span>
                  </button>
                  );
                })}
              </div>
            )}

            <div className="horizontal-solid-divider mb-4 mt-2"></div>
          </div>

          {/* EU Transparency Toggle - On its own line */}
          <div            className="mb-3"
          >
            <div className="d-flex gap-1 align-items-center justify-content-start mb-0">
              <div className="form-check form-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="euTransparency"
                  checked={euTransparency}
                  onChange={(e) => { setEuTransparency(e.target.checked); setTimeout(handleApplyFilters, 100); }}
                />
              </div>
              <label className="form-check-label text-noselect fw-500 fs-small d-flex align-items-center gap-1" htmlFor="euTransparency" style={{ cursor: 'pointer' }}>
                <span className="fi fi-eu fis" style={{ width: '16px', height: '16px', borderRadius: '50%', display: 'inline-block', fontSize: '16px', overflow: 'hidden' }}></span>
                <span>EU Transparency</span>
                <span className="badge bg-light-info ms-1 fw-500 text-info-color" style={{ fontSize: '10px', padding: '3px 6px' }}>NEW</span>
              </label>
            </div>
          </div>

          {/* Results & Sort */}
          <div className="d-flex align-items-center justify-content-between mb-4 gap-3 flex-wrap">
            {/* Left: Count */}
            <div className="d-flex align-items-center gap-3">
              <h3 className="fs-small text-sub mb-0">
                <span className="py-2 px-3 bg-weak-50 rounded" style={{ lineHeight: '36px' }}>
                  {pagination.total.toLocaleString('fr-FR')}
                </span>{' '}
                <span>Publicites disponibles</span>
              </h3>
            </div>

            {/* Right: Controls */}
            {/* Sort Selector */}
            <div className="d-flex align-items-center sort-wrapper gap-2">
              <span className="fw-500 text-sub fs-small" style={{ whiteSpace: 'nowrap' }}>
                TRIER:
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="custom-select-btn" type="button" style={{ minWidth: '200px' }}>
                    <span className="d-flex align-items-center gap-2">
                      <i className={SORT_OPTIONS.find(o => o.value === sortBy)?.icon || 'ri-sparkling-line'} style={{ color: 'var(--blue-copyfy)' }}></i>
                      {SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Pertinence'}
                    </span>
                    <i className="ri-arrow-down-s-line"></i>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="sort-dropdown-menu">
                  {SORT_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => { setSortBy(option.value); invalidateAds(); }}
                      className={`sort-dropdown-item ${sortBy === option.value ? 'active' : ''}`}
                    >
                      <i className={`sort-item-icon ${option.icon}`}></i>
                      <span className="sort-item-label">{option.label}</span>
                      {sortBy === option.value && <i className="ri-check-line sort-item-check"></i>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Sort Order Toggle */}
              <button
                type="button"
                className={`sort-order-btn ${sortOrder === 'asc' ? 'active' : ''}`}
                onClick={() => { setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc'); invalidateAds(); }}
                title={sortOrder === 'desc' ? 'Ordre decroissant - Cliquer pour croissant' : 'Ordre croissant - Cliquer pour decroissant'}
              >
                {sortOrder === 'desc' ? (
                  <i className="ri-sort-desc" style={{ fontSize: '16px' }}></i>
                ) : (
                  <i className="ri-sort-asc" style={{ fontSize: '16px' }}></i>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && <div className="alert alert-danger mb-4">{error}</div>}

          {/* Ads Grid - CSS Grid for 3 columns with Infinite Scroll */}
          <div>
            {/* Initial loading state */}
            {isLoading ? (
              <div className="ads-grid-container">
                {Array.from({ length: 9 }).map((_, i) => <AdCardSkeleton key={i} />)}
              </div>
            ) : ads.length === 0 ? (
              <div className="text-center py-5">
                <i className="ri-advertisement-line fs-1 text-muted mb-3 d-block"></i>
                <h5>Aucune publicite trouvee</h5>
                <p className="text-muted">Essayez de modifier vos filtres pour voir plus de resultats.</p>
              </div>
            ) : (
              <>
                {/* Ads Grid */}
                <div className="ads-grid-container">
                  {ads.map((ad, index) => (
                    <AdCard
                      key={`${ad.id}-${index}`}
                      ad={ad}
                      index={index}
                      isTracked={ad.shopId ? trackedShopIds.has(ad.shopId) : false}
                      onTrackShop={handleTrackShop}
                      onToggleFavorite={handleToggleFavorite}
                      getActiveDays={getActiveDays}
                      onOpenAnalytics={handleOpenAnalytics}
                    />
                  ))}
                  
                  {/* Loading more skeletons - shown inline in grid */}
                  {isFetchingNextPage && (
                    <>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <AdCardSkeleton key={`loading-${i}`} />
                      ))}
                    </>
                  )}
                </div>

                {/* Infinite scroll trigger */}
                <div ref={loadMoreRef} style={{ height: '20px', marginTop: '20px' }} />
                
                {/* Loading indicator at bottom */}
                {isFetchingNextPage && (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Chargement...</span>
                    </div>
                    <p className="text-muted mt-2 mb-0">Chargement de plus de publicités...</p>
                  </div>
                )}
                
                {/* End of results message */}
                {!hasNextPage && ads.length > 0 && (
                  <div className="text-center py-4 text-muted">
                    <i className="ri-check-double-line fs-4 d-block mb-2"></i>
                    <span>Vous avez vu toutes les {pagination.total.toLocaleString('fr-FR')} publicités</span>
                  </div>
                )}
                
                {/* Ads count info */}
                <div className="text-center py-2 text-muted fs-small">
                  <span>
                    {ads.length.toLocaleString('fr-FR')} publicités affichées sur {pagination.total.toLocaleString('fr-FR')}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Saved Ads Drawer */}
      {savedAdsDrawerOpen && (
        <>
          <div
            className="position-fixed"
            style={{ top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9998 }}
            onClick={() => setSavedAdsDrawerOpen(false)}
          />
          <div
            className="position-fixed bg-white"
            style={{ top: 0, right: 0, bottom: 0, width: '450px', maxWidth: '100vw', zIndex: 9999, boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', overflowY: 'auto' }}
          >
              <div className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0 d-flex align-items-center gap-2">
                    <i className="ri-bookmark-line"></i>
                    Publicités enregistrées
                  </h5>
                  <button className="btn btn-sm btn-light" onClick={() => setSavedAdsDrawerOpen(false)}>
                    <i className="ri-close-line"></i>
                  </button>
                </div>

                {loadingSavedAds ? (
                  <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                ) : savedAds.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="ri-bookmark-line" style={{ fontSize: '48px', color: '#ccc' }}></i>
                    <h6 className="mt-3">Aucune publicité enregistrée</h6>
                    <p className="text-muted small">Cliquez sur l&apos;icône de sauvegarde pour ajouter des publicités ici.</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {savedAds.map((ad) => (
                      <div key={ad.id} className="border rounded overflow-hidden bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                          {/* Ad Header */}
                        <div className="d-flex align-items-center gap-2 p-3 border-bottom">
                              <img 
                                src={ad.pageId ? `https://graph.facebook.com/${ad.pageId}/picture?type=square` : '/img_not_found.png'} 
                            alt=""
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                            onError={(e) => { (e.target as HTMLImageElement).src = '/img_not_found.png'; }}
                          />
                          <div className="flex-grow-1 min-w-0">
                            <h6 className="mb-0 text-truncate fs-small fw-500">{ad.pageName || ad.shopName || 'Unknown'}</h6>
                            <span className={`fs-xs ${ad.status === 'active' ? 'text-success' : 'text-secondary'}`}>
                              {ad.status === 'active' ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                          <button 
                            onClick={() => handleToggleFavorite(Number(ad.id))} 
                            className="btn btn-sm p-1"
                            style={{ color: '#dc3545', background: 'none', border: 'none' }}
                            title="Retirer des favoris"
                          >
                            <i className="ri-bookmark-fill" style={{ fontSize: '18px' }}></i>
                          </button>
                          </div>

                        {/* Ad Media */}
                        <div style={{ position: 'relative', height: '200px', background: '#f3f4f6' }}>
                          {ad.type === 'video' && ad.videoUrl ? (
                              <video 
                                controls 
                                preload="metadata"
                              poster={ad.videoPreview || ad.imageLink || undefined}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
                              >
                                <source src={ad.videoUrl} type="video/mp4" />
                              </video>
                          ) : ad.imageLink || ad.videoPreview ? (
                            <img 
                              src={ad.imageLink || ad.videoPreview} 
                              alt="" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                }}
                              />
                          ) : (
                            <div className="d-flex align-items-center justify-content-center h-100">
                              <i className="ri-image-line" style={{ fontSize: '32px', color: '#ccc' }}></i>
                            </div>
                          )}
                          {/* Media type badge */}
                          <span 
                            style={{ 
                              position: 'absolute', 
                              top: 8, 
                              left: 8, 
                              background: 'rgba(0,0,0,0.6)', 
                              color: '#fff', 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontSize: '11px',
                              textTransform: 'uppercase'
                            }}
                          >
                            {ad.type || 'image'}
                          </span>
                        </div>
                        
                        {/* Ad Body */}
                        {ad.body && (
                          <div className="px-3 py-2 border-top">
                            <p className="text-muted small mb-0" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {ad.body}
                            </p>
                            </div>
                          )}

                        {/* Ad Footer */}
                        <div className="p-3 border-top d-flex gap-2">
                              <a 
                            href={ad.shopUrl ? `https://${ad.shopUrl}` : '#'} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                            className="btn btn-sm btn-outline-secondary flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                              >
                                <i className="ri-external-link-line"></i>
                            Voir boutique
                          </a>
                          {ad.adArchiveId && (
                            <a 
                              href={`https://www.facebook.com/ads/library/?id=${ad.adArchiveId}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                              style={{ width: '36px', padding: 0 }}
                              title="Voir sur Meta"
                            >
                              <i className="ri-meta-line"></i>
                            </a>
                          )}
                          </div>
                        </div>
                    ))}
                  </div>
                )}
              </div>
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton-box {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        .ads-grid-container {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          padding-bottom: 20px;
        }
        .ads-grid-container > * {
          min-width: 0;
          overflow: hidden;
        }
        .ads-grid-container .post-wrapper img,
        .ads-grid-container .post-wrapper video {
          max-width: 100%;
          width: 100%;
          height: auto;
        }
        .ads-grid-container .post-wrapper {
          display: flex;
          flex-direction: column;
        }
        .ads-grid-container .post-box {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 250px;
        }
        .ads-grid-container .post-box video,
        .ads-grid-container .post-box img {
          width: 100%;
          height: auto;
          object-fit: contain;
        }
        /* Form switch custom styling */
        .form-check-input:checked {
          background-color: #0c6cfb;
          border-color: #0c6cfb;
        }
        @media (max-width: 1600px) {
          .ads-grid-container {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 1200px) {
          .ads-grid-container {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 768px) {
          .ads-grid-container {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>

      {/* Save Search Modal */}
      <Dialog open={showSaveSearchModal} onOpenChange={setShowSaveSearchModal}>
        <DialogContent className="sm:max-w-[450px]" style={{ padding: '24px' }}>
          <DialogTitle style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            Enregistrer la recherche sous
          </DialogTitle>
          <div>
            <Input
              type="text"
              placeholder="Entrez le nom de la recherche"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveSearch()}
              style={{ marginBottom: '16px', padding: '12px', fontSize: '14px' }}
            />
            <Button 
              onClick={handleSaveSearch}
              disabled={saveSearchLoading || !saveSearchName.trim()}
              style={{ 
                width: '100%', 
                padding: '12px', 
                fontSize: '14px', 
                fontWeight: '500',
                backgroundColor: '#3b82f6',
                color: '#fff'
              }}
            >
              {saveSearchLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '16px', lineHeight: '1.5' }}>
              Enregistrer cette recherche enregistrera la requête et tous les filtres actuellement appliqués. 
              Les résultats de vos recherches enregistrées apparaîtront dans les résultats.
            </p>
            {saveSearchSuccess && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                backgroundColor: '#DCFCE7', 
                borderRadius: '8px',
                color: '#166534',
                fontSize: '14px'
              }}>
                Search saved successfully!
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Shop Analytics Drawer */}
      <ShopAnalyticsDrawer
        isOpen={analyticsDrawerOpen}
        onClose={() => setAnalyticsDrawerOpen(false)}
        shopId={analyticsShopId}
        shopUrl={analyticsShopUrl}
        shopName={analyticsShopName}
      />

      {/* Debug Panel - Only visible in development */}
      <DebugPanel
        type="ads"
        data={ads}
        pagination={pagination}
        filters={filters}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
      />
    </>
  );
}
