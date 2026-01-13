// Types for AI Store Section Components

export interface AIContent {
  title: string;
  description: string;
  price?: number;
  compareAtPrice?: number;
  compare_at_price?: number;
  header?: string;
  subheading?: string;
  featureHeader?: string;
  mainCatchyText: string;
  subMainCatchyText: string;
  features: string[];
  benefits: string[];
  advantages?: string[];
  productFeatures?: Array<{ title: string; text: string }>;
  testimonials: Array<{ header: string; review: string; name: string }>;
  faq: Array<{ question: string; answer: string }>;
  images: string[];
  language: string;
  deliveryInformation?: string;
  howItWorks?: string;
  instructions?: string;
  productSectionHeading?: string;
  productSectionSubheading?: string;
  reviewRating?: string;
  reviewCount?: string;
  guarantees?: string[];
  clinicalResults?: Array<{ percentage: string; description: string }>;
  persuasiveContent?: {
    header?: string;
    paragraph?: string;
    image?: string;
  };
  whatMakesUsDifferentText?: string;
  whyChooseUsText?: string;
  benefitsHeading?: string;
  benefitsParagraph?: string;
  imageWithText?: {
    header?: string;
    text?: string;
  };
  // Timeline fields
  timeline?: Array<{ timeframe: string; description: string }>;
  timelineHeading?: string;
  // FAQ fields
  faqHeading?: string;
  // Comparison fields
  comparison?: {
    heading?: string;
    subheading?: string;
    our_name?: string;
    others_name?: string;
    features?: Array<{ feature: string; us: boolean; others: boolean }>;
  };
  // Video Grid fields
  videoGrid?: {
    heading?: string;
    subheading?: string;
  };
  videoGridImages?: string[];
  // Announcement bar
  specialOffer?: string;
  // Selected images per section
  selectedMainImages?: string[];
  selectedHeroImage?: string;
  selectedBenefitsImage?: string;
  selectedBenefitsImage2?: string;
  selectedClinicalImage?: string;
  productSectionImage?: string[];
  faqImage?: string;
  timelineImage?: string;
  imageWithTextImage?: string;
  comparisonOurImage?: string;
  comparisonOthersImage?: string;
  // Product Information images
  productInfoImage1?: string;
  productInfoImage2?: string;
  productInfoImage3?: string;
  // Color/style fields
  primary_color_picker?: string;
  secondary_color_picker?: string;
  tertiary_color_picker?: string;
  font_heading?: string;
  font_body?: string;
}

export interface SectionProps {
  content: AIContent;
  updateField: (field: string, value: unknown) => void;
  updateNestedField: (arrayField: string, index: number, field: string, value: string) => void;
  regenerateField: (fieldName: string, currentValue: string) => void;
  regeneratingField: string | null;
  images?: string[];
  onEditImage?: (imageUrl: string) => void;
  onGenerateImage?: () => void;
}

export interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'number';
  rows?: number;
  icon?: string;
  showRegenerateButton?: boolean;
  hint?: string;
}
