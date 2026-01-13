/**
 * ContentMappingService - Shared service for mapping AI content to Shopify sections
 * 
 * Port of Laravel's App\Services\StoreAI\ContentMappingService
 * 
 * Used by:
 * - liquid-preview API route (for live preview rendering)
 * - Theme packaging (for theme upload)
 * 
 * This ensures the preview and packaged theme have identical content.
 */

// Types
interface BlockSettings {
  [key: string]: unknown
}

interface Block {
  type: string
  settings?: BlockSettings
  disabled?: boolean
}

interface Blocks {
  [blockId: string]: Block
}

interface AiContent {
  [key: string]: unknown
}

interface DistributedImages {
  featuredImage?: string
  landingPageImage?: string
  benefitsImage?: string
  benefitsImage2?: string
  statisticsImage?: string
  timelineImage?: string
  comparisonOurImage?: string
  comparisonOthersImage?: string
  faqImage?: string
  productSectionImage?: string
  imageWithTextImage?: string
  heroImages?: string[]
}

interface Testimonial {
  name?: string
  header?: string
  heading?: string
  review?: string
  text?: string
}

interface FAQ {
  question: string
  answer: string
  content?: string
}

interface Feature {
  title?: string
  text?: string
  name?: string
  description?: string
}

interface ClinicalResult {
  percentage?: string | number
  title?: string
  description?: string
}

interface TimelinePoint {
  step?: string
  timeframe?: string
  description?: string
  text?: string
  heading?: string
  title?: string
}

interface ComparisonFeature {
  feature?: string
  title?: string
  us?: string | boolean
  others?: string | boolean
}

interface Comparison {
  heading?: string
  subheading?: string
  our_name?: string
  others_name?: string
  features?: ComparisonFeature[]
}

/**
 * Normalize section type by removing unique suffixes
 * e.g., "timeline_points_kerHeV" -> "timeline-points"
 */
export function normalizeSectionType(sectionType: string): string {
  // Remove unique suffix (e.g., timeline_points_kerHeV -> timeline_points)
  const baseSectionType = sectionType.replace(/_[a-zA-Z0-9]+$/, '')
  // Normalize to dashes (timeline_points -> timeline-points)
  return baseSectionType.replace(/_/g, '-')
}

/**
 * Format heading with last word(s) wrapped in <span> tag
 * Example: "What Makes Us Different" -> "What Makes Us <span>Different</span>"
 */
function formatWithSpan(text: string, wordCount = 1): string {
  if (!text) return text
  // Remove any existing HTML
  const cleanText = text.replace(/<[^>]*>/g, '')
  const words = cleanText.trim().split(' ')
  if (words.length <= wordCount) {
    return text
  }
  const lastWords = words.splice(-wordCount)
  return words.join(' ') + ' <span>' + lastWords.join(' ') + '</span>'
}

/**
 * Format heading with last word wrapped in <span class="hgt___tag_heading">
 * Example: "Product Features" -> "Product <span class=\"hgt___tag_heading\">Features</span>"
 */
function formatWithTagSpan(text: string, wordCount = 1): string {
  if (!text) return text
  // Remove any existing HTML
  const cleanText = text.replace(/<[^>]*>/g, '')
  const words = cleanText.trim().split(' ')
  if (words.length <= wordCount) {
    return text
  }
  const lastWords = words.splice(-wordCount)
  return words.join(' ') + ' <span class="hgt___tag_heading">' + lastWords.join(' ') + '</span>'
}

/**
 * Format timeline heading with <strong> tag for first part before colon
 * Example: "Step Into Superior Comfort: Rest of text" -> "<strong>Step Into Superior Comfort:</strong> Rest of text"
 */
function formatTimelineHeading(text: string): string {
  if (!text) return text
  // Remove any existing HTML
  const cleanText = text.replace(/<[^>]*>/g, '')
  
  // If text has a colon, wrap the part before colon in <strong>
  if (cleanText.includes(':')) {
    const parts = cleanText.split(':')
    const firstPart = parts[0].trim()
    const rest = parts.slice(1).join(':').trim()
    return '<strong>' + firstPart + ':</strong>' + (rest ? ' ' + rest : '')
  }
  
  // Otherwise, wrap the first few words (up to 5) in <strong>
  const words = cleanText.trim().split(' ')
  if (words.length <= 5) {
    return '<strong>' + cleanText + '</strong>'
  }
  const firstPart = words.splice(0, 5)
  return '<strong>' + firstPart.join(' ') + ':</strong> ' + words.join(' ')
}

/**
 * Apply AI content to section settings based on section type
 */
export function applyContentToSettings(
  sectionType: string,
  settings: BlockSettings,
  aiContent: AiContent,
  images: DistributedImages = {}
): BlockSettings {
  const normalizedType = normalizeSectionType(sectionType)
  
  // Get images with fallbacks - use frontend field names (selectedBenefitsImage, selectedClinicalImage, selectedHeroImage)
  const productImages = (aiContent.images as string[]) || []
  const featuredImage = images.featuredImage || productImages[0] || 'https://placehold.co/600x600/png?text=Product'
  // Hero image: frontend uses selectedHeroImage
  const landingPageImage = images.landingPageImage || (aiContent.selectedHeroImage as string) || (aiContent.selectedLandingPageImage as string) || (aiContent.landingPageImage as string) || featuredImage
  // Benefits image: frontend uses selectedBenefitsImage
  const benefitsImage = images.benefitsImage || (aiContent.selectedBenefitsImage as string) || (aiContent.benefitsImage as string) || landingPageImage
  // Statistics/Clinical image: frontend uses selectedClinicalImage
  const statisticsImage = images.statisticsImage || (aiContent.selectedClinicalImage as string) || (aiContent.clinicalImage as string) || landingPageImage
  // Timeline image: frontend uses timelineImage
  const timelineImage = images.timelineImage || (aiContent.timelineImage as string) || landingPageImage
  // Comparison images: frontend uses comparisonOurImage and comparisonOthersImage
  const comparisonOurImage = images.comparisonOurImage || (aiContent.comparisonOurImage as string) || (aiContent.comparisonImage as string) || featuredImage
  const comparisonOthersImage = images.comparisonOthersImage || (aiContent.comparisonOthersImage as string) || landingPageImage
  // FAQ image: frontend uses faqImage
  const faqImage = images.faqImage || (aiContent.faqImage as string) || benefitsImage
  // Product section images: frontend uses productSectionImage (array)
  const productSectionImage = images.productSectionImage || (Array.isArray(aiContent.productSectionImage) ? (aiContent.productSectionImage as string[])[0] : (aiContent.productSectionImage as string)) || featuredImage
  // Image with text: frontend uses imageWithTextImage
  const imageWithTextImage = images.imageWithTextImage || (aiContent.imageWithTextImage as string) || landingPageImage
  
  const storeName = (aiContent.store_name as string) || 'YOUR BRAND'
  const persuasiveContent = (aiContent.persuasiveContent as Record<string, string>) || {}
  const imageWithText = (aiContent.imageWithText as Record<string, string>) || {}
  const comparison = (aiContent.comparison as Comparison) || {}
  const videoGrid = (aiContent.videoGrid as Record<string, string>) || {}
  const timeline = (aiContent.timeline as Record<string, string>) || {}
  
  const mappings: Record<string, Record<string, unknown>> = {
    'featured-product': {
      // Don't use title here - it will be set in blocks for product__title h2
      color_scheme: 'scheme-1',
    },
    'featured-product-new': {
      // Don't use title here - it will be set in blocks for product__title h2
      color_scheme: 'scheme-1',
    },
    'footer': {
      color_scheme: 'scheme-3',
    },
    'new-footer': {
      color_scheme: 'scheme-3',
    },
    'image-with-text': {
      heading: aiContent.mainCatchyText || imageWithText.header || aiContent.header || null,
      text: aiContent.subMainCatchyText || imageWithText.text || null,
      image: landingPageImage,
      color_scheme: 'scheme-1',
    },
    'timeline-points': {
      heading: formatTimelineHeading((timeline.heading as string) || (aiContent.timelineHeading as string) || 'Step Into Superior Comfort: Experience the difference'),
      image: timelineImage,
      color_scheme: 'scheme-1',
    },
    'pdp-benefits': {
      heading: formatWithTagSpan((aiContent.benefitsHeading as string) || (aiContent.featureHeader as string) || 'Product Features', 1),
      paragraph: (aiContent.benefitsParagraph as string) || (aiContent.featureSubheader as string) || (aiContent.whatMakesUsDifferentText as string) || null,
      image: benefitsImage,
      color_scheme: 'scheme-1',
    },
    'image-faq': {
      heading: formatWithSpan((aiContent.whatMakesUsDifferentHeading as string) || (aiContent.featureHeader as string) || 'What Makes Us Different', 1),
      paragraph: (aiContent.whatMakesUsDifferentText as string) || (aiContent.benefitsParagraph as string) || null,
      image: faqImage,
      color_scheme: 'scheme-1',
    },
    'pdp-statistics-column': {
      heading: formatWithTagSpan(persuasiveContent.header || 'Our Impact Statistics', 1),
      text: persuasiveContent.paragraph || null,
      center_image: statisticsImage,
      image: statisticsImage,
      color_scheme: 'scheme-1',
    },
    'video-gris-slider': {
      heading: videoGrid.heading || (aiContent.socialProofHeading as string) || 'See What Our Customers Are Saying',
      subheading: videoGrid.subheading || (aiContent.socialProofSubheading as string) || null,
      rating_text: `${aiContent.reviewRating || '4.8'} from ${aiContent.reviewCount || '21,883'} reviews`,
      review_stars: 5,
      image: landingPageImage,
      color_scheme: 'scheme-1',
      section_color_scheme: 'scheme-1',
    },
    'text-and-image': {
      heading: imageWithText.header || null,
      image: imageWithTextImage,
    },
    'product-results': {
      heading: persuasiveContent.header || 'Proven Results',
      center_image: statisticsImage,
    },
    'rich-text': {
      heading: aiContent.header || null,
      text: aiContent.description || null,
    },
    'product-section-1': {
      heading: aiContent.productSectionHeading || null,
      subheading: aiContent.productSectionSubheading || null,
      center_image: productSectionImage,
      image: productSectionImage,
    },
    'main-product-custom': {
      image: featuredImage,
    },
    'pdp-main-product': {
      constrain_to_viewport: false,
    },
    'img-with-txt': {
      heading: formatWithSpan((aiContent.mainCatchyText as string) || 'Transform Your Experience Today', 2),
      text: aiContent.subMainCatchyText || null,
      image: landingPageImage,
      desktop_banner_fifty_img: landingPageImage,
    },
    'pdp-comparison-table': {
      heading: formatWithTagSpan(comparison.heading || 'Why Choose Us', 1),
      subheading: comparison.subheading || 'See the difference that matters',
      image: comparisonOurImage,
    },
    'custom-newsletter': {
      heading: aiContent.newsletterHeading || null,
      text: aiContent.newsletterText || null,
    },
    'header-with-marquee': {
      heading: persuasiveContent.header || (aiContent.header as string) || 'What Our Customers Say',
    },
    'announcement-bar': {},
    'product-reviews': {
      heading: 'Customers Love ' + storeName,
    },
    'faq': {
      heading: (aiContent.faqHeading as string) || 'Frequently Asked Questions',
      subhding: '<p>' + ((aiContent.faqSubheading as string) || 'Find answers to common questions about our products, shipping, returns, and more.') + '</p>',
    },
    'product-faq': {
      heading: (aiContent.faqHeading as string) || 'Frequently Asked Questions',
    },
    'product-compare': {
      heading: storeName + ' vs Others',
      col_left: storeName,
    },
    'marquee': {
      // Marquee section usually doesn't need settings override
    },
    'header': {
      title: 'YOUR BRAND', // Always "YOUR BRAND" for navbar, not editable
      heading: 'YOUR BRAND',
    },
    'navbar': {
      title: 'YOUR BRAND', // Always "YOUR BRAND" for navbar, not editable
      heading: 'YOUR BRAND',
    },
  }
  
  const sectionMappings = mappings[normalizedType]
  if (sectionMappings) {
    for (const [key, value] of Object.entries(sectionMappings)) {
      if (value !== null && value !== undefined) {
        settings[key] = value
      }
    }
  }
  
  return settings
}

/**
 * Apply AI content to section blocks based on section type
 */
export function applyContentToBlocks(
  sectionType: string,
  blocks: Blocks,
  aiContent: AiContent,
  images: DistributedImages = {}
): Blocks {
  const normalizedType = normalizeSectionType(sectionType)
  
  // Extract content arrays
  const testimonials = (aiContent.testimonials as Testimonial[]) || []
  const faq = (aiContent.faq as FAQ[]) || []
  const benefits = (aiContent.benefits as Feature[]) || (aiContent.productFeatures as Feature[]) || []
  const features = (aiContent.productFeatures as Feature[]) || []
  const featureTags = (aiContent.features as (string | Feature)[]) || []
  const clinicalResults = (aiContent.clinicalResults as ClinicalResult[]) || (aiContent.statistics as ClinicalResult[]) || []
  const timeline = (aiContent.timeline as TimelinePoint[]) || []
  const comparison = (aiContent.comparison as Comparison) || {}
  const comparisonFeatures = comparison.features || []
  const guarantees = (aiContent.guarantees as (string | Record<string, string>)[]) || []
  
  // Track indexes for array-based content
  const indexes = {
    review: 0,
    faq: 0,
    benefit: 0,
    feature: 0,
    featureLeft: 0,
    featureRight: 2,
    clinical: 0,
    result: 0,
    timeline: 0,
    comparison: 0,
    collapsible: 0,
    tableHeading: 0,
  }
  
  for (const blockId of Object.keys(blocks)) {
    const block = blocks[blockId]
    const blockType = block.type || ''
    if (!block.settings) {
      block.settings = {}
    }
    
    // === ANNOUNCEMENT BAR ===
    if (blockType === 'announcement') {
      const specialOffer = (aiContent.specialOffer as string) || (aiContent.announcementText as string) || null
      if (specialOffer) {
        block.settings.text = specialOffer
      }
      if (aiContent.announcementLink) {
        block.settings.link = aiContent.announcementLink
      }
    }
    
    // === TESTIMONIALS / REVIEWS ===
    if (blockType !== 'video_reviews' &&
        (blockType.includes('review') || blockType === 'marquee' ||
         blockType === 'testimonial' || blockType === 'card')) {
      if (testimonials[indexes.review]) {
        const t = testimonials[indexes.review]
        block.settings.review_title = t.header || 'Great Product!'
        block.settings.review_text = t.review || t.text || ''
        block.settings.reviewer_name = t.name || 'Customer'
        block.settings.name = t.name || 'Customer'
        block.settings.profession = t.review || t.text || ''
        block.settings.text = t.review || t.text || ''
        block.settings.heading = t.header || t.heading || ''
        block.settings.review = t.review || t.text || ''
        indexes.review++
      }
    }
    
    // === CUSTOMER APPRECIATION ===
    if (blockType === 'customer_appreciation') {
      if (testimonials[indexes.review]) {
        const t = testimonials[indexes.review]
        block.settings.author_name = t.name || 'Customer'
        block.settings.customer_review = t.review || t.text || ''
        indexes.review++
      }
    }
    
    // === VIDEO REVIEWS ===
    if (blockType === 'video_reviews') {
      const videoTexts = ['text1', 'text2', 'text3', 'text4', 'text5']
      videoTexts.forEach((textKey, idx) => {
        if (testimonials[idx]) {
          const text = testimonials[idx].review || testimonials[idx].header || ''
          if (text) {
            block.settings[textKey] = text
          }
        }
      })
    }
    
    // === BULLETS BADGES ===
    if (blockType === 'bullets_badges') {
      const bulletFeatures = featureTags.length > 0 ? featureTags : features
      const bulletTexts = ['texta_dsg_a', 'textb_dsg_a', 'textc_dsg_a', 'textd_dsg_a', 'texte_dsg_a']
      const bulletIcons = ['icona_dsg_a', 'iconb_dsg_a', 'iconc_dsg_a', 'icond_dsg_a', 'icone_dsg_a']
      bulletTexts.forEach((textKey, idx) => {
        if (bulletFeatures[idx]) {
          const feature = bulletFeatures[idx]
          const text = typeof feature === 'string' ? feature : (feature.title || feature.text || '')
          if (text) {
            block.settings[textKey] = text
            block.settings[bulletIcons[idx]] = 'check_mark'
          }
        } else {
          block.settings[textKey] = ''
          block.settings[bulletIcons[idx]] = 'none'
        }
      })
    }
    
    // === PRODUCT LABELS II ===
    if (blockType === 'product_labels_ii') {
      const labelBenefits = benefits.length > 0 ? benefits : features
      const letters = ['a', 'b', 'c', 'd']
      letters.forEach((letter, idx) => {
        if (labelBenefits[idx]) {
          const b = labelBenefits[idx]
          const title = typeof b === 'string' ? b : (b.title || b.name || '')
          const para = typeof b === 'string' ? '' : (b.text || b.description || '')
          block.settings['title_' + letter] = title
          block.settings['para_' + letter] = para
          block.settings['icon_' + letter] = 'check_mark'
        } else {
          block.settings['title_' + letter] = ''
          block.settings['para_' + letter] = ''
          block.settings['icon_' + letter] = 'none'
        }
      })
    }
    
    // === HEADING HEADER ===
    if (blockType === 'heading_header') {
      const heading = (aiContent.subMainCatchyText as string) || (aiContent.mainCatchyText as string) || (aiContent.subheading as string) || ''
      if (heading) {
        block.settings.heading = heading
      }
    }
    
    // === BADGES TEXT ===
    if (blockType === 'bagdes_text') {
      const letters = ['a', 'b', 'c', 'd']
      letters.forEach((letter, idx) => {
        if (guarantees[idx]) {
          const g = guarantees[idx]
          const title = typeof g === 'string' ? g : (g.title || g.text || g)
          if (title) {
            block.settings['title_' + letter] = title
          }
        }
      })
    }
    
    // === TRUSTPILOT WIDGET ===
    if (blockType === 'trustpilot_widget') {
      const rating = (aiContent.reviewRating as string) || '4.8'
      const count = (aiContent.reviewCount as string) || '1,000+'
      
      block.settings.ratings_text_dsg_a = 'Excellent'
      block.settings.ratings_dsg_a = rating + ' out of 5'
      block.settings.ratings_dsg_b = rating
      block.settings.ratings_count_dsg_b = '(' + count + ')'
      block.settings.ratings_satisfaction_dsg_b = 'Happy Customers'
      block.settings.ratings_dsg_c = 'Rated ' + rating + ' (' + count + ' happy customers)'
    }
    
    // === BENEFIT TAGS ===
    if (blockType === 'benefit_tags') {
      const tagFeatures = featureTags.length > 0 ? featureTags : features
      const tagKeys = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
      tagKeys.forEach((tagKey, idx) => {
        if (tagFeatures[idx]) {
          const feature = tagFeatures[idx]
          const text = typeof feature === 'string' ? feature : (feature.title || feature.text || '')
          block.settings[tagKey] = text || ''
        } else {
          block.settings[tagKey] = ''
        }
      })
    }
    
    // === FAQ BLOCKS ===
    if (normalizedType === 'image-faq' && blockType === 'faq') {
      // image-faq uses benefits as accordion items
      const benefitsList = benefits.length > 0 ? benefits : features
      if (benefitsList[indexes.faq]) {
        const b = benefitsList[indexes.faq]
        const title = typeof b === 'string' ? b : (b.title || b.name || '')
        const text = typeof b === 'string' ? '' : (b.text || b.description || '')
        block.settings.question = title
        block.settings.content = '<p>' + text + '</p>'
        indexes.faq++
      }
    } else if ((blockType === 'faq' || blockType === 'text' || blockType === 'question') &&
               ['faq', 'product-faq'].includes(normalizedType)) {
      if (faq[indexes.faq]) {
        const q = faq[indexes.faq]
        block.settings.q = q.question || ''
        block.settings.a = '<p>' + (q.answer || '') + '</p>'
        block.settings.heading = q.question || ''
        block.settings.content = '<p>' + (q.answer || '') + '</p>'
        block.settings.question = q.question || ''
        block.settings.answer = '<p>' + (q.answer || '') + '</p>'
        indexes.faq++
      }
    }
    
    // === COLLAPSIBLE TABS ===
    if (blockType === 'collapsible_tabs') {
      const tabContent: Record<string, { title: string; content: string }> = {
        a: { title: 'Description', content: (aiContent.description as string) || '' },
        b: { title: 'How To Use', content: (aiContent.instructions as string) || '' },
        c: { title: 'Delivery Information', content: (aiContent.deliveryInformation as string) || '' },
        d: { title: 'How It Works', content: (aiContent.howItWorks as string) || '' },
      }
      
      // Add FAQ content as additional tabs
      if (faq.length > 0) {
        const tabLetters = ['e', 'f', 'g', 'h', 'i', 'j']
        faq.forEach((q, idx) => {
          if (idx < tabLetters.length) {
            tabContent[tabLetters[idx]] = {
              title: q.question || '',
              content: q.answer || ''
            }
          }
        })
      }
      
      // Apply the content to settings
      const allLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
      allLetters.forEach(letter => {
        const content = tabContent[letter]
        if (content && content.content) {
          block.settings['title_' + letter] = content.title
          block.settings['content_' + letter] = '<p>' + content.content + '</p>'
        } else {
          block.settings['title_' + letter] = ''
          block.settings['content_' + letter] = ''
        }
      })
    }
    
    // === COLLAPSIBLE TAB (singular) ===
    if (blockType === 'collapsible_tab' && indexes.collapsible < 3) {
      const collapsibleContent = [
        { heading: 'How To Use', content: (aiContent.instructions as string) || '' },
        { heading: 'Delivery Information', content: (aiContent.deliveryInformation as string) || '' },
        { heading: 'How It Works', content: (aiContent.howItWorks as string) || '' },
      ]
      if (collapsibleContent[indexes.collapsible]) {
        const c = collapsibleContent[indexes.collapsible]
        if (c.content) {
          block.settings.heading = c.heading
          block.settings.content = '<p>' + c.content + '</p>'
        }
        indexes.collapsible++
      }
    }
    
    // === QUANTITY BREAK ===
    if (blockType === 'quantity_break') {
      block.settings.heading = ''
      const qtyLetters = ['a', 'b', 'c']
      qtyLetters.forEach(letter => {
        const qtyKey = 'qty_' + letter
        const qtyValue = block.settings[qtyKey]
        block.settings[qtyKey] = typeof qtyValue === 'number' ? qtyValue : 1
        block.settings['title_' + letter] = ''
        block.settings['off_price_' + letter] = 0
        block.settings['badge_' + letter] = ''
      })
    }
    
    // === FEATURE LEFT/RIGHT ===
    if (blockType === 'feature_left' && features[indexes.featureLeft]) {
      const f = features[indexes.featureLeft]
      block.settings.title = f.title || ''
      block.settings.text = f.text || ''
      indexes.featureLeft++
    }
    if (blockType === 'feature_right' && features[indexes.featureRight]) {
      const f = features[indexes.featureRight]
      block.settings.title = f.title || ''
      block.settings.text = f.text || ''
      indexes.featureRight++
    }
    
    // === TABLE HEADING (pdp-comparison-table column headers) ===
    if (blockType === 'table_heading' && normalizedType === 'pdp-comparison-table') {
      const comparisonData = comparison as { our_name?: string; others_name?: string }
      if (indexes.tableHeading === 0) {
        // First column: Our product
        block.settings.title = comparisonData.our_name || storeName || 'Our Product'
        block.settings.icon_text = 'Original'
        // Use comparisonOurImage for our product column
        block.settings.image = images.comparisonOurImage || (aiContent.comparisonOurImage as string) || images.featuredImage
      } else {
        // Second column: Others/Competitors
        block.settings.title = comparisonData.others_name || 'Others'
        block.settings.icon_text = ''
        // Use comparisonOthersImage for others column
        block.settings.image = images.comparisonOthersImage || (aiContent.comparisonOthersImage as string) || ''
      }
      indexes.tableHeading++
    }
    
    // === GENERIC FEATURES / BENEFITS ===
    if ((blockType.includes('feature') && !['feature_left', 'feature_right'].includes(blockType)) ||
        blockType.includes('icon_with_text') ||
        blockType === 'benefit' || blockType === 'item') {
      
      // pdp-comparison-table features - skip empty features
      if (normalizedType === 'pdp-comparison-table' && comparisonFeatures[indexes.comparison]) {
        const cf = comparisonFeatures[indexes.comparison]
        const featureTitle = cf.feature || cf.title || ''
        // Only set if feature has actual content (not empty or just "Feature")
        if (featureTitle && featureTitle !== 'Feature') {
          block.settings.feature_title = featureTitle
          block.settings.feature_have_a = (cf.us === 'yes' || cf.us === true) ? 'true' : 'false'
          block.settings.feature_have_b = (cf.others === 'yes' || cf.others === true) ? 'true' : 'false'
        }
        indexes.comparison++
      }
      // pdp-benefits section
      else if (normalizedType === 'pdp-benefits' && benefits[indexes.benefit]) {
        const b = benefits[indexes.benefit]
        if (typeof b === 'object') {
          block.settings.title = b.title || b.name || ''
          block.settings.text = b.text || b.description || ''
          block.settings.heading = b.title || b.name || ''
          block.settings.description = b.text || b.description || ''
        } else {
          block.settings.title = b
          block.settings.heading = b
        }
        indexes.benefit++
      }
      // Generic features
      else if (features[indexes.feature]) {
        const f = features[indexes.feature]
        block.settings.title = f.title || f.name || ''
        block.settings.text = f.text || f.description || ''
        block.settings.heading = f.title || f.name || ''
        block.settings.description = f.text || f.description || ''
        indexes.feature++
      }
    }
    
    // === CLINICAL / STATISTIC BLOCKS ===
    if (blockType === 'result' && clinicalResults[indexes.result]) {
      const c = clinicalResults[indexes.result]
      block.settings.percentage = (c.percentage || '') + '%'
      block.settings.text = c.description || ''
      indexes.result++
    }
    if ((blockType.includes('stat') || blockType === 'statistic') && clinicalResults[indexes.clinical]) {
      const c = clinicalResults[indexes.clinical]
      block.settings.percentage = (c.percentage || '') + '%'
      block.settings.count = (c.percentage || '') + '%'
      block.settings.description = c.description || ''
      block.settings.heading = (c.percentage || '') + '%'
      block.settings.text = c.description || ''
      block.settings.title = c.title || ''
      block.settings.paragraph = c.description || ''
      indexes.clinical++
    }
    
    // === TIMELINE POINTS ===
    if (blockType === 'point' || (blockType === 'item' && normalizedType === 'timeline-points')) {
      if (timeline[indexes.timeline]) {
        const p = timeline[indexes.timeline]
        block.settings.step = p.step || p.timeframe || ('Step ' + (indexes.timeline + 1))
        block.settings.timeframe = p.timeframe || p.step || ''
        block.settings.description = p.description || p.text || ''
        block.settings.heading = p.heading || p.title || ''
        block.settings.text = p.text || p.description || ''
        indexes.timeline++
      }
    }
    
    // === NAVBAR / HEADER TITLE (must be checked BEFORE title blocks) ===
    // Ensure navbar always shows "YOUR BRAND" or store_name, never the product title
    // This handles header__heading-link which should always be "YOUR BRAND"
    if (blockType === 'navbar_title' || blockType === 'header_title' || blockType === 'navbar-title' ||
        blockType === 'heading-link' || blockType === 'header_heading' ||
        (blockType === 'title' && (normalizedType === 'header' || normalizedType === 'navbar' || sectionType.includes('header')))) {
      // Use store_name or "YOUR BRAND" for navbar, never the product title
      // Force "YOUR BRAND" for header__heading-link
      block.settings.title = 'YOUR BRAND'
      block.settings.heading = 'YOUR BRAND'
      block.settings.text = 'YOUR BRAND'
      block.settings.link_text = 'YOUR BRAND'
    }
    // === PRODUCT TITLE BLOCKS (h2 product__title in featured-product) ===
    // This should use the "Titre du produit" from "Informations sur le produit" section
    else if (blockType === 'product_title' || blockType === 'product-title' || 
        blockType === 'product-title-h2' || blockType === 'product__title' ||
        (blockType === 'title' && (normalizedType === 'featured-product' || normalizedType === 'pdp-main-product' || normalizedType === 'main-product-custom'))) {
      // Use the product title from "Informations sur le produit" section (aiContent.title)
      const productTitle = (aiContent.title as string) || ''
      if (productTitle) {
        block.settings.title = productTitle
        block.settings.heading = productTitle
        block.settings.text = productTitle
        block.settings.h2 = productTitle
      }
    }
    // === TITLE BLOCKS (img-with-txt) ===
    else if (blockType === 'title') {
      let mainCatchy = (aiContent.mainCatchyText as string) || (aiContent.header as string) || ''
      if (mainCatchy) {
        // Add span highlighting to last 2 words if not present
        if (!mainCatchy.includes('<span>')) {
          const words = mainCatchy.split(' ')
          if (words.length > 2) {
            const lastWords = words.splice(-2)
            mainCatchy = words.join(' ') + ' <span>' + lastWords.join(' ') + '</span>'
          }
        }
        block.settings.title = mainCatchy
      }
    }
    
    // === PARAGRAPH BLOCKS ===
    if (blockType === 'paragraph') {
      const subCatchy = (aiContent.subMainCatchyText as string) || (aiContent.description as string) || ''
      if (subCatchy) {
        block.settings.paragraph = subCatchy
      }
    }
    
    // === HEADING BLOCKS ===
    if (blockType === 'heading') {
      // Skip heading blocks for header/navbar sections - they should use "YOUR BRAND"
      if (normalizedType === 'header' || normalizedType === 'navbar' || sectionType.includes('header')) {
        block.settings.heading = 'YOUR BRAND'
        block.settings.title = 'YOUR BRAND'
        block.settings.text = 'YOUR BRAND'
      } else {
        const imageWithText = (aiContent.imageWithText as Record<string, string>) || {}
        if (normalizedType.includes('text-and-image')) {
          block.settings.heading = imageWithText.header || (block.settings.heading as string) || ''
        } else if (normalizedType.includes('image-with-text') || sectionType.includes('image_with_text')) {
          let mainCatchy = (aiContent.mainCatchyText as string) || (aiContent.header as string) || ''
          if (mainCatchy) {
            if (!mainCatchy.includes('<strong>')) {
              mainCatchy = '<strong>' + mainCatchy + '</strong>'
            }
            block.settings.heading = mainCatchy
          }
        } else if (normalizedType.includes('rich-text')) {
          const newHeading = (aiContent.ctaHeading as string) || (aiContent.header as string) || (aiContent.mainCatchyText as string) || null
          if (newHeading) {
            block.settings.heading = newHeading
          }
        }
      }
    }
    
    // === TEXT BLOCKS ===
    if (blockType === 'text' && !['faq', 'product-faq'].includes(normalizedType)) {
      const imageWithText = (aiContent.imageWithText as Record<string, string>) || {}
      if (sectionType.includes('text-and-image')) {
        block.settings.text = '<p>' + (imageWithText.text || '') + '</p>'
      } else if (normalizedType.includes('rich-text')) {
        const text = (aiContent.ctaText as string) || (aiContent.subMainCatchyText as string) || (aiContent.description as string) || ''
        if (text) {
          block.settings.text = '<p>' + text + '</p>'
        }
      }
    }
    
    // === NEWSLETTER BLOCKS ===
    if (normalizedType === 'custom-newsletter') {
      if (block.settings.heading !== undefined) {
        block.settings.heading = (aiContent.newsletterHeading as string) || (block.settings.heading as string)
      }
      if (block.settings.text !== undefined) {
        block.settings.text = (aiContent.newsletterText as string) || (block.settings.text as string)
      }
    }
  }
  
  return blocks
}

/**
 * Apply all content mappings to a section
 */
export function applySectionContent(
  section: { type: string; settings?: BlockSettings; blocks?: Blocks },
  aiContent: AiContent,
  images: DistributedImages = {}
): typeof section {
  const sectionType = section.type || ''
  
  // Apply settings mappings
  if (section.settings) {
    section.settings = applyContentToSettings(sectionType, section.settings, aiContent, images)
  }
  
  // Apply block content mappings
  if (section.blocks && typeof section.blocks === 'object') {
    section.blocks = applyContentToBlocks(sectionType, section.blocks, aiContent, images)
  }
  
  return section
}

/**
 * Migrate old AI content structure to new format.
 * Handles backward compatibility.
 */
export function migrateAiContent(aiContent: AiContent): AiContent {
  // Migrate FAQ format - ensure both 'answer' and 'content' fields exist
  if (Array.isArray(aiContent.faq)) {
    aiContent.faq = (aiContent.faq as FAQ[]).map(faq => {
      if (faq.answer && !faq.content) {
        faq.content = faq.answer
      }
      return faq
    })
  }
  
  // Ensure videoGrid exists with proper structure
  if (!aiContent.videoGrid || typeof aiContent.videoGrid !== 'object') {
    aiContent.videoGrid = {
      heading: (aiContent.socialProofHeading as string) || 'See Real Results From Real Customers',
      subheading: (aiContent.socialProofSubheading as string) || 'Watch how our product transforms everyday life',
    }
  }
  
  // Ensure comparison exists with proper structure
  if (!aiContent.comparison || typeof aiContent.comparison !== 'object') {
    aiContent.comparison = buildComparisonFromDefaults(aiContent)
  } else {
    const comparison = aiContent.comparison as Comparison
    if (!comparison.features) {
      comparison.features = buildComparisonFeaturesFromBenefits(aiContent)
    }
  }
  
  // Ensure newsletter exists with proper structure
  if (!aiContent.newsletter || typeof aiContent.newsletter !== 'object') {
    aiContent.newsletter = {
      heading: 'Join Our Community',
      text: 'Subscribe for exclusive offers, tips, and updates delivered to your inbox',
    }
  }
  
  // Ensure specialOffer exists
  if (!aiContent.specialOffer) {
    aiContent.specialOffer = 'Limited Time: Free Shipping on All Orders!'
  }
  
  // Ensure persuasiveContent exists
  if (!aiContent.persuasiveContent || typeof aiContent.persuasiveContent !== 'object') {
    aiContent.persuasiveContent = {
      header: (aiContent.header as string) || 'Proven Results',
      paragraph: (aiContent.description as string) || '',
    }
  }
  
  // Ensure imageWithText exists
  if (!aiContent.imageWithText || typeof aiContent.imageWithText !== 'object') {
    aiContent.imageWithText = {
      header: (aiContent.header as string) || 'Transform Your Experience Today',
      text: (aiContent.description as string) || 'Discover the perfect combination of quality and innovation',
    }
  }
  
  // Ensure timeline exists with proper structure (5 steps for template)
  const defaultTimeline = [
    { step: 'Step 1', timeframe: 'Unbox & Setup', description: 'Open your package and get started in seconds' },
    { step: 'Step 2', timeframe: 'Quick Install', description: 'Follow simple instructions for easy setup' },
    { step: 'Step 3', timeframe: 'Start Using', description: 'Begin enjoying the benefits right away' },
    { step: 'Step 4', timeframe: 'See Results', description: 'Experience the transformation in days' },
    { step: 'Step 5', timeframe: 'Long-Term Value', description: 'Enjoy lasting quality and performance over time' },
  ]
  if (!Array.isArray(aiContent.timeline)) {
    aiContent.timeline = defaultTimeline
  } else if ((aiContent.timeline as TimelinePoint[]).length < 5) {
    const currentCount = (aiContent.timeline as TimelinePoint[]).length
    for (let i = currentCount; i < 5; i++) {
      (aiContent.timeline as TimelinePoint[]).push(defaultTimeline[i])
    }
  }
  
  // Ensure clinicalResults exists with proper structure
  if (!Array.isArray(aiContent.clinicalResults) || (aiContent.clinicalResults as ClinicalResult[]).length < 4) {
    aiContent.clinicalResults = [
      { percentage: 95, title: 'Customer Satisfaction', description: 'Customer satisfaction rate' },
      { percentage: 89, title: 'Visible Improvement', description: 'Report visible improvement' },
      { percentage: 92, title: 'Recommendations', description: 'Would recommend to others' },
      { percentage: 87, title: 'Quick Results', description: 'Notice difference in first week' },
    ]
  }
  
  // Ensure guarantees exists
  if (!Array.isArray(aiContent.guarantees) || (aiContent.guarantees as string[]).length < 3) {
    aiContent.guarantees = ['30-Day Risk Free', 'Free Shipping', 'Easy Returns']
  }
  
  // Ensure benefitsHeading exists
  if (!aiContent.benefitsHeading) {
    aiContent.benefitsHeading = (aiContent.featureHeader as string) || 'What Makes Us Different'
  }
  
  // Ensure benefitsParagraph exists
  if (!aiContent.benefitsParagraph) {
    aiContent.benefitsParagraph = (aiContent.featureSubheader as string) || 'Discover the key features that set our product apart from the competition.'
  }
  
  // Ensure faqHeading exists
  if (!aiContent.faqHeading) {
    aiContent.faqHeading = 'Frequently Asked Questions'
  }
  
  return aiContent
}

/**
 * Build comparison structure from defaults.
 */
function buildComparisonFromDefaults(aiContent: AiContent): Comparison {
  return {
    heading: 'Why Choose ' + ((aiContent.store_name as string) || 'Us'),
    subheading: 'See the difference that matters',
    our_name: (aiContent.store_name as string) || 'Us',
    others_name: 'Others',
    features: buildComparisonFeaturesFromBenefits(aiContent),
  }
}

/**
 * Build comparison features from benefits or defaults.
 */
function buildComparisonFeaturesFromBenefits(aiContent: AiContent): ComparisonFeature[] {
  const features: ComparisonFeature[] = []
  
  // Try to use benefits if available
  if (Array.isArray(aiContent.benefits)) {
    const benefits = aiContent.benefits as (string | Feature)[]
    const benefitCount = Math.min(4, benefits.length)
    for (let i = 0; i < benefitCount; i++) {
      const benefit = benefits[i]
      features.push({
        feature: typeof benefit === 'string' ? benefit : (benefit.title || 'Feature'),
        us: 'yes',
        others: i === benefitCount - 1 ? 'partial' : 'no',
      })
    }
  }
  
  // If not enough benefits, use defaults
  if (features.length < 4) {
    const defaults = [
      { feature: 'Premium Quality Materials', us: 'yes', others: 'no' },
      { feature: 'Free Shipping Included', us: 'yes', others: 'no' },
      { feature: '30-Day Money Back Guarantee', us: 'yes', others: 'partial' },
      { feature: '24/7 Customer Support', us: 'yes', others: 'no' },
    ]
    features.push(...defaults.slice(features.length))
  }
  
  return features.slice(0, 4)
}

/**
 * Distribute product images across sections smartly
 */
export function distributeImagesToSections(
  aiContent: AiContent,
  productImages: Array<{ src: string }> | string[]
): DistributedImages {
  const placeholder = 'https://placehold.co/600x600/png?text=Product'
  
  // Normalize images to string array
  const images: string[] = productImages.map(img => 
    typeof img === 'string' ? img : img.src
  )
  
  const count = images.length
  
  // Get user-selected images from editedContent (these take priority!)
  const selectedHeroImage = (aiContent.selectedHeroImage as string)
  const selectedBenefitsImage = (aiContent.selectedBenefitsImage as string)
  const selectedClinicalImage = (aiContent.selectedClinicalImage as string)
  const timelineImage = (aiContent.timelineImage as string)
  const faqImage = (aiContent.faqImage as string)
  const imageWithTextImage = (aiContent.imageWithTextImage as string)
  const productSectionImages = (aiContent.productSectionImage as string[])
  // Comparison images
  const comparisonOurImage = (aiContent.comparisonOurImage as string)
  const comparisonOthersImage = (aiContent.comparisonOthersImage as string)
  // Benefits secondary image
  const selectedBenefitsImage2 = (aiContent.selectedBenefitsImage2 as string)
  
  if (count === 0) {
    return {
      featuredImage: placeholder,
      landingPageImage: selectedHeroImage || (aiContent.selectedLandingPageImage as string) || (aiContent.landingPageImage as string) || placeholder,
      productSectionImage: (productSectionImages && productSectionImages[0]) || placeholder,
      imageWithTextImage: imageWithTextImage || placeholder,
      statisticsImage: selectedClinicalImage || (aiContent.clinicalImage as string) || (aiContent.statisticsImage as string) || placeholder,
      timelineImage: timelineImage || placeholder,
      benefitsImage: selectedBenefitsImage || (aiContent.benefitsImage as string) || placeholder,
      benefitsImage2: selectedBenefitsImage2 || placeholder,
      faqImage: faqImage || placeholder,
      comparisonOurImage: comparisonOurImage || (aiContent.comparisonImage as string) || placeholder,
      comparisonOthersImage: comparisonOthersImage || placeholder,
      heroImages: productSectionImages || [],
    }
  }
  
  // Distribute images intelligently, prioritizing USER-selected images over defaults
  return {
    featuredImage: images[0],
    // Hero / Landing page - user selection first
    landingPageImage: selectedHeroImage || (aiContent.selectedLandingPageImage as string) || (aiContent.landingPageImage as string) || images[0],
    // Product section images (multiple)
    productSectionImage: (productSectionImages && productSectionImages[0]) || images[Math.min(1, count - 1)],
    // Image with text section
    imageWithTextImage: imageWithTextImage || images[Math.min(2, count - 1)],
    // Statistics/Clinical section - user selection first
    statisticsImage: selectedClinicalImage || (aiContent.clinicalImage as string) || (aiContent.statisticsImage as string) || images[Math.min(3, count - 1)],
    // Timeline section - user selection first
    timelineImage: timelineImage || images[Math.min(4, count - 1)],
    // Benefits section - user selection first
    benefitsImage: selectedBenefitsImage || (aiContent.benefitsImage as string) || images[Math.min(1, count - 1)],
    benefitsImage2: selectedBenefitsImage2 || images[Math.min(2, count - 1)],
    // FAQ section - user selection first
    faqImage: faqImage || images[Math.min(2, count - 1)],
    // Comparison table - separate images for our product and others
    comparisonOurImage: comparisonOurImage || (aiContent.comparisonImage as string) || images[0],
    comparisonOthersImage: comparisonOthersImage || images[Math.min(1, count - 1)] || images[0],
    // Hero images array for galleries
    heroImages: productSectionImages || images.slice(0, 5),
  }
}

