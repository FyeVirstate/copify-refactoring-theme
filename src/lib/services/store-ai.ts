/**
 * Store AI Service
 * Generates AI content for Shopify store creation using Claude
 */

import { ClaudeAIService } from './claude';
import type { AliExpressProductData } from './aliexpress';

export interface AIStoreContent {
  // Basic product info
  title: string;
  description: string;
  price?: number;
  compareAtPrice?: number;
  
  // Landing page content
  header: string;
  subheading: string;
  mainCatchyText: string;
  subMainCatchyText: string;
  
  // Features
  features: string[];
  productFeatures: Array<{ title: string; text: string }>;
  benefits: string[];
  
  // Social proof
  testimonials: Array<{ header: string; review: string; name: string }>;
  reviewRating: string;
  reviewCount: string;
  
  // FAQ
  faq: Array<{ question: string; answer: string }>;
  faqHeading?: string;
  
  // Clinical/Statistics
  clinicalResults: Array<{ percentage: number; description: string }>;
  
  // Persuasive content
  persuasiveContent: { header: string; paragraph: string };
  
  // Image with text section
  imageWithText: { header: string; text: string };
  
  // Timeline/How it works
  timeline: Array<{ step: string; timeframe: string; description: string }>;
  timelineHeading: string;
  
  // Guarantees
  guarantees: string[];
  
  // Video grid section
  videoGrid: { heading: string; subheading: string };
  
  // Comparison table
  comparison: {
    heading: string;
    subheading: string;
    our_name: string;
    others_name: string;
    features: Array<{ feature: string; us: string; others: string }>;
  };
  
  // Product section
  productSectionHeading: string;
  productSectionSubheading: string;
  
  // Additional content
  howItWorks: string;
  instructions: string;
  deliveryInformation: string;
  whyChooseUsText: string;
  whatMakesUsDifferentText: string;
  featureHeader: string;
  benefitsHeading?: string;
  benefitsParagraph?: string;
  
  // Images (from product data)
  images: string[];
  language: string;
}

/**
 * Generate the AI prompt for store content generation
 */
function buildStoreContentPrompt(productData: AliExpressProductData, language: string): string {
  const productInfo = {
    title: productData.title,
    description: productData.description?.html || '',
    price: productData.price,
    currency: productData.currency,
    categories: productData.categories?.map(c => c.name).join(', ') || '',
    rating: productData.ratings?.average || 4.5,
    reviews: productData.ratings?.count || 0,
  };

  return `You are a world-class copywriter specialized in high-converting Shopify product pages.

Your job is to transform the raw product data below into emotionally compelling, benefit-driven copy that sells. Use persuasive language, short impactful sentences, and highlight the transformation the product brings to the customer.

IMPORTANT: Keep content concise but informative. Be strict with character limits but allow enough space for quality content.

Only output structured ${language} content in the form of a valid JSON object that matches the schema below. Do not add commentary or markdown.

Product Data:
- Title: ${productInfo.title}
- Description: ${productInfo.description.substring(0, 1000)}
- Price: ${productInfo.price} ${productInfo.currency}
- Categories: ${productInfo.categories}
- Rating: ${productInfo.rating} (${productInfo.reviews} reviews)

Return a single JSON object that includes:

{
  "title": "string",                          // Product name (MAX 35 CHARACTERS)
  "description": "string",                    // Product Description (MAX 200 CHARACTERS)
  "howItWorks": "string",                     // How it works (MAX 200 CHARACTERS)
  "instructions": "string",                   // How to use it (MAX 200 CHARACTERS)
  "deliveryInformation": "string",            // Delivery Information (MAX 200 CHARACTERS)
  "whyChooseUsText": "string",                // Why Choose Us (MAX 85 CHARACTERS)
  "whatMakesUsDifferentText": "string",       // What makes us Different (MAX 100 CHARACTERS)
  "featureHeader": "string",                  // Feature statement (MAX 90 CHARACTERS)
  "features": ["string","string","string","string","string"],  // Five Bullet Features (MAX 35 CHARACTERS each)
  "header": "string",                         // Landing Page Header (MAX 4 WORDS)
  "subheading": "string",                     // Landing Page Subheading (MAX 6 WORDS)
  "mainCatchyText": "string",                 // Main Catchy Text (MAX 8 WORDS)
  "subMainCatchyText": "string",              // Sub Main Catchy Text (MAX 12 WORDS)
  "productSectionHeading": "string",          // Product showcase heading (MAX 60 CHARACTERS)
  "productSectionSubheading": "string",       // Product showcase subheading (MAX 80 CHARACTERS)
  "productFeatures": [
    { "title": "string", "text": "string" },  // Feature 1: title MAX 20 chars, text MAX 40 chars
    { "title": "string", "text": "string" },
    { "title": "string", "text": "string" },
    { "title": "string", "text": "string" }
  ],
  "testimonials": [
    { "header": "string", "review": "string", "name": "string" },  // header MAX 25 chars, review MAX 70 chars, name MAX 15 chars
    { "header": "string", "review": "string", "name": "string" },
    { "header": "string", "review": "string", "name": "string" },
    { "header": "string", "review": "string", "name": "string" }
  ],
  "faq": [
    { "question": "string", "answer": "string" },  // question MAX 50 chars, answer MAX 80 chars
    { "question": "string", "answer": "string" },
    { "question": "string", "answer": "string" },
    { "question": "string", "answer": "string" },
    { "question": "string", "answer": "string" }
  ],
  "benefits": ["string","string","string","string","string"],  // Five Benefits (MAX 25 characters each)
  "clinicalResults": [
    { "percentage": 95, "description": "string" },  // description MAX 40 characters
    { "percentage": 92, "description": "string" },
    { "percentage": 88, "description": "string" },
    { "percentage": 97, "description": "string" }
  ],
  "persuasiveContent": { "header": "string", "paragraph": "string" },  // header MAX 50 chars, paragraph MAX 120 chars
  "imageWithText": {
    "header": "string",      // Compelling headline (MAX 60 CHARACTERS)
    "text": "string"         // Engaging descriptive text (MAX 150 CHARACTERS)
  },
  "timeline": [
    { "step": "Step 1", "timeframe": "string", "description": "string" },  // timeframe MAX 25 chars, description MAX 60 chars
    { "step": "Step 2", "timeframe": "string", "description": "string" },
    { "step": "Step 3", "timeframe": "string", "description": "string" },
    { "step": "Step 4", "timeframe": "string", "description": "string" },
    { "step": "Step 5", "timeframe": "string", "description": "string" }
  ],
  "timelineHeading": "string",     // Timeline section heading (MAX 80 CHARACTERS)
  "guarantees": ["string", "string", "string"],  // Three guarantee statements (MAX 20 chars each)
  "reviewRating": "4.8",           // Average product rating
  "reviewCount": "21,883",         // Number of reviews
  "videoGrid": {
    "heading": "string",           // Section heading (MAX 60 CHARACTERS)
    "subheading": "string"         // Section subheading (MAX 100 CHARACTERS)
  },
  "comparison": {
    "heading": "string",           // Section heading (MAX 50 CHARACTERS)
    "subheading": "string",        // Section subheading (MAX 80 CHARACTERS)
    "our_name": "Our Product",     // Our brand column name (MAX 20 CHARACTERS)
    "others_name": "Others",       // Competitors column name (MAX 20 CHARACTERS)
    "features": [
      { "feature": "string", "us": "yes", "others": "no" },  // feature MAX 40 chars
      { "feature": "string", "us": "yes", "others": "no" },
      { "feature": "string", "us": "yes", "others": "no" },
      { "feature": "string", "us": "yes", "others": "yes" }
    ]
  }
}

IMPORTANT: Return ONLY the JSON object, no markdown, no code blocks, no comments.`;
}

/**
 * Parse Claude's response to extract JSON
 */
function parseAIResponse(response: string): Partial<AIStoreContent> {
  // Remove markdown code blocks if present
  let cleanedResponse = response
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/gi, '')
    .trim();

  // Try to find JSON object in the response
  const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanedResponse = jsonMatch[0];
  }

  try {
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('Response preview:', cleanedResponse.substring(0, 500));
    throw new Error('Failed to parse AI-generated content');
  }
}

/**
 * Calculate retail price with x3 markup, ending in X9.90, X9.90, etc.
 * Examples: 69.90, 49.90, 39.90, 29.90, 19.90, 9.90
 */
function calculateRetailPrice(basePrice: number): number {
  console.log('\n[PRICE CALCULATION] ========================================');
  console.log('[PRICE CALCULATION] calculateRetailPrice() called');
  console.log('[PRICE CALCULATION] Input base price (from AliExpress):', basePrice);
  
  // Multiply by 3
  const multiplied = basePrice * 3;
  console.log('[PRICE CALCULATION] After x3 multiplication:', multiplied);
  
  // Round to nearest price ending in X9.90
  // Price tiers: 9.90, 19.90, 29.90, 39.90, 49.90, 59.90, 69.90, 79.90, 89.90, 99.90, etc.
  const tens = Math.floor(multiplied / 10);
  const remainder = multiplied % 10;
  console.log('[PRICE CALCULATION] Tens:', tens, '| Remainder:', remainder);
  
  let result: number;
  // If the price is close to X9.90, round to that tier
  if (remainder >= 5) {
    // Round up to X9.90
    result = (tens + 1) * 10 - 0.10;
    console.log('[PRICE CALCULATION] Remainder >= 5, rounding UP to:', result);
  } else {
    // Round down to previous X9.90
    result = tens * 10 - 0.10;
    console.log('[PRICE CALCULATION] Remainder < 5, rounding DOWN to:', result);
  }
  
  console.log('[PRICE CALCULATION] FINAL RETAIL PRICE:', result);
  console.log('[PRICE CALCULATION] ========================================\n');
  return result;
}

/**
 * Calculate compare at price (strikethrough) = retail price × 2.5
 * Also rounds to X9.90 format
 */
function calculateCompareAtPrice(retailPrice: number): number {
  console.log('\n[PRICE CALCULATION] ========================================');
  console.log('[PRICE CALCULATION] calculateCompareAtPrice() called');
  console.log('[PRICE CALCULATION] Input retail price:', retailPrice);
  
  const multiplied = retailPrice * 2.5;
  console.log('[PRICE CALCULATION] After x2.5 multiplication:', multiplied);
  
  // Round to nearest price ending in X9.90
  const tens = Math.floor(multiplied / 10);
  const remainder = multiplied % 10;
  console.log('[PRICE CALCULATION] Tens:', tens, '| Remainder:', remainder);
  
  let result: number;
  if (remainder >= 5) {
    result = (tens + 1) * 10 - 0.10;
    console.log('[PRICE CALCULATION] Remainder >= 5, rounding UP to:', result);
  } else {
    result = tens * 10 - 0.10;
    console.log('[PRICE CALCULATION] Remainder < 5, rounding DOWN to:', result);
  }
  
  console.log('[PRICE CALCULATION] FINAL COMPARE AT PRICE (barré):', result);
  console.log('[PRICE CALCULATION] ========================================\n');
  return result;
}

/**
 * Generate AI store content from product data
 */
export async function generateStoreContent(
  productData: AliExpressProductData,
  language: string = 'English'
): Promise<AIStoreContent> {
  const claudeService = new ClaudeAIService();
  
  // Build the prompt
  const prompt = buildStoreContentPrompt(productData, language);
  
  // Generate content using Claude
  console.log('Generating AI store content...');
  const response = await claudeService.generateContent(prompt);
  
  if (!response) {
    throw new Error('Failed to generate AI content');
  }

  // Parse the response
  const aiContent = parseAIResponse(response);
  
  // Merge all images: main product images + description images
  const allImages = [
    ...(productData.images || []),
    ...(productData.description?.images || []),
  ];

  // Calculate retail prices with markup
  // x3 for selling price, ending in X9.90
  // x2.5 for compare at price (barré)
  console.log('\n[STORE-AI] ################################################################');
  console.log('[STORE-AI] PRICE CALCULATION STARTING');
  console.log('[STORE-AI] ################################################################');
  console.log('[STORE-AI] Product Data received:');
  console.log('[STORE-AI]   - productData.price:', productData.price);
  console.log('[STORE-AI]   - productData.originalPrice:', productData.originalPrice);
  console.log('[STORE-AI]   - productData.currency:', productData.currency);
  
  const basePrice = productData.price || 0;
  console.log('\n[STORE-AI] Base price used for calculation:', basePrice);
  
  const retailPrice = calculateRetailPrice(basePrice);
  const compareAtPrice = calculateCompareAtPrice(retailPrice);
  
  console.log('\n[STORE-AI] ################################################################');
  console.log('[STORE-AI] ===== FINAL PRICE SUMMARY =====');
  console.log('[STORE-AI] AliExpress Base Price:', basePrice, productData.currency);
  console.log('[STORE-AI] Retail Price (x3 markup):', retailPrice, '€');
  console.log('[STORE-AI] Compare At Price (x2.5 of retail):', compareAtPrice, '€');
  console.log('[STORE-AI] Discount shown to customer:', Math.round((1 - retailPrice/compareAtPrice) * 100) + '%');
  console.log('[STORE-AI] ===================================');
  console.log('[STORE-AI] ################################################################\n');

  // Build the final content object
  const storeContent: AIStoreContent = {
    // Basic info
    title: aiContent.title || productData.title,
    description: aiContent.description || '',
    price: retailPrice,
    compareAtPrice: compareAtPrice,
    
    // Landing page content
    header: aiContent.header || '',
    subheading: aiContent.subheading || '',
    mainCatchyText: aiContent.mainCatchyText || '',
    subMainCatchyText: aiContent.subMainCatchyText || '',
    
    // Features
    features: aiContent.features || [],
    productFeatures: aiContent.productFeatures || [],
    benefits: aiContent.benefits || [],
    
    // Social proof
    testimonials: aiContent.testimonials || [],
    reviewRating: aiContent.reviewRating || String(productData.ratings?.average || '4.8'),
    reviewCount: aiContent.reviewCount || String(productData.ratings?.count || '1,000+'),
    
    // FAQ
    faq: aiContent.faq || [],
    faqHeading: aiContent.faqHeading || 'Frequently Asked Questions',
    
    // Clinical/Statistics
    clinicalResults: aiContent.clinicalResults || [],
    
    // Persuasive content
    persuasiveContent: aiContent.persuasiveContent || { header: '', paragraph: '' },
    
    // Image with text
    imageWithText: aiContent.imageWithText || { header: '', text: '' },
    
    // Timeline
    timeline: aiContent.timeline || [],
    timelineHeading: aiContent.timelineHeading || '',
    
    // Guarantees
    guarantees: aiContent.guarantees || ['30-Day Guarantee', 'Free Shipping', 'Easy Returns'],
    
    // Video grid
    videoGrid: aiContent.videoGrid || { heading: '', subheading: '' },
    
    // Comparison
    comparison: aiContent.comparison || {
      heading: 'Why Choose Us',
      subheading: 'See the difference',
      our_name: 'Our Product',
      others_name: 'Others',
      features: [],
    },
    
    // Product section
    productSectionHeading: aiContent.productSectionHeading || '',
    productSectionSubheading: aiContent.productSectionSubheading || '',
    
    // Additional content
    howItWorks: aiContent.howItWorks || '',
    instructions: aiContent.instructions || '',
    deliveryInformation: aiContent.deliveryInformation || '',
    whyChooseUsText: aiContent.whyChooseUsText || '',
    whatMakesUsDifferentText: aiContent.whatMakesUsDifferentText || '',
    featureHeader: aiContent.featureHeader || '',
    benefitsHeading: aiContent.benefitsHeading,
    benefitsParagraph: aiContent.benefitsParagraph,
    
    // Images from product data
    images: allImages,
    language,
  };

  return storeContent;
}

/**
 * Map language code to full language name
 */
export function getLanguageName(code: string): string {
  const languageMap: Record<string, string> = {
    'en': 'English',
    'fr': 'French',
    'es': 'Spanish',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'nl': 'Dutch',
    'pl': 'Polish',
    'sv': 'Swedish',
    'da': 'Danish',
    'no': 'Norwegian',
  };
  return languageMap[code] || 'English';
}

