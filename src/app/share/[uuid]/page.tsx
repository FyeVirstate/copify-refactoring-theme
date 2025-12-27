"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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
  countries: { code: string; value: number }[];
}

interface ShareData {
  user: {
    name: string | null;
    email: string | null;
  };
  shops: SharedShop[];
}

export default function SharePage() {
  const params = useParams();
  const uuid = params?.uuid as string;
  
  const [data, setData] = useState<ShareData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError("Erreur lors du chargement des boutiques partagées.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedShops();
  }, [uuid]);

  // Format currency
  const formatCurrency = (amount: number | null | undefined, currency: string | null = "$") => {
    if (amount === null || amount === undefined) return "-";
    const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
    return `${new Intl.NumberFormat("fr-FR").format(Math.round(amount))} ${currencySymbol}`;
  };

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div className="spinner-border" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p style={{ marginTop: '1rem', fontSize: '18px' }}>Chargement des boutiques partagées...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          background: '#fff', 
          padding: '40px', 
          borderRadius: '16px', 
          textAlign: 'center',
          maxWidth: '400px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <i className="ri-error-warning-line" style={{ fontSize: '48px', color: '#ef4444', marginBottom: '16px', display: 'block' }}></i>
          <h2 style={{ color: '#1f2937', marginBottom: '12px' }}>Oups !</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>{error}</p>
          <Link href="/" style={{ 
            background: '#3b82f6', 
            color: '#fff', 
            padding: '12px 24px', 
            borderRadius: '8px', 
            textDecoration: 'none',
            fontWeight: 500
          }}>
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  if (!data || data.shops.length === 0) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          background: '#fff', 
          padding: '40px', 
          borderRadius: '16px', 
          textAlign: 'center',
          maxWidth: '400px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <i className="ri-store-2-line" style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '16px', display: 'block' }}></i>
          <h2 style={{ color: '#1f2937', marginBottom: '12px' }}>Aucune boutique</h2>
          <p style={{ color: '#6b7280' }}>Aucune boutique n&apos;a été partagée.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      {/* Header */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto 32px',
        textAlign: 'center',
        color: '#fff'
      }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '12px', 
          marginBottom: '16px',
          background: 'rgba(255,255,255,0.1)',
          padding: '8px 16px',
          borderRadius: '50px'
        }}>
          <img src="/copyfy-logo-white.png" alt="Copyfy" style={{ height: '24px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span style={{ fontWeight: 600 }}>Copyfy</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
          Sélection partagée
        </h1>
        {data.user?.name && (
          <p style={{ opacity: 0.9 }}>
            Partagé par <strong>{data.user.name}</strong>
          </p>
        )}
        <p style={{ opacity: 0.7, fontSize: '14px' }}>
          {data.shops.length} boutique{data.shops.length > 1 ? 's' : ''} partagée{data.shops.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Shops Grid */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px'
      }}>
        {data.shops.map((shop) => (
          <div 
            key={shop.id}
            style={{
              background: '#fff',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
            }}
          >
            {/* Screenshot */}
            <div style={{ 
              height: '180px', 
              background: '#f3f4f6',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <img
                src={shop.screenshot 
                  ? `https://app.copyfy.io/download/products/screenshots/${shop.screenshot}`
                  : `https://image.thum.io/get/width/700/crop/360/${shop.url}`
                }
                alt={shop.name || shop.url}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('thum.io') && !target.src.includes('img_not_found')) {
                    target.src = `https://image.thum.io/get/width/700/crop/360/${shop.url}`;
                  } else if (!target.src.includes('img_not_found')) {
                    target.src = "/img_not_found.png";
                  }
                }}
              />
            </div>

            {/* Content */}
            <div style={{ padding: '20px' }}>
              {/* Shop Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <img 
                  src={`https://www.google.com/s2/favicons?domain=${shop.url}&sz=32`}
                  alt=""
                  style={{ width: '32px', height: '32px', borderRadius: '6px' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: '#1f2937',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {shop.name || shop.url}
                  </h3>
                  <a 
                    href={`https://${shop.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      fontSize: '13px', 
                      color: '#3b82f6', 
                      textDecoration: 'none'
                    }}
                  >
                    {shop.url}
                  </a>
                </div>
              </div>

              {/* Stats */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ 
                  background: '#f9fafb', 
                  padding: '12px', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Revenu mensuel</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                    {formatCurrency(shop.monthlyRevenue, shop.currency)}
                  </div>
                </div>
                <div style={{ 
                  background: '#f9fafb', 
                  padding: '12px', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Annonces actives</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                    {shop.activeAds || 0}
                  </div>
                </div>
              </div>

              {/* Countries */}
              {shop.countries && shop.countries.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {shop.countries.slice(0, 4).map((country, idx) => (
                    <div 
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#f3f4f6',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      <img 
                        src={`/flags/${country.code.toLowerCase()}.svg`}
                        alt={country.code}
                        style={{ width: '16px', height: '12px' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <span style={{ color: '#6b7280' }}>{country.value}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Visit Button */}
              <a
                href={`https://${shop.url}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: '16px',
                  padding: '12px',
                  background: '#3b82f6',
                  color: '#fff',
                  textAlign: 'center',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#2563eb'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#3b82f6'; }}
              >
                Visiter la boutique
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '48px auto 0',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.7)',
        fontSize: '14px'
      }}>
        <p>
          Découvrez les meilleures boutiques Shopify avec{' '}
          <a href="https://copyfy.io" style={{ color: '#fff', fontWeight: 500 }}>Copyfy</a>
        </p>
      </div>
    </div>
  );
}

