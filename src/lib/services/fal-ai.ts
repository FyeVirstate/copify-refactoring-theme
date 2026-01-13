/**
 * FAL AI Service - Exact mirror of Laravel GenerateAIImagesJob.php
 * 
 * Uses FAL AI for:
 * - Background removal (fal-ai/bria/background/remove)
 * - Image generation (fal-ai/nano-banana/edit)
 * 
 * Uses OpenAI GPT-4o for prompt generation
 */

const FAL_BASE_URL = 'https://fal.run'
const OPENAI_BASE_URL = 'https://api.openai.com/v1'

export interface GeneratedImage {
  index: number
  image_type: string
  special_index: number
  prompt: string
  image_url: string
  image_url_no_bg: string | null
}

export interface GenerationProgress {
  step: number
  totalSteps: number
  stepName: string
  stepDescription: string
  images?: GeneratedImage[]
  error?: string
}

export interface GenerationResult {
  success: boolean
  total_images: number
  recommended_images: GeneratedImage[]
  processing_time: number
  error?: string
}

export interface ProductInfo {
  summary_product: string
  product_description: string
  shot_description_helper: string
}

// Steps for progress tracking
export const GENERATION_STEPS = [
  { step: 1, name: 'Préparation', description: 'Téléchargement de l\'image originale...' },
  { step: 2, name: 'Suppression du fond', description: 'Suppression de l\'arrière-plan avec IA...' },
  { step: 3, name: 'Génération des prompts', description: 'Création des prompts personnalisés avec GPT-4o...' },
  { step: 4, name: 'Génération des images', description: 'Génération de 5 images en parallèle avec FAL AI...' },
  { step: 5, name: 'Finalisation', description: 'Téléchargement et sauvegarde des images...' },
]

export class FalAIService {
  private falKey: string
  private openaiKey: string

  constructor() {
    this.falKey = process.env.FAL_KEY || process.env.FAL_API_KEY || ''
    this.openaiKey = process.env.OPENAI_API_KEY || ''
    
    // Debug logging for API keys (masked)
    console.log('[FAL-AI] Service initializing...')
    console.log('[FAL-AI] FAL_KEY configured:', this.falKey ? `${this.falKey.substring(0, 8)}...` : 'NOT SET')
    console.log('[FAL-AI] OPENAI_API_KEY configured:', this.openaiKey ? `${this.openaiKey.substring(0, 8)}...` : 'NOT SET')
    
    if (!this.falKey) {
      console.error('[FAL-AI] ❌ FAL_KEY is not set - image generation will fail')
      console.error('[FAL-AI] Please add FAL_KEY=your_key to your .env.local file')
    }
    if (!this.openaiKey) {
      console.error('[FAL-AI] ❌ OPENAI_API_KEY is not set - prompt generation will fail')
      console.error('[FAL-AI] Please add OPENAI_API_KEY=your_key to your .env.local file')
    }
  }

  /**
   * Normalize image URL - add https:// if missing
   */
  private normalizeImageUrl(url: string): string {
    if (!url) return url
    url = url.trim()
    
    if (url.startsWith('//')) {
      return 'https:' + url
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url
    }
    
    return url
  }

  /**
   * Check if URL is a Replicate delivery URL (we want to avoid these)
   */
  private isReplicateUrl(url: string): boolean {
    if (!url) return false
    return url.toLowerCase().includes('replicate.delivery')
  }

  /**
   * Download image and return as base64
   */
  async downloadImage(imageUrl: string): Promise<{ data: Buffer; base64: string }> {
    const normalizedUrl = this.normalizeImageUrl(imageUrl)
    
    const response = await fetch(normalizedUrl, {
      headers: {
        'Accept': 'image/*',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to download image: HTTP ${response.status}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    
    return { data: buffer, base64 }
  }

  /**
   * Remove background using fal-ai/bria/background/remove
   * Mirrors Laravel removeBackground() method
   */
  async removeBackground(imageUrl: string): Promise<{ success: boolean; image_url?: string; error?: string }> {
    try {
      console.log('[FAL-AI] Removing image background...')
      
      const response = await fetch(`${FAL_BASE_URL}/fal-ai/bria/background/remove`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.falKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageUrl
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.image?.url) {
          console.log('[FAL-AI] ✅ Background removed successfully')
          return {
            success: true,
            image_url: result.image.url
          }
        }
      }

      const errorText = await response.text()
      return {
        success: false,
        error: 'No image generated: ' + errorText
      }

    } catch (error) {
      console.error('[FAL-AI] Error removing background:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Extract product info directly from aiContent (no ChatGPT call needed)
   * Mirrors Laravel extractProductInfoFromMoreDetailed() method
   */
  extractProductInfo(aiContent: Record<string, unknown>): ProductInfo {
    let description = ''
    let summary = ''

    if (aiContent.description) {
      description = aiContent.description as string
    }
    if (aiContent.title) {
      summary = aiContent.title as string
    }
    if (aiContent.howItWorks) {
      description += '\n\n' + aiContent.howItWorks
    }
    if (aiContent.features && Array.isArray(aiContent.features)) {
      description += '\n\nFeatures: ' + (aiContent.features as string[]).join(', ')
    }
    if (aiContent.benefits && Array.isArray(aiContent.benefits)) {
      description += '\n\nBenefits: ' + (aiContent.benefits as string[]).join(', ')
    }

    let helper = 'Professional e-commerce product photography. '
    if (aiContent.productFeatures && Array.isArray(aiContent.productFeatures)) {
      helper += 'Highlight key features. '
    }

    console.log('[FAL-AI] ✅ Product info extracted directly (no ChatGPT call)')

    return {
      summary_product: summary,
      product_description: description,
      shot_description_helper: helper
    }
  }

  /**
   * Generate 5 specialized prompts using ChatGPT GPT-4o
   * Mirrors Laravel generateSpecialPrompts() method
   */
  async generateSpecialPrompts(
    productDescription: string,
    imageBase64: string,
    excludeText: boolean = false,
    summaryProduct: string = '',
    shotDescriptionHelper: string = ''
  ): Promise<string[]> {
    try {
      const textInstruction = excludeText ? 'No text in images.' : ''

      const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert professional e-commerce visual creator. Generate exactly 5 specialized prompts for product photography.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Product Description: ${productDescription}\n` +
                    (summaryProduct ? `Product Summary: ${summaryProduct}\n` : '') +
                    (shotDescriptionHelper ? `Photography Guidelines: ${shotDescriptionHelper}\n` : '') +
                    `\n${textInstruction}\n\n` +
                    `Generate exactly 5 specialized prompts in this EXACT order:\n\n` +
                    `1. REAL-LIFE LIFESTYLE: A detailed prompt showing the product being used in a realistic, everyday scenario.\n\n` +
                    `2. PACKSHOT WHITE BACKGROUND: A professional product packshot prompt with a clean white background.\n\n` +
                    `3. BEFORE AND AFTER: A prompt showing a before/after comparison that demonstrates the product's impact.\n\n` +
                    `4. LIFESTYLE VARIATION: Another lifestyle scenario, different from prompt #1.\n\n` +
                    `5. PACKSHOT VARIATION: Another packshot with white background, but from a different angle.\n\n` +
                    `Each prompt must be extremely detailed (200-400 words) with professional photography terminology.\n` +
                    `All prompts must be in English only.\n` +
                    `Return ONLY a valid JSON array with exactly 5 prompts:\n["prompt1", "prompt2", "prompt3", "prompt4", "prompt5"]`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 4000,
          temperature: 0.85
        }),
      })

      if (response.ok) {
        const result = await response.json()
        let content = result.choices?.[0]?.message?.content?.trim() || ''

        // Parse JSON response
        if (content.includes('```json')) {
          content = content.replace(/```json\s*|\s*```/g, '')
        } else if (content.includes('```')) {
          content = content.replace(/```\s*|\s*```/g, '')
        }
        content = content.trim()

        const prompts = JSON.parse(content)

        if (Array.isArray(prompts) && prompts.length >= 5) {
          // Reorder: put 4th (LIFESTYLE 2) first - mirrors Laravel
          return [
            prompts[3],  // LIFESTYLE 2
            prompts[0],  // LIFESTYLE
            prompts[4],  // PACKSHOT 2
            prompts[2],  // BEFORE/AFTER
            prompts[1]   // PACKSHOT
          ]
        }
      }

      // Fallback prompts
      return this.getFallbackPrompts(productDescription)

    } catch (error) {
      console.error('[FAL-AI] Error generating special prompts:', error)
      return this.getFallbackPrompts(productDescription)
    }
  }

  /**
   * Get fallback prompts when ChatGPT fails
   * Mirrors Laravel getFallbackPrompts() method
   */
  private getFallbackPrompts(productDescription: string): string[] {
    const desc = productDescription.substring(0, 100)
    return [
      `Professional lifestyle photo of ${desc} being used in modern home setting, natural lighting, shallow depth of field, warm tones`,
      `Studio product photo of ${desc} on clean white background, soft shadows, professional lighting, centered composition`,
      `Before and after comparison showing ${desc} impact, split composition, clear visual difference, professional photography`,
      `Lifestyle photo of ${desc} in outdoor setting, natural daylight, authentic use case, editorial style`,
      `Product packshot of ${desc} from 45 degree angle on white background, studio lighting, high detail, e-commerce ready`
    ]
  }

  /**
   * Generate a single image using fal-ai/nano-banana/edit
   */
  async generateSingleImage(
    prompt: string,
    imageUrl: string,
    useProModel: boolean = false
  ): Promise<{ success: boolean; fal_url?: string; error?: string }> {
    const endpoint = useProModel ? 'fal-ai/nano-banana-pro/edit' : 'fal-ai/nano-banana/edit'
    const url = `${FAL_BASE_URL}/${endpoint}`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.falKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          image_urls: [imageUrl],
          num_images: 1,
          aspect_ratio: '1:1',
          output_format: 'png',
          limit_generations: true
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.images?.[0]?.url) {
          return {
            success: true,
            fal_url: result.images[0].url
          }
        }
      }

      const errorText = await response.text()
      return {
        success: false,
        error: 'No image in response: ' + errorText
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generate all 5 images IN PARALLEL
   * Mirrors Laravel generateImagesParallel() method
   */
  async generateImagesParallel(
    prompts: string[],
    imageUrl: string,
    useProModel: boolean = false,
    onImageGenerated?: (index: number, image: GeneratedImage) => void
  ): Promise<GeneratedImage[]> {
    console.log(`[FAL-AI] 🚀 Generating ${prompts.length} images IN PARALLEL...`)

    const promises = prompts.map((prompt, index) =>
      this.generateSingleImage(prompt, imageUrl, useProModel)
        .then(result => ({ index, prompt, result }))
    )

    const results = await Promise.allSettled(promises)
    const images: GeneratedImage[] = []

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { index, prompt, result: genResult } = result.value
        
        if (genResult.success && genResult.fal_url) {
          const image: GeneratedImage = {
            index,
            image_type: 'recommended',
            special_index: index,
            prompt,
            image_url: genResult.fal_url,
            image_url_no_bg: null
          }
          images.push(image)
          console.log(`[FAL-AI] ✅ Image ${index} generated successfully`)
          
          // Callback for real-time updates
          if (onImageGenerated) {
            onImageGenerated(index, image)
          }
        } else {
          console.warn(`[FAL-AI] ❌ Image ${index} failed: ${genResult.error}`)
        }
      } else {
        console.warn(`[FAL-AI] ❌ Image generation rejected:`, result.reason)
      }
    }

    return images
  }

  /**
   * Full image generation workflow
   * Mirrors Laravel GenerateAIImagesJob::handle() method
   */
  async generateStoreImages(
    scrappedImages: string[],
    aiContent: Record<string, unknown>,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<GenerationResult> {
    const startTime = Date.now()

    // Validate API keys
    if (!this.falKey) {
      return { success: false, total_images: 0, recommended_images: [], processing_time: 0, error: 'FAL_KEY is not set' }
    }
    if (!this.openaiKey) {
      return { success: false, total_images: 0, recommended_images: [], processing_time: 0, error: 'OPENAI_API_KEY is not set' }
    }

    // Validate images
    if (!scrappedImages || scrappedImages.length === 0) {
      return { success: false, total_images: 0, recommended_images: [], processing_time: 0, error: 'No images provided' }
    }

    try {
      // Step 1: Prepare images
      onProgress?.({
        step: 1,
        totalSteps: 5,
        stepName: GENERATION_STEPS[0].name,
        stepDescription: GENERATION_STEPS[0].description
      })

      // Normalize URLs and select first non-Replicate image
      const normalizedImages = scrappedImages.slice(0, 5).map(url => this.normalizeImageUrl(url))
      const nonReplicateUrls = normalizedImages.filter(url => !this.isReplicateUrl(url))
      const firstImageUrl = nonReplicateUrls.length > 0 ? nonReplicateUrls[0] : normalizedImages[0]

      if (!firstImageUrl) {
        return { success: false, total_images: 0, recommended_images: [], processing_time: 0, error: 'No valid image URLs provided' }
      }

      console.log(`[FAL-AI] Selected first image: ${firstImageUrl}`)

      // Extract product info
      const productInfo = this.extractProductInfo(aiContent)

      // Step 2: Remove background
      onProgress?.({
        step: 2,
        totalSteps: 5,
        stepName: GENERATION_STEPS[1].name,
        stepDescription: GENERATION_STEPS[1].description
      })

      const bgRemovedResult = await this.removeBackground(firstImageUrl)
      if (!bgRemovedResult.success || !bgRemovedResult.image_url) {
        return { 
          success: false, 
          total_images: 0, 
          recommended_images: [], 
          processing_time: (Date.now() - startTime) / 1000,
          error: 'Background removal failed: ' + (bgRemovedResult.error || 'Unknown error')
        }
      }

      const bgRemovedUrl = bgRemovedResult.image_url
      console.log(`[FAL-AI] Background removed: ${bgRemovedUrl}`)

      // Download BG-removed image for ChatGPT
      const { base64: bgRemovedBase64 } = await this.downloadImage(bgRemovedUrl)

      // Step 3: Generate prompts
      onProgress?.({
        step: 3,
        totalSteps: 5,
        stepName: GENERATION_STEPS[2].name,
        stepDescription: GENERATION_STEPS[2].description
      })

      let combinedDescription = productInfo.product_description
      if (productInfo.summary_product) {
        combinedDescription = productInfo.summary_product + '\n\n' + combinedDescription
      }

      console.log('[FAL-AI] Generating 5 prompts with GPT-4o...')
      const recommendedPrompts = await this.generateSpecialPrompts(
        combinedDescription,
        bgRemovedBase64,
        false,
        productInfo.summary_product,
        productInfo.shot_description_helper
      )
      console.log(`[FAL-AI] ✅ ${recommendedPrompts.length} prompts generated`)

      // Step 4: Generate images in parallel
      onProgress?.({
        step: 4,
        totalSteps: 5,
        stepName: GENERATION_STEPS[3].name,
        stepDescription: GENERATION_STEPS[3].description
      })

      const generatedImages = await this.generateImagesParallel(
        recommendedPrompts,
        bgRemovedUrl,
        false,
        (index, image) => {
          // Real-time update as each image is generated
          onProgress?.({
            step: 4,
            totalSteps: 5,
            stepName: GENERATION_STEPS[3].name,
            stepDescription: `Image ${index + 1}/5 générée...`,
            images: [image]
          })
        }
      )

      // Step 5: Finalize
      onProgress?.({
        step: 5,
        totalSteps: 5,
        stepName: GENERATION_STEPS[4].name,
        stepDescription: GENERATION_STEPS[4].description,
        images: generatedImages
      })

      const processingTime = (Date.now() - startTime) / 1000
      console.log(`[FAL-AI] ✅ ${generatedImages.length} images generated in ${processingTime}s`)

      return {
        success: true,
        total_images: generatedImages.length,
        recommended_images: generatedImages,
        processing_time: processingTime
      }

    } catch (error) {
      console.error('[FAL-AI] Error in generateStoreImages:', error)
      return {
        success: false,
        total_images: 0,
        recommended_images: [],
        processing_time: (Date.now() - startTime) / 1000,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Singleton instance
let falAIService: FalAIService | null = null

export function getFalAIService(): FalAIService {
  if (!falAIService) {
    falAIService = new FalAIService()
  }
  return falAIService
}
