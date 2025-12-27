"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import DashboardHeader from "@/components/DashboardHeader";
import PromotionalSlider from "@/components/PromotionalSlider";
import VideoModal from "@/components/VideoModal";
interface ActionItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: {
    type: 'video' | 'link';
    label: string;
    icon: string;
    href?: string;
    onClick?: () => void;
  };
}
const ACTION_ITEMS_KEY = 'copyfy_action_items_completed';
export default function DashboardPage() {
  const { data: session } = useSession();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  // Load completed actions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(ACTION_ITEMS_KEY);
    if (saved) {
      try {
        setCompletedActions(JSON.parse(saved));
      } catch {
        setCompletedActions([]);
      }
    }
  }, []);
  // Mark action as completed
  const markAsCompleted = (actionId: string) => {
    const newCompleted = [...completedActions, actionId];
    setCompletedActions(newCompleted);
    localStorage.setItem(ACTION_ITEMS_KEY, JSON.stringify(newCompleted));
  };
  // Action items list
  const actionItems: ActionItem[] = [
    {
      id: 'watch_demo',
      title: "Regarder la démo",
      description:
        "Faites un tour pour voir comment Copyfy va vous aider à réussir dans le E-commerce",
      completed: completedActions.includes('watch_demo'),
      action: {
        type: 'video',
        label: 'Regarder maintenant',
        icon: 'ri-video-line',
        onClick: () => {
          setIsVideoModalOpen(true);
          markAsCompleted('watch_demo');
        },
      },
    },
    {
      id: 'analyze_shop',
      title: "Trouvez votre produit gagnant et analysez votre première boutique",
      description:
        "Ajoutez une boutique à l'analyse de boutique pour voir les données et déterminer si elle est bonne à copier ou non.",
      completed: completedActions.includes('analyze_shop'),
      action: {
        type: 'link',
        label: 'Analyser une boutique',
        icon: 'ri-store-3-line',
        href: '/dashboard/analyze-shop',
      },
    },
    {
      id: 'create_shop',
      title: "Créez votre boutique avec l'IA de Copyfy",
      description:
        "Générez votre boutique Shopify avec l'IA en moins d'une minute.",
      completed: completedActions.includes('create_shop'),
      action: {
        type: 'link',
        label: 'Créer une boutique',
        icon: 'ri-magic-line',
        href: '/dashboard/ai-shop',
      },
    },
    {
      id: 'launch_ads',
      title: "Lancez vos publicités pour obtenir votre première vente",
      description:
        "Créez et lancez des publicités efficaces pour commencer à générer des ventes pour votre boutique.",
      completed: completedActions.includes('launch_ads'),
      action: {
        type: 'link',
        label: 'Lancez vos publicités',
        icon: 'ri-advertisement-line',
        href: '/dashboard/ads',
      },
    },
  ];
  // Calculate trial info from session
  const trialEndsAtStr = (session?.user as { trialEndsAt?: string | null })?.trialEndsAt;
  const trialEndsAt = trialEndsAtStr ? new Date(trialEndsAtStr) : null;
  const now = new Date();
  const trialDaysRemaining = trialEndsAt 
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const isInTrial = trialDaysRemaining > 0;
  const hasActivePlan = session?.user?.activePlan && session.user.activePlan.identifier !== 'trial';
  // Calculate completed actions
  const completedCount = actionItems.filter(item => item.completed).length;
  const totalCount = actionItems.length;
  const progressPercentage = (completedCount / totalCount) * 100;
  return (
    <>
      <DashboardHeader
        title="Tableau de bord"
      />
      <div className="bg-weak-50 home-content-wrapper">
        {/* Video Modal */}
        <VideoModal 
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          videoId="acssdea7jb"
          title="Commencer avec Copyfy"
        />
        {/* Welcome Video Section */}
        <div 
          className="mx-auto pt-4 px-2 px-md-3" 
          style={{ maxWidth: '850px' }}
        >
          <div 
            className="course-wrapper thumb-video mx-auto mb-4 cursor-pointer" 
            style={{ maxWidth: '536px' }}
            onClick={() => setIsVideoModalOpen(true)}
          >
            <img 
              src="https://embed-ssl.wistia.com/deliveries/332ca1772dbed0ea292133c4dfcfd4e18a52cd06.jpg?image_crop_resized=960x549" 
              alt="Commencer avec Copyfy" 
              className="courses-thumb w-100" 
              style={{ borderRadius: '6px', width: '100%' }} 
            />
            <div className="px-3 py-2 position-absolute floating-details w-100" style={{ bottom: 0, borderRadius: '6px' }}>
              <p className="fs-lg text-white mb-0 fw-500">Commencer avec Copyfy</p>
            </div>
          </div>
        </div>
        {/* Action Plan Section */}
        <div 
          className="mx-auto pb-4 px-2 px-md-3 pt-4" 
          style={{ maxWidth: '850px' }}
        >
          <div className="border-gray p-3 rounded-15 bg-white w-100 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <p className="fs-normal mb-0 fw-500">Ton plan d&apos;action vers la première vente</p>
              <div>
                <p className="text-end fs-small mb-1 fw-500 text-light-gray">
                  <span className="text-primary">{completedCount}</span> actions sur <span className="text-sub">{totalCount}</span> Terminé
                </p>
                <div className="progress mt-0" style={{ height: '4px', minWidth: '130px' }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: `${progressPercentage}%` }}
                    aria-valuenow={progressPercentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>
              </div>
            </div>
            <ul className="list-unstyled mb-0 d-flex flex-column">
              {actionItems.map((item, index) => (
                <li 
                  key={item.id} 
                  transition={{ 
                    duration: 0.4, 
                    delay: 0.4 + (0.1 * index),
                    ease: "easeOut" 
                  }}
                  className="bg-weak-gray p-3 rounded-6 mb-2"
                >
                  <div className="d-flex justify-content-between">
                    <div className="d-flex w-100">
                      {item.completed ? (
                        <div className="radio-style-div complete me-3 mt-2 d-flex align-items-center justify-content-center">
                          <i className="ri-check-line lh-1"></i>
                        </div>
                      ) : (
                        <div className="radio-style-div me-3 mt-2"></div>
                      )}
                      <div className="d-flex flex-column flex-md-row gap-2 justify-content-between w-100">
                        <div>
                          <p className={`mb-0 fw-500 fs-small ${item.completed ? 'text-muted' : ''}`}>
                            {item.title}
                          </p>
                          <p className={`mb-0 fs-small ${item.completed ? 'text-muted' : 'text-sub'}`}>
                            {item.description}
                          </p>
                        </div>
                        {!item.completed && item.action && (
                          <div>
                            {item.action.type === 'video' ? (
                              <button 
                                className="mb-0 small fw-500 btn-secondary btn"
                                onClick={item.action.onClick}
                              >
                                <i className={item.action.icon}></i> {item.action.label}
                              </button>
                            ) : (
                              <Link
                                href={item.action.href || '#'}
                                onClick={() => markAsCompleted(item.id)}
                                className="mb-0 small fw-500 btn-secondary btn text-decoration-none"
                              >
                                <i className={item.action.icon}></i> {item.action.label}
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {/* Trial Notice - Only show if in trial and no active paid plan */}
          {isInTrial && !hasActivePlan && (
            <div 
              className="mt-3 trial-notice-wrapper-home d-flex flex-column flex-md-row gap-3 justify-content-between align-items-center"
            >
              <div className="text-white fw-500 justify-content-center d-flex align-items-center">
                {trialDaysRemaining > 0 
                  ? `Votre essai gratuit se termine dans ${trialDaysRemaining} jour${trialDaysRemaining > 1 ? 's' : ''}`
                  : "Votre essai gratuit est terminé"
                }
              </div>
              <div>
                <Link href="/dashboard/plans" className="btn btn-primary btn-upgrade text-decoration-none">
                  Mettre à niveau
                </Link>
              </div>
            </div>
          )}
          {/* Show welcome message for paid users */}
          {hasActivePlan && (
            <div 
              className="mt-3 alert alert-success d-flex gap-3 justify-content-between align-items-center"
            >
              <div className="d-flex align-items-center gap-2">
                <i className="ri-vip-crown-2-line fs-4"></i>
                <span className="fw-500">
                  Plan {session.user.activePlan?.identifier} actif
                </span>
              </div>
              <Link href="/dashboard/settings" className="btn btn-sm btn-outline-success text-decoration-none">
                Gérer mon abonnement
              </Link>
            </div>
          )}
        </div>
        {/* Promotional Slider */}
        <div 
          className="w-max-width-xl mx-auto pb-4 px-2 px-md-3"
        >
          <PromotionalSlider />
        </div>
      </div>
    </>
  );
}
