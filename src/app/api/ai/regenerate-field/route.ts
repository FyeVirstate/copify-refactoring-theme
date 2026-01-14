import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ClaudeAIService } from "@/lib/services/claude";

// Language mapping - supports both language codes (en, fr) and country codes (GB, US, FR)
const LANGUAGE_MAP: Record<string, string> = {
  // Language codes
  'en': 'English',
  'fr': 'French',
  'es': 'Spanish',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'nl': 'Dutch',
  // Country codes (uppercase) - common ones used by AliExpress/Amazon
  'GB': 'English',
  'US': 'English',
  'UK': 'English',
  'AU': 'English',
  'CA': 'English',
  'FR': 'French',
  'ES': 'Spanish',
  'DE': 'German',
  'IT': 'Italian',
  'PT': 'Portuguese',
  'NL': 'Dutch',
  'BE': 'French', // Belgium - French default
  'CH': 'German', // Switzerland - German default
  'AT': 'German', // Austria
  'MX': 'Spanish', // Mexico
  'BR': 'Portuguese', // Brazil
};

// Detect language from text (fallback)
function detectLanguage(text: string): string {
  const lower = text.toLowerCase();
  if (/[àâçéèêëîïôùûüœ]/.test(lower)) return 'fr';
  if (/[áéíóúñü]/.test(lower)) return 'es';
  if (/[äöüß]/.test(lower)) return 'de';
  return 'en';
}

// Build regeneration prompt based on field type (mirrors Laravel buildRegenerationPrompt)
function buildRegenerationPrompt(
  fieldType: string,
  currentValue: string,
  language: string,
  seed?: string,
  productTitle?: string,
  productDescription?: string
): string {
  // Resolve language
  let lang = LANGUAGE_MAP[language];
  if (!lang) {
    const detected = detectLanguage(currentValue + (seed || ''));
    lang = LANGUAGE_MAP[detected] || 'English';
  }

  // Build product context
  let productInfo = '';
  if (productTitle || productDescription) {
    productInfo = "PRODUCT CONTEXT:\n";
    if (productTitle) productInfo += `Product: ${productTitle}\n`;
    if (productDescription) productInfo += `Description: ${productDescription}\n`;
    productInfo += "\n";
  }

  // Global instructions (anti-hallucination / tone consistency)
  let base = "You are a senior e-commerce copywriter.\n";
  base += "GLOBAL RULES:\n";
  base += `• Write ONLY in ${lang}.\n`;
  base += "• OUTPUT: return ONLY the rewritten text (no quotes, no markdown, no explanations, no emojis).\n";
  base += "• CRITICAL: You MUST create a COMPLETELY DIFFERENT variation. Do NOT return the same text or minor edits.\n";
  base += "• Use DIFFERENT words, synonyms, sentence structure, and angle than the CURRENT DRAFT.\n";
  base += "• Keep the SAME meaning and intent, but express it in a fresh, creative way.\n";
  base += "• Length: keep approximately the same length as the CURRENT DRAFT (±10%), unless a field-specific limit applies.\n";
  base += "• No ALL-CAPS, no spam punctuation (max one !), no hashtags, no new links.\n";
  base += "• Preserve locale conventions (units, currency, decimal format) if present.\n\n";

  // Build context section
  let context = productInfo;
  context += `ORIGINAL TEXT TO REWRITE:\n"${currentValue}"\n\n`;
  context += "IMPORTANT: Generate a FRESH variation that is noticeably DIFFERENT from the original.\n\n";

  // Field-specific logic
  let task = '';
  let suffix = '';

  switch (fieldType) {
    case 'title':
      task = "TASK: Rewrite this PRODUCT TITLE with different words.\n";
      task += "RULES: Keep it short (≤60 chars), no punctuation at end.\n\n";
      suffix = `Return only the new title in ${lang}:`;
      break;

    case 'headline':
      task = "TASK: Rewrite this HEADLINE with a fresh angle.\n";
      task += "RULES: Punchy, compelling, max 90 characters.\n\n";
      suffix = `Return only the new headline in ${lang}:`;
      break;

    case 'description':
      task = "TASK: Rewrite this DESCRIPTION with different phrasing.\n";
      task += "RULES: Keep same meaning, 2-4 sentences, benefit-focused.\n\n";
      suffix = `Return only the new description in ${lang}:`;
      break;

    case 'shipping':
      task = "TASK: Rewrite this SHIPPING INFO with clearer wording.\n";
      task += "RULES: Keep same policies/timelines, 1-3 sentences.\n\n";
      suffix = `Return only the new shipping info in ${lang}:`;
      break;

    case 'testimonial':
      task = "TASK: Rewrite this TESTIMONIAL with a different voice.\n";
      task += "RULES: Same satisfaction level, 1-2 sentences, authentic tone.\n\n";
      suffix = `Return only the new testimonial in ${lang}:`;
      break;

    case 'faq':
      task = "TASK: Rewrite this FAQ ANSWER with clearer explanation.\n";
      task += "RULES: Same info, 1-3 sentences.\n\n";
      suffix = `Return only the new answer in ${lang}:`;
      break;

    case 'benefit':
      task = "TASK: Rewrite this SHORT BENEFIT with different words.\n";
      task += "RULES: STRICT MAX 3-4 words, action-oriented, no punctuation.\n\n";
      suffix = `Return only the new benefit in ${lang} (max 4 words):`;
      break;

    case 'benefit_description':
      task = "TASK: Rewrite this BENEFIT DESCRIPTION differently.\n";
      task += "RULES: 1 sentence, max 80 characters, explain WHY it matters.\n\n";
      suffix = `Return only the description in ${lang}:`;
      break;

    case 'paragraph':
      task = "TASK: Rewrite this PARAGRAPH with fresh wording.\n";
      task += "RULES: 1-3 sentences, engaging, benefit-focused.\n\n";
      suffix = `Return the new paragraph in ${lang}:`;
      break;

    case 'feature':
      task = "TASK: Rewrite this FEATURE with different phrasing.\n";
      task += "RULES: Same capability, 1 compact sentence.\n\n";
      suffix = `Return the new feature in ${lang}:`;
      break;

    case 'question':
      task = "TASK: Rewrite this FAQ QUESTION differently.\n";
      task += "RULES: Same topic, natural conversational tone.\n\n";
      suffix = `Return only the new question in ${lang}:`;
      break;

    case 'percentage':
      task = "TASK: Generate a different percentage (75-99%).\n";
      task += "RULES: Format XX%, believable for product claims.\n\n";
      suffix = `Return only the percentage:`;
      break;

    case 'stat_description':
      task = "TASK: Rewrite this STATISTIC DESCRIPTION.\n";
      task += "RULES: 5-10 words max, measurable outcome.\n\n";
      suffix = `Return the description in ${lang}:`;
      break;

    case 'button_cta':
      task = "TASK: Rewrite this CTA BUTTON TEXT.\n";
      task += "RULES: 2-4 words MAXIMUM, action-oriented, creates urgency or desire.\n";
      task += "EXAMPLES: 'Shop Now', 'Get Yours Today', 'Discover More', 'Start Your Journey', 'Claim Your Deal'\n\n";
      suffix = `Return only the new button text in ${lang} (2-4 words max):`;
      break;

    case 'timeline_step':
      task = "TASK: Rewrite this TIMELINE STEP label.\n";
      task += "RULES: 2-4 words max (e.g., 'Week 1', 'Step 2').\n\n";
      suffix = `Return only the step label in ${lang}:`;
      break;

    case 'timeline_description':
      task = "TASK: Rewrite this STEP DESCRIPTION.\n";
      task += "RULES: 1-2 sentences, describe results.\n\n";
      suffix = `Return the description in ${lang}:`;
      break;

    default: // 'text'
      task = "TASK: Rewrite this TEXT with completely different wording.\n";
      task += "RULES: Keep same meaning and approximate length.\n\n";
      suffix = `Return the new text in ${lang}:`;
      break;
  }

  return base + task + context + suffix;
}

// Build prompt for GENERATING new content from scratch (when field is empty)
function buildGenerationPrompt(
  fieldType: string,
  language: string,
  productTitle?: string,
  productDescription?: string
): string {
  let lang = LANGUAGE_MAP[language] || 'French';

  // Build product context
  let productInfo = '';
  if (productTitle || productDescription) {
    productInfo = "PRODUCT CONTEXT:\n";
    if (productTitle) productInfo += `Product: ${productTitle}\n`;
    if (productDescription) productInfo += `Description: ${productDescription}\n`;
    productInfo += "\n";
  }

  let base = "You are a senior e-commerce copywriter.\n";
  base += "GLOBAL RULES:\n";
  base += `• Write ONLY in ${lang}.\n`;
  base += "• OUTPUT: return ONLY the generated text (no quotes, no markdown, no explanations, no emojis).\n";
  base += "• Create compelling, benefit-focused copy based on the product context.\n";
  base += "• No ALL-CAPS, no spam punctuation (max one !), no hashtags.\n\n";

  let task = '';
  let suffix = '';

  switch (fieldType) {
    case 'title':
      task = "TASK: Generate a compelling PRODUCT TITLE.\n";
      task += "RULES: Short (≤60 chars), catchy, benefit-oriented.\n\n";
      suffix = `Generate a product title in ${lang}:`;
      break;
    case 'headline':
      task = "TASK: Generate a powerful HEADLINE for the product page.\n";
      task += "RULES: Punchy, compelling, max 90 characters, create desire.\n\n";
      suffix = `Generate a headline in ${lang}:`;
      break;
    case 'description':
      task = "TASK: Generate an engaging PRODUCT DESCRIPTION.\n";
      task += "RULES: 2-4 sentences, benefit-focused, persuasive.\n\n";
      suffix = `Generate a description in ${lang}:`;
      break;
    case 'benefit':
      task = "TASK: Generate a SHORT BENEFIT for the product.\n";
      task += "RULES: STRICT MAX 3-4 words, action-oriented, no punctuation.\n\n";
      suffix = `Generate a short benefit in ${lang} (max 4 words):`;
      break;
    case 'feature':
      task = "TASK: Generate a FEATURE description for the product.\n";
      task += "RULES: 1 compact sentence, highlight a capability.\n\n";
      suffix = `Generate a feature in ${lang}:`;
      break;
    case 'testimonial':
      task = "TASK: Generate a customer TESTIMONIAL for the product.\n";
      task += "RULES: 1-2 sentences, authentic voice, specific benefit mentioned.\n\n";
      suffix = `Generate a testimonial in ${lang}:`;
      break;
    case 'faq':
      task = "TASK: Generate an FAQ ANSWER about the product.\n";
      task += "RULES: 1-3 sentences, clear and helpful.\n\n";
      suffix = `Generate an FAQ answer in ${lang}:`;
      break;
    case 'question':
      task = "TASK: Generate an FAQ QUESTION about the product.\n";
      task += "RULES: Natural, conversational, customer perspective.\n\n";
      suffix = `Generate a question in ${lang}:`;
      break;
    case 'shipping':
      task = "TASK: Generate SHIPPING INFO text.\n";
      task += "RULES: 1-2 sentences, reassuring, mention fast delivery.\n\n";
      suffix = `Generate shipping info in ${lang}:`;
      break;
    case 'paragraph':
      task = "TASK: Generate an engaging PARAGRAPH for a product section.\n";
      task += "RULES: 1-3 sentences, benefit-focused.\n\n";
      suffix = `Generate a paragraph in ${lang}:`;
      break;
    case 'button_cta':
      task = "TASK: Generate a CTA BUTTON TEXT for an e-commerce product page.\n";
      task += "RULES: 2-4 words MAXIMUM, action-oriented, creates urgency or desire.\n";
      task += "EXAMPLES: 'Shop Now', 'Get Yours Today', 'Discover More', 'Start Your Journey', 'Claim Offer'\n\n";
      suffix = `Generate a button text in ${lang} (2-4 words max):`;
      break;
    default:
      task = "TASK: Generate appropriate TEXT for a product page element.\n";
      task += "RULES: Concise, compelling, benefit-oriented.\n\n";
      suffix = `Generate the text in ${lang}:`;
      break;
  }

  return base + productInfo + task + suffix;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      fieldName, 
      currentValue, 
      fieldType = 'text',
      productTitle, 
      productDescription, 
      language = 'fr',
      seed,
      generateIfEmpty = false  // If true, generate new content even if empty
    } = body;

    if (!fieldName) {
      return NextResponse.json({ error: "Field name is required" }, { status: 400 });
    }

    // Use seed or currentValue as the base
    const valueToRegenerate = currentValue || seed || '';
    const isEmpty = !valueToRegenerate || valueToRegenerate.trim() === '';
    
    // Handle numeric values (randomize within range)
    if (!isEmpty && !isNaN(Number(valueToRegenerate)) && valueToRegenerate.trim() !== '') {
      const number = parseFloat(valueToRegenerate);
      let newValue: number;

      if (number <= 100) {
        const min = Math.max(0, number - 20);
        const max = Math.min(100, number + 20);
        newValue = Math.round((Math.random() * (max - min) + min) * 10) / 10;
      } else {
        const min = Math.max(1, number * 0.7);
        const max = number * 1.3;
        newValue = Math.round(Math.random() * (max - min) + min);
      }

      return NextResponse.json({
        success: true,
        fieldName,
        newValue: String(newValue),
        type: 'number'
      });
    }

    // Build prompt based on field type
    let prompt: string;
    
    if (isEmpty) {
      // Generate NEW content from scratch using product context
      prompt = buildGenerationPrompt(fieldType, language, productTitle, productDescription);
    } else {
      // Regenerate/rewrite existing content
      prompt = buildRegenerationPrompt(
        fieldType,
        valueToRegenerate,
        language,
        seed,
        productTitle,
        productDescription
      );
    }

    // Use Claude AI to regenerate
    const claudeService = new ClaudeAIService();
    const response = await claudeService.generateContent(prompt);

    if (!response) {
      return NextResponse.json(
        { error: "Failed to generate content" },
        { status: 500 }
      );
    }

    // Clean up the response (remove quotes, markdown, etc.)
    let cleanValue = response.trim();
    // Remove surrounding quotes
    cleanValue = cleanValue.replace(/^["'`]|["'`]$/g, '');
    // Remove markdown formatting
    cleanValue = cleanValue.replace(/^\*\*|\*\*$/g, '');
    cleanValue = cleanValue.replace(/^__|__$/g, '');
    // Remove any "Here is..." prefix
    cleanValue = cleanValue.replace(/^(Here is|Here's|Voici|Voilà)[^:]*:\s*/i, '');

    return NextResponse.json({ 
      success: true, 
      fieldName,
      newValue: cleanValue,
      originalValue: currentValue,
      type: fieldType
    });

  } catch (error) {
    console.error("Error regenerating field:", error);
    return NextResponse.json(
      { error: "Error regenerating content" },
      { status: 500 }
    );
  }
}
