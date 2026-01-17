/**
 * AI Persona Analysis API
 * Analyzes a Shopify store and generates buyer persona
 * 
 * POST /api/ai/persona-analysis
 */

import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { ClaudeAIService } from "@/lib/services/claude"

interface ShopData {
  url: string;
  name: string;
  category?: string;
  products?: Array<{
    title: string;
    price: number;
    productType?: string;
  }>;
  ads?: Array<{
    title?: string;
    body?: string;
    platform?: string;
  }>;
  markets?: string[];
  traffic?: number;
  mainCountry?: string;
}

interface PersonaResult {
  buyerSummary: string;
  profile: {
    age: string;
    gender: string;
    location: string;
    situation: string;
    budget: string;
  };
  problem: {
    mainProblem: string;
    frustration: string;
    urgency: string;
  };
  whyThisProduct: {
    attraction: string;
    beforeBuying: string;
    afterBuying: string;
  };
  targeting: {
    platform: string;
    interests: string[];
    contentType: string;
  };
  adMessage: {
    mainPhrase: string;
    hook: string;
  };
}

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const shopData: ShopData = await request.json()
    
    if (!shopData.url) {
      return NextResponse.json({ error: 'Shop URL is required' }, { status: 400 })
    }

    // Build context from shop data
    const productsContext = shopData.products?.slice(0, 5).map(p => 
      `- ${p.title} (${p.price}€)${p.productType ? ` [${p.productType}]` : ''}`
    ).join('\n') || 'Non disponible';

    // Build ads context - very important for understanding targeting and messaging
    const adsContext = shopData.ads?.slice(0, 5).map((ad, i) => {
      let adText = `${i + 1}. `;
      if (ad.platform) adText += `[${ad.platform}] `;
      if (ad.title) adText += `"${ad.title}" `;
      if (ad.body) adText += `- ${ad.body.slice(0, 200)}${ad.body.length > 200 ? '...' : ''}`;
      return adText;
    }).join('\n') || 'Non disponible';

    const prompt = `Tu es un expert en e-commerce et psychologie du consommateur. Analyse ce site Shopify et crée un profil d'acheteur DÉTAILLÉ et CONCRET.

SITE SHOPIFY : ${shopData.url}
NOM : ${shopData.name || 'Non spécifié'}
CATÉGORIE : ${shopData.category || 'Non spécifiée'}
PAYS PRINCIPAL : ${shopData.mainCountry || 'Non spécifié'}
MARCHÉS : ${shopData.markets?.join(', ') || 'Non spécifié'}
TRAFIC MENSUEL : ${shopData.traffic ? `~${shopData.traffic.toLocaleString()} visites` : 'Non spécifié'}

PRODUITS PHARES :
${productsContext}

PUBLICITÉS ACTUELLES DE LA BOUTIQUE (très important pour comprendre le ciblage et le messaging) :
${adsContext}

RÈGLES IMPORTANTES :
- Explique comme si tu parlais à un débutant en e-commerce
- Pas de jargon marketing complexe
- Des phrases courtes et concrètes
- Base-toi sur les produits et la catégorie pour déduire le persona

RÉPONDS UNIQUEMENT AU FORMAT JSON SUIVANT (pas de markdown, pas de texte avant/après) :

{
  "buyerSummary": "Une phrase décrivant l'acheteur idéal. Ex: Une femme de 30-45 ans qui veut perdre du poids sans faire de sport.",
  "profile": {
    "age": "Tranche d'âge approximative (ex: 25-35 ans)",
    "gender": "Homme / Femme / Les deux",
    "location": "Type de pays et zones (ex: Pays développés - France, USA, UK)",
    "situation": "Situation de vie (ex: Parent actif avec peu de temps libre)",
    "budget": "Niveau de budget: Petit (<30€) / Moyen (30-100€) / Élevé (>100€)"
  },
  "problem": {
    "mainProblem": "Le problème n°1 que cette personne cherche à résoudre",
    "frustration": "Pourquoi ce problème la frustre au quotidien",
    "urgency": "Pourquoi elle cherche une solution maintenant"
  },
  "whyThisProduct": {
    "attraction": "Ce qui rend ce produit plus attirant que les alternatives",
    "beforeBuying": "Ce que le client pense/ressent avant d'acheter",
    "afterBuying": "Ce qu'il espère ressentir/obtenir après l'achat"
  },
  "targeting": {
    "platform": "Meta / TikTok / Google - avec explication courte",
    "interests": ["Intérêt 1", "Intérêt 2", "Intérêt 3", "Intérêt 4", "Intérêt 5"],
    "contentType": "Type de contenu qui marche le mieux (ex: vidéo avant/après, démonstration, témoignage UGC)"
  },
  "adMessage": {
    "mainPhrase": "Une phrase pub prête à utiliser qui parle au client",
    "hook": "Une accroche courte et percutante pour capter l'attention"
  }
}`;

    const claudeService = new ClaudeAIService();
    const response = await claudeService.generateContent(prompt, 2000);
    
    if (!response) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let personaResult: PersonaResult;
    try {
      // Clean the response - remove any markdown code blocks if present
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      personaResult = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', response);
      // Return a default structure with the raw response
      personaResult = {
        buyerSummary: "Analyse en cours de traitement...",
        profile: {
          age: "Non déterminé",
          gender: "Non déterminé",
          location: "Non déterminé",
          situation: "Non déterminé",
          budget: "Non déterminé"
        },
        problem: {
          mainProblem: response.slice(0, 200) || "Analyse non disponible",
          frustration: "Analyse non disponible",
          urgency: "Analyse non disponible"
        },
        whyThisProduct: {
          attraction: "Analyse non disponible",
          beforeBuying: "Analyse non disponible",
          afterBuying: "Analyse non disponible"
        },
        targeting: {
          platform: "Meta Ads",
          interests: ["À déterminer"],
          contentType: "Vidéo témoignage"
        },
        adMessage: {
          mainPhrase: "Analyse non disponible",
          hook: "Analyse non disponible"
        }
      };
    }

    return NextResponse.json({
      success: true,
      persona: personaResult
    })

  } catch (error) {
    console.error('Persona analysis error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze persona'
    }, { status: 500 })
  }
}
