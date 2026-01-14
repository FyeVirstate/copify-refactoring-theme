"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardHeader from "@/components/DashboardHeader";
import { useStats } from "@/contexts/StatsContext";
import MiniChart from "@/components/MiniChart";
import ProductHoverCard from "@/components/ProductHoverCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import NicheDropdown from "@/components/NicheDropdown";
import { Input } from "@/components/ui/input";
import {
  MarketsFilter,
  CurrencyFilter,
  ProductsFilter,
  TrafficGrowthFilter,
  MonthlyVisitsFilter,
  ActiveAdsFilter,
  DailyRevenueFilter,
  MonthlyOrdersFilter,
  PixelsFilter,
  ShopCreationFilter,
  OriginFilter,
  LanguageFilter,
  DomainFilter,
  TrustpilotFilter,
  ThemesFilter,
  ApplicationsFilter,
  SocialNetworksFilter,
} from "@/components/filters";
import { useShops, ShopsFilters } from "@/lib/hooks/use-shops";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import TutorialModal, { TUTORIAL_CONFIGS } from "@/components/TutorialModal";

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
        return { backgroundColor: '#dc3545', color: '#fff' }; // Red
      case 'success':
        return { backgroundColor: '#212529', color: '#fff' }; // Dark
      case 'info':
      default:
        return { backgroundColor: '#ffc107', color: '#212529' }; // Yellow/Warning
    }
  };

  return (
    <div className="position-fixed" style={{ top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, width: '100%', maxWidth: '600px' }}>
      
        {alerts.map((alert) => {
          const alertStyles = getAlertStyles(alert.type);
          return (
            <div
              key={alert.id}
              
              
              
              
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
            </div>
          );
        })}
      
    </div>
  );
}

// Skeleton component for loading
function ShopTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="animate-pulse">
          <TableCell className="py-4">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-gray-200 rounded" style={{ width: '80px', height: '60px' }}></div>
              <div>
                <div className="bg-gray-200 rounded mb-2" style={{ width: '120px', height: '14px' }}></div>
                <div className="bg-gray-200 rounded" style={{ width: '80px', height: '12px' }}></div>
              </div>
            </div>
          </TableCell>
          <TableCell className="py-4">
            <div className="bg-gray-200 rounded" style={{ width: '45px', height: '60px' }}></div>
          </TableCell>
          <TableCell className="py-4">
            <div className="bg-gray-200 rounded mb-2" style={{ width: '80px', height: '14px' }}></div>
            <div className="bg-gray-200 rounded" style={{ width: '100px', height: '30px' }}></div>
          </TableCell>
          <TableCell className="py-4">
            <div className="d-flex gap-2">
              <div className="bg-gray-200 rounded" style={{ width: '33px', height: '60px' }}></div>
              <div className="bg-gray-200 rounded" style={{ width: '33px', height: '60px' }}></div>
            </div>
          </TableCell>
          <TableCell className="py-4">
            <div className="bg-gray-200 rounded mb-1" style={{ width: '80px', height: '12px' }}></div>
            <div className="bg-gray-200 rounded mb-1" style={{ width: '70px', height: '12px' }}></div>
            <div className="bg-gray-200 rounded" style={{ width: '60px', height: '12px' }}></div>
          </TableCell>
          <TableCell className="py-4">
            <div className="bg-gray-200 rounded mb-2" style={{ width: '80px', height: '14px' }}></div>
            <div className="bg-gray-200 rounded" style={{ width: '100px', height: '30px' }}></div>
          </TableCell>
          <TableCell className="py-4">
            <div className="d-flex gap-1">
              <div className="bg-gray-200 rounded-circle" style={{ width: '16px', height: '16px' }}></div>
              <div className="bg-gray-200 rounded-circle" style={{ width: '16px', height: '16px' }}></div>
            </div>
          </TableCell>
          <TableCell className="py-4 text-end">
            <div className="bg-gray-200 rounded ms-auto" style={{ width: '160px', height: '36px' }}></div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function ShopsPage() {
  const router = useRouter();
  const { refreshStats } = useStats();
  const [searchText, setSearchText] = useState("");
  const [appliedSearchText, setAppliedSearchText] = useState("");
  const [analyzingShopIds, setAnalyzingShopIds] = useState<Set<number>>(new Set());
  const [trackedShopIds, setTrackedShopIds] = useState<Set<number>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<{ url: string; preview: string } | null>(null);
  const [toastAlerts, setToastAlerts] = useState<ToastAlert[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  
  const { 
    shops, 
    pagination, 
    isLoading, 
    isLoadingMore,
    hasMore,
    error, 
    fetchShops, 
    fetchMoreShops 
  } = useShops();
  
  // Filter states
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [selectedPixels, setSelectedPixels] = useState<string[]>([]);
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [selectedSocialNetworks, setSelectedSocialNetworks] = useState<string[]>([]);
  const [shopCreationDate, setShopCreationDate] = useState<string>("");
  const [sortBy, setSortBy] = useState("recommended");
  const [activePreset, setActivePreset] = useState("recommended");
  
  // Range filters
  const [minRevenue, setMinRevenue] = useState<number | undefined>();
  const [maxRevenue, setMaxRevenue] = useState<number | undefined>();
  const [minTraffic, setMinTraffic] = useState<number | undefined>();
  const [maxTraffic, setMaxTraffic] = useState<number | undefined>();
  const [minProducts, setMinProducts] = useState<number | undefined>();
  const [maxProducts, setMaxProducts] = useState<number | undefined>();
  const [minActiveAds, setMinActiveAds] = useState<number | undefined>();
  const [maxActiveAds, setMaxActiveAds] = useState<number | undefined>();
  const [minTrafficGrowth, setMinTrafficGrowth] = useState<number | undefined>();
  const [maxTrafficGrowth, setMaxTrafficGrowth] = useState<number | undefined>();
  const [minOrders, setMinOrders] = useState<number | undefined>();
  const [maxOrders, setMaxOrders] = useState<number | undefined>();
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [minCatalogSize, setMinCatalogSize] = useState<number | undefined>();
  const [maxCatalogSize, setMaxCatalogSize] = useState<number | undefined>();
  // Trustpilot filters
  const [minTrustpilotRating, setMinTrustpilotRating] = useState<number | undefined>();
  const [maxTrustpilotRating, setMaxTrustpilotRating] = useState<number | undefined>();
  const [minTrustpilotReviews, setMinTrustpilotReviews] = useState<number | undefined>();
  const [maxTrustpilotReviews, setMaxTrustpilotReviews] = useState<number | undefined>();

  // Infinite scroll ref
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Add toast alert
  const addToast = (type: ToastAlert['type'], message: string, shopUrl?: string, shopId?: number) => {
    const id = Date.now().toString();
    setToastAlerts(prev => [...prev, { id, type, message, shopUrl, shopId }]);
    
    // Don't auto-dismiss limit alerts - user needs to interact
    if (type !== 'limit') {
      setTimeout(() => {
        setToastAlerts(prev => prev.filter(a => a.id !== id));
      }, 5000);
    }
  };

  // Dismiss toast
  const dismissToast = (id: string) => {
    setToastAlerts(prev => prev.filter(a => a.id !== id));
  };

  // Build filters object
  // Build filters without useCallback to always get fresh values
  const buildFilters = (): ShopsFilters => {
    const filters: ShopsFilters = { sortBy };
    
    if (appliedSearchText) filters.search = appliedSearchText;
    if (selectedCountries.length) filters.country = selectedCountries.join(',');
    if (selectedNiches.length) filters.category = selectedNiches.join(',');
    if (selectedCurrencies.length) filters.currency = selectedCurrencies.join(',');
    if (selectedPixels.length) filters.pixels = selectedPixels.join(',');
    // Note: origins uses 'country' column (shop location)
    if (selectedOrigins.length) filters.origins = selectedOrigins.join(',');
    // Note: languages maps to 'locale' column in database
    if (selectedLanguages.length) filters.languages = selectedLanguages.join(',');
    // Note: domains searches in 'url' column
    if (selectedDomains.length) filters.domains = selectedDomains.join(',');
    // Note: themes searches in 'theme' column
    if (selectedThemes.length) filters.themes = selectedThemes.join(',');
    // Note: applications searches in 'apps' column
    if (selectedApplications.length) filters.applications = selectedApplications.join(',');
    if (shopCreationDate) filters.shopCreationDate = shopCreationDate;
    if (minRevenue !== undefined) filters.minRevenue = minRevenue;
    if (maxRevenue !== undefined) filters.maxRevenue = maxRevenue;
    if (minTraffic !== undefined) filters.minTraffic = minTraffic;
    if (maxTraffic !== undefined) filters.maxTraffic = maxTraffic;
    if (minProducts !== undefined) filters.minProducts = minProducts;
    if (maxProducts !== undefined) filters.maxProducts = maxProducts;
    if (minActiveAds !== undefined) filters.minActiveAds = minActiveAds;
    if (maxActiveAds !== undefined) filters.maxActiveAds = maxActiveAds;
    if (minTrafficGrowth !== undefined) filters.minTrafficGrowth = minTrafficGrowth;
    if (maxTrafficGrowth !== undefined) filters.maxTrafficGrowth = maxTrafficGrowth;
    if (minOrders !== undefined) filters.minOrders = minOrders;
    if (maxOrders !== undefined) filters.maxOrders = maxOrders;
    if (minPrice !== undefined) filters.minPrice = minPrice;
    if (maxPrice !== undefined) filters.maxPrice = maxPrice;
    if (minCatalogSize !== undefined) filters.minCatalogSize = minCatalogSize;
    if (maxCatalogSize !== undefined) filters.maxCatalogSize = maxCatalogSize;
    // Note: Trustpilot filters are not yet supported by the API but we include them for future use
    // if (minTrustpilotRating !== undefined) filters.minTrustpilotRating = minTrustpilotRating;
    // if (maxTrustpilotRating !== undefined) filters.maxTrustpilotRating = maxTrustpilotRating;
    // if (minTrustpilotReviews !== undefined) filters.minTrustpilotReviews = minTrustpilotReviews;
    // if (maxTrustpilotReviews !== undefined) filters.maxTrustpilotReviews = maxTrustpilotReviews;
    
    return filters;
  };

  // Fetch shops when component mounts
  useEffect(() => {
    fetchShops({ sortBy: 'recommended' }, 1, 20);
  }, []);

  // Fetch tracked shops to know which are already being tracked
  useEffect(() => {
    const fetchTrackedShops = async () => {
      try {
        const res = await fetch('/api/track?page=1&perPage=100');
        const data = await res.json();
        if (data.success && data.data) {
          const ids = new Set<number>(data.data.map((item: { shopId: number }) => item.shopId));
          setTrackedShopIds(ids);
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

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          fetchMoreShops(buildFilters());
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, fetchMoreShops, buildFilters]);

  // Handle search
  const handleSearch = () => {
    setAppliedSearchText(searchText);
    fetchShops({ ...buildFilters(), search: searchText }, 1, 20);
  };

  // Handle sort change
  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setActivePreset('');
    fetchShops({ ...buildFilters(), sortBy: newSortBy }, 1, 20);
  };

  // Handle filter apply - optionally accept override values for immediate updates
  const handleApplyFilters = (overrideFilters?: Partial<ShopsFilters>) => {
    const filters = { ...buildFilters(), ...overrideFilters };
    fetchShops(filters, 1, 20);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchText("");
    setAppliedSearchText("");
    setSelectedCountries([]);
    setSelectedNiches([]);
    setSelectedCurrencies([]);
    setSelectedPixels([]);
    setSelectedOrigins([]);
    setSelectedLanguages([]);
    setSelectedDomains([]);
    setSelectedThemes([]);
    setSelectedApplications([]);
    setSelectedSocialNetworks([]);
    setShopCreationDate("");
    setMinRevenue(undefined);
    setMaxRevenue(undefined);
    setMinTraffic(undefined);
    setMaxTraffic(undefined);
    setMinProducts(undefined);
    setMaxProducts(undefined);
    setMinActiveAds(undefined);
    setMaxActiveAds(undefined);
    setMinTrafficGrowth(undefined);
    setMaxTrafficGrowth(undefined);
    setMinOrders(undefined);
    setMaxOrders(undefined);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setMinCatalogSize(undefined);
    setMaxCatalogSize(undefined);
    setMinTrustpilotRating(undefined);
    setMaxTrustpilotRating(undefined);
    setMinTrustpilotReviews(undefined);
    setMaxTrustpilotReviews(undefined);
    setSortBy("recommended");
    setActivePreset("recommended");
    fetchShops({ sortBy: 'recommended' }, 1, 20);
  };

  // Smart preset handlers
  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    let filters: ShopsFilters = {};
    
    // Reset all filters first
    setSelectedCountries([]);
    setSelectedNiches([]);
    setSelectedCurrencies([]);
    setSelectedPixels([]);
    setSelectedOrigins([]);
    setSelectedLanguages([]);
    setSelectedDomains([]);
    setSelectedThemes([]);
    setSelectedApplications([]);
    setSelectedSocialNetworks([]);
    setShopCreationDate("");
    setMinRevenue(undefined);
    setMaxRevenue(undefined);
    setMinTraffic(undefined);
    setMaxTraffic(undefined);
    setMinProducts(undefined);
    setMaxProducts(undefined);
    setMinTrafficGrowth(undefined);
    setMaxTrafficGrowth(undefined);
    setMinActiveAds(undefined);
    setMaxActiveAds(undefined);
    
    switch (preset) {
      case 'us_market':
        filters.country = 'US';
        filters.sortBy = 'recommended';
        setSelectedCountries(['US']);
        break;
      case 'eu_market':
        filters.country = 'FR,DE,GB,IT,ES,NL,BE';
        filters.sortBy = 'recommended';
        setSelectedCountries(['FR', 'DE', 'GB', 'IT', 'ES', 'NL', 'BE']);
        break;
      case 'active_ads':
        filters.minActiveAds = 10;
        filters.sortBy = 'activeAds';
        setMinActiveAds(10);
        break;
      case 'new_shops':
        filters.sortBy = 'newest';
        break;
      case 'most_traffic':
        filters.sortBy = 'traffic';
        filters.minTraffic = 50000;
        setMinTraffic(50000);
        break;
      case 'dropshipping':
        filters.minProducts = 1;
        filters.maxProducts = 50;
        filters.sortBy = 'recommended';
        setMinProducts(1);
        setMaxProducts(50);
        break;
      case 'traffic_growth':
        filters.sortBy = 'trafficGrowth';
        filters.minTrafficGrowth = 50;
        setMinTrafficGrowth(50);
        break;
    }
    
    setSortBy(filters.sortBy || 'recommended');
    fetchShops(filters, 1, 20);
  };

  // Handle analyze shop - NO REDIRECT, just toast - supports multiple parallel analyses
  const handleAnalyzeShop = async (shopId: number, shopUrl: string) => {
    // Add to analyzing set (allows multiple)
    setAnalyzingShopIds(prev => new Set(prev).add(shopId));
    
    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Add to tracked shops set
        setTrackedShopIds(prev => new Set(prev).add(shopId));
        addToast('success', `${shopUrl} a été ajouté à la liste de vos boutiques suivies`, shopUrl, shopId);
        // Refresh navbar stats
        refreshStats();
      } else if (data.error === 'Already tracking') {
        // Also add to tracked (in case we missed it)
        setTrackedShopIds(prev => new Set(prev).add(shopId));
        addToast('info', `${shopUrl} est déjà dans votre liste de boutiques suivies`, shopUrl, shopId);
      } else if (data.limitReached) {
        addToast('limit', 'Vous avez atteint la limite maximale de boutique à suivre avec votre abonnement.');
      } else {
        addToast('error', data.message || 'Erreur lors de l\'analyse de la boutique');
      }
    } catch (err) {
      console.error('Failed to analyze shop:', err);
      addToast('error', 'Erreur lors de l\'analyse de la boutique');
    } finally {
      // Remove from analyzing set
      setAnalyzingShopIds(prev => {
        const next = new Set(prev);
        next.delete(shopId);
        return next;
      });
    }
  };

  // View shop details
  const handleViewShop = (shopId: number) => {
    router.push(`/dashboard/track/${shopId}`);
  };

  // Format number
  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "-";
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  // Interface for active filters
  interface ActiveFilter {
    id: string;
    label: string;
    value: string;
    type: string;
    icon?: string;
  }

  // Build active filters for display - matching products page style
  const buildActiveFilters = (): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];
    
    // Search text
    if (appliedSearchText) {
      filters.push({ id: 'search', label: '', value: appliedSearchText, type: 'search', icon: 'ri-search-line' });
    }
    
    // Range filters
    if (minRevenue !== undefined || maxRevenue !== undefined) {
      filters.push({ 
        id: 'revenue', label: '', 
        value: `$${minRevenue || 0} - ${maxRevenue ? '$' + maxRevenue.toLocaleString() : 'Max'}`, 
        type: 'revenue', icon: 'ri-money-dollar-circle-line' 
      });
    }
    if (minTraffic !== undefined || maxTraffic !== undefined) {
      filters.push({ 
        id: 'traffic', label: '', 
        value: `${(minTraffic || 0).toLocaleString()} - ${maxTraffic ? maxTraffic.toLocaleString() : 'Max'}`, 
        type: 'traffic', icon: 'ri-group-line' 
      });
    }
    if (minProducts !== undefined || maxProducts !== undefined) {
      filters.push({ 
        id: 'products', label: '', 
        value: `${minProducts || 0} - ${maxProducts || 'Max'} produits`, 
        type: 'products', icon: 'ri-price-tag-3-line' 
      });
    }
    if (minActiveAds !== undefined || maxActiveAds !== undefined) {
      filters.push({ 
        id: 'activeAds', label: '', 
        value: `${minActiveAds || 0} - ${maxActiveAds || 'Max'} pubs`, 
        type: 'activeAds', icon: 'ri-megaphone-line' 
      });
    }
    if (minTrafficGrowth !== undefined || maxTrafficGrowth !== undefined) {
      filters.push({ 
        id: 'trafficGrowth', label: '', 
        value: `${minTrafficGrowth || 0}% - ${maxTrafficGrowth || 'Max'}%`, 
        type: 'trafficGrowth', icon: 'ri-line-chart-line' 
      });
    }
    if (minOrders !== undefined || maxOrders !== undefined) {
      filters.push({ 
        id: 'orders', label: '', 
        value: `${(minOrders || 0).toLocaleString()} - ${maxOrders ? maxOrders.toLocaleString() : 'Max'} cmd/mois`, 
        type: 'orders', icon: 'ri-shopping-cart-line' 
      });
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      filters.push({ 
        id: 'price', label: '', 
        value: `$${minPrice || 0} - ${maxPrice ? '$' + maxPrice : 'Max'}`, 
        type: 'price', icon: 'ri-price-tag-3-line' 
      });
    }
    if (minCatalogSize !== undefined || maxCatalogSize !== undefined) {
      filters.push({ 
        id: 'catalogSize', label: '', 
        value: `${minCatalogSize || 0} - ${maxCatalogSize || 'Max'} produits`, 
        type: 'catalogSize', icon: 'ri-shopping-bag-3-line' 
      });
    }
    if (minTrustpilotRating !== undefined || maxTrustpilotRating !== undefined || 
        minTrustpilotReviews !== undefined || maxTrustpilotReviews !== undefined) {
      let trustpilotValue = '';
      if (minTrustpilotRating !== undefined || maxTrustpilotRating !== undefined) {
        trustpilotValue += `${minTrustpilotRating || 0}★ - ${maxTrustpilotRating || 5}★`;
      }
      if (minTrustpilotReviews !== undefined || maxTrustpilotReviews !== undefined) {
        if (trustpilotValue) trustpilotValue += ', ';
        trustpilotValue += `${minTrustpilotReviews || 0} - ${maxTrustpilotReviews || '∞'} avis`;
      }
      filters.push({ 
        id: 'trustpilot', label: '', 
        value: trustpilotValue, 
        type: 'trustpilot', icon: 'ri-star-fill' 
      });
    }
    if (shopCreationDate) {
      filters.push({ id: 'creation', label: '', value: shopCreationDate, type: 'creation', icon: 'ri-calendar-line' });
    }
    
    // Array filters
    selectedCountries.forEach(c => {
      filters.push({ id: `country_${c}`, label: '', value: c, type: 'country', icon: 'ri-map-pin-line' });
    });
    selectedCurrencies.forEach(c => {
      filters.push({ id: `currency_${c}`, label: '', value: c, type: 'currency', icon: 'ri-coin-line' });
    });
    selectedNiches.forEach(n => {
      filters.push({ id: `niche_${n}`, label: '', value: n, type: 'niche', icon: 'ri-store-2-line' });
    });
    selectedPixels.forEach(p => {
      filters.push({ id: `pixel_${p}`, label: '', value: p, type: 'pixel', icon: 'ri-focus-3-line' });
    });
    selectedOrigins.forEach(o => {
      filters.push({ id: `origin_${o}`, label: '', value: o, type: 'origin', icon: 'ri-earth-line' });
    });
    selectedLanguages.forEach(l => {
      filters.push({ id: `language_${l}`, label: '', value: l, type: 'language', icon: 'ri-translate-2' });
    });
    selectedThemes.forEach(t => {
      filters.push({ id: `theme_${t}`, label: '', value: t, type: 'theme', icon: 'ri-palette-line' });
    });
    selectedApplications.forEach(a => {
      filters.push({ id: `app_${a}`, label: '', value: a, type: 'app', icon: 'ri-apps-line' });
    });
    selectedSocialNetworks.forEach(s => {
      filters.push({ id: `social_${s}`, label: '', value: s, type: 'social', icon: 'ri-share-line' });
    });
    selectedDomains.forEach(d => {
      filters.push({ id: `domain_${d}`, label: '', value: d, type: 'domain', icon: 'ri-global-line' });
    });
    
    return filters;
  };

  const activeFilters = buildActiveFilters();

  // Remove single filter
  const removeFilter = (filterId: string, filterType: string) => {
    if (filterId === 'search') {
      setSearchText('');
      setAppliedSearchText('');
    } else if (filterId === 'revenue') {
      setMinRevenue(undefined);
      setMaxRevenue(undefined);
    } else if (filterId === 'traffic') {
      setMinTraffic(undefined);
      setMaxTraffic(undefined);
    } else if (filterId === 'products') {
      setMinProducts(undefined);
      setMaxProducts(undefined);
    } else if (filterId === 'activeAds') {
      setMinActiveAds(undefined);
      setMaxActiveAds(undefined);
    } else if (filterId === 'trafficGrowth') {
      setMinTrafficGrowth(undefined);
      setMaxTrafficGrowth(undefined);
    } else if (filterId === 'orders') {
      setMinOrders(undefined);
      setMaxOrders(undefined);
    } else if (filterId === 'price') {
      setMinPrice(undefined);
      setMaxPrice(undefined);
    } else if (filterId === 'catalogSize') {
      setMinCatalogSize(undefined);
      setMaxCatalogSize(undefined);
    } else if (filterId === 'trustpilot') {
      setMinTrustpilotRating(undefined);
      setMaxTrustpilotRating(undefined);
      setMinTrustpilotReviews(undefined);
      setMaxTrustpilotReviews(undefined);
    } else if (filterId === 'creation') {
      setShopCreationDate('');
    } else if (filterId.startsWith('country_')) {
      const value = filterId.replace('country_', '');
      setSelectedCountries(prev => prev.filter(c => c !== value));
    } else if (filterId.startsWith('currency_')) {
      const value = filterId.replace('currency_', '');
      setSelectedCurrencies(prev => prev.filter(c => c !== value));
    } else if (filterId.startsWith('niche_')) {
      const value = filterId.replace('niche_', '');
      setSelectedNiches(prev => prev.filter(n => n !== value));
    } else if (filterId.startsWith('pixel_')) {
      const value = filterId.replace('pixel_', '');
      setSelectedPixels(prev => prev.filter(p => p !== value));
    } else if (filterId.startsWith('origin_')) {
      const value = filterId.replace('origin_', '');
      setSelectedOrigins(prev => prev.filter(o => o !== value));
    } else if (filterId.startsWith('language_')) {
      const value = filterId.replace('language_', '');
      setSelectedLanguages(prev => prev.filter(l => l !== value));
    } else if (filterId.startsWith('theme_')) {
      const value = filterId.replace('theme_', '');
      setSelectedThemes(prev => prev.filter(t => t !== value));
    } else if (filterId.startsWith('app_')) {
      const value = filterId.replace('app_', '');
      setSelectedApplications(prev => prev.filter(a => a !== value));
    } else if (filterId.startsWith('social_')) {
      const value = filterId.replace('social_', '');
      setSelectedSocialNetworks(prev => prev.filter(s => s !== value));
    } else if (filterId.startsWith('domain_')) {
      const value = filterId.replace('domain_', '');
      setSelectedDomains(prev => prev.filter(d => d !== value));
    }
    setTimeout(() => handleApplyFilters(), 0);
  };

  return (
    <>
      {/* Toast Alerts */}
      <ToastAlerts 
        alerts={toastAlerts} 
        onDismiss={dismissToast}
        onViewShop={handleViewShop}
      />

      <DashboardHeader
        title="Top Boutiques"
        subtitle="Découvrez les meilleures boutiques identifiées par notre IA"
        showTutorialButton={true}
        onTutorialClick={() => setShowTutorialModal(true)}
        icon="ri-store-2-line"
        iconType="icon"
        showStats={false}
        showLimitedStats={true}
      />

      {/* Tutorial Modal */}
      <TutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
        config={TUTORIAL_CONFIGS.shops}
      />

      <div className="bg-white home-content-wrapper">
        <div className="p-3 w-max-width-xl mx-auto">
          
          {/* Trial Alert Banner - Only show for trial users */}
          {userStats?.plan?.isOnTrial && (
            <div              className="info-alert-box mb-3"
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
              <div className="d-flex align-items-center gap-3">
                <span className="d-none d-md-inline" style={{ color: '#9a9a9a', fontSize: '13px' }}>
                  Pour effectuer plus de recherches, passez à la version complète.
                </span>
                <Link 
                  href="/dashboard/plans" 
                  className="btn btn-primary btn-sm fw-500"
                  style={{ whiteSpace: 'nowrap', padding: '8px 16px' }}
                >
                  Débloquer l&apos;accès complet
                </Link>
              </div>
            </div>
          )}
          
          {/* Search Bar */}
          <div            className="mb-3 pb-1 d-flex gap-2 pt-2 flex-wrap flex-sm-nowrap mobile-search-row"
            style={{ maxWidth: '100%' }}
          >
            <div className="mb-0 form-control-w-icon position-relative d-flex align-items-center" style={{ flex: '1 1 auto', minWidth: 0 }}>
              <img src="/img/search-icon.svg" className="form-control-icon position-absolute" style={{ zIndex: 1, left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px' }} alt="" />
              <Input
                type="text"
                className="form-control design-2"
                style={{ paddingLeft: '38px', height: '40px', width: '100%' }}
                placeholder="Rechercher par nom, ville, boutique, catégorie, niche..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              type="button" 
              className="btn btn-primary apply-filters-btn" 
              style={{ height: '40px', flexShrink: 0, whiteSpace: 'nowrap' }}
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
              ) : null}
              Rechercher
            </Button>
          </div>

          {/* Smart Preset Filters - Laravel Style */}
          <div            className="mb-3"
          >
            <p className="text-uppercase fs-xs text-light-gray fw-500 mb-2">PRÉRÉGLAGES INTELLIGENTS</p>
            <div className="d-flex align-items-start mb-4" id="filter-box">
              <div className="d-flex w-100 overflow-auto me-4 filter-tag-box">
                <ul className="nav nav-pills d-flex flex-nowrap gap-2" role="tablist" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li className="nav-item" role="presentation">
                    <button 
                      className={`btn p-0 smart-filter-preset ${activePreset === 'us_market' ? 'active' : ''}`} 
                      type="button" 
                      role="tab"
                      onClick={() => applyPreset('us_market')}
                    >
                      <div className={`filter-tag ${activePreset === 'us_market' ? 'active' : ''}`}>
                        <span className="fi fi-us" style={{ width: '16px', height: '12px', borderRadius: '2px' }}></span>
                        <span className="ms-1">Marché US</span>
                      </div>
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button 
                      className={`btn p-0 smart-filter-preset ${activePreset === 'eu_market' ? 'active' : ''}`} 
                      type="button" 
                      role="tab"
                      onClick={() => applyPreset('eu_market')}
                    >
                      <div className={`filter-tag ${activePreset === 'eu_market' ? 'active' : ''}`}>
                        <span className="fi fi-eu" style={{ width: '16px', height: '12px', borderRadius: '2px' }}></span>
                        <span className="ms-1">Marché Européen</span>
                      </div>
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button 
                      className={`btn p-0 smart-filter-preset ${activePreset === 'active_ads' ? 'active' : ''}`} 
                      type="button" 
                      role="tab"
                      onClick={() => applyPreset('active_ads')}
                    >
                      <div className={`filter-tag ${activePreset === 'active_ads' ? 'active' : ''}`}>
                        <span style={{ fontSize: '1.1em' }}>🔵</span>
                        <span className="ms-1">Pub actives</span>
                      </div>
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button 
                      className={`btn p-0 smart-filter-preset ${activePreset === 'new_shops' ? 'active' : ''}`} 
                      type="button" 
                      role="tab"
                      onClick={() => applyPreset('new_shops')}
                    >
                      <div className={`filter-tag ${activePreset === 'new_shops' ? 'active' : ''}`}>
                        <span style={{ fontSize: '1.1em' }}>🔥</span>
                        <span className="ms-1">Nouvelles boutiques</span>
                      </div>
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button 
                      className={`btn p-0 smart-filter-preset ${activePreset === 'most_traffic' ? 'active' : ''}`} 
                      type="button" 
                      role="tab"
                      onClick={() => applyPreset('most_traffic')}
                    >
                      <div className={`filter-tag ${activePreset === 'most_traffic' ? 'active' : ''}`}>
                        <span style={{ fontSize: '1.1em' }}>💰</span>
                        <span className="ms-1">Plus de trafic</span>
                      </div>
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button 
                      className={`btn p-0 smart-filter-preset ${activePreset === 'dropshipping' ? 'active' : ''}`} 
                      type="button" 
                      role="tab"
                      onClick={() => applyPreset('dropshipping')}
                    >
                      <div className={`filter-tag ${activePreset === 'dropshipping' ? 'active' : ''}`}>
                        <span style={{ fontSize: '1.1em' }}>🛒</span>
                        <span className="ms-1">Dropshipping</span>
                      </div>
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button 
                      className={`btn p-0 smart-filter-preset ${activePreset === 'traffic_growth' ? 'active' : ''}`} 
                      type="button" 
                      role="tab"
                      onClick={() => applyPreset('traffic_growth')}
                    >
                      <div className={`filter-tag ${activePreset === 'traffic_growth' ? 'active' : ''}`}>
                        <span style={{ fontSize: '1.1em' }}>📈</span>
                        <span className="ms-1">Évolution du trafic</span>
                      </div>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div
            
            
            
          >
            <p className="text-uppercase fs-xs text-light-gray fw-500 mb-2 mt-1">FILTRES</p>
            <div className="filters-grid mb-4">
              {/* Row 1: Produits, Évolution du trafic, Visites mensuelles, Publicités actives, Création de la Boutique, Marchés */}
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
                onApply={handleApplyFilters}
                isActive={minTrafficGrowth !== undefined || maxTrafficGrowth !== undefined}
              />

              <MonthlyVisitsFilter 
                minTraffic={minTraffic}
                maxTraffic={maxTraffic}
                onMinTrafficChange={setMinTraffic}
                onMaxTrafficChange={setMaxTraffic}
                onOpenChange={() => {}} 
                onApply={handleApplyFilters}
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
                value={shopCreationDate}
                onChange={setShopCreationDate}
                onApply={handleApplyFilters}
                isActive={!!shopCreationDate}
              />

              <MarketsFilter 
                selectedCountries={selectedCountries}
                onCountriesChange={setSelectedCountries}
                onApply={handleApplyFilters}
                isActive={selectedCountries.length > 0}
              />
              
              {/* Row 2: Niche, Commandes mensuelles, Revenu quotidien, Devise, Pixels, Origine */}
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
                onApply={handleApplyFilters}
                isActive={selectedCurrencies.length > 0}
              />

              <PixelsFilter 
                selectedPixels={selectedPixels}
                onPixelsChange={setSelectedPixels}
                onApply={handleApplyFilters}
                isActive={selectedPixels.length > 0}
              />

              <OriginFilter
                selectedOrigins={selectedOrigins}
                onOriginsChange={setSelectedOrigins}
                onApply={handleApplyFilters}
                isActive={selectedOrigins.length > 0}
              />

              {/* Row 3: Langue, Domaine, Trustpilot, Thèmes, Applications, Réseaux sociaux */}
              <LanguageFilter
                selectedLanguages={selectedLanguages}
                onLanguagesChange={setSelectedLanguages}
                onApply={handleApplyFilters}
                isActive={selectedLanguages.length > 0}
              />

              <DomainFilter
                selectedDomains={selectedDomains}
                onDomainsChange={setSelectedDomains}
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
                onApply={handleApplyFilters}
                isActive={minTrustpilotRating !== undefined || maxTrustpilotRating !== undefined || 
                         minTrustpilotReviews !== undefined || maxTrustpilotReviews !== undefined}
              />

              <ThemesFilter
                selectedThemes={selectedThemes}
                onThemesChange={setSelectedThemes}
                onApply={handleApplyFilters}
                isActive={selectedThemes.length > 0}
              />

              <ApplicationsFilter
                selectedApplications={selectedApplications}
                onApplicationsChange={setSelectedApplications}
                onApply={handleApplyFilters}
                isActive={selectedApplications.length > 0}
              />

              <SocialNetworksFilter
                selectedSocialNetworks={selectedSocialNetworks}
                onSocialNetworksChange={setSelectedSocialNetworks}
                onApply={handleApplyFilters}
                isActive={selectedSocialNetworks.length > 0}
              />
            </div>

            {/* Active Filters Tags - Matching Products Page Style */}
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
                      fontWeight: '500'
                    }}
                  >
                    {filter.icon && <i className={filter.icon} style={{ fontSize: '14px' }}></i>}
                    <span>{filter.value}</span>
                    <button 
                      type="button"
                      onClick={() => removeFilter(filter.id, filter.type)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        padding: '0 0 0 4px',
                        cursor: 'pointer',
                        color: '#0c6cfb',
                        fontSize: '14px',
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {/* Reset Filters Button */}
                <button 
                  type="button"
                  onClick={resetFilters}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
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
                {/* Save Filters Button */}
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
          </div>

          {/* Results Count and Sort */}
          <div            className="d-flex align-items-center justify-content-between mb-4 mt-3 gap-3 flex-wrap"
          >
            <div className="d-flex align-items-center gap-3">
              <h3 className="fs-small text-sub mb-0">
                <span className="py-2 px-3 bg-weak-50 rounded" style={{ lineHeight: '36px' }}>
                  {isLoading ? "..." : formatNumber(pagination.total)}
                </span>{' '}
                <span>Boutiques disponibles</span>
              </h3>
            </div>

            <div className="d-flex align-items-center sort-wrapper gap-2">
              <label htmlFor="sortSelect" className="form-label mb-0 me-2 fw-500 text-sub fs-small" style={{ whiteSpace: 'nowrap' }}>
                TRIER: 
              </label>
              <select 
                id="sortSelect" 
                className="form-select fs-small" 
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                style={{ width: '350px', maxWidth: '100%' }}
              >
                <option value="recommended">🎯 Recommandé - Classement IA basé sur l'activité</option>
                <option value="traffic">📈 Plus de trafic</option>
                <option value="revenue">💰 Plus de revenus</option>
                <option value="activeAds">📢 Plus de publicités actives</option>
                <option value="trafficGrowth">🚀 Meilleure croissance</option>
                <option value="newest">✨ Plus récentes</option>
                <option value="productsCount">📦 Plus de produits</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger mb-4">
              {error}
            </div>
          )}

          {/* Shops Table */}
          <div            className="table-view mt-2"
          >
            {isLoading ? (
              <div className="table-wrapper" style={{ paddingBottom: '100px', overflowX: 'auto' }}>
                <Table id="shopsTable" className="table mb-0">
                  <TableHeader className="bg-weak-gray">
                    <TableRow className="border-0">
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500">Boutique</TableHead>
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500">Produit le plus vendu</TableHead>
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500">Publicités actives (90j)</TableHead>
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500" style={{ minWidth: '134px' }}>Meilleures pubs</TableHead>
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500">Part du marché</TableHead>
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500">Traffic (3 derniers mois)</TableHead>
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500">Plateformes</TableHead>
                      <TableHead className="sticky_col action_col border-0 text-center text-uppercase text-sub fs-xs fw-500" style={{ backgroundColor: '#f5f7fa', minWidth: '200px' }}>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <ShopTableSkeleton rows={10} />
                  </TableBody>
                </Table>
              </div>
            ) : shops.length === 0 ? (
              <div className="text-center py-5">
                <div className="bg-warning text-center p-2 mb-2 mx-auto rounded-8" style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ri-error-warning-line text-white fs-4"></i>
                </div>
                <h5 className="fw-600">Aucune boutique trouvée</h5>
                <p className="text-gray">Modifiez vos filtres ou votre recherche pour voir plus de résultats.</p>
              </div>
            ) : (
              <div className="table-wrapper" style={{ paddingBottom: '100px', overflowX: 'auto' }}>
                <Table id="shopsTable" className="table mb-0">
                  <TableHeader className="bg-weak-gray">
                    <TableRow className="border-0">
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500">Boutique</TableHead>
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500">Produit le plus vendu</TableHead>
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500">Publicités actives (90j)</TableHead>
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500" style={{ minWidth: '134px' }}>Meilleures pubs</TableHead>
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500">Part du marché</TableHead>
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500">Traffic (3 derniers mois)</TableHead>
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500">Plateformes</TableHead>
                      <TableHead className="sticky_col action_col border-0 text-center text-uppercase text-sub fs-xs fw-500" style={{ backgroundColor: '#f5f7fa', minWidth: '200px' }}>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shops.map((shop, index) => (
                      <TableRow
                        key={shop.id}
                        className="shop_item"
                      >
                        {/* Shop Column */}
                        <TableCell scope="row" className="align-middle py-4 border-b-gray">
                          <div className="d-flex align-items-center prod_wrapper">
                            <div className="prod_img_container position-relative">
                              {shop.position <= 3 && (
                                <div className={`position-tag position-tag--${shop.position}`}>
                                  {shop.position}
                                </div>
                              )}
                              <a 
                                href={shop.screenshot ? `https://app.copyfy.io/download/products/screenshots/${shop.screenshot}` : `https://${shop.url}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                                className="view-image"
                                onClick={(e) => {
                                  if (shop.screenshot) {
                                    e.preventDefault();
                                    setSelectedImage(`https://app.copyfy.io/download/products/screenshots/${shop.screenshot}`);
                                  }
                                }}
                              >
                                <img 
                                  className="shop-img-new" 
                                  src={shop.screenshot 
                                    ? `https://app.copyfy.io/download/products/screenshots/${shop.screenshot}` 
                                    : `https://www.google.com/s2/favicons?domain=${shop.url}&sz=64`}
                                    alt={shop.name || shop.url} 
                                  style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                                    onError={(e) => {
                                      const img = e.target as HTMLImageElement;
                                    img.src = '/img_not_found.png';
                                    }}
                                  />
                                <span className="view-icon">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                  </svg>
                                </span>
                              </a>
                                </div>
                            <div className="ms-3" style={{ minWidth: '150px' }}>
                              <a 
                                href={`https://${shop.url}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-dark btn-clear text-decoration-none"
                              >
                                <h4 className="fs-small mb-0 fw-normal">
                                  {(shop.name || shop.url)?.substring(0, 20)}{(shop.name || shop.url)?.length > 20 ? '...' : ''}
                                </h4>
                              </a>
                              <a 
                                href={`https://${shop.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sub btn-clear text-nowrap fw-normal fs-xs"
                              >
                                {shop.url?.substring(0, 18)}{shop.url?.length > 18 ? '...' : ''}
                              </a>
                              </div>
                              </div>
                        </TableCell>

                        {/* Best Product Column */}
                        <TableCell className="align-middle py-3 border-b-gray">
                          {shop.bestProduct ? (
                            <ProductHoverCard 
                              product={{
                                name: shop.bestProduct.name,
                                image: shop.bestProduct.image || '',
                                price: shop.bestProduct.price,
                                currency: shop.bestProduct.currency || '$',
                              }} 
                              productUrl={`https://${shop.url}/products/${shop.bestProduct.handle}`}
                            />
                          ) : (
                            <span className="text-muted"></span>
                          )}
                        </TableCell>

                        {/* Active Ads Column with Chart */}
                        <TableCell className="align-middle py-3 border-b-gray">
                          <div style={{ width: '120px' }}>
                            <p className="mb-0 fw-500 text-end w-100">
                              <span 
                                style={{ 
                                  display: 'inline-block',
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: shop.adsChange >= 0 ? '#10b981' : '#ef4444',
                                  marginRight: '6px',
                                  verticalAlign: 'middle'
                                }}
                              ></span>
                              <span className="fs-small">{formatNumber(shop.activeAds)}</span>
                              {shop.adsChange !== 0 && (
                                <span className={`fs-xs ${shop.adsChange >= 0 ? 'text-success' : 'text-danger'}`}>
                                  {' '}({shop.adsChange >= 0 ? '+' : ''}{formatNumber(shop.adsChange)})
                          </span>
                              )}
                            </p>
                          </div>
                          <div style={{ maxWidth: '120px' }}>
                            {shop.adsHistoryData && shop.adsHistoryData.length > 1 ? (
                              <MiniChart 
                                data={shop.adsHistoryData} 
                                trend={shop.adsChange >= 0 ? 'up' : 'down'}
                                width={120}
                                height={40}
                              />
                            ) : (
                              <div style={{ width: '120px', height: '40px' }}></div>
                            )}
                          </div>
                        </TableCell>

                        {/* Best Ads Column */}
                        <TableCell className="align-middle py-3 border-b-gray ads-column">
                          <div className="d-flex gap-2 flex-nowrap">
                            {shop.bestAds && shop.bestAds.length > 0 ? (
                              shop.bestAds.map((ad, adIndex) => (
                                <div 
                                  key={adIndex}
                                  className="video-thumbnail-wrapper flex-shrink-0 position-relative"
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => ad.video_link && setVideoData({ 
                                    url: ad.video_link, 
                                    preview: ad.video_preview_link || ad.image_link || '' 
                                  })}
                                >
                                  <img 
                                    src={ad.video_preview_link || ad.image_link || '/img_not_found.png'} 
                                    alt="Video Ad"
                                    style={{ 
                                      width: '33px', 
                                      height: '60px', 
                                      objectFit: 'cover', 
                                      borderRadius: '4px' 
                                    }}
                                    onError={(e) => {
                                      const img = e.target as HTMLImageElement;
                                      img.src = '/img_not_found.png';
                                    }}
                                  />
                                  <div 
                                    className="position-absolute d-flex align-items-center justify-content-center"
                                    style={{
                                      top: '50%',
                                      left: '50%',
                                      transform: 'translate(-50%, -50%)',
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '50%',
                                      backgroundColor: 'rgba(0,0,0,0.5)'
                                    }}
                                  >
                                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                                      <path d="M2 1.5L10 6L2 10.5V1.5Z" fill="white" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                </div>
                              ))
                            ) : null}
                          </div>
                        </TableCell>

                        {/* Market Share Column - With Flag Icons */}
                        <TableCell className="align-middle py-3 border-b-gray text-nowrap px-3">
                          {shop.marketCountries && shop.marketCountries.length > 0 ? (
                            shop.marketCountries.map((country, cIndex) => (
                              <div key={cIndex} className="d-flex align-items-center mb-1">
                                <span 
                                  className={`fi fi-${country.code.toLowerCase()}`} 
                                  style={{ 
                                    width: '18px', 
                                    height: '13px', 
                                    display: 'inline-block',
                                    marginRight: '6px',
                                    borderRadius: '2px',
                                    backgroundSize: 'cover'
                                  }}
                                ></span>
                                <span className="fs-xs fw-500">{country.code.toUpperCase()} ({country.share}%)</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-muted fs-xs">No data</span>
                          )}
                        </TableCell>

                        {/* Traffic Trend Column */}
                        <TableCell className="align-middle py-3 border-b-gray">
                          <div style={{ width: '120px' }}>
                            <p className="mb-0 fw-500 text-end w-100">
                              <span className="fs-small">{formatNumber(shop.monthlyVisits)}</span>
                              {shop.trafficGrowth !== undefined && shop.trafficGrowth !== 0 && (
                                <span className={`fs-xs ${shop.trafficGrowth >= 0 ? 'text-success' : 'text-danger'}`}>
                                  {' '}({shop.trafficGrowth >= 0 ? '+' : ''}{shop.trafficGrowth.toFixed(0)}%)
                                  </span>
                                )}
                            </p>
                              </div>
                          <div style={{ maxWidth: '120px' }}>
                            {shop.trafficData && shop.trafficData.length > 1 ? (
                              <MiniChart 
                                data={shop.trafficData} 
                                trend={shop.trafficGrowth >= 0 ? 'up' : 'down'}
                                width={120}
                                height={40}
                              />
                            ) : (
                              <div style={{ width: '120px', height: '40px' }}></div>
                            )}
                          </div>
                        </TableCell>

                        {/* Platforms Column */}
                        <TableCell className="align-middle py-3 border-b-gray">
                          <div className="d-flex gap-1">
                            {/* Social platforms would go here - for now empty */}
                          </div>
                        </TableCell>

                        {/* Actions Column - Full Button */}
                        <TableCell className="sticky_col action_col align-middle py-3 border-b-gray text-center" style={{ backgroundColor: '#fff' }}>
                          <div className="d-flex justify-content-center">
                            {trackedShopIds.has(shop.id) && !analyzingShopIds.has(shop.id) ? (
                              // Already tracked - Show "Voir l'analyse" button (BLUE)
                            <button 
                                onClick={() => handleViewShop(shop.id)}
                                className="btn d-inline-flex align-items-center gap-2"
                                style={{ 
                                  whiteSpace: 'nowrap', 
                                  padding: '8px 16px',
                                  fontSize: '13px',
                                  borderRadius: '6px',
                                  backgroundColor: '#3b82f6',
                                  color: '#fff',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  minWidth: '175px',
                                  justifyContent: 'center',
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                  <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                <span>Voir l'analyse</span>
                            </button>
                            ) : analyzingShopIds.has(shop.id) ? (
                              // Currently analyzing - Light yellow with refresh icon
                            <button
                                disabled
                                className="btn d-inline-flex align-items-center gap-2"
                                style={{ 
                                  whiteSpace: 'nowrap', 
                                  padding: '8px 16px',
                                  fontSize: '13px',
                                  borderRadius: '6px',
                                  backgroundColor: '#fef9c3',
                                  color: '#854d0e',
                                  border: '1px solid #fde047',
                                  cursor: 'not-allowed',
                                  transition: 'all 0.2s ease',
                                  minWidth: '175px',
                                  justifyContent: 'center',
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                                  <path d="M23 4v6h-6"></path>
                                  <path d="M1 20v-6h6"></path>
                                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                </svg>
                                <span>Analyse...</span>
                              </button>
                            ) : (
                              // Not tracked - Show analyze button (WHITE/original)
                              <button
                                onClick={() => handleAnalyzeShop(shop.id, shop.url)}
                                className="btn btn-secondary d-inline-flex align-items-center gap-2"
                                style={{ 
                                  whiteSpace: 'nowrap', 
                                  padding: '8px 16px',
                                  fontSize: '13px',
                                  borderRadius: '6px',
                                  minWidth: '175px',
                                  justifyContent: 'center',
                                }}
                              >
                                <img src="/img/icons/target-icon.svg" alt="" style={{ width: '14px', height: '14px' }} />
                                <span>Analyser la boutique</span>
                            </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Loading more skeleton */}
                    {isLoadingMore && <ShopTableSkeleton rows={5} />}
                  </TableBody>
                </Table>

                {/* Infinite scroll trigger */}
                <div ref={loadMoreRef} style={{ height: '20px' }}></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
          <DialogTitle className="sr-only">Aperçu de la boutique</DialogTitle>
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Shop screenshot" 
              className="w-100" 
              style={{ maxHeight: '80vh', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Video Modal - Fixed z-index and styling */}
      <Dialog open={!!videoData} onOpenChange={() => setVideoData(null)}>
        <DialogContent 
          className="p-0 overflow-hidden" 
          style={{ 
            maxWidth: '400px', 
            backgroundColor: '#000',
            border: 'none',
            borderRadius: '8px'
          }}
        >
          <DialogTitle className="sr-only">Publicité vidéo</DialogTitle>
          {videoData && (
            <video 
              controls 
              autoPlay
              preload="none"
              poster={videoData.preview}
              className="w-100"
              style={{ 
                maxHeight: '80vh',
                display: 'block'
              }}
              onError={(e) => {
                console.error('Video load error:', e);
              }}
            >
              <source src={videoData.url} type="video/mp4" />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
