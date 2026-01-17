// AI Store Section Components - Export all sections
// Each section matches the corresponding Laravel blade template

export { AIInputField } from './AIInputField';
export { TestimonialsSection } from './TestimonialsSection';
export { HeroSection } from './HeroSection';
export { ProductInfoSection } from './ProductInfoSection';
export { FAQSection } from './FAQSection';
export { ClinicalSection } from './ClinicalSection';
export { BenefitsSection } from './BenefitsSection';
export { ReviewsSection } from './ReviewsSection';
export { ImageSelector } from './ImageSelector';
export { TimelineSection } from './TimelineSection';
export { ComparisonSection } from './ComparisonSection';
export { ImageWithTextSection } from './ImageWithTextSection';
export { FeaturedProductSection } from './FeaturedProductSection';
export { AnnouncementBarSection } from './AnnouncementBarSection';
export { VideoGridSection } from './VideoGridSection';
export { ImageFaqSection } from './ImageFaqSection';

export type { AIContent, SectionProps, InputFieldProps } from './types';

/**
 * Section mapping from Laravel to Next.js components:
 * 
 * Laravel Section                    | Next.js Component      | Theme Section ID
 * -----------------------------------|------------------------|-------------------
 * _hero-section.blade.php            | HeroSection           | img-with-txt
 * _testimonial-marquee-section.blade.php | TestimonialsSection   | header-with-marquee
 * _product-info-section.blade.php    | ProductInfoSection    | featured-product
 * _product-section.blade.php         | ProductSection        | product-section-1
 * _benefits-section.blade.php        | BenefitsSection       | pdp-benefits
 * _clinical-section.blade.php        | ClinicalSection       | pdp-statistics-column
 * _reviews-section.blade.php         | ReviewsSection        | product-reviews
 * _faq-section.blade.php             | FAQSection            | product-faqs
 * _comparison-section.blade.php      | ComparisonSection     | pdp-comparison
 * _timeline-section.blade.php        | TimelineSection       | custom-timeline
 * _image-with-text-section.blade.php | ImageWithTextSection  | img-with-txt (Header produit)
 * _video-grid-section.blade.php      | VideoGridSection      | video-gris-slider
 * _announcement-bar-section.blade.php| AnnouncementBarSection| announcement-bar
 * image-faq.liquid                   | ImageFaqSection       | image-faq
 */
