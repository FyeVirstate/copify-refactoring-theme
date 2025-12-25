/**
 * OpenAI Service - Migrated from Laravel OpenAIService.php
 * 
 * Features:
 * - Content generation with GPT-4o-mini
 * - Image generation with DALL-E 3
 */

const API_URL = 'https://api.openai.com/v1'

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface ImageGenerationResponse {
  data: Array<{
    url: string
    revised_prompt?: string
  }>
}

export class OpenAIService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY!
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not set')
    }
  }

  /**
   * Generate content using GPT-4o-mini
   */
  async generateContent(
    prompt: string,
    options: {
      model?: string
      maxTokens?: number
      temperature?: number
    } = {}
  ): Promise<string | null> {
    const {
      model = 'gpt-4o-mini',
      maxTokens = 1500,
      temperature = 0.8,
    } = options

    try {
      const response = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('OpenAI API error:', error)
        return null
      }

      const result: ChatCompletionResponse = await response.json()
      return result.choices[0]?.message?.content ?? null
    } catch (error) {
      console.error('OpenAI API error:', error)
      return null
    }
  }

  /**
   * Generate product description
   */
  async generateProductDescription(
    productInfo: {
      title: string
      category?: string
      features?: string[]
      targetAudience?: string
    },
    language: string = 'en'
  ): Promise<string | null> {
    const prompt = `You are a professional e-commerce copywriter. Generate a compelling product description for:

Product: ${productInfo.title}
Category: ${productInfo.category || 'General'}
Features: ${productInfo.features?.join(', ') || 'Not specified'}
Target Audience: ${productInfo.targetAudience || 'General consumers'}

Write in ${language === 'fr' ? 'French' : 'English'}.

Requirements:
- Engaging and persuasive tone
- Highlight key benefits
- Include a call to action
- Keep it concise (150-200 words)
- Format with bullet points for features

Return only the product description.`

    return this.generateContent(prompt)
  }

  /**
   * Generate image using DALL-E 3
   */
  async generateImage(
    prompt: string,
    options: {
      size?: '1024x1024' | '1024x1792' | '1792x1024'
      quality?: 'standard' | 'hd'
      style?: 'vivid' | 'natural'
    } = {}
  ): Promise<string | null> {
    const {
      size = '1024x1024',
      quality = 'standard',
      style = 'natural',
    } = options

    try {
      const response = await fetch(`${API_URL}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size,
          quality,
          style,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('OpenAI Image API error:', error)
        return null
      }

      const result: ImageGenerationResponse = await response.json()
      return result.data[0]?.url ?? null
    } catch (error) {
      console.error('OpenAI Image API error:', error)
      return null
    }
  }

  /**
   * Generate ad copy for a product
   */
  async generateAdCopy(
    productInfo: {
      title: string
      price: number
      currency: string
      benefits: string[]
    },
    platform: 'facebook' | 'tiktok' | 'google' = 'facebook',
    language: string = 'en'
  ): Promise<{ headline: string; primaryText: string; callToAction: string } | null> {
    const prompt = `You are an expert e-commerce ad copywriter. Generate ad copy for ${platform} ads:

Product: ${productInfo.title}
Price: ${productInfo.currency}${productInfo.price}
Benefits: ${productInfo.benefits.join(', ')}

Write in ${language === 'fr' ? 'French' : 'English'}.

Return a JSON object with:
{
  "headline": "Short attention-grabbing headline (max 40 chars)",
  "primaryText": "Compelling ad text (max 125 chars for FB)",
  "callToAction": "Action phrase (e.g., Shop Now, Learn More)"
}

Return only valid JSON.`

    const content = await this.generateContent(prompt)
    if (!content) return null

    try {
      return JSON.parse(content.trim())
    } catch {
      return null
    }
  }
}

// Singleton instance
let openaiService: OpenAIService | null = null

export function getOpenAIService(): OpenAIService {
  if (!openaiService) {
    openaiService = new OpenAIService()
  }
  return openaiService
}
