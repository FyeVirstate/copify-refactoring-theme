"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardHeader from "@/components/DashboardHeader";

// Video data interfaces
interface VideoData {
  videoId: string;
  title: string;
  details: string;
  description: string;
  thumbnail: string;
  duration?: string;
  type: string;
  icon?: string;
  url?: string;
}

interface CategoryData {
  id: string;
  name: string;
  icon: string;
  videos: VideoData[];
}

export default function CoursesPage() {
  const [activeCategory, setActiveCategory] = useState<string>("formation");
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Formation Videos (E-Commerce Training)
  const formationVideos: VideoData[] = [
    {
      videoId: 'acssdea7jb',
      title: 'Les étapes pour se lancer',
      details: `Découvrez les 7 étapes essentielles pour démarrer en e-commerce, de la niche jusqu'à la gestion légale de votre activité.
      <br/><br/>
      <strong>Étape 1</strong> : Définir sa niche et bien la comprendre<br/>
      <strong>Étape 2</strong> : Trouver un produit à fort potentiel<br/>
      <strong>Étape 3</strong> : Créer son site Internet avec les bons outils<br/>
      <strong>Étape 4</strong> : Préparer ses premières publicités<br/>
      <strong>Étape 5</strong> : Tester ses pubs et analyser les données<br/>
      <strong>Étape 6</strong> : Connecter son fournisseur pour automatiser les commandes<br/>
      <strong>Étape 7</strong> : Gérer l'aspect légal pour être en règle dès le départ`,
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/332ca1772dbed0ea292133c4dfcfd4e18a52cd06.jpg?image_crop_resized=960x549',
      duration: '04:39',
      type: 'formation',
      icon: 'ri-play-circle-fill'
    },
    {
      videoId: 'l1q1ifkdzy',
      title: 'Trouver un produit Winner',
      details: 'Apprenez à identifier les produits à fort potentiel qui peuvent générer des ventes importantes. Découvrez les critères essentiels pour évaluer un produit winner.',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/b8752bbc05ba3215421c40c6b15b0a32ca49f279.jpg?image_crop_resized=960x549',
      duration: '06:12',
      type: 'formation',
      icon: 'ri-play-circle-fill'
    },
    {
      videoId: 'dnf4jltaev',
      title: 'Trouver une bonne niche',
      details: 'Comment identifier une niche rentable et comprendre les besoins de votre marché cible. Les critères pour valider une niche avant de se lancer.',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/6ebd2e165f2e8104e8b777a563a0080a635500d6.jpg?image_crop_resized=960x540',
      duration: '05:30',
      type: 'formation',
      icon: 'ri-play-circle-fill'
    },
    {
      videoId: '4id3z59dc2',
      title: "Analyse d'une boutique",
      details: 'Apprenez à analyser en profondeur une boutique Shopify concurrente. Identifiez ce qui fonctionne et ce qui peut être amélioré.',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/b1b8b6157dcb4999b612f10f88167d8a6c853f0f.jpg?image_crop_resized=960x549',
      duration: '07:45',
      type: 'formation',
      icon: 'ri-play-circle-fill'
    },
    {
      videoId: 'qkj7u90mfm',
      title: 'Comment savoir si un produit ou une boutique marche',
      details: 'Les indicateurs clés pour évaluer le succès d\'un produit ou d\'une boutique. Apprenez à lire les données et interpréter les signaux.',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/6f23579807bfc1c67d6a6fa92a41b595a3522c82.jpg?image_crop_resized=960x549',
      duration: '05:20',
      type: 'formation',
      icon: 'ri-play-circle-fill'
    },
    {
      videoId: 'eha3kzwxb2',
      title: 'Comment savoir si un produit est saturé',
      details: 'Identifiez les signes de saturation d\'un marché et apprenez à éviter les produits trop concurrentiels.',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/41bcef2956ab3bcf5edf99ab6c06c39b078718c6.jpg?image_crop_resized=960x549',
      duration: '04:55',
      type: 'formation',
      icon: 'ri-play-circle-fill'
    },
    {
      videoId: 'ep6415ed90',
      title: "Analyse des Ads d'une boutique",
      details: 'Décryptez les stratégies publicitaires de vos concurrents. Analysez leurs créatives, leurs angles et leur ciblage.',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/e91231471e0abb0a662984e93bc3aab0494f4011.jpg?image_crop_resized=960x549',
      duration: '08:10',
      type: 'formation',
      icon: 'ri-play-circle-fill'
    },
    {
      videoId: 'yghkc28hkx',
      title: 'Comment trouver son fournisseur',
      details: 'Les meilleures méthodes pour trouver des fournisseurs fiables et négocier les meilleurs prix pour vos produits.',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/6bd0bab6193c775a7d261b0e90b0cb73c5190c55.jpg?image_crop_resized=960x549',
      duration: '06:30',
      type: 'formation',
      icon: 'ri-play-circle-fill'
    },
  ];

  // Tutorial Videos (How to use Copyfy)
  const tutorialVideos: VideoData[] = [
    {
      videoId: 'o84sjd2d50',
      title: 'Comment Copyfy fonctionne ?',
      details: 'Découvrez comment utiliser Copyfy pour trouver des produits gagnants et analyser la concurrence. Une présentation complète de toutes les fonctionnalités.',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/b997152663113999a694fd33d823f04ab51f5e50.jpg?image_crop_resized=960x540',
      duration: '10:00',
      type: 'tutoriel',
      icon: 'ri-book-2-line'
    },
    {
      videoId: 'wevwjwukr2',
      title: 'Créer votre boutique et thème',
      details: 'Apprenez à créer votre boutique Shopify et à personnaliser votre thème pour maximiser les conversions.',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/bc3cb0f4a8bd6abba8fdffe8c75c9ccfb7efd64b.jpg?image_crop_resized=960x540',
      duration: '02:30',
      type: 'tutoriel',
      icon: 'ri-book-2-line'
    },
    {
      videoId: '8tielcug1q',
      title: 'Top Publicités',
      details: 'Comment utiliser le module Top Publicités pour découvrir les meilleures ads du moment et s\'en inspirer.',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/6ebd2e165f2e8104e8b777a563a0080a635500d6.jpg?image_crop_resized=960x540',
      duration: '03:15',
      type: 'tutoriel',
      icon: 'ri-book-2-line'
    },
    {
      videoId: 'llh7r5ik3a',
      title: 'Top Produits',
      details: 'Maîtrisez le module Top Produits pour identifier les produits tendances et valider vos idées.',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/d72d59ee9e8a54e2e1641305f19b533c0a06d3cd.jpg?image_crop_resized=960x540',
      duration: '03:45',
      type: 'tutoriel',
      icon: 'ri-book-2-line'
    },
    {
      videoId: 'twka7z1xml',
      title: 'Top Boutiques',
      details: 'Explorez les meilleures boutiques Shopify et apprenez de leurs stratégies gagnantes.',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/46213c9f3e1d82268352ac1a83dd16c32de46f2b.jpg?image_crop_resized=960x540',
      duration: '04:00',
      type: 'tutoriel',
      icon: 'ri-book-2-line'
    },
    {
      videoId: 'ld1uxfoxmz',
      title: 'Analyse de boutique',
      details: 'Utilisez l\'outil d\'analyse de boutique pour décortiquer n\'importe quelle boutique Shopify.',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/e430c27cf1e8419695b91b4db47438df9d43907a.jpg?image_crop_resized=960x540',
      duration: '03:30',
      type: 'tutoriel',
      icon: 'ri-book-2-line'
    },
    {
      videoId: 'adcc4vxjjo',
      title: 'Produits',
      details: 'Comment exporter des produits directement vers votre boutique Shopify en quelques clics.',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/9539b21c4f3250b6f411169676932b09f3e06e55.jpg?image_crop_resized=960x540',
      duration: '02:45',
      type: 'tutoriel',
      icon: 'ri-book-2-line'
    },
    {
      videoId: 'z839merqfl',
      title: 'Informations de Thèmes',
      details: 'Découvrez quel thème utilise n\'importe quelle boutique Shopify et ses applications installées.',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/496d8ed3a39627e9dff49f734872cc4ca9fa3787.jpg?image_crop_resized=960x540',
      duration: '02:15',
      type: 'tutoriel',
      icon: 'ri-book-2-line'
    },
  ];

  // Live Coaching Videos
  const liveCoachingVideos: VideoData[] = [
    {
      videoId: '7w3dbdy1cv',
      title: 'LIVE - Coaching du 12 novembre',
      details: '',
      description: 'Chaque mercredi à 20h, rejoignez Thomas Salic pour poser toutes vos questions.',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/27d51a7e2a897745d6f48c9b5de1acb32afee904.webp?image_crop_resized=960x540',
      duration: '1:30:00',
      type: 'coaching',
      icon: 'ri-live-fill'
    },
    {
      videoId: '1kwvijm1kf',
      title: 'LIVE - Coaching du 5 novembre',
      details: '',
      description: 'Chaque mercredi à 20h, rejoignez Thomas Salic pour poser toutes vos questions.',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/434ea48e74aae1c1e7b975966e07aab239a0f25f.jpg?image_crop_resized=960x540',
      duration: '1:25:00',
      type: 'coaching',
      icon: 'ri-live-fill'
    },
    {
      videoId: 'k5a3y2i7hg',
      title: 'LIVE - Coaching du 22 octobre',
      details: '',
      description: 'Chaque mercredi à 20h, rejoignez Thomas Salic pour poser toutes vos questions.',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/fc0a39788db3308fca35650ef7e38ad275806f10.jpg?image_crop_resized=960x540',
      duration: '1:44:42',
      type: 'coaching',
      icon: 'ri-live-fill'
    },
    {
      videoId: 'n9kwhg28ra',
      title: 'LIVE - Coaching du 27 août',
      details: '',
      description: 'Chaque mercredi à 20h, rejoignez Thomas Salic pour poser toutes vos questions.',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/69c56c94cd79feddf9c8736c657b4fdb08ec7354.jpg?image_crop_resized=960x540',
      duration: '1:35:00',
      type: 'coaching',
      icon: 'ri-live-fill'
    },
    {
      videoId: '2vvrm5qoao',
      title: 'LIVE - Coaching du 20 août',
      details: '',
      description: 'Chaque mercredi à 20h, rejoignez Thomas Salic pour poser toutes vos questions.',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/ef5e3eb31162e963acccf094271fb1b5285ed3a0.jpg?image_crop_resized=960x540',
      duration: '1:28:00',
      type: 'coaching',
      icon: 'ri-live-fill'
    },
    {
      videoId: 'zlottifx99',
      title: 'LIVE - Coaching du 12 août',
      details: '',
      description: 'Chaque mercredi à 20h, rejoignez Thomas Salic pour poser toutes vos questions.',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/773395090ed8fd9533b8c88a41953af0adca99e6.jpg?image_crop_resized=960x540',
      duration: '1:32:00',
      type: 'coaching',
      icon: 'ri-live-fill'
    },
    {
      videoId: 'qq45hy4nbv',
      title: 'LIVE - Coaching du 6 août',
      details: '',
      description: 'Chaque mercredi à 20h, rejoignez Thomas Salic pour poser toutes vos questions.',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/e2c163cfeabd01f655d009d43161e15017f2bed1.jpg?image_crop_resized=960x540',
      duration: '1:40:00',
      type: 'coaching',
      icon: 'ri-live-fill'
    },
    {
      videoId: 'sea5m0w9v6',
      title: 'LIVE - Coaching du 30 juillet',
      details: '',
      description: 'Chaque mercredi à 20h, rejoignez Thomas Salic pour poser toutes vos questions.',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/7d0b9236a4b323bdc7f79a75eaf742173c375f29.jpg?image_crop_resized=960x540',
      duration: '1:38:00',
      type: 'coaching',
      icon: 'ri-live-fill'
    },
  ];

  // Categories
  const categories: CategoryData[] = [
    { id: 'formation', name: 'Formation', icon: 'ri-graduation-cap-line', videos: formationVideos },
    { id: 'tutoriel', name: 'Tutoriel', icon: 'ri-book-2-line', videos: tutorialVideos },
    { id: 'coaching', name: 'Live coaching', icon: 'ri-live-line', videos: liveCoachingVideos },
  ];

  // Set default video on mount
  useEffect(() => {
    const defaultCategory = categories.find(c => c.id === activeCategory);
    if (defaultCategory && defaultCategory.videos.length > 0 && !currentVideo) {
      setCurrentVideo(defaultCategory.videos[0]);
    }
  }, []);

  // Handle video switch
  const handleVideoSelect = (video: VideoData) => {
    if (currentVideo?.videoId === video.videoId) return;
    setCurrentVideo(video);
    
    // Scroll to top on mobile
    if (window.innerWidth < 992 && videoContainerRef.current) {
      videoContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    const category = categories.find(c => c.id === categoryId);
    if (category && category.videos.length > 0) {
      handleVideoSelect(category.videos[0]);
    }
  };

  // Get current category's videos
  const getCurrentVideos = () => {
    const category = categories.find(c => c.id === activeCategory);
    return category ? category.videos : [];
  };

  return (
    <>
      <DashboardHeader
        title="Formation"
        icon="ri-folder-video-line"
        iconType="icon"
        showStats={false}
      />

      <div className="courses-page-wrapper">
        <div className="container-fluid">
          <div className="row g-4">
            {/* Left Column - Video Player */}
            <div className="col-lg-8">
              <div ref={videoContainerRef}>
                {/* Main Video Container */}
                <motion.div 
                  ref={videoContainerRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="video-container"
                >
                  {currentVideo && (
                    <iframe
                      key={currentVideo.videoId}
                      src={`https://fast.wistia.net/embed/iframe/${currentVideo.videoId}?videoFoam=true`}
                      title={currentVideo.title}
                      allow="autoplay; fullscreen"
                      allowFullScreen
                      className="wistia-iframe"
                    />
                  )}
                </motion.div>

                {/* Video Info */}
                <motion.div 
                  className="video-info"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <AnimatePresence mode="wait">
                    {currentVideo && (
                      <motion.div
                        key={currentVideo.videoId}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <h2 className="video-title">{currentVideo.title}</h2>
                        {currentVideo.details && (
                          <div 
                            className="video-description"
                            dangerouslySetInnerHTML={{ __html: currentVideo.details }}
                          />
                        )}
                        {currentVideo.description && !currentVideo.details && (
                          <p className="video-description">{currentVideo.description}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Live Coaching Banner - Show only for coaching videos */}
                <AnimatePresence>
                  {activeCategory === 'coaching' && (
                    <motion.div 
                      className="live-coaching-banner"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="row align-items-center g-3">
                        <div className="col-md-5">
                          <div className="banner-image">
                            <div className="live-badge">
                              <i className="ri-live-fill"></i> LIVE
                            </div>
                            <div className="banner-content">
                              <h4>COACHING E-COM OFFERT</h4>
                              <p>Chaque Mercredi à 20h ( Heure Française )</p>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-7">
                          <div className="banner-info">
                            <h3>Inscrivez-vous au prochain coaching en direct gratuit</h3>
                            <p>Chaque mercredi à 20h, rejoignez Thomas Salic pour poser toutes vos questions.</p>
                            <a 
                              href="https://calendly.com/kevin-copyfy/copyfy-coaching" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn btn-secondary"
                            >
                              <i className="ri-calendar-line me-2"></i>
                              Réservez votre place maintenant
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column - Playlist */}
            <div className="col-lg-4">
              <motion.div 
                className="playlist-container"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                {/* Category Tabs */}
                <div className="playlist-tabs">
                  <div className="tabs-nav">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        className={`tab-btn ${activeCategory === category.id ? 'active' : ''}`}
                        onClick={() => handleCategoryChange(category.id)}
                      >
                        <i className={category.icon}></i>
                        <span>{category.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Videos List */}
                <div className="videos-list">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeCategory}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {getCurrentVideos().map((video, index) => (
                        <motion.div
                          key={video.videoId}
                          className={`video-item ${currentVideo?.videoId === video.videoId ? 'active' : ''}`}
                          onClick={() => handleVideoSelect(video)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="video-thumbnail">
                            <img 
                              src={video.thumbnail} 
                              alt={video.title}
                              loading="lazy"
                            />
                            {currentVideo?.videoId === video.videoId && (
                              <div className="now-playing-badge">
                                <i className="ri-play-fill"></i>
                              </div>
                            )}
                          </div>
                          <div className="video-meta">
                            <h5>{video.title}</h5>
                            {video.duration && (
                              <span className="duration">
                                <i className="ri-time-line"></i> {video.duration}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .courses-page-wrapper {
          padding: 32px 24px 60px;
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Video Container */
        .video-container {
          position: relative;
          width: 100%;
          padding-top: 56.25%; /* 16:9 aspect ratio */
          overflow: hidden;
        }

        .wistia-iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        /* Video Info */
        .video-info {
          padding: 24px 0;
        }

        .video-title {
          font-size: 22px;
          font-weight: 700;
          color: #0e121b;
          margin-bottom: 12px;
          line-height: 1.3;
        }

        .video-description {
          font-size: 14px;
          line-height: 1.7;
          color: #525866;
        }

        .video-description strong {
          color: #0e121b;
          font-weight: 600;
        }

        /* Live Coaching Banner */
        .live-coaching-banner {
          background: #fff;
          border: 1px solid #E1E4EA;
          border-radius: 12px;
          padding: 20px;
          margin-top: 8px;
          overflow: hidden;
        }

        .live-coaching-banner .banner-image {
          background: linear-gradient(135deg, #0C6CFB 0%, #2949E5 100%);
          border-radius: 10px;
          padding: 20px;
          position: relative;
          height: 100%;
          min-height: 140px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .live-coaching-banner .live-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: #FF4757;
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .live-coaching-banner .live-badge i {
          font-size: 10px;
        }

        .live-coaching-banner .banner-content {
          color: white;
          text-align: center;
        }

        .live-coaching-banner .banner-content h4 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .live-coaching-banner .banner-content p {
          font-size: 12px;
          opacity: 0.9;
          margin: 0;
        }

        .live-coaching-banner .banner-info h3 {
          font-size: 16px;
          font-weight: 700;
          color: #0e121b;
          margin-bottom: 8px;
        }

        .live-coaching-banner .banner-info p {
          font-size: 13px;
          color: #525866;
          margin-bottom: 16px;
        }

        .live-coaching-banner .btn-secondary {
          width: 100%;
          background: #fff;
          border: 1px solid #E1E4EA;
          color: #0e121b;
          font-size: 13px;
          font-weight: 600;
          padding: 10px 16px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .live-coaching-banner .btn-secondary:hover {
          background: #F5F7FA;
          border-color: #0C6CFB;
          color: #0C6CFB;
        }

        /* Playlist Container */
        .playlist-container {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #E1E4EA;
          overflow: hidden;
          height: calc(100vh - 200px);
          min-height: 500px;
          max-height: 720px;
          display: flex;
          flex-direction: column;
        }

        /* Playlist Tabs */
        .playlist-tabs {
          padding: 16px 16px 0;
          border-bottom: 1px solid #E1E4EA;
          flex-shrink: 0;
        }

        .tabs-nav {
          display: flex;
          gap: 6px;
          padding-bottom: 16px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: none;
          background: transparent;
          color: #525866;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .tab-btn i {
          font-size: 15px;
        }

        .tab-btn:hover {
          color: #0C6CFB;
          background: rgba(12, 108, 251, 0.05);
        }

        .tab-btn.active {
          background: rgba(12, 108, 251, 0.1);
          color: #0C6CFB;
        }

        /* Videos List */
        .videos-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .videos-list::-webkit-scrollbar {
          width: 6px;
        }

        .videos-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .videos-list::-webkit-scrollbar-thumb {
          background: #E1E4EA;
          border-radius: 3px;
        }

        .videos-list::-webkit-scrollbar-thumb:hover {
          background: #CACFD8;
        }

        /* Video Item */
        .video-item {
          display: flex;
          gap: 12px;
          padding: 10px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 6px;
        }

        .video-item:hover {
          background: #F5F7FA;
        }

        .video-item.active {
          background: rgba(12, 108, 251, 0.08);
        }

        .video-item.active .video-meta h5 {
          color: #0C6CFB;
        }

        .video-thumbnail {
          position: relative;
          width: 110px;
          height: 62px;
          flex-shrink: 0;
          border-radius: 8px;
          overflow: hidden;
          background: #0a0a0a;
        }

        .video-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .video-item:hover .video-thumbnail img {
          transform: scale(1.05);
        }

        .now-playing-badge {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 28px;
          height: 28px;
          background: #0C6CFB;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .now-playing-badge i {
          color: white;
          font-size: 14px;
          margin-left: 2px;
        }

        .video-meta {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .video-meta h5 {
          font-size: 13px;
          font-weight: 600;
          color: #0e121b;
          margin: 0 0 4px;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .video-meta .duration {
          font-size: 11px;
          color: #99A0AE;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .video-meta .duration i {
          font-size: 12px;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .courses-page-wrapper {
            padding: 0 16px 40px;
          }

          .playlist-container {
            height: auto;
            max-height: none;
          }
        }

        @media (max-width: 991px) {
          .courses-page-wrapper {
            padding: 0 12px 40px;
          }

          .playlist-container {
            margin-top: 20px;
            max-height: 450px;
          }

          .video-title {
            font-size: 18px;
          }

          .tabs-nav {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .tabs-nav::-webkit-scrollbar {
            display: none;
          }
        }

        @media (max-width: 576px) {
          .video-thumbnail {
            width: 90px;
            height: 51px;
          }

          .video-meta h5 {
            font-size: 12px;
          }

          .tab-btn {
            padding: 6px 10px;
            font-size: 12px;
          }

          .tab-btn span {
            display: none;
          }

          .tab-btn i {
            font-size: 18px;
          }

          .live-coaching-banner .banner-image {
            min-height: 120px;
          }

          .live-coaching-banner .banner-content h4 {
            font-size: 14px;
          }
        }
      `}</style>
    </>
  );
}
