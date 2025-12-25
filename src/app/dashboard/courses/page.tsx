"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import DashboardHeader from "@/components/DashboardHeader";
import VideoModal from "@/components/VideoModal";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface VideoData {
  videoId: string;
  title: string;
  details: string;
  description: string;
  thumbnail: string;
  duration: string;
  type: string;
  icon?: string;
}

export default function CoursesPage() {
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formation Videos (Les étapes pour se lancer)
  const formationVideos: VideoData[] = [
    {
      videoId: 'acssdea7jb',
      title: 'Les étapes pour se lancer',
      details: '',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/332ca1772dbed0ea292133c4dfcfd4e18a52cd06.jpg?image_crop_resized=960x549',
      duration: '04:20',
      type: 'formation',
      icon: 'ri-play-circle-fill'
    },
    {
      videoId: 'l1q1ifkdzy',
      title: 'Trouver un produit Winner',
      details: '',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/b8752bbc05ba3215421c40c6b15b0a32ca49f279.jpg?image_crop_resized=960x549',
      duration: '04:20',
      type: 'formation',
      icon: 'ri-play-circle-fill'
    },
    {
      videoId: '4id3z59dc2',
      title: 'Analyse d\'une boutique',
      details: '',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/b1b8b6157dcb4999b612f10f88167d8a6c853f0f.jpg?image_crop_resized=960x549',
      duration: '04:20',
      type: 'formation',
      icon: 'ri-play-circle-fill'
    },
    {
      videoId: 'qkj7u90mfm',
      title: 'Comment savoir si un produit fonctionne',
      details: '',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/6f23579807bfc1c67d6a6fa92a41b595a3522c82.jpg?image_crop_resized=960x549',
      duration: '04:20',
      type: 'formation',
      icon: 'ri-play-circle-fill'
    },
    {
      videoId: 'eha3kzwxb2',
      title: 'Comment savoir si un produit est saturé',
      details: '',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/41bcef2956ab3bcf5edf99ab6c06c39b078718c6.jpg?image_crop_resized=960x549',
      duration: '04:20',
      type: 'formation',
      icon: 'ri-play-circle-fill'
    },
    {
      videoId: 'ep6415ed90',
      title: 'Analyse des publicités d\'une boutique',
      details: '',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/e91231471e0abb0a662984e93bc3aab0494f4011.jpg?image_crop_resized=960x549',
      duration: '04:20',
      type: 'formation',
      icon: 'ri-play-circle-fill'
    },
    {
      videoId: 'yghkc28hkx',
      title: 'Comment trouver un fournisseur',
      details: '',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/6bd0bab6193c775a7d261b0e90b0cb73c5190c55.jpg?image_crop_resized=960x549',
      duration: '04:20',
      type: 'formation',
      icon: 'ri-play-circle-fill'
    },
    {
      videoId: 'i47f9ntl4r',
      title: 'Fixer sa marge et son prix',
      details: '',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/780b71dc8b5675148008a1039a10243fa71962b6.jpg?image_crop_resized=960x549',
      duration: '04:20',
      type: 'formation',
      icon: 'ri-play-circle-fill'
    },
    {
      videoId: 'ck15btnile',
      title: 'Créer une bonne publicité',
      details: '',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/b8c63d79252721742470fc01443492cb40478ada.jpg?image_crop_resized=960x549',
      duration: '04:20',
      type: 'formation',
      icon: 'ri-play-circle-fill'
    },
    {
      videoId: 'nxkbs26crv',
      title: 'Quel marché lancer',
      details: '',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/e8fa3a48cb840ff72b9944f424ce96550d0b7040.jpg?image_crop_resized=960x549',
      duration: '04:20',
      type: 'formation',
      icon: 'ri-play-circle-fill'
    },
    {
      videoId: 'mup472gdla',
      title: 'Créer une page produit qui convertit',
      details: '',
      description: '',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/da0789decea56c2302be036b21710447881c8e43.jpg?image_crop_resized=960x549',
      duration: '04:20',
      type: 'formation',
      icon: 'ri-play-circle-fill'
    },
  ];

  // Live Coaching Videos
  const liveCoachingVideos: VideoData[] = [
    {
      videoId: 'k5a3y2i7hg',
      title: 'LIVE - Coaching du 22 octobre',
      details: '',
      description: 'Chaque mercredi à 20h, rejoignez Thomas Salic pour poser toutes vos questions.',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/fc0a39788db3308fca35650ef7e38ad275806f10.jpg?image_play_button_size=2x&image_crop_resized=960x540&image_play_button_rounded=1&image_play_button_color=2949E5e0',
      duration: '04:20',
      type: 'coaching',
      icon: 'ri-live-fill'
    },
    {
      videoId: 'n9kwhg28ra',
      title: 'LIVE - Coaching du 27 août',
      details: '',
      description: 'Chaque mercredi à 20h, rejoignez Thomas Salic pour poser toutes vos questions.',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/69c56c94cd79feddf9c8736c657b4fdb08ec7354.jpg?image_play_button_size=2x&image_crop_resized=960x540&image_play_button_rounded=1&image_play_button_color=2949E5e0',
      duration: '04:20',
      type: 'coaching',
      icon: 'ri-live-fill'
    },
    {
      videoId: '2vvrm5qoao',
      title: 'LIVE - Coaching du 20 août',
      details: '',
      description: 'Chaque mercredi à 20h, rejoignez Thomas Salic pour poser toutes vos questions.',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/ef5e3eb31162e963acccf094271fb1b5285ed3a0.jpg?image_play_button_size=2x&image_crop_resized=960x540&image_play_button_rounded=1&image_play_button_color=2949E5e0',
      duration: '04:20',
      type: 'coaching',
      icon: 'ri-live-fill'
    },
    {
      videoId: 'zlottifx99',
      title: 'LIVE - Coaching du 12 août',
      details: '',
      description: 'Chaque mercredi à 20h, rejoignez Thomas Salic pour poser toutes vos questions.',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/773395090ed8fd9533b8c88a41953af0adca99e6.jpg?image_play_button_size=2x&image_crop_resized=960x540&image_play_button_rounded=1&image_play_button_color=2949E5e0',
      duration: '04:20',
      type: 'coaching',
      icon: 'ri-live-fill'
    },
    {
      videoId: 'qq45hy4nbv',
      title: 'LIVE - Coaching du 6 août',
      details: '',
      description: 'Chaque mercredi à 20h, rejoignez Thomas Salic pour poser toutes vos questions.',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/e2c163cfeabd01f655d009d43161e15017f2bed1.jpg?image_play_button_size=2x&image_crop_resized=960x540&image_play_button_rounded=1&image_play_button_color=2949E5e0',
      duration: '04:20',
      type: 'coaching',
      icon: 'ri-live-fill'
    },
    {
      videoId: 'sea5m0w9v6',
      title: 'LIVE - Coaching du 30 juillet',
      details: '',
      description: 'Chaque mercredi à 20h, rejoignez Thomas Salic pour poser toutes vos questions.',
      thumbnail: 'https://embed-ssl.wistia.com/deliveries/7d0b9236a4b323bdc7f79a75eaf742173c375f29.jpg?image_play_button_size=2x&image_crop_resized=960x540&image_play_button_rounded=1&image_play_button_color=2949E5e0',
      duration: '04:20',
      type: 'coaching',
      icon: 'ri-live-fill'
    },
  ];

  // Hero video
  const heroVideo: VideoData = {
    videoId: 'gtzlf11kxc',
    title: 'Regardez cette vidéo pour comprendre comment utiliser Copyfy !',
    details: 'Découvrez les possibilités de Copyfy et les modules qui seront couverts dans les prochains vidéos.',
    description: '',
    thumbnail: 'https://embed-ssl.wistia.com/deliveries/6025e4a931783d423668cdad82dc791fb2791825.jpg?image_play_button_size=2x&image_crop_resized=960x558&image_play_button_rounded=1&image_play_button_color=2949E5e0',
    duration: '10:00',
    type: 'hero',
    icon: 'ri-play-circle-fill'
  };

  const handleVideoClick = (video: VideoData) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedVideo(null), 300);
  };

  // Slider settings
  const sliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 2,
    prevArrow: <button className="slick-prev slick-arrow"><i className="fa-solid fa-chevron-left"></i></button>,
    nextArrow: <button className="slick-next slick-arrow"><i className="fa-solid fa-chevron-right"></i></button>,
    responsive: [
      {
        breakpoint: 1500,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 2,
        }
      },
      {
        breakpoint: 1080,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ]
  };

  return (
    <>
      <DashboardHeader
        title="Courses"
        icon="ri-folder-video-line"
        iconType="icon"
        showStats={false}
      />

      <div className="bg-white home-content-wrapper courses-page-wrapper">
        <div className="container-fluid w-max-width-xl mx-auto px-3">
          
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="course-hero-section"
          >
            <div className="row gx-4 gx-xl-5 align-items-center">
              {/* TEXT LEFT */}
              <div className="col-12 col-md-5">
                <div className="left-details py-4">
                  <h1 className="fw-bold details-title mb-3">
                    Regardez cette vidéo pour comprendre comment utiliser Copyfy !
                  </h1>
                  <p className="fs-small text-secondary-color mb-4">
                    Découvrez les possibilités de Copyfy et les modules qui seront couverts dans les prochains vidéos.
                  </p>
                  <button 
                    className="btn btn-primary mb-4"
                    onClick={() => handleVideoClick(heroVideo)}
                  >
                    <i className="ri-play-fill me-2"></i> Commencer à regarder
                  </button>

                  <div className="d-flex avatars align-items-center">
                    <div className="d-flex" style={{ marginRight: '12px' }}>
                      <div className="avatar-circle" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0C6CFB', marginLeft: '0', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '600' }}>5k+</div>
                      <div className="avatar-circle" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2949E5', marginLeft: '-8px', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '600' }}>👥</div>
                      <div className="avatar-circle" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4CAF50', marginLeft: '-8px', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '600' }}>✓</div>
                    </div>
                    <p className="text-secondary-color mb-0 fs-xs">50000+ E-Commerçants ont déjà commencé</p>
                  </div>
                </div>
              </div>

              {/* VIDEO RIGHT */}
              <div className="col-12 col-md-7">
                <div className="hero-video-wrapper">
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleVideoClick(heroVideo)}
                  >
                    <img 
                      src={heroVideo.thumbnail} 
                      alt={heroVideo.title}
                      className="w-100"
                      style={{ display: 'block', borderRadius: '20px' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Formation Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="courses-videos-section py-4"
          >
            <p className="fs-5 fw-500 mb-3">Formation</p>
            <div className="video-slider-wrapper">
              <Slider {...sliderSettings}>
                {formationVideos.map((video, index) => (
                  <div key={index} className="px-2">
                    <div 
                      className="course-video-card cursor-pointer"
                      onClick={() => handleVideoClick(video)}
                    >
                      <div className="video-thumbnail-wrapper position-relative" style={{ borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000' }}>
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-100"
                          style={{ display: 'block', aspectRatio: '16/9', objectFit: 'cover' }}
                        />
                        <div 
                          className="position-absolute top-50 start-50 translate-middle play-button-overlay"
                          style={{ 
                            width: '60px', 
                            height: '60px', 
                            backgroundColor: 'rgba(41, 73, 229, 0.9)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <i className="ri-play-fill text-white" style={{ fontSize: '28px', marginLeft: '3px' }}></i>
                        </div>
                        <span 
                          className="video-duration-badge position-absolute"
                          style={{
                            bottom: '8px',
                            right: '8px',
                            background: 'rgba(34, 37, 48, 1)',
                            color: 'white',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            lineHeight: '1'
                          }}
                        >
                          {video.duration}
                        </span>
                      </div>
                      <div className="mt-3">
                        <h5 className="mb-0 fs-small fw-600" style={{ color: '#0e121b' }}>{video.title}</h5>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
          </motion.div>

          {/* Live Coaching Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="courses-videos-section py-4 pb-5"
          >
            <p className="fs-5 fw-500 mb-3">Live coaching</p>
            <div className="video-slider-wrapper">
              <Slider {...sliderSettings}>
                {liveCoachingVideos.map((video, index) => (
                  <div key={index} className="px-2">
                    <div 
                      className="course-video-card cursor-pointer"
                      onClick={() => handleVideoClick(video)}
                    >
                      <div className="video-thumbnail-wrapper position-relative" style={{ borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000' }}>
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-100"
                          style={{ display: 'block', aspectRatio: '16/9', objectFit: 'cover' }}
                        />
                        <div 
                          className="position-absolute top-50 start-50 translate-middle play-button-overlay"
                          style={{ 
                            width: '60px', 
                            height: '60px', 
                            backgroundColor: 'rgba(41, 73, 229, 0.9)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <i className="ri-play-fill text-white" style={{ fontSize: '28px', marginLeft: '3px' }}></i>
                        </div>
                        <span 
                          className="video-duration-badge position-absolute"
                          style={{
                            bottom: '8px',
                            right: '8px',
                            background: 'rgba(34, 37, 48, 1)',
                            color: 'white',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            lineHeight: '1'
                          }}
                        >
                          {video.duration}
                        </span>
                      </div>
                      <div className="mt-3">
                        <h5 className="mb-0 fs-small fw-600" style={{ color: '#0e121b' }}>{video.title}</h5>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          videoId={selectedVideo.videoId}
          title={selectedVideo.title}
        />
      )}

      <style jsx global>{`
        .courses-page-wrapper {
          padding-top: 0;
          padding-bottom: 60px;
          overflow-x: hidden;
        }

        .w-max-width-xl {
          max-width: 1320px;
        }

        .course-hero-section {
          background: transparent;
          padding: 50px 0 40px;
          margin-bottom: 30px;
        }

        .course-hero-section .row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
        }

        @media (min-width: 768px) {
          .course-hero-section .row {
            flex-wrap: nowrap;
          }
        }

        .hero-video-wrapper {
          padding: 14px;
          background: linear-gradient(135deg, #0C6CFB 0%, #2949E5 100%);
          border-radius: 32px;
          box-shadow: 0 10px 30px rgba(12, 108, 251, 0.2);
          max-width: 100%;
        }

        .hero-video-wrapper .banner-video img {
          border-radius: 20px;
        }

        .left-details {
          padding-right: 0;
        }

        .details-title {
          font-size: 28px;
          color: #0e121b;
          line-height: 1.35;
          font-weight: 700;
        }

        .avatars {
          margin-top: 1.5rem !important;
        }

        .video-slider-wrapper {
          margin: 0;
          padding-bottom: 20px;
          position: relative;
          overflow: hidden;
        }

        .video-slider-wrapper .slick-slide {
          padding: 0 12px;
        }

        .video-slider-wrapper .slick-slide > div {
          width: 100%;
        }

        .video-slider-wrapper .slick-list {
          overflow: visible;
          margin: 0 -12px;
          padding: 12px 0 !important;
        }

        .video-slider-wrapper .slick-track {
          display: flex !important;
        }

        .video-slider-wrapper .slick-arrow {
          position: absolute;
          top: 42%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          color: #525866;
          border: 1px solid #E1E4EA;
          background-color: #fff;
          box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.1);
          z-index: 10;
          transition: all 0.2s ease;
          font-size: 14px;
          display: flex !important;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          outline: none;
        }

        .video-slider-wrapper .slick-arrow:before {
          display: none;
        }

        .video-slider-wrapper .slick-prev {
          left: 0;
        }

        .video-slider-wrapper .slick-next {
          right: 0;
        }

        .video-slider-wrapper .slick-arrow:hover {
          color: #0c6cfb;
          border-color: #0c6cfb;
          box-shadow: 0px 6px 16px 0px rgba(12, 108, 251, 0.2);
        }

        .video-slider-wrapper .slick-arrow:focus {
          box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.1) !important;
        }

        .video-slider-wrapper .slick-disabled {
          color: #CACFD8 !important;
          border-color: #E1E4EA !important;
          background-color: #F5F7FA !important;
          cursor: not-allowed !important;
          opacity: 0.5;
        }

        .course-video-card {
          transition: all 0.3s ease;
          outline: none;
        }

        .course-video-card .video-thumbnail-wrapper {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          border-radius: 12px;
          overflow: hidden;
        }

        .course-video-card:hover .video-thumbnail-wrapper {
          transform: translateY(-6px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .course-video-card .play-button-overlay {
          transition: all 0.3s ease;
        }

        .course-video-card:hover .play-button-overlay {
          background-color: rgba(41, 73, 229, 1) !important;
          transform: scale(1.15);
        }

        .banner-video .play-button-hero {
          transition: all 0.3s ease;
        }

        .banner-video:hover .play-button-hero {
          background-color: rgba(41, 73, 229, 1) !important;
          transform: scale(1.1);
        }

        .courses-videos-section {
          padding-top: 1.5rem;
          padding-bottom: 1.5rem;
        }

        .courses-videos-section .fs-5 {
          font-size: 20px !important;
          font-weight: 600 !important;
          margin-bottom: 1.5rem !important;
          color: #0e121b;
        }

        @media (max-width: 1550px) {
          .video-slider-wrapper .slick-arrow {
            width: 36px;
            height: 36px;
            font-size: 12px;
          }

          .details-title {
            font-size: 26px;
          }
        }

        @media (max-width: 1199px) {
          .details-title {
            font-size: 24px;
          }

          .hero-video-wrapper {
            padding: 12px;
            border-radius: 28px;
          }
        }

        @media (max-width: 767px) {
          .course-hero-section {
            padding: 30px 0 20px;
          }

          .hero-video-wrapper {
            margin-bottom: 2rem;
            padding: 10px;
          }

          .details-title {
            font-size: 22px;
          }

          .left-details {
            padding-right: 0;
          }
          
          .video-slider-wrapper .slick-arrow {
            display: none !important;
          }

          .video-slider-wrapper .slick-list {
            margin: 0 -8px;
          }

          .video-slider-wrapper .slick-slide {
            padding: 0 8px;
          }

          .course-hero-section {
            padding: 20px 0;
          }

          .hero-video-wrapper {
            padding: 8px;
            border-radius: 20px;
            margin-bottom: 1.5rem;
          }

          .avatars {
            flex-direction: row;
            justify-content: flex-start;
          }

          .courses-videos-section {
            padding-top: 1rem;
          }
        }
      `}</style>
    </>
  );
}

