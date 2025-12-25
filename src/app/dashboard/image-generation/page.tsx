"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardHeader from "@/components/DashboardHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAI } from "@/lib/hooks/use-ai";

interface GeneratedImage {
  id: number;
  status: string;
  originalImageUrl: string | null;
  generatedImageUrl: string | null;
  processingTime: number | null;
  cost: number | null;
  createdAt: string;
}

const PROMPT_TYPES = [
  {
    id: 'lifestyle',
    title: 'Lifestyle',
    description: 'Montrez une vraie personne utilisant le produit',
    icon: 'ri-user-smile-line',
  },
  {
    id: 'packshot',
    title: 'Packshot',
    description: 'Photo produit professionnelle sur fond neutre',
    icon: 'ri-camera-line',
  },
  {
    id: 'image-text',
    title: 'Image + Texte',
    description: 'Ajoutez un texte promotionnel accrocheur',
    icon: 'ri-text',
  },
  {
    id: 'custom',
    title: 'Personnalisé',
    description: 'Créez votre propre prompt',
    icon: 'ri-magic-line',
  },
];

export default function ImageGenerationPage() {
  const [imageUrl, setImageUrl] = useState("");
  const [selectedPromptType, setSelectedPromptType] = useState<string>('lifestyle');
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { generateImage, getCredits } = useAI();

  useEffect(() => {
    loadCredits();
    loadHistory();
  }, []);

  const loadCredits = async () => {
    try {
      const creditsData = await getCredits();
      setCredits(creditsData.imageGeneration);
    } catch (err) {
      console.error("Failed to load credits:", err);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/ai/generate-image');
      const data = await res.json();
      if (data.success) {
        setGeneratedImages(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageUrl.trim()) {
      setError("Veuillez entrer l'URL de l'image");
      return;
    }

    if (selectedPromptType === 'custom' && !customPrompt.trim()) {
      setError("Veuillez entrer un prompt personnalisé");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateImage({
        imageUrl: imageUrl.trim(),
        promptType: selectedPromptType as 'lifestyle' | 'packshot' | 'image-text' | 'custom',
        customPrompt: selectedPromptType === 'custom' ? customPrompt : undefined,
      });

      // Refresh history and credits
      await loadHistory();
      await loadCredits();
      
      setImageUrl("");
      setCustomPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <>
      <DashboardHeader title="Génération d'images IA" />

      <div className="bg-weak-50 home-content-wrapper">
        <div className="container py-4">
          {/* Credits Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="alert alert-info d-flex align-items-center justify-content-between mb-4"
          >
            <div>
              <i className="ri-image-add-line me-2"></i>
              <strong>Crédits restants:</strong> {credits ?? '-'} générations
            </div>
            {credits === 0 && (
              <a href="/dashboard/plans" className="btn btn-primary btn-sm">
                Obtenir plus de crédits
              </a>
            )}
          </motion.div>

          <div className="row g-4">
            {/* Generation Form */}
            <div className="col-lg-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card sticky-top"
                style={{ top: 20 }}
              >
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="ri-magic-line me-2"></i>
                    Générer une image
                  </h5>
                </div>
                <div className="card-body">
                  {error && (
                    <div className="alert alert-danger py-2">
                      {error}
                      <button 
                        type="button" 
                        className="btn-close btn-sm" 
                        onClick={() => setError(null)}
                      ></button>
                    </div>
                  )}

                  <form onSubmit={handleGenerate}>
                    {/* Image URL */}
                    <div className="mb-4">
                      <label className="form-label fw-500">URL de l'image source</label>
                      <Input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        disabled={isGenerating}
                      />
                      <small className="text-muted">
                        Collez l'URL d'une image de produit
                      </small>
                    </div>

                    {/* Prompt Type Selection */}
                    <div className="mb-4">
                      <label className="form-label fw-500">Type de génération</label>
                      <div className="row g-2">
                        {PROMPT_TYPES.map((type) => (
                          <div key={type.id} className="col-6">
                            <button
                              type="button"
                              className={`btn w-100 text-start p-3 ${
                                selectedPromptType === type.id 
                                  ? 'btn-primary' 
                                  : 'btn-outline-secondary'
                              }`}
                              onClick={() => setSelectedPromptType(type.id)}
                              disabled={isGenerating}
                            >
                              <i className={`${type.icon} fs-4 d-block mb-1`}></i>
                              <strong className="d-block">{type.title}</strong>
                              <small className={selectedPromptType === type.id ? 'text-white-50' : 'text-muted'}>
                                {type.description}
                              </small>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Custom Prompt */}
                    {selectedPromptType === 'custom' && (
                      <div className="mb-4">
                        <label className="form-label fw-500">Prompt personnalisé</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Décrivez l'image que vous souhaitez générer..."
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          disabled={isGenerating}
                        />
                      </div>
                    )}

                    {/* Generate Button */}
                    <Button
                      type="submit"
                      className="w-100"
                      disabled={isGenerating || !imageUrl.trim() || credits === 0}
                    >
                      {isGenerating ? (
                        <>
                          <span className="rotating me-2">
                            <i className="ri-loader-2-line"></i>
                          </span>
                          Génération en cours...
                        </>
                      ) : (
                        <>
                          <i className="ri-magic-line me-2"></i>
                          Générer l'image
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </motion.div>
            </div>

            {/* History */}
            <div className="col-lg-7">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h5 className="mb-3">
                  <i className="ri-history-line me-2"></i>
                  Historique des générations
                </h5>

                {generatedImages.length === 0 ? (
                  <div className="card">
                    <div className="card-body text-center py-5">
                      <i className="ri-image-line fs-1 text-muted mb-3 d-block"></i>
                      <h6>Aucune image générée</h6>
                      <p className="text-muted mb-0">
                        Vos images générées apparaîtront ici
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="row g-3">
                    {generatedImages.map((image, index) => (
                      <motion.div
                        key={image.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="col-6"
                      >
                        <div className="card h-100">
                          <div 
                            className="card-img-top position-relative"
                            style={{ height: 200, background: '#f8f9fa' }}
                          >
                            {image.status === 'completed' && image.generatedImageUrl ? (
                              <img
                                src={image.generatedImageUrl}
                                alt="Generated"
                                className="w-100 h-100"
                                style={{ objectFit: 'cover' }}
                              />
                            ) : image.status === 'processing' ? (
                              <div className="d-flex align-items-center justify-content-center h-100">
                                <div className="text-center">
                                  <div className="spinner-border text-primary mb-2" role="status"></div>
                                  <p className="mb-0 small">En cours...</p>
                                </div>
                              </div>
                            ) : image.status === 'failed' ? (
                              <div className="d-flex align-items-center justify-content-center h-100">
                                <div className="text-center text-danger">
                                  <i className="ri-error-warning-line fs-1 mb-2 d-block"></i>
                                  <p className="mb-0 small">Échec</p>
                                </div>
                              </div>
                            ) : (
                              <div className="d-flex align-items-center justify-content-center h-100">
                                <i className="ri-image-line fs-1 text-muted"></i>
                              </div>
                            )}

                            {/* Status Badge */}
                            <span 
                              className={`badge position-absolute ${
                                image.status === 'completed' ? 'bg-success' :
                                image.status === 'processing' ? 'bg-warning' :
                                image.status === 'failed' ? 'bg-danger' : 'bg-secondary'
                              }`}
                              style={{ top: 10, left: 10 }}
                            >
                              {image.status === 'completed' ? 'Terminé' :
                               image.status === 'processing' ? 'En cours' :
                               image.status === 'failed' ? 'Échec' : image.status}
                            </span>
                          </div>

                          <div className="card-body py-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                {new Date(image.createdAt).toLocaleDateString('fr-FR')}
                              </small>
                              {image.status === 'completed' && image.generatedImageUrl && (
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleDownload(
                                    image.generatedImageUrl!,
                                    `generated-${image.id}.png`
                                  )}
                                >
                                  <i className="ri-download-line"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
