"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
import { useAI } from "@/lib/hooks/use-ai";

interface GeneratedShop {
  id: number;
  title: string;
  productUrl: string;
  image: string;
  language: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  shopifyUrl?: string;
  createdAt: string;
}

export default function AIShopPage() {
  const { data: session } = useSession();
  const [productUrl, setProductUrl] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationHistory, setGenerationHistory] = useState<GeneratedShop[]>([]);
  const [credits, setCredits] = useState<number | null>(null);

  const { getCredits } = useAI();

  // Load credits and history on mount
  useEffect(() => {
    loadCredits();
    loadHistory();
  }, []);

  const loadCredits = async () => {
    try {
      const creditsData = await getCredits();
      setCredits(creditsData.generateProduct);
    } catch (err) {
      console.error("Failed to load credits:", err);
    }
  };

  const loadHistory = async () => {
    // TODO: Implement API endpoint for shop generation history
    // For now, using placeholder
    setGenerationHistory([]);
  };

  const handleGenerate = async () => {
    if (!productUrl.trim()) {
      setError("Veuillez entrer l'URL d'un produit");
      return;
    }

    // Validate URL format
    const isValidUrl = productUrl.includes('aliexpress.com') || productUrl.includes('amazon.com');
    if (!isValidUrl) {
      setError("Veuillez entrer un lien AliExpress ou Amazon valide");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // TODO: Call actual API endpoint when implemented
      // const result = await fetch('/api/ai/generate-shop', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ productUrl, language: selectedLanguage }),
      // })
      
      // Placeholder: Show coming soon message
      setError("Cette fonctionnalité sera bientôt disponible. Veuillez configurer votre intégration Shopify dans les paramètres.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <DashboardHeader
        title="Créez votre boutique avec l'IA"
        subtitle="Créez une boutique Shopify optimisée en quelques secondes"
        icon="fa-brands fa-shopify"
        iconType="icon"
        showSearch={false}
        showStats={false}
      >
        {/* Shop Generation Credits */}
        <div          className="progress-circle d-flex gap-2 flex-row"
        >
          <div className="progress-circle-wrapper">
            {credits === null ? (
              <div className="spinner-border spinner-border-sm" role="status"></div>
            ) : credits === -1 ? (
              <i className="ri-infinity-fill"></i>
            ) : (
              <span className="fw-bold">{credits}</span>
            )}
          </div>
          <div className="progress-details">
            <div className="progress-text">{credits === -1 ? '∞' : credits ?? '...'}</div>
            <div className="progress-label">Génération de boutique</div>
          </div>
        </div>
      </DashboardHeader>

      <div className="bg-white home-content-wrapper">
        <div className="container-fluid px-2 px-md-4 py-5">
          
          {/* Error Message */}
          {error && (
            <div              className="alert alert-warning mx-auto mb-4 d-flex justify-content-between align-items-center"
              style={{ maxWidth: '900px' }}
            >
              <span>{error}</span>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setError(null)}
              ></button>
            </div>
          )}

          {/* Hero Section */}
          <div            className="text-center mx-auto"
            style={{ maxWidth: '900px', marginTop: '40px', marginBottom: '50px' }}
          >
            <h2 className="fw-400 mb-3" style={{ fontSize: 'clamp(20px, 5vw, 26px)', color: '#0E121B' }}>
              Créez votre boutique en quelques secondes avec{' '}
              <span style={{
                background: 'linear-gradient(90deg, #476CFF 0%, #0C6CFB 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 600
              }}>CopyfyAI</span>
              <sup>
                <span className="badge bg-success-new ms-2 align-middle" style={{ fontSize: '10px', fontWeight: 500, verticalAlign: 'super' }}>
                  NEW
                </span>
              </sup>
            </h2>
            <p className="text-sub mb-0" style={{ fontSize: '15px', lineHeight: '1.6', color: '#6B7280' }}>
              Transformez un lien de produit en boutique qui convertie. Collez le lien{' '}
              <span className="export-aliexpress-gradient">AliExpress</span> ou{' '}
              <span className="export-shopify-gradient">Amazon</span> ci-dessous, générez et personnalisez.
            </p>
          </div>

          {/* Input Section */}
          <div            className="ai-shop-input-wrapper mx-auto"
          >
            <div className="ai-shop-input-section">
              {/* URL Input */}
              <div className="position-relative" style={{ flexGrow: 1, width: '400px', maxWidth: '100%' }}>
                <Input
                  type="text"
                  className="ai-shop-url-input form-control design-2"
                  placeholder="https://www.aliexpress.com/item/10050082978909342..."
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  disabled={isGenerating || credits === 0}
                />
              </div>

              {/* Language Select */}
              <select
                className="ai-shop-lang-select form-select design-2"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                disabled={isGenerating}
              >
                <option value="en">Anglais</option>
                <option value="fr">Français</option>
                <option value="es">Espagnol</option>
                <option value="de">Allemand</option>
                <option value="it">Italien</option>
                <option value="pt">Portugais</option>
              </select>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                className="ai-shop-generate-btn btn btn-primary"
                disabled={isGenerating || !productUrl.trim() || credits === 0}
              >
                {isGenerating ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Génération...
                  </>
                ) : (
                  <>
                    <i className="ri-sparkling-line me-2"></i>
                    Générer
                  </>
                )}
              </Button>
            </div>

            {/* Shopify Setup Notice */}
            {!session?.user?.shopifyDomain && (
              <div className="alert alert-info mt-3 mx-auto" style={{ maxWidth: '600px' }}>
                <i className="ri-information-line me-2"></i>
                <a href="/dashboard/settings" className="alert-link">
                  Connectez votre boutique Shopify
                </a>
                {' '}dans les paramètres pour utiliser cette fonctionnalité.
              </div>
            )}
          </div>

          {/* History Section */}
          <div            className="table-view mx-auto mt-5"
            style={{ maxWidth: '1200px' }}
          >
            <h3 className="fs-normal fw-600 mb-4">Historique</h3>

            <div className="table-wrapper" style={{ overflowX: 'auto', paddingBottom: '50px' }}>
              <Table className="table mb-0" style={{ minWidth: '800px' }}>
                <TableHeader className="bg-weak-50">
                  <TableRow className="border-0">
                    <TableHead scope="col" className="border-0 text-uppercase fw-600" style={{ color: '#525866', fontSize: '12px' }}>
                      Les produits
                    </TableHead>
                    <TableHead scope="col" className="border-0 text-uppercase fw-600" style={{ color: '#525866', fontSize: '12px' }}>
                      Langue du site
                    </TableHead>
                    <TableHead scope="col" className="border-0 text-uppercase fw-600" style={{ color: '#525866', fontSize: '12px' }}>
                      Statut
                    </TableHead>
                    <TableHead scope="col" className="border-0 text-uppercase fw-600" style={{ color: '#525866', fontSize: '12px' }}>
                      Date
                    </TableHead>
                    <TableHead scope="col" className="border-0 text-uppercase fw-600 text-end" style={{ color: '#525866', fontSize: '12px' }}>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generationHistory.length > 0 ? (
                    generationHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="align-middle py-3 border-b-gray">
                          <div className="d-flex align-items-center gap-3">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="rounded"
                              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/img_not_found.png';
                              }}
                            />
                            <div>
                              <p className="mb-0 fw-500 fs-small">{item.title}</p>
                              <a
                                href={item.productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted text-decoration-none"
                                style={{ fontSize: '11px' }}
                              >
                                {item.productUrl.length > 50 ? item.productUrl.substring(0, 50) + '...' : item.productUrl}
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle py-3 border-b-gray">
                          <img
                            src={`/flags/${item.language}.svg`}
                            alt={item.language}
                            style={{ width: '24px', height: '18px' }}
                          />
                        </TableCell>
                        <TableCell className="align-middle py-3 border-b-gray">
                          <span className={`badge ${
                            item.status === 'completed' ? 'bg-success' :
                            item.status === 'processing' ? 'bg-warning' :
                            item.status === 'failed' ? 'bg-danger' : 'bg-secondary'
                          } text-white px-2 py-1 fs-xs`}>
                            {item.status === 'completed' ? 'Terminé' :
                             item.status === 'processing' ? 'En cours' :
                             item.status === 'failed' ? 'Échec' : 'En attente'}
                          </span>
                        </TableCell>
                        <TableCell className="align-middle py-3 border-b-gray text-sub fs-small">
                          {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="align-middle py-3 border-b-gray text-end">
                          {item.status === 'completed' && item.shopifyUrl && (
                            <a 
                              href={item.shopifyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary btn-sm text-decoration-none"
                            >
                              <i className="ri-external-link-line me-1"></i>
                              Voir la boutique
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-5">
                        <div className="d-flex flex-column align-items-center gap-3">
                          <div 
                            className="d-flex align-items-center justify-content-center rounded-circle"
                            style={{ width: '56px', height: '56px', backgroundColor: '#EFF6FF' }}
                          >
                            <i className="ri-store-2-line" style={{ fontSize: '28px', color: '#0c6cfb' }}></i>
                          </div>
                          <div>
                            <h4 className="fw-600 fs-normal mb-1">Aucune boutique générée</h4>
                            <p className="text-sub fs-small mb-0">
                              Entrez un lien de produit AliExpress ou Amazon pour créer votre première boutique.
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
