"use client";

import { useState, useEffect } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/hooks/use-settings";
import { useShopify } from "@/lib/hooks/use-shopify";
import { cn } from "@/lib/utils";

type Tab = "profile" | "password" | "tarification" | "shopify";

const LANGUAGES = [
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
];

export default function SettingsPage() {
  const { settings, isLoading, error, fetchSettings, updateSettings } = useSettings();
  const { shop, connected, disconnect } = useShopify();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [name, setName] = useState("");
  const [lang, setLang] = useState("fr");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [showPlans, setShowPlans] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "quarterly" | "annual">("monthly");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setName(settings.profile.name || "");
      setLang(settings.profile.lang || "fr");
    }
  }, [settings]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      await updateSettings({ name, lang });
      setSaveSuccess("Profil mis à jour avec succès!");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setSaveError("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 8) {
      setSaveError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      await updateSettings({ currentPassword, newPassword });
      setSaveSuccess("Mot de passe mis à jour avec succès!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnectShopify = async () => {
    if (!confirm("Êtes-vous sûr de vouloir déconnecter votre boutique Shopify?")) {
      return;
    }

    try {
      await disconnect();
      setSaveSuccess("Boutique Shopify déconnectée");
    } catch (err) {
      setSaveError("Erreur lors de la déconnexion");
    }
  };

  const selectedLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  if (isLoading) {
    return (
      <>
        <DashboardHeader title="Paramètres" />
        <div className="bg-weak-50 home-content-wrapper">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader title="Paramètres" />

      <div className="bg-weak-50 home-content-wrapper">
        <div className="p-3 w-max-width-xl mx-auto">
          {/* Alerts */}
          {saveError && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {saveError}
              <button type="button" className="btn-close" onClick={() => setSaveError(null)}></button>
            </div>
          )}
          {saveSuccess && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {saveSuccess}
              <button type="button" className="btn-close" onClick={() => setSaveSuccess(null)}></button>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="d-flex justify-content-center mb-4">
            <div className="nav nav-pills gap-2 settings-nav" role="tablist">
              <button
                type="button"
                className={cn("nav-link px-4 py-2 d-flex align-items-center gap-2", activeTab === "profile" && "active")}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTab("profile"); }}
              >
                <i className="ri-user-line"></i>
                Profil
              </button>
              <button
                type="button"
                className={cn("nav-link px-4 py-2 d-flex align-items-center gap-2", activeTab === "password" && "active")}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTab("password"); }}
              >
                <i className="ri-key-2-line"></i>
                Mot de passe
              </button>
              <button
                type="button"
                className={cn("nav-link px-4 py-2 d-flex align-items-center gap-2", activeTab === "tarification" && "active")}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTab("tarification"); }}
              >
                <i className="ri-file-list-3-line"></i>
                Tarification
              </button>
              <button
                type="button"
                className={cn("nav-link px-4 py-2 d-flex align-items-center gap-2", activeTab === "shopify" && "active")}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTab("shopify"); }}
              >
                <i className="ri-shopping-bag-line"></i>
                Shopify
              </button>
            </div>
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="border-gray p-lg-3 p-md-3 p-1 rounded-15 border-1 bg-white shadow-sm">
              <div className="p-lg-4 p-3">
                <form onSubmit={handleProfileUpdate}>
                  <div className="mb-4">
                    <label className="form-label text-muted small">Nom d'utilisateur</label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Votre nom"
                      className="form-control py-3"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-muted small">Adresse e-mail</label>
                    <Input
                      type="email"
                      value={settings?.profile.email || ""}
                      disabled
                      className="form-control py-3 bg-light"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-muted small">Sélectionnez la langue</label>
                    <div className="position-relative">
                      <button
                        type="button"
                        className="form-control d-flex align-items-center gap-2 text-start py-3"
                        onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                        style={{ cursor: "pointer" }}
                      >
                        <span style={{ fontSize: "1.2rem" }}>{selectedLang.flag}</span>
                        <span>{selectedLang.name}</span>
                        <i className="ri-arrow-down-s-line ms-auto"></i>
                      </button>
                      {langDropdownOpen && (
                        <div 
                          className="position-absolute w-100 bg-white border rounded-3 shadow-sm mt-1 z-3"
                          style={{ zIndex: 1000 }}
                        >
                          {LANGUAGES.map((language) => (
                            <button
                              key={language.code}
                              type="button"
                              className={cn(
                                "d-flex align-items-center gap-2 w-100 px-3 py-2 border-0 bg-transparent text-start",
                                lang === language.code && "bg-primary text-white"
                              )}
                              onClick={() => {
                                setLang(language.code);
                                setLangDropdownOpen(false);
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <span style={{ fontSize: "1.2rem" }}>{language.flag}</span>
                              <span>{language.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-4">
                    <Button type="submit" className="btn-primary px-4" disabled={isSaving}>
                      {isSaving ? (
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      ) : null}
                      Enregistrer
                    </Button>
                    <Button type="button" variant="ghost" className="text-muted">
                      Annuler
                    </Button>
                  </div>
                </form>

                {!settings?.subscription && (
                  <div className="mt-4 pt-3 border-top">
                    <button
                      type="button"
                      className="btn btn-link text-danger p-0 text-decoration-none"
                      onClick={() => {
                        if (confirm("Êtes-vous sûr de vouloir désactiver votre compte? Cette action est irréversible.")) {
                          alert("Fonctionnalité à venir");
                        }
                      }}
                    >
                      Désactiver le compte
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <div className="border-gray p-lg-3 p-md-3 p-1 rounded-15 border-1 bg-white shadow-sm">
              <div className="p-lg-4 p-3">
                <h5 className="fw-semibold mb-4">Password</h5>
                <form onSubmit={handlePasswordUpdate}>
                  <div className="mb-4">
                    <label className="form-label text-muted small">Mot de passe actuel</label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Mot de passe actuel"
                      className="form-control py-3"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-muted small">Nouveau mot de passe</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nouveau mot de passe"
                      className="form-control py-3"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-muted small">Confirmation du nouveau mot de passe</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmation du nouveau mot de passe"
                      className="form-control py-3"
                    />
                  </div>

                  <div className="d-flex gap-2 mt-4">
                    <Button type="submit" className="btn-primary px-4" disabled={isSaving || !currentPassword || !newPassword}>
                      {isSaving ? (
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      ) : null}
                      Enregistrer
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="text-muted"
                      onClick={() => {
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Tarification Tab */}
          {activeTab === "tarification" && (
            <div>
              {/* Black Friday Banner */}
              <BlackFridayBanner currentPlan={settings?.subscription?.planIdentifier} />

              {/* Show/Hide Plans Toggle */}
              <div className="text-center mb-4">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary rounded-pill px-4 py-2"
                  onClick={() => setShowPlans(!showPlans)}
                >
                  <span>{showPlans ? "Masquer les autres plans" : "Voir les autres plans"}</span>
                  <i className={cn("ms-2", showPlans ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line")}></i>
                </button>
              </div>

              {/* Plans Container */}
              {showPlans && (
                <div className="plan-container">
                  {/* Billing Period Toggle */}
                  <div className="d-flex justify-content-center mt-4 mb-4">
                    <div className="btn-switch-wrapper d-flex align-items-center bg-light">
                      <button
                        type="button"
                        className={cn("btn btn-switch px-3 py-2", billingPeriod === "monthly" && "active")}
                        onClick={() => setBillingPeriod("monthly")}
                      >
                        Mensuel
                      </button>
                      <button
                        type="button"
                        className={cn("btn btn-switch px-3 py-2", billingPeriod === "quarterly" && "active")}
                        onClick={() => setBillingPeriod("quarterly")}
                      >
                        Trimestriel
                        <span className={cn("badge ms-2", billingPeriod === "quarterly" ? "" : "bg-info-light")}>3mo</span>
                      </button>
                      <button
                        type="button"
                        className={cn("btn btn-switch px-3 py-2", billingPeriod === "annual" && "active")}
                        onClick={() => setBillingPeriod("annual")}
                      >
                        Annuel
                        <span className={cn("badge ms-2", billingPeriod === "annual" ? "" : "bg-success-light")}>40%</span>
                      </button>
                    </div>
                  </div>

                  {/* Pricing Cards */}
                  <PricingCards 
                    billingPeriod={billingPeriod} 
                    currentPlan={settings?.subscription?.planIdentifier}
                  />

                  {/* Trust Badges */}
                  <div className="d-flex justify-content-center align-items-center gap-4 flex-wrap mt-4">
                    <img src="/img/trust-pilot.png" alt="Trustpilot" style={{ height: 40 }} />
                    <div className="d-flex align-items-center gap-2 border rounded-3 p-2">
                      <div className="d-flex">
                        {[1, 2, 3].map((i) => (
                          <div 
                            key={i}
                            className="rounded-circle bg-secondary border border-white" 
                            style={{ width: 26, height: 26, marginLeft: i > 1 ? -8 : 0 }}
                          ></div>
                        ))}
                      </div>
                      <span className="small">
                        <strong className="text-primary">+279</strong> E-Commerçants ont rejoint Copyfy cette semaine
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shopify Tab */}
          {activeTab === "shopify" && (
            <div className="border-gray p-lg-3 p-md-3 p-1 rounded-15 border-1 bg-white shadow-sm">
              <div className="p-lg-4 p-3">
                {connected && shop ? (
                  <div>
                    <div className="d-flex align-items-center mb-4">
                      <img
                        src="/img/shopify-logo-min.png"
                        alt="Shopify"
                        width={50}
                        height={50}
                        className="me-3"
                      />
                      <div>
                        <p className="mb-0 fw-semibold">{shop.name || shop.domain}</p>
                        <small className="text-muted">{shop.domain}.myshopify.com</small>
                      </div>
                      <span className="badge bg-success ms-auto">Connecté</span>
                    </div>
                    <div className="row g-3 mb-4">
                      <div className="col-6 col-md-3">
                        <div className="bg-light rounded-3 p-3 text-center">
                          <p className="mb-0 text-muted small">Produits</p>
                          <p className="mb-0 fw-bold fs-5">{shop.productCount || 0}</p>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="bg-light rounded-3 p-3 text-center">
                          <p className="mb-0 text-muted small">Commandes</p>
                          <p className="mb-0 fw-bold fs-5">{shop.orderCount || 0}</p>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="bg-light rounded-3 p-3 text-center">
                          <p className="mb-0 text-muted small">Pays</p>
                          <p className="mb-0 fw-bold fs-5">{shop.country || "-"}</p>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="bg-light rounded-3 p-3 text-center">
                          <p className="mb-0 text-muted small">Devise</p>
                          <p className="mb-0 fw-bold fs-5">{shop.currency || "-"}</p>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleDisconnectShopify}>
                      <i className="ri-link-unlink me-2"></i>
                      Déconnecter
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <img
                      src="/img/shopify-logo-min.png"
                      alt="Shopify"
                      width={80}
                      height={80}
                      className="mb-4"
                    />
                    <h5 className="fw-semibold mb-2">Aucune boutique connectée</h5>
                    <p className="text-muted mb-4">
                      Connectez votre boutique Shopify pour exporter des produits et thèmes.
                    </p>
                    <Button 
                      className="btn-primary"
                      onClick={() => window.location.href = "/api/shopify/install"}
                    >
                      <i className="ri-add-line me-2"></i>
                      Connecter Shopify
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        /* Container width */
        .w-max-width-xl {
          max-width: 1200px;
        }
        
        /* Card styling */
        .border-gray {
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        .rounded-15 {
          border-radius: 15px;
        }
        
        /* Settings nav */
        .settings-nav .nav-link {
          background-color: transparent;
          border: 1px solid #e5e7eb;
          color: #6b7280;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .settings-nav .nav-link:hover {
          background-color: #f3f4f6;
          color: #374151;
        }
        .settings-nav .nav-link.active {
          background-color: #2563eb;
          border-color: #2563eb;
          color: white;
        }
        .rounded-4 {
          border-radius: 1rem !important;
        }
        
        /* Form control styling */
        .form-control {
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 15px;
          transition: all 0.2s ease;
        }
        .form-control:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .form-label {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        
        /* Button Switch Styles for billing period */
        .btn-switch-wrapper {
          background-color: #f8f9fa !important;
          border: 1px solid #e9ecef;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          padding: 4px;
          gap: 0;
          border-radius: 12px;
          position: relative;
          overflow: hidden;
          display: inline-flex;
          width: auto;
          max-width: 600px;
        }
        .btn-switch {
          background-color: transparent;
          border: none;
          color: #495057;
          font-weight: 600;
          transition: all 0.3s ease;
          white-space: nowrap;
          line-height: 1.2;
          height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          position: relative;
          z-index: 2;
          flex: 1 1 0;
          min-width: 130px;
          padding: 8px 16px;
          font-size: 14px;
        }
        .btn-switch:hover {
          color: #007bff;
        }
        .btn-switch.active {
          background-color: #007bff;
          color: white !important;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
        }
        .btn-switch .badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          margin-left: 4px;
        }
        .btn-switch.active .badge {
          background-color: rgba(255, 255, 255, 0.25) !important;
          color: white !important;
        }
        .bg-info-light {
          background-color: rgba(23, 162, 184, 0.15);
          color: #17a2b8;
        }
        .bg-success-light {
          background-color: rgba(40, 167, 69, 0.15);
          color: #28a745;
        }
        
        /* Plan cards wrapper */
        .plan-wrapper {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        .subscription-box {
          flex: 1;
          min-width: 280px;
          max-width: 350px;
        }
        @media (max-width: 991px) {
          .subscription-box {
            max-width: 100%;
          }
        }
      `}</style>
    </>
  );
}

// Black Friday Banner Component
function BlackFridayBanner({ currentPlan }: { currentPlan?: string }) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const endDate = new Date('2026-01-06T23:59:59').getTime();
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = endDate - now;

      if (distance < 0) return;

      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const isCurrentPlan = currentPlan === "pro-quarterly";

  return (
    <div className="bf-banner mb-4">
      {/* Countdown */}
      <div className="bf-countdown-wrapper">
        <div className="bf-countdown">
          <div className="bf-countdown-item">
            <div className="bf-countdown-number">{String(countdown.days).padStart(2, '0')}</div>
            <div className="bf-countdown-label">JOURS</div>
          </div>
          <div className="bf-countdown-separator">:</div>
          <div className="bf-countdown-item">
            <div className="bf-countdown-number">{String(countdown.hours).padStart(2, '0')}</div>
            <div className="bf-countdown-label">HEURES</div>
          </div>
          <div className="bf-countdown-separator">:</div>
          <div className="bf-countdown-item">
            <div className="bf-countdown-number">{String(countdown.minutes).padStart(2, '0')}</div>
            <div className="bf-countdown-label">MIN</div>
          </div>
          <div className="bf-countdown-separator">:</div>
          <div className="bf-countdown-item">
            <div className="bf-countdown-number">{String(countdown.seconds).padStart(2, '0')}</div>
            <div className="bf-countdown-label">SEC</div>
          </div>
        </div>
      </div>

      <div className="bf-banner-inner">
        {/* Left Section */}
        <div className="bf-left-section-wrapper">
          <div className="bf-left-section">
            {/* Confetti */}
            {[...Array(14)].map((_, i) => (
              <div key={i} className={`bf-confetti bf-confetti-${i + 1}`}></div>
            ))}
            
            <div className="bf-badge-banner">Pour les plus ambitieux</div>
            <h2 className="bf-title">Offre spéciale Q4 Black Friday</h2>
            
            <div className="bf-price-wrapper">
              <div>
                <div className="bf-price">
                  <span className="bf-actual-price me-1">€89</span>€49
                  <span>/par mois</span>
                </div>
              </div>
              <div className="d-flex align-items-center gap-1">
                <span className="bf-saved-badge">-45%</span>
                <span className="bf-save-badge">Économisez $120</span>
              </div>
            </div>

            <p className="bf-billing-text">facturé trimestriellement</p>

            {isCurrentPlan ? (
              <span className="bf-cta-button bf-cta-current">
                <i className="ri-check-line me-1"></i>Votre plan actuel
              </span>
            ) : (
              <a href="/dashboard/plans?offer=blackfriday" className="bf-cta-button">
                Commencer maintenant
              </a>
            )}

            <p className="bf-cancel-text">
              Sans engagement. <span>Annulez à tout moment.</span>
            </p>
          </div>
        </div>

        {/* Right Section - Features */}
        <div className="bf-right-section">
          <div className="bf-features-wrapper">
            <div className="bf-features-column">
              <p className="bf-features-title">Inclus :</p>
              <ul className="bf-features-list">
                <li><span className="check-icon"><i className="ri-check-line"></i></span>Copyfy Pro Plan</li>
                <li><span className="check-icon"><i className="ri-check-line"></i></span>Créations de boutiques illimités IA</li>
                <li><span className="check-icon"><i className="ri-check-line"></i></span>Produits gagnants illimité</li>
                <li><span className="check-icon"><i className="ri-check-line"></i></span>Publicités gagnantes illimité</li>
                <li><span className="check-icon"><i className="ri-check-line"></i></span>Top Boutiques illimitées</li>
              </ul>
            </div>
            <div className="bf-features-column">
              <p className="bf-features-title d-none d-md-block">&nbsp;</p>
              <ul className="bf-features-list">
                <li><span className="check-icon"><i className="ri-check-line"></i></span>Suivi et analyse de 120 boutiques</li>
                <li><span className="check-icon"><i className="ri-check-line"></i></span>Exports de produits illimités</li>
                <li><span className="check-icon"><i className="ri-check-line"></i></span>Accès à nos fournisseurs vérifiés</li>
                <li><span className="check-icon"><i className="ri-check-line"></i></span>Accès au Chatbot Copyfy IA</li>
                <li><span className="check-icon"><i className="ri-check-line"></i></span>Coaching hebdo groupé</li>
              </ul>
            </div>
          </div>

          {/* Gift Section */}
          <div className="bf-gift-section d-flex align-items-center justify-content-center">
            <div>
              <p className="bf-gift-title text-center">Et plus encore :</p>
              <div className="bf-gift-box">
                <div className="bf-gift-content">
                  <h4>20 Produits Gagnants Q4</h4>
                  <span className="free-badge">Gratuit</span>
                </div>
                <div className="bf-gift-icon">
                  <img src="/img/gift-image.png" alt="gift" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bf-banner {
          background: #111;
          border-radius: 20px;
          position: relative;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(59, 130, 246, 0.3);
          margin-top: 40px;
        }
        .bf-banner-inner {
          display: flex;
          flex-wrap: wrap;
          overflow: hidden;
          border-radius: 20px;
        }
        .bf-countdown-wrapper {
          position: absolute;
          top: -22px;
          right: 40px;
          z-index: 10;
        }
        .bf-countdown {
          display: flex;
          gap: 8px;
          background: #3b82f6;
          padding: 12px 8px;
          border-radius: 0 0 16px 16px;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
        }
        .bf-countdown-item {
          text-align: center;
          min-width: 50px;
        }
        .bf-countdown-number {
          font-weight: 600;
          color: white;
          margin-bottom: 4px;
        }
        .bf-countdown-label {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .bf-countdown-separator {
          font-size: 12px;
          font-weight: 700;
          color: white;
          opacity: 0.7;
        }
        .bf-left-section-wrapper {
          position: relative;
          margin: 20px;
          width: 424px;
          flex: 0 0 auto;
          border-radius: 18px;
          background: linear-gradient(135deg, #007AFF, #3b82f6, #3A3A3A);
          padding: 2px;
        }
        .bf-left-section {
          background: #000;
          border-radius: 16px;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }
        .bf-confetti {
          position: absolute;
          z-index: 2;
        }
        .bf-confetti-1 { top: 8%; left: 5%; width: 4px; height: 12px; background: white; transform: rotate(-30deg); }
        .bf-confetti-2 { top: 15%; left: 18%; width: 3px; height: 10px; background: white; transform: rotate(45deg); }
        .bf-confetti-3 { top: 5%; left: 35%; width: 4px; height: 14px; background: #3b82f6; transform: rotate(-20deg); }
        .bf-confetti-4 { top: 19%; left: 28%; width: 10px; height: 10px; background: #3b82f6; transform: rotate(45deg); }
        .bf-confetti-5 { top: 3%; right: 35%; width: 8px; height: 8px; background: #60a5fa; transform: rotate(45deg); }
        .bf-confetti-6 { top: 20%; left: 8%; width: 3px; height: 8px; background: white; transform: rotate(60deg); }
        .bf-confetti-7 { top: 47%; right: 8%; width: 4px; height: 12px; background: white; transform: rotate(-45deg); }
        .bf-confetti-8 { top: 50%; right: 15%; width: 10px; height: 10px; background: #3b82f6; transform: rotate(45deg); }
        .bf-confetti-9 { top: 38%; right: 5%; width: 6px; height: 6px; background: #60a5fa; transform: rotate(30deg); }
        .bf-confetti-10 { top: 55%; right: 25%; width: 3px; height: 10px; background: white; transform: rotate(15deg); }
        .bf-confetti-11 { top: 42%; left: 3%; width: 8px; height: 8px; background: #3b82f6; transform: rotate(45deg); }
        .bf-confetti-12 { top: 25%; right: 10%; width: 3px; height: 9px; background: white; transform: rotate(-60deg); }
        .bf-confetti-13 { top: 8%; right: 20%; width: 12px; height: 5px; background: white; transform: rotate(-25deg); border-radius: 50%; }
        .bf-confetti-14 { top: 32%; left: 12%; width: 10px; height: 4px; background: #60a5fa; transform: rotate(40deg); border-radius: 50%; }
        .bf-badge-banner {
          display: inline-block;
          background: rgba(153, 160, 174, 0.15);
          color: white;
          padding: 8px 16px;
          border-radius: 50px;
          font-weight: 600;
          margin-bottom: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .bf-title {
          font-size: 24px;
          font-weight: 800;
          color: white;
          line-height: 1.2;
          margin-bottom: 50px;
        }
        .bf-price-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 6px;
        }
        .bf-price {
          font-size: 32px;
          font-weight: 600;
          color: white;
        }
        .bf-price span { font-size: 16px; }
        .bf-actual-price {
          color: rgba(255, 255, 255, 0.4);
          font-size: 24px;
          text-decoration: line-through;
        }
        .bf-save-badge {
          background: #1fc16b;
          color: white;
          padding: 2px 8px;
          border-radius: 40px;
          font-size: 12px;
          font-weight: 500;
        }
        .bf-saved-badge {
          background: rgba(251, 55, 72, 0.24);
          color: #e93544;
          padding: 2px 8px;
          border-radius: 40px;
          font-size: 12px;
          font-weight: 500;
        }
        .bf-billing-text {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          margin-bottom: 24px;
        }
        .bf-cta-button {
          display: block;
          background: white;
          color: #0f0f2a;
          border: none;
          font-size: 16px;
          padding: 16px 32px;
          font-weight: 600;
          border-radius: 90px;
          cursor: pointer;
          width: 100%;
          margin-bottom: 10px;
          text-align: center;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .bf-cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
        }
        .bf-cta-current {
          background: #22c55e !important;
          color: white !important;
          cursor: default;
        }
        .bf-cta-current:hover {
          transform: none;
          box-shadow: none;
        }
        .bf-cancel-text {
          color: white;
          font-size: 12px;
          text-align: center;
        }
        .bf-cancel-text span { color: rgba(255, 255, 255, 0.6); }
        .bf-right-section {
          flex: 1;
          padding: 20px 30px;
          display: flex;
          flex-direction: column;
          min-width: 300px;
        }
        .bf-features-wrapper {
          padding-top: 30px;
          display: flex;
          gap: 40px;
        }
        .bf-features-title {
          color: white;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .bf-features-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .bf-features-list li {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 10px;
          font-size: 14px;
        }
        .bf-features-list .check-icon {
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .bf-features-list .check-icon i {
          color: #111;
          font-size: 12px;
        }
        .bf-gift-section {
          margin-top: auto;
          padding-top: 20px;
        }
        .bf-gift-title {
          color: white;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .bf-gift-box {
          display: flex;
          justify-content: space-between;
          max-width: 380px;
          gap: 20px;
          padding: 12px 12px 0 20px;
          background: rgba(140, 148, 164, 0.05);
          border-radius: 12px;
        }
        .bf-gift-content {
          margin-top: 14px;
        }
        .bf-gift-content h4 {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }
        .free-badge {
          color: #FF4158;
          font-weight: 600;
        }
        .bf-gift-icon {
          width: 120px;
          height: 82px;
        }
        .bf-gift-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        @media (max-width: 1200px) {
          .bf-banner-inner {
            flex-direction: column;
          }
          .bf-left-section-wrapper {
            width: auto;
            margin: 16px;
            margin-top: 80px;
          }
          .bf-right-section {
            padding: 16px;
          }
        }
        @media (max-width: 576px) {
          .bf-features-wrapper {
            flex-direction: column;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}

// Pricing Cards Component - Now with actual Stripe integration
function PricingCards({ billingPeriod, currentPlan }: { billingPeriod: string; currentPlan?: string }) {
  const [subscribingPlan, setSubscribingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plans = [
    {
      name: "Starter",
      identifier: billingPeriod === "monthly" ? "starter" : billingPeriod === "quarterly" ? "starter-quarterly" : "starter-year",
      monthlyPrice: 29,
      quarterlyPrice: 75,
      annualPrice: 228,
      features: [
        "5 créations de boutiques IA ( limité )",
        "Suivi et analyse simultané de 10 boutiques",
        "Top Boutiques : 25 recherches / jour",
        "Produits Gagnants : 25 recherches / jour",
        "Publicités Gagnantes : recherches / jour",
        "Export produits ( limité à 20 )",
        "Formation E-Commerce Copyfy",
      ],
    },
    {
      name: "Growth",
      identifier: billingPeriod === "monthly" ? "basic" : billingPeriod === "quarterly" ? "basic-quarterly" : "basic-year",
      monthlyPrice: 49,
      quarterlyPrice: 129,
      annualPrice: 348,
      popular: true,
      features: [
        "Toutes les fonctionnalités du Starter, plus :",
        "Créations de boutiques illimités IA",
        "Suivi et analyse simultané de 25 boutiques",
        "Top Boutiques illimité",
        "Produits gagnants illimité",
        "Publicités gagnantes illimité",
        "Export produits illimités",
        "Coaching hebdo avec un Expert E-Commerce",
        "Analyse Copyfy IA",
        "SOON : Analyse de vos publicités",
      ],
    },
    {
      name: "Pro",
      identifier: billingPeriod === "monthly" ? "pro" : billingPeriod === "quarterly" ? "pro-quarterly" : "pro-year",
      monthlyPrice: 79,
      quarterlyPrice: 210,
      annualPrice: 588,
      features: [
        "Toutes les fonctionnalités du Growth, plus :",
        "Suivi et analyse simultané de 120 boutiques",
        "Connexion multi-boutiques Shopify",
        "Accès à nos agents ( Fournisseurs )",
        "SOON : Tableau de bord ( Analyse des profits )",
      ],
    },
  ];

  const getPrice = (plan: typeof plans[0]) => {
    if (billingPeriod === "monthly") return plan.monthlyPrice;
    if (billingPeriod === "quarterly") return Math.round(plan.quarterlyPrice / 3);
    return Math.round(plan.annualPrice / 12);
  };

  const getBillingText = () => {
    if (billingPeriod === "monthly") return "/mois";
    if (billingPeriod === "quarterly") return "/mois, facturé trimestriellement";
    return "/mois, facturé annuellement";
  };

  const handleSubscribe = async (planIdentifier: string) => {
    setSubscribingPlan(planIdentifier);
    setError(null);
    
    try {
      console.log("[Settings] Subscribing to plan:", planIdentifier);
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planIdentifier }),
      });
      
      const data = await res.json();
      console.log("[Settings] Subscribe response:", data);
      
      if (!res.ok) {
        throw new Error(data.message || data.error || "Erreur lors de la souscription");
      }
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de paiement non reçue");
      }
    } catch (err) {
      console.error("[Settings] Subscribe error:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubscribingPlan(null);
    }
  };

  return (
    <>
      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}
      <div className="d-lg-flex d-md-flex d-block gap-3 plan-wrapper justify-content-center">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.identifier;
          const isLoading = subscribingPlan === plan.identifier;
          return (
            <div key={plan.name} className="subscription-box mb-3 mb-lg-0">
              {/* Popular badge above the card */}
              {plan.popular && (
                <div 
                  className="text-center mb-2"
                  style={{ marginTop: -8 }}
                >
                  <span className="px-3 py-2 bg-primary text-white rounded-pill small fw-semibold" style={{ fontSize: '11px' }}>
                    74% DES UTILISATEURS CHOISISSENT CE PLAN
                  </span>
                </div>
              )}
              <div 
                className={cn(
                  "card h-100 border-0 shadow-sm rounded-4",
                  plan.popular && "border border-primary border-2"
                )}
              >
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3">{plan.name}</h5>
                  <div className="d-flex align-items-baseline gap-1 mb-2">
                    <span className="fs-2 fw-bold">{getPrice(plan)}€</span>
                    <span className="text-muted small">EUR {getBillingText()}</span>
                  </div>

                  <button
                    className={cn(
                      "btn w-100 py-2 mb-3",
                      isCurrent ? "btn-success" : plan.popular ? "btn-primary" : "btn-outline-secondary"
                    )}
                    disabled={isCurrent || isLoading || subscribingPlan !== null}
                    onClick={() => !isCurrent && handleSubscribe(plan.identifier)}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Chargement...
                      </>
                    ) : isCurrent ? (
                      "Votre plan actuel"
                    ) : (
                      "Choisir"
                    )}
                  </button>

                  <p className="text-muted small text-center mb-4" style={{ fontSize: '11px' }}>
                    Annuler à tout moment | Satisfaction Garantie | Paiement sécurisé
                  </p>

                  <h6 className="fw-semibold mb-3">Ce qui est inclus</h6>
                  <ul className="list-unstyled">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="d-flex align-items-start gap-2 mb-2">
                        <i className="ri-check-line text-primary mt-1" style={{ fontSize: '14px' }}></i>
                        <span style={{ fontSize: '13px' }}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
