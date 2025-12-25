/**
 * Replicate Service - Migrated from Laravel ReplicateService.php
 * 
 * Features:
 * - Product image generation using Nano Banana model
 * - Polling for async predictions
 * - Image download and processing
 */

const BASE_URL = 'https://api.replicate.com/v1'
const DEFAULT_MODEL = 'google/nano-banana'

interface PredictionInput {
  prompt?: string
  image_input?: string[]
  aspect_ratio?: string
  output_format?: string
}

interface PredictionResult {
  success: boolean
  prediction_id?: string
  status?: string
  output?: string | string[]
  error?: string
  message?: string
  metrics?: Record<string, any>
}

export class ReplicateService {
  private apiToken: string

  constructor() {
    this.apiToken = process.env.REPLICATE_API_TOKEN!
    if (!this.apiToken) {
      throw new Error('REPLICATE_API_TOKEN is not set')
    }
  }

  /**
   * Generate an enhanced product image using Replicate's Nano Banana model
   * Migrated from Laravel ReplicateService::generateProductImage
   */
  async generateProductImage(data: {
    prompt?: string
    imageUrl?: string
    aspectRatio?: string
    outputFormat?: string
  }): Promise<PredictionResult> {
    try {
      const input: PredictionInput = {
        prompt: data.prompt || "Show a real person naturally using the exact same product from the input image — keep the same shape, size, scale, color, material, and design. The product must remain identical and proportional to the person's hand or body. Do NOT modify, resize, or redesign the product. Simply place it in a realistic lifestyle context with a person using it naturally, under soft natural daylight, in a cozy modern home environment. Maintain true colors, photorealistic lighting, and premium e-commerce quality.",
        aspect_ratio: data.aspectRatio || '1:1',
        output_format: data.outputFormat || 'png',
      }

      if (data.imageUrl) {
        input.image_input = [data.imageUrl]
      }

      const response = await fetch(`${BASE_URL}/models/${DEFAULT_MODEL}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait', // Synchronous mode
        },
        body: JSON.stringify({ input }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Replicate API error:', error)
        return {
          success: false,
          error: 'API request failed',
          message: error.detail || 'Unknown error',
        }
      }

      const result = await response.json()

      // Check if we need to poll (async mode)
      if (result.id && !result.output) {
        return this.pollForResult(result.id)
      }

      return {
        success: true,
        prediction_id: result.id,
        status: result.status || 'completed',
        output: result.output,
        metrics: result.metrics,
      }
    } catch (error) {
      console.error('Replicate service error:', error)
      return {
        success: false,
        error: 'Service error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Poll for the result of an async prediction
   */
  async pollForResult(
    predictionId: string,
    maxAttempts: number = 30,
    delaySeconds: number = 2
  ): Promise<PredictionResult> {
    let attempts = 0

    while (attempts < maxAttempts) {
      const response = await fetch(`${BASE_URL}/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      })

      if (response.ok) {
        const result = await response.json()

        if (['succeeded', 'failed', 'canceled'].includes(result.status)) {
          return {
            success: result.status === 'succeeded',
            prediction_id: result.id,
            status: result.status,
            output: result.output,
            metrics: result.metrics,
            error: result.error,
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000))
      attempts++
    }

    return {
      success: false,
      error: 'Polling timeout',
      message: 'Maximum polling attempts reached',
    }
  }

  /**
   * Get prediction status
   */
  async getPredictionStatus(predictionId: string): Promise<PredictionResult> {
    try {
      const response = await fetch(`${BASE_URL}/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      })

      if (!response.ok) {
        return {
          success: false,
          error: 'Failed to get prediction status',
        }
      }

      const result = await response.json()

      return {
        success: true,
        prediction_id: result.id,
        status: result.status,
        output: result.output,
        metrics: result.metrics,
        error: result.error,
      }
    } catch (error) {
      console.error('Failed to get prediction status:', error)
      return {
        success: false,
        error: 'Service error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Cancel a prediction
   */
  async cancelPrediction(predictionId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${BASE_URL}/predictions/${predictionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      })

      return { success: response.ok }
    } catch (error) {
      console.error('Failed to cancel prediction:', error)
      return { success: false }
    }
  }

  /**
   * Calculate estimated cost for the generation
   * Based on Replicate's pricing: $0.039 per output
   */
  calculateCost(): number {
    return 0.039
  }
}

// Singleton instance
let replicateService: ReplicateService | null = null

export function getReplicateService(): ReplicateService {
  if (!replicateService) {
    replicateService = new ReplicateService()
  }
  return replicateService
}
