/**
 * Theme Preview Service
 * 
 * Generates a preview of the AI-generated store content
 * Uses a simplified HTML template without full Liquid rendering
 */

interface AIContent {
  title: string;
  description: string;
  price: string;
  compareAtPrice?: string;
  features?: string[];
  benefits?: { title: string; text: string }[];
  faq?: { question: string; answer: string }[];
  testimonials?: { name: string; review: string; rating?: number }[];
  images: string[];
  mainCatchyText?: string;
  subMainCatchyText?: string;
  specialOffer?: string;
  deliveryInformation?: string;
  howItWorks?: string;
  storeName?: string;
}

interface PreviewOptions {
  themeStyle?: 'light' | 'dark';
  primaryColor?: string;
  fontFamily?: string;
}

export class ThemePreviewService {
  private aiContent: AIContent;
  private options: PreviewOptions;

  constructor(aiContent: AIContent, options: PreviewOptions = {}) {
    this.aiContent = aiContent;
    this.options = {
      themeStyle: options.themeStyle || 'light',
      primaryColor: options.primaryColor || '#0066FF',
      fontFamily: options.fontFamily || "'DM Sans', sans-serif",
    };
  }

  /**
   * Generate a full HTML preview page
   */
  generateFullPreview(): string {
    const { themeStyle, primaryColor, fontFamily } = this.options;
    const isDark = themeStyle === 'dark';
    
    const bgColor = isDark ? '#0f0f0f' : '#ffffff';
    const textColor = isDark ? '#ffffff' : '#1a1a1a';
    const mutedColor = isDark ? '#888888' : '#666666';
    const borderColor = isDark ? '#333333' : '#e5e5e5';

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.aiContent.storeName || this.aiContent.title} - Preview</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ${fontFamily};
      background: ${bgColor};
      color: ${textColor};
      line-height: 1.6;
    }
    
    .announcement-bar {
      background: ${primaryColor};
      color: white;
      text-align: center;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 500;
    }
    
    .header {
      padding: 16px 24px;
      border-bottom: 1px solid ${borderColor};
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo {
      font-size: 24px;
      font-weight: 700;
    }
    
    .hero {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      padding: 60px 48px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .hero-content {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .hero-title {
      font-size: 48px;
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 24px;
    }
    
    .hero-subtitle {
      font-size: 18px;
      color: ${mutedColor};
      margin-bottom: 32px;
    }
    
    .price-box {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .price {
      font-size: 32px;
      font-weight: 700;
      color: ${primaryColor};
    }
    
    .compare-price {
      font-size: 20px;
      text-decoration: line-through;
      color: ${mutedColor};
    }
    
    .hero-image {
      border-radius: 16px;
      overflow: hidden;
    }
    
    .hero-image img {
      width: 100%;
      height: auto;
      display: block;
    }
    
    .cta-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: ${primaryColor};
      color: white;
      padding: 16px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 102, 255, 0.3);
    }
    
    .features-bar {
      background: ${isDark ? '#1a1a1a' : '#f5f5f5'};
      padding: 24px 48px;
      overflow: hidden;
    }
    
    .features-scroll {
      display: flex;
      gap: 48px;
      animation: scroll 20s linear infinite;
    }
    
    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      white-space: nowrap;
    }
    
    .feature-icon {
      width: 24px;
      height: 24px;
      background: ${primaryColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
    }
    
    @keyframes scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    
    .section {
      padding: 80px 48px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .section-title {
      font-size: 36px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 48px;
    }
    
    .benefits-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 32px;
    }
    
    .benefit-card {
      background: ${isDark ? '#1a1a1a' : '#f9f9f9'};
      padding: 32px;
      border-radius: 16px;
      text-align: center;
    }
    
    .benefit-icon {
      width: 64px;
      height: 64px;
      background: ${primaryColor}15;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 24px;
    }
    
    .benefit-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    
    .benefit-text {
      color: ${mutedColor};
      font-size: 15px;
    }
    
    .testimonials {
      background: ${isDark ? '#1a1a1a' : '#f5f5f5'};
    }
    
    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }
    
    .testimonial-card {
      background: ${bgColor};
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    
    .testimonial-stars {
      color: #FFB800;
      margin-bottom: 12px;
    }
    
    .testimonial-review {
      font-size: 15px;
      margin-bottom: 16px;
      color: ${textColor};
    }
    
    .testimonial-author {
      font-weight: 600;
    }
    
    .faq-section .section {
      max-width: 800px;
    }
    
    .faq-item {
      border-bottom: 1px solid ${borderColor};
      padding: 24px 0;
    }
    
    .faq-question {
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .faq-answer {
      margin-top: 16px;
      color: ${mutedColor};
      font-size: 15px;
    }
    
    .product-images {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-top: 24px;
    }
    
    .product-images img {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      border-radius: 8px;
    }
    
    .footer {
      background: ${isDark ? '#1a1a1a' : '#f5f5f5'};
      padding: 48px;
      text-align: center;
      color: ${mutedColor};
    }
    
    @media (max-width: 768px) {
      .hero {
        grid-template-columns: 1fr;
        padding: 32px 24px;
      }
      
      .hero-title {
        font-size: 32px;
      }
      
      .benefits-grid,
      .testimonials-grid {
        grid-template-columns: 1fr;
      }
      
      .product-images {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    /* Preview Editor Highlights */
    .preview-highlight {
      outline: 3px solid ${primaryColor} !important;
      outline-offset: 4px;
      animation: pulse 0.6s ease-out;
    }
    
    @keyframes pulse {
      0% { outline-width: 8px; opacity: 0; }
      50% { opacity: 1; }
      100% { outline-width: 3px; }
    }
  </style>
</head>
<body>
  ${this.renderAnnouncementBar()}
  ${this.renderHeader()}
  ${this.renderHero()}
  ${this.renderFeaturesBar()}
  ${this.renderBenefits()}
  ${this.renderTestimonials()}
  ${this.renderFAQ()}
  ${this.renderProductGallery()}
  ${this.renderFooter()}
  
  <script>
    // Preview interaction script
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'highlight') {
        document.querySelectorAll('.preview-highlight').forEach(el => el.classList.remove('preview-highlight'));
        const target = document.querySelector('[data-field="' + event.data.field + '"]');
        if (target) {
          target.classList.add('preview-highlight');
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });
  </script>
</body>
</html>
    `.trim();
  }

  private renderAnnouncementBar(): string {
    const message = this.aiContent.specialOffer || '🚚 Livraison gratuite sur toutes les commandes !';
    return `
      <div class="announcement-bar" data-field="specialOffer">
        ${this.escapeHtml(message)}
      </div>
    `;
  }

  private renderHeader(): string {
    const storeName = this.aiContent.storeName || 'Store';
    return `
      <header class="header">
        <div class="logo" data-field="storeName">${this.escapeHtml(storeName)}</div>
        <nav>
          <a href="#" style="color: inherit; text-decoration: none; margin-left: 24px;">Produits</a>
          <a href="#" style="color: inherit; text-decoration: none; margin-left: 24px;">À propos</a>
          <a href="#" style="color: inherit; text-decoration: none; margin-left: 24px;">Contact</a>
        </nav>
      </header>
    `;
  }

  private renderHero(): string {
    const title = this.aiContent.mainCatchyText || this.aiContent.title;
    const subtitle = this.aiContent.subMainCatchyText || this.aiContent.description;
    const mainImage = this.aiContent.images[0] || 'https://placehold.co/600x600/eee/999?text=Product';
    
    return `
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title" data-field="mainCatchyText">${this.escapeHtml(title)}</h1>
          <p class="hero-subtitle" data-field="subMainCatchyText">${this.escapeHtml(subtitle)}</p>
          <div class="price-box">
            <span class="price" data-field="price">${this.aiContent.price}</span>
            ${this.aiContent.compareAtPrice ? `<span class="compare-price" data-field="compareAtPrice">${this.aiContent.compareAtPrice}</span>` : ''}
          </div>
          <a href="#" class="cta-button">
            Acheter maintenant
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
        <div class="hero-image">
          <img src="${this.escapeHtml(mainImage)}" alt="${this.escapeHtml(this.aiContent.title)}" data-field="mainImage">
        </div>
      </section>
    `;
  }

  private renderFeaturesBar(): string {
    const features = this.aiContent.features || [
      '✓ Qualité premium',
      '✓ Livraison rapide',
      '✓ Satisfaction garantie',
      '✓ Service client 24/7'
    ];
    
    // Duplicate for continuous scroll
    const allFeatures = [...features, ...features];
    
    return `
      <div class="features-bar">
        <div class="features-scroll">
          ${allFeatures.map((f, i) => {
            const featureText = String(f || '').replace(/^[✓✔☑]\s*/, '');
            return `
            <div class="feature-item" data-field="features[${i % features.length}]">
              <div class="feature-icon">✓</div>
              <span>${this.escapeHtml(featureText)}</span>
            </div>
          `;
          }).join('')}
        </div>
      </div>
    `;
  }

  private renderBenefits(): string {
    const rawBenefits = this.aiContent.benefits || [];

    if (rawBenefits.length === 0) return '';

    // Normalize benefits - handle both string[] and {title, text}[] formats
    const benefits = rawBenefits.map((b: string | { title?: string; text?: string }) => {
      if (typeof b === 'string') {
        return { title: b, text: '' };
      }
      return { title: b.title || '', text: b.text || '' };
    });

    const icons = ['⭐', '💎', '🛡️', '🚀', '💡', '🎯'];

    return `
      <section class="section">
        <h2 class="section-title">Pourquoi nous choisir ?</h2>
        <div class="benefits-grid">
          ${benefits.map((b, i) => `
            <div class="benefit-card" data-field="benefits[${i}]">
              <div class="benefit-icon">${icons[i % icons.length]}</div>
              <h3 class="benefit-title" data-field="benefits[${i}].title">${this.escapeHtml(b.title)}</h3>
              ${b.text ? `<p class="benefit-text" data-field="benefits[${i}].text">${this.escapeHtml(b.text)}</p>` : ''}
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  private renderTestimonials(): string {
    const testimonials = this.aiContent.testimonials || [];

    if (testimonials.length === 0) return '';

    return `
      <section class="testimonials">
        <div class="section">
          <h2 class="section-title">Ce que disent nos clients</h2>
          <div class="testimonials-grid">
            ${testimonials.map((t, i) => `
              <div class="testimonial-card" data-field="testimonials[${i}]">
                <div class="testimonial-stars">★★★★★</div>
                <p class="testimonial-review" data-field="testimonials[${i}].review">"${this.escapeHtml(t?.review)}"</p>
                <div class="testimonial-author" data-field="testimonials[${i}].name">${this.escapeHtml(t?.name)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  private renderFAQ(): string {
    const faq = this.aiContent.faq || [];

    if (faq.length === 0) return '';

    return `
      <section class="faq-section">
        <div class="section">
          <h2 class="section-title">Questions fréquentes</h2>
          ${faq.map((item, i) => `
            <div class="faq-item" data-field="faq[${i}]">
              <div class="faq-question" data-field="faq[${i}].question">
                ${this.escapeHtml(item?.question)}
                <span>+</span>
              </div>
              <div class="faq-answer" data-field="faq[${i}].answer">
                ${this.escapeHtml(item?.answer)}
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  private renderProductGallery(): string {
    const images = this.aiContent.images.slice(1); // Skip first image (used in hero)

    if (images.length === 0) return '';

    return `
      <section class="section">
        <h2 class="section-title">Galerie produit</h2>
        <div class="product-images">
          ${images.map((img, i) => `
            <img src="${this.escapeHtml(img)}" alt="Product ${i + 1}" data-field="images[${i + 1}]">
          `).join('')}
        </div>
      </section>
    `;
  }

  private renderFooter(): string {
    const storeName = this.aiContent.storeName || 'Store';
    return `
      <footer class="footer">
        <p>© ${new Date().getFullYear()} ${this.escapeHtml(storeName)}. Tous droits réservés.</p>
        <p style="margin-top: 8px; font-size: 13px;">Généré par CopyfyAI</p>
      </footer>
    `;
  }

  private escapeHtml(text: string | undefined | null): string {
    if (text === undefined || text === null) return '';
    const str = String(text);
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return str.replace(/[&<>"']/g, char => htmlEntities[char] || char);
  }

  /**
   * Generate preview data for iframe communication
   */
  getPreviewData(): object {
    return {
      content: this.aiContent,
      options: this.options,
      sections: [
        'announcement-bar',
        'header',
        'hero',
        'features-bar',
        'benefits',
        'testimonials',
        'faq',
        'gallery',
        'footer',
      ],
    };
  }
}

/**
 * Generate a quick preview HTML for an AI content object
 */
export function generateQuickPreview(aiContent: AIContent, options?: PreviewOptions): string {
  const service = new ThemePreviewService(aiContent, options);
  return service.generateFullPreview();
}

