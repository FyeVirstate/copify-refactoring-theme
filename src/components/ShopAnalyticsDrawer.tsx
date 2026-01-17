"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import AliExpressSearchModal from "@/components/AliExpressSearchModal";

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

// Platform icons for pixels
const PIXEL_ICON_MAP: Record<string, string> = {
  'Google': '/img/socials/google.svg',
  'Facebook': '/img/socials/facebook.svg',
  'Instagram': '/img/socials/instagram.svg',
  'TikTok': '/img/socials/tiktok.svg',
  'Snapchat': '/img/socials/snapchat.svg',
  'Twitter': '/img/socials/twitter-x-line.svg',
  'Pinterest': '/img/socials/pinterest.svg',
  'Reddit': '/img/socials/reddit.svg',
  'TripleWhale': '/img/socials/triple-whale.svg',
  'Applovin': '/img/socials/applovin.svg',
  'Meta': '/img/socials/meta.svg',
  'Bing': '/img/socials/bing.svg',
  'LinkedIn': '/img/socials/linkedin.svg',
};

// Function to get pixel icon path
const getPixelIcon = (pixelName: string): string | null => {
  // Try exact match first
  if (PIXEL_ICON_MAP[pixelName]) return PIXEL_ICON_MAP[pixelName];
  
  // Try case-insensitive match
  const lowerName = pixelName.toLowerCase();
  for (const [key, value] of Object.entries(PIXEL_ICON_MAP)) {
    if (key.toLowerCase() === lowerName || lowerName.includes(key.toLowerCase())) {
      return value;
    }
  }
  return null;
};

// Simple markdown renderer for AI text
const renderMarkdown = (text: string) => {
  if (!text) return null;
  
  // Split by lines
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return null;
    
    // Check if it's a bullet point
    const isBullet = trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*');
    let content = isBullet ? trimmedLine.replace(/^[•\-\*]\s*/, '') : trimmedLine;
    
    // Parse inline markdown: **bold**, *italic*, `code`
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Match **bold**, *italic*, and `code`
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      
      if (match[2]) {
        // **bold**
        parts.push(<strong key={`${lineIndex}-${match.index}`} style={{ fontWeight: 600 }}>{match[2]}</strong>);
      } else if (match[3]) {
        // *italic*
        parts.push(<em key={`${lineIndex}-${match.index}`} style={{ fontStyle: 'italic' }}>{match[3]}</em>);
      } else if (match[4]) {
        // `code`
        parts.push(<code key={`${lineIndex}-${match.index}`} style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: 4, fontSize: '0.9em' }}>{match[4]}</code>);
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }
    
    // If no markdown was found, use original content
    const finalContent = parts.length > 0 ? parts : content;
    
    if (isBullet) {
      return (
        <div key={lineIndex} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1', marginTop: 8, flexShrink: 0 }} />
          <span style={{ lineHeight: 1.6 }}>{finalContent}</span>
        </div>
      );
    }
    
    return <p key={lineIndex} style={{ margin: '0 0 8px 0', lineHeight: 1.6 }}>{finalContent}</p>;
  });
};

const TABS = [
  { id: 'overview', label: 'Traffic', icon: 'ri-line-chart-line' },
  { id: 'analysis', label: 'Analyse IA', icon: 'ri-brain-line' },
  { id: 'persona', label: 'Persona', icon: 'ri-user-heart-line' },
  { id: 'copy-product', label: 'Copy Product', icon: 'ri-file-copy-line' },
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
  
  // AliExpress search modal state
  const [aliExpressModalOpen, setAliExpressModalOpen] = useState(false);
  const [selectedProductForAliExpress, setSelectedProductForAliExpress] = useState<{ imageUrl: string; price: number; title: string } | null>(null);
  
  // Analysis tab state
  const [analysisData, setAnalysisData] = useState<{
    globalScore: number;
    verdict: { type: string; label: string; color: string };
    scores: {
      age: { value: number; label: string; details?: string };
      markets: { value: number; label: string; details?: string };
      trafficLevel: { value: number; label: string; details?: string };
      trafficTrend: { value: number; label: string; details?: string };
      products: { value: number; label: string; details?: string };
      ads: { value: number; label: string; details?: string };
    };
    momentum: string;
    adsStrength: string;
    replicationDifficulty: string;
    strengths: string[];
    weaknesses: string[];
    actions: string[];
    aiInsights?: string;
    productsAnalysis?: string;
  } | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // Persona tab state
  const [personaData, setPersonaData] = useState<{
    buyerSummary: string;
    profile: {
      age: string;
      gender: string;
      location: string;
      situation: string;
      budget: string;
    };
    problem: {
      mainProblem: string;
      frustration: string;
      urgency: string;
    };
    whyThisProduct: {
      attraction: string;
      beforeBuying: string;
      afterBuying: string;
    };
    targeting: {
      platform: string;
      interests: string[];
      contentType: string;
    };
    adMessage: {
      mainPhrase: string;
      hook: string;
    };
  } | null>(null);
  const [personaLoading, setPersonaLoading] = useState(false);
  const [personaError, setPersonaError] = useState<string | null>(null);
  
  // AI Recommendation for Copy Product
  const [aiRecommendedProductId, setAiRecommendedProductId] = useState<string | null>(null);
  const [aiRecommendationReason, setAiRecommendationReason] = useState<string | null>(null);
  const [aiRecommendationLoading, setAiRecommendationLoading] = useState(false);
  const [aiRecommendationIsValid, setAiRecommendationIsValid] = useState(true); // Whether the recommended product matches source category
  
  // Copy Product tab state
  const [copyProductStep, setCopyProductStep] = useState<1 | 2 | 3>(1); // 1: Select product, 2: Find similar, 3: Review
  const [selectedProductToCopy, setSelectedProductToCopy] = useState<{
    id: number;
    title: string;
    imageUrl: string;
    price: number;
    handle: string;
  } | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Array<{
    id: string;
    title: string;
    imageUrl: string;
    price: number;
    originalPrice?: number;
    sales?: number;
    profit?: number;
    profitPercent?: number;
    url: string;
  }>>([]);
  const [similarProductsLoading, setSimilarProductsLoading] = useState(false);
  const [selectedSimilarProduct, setSelectedSimilarProduct] = useState<{
    id: string;
    title: string;
    imageUrl: string;
    price: number;
    url: string;
  } | null>(null);
  
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
    // Reset analysis state
    setAnalysisData(null);
    setAnalysisError(null);
    setAnalysisLoading(false);
    // Reset persona state
    setPersonaData(null);
    setPersonaError(null);
    setPersonaLoading(false);
    // Reset copy product state
    setCopyProductStep(1);
    setSelectedProductToCopy(null);
    setSimilarProducts([]);
    setSelectedSimilarProduct(null);
    setSimilarProductsLoading(false);
    // Reset AI recommendation state
    setAiRecommendedProductId(null);
    setAiRecommendationReason(null);
    setAiRecommendationLoading(false);
    setAiRecommendationIsValid(true);
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

  // Fetch AI analysis when tab is selected
  const fetchAnalysis = useCallback(async () => {
    if (!shopDetails || analysisData) return;
    
    // Check localStorage first
    const cacheKey = `shop_analysis_${shopId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) { // 24h cache
          setAnalysisData(parsed.data);
          return;
        }
      } catch { /* ignore */ }
    }
    
    setAnalysisLoading(true);
    setAnalysisError(null);
    
    try {
      // Extract markets from countries
      const markets = shopDetails.traffic?.countries?.map(c => c.code) || 
                     (shopDetails.shop?.country ? [shopDetails.shop.country] : []);
      
      // Get top products for analysis
      const topProducts = shopDetails.products?.slice(0, 5).map(p => ({
        title: p.title,
        price: p.price || 0,
        imageUrl: p.imageUrl,
        bestProduct: p.bestProduct,
      })) || [];
      
      const res = await fetch('/api/ai/shop-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: shopDetails.shop?.name || shopName || shopUrl?.replace('www.', '') || 'Boutique',
          shopUrl: shopDetails.shop?.url || shopUrl || '',
          createdAt: shopDetails.shop?.whoisAt || shopDetails.shop?.createdAt,
          markets,
          trafficCurrent: shopDetails.metrics?.monthlyVisits || 0,
          traffic3mTrend: parseFloat(shopDetails.metrics?.threeMonthGrowth || '0'),
          productsCount: shopDetails.shop?.productsCount || 0,
          activeAdsCount: shopDetails.metrics?.activeAdsCount || 0,
          activeAds3mTrend: parseFloat(shopDetails.metrics?.adsThreeMonthGrowth || '0'),
          monthlyRevenue: shopDetails.metrics?.monthlyRevenue,
          themeName: shopDetails.shop?.themeName,
          category: shopDetails.shop?.category,
          topProducts,
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setAnalysisData(data.data);
        // Cache in localStorage
        localStorage.setItem(cacheKey, JSON.stringify({ data: data.data, timestamp: Date.now() }));
      } else {
        setAnalysisError(data.error || 'Erreur lors de l\'analyse');
      }
    } catch (err) {
      setAnalysisError('Erreur de connexion');
    } finally {
      setAnalysisLoading(false);
    }
  }, [shopDetails, shopId, analysisData, shopName, shopUrl]);
  
  // Fetch Persona analysis when tab is selected
  const fetchPersona = useCallback(async () => {
    if (!shopDetails || personaData) return;
    
    // Check localStorage first
    const cacheKey = `shop_persona_${shopId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) { // 24h cache
          setPersonaData(parsed.data);
          return;
        }
      } catch { /* ignore */ }
    }
    
    setPersonaLoading(true);
    setPersonaError(null);
    
    try {
      // Get top products for context
      const topProducts = shopDetails.products?.slice(0, 5).map(p => ({
        title: p.title,
        price: p.price || 0,
        productType: p.productType || '',
      })) || [];
      
      // Get ads with descriptions for better persona analysis
      const topAds = shopDetails.ads?.slice(0, 5).map(ad => ({
        title: ad.pageName || '',
        body: ad.caption || '',
        platform: 'Meta',
      })).filter(ad => ad.body && ad.body.length > 10) || [];
      
      // Get markets from countries
      const markets = shopDetails.traffic?.countries?.map(c => c.code) || 
                     (shopDetails.shop?.country ? [shopDetails.shop.country] : []);
      
      const res = await fetch('/api/ai/persona-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: shopDetails.shop?.url || shopUrl || '',
          name: shopDetails.shop?.name || shopName || '',
          category: shopDetails.shop?.category,
          products: topProducts,
          ads: topAds,
          markets,
          traffic: shopDetails.metrics?.monthlyVisits || 0,
          mainCountry: shopDetails.shop?.country || shopDetails.traffic?.countries?.[0]?.name,
        })
      });
      
      const data = await res.json();
      if (data.success && data.persona) {
        setPersonaData(data.persona);
        // Cache in localStorage
        localStorage.setItem(cacheKey, JSON.stringify({ data: data.persona, timestamp: Date.now() }));
      } else {
        setPersonaError(data.error || 'Erreur lors de l\'analyse persona');
      }
    } catch (err) {
      setPersonaError('Erreur de connexion');
    } finally {
      setPersonaLoading(false);
    }
  }, [shopDetails, shopId, personaData, shopName, shopUrl]);
  
  // Fetch similar products from AliExpress
  const fetchSimilarProducts = useCallback(async (product: { imageUrl: string; price: number; title: string }) => {
    setSimilarProductsLoading(true);
    setSimilarProducts([]);
    
    try {
      // Clean the image URL (remove query params)
      const cleanImageUrl = product.imageUrl.split('?')[0];
      
      const res = await fetch('/api/search/aliexpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: cleanImageUrl,
          price: product.price,
        })
      });
      
      const data = await res.json();
      if (data.success && data.items && Array.isArray(data.items)) {
        // Map the API response to our format
        const productsWithProfit = data.items.map((item: {
          item?: {
            itemId?: string;
            title?: string;
            image?: string;
            itemUrl?: string;
            sales?: string | number;
            sku?: {
              def?: {
                promotionPrice?: string;
                price?: string;
              }
            }
          };
          calculatedProfit?: string;
          profitPercentage?: string;
        }) => {
          const aliPrice = parseFloat(item.item?.sku?.def?.promotionPrice || item.item?.sku?.def?.price || '0');
          const retailPrice = aliPrice * 3; // x3 markup
          const profit = retailPrice - aliPrice;
          const profitPercent = aliPrice > 0 ? Math.round((profit / retailPrice) * 100) : 0;
          
          // Parse sales
          let salesCount = 0;
          if (item.item?.sales) {
            const salesStr = String(item.item.sales);
            const match = salesStr.match(/(\d+[\d,]*)/)?.[1];
            if (match) {
              salesCount = parseInt(match.replace(/,/g, ''), 10);
            }
          }
          
          return {
            id: item.item?.itemId || Math.random().toString(),
            title: item.item?.title || '',
            imageUrl: item.item?.image || '',
            price: aliPrice,
            originalPrice: aliPrice,
            sales: salesCount,
            profit: Math.round(profit * 100) / 100,
            profitPercent,
            url: item.item?.itemUrl || `https://www.aliexpress.com/item/${item.item?.itemId}.html`,
            calculatedProfit: item.calculatedProfit,
            profitPercentageFromApi: item.profitPercentage,
          };
        }).filter((p: { price: number }) => p.price > 0);
        
        setSimilarProducts(productsWithProfit);
        
        // Call AI to recommend the best product
        if (productsWithProfit.length > 0) {
          setAiRecommendationLoading(true);
          try {
            const productsForAI = productsWithProfit.slice(0, 10).map((p: { id: string; title: string; price: number; sales: number; profit: number; profitPercent: number }, i: number) => ({
              index: i + 1,
              id: p.id,
              title: p.title.slice(0, 80),
              price: p.price,
              sales: p.sales,
              profit: p.profit,
              profitPercent: p.profitPercent,
            }));
            
            const aiRes = await fetch('/api/ai/analyze-products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ products: productsForAI, sourceProduct: product.title })
            });
            
            const aiData = await aiRes.json();
            if (aiData.success && aiData.recommendedId) {
              setAiRecommendedProductId(aiData.recommendedId);
              setAiRecommendationReason(aiData.reason || 'Meilleur rapport qualité/prix et ventes');
              setAiRecommendationIsValid(aiData.isValidMatch !== false); // Default to true if not specified
            }
          } catch (e) {
            console.log('AI recommendation skipped:', e);
          } finally {
            setAiRecommendationLoading(false);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching similar products:', err);
    } finally {
      setSimilarProductsLoading(false);
    }
  }, []);
  
  // Handle product selection for copying
  const handleSelectProductToCopy = useCallback((product: { id: number; title: string; imageUrl: string | null; price: number | null; handle: string }) => {
    setSelectedProductToCopy({
      id: product.id,
      title: product.title,
      imageUrl: product.imageUrl || '',
      price: product.price || 0,
      handle: product.handle,
    });
    setCopyProductStep(2);
    // Fetch similar products
    fetchSimilarProducts({
      imageUrl: product.imageUrl || '',
      price: product.price || 0,
      title: product.title,
    });
  }, [fetchSimilarProducts]);
  
  // Redirect to StoreAI with product URL
  const handleCopyProduct = useCallback((productUrl: string) => {
    // Clean URL before redirecting - ensure it has proper protocol
    let cleanUrl = productUrl.trim();
    if (cleanUrl.startsWith('//')) {
      cleanUrl = 'https:' + cleanUrl;
    } else if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    // Redirect to ai-shop page with product URL as parameter
    window.location.href = `/dashboard/ai-shop?url=${encodeURIComponent(cleanUrl)}`;
  }, []);
  
  // Trigger analysis fetch when tab changes
  useEffect(() => {
    if (activeTab === 'analysis' && shopDetails && !analysisData && !analysisLoading) {
      fetchAnalysis();
    }
  }, [activeTab, shopDetails, analysisData, analysisLoading, fetchAnalysis]);
  
  // Trigger persona fetch when tab changes
  useEffect(() => {
    if (activeTab === 'persona' && shopDetails && !personaData && !personaLoading) {
      fetchPersona();
    }
  }, [activeTab, shopDetails, personaData, personaLoading, fetchPersona]);
  
  // Reset copy product state when tab changes
  useEffect(() => {
    if (activeTab !== 'copy-product') {
      setCopyProductStep(1);
      setSelectedProductToCopy(null);
      setSimilarProducts([]);
      setSelectedSimilarProduct(null);
      setAiRecommendedProductId(null);
      setAiRecommendationReason(null);
      setAiRecommendationIsValid(true);
    }
  }, [activeTab]);

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

              {/* ========== ANALYSIS TAB - AI SCORING ========== */}
              {activeTab === 'analysis' && (
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                  {analysisLoading ? (
                    <div style={{ ...cardStyle, padding: 80, textAlign: 'center', background: 'linear-gradient(180deg, #EFF6FF 0%, #fff 100%)' }}>
                      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 24px' }}>
                        <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: '#3B82F6', opacity: 0.2, animation: 'ping 1.5s infinite' }}></div>
                        <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(59, 130, 246, 0.35)' }}>
                          <i className="ri-brain-line" style={{ fontSize: 36, color: '#fff' }}></i>
                        </div>
                      </div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Analyse IA en cours...</h3>
                      <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 32px', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>Calcul du score et génération des insights basés sur 6 critères</p>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', opacity: 0.4 + (i * 0.2), animation: `pulse 1.2s infinite ${i * 0.15}s` }}></div>
                        ))}
                      </div>
                    </div>
                  ) : analysisError ? (
                    <div style={{ ...cardStyle, padding: 48, textAlign: 'center', background: '#fff', border: '1px solid #FEE2E2' }}>
                      <div style={{ width: 64, height: 64, borderRadius: 16, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <i className="ri-error-warning-line" style={{ fontSize: 32, color: '#DC2626' }}></i>
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#DC2626', margin: '0 0 8px' }}>Erreur lors de l'analyse</h3>
                      <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 20px' }}>{analysisError}</p>
                      <button 
                        onClick={fetchAnalysis} 
                        style={{ padding: '12px 24px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                      >
                        <i className="ri-refresh-line"></i>Réessayer
                      </button>
                    </div>
                  ) : analysisData ? (
                    <>
                      {/* Hero Score Card - Premium Copify Design */}
                      <div style={{ ...cardStyle, padding: 0, marginBottom: 20, overflow: 'hidden', background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)', boxShadow: '0 4px 24px rgba(59, 130, 246, 0.25)' }}>
                        <div style={{ padding: '28px 32px', position: 'relative' }}>
                          <div style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '6px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="ri-sparkling-2-fill" style={{ fontSize: 14, color: '#fff' }}></i>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Analyse IA</span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                            {/* Score Circle */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                              <div style={{ position: 'relative', width: 140, height: 140 }}>
                                <svg viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                                  <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
                                  <circle cx="70" cy="70" r="60" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${analysisData.globalScore * 3.77} 377`} style={{ transition: 'stroke-dasharray 1s ease' }} />
                                </svg>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontSize: 44, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{analysisData.globalScore}</span>
                                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>/100</span>
                                </div>
                              </div>
                              <div style={{ padding: '8px 20px', borderRadius: 20, fontSize: 13, fontWeight: 700, background: 'rgba(255,255,255,0.95)', color: analysisData.verdict.color, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                                {analysisData.verdict.label}
                              </div>
                            </div>
                            
                            {/* Summary */}
                            <div style={{ flex: 1 }}>
                              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{displayName}</h2>
                              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>Analyse complète basée sur 6 critères de performance</p>
                              
                              {/* Quick Stats */}
                              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                                {[
                                  { icon: analysisData.momentum === 'growth' ? 'ri-arrow-up-line' : analysisData.momentum === 'decline' ? 'ri-arrow-down-line' : 'ri-arrow-right-line', label: 'Momentum', value: analysisData.momentum === 'growth' ? 'Croissance' : analysisData.momentum === 'decline' ? 'Déclin' : 'Stable', good: analysisData.momentum === 'growth' },
                                  { icon: 'ri-megaphone-line', label: 'Publicités', value: analysisData.adsStrength === 'strong' ? 'Très actif' : analysisData.adsStrength === 'weak' ? 'Faible' : 'Modéré', good: analysisData.adsStrength === 'strong' },
                                  { icon: 'ri-file-copy-line', label: 'Réplication', value: analysisData.replicationDifficulty === 'easy' ? 'Facile' : analysisData.replicationDifficulty === 'hard' ? 'Difficile' : 'Moyen', good: analysisData.replicationDifficulty === 'easy' },
                                ].map((stat, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(255,255,255,0.1)', borderRadius: 10, backdropFilter: 'blur(10px)' }}>
                                    <i className={stat.icon} style={{ color: stat.good ? '#4ADE80' : '#FBBF24', fontSize: 16 }}></i>
                                    <div>
                                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>{stat.label}</div>
                                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{stat.value}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {/* AI Insight Box */}
                              {analysisData.aiInsights && (
                                <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 16 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <i className="ri-sparkling-line" style={{ color: '#3B82F6', fontSize: 14 }}></i>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#3B82F6' }}>Insight IA</span>
                                  </div>
                                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{renderMarkdown(analysisData.aiInsights)}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Key Metrics Row - Compact */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                        {[
                          { icon: 'ri-money-dollar-circle-line', label: 'Revenu estimé', value: shopDetails?.metrics?.monthlyRevenue ? `${currency}${new Intl.NumberFormat('fr-FR').format(Math.round(shopDetails.metrics.monthlyRevenue))}` : 'N/A', sub: '/mois', color: '#10B981', bg: '#ECFDF5' },
                          { icon: 'ri-line-chart-line', label: 'Trafic', value: shopDetails?.metrics?.monthlyVisits ? new Intl.NumberFormat('fr-FR').format(shopDetails.metrics.monthlyVisits) : 'N/A', sub: `${parseFloat(shopDetails?.metrics?.threeMonthGrowth || '0') >= 0 ? '+' : ''}${shopDetails?.metrics?.threeMonthGrowth || '0'}% 3m`, color: '#3B82F6', bg: '#EFF6FF', subGood: parseFloat(shopDetails?.metrics?.threeMonthGrowth || '0') >= 0 },
                          { icon: 'ri-megaphone-line', label: 'Pubs actives', value: shopDetails?.metrics?.activeAdsCount?.toString() ?? 'N/A', sub: `${parseFloat(shopDetails?.metrics?.adsThreeMonthGrowth || '0') >= 0 ? '+' : ''}${shopDetails?.metrics?.adsThreeMonthGrowth || '0'}% 3m`, color: '#F59E0B', bg: '#FEF3C7', subGood: parseFloat(shopDetails?.metrics?.adsThreeMonthGrowth || '0') >= 0 },
                          { icon: 'ri-shopping-bag-line', label: 'Produits', value: shopDetails?.shop?.productsCount?.toString() ?? 'N/A', sub: 'en ligne', color: '#8B5CF6', bg: '#F5F3FF' },
                        ].map((m, i) => (
                          <div key={i} style={{ ...cardStyle, padding: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className={m.icon} style={{ color: m.color, fontSize: 18 }}></i>
                              </div>
                              <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>{m.label}</span>
                            </div>
                            <div style={{ fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 2 }}>{m.value}</div>
                            <div style={{ fontSize: 12, color: m.subGood !== undefined ? (m.subGood ? '#10B981' : '#EF4444') : '#6B7280', fontWeight: m.subGood !== undefined ? 600 : 400 }}>{m.sub}</div>
                          </div>
                        ))}
                      </div>

                      {/* Scores Grid - Clean Cards */}
                      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', marginBottom: 20 }}>
                        <div style={{ padding: '14px 20px', background: '#F8FAFC', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <i className="ri-bar-chart-grouped-line" style={{ fontSize: 18, color: '#3B82F6' }}></i>
                          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>Scores par critère</h3>
                        </div>
                        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
                          {[
                            { name: 'Maturité', icon: 'ri-calendar-line', score: analysisData.scores.age },
                            { name: 'Marchés', icon: 'ri-global-line', score: analysisData.scores.markets },
                            { name: 'Trafic', icon: 'ri-bar-chart-line', score: analysisData.scores.trafficLevel },
                            { name: 'Tendance', icon: 'ri-line-chart-line', score: analysisData.scores.trafficTrend },
                            { name: 'Catalogue', icon: 'ri-shopping-bag-line', score: analysisData.scores.products },
                            { name: 'Ads', icon: 'ri-advertisement-line', score: analysisData.scores.ads },
                          ].map((item) => {
                            const scoreColor = item.score.value >= 70 ? '#10B981' : item.score.value >= 40 ? '#F59E0B' : '#EF4444';
                            return (
                              <div key={item.name} style={{ textAlign: 'center', padding: 12, background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${scoreColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                                  <i className={item.icon} style={{ fontSize: 14, color: scoreColor }}></i>
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 700, color: scoreColor, marginBottom: 2 }}>{item.score.value}</div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{item.name}</div>
                                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{item.score.label}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Traffic Sources & Markets Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                        {/* Traffic Sources */}
                        {shopDetails?.traffic?.sources && shopDetails.traffic.sources.length > 0 && (
                          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <i className="ri-pie-chart-line" style={{ color: '#3B82F6', fontSize: 16 }}></i>
                              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>Sources de trafic</h3>
                            </div>
                            <div style={{ padding: 12 }}>
                              {shopDetails.traffic.sources.slice(0, 5).map((source, i) => (
                                <div key={source.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < Math.min(shopDetails.traffic.sources.length, 5) - 1 ? '1px solid #F3F4F6' : 'none' }}>
                                  <div style={{ width: 24, height: 24, borderRadius: 6, background: `${TRAFFIC_COLORS[i % TRAFFIC_COLORS.length]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className={
                                      source.name.toLowerCase().includes('direct') ? 'ri-cursor-line' :
                                      source.name.toLowerCase().includes('search') ? 'ri-search-line' :
                                      source.name.toLowerCase().includes('social') ? 'ri-share-line' :
                                      source.name.toLowerCase().includes('referral') ? 'ri-links-line' :
                                      source.name.toLowerCase().includes('mail') ? 'ri-mail-line' : 'ri-global-line'
                                    } style={{ fontSize: 12, color: TRAFFIC_COLORS[i % TRAFFIC_COLORS.length] }}></i>
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                      <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{source.name}</span>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{source.value}%</span>
                                    </div>
                                    <div style={{ height: 3, background: '#E5E7EB', borderRadius: 2 }}>
                                      <div style={{ height: '100%', width: `${source.value}%`, background: TRAFFIC_COLORS[i % TRAFFIC_COLORS.length], borderRadius: 2 }} />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Markets/Countries */}
                        {shopDetails?.traffic?.countries && shopDetails.traffic.countries.length > 0 && (
                          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <i className="ri-earth-line" style={{ color: '#10B981', fontSize: 16 }}></i>
                              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>Marchés cibles</h3>
                            </div>
                            <div style={{ padding: 12 }}>
                              {shopDetails.traffic.countries.slice(0, 5).map((country, i) => (
                                <div key={country.code} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < Math.min(shopDetails.traffic.countries.length, 5) - 1 ? '1px solid #F3F4F6' : 'none' }}>
                                  <FlagImage code={country.code} size={20} />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                      <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{country.name}</span>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{country.value}%</span>
                                    </div>
                                    <div style={{ height: 3, background: '#E5E7EB', borderRadius: 2 }}>
                                      <div style={{ height: '100%', width: `${country.value}%`, background: '#10B981', borderRadius: 2 }} />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Shop Details Compact Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                        {[
                          { icon: 'ri-palette-line', label: 'Thème', value: shopDetails?.shop?.themeName || 'Non détecté', color: '#6366F1' },
                          { icon: 'ri-price-tag-3-line', label: 'Catégorie', value: shopDetails?.shop?.category || 'Non spécifiée', color: '#EC4899' },
                          { icon: 'ri-map-pin-line', label: 'Pays', value: shopDetails?.shop?.country || 'N/A', color: '#10B981', flag: shopDetails?.shop?.country },
                          { icon: 'ri-calendar-line', label: 'Création', value: shopDetails?.shop?.whoisAt ? new Date(shopDetails.shop.whoisAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : shopDetails?.shop?.createdAt ? new Date(shopDetails.shop.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : 'Inconnue', color: '#F59E0B' },
                        ].map((d, i) => (
                          <div key={i} style={{ ...cardStyle, padding: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              {d.flag ? <FlagImage code={d.flag} size={16} /> : <i className={d.icon} style={{ color: d.color, fontSize: 14 }}></i>}
                              <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>{d.label}</span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{d.value}</div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Apps & Pixels */}
                      {((shopDetails?.shop?.apps && shopDetails.shop.apps.length > 0) || (shopDetails?.shop?.pixels && shopDetails.shop.pixels.length > 0)) && (
                        <div style={{ ...cardStyle, padding: 16, marginBottom: 20 }}>
                          <div style={{ display: 'flex', gap: 24 }}>
                            {shopDetails?.shop?.apps && shopDetails.shop.apps.length > 0 && (
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                  <i className="ri-apps-line" style={{ color: '#3B82F6', fontSize: 14 }}></i>
                                  <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Apps ({shopDetails.shop.apps.length})</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {shopDetails.shop.apps.slice(0, 5).map((app, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 6 }}>
                                      {app.icon ? <img src={app.icon} alt="" style={{ width: 14, height: 14, borderRadius: 3 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <div style={{ width: 14, height: 14, borderRadius: 3, background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 600, color: '#6B7280' }}>{app.name[0]}</div>}
                                      <span style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>{app.name}</span>
                                    </div>
                                  ))}
                                  {shopDetails.shop.apps.length > 5 && <span style={{ padding: '5px 10px', background: '#F3F4F6', borderRadius: 6, fontSize: 11, color: '#6B7280' }}>+{shopDetails.shop.apps.length - 5}</span>}
                                </div>
                              </div>
                            )}
                            {shopDetails?.shop?.pixels && shopDetails.shop.pixels.length > 0 && (
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                  <i className="ri-flashlight-line" style={{ color: '#F59E0B', fontSize: 14 }}></i>
                                  <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Pixels ({shopDetails.shop.pixels.length})</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {shopDetails.shop.pixels.map((pixel, i) => {
                                    const iconPath = getPixelIcon(pixel);
                                    return (
                                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 6 }}>
                                        {iconPath ? <img src={iconPath} alt="" style={{ width: 14, height: 14 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <div style={{ width: 14, height: 14, borderRadius: 3, background: '#E5E7EB', fontSize: 8, fontWeight: 600, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pixel[0]}</div>}
                                        <span style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>{pixel}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Strengths & Weaknesses - Compact Side by Side */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                          <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #DCFCE7 0%, #F0FDF4 100%)', borderBottom: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <i className="ri-thumb-up-fill" style={{ color: '#fff', fontSize: 14 }}></i>
                            </div>
                            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#166534', margin: 0 }}>Points forts</h3>
                          </div>
                          <div style={{ padding: 14 }}>
                            {analysisData.strengths.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {analysisData.strengths.map((s, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                                      <i className="ri-check-line" style={{ fontSize: 10, color: '#16A34A' }}></i>
                                    </div>
                                    <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{s}</span>
                                  </div>
                                ))}
                              </div>
                            ) : <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', margin: 0 }}>Aucun point fort notable</p>}
                          </div>
                        </div>
                        
                        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                          <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #FEE2E2 0%, #FEF2F2 100%)', borderBottom: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <i className="ri-error-warning-fill" style={{ color: '#fff', fontSize: 14 }}></i>
                            </div>
                            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#991B1B', margin: 0 }}>Risques</h3>
                          </div>
                          <div style={{ padding: 14 }}>
                            {analysisData.weaknesses.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {analysisData.weaknesses.map((w, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                                      <i className="ri-close-line" style={{ fontSize: 10, color: '#DC2626' }}></i>
                                    </div>
                                    <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{w}</span>
                                  </div>
                                ))}
                              </div>
                            ) : <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', margin: 0 }}>Aucun risque majeur</p>}
                          </div>
                        </div>
                      </div>

                      {/* Actions recommandées - Premium Dark Style */}
                      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)' }}>
                              <i className="ri-lightbulb-flash-line" style={{ color: '#fff', fontSize: 18 }}></i>
                            </div>
                            <div>
                              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Actions recommandées</h3>
                              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Verdict: {analysisData.verdict.label}</p>
                            </div>
                          </div>
                          <span style={{ background: analysisData.verdict.color, padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#fff' }}>{analysisData.globalScore}/100</span>
                        </div>
                        <div style={{ padding: 16 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                            {analysisData.actions.map((action, i) => (
                              <div key={i} style={{ padding: 16, background: 'rgba(59, 130, 246, 0.08)', borderRadius: 10, border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#3B82F6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{i + 1}</div>
                                  <span style={{ fontSize: 10, color: '#60A5FA', fontWeight: 600, textTransform: 'uppercase' }}>Étape {i + 1}</span>
                                </div>
                                <p style={{ fontSize: 13, color: '#fff', lineHeight: 1.6, margin: 0 }}>{action}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Products Analysis Section with Images */}
                      {bestsellerProducts.length > 0 && (
                        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', marginTop: 20 }}>
                          <div style={{ padding: '14px 20px', background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="ri-shopping-bag-line" style={{ color: '#fff', fontSize: 18 }}></i>
                              </div>
                              <div>
                                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>Analyse des Best-Sellers</h3>
                                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{bestsellerProducts.length} produits</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setActiveTab('copy-product')}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(10px)' }}
                            >
                              <i className="ri-file-copy-line"></i>Copier
                            </button>
                          </div>
                          
                          <div style={{ padding: 16 }}>
                            {/* Products Grid with Images */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
                              {bestsellerProducts.slice(0, 5).map((p, idx) => (
                                <div key={p.id} style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                                  <div style={{ position: 'relative', aspectRatio: '1/1', background: '#F9FAFB' }}>
                                    <img 
                                      src={p.imageUrl || 'https://via.placeholder.com/120'} 
                                      alt={p.title || ''} 
                                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/120'; }}
                                    />
                                    <span style={{ position: 'absolute', top: 4, left: 4, background: idx === 0 ? '#3B82F6' : '#6B7280', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>
                                      {idx === 0 ? 'TOP' : `#${idx + 1}`}
                                    </span>
                                  </div>
                                  <div style={{ padding: 8 }}>
                                    <h4 style={{ fontSize: 10, fontWeight: 500, color: '#374151', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3, height: '2.6em' }}>{p.title}</h4>
                                    <div style={{ marginTop: 4 }}>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: '#3B82F6' }}>{currency}{p.price || 0}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* AI Products Analysis */}
                            {analysisData.productsAnalysis && (
                              <div style={{ background: '#EFF6FF', borderRadius: 10, padding: 16, border: '1px solid #BFDBFE' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                                  <i className="ri-sparkling-line" style={{ color: '#3B82F6', fontSize: 14 }}></i>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1E40AF' }}>Analyse IA des produits</span>
                                </div>
                                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                                  {renderMarkdown(analysisData.productsAnalysis)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Footer Actions */}
                      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <button 
                          onClick={() => {
                            localStorage.removeItem(`shop_analysis_${shopId}`);
                            setAnalysisData(null);
                            fetchAnalysis();
                          }}
                          style={{ padding: '10px 18px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          <i className="ri-refresh-line" style={{ fontSize: 14 }}></i>Régénérer
                        </button>
                        <button 
                          onClick={() => setActiveTab('persona')}
                          style={{ padding: '10px 18px', background: '#3B82F6', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                        >
                          <i className="ri-user-heart-line" style={{ fontSize: 14 }}></i>Voir le Persona
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              {/* ========== PERSONA TAB ========== */}
              {activeTab === 'persona' && (
                <div style={{ maxWidth: 950, margin: '0 auto' }}>
                  {personaLoading && (
                    <div style={{ ...cardStyle, padding: 80, textAlign: 'center', background: 'linear-gradient(180deg, #EFF6FF 0%, #fff 100%)' }}>
                      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 24px' }}>
                        <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: '#3B82F6', opacity: 0.2, animation: 'ping 1.5s infinite' }}></div>
                        <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(59, 130, 246, 0.35)' }}>
                          <i className="ri-user-search-line" style={{ fontSize: 36, color: '#fff' }}></i>
                        </div>
                      </div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Analyse du persona en cours...</h3>
                      <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 32px', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>L'IA analyse les produits et le marché pour identifier votre client idéal</p>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', opacity: 0.4 + (i * 0.2), animation: `pulse 1.2s infinite ${i * 0.15}s` }}></div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {personaError && (
                    <div style={{ ...cardStyle, padding: 48, textAlign: 'center', background: '#fff', border: '1px solid #FEE2E2' }}>
                      <div style={{ width: 64, height: 64, borderRadius: 16, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <i className="ri-error-warning-line" style={{ fontSize: 32, color: '#DC2626' }}></i>
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#DC2626', margin: '0 0 8px' }}>Erreur d'analyse</h3>
                      <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 20px' }}>{personaError}</p>
                      <button 
                        onClick={() => { setPersonaError(null); setPersonaData(null); fetchPersona(); }}
                        style={{ padding: '12px 24px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                      >
                        <i className="ri-refresh-line"></i>Réessayer
                      </button>
                    </div>
                  )}
                  
                  {personaData && !personaLoading && (
                    <>
                      {/* Hero Card - Buyer Summary */}
                      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', marginBottom: 20, background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)', boxShadow: '0 4px 24px rgba(59, 130, 246, 0.25)' }}>
                        <div style={{ padding: '28px 28px 24px', position: 'relative' }}>
                          <div style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '6px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="ri-sparkling-2-fill" style={{ fontSize: 14, color: '#fff' }}></i>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Généré par IA</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                              <i className="ri-user-heart-fill" style={{ fontSize: 28, color: '#fff' }}></i>
                            </div>
                            <div>
                              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Persona Client</h2>
                              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0 }}>Votre acheteur idéal identifié</p>
                            </div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 20 }}>
                            <p style={{ fontSize: 17, fontWeight: 500, color: '#1E40AF', margin: 0, lineHeight: 1.7 }}>
                              "{personaData.buyerSummary}"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Profile Cards Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
                        {[
                          { icon: 'ri-time-line', label: 'Âge', value: personaData.profile.age, color: '#3B82F6' },
                          { icon: 'ri-user-smile-line', label: 'Genre', value: personaData.profile.gender, color: '#8B5CF6' },
                          { icon: 'ri-wallet-3-line', label: 'Budget', value: personaData.profile.budget, color: '#10B981' },
                          { icon: 'ri-map-pin-2-line', label: 'Pays', value: personaData.profile.location, color: '#F59E0B' },
                          { icon: 'ri-user-star-line', label: 'Situation', value: personaData.profile.situation, color: '#EC4899' },
                        ].map((item, i) => (
                          <div key={i} style={{ ...cardStyle, padding: 16, textAlign: 'center' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                              <i className={item.icon} style={{ fontSize: 20, color: item.color }}></i>
                            </div>
                            <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{item.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.4 }}>{item.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Problem & Solution Side by Side */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                        {/* Problem Card */}
                        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                          <div style={{ padding: '14px 20px', background: 'linear-gradient(135deg, #FEE2E2 0%, #FEF2F2 100%)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <i className="ri-emotion-unhappy-line" style={{ fontSize: 16, color: '#fff' }}></i>
                            </div>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#991B1B', margin: 0 }}>Le problème du client</h3>
                          </div>
                          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <div style={{ width: 24, height: 24, borderRadius: 6, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                <i className="ri-focus-3-line" style={{ fontSize: 12, color: '#DC2626' }}></i>
                              </div>
                              <div>
                                <div style={{ fontSize: 10, color: '#DC2626', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Problème principal</div>
                                <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>{personaData.problem.mainProblem}</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <div style={{ width: 24, height: 24, borderRadius: 6, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                <i className="ri-emotion-sad-line" style={{ fontSize: 12, color: '#D97706' }}></i>
                              </div>
                              <div>
                                <div style={{ fontSize: 10, color: '#D97706', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Frustration</div>
                                <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>{personaData.problem.frustration}</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <div style={{ width: 24, height: 24, borderRadius: 6, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                <i className="ri-timer-flash-line" style={{ fontSize: 12, color: '#2563EB' }}></i>
                              </div>
                              <div>
                                <div style={{ fontSize: 10, color: '#2563EB', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Urgence d'achat</div>
                                <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>{personaData.problem.urgency}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Why This Product Card */}
                        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                          <div style={{ padding: '14px 20px', background: 'linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <i className="ri-lightbulb-flash-line" style={{ fontSize: 16, color: '#fff' }}></i>
                            </div>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1E40AF', margin: 0 }}>Pourquoi il achète</h3>
                          </div>
                          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <div style={{ width: 24, height: 24, borderRadius: 6, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                <i className="ri-magic-line" style={{ fontSize: 12, color: '#2563EB' }}></i>
                              </div>
                              <div>
                                <div style={{ fontSize: 10, color: '#2563EB', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Ce qui attire</div>
                                <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>{personaData.whyThisProduct.attraction}</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <div style={{ width: 24, height: 24, borderRadius: 6, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                <i className="ri-question-line" style={{ fontSize: 12, color: '#6B7280' }}></i>
                              </div>
                              <div>
                                <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Avant l'achat</div>
                                <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>{personaData.whyThisProduct.beforeBuying}</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <div style={{ width: 24, height: 24, borderRadius: 6, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                <i className="ri-emotion-happy-line" style={{ fontSize: 12, color: '#059669' }}></i>
                              </div>
                              <div>
                                <div style={{ fontSize: 10, color: '#059669', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Après l'achat</div>
                                <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>{personaData.whyThisProduct.afterBuying}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Targeting Section */}
                      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', marginBottom: 20 }}>
                        <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <i className="ri-crosshair-2-line" style={{ fontSize: 18, color: '#fff' }}></i>
                            </div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: 0 }}>Comment le cibler en pub</h3>
                          </div>
                          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#fff' }}>STRATÉGIE ADS</span>
                        </div>
                        <div style={{ padding: 20 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            {/* Platform */}
                            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 18, border: '1px solid #E5E7EB' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <i className="ri-advertisement-line" style={{ fontSize: 18, color: '#2563EB' }}></i>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Plateforme recommandée</span>
                              </div>
                              <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{personaData.targeting.platform}</p>
                            </div>
                            
                            {/* Content Type */}
                            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 18, border: '1px solid #E5E7EB' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FCE7F3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <i className="ri-movie-2-line" style={{ fontSize: 18, color: '#DB2777' }}></i>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Type de contenu</span>
                              </div>
                              <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{personaData.targeting.contentType}</p>
                            </div>
                          </div>
                          
                          {/* Interests Full Width */}
                          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 18, border: '1px solid #E5E7EB' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="ri-heart-3-line" style={{ fontSize: 18, color: '#D97706' }}></i>
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Centres d'intérêt à cibler</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {personaData.targeting.interests.map((interest, i) => (
                                <span key={i} style={{ 
                                  padding: '8px 14px', 
                                  background: i === 0 ? '#3B82F6' : '#fff',
                                  color: i === 0 ? '#fff' : '#374151',
                                  borderRadius: 8, 
                                  fontSize: 13, 
                                  fontWeight: 500,
                                  border: i === 0 ? 'none' : '1px solid #E5E7EB',
                                  boxShadow: i === 0 ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none'
                                }}>
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ad Message Card - Premium Design */}
                      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)' }}>
                              <i className="ri-megaphone-fill" style={{ fontSize: 20, color: '#fff' }}></i>
                            </div>
                            <div>
                              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Messages publicitaires</h3>
                              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Prêts à utiliser dans vos pubs</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(59, 130, 246, 0.2)', padding: '6px 12px', borderRadius: 8 }}>
                            <i className="ri-file-copy-2-line" style={{ fontSize: 14, color: '#60A5FA' }}></i>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#60A5FA' }}>COPIER & COLLER</span>
                          </div>
                        </div>
                        <div style={{ padding: 24 }}>
                          {/* Main Phrase */}
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="ri-double-quotes-l" style={{ fontSize: 14, color: '#fff' }}></i>
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phrase publicitaire</span>
                            </div>
                            <div style={{ background: 'rgba(59, 130, 246, 0.08)', borderRadius: 12, padding: 20, border: '1px solid rgba(59, 130, 246, 0.15)', position: 'relative' }}>
                              <p style={{ fontSize: 16, color: '#fff', margin: 0, lineHeight: 1.7, fontWeight: 500 }}>"{personaData.adMessage.mainPhrase}"</p>
                              <button 
                                onClick={() => { navigator.clipboard.writeText(personaData.adMessage.mainPhrase); }}
                                style={{ position: 'absolute', top: 12, right: 12, padding: '8px 14px', background: '#3B82F6', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, transition: 'all 0.2s' }}
                              >
                                <i className="ri-file-copy-line"></i>Copier
                              </button>
                            </div>
                          </div>
                          
                          {/* Hook */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="ri-flashlight-fill" style={{ fontSize: 14, color: '#fff' }}></i>
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Accroche percutante</span>
                            </div>
                            <div style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(251, 191, 36, 0.08) 100%)', borderRadius: 12, padding: 20, border: '1px solid rgba(251, 191, 36, 0.2)', position: 'relative' }}>
                              <p style={{ fontSize: 18, color: '#FBBF24', margin: 0, lineHeight: 1.6, fontWeight: 700 }}>"{personaData.adMessage.hook}"</p>
                              <button 
                                onClick={() => { navigator.clipboard.writeText(personaData.adMessage.hook); }}
                                style={{ position: 'absolute', top: 12, right: 12, padding: '8px 14px', background: '#F59E0B', border: 'none', borderRadius: 8, color: '#111827', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                              >
                                <i className="ri-file-copy-line"></i>Copier
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <button 
                          onClick={() => {
                            localStorage.removeItem(`shop_persona_${shopId}`);
                            setPersonaData(null);
                            fetchPersona();
                          }}
                          style={{ 
                            padding: '12px 20px', 
                            background: '#fff', 
                            border: '1px solid #E5E7EB', 
                            borderRadius: 10, 
                            color: '#374151', 
                            fontSize: 13, 
                            fontWeight: 600, 
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            transition: 'all 0.2s'
                          }}
                        >
                          <i className="ri-refresh-line" style={{ fontSize: 16 }}></i>Régénérer l'analyse
                        </button>
                        <button 
                          onClick={() => setActiveTab('copy-product')}
                          style={{ 
                            padding: '12px 20px', 
                            background: '#3B82F6', 
                            border: 'none', 
                            borderRadius: 10, 
                            color: '#fff', 
                            fontSize: 13, 
                            fontWeight: 600, 
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                          }}
                        >
                          <i className="ri-file-copy-2-line" style={{ fontSize: 16 }}></i>Copier un produit
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ========== COPY PRODUCT TAB ========== */}
              {activeTab === 'copy-product' && (
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                  {/* Progress Steps - Premium Design */}
                  <div style={{ ...cardStyle, padding: '20px 32px', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {[
                        { num: 1, label: 'Sélectionner', desc: 'Choisir un produit', icon: 'ri-cursor-line' },
                        { num: 2, label: 'Trouver', desc: 'Sourcing AliExpress', icon: 'ri-search-line' },
                        { num: 3, label: 'Créer', desc: 'Store AI', icon: 'ri-magic-line' },
                      ].map((step, i) => (
                        <React.Fragment key={step.num}>
                          {i > 0 && (
                            <div style={{ flex: 1, height: 3, margin: '0 16px', background: copyProductStep > i ? 'linear-gradient(90deg, #22C55E 0%, #0c6cfb 100%)' : '#E5E7EB', borderRadius: 2 }} />
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 48, height: 48, borderRadius: 12,
                              background: copyProductStep === step.num ? 'linear-gradient(135deg, #0c6cfb 0%, #3B82F6 100%)' : copyProductStep > step.num ? '#22C55E' : '#F3F4F6',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: copyProductStep === step.num ? '0 4px 14px rgba(12, 108, 251, 0.3)' : 'none'
                            }}>
                              {copyProductStep > step.num ? (
                                <i className="ri-check-line" style={{ fontSize: 22, color: '#fff' }}></i>
                              ) : (
                                <i className={step.icon} style={{ fontSize: 20, color: copyProductStep === step.num ? '#fff' : '#6B7280' }}></i>
                              )}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: copyProductStep >= step.num ? '#111827' : '#9CA3AF' }}>{step.label}</div>
                              <div style={{ fontSize: 12, color: '#6B7280' }}>{step.desc}</div>
                            </div>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Step 1: Select Product */}
                  {copyProductStep === 1 && (
                    <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                      <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <i className="ri-shopping-bag-line" style={{ color: '#0c6cfb' }}></i>
                            Sélectionnez un best-seller
                          </h3>
                          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Choisissez un produit à succès pour trouver son équivalent sur AliExpress</p>
                        </div>
                        <div style={{ padding: '8px 16px', background: '#EFF6FF', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <i className="ri-lightbulb-line" style={{ color: '#0c6cfb' }}></i>
                          <span style={{ fontSize: 13, color: '#1D4ED8', fontWeight: 500 }}>{bestsellerProducts.length} produits disponibles</span>
                        </div>
                      </div>
                      
                      <div style={{ padding: 24 }}>
                        {bestsellerProducts.length > 0 ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                            {bestsellerProducts.slice(0, 12).map((p, idx) => (
                              <div 
                                key={p.id} 
                                onClick={() => handleSelectProductToCopy(p)}
                                style={{ 
                                  border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                                  transition: 'all 0.2s', background: '#fff', position: 'relative'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0c6cfb'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                              >
                                <div style={{ position: 'relative', aspectRatio: '1/1', background: '#F9FAFB' }}>
                                  <img src={p.imageUrl || 'https://via.placeholder.com/200'} alt={p.title || ''} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200'; }} />
                                  <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 6 }}>
                                    <span style={{ background: 'linear-gradient(135deg, #0c6cfb 0%, #3B82F6 100%)', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>#{idx + 1}</span>
                                    {p.bestProduct && <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>TOP</span>}
                                  </div>
                                </div>
                                <div style={{ padding: 14 }}>
                                  <h4 style={{ fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4, height: '2.8em' }}>{p.title}</h4>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 18, fontWeight: 700, color: '#0c6cfb' }}>{currency}{p.price || 0}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#F3F4F6', borderRadius: 6 }}>
                                      <i className="ri-arrow-right-line" style={{ fontSize: 12, color: '#6B7280' }}></i>
                                      <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>Sélectionner</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: 60 }}>
                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                              <i className="ri-shopping-bag-line" style={{ fontSize: 36, color: '#9CA3AF' }}></i>
                            </div>
                            <p style={{ color: '#6B7280', fontSize: 16, marginBottom: 8 }}>Aucun produit best-seller trouvé</p>
                            <p style={{ color: '#9CA3AF', fontSize: 13 }}>Cette boutique n&apos;a pas encore de produits identifiés comme best-sellers</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Similar Products from AliExpress */}
                  {copyProductStep === 2 && (
                    <div>
                      {/* Selected Product Summary - Better Design */}
                      {selectedProductToCopy && (
                        <div style={{ ...cardStyle, padding: 0, marginBottom: 24, overflow: 'hidden' }}>
                          <div style={{ background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)', padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', background: '#fff', border: '1px solid #E5E7EB', flexShrink: 0 }}>
                              <img src={selectedProductToCopy.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Produit sélectionné</div>
                              <h4 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 6, lineHeight: 1.4 }}>{selectedProductToCopy.title}</h4>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 20, fontWeight: 700, color: '#0c6cfb' }}>{currency}{selectedProductToCopy.price}</span>
                                <span style={{ padding: '4px 10px', background: '#DCFCE7', color: '#16A34A', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>Prix boutique</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => { setCopyProductStep(1); setSelectedProductToCopy(null); setSimilarProducts([]); }}
                              style={{ padding: '10px 20px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                              <i className="ri-arrow-left-line"></i>Changer
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Loading - Better Animation */}
                      {similarProductsLoading && (
                        <div style={{ ...cardStyle, padding: 60, textAlign: 'center' }}>
                          <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 24px' }}>
                            <div style={{ position: 'absolute', inset: 0, border: '4px solid #E5E7EB', borderTopColor: '#0c6cfb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            <div style={{ position: 'absolute', inset: 12, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <img src="/img/icons/aliexpress-icon.png" alt="" style={{ width: 32, height: 32 }} />
                            </div>
                          </div>
                          <p style={{ color: '#111827', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Recherche sur AliExpress...</p>
                          <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>Analyse de l&apos;image pour trouver des produits similaires</p>
                        </div>
                      )}

                      {/* Similar Products Grid - Table Design like existing modal */}
                      {!similarProductsLoading && similarProducts.length > 0 && (
                        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <img src="/img/icons/aliexpress-icon.png" alt="" style={{ width: 28, height: 28 }} />
                              <div>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>Produits similaires trouvés</h3>
                                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{similarProducts.length} résultats • Triés par ventes</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* AI Recommendation Banner - Different styles for valid vs invalid match */}
                          {aiRecommendedProductId && !aiRecommendationLoading && aiRecommendationIsValid && (
                            <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', borderBottom: '1px solid #6EE7B7', display: 'flex', alignItems: 'center', gap: 16 }}>
                              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                                <i className="ri-checkbox-circle-fill" style={{ color: '#fff', fontSize: 22 }}></i>
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: '#065F46' }}>Recommandation IA</span>
                                  <span style={{ padding: '3px 10px', background: '#10B981', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>✓ MEILLEUR CHOIX</span>
                                </div>
                                <div style={{ fontSize: 13, color: '#047857', lineHeight: 1.5 }}>{renderMarkdown(aiRecommendationReason || 'Ce produit offre le meilleur rapport qualité/prix/ventes pour maximiser vos profits.')}</div>
                              </div>
                              <button 
                                onClick={() => {
                                  const recommended = similarProducts.find(p => p.id === aiRecommendedProductId);
                                  if (recommended) { setSelectedSimilarProduct(recommended); setCopyProductStep(3); }
                                }}
                                style={{ 
                                  padding: '10px 20px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
                                  border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                }}
                              >
                                <i className="ri-magic-line"></i>Copier celui-ci
                              </button>
                            </div>
                          )}
                          
                          {/* AI Warning Banner - Category mismatch */}
                          {aiRecommendedProductId && !aiRecommendationLoading && !aiRecommendationIsValid && (
                            <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)', borderBottom: '1px solid #FECACA', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)', flexShrink: 0 }}>
                                <i className="ri-error-warning-fill" style={{ color: '#fff', fontSize: 22 }}></i>
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: '#991B1B' }}>Alerte IA</span>
                                  <span style={{ padding: '3px 10px', background: '#DC2626', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>⚠ CATÉGORIE DIFFÉRENTE</span>
                                </div>
                                <div style={{ fontSize: 13, color: '#B91C1C', lineHeight: 1.6 }}>{renderMarkdown(aiRecommendationReason || 'Les produits trouvés ne correspondent pas à la catégorie du produit source. Essayez une recherche plus spécifique.')}</div>
                                <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                                  <span style={{ fontSize: 12, color: '#7F1D1D' }}>
                                    <i className="ri-lightbulb-line me-1"></i>
                                    <strong>Conseil :</strong> Les résultats AliExpress ne correspondent pas au produit source. Sélectionnez manuellement un produit de la même catégorie dans la liste ci-dessous.
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* AI Loading */}
                          {aiRecommendationLoading && (
                            <div style={{ padding: '12px 24px', background: '#F5F3FF', borderBottom: '1px solid #E9D5FF', display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 20, height: 20, border: '2px solid #E9D5FF', borderTopColor: '#8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                              <span style={{ fontSize: 13, color: '#7C3AED' }}>L&apos;IA analyse les produits pour vous recommander le meilleur...</span>
                            </div>
                          )}
                          
                          <div className="table-responsive">
                            <table className="table mb-0" style={{ width: '100%' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#F5F7FA' }}>
                                  <th style={{ width: 70, padding: '12px 16px' }}></th>
                                  <th style={{ padding: '12px 16px' }}><span className="text-sub fs-small fw-500">Nom du produit</span></th>
                                  <th className="text-center" style={{ padding: '12px 16px' }}><span className="text-sub fs-small fw-500">Coût</span></th>
                                  <th className="text-center" style={{ padding: '12px 16px' }}><span className="text-sub fs-small fw-500">Prix vente (x3)</span></th>
                                  <th className="text-center" style={{ padding: '12px 16px' }}><span className="text-sub fs-small fw-500">Profit</span></th>
                                  <th className="text-center" style={{ padding: '12px 16px' }}><span className="text-sub fs-small fw-500">Ventes</span></th>
                                  <th style={{ padding: '12px 16px' }}></th>
                                </tr>
                              </thead>
                              <tbody>
                                {similarProducts.slice(0, 15).map((product) => {
                                  const isRecommended = product.id === aiRecommendedProductId;
                                  const isValidRecommendation = isRecommended && aiRecommendationIsValid;
                                  const isInvalidRecommendation = isRecommended && !aiRecommendationIsValid;
                                  
                                  // Define colors based on recommendation status
                                  const rowBg = isValidRecommendation 
                                    ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' 
                                    : isInvalidRecommendation 
                                      ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)' 
                                      : 'transparent';
                                  const accentColor = isValidRecommendation ? '#10B981' : isInvalidRecommendation ? '#EF4444' : '#3B82F6';
                                  const textColor = isValidRecommendation ? '#065F46' : isInvalidRecommendation ? '#991B1B' : '#111827';
                                  
                                  return (
                                  <tr 
                                    key={product.id} 
                                    style={{ 
                                      borderBottom: '1px solid #E5E7EB',
                                      background: rowBg,
                                      position: 'relative'
                                    }}
                                  >
                                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', position: 'relative' }}>
                                      <div style={{ position: 'relative' }}>
                                        <img src={product.imageUrl || '/img_not_found.png'} alt="" style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, border: isRecommended ? `2px solid ${accentColor}` : '1px solid #E5E7EB', background: '#F9FAFB' }} onError={(e) => { (e.target as HTMLImageElement).src = '/img_not_found.png'; }} />
                                        {isRecommended && (
                                          <div style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${accentColor}60` }}>
                                            <i className={isValidRecommendation ? 'ri-check-line' : 'ri-alert-line'} style={{ color: '#fff', fontSize: 12 }}></i>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', maxWidth: 280 }}>
                                      <div>
                                        {isValidRecommendation && (
                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: '#10B981', color: '#fff', borderRadius: 6, fontSize: 10, fontWeight: 600, marginBottom: 4 }}>
                                            <i className="ri-trophy-line" style={{ fontSize: 10 }}></i>RECOMMANDÉ
                                          </span>
                                        )}
                                        {isInvalidRecommendation && (
                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: '#EF4444', color: '#fff', borderRadius: 6, fontSize: 10, fontWeight: 600, marginBottom: 4 }}>
                                            <i className="ri-error-warning-line" style={{ fontSize: 10 }}></i>CATÉGORIE DIFFÉRENTE
                                          </span>
                                        )}
                                        <p style={{ margin: 0, fontSize: 13, color: textColor, fontWeight: isRecommended ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>{product.title}</p>
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                                      <span style={{ fontSize: 15, fontWeight: 600, color: '#EF4444' }}>${product.price.toFixed(2)}</span>
                                    </td>
                                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                                      <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>${(product.price * 3).toFixed(2)}</span>
                                    </td>
                                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: isValidRecommendation ? '#A7F3D0' : isInvalidRecommendation ? '#FECACA' : '#DCFCE7', borderRadius: 6 }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: isValidRecommendation ? '#065F46' : isInvalidRecommendation ? '#991B1B' : '#16A34A' }}>+${product.profit?.toFixed(2)}</span>
                                        <span style={{ fontSize: 11, color: isValidRecommendation ? '#065F46' : isInvalidRecommendation ? '#991B1B' : '#16A34A' }}>({product.profitPercent}%)</span>
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                                      <span style={{ fontSize: 13, color: '#6B7280' }}>{product.sales ? product.sales.toLocaleString() : '—'}</span>
                                    </td>
                                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                      <div style={{ display: 'flex', gap: 8 }}>
                                        <a href={product.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: 12 }}>
                                          <img src="/img/icons/aliexpress-icon.png" alt="" style={{ width: 14, height: 14, marginRight: 4 }} />Voir
                                        </a>
                                        <button 
                                          onClick={() => { setSelectedSimilarProduct(product); setCopyProductStep(3); }}
                                          className={isRecommended ? '' : 'btn btn-primary'}
                                          style={isRecommended ? { 
                                            padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', borderRadius: 6,
                                            background: isValidRecommendation ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#6B7280', 
                                            color: '#fff', display: 'flex', alignItems: 'center', gap: 4
                                          } : { padding: '8px 16px', fontSize: 12 }}
                                        >
                                          {isValidRecommendation && <i className="ri-magic-line" style={{ fontSize: 12 }}></i>}
                                          Copier
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* No Results - Better Design */}
                      {!similarProductsLoading && similarProducts.length === 0 && selectedProductToCopy && (
                        <div style={{ ...cardStyle, padding: 60, textAlign: 'center' }}>
                          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <i className="ri-search-line" style={{ fontSize: 36, color: '#D97706' }}></i>
                          </div>
                          <p style={{ color: '#111827', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Aucun produit similaire trouvé</p>
                          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>L&apos;image du produit n&apos;a pas permis de trouver des correspondances sur AliExpress</p>
                          <button 
                            onClick={() => { setCopyProductStep(1); setSelectedProductToCopy(null); }}
                            className="btn btn-primary" style={{ padding: '12px 24px' }}
                          >
                            <i className="ri-arrow-left-line me-2"></i>Choisir un autre produit
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Confirm and Copy - Premium Design */}
                  {copyProductStep === 3 && selectedSimilarProduct && (
                    <div style={{ ...cardStyle, padding: 0, maxWidth: 700, margin: '0 auto', overflow: 'hidden' }}>
                      {/* Success Header */}
                      <div style={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', padding: '32px 40px', textAlign: 'center' }}>
                        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                          <i className="ri-check-double-line" style={{ fontSize: 36, color: '#fff' }}></i>
                        </div>
                        <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Produit sélectionné avec succès !</h3>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', margin: 0 }}>Cliquez sur le bouton ci-dessous pour créer votre boutique</p>
                      </div>
                      
                      {/* Product Summary - Card Style */}
                      <div style={{ padding: 32 }}>
                        <div style={{ background: '#F9FAFB', borderRadius: 16, padding: 24, marginBottom: 24 }}>
                          <div style={{ display: 'flex', gap: 20 }}>
                            <div style={{ width: 120, height: 120, borderRadius: 12, overflow: 'hidden', background: '#fff', border: '1px solid #E5E7EB', flexShrink: 0 }}>
                              <img src={selectedSimilarProduct.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16, lineHeight: 1.5 }}>{selectedSimilarProduct.title}</h4>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                                <div style={{ background: '#fff', padding: 12, borderRadius: 10, border: '1px solid #E5E7EB' }}>
                                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase' }}>Coût AliExpress</div>
                                  <div style={{ fontSize: 20, fontWeight: 700, color: '#EF4444' }}>${selectedSimilarProduct.price.toFixed(2)}</div>
                                </div>
                                <div style={{ background: '#fff', padding: 12, borderRadius: 10, border: '1px solid #E5E7EB' }}>
                                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase' }}>Prix de vente</div>
                                  <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>${(selectedSimilarProduct.price * 3).toFixed(2)}</div>
                                </div>
                                <div style={{ background: '#DCFCE7', padding: 12, borderRadius: 10, border: '1px solid #BBF7D0' }}>
                                  <div style={{ fontSize: 11, color: '#16A34A', marginBottom: 4, textTransform: 'uppercase' }}>Profit / vente</div>
                                  <div style={{ fontSize: 20, fontWeight: 700, color: '#16A34A' }}>${(selectedSimilarProduct.price * 2).toFixed(2)}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 16 }}>
                          <button 
                            onClick={() => { setCopyProductStep(2); setSelectedSimilarProduct(null); }}
                            style={{ flex: 1, padding: '14px', border: '1px solid #E5E7EB', borderRadius: 10, background: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                          >
                            <i className="ri-arrow-left-line"></i>Retour
                          </button>
                          <button 
                            onClick={() => handleCopyProduct(selectedSimilarProduct.url)}
                            style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #0c6cfb 0%, #3B82F6 100%)', border: 'none', borderRadius: 10, fontSize: 15, color: '#fff', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 14px rgba(12, 108, 251, 0.3)' }}
                          >
                            <i className="ri-magic-line" style={{ fontSize: 18 }}></i>
                            Créer ma boutique avec Store AI
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
                            <button 
                              onClick={() => {
                                setSelectedProductForAliExpress({
                                  imageUrl: p.imageUrl || '',
                                  price: parseFloat(String(p.price)) || 0,
                                  title: p.title || ''
                                });
                                setAliExpressModalOpen(true);
                              }}
                              style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', padding: '8px 12px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                              <img src="/img/icons/aliexpress-icon.png" alt="" style={{ width: 16, height: 16 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              Trouver sur Aliexpress
                            </button>
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

      {/* AliExpress Search Modal */}
      <AliExpressSearchModal
        isOpen={aliExpressModalOpen}
        onClose={() => {
          setAliExpressModalOpen(false);
          setSelectedProductForAliExpress(null);
        }}
        productImageUrl={selectedProductForAliExpress?.imageUrl || ''}
        productPrice={selectedProductForAliExpress?.price || 0}
        productTitle={selectedProductForAliExpress?.title}
      />

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
