/**
 * Color Palette Generation Service
 * 
 * Analyzes product images and generates harmonious color palettes
 * using OpenAI GPT-4 Vision
 */

const API_URL = 'https://api.openai.com/v1';

// Color palette type
export interface ColorPalette {
  primary: string;      // Main brand color
  secondary: string;    // Secondary color
  accent: string;       // Accent/highlight color
  background: string;   // Background color
  text: string;         // Text color
  buttonText: string;   // Button text color
  name: string;         // Palette name
  description: string;  // Why this palette works
}

// Default palettes as fallback
const DEFAULT_PALETTES: ColorPalette[] = [
  {
    primary: '#0C6CFB',
    secondary: '#6366f1',
    accent: '#f59e0b',
    background: '#ffffff',
    text: '#1f2937',
    buttonText: '#ffffff',
    name: 'Modern Blue',
    description: 'Clean and professional blue theme'
  },
  {
    primary: '#10b981',
    secondary: '#059669',
    accent: '#f97316',
    background: '#ffffff',
    text: '#1f2937',
    buttonText: '#ffffff',
    name: 'Fresh Green',
    description: 'Natural and eco-friendly feel'
  },
  {
    primary: '#8b5cf6',
    secondary: '#a855f7',
    accent: '#ec4899',
    background: '#ffffff',
    text: '#1f2937',
    buttonText: '#ffffff',
    name: 'Purple Dream',
    description: 'Luxurious and creative vibe'
  },
  {
    primary: '#ef4444',
    secondary: '#f97316',
    accent: '#eab308',
    background: '#ffffff',
    text: '#1f2937',
    buttonText: '#ffffff',
    name: 'Energetic Red',
    description: 'Bold and attention-grabbing'
  },
  {
    primary: '#14b8a6',
    secondary: '#06b6d4',
    accent: '#f59e0b',
    background: '#ffffff',
    text: '#1f2937',
    buttonText: '#ffffff',
    name: 'Ocean Teal',
    description: 'Fresh and calming aesthetic'
  }
];

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Generate color palette using OpenAI GPT-4 Vision
 */
async function generateWithOpenAI(
  imageUrl: string,
  productTitle: string
): Promise<ColorPalette> {
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const prompt = `You are an expert e-commerce UI/UX designer. Analyze this product image and suggest the PERFECT color palette for a high-converting Shopify store selling this product.

Product: ${productTitle}

Based on the product's appearance, colors, and target market, provide a color palette that will:
1. Complement the product colors (pick colors that enhance how the product looks)
2. Create a professional, trustworthy appearance
3. Maximize conversion rates
4. Be visually appealing

Return your response as a JSON object with ONLY these fields (no markdown, no code blocks, just raw JSON):
{
  "primary": "#HEXCOLOR",
  "secondary": "#HEXCOLOR", 
  "accent": "#HEXCOLOR",
  "background": "#FFFFFF",
  "text": "#1f2937",
  "buttonText": "#ffffff",
  "name": "Palette Name (2-3 words)",
  "description": "One sentence explaining why this palette works"
}

RULES:
- Primary: Main brand color that complements/contrasts with the product
- Secondary: Supporting color, similar family as primary
- Accent: Contrasting color for CTAs, buttons, highlights (should POP)
- Background: Keep it light (#ffffff or very light shade)
- Text: Keep it dark for readability
- Choose colors that make the PRODUCT stand out and look premium
- Return ONLY valid JSON, nothing else`;

  const response = await fetch(`${API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'low',
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('[Color Palette] OpenAI API error:', error);
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const result: ChatCompletionResponse = await response.json();
  const textResponse = result.choices[0]?.message?.content;
  
  if (!textResponse) {
    throw new Error('No response from OpenAI');
  }

  // Clean response (remove markdown code blocks if present)
  let jsonStr = textResponse.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  }

  const palette = JSON.parse(jsonStr) as ColorPalette;
  
  // Validate the palette has all required fields
  if (!palette.primary || !palette.accent || !palette.background) {
    throw new Error('Invalid palette response from AI');
  }
  
  return palette;
}

/**
 * Main function to generate color palette from product image
 * 
 * @param imageUrl - URL of the product image (preferably AI-generated or main product image)
 * @param productTitle - Product title for context
 * @returns ColorPalette object with suggested colors
 */
export async function generateColorPalette(
  imageUrl: string,
  productTitle: string
): Promise<ColorPalette> {
  console.log(`[Color Palette] Analyzing image for: ${productTitle}`);
  
  // Validate image URL
  if (!imageUrl || !imageUrl.startsWith('http')) {
    console.warn('[Color Palette] Invalid image URL, using default palette');
    return DEFAULT_PALETTES[0];
  }

  try {
    // Use OpenAI GPT-4 Vision
    if (process.env.OPENAI_API_KEY) {
      console.log('[Color Palette] Using OpenAI GPT-4 Vision...');
      const palette = await generateWithOpenAI(imageUrl, productTitle);
      console.log(`[Color Palette] ✅ Generated: ${palette.name} (Primary: ${palette.primary})`);
      return palette;
    }
    
    // No AI provider available
    throw new Error('No AI provider configured for color analysis');
    
  } catch (error) {
    console.error('[Color Palette] AI analysis failed:', error);
    
    // Return a smart default
    const defaultPalette = DEFAULT_PALETTES[Math.floor(Math.random() * DEFAULT_PALETTES.length)];
    console.log(`[Color Palette] Using default: ${defaultPalette.name}`);
    return defaultPalette;
  }
}

/**
 * Get all default palettes
 */
export function getDefaultPalettes(): ColorPalette[] {
  return DEFAULT_PALETTES;
}

/**
 * Convert palette to store settings format
 */
export function paletteToStoreSettings(palette: ColorPalette): {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  colorPaletteName: string;
  colorPaletteDescription: string;
} {
  return {
    colors: {
      primary: palette.primary,
      secondary: palette.secondary,
      accent: palette.accent,
      background: palette.background,
      text: palette.text,
    },
    colorPaletteName: palette.name,
    colorPaletteDescription: palette.description,
  };
}
