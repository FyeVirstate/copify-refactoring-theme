"use client";

import { useEffect, useRef, useState } from "react";
import Slider, { Settings } from "react-slick";

// Arrow components to avoid React prop warnings - filter out React props
function PrevArrow(props: any) {
  const { className, style, onClick, currentSlide, slideCount, ...rest } = props;
  return (
    <button 
      className={`${className} prev`} 
      type="button" 
      onClick={onClick} 
      aria-label="Previous"
      style={style}
    >
      <i className="fa-solid fa-chevron-left"></i>
    </button>
  );
}

function NextArrow(props: any) {
  const { className, style, onClick, currentSlide, slideCount, ...rest } = props;
  return (
    <button 
      className={`${className} next`} 
      type="button" 
      onClick={onClick} 
      aria-label="Next"
      style={style}
    >
      <i className="fa-solid fa-chevron-right"></i>
    </button>
  );
}

export default function PromotionalSlider() {
  const sliderRef = useRef<Slider>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const settings: Settings = {
    infinite: true,
    slidesToShow: 2,
    slidesToScroll: 1,
    variableWidth: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      {
        breakpoint: 1300,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          variableWidth: true,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          variableWidth: true,
        },
      },
    ],
  };

  if (!isMounted) {
    return (
      <div className="promotion-slider px-3" style={{ minHeight: '183px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="promotion-banner">
            <img className="img-fluid rounded-8" src="/img/offer-shopify.png" alt="Shopify Offer" style={{ width: '380px', height: 'auto' }} />
          </div>
          <div className="promotion-banner">
            <img className="img-fluid rounded-8" src="/img/offer-shopify-2.png" alt="Coaching" style={{ width: '380px', height: 'auto' }} />
          </div>
          <div className="promotion-banner">
            <img className="img-fluid rounded-8" src="/img/offer-shopify-8.png" alt="TikTok Offer" style={{ width: '380px', height: 'auto' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="promotion-slider" className="promotion-slider px-3" style={{ maxHeight: '183px' }}>
      <Slider ref={sliderRef} {...settings}>
        {/* Shopify Offer */}
        <div>
          <div className="promotion-banner">
            <a href="https://shopify.pxf.io/0ZeB7N" target="_blank" rel="noopener noreferrer">
              <img className="img-fluid rounded-8" src="/img/offer-shopify.png" alt="Shopify Offer" />
            </a>
          </div>
        </div>

        {/* Coaching Offer */}
        <div>
          <div className="promotion-banner">
            <a href="https://calendly.com/kevin-copyfy/copyfy-coaching" target="_blank" rel="noopener noreferrer">
              <img className="img-fluid rounded-8" src="/img/offer-shopify-2.png" alt="Coaching" />
            </a>
          </div>
        </div>

        {/* TikTok Offer */}
        <div>
          <div className="promotion-banner">
            <a href="https://getstartedtiktok.pxf.io/c/5574341/2899724/16372" target="_blank" rel="noopener noreferrer">
              <img className="img-fluid rounded-8" src="/img/offer-shopify-8.png" alt="TikTok Offer" />
            </a>
          </div>
        </div>

        {/* Repeat for infinite scroll effect */}
        <div>
          <div className="promotion-banner">
            <a href="https://shopify.pxf.io/0ZeB7N" target="_blank" rel="noopener noreferrer">
              <img className="img-fluid rounded-8" src="/img/offer-shopify.png" alt="Shopify Offer" />
            </a>
          </div>
        </div>

        <div>
          <div className="promotion-banner">
            <a href="https://calendly.com/kevin-copyfy/copyfy-coaching" target="_blank" rel="noopener noreferrer">
              <img className="img-fluid rounded-8" src="/img/offer-shopify-2.png" alt="Coaching" />
            </a>
          </div>
        </div>

        <div>
          <div className="promotion-banner">
            <a href="https://getstartedtiktok.pxf.io/c/5574341/2899724/16372" target="_blank" rel="noopener noreferrer">
              <img className="img-fluid rounded-8" src="/img/offer-shopify-8.png" alt="TikTok Offer" />
            </a>
          </div>
        </div>
      </Slider>
    </div>
  );
}

