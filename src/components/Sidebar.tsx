"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { useStats } from "@/contexts/StatsContext";

interface SidebarProps {
  onNavigate?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// Language options for the selector
const languages = [
  { code: 'en', label: 'EN', flag: '/flags/us.svg' },
  { code: 'fr', label: 'FR', flag: '/flags/fr.svg' },
  { code: 'es', label: 'ES', flag: '/flags/es.svg' },
];

export default function Sidebar({ onNavigate, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  
  // Use global stats context
  const { stats: userStats } = useStats();
  
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
  }, [session]);
  
  // Determine if we should show trial/expired notice
  const isOnTrial = userStats?.plan?.isOnTrial || userStats?.plan?.identifier === 'trial';
  const isExpired = userStats?.plan?.isExpired || userStats?.plan?.identifier === 'expired';
  const apiTrialDays = userStats?.plan?.trialDaysRemaining ?? 0;
  
  // Show upgrade section for trial OR expired users (not for pro/basic users)
  const showUpgradeSection = isOnTrial || isExpired;

  // Get current language object
  const currentLang = languages.find(l => l.code === currentLanguage) || languages[1];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setLanguageDropdownOpen(false);
      }
    };

    // Position profile dropdown
    const positionProfileDropdown = () => {
      if (!profileDropdownOpen) return;
      
      const dropdown = profileDropdownRef.current?.querySelector('.dropdown-menu');
      const button = profileDropdownRef.current?.querySelector('.profile-trigger-btn');
      if (dropdown && button) {
        const buttonRect = button.getBoundingClientRect();
        const dropdownElement = dropdown as HTMLElement;
        
        if (window.innerWidth <= 991) {
          // Mobile - position to the right of button
          dropdownElement.style.position = 'fixed';
          dropdownElement.style.bottom = `${window.innerHeight - buttonRect.bottom}px`;
          dropdownElement.style.left = `${buttonRect.right + 8}px`;
          dropdownElement.style.right = 'auto';
          dropdownElement.style.top = 'auto';
          dropdownElement.style.width = '250px';
          dropdownElement.style.maxWidth = '250px';
          dropdownElement.style.zIndex = '2147483647';
          dropdownElement.style.overflow = 'visible';
          dropdownElement.style.isolation = 'isolate';
        } else {
          // Desktop - position to the right of button
          dropdownElement.style.position = 'fixed';
          dropdownElement.style.bottom = `${window.innerHeight - buttonRect.bottom}px`;
          dropdownElement.style.left = `${buttonRect.right + 8}px`;
          dropdownElement.style.right = 'auto';
          dropdownElement.style.top = 'auto';
          dropdownElement.style.width = '250px';
          dropdownElement.style.zIndex = '2147483647';
          dropdownElement.style.isolation = 'isolate';
        }
      }
    };

    if (profileDropdownOpen || languageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (profileDropdownOpen) {
        positionProfileDropdown();
        window.addEventListener('resize', positionProfileDropdown);
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', positionProfileDropdown);
    };
  }, [profileDropdownOpen, languageDropdownOpen]);

  // Handle language change
  const handleLanguageChange = (langCode: string) => {
    setCurrentLanguage(langCode);
    setLanguageDropdownOpen(false);
    // TODO: Implement actual language change via i18n/locale
  };

  return (
    <div className="h-100 w-100 d-flex flex-column flex-shrink-0 position-relative" style={{ zIndex: 1, height: '100vh', overflow: 'visible' }}>
      {/* Logo Section with Language Selector and Toggle Button */}
      <div className="d-flex my-2 ps-3 pe-3 pb-2 pt-4 align-items-center justify-content-between">
        {isCollapsed ? (
          /* Collapsed state: Show expand icon button */
          <div className="d-flex align-items-center justify-content-center w-100">
            <button 
              className="sidebar-expand-btn"
              type="button"
              onClick={onToggleCollapse}
              title="Expand sidebar"
              style={{
                background: 'none',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className="ri-sidebar-unfold-line" style={{ fontSize: '24px', color: '#fff' }}></i>
            </button>
          </div>
        ) : (
          /* Expanded state: Logo + Language Selector + Toggle */
          <>
            <div className="d-flex align-items-center gap-3">
              {/* Logo */}
              <div className="sidebar-logo">
                <Link href="/dashboard" onClick={onNavigate}>
                  <img src="/img/text-logo-new-3-lp.svg" width="58" loading="lazy" alt="Copyfy" />
                </Link>
              </div>
              
              {/* Language Selector */}
              <div className="dropdown language-selector-dropdown" ref={languageDropdownRef}>
                <button 
                  className={cn(
                    "btn language-selector-btn d-flex align-items-center gap-1",
                    languageDropdownOpen && "active"
                  )}
                  type="button" 
                  aria-expanded={languageDropdownOpen}
                  onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  <img 
                    src={currentLang.flag} 
                    alt={currentLang.label}
                    style={{ width: 16, height: 16, objectFit: 'cover', borderRadius: '50%' }}
                  />
                  <span className="text-white fw-500">{currentLang.label}</span>
                  <i className={cn("ri-arrow-down-s-line text-white", languageDropdownOpen && "rotate-180")} 
                     style={{ transition: 'transform 0.2s ease', fontSize: '12px' }}></i>
                </button>
                {languageDropdownOpen && (
                  <ul className="dropdown-menu show language-dropdown-menu">
                    {languages.map((lang) => (
                      <li key={lang.code}>
                        <button 
                          className={cn(
                            "dropdown-item d-flex align-items-center gap-2",
                            currentLanguage === lang.code && "active"
                          )}
                          onClick={() => handleLanguageChange(lang.code)}
                        >
                          <img 
                            src={lang.flag} 
                            alt={lang.label}
                            style={{ width: 18, height: 18, objectFit: 'cover', borderRadius: '50%' }}
                          />
                          <span>{lang.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            {/* Sidebar Toggle Button */}
            <button 
              className="sidebar-toggle-btn"
              type="button"
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className="ri-sidebar-fold-line" style={{ fontSize: '22px', color: '#ffffff' }}></i>
            </button>
          </>
        )}
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
                  title="Tableau de bord"
                >
                  <div className="nav-image">
                    <img src="/img/navbar-icons/home-icon.svg" alt="" />
                  </div>
                  {!isCollapsed && "Tableau de bord"}
                </Link>
              </li>
              <li className="nav-items">
                <Link 
                  href="/dashboard/products" 
                  className={cn("nav-link", pathname === "/dashboard/products" && "active")}
                  onClick={onNavigate}
                  title="Top Produits"
                >
                  <div className="nav-image">
                    <img src="/img/navbar-icons/tag-icon.svg" alt="" />
                  </div>
                  {!isCollapsed && "Top Produits"}
                </Link>
              </li>
              <li className="nav-items">
                <Link 
                  href="/dashboard/shops" 
                  className={cn("nav-link", pathname === "/dashboard/shops" && "active")}
                  onClick={onNavigate}
                  title="Top Boutiques"
                >
                  <div className="nav-image">
                    <img src="/img/navbar-icons/shop-icon.svg" alt="" />
                  </div>
                  {!isCollapsed && "Top Boutiques"}
                </Link>
              </li>
              <li className="nav-items">
                <Link 
                  href="/dashboard/ads" 
                  className={cn("nav-link", pathname === "/dashboard/ads" && "active")}
                  onClick={onNavigate}
                  title="Top Publicités"
                >
                  <div className="nav-image">
                    <img src="/img/navbar-icons/announcement-icon.svg" alt="" />
                  </div>
                  {!isCollapsed && "Top Publicités"}
                </Link>
              </li>
            </ul>
          </div>

          {/* OUTILS Section */}
          <div className="mt-4">
            {!isCollapsed && <p className="menu-title mb-2">OUTILS</p>}
            <ul className="navbar-nav">
              <li className="nav-items">
                <Link 
                  href="/dashboard/analyze-shop" 
                  className={cn("nav-link", pathname === "/dashboard/analyze-shop" || pathname?.startsWith("/dashboard/track/") ? "active" : "")}
                  onClick={onNavigate}
                  title="Analyse de boutique"
                >
                  <div className="nav-image">
                    <img src="/img/navbar-icons/analyze-icon.svg" alt="" />
                  </div>
                  {!isCollapsed && "Analyse de boutique"}
                </Link>
              </li>
              <li className="nav-items">
                <Link 
                  href="/dashboard/ai-shop" 
                  className={cn("nav-link", pathname === "/dashboard/ai-shop" && "active")}
                  onClick={onNavigate}
                  title="Boutique IA"
                >
                  <div className="nav-image">
                    <i className="fa-brands fa-shopify"></i>
                  </div>
                  {!isCollapsed && (
                    <>
                      Boutique IA
                      <span className="badge bg-success-new ms-auto fw-500">NEW</span>
                    </>
                  )}
                </Link>
              </li>
              <li className="nav-items">
                <Link 
                  href="/dashboard/ai-creatives" 
                  className={cn("nav-link", pathname === "/dashboard/ai-creatives" && "active")}
                  onClick={onNavigate}
                  title="Créatives avec IA"
                >
                  <div className="nav-image">
                    <i className="ri-video-add-line fs-normal"></i>
                  </div>
                  {!isCollapsed && (
                    <>
                      Créatives avec IA
                      <span className="badge bg-beta ms-auto fw-500">BETA</span>
                    </>
                  )}
                </Link>
              </li>
              <li className="nav-items">
                <Link 
                  href="/dashboard/export" 
                  className={cn("nav-link", pathname === "/dashboard/export" && "active")}
                  onClick={onNavigate}
                  title="Export de produit"
                >
                  <div className="nav-image">
                    <img src="/img/navbar-icons/export-icon.svg" alt="" />
                  </div>
                  {!isCollapsed && "Export de produit"}
                </Link>
              </li>
              <li className="nav-items">
                <Link 
                  href="/dashboard/aliexpress" 
                  className={cn("nav-link", pathname === "/dashboard/aliexpress" && "active")}
                  onClick={onNavigate}
                  title="Trouver sur Aliexpress"
                >
                  <div className="nav-image">
                    <img src="/img/navbar-icons/search-icon.svg" alt="" />
                  </div>
                  {!isCollapsed && "Trouver sur Aliexpress"}
                </Link>
              </li>
            </ul>
          </div>

          {/* RESSOURCES Section */}
          <div className="mt-4">
            {!isCollapsed && <p className="menu-title mb-2">RESSOURCES</p>}
            <ul className="navbar-nav">
              <li className="nav-items">
                <Link 
                  href="/dashboard/suppliers" 
                  className={cn("nav-link", pathname === "/dashboard/suppliers" && "active")}
                  onClick={onNavigate}
                  title="Fournisseur"
                >
                  <div className="nav-image">
                    <img src="/img/navbar-icons/supplier-icon.svg" alt="" />
                  </div>
                  {!isCollapsed && "Fournisseur"}
                </Link>
              </li>
              <li className="nav-items">
                <Link 
                  href="/dashboard/hire" 
                  className={cn("nav-link", pathname === "/dashboard/hire" && "active")}
                  onClick={onNavigate}
                  title="Recrutez un Créateur de Créatives"
                >
                  <div className="nav-image">
                    <i className="ri-lightbulb-flash-line fs-normal"></i>
                  </div>
                  {!isCollapsed && "Recrutez un Créateur de Cr..."}
                </Link>
              </li>
              <li className="nav-items">
                <a 
                  href="https://copyfy.crisp.help/fr/category/faq-1lvyeju/" 
                  className="nav-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="FAQ"
                >
                  <div className="nav-image">
                    <img src="/img/navbar-icons/faq.svg" alt="" />
                  </div>
                  {!isCollapsed && "FAQ"}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section - Formation + Trial/Expired + User Profile */}
      <div className="ps-3 pe-3 pb-3 pt-2">
        {!isCollapsed && (
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
        )}

        {isCollapsed && (
          <Link 
            href="/dashboard/courses" 
            className="btn btn-primary w-100 d-flex align-items-center justify-content-center p-2"
            onClick={onNavigate}
            title="Formation E-Commerce"
          >
            <img src="/img/navbar-icons/play-icon.svg" alt="" style={{ width: 18, height: 18 }} />
          </Link>
        )}

        {/* Collapsed Trial Notice - Show days in a box and upgrade icon */}
        {isCollapsed && showUpgradeSection && (
          <div className="trial-notice-collapsed mt-3 d-flex flex-column align-items-center gap-2">
            {/* Days remaining box */}
            <div 
              className="trial-days-box d-flex align-items-center justify-content-center"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <span className="text-white fw-600" style={{ fontSize: '20px' }}>
                {isExpired && !isOnTrial ? '!' : (apiTrialDays > 0 ? apiTrialDays : (trialDaysRemaining ?? 0))}
              </span>
            </div>
            
            {/* Upgrade button */}
            <Link 
              href="/dashboard/plans" 
              className="btn btn-upgrade-collapsed d-flex align-items-center justify-content-center"
              onClick={onNavigate}
              title="Mettre à niveau"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#3B82F6',
              }}
            >
              <img src="/img/navbar-icons/lightning-icon.svg" alt="" style={{ width: '16px', height: '20px' }} />
            </Link>
          </div>
        )}

        {/* Trial/Expired Notice - Show for trial or expired users (expanded mode) */}
        {!isCollapsed && showUpgradeSection && (
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

        {/* User Profile Button */}
        <div className="mt-3 position-relative" ref={profileDropdownRef}>
          <button 
            className={cn(
              "profile-trigger-btn w-100 d-flex align-items-center gap-2 p-2 rounded-3",
              profileDropdownOpen && "active"
            )}
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          >
            <div className="profile-avatar position-relative">
              <img 
                className="rounded-circle" 
                src={session?.user?.image || `https://eu.ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name || 'User')}&background=091C43&color=fff&bold=true&length=1&size=300`} 
                alt="Profile"
                style={{ width: 36, height: 36, objectFit: 'cover' }}
              />
            </div>
            {!isCollapsed && (
              <>
                <div className="text-start flex-grow-1 overflow-hidden">
                  <div className="d-flex align-items-center gap-1">
                    <span className="text-white fs-small fw-500 text-truncate">
                      {session?.user?.name || 'Utilisateur'}
                    </span>
                    {/* Verified Badge */}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="8" fill="#3B82F6"/>
                      <path d="M5.5 8L7 9.5L10.5 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sub fs-xs text-truncate d-block" style={{ opacity: 0.7 }}>
                    {session?.user?.email || ''}
                  </span>
                </div>
                <i className="ri-arrow-right-s-line text-light-gray fs-5"></i>
              </>
            )}
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <ul 
              className="dropdown-menu show profile-dropdown-menu" 
              aria-labelledby="profileDropdownMenu"
            >
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
                <Link className="dropdown-item fs-small fw-500" href="/dashboard/settings" onClick={() => setProfileDropdownOpen(false)}>
                  <img className="dropdown-item-icon" src="/img/navbar-icons/setting-icon.svg" alt="Settings" />
                  Paramètres
                </Link>
              </li>
              <li>
                <Link className="dropdown-item fs-small fw-500" href="/dashboard/domains" onClick={() => setProfileDropdownOpen(false)}>
                  <i className="dropdown-item-icon ri-global-line"></i>
                  Gestion des Domaines
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
  );
}
