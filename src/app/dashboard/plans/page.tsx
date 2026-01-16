"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardHeader from "@/components/DashboardHeader";
import { useToast } from "@/components/ui/toast";

interface Plan {
  id: string;
  identifier: string;
  title: string;
  price: number;
  stripeId: string | null;
  stripeIdEn: string | null;
}

interface CurrentSubscription {
  id: string;
  planIdentifier: string;
  status: string;
  endsAt: string | null;
}

// Plan features configuration matching Laravel EXACTLY
const planFeatures: Record<string, { features: string[]; allFeaturesOf?: string }> = {
  starter: {
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
  basic: {
    allFeaturesOf: "Starter",
    features: [
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
  pro: {
    allFeaturesOf: "Growth",
    features: [
      "Suivi et analyse simultané de 120 boutiques",
      "Connexion multi-boutiques Shopify",
      "Accès à nos agents ( Fournisseurs )",
      "SOON : Tableau de bord ( Analyse des profits )",
    ],
  },
};

function PlansContent() {
  const searchParams = useSearchParams();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "quarterly" | "annual">("monthly");
  const [subscribingPlan, setSubscribingPlan] = useState<string | null>(null);

  useEffect(() => {
    const successParam = searchParams.get("success");
    const errorParam = searchParams.get("error");
    const canceledParam = searchParams.get("canceled");
    const planParam = searchParams.get("plan");
    const messageParam = searchParams.get("message");
    const priceIdParam = searchParams.get("priceId");

    if (successParam === "true") {
      toastSuccess(planParam ? `Félicitations ! Votre abonnement ${planParam} a été activé.` : "Abonnement activé !");
      window.history.replaceState({}, "", "/dashboard/plans");
    } else if (canceledParam === "true") {
      toastInfo("Paiement annulé.");
      window.history.replaceState({}, "", "/dashboard/plans");
    } else if (errorParam) {
      const errorMessages: Record<string, string> = {
        missing_session: "Session de paiement manquante.",
        database_error: "Erreur de base de données.",
        stripe_not_configured: "Stripe n'est pas configuré.",
        no_subscription: "Pas d'abonnement trouvé dans la session.",
        plan_not_found: priceIdParam 
          ? `Plan non trouvé pour le prix: ${priceIdParam}. Vérifiez les IDs Stripe.`
          : "Plan non trouvé. Contactez le support.",
        payment_pending: "Le paiement est en attente.",
        payment_failed: "Le paiement a échoué.",
        processing_error: messageParam 
          ? `Erreur de traitement: ${messageParam}`
          : "Erreur lors du traitement du paiement.",
      };
      const errorMsg = errorMessages[errorParam] || `Erreur: ${errorParam}`;
      console.error("[Plans] Error:", errorParam, messageParam, priceIdParam);
      toastError(errorMsg);
      window.history.replaceState({}, "", "/dashboard/plans");
    }
  }, [searchParams, toastSuccess, toastError, toastInfo]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [plansRes, subRes] = await Promise.all([fetch("/api/billing/plans"), fetch("/api/billing/subscription")]);
        const plansData = await plansRes.json();
        if (plansData.plans) setPlans(plansData.plans);
        if (subRes.ok) {
          const subData = await subRes.json();
          if (subData.hasSubscription && subData.subscription) {
            setCurrentSubscription({ id: subData.subscription.id, planIdentifier: subData.subscription.planIdentifier, status: subData.subscription.status, endsAt: subData.subscription.endsAt });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const getPlansForInterval = (): Plan[] => {
    const ids: Record<string, string[]> = {
      monthly: ["starter", "basic", "pro"],
      quarterly: ["starter-quarterly", "basic-quarterly", "pro-quarterly"],
      annual: ["starter-year", "basic-year", "pro-year"],
    };
    return plans.filter((p) => ids[billingInterval].includes(p.identifier)).sort((a, b) => a.price - b.price);
  };

  const getMonthlyPrice = (plan: Plan): number => {
    if (billingInterval === "quarterly") return Math.round((plan.price / 3) * 100) / 100;
    if (billingInterval === "annual") return Math.floor(plan.price / 12);
    return plan.price;
  };

  const handleSubscribe = async (planIdentifier: string) => {
    setSubscribingPlan(planIdentifier);
    try {
      const res = await fetch("/api/billing/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planIdentifier }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      if (data.url) window.location.href = data.url;
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubscribingPlan(null);
    }
  };

  const handleOpenPortal = async () => {
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { toastError("Erreur"); }
  };

  const displayPlans = getPlansForInterval();
  const hasQuarterlyPlans = plans.some(p => p.identifier.includes("quarterly"));

  return (
    <>
      <DashboardHeader title="Tarification" />
      <div className="bg-weak-50 home-content-wrapper">
        <div className="p-3 w-max-width-xl mx-auto">

          <div className="pb-5 pt-4">
            {/* ===== BILLING TOGGLE - Mensuel / Trimestriel / Annuel ===== */}
            <div className="d-flex justify-content-center mt-4 mb-4">
              <div style={{ 
                backgroundColor: "#f8f9fa", 
                border: "1px solid #e9ecef", 
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                padding: "4px", 
                gap: 0,
                borderRadius: "12px", 
                display: "inline-flex", 
                position: "relative", 
                overflow: "hidden",
                maxWidth: "600px",
              }}>
                {/* Sliding background */}
                <div style={{
                  content: "''",
                  position: "absolute", 
                  top: "4px", 
                  left: "4px",
                  width: "calc(33.333% - 2.67px)",
                  height: "calc(100% - 8px)", 
                  backgroundColor: "#007bff",
                  borderRadius: "8px",
                  transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)", 
                  zIndex: 1,
                  boxShadow: "0 2px 8px rgba(0, 123, 255, 0.3)",
                  transform: billingInterval === "monthly" 
                    ? "translateX(0)" 
                    : billingInterval === "quarterly" 
                      ? "translateX(calc(100% + 2.67px))" 
                      : "translateX(calc(200% + 5.34px))",
                }} />
                
                {/* Monthly button */}
                <button 
                  type="button" 
                  onClick={() => setBillingInterval("monthly")} 
                  style={{ 
                    backgroundColor: "transparent", 
                    border: "none", 
                    color: billingInterval === "monthly" ? "#fff" : "#495057", 
                    fontWeight: 600, 
                    padding: "8px 16px", 
                    borderRadius: "8px", 
                    position: "relative", 
                    zIndex: 2, 
                    fontSize: "14px", 
                    cursor: "pointer",
                    flex: "1 1 0",
                    minWidth: "130px",
                    height: "40px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: "1.2",
                    whiteSpace: "nowrap",
                    transition: "all 0.3s ease",
                  }}
                >
                  Mensuel
                </button>
                
                {/* Quarterly button */}
                <button 
                  type="button" 
                  onClick={() => hasQuarterlyPlans ? setBillingInterval("quarterly") : toastInfo("Les plans trimestriels ne sont pas encore disponibles.")} 
                  style={{ 
                    backgroundColor: "transparent", 
                    border: "none", 
                    color: billingInterval === "quarterly" ? "#fff" : hasQuarterlyPlans ? "#495057" : "#9ca3af", 
                    fontWeight: 600, 
                    padding: "8px 16px", 
                    borderRadius: "8px", 
                    position: "relative", 
                    zIndex: 2, 
                    fontSize: "14px", 
                    cursor: hasQuarterlyPlans ? "pointer" : "not-allowed", 
                    display: "inline-flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    gap: "4px",
                    opacity: hasQuarterlyPlans ? 1 : 0.6,
                    flex: "1 1 0",
                    minWidth: "130px",
                    height: "40px",
                    lineHeight: "1.2",
                    whiteSpace: "nowrap",
                    transition: "all 0.3s ease",
                  }}
                >
                  Trimestriel
                  <span style={{ 
                    fontSize: "10px", 
                    padding: "2px 6px", 
                    borderRadius: "4px", 
                    backgroundColor: billingInterval === "quarterly" ? "rgba(255,255,255,0.25)" : "rgba(23, 162, 184, 0.15)", 
                    color: billingInterval === "quarterly" ? "#fff" : "#17a2b8", 
                    fontWeight: 600,
                    marginLeft: "4px",
                  }}>3mo</span>
                </button>
                
                {/* Annual button */}
                <button 
                  type="button" 
                  onClick={() => setBillingInterval("annual")} 
                  style={{ 
                    backgroundColor: "transparent", 
                    border: "none", 
                    color: billingInterval === "annual" ? "#fff" : "#495057", 
                    fontWeight: 600, 
                    padding: "8px 16px", 
                    borderRadius: "8px", 
                    position: "relative", 
                    zIndex: 2, 
                    fontSize: "14px", 
                    cursor: "pointer", 
                    display: "inline-flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    gap: "4px",
                    flex: "1 1 0",
                    minWidth: "130px",
                    height: "40px",
                    lineHeight: "1.2",
                    whiteSpace: "nowrap",
                    transition: "all 0.3s ease",
                  }}
                >
                  Annuel
                  <span style={{ 
                    fontSize: "10px", 
                    padding: "2px 6px", 
                    borderRadius: "4px", 
                    backgroundColor: billingInterval === "annual" ? "rgba(255,255,255,0.25)" : "rgba(40, 167, 69, 0.15)", 
                    color: billingInterval === "annual" ? "#fff" : "#28a745", 
                    fontWeight: 600,
                    marginLeft: "4px",
                  }}>40%</span>
                </button>
              </div>
            </div>

            {/* ===== PLANS GRID ===== */}
            {isLoading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
            ) : displayPlans.length === 0 ? (
              <div className="text-center py-5"><p className="text-muted">Aucun plan disponible.</p></div>
            ) : (
              <div className="row g-4 mb-4 justify-content-center">
                {displayPlans.map((plan) => {
                  const isPopular = plan.identifier.includes("basic");
                  const isCurrent = currentSubscription?.planIdentifier === plan.identifier;
                  const monthlyPrice = getMonthlyPrice(plan);
                  const baseKey = plan.identifier.includes("starter") ? "starter" : plan.identifier.includes("basic") ? "basic" : "pro";
                  const features = planFeatures[baseKey];
                  const displayName = baseKey === "starter" ? "Starter" : baseKey === "basic" ? "Growth" : "Pro";
                  
                  const planTiers: Record<string, number> = { starter: 1, basic: 2, pro: 3 };
                  const currentPlanBase = currentSubscription?.planIdentifier?.includes("starter") ? "starter" : currentSubscription?.planIdentifier?.includes("basic") ? "basic" : currentSubscription?.planIdentifier?.includes("pro") ? "pro" : null;
                  const currentTier = currentPlanBase ? planTiers[currentPlanBase] : 0;
                  const thisTier = planTiers[baseKey] || 0;
                  const isUpgrade = currentSubscription && thisTier > currentTier;
                  const isDowngrade = currentSubscription && thisTier < currentTier;

                  const getButtonContent = () => {
                    if (subscribingPlan === plan.identifier) {
                      return <><span className="spinner-border spinner-border-sm me-2"></span>Chargement...</>;
                    }
                    if (isCurrent) return "Votre plan actuel";
                    if (isUpgrade) return "Mettre à niveau";
                    if (isDowngrade) return "Rétrograder";
                    return "Choisir";
                  };

                  const getButtonStyle = () => {
                    if (isCurrent) {
                      return { backgroundColor: "#22c55e", border: "none", color: "#fff" };
                    }
                    if (isUpgrade) {
                      return { backgroundColor: "#2563eb", border: "none", color: "#fff" };
                    }
                    if (isDowngrade) {
                      return { backgroundColor: "transparent", border: "1px solid #e5e7eb", color: "#6b7280" };
                    }
                    return { backgroundColor: isPopular ? "#2563eb" : "transparent", border: isPopular ? "none" : "1px solid #e5e7eb", color: isPopular ? "#fff" : "#374151" };
                  };

                  return (
                    <div key={plan.id} className="col-12 col-lg-4">
                      <div style={{ position: "relative", background: "#fff", borderRadius: "16px", border: isPopular ? "2px solid #2563eb" : "1px solid #e5e7eb", padding: isPopular ? "32px 24px 24px" : "24px", boxShadow: isPopular ? "0 10px 40px rgba(37, 99, 235, 0.15)" : "0 4px 16px rgba(0,0,0,0.04)", height: "100%", display: "flex", flexDirection: "column" }}>
                        {isPopular && (
                          <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#2563eb", color: "#fff", padding: "6px 16px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                            74% des utilisateurs choisissent ce plan
                          </div>
                        )}
                        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", marginBottom: "16px" }}>{displayName}</h3>
                        <div className="d-flex align-items-baseline gap-1 mb-1">
                          <span style={{ fontSize: "42px", fontWeight: 700, color: "#1f2937", lineHeight: 1 }}>{monthlyPrice}€</span>
                          <span style={{ fontSize: "14px", color: "#9ca3af" }}>EUR /mois</span>
                        </div>
                        <div className="my-3">
                          <button 
                            className="btn w-100" 
                            style={{ padding: "12px 16px", borderRadius: "8px", fontWeight: 500, ...getButtonStyle() }} 
                            onClick={() => isCurrent ? null : handleSubscribe(plan.identifier)} 
                            disabled={isCurrent || subscribingPlan === plan.identifier}
                          >
                            {getButtonContent()}
                          </button>
                        </div>
                        <p className="text-center mb-4" style={{ fontSize: "12px", color: "#9ca3af" }}>Annuler à tout moment | Satisfaction Garantie | Paiement sécurisé</p>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#1f2937", marginBottom: "16px" }}>Ce qui est inclus</h4>
                          <ul className="list-unstyled mb-0">
                            {features?.allFeaturesOf && (
                              <li className="d-flex align-items-start mb-3" style={{ fontSize: "14px", color: "#374151" }}>
                                <i className="ri-check-line me-2" style={{ fontSize: "18px", color: "#2563eb", marginTop: "1px" }}></i>
                                <span>Toutes les fonctionnalités du {features.allFeaturesOf}, plus :</span>
                              </li>
                            )}
                            {features?.features.map((f, i) => (
                              <li key={i} className="d-flex align-items-start mb-3" style={{ fontSize: "14px", color: "#374151" }}>
                                <i className="ri-check-line me-2" style={{ fontSize: "18px", color: "#2563eb", marginTop: "1px" }}></i>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Trust Indicators */}
            <div className="d-flex gap-4 justify-content-center align-items-center flex-wrap mt-4">
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontWeight: 600, color: "#1f2937" }}>★ Trustpilot</span>
                <span style={{ fontSize: "13px", color: "#6b7280" }}>4.4</span>
                <div className="d-flex">{[1,2,3,4].map(s => <span key={s} style={{ color: "#22c55e", fontSize: "16px" }}>★</span>)}<span style={{ color: "#d1d5db", fontSize: "16px" }}>★</span></div>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: "50px", padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <div className="d-flex" style={{ marginLeft: "-4px" }}>
                  {["/img/avatar-1.png", "/img/avatar-2.png", "/img/avatar-3.png"].map((src, i) => (
                    <img 
                      key={i} 
                      src={src}
                      alt="User avatar"
                      style={{ 
                        width: "24px", 
                        height: "24px", 
                        borderRadius: "50%", 
                        border: "2px solid #fff", 
                        marginLeft: i > 0 ? "-8px" : "0",
                        objectFit: "cover",
                      }} 
                    />
                  ))}
                </div>
                <span style={{ fontSize: "13px", color: "#374151" }}><strong style={{ color: "#2563eb" }}>+279</strong> E-Commerçants ont rejoint Copyfy cette semaine</span>
              </div>
            </div>
          </div>

          {/* Current Subscription Info */}
          {currentSubscription && (
            <div className="p-4 mt-3" style={{ border: "1px solid #E1E4EA", borderRadius: "15px", background: "#fff" }}>
              <h3 style={{ fontSize: "15px", marginBottom: "12px", fontWeight: 600 }}>Votre plan actuel</h3>
              <div className="d-flex flex-column flex-md-row align-items-md-center gap-3">
                <div style={{ background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)", color: "#fff", padding: "12px 24px", borderRadius: "8px", fontWeight: 500 }}>
                  {currentSubscription.planIdentifier.includes("starter") ? "Starter" : currentSubscription.planIdentifier.includes("basic") ? "Growth" : "Pro"}
                </div>
                <div className="flex-grow-1"><p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "0" }}>Assurez-vous que vos informations de paiement sont à jour.</p></div>
                <button className="btn btn-outline-secondary" onClick={handleOpenPortal}>Gérer l&apos;abonnement</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function PlansPage() {
  return (
    <Suspense fallback={<div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}><div className="spinner-border text-primary" role="status"></div></div>}>
      <PlansContent />
    </Suspense>
  );
}
