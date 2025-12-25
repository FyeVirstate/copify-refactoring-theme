"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { useAds } from "@/lib/hooks/use-ads";

interface SavedAd {
  id: number;
  adId: string;
  pageId: string | null;
  pageName: string | null;
  shopUrl: string;
  status: string;
  activeDays: number;
  mediaType: string | null;
  videoLink: string | null;
  imageLink: string | null;
  ctaText: string | null;
  description: string | null;
  savedAt: string;
}

export default function SavedAdsPage() {
  const [savedAds, setSavedAds] = useState<SavedAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { getFavorites, toggleFavorite } = useAds();

  const loadSavedAds = async (pageNum = 1) => {
    try {
      setIsLoading(true);
      const result = await getFavorites(pageNum, 12);
      
      if (pageNum === 1) {
        setSavedAds(result.data || []);
      } else {
        setSavedAds(prev => [...prev, ...(result.data || [])]);
      }
      
      setHasMore(result.pagination?.page < result.pagination?.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load saved ads");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSavedAds();
  }, []);

  const handleRemoveFavorite = async (adId: number) => {
    try {
      await toggleFavorite(adId);
      setSavedAds(prev => prev.filter(ad => ad.id !== adId));
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadSavedAds(nextPage);
  };

  return (
    <>
      <DashboardHeader title="Publicités sauvegardées" />

      <div className="bg-weak-50 home-content-wrapper">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-15 data-view"
        >
          {/* Header */}
          <div className="dashboard-header d-flex justify-content-between align-items-center gap-4">
            <div className="dashboard-title d-flex">
              <div className="dashboard-title-img me-2">
                <i className="ri-bookmark-line text-white"></i>
              </div>
              <div>
                <p className="dashboard-title-main mb-0">Publicités sauvegardées</p>
                <p className="dashboard-title-sub mb-0 d-none d-md-block">
                  Retrouvez toutes les publicités que vous avez mises en favoris
                </p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary fs-6">
                {savedAds.length} publicité{savedAds.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="p-3">
            {error && (
              <div className="alert alert-danger">
                {error}
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setError(null)}
                ></button>
              </div>
            )}

            {isLoading && savedAds.length === 0 ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : savedAds.length === 0 ? (
              <div className="text-center py-5">
                <i className="ri-bookmark-line fs-1 text-muted mb-3 d-block"></i>
                <h5>Aucune publicité sauvegardée</h5>
                <p className="text-muted mb-3">
                  Explorez les publicités et cliquez sur le cœur pour les sauvegarder.
                </p>
                <a href="/dashboard/ads" className="btn btn-primary">
                  <i className="ri-search-line me-1"></i>
                  Explorer les publicités
                </a>
              </div>
            ) : (
              <>
                <div className="row g-4">
                  {savedAds.map((ad, index) => (
                    <motion.div
                      key={ad.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="col-12 col-md-6 col-lg-4"
                    >
                      <div className="card h-100 ad-card">
                        {/* Media Preview */}
                        <div 
                          className="card-img-top position-relative"
                          style={{ height: 200, background: '#f8f9fa' }}
                        >
                          {ad.mediaType === 'video' && ad.videoLink ? (
                            <video
                              src={ad.videoLink}
                              className="w-100 h-100"
                              style={{ objectFit: 'cover' }}
                              muted
                              loop
                              onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                              onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                            />
                          ) : ad.imageLink ? (
                            <img
                              src={ad.imageLink}
                              alt="Ad preview"
                              className="w-100 h-100"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="d-flex align-items-center justify-content-center h-100">
                              <i className="ri-image-line fs-1 text-muted"></i>
                            </div>
                          )}

                          {/* Remove button */}
                          <button
                            className="btn btn-danger btn-sm position-absolute"
                            style={{ top: 10, right: 10 }}
                            onClick={() => handleRemoveFavorite(ad.id)}
                            title="Retirer des favoris"
                          >
                            <i className="ri-heart-fill"></i>
                          </button>

                          {/* Media type badge */}
                          <span 
                            className="badge bg-dark position-absolute"
                            style={{ bottom: 10, left: 10 }}
                          >
                            {ad.mediaType === 'video' ? (
                              <><i className="ri-video-line me-1"></i>Vidéo</>
                            ) : (
                              <><i className="ri-image-line me-1"></i>Image</>
                            )}
                          </span>
                        </div>

                        <div className="card-body">
                          {/* Page Name */}
                          <h6 className="card-title text-truncate mb-2">
                            {ad.pageName || "Page inconnue"}
                          </h6>

                          {/* Description */}
                          {ad.description && (
                            <p className="card-text text-muted small text-truncate mb-2">
                              {ad.description}
                            </p>
                          )}

                          {/* Stats */}
                          <div className="d-flex justify-content-between text-muted small mb-3">
                            <span>
                              <i className="ri-calendar-line me-1"></i>
                              {ad.activeDays} jours actifs
                            </span>
                            <span className={`badge ${ad.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                              {ad.status}
                            </span>
                          </div>

                          {/* CTA */}
                          {ad.ctaText && (
                            <span className="badge bg-light text-dark">
                              {ad.ctaText}
                            </span>
                          )}
                        </div>

                        <div className="card-footer bg-transparent">
                          <div className="d-flex gap-2">
                            <a
                              href={`https://${ad.shopUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline-primary btn-sm flex-grow-1"
                            >
                              <i className="ri-external-link-line me-1"></i>
                              Voir boutique
                            </a>
                            <a
                              href={`https://facebook.com/ads/library/?id=${ad.adId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline-secondary btn-sm"
                              title="Voir sur Facebook"
                            >
                              <i className="ri-facebook-fill"></i>
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="text-center mt-4">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="rotating">
                          <i className="ri-loader-2-line"></i>
                        </span>
                      ) : (
                        <>
                          <i className="ri-add-line me-1"></i>
                          Charger plus
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
