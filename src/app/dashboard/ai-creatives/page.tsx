"use client";

import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AICreativesPage() {
  const [productUrl, setProductUrl] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  // Mock generated videos
  const mockVideos = [
    {
      id: 1,
      title: "Blinded Product Video",
      status: "Terminé",
      createdAt: "Il y a 5 jours",
      videoUrl: "https://copyfycloudinary.s3.us-east-2.amazonaws.com/ads/1570543367645109/126683fd-8788-4954-9043-62d7ee8d24a8.mp4",
      thumbnail: "https://copyfycloudinary.s3.us-east-2.amazonaws.com/ads/1570543367645109/126683fd-8788-4954-9043-62d7ee8d24a8.mp4",
    },
  ];

  const handleGenerate = () => {
    console.log("Generating creative for:", productUrl, "in language:", selectedLanguage);
  };

  return (
    <>
      <DashboardHeader
        title="Génération Créative avec IA"
        subtitle="Générez du contenu créatif avec l'IA"
        showTutorialButton={false}
        icon="ri-video-add-line"
        iconType="icon"
        showStats={false}
      >
        {/* Custom Stats - Video Generation Credits */}
        <div          className="progress-circle d-flex gap-2 flex-row" 
          data-progress="2" 
          data-total="2"
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
                strokeDasharray="75" 
                strokeDashoffset="0"
              ></circle>
            </svg>
          </div>
          <div className="progress-details">
            <div className="progress-text">2/2</div>
            <div className="progress-label">Crédits de Génération de Vidéo</div>
          </div>
        </div>
      </DashboardHeader>

      <div className="bg-white home-content-wrapper">
        <div className="container-fluid px-2 px-md-4 py-5">
          
          {/* Hero Section */}
          <div            className="ai-creative-hero-section text-center mx-auto mt-20"
            style={{ maxWidth: '500px', marginBottom: '60px' }}
          >
            <h2 className="fw-500 " style={{ fontSize: 'clamp(20px, 5vw, 24px)', color: '#0E121B' }}>
              Copyfy | Génération Créative avec IA
            </h2>
            <p className="text-sub" style={{ fontSize: '16px', lineHeight: '1.6' }}>
              Transformez le lien de votre produit en publicité générée par IA.
              Collez le lien de votre page produit ci-dessous et obtenez 1 vidéo
              publicitaires pour Meta/Tiktok
            </p>
          </div>

          {/* Input Section - Outside of text container for full width */}
          <div            className="ai-creative-input-section mx-auto"
          >
            <Input
              type="text"
              className="ai-creative-url-input form-control design-2"
              placeholder="https://[mystore.com]/products/[product]"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
            />

            <select
              className="ai-creative-lang-select form-select design-2"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              <option value="en">Anglais</option>
              <option value="fr">Français</option>
              <option value="es">Espagnol</option>
              <option value="de">Allemand</option>
              <option value="it">Italien</option>
              <option value="pt">Portugais</option>
            </select>

            <Button
              onClick={handleGenerate}
              className="ai-creative-generate-btn btn btn-primary"
            >
              <i className="ri-sparkling-line me-2"></i>
              Générer
            </Button>
          </div>

          {/* Videos Section - Wider container */}
          <div            className="ai-creative-videos-section mx-auto"
          >
            <h2 className="fs-normal fw-600 mb-4">Vos Vidéos Créatives</h2>

            {mockVideos.length > 0 ? (
              <div className="ai-creative-videos-grid">
                {mockVideos.map((video, index) => (
                  <div
                    key={video.id}
                    
                    
                    
                    className="ai-creative-video-card bg-white rounded-8 border-gray overflow-hidden"
                  >
                    {/* Video Preview */}
                    <div className="ai-creative-video-preview position-relative">
                      <video
                        className="w-100 h-100"
                        style={{ objectFit: 'cover' }}
                        preload="metadata"
                        controls
                      >
                        <source src={video.videoUrl} type="video/mp4" />
                      </video>
                      
                      {/* Download Button */}
                      <button
                        type="button"
                        className="ai-creative-download-btn btn border-white bg-white rounded-8 border position-absolute"
                        title="Télécharger la vidéo"
                      >
                        <i className="ri-download-2-fill" style={{ fontSize: '14px' }}></i>
                      </button>
                    </div>

                    {/* Video Info */}
                    <div className="p-3">
                      <div className="d-flex align-items-start justify-content-between mb-1">
                        <h4 className="fs-small fw-600 mb-0">{video.title}</h4>
                        <span className="badge bg-success text-white fs-xs px-2" style={{ fontSize: '10px' }}>
                          {video.status}
                        </span>
                      </div>
                      <p className="fs-xs text-sub mb-0">{video.createdAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <div className="mb-3" style={{ fontSize: '48px', opacity: 0.3 }}>
                  🎬
                </div>
                <p className="text-sub fs-normal">
                  Aucune vidéo générée pour le moment.<br />
                  Collez un lien produit ci-dessus pour commencer !
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

