"use client";

import { useState, useRef } from "react";

interface Ad {
  video_link?: string;
  video_preview_link?: string;
  image_link?: string;
  caption?: string;
  page_name?: string;
}

interface AdHoverCardProps {
  ad: Ad;
  onVideoClick?: (videoUrl: string, previewUrl: string) => void;
}

export default function AdHoverCard({ ad, onVideoClick }: AdHoverCardProps) {
  const [showPopup, setShowPopup] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowPopup(true);
  };

  const handleMouseLeave = () => {
    // Delay hiding so user can move to popup
    hideTimeoutRef.current = setTimeout(() => {
      setShowPopup(false);
    }, 150);
  };

  const previewImage = ad.video_preview_link || ad.image_link || '/img_not_found.png';
  const hasVideo = !!ad.video_link;

  return (
    <div 
      className="position-relative"
      style={{ display: 'inline-block' }}
    >
      {/* Thumbnail with play button */}
      <div 
        style={{ 
          width: '33px', 
          height: '60px', 
          cursor: 'pointer',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img 
          src={previewImage} 
          alt="Ad preview" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover'
          }} 
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/img_not_found.png';
          }}
        />
        {/* Play icon overlay */}
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
            <path d="M2 1.5L10 6L2 10.5V1.5Z" fill="white" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Popup Card - appears on hover */}
      {showPopup && (
        <div 
          className="bg-white shadow-lg rounded"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '8px',
            zIndex: 1000,
            width: '240px',
            padding: '12px',
            border: '1px solid #E1E4EA',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          }}
        >
          {/* Ad Preview Image/Video */}
          <div 
            style={{ 
              borderRadius: '8px', 
              overflow: 'hidden', 
              marginBottom: '12px',
              background: '#000',
              position: 'relative',
              cursor: hasVideo ? 'pointer' : 'default'
            }}
            onClick={() => {
              if (hasVideo && onVideoClick) {
                onVideoClick(ad.video_link!, previewImage);
              }
            }}
          >
            <img 
              src={previewImage} 
              alt="Ad"
              style={{ 
                width: '100%', 
                height: '180px', 
                objectFit: 'contain'
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/img_not_found.png';
              }}
            />
            {/* Large play button overlay for video */}
            {hasVideo && (
              <div 
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(59, 130, 246, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                  transition: 'transform 0.2s ease'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            )}
          </div>

          {/* Ad Caption */}
          {ad.caption && (
            <p style={{ 
              fontSize: '12px', 
              color: '#374151',
              margin: '0 0 12px 0',
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {ad.caption}
            </p>
          )}

          {/* Page name if available */}
          {ad.page_name && (
            <div style={{ 
              fontSize: '11px', 
              color: '#6B7280',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <i className="ri-store-2-line" style={{ fontSize: '12px' }}></i>
              {ad.page_name}
            </div>
          )}

          {/* View Video Button */}
          {hasVideo && (
            <button 
              onClick={() => {
                if (onVideoClick) {
                  onVideoClick(ad.video_link!, previewImage);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 500,
                textAlign: 'center',
                color: '#fff',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polygon points="5,3 19,12 5,21" />
              </svg>
              Voir la vidéo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
