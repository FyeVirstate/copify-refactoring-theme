"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
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
import { useTrack } from "@/lib/hooks/use-track";
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
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`alert-box ${style.bg} ${style.border} d-flex align-items-center justify-content-between px-3 py-2 mb-3`}
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
    </motion.div>
  );
}


export default function AnalyzeShopPage() {
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

  // TODO: Get from user session/context - for now simulate trial status
  // In production, this would come from: auth session, user context, or API
  const [isOnTrial, setIsOnTrial] = useState(true); // Default to trial for testing

  const { 
    trackedShops, 
    limits, 
    isLoading, 
    fetchTrackedShops, 
    addShop,
    removeShop 
  } = useTrack();

  // Check user subscription status
  useEffect(() => {
    // TODO: Replace with actual user subscription check
    // Example: const user = await getSession(); setIsOnTrial(user?.plan === 'trial');
    // For now, check if user has limits that suggest trial (e.g., max=3)
    if (limits && limits.max <= 3) {
      setIsOnTrial(true);
    } else if (limits && limits.max > 3) {
      setIsOnTrial(false);
    }
  }, [limits]);

  // Fetch tracked shops on mount
  useEffect(() => {
    fetchTrackedShops();
  }, [fetchTrackedShops]);

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
    // Check if user has permission to delete (not on trial)
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

  // Mouse tooltip handlers
  const handleMouseMove = (e: React.MouseEvent) => {
    if (tableWrapperRef.current) {
      const rect = tableWrapperRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left - 10,
        y: e.clientY - rect.top + 30
      });
    }
  };

  // Handle refresh shop
  const handleRefreshShop = async (shopId: number) => {
    setAlertMessage({ type: 'info', message: "Actualisation des données en cours..." });
    // TODO: Implement actual refresh logic
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

  return (
    <>
      <DashboardHeader
        title="Analyse de boutique"
        subtitle="Obtenez une analyse détaillée de n'importe quelle boutique Shopify"
        showTutorialButton={true}
        onTutorialClick={() => console.log("Tutoriel clicked")}
        showShareButton={true}
        onShareClick={() => console.log("Partager clicked")}
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

          {/* Input Section - 3 columns: Search | Analyser | Boutiques suivies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-4 pb-1 pt-2"
          >
            <div className="d-flex gap-3 align-items-center flex-wrap flex-lg-nowrap">
              {/* Search Input */}
              <div className="position-relative" style={{ flex: '1 1 auto', minWidth: '300px' }}>
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

              {/* Analyser Button */}
              <Button
                onClick={handleAnalyze}
                className="btn btn-primary apply-filters-btn"
                style={{ whiteSpace: 'nowrap', minWidth: '120px', flexShrink: 0, height: '48px' }}
                disabled={isAnalyzing || !shopUrl.trim() || Boolean(limits && limits.remaining === 0)}
              >
                {isAnalyzing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Analyse...
                  </>
                ) : (
                  "Analyser"
                )}
              </Button>

              {/* Boutiques suivies - Progress Circle - Laravel style */}
              <div 
                className="progress-circle d-flex gap-2 flex-row align-items-center" 
                style={{ flexShrink: 0 }}
              >
                <div className="progress-circle-wrapper">
                  <svg width="32px" height="32px">
                    {/* Progress circle with CSS-based animation like Laravel */}
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
                  <div className="progress-text fw-600" style={{ fontSize: '15px', lineHeight: 1.2 }}>
                    {limits ? `${limits.used}/${limits.max}` : '0/0'}
                  </div>
                  <div className="progress-label text-muted" style={{ fontSize: '11px' }}>Boutiques suivies</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sort Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="d-flex justify-content-between align-items-center mb-3"
          >
            <h2 className="fs-normal fw-600 mb-0">Boutiques suivies</h2>
            <div className="d-flex align-items-center gap-2">
              <select
                className="form-select fs-small"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ width: 'auto', minWidth: '180px' }}
              >
                <option value="recent">Récemment ajouté</option>
                <option value="revenue_desc">Revenus décroissants</option>
                <option value="revenue_asc">Revenus croissants</option>
              </select>
            </div>
          </motion.div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="table-view mt-2"
          >
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="mt-2 text-muted">Chargement des boutiques...</p>
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
              <div 
                ref={tableWrapperRef}
                className="border position-relative" 
                style={{ borderRadius: '6px', overflow: 'hidden' }}
              >
                {/* Mouse-following tooltip */}
                {showTooltip && (
                  <div
                    className="mouse-tooltip"
                    style={{
                      position: 'absolute',
                      left: mousePosition.x,
                      top: mousePosition.y,
                      pointerEvents: 'none',
                      background: 'rgba(0,0,0,0.8)',
                      color: '#fff',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      whiteSpace: 'nowrap',
                      zIndex: 100,
                    }}
                  >
                    Voir l&apos;analyse
                  </div>
                )}
                <Table id="shopListTable" className="table mb-0 table-hover" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '35%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '5%' }} />
                  </colgroup>
                  <TableHeader>
                    <TableRow className="border-0 bg-weak-gray border-bottom">
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
                  </TableHeader>
                  <TableBody>
                    {sortedShops.map((tracked) => (
                      <TableRow
                        key={tracked.id}
                        className="position-relative shop-row clickable"
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('.action-dropdown') || (e.target as HTMLElement).closest('a') || (e.target as HTMLElement).closest('[data-radix-popper-content-wrapper]')) return;
                          router.push(`/dashboard/track/${tracked.shopId}`);
                        }}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setShowTooltip(false)}
                      >
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

                        {/* Active Ads with Evolution - Laravel style */}
                        <TableCell className="align-middle py-3 border-b-gray text-center">
                          <div className="d-flex align-items-center justify-content-center gap-1">
                            {/* Colored dot indicator */}
                            <span 
                              style={{ 
                                width: '8px', 
                                height: '8px', 
                                borderRadius: '50%', 
                                display: 'inline-block',
                                backgroundColor: (tracked.shop?.growthRate ?? 0) >= 0 ? '#22c55e' : '#ef4444',
                                flexShrink: 0
                              }}
                            ></span>
                            {/* Number in bold black */}
                            <span className="fw-600" style={{ color: '#1f2937' }}>
                              {tracked.shop?.activeAds || 0}
                            </span>
                            {/* Percentage in smaller colored text */}
                            {tracked.shop?.growthRate !== null && tracked.shop?.growthRate !== undefined && tracked.shop.growthRate !== 0 && (
                              <span 
                                style={{ 
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  color: tracked.shop.growthRate > 0 ? '#22c55e' : '#ef4444'
                                }}
                              >
                                ({tracked.shop.growthRate > 0 ? '+' : ''}{Math.round(tracked.shop.growthRate)}%)
                              </span>
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
                  </TableBody>
                </Table>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <style jsx global>{`
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
      `}</style>
    </>
  );
}
