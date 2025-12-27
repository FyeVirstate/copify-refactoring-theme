"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Product {
  id: number;
  title: string;
  handle: string;
  image: string | null;
  price: string | null;
}

interface SharedShop {
  id: number;
  url: string;
  name: string | null;
  screenshot: string | null;
  country: string | null;
  currency: string | null;
  monthlyRevenue: number | null;
  dailyRevenue: number | null;
  activeAds: number | null;
  activeAdsGrowth: number | null;
  trafficGrowth1M: number | null;
  trafficGrowth3M: number | null;
  mainSource: string | null;
  countries: { code: string; value: number }[];
  products: Product[];
}

interface ShareData {
  user: {
    name: string | null;
    email: string | null;
  };
  shops: SharedShop[];
}

const REGISTER_URL = "/register";
const LOGIN_URL = "/login";

// Product Hover Card Component for share page
function ShareProductHoverCard({ 
  product, 
  shopUrl, 
  currency,
  isMobile
}: { 
  product: Product; 
  shopUrl: string; 
  currency: string | null;
  isMobile: boolean;
}) {
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (isMobile) return; // No hover on mobile
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    if (thumbnailRef.current) {
      const rect = thumbnailRef.current.getBoundingClientRect();
      const popupWidth = 220;
      let left = rect.left;
      // Ensure popup doesn't go off-screen
      if (left + popupWidth > window.innerWidth - 16) {
        left = window.innerWidth - popupWidth - 16;
      }
      setPopupPosition({
        top: rect.bottom + 8,
        left: left
      });
    }
    setShowPopup(true);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    hideTimeoutRef.current = setTimeout(() => {
      setShowPopup(false);
    }, 150);
  };

  const productUrl = `https://${shopUrl}/products/${product.handle}`;
  const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'AUD' ? 'AUD$' : '$';

  // On mobile, just link directly
  if (isMobile) {
    return (
      <a 
        href={productUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ 
          width: '45px', 
          height: '45px', 
          borderRadius: '6px',
          overflow: 'hidden',
          border: '1px solid #E5E7EB',
          flexShrink: 0,
          display: 'block'
        }}
      >
        <img 
          src={product.image || '/img_not_found.png'} 
          alt={product.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          onError={(e) => { (e.target as HTMLImageElement).src = '/img_not_found.png'; }}
        />
      </a>
    );
  }

  return (
    <>
      <div 
        ref={thumbnailRef}
        style={{ 
          width: '50px', 
          height: '50px', 
          cursor: 'pointer',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #E5E7EB',
          flexShrink: 0
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img 
          src={product.image || '/img_not_found.png'} 
          alt={product.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          onError={(e) => { (e.target as HTMLImageElement).src = '/img_not_found.png'; }}
        />
      </div>

      {showPopup && (
        <div 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'fixed',
            top: popupPosition.top,
            left: popupPosition.left,
            zIndex: 9999,
            width: '220px',
            padding: '12px',
            background: '#fff',
            border: '1px solid #E1E4EA',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '12px', background: '#f9fafb' }}>
            <img 
              src={product.image || '/img_not_found.png'} 
              alt={product.title}
              style={{ width: '100%', height: '160px', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).src = '/img_not_found.png'; }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', flex: 1, lineHeight: '1.3' }}>
              {product.title}
            </span>
            {product.price && (
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                {currencySymbol} {product.price}
              </span>
            )}
          </div>
          <a 
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#525866',
              backgroundColor: '#fff',
              border: '1px solid #E1E4EA',
              borderRadius: '6px',
              textDecoration: 'none',
            }}
          >
            Voir le produit
          </a>
        </div>
      )}
    </>
  );
}

// Mobile Shop Card Component
function MobileShopCard({ shop, isMobile }: { shop: SharedShop; isMobile: boolean }) {
  const formatCurrency = (amount: number | null | undefined, currency: string | null = "USD") => {
    if (amount === null || amount === undefined) return "-";
    const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'AUD' ? 'AUD$' : '$';
    return `${currencySymbol} ${new Intl.NumberFormat("en-US").format(Math.round(amount))}`;
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      border: '1px solid #E1E4EA',
      overflow: 'hidden',
      marginBottom: '12px'
    }}>
      {/* Shop Header */}
      <div style={{ padding: '12px', borderBottom: '1px solid #E1E4EA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src={shop.screenshot 
              ? `https://app.copyfy.io/download/products/screenshots/${shop.screenshot}`
              : `https://image.thum.io/get/width/700/crop/360/https://${shop.url}`
            }
            alt={shop.name || shop.url}
            style={{ width: '50px', height: '35px', objectFit: 'cover', borderRadius: '4px', background: '#f3f4f6' }}
            onError={(e) => { (e.target as HTMLImageElement).src = '/img_not_found.png'; }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
              {shop.name || shop.url}
            </p>
            <a 
              href={`https://${shop.url}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '11px', color: '#6b7280', textDecoration: 'none' }}
            >
              {shop.url.length > 25 ? shop.url.substring(0, 25) + '...' : shop.url}
            </a>
          </div>
        </div>
      </div>

      {/* Products */}
      {shop.products && shop.products.length > 0 && (
        <div style={{ padding: '12px', borderBottom: '1px solid #E1E4EA' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>Meilleures ventes</p>
          <div style={{ display: 'flex', gap: '6px' }}>
            {shop.products.slice(0, 3).map((product, idx) => (
              <ShareProductHoverCard 
                key={idx}
                product={product}
                shopUrl={shop.url}
                currency={shop.currency}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#E1E4EA' }}>
        <div style={{ background: '#fff', padding: '10px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '10px', color: '#6b7280' }}>Ventes mensuelles</p>
          <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>
            {formatCurrency(shop.monthlyRevenue, shop.currency)}
          </p>
        </div>
        <div style={{ background: '#fff', padding: '10px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '10px', color: '#6b7280' }}>Annonces actives</p>
          <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>
            {shop.activeAds ?? '-'}
          </p>
        </div>
        <div style={{ background: '#fff', padding: '10px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '10px', color: '#6b7280' }}>Tendance 1M</p>
          <p style={{ 
            margin: '4px 0 0', 
            fontSize: '13px', 
            fontWeight: 600, 
            color: (shop.trafficGrowth1M ?? 0) >= 0 ? '#22c55e' : '#ef4444' 
          }}>
            {(shop.trafficGrowth1M ?? 0) > 0 ? '+' : ''}{shop.trafficGrowth1M ?? 0}%
          </p>
        </div>
        <div style={{ background: '#fff', padding: '10px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '10px', color: '#6b7280' }}>Tendance 3M</p>
          <p style={{ 
            margin: '4px 0 0', 
            fontSize: '13px', 
            fontWeight: 600, 
            color: (shop.trafficGrowth3M ?? 0) >= 0 ? '#22c55e' : '#ef4444' 
          }}>
            {(shop.trafficGrowth3M ?? 0) > 0 ? '+' : ''}{shop.trafficGrowth3M ?? 0}%
          </p>
        </div>
      </div>

      {/* Countries */}
      {shop.countries && shop.countries.length > 0 && (
        <div style={{ padding: '10px', borderTop: '1px solid #E1E4EA' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {shop.countries.slice(0, 3).map((country, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <img 
                  src={`/flags/${country.code.toLowerCase()}.svg`}
                  alt={country.code}
                  style={{ width: '14px', height: '10px' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span style={{ color: '#6b7280', fontSize: '11px' }}>{country.value}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA Button */}
      <div style={{ padding: '12px' }}>
        <Link 
          href={REGISTER_URL}
          style={{
            display: 'block',
            width: '100%',
            padding: '10px',
            textAlign: 'center',
            border: '1px solid #E1E4EA',
            borderRadius: '8px',
            color: '#1f2937',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 500,
            background: '#fff'
          }}
        >
          Voir l&apos;analyse complète
        </Link>
      </div>
    </div>
  );
}

export default function SharePage() {
  const params = useParams();
  const uuid = params?.uuid as string;
  
  const [data, setData] = useState<ShareData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLang] = useState("FR");
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!uuid) return;

    const fetchSharedShops = async () => {
      try {
        const response = await fetch(`/api/share/${uuid}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Ce lien de partage n'existe pas ou a expiré.");
          } else {
            setError("Erreur lors du chargement des boutiques partagées.");
          }
          return;
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Share fetch error:", err);
        setError("Erreur lors du chargement des boutiques partagées.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedShops();
  }, [uuid]);

  const formatCurrency = (amount: number | null | undefined, currency: string | null = "USD") => {
    if (amount === null || amount === undefined) return "-";
    const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'AUD' ? 'AUD$' : '$';
    return `${currencySymbol} ${new Intl.NumberFormat("en-US").format(Math.round(amount))}`;
  };

  const limitText = (text: string | null, limit: number) => {
    if (!text) return "";
    return text.length > limit ? text.substring(0, limit) + "..." : text;
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#090815'
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div className="spinner-border" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p style={{ marginTop: '1rem', fontSize: '16px' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#090815',
        position: 'relative',
        overflow: 'hidden',
        padding: '20px'
      }}>
        <div style={{
          position: 'absolute',
          background: 'rgba(51, 92, 255, 0.6)',
          left: 0,
          width: '100%',
          height: '50%',
          borderRadius: '50%',
          filter: 'blur(40px)',
          top: '60px'
        }} />
        <div style={{ 
          background: '#fff', 
          padding: isMobile ? '24px' : '40px', 
          borderRadius: '16px', 
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          zIndex: 10
        }}>
          <i className="ri-error-warning-line" style={{ fontSize: '48px', color: '#ef4444', marginBottom: '16px', display: 'block' }}></i>
          <h2 style={{ color: '#1f2937', marginBottom: '12px', fontSize: isMobile ? '18px' : '24px' }}>Oups !</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: isMobile ? '14px' : '16px' }}>{error}</p>
          <Link href={REGISTER_URL} style={{ 
            background: '#335CFF', 
            color: '#fff', 
            padding: '12px 24px', 
            borderRadius: '8px', 
            textDecoration: 'none',
            fontWeight: 500,
            display: 'inline-block',
            fontSize: isMobile ? '13px' : '14px'
          }}>
            Commencer votre essai gratuit
          </Link>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.shops.length === 0) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#090815',
        position: 'relative',
        overflow: 'hidden',
        padding: '20px'
      }}>
        <div style={{
          position: 'absolute',
          background: 'rgba(51, 92, 255, 0.6)',
          left: 0,
          width: '100%',
          height: '50%',
          borderRadius: '50%',
          filter: 'blur(40px)',
          top: '60px'
        }} />
        <div style={{ 
          background: '#fff', 
          padding: isMobile ? '24px' : '40px', 
          borderRadius: '16px', 
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          zIndex: 10
        }}>
          <i className="ri-store-2-line" style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '16px', display: 'block' }}></i>
          <h2 style={{ color: '#1f2937', marginBottom: '12px', fontSize: isMobile ? '18px' : '24px' }}>Aucune boutique</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: isMobile ? '14px' : '16px' }}>Aucune boutique n&apos;a été partagée.</p>
          <Link href={REGISTER_URL} style={{ 
            background: '#335CFF', 
            color: '#fff', 
            padding: '12px 24px', 
            borderRadius: '8px', 
            textDecoration: 'none',
            fontWeight: 500,
            display: 'inline-block',
            fontSize: isMobile ? '13px' : '14px'
          }}>
            Commencer votre essai gratuit
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#F5F7FA',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header with dark background */}
      <div style={{
        background: '#090815',
        padding: isMobile ? '12px' : '8px 16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Blur effect */}
        <div style={{
          position: 'absolute',
          background: 'rgba(51, 92, 255, 0.6)',
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          filter: 'blur(40px)',
          top: '20px',
          pointerEvents: 'none'
        }} />

        {/* Header content */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'stretch' : 'center', 
          gap: isMobile ? '12px' : '12px',
          position: 'relative',
          zIndex: 3
        }}>
          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src={`https://eu.ui-avatars.com/api/?name=${encodeURIComponent(data.user?.name || 'User')}&background=091C43&color=fff&bold=true&length=1&size=300`}
              alt=""
              style={{ width: isMobile ? '22px' : '27px', height: isMobile ? '22px' : '27px', borderRadius: '50%' }}
            />
            <p style={{ color: '#fff', margin: 0, fontWeight: 500, fontSize: isMobile ? '12px' : '14px' }}>
              <strong>{limitText(data.user?.name, isMobile ? 12 : 16)}</strong>{' '}
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                {isMobile ? 'a partagé' : 'a partagé ces sélections pour vous'}
              </span>
            </p>
          </div>

          {/* Actions row */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? '8px' : '12px', 
            justifyContent: isMobile ? 'space-between' : 'flex-end',
            flexWrap: 'wrap'
          }}>
            {/* Created with Copyfy - hide on mobile */}
            {!isMobile && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Créé avec</span>
                  <img src="/img/text-logo-new-3-lp.svg" alt="Copyfy" style={{ height: '16px' }} />
                </div>
                <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} />
              </>
            )}

            {/* Language selector */}
            <button
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                padding: isMobile ? '4px 6px' : '4px 8px',
                fontSize: isMobile ? '12px' : '14px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <img src="/flags/fr.svg" alt="FR" style={{ width: '14px', height: '10px' }} />
              {currentLang}
            </button>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {!isMobile && (
                <Link 
                  href={LOGIN_URL}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 500
                  }}
                >
                  Se connecter
                </Link>
              )}
              <Link 
                href={REGISTER_URL}
                style={{
                  background: 'linear-gradient(135deg, #335CFF 0%, #5B7FFF 100%)',
                  border: 'none',
                  color: '#fff',
                  padding: isMobile ? '6px 10px' : '6px 12px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: isMobile ? '11px' : '13px',
                  fontWeight: 500,
                  whiteSpace: 'nowrap'
                }}
              >
                {isMobile ? 'Essai gratuit' : 'Commencer votre essai gratuit'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ 
        flex: 1, 
        background: '#F5F7FA',
        padding: isMobile ? '12px' : '16px'
      }}>
        {/* Mobile: Card layout */}
        {isMobile ? (
          <div>
            {data.shops.map((shop) => (
              <MobileShopCard key={shop.id} shop={shop} isMobile={isMobile} />
            ))}
          </div>
        ) : (
          /* Desktop: Table layout */
          <div style={{ maxWidth: '1700px', margin: '0 auto', minHeight: 'calc(100vh - 90px)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px', minWidth: '1200px' }}>
                <thead>
                  <tr>
                    <th style={{ background: '#E1E4EA', padding: '12px', fontSize: '12px', fontWeight: 500, color: '#525866', textAlign: 'left', borderRadius: '6px 0 0 6px', minWidth: '150px', paddingLeft: '113px' }}>
                      Nom de la boutique
                    </th>
                    <th style={{ background: '#E1E4EA', padding: '12px', fontSize: '12px', fontWeight: 500, color: '#525866', textAlign: 'left' }}>
                      Meilleure vente
                    </th>
                    <th style={{ background: '#E1E4EA', padding: '12px', fontSize: '12px', fontWeight: 500, color: '#525866', textAlign: 'left' }}>
                      Part de Marché
                    </th>
                    <th style={{ background: '#E1E4EA', padding: '12px', fontSize: '12px', fontWeight: 500, color: '#525866', textAlign: 'left' }}>
                      Tendance du trafic
                    </th>
                    <th style={{ background: '#E1E4EA', padding: '12px', fontSize: '12px', fontWeight: 500, color: '#525866', textAlign: 'right' }}>
                      Ventes mensuelles est.
                    </th>
                    <th style={{ background: '#E1E4EA', padding: '12px', fontSize: '12px', fontWeight: 500, color: '#525866', textAlign: 'right' }}>
                      Annonces actives
                    </th>
                    <th style={{ background: '#E1E4EA', padding: '12px', fontSize: '12px', fontWeight: 500, color: '#525866', textAlign: 'left', minWidth: '130px' }}>
                      Source principale
                    </th>
                    <th style={{ background: '#E1E4EA', padding: '12px', borderRadius: '0 6px 6px 0' }}>&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {data.shops.map((shop) => (
                    <tr key={shop.id}>
                      {/* Shop Name */}
                      <td style={{ background: '#fff', padding: '20px 12px', borderTop: '1px solid #E1E4EA', borderBottom: '1px solid #E1E4EA', borderLeft: '1px solid #E1E4EA', borderRadius: '6px 0 0 6px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img 
                            src={shop.screenshot ? `https://app.copyfy.io/download/products/screenshots/${shop.screenshot}` : `https://image.thum.io/get/width/700/crop/360/https://${shop.url}`}
                            alt={shop.name || shop.url}
                            style={{ width: '90px', height: '60px', objectFit: 'cover', borderRadius: '4px', background: '#f3f4f6' }}
                            onError={(e) => { (e.target as HTMLImageElement).src = '/img_not_found.png'; }}
                          />
                          <div>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <a href={`https://${shop.url}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1f2937', textDecoration: 'none' }}>
                                {shop.name || shop.url}
                              </a>
                            </p>
                            <p style={{ margin: 0, fontSize: '12px' }}>
                              <a href={`https://${shop.url}`} target="_blank" rel="noopener noreferrer" style={{ color: '#6b7280', textDecoration: 'none' }}>
                                {limitText(shop.url, 16)}
                              </a>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Products */}
                      <td style={{ background: '#fff', padding: '20px 12px', borderTop: '1px solid #E1E4EA', borderBottom: '1px solid #E1E4EA', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {shop.products && shop.products.length > 0 ? (
                            shop.products.slice(0, 3).map((product, idx) => (
                              <ShareProductHoverCard key={idx} product={product} shopUrl={shop.url} currency={shop.currency} isMobile={isMobile} />
                            ))
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>-</span>
                          )}
                        </div>
                      </td>

                      {/* Countries */}
                      <td style={{ background: '#fff', padding: '20px 12px', borderTop: '1px solid #E1E4EA', borderBottom: '1px solid #E1E4EA', verticalAlign: 'middle' }}>
                        {shop.countries && shop.countries.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {shop.countries.slice(0, 3).map((country, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <img src={`/flags/${country.code.toLowerCase()}.svg`} alt={country.code} style={{ width: '16px', height: '12px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                <span style={{ color: '#99A0AE', fontSize: '11px' }}>({country.value}%)</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '12px' }}>-</span>
                        )}
                      </td>

                      {/* Traffic Trend */}
                      <td style={{ background: '#fff', padding: '20px 12px', borderTop: '1px solid #E1E4EA', borderBottom: '1px solid #E1E4EA', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', fontWeight: 500 }}>
                          <span>
                            <span style={{ color: '#99A0AE' }}>1M</span>{' '}
                            <span style={{ color: (shop.trafficGrowth1M ?? 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                              {(shop.trafficGrowth1M ?? 0) > 0 ? '+' : ''}{shop.trafficGrowth1M ?? 0}%
                            </span>
                          </span>
                          <span>
                            <span style={{ color: '#99A0AE' }}>3M</span>{' '}
                            <span style={{ color: (shop.trafficGrowth3M ?? 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                              {(shop.trafficGrowth3M ?? 0) > 0 ? '+' : ''}{shop.trafficGrowth3M ?? 0}%
                            </span>
                          </span>
                        </div>
                        <div style={{ width: '120px', height: '40px', background: 'linear-gradient(180deg, #DAE1FF 0%, transparent 100%)', borderRadius: '4px', marginTop: '4px' }} />
                      </td>

                      {/* Monthly Sales */}
                      <td style={{ background: '#fff', padding: '20px 12px', borderTop: '1px solid #E1E4EA', borderBottom: '1px solid #E1E4EA', verticalAlign: 'middle', textAlign: 'right' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{formatCurrency(shop.monthlyRevenue, shop.currency)}</span>
                      </td>

                      {/* Active Ads */}
                      <td style={{ background: '#fff', padding: '20px 12px', borderTop: '1px solid #E1E4EA', borderBottom: '1px solid #E1E4EA', verticalAlign: 'middle', textAlign: 'center' }}>
                        {shop.activeAds !== null ? (
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></span>
                            <span style={{ fontWeight: 500, fontSize: '14px', color: '#166534' }}>{shop.activeAds}</span>
                          </span>
                        ) : '-'}
                      </td>

                      {/* Traffic Source */}
                      <td style={{ background: '#fff', padding: '20px 12px', borderTop: '1px solid #E1E4EA', borderBottom: '1px solid #E1E4EA', verticalAlign: 'middle', textAlign: 'center' }}>
                        <img src={shop.mainSource || '/img/socials/google.svg'} alt="Traffic source" style={{ width: '24px', height: '24px' }} onError={(e) => { (e.target as HTMLImageElement).src = '/img/socials/google.svg'; }} />
                      </td>

                      {/* Action */}
                      <td style={{ background: '#fff', padding: '20px 12px', borderTop: '1px solid #E1E4EA', borderBottom: '1px solid #E1E4EA', borderRight: '1px solid #E1E4EA', borderRadius: '0 6px 6px 0', verticalAlign: 'middle', textAlign: 'right' }}>
                        <Link href={REGISTER_URL} style={{ display: 'inline-block', padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#1f2937', textDecoration: 'none', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', background: '#fff' }}>
                          Voir l&apos;analyse complète
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
