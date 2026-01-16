"use client"

import React, { useState, useCallback } from 'react'

interface AliExpressItem {
  item: {
    itemId: string
    title: string
    itemUrl: string
    image: string
    sales?: string | number
    sku: {
      def: {
        promotionPrice: string
        price: string
      }
    }
    trade?: {
      tradeDesc?: string
    }
  }
  calculatedProfit?: string
  profitPercentage?: string
}

interface AliExpressSearchModalProps {
  isOpen: boolean
  onClose: () => void
  productImageUrl: string
  productPrice: number
  productTitle?: string
}

export default function AliExpressSearchModal({
  isOpen,
  onClose,
  productImageUrl,
  productPrice,
  productTitle,
}: AliExpressSearchModalProps) {
  const [items, setItems] = useState<AliExpressItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const searchProducts = useCallback(async () => {
    if (!productImageUrl) return

    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      // Clean the image URL (remove query params)
      const cleanImageUrl = productImageUrl.split('?')[0]

      const response = await fetch('/api/search/aliexpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: cleanImageUrl,
          price: productPrice,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setItems(data.items || [])
      } else {
        setError(data.error || 'Une erreur est survenue')
      }
    } catch (err) {
      setError('Impossible de rechercher les produits')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }, [productImageUrl, productPrice])

  // Trigger search when modal opens
  React.useEffect(() => {
    if (isOpen && productImageUrl && !hasSearched) {
      searchProducts()
    }
  }, [isOpen, productImageUrl, hasSearched, searchProducts])

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setItems([])
      setHasSearched(false)
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const formatPrice = (priceStr: string | undefined) => {
    if (!priceStr) return '—'
    const price = parseFloat(priceStr)
    return isNaN(price) ? '—' : `$${price.toFixed(2)}`
  }

  const formatSales = (sales: string | number | undefined) => {
    if (sales === undefined || sales === null || sales === '') return '—'
    // If it's a number, format it directly
    if (typeof sales === 'number') {
      return sales.toLocaleString('fr-FR')
    }
    // If it's a string, try to format it
    const salesStr = String(sales)
    // Extract number from strings like "10000+ vendus" or just "10000"
    const match = salesStr.match(/(\d+[\d,]*)/)?.[1]
    if (match) {
      const num = parseInt(match.replace(/,/g, ''), 10)
      return isNaN(num) ? salesStr : num.toLocaleString('fr-FR')
    }
    return salesStr
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1050,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#fff',
          borderRadius: 16,
          maxWidth: 900,
          width: '95%',
          maxHeight: '85vh',
          zIndex: 1051,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <h5 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            Trouver votre produit sur AliExpress
          </h5>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#6B7280',
              padding: 4,
            }}
          >
            <i className="ri-close-line"></i>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {/* Loading skeleton */}
          {loading && (
            <div className="table-responsive">
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F5F7FA' }}>
                    <th style={{ width: 70 }}>&nbsp;</th>
                    <th><span className="text-sub fs-small fw-500">Nom du produit</span></th>
                    <th className="text-center"><span className="text-sub fs-small fw-500">Prix</span></th>
                    <th className="text-center"><span className="text-sub fs-small fw-500">Profit</span></th>
                    <th className="text-center"><span className="text-sub fs-small fw-500">Ventes</span></th>
                    <th>&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i}>
                      <td>
                        <div
                          style={{
                            width: 60,
                            height: 60,
                            backgroundColor: '#E5E7EB',
                            borderRadius: 8,
                            animation: 'pulse 1.5s ease-in-out infinite',
                          }}
                        />
                      </td>
                      <td style={{ width: '35%' }}>
                        <div
                          style={{
                            height: 16,
                            backgroundColor: '#E5E7EB',
                            borderRadius: 4,
                            width: '75%',
                            animation: 'pulse 1.5s ease-in-out infinite',
                          }}
                        />
                      </td>
                      <td>
                        <div
                          style={{
                            height: 16,
                            backgroundColor: '#E5E7EB',
                            borderRadius: 4,
                            width: '50%',
                            margin: '0 auto',
                            animation: 'pulse 1.5s ease-in-out infinite',
                          }}
                        />
                      </td>
                      <td>
                        <div
                          style={{
                            height: 16,
                            backgroundColor: '#E5E7EB',
                            borderRadius: 4,
                            width: '50%',
                            margin: '0 auto',
                            animation: 'pulse 1.5s ease-in-out infinite',
                          }}
                        />
                      </td>
                      <td>
                        <div
                          style={{
                            height: 16,
                            backgroundColor: '#E5E7EB',
                            borderRadius: 4,
                            width: '50%',
                            margin: '0 auto',
                            animation: 'pulse 1.5s ease-in-out infinite',
                          }}
                        />
                      </td>
                      <td>
                        <div
                          style={{
                            height: 32,
                            backgroundColor: '#E5E7EB',
                            borderRadius: 4,
                            width: 80,
                            animation: 'pulse 1.5s ease-in-out infinite',
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div
              style={{
                textAlign: 'center',
                padding: 40,
                color: '#EF4444',
              }}
            >
              <i className="ri-error-warning-line" style={{ fontSize: 48 }}></i>
              <p style={{ marginTop: 16 }}>{error}</p>
              <button
                onClick={searchProducts}
                className="btn btn-primary"
                style={{ marginTop: 16 }}
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Results */}
          {!loading && !error && items.length > 0 && (
            <div className="table-responsive">
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F5F7FA' }}>
                    <th style={{ width: 70 }}>&nbsp;</th>
                    <th><span className="text-sub fs-small fw-500">Nom du produit</span></th>
                    <th className="text-center"><span className="text-sub fs-small fw-500">Prix</span></th>
                    <th className="text-center"><span className="text-sub fs-small fw-500">Profit</span></th>
                    <th className="text-center"><span className="text-sub fs-small fw-500">Ventes</span></th>
                    <th>&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.item?.itemId || index}>
                      <td style={{ verticalAlign: 'middle' }}>
                        <img
                          src={item.item?.image || '/img_not_found.png'}
                          alt={item.item?.title || 'Product'}
                          style={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: '1px solid #E5E7EB',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/img_not_found.png'
                          }}
                        />
                      </td>
                      <td style={{ verticalAlign: 'middle', maxWidth: 300 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            color: '#111827',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {item.item?.title || '—'}
                        </p>
                      </td>
                      <td
                        style={{
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          fontWeight: 600,
                          color: '#111827',
                        }}
                      >
                        {formatPrice(item.item?.sku?.def?.promotionPrice || item.item?.sku?.def?.price)}
                      </td>
                      <td
                        style={{
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          fontWeight: 600,
                          color: item.calculatedProfit && parseFloat(item.calculatedProfit) > 0 ? '#10B981' : '#EF4444',
                        }}
                      >
                        {item.calculatedProfit ? (
                          <>
                            ${item.calculatedProfit}
                            <span style={{ fontSize: 11, marginLeft: 4, opacity: 0.8 }}>
                              ({item.profitPercentage})
                            </span>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td
                        style={{
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          color: '#6B7280',
                        }}
                      >
                        {formatSales(item.item?.sales)}
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <a
                          href={item.item?.itemUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 13,
                            padding: '8px 12px',
                          }}
                        >
                          <img
                            src="/img/icons/aliexpress-icon.png"
                            alt=""
                            style={{ width: 16, height: 16 }}
                          />
                          Voir
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* No results */}
          {!loading && !error && hasSearched && items.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: 40,
                color: '#6B7280',
              }}
            >
              <i className="ri-search-line" style={{ fontSize: 48 }}></i>
              <p style={{ marginTop: 16 }}>Aucun produit trouvé</p>
            </div>
          )}
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  )
}
