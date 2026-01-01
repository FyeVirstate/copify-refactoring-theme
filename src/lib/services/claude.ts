/**
 * Claude AI Service - Migrated from Laravel ClaudeAIService.php
 * 
 * Features:
 * - Multiple model fallback (claude-sonnet-4-5-20250929 → claude-3-haiku-20240307)
 * - Content generation
 * - Dropshipping store analysis
 * - Chat responses for store questions
 */

const API_URL = 'https://api.anthropic.com/v1/messages'
const API_VERSION = '2023-06-01'

// Model fallback order (from most capable to fastest)
// Using valid Claude model names as of 2024
const MODELS = [
  'claude-sonnet-4-5-20250929',
  'claude-opus-4-1-20250805',
  'claude-sonnet-4-20250514',
  'claude-3-5-sonnet-20241022',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307'
]

interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>
  model: string
  usage: { input_tokens: number; output_tokens: number }
}

interface AnalysisResult {
  storeName: string
  verdict: {
    type: 'excellent' | 'medium' | 'avoid'
    text: string
    color: 'green' | 'orange' | 'red'
  }
  signals: Array<{
    type: 'positive' | 'negative'
    title: string
    description: string
  }>
  recommendations: {
    timing: { urgency: string; description: string }
    platform: { recommended: string; description: string }
    market: { suggested: string; description: string }
  }
  whyItWorks: string
}

export class ClaudeAIService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY!
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set')
    }
  }

  /**
   * Generate content using Claude AI with model fallback
   */
  async generateContent(prompt: string, maxTokens: number = 3500): Promise<string | null> {
    for (const model of MODELS) {
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': API_VERSION,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
          }),
        })

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`Claude API error with model ${model}: ${response.status} - ${errorBody.substring(0, 500)}`);
          continue
        }

        const result: ClaudeResponse = await response.json()

        if (result.content?.[0]?.text) {
          console.log(`Successfully generated content using model: ${model}`)
          return result.content[0].text
        }
      } catch (error) {
        console.error(`Claude API error with model ${model}:`, error)
        continue
      }
    }

    console.error('All Claude models failed to generate content')
    return null
  }

  /**
   * Generate dropshipping analysis for a store
   * Migrated from Laravel ClaudeAIService::generateDropshippingAnalysis
   */
  async generateDropshippingAnalysis(storeData: {
    storeName: string
    monthlyTraffic: number
    monthlyRevenue: number
    revenueEvolution3Months: number
    revenueEvolution1Month: number
    geographicDistribution: string
    trafficSources: string
    activeAds: number
    adsEvolution: string
    launchDate: string
    productCount: number
    locale?: string
  }): Promise<AnalysisResult | null> {
    const locale = storeData.locale || 'en'

    const prompt = `You are a world-class e-commerce analyst specialized in dropshipping store evaluation.

Your job is to analyze the following e-commerce data and create a detailed evaluation of the dropshipping potential. Use precise numbers, enthusiastic tone, and provide actionable recommendations.

IMPORTANT: The user's current locale is "${locale}". You must write all text values in the JSON (titles, descriptions, verdict text, recommendations, whyItWorks) strictly in this language.

Only output structured content in the form of a valid JSON object. Do not add commentary or markdown.

Return a single JSON object that includes:

{
  "storeName": "string",
  "verdict": {
    "type": "string", // "excellent", "medium", or "avoid"
    "text": "string",
    "color": "string" // "green", "orange", or "red"
  },
  "signals": [
    {
      "type": "string", // "positive" or "negative"
      "title": "string",
      "description": "string"
    }
  ],
  "recommendations": {
    "timing": {
      "urgency": "string", // "URGENT", "NORMAL", or "WAIT"
      "description": "string"
    },
    "platform": {
      "recommended": "string",
      "description": "string"
    },
    "market": {
      "suggested": "string",
      "description": "string"
    }
  },
  "whyItWorks": "string"
}

### Input Data:
- Monthly estimated traffic: ${storeData.monthlyTraffic}
- Monthly estimated revenue: ${storeData.monthlyRevenue}
- Revenue evolution: 3 months: ${storeData.revenueEvolution3Months}%, 1 month: ${storeData.revenueEvolution1Month}%
- Geographic distribution: ${storeData.geographicDistribution}
- Traffic sources: ${storeData.trafficSources}
- Facebook Ads: Active: ${storeData.activeAds}, Evolution: ${storeData.adsEvolution}
- Launch date: ${storeData.launchDate}
- Number of products: ${storeData.productCount}

### Evaluation Criteria:
1. Ad volume: 30+ active ads = good signal
2. Revenue growth: +30% over 3 months = good
3. Profitable markets: USA/EU/UK/CA/AU = developed countries
4. Recent site: Recently launched = good signal
5. High revenue: Big revenue = profitable market

IMPORTANT: Return only a valid JSON object with no additional text.`

    const content = await this.generateContent(prompt, 1500)
    if (!content) return null

    try {
      return JSON.parse(content.trim())
    } catch (error) {
      console.error('Failed to parse analysis response:', error)
      return null
    }
  }

  /**
   * Generate chat response for dropshipping store questions
   * Migrated from Laravel ClaudeAIService::generateDropshippingChatResponse
   */
  async generateDropshippingChatResponse(storeData: {
    userQuestion: string
    storeName: string
    monthlyTraffic: number
    monthlyRevenue: number
    dailyRevenue: number
    growthRate: number
    revenueEvolution1Month: number
    productCount: number
    shopAgeMonths: number
    currency: string
    aov?: number
    userLang?: string
  }): Promise<string | null> {
    const { userQuestion, currency = '$', userLang = 'en' } = storeData

    const maturityLevel = storeData.shopAgeMonths < 3 ? 'Startup' 
      : storeData.shopAgeMonths < 12 ? 'Growth' : 'Mature'

    const languageNames: Record<string, string> = {
      en: 'English',
      fr: 'French',
      es: 'Spanish',
    }

    const prompt = `SYSTEM ROLE:
Tu es « Copyfy Coach », expert e-commerce/dropshipping en mode espionnage. Tu n'es *jamais* le propriétaire de la boutique analysée.
Tu observes uniquement ce qui est public (pubs, pages produit, prix, livraison, avis, vitesse) et tu donnes des leçons simples qu'un débutant peut appliquer à son propre projet.

INTERDIT:
Actions internes (GA4, pixel, CRM, stock, base clients, emails, code). Propose uniquement des actions externes et visibles.

CAPACITÉS COPYFY:
✅ Avec Copyfy tu peux:
• Exporter un produit depuis une boutique Shopify concurrente
• Créer une boutique complète avec l'IA à partir d'un lien produit
• Reprendre la structure visible et le contenu public

❌ Avec Copyfy tu ne peux pas:
• Copier directement un thème ou du code propriétaire
• Accéder aux données internes

LANGAGE:
Simple, concret, mots de dropshipping. Chaque conseil doit être compréhensible par un débutant.

OBSESSION:
Réponses courtes, claires, data-driven. 180 mots max.

Structure: sections + emojis + titres en **gras**.
Toujours terminer par une mini action.
Réponds dans la langue: ${languageNames[userLang] || 'English'}

---

🎯 Question utilisateur
${userQuestion}

📊 Données boutique
• Trafic (approx.): ${storeData.monthlyTraffic.toLocaleString()} /mois
• Revenu mensuel (approx.): ${currency}${storeData.monthlyRevenue.toLocaleString()} (daily: ${currency}${storeData.dailyRevenue.toLocaleString()})
• Croissance: ${storeData.growthRate}% (3m) | ${storeData.revenueEvolution1Month}% (1m)
• Produits: ${storeData.productCount} | Maturité: ${maturityLevel}

---

IMPORTANT: Réponse en ${languageNames[userLang] || 'English'}`

    return this.generateContent(prompt, 600)
  }

  /**
   * Translate text using Claude
   */
  async translate(text: string, targetLang: string, sourceLang: string = 'auto'): Promise<string | null> {
    const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Return only the translated text without any additional explanations or notes:

${text}`

    return this.generateContent(prompt, 1000)
  }
}

// Singleton instance
let claudeService: ClaudeAIService | null = null

export function getClaudeService(): ClaudeAIService {
  if (!claudeService) {
    claudeService = new ClaudeAIService()
  }
  return claudeService
}
