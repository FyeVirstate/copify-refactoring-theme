"use client";

import { motion } from "framer-motion";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";

export default function SuppliersPage() {
  const handleGetOffer = () => {
    window.open("https://autods.com/copyfy", "_blank");
  };

  return (
    <>
      <DashboardHeader
        title="AutoDS"
        subtitle="Partenaire Officiel de Copyfy"
        icon="ri-store-2-line"
        iconType="icon"
        showSearch={false}
        showStats={false}
      >
        {/* Fournisseur Button - Same style as Tutorial button */}
        <div className="d-flex align-items-center">
          <a 
            href="https://autods.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary w-icon text-decoration-none"
          >
            <i className="ri-external-link-line btn-icon-sm" style={{ fontSize: '16px', color: '#99a0ae' }}></i>
            <span className="text-gray">Fournisseur</span>
          </a>
        </div>
      </DashboardHeader>

      <div className="bg-white home-content-wrapper">
        <div className="container-fluid px-2 px-md-4 py-5">

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="text-center mx-auto"
            style={{ maxWidth: '1000px', paddingBottom: '60px' }}
          >
            {/* DS Logo + Title */}
            <div className="d-flex flex-column align-items-center mb-5">
              <div 
                className="d-flex align-items-center justify-content-center mb-3"
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: '#0E121B',
                  borderRadius: '12px'
                }}
              >
                <span style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 700 }}>DS</span>
              </div>
              <h2 className="fw-600 mb-0" style={{ fontSize: 'clamp(20px, 5vw, 24px)', color: '#0E121B' }}>
                Envoyez vos produits avec AutoDS
              </h2>
            </div>

            {/* Video Section - Wistia */}
            <div 
              className="video-wrapper mx-auto ratio ratio-16x9 mb-3"
              style={{ maxWidth: '650px' }}
            >
              <div className="video-wrapper-subinner w-100 h-100" style={{ padding: '6px', borderRadius: '14px', border: '1px solid #95c0ff' }}>
                <div className="video-wrapper-inner w-100 h-100" style={{ padding: '6px', borderRadius: '10px', border: '1px solid #0C6cfb' }}>
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
                <i className="ri-checkbox-circle-fill" style={{ color: '#10B981', fontSize: '16px' }}></i>
                <span className="small" style={{ color: '#6B7280' }}>
                  30 jours d&apos;essai pour 0.99$
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="ri-checkbox-circle-fill" style={{ color: '#10B981', fontSize: '16px' }}></i>
                <span className="small" style={{ color: '#6B7280' }}>
                  Expédition automatisée
                </span>
              </div>
            </div>

            {/* Steps Section */}
            <div className="mb-4">
              <h3 className="fw-600 mb-4" style={{ fontSize: '18px', color: '#0E121B' }}>
                Sourcez n&apos;importe quel produit en 3 étapes
              </h3>

              <div className="row mb-3 stepper-wrapper position-relative">
                <div className="col-md-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                    className="step-card text-center mx-auto"
                  >
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
                      <span style={{ color: '#0C6CFB' }}>S&apos;inscrire sur AutoDS</span> en cliquant sur le bouton ci-dessous
                    </p>
                  </motion.div>
                </div>

                <div className="col-md-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                    className="step-card text-center mx-auto"
                  >
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
                  </motion.div>
                </div>

                <div className="col-md-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                    className="step-card text-center mx-auto"
                  >
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
                  </motion.div>
                </div>
              </div>
            </div>

            {/* CTA Button - Centered */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
              className="d-flex justify-content-center mt-3"
            >
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
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
