"use client";

import { useState, useEffect } from "react";

interface DebugPanelProps {
  type: "ads" | "shops" | "products";
  data: any[];
  pagination?: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
    hasMore?: boolean;
  };
  filters?: Record<string, any>;
  isLoading?: boolean;
  isFetching?: boolean;
  error?: string | null;
  timings?: {
    totalMs?: number;
    authMs?: number;
    mainQueryMs?: number;
    countQueryMs?: number;
  };
}

export default function DebugPanel({
  type,
  data,
  pagination,
  filters = {},
  isLoading,
  isFetching,
  error,
  timings,
}: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "filters" | "data" | "fields" | "analysis" | "raw">("overview");
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  // Calculate active filters (exclude default values)
  const activeFilters = Object.entries(filters).filter(([key, value]) => {
    if (value === undefined || value === null || value === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    // Don't count these as "active" filters
    if (key === "sortBy" && value === "recommended") return false;
    if (key === "sortOrder" && value === "desc") return false;
    if (key === "status" && value === "all") return false;
    if (key === "mediaType" && !value) return false;
    return true;
  });

  // Extract all unique field names from data
  const allFields = data.length > 0 
    ? [...new Set(data.flatMap(item => Object.keys(item)))]
    : [];

  // Data analysis for ads
  const adsAnalysis = type === "ads" ? {
    // CTA Distribution
    ctaDistribution: data.reduce((acc: Record<string, number>, ad: any) => {
      const cta = ad.ctaText || "N/A";
      acc[cta] = (acc[cta] || 0) + 1;
      return acc;
    }, {}),
    
    // Media Type Distribution
    mediaDistribution: data.reduce((acc: Record<string, number>, ad: any) => {
      const mediaType = ad.mediaType || "unknown";
      acc[mediaType] = (acc[mediaType] || 0) + 1;
      return acc;
    }, {}),
    
    // Platform Distribution
    platformDistribution: data.reduce((acc: Record<string, number>, ad: any) => {
      const platform = ad.platform || "unknown";
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {}),
    
    // Status Distribution
    statusDistribution: data.reduce((acc: Record<string, number>, ad: any) => {
      const status = ad.status || (ad.isActive ? "active" : "inactive");
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}),
    
    // Shop Countries
    countryDistribution: data.reduce((acc: Record<string, number>, ad: any) => {
      const country = ad.shopCountry || "unknown";
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {}),
    
    // Traffic Metrics
    trafficStats: {
      withTraffic: data.filter((ad: any) => ad.lastMonthVisits > 0).length,
      avgTraffic: data.length > 0 
        ? Math.round(data.reduce((sum: number, ad: any) => sum + (ad.lastMonthVisits || 0), 0) / data.length)
        : 0,
      maxTraffic: Math.max(...data.map((ad: any) => ad.lastMonthVisits || 0), 0),
      withGrowth: data.filter((ad: any) => ad.growthRate > 0).length,
      avgGrowth: data.length > 0
        ? (data.reduce((sum: number, ad: any) => sum + (ad.growthRate || 0), 0) / data.length).toFixed(1)
        : "0",
    },
    
    // Active Days Stats
    activeDaysStats: {
      avg: data.length > 0
        ? Math.round(data.reduce((sum: number, ad: any) => sum + (ad.activeDays || 0), 0) / data.length)
        : 0,
      min: Math.min(...data.map((ad: any) => ad.activeDays || 0).filter(d => d > 0), 0),
      max: Math.max(...data.map((ad: any) => ad.activeDays || 0), 0),
    },
    
    // Shop Stats
    shopStats: {
      uniqueShops: new Set(data.map((ad: any) => ad.shopId)).size,
      avgActiveAds: data.length > 0
        ? Math.round(data.reduce((sum: number, ad: any) => sum + (ad.shopActiveAds || 0), 0) / data.length)
        : 0,
    },
    
    // Media presence
    mediaStats: {
      withImage: data.filter((ad: any) => ad.imageLink && ad.imageLink !== "").length,
      withVideo: data.filter((ad: any) => ad.videoUrl && ad.videoUrl !== "").length,
      withVideoPreview: data.filter((ad: any) => ad.videoPreview && ad.videoPreview !== "").length,
      withTargetUrl: data.filter((ad: any) => ad.targetUrl && ad.targetUrl !== "").length,
      noMedia: data.filter((ad: any) => 
        (!ad.imageLink || ad.imageLink === "") && 
        (!ad.videoUrl || ad.videoUrl === "")
      ).length,
    },
  } : null;

  // Selected item for detailed view
  const selectedItem = data[selectedItemIndex] || null;

  const panelWidth = isExpanded ? "700px" : "480px";
  const panelHeight = isExpanded ? "85vh" : "70vh";

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 9999,
          backgroundColor: error ? "#EF4444" : isLoading || isFetching ? "#F59E0B" : "#10B981",
          color: "white",
          padding: "12px 16px",
          borderRadius: "12px",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "13px",
          fontWeight: "600",
        }}
      >
        <i className={`ri-${isOpen ? "close" : "bug"}-line`} style={{ fontSize: "18px" }}></i>
        <span>Debug</span>
        {activeFilters.length > 0 && (
          <span style={{
            backgroundColor: "rgba(255,255,255,0.3)",
            padding: "2px 6px",
            borderRadius: "10px",
            fontSize: "11px",
          }}>
            {activeFilters.length} filtres
          </span>
        )}
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            right: "20px",
            zIndex: 9998,
            backgroundColor: "#0F172A",
            color: "#E2E8F0",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            width: panelWidth,
            maxHeight: panelHeight,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
            fontSize: "11px",
            border: "1px solid #1E293B",
            transition: "width 0.2s, max-height 0.2s",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid #1E293B",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#1E293B",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="ri-bug-2-line" style={{ fontSize: "18px", color: "#10B981" }}></i>
              <span style={{ fontWeight: "700", fontSize: "13px" }}>
                DEBUG - {type.toUpperCase()}
              </span>
              <span style={{ 
                backgroundColor: "#10B981", 
                color: "white", 
                padding: "2px 8px", 
                borderRadius: "4px",
                fontSize: "10px",
                fontWeight: "600"
              }}>
                {data.length} items
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isLoading && <span style={{ color: "#F59E0B", fontSize: "10px" }}>LOADING...</span>}
              {isFetching && !isLoading && <span style={{ color: "#3B82F6", fontSize: "10px" }}>FETCHING...</span>}
              {error && <span style={{ color: "#EF4444", fontSize: "10px" }}>ERROR</span>}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <i className={`ri-${isExpanded ? "contract" : "expand"}-line`} style={{ fontSize: "16px" }}></i>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid #1E293B",
            padding: "0 8px",
            backgroundColor: "#1E293B",
            overflowX: "auto",
          }}>
            {(["overview", "filters", "data", "fields", "analysis", "raw"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "10px 12px",
                  background: "none",
                  border: "none",
                  color: activeTab === tab ? "#3B82F6" : "#64748B",
                  borderBottom: activeTab === tab ? "2px solid #3B82F6" : "2px solid transparent",
                  cursor: "pointer",
                  fontSize: "10px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {tab === "overview" && "Vue"}
                {tab === "filters" && `Filtres (${activeFilters.length})`}
                {tab === "data" && `Data (${data.length})`}
                {tab === "fields" && `Champs (${allFields.length})`}
                {tab === "analysis" && "Analyse"}
                {tab === "raw" && "Raw"}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{
            padding: "12px",
            overflowY: "auto",
            flex: 1,
          }}>
            {/* Error Display */}
            {error && (
              <div style={{
                backgroundColor: "#7F1D1D",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "12px",
                border: "1px solid #991B1B",
              }}>
                <div style={{ fontWeight: "600", color: "#FCA5A5", fontSize: "10px" }}>
                  <i className="ri-error-warning-line" style={{ marginRight: "6px" }}></i>ERREUR
                </div>
                <div style={{ color: "#FECACA", marginTop: "4px" }}>{error}</div>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Stats Grid */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "8px",
                }}>
                  <MiniStatCard label="Total DB" value={pagination?.total?.toLocaleString() || "0"} color="#3B82F6" />
                  <MiniStatCard label="Affichés" value={data.length.toString()} color="#10B981" />
                  <MiniStatCard label="Page" value={`${pagination?.page || 1}/${pagination?.totalPages || 1}`} color="#F59E0B" />
                  <MiniStatCard label="Shops" value={(adsAnalysis?.shopStats?.uniqueShops || new Set(data.map((d: any) => d.shopId || d.shop?.id)).size).toString()} color="#8B5CF6" />
                </div>

                {/* Timing Info */}
                <div style={{
                  backgroundColor: "#1E293B",
                  padding: "10px",
                  borderRadius: "6px",
                }}>
                  <div style={{ fontWeight: "600", marginBottom: "6px", color: "#94A3B8", fontSize: "10px" }}>
                    PERFORMANCE
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {timings?.totalMs !== undefined && <Badge label="Total" value={`${timings.totalMs}ms`} color="#10B981" />}
                    {timings?.authMs !== undefined && <Badge label="Auth" value={`${timings.authMs}ms`} color="#3B82F6" />}
                    {timings?.mainQueryMs !== undefined && <Badge label="Query" value={`${timings.mainQueryMs}ms`} color="#8B5CF6" />}
                    {timings?.countQueryMs !== undefined && <Badge label="Count" value={`${timings.countQueryMs}ms`} color="#F59E0B" />}
                  </div>
                </div>

                {/* Sort & Pagination */}
                <div style={{
                  backgroundColor: "#1E293B",
                  padding: "10px",
                  borderRadius: "6px",
                }}>
                  <div style={{ fontWeight: "600", marginBottom: "6px", color: "#94A3B8", fontSize: "10px" }}>
                    TRI & PAGINATION
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    <Badge label="Sort" value={filters.sortBy || "recommended"} color="#3B82F6" />
                    <Badge label="Order" value={filters.sortOrder || "desc"} color="#8B5CF6" />
                    <Badge label="PerPage" value={String(pagination?.perPage || 25)} color="#F59E0B" />
                    <Badge label="HasMore" value={pagination?.hasMore ? "Yes" : "No"} color={pagination?.hasMore ? "#10B981" : "#EF4444"} />
                  </div>
                </div>

                {/* Quick Stats for Ads */}
                {type === "ads" && adsAnalysis && (
                  <div style={{
                    backgroundColor: "#1E293B",
                    padding: "10px",
                    borderRadius: "6px",
                  }}>
                    <div style={{ fontWeight: "600", marginBottom: "6px", color: "#94A3B8", fontSize: "10px" }}>
                      QUICK STATS
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px" }}>
                      <Badge label="Active" value={`${adsAnalysis.statusDistribution['active'] || 0}`} color="#10B981" />
                      <Badge label="Inactive" value={`${adsAnalysis.statusDistribution['inactive'] || 0}`} color="#EF4444" />
                      <Badge label="Images" value={`${adsAnalysis.mediaStats.withImage}`} color="#3B82F6" />
                      <Badge label="Videos" value={`${adsAnalysis.mediaStats.withVideo}`} color="#8B5CF6" />
                      <Badge label="w/Traffic" value={`${adsAnalysis.trafficStats.withTraffic}`} color="#F59E0B" />
                      <Badge label="AvgDays" value={`${adsAnalysis.activeDaysStats.avg}d`} color="#06B6D4" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Filters Tab */}
            {activeTab === "filters" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {/* All Filters (including inactive) */}
                <div style={{ fontWeight: "600", color: "#94A3B8", fontSize: "10px", marginBottom: "4px" }}>
                  TOUS LES FILTRES ({Object.keys(filters).length})
                </div>
                {Object.entries(filters).map(([key, value]) => {
                  const isActive = activeFilters.some(([k]) => k === key);
                  return (
                    <div
                      key={key}
                      style={{
                        backgroundColor: isActive ? "#1E3A5F" : "#1E293B",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        border: isActive ? "1px solid #3B82F6" : "1px solid transparent",
                      }}
                    >
                      <span style={{ 
                        color: isActive ? "#60A5FA" : "#64748B", 
                        fontSize: "10px",
                        fontWeight: isActive ? "600" : "400",
                      }}>
                        {isActive && <i className="ri-checkbox-circle-fill" style={{ marginRight: "4px" }}></i>}
                        {key}
                      </span>
                      <span style={{ 
                        color: isActive ? "#E2E8F0" : "#64748B", 
                        maxWidth: "60%", 
                        textAlign: "right",
                        wordBreak: "break-all",
                        fontSize: "10px",
                      }}>
                        {value === undefined || value === null || value === "" 
                          ? "<empty>"
                          : Array.isArray(value) 
                            ? value.length === 0 
                              ? "[]" 
                              : `[${value.slice(0, 5).join(", ")}${value.length > 5 ? `...+${value.length-5}` : ""}]`
                            : typeof value === "object" 
                              ? JSON.stringify(value)
                              : String(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Data Tab - Item Selector */}
            {activeTab === "data" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {/* Item Selector */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ color: "#94A3B8", fontSize: "10px" }}>ITEM:</span>
                  <select
                    value={selectedItemIndex}
                    onChange={(e) => setSelectedItemIndex(Number(e.target.value))}
                    style={{
                      backgroundColor: "#1E293B",
                      color: "#E2E8F0",
                      border: "1px solid #334155",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      fontSize: "10px",
                      flex: 1,
                      maxWidth: "300px",
                    }}
                  >
                    {data.map((item: any, index: number) => (
                      <option key={index} value={index}>
                        #{index + 1} - ID: {item.id} | {item.shopName || item.title || item.url || "N/A"}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setSelectedItemIndex(Math.max(0, selectedItemIndex - 1))}
                    disabled={selectedItemIndex === 0}
                    style={{
                      backgroundColor: "#1E293B",
                      color: selectedItemIndex === 0 ? "#64748B" : "#E2E8F0",
                      border: "none",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      cursor: selectedItemIndex === 0 ? "not-allowed" : "pointer",
                      fontSize: "10px",
                    }}
                  >
                    <i className="ri-arrow-left-line"></i>
                  </button>
                  <button
                    onClick={() => setSelectedItemIndex(Math.min(data.length - 1, selectedItemIndex + 1))}
                    disabled={selectedItemIndex >= data.length - 1}
                    style={{
                      backgroundColor: "#1E293B",
                      color: selectedItemIndex >= data.length - 1 ? "#64748B" : "#E2E8F0",
                      border: "none",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      cursor: selectedItemIndex >= data.length - 1 ? "not-allowed" : "pointer",
                      fontSize: "10px",
                    }}
                  >
                    <i className="ri-arrow-right-line"></i>
                  </button>
                </div>

                {/* Selected Item Details */}
                {selectedItem && (
                  <div style={{
                    backgroundColor: "#1E293B",
                    padding: "10px",
                    borderRadius: "6px",
                    maxHeight: "400px",
                    overflowY: "auto",
                  }}>
                    <div style={{ fontWeight: "600", color: "#94A3B8", fontSize: "10px", marginBottom: "8px" }}>
                      DONNÉES COMPLÈTES - ITEM #{selectedItemIndex + 1}
                    </div>
                    {Object.entries(selectedItem).map(([key, value]) => (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          padding: "4px 0",
                          borderBottom: "1px solid #334155",
                        }}
                      >
                        <span style={{ 
                          color: "#60A5FA", 
                          fontSize: "10px",
                          minWidth: "120px",
                          fontWeight: "500",
                        }}>
                          {key}
                        </span>
                        <span style={{ 
                          color: value === null || value === undefined || value === "" 
                            ? "#EF4444" 
                            : "#E2E8F0", 
                          textAlign: "right",
                          wordBreak: "break-all",
                          fontSize: "10px",
                          maxWidth: "60%",
                        }}>
                          {value === null 
                            ? "null" 
                            : value === undefined 
                              ? "undefined"
                              : value === ""
                                ? '""'
                                : typeof value === "object" 
                                  ? JSON.stringify(value, null, 0)
                                  : typeof value === "boolean"
                                    ? value ? "true" : "false"
                                    : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fields Tab */}
            {activeTab === "fields" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontWeight: "600", color: "#94A3B8", fontSize: "10px", marginBottom: "4px" }}>
                  CHAMPS DISPONIBLES ({allFields.length})
                </div>
                <div style={{
                  backgroundColor: "#1E293B",
                  padding: "10px",
                  borderRadius: "6px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                }}>
                  {allFields.sort().map((field) => {
                    // Check data completeness for this field
                    const withValue = data.filter((item: any) => 
                      item[field] !== null && item[field] !== undefined && item[field] !== ""
                    ).length;
                    const percentage = data.length > 0 ? Math.round((withValue / data.length) * 100) : 0;
                    return (
                      <span
                        key={field}
                        style={{
                          backgroundColor: percentage === 100 ? "#166534" : percentage > 50 ? "#854D0E" : "#7F1D1D",
                          color: "#E2E8F0",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "9px",
                        }}
                        title={`${field}: ${withValue}/${data.length} (${percentage}%)`}
                      >
                        {field} ({percentage}%)
                      </span>
                    );
                  })}
                </div>

                {/* Field Value Distribution for Selected Field */}
                <div style={{ fontWeight: "600", color: "#94A3B8", fontSize: "10px", marginTop: "8px" }}>
                  VALEURS UNIQUES PAR CHAMP (top 10)
                </div>
                {["ctaText", "mediaType", "platform", "status", "shopCountry"].filter(f => allFields.includes(f)).map(field => {
                  const distribution = data.reduce((acc: Record<string, number>, item: any) => {
                    const val = String(item[field] ?? "N/A");
                    acc[val] = (acc[val] || 0) + 1;
                    return acc;
                  }, {});
                  const sorted = Object.entries(distribution).sort((a, b) => b[1] - a[1]).slice(0, 10);
                  return (
                    <div key={field} style={{
                      backgroundColor: "#1E293B",
                      padding: "8px 10px",
                      borderRadius: "6px",
                    }}>
                      <div style={{ color: "#60A5FA", fontSize: "10px", fontWeight: "600", marginBottom: "4px" }}>
                        {field}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {sorted.map(([val, count]) => (
                          <span key={val} style={{
                            backgroundColor: "#334155",
                            padding: "2px 6px",
                            borderRadius: "3px",
                            fontSize: "9px",
                            color: "#94A3B8",
                          }}>
                            {val}: <span style={{ color: "#E2E8F0" }}>{count}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Analysis Tab */}
            {activeTab === "analysis" && type === "ads" && adsAnalysis && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* CTA Distribution */}
                <DistributionCard 
                  title="CTA DISTRIBUTION" 
                  data={adsAnalysis.ctaDistribution} 
                  total={data.length}
                />
                
                {/* Media Distribution */}
                <DistributionCard 
                  title="MEDIA TYPE" 
                  data={adsAnalysis.mediaDistribution} 
                  total={data.length}
                />
                
                {/* Platform Distribution */}
                <DistributionCard 
                  title="PLATFORM" 
                  data={adsAnalysis.platformDistribution} 
                  total={data.length}
                />
                
                {/* Status Distribution */}
                <DistributionCard 
                  title="STATUS" 
                  data={adsAnalysis.statusDistribution} 
                  total={data.length}
                />
                
                {/* Country Distribution */}
                <DistributionCard 
                  title="SHOP COUNTRIES (Top 10)" 
                  data={Object.fromEntries(
                    Object.entries(adsAnalysis.countryDistribution)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 10)
                  )} 
                  total={data.length}
                />
                
                {/* Traffic Stats */}
                <div style={{
                  backgroundColor: "#1E293B",
                  padding: "10px",
                  borderRadius: "6px",
                }}>
                  <div style={{ fontWeight: "600", color: "#94A3B8", fontSize: "10px", marginBottom: "6px" }}>
                    TRAFFIC STATS
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                    <Badge label="w/Traffic" value={`${adsAnalysis.trafficStats.withTraffic}`} color="#10B981" />
                    <Badge label="AvgTraffic" value={`${adsAnalysis.trafficStats.avgTraffic.toLocaleString()}`} color="#3B82F6" />
                    <Badge label="MaxTraffic" value={`${adsAnalysis.trafficStats.maxTraffic.toLocaleString()}`} color="#8B5CF6" />
                    <Badge label="w/Growth" value={`${adsAnalysis.trafficStats.withGrowth}`} color="#F59E0B" />
                    <Badge label="AvgGrowth" value={`${adsAnalysis.trafficStats.avgGrowth}%`} color="#06B6D4" />
                    <Badge label="Shops" value={`${adsAnalysis.shopStats.uniqueShops}`} color="#EC4899" />
                  </div>
                </div>
                
                {/* Active Days */}
                <div style={{
                  backgroundColor: "#1E293B",
                  padding: "10px",
                  borderRadius: "6px",
                }}>
                  <div style={{ fontWeight: "600", color: "#94A3B8", fontSize: "10px", marginBottom: "6px" }}>
                    ACTIVE DAYS STATS
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <Badge label="Avg" value={`${adsAnalysis.activeDaysStats.avg}d`} color="#3B82F6" />
                    <Badge label="Min" value={`${adsAnalysis.activeDaysStats.min}d`} color="#10B981" />
                    <Badge label="Max" value={`${adsAnalysis.activeDaysStats.max}d`} color="#EF4444" />
                  </div>
                </div>
              </div>
            )}

            {/* Raw Tab */}
            {activeTab === "raw" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontWeight: "600", color: "#94A3B8", fontSize: "10px" }}>
                  RAW DATA (Premier élément)
                </div>
                <pre style={{
                  backgroundColor: "#1E293B",
                  padding: "10px",
                  borderRadius: "6px",
                  overflow: "auto",
                  maxHeight: "400px",
                  fontSize: "9px",
                  color: "#94A3B8",
                  margin: 0,
                }}>
                  {JSON.stringify(data[0] || {}, null, 2)}
                </pre>
                
                <div style={{ fontWeight: "600", color: "#94A3B8", fontSize: "10px", marginTop: "8px" }}>
                  PAGINATION
                </div>
                <pre style={{
                  backgroundColor: "#1E293B",
                  padding: "10px",
                  borderRadius: "6px",
                  overflow: "auto",
                  fontSize: "9px",
                  color: "#94A3B8",
                  margin: 0,
                }}>
                  {JSON.stringify(pagination || {}, null, 2)}
                </pre>
                
                <div style={{ fontWeight: "600", color: "#94A3B8", fontSize: "10px", marginTop: "8px" }}>
                  FILTERS
                </div>
                <pre style={{
                  backgroundColor: "#1E293B",
                  padding: "10px",
                  borderRadius: "6px",
                  overflow: "auto",
                  fontSize: "9px",
                  color: "#94A3B8",
                  margin: 0,
                }}>
                  {JSON.stringify(filters || {}, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: "8px 12px",
            borderTop: "1px solid #1E293B",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "9px",
            color: "#64748B",
            backgroundColor: "#1E293B",
          }}>
            <span>DEV MODE ONLY</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </>
  );
}

// Helper Components
function MiniStatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      backgroundColor: "#1E293B",
      padding: "8px",
      borderRadius: "6px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: "9px", color: "#64748B", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "14px", fontWeight: "700", color }}>{value}</div>
    </div>
  );
}

function Badge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span style={{
      backgroundColor: `${color}20`,
      border: `1px solid ${color}50`,
      color: color,
      padding: "3px 8px",
      borderRadius: "4px",
      fontSize: "9px",
      fontWeight: "500",
    }}>
      {label}: <span style={{ fontWeight: "700" }}>{value}</span>
    </span>
  );
}

function DistributionCard({ title, data, total }: { title: string; data: Record<string, number>; total: number }) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div style={{
      backgroundColor: "#1E293B",
      padding: "10px",
      borderRadius: "6px",
    }}>
      <div style={{ fontWeight: "600", color: "#94A3B8", fontSize: "10px", marginBottom: "8px" }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {sorted.map(([key, count]) => {
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ 
                minWidth: "80px", 
                color: "#E2E8F0", 
                fontSize: "10px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {key || "N/A"}
              </span>
              <div style={{ 
                flex: 1, 
                height: "6px", 
                backgroundColor: "#334155", 
                borderRadius: "3px",
                overflow: "hidden",
              }}>
                <div style={{ 
                  width: `${percentage}%`, 
                  height: "100%", 
                  backgroundColor: percentage > 50 ? "#10B981" : percentage > 20 ? "#F59E0B" : "#3B82F6",
                  borderRadius: "3px",
                }}></div>
              </div>
              <span style={{ 
                minWidth: "50px", 
                textAlign: "right", 
                color: "#94A3B8", 
                fontSize: "9px" 
              }}>
                {count} ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
