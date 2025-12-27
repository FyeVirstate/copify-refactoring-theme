"use client";
import { useState, useEffect } from "react";
import DashboardHeader from "@/components/DashboardHeader";
interface AffiliateData {
  isPromoter: boolean;
  signupUrl?: string;
  dashboardUrl?: string;
  promoterId?: number;
  user?: {
    email: string;
    name: string;
  };
  error?: string;
}
export default function AffiliatePage() {
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchAffiliateData = async () => {
      try {
        const response = await fetch('/api/affiliate');
        if (!response.ok) {
          throw new Error('Failed to fetch affiliate data');
        }
        const data = await response.json();
        setAffiliateData(data);
      } catch (err) {
        setError('Une erreur est survenue. Veuillez réessayer.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAffiliateData();
  }, []);
  if (loading) {
    return (
      <>
        <DashboardHeader
          title="Programme d'affiliation"
          icon="ri-user-star-line"
          iconType="icon"
          showStats={false}
        />
        <div className="bg-weak-50 min-vh-100">
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        </div>
      </>
    );
  }
  if (error) {
    return (
      <>
        <DashboardHeader
          title="Programme d'affiliation"
          icon="ri-user-star-line"
          iconType="icon"
          showStats={false}
        />
        <div className="bg-weak-50 min-vh-100">
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          </div>
        </div>
      </>
    );
  }
  // If user is already a promoter, show the dashboard
  if (affiliateData?.isPromoter && affiliateData.dashboardUrl) {
    return (
      <>
        <DashboardHeader
          title="Programme d'affiliation"
          icon="ri-user-star-line"
          iconType="icon"
          showStats={false}
        />
        <div className="bg-weak-50">
          <div 
            className="p-2 w-max-width-xl mx-auto"
          >
            <iframe
              src={affiliateData.dashboardUrl}
              width="100%"
              height="1150px"
              frameBorder="0"
              allow="clipboard-write"
              style={{ borderRadius: '12px' }}
              title="Tableau de bord affilié"
            />
          </div>
        </div>
      </>
    );
  }
  // If user is not a promoter, show the signup page
  return (
    <>
      <DashboardHeader
        title="Programme d'affiliation"
        icon="ri-user-star-line"
        iconType="icon"
        showStats={false}
      />
      <div className="bg-weak-50">
        <div 
          className="p-3 p-md-4 w-max-width-xl mx-auto"
        >
          {/* Header Section */}
          <div className="text-center mb-4">
            <h1 
              className="fs-2 fw-bold mb-3"
              style={{ color: '#1a1a2e' }}
            >
              Complétez votre inscription d&apos;affilié
            </h1>
            <p 
              className="text-muted mx-auto"
              style={{ maxWidth: '800px', fontSize: '1.05rem', lineHeight: '1.6' }}
            >
              Pour accéder au tableau de bord d&apos;affiliation, vous devez remplir le formulaire d&apos;inscription d&apos;affilié ci-dessous. 
              Cela nous aidera à mieux comprendre vos stratégies marketing et à vous offrir la meilleure expérience d&apos;affiliation possible.
            </p>
          </div>
          {/* Main Content - Two Columns */}
          <div 
            className="affiliate-signup-container"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '0',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 10px 60px rgba(0, 0, 0, 0.12)',
              background: '#fff',
            }}
          >
            {/* Left Side - Promotional Banner */}
            <div 
              className="affiliate-promo-section"
              style={{
                background: 'linear-gradient(145deg, #0066ff 0%, #0052cc 50%, #003d99 100%)',
                padding: '3rem 2.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '500px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Background Pattern */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0.1,
                  backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%),
                                    radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 40%)`,
                  pointerEvents: 'none',
                }}
              />
              {/* Logo */}
              <div 
                className="affiliate-logo"
                style={{ position: 'relative', zIndex: 1 }}
              >
                <div className="d-flex align-items-center gap-3">
                  <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm0 36c-8.837 0-16-7.163-16-16S11.163 4 20 4s16 7.163 16 16-7.163 16-16 16z" fill="white" fillOpacity="0.9"/>
                    <path d="M26.5 12.5c-1.5-1.5-3.5-2.5-6-2.5-5 0-9 4-9 9s4 9 9 9c2.5 0 4.5-1 6-2.5" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
                  </svg>
                  <span 
                    style={{ 
                      fontSize: '2rem', 
                      fontWeight: '600', 
                      color: 'white',
                      letterSpacing: '-0.5px'
                    }}
                  >
                    copyfy
                  </span>
                </div>
              </div>
              {/* Welcome Text */}
              <div 
                className="affiliate-welcome-text"
                style={{ position: 'relative', zIndex: 1, marginTop: '2rem' }}
              >
                <h2 
                  style={{ 
                    color: 'white', 
                    fontSize: '1.75rem', 
                    fontWeight: '600',
                    lineHeight: '1.4',
                    marginBottom: '0'
                  }}
                >
                  Bienvenue sur le<br />
                  programme Copyfy 30% à vie
                </h2>
              </div>
              {/* 3D Isometric Blocks Illustration */}
              <div 
                className="affiliate-illustration"
                style={{ 
                  position: 'relative', 
                  zIndex: 1, 
                  marginTop: 'auto',
                  paddingTop: '2rem'
                }}
              >
                <svg 
                  width="100%" 
                  height="200" 
                  viewBox="0 0 300 180" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ maxWidth: '280px' }}
                >
                  {/* First Block (Back left) */}
                  <g opacity="0.85">
                    <path d="M60 80L60 130L100 155L100 105L60 80Z" fill="#00D4AA"/>
                    <path d="M60 80L100 105L140 80L100 55L60 80Z" fill="#00F5C4"/>
                    <path d="M100 105L100 155L140 130L140 80L100 105Z" fill="#00B894"/>
                  </g>
                  {/* Second Block (Middle) */}
                  <g opacity="0.9">
                    <path d="M110 50L110 100L150 125L150 75L110 50Z" fill="#74B9FF"/>
                    <path d="M110 50L150 75L190 50L150 25L110 50Z" fill="#A8D8FF"/>
                    <path d="M150 75L150 125L190 100L190 50L150 75Z" fill="#0984E3"/>
                  </g>
                  {/* Third Block (Front right) */}
                  <g opacity="0.95">
                    <path d="M160 90L160 140L200 165L200 115L160 90Z" fill="#74B9FF"/>
                    <path d="M160 90L200 115L240 90L200 65L160 90Z" fill="#A8D8FF"/>
                    <path d="M200 115L200 165L240 140L240 90L200 115Z" fill="#0984E3"/>
                  </g>
                  {/* Small decorative block */}
                  <g opacity="0.7">
                    <path d="M200 40L200 70L225 85L225 55L200 40Z" fill="#00D4AA"/>
                    <path d="M200 40L225 55L250 40L225 25L200 40Z" fill="#00F5C4"/>
                    <path d="M225 55L225 85L250 70L250 40L225 55Z" fill="#00B894"/>
                  </g>
                </svg>
              </div>
            </div>
            {/* Right Side - Iframe Form */}
            <div 
              className="affiliate-form-section"
              style={{
                background: '#fff',
                minHeight: '500px',
              }}
            >
              {affiliateData?.signupUrl && (
                <iframe
                  src={affiliateData.signupUrl}
                  width="100%"
                  height="800"
                  frameBorder="0"
                  style={{ 
                    borderRadius: '0',
                    display: 'block',
                    minHeight: '700px',
                  }}
                  title="Formulaire d'inscription affilié"
                />
              )}
            </div>
          </div>
          {/* Additional Info Section */}
          <div 
            className="mt-5"
          >
            <div className="row g-4">
              {/* Benefit Card 1 */}
              <div className="col-md-4">
                <div 
                  className="p-4 h-100"
                  style={{ 
                    background: 'white', 
                    borderRadius: '12px',
                    border: '1px solid #eef1f6',
                  }}
                >
                  <div 
                    className="mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '48px', 
                      height: '48px', 
                      background: 'linear-gradient(135deg, #0066ff 0%, #0052cc 100%)',
                      borderRadius: '12px'
                    }}
                  >
                    <i className="ri-percent-line text-white" style={{ fontSize: '24px' }}></i>
                  </div>
                  <h4 className="fw-600 mb-2" style={{ fontSize: '1.1rem' }}>30% de commission à vie</h4>
                  <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                    Gagnez 30% des revenus récurrents mensuels à vie sur chaque vente.
                  </p>
                </div>
              </div>
              {/* Benefit Card 2 */}
              <div className="col-md-4">
                <div 
                  className="p-4 h-100"
                  style={{ 
                    background: 'white', 
                    borderRadius: '12px',
                    border: '1px solid #eef1f6',
                  }}
                >
                  <div 
                    className="mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '48px', 
                      height: '48px', 
                      background: 'linear-gradient(135deg, #00D4AA 0%, #00B894 100%)',
                      borderRadius: '12px'
                    }}
                  >
                    <i className="ri-money-euro-circle-line text-white" style={{ fontSize: '24px' }}></i>
                  </div>
                  <h4 className="fw-600 mb-2" style={{ fontSize: '1.1rem' }}>Paiements automatiques</h4>
                  <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                    Recevez vos commissions automatiquement chaque mois via PayPal.
                  </p>
                </div>
              </div>
              {/* Benefit Card 3 */}
              <div className="col-md-4">
                <div 
                  className="p-4 h-100"
                  style={{ 
                    background: 'white', 
                    borderRadius: '12px',
                    border: '1px solid #eef1f6',
                  }}
                >
                  <div 
                    className="mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '48px', 
                      height: '48px', 
                      background: 'linear-gradient(135deg, #6c5ce7 0%, #5b4cdb 100%)',
                      borderRadius: '12px'
                    }}
                  >
                    <i className="ri-line-chart-line text-white" style={{ fontSize: '24px' }}></i>
                  </div>
                  <h4 className="fw-600 mb-2" style={{ fontSize: '1.1rem' }}>Dashboard complet</h4>
                  <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                    Suivez vos performances, clics et revenus en temps réel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @media (max-width: 768px) {
          .affiliate-signup-container {
            grid-template-columns: 1fr !important;
          }
          .affiliate-promo-section {
            min-height: 350px !important;
            padding: 2rem 1.5rem !important;
          }
          .affiliate-welcome-text h2 {
            font-size: 1.5rem !important;
          }
        }
      `}</style>
    </>
  );
}
