"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { useBilling } from "@/lib/hooks/use-billing";

interface Plan {
  id: number;
  identifier: string;
  title: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  limits: {
    shopTracker: number;
    productExport: number;
    generateProduct: number;
    videoGeneration: number;
    imageGeneration: number;
  };
  popular?: boolean;
}

export default function PlansPage() {
  const { plans, currentPlan, isLoading, fetchPlans, subscribe } = useBilling();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSubscribe = async (planIdentifier: string) => {
    setIsSubscribing(planIdentifier);
    try {
      // subscribe handles the redirect internally
      await subscribe(planIdentifier);
    } catch (error) {
      console.error("Subscription error:", error);
    } finally {
      setIsSubscribing(null);
    }
  };

  const getFilteredPlans = () => {
    if (!plans) return [];
    return plans.filter(plan => {
      if (billingInterval === 'yearly') {
        return plan.identifier.includes('year') || plan.identifier.includes('annual');
      }
      return !plan.identifier.includes('year') && !plan.identifier.includes('annual');
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(price);
  };

  // Default plans for display when API not available
  const defaultPlans: Plan[] = [
    {
      id: 1,
      identifier: 'starter',
      title: 'Starter',
      price: 29,
      currency: 'EUR',
      interval: 'month',
      popular: false,
      features: [
        '3 boutiques suivies',
        '10 exports de produits/mois',
        '5 générations de produits',
        'Support email',
      ],
      limits: {
        shopTracker: 3,
        productExport: 10,
        generateProduct: 5,
        videoGeneration: 0,
        imageGeneration: 5,
      },
    },
    {
      id: 2,
      identifier: 'pro',
      title: 'Pro',
      price: 49,
      currency: 'EUR',
      interval: 'month',
      popular: true,
      features: [
        '10 boutiques suivies',
        '50 exports de produits/mois',
        '25 générations de produits',
        '10 vidéos IA/mois',
        '25 images IA/mois',
        'Support prioritaire',
      ],
      limits: {
        shopTracker: 10,
        productExport: 50,
        generateProduct: 25,
        videoGeneration: 10,
        imageGeneration: 25,
      },
    },
    {
      id: 3,
      identifier: 'business',
      title: 'Business',
      price: 99,
      currency: 'EUR',
      interval: 'month',
      popular: false,
      features: [
        'Boutiques illimitées',
        'Exports illimités',
        '100 générations de produits',
        '50 vidéos IA/mois',
        '100 images IA/mois',
        'Support dédié',
        'API Access',
      ],
      limits: {
        shopTracker: -1,
        productExport: -1,
        generateProduct: 100,
        videoGeneration: 50,
        imageGeneration: 100,
      },
    },
  ];

  const displayPlans = plans && plans.length > 0 ? getFilteredPlans() : defaultPlans;

  return (
    <>
      <DashboardHeader title="Abonnements" />

      <div className="bg-weak-50 home-content-wrapper">
        <div className="container py-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-5"
          >
            <h2 className="mb-2">Choisissez votre plan</h2>
            <p className="text-muted mb-4">
              Sélectionnez le plan qui correspond le mieux à vos besoins
            </p>

            {/* Billing Toggle */}
            <div className="d-inline-flex align-items-center bg-white rounded-pill p-1 shadow-sm">
              <button
                className={`btn btn-sm rounded-pill px-4 ${
                  billingInterval === 'monthly' ? 'btn-primary' : 'btn-light'
                }`}
                onClick={() => setBillingInterval('monthly')}
              >
                Mensuel
              </button>
              <button
                className={`btn btn-sm rounded-pill px-4 ${
                  billingInterval === 'yearly' ? 'btn-primary' : 'btn-light'
                }`}
                onClick={() => setBillingInterval('yearly')}
              >
                Annuel
                <span className="badge bg-success ms-2">-20%</span>
              </button>
            </div>
          </motion.div>

          {/* Plans Grid */}
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="row g-4 justify-content-center">
              {displayPlans.map((plan, index) => (
                <motion.div
                  key={plan.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="col-12 col-md-6 col-lg-4"
                >
                  <div
                    className={`card h-100 ${
                      plan.popular ? 'border-primary shadow' : ''
                    }`}
                  >
                    {plan.popular && (
                      <div className="card-header bg-primary text-white text-center py-2">
                        <small className="fw-500">
                          <i className="ri-star-fill me-1"></i>
                          Le plus populaire
                        </small>
                      </div>
                    )}
                    <div className="card-body d-flex flex-column">
                      <h4 className="card-title text-center mb-3">{plan.title}</h4>
                      
                      <div className="text-center mb-4">
                        <span className="display-5 fw-bold">
                          {formatPrice(
                            billingInterval === 'yearly' ? plan.price * 0.8 : plan.price,
                            plan.currency || 'EUR'
                          )}
                        </span>
                        <span className="text-muted">
                          /{billingInterval === 'yearly' ? 'an' : 'mois'}
                        </span>
                      </div>

                      <ul className="list-unstyled mb-4 flex-grow-1">
                        {(plan.features || []).map((feature, idx) => (
                          <li key={idx} className="mb-2 d-flex align-items-start">
                            <i className="ri-check-line text-success me-2 mt-1"></i>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto">
                        {currentPlan?.identifier === plan.identifier ? (
                          <Button
                            className="w-100"
                            variant="outline"
                            disabled
                          >
                            <i className="ri-check-line me-1"></i>
                            Plan actuel
                          </Button>
                        ) : (
                          <Button
                            className="w-100"
                            variant={plan.popular ? 'default' : 'outline'}
                            onClick={() => handleSubscribe(plan.identifier)}
                            disabled={isSubscribing === plan.identifier}
                          >
                            {isSubscribing === plan.identifier ? (
                              <span className="rotating">
                                <i className="ri-loader-2-line"></i>
                              </span>
                            ) : (
                              <>
                                {currentPlan ? 'Changer de plan' : 'Commencer'}
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Features Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-5"
          >
            <h4 className="text-center mb-4">Comparaison des fonctionnalités</h4>
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Fonctionnalité</th>
                    {displayPlans.map((plan, idx) => (
                      <th key={idx} className="text-center">{plan.title}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Boutiques suivies</td>
                    {displayPlans.map((plan, idx) => (
                      <td key={idx} className="text-center">
                        {plan.limits?.shopTracker === -1 ? 'Illimité' : plan.limits?.shopTracker || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td>Exports de produits/mois</td>
                    {displayPlans.map((plan, idx) => (
                      <td key={idx} className="text-center">
                        {plan.limits?.productExport === -1 ? 'Illimité' : plan.limits?.productExport || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td>Générations de produits IA</td>
                    {displayPlans.map((plan, idx) => (
                      <td key={idx} className="text-center">
                        {plan.limits?.generateProduct || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td>Vidéos IA/mois</td>
                    {displayPlans.map((plan, idx) => (
                      <td key={idx} className="text-center">
                        {plan.limits?.videoGeneration || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td>Images IA/mois</td>
                    {displayPlans.map((plan, idx) => (
                      <td key={idx} className="text-center">
                        {plan.limits?.imageGeneration || '-'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-5"
          >
            <h4 className="text-center mb-4">Questions fréquentes</h4>
            <div className="accordion" id="faqAccordion">
              <div className="accordion-item">
                <h2 className="accordion-header">
                  <button
                    className="accordion-button"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#faq1"
                  >
                    Puis-je annuler mon abonnement à tout moment?
                  </button>
                </h2>
                <div id="faq1" className="accordion-collapse collapse show" data-bs-parent="#faqAccordion">
                  <div className="accordion-body">
                    Oui, vous pouvez annuler votre abonnement à tout moment. Vous conserverez l'accès jusqu'à la fin de votre période de facturation.
                  </div>
                </div>
              </div>
              <div className="accordion-item">
                <h2 className="accordion-header">
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#faq2"
                  >
                    Les crédits non utilisés sont-ils reportés?
                  </button>
                </h2>
                <div id="faq2" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                  <div className="accordion-body">
                    Non, les crédits sont réinitialisés à chaque début de période de facturation.
                  </div>
                </div>
              </div>
              <div className="accordion-item">
                <h2 className="accordion-header">
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#faq3"
                  >
                    Comment changer de plan?
                  </button>
                </h2>
                <div id="faq3" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                  <div className="accordion-body">
                    Vous pouvez changer de plan à tout moment. La différence sera calculée au prorata de votre période actuelle.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
