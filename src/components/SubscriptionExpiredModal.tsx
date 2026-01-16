"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface SubscriptionExpiredModalProps {
  type: 'trial_ended' | 'subscription_ended' | 'payment_failed';
  showExtendTrial?: boolean;
  onExtendTrial?: () => void;
}

export function SubscriptionExpiredModal({ 
  type, 
  showExtendTrial = false,
  onExtendTrial 
}: SubscriptionExpiredModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);

  // Don't show on plans or settings page
  const allowedPages = ['/dashboard/plans', '/dashboard/settings'];
  const isAllowedPage = allowedPages.some(page => pathname?.startsWith(page));

  if (!isVisible || isAllowedPage) {
    return null;
  }

  const getContent = () => {
    switch (type) {
      case 'trial_ended':
        return {
          title: "Mettez à niveau pour un accès complet",
          description: "Votre essai gratuit est terminé. Choisissez un abonnement pour continuer à utiliser toutes les fonctionnalités de Copyfy.",
          buttonText: "Choisir un abonnement",
          buttonUrl: "/dashboard/plans?triggered_from=Trial_ended"
        };
      case 'subscription_ended':
        return {
          title: "Votre abonnement a expiré",
          description: "Votre abonnement est arrivé à échéance. Renouvelez votre abonnement pour continuer à utiliser Copyfy.",
          buttonText: "Choisir un abonnement",
          buttonUrl: "/dashboard/plans?triggered_from=Subscription_ended"
        };
      case 'payment_failed':
        return {
          title: "Votre paiement a échoué",
          description: "Nous n'avons pas pu traiter votre paiement. Veuillez mettre à jour vos informations de paiement.",
          buttonText: "Mettre à jour le paiement",
          buttonUrl: "/dashboard/plans?triggered_from=Failed_Payment"
        };
      default:
        return {
          title: "Accès limité",
          description: "Veuillez mettre à niveau votre compte pour continuer.",
          buttonText: "Voir les abonnements",
          buttonUrl: "/dashboard/plans"
        };
    }
  };

  const content = getContent();

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        {/* Modal */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            maxWidth: 420,
            width: '100%',
            padding: 32,
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            animation: 'modalFadeIn 0.3s ease-out',
          }}
        >
          {/* Lock Icon */}
          <div 
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <svg 
              width="40" 
              height="40" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#DC2626" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          {/* Title */}
          <h2 
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: '#111827',
              marginBottom: 12,
              lineHeight: 1.3,
            }}
          >
            {content.title}
          </h2>

          {/* Description */}
          <p 
            style={{
              fontSize: 15,
              color: '#6B7280',
              marginBottom: 28,
              lineHeight: 1.6,
            }}
          >
            {content.description}
          </p>

          {/* Primary Button */}
          <button
            onClick={() => router.push(content.buttonUrl)}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: '#3B82F6',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
          >
            {content.buttonText}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>

          {/* Extend Trial Button (if applicable) */}
          {showExtendTrial && type === 'trial_ended' && (
            <button
              onClick={onExtendTrial}
              style={{
                width: '100%',
                padding: '14px 24px',
                backgroundColor: '#10B981',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 12,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
            >
              Prolonger l'essai gratuit
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          )}

          {/* Settings Link */}
          <button
            onClick={() => router.push('/dashboard/settings')}
            style={{
              marginTop: 16,
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: '#6B7280',
              border: 'none',
              fontSize: 14,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Accéder aux paramètres
          </button>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
}

export default SubscriptionExpiredModal;
