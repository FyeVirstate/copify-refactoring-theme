"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardHeader from "@/components/DashboardHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportedProduct {
  id: number;
  shopUrl: string;
  merchantName: string | null;
  screenshot: string;
  nbProduct: number;
  translation: string;
  file: string;
  zipFile: string | null;
  productUrl: string | null;
  createdAt: string;
  relativeTime: string;
  csvDownloadUrl: string | null;
  zipDownloadUrl: string | null;
}

interface Credits {
  used: number;
  remaining: number;
  limit: number;
  isUnlimited: boolean;
  isOnTrial: boolean;
}

// Language options with flag codes
const languageOptions = [
  { value: "no", label: "No Translation", flag: null, icon: "ri-translate" },
  { value: "DE", label: "Allemand", flag: "de" },
  { value: "EN", label: "Anglais", flag: "us" },
  { value: "DA", label: "Danois", flag: "dk" },
  { value: "ES", label: "Espagnol", flag: "es" },
  { value: "FR", label: "Français", flag: "fr" },
  { value: "IT", label: "Italien", flag: "it" },
  { value: "PT", label: "Portuguais", flag: "pt" },
  { value: "RO", label: "Roumain", flag: "ro" },
  { value: "SV", label: "Suédois", flag: "se" },
  { value: "TR", label: "Turc", flag: "tr" },
  { value: "PL", label: "Polonais", flag: "pl" },
  { value: "NO", label: "Norvégienne", flag: "no" },
];

// Get flag code from translation value
function getFlagCode(translation: string): string | null {
  const option = languageOptions.find(opt => opt.value === translation);
  return option?.flag || null;
}

export default function ExportProductsPage() {
  const [productUrl, setProductUrl] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("no");
  const [exportMultiple, setExportMultiple] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportHistory, setExportHistory] = useState<ExportedProduct[]>([]);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/export');
      const data = await res.json();
      if (data.success) {
        setExportHistory(data.data || []);
        setCredits(data.credits || null);
      }
    } catch (err) {
      console.error("Failed to load export history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!productUrl.trim()) {
      setError("Veuillez entrer l'URL d'un produit ou d'une boutique");
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productUrl: productUrl.trim(),
          language: selectedLanguage,
          multiple: exportMultiple,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Erreur lors de l'export");
      }

      // Refresh history
      await loadHistory();
      setProductUrl("");
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async (exportId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet export ?')) return;
    
    setDeletingId(exportId);
    try {
      const res = await fetch(`/api/export?id=${exportId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      // Refresh history
      await loadHistory();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  // Get selected language display
  const selectedLangOption = languageOptions.find(opt => opt.value === selectedLanguage);

  return (
    <>
      <DashboardHeader
        title="Exports de Produits"
        subtitle="Exportez facilement des produits pour gagner du temps et simplifier votre création de site."
        showTutorialButton={true}
        onTutorialClick={() => console.log("Tutoriel clicked")}
        icon="ri-download-cloud-line"
        iconType="icon"
        showStats={false}
      />

      <div className="bg-white home-content-wrapper">
        <div className="container-fluid px-2 px-md-4 py-5">
          
          {/* Limit Reached Alert - Blue style with unlock button */}
          {credits && credits.remaining <= 0 && !credits.isUnlimited && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mb-4"
              style={{ maxWidth: '900px' }}
            >
              <div 
                className="alert d-flex align-items-center justify-content-between gap-3 mb-0"
                style={{ 
                  backgroundColor: '#EFF6FF', 
                  border: '1px solid #BFDBFE',
                  borderRadius: '10px',
                  color: '#1E40AF',
                  padding: '12px 16px',
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <i className="ri-mail-check-line" style={{ fontSize: '20px', color: '#3B82F6' }}></i>
                  <span className="fw-500">Vous avez atteint la limite maximale d'export de produits avec votre abonnement.</span>
                </div>
                <a 
                  href="/dashboard/pricing"
                  className="btn btn-primary"
                  style={{ 
                    backgroundColor: '#335CFF', 
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Débloquer l'accès complet
                </a>
              </div>
            </motion.div>
          )}

          {/* Error Message - Red style - Only show if NOT a limit error (limit error is shown in blue alert above) */}
          {error && !error.includes('limite') && !error.includes('Limite') && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mb-4"
              style={{ maxWidth: '900px' }}
            >
              <div 
                className="alert d-flex align-items-center justify-content-between gap-3"
                style={{ 
                  backgroundColor: '#FEE2E2', 
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  color: '#991B1B',
                  padding: '12px 16px',
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <i className="ri-error-warning-line" style={{ fontSize: '20px', color: '#DC2626' }}></i>
                  <span className="fw-500">{error}</span>
                </div>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setError(null)}
                  style={{ fontSize: '10px' }}
              ></button>
              </div>
            </motion.div>
          )}

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center mx-auto"
            style={{ maxWidth: '900px', marginTop: '40px', marginBottom: '50px' }}
          >
            <h2 className="fw-400 mb-3" style={{ fontSize: 'clamp(20px, 5vw, 26px)', color: '#0E121B' }}>
              Exporter des produits depuis n'importe quelle boutique{' '}
              <span className="export-shopify-gradient">Shopify</span> ou{' '}
              <span className="export-aliexpress-gradient">AliExpress</span>
            </h2>
            <p className="text-sub mb-0" style={{ fontSize: '15px', lineHeight: '1.6', color: '#6B7280' }}>
              Télécharger les détails des produits d'un lien{' '}
              <span className="export-shopify-gradient">Shopify</span> ou{' '}
              <span className="export-aliexpress-gradient">AliExpress</span>
              <br />
              (images, titre, descriptions) en .csv
            </p>
          </motion.div>

          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="export-product-input-wrapper mx-auto"
          >
            {/* Main Input Row */}
          <div className="export-product-input-section">
            {/* URL Input with Icon */}
              <div className="position-relative export-input-url-wrapper">
              <i
                className="ri-crosshair-2-line position-absolute"
                style={{
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '18px',
                  color: '#99a0ae',
                  zIndex: 1,
                  pointerEvents: 'none'
                }}
              ></i>
              <Input
                type="text"
                className="export-product-url-input form-control design-2 export-url-with-icon"
                placeholder={exportMultiple ? "www.exempleboutique.com" : "www.exempleboutique.com/products/mini"}
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                  disabled={isExporting || (credits?.isOnTrial && credits?.remaining === 0)}
              />
            </div>

              {/* Language Select with Flags - Custom Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="d-flex align-items-center gap-2"
                    style={{ 
                      width: '180px',
                      height: '48px',
                      background: selectedLanguage !== 'no' ? '#335CFF' : '#fff',
                      color: selectedLanguage !== 'no' ? '#fff' : '#0E121B',
                      border: selectedLanguage !== 'no' ? '1px solid #335CFF' : '1px solid #E1E4EA',
                      borderRadius: '10px',
                      padding: '0 14px',
                      cursor: exportMultiple || isExporting ? 'not-allowed' : 'pointer',
                      opacity: exportMultiple || isExporting ? 0.6 : 1,
                      flexShrink: 0,
                    }}
              disabled={exportMultiple || isExporting}
            >
                    {selectedLangOption?.flag ? (
                      <span className={`fi fi-${selectedLangOption.flag}`} style={{ fontSize: '16px' }}></span>
                    ) : (
                      <i className="ri-translate-2" style={{ fontSize: '18px' }}></i>
                    )}
                    <span style={{ flex: 1, textAlign: 'left', fontSize: '14px' }}>{selectedLangOption?.label || 'No Translation'}</span>
                    <i className="ri-arrow-down-s-line"></i>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" style={{ width: '200px' }}>
                  {languageOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setSelectedLanguage(option.value)}
                      className="d-flex align-items-center gap-2"
                      style={{
                        backgroundColor: selectedLanguage === option.value ? '#335CFF' : 'transparent',
                        color: selectedLanguage === option.value ? '#fff' : '#0E121B',
                      }}
                    >
                      {option.flag ? (
                        <span className={`fi fi-${option.flag}`} style={{ fontSize: '16px' }}></span>
                      ) : (
                        <i className={option.icon || 'ri-translate-2'} style={{ fontSize: '16px' }}></i>
                      )}
                      <span>{option.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Export Button */}
              <Button
                onClick={handleExport}
                className="export-product-export-btn"
                disabled={isExporting || !productUrl.trim() || (credits?.isOnTrial && credits?.remaining === 0)}
                style={{ 
                  backgroundColor: '#335CFF', 
                  border: 'none',
                  height: '48px',
                  padding: '0 24px',
                  borderRadius: '10px',
                  flexShrink: 0,
                }}
              >
                {isExporting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Export...
                  </>
                ) : (
                  'Exporter'
                )}
              </Button>

              {/* Credits Counter with Progress Circle */}
              <div className="export-product-counter d-flex align-items-center gap-2" style={{ flexShrink: 0 }}>
                {/* SVG Progress Circle */}
                <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Background circle */}
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="3"
                  />
                  {/* Progress circle - show used/limit ratio (empty when 0 used, full when limit reached) */}
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke={credits && credits.remaining <= 0 && !credits.isUnlimited ? '#ef4444' : '#335CFF'}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 16}`}
                    strokeDashoffset={
                      credits 
                        ? credits.isUnlimited 
                          ? 0 
                          : (2 * Math.PI * 16) - ((credits.used / Math.max(credits.limit, 1)) * 2 * Math.PI * 16)
                        : 2 * Math.PI * 16
                    }
                    style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                  />
                </svg>
                <div className="d-flex flex-column" style={{ lineHeight: 1.2 }}>
                  <span 
                    className="fw-600" 
                    style={{ 
                      fontSize: '14px', 
                      color: credits && credits.remaining <= 0 && !credits.isUnlimited ? '#ef4444' : '#0E121B' 
                    }}
                  >
                    {credits === null ? '...' : credits.isUnlimited ? '∞' : `${credits.used}/${credits.limit}`}
                  </span>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>Produits exportés</span>
                </div>
              </div>
            </div>

            {/* Export Multiple Switch - Below input row */}
            <div className="export-switch-section">
              <label className="switch mb-0" style={{ flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={exportMultiple}
                  onChange={(e) => {
                    setExportMultiple(e.target.checked);
                    if (e.target.checked) {
                      setSelectedLanguage("no");
                    }
                  }}
                  disabled={isExporting}
                />
                <span className="slider round"></span>
              </label>
              <div>
                <span className="fw-500 d-block" style={{ fontSize: '14px', color: '#374151' }}>Exporter plusieurs produits</span>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>Vous pourrez sélectionner les produits que vous souhaitez</span>
            </div>
          </div>
          </motion.div>

          {/* Export History Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="mx-auto mt-5"
            style={{ maxWidth: '900px' }}
          >
            <h3 className="fs-lg fw-600 mb-3">Historique d'Export</h3>

            <div className="bg-white rounded-8 border overflow-hidden" style={{ borderColor: '#E1E4EA' }}>
              <Table>
                <TableHeader>
                  <TableRow className="border-0" style={{ backgroundColor: '#F5F7FA' }}>
                    <TableHead 
                      className="border-0 text-sub fw-500" 
                      style={{ fontSize: '13px', minWidth: '280px', paddingLeft: '140px' }}
                    >
                      Boutique
                    </TableHead>
                    <TableHead 
                      className="border-0 text-sub fw-500 text-center" 
                      style={{ fontSize: '13px', minWidth: '130px' }}
                    >
                      Langue du site
                    </TableHead>
                    <TableHead 
                      className="border-0 text-sub fw-500 text-center" 
                      style={{ fontSize: '13px', minWidth: '130px' }}
                    >
                      Date d'ajout
                    </TableHead>
                    <TableHead 
                      className="border-0 text-sub fw-500 text-end" 
                      style={{ fontSize: '13px' }}
                    >
                      &nbsp;
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Skeleton Loading
                    Array.from({ length: 3 }).map((_, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="py-4">
                          <div className="d-flex align-items-center gap-3">
                            <div className="skeleton" style={{ width: '100px', height: '60px', borderRadius: '8px', backgroundColor: '#E1E4EA' }}></div>
                            <div>
                              <div className="skeleton mb-2" style={{ width: '120px', height: '14px', backgroundColor: '#E1E4EA' }}></div>
                              <div className="skeleton" style={{ width: '160px', height: '12px', backgroundColor: '#E1E4EA' }}></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="skeleton mx-auto" style={{ width: '24px', height: '18px', backgroundColor: '#E1E4EA' }}></div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="skeleton mx-auto" style={{ width: '80px', height: '14px', backgroundColor: '#E1E4EA' }}></div>
                        </TableCell>
                        <TableCell>
                          <div className="skeleton ms-auto" style={{ width: '120px', height: '32px', backgroundColor: '#E1E4EA' }}></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : exportHistory.length > 0 ? (
                    exportHistory.map((item) => {
                      const flagCode = getFlagCode(item.translation);
                      const shopUrlClean = item.shopUrl.replace(/^www\./, '');
                      
                      return (
                        <TableRow key={item.id} className="border-b" style={{ borderColor: '#E1E4EA' }}>
                          {/* Shop Info */}
                          <TableCell className="py-4">
                            <div className="d-flex align-items-center gap-3">
                              {/* Shop Screenshot/Logo */}
                              <div 
                                className="shop-img position-relative overflow-hidden"
                                style={{ 
                                  width: '100px', 
                                  height: '60px', 
                                  borderRadius: '8px',
                                  backgroundColor: '#F5F7FA',
                                  flexShrink: 0,
                                }}
                              >
                                <img
                                  src={item.screenshot}
                                  alt={item.merchantName || shopUrlClean}
                                  style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                  }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?sz=64&domain=${item.shopUrl}`;
                                  }}
                                />
                              </div>
                              {/* Shop Details */}
                              <div>
                                {item.merchantName && (
                                  <p className="mb-0 fw-500" style={{ fontSize: '14px', color: '#0E121B' }}>{item.merchantName}</p>
                                )}
                                <a 
                                  href={`https://${item.shopUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontSize: '12px', color: '#525866', textDecoration: 'none' }}
                                >
                                  {shopUrlClean}
                                </a>
                              </div>
                            </div>
                          </TableCell>

                          {/* Language Flag */}
                          <TableCell className="text-center align-middle">
                            {flagCode ? (
                              <span 
                                className={`fi fi-${flagCode} fis`} 
                                style={{ 
                                  fontSize: '24px',
                                  borderRadius: '50%',
                                  overflow: 'hidden',
                                  display: 'inline-block',
                                  width: '28px',
                                  height: '28px',
                                  lineHeight: '28px',
                                }}
                              ></span>
                            ) : (
                              <div 
                                title="Pas de traduction"
                                style={{ 
                                  width: '28px', 
                                  height: '28px', 
                                  borderRadius: '50%',
                                  backgroundColor: '#F3F4F6',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <i className="ri-translate-2" style={{ fontSize: '14px', color: '#9CA3AF' }}></i>
                              </div>
                            )}
                          </TableCell>

                          {/* Date */}
                          <TableCell className="text-center align-middle">
                            <span style={{ fontSize: '13px', color: '#525866' }}>
                              {item.relativeTime || 'À l\'instant'}
                            </span>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-end align-middle">
                            <div className="d-flex gap-2 justify-content-end align-items-center">
                              {/* Download CSV - Always visible */}
                              {item.csvDownloadUrl ? (
                                <a
                                  href={item.csvDownloadUrl}
                                  download
                                  className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                                  title="Télécharger le fichier CSV"
                                  style={{ width: '40px', height: '40px', borderRadius: '8px' }}
                                >
                                  <i className="ri-download-line" style={{ fontSize: '18px' }}></i>
                                </a>
                              ) : (
                                <div
                                  title="Export en cours de génération... Veuillez patienter"
                                  style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    borderRadius: '8px', 
                                    cursor: 'progress',
                                    backgroundColor: '#FEF3C7',
                                    border: '1px solid #FCD34D',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <i className="ri-loader-4-line" style={{ fontSize: '18px', color: '#92400E', animation: 'spin 1s linear infinite' }}></i>
                                </div>
                              )}

                              {/* Push to Shopify / Store AI */}
                              <a
                                href={`/dashboard/ai-shop?product=${encodeURIComponent(item.productUrl || item.shopUrl)}`}
                                className="btn btn-secondary d-flex align-items-center gap-2"
                                style={{ 
                                  fontSize: '13px', 
                                  borderRadius: '8px',
                                  padding: '8px 14px',
                                  height: '40px',
                                }}
                              >
                                <img 
                                  src="/img/shopify-logo-min.png" 
                                  alt="Shopify" 
                                  width="18" 
                                  height="18"
                                  style={{ objectFit: 'contain' }}
                                />
                                <span>Mettre à jour le thème</span>
                              </a>

                              {/* More actions dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                                    style={{ width: '40px', height: '40px', borderRadius: '8px' }}
                                  >
                                    <i className="ri-more-2-fill" style={{ fontSize: '18px' }}></i>
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" style={{ minWidth: '160px' }}>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setProductUrl(item.productUrl || item.shopUrl);
                                      setSelectedLanguage(item.translation || 'no');
                                    }}
                                    className="d-flex align-items-center gap-2"
                                  >
                                    <i className="ri-refresh-line" style={{ fontSize: '16px' }}></i>
                                    <span>Actualiser</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(item.id)}
                                    className="d-flex align-items-center gap-2 text-danger"
                                    disabled={deletingId === item.id}
                                  >
                                    {deletingId === item.id ? (
                                      <span className="spinner-border spinner-border-sm"></span>
                                    ) : (
                                      <i className="ri-delete-bin-line" style={{ fontSize: '16px' }}></i>
                                    )}
                                    <span>Supprimer</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : !credits?.isOnTrial ? (
                    // Empty State - only for non-trial users
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-5">
                        <div className="d-flex flex-column align-items-center gap-3">
                          <div 
                            className="d-flex align-items-center justify-content-center rounded-circle"
                            style={{ width: '56px', height: '56px', backgroundColor: '#FEF3C7' }}
                          >
                            <i className="ri-download-cloud-line" style={{ fontSize: '28px', color: '#F59E0B' }}></i>
                          </div>
                          <div>
                            <h4 className="fw-600 fs-normal mb-1">Aucun export trouvé</h4>
                            <p className="text-sub fs-small mb-0">
                              Exportez votre premier produit pour le voir ici.
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {/* Trial/Free Examples - Show for trial/free users when no exports */}
                  {!isLoading && exportHistory.length === 0 && (credits?.isOnTrial || credits?.remaining === 1) && (
                    <>
                      {/* Example 1 - wearfelicity */}
                      <TableRow className="border-b" style={{ borderColor: '#E1E4EA' }}>
                        <TableCell className="py-4">
                          <div className="d-flex align-items-center gap-3">
                            <div 
                              className="shop-img overflow-hidden d-flex align-items-center justify-content-center"
                              style={{ 
                                width: '80px', 
                                height: '50px', 
                                borderRadius: '8px',
                                backgroundColor: '#F5F7FA',
                                border: '1px solid #E1E4EA',
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src="https://logo.clearbit.com/wearfelicity.com"
                                alt="wearfelicity"
                                style={{ maxWidth: '60px', maxHeight: '40px', objectFit: 'contain' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?sz=64&domain=wearfelicity.com';
                                }}
                              />
                            </div>
                            <div>
                              <p className="mb-0 fw-500" style={{ fontSize: '14px', color: '#0E121B' }}>wearfelicity</p>
                              <a href="https://www.wearfelicity.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#525866', textDecoration: 'none' }}>www.wearfelicity.com</a>
                              <br />
                              <span 
                                className="badge" 
                                style={{ 
                                  background: '#335CFF', 
                                  color: 'white',
                                  fontSize: '10px',
                                  padding: '3px 10px',
                                  borderRadius: '4px',
                                  marginTop: '4px',
                                  fontWeight: 600,
                                }}
                              >EXEMPLE</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center align-middle">
                          <span className="fi fi-us fis" style={{ fontSize: '24px', borderRadius: '50%', overflow: 'hidden', display: 'inline-block', width: '28px', height: '28px', lineHeight: '28px' }}></span>
                        </TableCell>
                        <TableCell className="text-center align-middle">
                          <span style={{ fontSize: '13px', color: '#525866' }}>Version d'essai</span>
                        </TableCell>
                        <TableCell className="text-end align-middle">
                          <div className="d-flex gap-2 justify-content-end align-items-center">
                            <a
                              href="https://app.copyfy.io/download/products/demo/copyfy-pe-demo-www.wearfelicity.com.csv"
                              download
                              className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                              title="Télécharger le fichier CSV"
                              style={{ width: '40px', height: '40px', borderRadius: '8px' }}
                            >
                              <i className="ri-download-line" style={{ fontSize: '18px' }}></i>
                            </a>
                            <a
                              href="/dashboard/ai-shop?product=www.wearfelicity.com/products/example"
                              className="btn btn-secondary d-flex align-items-center gap-2"
                              style={{ fontSize: '13px', borderRadius: '8px', padding: '8px 14px', height: '40px' }}
                            >
                              <img src="/img/shopify-logo-min.png" alt="Shopify" width="18" height="18" style={{ objectFit: 'contain' }} />
                              <span>Mettre à jour le thème</span>
                            </a>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Example 2 - omniluxled */}
                      <TableRow className="border-b" style={{ borderColor: '#E1E4EA' }}>
                        <TableCell className="py-4">
                          <div className="d-flex align-items-center gap-3">
                            <div 
                              className="shop-img overflow-hidden d-flex align-items-center justify-content-center"
                              style={{ 
                                width: '80px', 
                                height: '50px', 
                                borderRadius: '8px',
                                backgroundColor: '#F5F7FA',
                                border: '1px solid #E1E4EA',
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src="https://logo.clearbit.com/omniluxled.com"
                                alt="omniluxled"
                                style={{ maxWidth: '60px', maxHeight: '40px', objectFit: 'contain' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?sz=64&domain=omniluxled.com';
                                }}
                              />
                            </div>
                            <div>
                              <p className="mb-0 fw-500" style={{ fontSize: '14px', color: '#0E121B' }}>omniluxled</p>
                              <a href="https://www.omniluxled.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#525866', textDecoration: 'none' }}>www.omniluxled.com</a>
                              <br />
                              <span 
                                className="badge" 
                                style={{ 
                                  background: '#335CFF', 
                                  color: 'white',
                                  fontSize: '10px',
                                  padding: '3px 10px',
                                  borderRadius: '4px',
                                  marginTop: '4px',
                                  fontWeight: 600,
                                }}
                              >EXEMPLE</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center align-middle">
                          <span className="fi fi-fr fis" style={{ fontSize: '24px', borderRadius: '50%', overflow: 'hidden', display: 'inline-block', width: '28px', height: '28px', lineHeight: '28px' }}></span>
                        </TableCell>
                        <TableCell className="text-center align-middle">
                          <span style={{ fontSize: '13px', color: '#525866' }}>Version d'essai</span>
                        </TableCell>
                        <TableCell className="text-end align-middle">
                          <div className="d-flex gap-2 justify-content-end align-items-center">
                            <a
                              href="https://app.copyfy.io/download/products/demo/copyfy-pe-demo-www.omniluxled.com.csv"
                              download
                              className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                              title="Télécharger le fichier CSV"
                              style={{ width: '40px', height: '40px', borderRadius: '8px' }}
                            >
                              <i className="ri-download-line" style={{ fontSize: '18px' }}></i>
                            </a>
                            <a
                              href="/dashboard/ai-shop?product=www.omniluxled.com/products/example"
                              className="btn btn-secondary d-flex align-items-center gap-2"
                              style={{ fontSize: '13px', borderRadius: '8px', padding: '8px 14px', height: '40px' }}
                            >
                              <img src="/img/shopify-logo-min.png" alt="Shopify" width="18" height="18" style={{ objectFit: 'contain' }} />
                              <span>Mettre à jour le thème</span>
                            </a>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Example 3 - trybeautie */}
                      <TableRow className="border-b" style={{ borderColor: '#E1E4EA' }}>
                        <TableCell className="py-4">
                          <div className="d-flex align-items-center gap-3">
                            <div 
                              className="shop-img overflow-hidden d-flex align-items-center justify-content-center"
                              style={{ 
                                width: '80px', 
                                height: '50px', 
                                borderRadius: '8px',
                                backgroundColor: '#F5F7FA',
                                border: '1px solid #E1E4EA',
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src="https://logo.clearbit.com/trybeautie.com"
                                alt="trybeautie"
                                style={{ maxWidth: '60px', maxHeight: '40px', objectFit: 'contain' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?sz=64&domain=trybeautie.com';
                                }}
                              />
                            </div>
                            <div>
                              <p className="mb-0 fw-500" style={{ fontSize: '14px', color: '#0E121B' }}>trybeautie</p>
                              <a href="https://www.trybeautie.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#525866', textDecoration: 'none' }}>www.trybeautie.com</a>
                              <br />
                              <span 
                                className="badge" 
                                style={{ 
                                  background: '#335CFF', 
                                  color: 'white',
                                  fontSize: '10px',
                                  padding: '3px 10px',
                                  borderRadius: '4px',
                                  marginTop: '4px',
                                  fontWeight: 600,
                                }}
                              >EXEMPLE</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center align-middle">
                          <span className="fi fi-es fis" style={{ fontSize: '24px', borderRadius: '50%', overflow: 'hidden', display: 'inline-block', width: '28px', height: '28px', lineHeight: '28px' }}></span>
                        </TableCell>
                        <TableCell className="text-center align-middle">
                          <span style={{ fontSize: '13px', color: '#525866' }}>Version d'essai</span>
                        </TableCell>
                        <TableCell className="text-end align-middle">
                          <div className="d-flex gap-2 justify-content-end align-items-center">
                            <a
                              href="https://app.copyfy.io/download/products/demo/copyfy-pe-demo-www.trybeautie.com.csv"
                              download
                              className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                              title="Télécharger le fichier CSV"
                              style={{ width: '40px', height: '40px', borderRadius: '8px' }}
                            >
                              <i className="ri-download-line" style={{ fontSize: '18px' }}></i>
                            </a>
                            <a
                              href="/dashboard/ai-shop?product=www.trybeautie.com/products/example"
                              className="btn btn-secondary d-flex align-items-center gap-2"
                              style={{ fontSize: '13px', borderRadius: '8px', padding: '8px 14px', height: '40px' }}
                            >
                              <img src="/img/shopify-logo-min.png" alt="Shopify" width="18" height="18" style={{ objectFit: 'contain' }} />
                              <span>Mettre à jour le thème</span>
                            </a>
                          </div>
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
