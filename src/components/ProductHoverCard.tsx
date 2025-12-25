"use client";

import { useState, useRef } from "react";

interface Product {
  name: string;
  image: string;
  price?: number;
  currency?: string;
}

interface ProductHoverCardProps {
  product: Product;
  productUrl?: string;
}

// Format price with currency symbol
const formatPrice = (price: number, currency?: string): string => {
  const currencySymbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'CA$',
    'AUD': 'A$',
    'CHF': 'CHF ',
    'JPY': '¥',
    'CNY': '¥',
    'INR': '₹',
    'BRL': 'R$',
    'MXN': 'MX$',
    'KRW': '₩',
    'SEK': 'kr ',
    'NOK': 'kr ',
    'DKK': 'kr ',
    'PLN': 'zł ',
    'RUB': '₽',
    'TRY': '₺',
    'ZAR': 'R ',
    'NZD': 'NZ$',
    'SGD': 'S$',
    'HKD': 'HK$',
    'THB': '฿',
    'MYR': 'RM ',
    'PHP': '₱',
    'IDR': 'Rp ',
    'VND': '₫',
    'AED': 'AED ',
    'SAR': 'SAR ',
  };

  const symbol = currency ? (currencySymbols[currency.toUpperCase()] || currency + ' ') : '';
  
  // For currencies where symbol comes after (like EUR in some locales)
  const symbolAfter = ['EUR', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF'];
  
  if (currency && symbolAfter.includes(currency.toUpperCase())) {
    return `${price.toLocaleString()}${symbol.trim() === '€' ? '€' : ' ' + symbol.trim()}`;
  }
  
  return `${symbol}${price.toLocaleString()}`;
};

export default function ProductHoverCard({ product, productUrl }: ProductHoverCardProps) {
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

  return (
    <div 
      className="position-relative"
      style={{ display: 'inline-block' }}
    >
      {/* Just the image thumbnail - no overlay on hover */}
      <div 
        style={{ 
          width: '50px', 
          height: '50px', 
          cursor: 'pointer',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #E5E7EB'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img 
          src={product.image} 
          alt={product.name} 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover'
          }} 
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/img_not_found.png';
          }}
        />
      </div>

      {/* Popup Card - appears on hover, stays when hovering popup */}
      {showPopup && (
        <div 
          className="bg-white shadow-lg rounded"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'absolute',
            top: '100%', // Positioned below the thumbnail
            left: '0', // Aligned to the left edge of the image
            marginTop: '4px',
            zIndex: 1000,
            width: '200px',
            padding: '12px',
            border: '1px solid #E1E4EA',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          }}
        >
          {/* Product Image */}
          <div style={{ 
            borderRadius: '8px', 
            overflow: 'hidden', 
            marginBottom: '12px',
            background: '#f9fafb'
          }}>
            <img 
              src={product.image} 
              alt={product.name}
              style={{ 
                width: '100%', 
                height: '160px', 
                objectFit: 'contain'
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/img_not_found.png';
              }}
            />
          </div>

          {/* Product Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <h4 style={{ 
              fontSize: '13px', 
              fontWeight: 500, 
              margin: 0,
              lineHeight: '1.3',
              flex: 1,
              paddingRight: '8px'
            }}>
              {product.name}
            </h4>
            {product.price && (
              <span style={{ 
                fontSize: '13px', 
                fontWeight: 600,
                color: '#374151',
                whiteSpace: 'nowrap'
              }}>
                {formatPrice(product.price, product.currency)}
              </span>
            )}
          </div>

          {/* View Product Button - Blue with eye icon */}
          <a 
            href={productUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
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
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Voir le produit
          </a>
        </div>
      )}
    </div>
  );
}

