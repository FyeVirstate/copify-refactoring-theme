"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

interface UserStats {
  plan: {
    identifier: string;
    title: string;
    isOnTrial: boolean;
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
  showStats?: boolean; // Show progress circles (only on main dashboard)
  showSearch?: boolean; // Show search bar in the middle (for shops page)
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode; // Custom content for right side (e.g., custom stats)
}

// Calculate SVG circle progress
function calculateProgress(used: number, limit: number): { dasharray: string; dashoffset: number; text: string } {
  const circumference = 2 * Math.PI * 12; // radius = 12
  const progress = limit > 0 ? Math.min(used / limit, 1) : 0;
  const dashoffset = circumference * (1 - progress);
  
  return {
    dasharray: `${circumference}`,
    dashoffset,
    text: `${used}/${limit}`,
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
  showSearch = false,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Parcourir les mots-clés, marques, produits, catégories...",
  children,
}: DashboardHeaderProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (showStats) {
      fetchUserStats();
    }
  }, [showStats]);

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

  // Calculate shop progress
  const shopProgress = stats ? calculateProgress(stats.trackedShops.used, stats.trackedShops.limit) : null;

  // Determine if user is on trial (hide stats for trial users based on Laravel logic)
  const isOnTrial = stats?.plan?.isOnTrial ?? false;

  return (
    <motion.header 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
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
          {/* Custom Children (e.g., saved ads button) - shown first */}
          {children && (
            <div className="d-flex flex-shrink-0">
              {children}
            </div>
          )}
          
          {/* Tutorial Button (for specific pages) */}
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
          
          {/* Stats - Only show if user is NOT on trial and has an active plan */}
          {showStats && !loading && stats && !isOnTrial && (
          <div className="d-none d-md-flex gap-3 gap-xl-4">
            {/* Boutiques suivies - Progress Circle */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
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
                    stroke="#0c6cfb" 
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
                <div className="progress-text">{shopProgress?.text}</div>
                <div className="progress-label">Boutiques suivies</div>
              </div>
            </motion.div>

            {/* Produits exportés */}
            {stats.productExports.isUnlimited ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
                className="progress-circle-unli d-flex gap-2 flex-column flex-md-row"
              >
                <div className="progress-circle-wrapper">
                  <i className="ri-infinity-fill"></i>
                </div>
                <div className="progress-details">
                  <div className="progress-text">∞</div>
                  <div className="progress-label">Produits exportés</div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
                className="progress-circle d-flex gap-2 flex-column flex-md-row"
                data-progress={stats.productExports.remaining}
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
                      stroke="#0c6cfb" 
                      strokeDasharray={calculateProgress(stats.productExports.remaining, stats.productExports.limit).dasharray}
                      strokeDashoffset={calculateProgress(stats.productExports.remaining, stats.productExports.limit).dashoffset}
                      style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center',
                      }}
                    ></circle>
                  </svg>
                </div>
                <div className="progress-details">
                  <div className="progress-text">{stats.productExports.remaining}/{stats.productExports.limit}</div>
                  <div className="progress-label">Produits exportés</div>
                </div>
              </motion.div>
            )}

            {/* Génération de boutique */}
            {stats.storeGeneration.isUnlimited ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
                className="progress-circle-unli d-flex gap-2 flex-column flex-md-row"
              >
                <div className="progress-circle-wrapper">
                  <i className="ri-infinity-fill"></i>
                </div>
                <div className="progress-details">
                  <div className="progress-text">∞</div>
                  <div className="progress-label">Génération de boutique</div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
                className="progress-circle d-flex gap-2 flex-column flex-md-row"
                data-progress={stats.storeGeneration.remaining}
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
                      stroke="#0c6cfb" 
                      strokeDasharray={calculateProgress(stats.storeGeneration.remaining, stats.storeGeneration.limit).dasharray}
                      strokeDashoffset={calculateProgress(stats.storeGeneration.remaining, stats.storeGeneration.limit).dashoffset}
                      style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center',
                      }}
                    ></circle>
                  </svg>
                </div>
                <div className="progress-details">
                  <div className="progress-text">{stats.storeGeneration.remaining}/{stats.storeGeneration.limit}</div>
                  <div className="progress-label">Génération de boutique</div>
                </div>
              </motion.div>
            )}
          </div>
          )}

          {/* Loading state for stats */}
          {showStats && loading && (
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
        </div>
      </div>
    </motion.header>
  );
}
