"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  title?: string;
}

export default function VideoModal({ isOpen, onClose, videoId, title }: VideoModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(2, 13, 23, 0.5)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              zIndex: 9998,
            }}
          />

          {/* Modal Container - Centered with flexbox */}
          <div
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '0 1rem',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: -150 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { 
                  duration: 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94], // Smooth easeOutQuad
                }
              }}
              exit={{ 
                opacity: 0, 
                y: -150,
                transition: { 
                  duration: 0.25,
                  ease: [0.55, 0.09, 0.68, 0.53], // Smooth easeInQuad
                }
              }}
              style={{
                width: '100%',
                maxWidth: '730px',
                backgroundColor: '#000',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                aria-label="Close"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  zIndex: 10,
                }}
              />

              {/* Video - 16:9 ratio */}
              <div style={{ width: '100%', height: 0, paddingBottom: '57%', position: 'relative', backgroundColor: '#000' }}>
                <iframe
                  src={`https://fast.wistia.net/embed/iframe/${videoId}?seo=true&videoFoam=true&autoPlay=true`}
                  title={title || "Video"}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
