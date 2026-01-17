"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import DashboardHeader from "@/components/DashboardHeader";
import PromotionalSlider from "@/components/PromotionalSlider";
import VideoModal from "@/components/VideoModal";
import ShopAnalyticsDrawer from "@/components/ShopAnalyticsDrawer";
import { useStats } from "@/contexts/StatsContext";

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
            {alert.type === 'success' && (
              <i className="ri-checkbox-circle-fill" style={{ fontSize: '18px', color: '#fff', flexShrink: 0 }}></i>
            )}
            {(alert.type === 'error' || alert.type === 'limit') && (
              <i className="ri-error-warning-fill" style={{ fontSize: '18px', color: '#fff', flexShrink: 0 }}></i>
            )}
            {alert.type === 'info' && (
              <i className="ri-information-fill" style={{ fontSize: '18px', color: '#212529', flexShrink: 0 }}></i>
            )}
            
            <span style={{ fontSize: '14px', color: alertStyles.color, flexShrink: 1 }}>
              {alert.message}
            </span>
            
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
                Voir l&apos;analyse
              </button>
            )}
            {(alert.type === 'error' || alert.type === 'limit') && (
              <a 
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
              </a>
            )}
            
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

interface ActionItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: {
    type: 'video' | 'link';
    label: string;
    icon: string;
    href?: string;
    onClick?: () => void;
  };
}

interface TopProduct {
  id: number;
  title: string;
  imageUrl: string | null;
  handle: string;
  price: number;
  estimatedMonthly: number;
  estimatedOrder: number;
  growthRate: number;
  shop: {
    id: number;
    url: string;
    name: string | null;
    currency: string | null;
  };
}

interface TopShop {
  id: number;
  url: string;
  name: string | null;
  screenshot: string | null;
  monthlyVisits: number;
  estimatedMonthly: number;
  currency: string;
  trafficGrowth: number;
  marketCountries?: { code: string; share: number }[];
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  CHF: '₣',
  JPY: '¥',
  CNY: '¥',
  HUF: 'Ft',
};

const ACTION_ITEMS_KEY = 'copyfy_action_items_completed';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { refreshStats } = useStats();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topShops, setTopShops] = useState<TopShop[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingShops, setLoadingShops] = useState(false);
  
  // Toast alerts state
  const [toastAlerts, setToastAlerts] = useState<ToastAlert[]>([]);
  
  // Analyzing and tracked shops state
  const [analyzingShopIds, setAnalyzingShopIds] = useState<Set<number>>(new Set());
  const [trackedShopIds, setTrackedShopIds] = useState<Set<number>>(new Set());
  
  // Analytics drawer state
  const [analyticsDrawerOpen, setAnalyticsDrawerOpen] = useState(false);
  const [analyticsShopId, setAnalyticsShopId] = useState<number | null>(null);
  const [analyticsShopUrl, setAnalyticsShopUrl] = useState<string | undefined>();
  const [analyticsShopName, setAnalyticsShopName] = useState<string | undefined>();
  
  // Fetch tracked shops on mount
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

  // Load completed actions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(ACTION_ITEMS_KEY);
    if (saved) {
      try {
        setCompletedActions(JSON.parse(saved));
      } catch {
        setCompletedActions([]);
      }
    }
  }, []);

  // Mark action as completed
  const markAsCompleted = (actionId: string) => {
    const newCompleted = [...completedActions, actionId];
    setCompletedActions(newCompleted);
    localStorage.setItem(ACTION_ITEMS_KEY, JSON.stringify(newCompleted));
  };

  // Action items list
  const actionItems: ActionItem[] = [
    {
      id: 'watch_demo',
      title: "Regarder la démo",
      description:
        "Faites un tour pour voir comment Copyfy va vous aider à réussir dans le E-commerce",
      completed: completedActions.includes('watch_demo'),
      action: {
        type: 'video',
        label: 'Regarder maintenant',
        icon: 'ri-video-line',
        onClick: () => {
          setIsVideoModalOpen(true);
          markAsCompleted('watch_demo');
        },
      },
    },
    {
      id: 'analyze_shop',
      title: "Trouvez votre produit gagnant et analysez votre première boutique",
      description:
        "Ajoutez une boutique à l'analyse de boutique pour voir les données et déterminer si elle est bonne à copier ou non.",
      completed: completedActions.includes('analyze_shop'),
      action: {
        type: 'link',
        label: 'Analyser une boutique',
        icon: 'ri-store-3-line',
        href: '/dashboard/analyze-shop',
      },
    },
    {
      id: 'create_shop',
      title: "Créez votre boutique avec l'IA de Copyfy",
      description:
        "Générez votre boutique Shopify avec l'IA en moins d'une minute.",
      completed: completedActions.includes('create_shop'),
      action: {
        type: 'link',
        label: 'Créer une boutique',
        icon: 'ri-magic-line',
        href: '/dashboard/ai-shop',
      },
    },
    {
      id: 'launch_ads',
      title: "Lancez vos publicités pour obtenir votre première vente",
      description:
        "Créez et lancez des publicités efficaces pour commencer à générer des ventes pour votre boutique.",
      completed: completedActions.includes('launch_ads'),
      action: {
        type: 'link',
        label: 'Lancez vos publicités',
        icon: 'ri-advertisement-line',
        href: '/dashboard/ads',
      },
    },
  ];

  // Calculate trial info from session
  const trialEndsAtStr = (session?.user as { trialEndsAt?: string | null })?.trialEndsAt;
  const trialEndsAt = trialEndsAtStr ? new Date(trialEndsAtStr) : null;
  const now = new Date();
  const trialDaysRemaining = trialEndsAt 
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const isInTrial = trialDaysRemaining > 0;
  const hasActivePlan = session?.user?.activePlan && session.user.activePlan.identifier !== 'trial';

  // Calculate completed actions
  const completedCount = actionItems.filter(item => item.completed).length;
  const totalCount = actionItems.length;
  const progressPercentage = (completedCount / totalCount) * 100;
  
  // Show Top Products/Shops when all actions are completed and user has active plan
  const showTopData = progressPercentage === 100 && hasActivePlan && !isInTrial;

  // Fetch top products and shops when showing top data
  useEffect(() => {
    if (showTopData) {
      // Fetch top products
      setLoadingProducts(true);
      fetch('/api/products?page=1&perPage=3&sortBy=top_score&sortOrder=desc')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setTopProducts(data.data.slice(0, 3));
          }
        })
        .catch(console.error)
        .finally(() => setLoadingProducts(false));

      // Fetch top shops
      setLoadingShops(true);
      fetch('/api/shops?page=1&perPage=3&sortBy=top_score&sortOrder=desc')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setTopShops(data.data.slice(0, 3));
          }
        })
        .catch(console.error)
        .finally(() => setLoadingShops(false));
    }
  }, [showTopData]);

  const getCurrencySymbol = (currency: string) => {
    return CURRENCY_SYMBOLS[currency] || currency + ' ';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(num));
  };

  // Toast helpers
  const addToast = (type: ToastAlert['type'], message: string, shopUrl?: string, shopId?: number) => {
    const id = Date.now().toString();
    setToastAlerts(prev => [...prev, { id, type, message, shopUrl, shopId }]);
    
    // Don't auto-dismiss limit alerts
    if (type !== 'limit') {
      setTimeout(() => {
        setToastAlerts(prev => prev.filter(a => a.id !== id));
      }, 5000);
    }
  };

  const dismissToast = (id: string) => {
    setToastAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleViewShop = (shopId: number, shopUrl?: string, shopName?: string) => {
    // Open drawer instead of navigating
    setAnalyticsShopId(shopId);
    setAnalyticsShopUrl(shopUrl);
    setAnalyticsShopName(shopName);
    setAnalyticsDrawerOpen(true);
  };

  // Track shop analysis - NO REDIRECT, just toast
  const handleAnalyzeStore = async (shopId: number, shopUrl: string, shopName?: string) => {
    // Add to analyzing set
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
    } catch (error) {
      console.error('Failed to track shop:', error);
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
        onViewShop={(shopId) => handleViewShop(shopId)}
      />

      <DashboardHeader
        title="Tableau de bord"
      />

      <div className="bg-weak-50 home-content-wrapper">
        {/* Video Modal */}
        <VideoModal 
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          videoId="acssdea7jb"
          title="Commencer avec Copyfy"
        />

        {showTopData ? (
          // COMPLETED STATE: Show Top Products and Top Shops
          <div className="w-max-width-xl mx-auto p-2 p-md-3 py-3">
            {/* Promotional Slider */}
            <div className="mb-4">
              <PromotionalSlider />
            </div>

            {/* Top Products Table */}
            <div className="border-gray p-2 p-md-3 rounded-15 mb-4 pb-0 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <img src="/img/discover.svg" alt="" style={{ width: '24px', height: '24px' }} />
                  <div className="ms-2">
                    <h2 className="fs-normal mb-0 fw-500">Top Products</h2>
                    <h6 className="fs-small fw-normal text-light-gray mb-0 d-none d-md-block">Meilleurs produits vendus</h6>
                  </div>
                </div>
                <Link href="/dashboard/products" className="btn btn-primary">
                  Voir tout
                </Link>
              </div>
              
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr className="border-0">
                      <th className="text-gray fw-500 border-0">Produit</th>
                      <th className="text-gray fw-500 border-0">Boutique</th>
                      <th className="text-gray fw-500 border-0">CA mensuel estimé</th>
                      <th className="text-gray fw-500 border-0">Prix</th>
                      <th className="text-gray fw-500 border-0">Ventes mensuelles</th>
                      <th className="text-gray fw-500 border-0 text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingProducts ? (
                      <tr><td colSpan={6} className="text-center py-4"><span className="spinner-border spinner-border-sm"></span></td></tr>
                    ) : topProducts.map((product, index) => (
                      <tr key={product.id}>
                        <td className="align-middle py-3 border-b-gray">
                          <div className="d-flex align-items-center">
                            <div className="position-relative" style={{ width: '60px', height: '60px' }}>
                              {index < 3 && (
                                <div className={`position-tag position-tag--${index + 1}`} style={{
                                  position: 'absolute',
                                  top: '-8px',
                                  left: '-8px',
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
                                  color: '#fff',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  zIndex: 1,
                                }}>
                                  {index + 1}
                                </div>
                              )}
                              <img 
                                src={product.imageUrl || '/img_not_found.png'} 
                                alt={product.title}
                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                                onError={(e) => { (e.target as HTMLImageElement).src = '/img_not_found.png'; }}
                              />
                            </div>
                            <div className="ms-3">
                              <p className="mb-0 fw-500 fs-small">{product.title?.substring(0, 30)}{product.title?.length > 30 ? '...' : ''}</p>
                              <a 
                                href={`https://href.li/?https://${product.shop.url}/products/${product.handle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="fs-small text-decoration-none text-dark-gray"
                              >
                                Voir le produit <i className="ri-arrow-right-up-line"></i>
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle py-3 border-b-gray">
                          <a 
                            href={`https://href.li/?https://${product.shop.url}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-decoration-none text-dark-gray d-flex align-items-center"
                          >
                            <div className="product-shop-img shadow-none" style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <img 
                                src={`https://www.google.com/s2/favicons?sz=64&domain=${product.shop.url}`}
                                alt=""
                                style={{ width: '20px', height: '20px' }}
                              />
                            </div>
                            <span className="ms-2 fs-small d-none d-xxl-block">{product.shop.url}<i className="ri-arrow-right-up-line"></i></span>
                          </a>
                        </td>
                        <td className="align-middle py-3 border-b-gray text-nowrap fw-600 text-center">
                          {formatNumber(product.estimatedMonthly)} {getCurrencySymbol(product.shop.currency || 'USD')}
                          {product.growthRate >= 0 ? <i className="ri-arrow-right-up-line text-success"></i> : <i className="ri-arrow-right-down-line text-danger"></i>}
                        </td>
                        <td className="align-middle py-3 border-b-gray fw-600 text-center">
                          {formatNumber(product.price)}{getCurrencySymbol(product.shop.currency || 'USD')}
                        </td>
                        <td className="align-middle py-3 border-b-gray fw-600 text-start">
                          {formatNumber(product.estimatedOrder)}
                        </td>
                        <td className="align-middle py-3 border-b-gray text-end">
                          {trackedShopIds.has(product.shop.id) && !analyzingShopIds.has(product.shop.id) ? (
                            // Already tracked - Show "Voir l'analyse" button (BLUE)
                            <button
                              onClick={() => handleViewShop(product.shop.id, product.shop.url, product.shop.name || undefined)}
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
                              }}
                            >
                              <i className="ri-line-chart-line" style={{ fontSize: 14 }}></i>
                              <span>Voir l&apos;analyse</span>
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
                              onClick={() => handleAnalyzeStore(product.shop.id, product.shop.url, product.shop.name || undefined)}
                              className="btn btn-secondary d-inline-flex align-items-center gap-2"
                              style={{ 
                                whiteSpace: 'nowrap', 
                                padding: '8px 16px',
                                fontSize: '13px',
                                borderRadius: '6px',
                              }}
                            >
                              <i className="ri-focus-3-line" style={{ fontSize: 14 }}></i>
                              <span>Suivre les données</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Shops Table */}
            <div className="border-gray p-2 p-md-3 rounded-15 mb-4 pb-0 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <img src="/img/discover.svg" alt="" style={{ width: '24px', height: '24px' }} />
                  <div className="ms-2">
                    <h2 className="fs-normal mb-0 fw-500">Top Boutiques</h2>
                    <h6 className="fs-small fw-normal text-light-gray mb-0 d-none d-md-block">Découvrez les meilleures boutiques identifiées par notre IA</h6>
                  </div>
                </div>
                <Link href="/dashboard/shops" className="btn btn-primary">
                  Voir tout
                </Link>
              </div>
              
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr className="border-0">
                      <th className="text-gray fw-500 border-0">Boutique</th>
                      <th className="text-gray fw-500 border-0">Trafic</th>
                      <th className="text-gray fw-500 border-0">CA mensuel estimé</th>
                      <th className="text-gray fw-500 border-0">Source trafic</th>
                      <th className="text-gray fw-500 border-0">Ventes mensuelles</th>
                      <th className="text-gray fw-500 border-0 text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingShops ? (
                      <tr><td colSpan={6} className="text-center py-4"><span className="spinner-border spinner-border-sm"></span></td></tr>
                    ) : topShops.map((shop, index) => (
                      <tr key={shop.id}>
                        <td className="align-middle py-3 border-b-gray">
                          <div className="d-flex align-items-center">
                            <div className="position-relative" style={{ width: '60px', height: '60px' }}>
                              {index < 3 && (
                                <div style={{
                                  position: 'absolute',
                                  top: '-8px',
                                  left: '-8px',
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  background: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
                                  color: '#fff',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  zIndex: 1,
                                }}>
                                  {index + 1}
                                </div>
                              )}
                              <img 
                                src={shop.screenshot ? `/download/products/screenshots/${shop.screenshot}` : `https://www.google.com/s2/favicons?sz=64&domain=${shop.url}`}
                                alt={shop.name || shop.url}
                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                                onError={(e) => { (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?sz=64&domain=${shop.url}`; }}
                              />
                            </div>
                            <div className="ms-3">
                              <p className="mb-0 fw-500 fs-small">
                                <a 
                                  href={`https://href.li/?https://${shop.url}/`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-decoration-none text-body"
                                >
                                  {shop.name || shop.url}
                                </a>
                              </p>
                              <a 
                                href={`https://href.li/?https://${shop.url}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="fs-small text-decoration-none text-dark-gray"
                              >
                                Voir le site <i className="ri-arrow-right-up-line"></i>
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle py-3 border-b-gray text-nowrap fw-600">
                          {formatNumber(shop.monthlyVisits)}
                          {shop.trafficGrowth >= 0 ? <i className="ri-arrow-right-up-line text-success"></i> : <i className="ri-arrow-right-down-line text-danger"></i>}
                        </td>
                        <td className="align-middle py-3 border-b-gray text-nowrap fw-600 text-center">
                          {getCurrencySymbol(shop.currency)}{formatNumber(shop.estimatedMonthly)}
                          {shop.trafficGrowth >= 0 ? <i className="ri-arrow-right-up-line text-success"></i> : <i className="ri-arrow-right-down-line text-danger"></i>}
                        </td>
                        <td className="align-middle py-3 border-b-gray text-center">
                          {shop.marketCountries && shop.marketCountries.length > 0 && (
                            <img 
                              src={`/img/flags/${shop.marketCountries[0].code.toLowerCase()}.svg`}
                              alt={shop.marketCountries[0].code}
                              style={{ width: '24px', height: '24px' }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          )}
                        </td>
                        <td className="align-middle py-3 border-b-gray fw-600 text-center">
                          {formatNumber(Math.round(shop.estimatedMonthly / 50))}
                          {shop.trafficGrowth >= 0 ? <i className="ri-arrow-right-up-line text-success"></i> : <i className="ri-arrow-right-down-line text-danger"></i>}
                        </td>
                        <td className="align-middle py-3 border-b-gray text-end">
                          {trackedShopIds.has(shop.id) && !analyzingShopIds.has(shop.id) ? (
                            // Already tracked - Show "Voir l'analyse" button (BLUE)
                            <button
                              onClick={() => handleViewShop(shop.id, shop.url, shop.name || undefined)}
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
                              }}
                            >
                              <i className="ri-line-chart-line" style={{ fontSize: 14 }}></i>
                              <span>Voir l&apos;analyse</span>
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
                              onClick={() => handleAnalyzeStore(shop.id, shop.url, shop.name || undefined)}
                              className="btn btn-secondary d-inline-flex align-items-center gap-2"
                              style={{ 
                                whiteSpace: 'nowrap', 
                                padding: '8px 16px',
                                fontSize: '13px',
                                borderRadius: '6px',
                              }}
                            >
                              <i className="ri-focus-3-line" style={{ fontSize: 14 }}></i>
                              <span>Suivre les données</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          // ONBOARDING STATE: Show action plan
          <>
            {/* Welcome Video Section */}
            <div 
              className="mx-auto pt-4 px-2 px-md-3" 
              style={{ maxWidth: '850px' }}
            >
              <div 
                className="course-wrapper thumb-video mx-auto mb-4 cursor-pointer" 
                style={{ maxWidth: '536px' }}
                onClick={() => setIsVideoModalOpen(true)}
              >
                <img 
                  src="https://embed-ssl.wistia.com/deliveries/332ca1772dbed0ea292133c4dfcfd4e18a52cd06.jpg?image_crop_resized=960x549" 
                  alt="Commencer avec Copyfy" 
                  className="courses-thumb w-100" 
                  style={{ borderRadius: '6px', width: '100%' }} 
                />
                <div className="px-3 py-2 position-absolute floating-details w-100" style={{ bottom: 0, borderRadius: '6px' }}>
                  <p className="fs-lg text-white mb-0 fw-500">Commencer avec Copyfy</p>
                </div>
              </div>
            </div>

            {/* Action Plan Section */}
            <div 
              className="mx-auto pb-4 px-2 px-md-3 pt-4" 
              style={{ maxWidth: '850px' }}
            >
              <div className="border-gray p-3 rounded-15 bg-white w-100 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <p className="fs-normal mb-0 fw-500">Ton plan d&apos;action vers la première vente</p>
                  <div>
                    <p className="text-end fs-small mb-1 fw-500 text-light-gray">
                      <span className="text-primary">{completedCount}</span> actions sur <span className="text-sub">{totalCount}</span> Terminé
                    </p>
                    <div className="progress mt-0" style={{ height: '4px', minWidth: '130px' }}>
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${progressPercentage}%` }}
                        aria-valuenow={progressPercentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      ></div>
                    </div>
                  </div>
                </div>

                <ul className="list-unstyled mb-0 d-flex flex-column">
                  {actionItems.map((item) => (
                    <li 
                      key={item.id} 
                      className="bg-weak-gray p-3 rounded-6 mb-2"
                    >
                      <div className="d-flex justify-content-between">
                        <div className="d-flex w-100">
                          {item.completed ? (
                            <div className="radio-style-div complete me-3 mt-2 d-flex align-items-center justify-content-center">
                              <i className="ri-check-line lh-1"></i>
                            </div>
                          ) : (
                            <div className="radio-style-div me-3 mt-2"></div>
                          )}
                          <div className="d-flex flex-column flex-md-row gap-2 justify-content-between w-100">
                            <div>
                              <p className={`mb-0 fw-500 fs-small ${item.completed ? 'text-muted' : ''}`}>
                                {item.title}
                              </p>
                              <p className={`mb-0 fs-small ${item.completed ? 'text-muted' : 'text-sub'}`}>
                                {item.description}
                              </p>
                            </div>
                            {!item.completed && item.action && (
                              <div>
                                {item.action.type === 'video' ? (
                                  <button 
                                    className="mb-0 small fw-500 btn-secondary btn"
                                    onClick={item.action.onClick}
                                  >
                                    <i className={item.action.icon}></i> {item.action.label}
                                  </button>
                                ) : (
                                  <Link
                                    href={item.action.href || '#'}
                                    onClick={() => markAsCompleted(item.id)}
                                    className="mb-0 small fw-500 btn-secondary btn text-decoration-none"
                                  >
                                    <i className={item.action.icon}></i> {item.action.label}
                                  </Link>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trial Notice - Only show if in trial and no active paid plan */}
              {isInTrial && !hasActivePlan && (
                <div 
                  className="mt-3 trial-notice-wrapper-home d-flex flex-column flex-md-row gap-3 justify-content-between align-items-center"
                >
                  <div className="text-white fw-500 justify-content-center d-flex align-items-center">
                    {trialDaysRemaining > 0 
                      ? `Votre essai gratuit se termine dans ${trialDaysRemaining} jour${trialDaysRemaining > 1 ? 's' : ''}`
                      : "Votre essai gratuit est terminé"
                    }
                  </div>
                  <div>
                    <Link href="/dashboard/plans" className="btn btn-primary btn-upgrade text-decoration-none">
                      Mettre à niveau
                    </Link>
                  </div>
                </div>
              )}

              {/* Show current plan for paid users */}
              {hasActivePlan && (
                <div className="p-4 mt-3" style={{ border: "1px solid #E1E4EA", borderRadius: "15px", background: "#fff" }}>
                  <h3 style={{ fontSize: "15px", marginBottom: "12px", fontWeight: 600 }}>Votre plan actuel</h3>
                  <div className="d-flex flex-column flex-md-row align-items-md-center gap-3">
                    <div style={{ background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)", color: "#fff", padding: "12px 24px", borderRadius: "8px", fontWeight: 500 }}>
                      {session?.user?.activePlan?.identifier?.includes("starter") ? "Starter" : session?.user?.activePlan?.identifier?.includes("basic") ? "Growth" : session?.user?.activePlan?.identifier?.includes("pro") ? "Pro" : session?.user?.activePlan?.title || "Plan actif"}
                    </div>
                    <div className="flex-grow-1">
                      <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "0" }}>Assurez-vous que vos informations de paiement sont à jour.</p>
                    </div>
                    <Link href="/dashboard/settings" className="btn btn-outline-secondary text-decoration-none">
                      Gérer l&apos;abonnement
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Promotional Slider */}
            <div 
              className="w-max-width-xl mx-auto pb-4 px-2 px-md-3"
            >
              <PromotionalSlider />
            </div>
          </>
        )}
      </div>

      {/* Shop Analytics Drawer */}
      <ShopAnalyticsDrawer
        isOpen={analyticsDrawerOpen}
        onClose={() => setAnalyticsDrawerOpen(false)}
        shopId={analyticsShopId}
        shopUrl={analyticsShopUrl}
        shopName={analyticsShopName}
      />

      {/* Spin animation for loading button */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
