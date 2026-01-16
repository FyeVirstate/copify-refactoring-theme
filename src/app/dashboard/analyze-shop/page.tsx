"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DashboardHeader from "@/components/DashboardHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTrackedShops, TrackedShop } from "@/lib/hooks/use-tracked-shops";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import MiniChart from "@/components/MiniChart";

// Skeleton row widths for variety
const SHOP_NAME_WIDTHS = [120, 140, 130, 110, 145, 125, 135, 115, 150, 128];
const SHOP_URL_WIDTHS = [90, 100, 85, 95, 88, 92, 98, 105, 87, 93];

// Skeleton component for loading - matches table structure
function TrackedShopsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {/* Shop Name with Screenshot */}
          <TableCell className="align-middle border-b-gray py-3">
            <div className="d-flex align-items-center gap-3">
              <div className="skeleton-shimmer" style={{ width: '140px', height: '85px', borderRadius: '8px', flexShrink: 0 }}></div>
              <div className="d-flex align-items-center gap-2">
                <div className="skeleton-shimmer" style={{ width: '24px', height: '24px', borderRadius: '4px' }}></div>
                <div>
                  <div className="skeleton-shimmer" style={{ width: `${SHOP_NAME_WIDTHS[i % 10]}px`, height: '14px', borderRadius: '4px', marginBottom: '6px' }}></div>
                  <div className="skeleton-shimmer" style={{ width: `${SHOP_URL_WIDTHS[i % 10]}px`, height: '12px', borderRadius: '4px' }}></div>
                </div>
              </div>
            </div>
          </TableCell>
          {/* Market Share */}
          <TableCell className="align-middle py-3 border-b-gray">
            <div className="d-flex flex-column gap-1">
              <div className="d-flex align-items-center gap-2">
                <div className="skeleton-shimmer" style={{ width: '18px', height: '13px', borderRadius: '2px' }}></div>
                <div className="skeleton-shimmer" style={{ width: '35px', height: '12px', borderRadius: '4px' }}></div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <div className="skeleton-shimmer" style={{ width: '18px', height: '13px', borderRadius: '2px' }}></div>
                <div className="skeleton-shimmer" style={{ width: '35px', height: '12px', borderRadius: '4px' }}></div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <div className="skeleton-shimmer" style={{ width: '18px', height: '13px', borderRadius: '2px' }}></div>
                <div className="skeleton-shimmer" style={{ width: '35px', height: '12px', borderRadius: '4px' }}></div>
              </div>
            </div>
          </TableCell>
          {/* Daily Revenue */}
          <TableCell className="align-middle py-3 border-b-gray text-center">
            <div className="d-flex align-items-center justify-content-center gap-1">
              <div className="skeleton-shimmer" style={{ width: '70px', height: '14px', borderRadius: '4px' }}></div>
            </div>
          </TableCell>
          {/* Monthly Revenue */}
          <TableCell className="align-middle py-3 border-b-gray text-center">
            <div className="d-flex align-items-center justify-content-center gap-1">
              <div className="skeleton-shimmer" style={{ width: '90px', height: '14px', borderRadius: '4px' }}></div>
            </div>
          </TableCell>
          {/* Active Ads with Chart */}
          <TableCell className="align-middle py-3 border-b-gray text-center">
            <div className="skeleton-shimmer mx-auto" style={{ width: '50px', height: '14px', borderRadius: '4px', marginBottom: '8px' }}></div>
            <div className="skeleton-shimmer mx-auto" style={{ width: '120px', height: '40px', borderRadius: '4px' }}></div>
          </TableCell>
          {/* Actions */}
          <TableCell className="align-middle py-3 border-b-gray text-center" style={{ width: '60px' }}>
            <div className="skeleton-shimmer mx-auto" style={{ width: '20px', height: '20px', borderRadius: '4px' }}></div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// Alert component for different message types
function AlertBox({ type, message, onClose }: { 
  type: 'info' | 'error' | 'warning' | 'subscription'; 
  message: string;
  onClose?: () => void;
}) {
  const styles = {
    info: {
      bg: 'bg-warning-light',
      border: 'border-warning',
      icon: 'ri-information-line',
      iconColor: 'text-warning',
    },
    warning: {
      bg: 'bg-warning-light',
      border: 'border-warning',
      icon: 'ri-alert-line',
      iconColor: 'text-warning',
    },
    error: {
      bg: 'bg-danger-light',
      border: 'border-danger',
      icon: 'ri-error-warning-line',
      iconColor: 'text-danger',
    },
    subscription: {
      bg: 'bg-info-light',
      border: 'border-info',
      icon: 'ri-vip-crown-line',
      iconColor: 'text-info',
    },
  };

  const style = styles[type];

  return (
    <div className={`alert-box ${style.bg} ${style.border} d-flex align-items-center justify-content-between px-3 py-2 mb-3`}
      style={{ borderRadius: '8px', borderLeft: '4px solid' }}
    >
      <div className="d-flex align-items-center gap-2">
        <i className={`${style.icon} ${style.iconColor} fs-5`}></i>
        <span className="fs-small fw-500">{message}</span>
      </div>
      {onClose && (
        <button type="button" className="btn-close btn-sm" onClick={onClose}></button>
      )}
      {type === 'subscription' && (
        <Link href="/dashboard/plans" className="btn btn-primary btn-sm ms-3">
          Débloquer l&apos;accès complet
        </Link>
      )}
    </div>
  );
}


function AnalyzeShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shopUrl, setShopUrl] = useState(searchParams.get('url') || "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'info' | 'error' | 'warning' | 'subscription'; message: string } | null>(null);
  const [sortBy, setSortBy] = useState<string>("recent");

  // Mouse tooltip state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  // Share mode state
  const [isShareMode, setIsShareMode] = useState(false);
  const [selectedShopIds, setSelectedShopIds] = useState<number[]>([]);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState(false);

  // TODO: Get from user session/context - for now simulate trial status
  const [isOnTrial, setIsOnTrial] = useState(true);

  // Use TanStack Query hook for tracked shops with infinite scroll
  // Use 50 perPage to load more shops at once (matching user's limit)
  const { 
    trackedShops, 
    limits, 
    isLoading, 
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    addShop,
    removeShop,
    isAddingShop,
  } = useTrackedShops(50);

  // Check user subscription status
  useEffect(() => {
    if (limits && limits.max <= 3) {
      setIsOnTrial(true);
    } else if (limits && limits.max > 3) {
      setIsOnTrial(false);
    }
  }, [limits]);

  // Infinite scroll - listen to page scroll
  useEffect(() => {
    const handleScroll = () => {
      // Get the scrollable container (section-two or window)
      const scrollContainer = document.querySelector('.section-two');
      if (scrollContainer) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer as HTMLElement;
        // Load more when user scrolls near the bottom (300px threshold)
        if (scrollHeight - scrollTop - clientHeight < 300 && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }

      // Also check window scroll for fallback
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      if (scrollHeight - scrollTop - clientHeight < 300 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    const scrollContainer = document.querySelector('.section-two');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    window.addEventListener('scroll', handleScroll);

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Validate Shopify URL
  const isValidShopifyUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return cleanUrl.length > 3 && cleanUrl.includes('.');
  };

  // Handle analyze button click
  const handleAnalyze = async () => {
    if (!shopUrl.trim()) {
      setAlertMessage({ type: 'warning', message: "Veuillez entrer l'URL d'une boutique Shopify" });
      return;
    }

    if (!isValidShopifyUrl(shopUrl)) {
      setAlertMessage({ type: 'error', message: "Veuillez entrer une URL valide (ex: www.boutique.com)" });
      return;
    }

    if (limits && limits.remaining === 0) {
      setAlertMessage({ type: 'subscription', message: "Vous avez atteint la limite maximale de boutique à suivre avec votre abonnement." });
      return;
    }

    // Check if already tracking
    const cleanUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '');
    const alreadyTracking = trackedShops.some(t => 
      t.shop?.url?.replace(/^www\./, '').toLowerCase() === cleanUrl.toLowerCase()
    );
    if (alreadyTracking) {
      setAlertMessage({ type: 'error', message: "Vous suivez déjà cette boutique." });
      return;
    }

    setIsAnalyzing(true);
    setAlertMessage(null);

    try {
      const result = await addShop(shopUrl.trim());
      setShopUrl("");
      if (result?.data?.shopId) {
        router.push(`/dashboard/track/${result.data.shopId}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'analyse";
      if (message.includes("not found")) {
        setAlertMessage({ type: 'error', message: "Cette boutique n'est pas dans notre base de données. Essayez une autre boutique Shopify." });
      } else if (message.includes("Already tracking")) {
        setAlertMessage({ type: 'error', message: "Vous suivez déjà cette boutique." });
      } else {
        setAlertMessage({ type: 'error', message });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle remove shop - with permission check
  const handleRemoveShop = async (trackId: number) => {
    if (isOnTrial) {
      setAlertMessage({ 
        type: 'subscription', 
        message: "Pour effectuer cette action, vous devez prendre un plan" 
      });
      return;
    }

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette boutique du suivi ?")) {
      return;
    }

    try {
      await removeShop(trackId);
      setAlertMessage({ type: 'info', message: "Boutique supprimée du suivi avec succès." });
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (err) {
      setAlertMessage({ type: 'error', message: err instanceof Error ? err.message : "Erreur lors de la suppression" });
    }
  };

  // Mouse tooltip handlers - use clientX/Y for fixed positioning
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({
      x: e.clientX + 10,
      y: e.clientY + 20
    });
  };

  // Handle refresh shop
  const handleRefreshShop = async (shopId: number) => {
    setAlertMessage({ type: 'info', message: "Actualisation des données en cours..." });
    setTimeout(() => {
      setAlertMessage({ type: 'info', message: "Données actualisées avec succès." });
      setTimeout(() => setAlertMessage(null), 2000);
    }, 1500);
  };

  // Handle key press (Enter to submit)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAnalyzing) {
      handleAnalyze();
    }
  };

  // Share mode handlers
  const handleShareButtonClick = () => {
    if (isShareMode) {
      setIsShareMode(false);
      setSelectedShopIds([]);
    } else {
      setIsShareMode(true);
      setSelectedShopIds([]);
      setShowShareSuccess(false);
    }
  };

  const handleShopSelect = (shopId: number) => {
    setSelectedShopIds(prev => 
      prev.includes(shopId) 
        ? prev.filter(id => id !== shopId)
        : [...prev, shopId]
    );
  };

  const handleShareShops = async () => {
    if (selectedShopIds.length === 0) return;
    
    setIsSharing(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop_ids: selectedShopIds })
      });
      
      const data = await response.json();
      
      if (response.ok && data.share_url) {
        setShareUrl(data.share_url);
        setShowShareSuccess(true);
        setIsShareMode(false);
        setSelectedShopIds([]);
      } else {
        setAlertMessage({ type: 'error', message: data.error || 'Erreur lors du partage' });
      }
    } catch (error) {
      setAlertMessage({ type: 'error', message: 'Erreur lors du partage des boutiques' });
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      const btn = document.getElementById('copyLinkBtn');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✓';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 1500);
      }
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  // Format currency
  const formatCurrency = (amount: number | null | undefined, currency: string | null = "$") => {
    if (amount === null || amount === undefined) return "-";
    const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
    return `${new Intl.NumberFormat("fr-FR").format(Math.round(amount))} ${currencySymbol}`;
  };

  // Sort tracked shops
  const sortedShops = [...trackedShops].sort((a, b) => {
    switch (sortBy) {
      case 'revenue_desc':
        return (b.shop?.monthlyRevenue || 0) - (a.shop?.monthlyRevenue || 0);
      case 'revenue_asc':
        return (a.shop?.monthlyRevenue || 0) - (b.shop?.monthlyRevenue || 0);
      case 'recent':
      default:
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    }
  });

  // Calculate progress percentage
  const progressPercentage = limits 
    ? Math.min((limits.used / limits.max) * 100, 100) 
    : 0;

  // Table header component (reusable)
  const TableHeaderRow = () => (
    <TableRow className="border-0 bg-weak-gray border-bottom">
      {isShareMode && (
        <TableHead scope="col" className="text-sub fs-small fw-500 border-0 align-middle p-0" style={{ width: '40px' }}>
          &nbsp;
        </TableHead>
      )}
      <TableHead scope="col" className="text-sub fs-small fw-500 border-0 align-middle">
        Nom de la boutique
      </TableHead>
      <TableHead scope="col" className="text-sub fs-small fw-500 border-0 text-start align-middle">
        Part de marché
      </TableHead>
      <TableHead scope="col" className="text-sub fs-small fw-500 border-0 text-center align-middle">
        Ventes quotidiennes estimées
      </TableHead>
      <TableHead scope="col" className="text-sub fs-small fw-500 border-0 text-center align-middle">
        Revenu mensuel estimé
      </TableHead>
      <TableHead scope="col" className="text-sub fs-small fw-500 border-0 text-center align-middle">
        Annonces actives <span className="text-light-gray fs-xs d-block">(Évolution du dernier mois)</span>
      </TableHead>
      <TableHead scope="col" className="text-sub fs-small fw-500 border-0 text-center align-middle">
      </TableHead>
    </TableRow>
  );

  return (
    <>
      <DashboardHeader
        title="Analyse de boutique"
        subtitle="Obtenez une analyse détaillée de n'importe quelle boutique Shopify"
        showTutorialButton={true}
        onTutorialClick={() => console.log("Tutoriel clicked")}
        showShareButton={true}
        onShareClick={handleShareButtonClick}
        icon="ri-store-3-line"
        iconType="icon"
        showStats={false}
      />

      <div className="bg-white home-content-wrapper">
        <div className="p-3 w-max-width-xl mx-auto">
          
          {/* Alert Messages */}
          {alertMessage && (
            <AlertBox 
              type={alertMessage.type} 
              message={alertMessage.message}
              onClose={alertMessage.type !== 'subscription' ? () => setAlertMessage(null) : undefined}
            />
          )}

          {/* Limit Warning as Info Box */}
          {limits && limits.remaining === 0 && !alertMessage && (
            <AlertBox 
              type="subscription" 
              message="Vous avez atteint la limite maximale de boutique à suivre avec votre abonnement."
            />
          )}

          {/* Input Section */}
          <div className="mb-4 pb-1 pt-2">
            <div className="d-flex gap-3 align-items-center flex-wrap">
              {/* Search Input */}
              <div className="position-relative flex-grow-1" style={{ minWidth: '200px' }}>
                <i
                  className="ri-global-line position-absolute"
                  style={{
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '18px',
                    color: '#99a0ae',
                    zIndex: 1,
                    pointerEvents: 'none'
                  }}
                ></i>
                <Input
                  type="text"
                  className="form-control design-2 header-search-input"
                  placeholder="Entrer le lien de la boutique Shopify"
                  value={shopUrl}
                  onChange={(e) => setShopUrl(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isAnalyzing || Boolean(limits && limits.remaining === 0)}
                />
              </div>

              {/* Analyser Button + Progress */}
              <div className="d-flex gap-3 align-items-center">
                <Button
                  onClick={handleAnalyze}
                  className="btn btn-primary apply-filters-btn"
                  style={{ whiteSpace: 'nowrap', minWidth: '100px', flexShrink: 0, height: '48px' }}
                  disabled={isAnalyzing || isAddingShop || !shopUrl.trim() || Boolean(limits && limits.remaining === 0)}
                >
                  {isAnalyzing || isAddingShop ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Analyse...
                    </>
                  ) : (
                    "Analyser"
                  )}
                </Button>

                {/* Boutiques suivies - Progress Circle */}
                <div className="progress-circle d-flex gap-2 flex-row align-items-center" style={{ flexShrink: 0 }}>
                  <div className="progress-circle-wrapper">
                    <svg width="32px" height="32px">
                      <circle 
                        className="progress-bar-circle circle-2"
                        cx="16" 
                        cy="16" 
                        r="12"
                        fill="none"
                        stroke={limits && limits.remaining === 0 ? "#ef4444" : "#0c6cfb"}
                        strokeWidth="3"
                        strokeDasharray="75"
                        strokeDashoffset={75 - (75 * progressPercentage / 100)}
                        strokeLinecap="round"
                        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                      />
                    </svg>
                  </div>
                  <div className="progress-details">
                    <div 
                      className="progress-text fw-600" 
                      style={{ 
                        fontSize: '15px', 
                        lineHeight: 1.2,
                        color: limits && limits.remaining === 0 ? '#ef4444' : undefined 
                      }}
                    >
                      {limits ? `${limits.used}/${limits.max}` : '0/0'}
                    </div>
                    <div className="progress-label text-muted" style={{ fontSize: '11px' }}>Boutiques suivies</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sort Section */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="fs-normal fw-600 mb-0">Boutiques suivies</h2>
            <div className="d-flex align-items-center gap-2">
              <div className="position-relative">
                <select
                  className="form-select fs-small pe-4"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ 
                    width: 'auto', 
                    minWidth: '180px',
                    paddingRight: '32px',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '12px'
                  }}
                >
                  <option value="recent">Récemment ajouté</option>
                  <option value="revenue_desc">Revenus décroissants</option>
                  <option value="revenue_asc">Revenus croissants</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="table-view mt-2" style={{ overflow: 'hidden' }}>
            {/* Desktop Table View - Always show header with skeleton or data */}
            <div 
              ref={tableWrapperRef}
              className="border position-relative d-none d-lg-block" 
              style={{ borderRadius: '6px', overflow: 'hidden' }}
            >
              {/* Mouse-following tooltip - fixed position */}
              {showTooltip && !isLoading && (
                <div
                  className="mouse-tooltip"
                  style={{
                    position: 'fixed',
                    left: mousePosition.x,
                    top: mousePosition.y,
                    pointerEvents: 'none',
                    background: 'rgba(0,0,0,0.85)',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    zIndex: 9999,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                >
                  Voir l&apos;analyse
                </div>
              )}
              
              <Table id="shopListTable" className="table mb-0 table-hover" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  {isShareMode && <col style={{ width: '40px' }} />}
                  <col style={{ width: isShareMode ? '33%' : '35%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '5%' }} />
                </colgroup>
                <TableHeader>
                  <TableHeaderRow />
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Show skeleton while loading
                    <TrackedShopsSkeleton rows={8} />
                  ) : sortedShops.length === 0 ? (
                    // Empty state
                    <TableRow>
                      <TableCell colSpan={isShareMode ? 7 : 6} className="text-center py-5">
                        <i className="ri-store-2-line fs-1 text-muted mb-3 d-block"></i>
                        <h5>Aucune boutique suivie</h5>
                        <p className="text-muted mb-0">
                          Entrez l&apos;URL d&apos;une boutique Shopify ci-dessus pour commencer à la suivre.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Render tracked shops
                    <>
                      {sortedShops.map((tracked) => (
                        <TableRow
                          key={tracked.id}
                          className={`position-relative shop-row clickable ${isShareMode && selectedShopIds.includes(tracked.shopId) ? 'selected-row' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('.action-dropdown') || (e.target as HTMLElement).closest('a') || (e.target as HTMLElement).closest('[data-radix-popper-content-wrapper]')) return;
                            if (isShareMode) {
                              handleShopSelect(tracked.shopId);
                              return;
                            }
                            router.push(`/dashboard/track/${tracked.shopId}`);
                          }}
                          onMouseEnter={() => !isShareMode && setShowTooltip(true)}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={() => setShowTooltip(false)}
                        >
                          {/* Share checkbox column */}
                          {isShareMode && (
                            <TableCell className="align-middle border-b-gray py-3 text-center p-0" style={{ width: '40px' }}>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selectedShopIds.includes(tracked.shopId)}
                                onChange={() => handleShopSelect(tracked.shopId)}
                                onClick={(e) => e.stopPropagation()}
                                style={{ margin: 0, cursor: 'pointer' }}
                              />
                            </TableCell>
                          )}
                          {/* Shop Name with Screenshot + Logo + Icon */}
                          <TableCell scope="row" className="align-middle border-b-gray py-3">
                            <div className="d-flex align-items-center gap-3">
                              {/* Site Preview Screenshot */}
                              <div 
                                className="shop-screenshot position-relative" 
                                style={{ 
                                  width: '140px', 
                                  height: '85px', 
                                  borderRadius: '8px', 
                                  overflow: 'hidden', 
                                  flexShrink: 0, 
                                  border: '1px solid #e5e7eb',
                                  backgroundColor: '#f9fafb'
                                }}
                              >
                                <img
                                  src={tracked.shop?.screenshot 
                                    ? `https://app.copyfy.io/download/products/screenshots/${tracked.shop.screenshot}`
                                    : `https://image.thum.io/get/width/280/crop/170/${tracked.shop?.url}`
                                  }
                                  alt={`${tracked.shop?.name || "Shop"} preview`}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (!target.src.includes('thum.io') && !target.src.includes('img_not_found')) {
                                      target.src = `https://image.thum.io/get/width/280/crop/170/${tracked.shop?.url}`;
                                    } else if (!target.src.includes('img_not_found')) {
                                      target.src = "/img_not_found.png";
                                    }
                                  }}
                                />
                              </div>
                              {/* Shop Info with favicon logo */}
                              <div className="d-flex align-items-center gap-2">
                                {/* Favicon/Logo */}
                                <img 
                                  src={`https://www.google.com/s2/favicons?domain=${tracked.shop?.url}&sz=32`}
                                  alt="Logo"
                                  style={{ width: '24px', height: '24px', borderRadius: '4px', flexShrink: 0 }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                                <div>
                                  <h4 className="fs-small mb-1 fw-600 text-dark d-flex align-items-center gap-1">
                                    {tracked.shop?.name || tracked.shop?.url}
                                    <i className="ri-arrow-right-up-line" style={{ fontSize: '12px', color: '#9ca3af' }}></i>
                                  </h4>
                                  <a 
                                    href={`https://${tracked.shop?.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary fs-xs text-decoration-none"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {tracked.shop?.url}
                                  </a>
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Market Share - Simple flags with gray % */}
                          <TableCell className="align-middle py-3 border-b-gray">
                            <div className="d-flex flex-column gap-1" style={{ fontSize: '12px' }}>
                              {tracked.shop?.countries && tracked.shop.countries.length > 0 ? (
                                <>
                                  {tracked.shop.countries.slice(0, 3).map((country, idx) => (
                                    <div key={idx} className="d-flex align-items-center gap-2">
                                      <img 
                                        src={`/flags/${country.code.toLowerCase()}.svg`}
                                        alt={country.code}
                                        style={{ width: '18px', height: '13px' }}
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                        }}
                                      />
                                      <span style={{ color: '#6b7280' }}>({country.value}%)</span>
                                    </div>
                                  ))}
                                  {tracked.shop.countries.length > 3 && (
                                    <span style={{ color: '#6b7280' }}>Others ({tracked.shop.countries.slice(3).reduce((sum, c) => sum + c.value, 0)}%)</span>
                                  )}
                                </>
                              ) : (
                                <span style={{ color: '#6b7280' }}>-</span>
                              )}
                            </div>
                          </TableCell>

                          {/* Daily Revenue with DIAGONAL Arrow */}
                          <TableCell className="align-middle py-3 border-b-gray text-center">
                            <div className="d-flex align-items-center justify-content-center gap-1">
                              <span className="fw-500">
                                {formatCurrency(tracked.shop?.dailyRevenue, tracked.shop?.currency)}
                              </span>
                              {tracked.shop?.growthRate !== null && tracked.shop?.growthRate !== undefined && tracked.shop.growthRate !== 0 && (
                                <i 
                                  className={`ri-arrow-right-${tracked.shop.growthRate > 0 ? 'up' : 'down'}-line`}
                                  style={{ color: tracked.shop.growthRate > 0 ? '#22c55e' : '#ef4444', fontSize: '14px' }}
                                ></i>
                              )}
                            </div>
                          </TableCell>

                          {/* Monthly Revenue with DIAGONAL Arrow */}
                          <TableCell className="align-middle py-3 border-b-gray text-center">
                            <div className="d-flex align-items-center justify-content-center gap-1">
                              <span className="fw-500">
                                {formatCurrency(tracked.shop?.monthlyRevenue, tracked.shop?.currency)}
                              </span>
                              {tracked.shop?.growthRate !== null && tracked.shop?.growthRate !== undefined && tracked.shop.growthRate !== 0 && (
                                <i 
                                  className={`ri-arrow-right-${tracked.shop.growthRate > 0 ? 'up' : 'down'}-line`}
                                  style={{ color: tracked.shop.growthRate > 0 ? '#22c55e' : '#ef4444', fontSize: '14px' }}
                                ></i>
                              )}
                            </div>
                          </TableCell>

                          {/* Active Ads with Evolution Chart */}
                          <TableCell className="align-middle py-3 border-b-gray text-center" style={{ overflow: 'hidden' }}>
                            <div>
                              <p className="mb-1 d-flex align-items-center justify-content-center gap-1">
                                <span 
                                  style={{ 
                                    width: '8px', 
                                    height: '8px', 
                                    borderRadius: '50%', 
                                    display: 'inline-block',
                                    backgroundColor: (tracked.shop?.adsChange ?? 0) >= 0 ? '#22c55e' : '#ef4444',
                                    flexShrink: 0
                                  }}
                                ></span>
                                <span className="fs-small fw-600">{tracked.shop?.activeAds || 0}</span>
                                {tracked.shop?.adsChange !== null && tracked.shop?.adsChange !== undefined && tracked.shop.adsChange !== 0 && (
                                  <span 
                                    className={`fs-xs ${(tracked.shop.adsChange ?? 0) >= 0 ? 'text-success' : 'text-danger'}`}
                                  >
                                    {' '}({tracked.shop.adsChange > 0 ? '+' : ''}{tracked.shop.adsChange})
                                  </span>
                                )}
                              </p>
                            </div>
                            {/* Mini Chart */}
                            <div 
                              style={{ maxWidth: '120px', margin: '0 auto', overflow: 'hidden' }}
                              onMouseEnter={() => setShowTooltip(false)}
                            >
                              {tracked.shop?.adsHistoryData && tracked.shop.adsHistoryData.length > 1 ? (
                                <MiniChart 
                                  data={tracked.shop.adsHistoryData}
                                  dates={tracked.shop.adsHistoryDates}
                                  trend={(tracked.shop.adsChange ?? 0) >= 0 ? 'up' : 'down'}
                                  width={120}
                                  height={40}
                                  label="ads actives"
                                />
                              ) : (
                                <div style={{ width: '120px', height: '40px' }}></div>
                              )}
                            </div>
                          </TableCell>

                          {/* Actions Dropdown */}
                          <TableCell 
                            className="align-middle py-3 border-b-gray text-center action-dropdown" 
                            style={{ width: '60px' }}
                            onMouseEnter={() => setShowTooltip(false)}
                          >
                            <DropdownMenu onOpenChange={(open) => { if (open) setShowTooltip(false); }}>
                              <DropdownMenuTrigger asChild onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-gray-100"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6b7280" width="20" height="20">
                                    <circle cx="12" cy="5" r="2"></circle>
                                    <circle cx="12" cy="12" r="2"></circle>
                                    <circle cx="12" cy="19" r="2"></circle>
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => handleRefreshShop(tracked.shopId)}>
                                  <i className="ri-refresh-line me-2"></i>
                                  Actualiser
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/track/${tracked.shopId}`)}>
                                  <i className="ri-eye-line me-2"></i>
                                  Voir l&apos;analyse
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <a href={`https://${tracked.shop?.url}`} target="_blank" rel="noopener noreferrer">
                                    <i className="ri-external-link-line me-2"></i>
                                    Visiter le site
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {isOnTrial ? (
                                  <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="dropdown-item-disabled" style={{ cursor: 'not-allowed' }}>
                                          <DropdownMenuItem 
                                            disabled
                                            className="text-danger opacity-50"
                                            style={{ pointerEvents: 'none' }}
                                          >
                                            <i className="ri-delete-bin-line me-2"></i>
                                            Supprimer
                                          </DropdownMenuItem>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="left" className="bg-dark text-white">
                                        <p className="m-0">Pour effectuer cette action, vous devez prendre un plan</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => handleRemoveShop(tracked.id)}
                                    className="text-danger"
                                  >
                                    <i className="ri-delete-bin-line me-2"></i>
                                    Supprimer
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {/* Loading more indicator inside table */}
                      {isFetchingNextPage && (
                        <TrackedShopsSkeleton rows={3} />
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
              
              {/* End of list indicator */}
              {!hasNextPage && sortedShops.length > 0 && !isLoading && (
                <div className="text-center py-3 border-top">
                  <p className="text-muted mb-0 fs-small">
                    <i className="ri-check-line me-1"></i>
                    Toutes les boutiques ont été chargées ({sortedShops.length})
                  </p>
                </div>
              )}
            </div>

            {/* Mobile Card View */}
            <div className="d-lg-none">
              {isLoading ? (
                // Mobile skeleton
                <div className="d-flex flex-column gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="border rounded-3 p-3" style={{ backgroundColor: '#fff' }}>
                      <div className="d-flex gap-3 mb-3">
                        <div className="skeleton-shimmer" style={{ width: '100px', height: '65px', borderRadius: '8px', flexShrink: 0 }}></div>
                        <div className="flex-grow-1">
                          <div className="skeleton-shimmer" style={{ width: '80%', height: '14px', borderRadius: '4px', marginBottom: '8px' }}></div>
                          <div className="skeleton-shimmer" style={{ width: '60%', height: '12px', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        <div className="skeleton-shimmer" style={{ width: '60px', height: '28px', borderRadius: '4px' }}></div>
                        <div className="skeleton-shimmer" style={{ width: '70px', height: '28px', borderRadius: '4px' }}></div>
                        <div className="skeleton-shimmer" style={{ width: '80px', height: '28px', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedShops.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ri-store-2-line fs-1 text-muted mb-3 d-block"></i>
                  <h5>Aucune boutique suivie</h5>
                  <p className="text-muted">
                    Entrez l&apos;URL d&apos;une boutique Shopify ci-dessus pour commencer à la suivre.
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {sortedShops.map((tracked) => (
                    <div 
                      key={tracked.id}
                      className={`shop-card border rounded-3 p-3 ${isShareMode && selectedShopIds.includes(tracked.shopId) ? 'selected-card' : ''}`}
                      style={{ backgroundColor: '#fff', cursor: 'pointer' }}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('.action-dropdown') || (e.target as HTMLElement).closest('a')) return;
                        if (isShareMode) {
                          handleShopSelect(tracked.shopId);
                          return;
                        }
                        router.push(`/dashboard/track/${tracked.shopId}`);
                      }}
                    >
                      {/* Header: Screenshot + Shop Info */}
                      <div className="d-flex gap-3 mb-3">
                        {isShareMode && (
                          <div className="d-flex align-items-center">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedShopIds.includes(tracked.shopId)}
                              onChange={() => handleShopSelect(tracked.shopId)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ margin: 0, cursor: 'pointer', width: '20px', height: '20px' }}
                            />
                          </div>
                        )}
                        <div 
                          style={{ 
                            width: '100px', 
                            height: '65px', 
                            borderRadius: '8px', 
                            overflow: 'hidden', 
                            flexShrink: 0, 
                            border: '1px solid #e5e7eb',
                            backgroundColor: '#f9fafb'
                          }}
                        >
                          <img
                            src={tracked.shop?.screenshot 
                              ? `https://app.copyfy.io/download/products/screenshots/${tracked.shop.screenshot}`
                              : `https://image.thum.io/get/width/200/crop/130/${tracked.shop?.url}`
                            }
                            alt={`${tracked.shop?.name || "Shop"} preview`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (!target.src.includes('img_not_found')) {
                                target.src = "/img_not_found.png";
                              }
                            }}
                          />
                        </div>
                        <div className="flex-grow-1 d-flex flex-column justify-content-center">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <img 
                              src={`https://www.google.com/s2/favicons?domain=${tracked.shop?.url}&sz=32`}
                              alt="Logo"
                              style={{ width: '20px', height: '20px', borderRadius: '4px' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <h4 className="fs-small mb-0 fw-600 text-dark text-truncate" style={{ maxWidth: '160px' }}>
                              {tracked.shop?.name || tracked.shop?.url}
                            </h4>
                          </div>
                          <a 
                            href={`https://${tracked.shop?.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary fs-xs text-decoration-none text-truncate d-block"
                            style={{ maxWidth: '180px' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {tracked.shop?.url}
                          </a>
                        </div>
                        <div className="action-dropdown">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6b7280" width="20" height="20">
                                  <circle cx="12" cy="5" r="2"></circle>
                                  <circle cx="12" cy="12" r="2"></circle>
                                  <circle cx="12" cy="19" r="2"></circle>
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => handleRefreshShop(tracked.shopId)}>
                                <i className="ri-refresh-line me-2"></i>
                                Actualiser
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/track/${tracked.shopId}`)}>
                                <i className="ri-eye-line me-2"></i>
                                Voir l&apos;analyse
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={`https://${tracked.shop?.url}`} target="_blank" rel="noopener noreferrer">
                                  <i className="ri-external-link-line me-2"></i>
                                  Visiter le site
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleRemoveShop(tracked.id)}
                                className="text-danger"
                                disabled={isOnTrial}
                              >
                                <i className="ri-delete-bin-line me-2"></i>
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="d-flex flex-wrap gap-2" style={{ fontSize: '12px' }}>
                        {tracked.shop?.countries && tracked.shop.countries.length > 0 && (
                          <div className="d-flex align-items-center gap-1 bg-light px-2 py-1 rounded">
                            {tracked.shop.countries.slice(0, 2).map((country, idx) => (
                              <div key={idx} className="d-flex align-items-center gap-1">
                                <img 
                                  src={`/flags/${country.code.toLowerCase()}.svg`}
                                  alt={country.code}
                                  style={{ width: '14px', height: '10px' }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                                <span style={{ color: '#6b7280' }}>({country.value}%)</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="d-flex align-items-center gap-1 bg-light px-2 py-1 rounded">
                          <span className="fw-500">
                            {formatCurrency(tracked.shop?.dailyRevenue, tracked.shop?.currency)}
                          </span>
                          {tracked.shop?.growthRate !== null && tracked.shop?.growthRate !== undefined && tracked.shop.growthRate !== 0 && (
                            <i 
                              className={`ri-arrow-right-${tracked.shop.growthRate > 0 ? 'up' : 'down'}-line`}
                              style={{ color: tracked.shop.growthRate > 0 ? '#22c55e' : '#ef4444', fontSize: '12px' }}
                            ></i>
                          )}
                        </div>

                        <div className="d-flex align-items-center gap-1 bg-light px-2 py-1 rounded">
                          <span className="fw-500">
                            {formatCurrency(tracked.shop?.monthlyRevenue, tracked.shop?.currency)}
                          </span>
                          {tracked.shop?.growthRate !== null && tracked.shop?.growthRate !== undefined && tracked.shop.growthRate !== 0 && (
                            <i 
                              className={`ri-arrow-right-${tracked.shop.growthRate > 0 ? 'up' : 'down'}-line`}
                              style={{ color: tracked.shop.growthRate > 0 ? '#22c55e' : '#ef4444', fontSize: '12px' }}
                            ></i>
                          )}
                        </div>

                        <div className="d-flex flex-column bg-light px-2 py-1 rounded">
                          <div className="d-flex align-items-center gap-1">
                            <span 
                              style={{ 
                                width: '6px', 
                                height: '6px', 
                                borderRadius: '50%', 
                                display: 'inline-block',
                                backgroundColor: (tracked.shop?.adsChange ?? 0) >= 0 ? '#22c55e' : '#ef4444'
                              }}
                            ></span>
                            <span className="fw-600">{tracked.shop?.activeAds || 0}</span>
                            {tracked.shop?.adsChange !== null && tracked.shop?.adsChange !== undefined && tracked.shop.adsChange !== 0 && (
                              <span 
                                style={{ 
                                  fontSize: '10px',
                                  fontWeight: 500,
                                  color: tracked.shop.adsChange > 0 ? '#22c55e' : '#ef4444'
                                }}
                              >
                                ({tracked.shop.adsChange > 0 ? '+' : ''}{tracked.shop.adsChange})
                              </span>
                            )}
                          </div>
                          {tracked.shop?.adsHistoryData && tracked.shop.adsHistoryData.length > 1 && (
                            <MiniChart 
                              data={tracked.shop.adsHistoryData}
                              dates={tracked.shop.adsHistoryDates}
                              trend={(tracked.shop.adsChange ?? 0) >= 0 ? 'up' : 'down'}
                              width={80}
                              height={30}
                              label="ads actives"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Mobile loading more */}
                  {isFetchingNextPage && (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Mobile end of list */}
                  {!hasNextPage && sortedShops.length > 0 && (
                    <div className="text-center py-3">
                      <p className="text-muted mb-0 fs-small">
                        <i className="ri-check-line me-1"></i>
                        Toutes les boutiques ({sortedShops.length})
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Mode Toast */}
      {isShareMode && (
        <div 
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1f2937',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}
        >
          <span className="fw-500">
            Créer une sélection de <span className="text-primary">{selectedShopIds.length}</span>
          </span>
          <Button
            onClick={handleShareShops}
            disabled={selectedShopIds.length === 0 || isSharing}
            className="btn btn-outline-light"
            style={{ 
              padding: '6px 16px', 
              fontSize: '13px',
              opacity: selectedShopIds.length === 0 ? 0.5 : 1 
            }}
          >
            {isSharing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Partage...
              </>
            ) : (
              'Partager'
            )}
          </Button>
          <Button
            onClick={() => { setIsShareMode(false); setSelectedShopIds([]); }}
            className="btn btn-outline-light"
            style={{ padding: '6px 16px', fontSize: '13px' }}
          >
            Annuler
          </Button>
        </div>
      )}

      {/* Share Success Toast */}
      {showShareSuccess && shareUrl && (
        <div 
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1f2937',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}
        >
          <i className="ri-link" style={{ fontSize: '18px' }}></i>
          <span className="fw-500">Lien de partage</span>
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="form-control"
            style={{ 
              width: '250px', 
              background: 'rgba(255,255,255,0.1)', 
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              fontSize: '13px',
              padding: '6px 12px'
            }}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button
            id="copyLinkBtn"
            onClick={handleCopyShareLink}
            className="btn btn-outline-light"
            style={{ padding: '6px 16px', fontSize: '13px' }}
          >
            Copier
          </Button>
          <button
            onClick={() => setShowShareSuccess(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '4px',
              marginLeft: '4px'
            }}
          >
            <i className="ri-close-line" style={{ fontSize: '18px' }}></i>
          </button>
        </div>
      )}

      <style jsx global>{`
        /* Prevent overflow issues in this page */
        .home-content-wrapper {
          overflow: hidden;
        }
        
        /* Recharts tooltip styling - contained within page */
        .recharts-tooltip-wrapper {
          z-index: 9999 !important;
          pointer-events: none !important;
        }
        .recharts-wrapper {
          overflow: hidden !important;
        }
        
        /* Table overflow control */
        #shopListTable {
          overflow: hidden;
        }
        
        .bg-warning-light {
          background-color: #fef3c7 !important;
        }
        .border-warning {
          border-color: #f59e0b !important;
        }
        .bg-danger-light {
          background-color: #fee2e2 !important;
        }
        .border-danger {
          border-color: #ef4444 !important;
        }
        .bg-info-light {
          background-color: #dbeafe !important;
        }
        .border-info {
          border-color: #3b82f6 !important;
        }
        .text-warning {
          color: #f59e0b !important;
        }
        .text-info {
          color: #3b82f6 !important;
        }
        .shop-row:hover {
          background-color: #f9fafb;
        }
        .shop-row.selected-row {
          background-color: #eff6ff !important;
        }
        .shop-row.selected-row:hover {
          background-color: #dbeafe !important;
        }
        
        /* Mobile Card Styles */
        .shop-card {
          transition: box-shadow 0.2s ease;
        }
        .shop-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .shop-card:active {
          background-color: #f9fafb !important;
        }
        .shop-card.selected-card {
          background-color: #eff6ff !important;
          border-color: #3b82f6 !important;
        }
        
        /* Mobile Input Adjustments */
        @media (max-width: 991px) {
          .header-search-input {
            padding-left: 44px !important;
          }
        }
        
        @media (max-width: 576px) {
          .apply-filters-btn {
            min-width: 90px !important;
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
          .progress-details .progress-label {
            display: none;
          }
        }
      `}</style>
    </>
  );
}

// Wrap with Suspense for useSearchParams
export default function AnalyzeShopPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-500" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    }>
      <AnalyzeShopContent />
    </Suspense>
  );
}
