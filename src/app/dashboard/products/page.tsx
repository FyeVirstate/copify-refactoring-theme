"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import DashboardHeader from "@/components/DashboardHeader";
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
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import SmartDropdownContent from "@/components/SmartDropdownContent";
import NicheDropdown from "@/components/NicheDropdown";
import ProductTableSkeleton from "@/components/ProductTableSkeleton";
import {
  CurrencyFilter,
  MarketsFilter,
  DailyRevenueFilter,
  MonthlyOrdersFilter,
  TrafficGrowthFilter,
  ActiveAdsFilter,
  DatesFilter,
  PixelsFilter,
} from "@/components/filters";
import { useProducts } from "@/lib/hooks/use-products";

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
          </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchText, setSearchText] = useState("");
  const [activePreset, setActivePreset] = useState("");
  const [analyzingShopIds, setAnalyzingShopIds] = useState<Set<number>>(new Set());
  const [trackedShopIds, setTrackedShopIds] = useState<Set<number>>(new Set());
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [imageModal, setImageModal] = useState<{ open: boolean; src: string; title: string }>({ open: false, src: '', title: '' });
  const [toastAlerts, setToastAlerts] = useState<ToastAlert[]>([]);
  
  // Filter states
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRevenue, setMinRevenue] = useState("");
  const [maxRevenue, setMaxRevenue] = useState("");
  const [minOrders, setMinOrders] = useState("");
  const [maxOrders, setMaxOrders] = useState("");
  const [minTraffic, setMinTraffic] = useState("");
  const [maxTraffic, setMaxTraffic] = useState("");
  const [minTrafficGrowth, setMinTrafficGrowth] = useState("");
  const [maxTrafficGrowth, setMaxTrafficGrowth] = useState("");
  const [minActiveAds, setMinActiveAds] = useState("");
  const [maxActiveAds, setMaxActiveAds] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedPixels, setSelectedPixels] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("recommended");

  // Use products hook
  const { products, pagination, isLoading, isLoadingMore, hasMore, error, fetchProducts, fetchMoreProducts } = useProducts();
  
  // Ref for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Build filters object
  const buildFilters = () => {
    const filters: Record<string, any> = {};
    if (searchText) filters.search = searchText;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (minRevenue) filters.minRevenue = parseFloat(minRevenue);
    if (maxRevenue) filters.maxRevenue = parseFloat(maxRevenue);
    if (minOrders) filters.minOrders = parseFloat(minOrders);
    if (maxOrders) filters.maxOrders = parseFloat(maxOrders);
    if (minTraffic) filters.minTraffic = parseFloat(minTraffic);
    if (maxTraffic) filters.maxTraffic = parseFloat(maxTraffic);
    if (minTrafficGrowth) filters.minTrafficGrowth = parseFloat(minTrafficGrowth);
    if (maxTrafficGrowth) filters.maxTrafficGrowth = parseFloat(maxTrafficGrowth);
    if (minActiveAds) filters.minActiveAds = parseFloat(minActiveAds);
    if (maxActiveAds) filters.maxActiveAds = parseFloat(maxActiveAds);
    if (dateFilter) filters.dateFilter = dateFilter;
    if (selectedNiches.length) filters.category = selectedNiches.join(',');
    if (selectedCurrencies.length) filters.currency = selectedCurrencies.join(',');
    if (selectedCountries.length) filters.country = selectedCountries.join(',');
    if (selectedPixels.length) filters.pixels = selectedPixels.join(',');
    if (sortBy) filters.sortBy = sortBy;
    return filters;
  };

  // Track applied search text (separate from input text)
  const [appliedSearchText, setAppliedSearchText] = useState("");

  // Update active filters display
  useEffect(() => {
    const filters: ActiveFilter[] = [];
    
    // Search text filter tag
    if (appliedSearchText) {
      filters.push({
        id: 'search',
        label: '',
        value: appliedSearchText,
        type: 'search',
        icon: 'ri-search-line'
      });
    }
    if (dateFilter) {
      filters.push({
        id: 'date',
        label: '',
        value: dateFilter,
        type: 'date',
        icon: 'ri-calendar-line'
      });
    }
    if (minTrafficGrowth || maxTrafficGrowth) {
      filters.push({
        id: 'traffic_growth',
        label: '',
        value: `${minTrafficGrowth || '0'} - ${maxTrafficGrowth || 'Max'}`,
        type: 'traffic_growth',
        icon: 'ri-line-chart-line'
      });
    }
    if (minActiveAds || maxActiveAds) {
      filters.push({
        id: 'active_ads',
        label: '',
        value: `${minActiveAds || '0'} - ${maxActiveAds || 'Max'}`,
        type: 'active_ads',
        icon: 'ri-megaphone-line'
      });
    }
    if (minPrice || maxPrice) {
      filters.push({
        id: 'price',
        label: '',
        value: `$${minPrice || '0'} - $${maxPrice || 'Max'}`,
        type: 'price',
        icon: 'ri-money-dollar-circle-line'
      });
    }
    if (minOrders || maxOrders) {
      filters.push({
        id: 'orders',
        label: '',
        value: `Min - ${maxOrders || 'Max'}`,
        type: 'orders',
        icon: 'ri-shopping-cart-line'
      });
    }
    if (minRevenue || maxRevenue) {
      filters.push({
        id: 'revenue',
        label: '',
        value: `$${minRevenue?.toLocaleString() || '0'} - ${maxRevenue ? '$' + Number(maxRevenue).toLocaleString() : 'Max'}`,
        type: 'revenue',
        icon: 'ri-money-dollar-circle-line'
      });
    }
    if (minTraffic || maxTraffic) {
      filters.push({
        id: 'traffic',
        label: '',
        value: `${Number(minTraffic || 0).toLocaleString()} - ${maxTraffic ? Number(maxTraffic).toLocaleString() : 'Max'}`,
        type: 'traffic',
        icon: 'ri-group-line'
      });
    }
    if (selectedCurrencies.length) {
      selectedCurrencies.forEach((curr) => {
        filters.push({
          id: `currency_${curr}`,
          label: '',
          value: curr,
          type: 'currency',
          icon: 'ri-coin-line'
        });
      });
    }
    if (selectedCountries.length) {
      selectedCountries.forEach((country) => {
        filters.push({
          id: `country_${country}`,
          label: '',
          value: country,
          type: 'country',
          icon: 'ri-map-pin-line'
        });
      });
    }
    if (selectedNiches.length) {
      selectedNiches.forEach((niche) => {
        filters.push({
          id: `niche_${niche}`,
          label: '',
          value: niche,
          type: 'niche',
          icon: 'ri-store-2-line'
        });
      });
    }
    if (selectedPixels.length) {
      selectedPixels.forEach((pixel) => {
        filters.push({
          id: `pixel_${pixel}`,
          label: '',
          value: pixel,
          type: 'pixel',
          icon: 'ri-focus-3-line'
        });
      });
    }
    setActiveFilters(filters);
  }, [appliedSearchText, minPrice, maxPrice, minRevenue, maxRevenue, minOrders, maxOrders, minTraffic, maxTraffic, minTrafficGrowth, maxTrafficGrowth, minActiveAds, maxActiveAds, dateFilter, selectedCurrencies, selectedCountries, selectedNiches, selectedPixels]);

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
    const filters = buildFilters();
    fetchProducts(filters, 1, 20);
  };

  // Remove active filter
  const removeFilter = (filterId: string, filterType: string) => {
    // Build new filter values
    let newSearchText = appliedSearchText;
    let newMinPrice = minPrice;
    let newMaxPrice = maxPrice;
    let newMinRevenue = minRevenue;
    let newMaxRevenue = maxRevenue;
    let newMinOrders = minOrders;
    let newMaxOrders = maxOrders;
    let newMinTraffic = minTraffic;
    let newMaxTraffic = maxTraffic;
    let newMinTrafficGrowth = minTrafficGrowth;
    let newMaxTrafficGrowth = maxTrafficGrowth;
    let newMinActiveAds = minActiveAds;
    let newMaxActiveAds = maxActiveAds;
    let newDateFilter = dateFilter;
    let newCurrencies = [...selectedCurrencies];
    let newCountries = [...selectedCountries];
    let newNiches = [...selectedNiches];
    let newPixels = [...selectedPixels];

    if (filterId === 'search') {
      setSearchText('');
      setAppliedSearchText('');
      newSearchText = '';
    } else if (filterId.startsWith('currency_')) {
      const curr = filterId.replace('currency_', '');
      newCurrencies = newCurrencies.filter(c => c !== curr);
      setSelectedCurrencies(newCurrencies);
    } else if (filterId.startsWith('country_')) {
      const country = filterId.replace('country_', '');
      newCountries = newCountries.filter(c => c !== country);
      setSelectedCountries(newCountries);
    } else if (filterId.startsWith('niche_')) {
      const niche = filterId.replace('niche_', '');
      newNiches = newNiches.filter(n => n !== niche);
      setSelectedNiches(newNiches);
    } else if (filterId.startsWith('pixel_')) {
      const pixel = filterId.replace('pixel_', '');
      newPixels = newPixels.filter(p => p !== pixel);
      setSelectedPixels(newPixels);
    } else {
      switch (filterId) {
        case 'price':
          setMinPrice('');
          setMaxPrice('');
          newMinPrice = '';
          newMaxPrice = '';
          break;
        case 'revenue':
          setMinRevenue('');
          setMaxRevenue('');
          newMinRevenue = '';
          newMaxRevenue = '';
          break;
        case 'orders':
          setMinOrders('');
          setMaxOrders('');
          newMinOrders = '';
          newMaxOrders = '';
          break;
        case 'traffic':
          setMinTraffic('');
          setMaxTraffic('');
          newMinTraffic = '';
          newMaxTraffic = '';
          break;
        case 'traffic_growth':
          setMinTrafficGrowth('');
          setMaxTrafficGrowth('');
          newMinTrafficGrowth = '';
          newMaxTrafficGrowth = '';
          break;
        case 'active_ads':
          setMinActiveAds('');
          setMaxActiveAds('');
          newMinActiveAds = '';
          newMaxActiveAds = '';
          break;
        case 'date':
          setDateFilter('');
          newDateFilter = '';
          break;
      }
    }
    
    // Build and fetch with new filters immediately
    const newFilters: Record<string, any> = { sortBy };
    if (newSearchText) newFilters.search = newSearchText;
    if (newMinPrice) newFilters.minPrice = parseFloat(newMinPrice);
    if (newMaxPrice) newFilters.maxPrice = parseFloat(newMaxPrice);
    if (newMinRevenue) newFilters.minRevenue = parseFloat(newMinRevenue);
    if (newMaxRevenue) newFilters.maxRevenue = parseFloat(newMaxRevenue);
    if (newMinOrders) newFilters.minOrders = parseFloat(newMinOrders);
    if (newMaxOrders) newFilters.maxOrders = parseFloat(newMaxOrders);
    if (newMinTraffic) newFilters.minTraffic = parseFloat(newMinTraffic);
    if (newMaxTraffic) newFilters.maxTraffic = parseFloat(newMaxTraffic);
    if (newMinTrafficGrowth) newFilters.minTrafficGrowth = parseFloat(newMinTrafficGrowth);
    if (newMaxTrafficGrowth) newFilters.maxTrafficGrowth = parseFloat(newMaxTrafficGrowth);
    if (newMinActiveAds) newFilters.minActiveAds = parseFloat(newMinActiveAds);
    if (newMaxActiveAds) newFilters.maxActiveAds = parseFloat(newMaxActiveAds);
    if (newDateFilter) newFilters.dateFilter = newDateFilter;
    if (newNiches.length) newFilters.category = newNiches.join(',');
    if (newCurrencies.length) newFilters.currency = newCurrencies.join(',');
    if (newCountries.length) newFilters.country = newCountries.join(',');
    if (newPixels.length) newFilters.pixels = newPixels.join(',');
    
    fetchProducts(newFilters, 1, 20);
  };

  // Reset all filters
  const resetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setMinRevenue('');
    setMaxRevenue('');
    setMinOrders('');
    setMaxOrders('');
    setMinTraffic('');
    setMaxTraffic('');
    setMinTrafficGrowth('');
    setMaxTrafficGrowth('');
    setMinActiveAds('');
    setMaxActiveAds('');
    setDateFilter('');
    setSelectedNiches([]);
    setSelectedCurrencies([]);
    setSelectedCountries([]);
    setSelectedPixels([]);
    setSearchText('');
    setAppliedSearchText('');
    setActivePreset('');
    // Fetch products with empty filters directly (don't rely on state which may not be updated yet)
    fetchProducts({ sortBy }, 1, 20);
  };

  // Handle preset filter
  const handlePresetFilter = (preset: string) => {
    if (activePreset === preset) {
      resetFilters();
      setActivePreset('');
    } else {
      // Reset first
      setMinPrice('');
      setMaxPrice('');
      setMinRevenue('');
      setMaxRevenue('');
      setMinOrders('');
      setMaxOrders('');
      setMinTraffic('');
      setMaxTraffic('');
      setMinTrafficGrowth('');
      setMaxTrafficGrowth('');
      setMinActiveAds('');
      setMaxActiveAds('');
      setDateFilter('');
      
      // Apply preset filters
      const config = PRESET_CONFIGS[preset];
      if (config) {
        if (config.min_price) setMinPrice(config.min_price);
        if (config.max_price !== undefined) setMaxPrice(config.max_price);
        if (config.min_revenue) setMinRevenue(config.min_revenue);
        if (config.max_revenue !== undefined) setMaxRevenue(config.max_revenue);
        if (config.min_sales) setMinOrders(config.min_sales);
        if (config.max_sales !== undefined) setMaxOrders(config.max_sales);
        if (config.min_traffic) setMinTraffic(config.min_traffic);
        if (config.max_traffic !== undefined) setMaxTraffic(config.max_traffic);
        if (config.min_traffic_growth) setMinTrafficGrowth(config.min_traffic_growth);
        if (config.max_traffic_growth !== undefined) setMaxTrafficGrowth(config.max_traffic_growth);
        if (config.min_active_ads) setMinActiveAds(config.min_active_ads);
        if (config.max_active_ads !== undefined) setMaxActiveAds(config.max_active_ads);
        if (config.datefilter) setDateFilter(config.datefilter);
      }
      
      setActivePreset(preset);
      setTimeout(() => handleSearch(), 100);
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
        onTutorialClick={() => console.log("Tutoriel clicked")}
        icon="ri-price-tag-3-line"
        iconType="icon"
        showStats={false}
      />

      <div className="bg-white home-content-wrapper">
        <div className="p-3 w-max-width-xl mx-auto">
          
          {/* Trial Alert - Exact Laravel style */}
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
                Il vous reste <strong>19</strong> recherches avec filtres sur votre essai gratuit (<strong>5 jours</strong>).
              </span>
            </div>
            <div className="small ms-2 d-flex gap-2 align-items-center">
              <span className="d-none d-md-block">Pour effectuer plus de recherches, passez à la version complète.</span>
              <button 
                type="button" 
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
                Débloquer l'accès complet
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-3 pb-1 d-flex gap-2 pt-2 flex-wrap flex-sm-nowrap mobile-search-row"
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
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
          </motion.div>

          {/* Smart Preset Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
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

            {/* Advanced Filters */}
            <p className="text-uppercase fs-xs text-light-gray fw-500 mb-2 mt-1">FILTRES</p>
            <div className="filters-grid mb-3">
                {/* Price filter */}
                <div className={`dropdown dropdown-filter ${(minPrice || maxPrice) ? 'active' : ''}`}>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        className={`btn dropdown-btn dropdown-toggle`} 
                        type="button" 
                        variant="outline"
                        style={(minPrice || maxPrice) ? { 
                          backgroundColor: 'rgba(12, 108, 251, 0.1)', 
                          borderColor: '#0c6cfb', 
                          color: '#0c6cfb' 
                        } : {}}
                      >
                        <i className="dropdown-icon ri-money-dollar-circle-line" style={(minPrice || maxPrice) ? { color: '#0c6cfb' } : {}}></i> Prix du produit
                      </Button>
                    </DropdownMenuTrigger>
                    <SmartDropdownContent className="dropdown-menu p-3 text-muted" style={{ width: '325px', maxWidth: 'calc(100vw - 20px)' }} onClick={(e) => e.stopPropagation()} collisionPadding={10}>
                      <div className="mb-3 d-flex">
                        <Input
                          type="number"
                          className="form-control design-2"
                          placeholder="0"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                        />
                        <span className="separator mx-3"></span>
                        <Input
                          type="number"
                          className="form-control design-2"
                          placeholder="150"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                        />
                      </div>
                      <Button type="button" className="btn btn-primary w-100 apply-filters-btn" onClick={handleSearch}>
                        Appliquer
                      </Button>
                    </SmartDropdownContent>
                  </DropdownMenu>
                </div>

                {/* Traffic Growth filter */}
                <div className={`dropdown dropdown-filter ${(minTrafficGrowth || maxTrafficGrowth) ? 'active' : ''}`}>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        className="btn dropdown-btn dropdown-toggle" 
                        type="button" 
                        variant="outline"
                        style={(minTrafficGrowth || maxTrafficGrowth) ? { 
                          backgroundColor: 'rgba(12, 108, 251, 0.1)', 
                          borderColor: '#0c6cfb', 
                          color: '#0c6cfb' 
                        } : {}}
                      >
                        <i className="dropdown-icon ri-line-chart-line" style={(minTrafficGrowth || maxTrafficGrowth) ? { color: '#0c6cfb' } : {}}></i> Évolution du trafic
                      </Button>
                    </DropdownMenuTrigger>
                    <SmartDropdownContent className="dropdown-menu p-3 text-muted" style={{ width: '325px', maxWidth: 'calc(100vw - 20px)' }} onClick={(e) => e.stopPropagation()} collisionPadding={10}>
                      <div className="mb-3 d-flex">
                        <Input
                          type="number"
                          className="form-control design-2"
                          placeholder="Min %"
                          value={minTrafficGrowth}
                          onChange={(e) => setMinTrafficGrowth(e.target.value)}
                        />
                        <span className="separator mx-3"></span>
                        <Input
                          type="number"
                          className="form-control design-2"
                          placeholder="Max %"
                          value={maxTrafficGrowth}
                          onChange={(e) => setMaxTrafficGrowth(e.target.value)}
                        />
                      </div>
                      <Button type="button" className="btn btn-primary w-100 apply-filters-btn" onClick={handleSearch}>
                        Appliquer
                      </Button>
                    </SmartDropdownContent>
                  </DropdownMenu>
                </div>

                {/* Active Ads filter */}
                <div className={`dropdown dropdown-filter ${(minActiveAds || maxActiveAds) ? 'active' : ''}`}>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        className="btn dropdown-btn dropdown-toggle" 
                        type="button" 
                        variant="outline"
                        style={(minActiveAds || maxActiveAds) ? { 
                          backgroundColor: 'rgba(12, 108, 251, 0.1)', 
                          borderColor: '#0c6cfb', 
                          color: '#0c6cfb' 
                        } : {}}
                      >
                        <i className="dropdown-icon ri-megaphone-line" style={(minActiveAds || maxActiveAds) ? { color: '#0c6cfb' } : {}}></i> Publicités Active
                      </Button>
                    </DropdownMenuTrigger>
                    <SmartDropdownContent className="dropdown-menu p-3 text-muted" style={{ width: '325px', maxWidth: 'calc(100vw - 20px)' }} onClick={(e) => e.stopPropagation()} collisionPadding={10}>
                      <div className="mb-3 d-flex">
                        <Input
                          type="number"
                          className="form-control design-2"
                          placeholder="Min"
                          value={minActiveAds}
                          onChange={(e) => setMinActiveAds(e.target.value)}
                        />
                        <span className="separator mx-3"></span>
                        <Input
                          type="number"
                          className="form-control design-2"
                          placeholder="Max"
                          value={maxActiveAds}
                          onChange={(e) => setMaxActiveAds(e.target.value)}
                        />
                      </div>
                      <Button type="button" className="btn btn-primary w-100 apply-filters-btn" onClick={handleSearch}>
                        Appliquer
                      </Button>
                    </SmartDropdownContent>
                  </DropdownMenu>
                </div>

                {/* Date filter */}
                <div className={`dropdown dropdown-filter ${dateFilter ? 'active' : ''}`}>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        className="btn dropdown-btn dropdown-toggle" 
                        type="button" 
                        variant="outline"
                        style={dateFilter ? { 
                          backgroundColor: 'rgba(12, 108, 251, 0.1)', 
                          borderColor: '#0c6cfb', 
                          color: '#0c6cfb' 
                        } : {}}
                      >
                        <i className="dropdown-icon ri-calendar-line" style={dateFilter ? { color: '#0c6cfb' } : {}}></i> Création de la Boutique
                      </Button>
                    </DropdownMenuTrigger>
                    <SmartDropdownContent className="dropdown-menu p-3 text-muted" style={{ width: '325px', maxWidth: 'calc(100vw - 20px)' }} onClick={(e) => e.stopPropagation()} collisionPadding={10}>
                      <div className="mb-3">
                        <Input
                          type="text"
                          className="form-control design-2"
                          placeholder="MM/DD/YYYY - MM/DD/YYYY"
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                        />
                      </div>
                      <Button type="button" className="btn btn-primary w-100 apply-filters-btn" onClick={handleSearch}>
                        Appliquer
                      </Button>
                    </SmartDropdownContent>
                  </DropdownMenu>
                </div>

                {/* Markets filter */}
                <MarketsFilter 
                  selectedCountries={selectedCountries}
                  onCountriesChange={setSelectedCountries}
                  onApply={handleSearch}
                  isActive={selectedCountries.length > 0}
                />

                {/* Niche / Category filter */}
                <NicheDropdown
                  selectedNiches={selectedNiches}
                  onNichesChange={setSelectedNiches}
                  onApply={handleSearch}
                  isActive={selectedNiches.length > 0}
                />

                {/* Orders filter */}
                <div className={`dropdown dropdown-filter ${(minOrders || maxOrders) ? 'active' : ''}`}>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        className="btn dropdown-btn dropdown-toggle" 
                        type="button" 
                        variant="outline"
                        style={(minOrders || maxOrders) ? { 
                          backgroundColor: 'rgba(12, 108, 251, 0.1)', 
                          borderColor: '#0c6cfb', 
                          color: '#0c6cfb' 
                        } : {}}
                      >
                        <i className="dropdown-icon ri-shopping-cart-line" style={(minOrders || maxOrders) ? { color: '#0c6cfb' } : {}}></i> Commandes par mois
                      </Button>
                    </DropdownMenuTrigger>
                    <SmartDropdownContent className="dropdown-menu p-3 text-muted" style={{ width: '325px', maxWidth: 'calc(100vw - 20px)' }} onClick={(e) => e.stopPropagation()} collisionPadding={10}>
                      <div className="mb-3 d-flex">
                        <Input
                          type="number"
                          className="form-control design-2"
                          placeholder="Min"
                          value={minOrders}
                          onChange={(e) => setMinOrders(e.target.value)}
                        />
                        <span className="separator mx-3"></span>
                        <Input
                          type="number"
                          className="form-control design-2"
                          placeholder="Max"
                          value={maxOrders}
                          onChange={(e) => setMaxOrders(e.target.value)}
                        />
                      </div>
                      <Button type="button" className="btn btn-primary w-100 apply-filters-btn" onClick={handleSearch}>
                        Appliquer
                      </Button>
                    </SmartDropdownContent>
                  </DropdownMenu>
                </div>

                {/* Revenue filter */}
                <div className={`dropdown dropdown-filter ${(minRevenue || maxRevenue) ? 'active' : ''}`}>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        className="btn dropdown-btn dropdown-toggle" 
                        type="button" 
                        variant="outline"
                        style={(minRevenue || maxRevenue) ? { 
                          backgroundColor: 'rgba(12, 108, 251, 0.1)', 
                          borderColor: '#0c6cfb', 
                          color: '#0c6cfb' 
                        } : {}}
                      >
                        <i className="dropdown-icon ri-money-dollar-circle-line" style={(minRevenue || maxRevenue) ? { color: '#0c6cfb' } : {}}></i> Revenu par mois
                      </Button>
                    </DropdownMenuTrigger>
                    <SmartDropdownContent className="dropdown-menu p-3 text-muted" style={{ width: '325px', maxWidth: 'calc(100vw - 20px)' }} onClick={(e) => e.stopPropagation()} collisionPadding={10}>
                      <div className="mb-3 d-flex">
                        <Input
                          type="number"
                          className="form-control design-2"
                          placeholder="Min $"
                          value={minRevenue}
                          onChange={(e) => setMinRevenue(e.target.value)}
                        />
                        <span className="separator mx-3"></span>
                        <Input
                          type="number"
                          className="form-control design-2"
                          placeholder="Max $"
                          value={maxRevenue}
                          onChange={(e) => setMaxRevenue(e.target.value)}
                        />
                      </div>
                      <Button type="button" className="btn btn-primary w-100 apply-filters-btn" onClick={handleSearch}>
                        Appliquer
                      </Button>
                    </SmartDropdownContent>
                  </DropdownMenu>
                </div>

                {/* Traffic (Monthly Visits) filter */}
                <div className={`dropdown dropdown-filter ${(minTraffic || maxTraffic) ? 'active' : ''}`}>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        className="btn dropdown-btn dropdown-toggle" 
                        type="button" 
                        variant="outline"
                        style={(minTraffic || maxTraffic) ? { 
                          backgroundColor: 'rgba(12, 108, 251, 0.1)', 
                          borderColor: '#0c6cfb', 
                          color: '#0c6cfb' 
                        } : {}}
                      >
                        <i className="dropdown-icon ri-group-line" style={(minTraffic || maxTraffic) ? { color: '#0c6cfb' } : {}}></i> Nombres de visites par mois
                      </Button>
                    </DropdownMenuTrigger>
                    <SmartDropdownContent className="dropdown-menu p-3 text-muted" style={{ width: '325px', maxWidth: 'calc(100vw - 20px)' }} onClick={(e) => e.stopPropagation()} collisionPadding={10}>
                      <div className="mb-3 d-flex">
                        <Input
                          type="number"
                          className="form-control design-2"
                          placeholder="Min"
                          value={minTraffic}
                          onChange={(e) => setMinTraffic(e.target.value)}
                        />
                        <span className="separator mx-3"></span>
                        <Input
                          type="number"
                          className="form-control design-2"
                          placeholder="Max"
                          value={maxTraffic}
                          onChange={(e) => setMaxTraffic(e.target.value)}
                        />
                      </div>
                      <Button type="button" className="btn btn-primary w-100 apply-filters-btn" onClick={handleSearch}>
                        Appliquer
                      </Button>
                    </SmartDropdownContent>
                  </DropdownMenu>
                </div>
                
                {/* Currency filter */}
                <CurrencyFilter 
                  selectedCurrencies={selectedCurrencies}
                  onCurrenciesChange={setSelectedCurrencies}
                  onApply={handleSearch}
                  isActive={selectedCurrencies.length > 0}
                />

                {/* Pixels filter */}
                <PixelsFilter 
                  selectedPixels={selectedPixels}
                  onPixelsChange={setSelectedPixels}
                  onApply={handleSearch}
                  isActive={selectedPixels.length > 0}
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
          </motion.div>

          {/* Results Count and Sort */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="d-flex align-items-center justify-content-between mb-4 mt-3 gap-3 flex-wrap"
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
          </motion.div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger mb-4">
              {error}
            </div>
          )}

          {/* Products Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
            className="table-view mt-2"
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
                          style={{
                            animation: `fadeIn 0.4s ease-out ${0.1 + (0.05 * index)}s both`,
                          }}
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
          </motion.div>

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
