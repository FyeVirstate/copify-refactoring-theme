"use client";

// Pre-generated widths to avoid hydration mismatch
const PRODUCT_TITLE_WIDTHS = [160, 180, 200, 170, 190, 155, 195, 175, 185, 165];
const PRODUCT_SUBTITLE_WIDTHS = [90, 100, 85, 95, 88, 92, 98, 105, 87, 93];
const SHOP_NAME_WIDTHS = [120, 140, 130, 110, 145, 125, 135, 115, 150, 128];
const SHOP_SUBTITLE_WIDTHS = [70, 80, 65, 75, 72, 78, 68, 82, 74, 76];
const REVENUE_WIDTHS = [70, 85, 75, 90, 80, 72, 88, 78, 82, 76];
const PRICE_WIDTHS = [50, 60, 55, 65, 58, 52, 62, 56, 64, 54];
const ADS_WIDTHS = [35, 45, 40, 50, 42, 38, 48, 44, 36, 46];

export default function ProductTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="table-wrapper" style={{ paddingBottom: '20px', overflowX: 'auto' }}>
      <table className="table mb-0" style={{ width: '100%' }}>
        <tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <tr 
              key={index} 
              className="border-bottom"
            >
              {/* Product Column */}
              <td className="align-middle py-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
                <div className="d-flex align-items-center gap-3">
                  <div 
                    className="skeleton-shimmer" 
                    style={{ 
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '8px',
                      flexShrink: 0
                    }}
                  ></div>
                  <div>
                    <div 
                      className="skeleton-shimmer" 
                      style={{ 
                        width: `${PRODUCT_TITLE_WIDTHS[index % 10]}px`, 
                        height: '14px', 
                        borderRadius: '4px',
                        marginBottom: '8px'
                      }}
                    ></div>
                    <div 
                      className="skeleton-shimmer" 
                      style={{ 
                        width: `${PRODUCT_SUBTITLE_WIDTHS[index % 10]}px`, 
                        height: '11px', 
                        borderRadius: '4px'
                      }}
                    ></div>
                  </div>
                </div>
              </td>

              {/* Shop Column */}
              <td className="align-middle py-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
                <div className="d-flex align-items-center gap-2">
                  <div 
                    className="skeleton-shimmer" 
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '8px',
                      flexShrink: 0
                    }}
                  ></div>
                  <div>
                    <div 
                      className="skeleton-shimmer" 
                      style={{ 
                        width: `${SHOP_NAME_WIDTHS[index % 10]}px`, 
                        height: '13px', 
                        borderRadius: '4px',
                        marginBottom: '6px'
                      }}
                    ></div>
                    <div 
                      className="skeleton-shimmer" 
                      style={{ 
                        width: `${SHOP_SUBTITLE_WIDTHS[index % 10]}px`, 
                        height: '10px', 
                        borderRadius: '4px'
                      }}
                    ></div>
                  </div>
                </div>
              </td>

              {/* Revenue Column */}
              <td className="align-middle py-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
                <div 
                  className="skeleton-shimmer" 
                  style={{ 
                    width: `${REVENUE_WIDTHS[index % 10]}px`, 
                    height: '14px', 
                    borderRadius: '4px'
                  }}
                ></div>
              </td>

              {/* Price Column */}
              <td className="align-middle py-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
                <div 
                  className="skeleton-shimmer" 
                  style={{ 
                    width: `${PRICE_WIDTHS[index % 10]}px`, 
                    height: '14px', 
                    borderRadius: '4px'
                  }}
                ></div>
              </td>

              {/* Active Ads Column */}
              <td className="align-middle py-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
                <div 
                  className="skeleton-shimmer" 
                  style={{ 
                    width: `${ADS_WIDTHS[index % 10]}px`, 
                    height: '14px', 
                    borderRadius: '4px'
                  }}
                ></div>
              </td>

              {/* Action Column */}
              <td className="align-middle py-3 text-end" style={{ borderBottom: '1px solid #f0f0f0' }}>
                <div 
                  className="skeleton-shimmer" 
                  style={{ 
                    width: '90px', 
                    height: '32px', 
                    borderRadius: '6px',
                    marginLeft: 'auto'
                  }}
                ></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

