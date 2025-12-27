"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
interface UserStats {
  plan: {
    identifier: string;
    title: string;
    isOnTrial: boolean;
    isExpired: boolean;
    trialDaysRemaining: number;
    isPro: boolean;
    isBasic: boolean;
    isUnlimited: boolean;
  };
  trackedShops: {
    used: number;
    limit: number;
    isUnlimited: boolean;
  };
  productExports: {
    used: number;
    limit: number;
    remaining: number;
    isUnlimited: boolean;
  };
  storeGeneration: {
    used: number;
    limit: number;
    remaining: number;
    isUnlimited: boolean;
  };
}
interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  showTutorialButton?: boolean;
  onTutorialClick?: () => void;
  showShareButton?: boolean;
  onShareClick?: () => void;
  icon?: string; // Icon path or RemixIcon class
  iconType?: 'image' | 'icon'; // 'image' for SVG path, 'icon' for RemixIcon class
  showStats?: boolean; // Show all progress circles (only on main dashboard)
  showLimitedStats?: boolean; // Show only trial days + shop analyses (for product/shop/ads pages)
  showSearch?: boolean; // Show search bar in the middle (for shops page)
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode; // Custom content for right side (e.g., custom stats)
}
// Calculate SVG circle progress
function calculateProgress(used: number, limit: number): { 
  dasharray: string; 
  dashoffset: number; 
  text: string;
  isLimitReached: boolean;
  color: string;
} {
  const circumference = 2 * Math.PI * 12; // radius = 12
  const progress = limit > 0 ? Math.min(used / limit, 1) : 0;
  const dashoffset = circumference * (1 - progress);
  const isLimitReached = limit > 0 && used >= limit;
  return {
    dasharray: `${circumference}`,
    dashoffset,
    text: `${used}/${limit}`,
    isLimitReached,
    color: isLimitReached ? '#ef4444' : '#0c6cfb', // Red when limit reached, blue otherwise
  };
}
export default function DashboardHeader({
  title,
  subtitle,
  showTutorialButton = false,
  onTutorialClick,
  showShareButton = false,
  onShareClick,
  icon = "/img/navbar-icons/home-icon.svg",
  iconType = 'image',
  showStats = true,
  showLimitedStats = false,
  showSearch = false,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Parcourir les mots-clés, marques, produits, catégories...",
  children,
}: DashboardHeaderProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  // Fetch stats if either showStats or showLimitedStats is true
  const shouldFetchStats = showStats || showLimitedStats;
  useEffect(() => {
    if (shouldFetchStats) {
      fetchUserStats();
    }
  }, [shouldFetchStats]);
  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    } finally {
      setLoading(false);
    }
  };
  // Calculate progress for all stats
  const shopProgress = stats ? calculateProgress(stats.trackedShops.used, stats.trackedShops.limit) : null;
  const exportProgress = stats ? calculateProgress(stats.productExports.used, stats.productExports.limit) : null;
  const storeProgress = stats ? calculateProgress(stats.storeGeneration.used, stats.storeGeneration.limit) : null;
  return (
    <header 
      className="dashboard-header bg-white"
    >
      <div className="d-flex justify-content-between align-items-center flex-nowrap gap-2 gap-md-4">
        {/* Left side - Title */}
        <div className="dashboard-title d-flex align-items-center flex-shrink-1">
          <div className="dashboard-title-img me-2">
            {iconType === 'image' ? (
              <img src={icon} alt="Icon" />
            ) : (
              <i className={`${icon} text-white`}></i>
            )}
          </div>
          <div className="flex-shrink-1 min-w-0">
            <p className="dashboard-title-main mb-0">{title}</p>
            {subtitle && (
              <p className="dashboard-title-sub text-sm mb-0">{subtitle}</p>
            )}
          </div>
        </div>
        {/* Middle - Search bar (for shops page) */}
        {showSearch && (
          <div className="flex-grow-1 mx-4 d-none d-lg-block" style={{ maxWidth: '900px', flex: '1' }}>
            <div className="position-relative">
              <i 
                className="ri-search-line position-absolute" 
                style={{ 
                  left: '16px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  fontSize: '18px',
                  color: '#99a0ae',
                  zIndex: 10,
                  pointerEvents: 'none'
                }} 
              ></i>
              <Input
                type="text"
                className="form-control design-2 header-search-input"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              />
            </div>
          </div>
        )}
        {/* Right side - Actions */}
        <div className="flex items-center gap-2 gap-md-3 flex-shrink-0">
          {/* Stats - Show usage for all users */}
          {showStats && !loading && stats && (
          <div className="d-none d-md-flex gap-3 gap-xl-4 align-items-center">
            {/* Plan Status Indicator - Show trial days or expired status */}
            {(stats.plan.isOnTrial || stats.plan.isExpired) && (
              <div 
                className="d-flex gap-2 align-items-center"
                style={{ 
                  padding: '6px 12px',
                  borderRadius: '20px',
                  backgroundColor: stats.plan.isExpired ? '#fef2f2' : '#fef3c7',
                  border: `1px solid ${stats.plan.isExpired ? '#fecaca' : '#fde68a'}`,
                }}
              >
                <div 
                  style={{ 
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: stats.plan.isExpired ? '#fee2e2' : '#fef9c3',
                    border: `2px solid ${stats.plan.isExpired ? '#ef4444' : '#f59e0b'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '12px',
                    color: stats.plan.isExpired ? '#ef4444' : '#d97706',
                  }}
                >
                  {stats.plan.isExpired ? (
                    <i className="ri-close-line" style={{ fontSize: '16px' }}></i>
                  ) : (
                    stats.plan.trialDaysRemaining
                  )}
                </div>
                <div className="d-flex flex-column" style={{ lineHeight: 1.2 }}>
                  <span 
                    style={{ 
                      fontSize: '12px', 
                      fontWeight: 600,
                      color: stats.plan.isExpired ? '#ef4444' : '#d97706',
                    }}
                  >
                    {stats.plan.isExpired ? 'Expired' : `${stats.plan.trialDaysRemaining}J`}
                  </span>
                  <span style={{ fontSize: '10px', color: stats.plan.isExpired ? '#f87171' : '#fbbf24' }}>
                    {stats.plan.isExpired ? 'Trial Period' : "d'essai"}
                  </span>
                </div>
              </div>
            )}
            {/* Boutiques suivies - Progress Circle */}
            <div 
              className="progress-circle d-flex gap-2 flex-column flex-md-row" 
              data-progress={stats.trackedShops.used} 
              data-total={stats.trackedShops.limit}
            >
              <div className="progress-circle-wrapper">
                <svg width="32px" height="32px">
                  <circle className="progress-background circle-2" cx="16" cy="16" r="12"></circle>
                  <circle 
                    className="progress-bar-circle circle-2" 
                    cx="16" 
                    cy="16" 
                    r="12" 
                    stroke={shopProgress?.color || '#0c6cfb'} 
                    strokeDasharray={shopProgress?.dasharray} 
                    strokeDashoffset={shopProgress?.dashoffset}
                    style={{
                      transform: 'rotate(-90deg)',
                      transformOrigin: 'center',
                    }}
                  ></circle>
                </svg>
              </div>
              <div className="progress-details">
                <div className="progress-text" style={{ color: shopProgress?.isLimitReached ? '#ef4444' : undefined }}>{shopProgress?.text}</div>
                <div className="progress-label">Boutiques suivies</div>
              </div>
            </div>
            {/* Produits exportés */}
            {stats.productExports.isUnlimited ? (
              <div 
                className="progress-circle-unli d-flex gap-2 flex-column flex-md-row"
              >
                <div className="progress-circle-wrapper">
                  <i className="ri-infinity-fill"></i>
                </div>
                <div className="progress-details">
                  <div className="progress-text">∞</div>
                  <div className="progress-label">Produits exportés</div>
                </div>
              </div>
            ) : (
              <div 
                className="progress-circle d-flex gap-2 flex-column flex-md-row"
                data-progress={stats.productExports.used}
                data-total={stats.productExports.limit}
              >
                <div className="progress-circle-wrapper">
                  <svg width="32px" height="32px">
                    <circle className="progress-background circle-2" cx="16" cy="16" r="12"></circle>
                    <circle 
                      className="progress-bar-circle circle-2" 
                      cx="16" 
                      cy="16" 
                      r="12" 
                      stroke={exportProgress?.color || '#0c6cfb'}
                      strokeDasharray={exportProgress?.dasharray}
                      strokeDashoffset={exportProgress?.dashoffset}
                      style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center',
                      }}
                    ></circle>
                  </svg>
                </div>
                <div className="progress-details">
                  <div className="progress-text" style={{ color: exportProgress?.isLimitReached ? '#ef4444' : undefined }}>{exportProgress?.text}</div>
                  <div className="progress-label">Produits exportés</div>
                </div>
              </div>
            )}
            {/* Génération de boutique */}
            {stats.storeGeneration.isUnlimited ? (
              <div 
                className="progress-circle-unli d-flex gap-2 flex-column flex-md-row"
              >
                <div className="progress-circle-wrapper">
                  <i className="ri-infinity-fill"></i>
                </div>
                <div className="progress-details">
                  <div className="progress-text">∞</div>
                  <div className="progress-label">Génération de boutique</div>
                </div>
              </div>
            ) : (
              <div 
                className="progress-circle d-flex gap-2 flex-column flex-md-row"
                data-progress={stats.storeGeneration.used}
                data-total={stats.storeGeneration.limit}
              >
                <div className="progress-circle-wrapper">
                  <svg width="32px" height="32px">
                    <circle className="progress-background circle-2" cx="16" cy="16" r="12"></circle>
                    <circle 
                      className="progress-bar-circle circle-2" 
                      cx="16" 
                      cy="16" 
                      r="12" 
                      stroke={storeProgress?.color || '#0c6cfb'}
                      strokeDasharray={storeProgress?.dasharray}
                      strokeDashoffset={storeProgress?.dashoffset}
                      style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center',
                      }}
                    ></circle>
                  </svg>
                </div>
                <div className="progress-details">
                  <div className="progress-text" style={{ color: storeProgress?.isLimitReached ? '#ef4444' : undefined }}>{storeProgress?.text}</div>
                  <div className="progress-label">Génération de boutique</div>
                </div>
              </div>
            )}
          </div>
          )}
          {/* Limited Stats - Only show trial days + shop analyses (for products/shops/ads pages) */}
          {showLimitedStats && !loading && stats && (
          <div className="d-none d-md-flex gap-3 gap-xl-4 align-items-center">
            {/* Plan Status Indicator - Show trial days or expired status */}
            {(stats.plan.isOnTrial || stats.plan.isExpired) && (
              <div 
                className="d-flex gap-2 align-items-center"
                style={{ 
                  padding: '6px 12px',
                  borderRadius: '20px',
                  backgroundColor: stats.plan.isExpired ? '#fef2f2' : '#fef3c7',
                  border: `1px solid ${stats.plan.isExpired ? '#fecaca' : '#fde68a'}`,
                }}
              >
                <div 
                  style={{ 
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: stats.plan.isExpired ? '#fee2e2' : '#fef9c3',
                    border: `2px solid ${stats.plan.isExpired ? '#ef4444' : '#f59e0b'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '12px',
                    color: stats.plan.isExpired ? '#ef4444' : '#d97706',
                  }}
                >
                  {stats.plan.isExpired ? (
                    <i className="ri-close-line" style={{ fontSize: '16px' }}></i>
                  ) : (
                    stats.plan.trialDaysRemaining
                  )}
                </div>
                <div className="d-flex flex-column" style={{ lineHeight: 1.2 }}>
                  <span 
                    style={{ 
                      fontSize: '12px', 
                      fontWeight: 600,
                      color: stats.plan.isExpired ? '#ef4444' : '#d97706',
                    }}
                  >
                    {stats.plan.isExpired ? 'Expiré' : `${stats.plan.trialDaysRemaining}J`}
                  </span>
                  <span style={{ fontSize: '10px', color: stats.plan.isExpired ? '#f87171' : '#fbbf24' }}>
                    {stats.plan.isExpired ? "Période d'essai" : "d'essai"}
                  </span>
                </div>
              </div>
            )}
            {/* Boutiques analysées - Progress Circle */}
            <div 
              className="progress-circle d-flex gap-2 flex-column flex-md-row" 
              data-progress={stats.trackedShops.used} 
              data-total={stats.trackedShops.limit}
            >
              <div className="progress-circle-wrapper">
                <svg width="32px" height="32px">
                  <circle className="progress-background circle-2" cx="16" cy="16" r="12"></circle>
                  <circle 
                    className="progress-bar-circle circle-2" 
                    cx="16" 
                    cy="16" 
                    r="12" 
                    stroke={shopProgress?.color || '#0c6cfb'} 
                    strokeDasharray={shopProgress?.dasharray} 
                    strokeDashoffset={shopProgress?.dashoffset}
                    style={{
                      transform: 'rotate(-90deg)',
                      transformOrigin: 'center',
                    }}
                  ></circle>
                </svg>
              </div>
              <div className="progress-details">
                <div className="progress-text" style={{ color: shopProgress?.isLimitReached ? '#ef4444' : undefined }}>{shopProgress?.text}</div>
                <div className="progress-label">Analyses de boutique</div>
              </div>
            </div>
          </div>
          )}
          {/* Loading state for stats */}
          {(showStats || showLimitedStats) && loading && (
            <div className="d-none d-md-flex gap-3 gap-xl-4">
              <div className="progress-circle d-flex gap-2 flex-column flex-md-row" style={{ opacity: 0.5 }}>
                <div className="progress-circle-wrapper">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
                <div className="progress-details">
                  <div className="progress-text text-muted">...</div>
                  <div className="progress-label">Chargement</div>
                </div>
              </div>
            </div>
          )}
          {/* Custom Children (e.g., saved ads button) */}
          {children && (
            <div className="d-flex flex-shrink-0">
              {children}
            </div>
          )}
          {/* Tutorial Button (for specific pages) - shown last on right */}
          {showTutorialButton && onTutorialClick && (
            <div className="d-flex align-items-center justify-content-start justify-content-xxl-end">
              <button 
                className="btn btn-secondary w-icon" 
                onClick={onTutorialClick}
              >
                <i className="ri-play-circle-line btn-icon-sm" style={{ fontSize: '16px', color: '#99a0ae' }}></i>
                <span className="text-gray">Tutoriel</span>
              </button>
            </div>
          )}
          {/* Share Button (for specific pages) */}
          {showShareButton && onShareClick && (
            <div className="d-flex align-items-center justify-content-start justify-content-xxl-end">
              <button 
                className="btn btn-primary w-icon" 
                onClick={onShareClick}
              >
                <i className="ri-share-line btn-icon-sm" style={{ fontSize: '16px' }}></i>
                <span>Partager</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
