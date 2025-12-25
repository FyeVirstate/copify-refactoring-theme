"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchResult {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  currency: string;
  imageUrl: string;
  aliexpressUrl: string;
  sold: number;
  rating: number;
  reviews: number;
  freeShipping: boolean;
}

export default function AliexpressSearchPage() {
  const [productLink, setProductLink] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setProductLink("");
      } else {
        setError("Veuillez sélectionner une image valide (JPEG, PNG ou GIF)");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setProductLink("");
        setError(null);
      } else {
        setError("Veuillez sélectionner une image valide");
      }
    }
  };

  const handleSearch = async () => {
    if (!productLink.trim() && !selectedFile) {
      setError("Veuillez entrer un lien ou télécharger une image");
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      // TODO: Implement actual AliExpress search API
      // For now, show placeholder message
      setError("La recherche AliExpress sera bientôt disponible. Cette fonctionnalité nécessite une intégration API externe.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la recherche");
    } finally {
      setIsSearching(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    const input = document.getElementById('file-upload') as HTMLInputElement;
    if (input) input.value = '';
  };

  return (
    <>
      <DashboardHeader
        title="Trouver sur Aliexpress"
        subtitle="Rechercher des produits sur Aliexpress par image ou par lien"
        icon="ri-search-line"
        iconType="icon"
        showSearch={false}
        showStats={false}
      />

      <div className="bg-white home-content-wrapper">
        <div className="container-fluid px-2 px-md-4 py-5">
          
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="alert alert-warning mx-auto mb-4 d-flex justify-content-between align-items-center"
              style={{ maxWidth: '900px' }}
            >
              <span>{error}</span>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setError(null)}
              ></button>
            </motion.div>
          )}

          {searchResults.length === 0 ? (
            // Search Form
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="d-flex align-items-center justify-content-center"
              style={{ minHeight: 'calc(100vh - 350px)' }}
            >
              <div className="aliexpress-search-container" style={{ maxWidth: '900px', width: '100%', padding: '40px 20px' }}>
                {/* Image Upload Section */}
                <div
                  className={`aliexpress-upload-box ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${selectedFile ? '#10b981' : '#D1D5DB'}`,
                    borderRadius: '16px',
                    padding: 'clamp(40px, 8vw, 80px) clamp(20px, 6vw, 60px)',
                    textAlign: 'center',
                    backgroundColor: dragActive ? '#F5F7FA' : selectedFile ? '#f0fdf4' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    marginBottom: '32px',
                    position: 'relative',
                  }}
                  onClick={() => !selectedFile && document.getElementById('file-upload')?.click()}
                >
                  {selectedFile ? (
                    // File Selected State
                    <div className="d-flex flex-column align-items-center">
                      <div className="position-relative mb-3">
                        <img 
                          src={URL.createObjectURL(selectedFile)} 
                          alt="Preview" 
                          className="rounded"
                          style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); clearFile(); }}
                          className="btn btn-danger btn-sm rounded-circle position-absolute"
                          style={{ top: -10, right: -10 }}
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      </div>
                      <span className="text-success fw-500">
                        <i className="ri-check-line me-1"></i>
                        {selectedFile.name}
                      </span>
                    </div>
                  ) : (
                    // Default State
                    <>
                      <div className="mb-3">
                        <i className="ri-camera-line" style={{ fontSize: 'clamp(48px, 10vw, 64px)', color: '#A8AEBA' }}></i>
                      </div>
                      <h3 className="fs-normal fw-400 mb-2" style={{ color: '#99A0AE', lineHeight: '1.5' }}>
                        Télécharger une image de produit pour trouver des<br />produits similaires
                      </h3>
                      <p className="fs-xs mb-0" style={{ color: '#BCC1CC', fontWeight: 400 }}>
                        JPEG, JPG, PNG ou GIF
                      </p>
                    </>
                  )}
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* OR Divider */}
                <div className="d-flex align-items-center justify-content-center mb-5">
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
                  <span className="mx-4 fs-small" style={{ color: '#BCC1CC', fontWeight: 400 }}>ou</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
                </div>

                {/* Link Input Section */}
                <div className="mb-4">
                  <Input
                    type="text"
                    className="form-control design-2"
                    placeholder="Entrez le lien de produit Shopify ou le lien de l'image"
                    value={productLink}
                    onChange={(e) => {
                      setProductLink(e.target.value);
                      if (selectedFile) clearFile();
                    }}
                    disabled={isSearching}
                    style={{
                      height: '50px',
                      fontSize: '14px',
                      borderRadius: '10px',
                      border: '1px solid #E5E7EB',
                      color: '#6B7280'
                    }}
                  />
                </div>

                {/* Search Button */}
                <Button
                  onClick={handleSearch}
                  className="btn btn-primary apply-filters-btn w-100"
                  disabled={isSearching || (!productLink.trim() && !selectedFile)}
                >
                  {isSearching ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Recherche en cours...
                    </>
                  ) : (
                    <>
                      <i className="ri-search-line me-2"></i>
                      Trouver mon produit
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ) : (
            // Search Results
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto"
              style={{ maxWidth: '1200px' }}
            >
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fs-normal fw-600 mb-0">
                  {searchResults.length} résultats trouvés
                </h3>
                <Button 
                  variant="outline" 
                  onClick={() => { setSearchResults([]); setProductLink(""); clearFile(); }}
                >
                  <i className="ri-refresh-line me-2"></i>
                  Nouvelle recherche
                </Button>
              </div>

              <div className="row g-4">
                {searchResults.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="col-md-6 col-lg-4"
                  >
                    <div className="card h-100">
                      <div className="position-relative">
                        <img 
                          src={product.imageUrl} 
                          alt={product.title}
                          className="card-img-top"
                          style={{ height: 200, objectFit: 'cover' }}
                        />
                        {product.freeShipping && (
                          <span className="badge bg-success position-absolute" style={{ top: 10, left: 10 }}>
                            Livraison gratuite
                          </span>
                        )}
                      </div>
                      <div className="card-body">
                        <h6 className="card-title" style={{ 
                          display: '-webkit-box', 
                          WebkitLineClamp: 2, 
                          WebkitBoxOrient: 'vertical', 
                          overflow: 'hidden' 
                        }}>
                          {product.title}
                        </h6>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="fs-5 fw-bold text-primary">
                            {product.price} {product.currency}
                          </span>
                          {product.originalPrice > product.price && (
                            <span className="text-muted text-decoration-line-through fs-small">
                              {product.originalPrice} {product.currency}
                            </span>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-3 text-muted fs-small mb-3">
                          <span>
                            <i className="ri-star-fill text-warning me-1"></i>
                            {product.rating}
                          </span>
                          <span>{product.reviews} avis</span>
                          <span>{product.sold} vendus</span>
                        </div>
                      </div>
                      <div className="card-footer bg-transparent border-0 pt-0">
                        <div className="d-grid gap-2">
                          <a 
                            href={product.aliexpressUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-primary btn-sm"
                          >
                            <i className="ri-external-link-line me-1"></i>
                            Voir sur AliExpress
                          </a>
                          <Link
                            href={`/dashboard/export?url=${encodeURIComponent(product.aliexpressUrl)}`}
                            className="btn btn-primary btn-sm"
                          >
                            <i className="ri-download-line me-1"></i>
                            Exporter
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
