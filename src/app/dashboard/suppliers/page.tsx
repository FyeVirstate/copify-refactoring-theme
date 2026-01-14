"use client";

import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SuppliersPage() {
  const handleGetOffer = () => {
    window.open("https://www.autods.com/integrate/copyfy/", "_blank");
  };

  return (
    <>
      <DashboardHeader
        title="AutoDS"
        subtitle="Partenaire Officiel de Copyfy"
        icon="ri-truck-line"
        iconType="icon"
        showSearch={false}
        showStats={false}
      >
        {/* Fournisseur Button - Links to supplier profiles page */}
        <div className="d-flex align-items-center">
          <Link 
            href="/dashboard/suppliers/profiles"
            className="btn btn-secondary w-icon text-decoration-none"
          >
            <i className="ri-survey-line btn-icon-sm" style={{ fontSize: '16px', color: '#99a0ae' }}></i>
            <span className="text-gray">Fournisseur</span>
          </Link>
        </div>
      </DashboardHeader>

      <div className="bg-white home-content-wrapper">
        <div className="container-fluid px-2 px-md-4 py-5">

          {/* Main Content */}
          <div className="text-center mx-auto" style={{ maxWidth: '1000px', paddingBottom: '60px' }}>
            {/* AutoDS Logo + Title */}
            <div className="d-flex flex-column align-items-center mb-4">
              <img 
                src="/img/autods-logo.jpeg" 
                alt="AutoDS" 
                className="d-block mb-3 rounded-3"
                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
              />
              <h2 className="fw-600 mb-0" style={{ fontSize: 'clamp(18px, 5vw, 20px)', color: '#0E121B' }}>
                Envoyez vos produits avec AutoDS
              </h2>
            </div>

            {/* Video Section - Wistia */}
            <div className="video-wrapper mx-auto ratio ratio-16x9 mb-3">
              <div className="video-wrapper-subinner w-100 h-100">
                <div className="video-wrapper-inner w-100 h-100">
                  <div className="rounded-8 overflow-hidden w-100 h-100">
                    <iframe 
                      src="https://fast.wistia.net/embed/iframe/8zkvh7abe9" 
                      allowTransparency={true}
                      frameBorder={0}
                      scrolling="no"
                      allowFullScreen
                      className="w-100 h-100"
                      title="AutoDS Tutorial"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Source Text */}
            <p className="fs-small fw-500 mb-2" style={{ color: '#0E121B' }}>
              Sourcez n&apos;importe quel produit
            </p>
            <p className="fs-small mb-3" style={{ color: '#6B7280' }}>
              Profitez de l&apos;offre
            </p>

            {/* Benefits */}
            <div className="d-flex align-items-center justify-content-center gap-3 mb-4 flex-wrap">
              <div className="d-flex align-items-center gap-2">
                <svg width="16" height="20" viewBox="0 0 16 20" fill="none" className="flex-shrink-0">
                  <path d="M5 10L7.5 12.5L11 7.5M8 19C11.866 19 15 15.866 15 12C15 8.13401 11.866 5 8 5C4.13401 5 1 8.13401 1 12C1 15.866 4.13401 19 8 19Z" stroke="#0C6CFB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="small" style={{ color: '#6B7280' }}>
                  30 jours d&apos;essai pour 0.99$
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <svg width="16" height="20" viewBox="0 0 16 20" fill="none" className="flex-shrink-0">
                  <path d="M5 10L7.5 12.5L11 7.5M8 19C11.866 19 15 15.866 15 12C15 8.13401 11.866 5 8 5C4.13401 5 1 8.13401 1 12C1 15.866 4.13401 19 8 19Z" stroke="#0C6CFB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="small" style={{ color: '#6B7280' }}>
                  Expédition automatisée
                </span>
              </div>
            </div>

            {/* Steps Section */}
            <div className="mb-4">
              <h3 className="fw-600 mb-4" style={{ fontSize: '16px', color: '#0E121B' }}>
                Sourcez n&apos;importe quel produit en 3 étapes
              </h3>

              <div className="row mb-3 stepper-wrapper position-relative">
                <div className="col-md-4">
                  <div className="step-card text-center mx-auto" style={{ maxWidth: '220px' }}>
                    <div 
                      className="circled-icon"
                      style={{
                        width: '44px',
                        height: '44px',
                        textAlign: 'center',
                        backgroundColor: '#D7E5FF',
                        color: '#0C6CFB',
                        lineHeight: '44px',
                        borderRadius: '50%',
                        margin: 'auto',
                        marginBottom: '9px',
                        boxShadow: 'inset #B6D2FD 0px -4px 4px 0px'
                      }}
                    >
                      <span className="fw-bold">1</span>
                    </div>
                    <p className="text-center small fw-500 mb-0">
                      <a href="https://www.autods.com/integrate/copyfy/" target="_blank" rel="noopener noreferrer" style={{ color: '#0C6CFB' }}>S&apos;inscrire sur AutoDS</a> en cliquant sur le bouton ci-dessous
                    </p>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="step-card text-center mx-auto" style={{ maxWidth: '220px' }}>
                    <div 
                      className="circled-icon"
                      style={{
                        width: '44px',
                        height: '44px',
                        textAlign: 'center',
                        backgroundColor: '#D7E5FF',
                        color: '#0C6CFB',
                        lineHeight: '44px',
                        borderRadius: '50%',
                        margin: 'auto',
                        marginBottom: '9px',
                        boxShadow: 'inset #B6D2FD 0px -4px 4px 0px'
                      }}
                    >
                      <span className="fw-bold">2</span>
                    </div>
                    <p className="text-center small fw-500 mb-0">
                      <span style={{ color: '#0C6CFB' }}>Connectez votre boutique Shopify à votre</span> Compte AutoDS
                    </p>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="step-card text-center mx-auto" style={{ maxWidth: '220px' }}>
                    <div 
                      className="circled-icon"
                      style={{
                        width: '44px',
                        height: '44px',
                        textAlign: 'center',
                        backgroundColor: '#D7E5FF',
                        color: '#0C6CFB',
                        lineHeight: '44px',
                        borderRadius: '50%',
                        margin: 'auto',
                        marginBottom: '9px',
                        boxShadow: 'inset #B6D2FD 0px -4px 4px 0px'
                      }}
                    >
                      <span className="fw-bold">3</span>
                    </div>
                    <p className="text-center small fw-500 mb-0">
                      <span style={{ color: '#0C6CFB' }}>Sourcez n&apos;importe quel produit</span> et commencez à envoyer vos commandes automatiquement
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button - Centered */}
            <div className="d-flex justify-content-center mt-3">
              <Button
                onClick={handleGetOffer}
                className="btn btn-primary apply-filters-btn"
                style={{
                  fontSize: '15px',
                  fontWeight: 500,
                  padding: '12px 36px'
                }}
              >
                Profitez de l&apos;offre
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
