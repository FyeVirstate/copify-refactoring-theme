"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import DashboardHeader from "@/components/DashboardHeader";
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
} from "@/components/filters";
import { useShops, ShopsFilters } from "@/lib/hooks/use-shops";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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
  const [searchText, setSearchText] = useState("");
  const [appliedSearchText, setAppliedSearchText] = useState("");
  const [analyzingShopIds, setAnalyzingShopIds] = useState<Set<number>>(new Set());
  const [trackedShopIds, setTrackedShopIds] = useState<Set<number>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<{ url: string; preview: string } | null>(null);
  const [toastAlerts, setToastAlerts] = useState<ToastAlert[]>([]);
  
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
  const buildFilters = useCallback((): ShopsFilters => {
    const filters: ShopsFilters = { sortBy };
    
    if (appliedSearchText) filters.search = appliedSearchText;
    if (selectedCountries.length) filters.country = selectedCountries.join(',');
    if (selectedNiches.length) filters.category = selectedNiches.join(',');
    if (selectedCurrencies.length) filters.currency = selectedCurrencies.join(',');
    if (selectedPixels.length) filters.pixels = selectedPixels.join(',');
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
    
    return filters;
  }, [sortBy, appliedSearchText, selectedCountries, selectedNiches, selectedCurrencies, 
      selectedPixels, minRevenue, maxRevenue, minTraffic, maxTraffic, minProducts, 
      maxProducts, minActiveAds, maxActiveAds, minTrafficGrowth, maxTrafficGrowth]);

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

  // Handle filter apply
  const handleApplyFilters = () => {
    fetchShops(buildFilters(), 1, 20);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchText("");
    setAppliedSearchText("");
    setSelectedCountries([]);
    setSelectedNiches([]);
    setSelectedCurrencies([]);
    setSelectedPixels([]);
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
    setMinTraffic(undefined);
    setMinProducts(undefined);
    setMaxProducts(undefined);
    setMinTrafficGrowth(undefined);
    setMinActiveAds(undefined);
    
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

  // Build active filters for display
  const activeFilters: { label: string; key: string; value?: string }[] = [];
  if (appliedSearchText) activeFilters.push({ label: `Recherche: ${appliedSearchText}`, key: 'search' });
  selectedCountries.forEach(c => activeFilters.push({ label: c, key: 'country', value: c }));
  selectedCurrencies.forEach(c => activeFilters.push({ label: c, key: 'currency', value: c }));
  selectedNiches.forEach(n => activeFilters.push({ label: n, key: 'niche', value: n }));
  selectedPixels.forEach(p => activeFilters.push({ label: p, key: 'pixel', value: p }));

  // Remove single filter
  const removeFilter = (key: string, value?: string) => {
    if (key === 'search') {
      setSearchText("");
      setAppliedSearchText("");
    } else if (key === 'country' && value) {
      setSelectedCountries(prev => prev.filter(c => c !== value));
    } else if (key === 'currency' && value) {
      setSelectedCurrencies(prev => prev.filter(c => c !== value));
    } else if (key === 'niche' && value) {
      setSelectedNiches(prev => prev.filter(n => n !== value));
    } else if (key === 'pixel' && value) {
      setSelectedPixels(prev => prev.filter(p => p !== value));
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
        onTutorialClick={() => console.log("Tutoriel clicked")}
        icon="ri-store-2-line"
        iconType="icon"
        showStats={false}
      />

      <div className="bg-white home-content-wrapper">
        <div className="p-3 w-max-width-xl mx-auto">
          
          {/* Trial Alert Banner - Matching Laravel style */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
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
                Il vous reste <strong style={{ color: '#d4ac0d' }}>5</strong> recherches avec filtres sur votre essai gratuit (4 jours).
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
                Débloquer l'accès complet
              </Link>
            </div>
          </motion.div>
          
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
                placeholder="Rechercher par nom, ville, boutique, catégorie, niche..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
          </motion.div>

          {/* Smart Preset Filters - Laravel Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
            className="mb-3"
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
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            <p className="text-uppercase fs-xs text-light-gray fw-500 mb-2 mt-1">FILTRES</p>
            <div className="filters-grid mb-4">
              <ProductsFilter 
                onOpenChange={() => {}} 
                onApply={handleApplyFilters}
              />

              <NicheDropdown
                selectedNiches={selectedNiches}
                onNichesChange={setSelectedNiches}
                onApply={handleApplyFilters}
                isActive={selectedNiches.length > 0}
              />

              <MonthlyVisitsFilter 
                onOpenChange={() => {}} 
                onApply={handleApplyFilters}
              />

              <TrafficGrowthFilter 
                onOpenChange={() => {}} 
                onApply={handleApplyFilters}
              />
              
              <DailyRevenueFilter 
                onOpenChange={() => {}} 
                onApply={handleApplyFilters}
              />

              <CurrencyFilter 
                selectedCurrencies={selectedCurrencies}
                onCurrenciesChange={setSelectedCurrencies}
                onApply={handleApplyFilters}
                isActive={selectedCurrencies.length > 0}
              />

              <MarketsFilter 
                selectedCountries={selectedCountries}
                onCountriesChange={setSelectedCountries}
                onApply={handleApplyFilters}
                isActive={selectedCountries.length > 0}
              />
              
              <ActiveAdsFilter 
                onOpenChange={() => {}} 
                onApply={handleApplyFilters}
              />

              <PixelsFilter 
                selectedPixels={selectedPixels}
                onPixelsChange={setSelectedPixels}
                onApply={handleApplyFilters}
                isActive={selectedPixels.length > 0}
              />
            </div>

            {/* Active Filters Tags */}
            {activeFilters.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mb-3">
                {activeFilters.map((filter, index) => (
                  <span 
                    key={`${filter.key}-${filter.value || index}`}
                    className="badge bg-primary d-flex align-items-center gap-1"
                    style={{ padding: '6px 10px', borderRadius: '20px', fontSize: '12px' }}
                  >
                    {filter.label}
                    <button 
                      className="btn-close btn-close-white ms-1" 
                      style={{ fontSize: '8px' }}
                      onClick={() => removeFilter(filter.key, filter.value)}
                    ></button>
                  </span>
                ))}
                <button 
                  className="btn btn-link text-danger fs-xs p-0"
                  onClick={resetFilters}
                >
                  <i className="ri-refresh-line me-1"></i>
                  Réinitialiser les filtres
                </button>
            </div>
            )}

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
          </motion.div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger mb-4">
              {error}
            </div>
          )}

          {/* Shops Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
            className="table-view mt-2"
          >
            {isLoading && shops.length === 0 ? (
              <div className="table-wrapper" style={{ paddingBottom: '100px', overflowX: 'auto' }}>
                <Table id="shopsTable" className="table mb-0">
                  <TableHeader className="bg-weak-gray">
                    <TableRow className="border-0">
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500">Boutique</TableHead>
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500">Produit le plus vendu</TableHead>
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500">Publicités actives (90j)</TableHead>
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500" style={{ minWidth: '134px' }}>Meilleures pubs</TableHead>
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500">Part du marché</TableHead>
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500">Traffic (tendance 90j)</TableHead>
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
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500">Traffic (tendance 90j)</TableHead>
                      <TableHead className="border-0 text-uppercase text-sub fs-xs fw-500">Plateformes</TableHead>
                      <TableHead className="sticky_col action_col border-0 text-center text-uppercase text-sub fs-xs fw-500" style={{ backgroundColor: '#f5f7fa', minWidth: '200px' }}>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shops.map((shop, index) => (
                      <TableRow
                        key={shop.id}
                        className="shop_item"
                        style={{ animation: `fadeIn 0.4s ease-out ${0.05 * (index % 20)}s both` }}
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
                              {shop.trafficChange !== 0 && (
                                <span className={`fs-xs ${shop.trafficChange >= 0 ? 'text-success' : 'text-danger'}`}>
                                  {' '}({shop.trafficChange >= 0 ? '+' : ''}{formatNumber(shop.trafficChange)})
                                  </span>
                                )}
                            </p>
                              </div>
                          <div style={{ maxWidth: '120px' }}>
                            {shop.trafficData && shop.trafficData.length > 1 ? (
                              <MiniChart 
                                data={shop.trafficData} 
                                trend={shop.trafficChange >= 0 ? 'up' : 'down'}
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
          </motion.div>
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
