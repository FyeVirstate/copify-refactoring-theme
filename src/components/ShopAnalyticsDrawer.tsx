"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Country code mapping
const countryCodeToNumeric: Record<string, string> = {
  'US': '840', 'CA': '124', 'MX': '484', 'BR': '76', 'AR': '32', 'GB': '826', 'FR': '250', 'DE': '276', 
  'ES': '724', 'IT': '380', 'NL': '528', 'BE': '56', 'PT': '620', 'CH': '756', 'AT': '40', 'SE': '752', 
  'NO': '578', 'DK': '208', 'FI': '246', 'PL': '616', 'AU': '36', 'NZ': '554', 'JP': '392', 'KR': '410',
  'CN': '156', 'IN': '356', 'RU': '643', 'ZA': '710', 'EG': '818', 'NG': '566', 'AE': '784', 'SA': '682',
  'TR': '792', 'IL': '376', 'SG': '702', 'MY': '458', 'ID': '360', 'TH': '764', 'VN': '704', 'PH': '608',
};

// Types
interface ShopDetails {
  shop: {
    id: number;
    name: string | null;
    url: string | null;
    country: string | null;
    locale: string | null;
    currency: string | null;
    productsCount: number | null;
    themeName: string | null;
    theme?: string | null;
    schemaVersion: string | null;
    schemaName?: string | null;
    screenshot: string | null;
    category: string | null;
    fonts: string[];
    colors: string[];
    apps: Array<{ name: string; icon: string | null; link: string | null }>;
    pixels: string[];
    createdAt: string | null;
    whoisAt: string | null;
    fbPageId: string | null;
  };
  metrics: {
    dailyRevenue: number;
    monthlyRevenue: number;
    monthlyOrders: number;
    monthlyVisits: number;
    lastMonthVisits: number;
    visitsGrowth: string;
    threeMonthGrowth: string;
    activeAds: number | null;
    allAds: number | null;
    activeAdsCount: number;
    inactiveAdsCount: number;
    trend?: number;
    adsLastMonthGrowth?: string;
    adsThreeMonthGrowth?: string;
  };
  adsChart?: { labels: string[]; allAds: number[]; activeAds: number[]; };
  traffic: {
    chartData: Array<{ date: string; visits: number; }>;
    sources: Array<{ name: string; value: number; icon: string | null; }>;
    countries: Array<{ name: string; code: string; value: number; }>;
    social: Array<{ name: string; value: number; icon: string | null; }>;
    mainSource: string | null;
    growthRate: number;
  };
  adStats: { videoCount: number; imageCount: number; videoPercent: number; imagePercent: number; };
  products: Array<{ id: number; handle: string; title: string; vendor: string | null; productType: string | null; price: number | null; compareAtPrice: number | null; imageUrl: string | null; createdAt: string | null; bestProduct: boolean; }>;
  ads: Array<{ id: number; adArchiveId: string; pageName: string | null; pageId: string | null; type: string | null; status: string | null; imageLink: string | null; videoPreview: string | null; videoLink: string | null; caption: string | null; ctaText: string | null; firstSeen: string | null; lastSeen: string | null; createdAt: string | null; }>;
  suggestedShops: Array<any>;
  shopDomain: string;
  trackedSince: string;
}

interface ShopAnalyticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: number | null;
  shopUrl?: string;
  shopName?: string;
}

// Flag component
const FlagImage: React.FC<{ code: string; size?: number }> = ({ code, size = 20 }) => {
  const flagCode = (code || 'xx').toLowerCase().slice(0, 2);
  return (
    <img 
      src={`https://flagcdn.com/w40/${flagCode}.png`}
      alt={code}
      style={{ width: size, height: Math.round(size * 0.75), objectFit: 'cover', borderRadius: 2 }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  );
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #E5E7EB',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const TRAFFIC_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];

const TABS = [
  { id: 'overview', label: 'Traffic', icon: 'ri-line-chart-line' },
  { id: 'products', label: 'Produits', icon: 'ri-shopping-bag-line' },
  { id: 'ads', label: 'Publicités', icon: 'ri-advertisement-line' },
  { id: 'website', label: 'Site Web', icon: 'ri-global-line' },
  { id: 'tech', label: 'Tech & Apps', icon: 'ri-code-s-slash-line' },
];

// Ad Description component with "Voir Plus"
const AdDescription = ({ body }: { body: string }) => {
  const [expanded, setExpanded] = useState(false);
  const shortText = body.length > 120 ? body.slice(0, 120) + '...' : body;
  
  return (
    <div style={{ padding: '12px', fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
      <p style={{ margin: 0 }}>
        {expanded ? body : shortText}
        {body.length > 120 && (
          <button 
            onClick={() => setExpanded(!expanded)}
            style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', padding: 0, marginLeft: 4, fontSize: 13 }}
          >
            {expanded ? 'Voir moins' : 'Voir Plus'}
          </button>
        )}
      </p>
    </div>
  );
};

export default function ShopAnalyticsDrawer({ isOpen, onClose, shopId, shopUrl, shopName }: ShopAnalyticsDrawerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [shopDetails, setShopDetails] = useState<ShopDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'sales' | 'traffic'>('sales');
  const [activeProductTab, setActiveProductTab] = useState<'bestsellers' | 'latest'>('bestsellers');
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [hoveredTrafficSource, setHoveredTrafficSource] = useState<{ name: string; value: number; color: string } | null>(null);
  const [showMapView, setShowMapView] = useState(true);
  const [savedAdsIds, setSavedAdsIds] = useState<Set<number>>(new Set());
  
  // Ads filters
  const [formatFilter, setFormatFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [adsToShow, setAdsToShow] = useState(25);
  
  // Website iframe error
  const [iframeError, setIframeError] = useState(false);
  
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Clear old data when shopId changes (before loading new data)
  useEffect(() => {
    // Reset all state when shopId changes
    setShopDetails(null);
    setError(null);
    setActiveTab('overview');
    setAdsToShow(25);
    setShowAllProducts(false);
    setFormatFilter([]);
    setStatusFilter([]);
    setIframeError(false);
  }, [shopId]);

  // Load shop details
  useEffect(() => {
    if (isOpen && shopId) {
      const loadDetails = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const res = await fetch(`/api/track/${shopId}`);
          const data = await res.json();
          if (!data.success) throw new Error(data.error);
          setShopDetails(data.data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load shop details");
        } finally {
          setIsLoading(false);
        }
      };
      loadDetails();
    }
  }, [isOpen, shopId]);

  // Infinite scroll for ads - load 25 at a time
  const loadMoreAds = useCallback(() => {
    setAdsToShow(prev => prev + 25);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && activeTab === 'ads') {
          loadMoreAds();
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loadMoreAds, activeTab]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Reset iframe error when tab changes
  useEffect(() => {
    if (activeTab === 'website') {
      setIframeError(false);
    }
  }, [activeTab]);

  if (!isOpen) return null;

  const formatCurrency = (value: number, symbol: string = '€') => {
    if (value >= 1000000) return `${symbol}${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${symbol}${(value / 1000).toFixed(1)}k`;
    return `${symbol}${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => new Intl.NumberFormat('fr-FR').format(value);
  
  const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`;
    if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`;
    return `Il y a ${Math.floor(days / 365)} ans`;
  };

  // Sales chart data
  const getSalesChartData = () => {
    if (!shopDetails) return [];
    const monthlyRevenue = shopDetails.metrics.monthlyRevenue || 0;
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentMonth = new Date().getMonth();
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const monthIdx = (currentMonth - i + 12) % 12;
      data.push({ month: months[monthIdx], value: Math.round(monthlyRevenue * (0.7 + Math.random() * 0.6)) });
    }
    return data;
  };

  // Traffic chart data
  const getTrafficChartData = () => {
    if (!shopDetails?.traffic?.chartData || shopDetails.traffic.chartData.length === 0) {
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
      const visits = shopDetails?.metrics?.monthlyVisits || 10000;
      return months.map(month => ({ month, value: Math.round(visits * (0.5 + Math.random() * 0.8)) }));
    }
    return shopDetails.traffic.chartData.slice(-6).map(d => ({
      month: new Date(d.date).toLocaleDateString('fr-FR', { month: 'short' }),
      value: d.visits,
    }));
  };

  const chartData = activeChartTab === 'sales' ? getSalesChartData() : getTrafficChartData();

  // Traffic sources
  const trafficSources = (shopDetails?.traffic?.sources || []).slice(0, 6).map((s, i) => ({
    ...s, color: TRAFFIC_COLORS[i % TRAFFIC_COLORS.length],
  }));

  // Products
  const bestsellerProducts = shopDetails?.products?.filter(p => p.bestProduct) || [];
  const latestProducts = [...(shopDetails?.products || [])].sort((a, b) => 
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  ).slice(0, 10);

  // Processed ads with filters
  const processedAds = (shopDetails?.ads || []).map(ad => {
    const firstSeen = ad.firstSeen ? new Date(ad.firstSeen) : new Date();
    const lastSeen = ad.lastSeen ? new Date(ad.lastSeen) : new Date();
    const activeDays = Math.max(0, Math.ceil((lastSeen.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24)));
    // Normalize type and status to lowercase
    const normalizedType = (ad.type || '').toLowerCase();
    const normalizedStatus = (ad.status || 'inactive').toLowerCase();
    return { 
      ...ad, 
      activeDays, 
      name: ad.pageName || shopDetails?.shop?.name || 'Unknown', 
      img: ad.imageLink, 
      videoPoster: ad.videoPreview, 
      videoUrl: ad.videoLink,
      type: normalizedType,
      status: normalizedStatus,
    };
  });

  const filteredAds = processedAds.filter(ad => {
    if (formatFilter.length > 0 && !formatFilter.includes(ad.type)) return false;
    if (statusFilter.length > 0 && !statusFilter.includes(ad.status)) return false;
    return true;
  });

  const displayName = shopDetails?.shop?.name || shopName || shopUrl?.replace('www.', '') || 'Boutique';
  const displayUrl = shopDetails?.shop?.url || shopUrl || '';
  const currency = shopDetails?.shop?.currency === 'USD' ? '$' : '€';

  // Toggle ad save
  const toggleSaveAd = (adId: number) => {
    setSavedAdsIds(prev => {
      const next = new Set(prev);
      if (next.has(adId)) next.delete(adId);
      else next.add(adId);
      return next;
    });
  };

  // Donut chart path
  const createArcPath = (startPercent: number, endPercent: number, radius: number, innerRadius: number, center: number) => {
    const startAngle = (startPercent / 100) * 2 * Math.PI - Math.PI / 2;
    const endAngle = (endPercent / 100) * 2 * Math.PI - Math.PI / 2;
    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    const x3 = center + innerRadius * Math.cos(endAngle);
    const y3 = center + innerRadius * Math.sin(endAngle);
    const x4 = center + innerRadius * Math.cos(startAngle);
    const y4 = center + innerRadius * Math.sin(startAngle);
    const largeArc = endPercent - startPercent > 50 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  // Map highlighted countries
  const highlightedCountryIds = new Set<string>();
  const countryDataMap = new Map<string, { code: string; name: string; value: number }>();
  const countriesData = shopDetails?.traffic?.countries?.length 
    ? shopDetails.traffic.countries 
    : [{ name: shopDetails?.shop?.country || '', code: shopDetails?.shop?.country || 'xx', value: 100 }];
  
  countriesData.forEach(c => {
    const numericCode = countryCodeToNumeric[c.code?.toUpperCase()];
    if (numericCode) {
      highlightedCountryIds.add(numericCode);
      countryDataMap.set(numericCode, c);
    }
  });

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9998 }} />

      {/* Drawer */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: '95vh', backgroundColor: '#F9FAFB', borderTopLeftRadius: 16, borderTopRightRadius: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', boxShadow: '0 -4px 30px rgba(0,0,0,0.15)' }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
          <div style={{ width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px 16px', borderBottom: '1px solid #E5E7EB', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#6B7280' }}>
              <i className="ri-arrow-left-line" style={{ fontSize: 20 }}></i>
            </button>
            <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '1px solid #E5E7EB', background: '#F3F4F6' }}>
              <img src={`https://logo.clearbit.com/${displayUrl.replace('www.', '')}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${displayUrl}&sz=64`; }} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#111827' }}>{displayName}</h2>
              <a href={`https://${displayUrl}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}>{displayUrl}</a>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {shopDetails?.shop?.country && <div style={{ background: '#F3F4F6', padding: '6px 12px', borderRadius: 8 }}><FlagImage code={shopDetails.shop.country} size={20} /></div>}
            <a href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=${displayUrl}`} target="_blank" rel="noopener noreferrer" style={{ background: '#F3F4F6', padding: '6px 12px', borderRadius: 8, fontSize: 13, color: '#374151', textDecoration: 'none', fontWeight: 500 }}>Meta Ad Library ↗</a>
            {shopId && <Link href={`/dashboard/track/${shopId}`} style={{ background: '#0c6cfb', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}><i className="ri-external-link-line"></i> Analytics complets</Link>}
            <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, color: '#6B7280' }}><i className="ri-close-line" style={{ fontSize: 18 }}></i></button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '0 24px', borderBottom: '1px solid #E5E7EB', background: '#fff' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: activeTab === tab.id ? '#0c6cfb' : '#6B7280', borderBottom: activeTab === tab.id ? '2px solid #0c6cfb' : '2px solid transparent', marginBottom: -1 }}>
              <i className={tab.icon} style={{ fontSize: 16 }}></i>{tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {isLoading ? (
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
              {/* Skeleton Loading State */}
              {/* Metrics Row Skeleton */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ ...cardStyle, padding: '20px 24px' }}>
                    <div style={{ height: 28, width: '60%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 6, marginBottom: 8 }} />
                    <div style={{ height: 14, width: '80%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 4 }} />
                  </div>
                ))}
              </div>
              {/* Chart Skeleton */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 24 }}>
                <div style={{ ...cardStyle, padding: 20, height: 320 }}>
                  <div style={{ height: 20, width: '40%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 4, marginBottom: 16 }} />
                  <div style={{ height: 220, background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 8 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ ...cardStyle, padding: 20, height: 150 }}>
                    <div style={{ height: 16, width: '50%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 4, marginBottom: 12 }} />
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                      <div style={{ flex: 1 }}>
                        {[1, 2, 3].map(j => <div key={j} style={{ height: 12, width: '70%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 4, marginBottom: 8 }} />)}
                      </div>
                    </div>
                  </div>
                  <div style={{ ...cardStyle, padding: 20, flex: 1 }}>
                    <div style={{ height: 16, width: '50%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 4, marginBottom: 12 }} />
                    {[1, 2, 3].map(j => <div key={j} style={{ height: 14, width: '90%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 4, marginBottom: 10 }} />)}
                  </div>
                </div>
              </div>
              {/* Ads Preview Skeleton */}
              <div style={{ ...cardStyle, padding: 20 }}>
                <div style={{ height: 18, width: '30%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 4, marginBottom: 16 }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ padding: 12, borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 8 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ height: 14, width: '70%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 4, marginBottom: 6 }} />
                          <div style={{ height: 10, width: '40%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 4 }} />
                        </div>
                      </div>
                      <div style={{ aspectRatio: '1/1', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', color: '#EF4444', paddingTop: 100 }}>
              <i className="ri-error-warning-line" style={{ fontSize: 48 }}></i>
              <p style={{ marginTop: 16 }}>{error}</p>
            </div>
          ) : shopDetails ? (
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
              
              {/* ========== OVERVIEW TAB ========== */}
              {activeTab === 'overview' && (
                <>
                  {/* Metrics Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                    {[
                      { value: formatCurrency(shopDetails.metrics.dailyRevenue, currency), label: "Ventes quotidiennes estimées", trend: shopDetails.metrics.trend ?? 1, hasArrow: true },
                      { value: formatCurrency(shopDetails.metrics.monthlyRevenue, currency), label: "Ventes mensuelles estimées", trend: shopDetails.metrics.trend ?? 1, hasArrow: true },
                      { value: String(shopDetails.shop.productsCount || 0), label: "Nombre de produits", trend: 0, hasArrow: false },
                      { value: String(shopDetails.metrics.monthlyOrders || 0), label: "Commandes par mois", trend: shopDetails.metrics.trend ?? 1, hasArrow: true },
                    ].map((m, i) => (
                      <div key={i} style={{ ...cardStyle, padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 28, fontWeight: 600, color: '#111827' }}>{m.value}</span>
                          {m.hasArrow && m.trend === 1 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7,7 17,7 17,17"/></svg>}
                        </div>
                        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Two Column Layout */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 24 }}>
                    {/* Chart Card */}
                    <div style={{ ...cardStyle, padding: 20 }}>
                      <div style={{ display: 'flex', gap: 32, marginBottom: 20 }}>
                        <button onClick={() => setActiveChartTab('sales')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', border: 'none', background: 'none', borderBottom: activeChartTab === 'sales' ? '2px solid #0C6CFB' : '2px solid transparent', fontWeight: 500, fontSize: 14, cursor: 'pointer', color: activeChartTab === 'sales' ? '#111827' : '#6B7280' }}>
                          <i className="ri-money-dollar-circle-line" style={{ fontSize: 18, color: activeChartTab === 'sales' ? '#0C6CFB' : '#9CA3AF' }}></i>
                          Ventes mensuelles estimées
                        </button>
                        <button onClick={() => setActiveChartTab('traffic')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', border: 'none', background: 'none', borderBottom: activeChartTab === 'traffic' ? '2px solid #0C6CFB' : '2px solid transparent', fontWeight: 500, fontSize: 14, cursor: 'pointer', color: activeChartTab === 'traffic' ? '#111827' : '#6B7280' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={activeChartTab === 'traffic' ? '#0C6CFB' : '#9CA3AF'} strokeWidth="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12" /></svg>
                          Trafic estimé
                        </button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
                        <span style={{ fontSize: 12, color: '#6B7280' }}>3 MOIS <span style={{ background: Number(shopDetails.metrics.threeMonthGrowth) >= 0 ? '#DCFCE7' : '#FEE2E2', color: Number(shopDetails.metrics.threeMonthGrowth) >= 0 ? '#16A34A' : '#DC2626', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500, marginLeft: 8 }}>{Number(shopDetails.metrics.threeMonthGrowth) >= 0 ? '+' : ''}{shopDetails.metrics.threeMonthGrowth}%</span></span>
                        <span style={{ fontSize: 12, color: '#6B7280' }}>1 MOIS <span style={{ background: Number(shopDetails.metrics.visitsGrowth) >= 0 ? '#DCFCE7' : '#FEE2E2', color: Number(shopDetails.metrics.visitsGrowth) >= 0 ? '#16A34A' : '#DC2626', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500, marginLeft: 8 }}>{Number(shopDetails.metrics.visitsGrowth) >= 0 ? '+' : ''}{shopDetails.metrics.visitsGrowth}%</span></span>
                      </div>
                      <div style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                            <defs><linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22C55E" stopOpacity={0.2}/><stop offset="95%" stopColor="#22C55E" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(value) => { try { const date = new Date(value); if (!isNaN(date.getTime())) return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }); return value; } catch { return value; } }} />
                            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => activeChartTab === 'sales' ? `${formatNumber(v)}€` : formatNumber(v)} width={70} />
                            <Tooltip formatter={(value) => [activeChartTab === 'sales' ? `${formatNumber(Number(value) || 0)} €` : `${formatNumber(Number(value) || 0)} visites`, activeChartTab === 'sales' ? 'Ventes' : 'Trafic']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                            <Area type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2} fill="url(#colorValue)" dot={{ fill: '#22C55E', strokeWidth: 2, r: 4, stroke: '#fff' }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Traffic Sources + Countries */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Traffic Donut */}
                      <div style={{ ...cardStyle, padding: 20 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: '#111827' }}>Sources de Trafics</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                          <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
                            {(() => {
                              const total = trafficSources.reduce((sum, s) => sum + s.value, 0);
                              let currentPercent = 0;
                              const segments = trafficSources.map(s => {
                                const start = currentPercent;
                                currentPercent += total > 0 ? (s.value / total) * 100 : 0;
                                return { ...s, startPercent: start, endPercent: currentPercent };
                              });
                              return (
                                <svg width={100} height={100}>
                                  {segments.map((seg, i) => seg.endPercent - seg.startPercent > 0 && (
                                    <path key={i} d={createArcPath(seg.startPercent, seg.endPercent, 45, 30, 50)} fill={seg.color} style={{ cursor: 'pointer', opacity: hoveredTrafficSource && hoveredTrafficSource.name !== seg.name ? 0.5 : 1 }} onMouseEnter={() => setHoveredTrafficSource({ name: seg.name, value: seg.value, color: seg.color })} onMouseLeave={() => setHoveredTrafficSource(null)} />
                                  ))}
                                  {hoveredTrafficSource && <><text x={50} y={46} textAnchor="middle" fill="#111827" fontSize="12" fontWeight="600">{Math.round(hoveredTrafficSource.value)}%</text><text x={50} y={58} textAnchor="middle" fill="#6B7280" fontSize="8">{hoveredTrafficSource.name}</text></>}
                                </svg>
                              );
                            })()}
                          </div>
                          <div style={{ flex: 1 }}>
                            {trafficSources.slice(0, 4).map((s, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', cursor: 'pointer' }} onMouseEnter={() => setHoveredTrafficSource({ name: s.name, value: s.value, color: s.color })} onMouseLeave={() => setHoveredTrafficSource(null)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} /><span style={{ fontSize: 11, color: '#374151' }}>{s.name}</span></div>
                                <span style={{ fontSize: 11, fontWeight: 500, color: '#111827' }}>{Math.round(s.value)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Countries */}
                      <div style={{ ...cardStyle, padding: 20 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: '#111827' }}>Marchés exploités</div>
                        {countriesData.slice(0, 4).map((c, i, arr) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                            <span style={{ fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}><FlagImage code={c.code} size={18} />{c.name}</span>
                            <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{Math.round(c.value)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mini Ads Preview - EXACT SAME design as Ads Tab */}
                  <div style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>Publicités ({shopDetails.metrics.allAds || processedAds.length})</span>
                        <span style={{ fontSize: 12, color: '#22C55E' }}>● {shopDetails.metrics.activeAdsCount} Actives</span>
                      </div>
                      <button onClick={() => setActiveTab('ads')} style={{ padding: '6px 12px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff', fontSize: 12, color: '#374151', cursor: 'pointer' }}>Voir tout →</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                      {processedAds.slice(0, 3).map(ad => (
                        <div key={ad.id} className="post-wrapper" style={{ background: '#fff', border: '1px solid #E1E4EA', borderRadius: 10, overflow: 'hidden' }}>
                          {/* Header - Exact same as Ads Tab */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12, padding: 12, borderBottom: '1px solid #F3F4F6' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <img src={ad.pageId ? `https://graph.facebook.com/${ad.pageId}/picture?type=square` : '/img_not_found.png'} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).src = '/img_not_found.png'; }} />
                              <div>
                                <h4 style={{ fontSize: 13, marginBottom: 2, fontWeight: 500 }}>{ad.name || 'Unknown'}</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: ad.status === 'active' ? '#22C55E' : '#9CA3AF' }}></span>
                                  <span style={{ fontSize: 11, color: ad.status === 'active' ? '#22C55E' : '#9CA3AF' }}>{ad.status === 'active' ? `Active ${ad.activeDays}j` : 'Inactive'}</span>
                                </div>
                              </div>
                            </div>
                            <a href={`https://www.facebook.com/ads/library/?id=${ad.adArchiveId}`} target="_blank" rel="noopener noreferrer" style={{ width: 32, height: 32, borderRadius: 6, background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            </a>
                          </div>

                          {/* Description - with Voir Plus */}
                          {ad.caption && (
                            <div style={{ borderBottom: '1px solid #F3F4F6' }}>
                              <AdDescription body={ad.caption} />
                            </div>
                          )}

                          {/* Media - Video or Image */}
                          <div style={{ position: 'relative' }}>
                            {ad.type === 'video' && ad.videoUrl ? (
                              <video 
                                src={ad.videoUrl} 
                                poster={ad.img || undefined} 
                                controls 
                                style={{ width: '100%', display: 'block', maxHeight: 400 }} 
                              />
                            ) : ad.img ? (
                              <img src={ad.img} alt="" style={{ width: '100%', display: 'block' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div style={{ aspectRatio: '16/9', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="ri-image-line" style={{ fontSize: 48, color: '#D1D5DB' }}></i></div>
                            )}
                            {/* Download Button */}
                            <a 
                              href={ad.type === 'video' ? ad.videoUrl || ad.img || '' : ad.img || ''} 
                              download 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, background: 'rgba(255,255,255,0.9)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* World Map Section - From Traffic */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {/* Countries List with Progress */}
                    <div style={{ ...cardStyle, padding: 20 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: '#111827' }}>Marchés exploités par la boutique</div>
                      {countriesData.slice(0, 6).map((c, i, arr) => (
                        <div key={i} style={{ marginBottom: i < arr.length - 1 ? 12 : 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}><FlagImage code={c.code} size={20} />{c.name}</span>
                            <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{Math.round(c.value)}%</span>
                          </div>
                          <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3 }}>
                            <div style={{ height: '100%', background: '#3B82F6', borderRadius: 3, width: `${Math.min(c.value, 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* World Map */}
                    <div style={{ ...cardStyle, padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>Carte du monde</span>
                        <button onClick={() => setShowMapView(!showMapView)} style={{ width: 32, height: 32, border: '1px solid #E5E7EB', background: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title={showMapView ? 'Réseaux sociaux' : 'Carte'}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        </button>
                      </div>
                      {showMapView ? (
                        <div style={{ height: 200 }}>
                          <ComposableMap projection="geoMercator" projectionConfig={{ scale: 100, center: [0, 30] }} style={{ width: '100%', height: '100%' }}>
                            <ZoomableGroup>
                              <Geographies geography={geoUrl}>
                                {({ geographies }) => geographies.map(geo => {
                                  const geoId = String(geo.id);
                                  const isHighlighted = highlightedCountryIds.has(geoId) || highlightedCountryIds.has(geoId.replace(/^0+/, ''));
                                  return (
                                    <Geography key={geo.rsmKey} geography={geo} fill={isHighlighted ? '#3B82F6' : '#E5E7EB'} stroke="#fff" strokeWidth={0.5} style={{ default: { outline: 'none' }, hover: { fill: isHighlighted ? '#2563EB' : '#D1D5DB', outline: 'none' }, pressed: { outline: 'none' } }} />
                                  );
                                })}
                              </Geographies>
                            </ZoomableGroup>
                          </ComposableMap>
                        </div>
                      ) : (
                        <div>
                          {shopDetails.traffic.social.slice(0, 5).map((s, i, arr) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                              <span style={{ flex: 1, fontSize: 13, color: '#374151' }}>{s.name}</span>
                              <span style={{ fontSize: 13, fontWeight: 500, color: '#6B7280' }}>{Math.round(s.value)}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ========== PRODUCTS TAB - EXACT DESIGN ========== */}
              {activeTab === 'products' && (
                <div className="products-section-box" style={{ ...cardStyle, padding: 0, position: 'relative' }}>
                  {/* Tabs */}
                  <ul style={{ display: 'flex', alignItems: 'stretch', gap: 24, borderBottom: '1px solid #dee2e6', margin: 0, padding: '0 20px', listStyle: 'none' }}>
                    <li>
                      <button onClick={() => setActiveProductTab('bestsellers')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '16px 14px', border: 'none', background: 'none', borderBottom: activeProductTab === 'bestsellers' ? '2px solid #0C6CFB' : '2px solid transparent', fontWeight: 500, fontSize: 14, cursor: 'pointer', color: '#0E121B' }}>
                        <i className="ri-thumb-up-line" style={{ marginRight: 6, color: activeProductTab === 'bestsellers' ? '#0C6CFB' : '#525866', fontSize: 15 }}></i>
                        Meilleures ventes
                      </button>
                    </li>
                    <li>
                      <button onClick={() => setActiveProductTab('latest')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '16px 14px', border: 'none', background: 'none', borderBottom: activeProductTab === 'latest' ? '2px solid #0C6CFB' : '2px solid transparent', fontWeight: 500, fontSize: 14, cursor: 'pointer', color: '#0E121B' }}>
                        <i className="ri-megaphone-line" style={{ marginRight: 6, color: activeProductTab === 'latest' ? '#0C6CFB' : '#525866', fontSize: 15 }}></i>
                        Derniers produits ajoutés sur le site
                      </button>
                    </li>
                  </ul>
                  
                  {/* Find Supplier Button */}
                  <div style={{ position: 'absolute', right: 18, top: 12 }}>
                    <a href="https://autods.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 500, color: '#374151', textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                      <img src="/img/autods-logo.jpeg" alt="AutoDS" style={{ width: 24, height: 24, borderRadius: 8 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      Trouver mon Fournisseur
                    </a>
                  </div>

                  {/* Products List */}
                  <div style={{ padding: '20px' }}>
                    {(activeProductTab === 'bestsellers' ? bestsellerProducts : latestProducts)
                      .slice(0, showAllProducts ? undefined : 5)
                      .map((p, idx) => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                        {activeProductTab === 'bestsellers' && <div style={{ marginRight: 12, minWidth: 16 }}><p style={{ color: '#1f2937', marginBottom: 0, fontWeight: 700, fontSize: 14 }}>{idx + 1}</p></div>}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: 8, paddingRight: 16, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#f8f9fa', flexShrink: 0 }}>
                              <img src={p.imageUrl || 'https://via.placeholder.com/80'} alt={p.title || ''} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80'; }} />
                            </div>
                            <div style={{ margin: '0 12px', padding: '8px 0', flex: 1 }}>
                              <h4 style={{ fontWeight: 400, fontSize: 14, color: '#111827', maxHeight: '2.4em', lineHeight: '1.2em', overflow: 'hidden', marginBottom: 4 }}>{p.title}</h4>
                              <a href={`https://${shopDetails.shop.url}/products/${p.handle}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0d6efd', fontSize: 13, textDecoration: 'none' }}>Voir le produit</a>
                              {activeProductTab === 'latest' && p.createdAt && (
                                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}><span style={{ fontWeight: 600 }}>{formatTimeAgo(p.createdAt)}</span><span style={{ marginLeft: 8 }}>{formatDate(p.createdAt)}</span></div>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                            <span style={{ color: '#0c6cfb', fontWeight: 600, fontSize: 18 }}>{currency}{p.price || 0}</span>
                            <a href={`https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(p.title || '')}`} target="_blank" rel="noopener noreferrer" style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', padding: '8px 12px', fontSize: 13, color: '#374151', textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <img src="/img/icons/aliexpress-icon.png" alt="" style={{ width: 16, height: 16 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              Trouver sur Aliexpress
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* View More */}
                  {!showAllProducts && (activeProductTab === 'bestsellers' ? bestsellerProducts : latestProducts).length > 5 && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                      <button onClick={() => setShowAllProducts(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151' }}>Voir Plus ↓</button>
                    </div>
                  )}
                  {showAllProducts && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                      <button onClick={() => setShowAllProducts(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151' }}>Voir Moins ↑</button>
                    </div>
                  )}
                </div>
              )}

              {/* ========== ADS TAB - LIKE TOP ADS PAGE ========== */}
              {activeTab === 'ads' && (
                <>
                  {/* Ads Evolution + Type Charts */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 24 }}>
                    {/* Evolution Chart */}
                    <div style={{ ...cardStyle, padding: 20 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, color: '#111827' }}>Évolution du nombre de publicités</div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 12 }}>
                        <span style={{ fontSize: 11, color: '#6B7280' }}>3 MOIS <span style={{ background: Number(shopDetails.metrics.adsThreeMonthGrowth || 0) >= 0 ? '#DCFCE7' : '#FEE2E2', color: Number(shopDetails.metrics.adsThreeMonthGrowth || 0) >= 0 ? '#16A34A' : '#DC2626', padding: '3px 8px', borderRadius: 10, fontSize: 11, marginLeft: 6 }}>{Number(shopDetails.metrics.adsThreeMonthGrowth || 0) >= 0 ? '+' : ''}{shopDetails.metrics.adsThreeMonthGrowth || 0}%</span></span>
                        <span style={{ fontSize: 11, color: '#6B7280' }}>1 MOIS <span style={{ background: Number(shopDetails.metrics.adsLastMonthGrowth || 0) >= 0 ? '#DCFCE7' : '#FEE2E2', color: Number(shopDetails.metrics.adsLastMonthGrowth || 0) >= 0 ? '#16A34A' : '#DC2626', padding: '3px 8px', borderRadius: 10, fontSize: 11, marginLeft: 6 }}>{Number(shopDetails.metrics.adsLastMonthGrowth || 0) >= 0 ? '+' : ''}{shopDetails.metrics.adsLastMonthGrowth || 0}%</span></span>
                      </div>
                      <div style={{ height: 180 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={shopDetails.adsChart?.labels?.length ? shopDetails.adsChart.labels.map((label, i) => ({ month: label, allAds: shopDetails.adsChart?.allAds[i] || 0, activeAds: shopDetails.adsChart?.activeAds[i] || 0 })) : [{ month: 'Jan', allAds: 0, activeAds: 0 }]} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(value) => { try { const date = new Date(value); if (!isNaN(date.getTime())) return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }); return value; } catch { return value; } }} />
                            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={40} />
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                            <Area type="monotone" dataKey="allAds" stroke="#CACFD8" strokeWidth={2} fill="transparent" name="Total" />
                            <Area type="monotone" dataKey="activeAds" stroke="#22C55E" strokeWidth={2} fill="#22C55E20" name="Actives" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Type Gauge */}
                    <div style={{ ...cardStyle, padding: 20 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: '#111827' }}>Type de Publicités</div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: 160, height: 90 }}>
                          <svg viewBox="0 0 160 90" width="160" height="90">
                            <path d={`M 10 80 A 70 70 0 0 1 150 80`} fill="none" stroke="#E5E7EB" strokeWidth={12} strokeLinecap="round" />
                            {shopDetails.adStats.videoPercent > 0 && <path d={`M 10 80 A 70 70 0 0 1 ${80 - 70 * Math.cos((shopDetails.adStats.videoPercent / 100) * Math.PI)} ${80 - 70 * Math.sin((shopDetails.adStats.videoPercent / 100) * Math.PI)}`} fill="none" stroke="#22C55E" strokeWidth={12} strokeLinecap="round" />}
                          </svg>
                          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 600, color: '#111827' }}>{shopDetails.metrics.allAds || processedAds.length}</div>
                            <div style={{ fontSize: 10, color: '#6B7280' }}>Publicités</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid #E5E7EB', margin: '12px 0', paddingTop: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: '#22C55E', borderRadius: 2 }} /><span style={{ fontSize: 12, color: '#374151' }}>Vidéos</span></div><span style={{ fontSize: 12, color: '#9CA3AF' }}>({shopDetails.adStats.videoPercent}%)</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: '#3B82F6', borderRadius: 2 }} /><span style={{ fontSize: 12, color: '#374151' }}>Images</span></div><span style={{ fontSize: 12, color: '#9CA3AF' }}>({shopDetails.adStats.imagePercent}%)</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Header + Filters */}
                  <div style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>Publicités Facebook Ads ({filteredAds.length})</span>
                          <a href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=${shopDetails.shop.url}`} target="_blank" rel="noopener noreferrer" style={{ color: '#6B7280' }}>↗</a>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
                          <span><span style={{ color: '#22C55E' }}>●</span> {shopDetails.metrics.activeAdsCount} Actif</span>
                          <span><span style={{ color: '#9CA3AF' }}>●</span> {shopDetails.metrics.inactiveAdsCount} Inactif</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select value={formatFilter[0] || ''} onChange={(e) => setFormatFilter(e.target.value ? [e.target.value] : [])} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151' }}>
                          <option value="">Tous formats</option>
                          <option value="video">Vidéo</option>
                          <option value="image">Image</option>
                        </select>
                        <select value={statusFilter[0] || ''} onChange={(e) => setStatusFilter(e.target.value ? [e.target.value] : [])} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151' }}>
                          <option value="">Tous statuts</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    {/* Ads Grid - TOP ADS DESIGN */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                      {filteredAds.slice(0, adsToShow).map(ad => (
                        <div key={ad.id} className="post-wrapper" style={{ background: '#fff', border: '1px solid #E1E4EA', borderRadius: 10, overflow: 'hidden' }}>
                          {/* Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12, padding: 12, borderBottom: '1px solid #F3F4F6' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <img src={ad.pageId ? `https://graph.facebook.com/${ad.pageId}/picture?type=square` : '/img_not_found.png'} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).src = '/img_not_found.png'; }} />
                              <div>
                                <h4 style={{ fontSize: 13, marginBottom: 0, fontWeight: 500 }}>{(ad.name || 'Unknown').substring(0, 25)}{(ad.name || '').length > 25 ? '...' : ''}</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: ad.status === 'active' ? '#22C55E' : '#9CA3AF' }}></span>
                                  <span style={{ fontSize: 11, color: ad.status === 'active' ? '#22C55E' : '#9CA3AF' }}>{ad.status === 'active' ? `Active ${ad.activeDays}j` : 'Inactive'}</span>
                                </div>
                              </div>
                            </div>
                            <a href={`https://www.facebook.com/ads/library/?id=${ad.adArchiveId}`} target="_blank" rel="noopener noreferrer" style={{ width: 32, height: 32, borderRadius: 6, background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <i className="ri-meta-line" style={{ fontSize: 14, color: '#525866' }}></i>
                            </a>
                          </div>

                          {/* Description */}
                          {ad.caption && <AdDescription body={ad.caption} />}

                          {/* Media */}
                          <div style={{ position: 'relative' }}>
                            <button onClick={() => { const link = document.createElement('a'); link.href = ad.type === 'video' ? (ad.videoUrl || '') : (ad.img || ''); link.download = `ad-${ad.id}`; link.target = '_blank'; link.click(); }} style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, padding: '6px 10px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer' }}><i className="ri-download-2-fill" style={{ fontSize: 12 }}></i></button>
                            {ad.type === 'video' && ad.videoUrl ? (
                              <video width="100%" controls preload="none" poster={ad.videoPoster || undefined} style={{ display: 'block' }}><source src={ad.videoUrl} type="video/mp4" /></video>
                            ) : ad.img ? (
                              <img src={ad.img} alt="" style={{ width: '100%', display: 'block' }} onError={(e) => { (e.target as HTMLImageElement).src = '/img_not_found.png'; }} />
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: '#9ca3af', background: '#f3f4f6' }}><i className="ri-image-line" style={{ fontSize: 40 }}></i></div>
                            )}
                          </div>

                          {/* Actions */}
                          <div style={{ padding: 12 }}>
                            <a href={`https://${shopDetails.shop.url}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '8px 0', marginBottom: 8, border: '1px solid #e0e0e0', borderRadius: 6, color: '#374151', textDecoration: 'none', fontSize: 13, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                              <i className="ri-external-link-line"></i>Voir la boutique
                            </a>
                            <button onClick={() => toggleSaveAd(ad.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '8px 0', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', background: savedAdsIds.has(ad.id) ? 'rgba(12, 108, 251, 0.1)' : '#0c6cfb', color: savedAdsIds.has(ad.id) ? '#0c6cfb' : '#fff' }}>
                              <i className={`ri-bookmark-${savedAdsIds.has(ad.id) ? 'fill' : 'line'}`}></i>
                              {savedAdsIds.has(ad.id) ? 'Publicité sauvegardée' : 'Sauvegarder la publicité'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Load More */}
                    {filteredAds.length > adsToShow && (
                      <div ref={loadMoreRef} style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                        <div className="spinner-border text-primary" style={{ width: 32, height: 32 }}></div>
                      </div>
                    )}

                    {filteredAds.length === 0 && (
                      <div style={{ padding: 48, textAlign: 'center', color: '#6B7280' }}><i className="ri-advertisement-line" style={{ fontSize: 48, color: '#D1D5DB' }}></i><p style={{ marginTop: 16 }}>Aucune publicité</p></div>
                    )}
                  </div>
                </>
              )}

              {/* ========== TECH TAB ========== */}
              {activeTab === 'tech' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div style={{ ...cardStyle, padding: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#111827' }}>Applications ({shopDetails.shop.apps.length})</h3>
                    {shopDetails.shop.apps.slice(0, 12).map((app, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {app.icon && app.icon.startsWith('http') ? <img src={app.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>{(app.name || 'A')[0]}</span>}
                        </div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{app.name}</div>{app.link && <a href={app.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#0c6cfb', textDecoration: 'none' }}>En savoir plus</a>}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ ...cardStyle, padding: 20 }}><h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#111827' }}>Thème</h3><div style={{ background: '#F9FAFB', padding: '12px 16px', borderRadius: 8, border: '1px solid #E5E7EB' }}><a href={`https://www.google.com/search?q=${encodeURIComponent((shopDetails.shop.schemaName || shopDetails.shop.themeName || shopDetails.shop.theme || '') + ' shopify theme')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0C6CFB', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>{shopDetails.shop.schemaName || shopDetails.shop.themeName || shopDetails.shop.theme || 'Unknown'} {shopDetails.shop.schemaVersion || ''}</a></div></div>
                    <div style={{ ...cardStyle, padding: 20 }}><h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#111827' }}>Pixels</h3><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{shopDetails.shop.pixels.length > 0 ? shopDetails.shop.pixels.map((p, i) => <span key={i} style={{ padding: '6px 12px', background: '#F3F4F6', borderRadius: 6, fontSize: 12, color: '#374151' }}>{p}</span>) : <span style={{ color: '#9CA3AF', fontSize: 13 }}>Aucun pixel</span>}</div></div>
                    {shopDetails.shop.colors.length > 0 && <div style={{ ...cardStyle, padding: 20 }}><h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#111827' }}>Couleurs</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>{shopDetails.shop.colors.slice(0, 12).map((c, i) => <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><div style={{ width: '100%', aspectRatio: '1', background: c, borderRadius: 6, border: '1px solid #E5E7EB' }} /><span style={{ fontSize: 8, color: '#9CA3AF', marginTop: 4 }}>{c}</span></div>)}</div></div>}
                  </div>
                </div>
              )}

              {/* ========== WEBSITE TAB - SAFARI BROWSER ========== */}
              {activeTab === 'website' && (
                <div style={{ height: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column' }}>
                  {/* Safari Browser Window */}
                  <div style={{ 
                    background: 'linear-gradient(180deg, #F5F5F7 0%, #E8E8ED 100%)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                  }}>
                    {/* Title Bar */}
                    <div style={{
                      background: 'linear-gradient(180deg, #E8E8ED 0%, #D4D4D9 100%)',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      borderBottom: '1px solid #C7C7CC',
                    }}>
                      {/* Traffic Lights */}
                      <div style={{ display: 'flex', gap: 8, marginRight: 8 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'linear-gradient(180deg, #FF5F57 0%, #E0443E 100%)', border: '1px solid #E0443E', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)' }} />
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'linear-gradient(180deg, #FFBD2E 0%, #DEA123 100%)', border: '1px solid #DEA123', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)' }} />
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'linear-gradient(180deg, #28C840 0%, #1AAB29 100%)', border: '1px solid #1AAB29', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)' }} />
                      </div>
                      
                      {/* Navigation Buttons */}
                      <div style={{ display: 'flex', gap: 4, marginRight: 12 }}>
                        <button style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E8E93' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                        </button>
                        <button style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E8E93' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                        </button>
                      </div>

                      {/* URL Bar */}
                      <div style={{ 
                        flex: 1,
                        maxWidth: 600,
                        margin: '0 auto',
                        background: '#fff',
                        borderRadius: 8,
                        padding: '6px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
                        border: '1px solid #C7C7CC',
                      }}>
                        {/* Lock Icon */}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#8E8E93">
                          <path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4z"/>
                        </svg>
                        <span style={{ color: '#1D1D1F', fontSize: 13, fontWeight: 400, flex: 1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {displayUrl}
                        </span>
                        {/* Refresh Icon */}
                        <button 
                          onClick={() => {
                            const iframe = document.getElementById('shop-iframe') as HTMLIFrameElement;
                            if (iframe) iframe.src = iframe.src;
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2">
                            <path d="M23 4v6h-6M1 20v-6h6"/>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                          </svg>
                        </button>
                      </div>

                      {/* Right Actions */}
                      <div style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
                        <button style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E8E93' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                        </button>
                        <a 
                          href={`https://${displayUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E8E93', textDecoration: 'none' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </a>
                      </div>
                    </div>

                    {/* Tabs Bar */}
                    <div style={{
                      background: 'linear-gradient(180deg, #E8E8ED 0%, #DCDCE1 100%)',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      borderBottom: '1px solid #C7C7CC',
                    }}>
                      {/* Active Tab */}
                      <div style={{
                        background: '#fff',
                        borderRadius: '8px 8px 0 0',
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        maxWidth: 200,
                        boxShadow: '0 -1px 3px rgba(0,0,0,0.08)',
                        position: 'relative',
                        top: 1,
                      }}>
                        <img 
                          src={`https://www.google.com/s2/favicons?domain=${displayUrl}&sz=32`}
                          alt=""
                          style={{ width: 16, height: 16, borderRadius: 2 }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span style={{ fontSize: 12, color: '#1D1D1F', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {displayName}
                        </span>
                        <button style={{ width: 16, height: 16, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E8E93' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                      {/* New Tab Button */}
                      <button style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E8E93' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                      </button>
                    </div>

                    {/* Content - iframe with fallback notice */}
                    <div style={{ flex: 1, background: '#fff', position: 'relative' }}>
                      {!iframeError ? (
                        <>
                          <iframe
                            id="shop-iframe"
                            src={`https://${displayUrl}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              border: 'none',
                              display: 'block',
                            }}
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
                            loading="lazy"
                            title={`${displayName} website`}
                            onError={() => setIframeError(true)}
                          />
                          {/* Floating "Open in new tab" button - always visible as fallback */}
                          <a
                            href={`https://${displayUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              position: 'absolute',
                              bottom: 16,
                              right: 16,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '10px 16px',
                              background: 'rgba(0,0,0,0.8)',
                              color: '#fff',
                              borderRadius: 8,
                              textDecoration: 'none',
                              fontSize: 13,
                              fontWeight: 500,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              zIndex: 10,
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                              <polyline points="15 3 21 3 21 9"/>
                              <line x1="10" y1="14" x2="21" y2="3"/>
                            </svg>
                            Ouvrir dans un nouvel onglet
                          </a>
                          
                          {/* Loading Overlay - shows briefly */}
                          <div 
                            id="iframe-loading"
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: '#fff',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 12,
                              animation: 'fadeOut 0.5s ease-out 3s forwards',
                            }}
                          >
                            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#3B82F6', animation: 'spin 1s linear infinite' }} />
                            <span style={{ fontSize: 14, color: '#6B7280' }}>Chargement de {displayUrl}...</span>
                            <span style={{ fontSize: 12, color: '#9CA3AF' }}>Si le site ne s&apos;affiche pas, utilisez le bouton en bas à droite</span>
                          </div>
                        </>
                      ) : (
                        /* CSP Error Fallback */
                        <div style={{ 
                          position: 'absolute', 
                          inset: 0, 
                          background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          gap: 20,
                          padding: 40,
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            width: 80, 
                            height: 80, 
                            background: '#FEE2E2', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M15 9l-6 6M9 9l6 6"/>
                            </svg>
                          </div>
                          <div>
                            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Site non accessible en prévisualisation</h3>
                            <p style={{ fontSize: 14, color: '#6B7280', maxWidth: 400, lineHeight: 1.5 }}>
                              Ce site a bloqué l'intégration dans les iframes pour des raisons de sécurité. 
                              Vous pouvez toujours le consulter en ouvrant un nouvel onglet.
                            </p>
                          </div>
                          <a
                            href={`https://${displayUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '12px 24px',
                              background: '#0c6cfb',
                              color: '#fff',
                              borderRadius: 8,
                              textDecoration: 'none',
                              fontWeight: 500,
                              fontSize: 14,
                              boxShadow: '0 4px 12px rgba(12, 108, 251, 0.3)',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(12, 108, 251, 0.4)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(12, 108, 251, 0.3)'; }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                              <polyline points="15 3 21 3 21 9"/>
                              <line x1="10" y1="14" x2="21" y2="3"/>
                            </svg>
                            Ouvrir {displayUrl}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Status Bar */}
                    <div style={{
                      background: '#F5F5F7',
                      padding: '4px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid #E5E7EB',
                      fontSize: 11,
                      color: '#8E8E93',
                    }}>
                      <span>Connexion sécurisée</span>
                      <span>https://{displayUrl}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; pointer-events: none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}
