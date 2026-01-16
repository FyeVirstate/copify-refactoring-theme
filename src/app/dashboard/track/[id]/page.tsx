"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStats } from "@/contexts/StatsContext";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import AliExpressSearchModal from "@/components/AliExpressSearchModal";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Country code mapping for react-simple-maps (ISO 3166-1 alpha-2 to numeric)
// world-atlas uses ISO 3166-1 numeric codes (without leading zeros)
const countryCodeToNumeric: Record<string, string> = {
  // North America
  'US': '840', 'CA': '124', 'MX': '484', 'GT': '320', 'CU': '192', 'HT': '332', 'DO': '214', 'JM': '388',
  'HN': '340', 'SV': '222', 'NI': '558', 'CR': '188', 'PA': '591',
  // South America
  'BR': '76', 'AR': '32', 'CL': '152', 'CO': '170', 'PE': '604', 'VE': '862', 'EC': '218', 
  'BO': '68', 'PY': '600', 'UY': '858', 'GY': '328', 'SR': '740',
  // Western Europe
  'GB': '826', 'FR': '250', 'DE': '276', 'ES': '724', 'IT': '380', 'NL': '528', 'BE': '56', 'PT': '620',
  'CH': '756', 'AT': '40', 'IE': '372', 'LU': '442', 'MC': '492', 'AD': '20',
  // Northern Europe
  'SE': '752', 'NO': '578', 'DK': '208', 'FI': '246', 'IS': '352', 'EE': '233', 'LV': '428', 'LT': '440',
  // Eastern Europe
  'PL': '616', 'CZ': '203', 'SK': '703', 'HU': '348', 'RO': '642', 'BG': '100', 'UA': '804', 'BY': '112',
  'MD': '498', 'RU': '643',
  // Southern Europe & Balkans
  'GR': '300', 'HR': '191', 'RS': '688', 'SI': '705', 'BA': '70', 'ME': '499', 'MK': '807', 'AL': '8',
  'CY': '196', 'MT': '470',
  // Middle East
  'TR': '792', 'IL': '376', 'AE': '784', 'SA': '682', 'QA': '634', 'KW': '414', 'BH': '48', 'OM': '512',
  'JO': '400', 'LB': '422', 'SY': '760', 'IQ': '368', 'IR': '364', 'YE': '887',
  // South Asia
  'IN': '356', 'PK': '586', 'BD': '50', 'LK': '144', 'NP': '524', 'AF': '4',
  // Southeast Asia
  'CN': '156', 'JP': '392', 'KR': '410', 'KP': '408', 'VN': '704', 'TH': '764', 'MY': '458', 'SG': '702',
  'ID': '360', 'PH': '608', 'TW': '158', 'HK': '344', 'MM': '104', 'KH': '116', 'LA': '418', 'MN': '496',
  // Central Asia
  'KZ': '398', 'UZ': '860', 'TM': '795', 'KG': '417', 'TJ': '762',
  // Oceania
  'AU': '36', 'NZ': '554', 'PG': '598', 'FJ': '242',
  // Africa
  'ZA': '710', 'EG': '818', 'NG': '566', 'KE': '404', 'MA': '504', 'DZ': '12', 'TN': '788', 'LY': '434',
  'ET': '231', 'GH': '288', 'CI': '384', 'CM': '120', 'AO': '24', 'MZ': '508', 'MG': '450', 'TZ': '834',
  'UG': '800', 'SD': '729', 'SN': '686', 'ZW': '716', 'ZM': '894', 'BW': '72', 'NA': '516', 'CD': '180',
  'CG': '178', 'GA': '266', 'ML': '466', 'NE': '562', 'TD': '148', 'CF': '140', 'SS': '728', 'ER': '232',
  'DJ': '262', 'SO': '706', 'RW': '646', 'BI': '108', 'MW': '454', 'LS': '426', 'SZ': '748',
};

// Helper to get numeric code with fallback (handles both with and without leading zeros)
const getNumericCode = (alpha2: string): string | undefined => {
  const code = countryCodeToNumeric[alpha2];
  return code;
};

// Reverse mapping: numeric code to alpha-2
const numericToAlpha2: Record<string, string> = Object.entries(countryCodeToNumeric).reduce((acc, [alpha2, numeric]) => {
  acc[numeric] = alpha2;
  acc[numeric.padStart(3, '0')] = alpha2;
  return acc;
}, {} as Record<string, string>);

// Map View Component with hover tooltip
interface MapViewProps {
  countries: Array<{ name: string; code: string; value: number }>;
  defaultCountry: string | null;
  getCountryName: (code: string) => string;
  FlagImage: React.FC<{ code: string; size?: number }>;
}

const MapViewComponent: React.FC<MapViewProps> = ({ countries, defaultCountry, getCountryName, FlagImage }) => {
  const [hoveredCountry, setHoveredCountry] = useState<{ code: string; name: string; value: number | null; hasData: boolean } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 30]);
  
  const handleZoomIn = () => {
    if (zoom < 4) setZoom(zoom * 1.5);
  };
  
  const handleZoomOut = () => {
    if (zoom > 0.5) setZoom(zoom / 1.5);
  };
  
  // Pre-compute highlighted country data
  const countryDataMap = new Map<string, { code: string; name: string; value: number }>();
  const highlightedIds = new Set<string>();
  
  const countriesData = countries.length > 0 
    ? countries 
    : [{ name: getCountryName(defaultCountry || ''), code: defaultCountry || 'xx', value: 100 }];
  
  countriesData.forEach(c => {
    const numericCode = getNumericCode(c.code?.toUpperCase());
    if (numericCode) {
      highlightedIds.add(numericCode);
      highlightedIds.add(numericCode.padStart(3, '0'));
      countryDataMap.set(numericCode, c);
      countryDataMap.set(numericCode.padStart(3, '0'), c);
    }
  });
  
  return (
    <div style={{ position: 'relative' }}>
      {/* Hover Tooltip */}
      {hoveredCountry && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 8,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          pointerEvents: 'none'
        }}>
          <FlagImage code={hoveredCountry.code} size={24} />
          <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
            {hoveredCountry.name}
          </span>
          {hoveredCountry.hasData && hoveredCountry.value !== null ? (
            <span style={{ fontSize: 14, color: '#6B7280' }}>{Math.round(hoveredCountry.value ?? 0)}%</span>
          ) : (
            <span style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>No data</span>
          )}
        </div>
      )}
      
      {/* World Map */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 120,
          center: [0, 30]
        }}
        style={{ width: '100%', height: '280px' }}
      >
        <ZoomableGroup zoom={zoom} center={center} onMoveEnd={({ coordinates, zoom: z }) => { setCenter(coordinates as [number, number]); setZoom(z); }}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const geoId = String(geo.id);
                const isHighlighted = highlightedIds.has(geoId) || highlightedIds.has(geoId.replace(/^0+/, ''));
                const countryData = countryDataMap.get(geoId) || countryDataMap.get(geoId.replace(/^0+/, ''));
                
                // Get alpha-2 code from numeric ID for countries without data
                const alpha2Code = numericToAlpha2[geoId] || numericToAlpha2[geoId.replace(/^0+/, '')] || '';
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isHighlighted ? "#3B82F6" : "#E5E7EB"}
                    stroke="#FFFFFF"
                    strokeWidth={0.5}
                    onMouseEnter={() => {
                      if (isHighlighted && countryData) {
                        // Country with data
                        setHoveredCountry({
                          code: countryData.code,
                          name: getCountryName(countryData.code) || countryData.name,
                          value: countryData.value,
                          hasData: true
                        });
                      } else if (alpha2Code) {
                        // Country without data but we know the code
                        setHoveredCountry({
                          code: alpha2Code,
                          name: getCountryName(alpha2Code) || alpha2Code,
                          value: null,
                          hasData: false
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredCountry(null);
                    }}
                    style={{
                      default: { outline: "none", cursor: "pointer" },
                      hover: { fill: isHighlighted ? "#2563EB" : "#D1D5DB", outline: "none" },
                      pressed: { outline: "none" }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      
      {/* Zoom controls */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        display: 'flex',
        gap: 0,
        background: '#fff',
        borderRadius: 6,
        border: '1px solid #E5E7EB',
        overflow: 'hidden'
      }}>
        <button onClick={handleZoomIn} style={{ width: 28, height: 28, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 16, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        <button onClick={handleZoomOut} style={{ width: 28, height: 28, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 16, color: '#6B7280', borderLeft: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
      </div>
    </div>
  );
};

interface SuggestedShop {
  id: number;
  url: string;
  name: string | null;
  screenshot: string | null;
  locale: string | null;
  country: string | null;
  currency: string | null;
  activeAds: number | null;
  monthlyRevenue: number;
  trend: number;
}

interface ShopDetails {
  shop: {
    id: number;
    url: string;
    shopifyUrl: string;
    name: string | null;
country: string | null;
    locale: string | null;
    currency: string | null;
    productsCount: number | null;
    theme: string | null;
    schemaName: string | null;
    schemaVersion: string | null;
    screenshot: string | null;
    category: string | null;
    fonts: string[];
    colors: string[];
    apps: Array<{ name: string; icon: string | null; link: string | null }>;
    pixels: string[];
    createdAt: string | null;
    whoisAt: string | null; // Launch date from WHOIS
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
    trend?: number; // 1 = up, 0 = down
    // Ads-specific growth (separate from traffic)
    adsLastMonthGrowth?: string;
    adsThreeMonthGrowth?: string;
  };
  // Ads evolution chart data
  adsChart?: {
    labels: string[];
    allAds: number[];
    activeAds: number[];
  };
  traffic: {
    chartData: Array<{ date: string; visits: number; }>;
    sources: Array<{ name: string; value: number; icon: string | null; }>;
    countries: Array<{ name: string; code: string; value: number; }>;
    social: Array<{ name: string; value: number; icon: string | null; }>;
    mainSource: string | null;
    growthRate: number;
  };
  adStats: {
    videoCount: number;
    imageCount: number;
    videoPercent: number;
    imagePercent: number;
  };
  products: Array<{ id: number; handle: string; title: string; vendor: string | null; productType: string | null; price: number | null; compareAtPrice: number | null; imageUrl: string | null; createdAt: string | null; bestProduct: boolean; }>;
  ads: Array<{ id: number; adArchiveId: string; pageName: string | null; pageId: string | null; type: string | null; status: string | null; imageLink: string | null; videoPreview: string | null; videoLink: string | null; caption: string | null; ctaText: string | null; firstSeen: string | null; lastSeen: string | null; createdAt: string | null; }>;
  suggestedShops: SuggestedShop[];
  shopDomain: string;
  trackedSince: string;
}

export default function TrackDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const shopId = parseInt(id);
  const { refreshStats } = useStats();
  
  const [shopDetails, setShopDetails] = useState<ShopDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'sales' | 'traffic'>('sales');
  const [activeProductTab, setActiveProductTab] = useState<'bestsellers' | 'latest'>('bestsellers');
  const [activeTrafficSourceTab, setActiveTrafficSourceTab] = useState<'sources' | 'social'>('sources');
  const [hoveredTrafficSource, setHoveredTrafficSource] = useState<{ name: string; value: number; color: string } | null>(null);
  const [showMapView, setShowMapView] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  
  // Ads filter state
  const [formatFilter, setFormatFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  // Ads slider state - draggable carousel
  const [adsSliderIndex, setAdsSliderIndex] = useState(0);
  const adsPerPage = 3; // Show 3 ads at a time like Laravel Slick
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  // Suggested shops tracking state
  const [analyzingShopIds, setAnalyzingShopIds] = useState<Set<number>>(new Set());
  const [trackedShopIds, setTrackedShopIds] = useState<Set<number>>(new Set());
  const [toastAlerts, setToastAlerts] = useState<Array<{ id: number; type: 'success' | 'error' | 'info' | 'limit'; message: string }>>([]);
  
  // AliExpress search modal state
  const [aliExpressModalOpen, setAliExpressModalOpen] = useState(false);
  const [selectedProductForAliExpress, setSelectedProductForAliExpress] = useState<{ imageUrl: string; price: number; title: string } | null>(null);
  
  // Slider drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !sliderRef.current) return;
    const x = e.touches[0].pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  // Reset slider when filters change
  useEffect(() => {
    setAdsSliderIndex(0);
    if (sliderRef.current) {
      sliderRef.current.scrollLeft = 0;
      // At position 0, can't scroll left
      setCanScrollLeft(false);
      // Check if can scroll right
      const { scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollRight(scrollWidth > clientWidth + 5);
    }
  }, [formatFilter, statusFilter, sortOrder]);

  // Listen to scroll events on slider
  useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      const handleScroll = () => {
        const { scrollLeft, scrollWidth, clientWidth } = slider;
        setCanScrollLeft(scrollLeft > 5);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
      };
      
      slider.addEventListener('scroll', handleScroll);
      // Initial check with delay
      const timeoutId = setTimeout(handleScroll, 300);
      
      return () => {
        slider.removeEventListener('scroll', handleScroll);
        clearTimeout(timeoutId);
      };
    }
  }, [shopDetails]); // Re-run when shopDetails changes

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setIsLoading(true);
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
  }, [shopId]);

  // Fetch already tracked shops to know which ones show "Voir l'analyse"
  useEffect(() => {
    const fetchTrackedShops = async () => {
      try {
        const res = await fetch('/api/track');
        const data = await res.json();
        if (data.success && data.data) {
          const trackedIds = new Set<number>(data.data.map((shop: { id: number }) => shop.id));
          setTrackedShopIds(trackedIds);
        }
      } catch (err) {
        console.error('Failed to fetch tracked shops:', err);
      }
    };
    fetchTrackedShops();
  }, []);

  // Add toast alert
  const addToast = (type: 'success' | 'error' | 'info' | 'limit', message: string) => {
    const id = Date.now();
    setToastAlerts(prev => [...prev, { id, type, message }]);
    // Don't auto-dismiss limit alerts - user needs to interact
    if (type !== 'limit') {
      setTimeout(() => {
        setToastAlerts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    }
  };
  
  // Remove a specific toast
  const removeToast = (id: number) => {
    setToastAlerts(prev => prev.filter(t => t.id !== id));
  };

  // Handle analyze shop
  const handleAnalyzeShop = async (suggestedShopId: number, shopUrl: string) => {
    // Add to analyzing set
    setAnalyzingShopIds(prev => new Set(prev).add(suggestedShopId));
    
    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopUrl: shopUrl }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add to tracked shops
        setTrackedShopIds(prev => new Set(prev).add(suggestedShopId));
        addToast('success', `Boutique "${shopUrl}" ajoutée avec succès !`);
        // Refresh navbar stats
        refreshStats();
      } else if (data.error?.includes('already')) {
        setTrackedShopIds(prev => new Set(prev).add(suggestedShopId));
        addToast('info', 'Cette boutique est déjà dans votre liste de suivi.');
      } else if (data.error?.includes('limit') || data.error?.includes('maximum')) {
        addToast('limit', 'Vous avez atteint la limite maximale de boutique à suivre avec votre abonnement.');
      } else {
        addToast('error', data.error || 'Une erreur est survenue.');
      }
    } catch (err) {
      console.error('Error analyzing shop:', err);
      addToast('error', 'Erreur lors de l\'ajout de la boutique.');
    } finally {
      // Remove from analyzing set
      setAnalyzingShopIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestedShopId);
        return newSet;
      });
    }
  };

  // Handle view shop analysis
  const handleViewShopAnalysis = (suggestedShopId: number) => {
    // Find the tracked shop ID from our tracked list
    window.location.href = `/dashboard/track/${suggestedShopId}`;
  };

  const formatCurrency = (amount: number, symbol = "€") => {
    return `${symbol} ${new Intl.NumberFormat("fr-FR").format(Math.round(amount))}`;
  };

  // Helper to get country flag image URL from country code
  const getCountryFlagUrl = (countryCode: string): string => {
    const code = countryCode?.toLowerCase() || 'xx';
    return `/flags/${code}.svg`;
  };

  // Country code to name mapping
  const getCountryName = (code: string): string => {
    const names: Record<string, string> = {
      // North America
      'US': 'États-Unis', 'CA': 'Canada', 'MX': 'Mexique', 'GT': 'Guatemala', 'CU': 'Cuba',
      'HT': 'Haïti', 'DO': 'Rép. Dominicaine', 'JM': 'Jamaïque', 'HN': 'Honduras',
      'SV': 'Salvador', 'NI': 'Nicaragua', 'CR': 'Costa Rica', 'PA': 'Panama',
      // South America
      'BR': 'Brésil', 'AR': 'Argentine', 'CL': 'Chili', 'CO': 'Colombie', 'PE': 'Pérou',
      'VE': 'Venezuela', 'EC': 'Équateur', 'BO': 'Bolivie', 'PY': 'Paraguay', 'UY': 'Uruguay',
      'GY': 'Guyana', 'SR': 'Suriname',
      // Western Europe
      'GB': 'Royaume-Uni', 'FR': 'France', 'DE': 'Allemagne', 'ES': 'Espagne', 'IT': 'Italie',
      'NL': 'Pays-Bas', 'BE': 'Belgique', 'PT': 'Portugal', 'CH': 'Suisse', 'AT': 'Autriche',
      'IE': 'Irlande', 'LU': 'Luxembourg', 'MC': 'Monaco', 'AD': 'Andorre',
      // Northern Europe
      'SE': 'Suède', 'NO': 'Norvège', 'DK': 'Danemark', 'FI': 'Finlande', 'IS': 'Islande',
      'EE': 'Estonie', 'LV': 'Lettonie', 'LT': 'Lituanie',
      // Eastern Europe
      'PL': 'Pologne', 'CZ': 'Tchéquie', 'SK': 'Slovaquie', 'HU': 'Hongrie', 'RO': 'Roumanie',
      'BG': 'Bulgarie', 'UA': 'Ukraine', 'BY': 'Biélorussie', 'MD': 'Moldavie', 'RU': 'Russie',
      // Southern Europe & Balkans
      'GR': 'Grèce', 'HR': 'Croatie', 'RS': 'Serbie', 'SI': 'Slovénie', 'BA': 'Bosnie',
      'ME': 'Monténégro', 'MK': 'Macédoine du Nord', 'AL': 'Albanie', 'CY': 'Chypre', 'MT': 'Malte',
      // Middle East
      'TR': 'Turquie', 'IL': 'Israël', 'AE': 'Émirats arabes unis', 'SA': 'Arabie Saoudite',
      'QA': 'Qatar', 'KW': 'Koweït', 'BH': 'Bahreïn', 'OM': 'Oman', 'JO': 'Jordanie',
      'LB': 'Liban', 'SY': 'Syrie', 'IQ': 'Irak', 'IR': 'Iran', 'YE': 'Yémen',
      // South Asia
      'IN': 'Inde', 'PK': 'Pakistan', 'BD': 'Bangladesh', 'LK': 'Sri Lanka', 'NP': 'Népal', 'AF': 'Afghanistan',
      // East & Southeast Asia
      'CN': 'Chine', 'JP': 'Japon', 'KR': 'Corée du Sud', 'KP': 'Corée du Nord', 'VN': 'Vietnam',
      'TH': 'Thaïlande', 'MY': 'Malaisie', 'SG': 'Singapour', 'ID': 'Indonésie', 'PH': 'Philippines',
      'TW': 'Taiwan', 'HK': 'Hong Kong', 'MM': 'Myanmar', 'KH': 'Cambodge', 'LA': 'Laos', 'MN': 'Mongolie',
      // Central Asia
      'KZ': 'Kazakhstan', 'UZ': 'Ouzbékistan', 'TM': 'Turkménistan', 'KG': 'Kirghizistan', 'TJ': 'Tadjikistan',
      // Oceania
      'AU': 'Australie', 'NZ': 'Nouvelle-Zélande', 'PG': 'Papouasie-N.-Guinée', 'FJ': 'Fidji',
      // Africa
      'ZA': 'Afrique du Sud', 'EG': 'Égypte', 'NG': 'Nigeria', 'KE': 'Kenya', 'MA': 'Maroc',
      'DZ': 'Algérie', 'TN': 'Tunisie', 'LY': 'Libye', 'ET': 'Éthiopie', 'GH': 'Ghana',
      'CI': 'Côte d\'Ivoire', 'CM': 'Cameroun', 'AO': 'Angola', 'MZ': 'Mozambique', 'MG': 'Madagascar',
      'TZ': 'Tanzanie', 'UG': 'Ouganda', 'SD': 'Soudan', 'SN': 'Sénégal', 'ZW': 'Zimbabwe',
      'ZM': 'Zambie', 'BW': 'Botswana', 'NA': 'Namibie', 'CD': 'RD Congo', 'CG': 'Congo',
      'GA': 'Gabon', 'ML': 'Mali', 'NE': 'Niger', 'TD': 'Tchad', 'CF': 'Centrafrique',
      'SS': 'Soudan du Sud', 'ER': 'Érythrée', 'DJ': 'Djibouti', 'SO': 'Somalie',
      'RW': 'Rwanda', 'BI': 'Burundi', 'MW': 'Malawi', 'LS': 'Lesotho', 'SZ': 'Eswatini',
    };
    return names[code?.toUpperCase()] || code || 'Inconnu';
  };

  // Flag image component for consistency
  const FlagImage = ({ code, size = 20 }: { code: string; size?: number }) => (
    <img 
      src={getCountryFlagUrl(code)} 
      alt={getCountryName(code)}
      style={{ 
        width: size, 
        height: size * 0.75, 
        objectFit: 'cover',
        borderRadius: 2,
        border: '1px solid #E5E7EB'
      }}
      onError={(e) => { (e.target as HTMLImageElement).src = '/flags/xx.svg'; }}
    />
  );

  // Helper to format relative time
  const formatTimeAgo = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffYears > 0) return `Il y a ${diffYears} an${diffYears > 1 ? 's' : ''}`;
    if (diffMonths > 0) return `Il y a ${diffMonths} mois`;
    if (diffDays > 0) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    return "Aujourd'hui";
  };

  // Helper to strip HTML tags from strings
  const stripHtml = (html: string | null): string => {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  };

  // Helper to truncate text with "show more"
  const truncateText = (text: string, maxLength: number = 100): string => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Helper to format date
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Get shop launch date (from WHOIS data)
  const getLaunchDate = (): string => {
    // Prefer whoisAt (actual launch date) over createdAt (when we added to DB)
    const dateStr = shopDetails?.shop?.whoisAt || shopDetails?.shop?.createdAt;
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `Lancé en ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  if (isLoading) {
    return (
      <div style={{ background: '#F5F7FA', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #E5E7EB', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !shopDetails) {
    return (
      <div style={{ background: '#F5F7FA', minHeight: '100vh', padding: 24 }}>
        <div style={{ background: '#FEE2E2', color: '#DC2626', padding: 16, borderRadius: 8, marginBottom: 16 }}>{error || "Boutique non trouvée"}</div>
        <Link href="/dashboard/analyze-shop" style={{ color: '#3B82F6' }}>← Retour</Link>
      </div>
    );
  }

  // Chart data from API - Traffic data (visits)
  const trafficChartData = shopDetails.traffic.chartData.map(d => ({
    month: d.date,
    value: d.visits,
  }));

  // Calculate estimated revenue from visits for sales chart
  const avgPrice = 30; // Average order value
  const conversionRate = 0.02; // 2% conversion
  const salesChartData = shopDetails.traffic.chartData.map(d => ({
    month: d.date,
    value: Math.round(d.visits * conversionRate * avgPrice),
  }));

  // Active chart data based on tab
  const chartData = activeChartTab === 'sales' ? salesChartData : trafficChartData;

  // Theme colors from API - filter out pure black and white
  const themeColors = (shopDetails.shop.colors || [])
    .map(hex => hex.startsWith('#') ? hex : `#${hex}`)
    .filter(hex => {
      const cleanColor = hex.replace('#', '').toUpperCase();
      return cleanColor !== 'FFFFFF' && cleanColor !== '000000';
    })
    .slice(0, 12);
  const themeColorsRow1 = themeColors.slice(0, 6).map(hex => ({ hex }));
  const themeColorsRow2 = themeColors.slice(6, 12).map(hex => ({ hex }));
  
  // Theme fonts from API
  const themeFonts = shopDetails.shop.fonts || [];

  // Traffic sources from API - Colors matching Laravel exactly (trafficColors)
  // Generic traffic sources colors (matching Laravel order: Direct, Referral, Search, Social, Mail, Ads)
  // const trafficColors = ['#0C6CFB', '#F62B54', '#525866', '#1FC16B', '#693EE0', '#F6B51E'];
  const sourceColors: Record<string, string> = {
    // Generic traffic types (from SimilarWeb)
    "Direct": "#0C6CFB",                   // Blue
    "Referral": "#F62B54",                 // Red
    "Search": "#525866",                   // Gray
    "Recherche": "#525866",                // Gray (French)
    "Social": "#1FC16B",                   // Green
    "Réseaux Sociaux": "#1FC16B",          // Green (French)
    "Mail": "#693EE0",                     // Purple
    "Emails": "#693EE0",                   // Purple
    "Paid Search": "#F6B51E",              // Yellow/Orange
    "Publicités Facebook Ads": "#F6B51E",  // Yellow/Orange (French)
    "Display": "#F6B51E",                  // Yellow/Orange
    "Ads": "#F6B51E",                      // Yellow/Orange
    // Specific social networks (when SimilarWeb returns social breakdown)
    "Facebook": "#1877F2",                 // Facebook Blue
    "Youtube": "#FF0000",                  // YouTube Red
    "Reddit": "#FF4500",                   // Reddit Orange
    "Tiktok": "#000000",                   // TikTok Black
    "TikTok": "#000000",                   // TikTok Black (alternate)
    "Instagram": "#E4405F",                // Instagram Pink/Red
    "Twitter": "#1DA1F2",                  // Twitter Blue
    "Pinterest": "#BD081C",                // Pinterest Red
    "LinkedIn": "#0A66C2",                 // LinkedIn Blue
    "WhatsApp": "#25D366",                 // WhatsApp Green
    "Snapchat": "#FFFC00",                 // Snapchat Yellow
  };
  
  // Default colors array for sources without names (matching Laravel order: Direct, Referral, Search, Social, Mail, Ads)
  const defaultColors = ["#0C6CFB", "#F62B54", "#525866", "#1FC16B", "#693EE0", "#F6B51E"];
  
  const trafficSources = shopDetails.traffic.sources.length > 0 
    ? shopDetails.traffic.sources.map((s, index) => ({
        name: s.name,
        color: sourceColors[s.name] || defaultColors[index % defaultColors.length],
        value: s.value,
      }))
    : [{ name: "Direct", color: "#0C6CFB", value: 100 }];

  // Social media sources from API with their brand colors
  const socialColors: Record<string, string> = {
    "Facebook": "#1877F2",
    "Youtube": "#FF0000",
    "Instagram": "#E4405F",
    "Pinterest": "#BD081C",
    "Twitter": "#1DA1F2",
    "Tiktok": "#000000",
    "TikTok": "#000000",
    "LinkedIn": "#0A66C2",
    "WhatsApp": "#25D366",
    "Snapchat": "#FFFC00",
    "Reddit": "#FF4500",
    "Tumblr": "#35465C",
  };
  const defaultSocialColors = ["#1877F2", "#FF0000", "#E4405F", "#BD081C", "#1DA1F2", "#000000"];
  
  const socialSources = shopDetails.traffic.social.length > 0 
    ? shopDetails.traffic.social.map((s, index) => ({
        name: s.name,
        color: socialColors[s.name] || defaultSocialColors[index % defaultSocialColors.length],
        value: s.value,
      }))
    : [];
  
  const hasSocialData = socialSources.length > 0;

  // Products from API (sorted by creation date for "latest" tab)
  const latestProducts = [...shopDetails.products]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  
  // Best sellers are products marked with bestProduct = true, or all products sorted by most recent if none are marked
  const bestsellerProducts = shopDetails.products.filter(p => p.bestProduct).length > 0
    ? shopDetails.products.filter(p => p.bestProduct)
    : shopDetails.products;

  // Facebook Ads from API
  const facebookAds = shopDetails.ads.map(ad => {
    const firstSeen = ad.firstSeen ? new Date(ad.firstSeen) : null;
    const lastSeen = ad.lastSeen ? new Date(ad.lastSeen) : new Date();
    const activeDays = firstSeen ? Math.ceil((lastSeen.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    return {
      id: ad.id,
      name: ad.pageName || shopDetails.shop.name || 'Unknown',
      activeDays,
      caption: stripHtml(ad.caption || ''),
      img: ad.imageLink || '',
      videoPoster: ad.videoPreview || ad.imageLink || '', // Video thumbnail
      videoUrl: ad.videoLink || '',
      type: (ad.type || 'image') as 'video' | 'image',
      status: (ad.status === 'ACTIVE' ? 'active' : 'inactive') as 'active' | 'inactive',
      pageId: ad.pageId,
      adArchiveId: ad.adArchiveId,
    };
  });

  // Filter ads based on filters
  const filteredAds = facebookAds.filter(ad => {
    if (formatFilter.length > 0 && !formatFilter.includes(ad.type)) return false;
    if (statusFilter.length > 0 && !statusFilter.includes(ad.status)) return false;
    return true;
  }).sort((a, b) => {
    if (sortOrder === 'recent') return b.activeDays - a.activeDays;
    return a.activeDays - b.activeDays;
  });

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "-";
    return new Intl.NumberFormat("fr-FR").format(num);
  };

  // Platform icons using images from /img/socials/ folder (same as Laravel)
  const platformIconMap: Record<string, string> = {
    Google: '/img/socials/google.svg',
    Facebook: '/img/socials/facebook.svg',
    Instagram: '/img/socials/instagram.svg',
    TikTok: '/img/socials/tiktok.svg',
    Snapchat: '/img/socials/snapchat.svg',
    Twitter: '/img/socials/twitter-x-line.svg',
    Pinterest: '/img/socials/pinterest.svg',
    Reddit: '/img/socials/reddit.svg',
    TripleWhale: '/img/socials/triple-whale.svg',
    Applovin: '/img/socials/applovin.svg',
    TraderAI: '/img/socials/meta.svg', // Using meta as fallback for TraderAI
  };

  // Render platform icon
  const renderPlatformIcon = (platformName: string) => {
    const iconPath = platformIconMap[platformName];
    if (iconPath) {
      return (
        <img 
          src={iconPath} 
          alt={platformName} 
          width={20} 
          height={20} 
          style={{ objectFit: 'contain' }}
          onError={(e) => {
            // Fallback to first letter if image fails
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const fallback = document.createElement('div');
              fallback.style.cssText = 'width:20px;height:20px;background:#f0f0f0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;';
              fallback.textContent = platformName[0];
              parent.appendChild(fallback);
            }
          }}
        />
      );
    }
    // Fallback for unknown platforms
    return (
      <div style={{ 
        width: 20, 
        height: 20, 
        background: '#f0f0f0', 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 600
      }}>
        {platformName[0]}
      </div>
    );
  };

  // Detected pixels/platforms
  const detectedPixels = shopDetails.shop.pixels || [];

  // Helper function to get ad library URL for each platform
  const getAdLibraryUrl = (platformName: string): string => {
    const domain = shopDetails.shopDomain || shopDetails.shop.url?.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').replace(/\/.*$/, '') || '';
    switch (platformName.toLowerCase()) {
      case 'google':
        return `https://adstransparency.google.com/?region=anywhere&domain=${domain}`;
      case 'facebook':
      case 'instagram':
        return `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=${encodeURIComponent(domain)}&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped&search_type=keyword_unordered&media_type=all`;
      case 'tiktok':
        return `https://library.tiktok.com/ads?region=all&adv_name=${encodeURIComponent(domain)}`;
      case 'snapchat':
        return `https://adslibrary.snapchat.com/`;
      case 'pinterest':
        return `https://ads.pinterest.com/ads/transparency/search/${encodeURIComponent(domain)}`;
      default:
        return '#';
    }
  };

  // Platforms with pixel detection status
  const platformNames = ["Google", "Facebook", "Instagram", "TikTok", "Snapchat", "Twitter", "Pinterest", "Reddit", "TripleWhale", "Applovin", "TraderAI"];
  const platforms = platformNames.map(name => ({
    name,
    status: detectedPixels.some(p => p.toLowerCase().includes(name.toLowerCase())),
    adLibraryUrl: getAdLibraryUrl(name)
  }));

  // Apps from shop data - now returns proper objects from API
  const installedApps = shopDetails.shop.apps || [];

  // Suggested shops from API
  const suggestedShopsData = shopDetails.suggestedShops || [];

  const cardStyle = { 
    background: '#fff', 
    border: '1px solid #E5E7EB', 
    borderRadius: 12 
  };

  return (
    <div style={{ background: '#F5F7FA', minHeight: '100vh' }}>
      {/* Hide scrollbar CSS for slider */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Toast Alerts */}
      {toastAlerts.length > 0 && (
        <div style={{ 
          position: 'fixed', 
          top: 20, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          {toastAlerts.map((alert) => (
            <div 
              key={alert.id}
              style={{
                padding: alert.type === 'limit' ? '14px 20px' : '12px 20px',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                backgroundColor: alert.type === 'success' ? '#212529' : (alert.type === 'error' || alert.type === 'limit') ? '#dc3545' : '#ffc107',
              }}
            >
              {alert.type === 'success' && <i className="ri-check-line"></i>}
              {alert.type === 'error' && <i className="ri-error-warning-line"></i>}
              {alert.type === 'limit' && <i className="ri-error-warning-line"></i>}
              {alert.type === 'info' && <i className="ri-information-line" style={{ color: '#000' }}></i>}
              <span style={{ color: alert.type === 'info' ? '#000' : '#fff', flex: 1 }}>{alert.message}</span>
              {alert.type === 'limit' && (
                <Link 
                  href="/dashboard/plans"
                  onClick={() => removeToast(alert.id)}
                  style={{
                    backgroundColor: '#fff',
                    color: '#374151',
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    border: '1px solid #E5E7EB',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Débloquer l&apos;accès complet
                </Link>
              )}
              {alert.type !== 'limit' && (
                <button 
                  onClick={() => removeToast(alert.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: alert.type === 'info' ? '#000' : '#fff',
                    cursor: 'pointer',
                    padding: 4,
                    opacity: 0.7,
                  }}
                >
                  <i className="ri-close-line"></i>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div  >
        
        {/* ====== HEADER ====== */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 24px', 
          background: '#fff', 
          borderBottom: '1px solid #E5E7EB' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/dashboard/analyze-shop" style={{ 
              color: '#6B7280', 
              fontSize: 24, 
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center'
            }}>‹</Link>
            {/* Shop Logo/Avatar - use Clearbit logo (best for small icons) */}
            <div style={{ 
              width: 36, 
              height: 36, 
              borderRadius: '50%', 
              overflow: 'hidden',
              border: '1px solid #E5E7EB',
              background: '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <img 
                src={`https://logo.clearbit.com/${shopDetails.shop.url?.replace('www.', '')}`}
                alt={shopDetails.shop.name || ''}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain'
                }}
                onError={(e) => { 
                  const target = e.target as HTMLImageElement;
                  // Try Google favicon as fallback
                  if (!target.src.includes('google.com/s2')) {
                    target.src = `https://www.google.com/s2/favicons?domain=${shopDetails.shop.url?.replace('www.', '')}&sz=64`;
                  } else if (shopDetails.shop.fbPageId && !target.src.includes('graph.facebook')) {
                    // Try Facebook page picture
                    target.src = `https://graph.facebook.com/${shopDetails.shop.fbPageId}/picture?type=square`;
                  } else {
                    // Final fallback: show first letter
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span style="font-size: 16px; font-weight: 600; color: #6B7280">${(shopDetails.shop.name || shopDetails.shop.url || 'S')[0].toUpperCase()}</span>`;
                    }
                  }
                }}
              />
            </div>
            <div>
              <span style={{ fontWeight: 600, fontSize: 18, color: '#111827' }}>
                {shopDetails.shop.name || shopDetails.shop.url?.replace('www.', '')}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Flag and country with gray background */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              background: '#F3F4F6',
              padding: '6px 12px',
              borderRadius: 8
            }}>
              <FlagImage code={shopDetails.shop.country || shopDetails.shop.locale || 'xx'} size={20} />
            </div>
            {/* Launch date with gray background */}
            <div style={{ 
              background: '#F3F4F6',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 13, 
              color: '#374151',
              fontWeight: 500
            }}>
              {getLaunchDate()}
            </div>
            {/* Meta Ad Library button with gray background */}
            <a 
              href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=${shopDetails.shop.url?.replace('www.', '')}&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped&search_type=keyword_unordered&media_type=all`} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ 
                fontSize: 13, 
                color: '#374151', 
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: '#F3F4F6',
                padding: '6px 12px',
                borderRadius: 8,
                fontWeight: 500
              }}
            >
              Meta Ad Library <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
            </a>
            {/* Site web button with gray background */}
            <a 
              href={`https://${shopDetails.shop.url}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ 
                fontSize: 13, 
                color: '#374151', 
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: '#F3F4F6',
                padding: '6px 12px',
                borderRadius: 8,
                fontWeight: 500
              }}
            >
              Site web <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
            </a>
            <button 
              onClick={() => window.location.reload()}
              title="Actualiser les données"
              style={{ 
                border: 'none', 
                background: '#F3F4F6', 
                cursor: 'pointer', 
                fontSize: 16,
                color: '#6B7280',
                padding: '6px 10px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                <path d="M16 21h5v-5"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ====== MAIN CONTENT ====== */}
        <div style={{ 
          maxWidth: 1400, 
          margin: '0 auto', 
          padding: '24px 48px 48px 48px' 
        }}>
          
          {/* METRICS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
            {[
              { value: formatCurrency(shopDetails.metrics.dailyRevenue, shopDetails.shop.currency === 'USD' ? '$' : '€'), label: "Ventes quotidiennes estimées", trend: shopDetails.metrics.trend ?? 1, hasArrow: true },
              { value: formatCurrency(shopDetails.metrics.monthlyRevenue, shopDetails.shop.currency === 'USD' ? '$' : '€'), label: "Ventes mensuelles estimées", trend: shopDetails.metrics.trend ?? 1, hasArrow: true },
              { value: String(shopDetails.shop.productsCount || 0), label: "Nombre de produits sur le site", trend: 0, hasArrow: false },
              { value: String(shopDetails.metrics.monthlyOrders || 0), label: "Nombre de commandes moyennes par mois", trend: shopDetails.metrics.trend ?? 1, hasArrow: true },
            ].map((m, i) => (
              <div key={i} style={{ ...cardStyle, padding: '20px 24px' }}>
                <div style={{ 
                  fontSize: 28, 
                  fontWeight: 600, 
                  color: '#111827', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8 
                }}>
                  {m.value}
                  {m.hasArrow && (
                    m.trend === 1 ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="7" y1="17" x2="17" y2="7"/>
                        <polyline points="7,7 17,7 17,17"/>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="7" y1="7" x2="17" y2="17"/>
                        <polyline points="17,7 17,17 7,17"/>
                      </svg>
                    )
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* TWO COLUMN LAYOUT */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 16 }}>
            
            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Chart Card */}
              <div style={{ ...cardStyle, padding: 20 }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: 32, marginBottom: 20 }}>
                  <button 
                    onClick={() => setActiveChartTab('sales')} 
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 0', 
                      border: 'none', 
                      background: 'none', 
                      borderBottom: activeChartTab === 'sales' ? '2px solid #0C6CFB' : '2px solid transparent',
                      fontWeight: 500, 
                      fontSize: 14, 
                      cursor: 'pointer', 
                      color: activeChartTab === 'sales' ? '#111827' : '#6B7280'
                    }}
                  >
                    <i className="ri-money-dollar-circle-line" style={{ fontSize: 18, color: activeChartTab === 'sales' ? '#0C6CFB' : '#9CA3AF' }}></i>
                    Ventes mensuelles estimées
                  </button>
                  <button 
                    onClick={() => setActiveChartTab('traffic')} 
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 0', 
                      border: 'none', 
                      background: 'none', 
                      borderBottom: activeChartTab === 'traffic' ? '2px solid #0C6CFB' : '2px solid transparent',
                      fontWeight: 500, 
                      fontSize: 14, 
                      cursor: 'pointer', 
                      color: activeChartTab === 'traffic' ? '#111827' : '#6B7280'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={activeChartTab === 'traffic' ? '#0C6CFB' : '#9CA3AF'} strokeWidth="2">
                      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                    </svg>
                    Trafic estimé sur les derniers mois
                  </button>
                </div>

                {/* Growth badges - matches Laravel fs-xxs + badge-sm */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 500, textTransform: 'uppercase' }}>
                    LE 3 DERNIERS MOIS 
                    <span style={{ 
                      background: Number(shopDetails.metrics.threeMonthGrowth) >= 0 ? '#DFFFEA' : '#FFEEF3', 
                      color: Number(shopDetails.metrics.threeMonthGrowth) >= 0 ? '#16A34A' : '#DC2626', 
                      padding: '2px 8px', 
                      borderRadius: 20, 
                      fontSize: 11,
                      fontWeight: 500,
                      marginLeft: 6
                    }}>{Number(shopDetails.metrics.threeMonthGrowth) >= 0 ? '+' : ''}{shopDetails.metrics.threeMonthGrowth}%</span>
                  </span>
                  <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 500, textTransform: 'uppercase' }}>
                    LE MOIS DERNIER 
                    <span style={{ 
                      background: Number(shopDetails.metrics.visitsGrowth) >= 0 ? '#DFFFEA' : '#FFEEF3', 
                      color: Number(shopDetails.metrics.visitsGrowth) >= 0 ? '#16A34A' : '#DC2626', 
                      padding: '2px 8px', 
                      borderRadius: 20, 
                      fontSize: 11,
                      fontWeight: 500,
                      marginLeft: 6
                    }}>{Number(shopDetails.metrics.visitsGrowth) >= 0 ? '+' : ''}{shopDetails.metrics.visitsGrowth}%</span>
                  </span>
                </div>

                {/* Chart - matches Laravel canvas height="200" */}
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 11, fill: '#9CA3AF' }} 
                        axisLine={false} 
                        tickLine={false}
                        tickFormatter={(value) => {
                          try {
                            const date = new Date(value);
                            return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                          } catch {
                            return value;
                          }
                        }}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#9CA3AF' }} 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(v) => activeChartTab === 'sales' 
                          ? `${new Intl.NumberFormat('fr-FR').format(v)} €` 
                          : new Intl.NumberFormat('fr-FR').format(v)
                        }
                        width={80}
                      />
                      <Tooltip 
                        formatter={(value) => [
                          activeChartTab === 'sales'
                            ? `${new Intl.NumberFormat('fr-FR').format(Number(value) || 0)} €`
                            : `${new Intl.NumberFormat('fr-FR').format(Number(value) || 0)} visites`,
                          activeChartTab === 'sales' ? 'Ventes estimées' : 'Trafic'
                        ]}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#22C55E" 
                        strokeWidth={2} 
                        fill="url(#colorValue)" 
                        dot={{ fill: '#22C55E', strokeWidth: 2, r: 5, stroke: '#fff' }} 
                        activeDot={{ r: 7 }} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Traffic Sources Card */}
              <div style={{ ...cardStyle, padding: 20 }}>
                {/* Header with tabs if social data exists */}
                {hasSocialData ? (
                  <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
                    <button 
                      onClick={() => setActiveTrafficSourceTab('sources')}
                      style={{ 
                        padding: '8px 16px', 
                        border: 'none', 
                        background: 'none', 
                        borderBottom: activeTrafficSourceTab === 'sources' ? '2px solid #0C6CFB' : '2px solid transparent',
                        fontWeight: 500, 
                        fontSize: 14, 
                        cursor: 'pointer', 
                        color: activeTrafficSourceTab === 'sources' ? '#111827' : '#6B7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                      Sources de Trafics
                    </button>
                    <button 
                      onClick={() => setActiveTrafficSourceTab('social')}
                      style={{ 
                        padding: '8px 16px', 
                        border: 'none', 
                        background: 'none', 
                        borderBottom: activeTrafficSourceTab === 'social' ? '2px solid #0C6CFB' : '2px solid transparent',
                        fontWeight: 500, 
                        fontSize: 14, 
                        cursor: 'pointer', 
                        color: activeTrafficSourceTab === 'social' ? '#111827' : '#6B7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="18" cy="5" r="3"/>
                        <circle cx="6" cy="12" r="3"/>
                        <circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                      </svg>
                      Réseaux Sociaux
                    </button>
                  </div>
                ) : (
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: '#111827' }}>Sources de Trafics</div>
                )}
                
                {/* Traffic Sources View */}
                {activeTrafficSourceTab === 'sources' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
                    {/* Interactive SVG Donut Chart with Hover */}
                    <div style={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
                      {(() => {
                        const total = trafficSources.reduce((sum, s) => sum + s.value, 0);
                        const size = 160;
                        const radius = 70;
                        const innerRadius = 42;
                        const center = size / 2;
                        
                        // Convert percentage to radians and create SVG arc paths
                        const createArcPath = (startPercent: number, endPercent: number, r: number, inner: number) => {
                          const startAngle = (startPercent / 100) * 2 * Math.PI - Math.PI / 2;
                          const endAngle = (endPercent / 100) * 2 * Math.PI - Math.PI / 2;
                          
                          const x1 = center + r * Math.cos(startAngle);
                          const y1 = center + r * Math.sin(startAngle);
                          const x2 = center + r * Math.cos(endAngle);
                          const y2 = center + r * Math.sin(endAngle);
                          const x3 = center + inner * Math.cos(endAngle);
                          const y3 = center + inner * Math.sin(endAngle);
                          const x4 = center + inner * Math.cos(startAngle);
                          const y4 = center + inner * Math.sin(startAngle);
                          
                          const largeArc = endPercent - startPercent > 50 ? 1 : 0;
                          
                          return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${largeArc} 0 ${x4} ${y4} Z`;
                        };
                        
                        let currentPercent = 0;
                        const segments = trafficSources.map((s) => {
                          const startPercent = currentPercent;
                          const percentage = total > 0 ? (s.value / total) * 100 : 0;
                          currentPercent += percentage;
                          return {
                            ...s,
                            startPercent,
                            endPercent: currentPercent,
                            percentage
                          };
                        });
                        
                        return (
                          <>
                            <svg width={size} height={size} style={{ display: 'block' }}>
                              {segments.map((seg, i) => (
                                seg.percentage > 0 && (
                                  <path
                                    key={i}
                                    d={createArcPath(seg.startPercent, seg.endPercent, radius, innerRadius)}
                                    fill={seg.color}
                                    style={{ 
                                      cursor: 'pointer',
                                      transition: 'opacity 0.15s ease',
                                      opacity: hoveredTrafficSource && hoveredTrafficSource.name !== seg.name ? 0.5 : 1
                                    }}
                                    onMouseEnter={() => setHoveredTrafficSource({ name: seg.name, value: seg.value, color: seg.color })}
                                    onMouseLeave={() => setHoveredTrafficSource(null)}
                                  />
                                )
                              ))}
                              {/* Center text showing hovered value */}
                              {hoveredTrafficSource && (
                                <>
                                  <text
                                    x={center}
                                    y={center - 5}
                                    textAnchor="middle"
                                    fill="#111827"
                                    fontSize="18"
                                    fontWeight="600"
                                  >
                                    {Math.round(hoveredTrafficSource.value)}%
                                  </text>
                                  <text
                                    x={center}
                                    y={center + 14}
                                    textAnchor="middle"
                                    fill="#6B7280"
                                    fontSize="11"
                                  >
                                    {hoveredTrafficSource.name}
                                  </text>
                                </>
                              )}
                            </svg>
                            {/* Tooltip on hover */}
                            {hoveredTrafficSource && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: -45,
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  background: '#1F2937',
                                  color: '#fff',
                                  padding: '8px 12px',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 500,
                                  whiteSpace: 'nowrap',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  zIndex: 10,
                                  pointerEvents: 'none'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ 
                                    width: 8, 
                                    height: 8, 
                                    borderRadius: '50%', 
                                    background: hoveredTrafficSource.color 
                                  }} />
                                  <span>{hoveredTrafficSource.name}: {Math.round(hoveredTrafficSource.value)}%</span>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    
                    {/* Legend - Interactive */}
                    <div style={{ flex: 1 }}>
                      {trafficSources.map((s, i) => (
                        <div 
                          key={i} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '10px 0', 
                            borderBottom: i < trafficSources.length - 1 ? '1px solid #F3F4F6' : 'none',
                            cursor: 'pointer',
                            borderRadius: 4,
                            transition: 'background 0.15s ease',
                            background: hoveredTrafficSource?.name === s.name ? '#F9FAFB' : 'transparent',
                            marginLeft: -8,
                            marginRight: -8,
                            paddingLeft: 8,
                            paddingRight: 8,
                          }}
                          onMouseEnter={() => setHoveredTrafficSource({ name: s.name, value: s.value, color: s.color })}
                          onMouseLeave={() => setHoveredTrafficSource(null)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ 
                              width: 10, 
                              height: 10, 
                              borderRadius: '50%', 
                              background: s.color 
                            }} />
                            <span style={{ fontSize: 13, color: '#374151' }}>{s.name}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{Math.round(s.value)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Social Media View */}
                {activeTrafficSourceTab === 'social' && hasSocialData && (
                  <div style={{ flex: 1 }}>
                    {socialSources.map((s, i) => (
                      <div key={i} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '10px 0', 
                        borderBottom: i < socialSources.length - 1 ? '1px solid #F3F4F6' : 'none' 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: '50%', 
                            background: s.color 
                          }} />
                          <span style={{ fontSize: 13, color: '#374151' }}>{s.name}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{Math.round(s.value)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Markets Card */}
              <div style={{ ...cardStyle, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>Marchés exploités par la boutique</span>
                  <button 
                    onClick={() => setShowMapView(!showMapView)}
                    style={{ 
                      width: 32,
                      height: 32,
                      border: '1px solid #E5E7EB', 
                      background: showMapView ? '#F3F4F6' : '#fff', 
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title={showMapView ? 'Voir la liste' : 'Voir la carte'}
                  >
                    {showMapView ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* List View */}
                {!showMapView && (
                  <>
                    {(shopDetails.traffic.countries.length > 0 
                      ? shopDetails.traffic.countries.slice(0, 5).map(c => ({
                          country: getCountryName(c.code) || c.name,
                          code: c.code,
                          pct: c.value
                        }))
                      : [{ country: getCountryName(shopDetails.shop.country || ''), code: shopDetails.shop.country || 'xx', pct: 100 }]
                    ).map((c, i, arr) => (
                      <div key={i} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '14px 0', 
                        borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none' 
                      }}>
                        <span style={{ fontSize: 14, color: '#374151', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <FlagImage code={c.code} size={24} />
                          <span>{c.country}</span>
                        </span>
                        <span style={{ fontSize: 14, color: '#6B7280', fontWeight: 500 }}>{Math.round(c.pct)} %</span>
                      </div>
                    ))}
                  </>
                )}
                
                {/* Map View */}
                {showMapView && (
                  <MapViewComponent 
                    countries={shopDetails.traffic.countries}
                    defaultCountry={shopDetails.shop.country}
                    getCountryName={getCountryName}
                    FlagImage={FlagImage}
                  />
                )}
              </div>

              {/* Theme Card */}
              <div style={{ ...cardStyle, padding: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: '#111827' }}>Thème</div>
                
                {/* Theme Name */}
                <div style={{ marginBottom: themeFonts.length > 0 || themeColors.length > 0 ? 16 : 0 }}>
                  <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>Nom</div>
                  <div style={{ background: '#F9FAFB', padding: '12px 16px', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                    <a 
                      href={`https://www.google.com/search?q=${encodeURIComponent((shopDetails.shop.schemaName || shopDetails.shop.theme || '') + ' ' + (shopDetails.shop.schemaVersion || '') + ' shopify theme')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0C6CFB', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}
                    >
                      {shopDetails.shop.schemaName || shopDetails.shop.theme || 'Unknown'} {shopDetails.shop.schemaVersion || ''}
                    </a>
                  </div>
                </div>
                
                {/* Fonts - Only show if fonts exist */}
                {themeFonts.length > 0 && (
                  <div style={{ marginBottom: themeColors.length > 0 ? 16 : 0 }}>
                    <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>Polices</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {themeFonts.map((font, i) => (
                        <div key={i} style={{ background: '#F9FAFB', padding: '12px 16px', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                          <a 
                            href={`https://www.google.com/search?q=${encodeURIComponent(font + ' font')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#0C6CFB', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}
                          >
                            {font}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Colors - Only show if colors exist */}
                {themeColors.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>Couleurs</div>
                    {/* Row 1 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: themeColorsRow2.length > 0 ? 8 : 0 }}>
                      {themeColorsRow1.map((c, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ 
                            width: '100%', 
                            aspectRatio: '1', 
                            background: c.hex, 
                            borderRadius: 6,
                            border: ['#f5f5f5', '#F5F5F5', '#dfdfdf', '#DFDFDF', '#f7f5f4', '#F7F5F4', '#fff6f6', '#FFF6F6', '#cccccc', '#CCCCCC'].includes(c.hex) ? '1px solid #E5E7EB' : 'none'
                          }} />
                          <span style={{ fontSize: 8, color: '#9CA3AF', marginTop: 4 }}>{c.hex}</span>
                        </div>
                      ))}
                    </div>
                    {/* Row 2 */}
                    {themeColorsRow2.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                        {themeColorsRow2.map((c, i) => (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ 
                              width: '100%', 
                              aspectRatio: '1', 
                              background: c.hex, 
                              borderRadius: 6,
                              border: ['#f5f5f5', '#F5F5F5', '#dfdfdf', '#DFDFDF', '#f7f5f4', '#F7F5F4', '#fff6f6', '#FFF6F6', '#cccccc', '#CCCCCC'].includes(c.hex) ? '1px solid #E5E7EB' : 'none'
                            }} />
                            <span style={{ fontSize: 8, color: '#9CA3AF', marginTop: 4 }}>{c.hex}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* PRODUCTS SECTION */}
          <div className="products-section-box">
            {/* Tabs header */}
            <ul style={{ 
              display: 'flex', 
              alignItems: 'stretch',
              gap: 24,
              flexWrap: 'nowrap',
              paddingRight: 55,
              borderBottom: '1px solid #dee2e6',
              margin: 0,
              padding: 0,
              listStyle: 'none'
            }}>
              <li>
                <button 
                  onClick={() => setActiveProductTab('bestsellers')} 
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '16px 14px',
                    border: 'none', 
                    background: 'none', 
                    borderBottom: activeProductTab === 'bestsellers' ? '2px solid #0C6CFB' : '2px solid transparent',
                    fontWeight: 500, 
                    fontSize: 14, 
                    cursor: 'pointer',
                    color: '#0E121B'
                  }}
                >
                  <i className="ri-thumb-up-line" style={{ 
                    marginRight: 6, 
                    color: activeProductTab === 'bestsellers' ? '#0C6CFB' : '#525866',
                    fontSize: 15
                  }}></i>
                  Meilleures ventes
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveProductTab('latest')} 
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '16px 14px', 
                    border: 'none', 
                    background: 'none', 
                    borderBottom: activeProductTab === 'latest' ? '2px solid #0C6CFB' : '2px solid transparent',
                    fontWeight: 500, 
                    fontSize: 14, 
                    cursor: 'pointer',
                    color: '#0E121B'
                  }}
                >
                  <i className="ri-megaphone-line" style={{ 
                    marginRight: 6, 
                    color: activeProductTab === 'latest' ? '#0C6CFB' : '#525866',
                    fontSize: 15
                  }}></i>
                  Derniers produits ajoutés sur le site
                </button>
              </li>
            </ul>
              
            {/* Find Supplier button - positioned absolute top right */}
            <div style={{ position: 'absolute', right: 18, top: 20 }}>
              <a 
                href="https://autods.com" 
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  padding: '8px 14px', 
                  border: '1px solid #E5E7EB', 
                  borderRadius: 8, 
                  background: '#fff', 
                  fontSize: 13, 
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: '#374151',
                  textDecoration: 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <img 
                  src="/img/autods-logo.jpeg" 
                  alt="AutoDS" 
                  style={{ width: 24, height: 24, borderRadius: 8 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                Trouver mon Fournisseur
              </a>
            </div>
            
            {/* Products list - mt-4 = 24px */}
            <div className="mt-4 w-100">
              {(activeProductTab === 'bestsellers' ? bestsellerProducts : latestProducts)
                .slice(0, showAllProducts ? undefined : 3)
                .map((p, idx) => (
                <div key={p.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: 12 
                }}>
                  {/* Numéros uniquement pour "Meilleures ventes" */}
                  {activeProductTab === 'bestsellers' && (
                    <div style={{ 
                      marginRight: 12,
                      minWidth: 16
                    }}>
                      <p style={{ 
                        color: '#1f2937', 
                        marginBottom: 0, 
                        fontWeight: 700,
                        fontSize: 14
                      }}>{idx + 1}</p>
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: 8,
                    paddingRight: 16,
                    overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: 80,
                        height: 80,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 8,
                        backgroundColor: '#f8f9fa',
                        flexShrink: 0
                      }}>
                        <img 
                          src={p.imageUrl || 'https://via.placeholder.com/80'} 
                          alt={p.title || ''} 
                          style={{ 
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain',
                            objectPosition: 'center'
                          }} 
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80'; }}
                        />
                      </div>
                      {/* mx-2 mx-md-3 py-2 */}
                      <div className="mx-2 mx-md-3 py-2" style={{ flex: 1 }}>
                        <h4 className="fs-normal mb-0 mb-md-1 fw-regular product_title" style={{ 
                          fontWeight: 400, 
                          fontSize: 14, 
                          color: '#111827',
                          maxHeight: '2.4em',
                          lineHeight: '1.2em',
                          overflow: 'hidden',
                          marginBottom: 0
                        }}>{p.title}</h4>
                        <a 
                          href={`https://${shopDetails.shop.url}/products/${p.handle}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ 
                            color: '#0d6efd', 
                            fontSize: 13, 
                            textDecoration: 'none',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Voir le produit
                        </a>
                        {activeProductTab === 'latest' && p.createdAt && (
                          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                            <span style={{ fontWeight: 600 }}>{formatTimeAgo(p.createdAt)}</span>
                            <span style={{ marginLeft: 8 }}>{formatDate(p.createdAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Actions à droite */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8,
                      flexShrink: 0,
                      padding: '8px 0'
                    }}>
                      {/* Prix */}
                      <span style={{ 
                        color: '#0c6cfb', 
                        fontWeight: 600, 
                        fontSize: 18,
                        whiteSpace: 'nowrap'
                      }}>
                        {shopDetails.shop.currency === 'USD' ? '$' : '€'}{p.price || 0}
                      </span>
                      {/* Bouton Trouver sur Aliexpress */}
                      <div className="d-flex justify-content-end ms-3">
                        <button 
                          onClick={() => {
                            setSelectedProductForAliExpress({
                              imageUrl: p.imageUrl || '',
                              price: parseFloat(String(p.price)) || 0,
                              title: p.title || ''
                            });
                            setAliExpressModalOpen(true);
                          }}
                          style={{ 
                            border: '1px solid #E5E7EB', 
                            borderRadius: 8, 
                            background: '#fff', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 12px',
                            fontSize: 13,
                            color: '#374151',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                        >
                          <img 
                            src="/img/icons/aliexpress-icon.png" 
                            alt="AliExpress" 
                            style={{ width: 16, height: 16, flexShrink: 0 }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          Trouver sur Aliexpress
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* View More button */}
            {!showAllProducts && (activeProductTab === 'bestsellers' ? bestsellerProducts : latestProducts).length > 3 && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                <button 
                  onClick={() => setShowAllProducts(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 20px',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    background: '#fff',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    color: '#374151'
                  }}>
                  Voir Plus ↓
                </button>
              </div>
            )}
            {showAllProducts && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                <button 
                  onClick={() => setShowAllProducts(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 20px',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    background: '#fff',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    color: '#374151'
                  }}>
                  Voir Moins ↑
                </button>
              </div>
            )}
          </div>

          {/* Facebook Ads */}
          <div style={{ ...cardStyle, marginTop: 16, padding: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>Publicités Facebook Ads ({shopDetails.metrics.allAds || shopDetails.ads.length})</span>
                  <a 
                    href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=${shopDetails.shop.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#6B7280', fontSize: 14 }}
                  >↗</a>
                </div>
                {/* Progress bar with proper active/inactive segments */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ 
                    display: 'flex', 
                    width: 120, 
                    height: 6, 
                    borderRadius: 3,
                    overflow: 'hidden',
                    background: '#E5E7EB'
                  }}>
                    {/* Active segment (green) */}
                    <div style={{ 
                      width: `${shopDetails.metrics.allAds && shopDetails.metrics.allAds > 0 
                        ? Math.round((shopDetails.metrics.activeAdsCount / shopDetails.metrics.allAds) * 100) 
                        : 0}%`, 
                      height: '100%', 
                      background: '#22C55E',
                      borderRadius: shopDetails.metrics.inactiveAdsCount === 0 ? 3 : '3px 0 0 3px'
                    }} />
                    {/* Inactive segment (gray) */}
                    <div style={{ 
                      width: `${shopDetails.metrics.allAds && shopDetails.metrics.allAds > 0 
                        ? Math.round((shopDetails.metrics.inactiveAdsCount / shopDetails.metrics.allAds) * 100) 
                        : 0}%`, 
                      height: '100%', 
                      background: '#D1D5DB',
                      borderRadius: shopDetails.metrics.activeAdsCount === 0 ? 3 : '0 3px 3px 0'
                    }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      background: '#22C55E',
                      display: 'inline-block'
                    }}></span>
                    <span style={{ color: '#374151', fontWeight: 500 }}>{shopDetails.metrics.activeAdsCount}</span>
                    <span style={{ color: '#6B7280' }}>Actif</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      background: '#D1D5DB',
                      display: 'inline-block'
                    }}></span>
                    <span style={{ color: '#374151', fontWeight: 500 }}>{shopDetails.metrics.inactiveAdsCount}</span>
                    <span style={{ color: '#6B7280' }}>Inactif</span>
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>Mis à jour il y a 1 semaine</span>
                <button style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px', 
                  border: '1px solid #E5E7EB', 
                  borderRadius: 8, 
                  background: '#fff', 
                  fontSize: 13, 
                  cursor: 'pointer',
                  color: '#374151'
                }}>
                  ↻ Mettre à jour
                </button>
              </div>
            </div>
            
            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {/* Format Filter Dropdown */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => { setShowFormatDropdown(!showFormatDropdown); setShowStatusDropdown(false); setShowSortDropdown(false); }}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px', 
                    border: formatFilter.length > 0 ? '1px solid #3B82F6' : '1px solid #E5E7EB', 
                    borderRadius: 8, 
                    background: formatFilter.length > 0 ? '#EFF6FF' : '#fff', 
                    fontSize: 13, 
                    cursor: 'pointer',
                    color: formatFilter.length > 0 ? '#3B82F6' : '#374151'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={formatFilter.length > 0 ? '#3B82F6' : '#9CA3AF'} strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="m8 21 4-4 4 4" /></svg>
                  Format {formatFilter.length > 0 && <span style={{ background: '#3B82F6', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 10 }}>{formatFilter.length}</span>}
                  <span style={{ color: '#9CA3AF' }}>▾</span>
                </button>
                {showFormatDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: 4,
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    padding: 12,
                    minWidth: 200,
                    zIndex: 100,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer', fontSize: 13 }}>
                      <input 
                        type="checkbox" 
                        checked={formatFilter.includes('video')}
                        onChange={(e) => setFormatFilter(e.target.checked ? [...formatFilter, 'video'] : formatFilter.filter(f => f !== 'video'))}
                        style={{ width: 16, height: 16 }}
                      />
                      Video
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer', fontSize: 13 }}>
                      <input 
                        type="checkbox" 
                        checked={formatFilter.includes('image')}
                        onChange={(e) => setFormatFilter(e.target.checked ? [...formatFilter, 'image'] : formatFilter.filter(f => f !== 'image'))}
                        style={{ width: 16, height: 16 }}
                      />
                      Image
                    </label>
                    <button
                      onClick={() => setShowFormatDropdown(false)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#3B82F6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        marginTop: 8
                      }}
                    >
                      Appliquer les filtres
                    </button>
                  </div>
                )}
              </div>

              {/* Status Filter Dropdown */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowFormatDropdown(false); setShowSortDropdown(false); }}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px', 
                    border: statusFilter.length > 0 ? '1px solid #3B82F6' : '1px solid #E5E7EB', 
                    borderRadius: 8, 
                    background: statusFilter.length > 0 ? '#EFF6FF' : '#fff', 
                    fontSize: 13, 
                    cursor: 'pointer',
                    color: statusFilter.length > 0 ? '#3B82F6' : '#374151'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={statusFilter.length > 0 ? '#3B82F6' : '#9CA3AF'} strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  Status {statusFilter.length > 0 && <span style={{ background: '#3B82F6', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 10 }}>{statusFilter.length}</span>}
                  <span style={{ color: '#9CA3AF' }}>▾</span>
                </button>
                {showStatusDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: 4,
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    padding: 12,
                    minWidth: 200,
                    zIndex: 100,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer', fontSize: 13 }}>
                      <input 
                        type="checkbox" 
                        checked={statusFilter.includes('active')}
                        onChange={(e) => setStatusFilter(e.target.checked ? [...statusFilter, 'active'] : statusFilter.filter(f => f !== 'active'))}
                        style={{ width: 16, height: 16 }}
                      />
                      Active
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer', fontSize: 13 }}>
                      <input 
                        type="checkbox" 
                        checked={statusFilter.includes('inactive')}
                        onChange={(e) => setStatusFilter(e.target.checked ? [...statusFilter, 'inactive'] : statusFilter.filter(f => f !== 'inactive'))}
                        style={{ width: 16, height: 16 }}
                      />
                      Inactive
                    </label>
                    <button
                      onClick={() => setShowStatusDropdown(false)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#3B82F6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        marginTop: 8
                      }}
                    >
                      Appliquer les filtres
                    </button>
                  </div>
                )}
              </div>

              {/* Sort Dropdown */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>Trier:</span>
                <button 
                  onClick={() => { setShowSortDropdown(!showSortDropdown); setShowFormatDropdown(false); setShowStatusDropdown(false); }}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px', 
                    border: '1px solid #E5E7EB', 
                    borderRadius: 8, 
                    background: '#fff', 
                    fontSize: 13, 
                    cursor: 'pointer',
                    color: '#374151',
                    minWidth: 140
                  }}
                >
                  {sortOrder === 'recent' ? 'Plus récentes' : 'Plus anciennes'}
                  <span style={{ color: '#9CA3AF', marginLeft: 'auto' }}>▾</span>
                </button>
                {showSortDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 4,
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    overflow: 'hidden',
                    minWidth: 160,
                    zIndex: 100,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <button
                      onClick={() => { setSortOrder('recent'); setShowSortDropdown(false); }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: sortOrder === 'recent' ? '#3B82F6' : '#fff',
                        color: sortOrder === 'recent' ? '#fff' : '#374151',
                        border: 'none',
                        fontSize: 13,
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      Plus récentes
                    </button>
                    <button
                      onClick={() => { setSortOrder('oldest'); setShowSortDropdown(false); }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: sortOrder === 'oldest' ? '#3B82F6' : '#fff',
                        color: sortOrder === 'oldest' ? '#fff' : '#374151',
                        border: 'none',
                        fontSize: 13,
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      Plus anciennes
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Ads Carousel/Slider - Draggable like Slick */}
            <div style={{ position: 'relative', margin: '0 -8px' }}>
              {filteredAds.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>
                  Aucune publicité ne correspond à vos filtres
                </div>
              ) : (
                <>
                  {/* Left Arrow - only show when can scroll left */}
                  {canScrollLeft && (
                    <button 
                      onClick={() => {
                        if (sliderRef.current) {
                          sliderRef.current.scrollBy({ left: -386, behavior: 'smooth' });
                        }
                      }}
                      style={{
                        position: 'absolute',
                        left: 16,
                        top: 350,
                        transform: 'translateY(-50%)',
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(0, 0, 0, 0.6)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        color: '#fff',
                        zIndex: 10,
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.target as HTMLButtonElement).style.background = 'rgba(0, 0, 0, 0.9)'}
                      onMouseLeave={(e) => (e.target as HTMLButtonElement).style.background = 'rgba(0, 0, 0, 0.6)'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M15 18l-6-6 6-6"/>
                      </svg>
                    </button>
                  )}
                  
                  {/* Slider Container - Draggable */}
                  <div 
                    ref={sliderRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseUp}
                    style={{ 
                      display: 'flex', 
                      gap: 8,
                      overflowX: 'auto',
                      scrollSnapType: 'x mandatory',
                      scrollBehavior: 'smooth',
                      cursor: isDragging ? 'grabbing' : 'grab',
                      userSelect: 'none',
                      padding: '0 8px',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                    className="hide-scrollbar"
                  >
                    {filteredAds.map((ad) => (
                    <div key={ad.id} style={{ 
                      flex: '0 0 370px',
                      width: 370,
                      background: '#fff',
                      border: '1px solid #E1E4EA', 
                      borderRadius: 10, 
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      scrollSnapAlign: 'start',
                      boxShadow: 'none'
                    }}>
                      {/* Ad Header */}
                      <div style={{ padding: '12px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img 
                            src={ad.pageId ? `https://graph.facebook.com/${ad.pageId}/picture?type=square` : `https://logo.clearbit.com/${shopDetails.shop.url}`} 
                            alt="" 
                            style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid #E5E7EB', flexShrink: 0 }} 
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://logo.clearbit.com/${shopDetails.shop.url}`; }} 
                          />
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13, color: '#111827', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.name}</div>
                            <div style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ 
                                width: 6, 
                                height: 6, 
                                borderRadius: '50%', 
                                background: ad.status === 'active' ? '#22C55E' : '#9CA3AF',
                                flexShrink: 0 
                              }}></span>
                              <span style={{ color: ad.status === 'active' ? '#22C55E' : '#9CA3AF' }}>
                                {ad.status === 'active' ? `Active depuis ${ad.activeDays} jours` : `Était active ${ad.activeDays} jours`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <a 
                          href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&is_targeted_country=false&media_type=all&search_type=keyword_unordered&id=${ad.adArchiveId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ 
                            width: 32, 
                            height: 32, 
                            borderRadius: 6, 
                            background: '#f5f7fa',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                            flexShrink: 0
                          }}
                          title="Voir dans Meta Ad Library"
                        >
                          <i className="ri-meta-line" style={{ fontSize: '14px', color: '#525866' }}></i>
                        </a>
                      </div>
                      
                      {/* Caption with see more */}
                      {ad.caption && (
                        <div style={{ padding: '12px', fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>
                          <p style={{ margin: 0 }}>
                            {ad.caption.length > 120 ? (
                              <>
                                {ad.caption.slice(0, 120)}...
                                <button 
                                  onClick={(e) => {
                                    const btn = e.target as HTMLButtonElement;
                                    const parent = btn.parentElement;
                                    if (parent) {
                                      parent.innerHTML = ad.caption;
                                    }
                                  }}
                                  style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    color: '#3B82F6', 
                                    cursor: 'pointer', 
                                    padding: 0, 
                                    fontSize: 12,
                                    marginLeft: 4
                                  }}
                                >
                                  Voir plus
                                </button>
                              </>
                            ) : ad.caption}
                          </p>
                        </div>
                      )}
                      
                      {/* Ad Image/Video - fixed height for consistency */}
                      <div style={{ position: 'relative', flex: 1, minHeight: 300, maxHeight: 400, background: '#f3f4f6' }}>
                        {ad.type === 'video' ? (
                          <>
                            <video 
                              controls
                              preload="metadata"
                              poster={ad.videoPoster || ad.img || undefined}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover', 
                                position: 'absolute', 
                                top: 0, 
                                left: 0,
                                background: '#000'
                              }}
                            >
                              <source src={ad.videoUrl} type="video/mp4" />
                              Votre navigateur ne supporte pas les vidéos.
                            </video>
                            {/* Play button overlay - shows only if video hasn't started */}
                            <div 
                              className="video-play-overlay"
                              style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: 60,
                                height: 60,
                                background: 'rgba(0,0,0,0.6)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 3,
                                pointerEvents: 'none'
                              }}
                            >
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </>
                        ) : ad.img ? (
                          <img 
                            src={ad.img} 
                            alt="" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} 
                            onError={(e) => { 
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #9ca3af; font-size: 14px;">Image non disponible</div>`;
                              }
                            }}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: 14 }}>
                            Image non disponible
                          </div>
                        )}
                        {/* Download button */}
                        <button 
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = ad.type === 'video' ? ad.videoUrl : ad.img;
                            link.download = `ad-${ad.id}`;
                            link.target = '_blank';
                            link.click();
                          }}
                          style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                            width: 32,
                            height: 32,
                          border: 'none',
                            borderRadius: 8,
                            background: 'rgba(255,255,255,0.9)',
                            color: '#374151',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                            fontSize: 12,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                          title="Télécharger"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Ad Footer */}
                      <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', borderRadius: '0 0 12px 12px', marginTop: 'auto' }}>
                        <div>
                          <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {shopDetails.shopDomain?.replace('www.', '') || shopDetails.shop.url?.replace('www.', '')}
                          </div>
                          <div style={{ fontSize: 12, color: '#374151', fontWeight: 500, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ad.name}
                          </div>
                        </div>
                        <a 
                          href={`https://${shopDetails.shop.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ 
                            padding: '8px 14px', 
                            border: 'none', 
                          borderRadius: 6, 
                            background: '#3B82F6', 
                            color: '#fff', 
                          fontSize: 12, 
                          cursor: 'pointer',
                            fontWeight: 500,
                            textDecoration: 'none'
                          }}
                        >Voir la boutique</a>
                      </div>
                    </div>
                  ))}
                </div>
              
              {/* Right Arrow - only show when can scroll right */}
                  {canScrollRight && (
                    <button 
                      onClick={() => {
                        if (sliderRef.current) {
                          sliderRef.current.scrollBy({ left: 386, behavior: 'smooth' });
                        }
                      }}
                      style={{
                        position: 'absolute',
                        right: 16,
                        top: 350,
                        transform: 'translateY(-50%)',
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(0, 0, 0, 0.6)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        color: '#fff',
                        zIndex: 10,
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.target as HTMLButtonElement).style.background = 'rgba(0, 0, 0, 0.9)'}
                      onMouseLeave={(e) => (e.target as HTMLButtonElement).style.background = 'rgba(0, 0, 0, 0.6)'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Ads Evolution + Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginTop: 16 }}>
            <div style={{ ...cardStyle, padding: 20, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, color: '#111827' }}>Évolution du nombre de publicités</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 500, textTransform: 'uppercase' }}>
                  LE 3 DERNIERS MOIS 
                  <span style={{ 
                    background: Number(shopDetails.metrics.adsThreeMonthGrowth || 0) >= 0 ? '#DFFFEA' : '#FFEEF3', 
                    color: Number(shopDetails.metrics.adsThreeMonthGrowth || 0) >= 0 ? '#16A34A' : '#DC2626', 
                    padding: '2px 8px', 
                    borderRadius: 20, 
                    fontSize: 11,
                    fontWeight: 500,
                    marginLeft: 6 
                  }}>
                    {Number(shopDetails.metrics.adsThreeMonthGrowth || 0) >= 0 ? '+' : ''}{shopDetails.metrics.adsThreeMonthGrowth || 0}%
                  </span>
                </span>
                <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 500, textTransform: 'uppercase' }}>
                  LE MOIS DERNIER 
                  <span style={{ 
                    background: Number(shopDetails.metrics.adsLastMonthGrowth || 0) >= 0 ? '#DFFFEA' : '#FFEEF3', 
                    color: Number(shopDetails.metrics.adsLastMonthGrowth || 0) >= 0 ? '#16A34A' : '#DC2626', 
                    padding: '2px 8px', 
                    borderRadius: 20, 
                    fontSize: 11,
                    fontWeight: 500,
                    marginLeft: 6 
                  }}>
                    {Number(shopDetails.metrics.adsLastMonthGrowth || 0) >= 0 ? '+' : ''}{shopDetails.metrics.adsLastMonthGrowth || 0}%
                  </span>
                </span>
              </div>
              <div style={{ flex: 1, minHeight: 200 }}>
                {(() => {
                  // Determine chart color based on growth trend (green = positive, red = negative)
                  const isPositiveTrend = Number(shopDetails.metrics.adsThreeMonthGrowth || 0) >= 0;
                  const chartStrokeColor = isPositiveTrend ? '#22C55E' : '#EF4444';
                  const chartFillColor = isPositiveTrend ? '#22C55E20' : '#EF444420';
                  
                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={shopDetails.adsChart?.labels?.length 
                          ? shopDetails.adsChart.labels.map((label, i) => ({ 
                              month: label, 
                              allAds: shopDetails.adsChart?.allAds[i] || 0,
                              activeAds: shopDetails.adsChart?.activeAds[i] || 0 
                            }))
                          : [{ month: 'Jan', allAds: 0, activeAds: 0 }]
                        } 
                        margin={{ top: 5, right: 5, left: 10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(value) => { try { const date = new Date(value); if (!isNaN(date.getTime())) return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }); return value; } catch { return value; } }} />
                        <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => new Intl.NumberFormat('fr-FR').format(v)} />
                        <Tooltip 
                          formatter={(value, name) => [
                            new Intl.NumberFormat('fr-FR').format(Number(value) || 0), 
                            name === 'allAds' ? 'Total Ads' : 'Active Ads'
                          ]}
                          contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        />
                        {/* Show gray line for all ads if different from active */}
                        {shopDetails.adsChart?.allAds?.some((v, i) => v !== shopDetails.adsChart?.activeAds[i]) && (
                          <Area type="monotone" dataKey="allAds" stroke="#CACFD8" strokeWidth={2} fill="#F5F7FA00" />
                        )}
                        <Area type="monotone" dataKey="activeAds" stroke={chartStrokeColor} strokeWidth={2} fill={chartFillColor} />
                      </AreaChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>
            <div style={{ ...cardStyle, padding: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: '#111827' }}>Type de Publicités</div>
              
              {/* Gauge Chart - Centered */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 180, height: 100 }}>
                  {(() => {
                    // Calculate arc positions correctly
                    const centerX = 90;
                    const centerY = 85;
                    const radius = 70;
                    const strokeWidth = 14;
                    const videoAngle = (shopDetails.adStats.videoPercent / 100) * Math.PI; // 0 to PI (180 degrees)
                    
                    // Start point (left of arc)
                    const startX = centerX - radius;
                    const startY = centerY;
                    
                    // Video end point (where green meets blue)
                    const videoEndX = centerX - radius * Math.cos(videoAngle);
                    const videoEndY = centerY - radius * Math.sin(videoAngle);
                    
                    // End point (right of arc)
                    const endX = centerX + radius;
                    const endY = centerY;
                    
                    return (
                      <svg viewBox="0 0 180 100" width="180" height="100" style={{ overflow: 'visible' }}>
                        {/* Background arc (gray) */}
                        <path 
                          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
                          fill="none" 
                          stroke="#E5E7EB" 
                          strokeWidth={strokeWidth} 
                          strokeLinecap="round" 
                        />
                        {/* Video portion (green) */}
                        {shopDetails.adStats.videoPercent > 0 && (
                          <path 
                            d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${videoEndX} ${videoEndY}`}
                            fill="none" 
                            stroke="#22C55E" 
                            strokeWidth={strokeWidth} 
                            strokeLinecap="round" 
                          />
                        )}
                        {/* Image portion (blue) - rest of the arc */}
                        {shopDetails.adStats.imagePercent > 0 && (
                          <path 
                            d={`M ${videoEndX} ${videoEndY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
                            fill="none" 
                            stroke="#3B82F6" 
                            strokeWidth={strokeWidth} 
                            strokeLinecap="round" 
                          />
                        )}
                      </svg>
                    );
                  })()}
                  {/* Center text */}
                  <div style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    textAlign: 'center' 
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 600, color: '#111827', lineHeight: 1 }}>{shopDetails.metrics.allAds || shopDetails.ads.length}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Publicités</div>
                  </div>
                </div>
              </div>

              {/* Separator line */}
              <div style={{ borderTop: '1px solid #E5E7EB', margin: '16px 0 12px 0' }} />

              {/* Legend - Below */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, background: '#22C55E', borderRadius: 2 }} />
                    <span style={{ fontSize: 13, color: '#374151' }}>Vidéos</span>
                  </div>
                  <span style={{ fontSize: 13, color: '#9CA3AF' }}>({shopDetails.adStats.videoPercent}%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, background: '#3B82F6', borderRadius: 2 }} />
                    <span style={{ fontSize: 13, color: '#374151' }}>Images</span>
                  </div>
                  <span style={{ fontSize: 13, color: '#9CA3AF' }}>({shopDetails.adStats.imagePercent}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Platforms + Apps */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <div style={{ ...cardStyle, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Découvrez les publicités</div>
                <div 
                  style={{ position: 'relative' }}
                  title="Si aucun résultat n'est affiché, il est possible que la boutique ne fasse pas de publicités payantes mais seulement des publicités organiques."
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" style={{ cursor: 'help' }}>
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4M12 8h.01"/>
                  </svg>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ textAlign: 'left', padding: '8px 0', color: '#6B7280', fontWeight: 500 }}>Réseaux</th>
                    <th style={{ textAlign: 'left', padding: '8px 0', color: '#6B7280', fontWeight: 500 }}>Configuration des pixels</th>
                    <th style={{ textAlign: 'right', padding: '8px 0', color: '#6B7280', fontWeight: 500 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {platforms.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '12px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {renderPlatformIcon(p.name)}
                          <span style={{ fontWeight: 500 }}>{p.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 0' }}>
                        <span style={{ 
                          background: p.status ? '#DCFCE7' : '#FEE2E2', 
                          color: p.status ? '#16A34A' : '#DC2626', 
                          padding: '4px 12px', 
                          borderRadius: 20, 
                          fontSize: 12,
                          fontWeight: 500
                        }}>
                          {p.status ? 'Oui' : 'Non'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 0', textAlign: 'right' }}>
                        {/* Snapchat never shows action - their ad library doesn't support direct search */}
                        {p.status && p.adLibraryUrl !== '#' && p.name.toLowerCase() !== 'snapchat' && (
                          <a 
                            href={p.adLibraryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                            padding: '6px 14px',
                            border: '1px solid #E5E7EB',
                            borderRadius: 6,
                            background: '#fff',
                            fontSize: 12,
                            cursor: 'pointer',
                            color: '#374151',
                            display: 'inline-flex',
                            alignItems: 'center',
                              gap: 4,
                              textDecoration: 'none'
                            }}
                          >
                            Voir les Ads <span>→</span>
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ ...cardStyle, padding: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: '#111827' }}>Apps installées</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ textAlign: 'left', padding: '8px 0', color: '#6B7280', fontWeight: 500 }}>App</th>
                    <th style={{ textAlign: 'right', padding: '8px 0', color: '#6B7280', fontWeight: 500 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {installedApps.map((app, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '12px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {typeof app.icon === 'string' && app.icon.startsWith('http') ? (
                            <img 
                              src={app.icon} 
                              alt={app.name}
                              style={{ width: 20, height: 20, borderRadius: 4 }}
                              onError={(e) => { 
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span style={{ 
                              width: 20, 
                              height: 20, 
                              borderRadius: 4, 
                              background: '#F3F4F6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 600
                            }}>{typeof app.icon === 'string' ? app.icon : (app.name || 'A')[0]}</span>
                          )}
                          <span style={{ fontWeight: 500 }}>{app.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 0', textAlign: 'right' }}>
                        {app.link ? (
                          <a 
                            href={app.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '6px 14px',
                              border: '1px solid #E5E7EB',
                              borderRadius: 6,
                              background: '#fff',
                              fontSize: 12,
                              cursor: 'pointer',
                              color: '#374151',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              textDecoration: 'none'
                            }}>
                            Voir l&apos;application <span>→</span>
                          </a>
                        ) : (
                          <span style={{
                            padding: '6px 14px',
                            fontSize: 12,
                            color: '#9CA3AF'
                          }}>
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Suggested Shops */}
          <div style={{ ...cardStyle, marginTop: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ 
                width: 36, 
                height: 36, 
                borderRadius: '50%', 
                background: '#F0FDF4',
                border: '1px solid #DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>Boutiques suggérées</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Vous pourriez aussi aimer ces boutiques</div>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ textAlign: 'left', padding: '10px 0', color: '#6B7280', fontWeight: 500 }}>Boutique</th>
                  <th style={{ textAlign: 'center', padding: '10px 0', color: '#6B7280', fontWeight: 500 }}>Langue du site</th>
                  <th style={{ textAlign: 'left', padding: '10px 0', color: '#6B7280', fontWeight: 500 }}>Ventes hebdomadaires estimées</th>
                  <th style={{ textAlign: 'left', padding: '10px 0', color: '#6B7280', fontWeight: 500 }}>Revenu mensuel estimé</th>
                  <th style={{ textAlign: 'center', padding: '10px 0', color: '#6B7280', fontWeight: 500 }}>Publicités actives</th>
                  <th style={{ textAlign: 'center', padding: '10px 0', color: '#6B7280', fontWeight: 500, minWidth: '180px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {suggestedShopsData.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px 0', textAlign: 'center', color: '#6B7280' }}>
                      Aucune boutique suggérée disponible
                    </td>
                  </tr>
                ) : (
                  suggestedShopsData.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '16px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          {/* Shop thumbnail with multiple fallbacks */}
                          <div style={{ 
                            width: 80, 
                            height: 56, 
                            borderRadius: 8, 
                            overflow: 'hidden',
                            background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
                            border: '1px solid #E5E7EB',
                            position: 'relative',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {/* Fallback: first letter of shop name (behind image) */}
                            <span style={{
                              position: 'absolute',
                              fontSize: 20,
                              fontWeight: 700,
                              color: '#9CA3AF',
                              textTransform: 'uppercase',
                              zIndex: 0
                            }}>
                              {(s.name || s.url || 'S')[0]}
                            </span>
                            {/* Shop image on top */}
                            <img 
                              src={s.screenshot && s.screenshot !== 'no_image' && s.screenshot !== 'no image'
                                ? (s.screenshot.startsWith('http') 
                                    ? s.screenshot 
                                    : `https://app.copyfy.io/download/products/screenshots/${s.screenshot}`)
                                : `https://logo.clearbit.com/${s.url?.replace('www.', '')}`
                              }
                              alt={s.name || s.url} 
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: s.screenshot ? 'cover' : 'contain',
                                borderRadius: 0,
                                position: 'relative',
                                zIndex: 1,
                                background: '#F3F4F6'
                              }} 
                              onError={(e) => { 
                                const target = e.target as HTMLImageElement;
                                // Try clearbit if screenshot failed
                                if (!target.src.includes('clearbit.com')) {
                                  target.src = `https://logo.clearbit.com/${s.url?.replace('www.', '')}`;
                                  target.style.objectFit = 'contain';
                                  target.style.width = '40px';
                                  target.style.height = '40px';
                                  target.style.background = 'transparent';
                                } else if (!target.src.includes('google.com/s2')) {
                                  // Try Google favicon
                                  target.src = `https://www.google.com/s2/favicons?domain=${s.url?.replace('www.', '')}&sz=64`;
                                  target.style.width = '32px';
                                  target.style.height = '32px';
                                  target.style.background = 'transparent';
                                } else {
                                  // Hide image and show fallback letter
                                  target.style.display = 'none';
                                }
                              }} 
                            />
                          </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                              {/* Shop favicon/logo */}
                              <img 
                                src={`https://www.google.com/s2/favicons?domain=${s.url?.replace('www.', '')}&sz=32`}
                                alt=""
                                style={{ 
                                  width: 18, 
                                  height: 18, 
                                  borderRadius: 4,
                                  flexShrink: 0
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <span>{s.name || s.url?.split('.')[0] || 'Unknown'}</span>
                              <i className="ri-arrow-right-up-line" style={{ fontSize: 12, color: '#9ca3af' }}></i>
                            </div>
                            <a 
                              href={`https://${s.url?.startsWith('www.') ? s.url : 'www.' + s.url}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ 
                                fontSize: 12, 
                                color: '#6B7280', 
                                textDecoration: 'none', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 4,
                                marginLeft: 26
                              }}
                            >
                              {s.url?.startsWith('www.') ? s.url : 'www.' + s.url}
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                <polyline points="15 3 21 3 21 9"/>
                                <line x1="10" y1="14" x2="21" y2="3"/>
                              </svg>
                          </a>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 0', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          {(() => {
                            // Determine country code: try country, then locale, then currency-based fallback
                            let countryCode = 'xx';
                            
                            // 1. Try country field first
                            if (s.country && s.country.length === 2) {
                              countryCode = s.country.toLowerCase();
                            }
                            // 2. Try locale (e.g., "en_US" -> "us", "fr-FR" -> "fr")
                            else if (s.locale) {
                              const locale = s.locale;
                              if (locale.includes('_')) {
                                countryCode = locale.split('_')[1]?.toLowerCase() || 'xx';
                              } else if (locale.includes('-')) {
                                countryCode = locale.split('-')[1]?.toLowerCase() || 'xx';
                              } else if (locale.length === 2) {
                                countryCode = locale.toLowerCase();
                              }
                            }
                            // 3. Fallback to currency
                            else if (s.currency === 'USD') {
                              countryCode = 'us';
                            } else if (s.currency === 'EUR') {
                              countryCode = 'eu';
                            } else if (s.currency === 'GBP') {
                              countryCode = 'gb';
                            } else if (s.currency === 'CAD') {
                              countryCode = 'ca';
                            } else if (s.currency === 'AUD') {
                              countryCode = 'au';
                            }
                            
                            return (
                              <span 
                                className={`fi fi-${countryCode}`} 
                                style={{ 
                                  width: 24, 
                                  height: 18, 
                                  borderRadius: 3, 
                                  display: 'inline-block',
                                  backgroundSize: 'cover'
                                }}
                              ></span>
                            );
                          })()}
                        </div>
                    </td>
                    <td style={{ padding: '16px 0' }}>
                        <span style={{ fontWeight: 600, color: '#111827' }}>
                          {s.currency === 'USD' ? '$' : '€'} {formatNumber(Math.round(s.monthlyRevenue / 4))}
                        </span>
                        <span style={{ color: s.trend > 0 ? '#16A34A' : '#DC2626', marginLeft: 6, fontSize: 11, fontWeight: 600 }}>
                          <i className={s.trend > 0 ? 'ri-arrow-right-up-line' : 'ri-arrow-right-down-line'} style={{ fontSize: 10 }}></i>
                        </span>
                    </td>
                    <td style={{ padding: '16px 0' }}>
                        <span style={{ fontWeight: 600, color: '#111827' }}>
                          {s.currency === 'USD' ? '$' : '€'} {formatNumber(s.monthlyRevenue)}
                        </span>
                        <span style={{ color: s.trend > 0 ? '#16A34A' : '#DC2626', marginLeft: 6, fontSize: 11, fontWeight: 600 }}>
                          <i className={s.trend > 0 ? 'ri-arrow-right-up-line' : 'ri-arrow-right-down-line'} style={{ fontSize: 10 }}></i>
                        </span>
                    </td>
                    <td style={{ padding: '16px 0', textAlign: 'center' }}>
                        <span style={{ fontWeight: 500 }}>{s.activeAds || 0}</span>
                    </td>
                    <td style={{ padding: '16px 0', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          {trackedShopIds.has(s.id) && !analyzingShopIds.has(s.id) ? (
                            // Already tracked - Show "Voir l'analyse" button (BLUE)
                            <button
                              onClick={() => handleViewShopAnalysis(s.id)}
                              style={{ 
                                padding: '8px 16px', 
                                border: 'none', 
                                borderRadius: 6, 
                                background: '#3B82F6', 
                                fontSize: 13, 
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                color: '#fff',
                                fontWeight: 500,
                                minWidth: '175px',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                              Voir l'analyse
                            </button>
                          ) : analyzingShopIds.has(s.id) ? (
                            // Currently analyzing - Light yellow with refresh icon
                            <button
                              disabled
                              style={{ 
                                padding: '8px 16px', 
                                border: '1px solid #fde047', 
                                borderRadius: 6, 
                                background: '#fef9c3', 
                                fontSize: 13, 
                                cursor: 'not-allowed',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                color: '#854d0e',
                                fontWeight: 500,
                                minWidth: '175px',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                                <path d="M23 4v6h-6"></path>
                                <path d="M1 20v-6h6"></path>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                              </svg>
                              Analyse...
                            </button>
                          ) : (
                            // Not tracked - Show "Analyser" button (WHITE like other pages)
                            <button
                              onClick={() => handleAnalyzeShop(s.id, s.url?.startsWith('www.') ? s.url : 'www.' + (s.url || ''))}
                              style={{ 
                                padding: '8px 16px', 
                                border: '1px solid #E5E7EB', 
                                borderRadius: 6, 
                                background: '#fff', 
                                fontSize: 13, 
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                color: '#374151',
                                fontWeight: 500,
                                minWidth: '175px',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <img src="/img/icons/target-icon.svg" alt="" style={{ width: 14, height: 14 }} />
                              Analyser la boutique
                            </button>
                          )}
                        </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
        @media (max-width: 1024px) {
          div[style*="gridTemplateColumns: repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
          div[style*="gridTemplateColumns: 1.5fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
