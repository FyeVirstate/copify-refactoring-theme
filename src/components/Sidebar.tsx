"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";

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
  };
}

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Fetch user stats to determine trial status
  const fetchUserStats = useCallback(async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          setUserStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  }, []);
  
  // Calculate trial days from session user's created_at
  useEffect(() => {
    if (session?.user?.createdAt) {
      const createdAt = new Date(session.user.createdAt);
      const now = new Date();
      const trialHours = 168; // 7 days trial
      const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      const hoursRemaining = trialHours - hoursSinceCreation;
      const daysRemaining = Math.max(0, Math.ceil(hoursRemaining / 24));
      setTrialDaysRemaining(daysRemaining);
    }
    fetchUserStats();
  }, [session, fetchUserStats]);
  
  // Determine if we should show trial/expired notice
  const isOnTrial = userStats?.plan?.isOnTrial || userStats?.plan?.identifier === 'trial';
  const isExpired = userStats?.plan?.isExpired || userStats?.plan?.identifier === 'expired';
  const apiTrialDays = userStats?.plan?.trialDaysRemaining ?? 0;
  
  // Show upgrade section for trial OR expired users (not for pro/basic users)
  const showUpgradeSection = isOnTrial || isExpired;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    // Position dropdown for mobile
    const positionDropdown = () => {
      if (!dropdownOpen) return;
      
      const dropdown = dropdownRef.current?.querySelector('.dropdown-menu');
      const button = dropdownRef.current?.querySelector('button');
      if (dropdown && button) {
        const buttonRect = button.getBoundingClientRect();
        const dropdownElement = dropdown as HTMLElement;
        
        if (window.innerWidth <= 991) {
          // Mobile - use fixed positioning to escape sidebar context
          dropdownElement.style.position = 'fixed';
          dropdownElement.style.top = `${buttonRect.bottom + 12}px`; // 12px space for better separation
          dropdownElement.style.right = '14px'; // 14px from right - shifted 2px right for better centering
          dropdownElement.style.left = 'auto';
          dropdownElement.style.width = '270px';
          dropdownElement.style.maxWidth = '270px';
          dropdownElement.style.marginTop = '5px'; // Added 5px margin top as requested
          dropdownElement.style.zIndex = '2147483647'; // Maximum z-index value
          dropdownElement.style.overflow = 'visible';
          dropdownElement.style.isolation = 'isolate'; // Create new stacking context
        } else {
          // Desktop - use fixed positioning to escape sidebar context
          dropdownElement.style.position = 'fixed';
          dropdownElement.style.top = `${buttonRect.bottom + 2}px`; // Below button with 2px space
          dropdownElement.style.left = `${buttonRect.left - 0}px`; // Aligned with button: -8px + 3px shift right = -5px
          dropdownElement.style.right = 'auto';
          dropdownElement.style.width = '270px';
          dropdownElement.style.zIndex = '2147483647'; // Maximum z-index value
          dropdownElement.style.isolation = 'isolate'; // Create new stacking context
        }
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      positionDropdown();
      
      // Reposition on window resize
      window.addEventListener('resize', positionDropdown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', positionDropdown);
    };
  }, [dropdownOpen]);

  return (
    <div className="h-100 w-100 d-flex flex-column flex-shrink-0 position-relative" style={{ zIndex: 1, height: '100vh', overflow: 'visible' }}>
      {/* Logo Section */}
      <div className="d-flex my-2 ps-3 pe-3 pb-2 pt-4 align-items-center justify-content-between">
        <div className="sidebar-logo">
          <Link href="/dashboard" onClick={onNavigate}>
            <img src="/img/text-logo-new-3-lp.svg" width="100" loading="lazy" alt="Copyfy" />
          </Link>
        </div>
        <div className="d-flex profile-box align-items-center position-relative">
          <div className="dropdown profile-dropdown-btn" ref={dropdownRef}>
            <button 
              className={cn("btn btn-link p-0 text-decoration-none lh-1", dropdownOpen && "show")}
              type="button" 
              aria-expanded={dropdownOpen}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <i className="ri-settings-3-line text-light-gray fs-4"></i>
            </button>
            {dropdownOpen && (
              <ul 
                className="dropdown-menu show" 
                aria-labelledby="dropdownMenu2"
              >
                <li>
                  <div className="d-flex profile-details align-items-center">
                    <div>
                      <img 
                        className="profile-image-lg" 
                        src={`https://eu.ui-avatars.com/api/?name=Zakaria LAABID&background=091C43&color=fff&bold=true&length=1&size=300`} 
                        alt="Profile" 
                      />
                    </div>
                    <div>
                      <p className="mb-0 fs-small fw-500 text-nowrap">Zakaria LAABID</p>
                      <p className="mb-0 fs-xs text-sub text-nowrap">zakaria@virstate.io</p>
                    </div>
                  </div>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <a className="dropdown-item fs-small fw-500 w-status" href="/dashboard/connect-shopify">
                    <img className="dropdown-item-icon" src="/img/shopify-logo-min.png" alt="Shopify" />
                    Connectez votre Shopify
                  </a>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <a className="dropdown-item fs-small fw-500" href="/dashboard/affiliate">
                    <img className="dropdown-item-icon" src="/img/navbar-icons/affiliate-icon.svg" alt="Affiliate" />
                    Programme d&apos;affiliation
                  </a>
                </li>
                <li>
                  <Link className="dropdown-item fs-small fw-500" href="/dashboard/settings" onClick={() => setDropdownOpen(false)}>
                    <img className="dropdown-item-icon" src="/img/navbar-icons/setting-icon.svg" alt="Settings" />
                    Paramètres
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item fs-small fw-500" href="/dashboard/plans" onClick={() => setDropdownOpen(false)}>
                    <i className="dropdown-item-icon ri-vip-crown-line"></i>
                    Abonnement
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item fs-small fw-500" href="/dashboard/invoices" onClick={() => setDropdownOpen(false)}>
                    <i className="dropdown-item-icon ri-file-list-3-line"></i>
                    Factures
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item fs-small fw-500" href="/dashboard/todos" onClick={() => setDropdownOpen(false)}>
                    <i className="dropdown-item-icon ri-checkbox-circle-line"></i>
                    Liste de tâches
                  </Link>
                </li>
                <li>
                  <a className="dropdown-item fs-small fw-500" href="https://copyfy.crisp.help/fr/category/faq-1lvyeju/" target="_blank" rel="noopener noreferrer">
                    <img className="dropdown-item-icon" src="/img/navbar-icons/help-icon.svg" alt="Help" />
                    Help center
                  </a>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <a 
                    className="dropdown-item fs-small fw-500" 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      signOut({ callbackUrl: "/login" });
                    }}
                  >
                    <img className="dropdown-item-icon" src="/img/navbar-icons/exit-icon.svg" alt="Logout" />
                    Déconnexion
                  </a>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="px-3 side-menu-wrapper flex-1" style={{ overflowY: 'auto', flex: '1 1 auto' }}>
        <div className="navbar dashboard-sidebar py-3 d-block mt-0">
          {/* Main Navigation */}
          <div className="">
            <ul className="navbar-nav">
              <li className="nav-items">
                <Link 
                  href="/dashboard" 
                  className={cn("nav-link", pathname === "/dashboard" && "active")}
                  onClick={onNavigate}
                >
                  <div className="nav-image">
                    <img src="/img/navbar-icons/home-icon.svg" alt="" />
                  </div>
                  Tableau de bord
                </Link>
              </li>
              <li className="nav-items">
                <Link 
                  href="/dashboard/products" 
                  className={cn("nav-link", pathname === "/dashboard/products" && "active")}
                  onClick={onNavigate}
                >
                  <div className="nav-image">
                    <img src="/img/navbar-icons/tag-icon.svg" alt="" />
                  </div>
                  Top Produits
                </Link>
              </li>
              <li className="nav-items">
                <Link 
                  href="/dashboard/shops" 
                  className={cn("nav-link", pathname === "/dashboard/shops" && "active")}
                  onClick={onNavigate}
                >
                  <div className="nav-image">
                    <img src="/img/navbar-icons/shop-icon.svg" alt="" />
                  </div>
                  Top Boutiques
                </Link>
              </li>
              <li className="nav-items">
                <Link 
                  href="/dashboard/ads" 
                  className={cn("nav-link", pathname === "/dashboard/ads" && "active")}
                  onClick={onNavigate}
                >
                  <div className="nav-image">
                    <img src="/img/navbar-icons/announcement-icon.svg" alt="" />
                  </div>
                  Top Publicités
                </Link>
              </li>
            </ul>
          </div>

          {/* OUTILS Section */}
          <div className="mt-4">
            <p className="menu-title mb-2">OUTILS</p>
            <ul className="navbar-nav">
              <li className="nav-items">
                <Link 
                  href="/dashboard/analyze-shop" 
                  className={cn("nav-link", pathname === "/dashboard/analyze-shop" || pathname?.startsWith("/dashboard/track/") ? "active" : "")}
                  onClick={onNavigate}
                >
                  <div className="nav-image">
                    <img src="/img/navbar-icons/analyze-icon.svg" alt="" />
                  </div>
                  Analyse de boutique
                </Link>
              </li>
              <li className="nav-items">
                <Link 
                  href="/dashboard/ai-shop" 
                  className={cn("nav-link", pathname === "/dashboard/ai-shop" && "active")}
                  onClick={onNavigate}
                >
                  <div className="nav-image">
                    <i className="fa-brands fa-shopify"></i>
                  </div>
                  Boutique IA
                  <span className="badge bg-success-new ms-auto fw-500">NEW</span>
                </Link>
              </li>
              <li className="nav-items">
                <Link 
                  href="/dashboard/ai-creatives" 
                  className={cn("nav-link", pathname === "/dashboard/ai-creatives" && "active")}
                  onClick={onNavigate}
                >
                  <div className="nav-image">
                    <i className="ri-video-add-line fs-normal"></i>
                  </div>
                  Créatives avec IA
                  <span className="badge bg-beta ms-auto fw-500">BETA</span>
                </Link>
              </li>
              <li className="nav-items">
                <Link 
                  href="/dashboard/export" 
                  className={cn("nav-link", pathname === "/dashboard/export" && "active")}
                  onClick={onNavigate}
                >
                  <div className="nav-image">
                    <img src="/img/navbar-icons/export-icon.svg" alt="" />
                  </div>
                  Export de produit
                </Link>
              </li>
              <li className="nav-items">
                <Link 
                  href="/dashboard/aliexpress" 
                  className={cn("nav-link", pathname === "/dashboard/aliexpress" && "active")}
                  onClick={onNavigate}
                >
                  <div className="nav-image">
                    <img src="/img/navbar-icons/search-icon.svg" alt="" />
                  </div>
                  Trouver sur Aliexpress
                </Link>
              </li>
            </ul>
          </div>

          {/* RESSOURCES Section */}
          <div className="mt-4">
            <p className="menu-title mb-2">RESSOURCES</p>
            <ul className="navbar-nav">
              <li className="nav-items">
                <Link 
                  href="/dashboard/suppliers" 
                  className={cn("nav-link", pathname === "/dashboard/suppliers" && "active")}
                  onClick={onNavigate}
                >
                  <div className="nav-image">
                    <img src="/img/navbar-icons/supplier-icon.svg" alt="" />
                  </div>
                  Fournisseur
                </Link>
              </li>
              <li className="nav-items">
                <Link 
                  href="/dashboard/hire" 
                  className={cn("nav-link", pathname === "/dashboard/hire" && "active")}
                  onClick={onNavigate}
                >
                  <div className="nav-image">
                    <i className="ri-lightbulb-flash-line fs-normal"></i>
                  </div>
                  Engagez un créateur créatif
                </Link>
              </li>
              <li className="nav-items">
                <a 
                  href="https://copyfy.crisp.help/fr/category/faq-1lvyeju/" 
                  className="nav-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="nav-image">
                    <img src="/img/navbar-icons/faq.svg" alt="" />
                  </div>
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section - Formation + Trial/Expired */}
      <div className="ps-3 pe-3 pb-3 pt-2">
        <Link 
          href="/dashboard/courses" 
          className="btn btn-primary w-icon justify-content-center"
          onClick={onNavigate}
        >
          <span className="btn-img">
            <img src="/img/navbar-icons/play-icon.svg" alt="" />
          </span>
          <span>Formation E-Commerce</span>
        </Link>

        {/* Trial/Expired Notice - Show for trial or expired users */}
        {showUpgradeSection && (
          <div className="mt-3 trial-notice-wrapper" style={isExpired && !isOnTrial ? { backgroundColor: '#991b1b' } : undefined}>
            <div className="mb-3 text-white justify-content-center d-flex align-items-center">
              {isExpired && !isOnTrial ? (
                <>
                  <div 
                    className="text-center me-2 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      border: '2px solid #fca5a5'
                    }}
                  >
                    <i className="ri-close-line" style={{ fontSize: '18px', color: '#fca5a5' }}></i>
                  </div>
                  <div className="fs-xs">Période d&apos;essai expirée</div>
                </>
              ) : (
                <>
                  <div className="days-left text-center me-2">{apiTrialDays > 0 ? apiTrialDays : (trialDaysRemaining ?? 0)}</div>
                  <div className="fs-xs">Jours d&apos;essai restants</div>
                </>
              )}
            </div>
            <Link 
              href="/dashboard/plans" 
              className="btn btn-upgrade w-100 d-flex align-items-center justify-content-center"
              onClick={onNavigate}
            >
              <img className="me-1" src="/img/navbar-icons/lightning-icon.svg" alt="" style={{ width: '11px', height: '15px' }} />
              <span>Mettre à niveau</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

