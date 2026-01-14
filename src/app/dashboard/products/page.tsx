"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DashboardHeader from "@/components/DashboardHeader";
import { useStats } from "@/contexts/StatsContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import TutorialModal, { TUTORIAL_CONFIGS } from "@/components/TutorialModal";
import NicheDropdown from "@/components/NicheDropdown";
import ProductTableSkeleton from "@/components/ProductTableSkeleton";
import {
  CurrencyFilter,
  MarketsFilter,
  DailyRevenueFilter,
  MonthlyOrdersFilter,
  TrafficGrowthFilter,
  MonthlyVisitsFilter,
  ActiveAdsFilter,
  ProductsFilter,
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
import { useProducts, ProductsFilters } from "@/lib/hooks/use-products";

// Currency symbols mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  // Add more as needed
};

interface ActiveFilter {
  id: string;
  label: string;
  value: string;
  type: string;
  icon?: string;
}

// Preset filter configurations (from Laravel)
const PRESET_CONFIGS: Record<string, Record<string, any>> = {
  recommended: {
    min_revenue: "50000",
    max_revenue: "300000",
    min_traffic: "10000",
    max_traffic: "200000",
    min_sales: "100",
    max_sales: "5000",
    min_price: "20",
    max_price: "80",
    min_traffic_growth: "10",
    max_traffic_growth: "100",
    min_active_ads: "5",
    max_active_ads: "50",
  },
  active_ads: {
    min_active_ads: "30",
    max_active_ads: "",
  },
  new_stores: {
    min_revenue: "30000",
    datefilter: (() => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      return `${String(start.getMonth() + 1).padStart(2, '0')}/${String(start.getDate()).padStart(2, '0')}/${start.getFullYear()} - ${String(end.getMonth() + 1).padStart(2, '0')}/${String(end.getDate()).padStart(2, '0')}/${end.getFullYear()}`;
    })(),
  },
  high_traffic: {
    min_price: "1",
    max_price: "",
    min_revenue: "150000",
    max_revenue: "",
  },
  growth: {
    min_traffic_growth: "30",
    max_traffic_growth: "",
    min_price: "1",
    max_price: "",
  },
};

// Sort options configuration
const SORT_OPTIONS = [
  { value: "recommended", label: "Recommandé - Classement IA pour les produits à fort potentiel", icon: "🎯" },
  { value: "estimated_order", label: "Plus De Commandes - Produits avec le plus grand volume de commandes mensuelles", icon: "📦" },
  { value: "estimated_monthly", label: "Revenus Les Plus Élevés - Boutiques les plus rentables par ventes mensuelles", icon: "💰" },
  { value: "last_month_visits", label: "Plus De Trafic - Boutiques avec le plus grand nombre de visiteurs", icon: "🚀" },
  { value: "active_ads_count", label: "Publicités Les Plus Actives - Boutiques avec le plus de campagnes publicitaires", icon: "📢" },
  { value: "best_value", label: "Meilleur Rapport Qualité-Prix - Produits à hauts revenus avec faible concurrence publicitaire", icon: "💎" },
  { value: "trending_up", label: "Tendance À La Hausse - Produits montrant une dynamique de vente positive", icon: "📈" },
  { value: "most_profitable", label: "Plus Rentables - Meilleure conversion revenus par visiteur", icon: "🎯" },
  { value: "growth_rate", label: "Évolution du trafic - Trié par pourcentage de croissance des visiteurs", icon: "📊" },
  { value: "lowest_price", label: "Prix Le Plus Bas - Produits triés par prix (bas vers haut)", icon: "💲" },
  { value: "highest_price", label: "Prix Le Plus Élevé - Produits triés par prix (haut vers bas)", icon: "💎" },
];

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
                <a href="/dashboard/plans" className="btn btn-sm" style={{ backgroundColor: '#fff', border: 'none', color: '#212529' }}>
                  Débloquer l&apos;accès complet
                </a>
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

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshStats } = useStats();
  const [searchText, setSearchText] = useState("");
  const [activePreset, setActivePreset] = useState("");
  const [analyzingShopIds, setAnalyzingShopIds] = useState<Set<number>>(new Set());
  const [trackedShopIds, setTrackedShopIds] = useState<Set<number>>(new Set());
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [imageModal, setImageModal] = useState<{ open: boolean; src: string; title: string }>({ open: false, src: '', title: '' });
  const [toastAlerts, setToastAlerts] = useState<ToastAlert[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  
  // Filter states - matching shops page structure with number types
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [minRevenue, setMinRevenue] = useState<number | undefined>();
  const [maxRevenue, setMaxRevenue] = useState<number | undefined>();
  const [minOrders, setMinOrders] = useState<number | undefined>();
  const [maxOrders, setMaxOrders] = useState<number | undefined>();
  const [minTraffic, setMinTraffic] = useState<number | undefined>();
  const [maxTraffic, setMaxTraffic] = useState<number | undefined>();
  const [minTrafficGrowth, setMinTrafficGrowth] = useState<number | undefined>();
  const [maxTrafficGrowth, setMaxTrafficGrowth] = useState<number | undefined>();
  const [minActiveAds, setMinActiveAds] = useState<number | undefined>();
  const [maxActiveAds, setMaxActiveAds] = useState<number | undefined>();
  const [minCatalogSize, setMinCatalogSize] = useState<number | undefined>();
  const [maxCatalogSize, setMaxCatalogSize] = useState<number | undefined>();
  const [minTrustpilotRating, setMinTrustpilotRating] = useState<number | undefined>();
  const [maxTrustpilotRating, setMaxTrustpilotRating] = useState<number | undefined>();
  const [minTrustpilotReviews, setMinTrustpilotReviews] = useState<number | undefined>();
  const [maxTrustpilotReviews, setMaxTrustpilotReviews] = useState<number | undefined>();
  const [shopCreationDate, setShopCreationDate] = useState("");
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedPixels, setSelectedPixels] = useState<string[]>([]);
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [selectedSocialNetworks, setSelectedSocialNetworks] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("recommended");

  // Use products hook
  const { products, pagination, isLoading, isLoadingMore, hasMore, error, fetchProducts, fetchMoreProducts } = useProducts();
  
  // Ref for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Build filters object - matching shops page structure
  const buildFilters = (): ProductsFilters => {
    const filters: ProductsFilters = { sortBy };
    
    if (appliedSearchText) filters.search = appliedSearchText;
    if (selectedCountries.length) filters.country = selectedCountries.join(',');
    if (selectedNiches.length) filters.category = selectedNiches.join(',');
    if (selectedCurrencies.length) filters.currency = selectedCurrencies.join(',');
    if (selectedPixels.length) filters.pixels = selectedPixels.join(',');
    if (selectedOrigins.length) filters.origins = selectedOrigins.join(',');
    if (selectedLanguages.length) filters.languages = selectedLanguages.join(',');
    if (selectedDomains.length) filters.domains = selectedDomains.join(',');
    if (selectedThemes.length) filters.themes = selectedThemes.join(',');
    if (selectedApplications.length) filters.applications = selectedApplications.join(',');
    if (shopCreationDate) filters.shopCreationDate = shopCreationDate;
    if (minRevenue !== undefined) filters.minRevenue = minRevenue;
    if (maxRevenue !== undefined) filters.maxRevenue = maxRevenue;
    if (minTraffic !== undefined) filters.minTraffic = minTraffic;
    if (maxTraffic !== undefined) filters.maxTraffic = maxTraffic;
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
    if (minTrustpilotRating !== undefined) filters.minTrustpilotRating = minTrustpilotRating;
    if (maxTrustpilotRating !== undefined) filters.maxTrustpilotRating = maxTrustpilotRating;
    if (minTrustpilotReviews !== undefined) filters.minTrustpilotReviews = minTrustpilotReviews;
    if (maxTrustpilotReviews !== undefined) filters.maxTrustpilotReviews = maxTrustpilotReviews;
    
    return filters;
  };

  // Handle filter apply - optionally accept override values for immediate updates
  const handleApplyFilters = (overrideFilters?: Partial<ProductsFilters>) => {
    const filters = { ...buildFilters(), ...overrideFilters };
    fetchProducts(filters, 1, 20);
  };

  // Track applied search text (separate from input text)
  const [appliedSearchText, setAppliedSearchText] = useState("");

  // Build active filters from current state - matching shops page structure
  const buildActiveFilters = (): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];
    
    // Search text filter tag
    if (appliedSearchText) {
      filters.push({ id: 'search', label: '', value: appliedSearchText, type: 'search', icon: 'ri-search-line' });
    }
    
    // Revenue filter
    if (minRevenue !== undefined || maxRevenue !== undefined) {
      filters.push({ 
        id: 'revenue', label: '', 
        value: `$${minRevenue?.toLocaleString() || '0'} - ${maxRevenue ? '$' + maxRevenue.toLocaleString() : 'Max'}`,
        type: 'revenue', icon: 'ri-money-dollar-circle-line'
      });
    }
    
    // Traffic filter
    if (minTraffic !== undefined || maxTraffic !== undefined) {
      filters.push({
        id: 'traffic', label: '',
        value: `${(minTraffic || 0).toLocaleString()} - ${maxTraffic ? maxTraffic.toLocaleString() : 'Max'}`,
        type: 'traffic', icon: 'ri-group-line'
      });
    }
    
    // Active ads filter
    if (minActiveAds !== undefined || maxActiveAds !== undefined) {
      filters.push({
        id: 'activeAds', label: '',
        value: `${minActiveAds || '0'} - ${maxActiveAds || 'Max'}`,
        type: 'activeAds', icon: 'ri-megaphone-line'
      });
    }
    
    // Traffic growth filter
    if (minTrafficGrowth !== undefined || maxTrafficGrowth !== undefined) {
      filters.push({
        id: 'trafficGrowth', label: '',
        value: `${minTrafficGrowth || '0'}% - ${maxTrafficGrowth || 'Max'}%`,
        type: 'trafficGrowth', icon: 'ri-line-chart-line'
      });
    }
    
    // Orders filter
    if (minOrders !== undefined || maxOrders !== undefined) {
      filters.push({
        id: 'orders', label: '',
        value: `${(minOrders || 0).toLocaleString()} - ${maxOrders ? maxOrders.toLocaleString() : 'Max'}`,
        type: 'orders', icon: 'ri-shopping-cart-line'
      });
    }
    
    // Price filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filters.push({
        id: 'price', label: '',
        value: `$${minPrice || '0'} - ${maxPrice ? '$' + maxPrice : 'Max'}`,
        type: 'price', icon: 'ri-price-tag-3-line'
      });
    }
    
    // Catalog size filter
    if (minCatalogSize !== undefined || maxCatalogSize !== undefined) {
      filters.push({
        id: 'catalogSize', label: '',
        value: `${minCatalogSize || '0'} - ${maxCatalogSize || 'Max'} produits`,
        type: 'catalogSize', icon: 'ri-shopping-bag-3-line'
      });
    }
    
    // Trustpilot filter
    if (minTrustpilotRating !== undefined || maxTrustpilotRating !== undefined ||
        minTrustpilotReviews !== undefined || maxTrustpilotReviews !== undefined) {
      let value = '';
      if (minTrustpilotRating !== undefined || maxTrustpilotRating !== undefined) {
        value = `Note: ${minTrustpilotRating || '0'} - ${maxTrustpilotRating || '5'}`;
      }
      if (minTrustpilotReviews !== undefined || maxTrustpilotReviews !== undefined) {
        if (value) value += ', ';
        value += `Avis: ${minTrustpilotReviews || '0'} - ${maxTrustpilotReviews || 'Max'}`;
      }
      filters.push({ id: 'trustpilot', label: '', value, type: 'trustpilot', icon: 'ri-star-line' });
    }
    
    // Shop creation date filter
    if (shopCreationDate) {
      filters.push({ id: 'shopCreationDate', label: '', value: shopCreationDate, type: 'shopCreationDate', icon: 'ri-calendar-line' });
    }
    
    // Array filters
    selectedCurrencies.forEach(curr => {
      filters.push({ id: `currency_${curr}`, label: '', value: curr, type: 'currency', icon: 'ri-coin-line' });
    });
    
    selectedCountries.forEach(country => {
      filters.push({ id: `country_${country}`, label: '', value: country, type: 'country', icon: 'ri-map-pin-line' });
    });
    
    selectedNiches.forEach(niche => {
      filters.push({ id: `niche_${niche}`, label: '', value: niche, type: 'niche', icon: 'ri-store-2-line' });
    });
    
    selectedPixels.forEach(pixel => {
      filters.push({ id: `pixel_${pixel}`, label: '', value: pixel, type: 'pixel', icon: 'ri-focus-3-line' });
    });
    
    selectedOrigins.forEach(origin => {
      filters.push({ id: `origin_${origin}`, label: '', value: origin, type: 'origin', icon: 'ri-earth-line' });
    });
    
    selectedLanguages.forEach(lang => {
      filters.push({ id: `language_${lang}`, label: '', value: lang, type: 'language', icon: 'ri-global-line' });
    });
    
    selectedDomains.forEach(domain => {
      filters.push({ id: `domain_${domain}`, label: '', value: domain, type: 'domain', icon: 'ri-link' });
    });
    
    selectedThemes.forEach(theme => {
      filters.push({ id: `theme_${theme}`, label: '', value: theme, type: 'theme', icon: 'ri-palette-line' });
    });
    
    selectedApplications.forEach(app => {
      filters.push({ id: `app_${app}`, label: '', value: app, type: 'application', icon: 'ri-apps-line' });
    });
    
    selectedSocialNetworks.forEach(network => {
      filters.push({ id: `social_${network}`, label: '', value: network, type: 'socialNetwork', icon: 'ri-share-line' });
    });
    
    return filters;
  };

  // Update active filters display
  useEffect(() => {
    setActiveFilters(buildActiveFilters());
  }, [
    appliedSearchText, minPrice, maxPrice, minRevenue, maxRevenue, minOrders, maxOrders, 
    minTraffic, maxTraffic, minTrafficGrowth, maxTrafficGrowth, minActiveAds, maxActiveAds, 
    minCatalogSize, maxCatalogSize, minTrustpilotRating, maxTrustpilotRating,
    minTrustpilotReviews, maxTrustpilotReviews, shopCreationDate,
    selectedCurrencies, selectedCountries, selectedNiches, selectedPixels,
    selectedOrigins, selectedLanguages, selectedDomains, selectedThemes, 
    selectedApplications, selectedSocialNetworks
  ]);

  // Fetch products on mount
  useEffect(() => {
    const filters = buildFilters();
    fetchProducts(filters, 1, 20);
  }, [sortBy]);

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

  // Infinite scroll effect
  useEffect(() => {
    if (!loadMoreRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          const filters = buildFilters();
          fetchMoreProducts(filters, 20);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, fetchMoreProducts, buildFilters]);

  // Handle search
  const handleSearch = () => {
    // Update applied search text to show in filter tags
    setAppliedSearchText(searchText);
    // Build filters but override with current searchText (since setState is async)
    const filters = { ...buildFilters(), search: searchText || undefined };
    fetchProducts(filters, 1, 20);
  };

  // Remove active filter - matching shops page structure
  const removeFilter = (filterId: string, filterType: string) => {
    // Helper to build override filters after removal
    const getOverrideFilters = (): Partial<ProductsFilters> => {
      const override: Partial<ProductsFilters> = {};
      
      if (filterType === 'search' || filterId === 'search') {
        setSearchText('');
        setAppliedSearchText('');
        override.search = undefined;
      } else if (filterType === 'revenue' || filterId === 'revenue') {
        setMinRevenue(undefined);
        setMaxRevenue(undefined);
        override.minRevenue = undefined;
        override.maxRevenue = undefined;
      } else if (filterType === 'traffic' || filterId === 'traffic') {
        setMinTraffic(undefined);
        setMaxTraffic(undefined);
        override.minTraffic = undefined;
        override.maxTraffic = undefined;
      } else if (filterType === 'activeAds' || filterId === 'activeAds') {
        setMinActiveAds(undefined);
        setMaxActiveAds(undefined);
        override.minActiveAds = undefined;
        override.maxActiveAds = undefined;
      } else if (filterType === 'trafficGrowth' || filterId === 'trafficGrowth') {
        setMinTrafficGrowth(undefined);
        setMaxTrafficGrowth(undefined);
        override.minTrafficGrowth = undefined;
        override.maxTrafficGrowth = undefined;
      } else if (filterType === 'orders' || filterId === 'orders') {
        setMinOrders(undefined);
        setMaxOrders(undefined);
        override.minOrders = undefined;
        override.maxOrders = undefined;
      } else if (filterType === 'price' || filterId === 'price') {
        setMinPrice(undefined);
        setMaxPrice(undefined);
        override.minPrice = undefined;
        override.maxPrice = undefined;
      } else if (filterType === 'catalogSize' || filterId === 'catalogSize') {
        setMinCatalogSize(undefined);
        setMaxCatalogSize(undefined);
        override.minCatalogSize = undefined;
        override.maxCatalogSize = undefined;
      } else if (filterType === 'trustpilot' || filterId === 'trustpilot') {
        setMinTrustpilotRating(undefined);
        setMaxTrustpilotRating(undefined);
        setMinTrustpilotReviews(undefined);
        setMaxTrustpilotReviews(undefined);
        override.minTrustpilotRating = undefined;
        override.maxTrustpilotRating = undefined;
        override.minTrustpilotReviews = undefined;
        override.maxTrustpilotReviews = undefined;
      } else if (filterType === 'shopCreationDate' || filterId === 'shopCreationDate') {
        setShopCreationDate('');
        override.shopCreationDate = undefined;
      } else if (filterId.startsWith('currency_')) {
        const curr = filterId.replace('currency_', '');
        const newCurrencies = selectedCurrencies.filter(c => c !== curr);
        setSelectedCurrencies(newCurrencies);
        override.currency = newCurrencies.length ? newCurrencies.join(',') : undefined;
      } else if (filterId.startsWith('country_')) {
        const country = filterId.replace('country_', '');
        const newCountries = selectedCountries.filter(c => c !== country);
        setSelectedCountries(newCountries);
        override.country = newCountries.length ? newCountries.join(',') : undefined;
      } else if (filterId.startsWith('niche_')) {
        const niche = filterId.replace('niche_', '');
        const newNiches = selectedNiches.filter(n => n !== niche);
        setSelectedNiches(newNiches);
        override.category = newNiches.length ? newNiches.join(',') : undefined;
      } else if (filterId.startsWith('pixel_')) {
        const pixel = filterId.replace('pixel_', '');
        const newPixels = selectedPixels.filter(p => p !== pixel);
        setSelectedPixels(newPixels);
        override.pixels = newPixels.length ? newPixels.join(',') : undefined;
      } else if (filterId.startsWith('origin_')) {
        const origin = filterId.replace('origin_', '');
        const newOrigins = selectedOrigins.filter(o => o !== origin);
        setSelectedOrigins(newOrigins);
        override.origins = newOrigins.length ? newOrigins.join(',') : undefined;
      } else if (filterId.startsWith('language_')) {
        const lang = filterId.replace('language_', '');
        const newLangs = selectedLanguages.filter(l => l !== lang);
        setSelectedLanguages(newLangs);
        override.languages = newLangs.length ? newLangs.join(',') : undefined;
      } else if (filterId.startsWith('domain_')) {
        const domain = filterId.replace('domain_', '');
        const newDomains = selectedDomains.filter(d => d !== domain);
        setSelectedDomains(newDomains);
        override.domains = newDomains.length ? newDomains.join(',') : undefined;
      } else if (filterId.startsWith('theme_')) {
        const theme = filterId.replace('theme_', '');
        const newThemes = selectedThemes.filter(t => t !== theme);
        setSelectedThemes(newThemes);
        override.themes = newThemes.length ? newThemes.join(',') : undefined;
      } else if (filterId.startsWith('app_')) {
        const app = filterId.replace('app_', '');
        const newApps = selectedApplications.filter(a => a !== app);
        setSelectedApplications(newApps);
        override.applications = newApps.length ? newApps.join(',') : undefined;
      } else if (filterId.startsWith('social_')) {
        const network = filterId.replace('social_', '');
        const newNetworks = selectedSocialNetworks.filter(n => n !== network);
        setSelectedSocialNetworks(newNetworks);
      }
      
      return override;
    };
    
    const overrideFilters = getOverrideFilters();
    handleApplyFilters(overrideFilters);
  };

  // Reset all filters - matching shops page structure
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
    setActivePreset("");
    fetchProducts({ sortBy: 'recommended' }, 1, 20);
  };

  // Handle preset filter - matching shops page auto-apply
  const handlePresetFilter = (preset: string) => {
    if (activePreset === preset) {
      resetFilters();
      setActivePreset('');
    } else {
      // Reset all filters first
      setMinPrice(undefined);
      setMaxPrice(undefined);
      setMinRevenue(undefined);
      setMaxRevenue(undefined);
      setMinOrders(undefined);
      setMaxOrders(undefined);
      setMinTraffic(undefined);
      setMaxTraffic(undefined);
      setMinTrafficGrowth(undefined);
      setMaxTrafficGrowth(undefined);
      setMinActiveAds(undefined);
      setMaxActiveAds(undefined);
      setMinCatalogSize(undefined);
      setMaxCatalogSize(undefined);
      setShopCreationDate('');
      
      // Build override filters for direct apply
      const overrideFilters: Partial<ProductsFilters> = { sortBy };
      
      // Apply preset filters
      const config = PRESET_CONFIGS[preset];
      if (config) {
        if (config.min_price) {
          const val = parseFloat(config.min_price);
          setMinPrice(val);
          overrideFilters.minPrice = val;
        }
        if (config.max_price !== undefined && config.max_price !== '') {
          const val = parseFloat(config.max_price);
          setMaxPrice(val);
          overrideFilters.maxPrice = val;
        }
        if (config.min_revenue) {
          const val = parseFloat(config.min_revenue);
          setMinRevenue(val);
          overrideFilters.minRevenue = val;
        }
        if (config.max_revenue !== undefined && config.max_revenue !== '') {
          const val = parseFloat(config.max_revenue);
          setMaxRevenue(val);
          overrideFilters.maxRevenue = val;
        }
        if (config.min_sales) {
          const val = parseFloat(config.min_sales);
          setMinOrders(val);
          overrideFilters.minOrders = val;
        }
        if (config.max_sales !== undefined && config.max_sales !== '') {
          const val = parseFloat(config.max_sales);
          setMaxOrders(val);
          overrideFilters.maxOrders = val;
        }
        if (config.min_traffic) {
          const val = parseFloat(config.min_traffic);
          setMinTraffic(val);
          overrideFilters.minTraffic = val;
        }
        if (config.max_traffic !== undefined && config.max_traffic !== '') {
          const val = parseFloat(config.max_traffic);
          setMaxTraffic(val);
          overrideFilters.maxTraffic = val;
        }
        if (config.min_traffic_growth) {
          const val = parseFloat(config.min_traffic_growth);
          setMinTrafficGrowth(val);
          overrideFilters.minTrafficGrowth = val;
        }
        if (config.max_traffic_growth !== undefined && config.max_traffic_growth !== '') {
          const val = parseFloat(config.max_traffic_growth);
          setMaxTrafficGrowth(val);
          overrideFilters.maxTrafficGrowth = val;
        }
        if (config.min_active_ads) {
          const val = parseFloat(config.min_active_ads);
          setMinActiveAds(val);
          overrideFilters.minActiveAds = val;
        }
        if (config.max_active_ads !== undefined && config.max_active_ads !== '') {
          const val = parseFloat(config.max_active_ads);
          setMaxActiveAds(val);
          overrideFilters.maxActiveAds = val;
        }
        if (config.datefilter) {
          setShopCreationDate(config.datefilter);
          overrideFilters.shopCreationDate = config.datefilter;
        }
      }
      
      setActivePreset(preset);
      // Apply immediately with override filters
      handleApplyFilters(overrideFilters);
    }
  };

  // Format currency
  const formatCurrency = (amount: number | null | undefined, currency: string | null = "$") => {
    if (amount === null || amount === undefined) return "-";
    const symbol = CURRENCY_SYMBOLS[currency || 'USD'] || currency || '$';
    return `${new Intl.NumberFormat("fr-FR").format(amount)} ${symbol}`;
  };

  // Format number
  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "-";
    return new Intl.NumberFormat("fr-FR").format(num);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const filters = buildFilters();
    fetchProducts(filters, newPage, 20);
  };

  // Toast helpers
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

  const dismissToast = (id: string) => {
    setToastAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleViewShop = (shopId: number) => {
    router.push(`/dashboard/track/${shopId}`);
  };

  // Handle analyze shop - NO REDIRECT, just toast - supports multiple parallel analyses
  const handleAnalyzeShop = async (shopId: number, shopUrl?: string) => {
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
        addToast('success', `${shopUrl || 'La boutique'} a été ajouté à la liste de vos boutiques suivies`, shopUrl, shopId);
        // Refresh navbar stats
        refreshStats();
      } else if (data.error === 'Already tracking') {
        // Also add to tracked (in case we missed it)
        setTrackedShopIds(prev => new Set(prev).add(shopId));
        addToast('info', `${shopUrl || 'Cette boutique'} est déjà dans votre liste de boutiques suivies`, shopUrl, shopId);
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

  return (
    <>
      {/* Toast Alerts */}
      <ToastAlerts 
        alerts={toastAlerts} 
        onDismiss={dismissToast}
        onViewShop={handleViewShop}
      />

      <DashboardHeader
        title="Top Produits"
        subtitle="Découvrez les produits gagnants identifiés par notre IA"
        showTutorialButton={true}
        onTutorialClick={() => setShowTutorialModal(true)}
        icon="ri-price-tag-3-line"
        iconType="icon"
        showStats={false}
        showLimitedStats={true}
      />

      {/* Tutorial Modal */}
      <TutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
        config={TUTORIAL_CONFIGS.products}
      />

      <div className="bg-white home-content-wrapper">
        <div className="p-3 w-max-width-xl mx-auto">
          
          {/* Trial Alert - Only show for trial users */}
          {userStats?.plan?.isOnTrial && (
            <div 
              id="search-count-alert" 
              className="py-2 px-2 px-md-3 mb-2 d-flex w-100 justify-content-between align-items-center flex-column flex-md-row gap-2"
              style={{ 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffc107', 
                borderRadius: '8px',
                color: '#856404'
              }}
            >
              <div className="small ms-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ color: '#ffc107' }}></i>
                <span id="search-count-message">
                  Il vous reste <strong>19</strong> recherches avec filtres sur votre essai gratuit (<strong style={{ color: '#d4ac0d' }}>{userStats.plan.trialDaysRemaining} jours</strong>).
                </span>
              </div>
              <div className="small ms-2 d-flex gap-2 align-items-center">
                <span className="d-none d-md-block">Pour effectuer plus de recherches, passez à la version complète.</span>
                <Link 
                  href="/dashboard/plans"
                  className="btn btn-sm"
                  style={{ 
                    backgroundColor: '#1a1a2e', 
                    color: 'white', 
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}
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
                placeholder="Rechercher par mots clés"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              type="button" 
              className="btn btn-primary apply-filters-btn !bg-[#0c6cfb] !text-white hover:!bg-[#0c6cfb]" 
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

          {/* Smart Preset Filters */}
          <div>
            <p className="text-uppercase fs-xs text-light-gray fw-500 mb-2">PRÉRÉGLAGES INTELLIGENTS</p>
            <div className="d-flex align-items-start mb-4" id="filter-box">
              <div className="d-flex w-100 overflow-auto me-4 filter-tag-box">
                <ul className="nav nav-pills d-flex flex-nowrap gap-2" role="tablist" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li className="nav-item" role="presentation">
                    <button 
                      className={`btn p-0 smart-filter-preset ${activePreset === 'recommended' ? 'active' : ''}`} 
                      type="button" 
                      role="tab"
                      onClick={() => handlePresetFilter('recommended')}
                    >
                      <div className={`filter-tag ${activePreset === 'recommended' ? 'active' : ''}`}>
                        <span style={{ fontSize: '1.1em' }}>⭐</span>
                        <span className="ms-1">Recommander</span>
                      </div>
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button 
                      className={`btn p-0 smart-filter-preset ${activePreset === 'active_ads' ? 'active' : ''}`} 
                      type="button" 
                      role="tab"
                      onClick={() => handlePresetFilter('active_ads')}
                    >
                      <div className={`filter-tag ${activePreset === 'active_ads' ? 'active' : ''}`}>
                        <span style={{ fontSize: '1.1em' }}>🔵</span>
                        <span className="ms-1">Pub actives</span>
                      </div>
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button 
                      className={`btn p-0 smart-filter-preset ${activePreset === 'new_stores' ? 'active' : ''}`} 
                      type="button" 
                      role="tab"
                      onClick={() => handlePresetFilter('new_stores')}
                    >
                      <div className={`filter-tag ${activePreset === 'new_stores' ? 'active' : ''}`}>
                        <span style={{ fontSize: '1.1em' }}>🔥</span>
                        <span className="ms-1">Nouvelles boutiques</span>
                      </div>
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button 
                      className={`btn p-0 smart-filter-preset ${activePreset === 'high_traffic' ? 'active' : ''}`} 
                      type="button" 
                      role="tab"
                      onClick={() => handlePresetFilter('high_traffic')}
                    >
                      <div className={`filter-tag ${activePreset === 'high_traffic' ? 'active' : ''}`}>
                        <span style={{ fontSize: '1.1em' }}>💰</span>
                        <span className="ms-1">Plus de trafic</span>
                      </div>
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button 
                      className={`btn p-0 smart-filter-preset ${activePreset === 'growth' ? 'active' : ''}`} 
                      type="button" 
                      role="tab"
                      onClick={() => handlePresetFilter('growth')}
                    >
                      <div className={`filter-tag ${activePreset === 'growth' ? 'active' : ''}`}>
                        <span style={{ fontSize: '1.1em' }}>📈</span>
                        <span className="ms-1">Évolution du trafic</span>
                      </div>
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Divider */}
            <div className="horizontal-solid-divider mb-5"></div>

            {/* Advanced Filters - Using same components as Top Boutiques */}
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

            {/* Active Filters Tags */}
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

            {/* Divider after Filters */}
            <div className="horizontal-solid-divider mb-4 mt-2"></div>
          </div>

          {/* Results Count and Sort */}
          <div            className="d-flex align-items-center justify-content-between mb-4 mt-3 gap-3 flex-wrap"
          >
            <div className="d-flex align-items-center gap-3">
              <h3 className="fs-small text-sub mb-0">
                <span className="py-2 px-3 bg-weak-50 rounded" style={{ lineHeight: '36px' }}>
                  {pagination.total.toLocaleString('fr-FR')}
                </span>{' '}
                <span>Produits disponibles</span>
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
                onChange={(e) => setSortBy(e.target.value)}
                style={{ width: '380px', maxWidth: '100%' }}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger mb-4">
              {error}
            </div>
          )}

          {/* Products Table */}
          <div            className="table-view mt-2"
          >
            {isLoading ? (
              <ProductTableSkeleton rows={10} />
            ) : products.length === 0 ? (
              <div className="text-center py-5">
                <i className="ri-price-tag-3-line fs-1 text-muted mb-3 d-block"></i>
                <h5>Aucun produit trouvé</h5>
                <p className="text-muted">
                  Essayez de modifier vos filtres ou ajoutez des produits dans la base de données.
                </p>
              </div>
            ) : (
              <div className="table-wrapper" style={{ paddingBottom: '100px', overflowX: 'auto' }}>
                <Table id="productsTable" className="table mb-0">
                  <TableHeader>
                    <TableRow className="border-0">
                      <TableHead scope="col" className="text-gray fw-500 border-0">
                        Les produits
                      </TableHead>
                      <TableHead scope="col" className="text-gray fw-500 border-0">
                        Nom de la boutique
                      </TableHead>
                      <TableHead scope="col" className="text-gray fw-regular border-0">
                        Revenu mensuel estimé
                      </TableHead>
                      <TableHead scope="col" className="text-gray fw-regular border-0">
                        Prix du vente du produit
                      </TableHead>
                      <TableHead scope="col" className="text-gray fw-500 border-0">
                        Publicités act
                      </TableHead>
                      <TableHead scope="col" className="sticky_col action_col text-gray fw-500 border-0 text-center" style={{ minWidth: '200px' }}>
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product, index) => {
                      // Use real data from API
                      const estimatedMonthly = product.estimatedMonthly || 0;
                      const growthRate = product.growthRate || 0;
                      const activeAdsCount = product.activeAdsCount || 0;
                      
                      return (
                        <TableRow
                          key={product.id}
                          className="product_items"
                        >
                          {/* Product Column */}
                          <TableCell scope="row" className="align-middle py-3 border-b-gray">
                            <div className="prod_wrapper d-flex align-items-center">
                              <div 
                                className="prod_img_container position-relative"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setImageModal({ 
                                  open: true, 
                                  src: product.imageUrl || '/img_not_found.png', 
                                  title: product.title 
                                })}
                              >
                                {index < 3 && (
                                  <div className={`position-tag position-tag--${index + 1}`}>
                                    {index + 1}
                                  </div>
                                )}
                                <div className="view-image product-image-hover">
                                  <img 
                                    className="prod_image" 
                                    src={product.imageUrl || '/img_not_found.png'} 
                                    alt={product.title}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/img_not_found.png';
                                    }}
                                  />
                                  <div className="image-overlay">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                      <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              <div className="ms-3 prod_details">
                                <p className="mb-0">
                                  <a 
                                    href={`https://${product.shop?.url || ''}/products/${product.handle}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="fw-500 title fs-small text-decoration-none text-body"
                                  >
                                    {product.title}
                                  </a>
                                </p>
                                <p className="fs-small text-gray fw-regular mb-0">
                                  <a 
                                    href={`https://${product.shop?.url || ''}/products/${product.handle}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-decoration-none text-dark-gray"
                                  >
                                    Voir le produit <i className="ri-arrow-right-up-line"></i>
                                  </a>
                                </p>
                                {product.discount && (
                                  <span className="badge bg-success fs-xs mt-1">-{product.discount}%</span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Shop Column */}
                          <TableCell className="align-middle py-3 border-b-gray">
                            {product.shop ? (
                              <a 
                                href={`https://${product.shop.url}`} 
                                className="text-decoration-none text-dark-gray" 
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <div className="d-flex align-items-center">
                                  <div className="product-shop-img">
                                    <img 
                                      className="img-fluid rounded" 
                                      src={`https://www.google.com/s2/favicons?domain=${product.shop.url}&sz=64`}
                                      alt={product.shop.name || product.shop.url}
                                      style={{ width: 32, height: 32 }}
                                      onError={(e) => {
                                        const img = e.target as HTMLImageElement;
                                        if (!img.src.includes('img_not_found')) {
                                          img.src = '/img_not_found.png';
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="ms-2 d-xxl-block d-none">
                                    <p className="fs-small text-gray fw-regular mb-0 text-nowrap">
                                      {product.shop.name || product.shop.url}
                                      <svg className="ms-1" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" style={{ verticalAlign: 'middle' }}>
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                      </svg>
                                    </p>
                                  </div>
                                </div>
                              </a>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </TableCell>

                          {/* Revenue Column */}
                          <TableCell className="align-middle py-3 border-b-gray text-center text-nowrap fw-600 fs-small">
                            {formatCurrency(estimatedMonthly, product.shop?.currency)}
                            {growthRate > 0 ? (
                              <i className="ri-arrow-right-up-line text-success ms-1"></i>
                            ) : growthRate < 0 ? (
                              <i className="ri-arrow-right-down-line text-danger ms-1"></i>
                            ) : null}
                          </TableCell>

                          {/* Price Column */}
                          <TableCell className="align-middle py-3 border-b-gray text-center fw-600 fs-small">
                            {formatCurrency(product.price, product.shop?.currency)}
                            {product.compareAtPrice && (
                              <span className="text-muted text-decoration-line-through ms-2 fs-xs d-block">
                                {formatCurrency(product.compareAtPrice, product.shop?.currency)}
                              </span>
                            )}
                          </TableCell>

                          {/* Active Ads Column */}
                          <TableCell className="align-middle py-3 border-b-gray">
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-600 fs-small" style={{ color: '#000' }}>
                                {formatNumber(activeAdsCount)}
                              </span>
                              {growthRate !== 0 && (
                                <span 
                                  style={{ 
                                    fontSize: '12px', 
                                    color: growthRate > 0 ? '#22c55e' : '#ef4444',
                                    fontWeight: '400'
                                  }}
                                >
                                  ({growthRate > 0 ? '+' : ''}{growthRate}%)
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Actions Column */}
                          <TableCell className="sticky_col action_col align-middle py-3 border-b-gray text-center" style={{ backgroundColor: '#fff' }}>
                            <div className="d-flex justify-content-center">
                              {product.shop && (
                                trackedShopIds.has(product.shop.id) && !analyzingShopIds.has(product.shop.id) ? (
                                  // Already tracked - Show "Voir l'analyse" button (BLUE)
                                  <button
                                    onClick={() => handleViewShop(product.shop!.id)}
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
                                ) : analyzingShopIds.has(product.shop.id) ? (
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
                                    onClick={() => handleAnalyzeShop(product.shop!.id, product.shop!.url)}
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
                                )
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Infinite Scroll Loader - Shows skeleton rows when loading more */}
                {isLoadingMore && (
                  <ProductTableSkeleton rows={5} />
                )}
                
                {/* Infinite Scroll Trigger */}
                <div ref={loadMoreRef} className="d-flex justify-content-center py-3">
                  {!hasMore && products.length > 0 && (
                    <span className="text-muted fs-small">
                      <i className="ri-check-line me-1"></i>
                      Tous les produits ont été chargés ({pagination.total} produits)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={imageModal.open} onOpenChange={(open: boolean) => setImageModal({ ...imageModal, open })}>
        <DialogContent className="sm:max-w-[600px] p-0" style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
          <DialogTitle className="sr-only">{imageModal.title}</DialogTitle>
          <div className="position-relative">
            <img 
              src={imageModal.src} 
              alt={imageModal.title}
              style={{ 
                width: '100%', 
                maxHeight: '80vh', 
                objectFit: 'contain',
                borderRadius: '12px'
              }}
            />
            <p className="text-center mt-2 text-white fw-500" style={{ fontSize: '14px' }}>
              {imageModal.title}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Wrap with Suspense for useSearchParams
export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-500" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
