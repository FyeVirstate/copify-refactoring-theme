"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MarketsFilter,
  PerformanceScoreFilter,
  DatesFilter,
  CTAsFilter,
  ActiveAdsFilter,
} from "@/components/filters";
import NicheDropdown from "@/components/NicheDropdown";
import FilterDropdown from "@/components/filters/FilterDropdown";
import { useAds, AdsFilters } from "@/lib/hooks/use-ads";

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
    <div className="position-fixed" style={{ top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, width: '100%', maxWidth: '600px' }}>
      <AnimatePresence>
        {alerts.map((alert) => {
          const alertStyles = getAlertStyles(alert.type);
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="d-flex align-items-center justify-content-between gap-3 mb-2 mx-3"
              style={{
                padding: '12px 20px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                ...alertStyles,
              }}
            >
              <div className="d-flex align-items-center gap-2">
                {alert.type === 'success' && (
                  <i className="ri-checkbox-circle-fill" style={{ fontSize: '18px', color: '#fff' }}></i>
                )}
                {(alert.type === 'error' || alert.type === 'limit') && (
                  <i className="ri-error-warning-fill" style={{ fontSize: '18px', color: '#fff' }}></i>
                )}
                {alert.type === 'info' && (
                  <i className="ri-information-fill" style={{ fontSize: '18px', color: '#212529' }}></i>
                )}
                <span style={{ fontSize: '14px', color: alertStyles.color }}>
                  {alert.message}
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                {alert.type === 'success' && alert.shopId && onViewShop && (
                  <button 
                    className="btn btn-sm" 
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}
                    onClick={() => onViewShop(alert.shopId!)}
                  >
                    Voir la boutique
                  </button>
                )}
                {(alert.type === 'error' || alert.type === 'limit') && (
                  <Link href="/dashboard/plans" className="btn btn-sm" style={{ backgroundColor: '#fff', border: 'none', color: '#212529' }}>
                    Débloquer l&apos;accès complet
                  </Link>
                )}
                {alert.type !== 'limit' && (
                  <button 
                    className="btn-close" 
                    style={{ fontSize: '10px', filter: alert.type === 'info' ? 'none' : 'invert(1)' }}
                    onClick={() => onDismiss(alert.id)}
                  ></button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
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
}

const AdCard = React.memo(function AdCard({ ad, index, isTracked: initialIsTracked, onTrackShop, onToggleFavorite, getActiveDays }: AdCardProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [isTracked, setIsTracked] = useState(initialIsTracked);
  const [isFavorited, setIsFavorited] = useState(ad.isFavorited);
  
  const activeDays = getActiveDays(ad.firstSeenDate, ad.lastSeenDate);
  
  const handleTrackClick = async () => {
    if (!ad.shopId || isTracking || isTracked) return;
    setIsTracking(true);
    try {
      const success = await onTrackShop(ad.shopId, ad.shopUrl || undefined);
      if (success) {
        setIsTracked(true);
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
    <div className="post-wrapper border-gray-thin position-relative bg-white p-0 rounded" style={{ animation: `fadeIn 0.4s ease-out ${0.03 * (index % 12)}s both` }}>
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
            <div className="d-flex align-items-center gap-1">
              <span className={`${ad.isActive ? 'bg-success' : 'bg-secondary'}`} style={{ width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block' }}></span>
              <span className={`fs-xs ${ad.isActive ? 'text-success' : 'text-secondary'} fw-normal`}>
                {ad.isActive ? `Active pendant ${activeDays} jours` : 'Inactive'}
              </span>
            </div>
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
                target.src = '/img_not_found.png';
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
              <button type="button" className="btn btn-outline-success flex-grow-1 d-flex align-items-center justify-content-center gap-1" style={{ height: '38px', fontSize: '13px' }} disabled>
                <i className="ri-check-line"></i>
                Boutique suivie
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

// Sort options
const SORT_OPTIONS = [
  { value: "recommended", label: "Recommandé - Classement IA basé sur l'activité p...", icon: "🎯" },
  { value: "most_recent", label: "Plus récentes", icon: "🔥" },
  { value: "oldest_first", label: "Plus anciennes", icon: "⏰" },
  { value: "highest_reach", label: "Meilleure portée", icon: "📈" },
  { value: "most_engaging", label: "Plus engageantes", icon: "💬" },
  { value: "highest_spend", label: "Budget le plus élevé", icon: "💰" },
  { value: "trending", label: "Tendance", icon: "🚀" },
];

// Active filter interface
interface ActiveFilter {
  id: string;
  label: string;
  key: string;
  value?: string;
}

export default function AdsPage() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [appliedSearchText, setAppliedSearchText] = useState("");
  const [activePreset, setActivePreset] = useState("");
  const [trackedShopIds, setTrackedShopIds] = useState<Set<number>>(new Set());
  const [toastAlerts, setToastAlerts] = useState<ToastAlert[]>([]);
  const [euTransparency, setEuTransparency] = useState(false);
  const [savedAdsDrawerOpen, setSavedAdsDrawerOpen] = useState(false);
  const [savedAds, setSavedAds] = useState<any[]>([]);
  const [loadingSavedAds, setLoadingSavedAds] = useState(false);
  
  // Filter states
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedCTAs, setSelectedCTAs] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedMediaType, setSelectedMediaType] = useState("");
  const [minActiveAds, setMinActiveAds] = useState<number | undefined>();
  const [maxActiveAds, setMaxActiveAds] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState("recommended");
  
  const { 
    ads, 
    pagination, 
    isLoading, 
    isLoadingMore, 
    hasMore, 
    error, 
    fetchAds, 
    fetchMoreAds, 
    toggleFavorite 
  } = useAds();
  
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Build filters
  const buildFilters = useCallback((): AdsFilters => {
    const filters: AdsFilters = { sortBy };
    if (appliedSearchText) filters.search = appliedSearchText;
    if (selectedCountries.length) filters.country = selectedCountries.join(',');
    if (selectedNiches.length) filters.category = selectedNiches.join(',');
    if (selectedCTAs.length) filters.ctas = selectedCTAs;
    if (selectedStatus !== 'all') filters.status = selectedStatus;
    if (selectedMediaType) filters.mediaType = selectedMediaType;
    if (minActiveAds !== undefined) filters.minActiveAds = minActiveAds;
    if (maxActiveAds !== undefined) filters.maxActiveAds = maxActiveAds;
    if (euTransparency) filters.euTransparency = true;
    return filters;
  }, [sortBy, appliedSearchText, selectedCountries, selectedNiches, selectedCTAs, 
      selectedStatus, selectedMediaType, minActiveAds, maxActiveAds, euTransparency]);

  // Toast functions
  const addToast = (type: ToastAlert['type'], message: string, shopUrl?: string, shopId?: number) => {
    const id = Date.now().toString();
    setToastAlerts(prev => [...prev, { id, type, message, shopUrl, shopId }]);
    if (type !== 'limit') setTimeout(() => setToastAlerts(prev => prev.filter(a => a.id !== id)), 5000);
  };

  const dismissToast = (id: string) => setToastAlerts(prev => prev.filter(a => a.id !== id));

  // Fetch ads on mount
  useEffect(() => {
    fetchAds({ sortBy: 'recommended' }, 1, 20);
  }, []);

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

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          fetchMoreAds(buildFilters());
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, fetchMoreAds, buildFilters]);

  const handleSearch = () => {
    setAppliedSearchText(searchText);
    fetchAds({ ...buildFilters(), search: searchText }, 1, 20);
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setActivePreset('');
    fetchAds({ ...buildFilters(), sortBy: newSortBy }, 1, 20);
  };

  const handleApplyFilters = () => {
    setActivePreset('');
    fetchAds(buildFilters(), 1, 20);
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
    setSortBy("recommended");
    setActivePreset("");
    setEuTransparency(false);
    fetchAds({ sortBy: 'recommended' }, 1, 20);
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
    fetchAds(config, 1, 20);
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

  const handleToggleFavorite = async (adId: number) => {
    try {
      const result = await toggleFavorite(adId);
      if (result.data.isFavorited) {
        addToast('success', 'Publicité ajoutée à vos favoris');
      } else {
        addToast('info', 'Publicité retirée de vos favoris');
      }
      if (savedAdsDrawerOpen) fetchSavedAds();
    } catch (err) {
      addToast('error', 'Erreur lors de la sauvegarde');
    }
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

  const removeFilter = (key: string, value?: string) => {
    if (key === 'search') { setSearchText(""); setAppliedSearchText(""); }
    else if (key === 'country' && value) setSelectedCountries(prev => prev.filter(c => c !== value));
    else if (key === 'niche' && value) setSelectedNiches(prev => prev.filter(n => n !== value));
    else if (key === 'cta' && value) setSelectedCTAs(prev => prev.filter(c => c !== value));
    else if (key === 'status') setSelectedStatus('all');
    else if (key === 'mediaType') setSelectedMediaType('');
    else if (key === 'eu') setEuTransparency(false);
    setTimeout(handleApplyFilters, 0);
  };

  return (
    <>
      <ToastAlerts alerts={toastAlerts} onDismiss={dismissToast} onViewShop={handleViewShop} />

      <DashboardHeader
        title="Top Publicités"
        subtitle="Découvrez les meilleures publicités identifiées par notre IA"
        showTutorialButton={true}
        onTutorialClick={() => console.log("Tutoriel clicked")}
        icon="ri-advertisement-line"
        iconType="icon"
        showStats={false}
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

      <div className="bg-white home-content-wrapper">
        <div className="p-3 w-max-width-xl mx-auto">
          
          {/* Trial Alert Banner */}
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
                Il vous reste <strong style={{ color: '#d4ac0d' }}>5</strong> recherches avec filtres sur votre essai gratuit (2 jours).
              </span>
            </div>
            <Link href="/dashboard/plans" className="btn btn-primary btn-sm fw-500" style={{ whiteSpace: 'nowrap', padding: '8px 16px' }}>
              Débloquer l&apos;accès complet
            </Link>
          </div>
          
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
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button type="button" className="btn btn-primary apply-filters-btn" style={{ height: '40px', flexShrink: 0 }} onClick={handleSearch}>
              Rechercher
            </Button>
          </div>

          {/* Presets */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
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
          </motion.div>

          {/* Filters Grid */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <p className="text-uppercase fs-xs text-light-gray fw-500 mb-2 mt-1">FILTRES</p>
            <div className="filters-grid mb-3">
              <PerformanceScoreFilter onOpenChange={() => {}} onApply={handleApplyFilters} isActive={false} />
              <DatesFilter onOpenChange={() => {}} onApply={handleApplyFilters} isActive={false} />
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
                <Button type="button" className="btn btn-primary w-100 apply-filters-btn" onClick={handleApplyFilters}>Appliquer les filtres</Button>
              </FilterDropdown>

              <NicheDropdown selectedNiches={selectedNiches} onNichesChange={setSelectedNiches} onApply={handleApplyFilters} isActive={selectedNiches.length > 0} />
              <MarketsFilter selectedCountries={selectedCountries} onCountriesChange={setSelectedCountries} onOpenChange={() => {}} onApply={handleApplyFilters} isActive={selectedCountries.length > 0} />
              
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
                <Button type="button" className="btn btn-primary w-100 apply-filters-btn" onClick={handleApplyFilters}>Appliquer les filtres</Button>
              </FilterDropdown>

              <ActiveAdsFilter minActiveAds={minActiveAds} maxActiveAds={maxActiveAds} onActiveAdsChange={(min, max) => { setMinActiveAds(min); setMaxActiveAds(max); }} onOpenChange={() => {}} onApply={handleApplyFilters} isActive={minActiveAds !== undefined || maxActiveAds !== undefined} />
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

            <div className="horizontal-solid-divider mb-4 mt-2"></div>
          </motion.div>

          {/* EU Transparency Toggle - On its own line */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="mb-3"
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
          </motion.div>

          {/* Results & Sort */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="d-flex align-items-center justify-content-between mb-4 gap-3 flex-wrap"
          >
              <h3 className="fs-small text-sub mb-0">
                <span className="py-2 px-3 bg-weak-50 rounded" style={{ lineHeight: '36px' }}>
                {isLoading ? "..." : formatNumber(pagination.total)}
                </span>{' '}
                <span>Total des publicités</span>
              </h3>

            <div className="d-flex align-items-center sort-wrapper gap-2">
              <label htmlFor="sortSelect" className="form-label mb-0 me-2 fw-500 text-sub fs-small" style={{ whiteSpace: 'nowrap' }}>Trier:</label>
              <select 
                id="sortSelect" 
                className="form-select fs-small" 
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                style={{ width: '350px', maxWidth: '100%' }}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.icon} {option.label}</option>
                ))}
              </select>
            </div>
          </motion.div>

          {/* Error */}
          {error && <div className="alert alert-danger mb-4">{error}</div>}

          {/* Ads Grid - CSS Grid for 3 columns */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {isLoading && ads.length === 0 ? (
              <div className="ads-grid-container">
                {Array.from({ length: 9 }).map((_, i) => <AdCardSkeleton key={i} />)}
              </div>
            ) : ads.length === 0 ? (
              <div className="text-center py-5">
                <i className="ri-advertisement-line fs-1 text-muted mb-3 d-block"></i>
                <h5>Aucune publicité trouvée</h5>
                <p className="text-muted">Essayez de modifier vos filtres pour voir plus de résultats.</p>
              </div>
            ) : (
              <>
                <div className="ads-grid-container">
                  {ads.map((ad, index) => (
                    <AdCard
                      key={ad.id}
                      ad={ad}
                      index={index}
                      isTracked={ad.shopId ? trackedShopIds.has(ad.shopId) : false}
                      onTrackShop={handleTrackShop}
                      onToggleFavorite={handleToggleFavorite}
                      getActiveDays={getActiveDays}
                    />
                  ))}
                </div>

                {/* Load More - Show skeleton cards on infinite scroll */}
                <div ref={loadMoreRef} className="py-3">
                  {isLoadingMore && (
                    <div className="ads-grid-container">
                      {Array.from({ length: 3 }).map((_, i) => <AdCardSkeleton key={`loading-more-${i}`} />)}
                  </div>
                )}
                  {!hasMore && ads.length > 0 && (
                    <p className="text-muted text-center mb-0">Toutes les publicités ont été chargées</p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Saved Ads Drawer */}
      <AnimatePresence>
        {savedAdsDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="position-fixed"
              style={{ top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9998 }}
              onClick={() => setSavedAdsDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
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
            </motion.div>
              </>
            )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
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
          grid-template-columns: repeat(3, minmax(0, 1fr));
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
    </>
  );
}
