import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'
import {
  applyContentToSettings,
  applyContentToBlocks,
  distributeImagesToSections,
  migrateAiContent,
  normalizeSectionType
} from '@/lib/services/contentMapping'

const LIQUID_SERVICE_URL = process.env.LIQUID_SERVICE_URL || 'https://web-production-86921.up.railway.app/'
const THEMES_BASE_PATH = process.env.THEMES_PATH || path.join(process.cwd(), 'themes')
// Path to themes on the Liquid service server (Railway)
const LIQUID_SERVICE_THEMES_PATH = process.env.LIQUID_SERVICE_THEMES_PATH || '/app/themes'

/**
 * Load theme settings from settings_data.json
 */
function loadThemeSettings(themeKey: string): Record<string, unknown> {
  const settingsPath = path.join(THEMES_BASE_PATH, themeKey, 'config', 'settings_data.json')
  
    try {
    if (fs.existsSync(settingsPath)) {
      const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
      return settingsData.current || {}
    }
  } catch (error) {
    console.error('Error loading theme settings:', error)
  }
  
  return {}
}

/**
 * Convert hex color to RGB string (without spaces, comma separated)
 */
function hexToRgbString(hex: string): string {
  if (hex.startsWith('#')) {
    const hexValue = hex.slice(1)
    const r = parseInt(hexValue.substring(0, 2), 16)
    const g = parseInt(hexValue.substring(2, 4), 16)
    const b = parseInt(hexValue.substring(4, 6), 16)
    return `${r},${g},${b}`
  }
  return '0,0,0'
}

/**
 * Lighten a hex color by a factor (0-1)
 * Matches Laravel's lighten_color function
 */
function lightenColor(hex: string, factor: number): string {
  if (!hex.startsWith('#')) return '247,243,237'
  const hexValue = hex.slice(1)
  const r = parseInt(hexValue.substring(0, 2), 16)
  const g = parseInt(hexValue.substring(2, 4), 16)
  const b = parseInt(hexValue.substring(4, 6), 16)
  
  // Lighten by mixing with white
  const newR = Math.round(r + (255 - r) * factor)
  const newG = Math.round(g + (255 - g) * factor)
  const newB = Math.round(b + (255 - b) * factor)
  
  return `${newR},${newG},${newB}`
}

/**
 * Generate CSS variables matching Laravel's generateCssVariables()
 * These override theme defaults with AI-selected colors
 */
function generateCssVariables(aiContent: Record<string, unknown>): string {
  // Colors from aiContent - use Laravel defaults for consistency
  const primaryHex = (aiContent.primary_color_picker as string) || '#6f6254'
  const tertiaryHex = (aiContent.tertiary_color_picker as string) || '#e6e1dc'
  const primaryRgb = (aiContent.primary_rgbcolor_picker as string) || hexToRgbString(primaryHex)
  const tertiaryRgb = (aiContent.tertiary_rgbcolor_picker as string) || hexToRgbString(tertiaryHex)

  // Font from aiContent
  const fontFamily = (aiContent.font_family_input as string) || (aiContent.font_family as string) || 'Inter'
  
  // Calculate innerHighlight as a lightened version of primary color (85% lightened)
  const innerHighlightRgb = lightenColor(primaryHex, 0.85)
  // Dark scheme uses 30% lightened primary
  const darkInnerHighlightRgb = lightenColor(primaryHex, 0.3)

  return `
:root,
.color-scheme-1 {
    --color-background: 255,255,255;
    --gradient-background: #ffffff;
    --color-foreground: 18,18,18;
    --color-primary: ${primaryRgb};
    --color-sale-badge: ${primaryRgb};
    --color-innerHighlight: ${innerHighlightRgb};
    --color-highliter: ${primaryHex};
    --color-background-contrast: 191,191,191;
    --color-shadow: 204,77,15;
    --color-button: ${primaryRgb};
    --color-button-text: 255,255,255;
    --color-secondary-button: 255,255,255;
    --color-secondary-button-text: ${primaryRgb};
    --color-link: ${primaryRgb};
    --color-badge-foreground: 18,18,18;
    --color-badge-background: 255,255,255;
    --color-badge-border: 18,18,18;
    --payment-terms-background-color: rgb(255 255 255);
}
.color-scheme-2 {
    --color-background: ${primaryRgb};
    --gradient-background: ${primaryHex};
    --color-foreground: 255,255,255;
    --color-primary: 154,78,52;
    --color-sale-badge: 154,78,52;
    --color-innerHighlight: 204,77,15;
    --color-highliter: #cc4d0f;
    --color-background-contrast: 59,30,20;
    --color-shadow: 12,48,48;
    --color-button: 247,243,237;
    --color-button-text: 12,48,48;
    --color-secondary-button: ${primaryRgb};
    --color-secondary-button-text: 12,48,48;
    --color-link: 12,48,48;
    --color-badge-foreground: 255,255,255;
    --color-badge-background: 154,78,52;
    --color-badge-border: 255,255,255;
    --payment-terms-background-color: rgb(${primaryRgb});
}
.color-scheme-3 {
    --color-background: ${tertiaryRgb};
    --gradient-background: ${tertiaryHex};
    --color-foreground: 12,48,48;
    --color-primary: ${primaryRgb};
    --color-sale-badge: 167,22,22;
    --color-innerHighlight: 204,77,15;
    --color-highliter: #ffffff;
    --color-background-contrast: 195,153,123;
    --color-shadow: 18,18,18;
    --color-button: ${primaryRgb};
    --color-button-text: 255,255,255;
    --color-secondary-button: ${tertiaryRgb};
    --color-secondary-button-text: 12,48,48;
    --color-link: 12,48,48;
    --color-badge-foreground: 12,48,48;
    --color-badge-background: ${tertiaryRgb};
    --color-badge-border: 12,48,48;
    --payment-terms-background-color: rgb(${tertiaryRgb});
}
/* scheme-4: Dark scheme - apply primary to interactive elements */
.color-scheme-4 {
    --color-background: 18,18,18;
    --gradient-background: #121212;
    --color-foreground: 255,255,255;
    --color-primary: ${primaryRgb};
    --color-sale-badge: ${primaryRgb};
    --color-innerHighlight: ${darkInnerHighlightRgb};
    --color-highliter: ${primaryHex};
    --color-background-contrast: 51,51,51;
    --color-shadow: 18,18,18;
    --color-button: ${primaryRgb};
    --color-button-text: 255,255,255;
    --color-secondary-button: 18,18,18;
    --color-secondary-button-text: ${primaryRgb};
    --color-link: ${primaryRgb};
    --color-badge-foreground: 255,255,255;
    --color-badge-background: 18,18,18;
    --color-badge-border: 255,255,255;
    --payment-terms-background-color: rgb(18,18,18);
}
/* scheme-5: Accent/announcement bar scheme - use tertiary as background */
.color-scheme-5 {
    --color-background: ${tertiaryRgb};
    --gradient-background: ${tertiaryHex};
    --color-foreground: 12,48,48;
    --color-primary: ${primaryRgb};
    --color-sale-badge: ${primaryRgb};
    --color-innerHighlight: ${tertiaryRgb};
    --color-highliter: ${primaryHex};
    --color-background-contrast: 195,153,123;
    --color-shadow: 18,18,18;
    --color-button: ${primaryRgb};
    --color-button-text: 255,255,255;
    --color-secondary-button: ${tertiaryRgb};
    --color-secondary-button-text: ${primaryRgb};
    --color-link: ${primaryRgb};
    --color-badge-foreground: 12,48,48;
    --color-badge-background: ${tertiaryRgb};
    --color-badge-border: 12,48,48;
    --payment-terms-background-color: rgb(${tertiaryRgb});
}
body, .color-scheme-1, .color-scheme-2, .color-scheme-3, .color-scheme-4, .color-scheme-5 {
    color: rgba(var(--color-foreground));
    background-color: rgb(var(--color-background));
}
:root {
    --font-body-family: '${fontFamily}', sans-serif;
    --font-heading-family: '${fontFamily}', sans-serif;
    --font-body-style: normal;
    --font-body-weight: 400;
    --font-body-weight-bold: 700;
    --font-heading-style: normal;
    --font-heading-weight: 400;
    --font-body-scale: 1.0;
    --font-heading-scale: 1.3;
    --font-body-letter-spacing: -0.8;
    --font-heading-letter-spacing: -2.5;
    --media-padding: px;
    --media-border-opacity: 0.05;
    --media-border-width: 1px;
    --media-radius: 0px;
    --media-shadow-opacity: 0.0;
    --media-shadow-horizontal-offset: 0px;
    --media-shadow-vertical-offset: 4px;
    --media-shadow-blur-radius: 5px;
    --media-shadow-visible: 0;
    --page-width: 120rem;
    --page-width-margin: 0rem;
    --product-card-image-padding: 0.0rem;
    --product-card-corner-radius: 0.0rem;
    --product-card-text-alignment: left;
    --product-card-border-width: 0.0rem;
    --product-card-border-opacity: 0.1;
    --product-card-shadow-opacity: 0.0;
    --product-card-shadow-visible: 0;
    --product-card-shadow-horizontal-offset: 0.0rem;
    --product-card-shadow-vertical-offset: 0.4rem;
    --product-card-shadow-blur-radius: 0.5rem;
    --collection-card-image-padding: 0.0rem;
    --collection-card-corner-radius: 0.0rem;
    --collection-card-text-alignment: left;
    --collection-card-border-width: 0.0rem;
    --collection-card-border-opacity: 0.1;
    --collection-card-shadow-opacity: 0.0;
    --collection-card-shadow-visible: 0;
    --collection-card-shadow-horizontal-offset: 0.0rem;
    --collection-card-shadow-vertical-offset: 0.4rem;
    --collection-card-shadow-blur-radius: 0.5rem;
    --blog-card-image-padding: 0.0rem;
    --blog-card-corner-radius: 0.0rem;
    --blog-card-text-alignment: left;
    --blog-card-border-width: 0.0rem;
    --blog-card-border-opacity: 0.1;
    --blog-card-shadow-opacity: 0.0;
    --blog-card-shadow-visible: 0;
    --blog-card-shadow-horizontal-offset: 0.0rem;
    --blog-card-shadow-vertical-offset: 0.4rem;
    --blog-card-shadow-blur-radius: 0.5rem;
    --badge-corner-radius: 4.0rem;
    --popup-border-width: 1px;
    --popup-border-opacity: 0.1;
    --popup-corner-radius: 0px;
    --popup-shadow-opacity: 0.05;
    --popup-shadow-horizontal-offset: 0px;
    --popup-shadow-vertical-offset: 4px;
    --popup-shadow-blur-radius: 5px;
    --drawer-border-width: 1px;
    --drawer-border-opacity: 0.1;
    --drawer-shadow-opacity: 0.0;
    --drawer-shadow-horizontal-offset: 0px;
    --drawer-shadow-vertical-offset: 4px;
    --drawer-shadow-blur-radius: 5px;
    --spacing-sections-desktop: 0px;
    --spacing-sections-mobile: 0px;
    --grid-desktop-vertical-spacing: 8px;
    --grid-desktop-horizontal-spacing: 8px;
    --grid-mobile-vertical-spacing: 4px;
    --grid-mobile-horizontal-spacing: 4px;
    --text-boxes-border-opacity: 0.1;
    --text-boxes-border-width: 0px;
    --text-boxes-radius: 0px;
    --text-boxes-shadow-opacity: 0.0;
    --text-boxes-shadow-visible: 0;
    --text-boxes-shadow-horizontal-offset: 0px;
    --text-boxes-shadow-vertical-offset: 4px;
    --text-boxes-shadow-blur-radius: 5px;
    --buttons-radius: 34px;
    --buttons-radius-outset: 35px;
    --buttons-border-width: 1px;
    --buttons-border-opacity: 1.0;
    --buttons-shadow-opacity: 0.0;
    --buttons-shadow-visible: 0;
    --buttons-shadow-horizontal-offset: 0px;
    --buttons-shadow-vertical-offset: 4px;
    --buttons-shadow-blur-radius: 5px;
    --inputs-radius: 0px;
    --inputs-border-width: 1px;
    --inputs-border-opacity: 0.55;
    --inputs-shadow-opacity: 0.0;
    --inputs-shadow-horizontal-offset: 0px;
    --inputs-margin-offset: 0px;
    --inputs-shadow-vertical-offset: 4px;
    --inputs-shadow-blur-radius: 5px;
    --inputs-radius-outset: 0px;
    --variant-pills-radius: 40px;
    --variant-pills-border-width: 1px;
    --variant-pills-border-opacity: 0.55;
    --variant-pills-shadow-opacity: 0.0;
    --variant-pills-shadow-horizontal-offset: 0px;
    --variant-pills-shadow-vertical-offset: 4px;
    --variant-pills-shadow-blur-radius: 5px;
    --buttons-border-offset: 0.3px;
}
*,
*::before,
*::after {
    box-sizing: inherit;
}
html {
    box-sizing: border-box;
    font-size: calc(var(--font-body-scale) * 62.5%);
    height: 100%;
}
body,
.body,
p,
span,
li,
a,
input,
textarea,
button,
select {
    font-family: var(--font-body-family);
}
h1, h2, h3, h4, h5, h6,
.h1, .h2, .h3, .h4, .h5, .h6,
.heading,
.title {
    font-family: var(--font-heading-family);
}
/* ========================================
   COMPREHENSIVE COLOR OVERRIDES
   Force all elements to use CSS variables
   ======================================== */

/* Buttons - primary action buttons */
.button--primary,
.shopify-payment-button__button,
.product-form__submit,
button.product-form__submit,
.btn--primary,
.btn-primary {
    background-color: rgb(var(--color-button)) !important;
    background: rgb(var(--color-button)) !important;
    color: rgb(var(--color-button-text)) !important;
    border-color: rgb(var(--color-button)) !important;
}

/* Secondary buttons */
.button--secondary,
.btn--secondary,
.btn-secondary {
    background-color: rgb(var(--color-secondary-button)) !important;
    color: rgb(var(--color-secondary-button-text)) !important;
    border-color: rgb(var(--color-secondary-button-text)) !important;
}

/* Icon CONTAINERS - set color for currentColor inheritance */
.pdp_BulletsList_-icon,
.icon-with-text,
.icon-with-text__item,
.icon_text_cls,
.icon_text_cls li,
.icon_text_cls_guarantee,
.icon_text_cls_guarantee li,
.guarantee-badges-container,
.guarantee-item,
.guarantee-custom-icon,
.product_labels_ii,
.product_labels_ii_item,
.product_labels_main,
.svg-wrapper,
.pdp-benefits,
.new-favorite-sec,
.new-favorite-sec__item {
    color: rgb(var(--color-primary)) !important;
}

/* ALL SVG icons - force primary color on fill/stroke */
.pdp_BulletsList_-icon svg,
.pdp_BulletsList_-icon svg path,
.pdp_BulletsList_-icon svg circle,
.pdp_BulletsList_-icon svg rect,
.icon-with-text svg,
.icon-with-text svg path,
.icon-with-text__item svg,
.icon-with-text__item svg path,
.icon_text_cls svg,
.icon_text_cls svg path,
.icon_text_cls_guarantee svg,
.icon_text_cls_guarantee svg path,
.guarantee-badges-container svg,
.guarantee-badges-container svg path,
.guarantee-item svg,
.guarantee-item svg path,
.guarantee-custom-icon svg,
.guarantee-custom-icon svg path,
.product_labels_ii svg,
.product_labels_ii svg path,
.product_labels_main svg,
.product_labels_main svg path,
.svg-wrapper svg:not(.icon-facebook):not(.icon-instagram):not(.icon-youtube):not(.icon-tiktok):not(.icon-twitter):not(.icon-pinterest):not(.icon-snapchat):not(.icon-tumblr):not(.icon-vimeo),
.svg-wrapper svg:not(.icon-facebook):not(.icon-instagram):not(.icon-youtube):not(.icon-tiktok):not(.icon-twitter):not(.icon-pinterest):not(.icon-snapchat):not(.icon-tumblr):not(.icon-vimeo) path,
.pdp-benefits svg,
.pdp-benefits svg path,
.new-favorite-sec svg,
.new-favorite-sec svg path,
.custom-tag svg,
.custom-tag svg path,
svg.icon-check-mark,
svg.icon-check-mark path,
svg.icon-bubble-check,
svg.icon-bubble-check path,
svg.icon-accordion,
svg.icon-accordion path,
svg[class*="icon-"]:not(.icon--full-color),
svg[class*="icon-"]:not(.icon--full-color) path {
    fill: rgb(var(--color-primary)) !important;
    stroke: rgb(var(--color-primary)) !important;
    color: rgb(var(--color-primary)) !important;
}

/* Social icons in footer - always black (higher specificity to override above) */
/* The SVGs use fill="currentColor", so we need to set color on parents */
.list-social,
.list-social__item,
.list-social__link,
.list-social .svg-wrapper,
.footer .list-social,
.footer .list-social__item,
.footer .list-social__link,
.footer-social-bottom,
.footer-social-bottom .list-social {
    color: #000000 !important;
}
.list-social svg,
.list-social svg *,
.list-social svg path,
.list-social svg.icon,
.list-social svg.icon path,
.list-social .svg-wrapper svg,
.list-social .svg-wrapper svg path,
.footer .list-social svg,
.footer .list-social svg *,
.footer-social-bottom svg,
.footer-social-bottom svg * {
    fill: #000000 !important;
    stroke: none !important;
    color: #000000 !important;
}

/* Override hardcoded fill opacity on SVGs */
.pdp_BulletsList_-icon svg path[fill-opacity],
.icon-with-text svg path[fill-opacity],
.icon_text_cls svg path[fill-opacity],
svg path[fill-opacity] {
    fill: rgb(var(--color-primary)) !important;
    fill-opacity: 1 !important;
}

/* Override specific hardcoded hex colors in SVGs */
svg path[fill="#757575"],
svg path[fill="#0C3030"],
svg path[fill="#202329"],
svg path[fill="#121212"] {
    fill: rgb(var(--color-primary)) !important;
}

/* SVG icons that should keep white fill (checkmark inside) */
.pdp_BulletsList_-icon svg path[fill="white"],
.pdp_BulletsList_-icon svg path[fill="#fff"],
.pdp_BulletsList_-icon svg path[fill="#ffffff"],
.icon-bubble-check path[fill="white"],
.icon-bubble-check path[fill="#fff"],
svg path[fill="white"],
svg path[fill="#fff"],
svg path[fill="#ffffff"],
svg path[fill="none"] {
    fill: white !important;
}
/* Keep none fills as none */
svg path[fill="none"] {
    fill: none !important;
}
/* Opacity paths in bubble-check icons */
svg path[opacity],
svg path[opacity=".2"],
.icon-bubble-check path[opacity] {
    fill: rgb(var(--color-primary)) !important;
    opacity: 0.2 !important;
}

/* Product custom tags - background is primary color */
.product-custom-tag,
.custom-tag-badge,
.custom-tag {
    background-color: rgb(var(--color-primary)) !important;
}
.product-custom-tag svg,
.product-custom-tag svg *,
.custom-tag svg,
.custom-tag svg *,
.custom-tag > span:first-child svg,
.custom-tag > span:first-child svg *,
.custom-tag > div:first-child svg,
.custom-tag > div:first-child svg * {
    fill: white !important;
    stroke: white !important;
}
/* Text inside custom tags - always white on primary background */
.product-custom-tag-text,
.custom-tag-text,
.custom-tag p,
.custom-tag span.product-custom-tag-text,
.custom-tag > p.product-custom-tag-text,
span.product-custom-tag-text,
p.product-custom-tag-text {
    color: #fff !important;
}

/* Color schemes - backgrounds */
.color-scheme-2,
.color-scheme-2.gradient,
section.color-scheme-2,
div.color-scheme-2 {
    background-color: rgb(var(--color-background)) !important;
    background: rgb(var(--color-background)) !important;
    color: rgb(var(--color-foreground)) !important;
}
.color-scheme-3,
.color-scheme-3.gradient,
section.color-scheme-3,
div.color-scheme-3 {
    background-color: rgb(var(--color-background)) !important;
    background: rgb(var(--color-background)) !important;
    color: rgb(var(--color-foreground)) !important;
}

/* Announcement bar */
.announcement-bar-section,
.announcement-bar,
.utility-bar {
    background-color: rgb(var(--color-background)) !important;
    color: rgb(var(--color-foreground)) !important;
}

/* Links and highlights */
a:not([class]),
.link,
.underlined-link {
    color: rgb(var(--color-link)) !important;
}

/* Timeline and accent text */
.timeline__ct_content .header-section strong,
.highlight,
[data-highlight],
strong.highlight,
.header-section strong {
    color: var(--color-highliter) !important;
}

/* Sale badges */
.badge--sale,
.shop-save-price,
.price__badge-sale {
    background-color: rgb(var(--color-sale-badge)) !important;
    color: #fff !important;
}

/* Price styling */
.price-item--sale,
.price--on-sale .price-item--regular {
    color: rgb(var(--color-primary)) !important;
}

/* Rating stars */
.sr-stars svg:not(.half_star) path,
.review__componentStarsIcns svg path,
.review__componentStarsIcns_rt svg path {
    fill: rgb(var(--color-primary)) !important;
}
.sr-stars svg.half_star,
.sr-stars svg.half_star path.half_star_path {
    stroke: rgb(var(--color-primary)) !important;
    fill: rgb(var(--color-primary)) !important;
}
.sr-stars svg.empty_star path {
    fill: transparent !important;
    stroke: rgb(var(--color-primary)) !important;
}

/* Comparison table checkmarks */
.comparison-table svg,
.comparison-table svg *,
table svg,
table svg * {
    fill: rgb(var(--color-primary)) !important;
    stroke: rgb(var(--color-primary)) !important;
}

/* FAQ accordion icons */
.accordion svg,
.accordion svg *,
.collapsible-trigger svg,
.collapsible-trigger svg * {
    stroke: rgb(var(--color-foreground)) !important;
}

/* Statistics/clinical results */
.pdp-statistics__number,
.stat-number,
.clinical-result__number {
    color: rgb(var(--color-primary)) !important;
}

/* Marquee/ticker text - should be white on dark backgrounds */
.marquee__content {
    color: rgb(var(--color-foreground)) !important;
}
/* Squeeze scroller (black banner) - text must be white */
.squeeze_scroller_para,
.squeeze_scroller_inner,
.squeeze_scroller_item {
    color: #ffffff !important;
}
.squeeze_scroller_main[style*="background-color: #000"],
.squeeze_scroller_main[style*="background-color:#000"],
.squeeze_scroller_main[style*="background-color: black"] {
    color: #ffffff !important;
}
.squeeze_scroller_main .squeeze_scroller_para {
    color: #ffffff !important;
}

/* Footer social icons - must be black (currentColor inheritance) */
.footer .svg-wrapper,
.footer .list-social__link,
.footer__list-social,
.footer-social-bottom {
    color: #000000 !important;
}
.footer .svg-wrapper svg,
.footer .svg-wrapper svg *,
.footer .svg-wrapper svg path,
.list-social svg.icon,
.list-social svg.icon path,
.footer__list-social svg,
.footer__list-social svg * {
    fill: #000000 !important;
    stroke: none !important;
    color: #000000 !important;
}

/* ========================================
   SECTION-SPECIFIC OVERRIDES
   ======================================== */

/* Footer section - uses innerHighlight (lightened primary) for background */
.footer,
.footer.gradient,
.footer.color-scheme-1,
.footer.color-scheme-2,
.footer.color-scheme-3,
.footer.color-scheme-4,
.footer.color-scheme-5,
section.footer {
    background-color: rgb(var(--color-innerHighlight)) !important;
    background: rgb(var(--color-innerHighlight)) !important;
    color: rgb(var(--color-foreground)) !important;
}
.footer .footer__content-bottom {
    background: rgb(var(--color-innerHighlight)) !important;
}

/* Image with text sections */
.image_with_text__wrapper,
.image_with_text__wrapper.gradient,
.image_with_text__wrapper.not_faq_mgtxt,
.image_with_text__wrapper.with_faq_mgtxt,
.shopall-img_with_txt,
[class*="shopall-"] {
    background-color: rgb(var(--color-innerHighlight)) !important;
    background: rgb(var(--color-innerHighlight)) !important;
}

/* Footer background */
footer.footer,
footer.footer.gradient,
.footer.gradient,
.footer[class*="color-scheme-"] {
    background-color: rgb(var(--color-innerHighlight)) !important;
    background: rgb(var(--color-innerHighlight)) !important;
}

/* Scrolling card / marquee sections */
.scrolling__card_marquee,
.scrolling__card_marquee.gradient,
.scrolling__card_container,
.scrolling__card_main,
.scrolling__card_content {
    background-color: rgb(var(--color-background)) !important;
}
.scrolling__card_item,
.scrolling__card_interior {
    background-color: rgb(var(--color-innerHighlight)) !important;
    background: rgb(var(--color-innerHighlight)) !important;
}
.scrolling__card_heading,
.scrolling__heading {
    color: rgb(var(--color-primary)) !important;
}

/* All gradient sections should use background variables - EXCEPT sections with custom backgrounds */
.gradient:not(.image_with_text__wrapper):not(.img-with-txt):not([class*="shopall-"]):not(.footer),
section.gradient:not(.image_with_text__wrapper):not(.img-with-txt):not(.footer),
div.gradient:not(.image_with_text__wrapper):not(.img-with-txt):not(.footer),
[class*="-padding"].gradient:not(.image_with_text__wrapper):not(.footer) {
    background: rgb(var(--color-background)) !important;
    background: var(--gradient-background) !important;
}

/* Color scheme specific gradient backgrounds - EXCEPT sections with custom backgrounds */
.color-scheme-1.gradient:not(.image_with_text__wrapper):not([class*="shopall-"]):not(.footer) { background: var(--gradient-background) !important; }
.color-scheme-2.gradient:not(.image_with_text__wrapper):not([class*="shopall-"]):not(.footer) { background: var(--gradient-background) !important; }
.color-scheme-3.gradient:not(.image_with_text__wrapper):not([class*="shopall-"]):not(.footer) { background: var(--gradient-background) !important; }
.color-scheme-4.gradient:not(.image_with_text__wrapper):not([class*="shopall-"]):not(.footer) { background: var(--gradient-background) !important; }
.color-scheme-5.gradient:not(.image_with_text__wrapper):not([class*="shopall-"]):not(.footer) { background: var(--gradient-background) !important; }

/* Section padding containers - EXCEPT footer */
[class*="section-"][class*="-padding"]:not(.footer),
[class*="section-"][class*="-padding"].gradient:not(.footer) {
    background-color: rgb(var(--color-background)) !important;
}

/* Timeline points */
.timeline__main__wrapper,
.timeline__main__wrapper.gradient,
.timline-[class*="section"] {
    background-color: rgb(var(--color-background)) !important;
    color: rgb(var(--color-foreground)) !important;
}

/* PDP sections */
.pdp-benefits_mainwrapper,
.pdp-statistics__column_mainwrapper {
    background-color: rgb(var(--color-background)) !important;
    color: rgb(var(--color-foreground)) !important;
}
/* Comparison table - uses innerHighlight for grayish/cream background */
.pdp_comparison_table_mainwrapper {
    background-color: rgb(var(--color-innerHighlight)) !important;
    color: rgb(var(--color-foreground)) !important;
}

/* Text and image sections */
.text-and-image,
.image-with-text,
.image-with-text__content,
.image-with-text__media {
    background-color: rgb(var(--color-background)) !important;
}

/* Video section */
.video-section,
.video-section__media {
    background-color: rgb(var(--color-background)) !important;
}

/* Related products */
.related-products {
    background-color: rgb(var(--color-background)) !important;
}

/* Slideshow section */
.slideshow,
.slideshow__text,
.banner__box {
    background-color: rgb(var(--color-background)) !important;
}

/* All sections with color-scheme should inherit properly */
[class*="color-scheme-"] {
    color: rgb(var(--color-foreground)) !important;
}

/* Header cart icon */
.header__icon svg,
.header__icon svg * {
    stroke: rgb(var(--color-foreground)) !important;
}

/* Ensure innerHighlight stays correct for bullet backgrounds */
.pdp_BulletsList_-item {
    background-color: rgb(var(--color-innerHighlight)) !important;
}

/* Quantity break / bundle boxes */
.quantity-break-option,
.qty-bk-wp .quantity-break-option {
    background-color: rgb(var(--color-innerHighlight)) !important;
    border-color: rgb(var(--color-button)) !important;
}
.quantity-break-save-badge {
    background-color: rgb(var(--color-sale-badge)) !important;
    color: rgb(var(--color-innerHighlight)) !important;
}

/* Product labels */
.product-label,
.productLabels__item {
    background-color: rgb(var(--color-innerHighlight)) !important;
}
.product-label-icon svg path,
.productLabels__item svg path {
    fill: rgb(var(--color-foreground)) !important;
}

/* Selling fast bar */
.selling-out-fast-icon svg,
.selling-out-fast-icon svg path {
    fill: rgb(var(--color-foreground)) !important;
}

/* Trustpilot widget satisfaction */
.review__componentSatisfaction {
    background-color: rgb(var(--color-innerHighlight)) !important;
}

/* Premium kit */
.premiumAttachment__wp {
    background-color: rgb(var(--color-innerHighlight)) !important;
}

/* Shipping info */
.free-shipping-notice-inner {
    background-color: var(--color-highliter) !important;
}

/* Upsell buttons */
.upsellProducts__grid__button {
    background-color: rgb(var(--color-button)) !important;
    color: rgb(var(--color-button-text)) !important;
}

/* Variant selector pills */
.product-form__input--pill input[type=radio]+label {
    color: rgb(var(--color-primary)) !important;
    background-color: rgb(var(--color-button-text)) !important;
}
.product-form__input--pill input[type=radio]:checked+label {
    color: rgb(var(--color-button-text)) !important;
    background-color: rgb(var(--color-button)) !important;
}

/* Price on sale */
.shop-product-price-block.on-sale,
.discounted__price {
    color: var(--color-highliter) !important;
}

/* Payment icons - DO NOT override - these have inline colors that must be preserved */
/* The exclusions in the SVG rules above (using :not(.icon--full-color)) handle this */

/* ========================================
   HOME PAGE SPECIFIC OVERRIDES
   ======================================== */

/* Heading highlights - spans inside headings should use primary color */
h1 span,
h2 span,
h3 span,
h4 span,
.h1 span,
.h2 span,
.h3 span,
.rte span,
.rich-text__text span,
.header-section span,
.timeline__ct_content span,
.image-with-text__heading span,
[data-section-type] h2 span,
[data-section-type] h3 span {
    color: var(--color-highliter) !important;
}

/* Strong/bold text in headings - use primary */
h2 strong,
h3 strong,
.h2 strong,
.h3 strong,
.header-section strong,
.rte strong,
.rich-text__text strong {
    color: var(--color-highliter) !important;
}

/* Image with text section - text colors */
.image-with-text__text-item,
.image-with-text__text,
.image-with-text__content p,
.image-with-text__heading {
    color: rgb(var(--color-foreground)) !important;
}

/* Featured product section */
.featured-product,
.featured-product__content,
.featured-product__info {
    background-color: rgb(var(--color-background)) !important;
    color: rgb(var(--color-foreground)) !important;
}

/* Video grid slider */
.video-gris-slider,
.video-gris-slider__content,
.video_grid_item {
    background-color: rgb(var(--color-background)) !important;
}

/* Rich text section */
.rich-text,
.rich-text__blocks,
.rich-text__text {
    color: rgb(var(--color-foreground)) !important;
}

/* Newsletter section */
.newsletter,
.newsletter-section,
.custom-newsletter,
.email-signup-section {
    background-color: rgb(var(--color-innerHighlight)) !important;
    color: rgb(var(--color-foreground)) !important;
}
.newsletter .button,
.newsletter-section .button,
.custom-newsletter .button {
    background-color: rgb(var(--color-button)) !important;
    color: rgb(var(--color-button-text)) !important;
}

/* Header with marquee */
.header-with-marquee,
.marquee-header,
.header_with_marquee__mainWrapper {
    background-color: rgb(var(--color-background)) !important;
}
.header-with-marquee__heading,
.header_with_marquee_heading {
    color: rgb(var(--color-foreground)) !important;
}

/* Comparison table - "Why Choose Us" heading highlight */
/* Only target <hig> tag, not span/strong - span and strong should inherit text color */
.pdp_comparison_table_heading hig,
.comparison-table__heading hig {
    color: var(--color-highliter) !important;
}

/* Override theme's hardcoded gradient color on highlighted text to use theme primary */
.hgt___tag_heading,
.pdp_comparison_table_heading .hgt___tag_heading,
.pdp-benefits_header_heading .hgt___tag_heading,
.pdp-statistics__column_heading .hgt___tag_heading,
h2 .hgt___tag_heading,
h1 .hgt___tag_heading {
    background: none !important;
    -webkit-background-clip: unset !important;
    background-clip: unset !important;
    -webkit-text-fill-color: var(--color-highliter) !important;
    color: var(--color-highliter) !important;
}

/* Comparison table - our product column highlight */
.comparison-table__highlighted,
.comparison-table th.highlighted,
.comparison-table td.highlighted {
    background-color: rgb(var(--color-innerHighlight)) !important;
}

/* Comparison table - Original badge */
.comparison-table .icon-check-badge,
.comparison-table .original-badge {
    background-color: rgb(var(--color-primary)) !important;
    color: white !important;
}

/* Statistics section */
.pdp-statistics,
.pdp-statistics__column,
.pdp_statistics__column_mainwrapper {
    background-color: rgb(var(--color-background)) !important;
}
.pdp-statistics__heading span,
.pdp-statistics__card__title {
    color: var(--color-highliter) !important;
}

/* FAQ section */
.faq-section,
.faq__main_wrapper,
.content_faq {
    background-color: rgb(var(--color-background)) !important;
}
.faq__heading,
.faq-title {
    color: rgb(var(--color-foreground)) !important;
}
.accordion-item,
.faq-item,
.collapsible-content {
    border-color: rgb(var(--color-background-contrast)) !important;
}

/* Image FAQ section */
.image-faq,
.image_faq_mainwrapper,
.image_faq__wrapper {
    background-color: rgb(var(--color-innerHighlight)) !important;
}
.image_faq_heading span {
    color: var(--color-highliter) !important;
}

/* Marquee / scrolling text */
.marquee-section,
.marquee__wrapper {
    background-color: rgb(18,18,18) !important;
    color: white !important;
}

/* Benefits section */
.pdp-benefits,
.pdp_benefits_mainwrapper,
.pdp-benefits_content {
    background-color: rgb(var(--color-background)) !important;
}
.pdp-benefits__heading span,
.pdp_benefits_heading span {
    color: var(--color-highliter) !important;
}
.pdp-benefits_content_item,
.pdp-benefits li {
    color: rgb(var(--color-foreground)) !important;
}

/* Timeline section */
.timeline-points,
.timeline__ct_content,
.timeline__main__wrapper {
    background-color: rgb(var(--color-background)) !important;
}
.timeline__ct_content strong,
.timeline__heading strong {
    color: var(--color-highliter) !important;
}
.timeline__point,
.timeline-dot {
    background-color: rgb(var(--color-primary)) !important;
}

/* Slideshow / hero banner */
.slideshow-section,
.banner,
.hero {
    background-color: rgb(var(--color-background)) !important;
}

/* Text with image sections (img-with-txt) - must override color-scheme gradient */
.img-with-txt,
.img-with-txt.gradient,
.img-with-txt.color-scheme-1,
.img-with-txt.color-scheme-1.gradient,
section.img-with-txt,
section.img-with-txt.gradient,
.img_with_txt_mainwrapper,
.img_with_txt_mainwrapper.gradient,
.shopall-img_with_txt,
.shopall-img_with_txt.gradient,
[class*="img-with-txt"][class*="gradient"],
[class*="img-with-txt"][class*="color-scheme"] {
    background-color: rgb(var(--color-innerHighlight)) !important;
    background: rgb(var(--color-innerHighlight)) !important;
}
.img-with-txt h2 span,
.img-with-txt .title span,
.shopall-img_with_txt h2 span {
    color: var(--color-highliter) !important;
}

/* Guarantee icons section */
.icon_text_cls,
.icon_text_cls_guarantee,
.guarantee-badges {
    background-color: transparent !important;
}
.icon_text_cls li,
.icon_text_cls_guarantee li,
.guarantee-item {
    color: rgb(var(--color-foreground)) !important;
}

/* ========================================
   SOCIAL ICONS - MUST BE BLACK (FINAL OVERRIDE)
   ======================================== */
/* These rules MUST come last to override all other icon rules */
ul.list-social,
ul.list-social li,
ul.list-social a,
ul.list-social .svg-wrapper,
.footer ul.list-social,
.footer-social-bottom,
.footer-social-bottom ul.list-social {
    color: #000000 !important;
}
ul.list-social svg.icon,
ul.list-social svg.icon path,
ul.list-social .svg-wrapper svg,
ul.list-social .svg-wrapper svg path,
.footer ul.list-social svg,
.footer ul.list-social svg path,
.footer-social-bottom svg,
.footer-social-bottom svg path,
svg.icon-facebook, svg.icon-facebook path,
svg.icon-instagram, svg.icon-instagram path,
svg.icon-youtube, svg.icon-youtube path,
svg.icon-tiktok, svg.icon-tiktok path,
svg.icon-twitter, svg.icon-twitter path,
svg.icon-pinterest, svg.icon-pinterest path,
svg.icon-snapchat, svg.icon-snapchat path,
svg.icon-tumblr, svg.icon-tumblr path,
svg.icon-vimeo, svg.icon-vimeo path {
    fill: #000000 !important;
    stroke: none !important;
    color: #000000 !important;
}
`
}

/**
 * Load sections from theme template file based on page type
 */
function loadThemeSections(themeKey: string, pageType: string = 'product'): { sections: Record<string, SectionData>, order: string[] } {
  // Map page type to template file - use simple mapping
  // product.json contains pdp-main-product sections which we want
  // index.json contains home page sections
  let templateFile = 'product.json'
  if (pageType === 'home') {
    templateFile = 'index.json'
  }
  // Note: product.custom-product.json uses different section types, so we skip it
  
  const templatePath = path.join(THEMES_BASE_PATH, themeKey, 'templates', templateFile)
  
  try {
    if (fs.existsSync(templatePath)) {
      const templateData = JSON.parse(fs.readFileSync(templatePath, 'utf-8'))
  return {
        sections: templateData.sections || {},
        order: templateData.order || []
      }
    }
  } catch (error) {
    console.error('Error loading theme template:', error, templatePath)
  }
  
  return { sections: {}, order: [] }
}

interface SectionData {
      type: string
      settings?: Record<string, unknown>
  blocks?: Record<string, BlockData>
      block_order?: string[]
  name?: string
      disabled?: boolean
    }

interface BlockData {
  type: string
  settings?: Record<string, unknown>
  disabled?: boolean
}

/**
 * Build global context for Liquid rendering
 */
function buildGlobalContext(
  aiContent: Record<string, unknown>,
  productData: Record<string, unknown>,
  images: string[],
  themeKey: string
) {
  // Use store_name from aiContent (comes from Step 2 "Nom de votre boutique")
  const storeName = (aiContent.store_name as string) || 'YOUR BRAND'
  // Default colors match Laravel and frontend: #6f6254 (brownish) and #e6e1dc (cream)
  const primaryColor = (aiContent.primary_color_picker as string) || '#6f6254'
  const tertiaryColor = (aiContent.tertiary_color_picker as string) || '#e6e1dc'
  const fontFamily = (aiContent.font_family as string) || (aiContent.font_family_input as string) || 'Inter'
  
  // Use aiContent.title (from "Informations sur le produit") as primary source for product title
  const productTitle = (aiContent.title as string) || (productData.title as string) || (aiContent.product_title as string) || 'Product'
  const productDescription = (aiContent.product_description as string) || (productData.description as string) || ''
  // Price priority: aiContent.price (edited) > productData.price (original)
  const price = parseFloat(String(aiContent.price || productData.price || '29.99'))
  // Compare price: check all possible field names (compareAtPrice, compare_at_price, compare_price)
  const comparePrice = parseFloat(String(
    aiContent.compareAtPrice || 
    aiContent.compare_at_price || 
    aiContent.compare_price || 
    productData.compare_at_price || 
    price * 2.5
  ))
  
  const featuredImage = images[0] || 'https://placehold.co/600x600/png?text=Product'

  // Load theme settings from settings_data.json
  const themeSettings = loadThemeSettings(themeKey)

  // Build product images array
  const productImages = images.map((src, index) => ({
    src,
    alt: `${productTitle} - Image ${index + 1}`,
    width: 800,
    height: 800,
    aspect_ratio: 1.0
  }))

  // Build product variants
  const variants = [{
    id: 1,
    title: 'Default',
    price: price * 100,
    compare_at_price: comparePrice * 100,
    available: true,
    option1: 'Default',
    option2: null,
    option3: null,
    featured_image: { src: featuredImage },
    inventory_quantity: 100
  }]

  // Build font objects (required by theme.liquid)
  const titleFont = fontFamily
  const contentFont = fontFamily

  const typeHeaderFont = {
    family: titleFont,
    fallback_families: 'sans-serif',
    style: 'normal',
    weight: 400,
    system: false
  }

  const typeBodyFont = {
    family: contentFont,
    fallback_families: 'sans-serif',
    style: 'normal',
    weight: 400,
    system: false
  }

  // Merge theme settings with our custom settings
  const mergedSettings = {
    ...themeSettings,
    // Font settings
    title_custom_fonts: titleFont,
    content_custom_fonts: contentFont,
    type_header_font: typeHeaderFont,
    type_body_font: typeBodyFont,
    // Scale settings
    body_scale: (themeSettings.body_scale as number) || 100,
    heading_scale: (themeSettings.heading_scale as number) || 130,
    body_letter_spacing: (themeSettings.body_letter_spacing as number) || 0,
    heading_letter_spacing: (themeSettings.heading_letter_spacing as number) || 0,
    // Direct color settings (used by Laravel to apply AI colors)
    colors_accent_1: primaryColor,
    colors_accent_2: tertiaryColor,
    // NOTE: Don't pass color_schemes here - let the Ruby liquid service 
    // build them from settings_data.json and apply aiContent colors dynamically
    // Layout settings
    page_width: (themeSettings.page_width as number) || 1200,
    spacing_sections: (themeSettings.spacing_sections as number) || 0,
    // Ensure all required settings have defaults
    media_padding: (themeSettings.media_padding as number) || 0,
    media_border_opacity: (themeSettings.media_border_opacity as number) || 5,
    media_border_thickness: (themeSettings.media_border_thickness as number) || 1,
    media_radius: (themeSettings.media_radius as number) || 0,
    media_shadow_opacity: (themeSettings.media_shadow_opacity as number) || 0,
    media_shadow_horizontal_offset: (themeSettings.media_shadow_horizontal_offset as number) || 0,
    media_shadow_vertical_offset: (themeSettings.media_shadow_vertical_offset as number) || 4,
    media_shadow_blur: (themeSettings.media_shadow_blur as number) || 5,
    buttons_radius: (themeSettings.buttons_radius as number) || 34,
    buttons_border_width: (themeSettings.buttons_border_thickness as number) || 1,
    buttons_border_opacity: (themeSettings.buttons_border_opacity as number) || 100,
    buttons_shadow_opacity: (themeSettings.buttons_shadow_opacity as number) || 0,
    buttons_shadow_horizontal_offset: (themeSettings.buttons_shadow_horizontal_offset as number) || 0,
    buttons_shadow_vertical_offset: (themeSettings.buttons_shadow_vertical_offset as number) || 4,
    buttons_shadow_blur: (themeSettings.buttons_shadow_blur as number) || 5,
    inputs_radius: (themeSettings.inputs_radius as number) || 0,
    inputs_border_width: (themeSettings.inputs_border_thickness as number) || 1,
    inputs_border_opacity: (themeSettings.inputs_border_opacity as number) || 55,
    inputs_shadow_opacity: (themeSettings.inputs_shadow_opacity as number) || 0,
    inputs_shadow_horizontal_offset: (themeSettings.inputs_shadow_horizontal_offset as number) || 0,
    inputs_shadow_vertical_offset: (themeSettings.inputs_shadow_vertical_offset as number) || 4,
    inputs_shadow_blur: (themeSettings.inputs_shadow_blur as number) || 5,
    variant_pills_radius: (themeSettings.variant_pills_radius as number) || 40,
    variant_pills_border_width: (themeSettings.variant_pills_border_thickness as number) || 1,
    variant_pills_border_opacity: (themeSettings.variant_pills_border_opacity as number) || 55,
    variant_pills_shadow_opacity: (themeSettings.variant_pills_shadow_opacity as number) || 0,
    variant_pills_shadow_horizontal_offset: (themeSettings.variant_pills_shadow_horizontal_offset as number) || 0,
    variant_pills_shadow_vertical_offset: (themeSettings.variant_pills_shadow_vertical_offset as number) || 4,
    variant_pills_shadow_blur: (themeSettings.variant_pills_shadow_blur as number) || 5,
    badge_corner_radius: (themeSettings.badge_corner_radius as number) || 40,
    popup_border_width: (themeSettings.popup_border_thickness as number) || 1,
    popup_border_opacity: (themeSettings.popup_border_opacity as number) || 10,
    popup_corner_radius: (themeSettings.popup_corner_radius as number) || 0,
    popup_shadow_opacity: (themeSettings.popup_shadow_opacity as number) || 5,
    popup_shadow_horizontal_offset: (themeSettings.popup_shadow_horizontal_offset as number) || 0,
    popup_shadow_vertical_offset: (themeSettings.popup_shadow_vertical_offset as number) || 4,
    popup_shadow_blur: (themeSettings.popup_shadow_blur as number) || 5,
    drawer_border_width: (themeSettings.drawer_border_thickness as number) || 1,
    drawer_border_opacity: (themeSettings.drawer_border_opacity as number) || 10,
    drawer_shadow_opacity: (themeSettings.drawer_shadow_opacity as number) || 0,
    drawer_shadow_horizontal_offset: (themeSettings.drawer_shadow_horizontal_offset as number) || 0,
    drawer_shadow_vertical_offset: (themeSettings.drawer_shadow_vertical_offset as number) || 4,
    drawer_shadow_blur: (themeSettings.drawer_shadow_blur as number) || 5,
    // Card settings
    card_image_padding: (themeSettings.card_image_padding as number) || 0,
    card_corner_radius: (themeSettings.card_corner_radius as number) || 0,
    card_text_alignment: (themeSettings.card_text_alignment as string) || 'left',
    card_border_width: (themeSettings.card_border_thickness as number) || 0,
    card_border_opacity: (themeSettings.card_border_opacity as number) || 10,
    card_shadow_opacity: (themeSettings.card_shadow_opacity as number) || 0,
    card_shadow_horizontal_offset: (themeSettings.card_shadow_horizontal_offset as number) || 0,
    card_shadow_vertical_offset: (themeSettings.card_shadow_vertical_offset as number) || 4,
    card_shadow_blur: (themeSettings.card_shadow_blur as number) || 5,
    // Collection card settings
    collection_card_image_padding: (themeSettings.collection_card_image_padding as number) || 0,
    collection_card_corner_radius: (themeSettings.collection_card_corner_radius as number) || 0,
    collection_card_text_alignment: (themeSettings.collection_card_text_alignment as string) || 'left',
    collection_card_border_width: (themeSettings.collection_card_border_thickness as number) || 0,
    collection_card_border_opacity: (themeSettings.collection_card_border_opacity as number) || 10,
    collection_card_shadow_opacity: (themeSettings.collection_card_shadow_opacity as number) || 0,
    collection_card_shadow_horizontal_offset: (themeSettings.collection_card_shadow_horizontal_offset as number) || 0,
    collection_card_shadow_vertical_offset: (themeSettings.collection_card_shadow_vertical_offset as number) || 4,
    collection_card_shadow_blur: (themeSettings.collection_card_shadow_blur as number) || 5,
    // Blog card settings  
    blog_card_image_padding: (themeSettings.blog_card_image_padding as number) || 0,
    blog_card_corner_radius: (themeSettings.blog_card_corner_radius as number) || 0,
    blog_card_text_alignment: (themeSettings.blog_card_text_alignment as string) || 'left',
    blog_card_border_width: (themeSettings.blog_card_border_thickness as number) || 0,
    blog_card_border_opacity: (themeSettings.blog_card_border_opacity as number) || 10,
    blog_card_shadow_opacity: (themeSettings.blog_card_shadow_opacity as number) || 0,
    blog_card_shadow_horizontal_offset: (themeSettings.blog_card_shadow_horizontal_offset as number) || 0,
    blog_card_shadow_vertical_offset: (themeSettings.blog_card_shadow_vertical_offset as number) || 4,
    blog_card_shadow_blur: (themeSettings.blog_card_shadow_blur as number) || 5,
    // Text box settings
    text_boxes_border_width: (themeSettings.text_boxes_border_thickness as number) || 0,
    text_boxes_border_opacity: (themeSettings.text_boxes_border_opacity as number) || 10,
    text_boxes_radius: (themeSettings.text_boxes_radius as number) || 0,
    text_boxes_shadow_opacity: (themeSettings.text_boxes_shadow_opacity as number) || 0,
    text_boxes_shadow_horizontal_offset: (themeSettings.text_boxes_shadow_horizontal_offset as number) || 0,
    text_boxes_shadow_vertical_offset: (themeSettings.text_boxes_shadow_vertical_offset as number) || 4,
    text_boxes_shadow_blur: (themeSettings.text_boxes_shadow_blur as number) || 5,
    // Grid settings
    grid_desktop_horizontal_spacing: (themeSettings.spacing_grid_horizontal as number) || 8,
    grid_desktop_vertical_spacing: (themeSettings.spacing_grid_vertical as number) || 8,
    grid_mobile_horizontal_spacing: ((themeSettings.spacing_grid_horizontal as number) || 8) / 2,
    grid_mobile_vertical_spacing: ((themeSettings.spacing_grid_vertical as number) || 8) / 2,
    spacing_sections_desktop: (themeSettings.spacing_sections as number) || 0,
    spacing_sections_mobile: (themeSettings.spacing_sections as number) || 0,
    // Social links
    social_facebook_link: themeSettings.social_facebook_link || 'https://www.facebook.com',
    social_instagram_link: themeSettings.social_instagram_link || 'https://www.instagram.com',
    social_youtube_link: themeSettings.social_youtube_link || '',
    social_tiktok_link: themeSettings.social_tiktok_link || '',
    social_twitter_link: themeSettings.social_twitter_link || 'https://www.x.com',
    social_snapchat_link: themeSettings.social_snapchat_link || '',
    social_pinterest_link: themeSettings.social_pinterest_link || 'https://www.pinterest.com',
    social_tumblr_link: themeSettings.social_tumblr_link || '',
    social_vimeo_link: themeSettings.social_vimeo_link || '',
    // Animations
    animations_reveal_on_scroll: (themeSettings.animations_reveal_on_scroll as boolean) || false,
    // Logo
    logo: themeSettings.logo || '',
    logo_width: (themeSettings.logo_width as number) || 150,
    favicon: themeSettings.favicon || ''
  }

  return {
    // Shop context
    shop: {
      name: storeName,
      url: 'https://example.myshopify.com',
      domain: 'example.myshopify.com',
      currency: 'EUR',
      money_format: '{{amount}} €',
      money_with_currency_format: '{{amount}} EUR'
    },
    
    // Product context
    product: {
      id: 1,
      title: productTitle,
      description: productDescription,
      handle: productTitle.toLowerCase().replace(/\s+/g, '-'),
      price: price * 100,
      price_min: price * 100,
      price_max: price * 100,
      compare_at_price: comparePrice * 100,
      compare_at_price_min: comparePrice * 100,
      compare_at_price_max: comparePrice * 100,
      available: true,
      type: (productData.category as string) || 'General',
      vendor: storeName,
      featured_image: { src: featuredImage, alt: productTitle, width: 800, height: 800 },
      images: productImages,
      media: productImages.map((img, i) => ({
        id: i + 1,
        media_type: 'image',
        src: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height,
        aspect_ratio: img.aspect_ratio,
        preview_image: { src: img.src, width: img.width, height: img.height }
      })),
      variants,
      options: [{ name: 'Title', position: 1, values: ['Default'] }],
      options_with_values: [{ name: 'Title', position: 1, values: ['Default'] }],
      selected_or_first_available_variant: variants[0],
      first_available_variant: variants[0],
      has_only_default_variant: true,
      tags: [],
      metafields: {}
    },
    
    // Request context
    request: {
      page_type: 'product',
      host: 'example.myshopify.com',
      path: `/products/${productTitle.toLowerCase().replace(/\s+/g, '-')}`,
      locale: { iso_code: 'en', root_url: '/' }
    },
    
    // AI content for dynamic settings
    aicontent: {
      ...aiContent,
      primary_color_picker: primaryColor,
      tertiary_color_picker: tertiaryColor,
      // Add RGB values for CSS compatibility (used by some theme sections)
      // Use format without spaces for CSS variables (matching Laravel)
      primary_rgbcolor_picker: hexToRgbString(primaryColor),
      tertiary_rgbcolor_picker: hexToRgbString(tertiaryColor),
      font_family_input: fontFamily
    },
    
    // Merged settings from theme + AI customizations
    settings: mergedSettings,
    
    // Template - in Shopify, {{ template }} outputs the template name directly
    // We provide both the object (for .name and .suffix) and make the main value the string
    template: 'product',
    
    // Also provide template as object for accessing .name, .suffix, etc.
    template_name: 'product',
    template_suffix: '',
    
    // Menus
    menu_header: {
      handle: 'menu-header',
      links: [
        { title: 'Home', url: '/', active: false },
        { title: 'Shop', url: '/collections/all', active: false },
        { title: 'About', url: '/pages/about', active: false },
        { title: 'Contact', url: '/pages/contact', active: false }
      ]
    },
    
    // Cart
    cart: {
      item_count: 0,
      items: [],
      total_price: 0
    }
  }
}

/**
 * Map frontend section IDs to template section types
 * This matches the SECTION_TYPE_MAP from the frontend exactly
 * 
 * IMPORTANT: Template sections often have random suffixes like 'pdp_benefits_xKfG6U'
 * So we need to match by TYPE, not just ID
 * 
 * NOTE: The theme_v4 template uses:
 * - header-with-marquee: Testimonial cards with names (Elena Marwel, Jackson, etc.)
 * - marquee: Black bar with scrolling text
 * There is NO product-reviews section in theme_v4!
 */
const FRONTEND_TO_TEMPLATE_TYPE_MAP: Record<string, string[]> = {
  // Product Page Sections - each maps to possible template types
  'product-information': ['pdp-main-product', 'featured-product', 'main'],
  'featured-product': ['pdp-main-product', 'featured-product', 'main'],
  'general': ['featured-product'],
  // First "Témoignages" - testimonial cards with reviewer names
  'review': ['header-with-marquee', 'product-reviews', 'reviews'],
  'reviews': ['header-with-marquee', 'product-reviews', 'reviews'],
  'product-reviews': ['header-with-marquee', 'product-reviews'],
  'timeline': ['timeline-points', 'timeline'],
  'what-makes-us-different': ['pdp-benefits', 'benefits'],
  'comparison-table': ['pdp-comparison-table', 'comparison-table'],
  'pdp-comparison-table': ['pdp-comparison-table'],
  'clinical-section': ['pdp-statistics-column', 'statistics'],
  // Second "Témoignages" - black bar marquee
  'testimonials-marquee': ['marquee'],
  'hero': ['img-with-txt', 'image-with-text', 'hero'],
  'faqs': ['faq', 'image-faq'],
  'faq': ['faq', 'image-faq'],
  'image-faq': ['image-faq', 'faq'],
  'product-section': ['product-section-1', 'product-section'],
  // Homepage Sections
  'testimonials': ['header-with-marquee'],
  'header-with-marquee': ['header-with-marquee'],
  'middle-page': ['header-with-marquee'],
  'video-grid': ['video-gris-slider', 'video-grid'],
  'video-gris-slider': ['video-gris-slider'],
  'image-with-text': ['image-with-text'],
  'newsletter': ['custom-newsletter', 'newsletter'],
  // Other Sections
  'images': ['product-images'],
  'announcement-bar': ['announcement-bar'],
  'rich-text': ['rich-text'],
}

/**
 * Prepare sections array for Liquid service
 * Uses ContentMappingService for proper AI content application (matching Laravel)
 * Respects hidden_sections and section_order from aiContent
 */
function prepareSectionsForLiquid(
  templateSections: Record<string, SectionData>,
  order: string[],
  aiContent: Record<string, unknown>,
  productImages: string[]
): Array<{
  id: string
  type: string
  settings: Record<string, unknown>
  blocks: Record<string, unknown>
  block_order: string[]
}> {
  const sections: Array<{
    id: string
    type: string
    settings: Record<string, unknown>
    blocks: Record<string, unknown>
    block_order: string[]
  }> = []
  
  // Header sections first (announcement-bar, header)
  const headerTypes = ['announcement-bar', 'header']
  
  // Get hidden sections from aiContent and map frontend IDs to template section types
  const hiddenFrontendIds = (aiContent.hidden_sections as string[]) || []
  const hiddenTemplateTypes = new Set<string>()
  
  // Convert frontend section IDs to template section types (each frontend ID can map to multiple template types)
  hiddenFrontendIds.forEach(frontendId => {
    const templateTypes = FRONTEND_TO_TEMPLATE_TYPE_MAP[frontendId] || [frontendId]
    templateTypes.forEach(templateType => {
      hiddenTemplateTypes.add(templateType)
    })
  })
  
  // Also add the frontend ID itself in case it matches directly
  hiddenFrontendIds.forEach(id => {
    hiddenTemplateTypes.add(id)
  })
  
  // Get section order from aiContent - this is the order from the frontend sidebar
  const frontendSectionOrder = (aiContent.section_order as string[]) || []
  
  // Build a map from template section type to template section ID
  const templateTypeToId: Record<string, string> = {}
  for (const sectionId of order) {
    const section = templateSections[sectionId]
    if (section) {
      templateTypeToId[section.type] = sectionId
    }
  }
  
  // Convert frontend section order to template section IDs
  // This allows drag & drop reordering to affect the preview
  let effectiveOrder = [...order]
  
  if (frontendSectionOrder.length > 0) {
    // Build ordered list based on frontend order
    const orderedTemplateIds: string[] = []
    const usedIds = new Set<string>()
    
    // First, add sections in the frontend order
    for (const frontendId of frontendSectionOrder) {
      const templateTypes = FRONTEND_TO_TEMPLATE_TYPE_MAP[frontendId] || [frontendId]
      
      // Find matching template section ID
      for (const sectionId of order) {
        if (usedIds.has(sectionId)) continue
        
        const section = templateSections[sectionId]
        if (!section) continue
        
        const sectionType = section.type
        // Check if this template section matches the frontend section
        for (const templateType of templateTypes) {
          const normalizedTemplate = templateType.replace(/-/g, '_').toLowerCase()
          const normalizedSectionType = sectionType.replace(/-/g, '_').toLowerCase()
          
          if (normalizedSectionType === normalizedTemplate ||
              normalizedSectionType.startsWith(normalizedTemplate) ||
              normalizedSectionType.includes(normalizedTemplate)) {
            orderedTemplateIds.push(sectionId)
            usedIds.add(sectionId)
            break
          }
        }
        if (usedIds.has(sectionId)) break
      }
    }
    
    // Add any remaining template sections that weren't in the frontend order
    for (const sectionId of order) {
      if (!usedIds.has(sectionId)) {
        orderedTemplateIds.push(sectionId)
      }
    }
    
    effectiveOrder = orderedTemplateIds
  }
  
  // Migrate AI content to ensure all required fields exist
  const migratedContent = migrateAiContent(aiContent)
  
  // Distribute images to sections smartly
  const productImageObjects = productImages.map(src => ({ src }))
  const distributedImages = distributeImagesToSections(migratedContent, productImageObjects)
  
  // Process each section in order
  for (const sectionId of effectiveOrder) {
    const section = templateSections[sectionId]
    if (!section || section.disabled) continue
    
    const sectionType = section.type
    
    // Skip hidden sections - check both section ID and section type
    // Also check for partial matches (template IDs often have random suffixes like "pdp_benefits_xKfG6U")
    const isHiddenById = hiddenTemplateTypes.has(sectionId)
    const isHiddenByType = hiddenTemplateTypes.has(sectionType)
    
    // Check for partial matches - section type might have random suffix like "pdp_benefits_xKfG6U"
    // We only match if the section type STARTS with the hidden type (not just contains it)
    // This prevents "header-with-marquee" from matching when we're looking for "marquee"
    let isHiddenByPartialMatch = false
    for (const hiddenType of hiddenTemplateTypes) {
      // Normalize both for comparison (replace - with _ for consistency)
      const normalizedHidden = hiddenType.replace(/-/g, '_').toLowerCase()
      const normalizedSectionType = sectionType.replace(/-/g, '_').toLowerCase()
      const normalizedSectionId = sectionId.replace(/-/g, '_').toLowerCase()
      
      // Only match if section type/id STARTS with or EQUALS the hidden type
      // Do NOT use .includes() as it would match "header_with_marquee" for "marquee"
      if (normalizedSectionType === normalizedHidden ||
          normalizedSectionType.startsWith(normalizedHidden + '_') ||
          normalizedSectionId === normalizedHidden ||
          normalizedSectionId.startsWith(normalizedHidden + '_')) {
        isHiddenByPartialMatch = true
        break
      }
    }
    
    if (isHiddenById || isHiddenByType || isHiddenByPartialMatch) {
      continue
    }
    let settings = { ...(section.settings || {}) }
    let blocks = section.blocks ? JSON.parse(JSON.stringify(section.blocks)) : {} as Record<string, BlockData>
    const blockOrder = [...(section.block_order || [])]
    
    // Apply AI content to settings using ContentMappingService
    settings = applyContentToSettings(sectionType, settings, migratedContent, distributedImages)
    
    // Apply AI content to blocks using ContentMappingService
    blocks = applyContentToBlocks(sectionType, blocks, migratedContent, distributedImages)
    
    sections.push({
      id: sectionId,
      type: sectionType,
      settings,
      blocks,
      block_order: blockOrder
    })
  }
  
  // Sort: header sections first
  sections.sort((a, b) => {
    const aIsHeader = headerTypes.includes(a.type)
    const bIsHeader = headerTypes.includes(b.type)
    if (aIsHeader && !bIsHeader) return -1
    if (!aIsHeader && bIsHeader) return 1
    return 0
  })
  
  return sections
}

/**
 * Generate WYSIWYG script for preview iframe
 * Handles scrollToSection, highlightInput, and clearHighlight messages from parent
 */
function generateWysiwygScript(): string {
  return `
<script>
(function() {
  // Prevent scroll from bubbling to parent window
  // Add CSS to ensure iframe scroll doesn't affect parent
  var scrollPreventionStyle = document.createElement('style');
  scrollPreventionStyle.id = 'wysiwyg-scroll-prevention';
  scrollPreventionStyle.textContent = \`
    html, body {
      overflow-x: hidden !important;
    }
    /* Prevent scroll chaining to parent */
    * {
      overscroll-behavior: contain !important;
    }
  \`;
  if (!document.getElementById('wysiwyg-scroll-prevention')) {
    document.head.appendChild(scrollPreventionStyle);
  }
  
  // WYSIWYG Preview Communication - Listen for messages from parent window
  var currentHighlightedElement = null;
  var highlightOverlay = null;
  var highlightStyle = null;
  
  // Section type to CSS selector mapping (matching Laravel exactly)
  var sectionSelectors = {
    // Product Page Sections
    'pdp-main-product': '[data-section-type="pdp-main-product"], [data-section-type="featured-product"], .featured-product, .main_product-custom, section[id*="featured-product"], section[id*="main-product"], section[id="main"], .main-product, .product-info-section',
    'featured-product': '[data-section-type="featured-product"], .featured-product, .main_product-custom, section[id*="featured-product"], section[id*="main-product"], .main-product, .product-info-section',
    'product-section-1': '[data-section-type="product-section-1"], .product-section-1, section[id*="product-section"], section[id*="product_section"]',
    'pdp-benefits': '[data-section-type="pdp-benefits"], .pdp-benefits, .pdp_benefits_mainwrapper, section[id*="pdp_benefits"], section[id*="pdp-benefits"]',
    'pdp-statistics-column': '[data-section-type="pdp-statistics-column"], .pdp-statistics, .pdp_statistics__column_mainwrapper, section[id*="pdp_statistics"], section[id*="clinical"]',
    'image-faq': '[data-section-type="image-faq"], .image-faq, .image_faq_mainwrapper, section[id*="image_faq"], section[id*="image-faq"]',
    'faq': '[data-section-type="faq"], .faq-wp, [class*="faq-wp-faq"], section[id*="faq_"]:not([id*="image_faq"])',
    'pdp-comparison-table': '[data-section-type="pdp-comparison-table"], .pdp-comparison-table, .pdp_comparison_table_mainwrapper, section[id*="comparison"], section[id*="pdp_comparison"]',
    
    // First Témoignages - testimonial cards with reviewer names (header-with-marquee)
    // This is the scrolling__card_marquee with individual reviewer cards like Emma K., Jackson etc.
    'header-with-marquee': '[data-section-type="header-with-marquee"], .header_with_marquee__mainWrapper, .scrolling__card_marquee, section[id*="header_with_marquee"]',
    
    // Second Témoignages - black bar with scrolling text (marquee)
    // This is the squeeze_scroller / black banner section
    // Shopify wraps sections in div#shopify-section-{sectionId}, so we look for that pattern
    'marquee': '[data-section-type="marquee"], .squeeze_scroller_main, .squeeze_scroller_data, [id^="shopify-section-marquee_"], section[id^="marquee_"]',
    
    // Homepage Sections  
    'img-with-txt': '[data-section-type="img-with-txt"], .img-with-txt, .shopall-img_with_txt, section[id*="img-with-txt"], section[id*="img_with_txt"]',
    'timeline-points': '[data-section-type="timeline-points"], .timeline-points, .timeline__main__wrapper, section[id*="timeline"]',
    'video-gris-slider': '[data-section-type="video-gris-slider"], .video-gris-slider, section[id*="video"]',
    'image-with-text': '[data-section-type="image-with-text"], .image-with-text, .image_with_text__wrapper, section[id*="image-with-text"]',
    
    // Other Sections
    'announcement-bar': '[data-section-type="announcement-bar"], .announcement-bar, .utility-bar, section[id*="announcement"]',
    'rich-text': '[data-section-type="rich-text"], .rich-text, section[id*="rich-text"]',
    'custom-newsletter': '[data-section-type="custom-newsletter"], .custom-newsletter, section[id*="newsletter"]',
    'product-images': '.product-gallery, .product-images, .product-media-gallery, .product__media-wrapper'
  };
  
  function findSectionElement(sectionType) {
    // Special handling for header-with-marquee (first Témoignages - testimonial cards with names)
    if (sectionType === 'header-with-marquee') {
      // Try section with id containing "header_with_marquee" first
      var hwmEl = document.querySelector('section[id*="header_with_marquee"]');
      if (hwmEl) {
        console.log('[WYSIWYG] Found header_with_marquee section by id');
        return hwmEl;
      }
      // Try scrolling__card_marquee (testimonial cards container)
      hwmEl = document.querySelector('.scrolling__card_marquee');
      if (hwmEl) {
        console.log('[WYSIWYG] Found scrolling__card_marquee');
        return hwmEl;
      }
      // Try header_with_marquee__mainWrapper
      hwmEl = document.querySelector('.header_with_marquee__mainWrapper');
      if (hwmEl) {
        console.log('[WYSIWYG] Found header_with_marquee__mainWrapper');
        return hwmEl;
      }
    }
    
    // Special handling for marquee (second Témoignages - black bar with scrolling text)
    if (sectionType === 'marquee') {
      // Try Shopify section wrapper with id starting with "shopify-section-marquee_"
      var marqueeWrapper = document.querySelector('[id^="shopify-section-marquee_"]');
      if (marqueeWrapper) {
        console.log('[WYSIWYG] Found marquee Shopify wrapper');
        return marqueeWrapper;
      }
      // Try squeeze_scroller (black bar)
      var squeezeEl = document.querySelector('.squeeze_scroller_main');
      if (squeezeEl) {
        console.log('[WYSIWYG] Found squeeze_scroller_main');
        return squeezeEl;
      }
      squeezeEl = document.querySelector('.squeeze_scroller_data');
      if (squeezeEl) {
        console.log('[WYSIWYG] Found squeeze_scroller_data');
        return squeezeEl;
      }
      // Try any section with marquee in id but NOT header_with_marquee
      var allSections = document.querySelectorAll('[id*="marquee"]');
      for (var i = 0; i < allSections.length; i++) {
        var elId = allSections[i].id || '';
        if (elId.includes('marquee') && !elId.includes('header_with_marquee')) {
          console.log('[WYSIWYG] Found marquee element by id pattern:', elId);
          return allSections[i];
        }
      }
    }
    
    // Special handling for pdp-main-product and featured-product
    if (sectionType === 'pdp-main-product' || sectionType === 'featured-product') {
      var productEl = document.querySelector('.main_product-custom');
      if (productEl) {
        console.log('[WYSIWYG] Found main_product-custom');
        return productEl;
      }
    }
    
    // NOTE: header-with-marquee is now handled at the top with the correct selectors
    // (scrolling__card_marquee = testimonial cards, NOT squeeze_scroller which is the black bar)
    
    // Special handling for FAQ to find store-faq-section
    if (sectionType === 'faq' || sectionType === 'image-faq') {
      // Try store-faq-section first (most specific)
      var faqEl = document.querySelector('.store-faq-section');
      if (faqEl) {
        console.log('[WYSIWYG] Found store-faq-section');
        return faqEl;
      }
      // Try faq-wp-faq_Kgq36b or similar
      faqEl = document.querySelector('[class*="faq-wp-faq"]');
      if (faqEl) {
        console.log('[WYSIWYG] Found faq-wp-faq element');
        return faqEl;
      }
      // Try any element with faq_Kgq in class
      faqEl = document.querySelector('[class*="faq_Kgq"]');
      if (faqEl) {
        console.log('[WYSIWYG] Found faq_Kgq element');
        return faqEl;
      }
      // Try faq-wp
      faqEl = document.querySelector('.faq-wp');
      if (faqEl) {
        console.log('[WYSIWYG] Found faq-wp');
        return faqEl;
      }
    }
    
    // Try specific selector first
    var selectors = sectionSelectors[sectionType];
    if (selectors) {
      var el = document.querySelector(selectors);
      if (el) {
        console.log('[WYSIWYG] Found element by selector:', selectors);
        return el;
      }
    }
    
    // Fallback: find by data-section-type attribute
    var el = document.querySelector('[data-section-type="' + sectionType + '"]');
    if (el) {
      console.log('[WYSIWYG] Found element by data-section-type');
      return el;
    }
    
    // Fallback: find section with ID containing the type
    var sections = document.querySelectorAll('section[id], div[id*="shopify-section"]');
    for (var i = 0; i < sections.length; i++) {
      var id = sections[i].id.toLowerCase();
      var normalizedType = sectionType.toLowerCase().replace(/-/g, '_');
      var normalizedType2 = sectionType.toLowerCase().replace(/_/g, '-');
      if (id.includes(normalizedType) || id.includes(normalizedType2)) {
        console.log('[WYSIWYG] Found element by ID:', id);
        return sections[i];
      }
    }
    
    console.log('[WYSIWYG] Element not found for sectionType:', sectionType);
    return null;
  }
  
  function scrollToSection(sectionType, noHighlight) {
    console.log('[WYSIWYG] Scrolling to section:', sectionType, 'noHighlight:', noHighlight);
    var element = findSectionElement(sectionType);
    if (element) {
      console.log('[WYSIWYG] Found element:', element.id || element.className);
      // Use manual scroll calculation to prevent scroll from affecting parent window
      // This keeps scrolling contained within the iframe
      var rect = element.getBoundingClientRect();
      var currentScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      // Calculate target scroll position to center the element
      var targetScrollY = currentScrollY + rect.top - (viewportHeight / 2) + (rect.height / 2);
      // Scroll smoothly within iframe only
      window.scrollTo({
        top: Math.max(0, targetScrollY),
        behavior: 'smooth'
      });
      // Only highlight if not explicitly disabled (e.g., after edit refresh)
      if (!noHighlight) {
        highlightElement(element);
      }
    } else {
      console.log('[WYSIWYG] Section not found:', sectionType);
    }
  }
  
  function highlightElement(element) {
    // Clear previous highlight
    clearHighlight();
    
    if (!element) return;
    
    currentHighlightedElement = element;
    
    // Add highlight style if not exists
    if (!highlightStyle) {
      highlightStyle = document.createElement('style');
      highlightStyle.id = 'wysiwyg-highlight-style';
      highlightStyle.textContent = \`
        .wysiwyg-highlight-overlay {
          position: fixed !important;
          background-color: rgba(51, 92, 255, 0.15) !important;
          border: 3px solid rgba(51, 92, 255, 0.8) !important;
          border-radius: 8px;
          pointer-events: none;
          z-index: 999999 !important;
          transition: none !important;
          mix-blend-mode: normal !important;
          will-change: transform;
        }
      \`;
      document.head.appendChild(highlightStyle);
    }
    
    // Create overlay element positioned over the section
    highlightOverlay = document.createElement('div');
    highlightOverlay.className = 'wysiwyg-highlight-overlay';
    
    // Function to update position instantly (no transition, direct updates)
    var updatePosition = function() {
      if (!element || !highlightOverlay) return;
      
      var rect = element.getBoundingClientRect();
      
      // Direct position update - no transition, instant
      highlightOverlay.style.top = (rect.top - 6) + 'px';
      highlightOverlay.style.left = (rect.left - 6) + 'px';
      highlightOverlay.style.width = (rect.width + 12) + 'px';
      highlightOverlay.style.height = (rect.height + 12) + 'px';
    };
    
    // Initial setup - append and position immediately
    var rect = element.getBoundingClientRect();
    highlightOverlay.style.top = (rect.top - 6) + 'px';
    highlightOverlay.style.left = (rect.left - 6) + 'px';
    highlightOverlay.style.width = (rect.width + 12) + 'px';
    highlightOverlay.style.height = (rect.height + 12) + 'px';
    highlightOverlay.style.display = 'block';
    highlightOverlay.style.visibility = 'visible';
    highlightOverlay.style.opacity = '1';
    document.body.appendChild(highlightOverlay);
    
    // Use requestAnimationFrame for scroll updates (synchronized with browser paint)
    var rafId = null;
    var scrollHandler = function() {
      if (rafId) return; // Already scheduled
      rafId = requestAnimationFrame(function() {
        updatePosition();
        rafId = null;
      });
    };
    
    // Update on scroll and resize - use capture phase for better performance
    window.addEventListener('scroll', scrollHandler, { capture: true, passive: true });
    window.addEventListener('resize', scrollHandler, { passive: true });
    
    // Store cleanup function
    highlightOverlay._cleanup = function() {
      window.removeEventListener('scroll', scrollHandler, { capture: true });
      window.removeEventListener('resize', scrollHandler);
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
  }
  
  function clearHighlight() {
    if (highlightOverlay) {
      // Clean up event listeners
      if (typeof highlightOverlay._cleanup === 'function') {
        highlightOverlay._cleanup();
      }
      if (highlightOverlay.parentNode) {
        highlightOverlay.parentNode.removeChild(highlightOverlay);
      }
      highlightOverlay = null;
    }
    currentHighlightedElement = null;
  }
  
  // Listen for messages from parent window
  window.addEventListener('message', function(event) {
    var data = event.data;
    
    if (!data || typeof data !== 'object') return;
    
    switch (data.type) {
      case 'scrollToSection':
        if (data.sectionType) {
          // Pass noHighlight flag (true = scroll only, no blue box)
          scrollToSection(data.sectionType, data.noHighlight);
        }
        break;
        
      case 'highlightInput':
        if (data.sectionType) {
          scrollToSection(data.sectionType, false);
        }
        break;
        
      case 'clearHighlight':
        clearHighlight();
        break;
    }
  });
  
  console.log('[WYSIWYG] Preview communication initialized');
})();
</script>
`;
}

/**
 * Rewrite asset URLs in HTML to use our proxy, fix script loading, and inject CSS variables
 */
function rewriteAssetUrls(html: string, aiContent: Record<string, unknown>, baseUrl?: string): string {
  // Rewrite /shopify/ URLs to /api/shopify/
  let result = html.replace(/(['"])\/shopify\//g, '$1/api/shopify/')
  
  // Remove defer from swiper script to ensure it loads before dependent code
  result = result.replace(
    /(<script[^>]*src="[^"]*swiper[^"]*\.js"[^>]*)defer([^>]*>)/gi,
    '$1$2'
  )
  
  // Generate and inject CSS variables for theme colors (matching Laravel's generateCssVariables)
  const cssVariables = generateCssVariables(aiContent)
  const cssInjection = `
<style data-shopify-color-override="">
${cssVariables}
</style>
`
  
  // Add <base> tag for blob URL compatibility if baseUrl is provided
  // This allows relative URLs to resolve correctly when HTML is loaded via blob URL
  if (baseUrl) {
    const baseTag = `<base href="${baseUrl}">`
    if (result.includes('<head>')) {
      result = result.replace('<head>', `<head>\n${baseTag}`)
    } else if (result.includes('<HEAD>')) {
      result = result.replace('<HEAD>', `<HEAD>\n${baseTag}`)
    }
  }
  
  // Inject CSS variables after any existing <style data-shopify> tag, or before </head>
  if (result.includes('</head>')) {
    result = result.replace('</head>', `${cssInjection}</head>`)
  }
  
  // Inject WYSIWYG script for preview communication
  const wysiwygScript = generateWysiwygScript()
  
  // Inject a Swiper polyfill script right after opening <body> tag to handle timing issues
  const swiperPolyfill = `
<script>
  // Ensure Swiper is available globally before any code tries to use it
  if (typeof window !== 'undefined') {
    window.SwiperReadyCallbacks = window.SwiperReadyCallbacks || [];
    window.onSwiperReady = function(callback) {
      if (typeof Swiper !== 'undefined') {
        callback();
      } else {
        window.SwiperReadyCallbacks.push(callback);
      }
    };
    // Check periodically for Swiper
    var swiperCheckInterval = setInterval(function() {
      if (typeof Swiper !== 'undefined') {
        clearInterval(swiperCheckInterval);
        window.SwiperReadyCallbacks.forEach(function(cb) { cb(); });
        window.SwiperReadyCallbacks = [];
      }
    }, 50);
    // Clear after 5 seconds to prevent memory leak
    setTimeout(function() { clearInterval(swiperCheckInterval); }, 5000);
  }
</script>
`
  result = result.replace(/<body([^>]*)>/i, `<body$1>${swiperPolyfill}${wysiwygScript}`)
  
  return result
}

/**
 * Generate fallback HTML when Liquid service fails
 * Uses dynamic colors from aiContent for consistent theming
 */
function generateFallbackHtml(
  productTitle: string,
  productDescription: string,
  price: number,
  images: string[],
  storeName: string,
  aiContent: Record<string, unknown> = {}
): string {
  const featuredImage = images[0] || 'https://placehold.co/600x600/png?text=Product'
  
  // Get colors from aiContent with defaults
  const primaryColor = (aiContent.primary_color_picker as string) || '#6f6254'
  const tertiaryColor = (aiContent.tertiary_color_picker as string) || '#e6e1dc'
  const fontFamily = (aiContent.font_family_input as string) || (aiContent.font_family as string) || 'Inter'
  
  // Calculate a darker version of primary for hover
  const darkenColor = (hex: string): string => {
    const num = parseInt(hex.slice(1), 16)
    const r = Math.max(0, (num >> 16) - 30)
    const g = Math.max(0, ((num >> 8) & 0x00FF) - 30)
    const b = Math.max(0, (num & 0x0000FF) - 30)
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`
  }
  const primaryHover = darkenColor(primaryColor)
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${productTitle} - ${storeName}</title>
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary-color: ${primaryColor};
      --primary-hover: ${primaryHover};
      --tertiary-color: ${tertiaryColor};
      --font-family: '${fontFamily}', -apple-system, sans-serif;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: var(--font-family); background: #fff; color: #121212; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .product-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    @media (max-width: 768px) { .product-grid { grid-template-columns: 1fr; } }
    .gallery { display: flex; flex-direction: column; gap: 10px; }
    .main-image { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 12px; }
    .thumbnails { display: flex; gap: 10px; }
    .thumbnail { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: border-color 0.2s; }
    .thumbnail:hover { border-color: var(--primary-color); }
    .product-info { display: flex; flex-direction: column; gap: 16px; }
    .badges { display: flex; gap: 8px; flex-wrap: wrap; }
    .badge { background: var(--tertiary-color); color: var(--primary-color); padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    h1 { font-size: 28px; font-weight: 700; }
    .description { color: #666; line-height: 1.6; }
    .price-row { display: flex; align-items: center; gap: 12px; }
    .price { font-size: 32px; font-weight: 700; color: #121212; }
    .compare-price { font-size: 20px; color: #999; text-decoration: line-through; }
    .save-badge { background: #22c55e; color: white; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .buy-button { background: var(--primary-color); color: white; border: none; padding: 16px 32px; border-radius: 30px; font-size: 16px; font-weight: 600; cursor: pointer; width: 100%; transition: background 0.2s; }
    .buy-button:hover { background: var(--primary-hover); }
    .guarantees { display: flex; gap: 20px; margin-top: 16px; flex-wrap: wrap; }
    .guarantee { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #666; }
    .guarantee svg { width: 20px; height: 20px; color: var(--primary-color); }
    .announcement-bar { background: var(--tertiary-color); color: var(--primary-color); text-align: center; padding: 10px; font-size: 14px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="announcement-bar">
    ${(aiContent.specialOffer as string) || '🎉 Free Shipping on All Orders!'}
  </div>
  <div class="container">
    <div class="product-grid">
      <div class="gallery">
        <img src="${featuredImage}" alt="${productTitle}" class="main-image" id="mainImage">
        <div class="thumbnails">
          ${images.slice(0, 5).map((img, i) => `
            <img src="${img}" alt="${productTitle} ${i + 1}" class="thumbnail" onclick="document.getElementById('mainImage').src='${img}'">
          `).join('')}
        </div>
      </div>
      <div class="product-info">
        <div class="badges">
          <span class="badge">✓ Free Shipping</span>
          <span class="badge">✓ 30-Day Returns</span>
          <span class="badge">⭐ 4.8/5 Rating</span>
        </div>
        <h1>${productTitle}</h1>
        <p class="description">${productDescription}</p>
        <div class="price-row">
          <span class="price">${price.toFixed(2)} €</span>
          <span class="compare-price">${(price * 1.5).toFixed(2)} €</span>
          <span class="save-badge">Save 33%</span>
        </div>
        <button class="buy-button">Add to Cart</button>
        <div class="guarantees">
          <div class="guarantee">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Secure Checkout</span>
          </div>
          <div class="guarantee">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Quality Guaranteed</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('product_id')
    const themeKey = searchParams.get('theme') || 'theme_v4'
    const pageType = searchParams.get('page_type') || 'product'

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const prisma = getPrisma()
      if (!prisma) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
      }
      
    // Fetch product data
      const product = await prisma.generate_products.findUnique({
        where: { id: parseInt(productId) }
      })
      
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      
    const aiContent = (product.aicontent as Record<string, unknown>) || {}
    
    // Ensure RGB color values are calculated from hex colors (critical for CSS variables)
    if (aiContent.primary_color_picker) {
      aiContent.primary_rgbcolor_picker = hexToRgbString(aiContent.primary_color_picker as string)
    }
    if (aiContent.tertiary_color_picker) {
      aiContent.tertiary_rgbcolor_picker = hexToRgbString(aiContent.tertiary_color_picker as string)
    }
    
    const productData = (product.product_content as Record<string, unknown>) || {}
    // Use selectedMainImages from aiContent if available (includes AI-generated images)
    const selectedMainImages = aiContent.selectedMainImages as string[] | undefined
    const originalImages = (productData.images as string[]) || []
    const images = (selectedMainImages && selectedMainImages.length > 0) ? selectedMainImages : originalImages
    
    // Load theme sections based on page type
    const { sections: templateSections, order } = loadThemeSections(themeKey, pageType)
    // Theme path for Liquid service (Railway path, not local)
    const themePath = `${LIQUID_SERVICE_THEMES_PATH}/${themeKey}`
    
    // Build context and sections
    const context = buildGlobalContext(aiContent, productData, images, themeKey)
    const sections = prepareSectionsForLiquid(templateSections, order, aiContent, images)
    
    // Use store name from aiContent for header/navbar sections ONLY (not header-with-marquee!)
    const headerStoreName = (aiContent.store_name as string) || 'YOUR BRAND'
    
    for (const section of sections) {
      // Set store name ONLY in the actual header/navbar section - NOT header-with-marquee
      // header-with-marquee is a testimonials section that should use persuasiveContent.header
      const sectionType = section.type || ''
      const isActualHeader = (sectionType === 'header' || sectionType === 'navbar') && 
                             !sectionType.includes('marquee')
      if (isActualHeader) {
        if (section.settings) {
          // Set all possible title/heading settings to store name
          section.settings.title = headerStoreName
          section.settings.heading = headerStoreName
          section.settings.text = headerStoreName
          section.settings.link_text = headerStoreName
          section.settings.logo_text = headerStoreName
          section.settings.brand_name = headerStoreName
        }
        // Check ALL blocks in header section, regardless of type
        if (section.blocks) {
          for (const blockId of Object.keys(section.blocks)) {
            const block = section.blocks[blockId] as BlockData
            if (block.settings) {
              // Set all possible title/heading settings in ALL blocks
              block.settings.title = headerStoreName
              block.settings.heading = headerStoreName
              block.settings.text = headerStoreName
              block.settings.link_text = headerStoreName
              block.settings.logo_text = headerStoreName
              block.settings.brand_name = headerStoreName
              block.settings.h1 = headerStoreName
              block.settings.h2 = headerStoreName
            }
          }
        }
      }
      // Force product title in featured-product section
      if (section.type === 'featured-product' || section.type === 'pdp-main-product' || section.type === 'main-product-custom') {
        const productTitle = (aiContent.title as string) || ''
        if (productTitle && section.blocks) {
          for (const blockId of Object.keys(section.blocks)) {
            const block = section.blocks[blockId] as BlockData
            if (block.type === 'title' || block.type === 'product_title' || block.type === 'product-title') {
              if (block.settings) {
                block.settings.title = productTitle
                block.settings.heading = productTitle
                block.settings.text = productTitle
                block.settings.h2 = productTitle
              }
            }
          }
        }
      }
    }

    // Call Liquid service
    try {
      console.log('GET: Calling Liquid service for product:', productId)
      console.log('GET: Theme path:', themePath)
      console.log('GET: Sections count:', sections.length)
      console.log('GET: Section types:', sections.map(s => s.type).join(', '))
      
      const requestBody = {
        theme_path: themePath,
        layout: 'theme',
        sections,
        context
      }
      
      // Retry logic for transient EPIPE errors
      const MAX_RETRIES = 3
      let lastError: Error | null = null
      
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`GET: Liquid service attempt ${attempt}/${MAX_RETRIES}`)
          
          const response = await fetch(`${LIQUID_SERVICE_URL}/render-theme`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          })
          
          console.log('GET: Liquid service response status:', response.status)

          if (response.ok) {
            const result = await response.json()
            console.log('GET: Liquid service result - success:', result.success, 'html length:', result.html?.length || 0)
            
            if (result.success && result.html && result.html.length > 1000) {
              const html = rewriteAssetUrls(result.html, aiContent)
              return new NextResponse(html, {
                headers: { 'Content-Type': 'text/html' }
              })
            } else {
              console.log('GET: HTML too short or missing, response:', JSON.stringify(result).substring(0, 500))
            }
          } else {
            const errorText = await response.text()
            console.log(`GET: Liquid service error response (attempt ${attempt}):`, errorText.substring(0, 300))
            
            // If it's an EPIPE error, retry
            if (errorText.includes('EPIPE') && attempt < MAX_RETRIES) {
              console.log(`GET: EPIPE error detected, retrying in 500ms...`)
              await new Promise(resolve => setTimeout(resolve, 500))
              continue
            }
          }
          // If we got here without returning, break out of retry loop
          break
        } catch (fetchError) {
          lastError = fetchError as Error
          console.error(`GET: Liquid service fetch error (attempt ${attempt}):`, fetchError)
          
          if (attempt < MAX_RETRIES) {
            console.log(`GET: Network error, retrying in 500ms...`)
            await new Promise(resolve => setTimeout(resolve, 500))
            continue
          }
        }
      }
      
      if (lastError) {
        console.error('GET: All retry attempts failed:', lastError)
      }
      
      console.log('GET: Liquid service returned invalid response, using fallback')
  } catch (error) {
      console.error('GET: Liquid service error:', error)
    }
    
    // Fallback HTML - pass aiContent for dynamic colors
    const fallbackHtml = generateFallbackHtml(
      (productData.title as string) || 'Product',
      (aiContent.product_description as string) || '',
      parseFloat(String(productData.price || 29.99)),
      images,
      (aiContent.store_name as string) || 'Store',
      aiContent
    )
    
    return new NextResponse(fallbackHtml, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { aiShopId, editedContent } = body

    if (!aiShopId) {
      return NextResponse.json({ error: 'AI Shop ID required' }, { status: 400 })
    }

      const prisma = getPrisma()
    if (!prisma) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    // Fetch product data
    const product = await prisma.generate_products.findUnique({
      where: { id: parseInt(aiShopId) }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    // Merge edited content with existing AI content
    const existingContent = (product.aicontent as Record<string, unknown>) || {}
    const aiContent = { ...existingContent, ...editedContent }
    
    // Debug: Log image-related fields from editedContent
    console.log('POST: Image fields from editedContent:', {
      timelineImage: editedContent.timelineImage,
      selectedBenefitsImage: editedContent.selectedBenefitsImage,
      selectedClinicalImage: editedContent.selectedClinicalImage,
      selectedHeroImage: editedContent.selectedHeroImage,
      faqImage: editedContent.faqImage,
      productSectionImage: editedContent.productSectionImage,
    })
    
    // Ensure RGB color values are calculated from hex colors (critical for CSS variables)
    if (aiContent.primary_color_picker) {
      aiContent.primary_rgbcolor_picker = hexToRgbString(aiContent.primary_color_picker as string)
    }
    if (aiContent.tertiary_color_picker) {
      aiContent.tertiary_rgbcolor_picker = hexToRgbString(aiContent.tertiary_color_picker as string)
    }
    
    const productData = (product.product_content as Record<string, unknown>) || {}
    // Use selectedMainImages from editedContent if available (includes AI-generated images)
    // Otherwise fallback to original product images
    const selectedMainImages = editedContent.selectedMainImages as string[] | undefined
    const originalImages = (productData.images as string[]) || []
    const images = (selectedMainImages && selectedMainImages.length > 0) ? selectedMainImages : originalImages
    
    console.log('POST: Using images for preview:', {
      hasSelectedMainImages: !!selectedMainImages,
      selectedMainImagesCount: selectedMainImages?.length || 0,
      originalImagesCount: originalImages.length,
      finalImagesCount: images.length,
      firstImage: images[0]?.substring(0, 50) + '...'
    })
    
    // Use theme_key from editedContent or default to theme_v4
    const themeKey = (editedContent.theme_key as string) || 'theme_v4'
    // Use page_type from editedContent (product or home)
    const pageType = (editedContent.page_type as string) || 'product'
    
    // Load theme sections based on page type
    const { sections: templateSections, order } = loadThemeSections(themeKey, pageType)
    // Theme path for Liquid service (Railway path, not local)
    const themePath = `${LIQUID_SERVICE_THEMES_PATH}/${themeKey}`
    
    // Build context and sections
    const context = buildGlobalContext(aiContent, productData, images, themeKey)
    const sections = prepareSectionsForLiquid(templateSections, order, aiContent, images)
    
    // Use store name from aiContent for header/navbar sections ONLY (not header-with-marquee!)
    const headerStoreName = (aiContent.store_name as string) || 'YOUR BRAND'
    
    for (const section of sections) {
      // Set store name ONLY in the actual header/navbar section - NOT header-with-marquee
      // header-with-marquee is a testimonials section that should use persuasiveContent.header
      const sectionType = section.type || ''
      const isActualHeader = (sectionType === 'header' || sectionType === 'navbar') && 
                             !sectionType.includes('marquee')
      if (isActualHeader) {
        if (section.settings) {
          // Set all possible title/heading settings to store name
          section.settings.title = headerStoreName
          section.settings.heading = headerStoreName
          section.settings.text = headerStoreName
          section.settings.link_text = headerStoreName
          section.settings.logo_text = headerStoreName
          section.settings.brand_name = headerStoreName
        }
        // Check ALL blocks in header section, regardless of type
        if (section.blocks) {
          for (const blockId of Object.keys(section.blocks)) {
            const block = section.blocks[blockId] as BlockData
            if (block.settings) {
              // Set all possible title/heading settings in ALL blocks
              block.settings.title = headerStoreName
              block.settings.heading = headerStoreName
              block.settings.text = headerStoreName
              block.settings.link_text = headerStoreName
              block.settings.logo_text = headerStoreName
              block.settings.brand_name = headerStoreName
              block.settings.h1 = headerStoreName
              block.settings.h2 = headerStoreName
            }
          }
        }
      }
      // Force product title in featured-product section
      if (section.type === 'featured-product' || section.type === 'pdp-main-product' || section.type === 'main-product-custom') {
        const productTitle = (aiContent.title as string) || ''
        if (productTitle && section.blocks) {
          for (const blockId of Object.keys(section.blocks)) {
            const block = section.blocks[blockId] as BlockData
            if (block.type === 'title' || block.type === 'product_title' || block.type === 'product-title') {
              if (block.settings) {
                block.settings.title = productTitle
                block.settings.heading = productTitle
                block.settings.text = productTitle
                block.settings.h2 = productTitle
              }
            }
          }
        }
      }
    }

    // Call Liquid service with retry logic for transient EPIPE errors
    const MAX_RETRIES = 3
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`POST: Calling Liquid service for product: ${aiShopId}, attempt ${attempt}/${MAX_RETRIES}, sections count: ${sections.length}`)
        
        const response = await fetch(`${LIQUID_SERVICE_URL}/render-theme`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            theme_path: themePath,
            layout: 'theme',
            sections,
            context
          })
        })
        
        console.log('POST: Liquid service response status:', response.status)

        if (response.ok) {
          const result = await response.json()
          console.log('POST: Liquid service result - success:', result.success, 'html length:', result.html?.length || 0)
          
          if (result.success && result.html && result.html.length > 1000) {
            // Get the origin from the request URL for base tag (needed for blob URL loading)
            const origin = request.nextUrl.origin || 'http://localhost:3000'
            const html = rewriteAssetUrls(result.html, aiContent, origin)
            return new NextResponse(html, {
              headers: { 'Content-Type': 'text/html' }
            })
          }
        } else {
          const errorText = await response.text()
          console.error(`POST: Liquid service error (attempt ${attempt}):`, response.status, errorText.substring(0, 300))
          
          // If it's an EPIPE error, retry
          if (errorText.includes('EPIPE') && attempt < MAX_RETRIES) {
            console.log(`POST: EPIPE error detected, retrying in 500ms...`)
            await new Promise(resolve => setTimeout(resolve, 500))
            continue
          }
        }
        // If we got here without returning, we got a response but it wasn't valid - don't retry
        break
      } catch (error) {
        lastError = error as Error
        console.error(`POST: Liquid service error (attempt ${attempt}):`, error)
        
        // Retry on network errors
        if (attempt < MAX_RETRIES) {
          console.log(`POST: Network error, retrying in 500ms...`)
          await new Promise(resolve => setTimeout(resolve, 500))
          continue
        }
      }
    }
    
    if (lastError) {
      console.error('POST: All retry attempts failed:', lastError)
    }
    
    // Fallback HTML - pass aiContent for dynamic colors
    console.log('POST: Using fallback preview for product:', aiShopId)
    const fallbackHtml = generateFallbackHtml(
      (productData.title as string) || 'Product',
      (aiContent.product_description as string) || '',
      parseFloat(String(productData.price || 29.99)),
      images,
      (aiContent.store_name as string) || 'Store',
      aiContent
    )
    
    return new NextResponse(fallbackHtml, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
