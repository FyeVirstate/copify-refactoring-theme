"use client";

import { motion } from "framer-motion";
import DashboardHeader from "@/components/DashboardHeader";

export default function HireCreatorPage() {
  const videos = [
    {
      id: 1,
      url: "https://development.copyfy.io/videos/creative-video-1.mp4",
      thumbnail: "https://development.copyfy.io/videos/creative-video-1.mp4"
    },
    {
      id: 2,
      url: "https://development.copyfy.io/videos/creative-video-2.mp4",
      thumbnail: "https://development.copyfy.io/videos/creative-video-2.mp4"
    },
    {
      id: 3,
      url: "https://development.copyfy.io/videos/creative-video-3.mp4",
      thumbnail: "https://development.copyfy.io/videos/creative-video-3.mp4"
    }
  ];

  const handleOrderCreatives = () => {
    window.open("https://eliteagency.copyfy.io/", "_blank");
  };

  return (
    <>
      <DashboardHeader
        title="Recrutez un Créateur de Créatives"
        subtitle="Découvrez notre Partenaire pour créer vos créatives"
        icon="ri-lightbulb-flash-line"
        iconType="icon"
        showSearch={false}
        showStats={false}
      />

      <div className="bg-white home-content-wrapper">
        <div className="container-fluid px-2 px-md-4 py-5">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center mx-auto"
            style={{ maxWidth: '1100px', paddingBottom: '60px' }}
          >
            {/* Main Title */}
            <h2 className="fw-600 mb-3" style={{ fontSize: 'clamp(20px, 5vw, 24px)', color: '#0E121B' }}>
              Créez vos Créatives avec notre Partenaire Elite Agency !
            </h2>
            
            <p className="fs-small mb-4" style={{ color: '#6B7280' }}>
              Voici des exemples de leur réalisation :
            </p>

            {/* Videos Grid */}
            <div className="d-flex justify-content-center gap-3 flex-wrap mb-4 hire-video-grid">
              {videos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 + (index * 0.1), ease: "easeOut" }}
                  style={{ maxWidth: '220px', width: '100%' }}
                >
                  <div 
                    className="position-relative"
                    style={{
                      borderRadius: '10px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                      backgroundColor: '#000'
                    }}
                  >
                    <video
                      controls
                      preload="metadata"
                      style={{
                        width: '100%',
                        height: '380px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    >
                      <source src={video.url} type="video/mp4" />
                    </video>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Description */}
            <p className="fs-small mb-1" style={{ color: '#0E121B', fontWeight: 500 }}>
              Créez vos créatives pour n&apos;importe quel produit
            </p>
            <p className="fs-small mb-3" style={{ color: '#6B7280' }}>
              Offre spéciale pour les membres de Copyfy
            </p>

            {/* Pricing */}
            <div className="d-flex justify-content-center gap-3 flex-wrap mb-4">
              <div className="d-flex align-items-center gap-2">
                <i className="ri-checkbox-circle-fill" style={{ color: '#10B981', fontSize: '16px' }}></i>
                <span className="small" style={{ color: '#6B7280' }}>
                  Tiktok / Snapchat Ads - Pack de 3 créatives <strong>70€</strong>
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="ri-checkbox-circle-fill" style={{ color: '#10B981', fontSize: '16px' }}></i>
                <span className="small" style={{ color: '#6B7280' }}>
                  Facebook Ads - Pack de 3 créatives <strong>100€</strong>
                </span>
              </div>
            </div>

            {/* Steps Section */}
            <div className="mb-4">
              <h3 className="fw-600 mb-4" style={{ fontSize: '18px', color: '#0E121B' }}>
                Voici comment ça marche
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
                      <span style={{ color: '#0C6CFB' }}>Sélectionnez le format</span> ( Images, Vidéos, Carrousel )
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
                      <span style={{ color: '#0C6CFB' }}>Transmettez le briefing</span> Votre texte, votre Offre Marketing, toutes demande spécifiques
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
                      <span style={{ color: '#0C6CFB' }}>Valider et payer</span> ( Une prévisualisation sera envoyer avant l&apos;envoie définitif )
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* CTA Button - Centered & Large */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
              className="d-flex justify-content-center mt-3"
            >
              <button
                onClick={handleOrderCreatives}
                className="btn btn-primary apply-filters-btn"
                style={{
                  fontSize: '15px',
                  fontWeight: 500,
                  padding: '12px 36px'
                }}
              >
                Je veux commander des créatives
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

