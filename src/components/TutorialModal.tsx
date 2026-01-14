"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useRef } from "react";

export interface TutorialConfig {
  title: string;
  highlightedWord: string;
  description: string;
  videoId: string;
}

// Tutorial configurations for each page
export const TUTORIAL_CONFIGS: Record<string, TutorialConfig> = {
  shops: {
    title: "Top",
    highlightedWord: "Boutiques",
    description: "Découvrez comment utiliser la page Top Boutiques pour trouver les meilleures boutiques e-commerce.",
    videoId: "5a0cq5m268", // French version
  },
  products: {
    title: "Top",
    highlightedWord: "Produits",
    description: "Découvrez comment utiliser la page Top Produits pour trouver les produits gagnants.",
    videoId: "llh7r5ik3a", // French version
  },
  ads: {
    title: "Top",
    highlightedWord: "Publicités",
    description: "Découvrez comment utiliser la page Top Publicités pour analyser les meilleures publicités.",
    videoId: "8tielcug1q", // French version
  },
};

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TutorialConfig;
}

export default function TutorialModal({ isOpen, onClose, config }: TutorialModalProps) {
  const wistiaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && config.videoId) {
      // Load Wistia scripts dynamically
      const script1 = document.createElement("script");
      script1.src = `https://fast.wistia.com/embed/medias/${config.videoId}.jsonp`;
      script1.async = true;

      const script2 = document.createElement("script");
      script2.src = "https://fast.wistia.com/assets/external/E-v1.js";
      script2.async = true;

      document.head.appendChild(script1);
      document.head.appendChild(script2);

      return () => {
        // Cleanup scripts when modal closes
        document.head.removeChild(script1);
        document.head.removeChild(script2);
      };
    }
  }, [isOpen, config.videoId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-[700px] p-0 overflow-hidden"
        style={{ 
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: 'none',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <DialogTitle className="sr-only">{config.title} {config.highlightedWord}</DialogTitle>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="position-absolute d-flex align-items-center justify-content-center"
          style={{
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#f3f4f6',
            border: 'none',
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          <i className="ri-close-line" style={{ fontSize: '18px', color: '#6b7280' }}></i>
        </button>

        {/* Modal Content */}
        <div className="text-center p-4 pb-0">
          {/* Logo */}
          <img 
            src="/img/text-logo-new.svg" 
            alt="Copyfy" 
            className="mb-4"
            style={{ 
              height: '28px',
              filter: 'brightness(0)',
            }} 
          />
          
          {/* Title */}
          <h2 className="mb-3" style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a2e' }}>
            {config.title} <span style={{ color: '#0c6cfb' }}>{config.highlightedWord}</span>!
          </h2>
          
          {/* Description */}
          <p className="mb-4" style={{ fontSize: '14px', color: '#6b7280', maxWidth: '500px', margin: '0 auto 24px' }}>
            {config.description}
          </p>
        </div>

        {/* Wistia Video Embed */}
        <div className="px-4 pb-4">
          <div 
            ref={wistiaContainerRef}
            className={`wistia_embed wistia_async_${config.videoId}`}
            style={{ 
              width: '100%',
              height: '349px',
              maxWidth: '100%',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#000',
            }}
          >
            &nbsp;
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
