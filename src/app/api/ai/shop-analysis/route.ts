/**
 * AI Shop Analysis API Route with Scoring System
 * Analyzes shop data and returns a detailed scoring report
 * 
 * POST /api/ai/shop-analysis
 */

import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { ClaudeAIService } from "@/lib/services/claude"

// Scoring constants - Tier 1, Tier 2, Tier 3 countries
const TIER1_COUNTRIES = ['US', 'CA', 'UK', 'GB', 'AU', 'DE', 'FR', 'NL', 'SE', 'CH'];
const TIER2_COUNTRIES = ['ES', 'IT', 'BE', 'AT', 'DK', 'NO', 'FI', 'IE', 'NZ'];

// Continent mapping for multi-continent bonus
const CONTINENT_MAP: Record<string, string> = {
  'US': 'NA', 'CA': 'NA', 'MX': 'NA',
  'UK': 'EU', 'GB': 'EU', 'DE': 'EU', 'FR': 'EU', 'ES': 'EU', 'IT': 'EU', 'NL': 'EU', 'BE': 'EU', 'AT': 'EU', 'SE': 'EU', 'NO': 'EU', 'DK': 'EU', 'FI': 'EU', 'CH': 'EU', 'IE': 'EU', 'PT': 'EU', 'PL': 'EU',
  'AU': 'OC', 'NZ': 'OC',
  'BR': 'SA', 'AR': 'SA', 'CL': 'SA', 'CO': 'SA',
  'JP': 'AS', 'KR': 'AS', 'CN': 'AS', 'IN': 'AS', 'SG': 'AS', 'MY': 'AS', 'TH': 'AS', 'VN': 'AS', 'ID': 'AS', 'PH': 'AS',
  'ZA': 'AF', 'NG': 'AF', 'EG': 'AF', 'MA': 'AF',
};

interface ShopAnalysisInput {
  shopName: string;
  shopUrl: string;
  createdAt: string | null;
  markets: string[];
  trafficCurrent: number;
  traffic3mTrend: number;
  productsCount: number;
  activeAdsCount: number;
  activeAds3mTrend: number;
  monthlyRevenue?: number;
  // Additional context
  themeName?: string;
  category?: string;
  // Top products for analysis
  topProducts?: Array<{
    title: string;
    price: number;
    imageUrl?: string;
    bestProduct?: boolean;
  }>;
}

interface ScoreResult {
  value: number;
  label: string;
  details?: string;
}

interface AnalysisResult {
  globalScore: number;
  verdict: {
    type: 'weak' | 'potential' | 'solid' | 'winner';
    label: string;
    color: string;
  };
  scores: {
    age: ScoreResult;
    markets: ScoreResult;
    trafficLevel: ScoreResult;
    trafficTrend: ScoreResult;
    products: ScoreResult;
    ads: ScoreResult;
  };
  momentum: 'growth' | 'stable' | 'decline';
  adsStrength: 'weak' | 'moderate' | 'strong';
  replicationDifficulty: 'easy' | 'medium' | 'hard';
  strengths: string[];
  weaknesses: string[];
  actions: string[];
  aiInsights?: string;
  productsAnalysis?: string;
}

// Calculate age score from created_at
function calculateAgeScore(createdAt: string | null): ScoreResult {
  if (!createdAt) return { value: 60, label: 'Non disponible', details: 'Date de création inconnue' };
  
  const now = new Date();
  const created = new Date(createdAt);
  const daysDiff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  
  let value = 60;
  let label = '';
  
  if (daysDiff < 30) {
    value = 20;
    label = `${daysDiff} jours`;
  } else if (daysDiff < 90) {
    value = 40;
    label = `${Math.floor(daysDiff / 30)} mois`;
  } else if (daysDiff < 180) {
    value = 60;
    label = `${Math.floor(daysDiff / 30)} mois`;
  } else if (daysDiff < 365) {
    value = 80;
    label = `${Math.floor(daysDiff / 30)} mois`;
  } else {
    value = 100;
    label = `${Math.floor(daysDiff / 365)} an(s)`;
  }
  
  return { value, label, details: `Créé il y a ${daysDiff} jours` };
}

// Calculate markets score
function calculateMarketsScore(markets: string[]): ScoreResult {
  if (!markets || markets.length === 0) return { value: 40, label: 'Non disponible' };
  
  let score = 0;
  const continents = new Set<string>();
  
  for (const market of markets) {
    const code = market.toUpperCase();
    if (TIER1_COUNTRIES.includes(code)) {
      score += 20;
    } else if (TIER2_COUNTRIES.includes(code)) {
      score += 10;
    } else {
      score += 5;
    }
    
    const continent = CONTINENT_MAP[code];
    if (continent) continents.add(continent);
  }
  
  // Multi-continent bonus (NA + EU)
  if (continents.has('NA') && continents.has('EU')) {
    score += 10;
  }
  
  const value = Math.min(100, score);
  const tier1Count = markets.filter(m => TIER1_COUNTRIES.includes(m.toUpperCase())).length;
  
  return { 
    value, 
    label: `${markets.length} marché(s)`,
    details: tier1Count > 0 ? `${tier1Count} Tier 1` : undefined
  };
}

// Calculate traffic level score
function calculateTrafficLevelScore(traffic: number): ScoreResult {
  if (traffic === 0) return { value: 40, label: 'Non disponible' };
  
  let value = 20;
  let label = '';
  
  if (traffic < 5000) {
    value = 20;
    label = 'Très faible';
  } else if (traffic < 20000) {
    value = 40;
    label = 'Faible';
  } else if (traffic < 80000) {
    value = 60;
    label = 'Moyen';
  } else if (traffic < 250000) {
    value = 80;
    label = 'Élevé';
  } else {
    value = 100;
    label = 'Très élevé';
  }
  
  return { 
    value, 
    label,
    details: `${new Intl.NumberFormat('fr-FR').format(traffic)} visites/mois`
  };
}

// Calculate trend score (for traffic or ads)
function calculateTrendScore(trend: number): ScoreResult {
  let value = 60;
  let label = '';
  
  if (trend < -20) {
    value = 20;
    label = 'Forte baisse';
  } else if (trend < -5) {
    value = 40;
    label = 'Baisse';
  } else if (trend <= 5) {
    value = 60;
    label = 'Stable';
  } else if (trend <= 25) {
    value = 80;
    label = 'Croissance';
  } else {
    value = 100;
    label = 'Forte croissance';
  }
  
  return { 
    value, 
    label,
    details: `${trend >= 0 ? '+' : ''}${trend}% sur 3 mois`
  };
}

// Calculate products score
function calculateProductsScore(count: number): ScoreResult {
  if (count === 0) return { value: 40, label: 'Non disponible' };
  
  let value = 30;
  let label = '';
  
  if (count < 10) {
    value = 30;
    label = 'Très limité';
  } else if (count < 50) {
    value = 70;
    label = 'Modéré';
  } else if (count < 100) {
    value = 90;
    label = 'Large';
  } else {
    value = 100;
    label = 'Très large';
  }
  
  return { 
    value, 
    label,
    details: `${count} produits`
  };
}

// Calculate ads score (composite of active + trend)
function calculateAdsScore(activeCount: number, trend: number): ScoreResult {
  // Active ads score
  let activeScore = 20;
  if (activeCount >= 100) activeScore = 100;
  else if (activeCount >= 50) activeScore = 85;
  else if (activeCount >= 10) activeScore = 60;
  
  // Trend score
  const trendScore = calculateTrendScore(trend).value;
  
  // Weighted composite: 70% active, 30% trend
  const value = Math.round(0.7 * activeScore + 0.3 * trendScore);
  
  let label = '';
  if (activeCount === 0) label = 'Aucune pub';
  else if (activeCount < 10) label = 'Faible';
  else if (activeCount < 50) label = 'Actif';
  else label = 'Très actif';
  
  return { 
    value, 
    label,
    details: `${activeCount} pubs actives`
  };
}

// Calculate global score with weights
function calculateGlobalScore(scores: AnalysisResult['scores']): number {
  const weights = {
    age: 0.10,
    markets: 0.10,
    trafficLevel: 0.20,
    trafficTrend: 0.20,
    products: 0.15,
    ads: 0.25,
  };
  
  return Math.round(
    scores.age.value * weights.age +
    scores.markets.value * weights.markets +
    scores.trafficLevel.value * weights.trafficLevel +
    scores.trafficTrend.value * weights.trafficTrend +
    scores.products.value * weights.products +
    scores.ads.value * weights.ads
  );
}

// Get verdict from score
function getVerdict(score: number): AnalysisResult['verdict'] {
  if (score < 40) {
    return { type: 'weak', label: 'Faible signal', color: '#EF4444' };
  } else if (score < 60) {
    return { type: 'potential', label: 'Potentiel', color: '#F59E0B' };
  } else if (score < 80) {
    return { type: 'solid', label: 'Solide', color: '#22C55E' };
  } else {
    return { type: 'winner', label: 'Winner probable', color: '#10B981' };
  }
}

// Generate strengths based on scores
function generateStrengths(scores: AnalysisResult['scores'], input: ShopAnalysisInput): string[] {
  const strengths: string[] = [];
  
  if (scores.trafficTrend.value >= 80) strengths.push('Trafic en forte croissance sur 3 mois');
  if (scores.trafficLevel.value >= 80) strengths.push('Volume de trafic élevé');
  if (scores.ads.value >= 85) strengths.push('Machine publicitaire très active');
  if (scores.age.value >= 80) strengths.push('Boutique établie et mature');
  if (scores.markets.value >= 80) strengths.push('Marchés Tier 1 bien exploités');
  if (scores.products.value >= 90) strengths.push('Catalogue large et diversifié');
  if (input.activeAdsCount >= 50) strengths.push(`${input.activeAdsCount} publicités actives`);
  
  return strengths.slice(0, 5);
}

// Generate weaknesses based on scores
function generateWeaknesses(scores: AnalysisResult['scores'], input: ShopAnalysisInput): string[] {
  const weaknesses: string[] = [];
  
  if (scores.age.value <= 40) weaknesses.push('Site récent : signal à confirmer');
  if (scores.products.value <= 30) weaknesses.push('Catalogue très limité : facilement copiable');
  if (scores.trafficTrend.value <= 40) weaknesses.push('Trafic en déclin');
  if (scores.ads.value <= 40) weaknesses.push('Peu de publicités actives');
  if (scores.markets.value <= 40) weaknesses.push('Marchés peu développés');
  if (input.activeAds3mTrend < -20) weaknesses.push('Publicités en forte baisse');
  
  return weaknesses.slice(0, 4);
}

// Generate recommended actions based on verdict
function generateActions(verdict: AnalysisResult['verdict']['type']): string[] {
  switch (verdict) {
    case 'winner':
      return [
        'Analyser les best-sellers et produits phares',
        'Étudier les créatives publicitaires gagnantes',
        'Mapper le funnel de vente et la stratégie de prix'
      ];
    case 'solid':
      return [
        'Surveiller la boutique pendant 7 jours',
        'Identifier le produit pivot principal',
        'Copier la structure du funnel de vente'
      ];
    case 'potential':
      return [
        'Diagnostiquer la cause de la tendance actuelle',
        'Vérifier si phase de test publicitaire',
        'Comparer avec 3 boutiques similaires'
      ];
    default:
      return [
        'Ne pas investir de temps pour le moment',
        'Chercher une meilleure tendance de marché',
        'Revenir vérifier dans quelques semaines'
      ];
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const input: ShopAnalysisInput = await request.json()
    
    if (!input.shopName && !input.shopUrl) {
      return NextResponse.json({ error: 'Shop name or URL required' }, { status: 400 })
    }

    // Calculate all scores
    const scores = {
      age: calculateAgeScore(input.createdAt),
      markets: calculateMarketsScore(input.markets || []),
      trafficLevel: calculateTrafficLevelScore(input.trafficCurrent || 0),
      trafficTrend: calculateTrendScore(input.traffic3mTrend || 0),
      products: calculateProductsScore(input.productsCount || 0),
      ads: calculateAdsScore(input.activeAdsCount || 0, input.activeAds3mTrend || 0),
    };
    
    const globalScore = calculateGlobalScore(scores);
    const verdict = getVerdict(globalScore);
    
    // Determine momentum, ads strength, replication difficulty
    const momentum = scores.trafficTrend.value >= 70 ? 'growth' : scores.trafficTrend.value <= 40 ? 'decline' : 'stable';
    const adsStrength = scores.ads.value >= 70 ? 'strong' : scores.ads.value >= 40 ? 'moderate' : 'weak';
    const replicationDifficulty = scores.products.value <= 50 && scores.age.value <= 60 ? 'easy' : scores.products.value >= 80 ? 'hard' : 'medium';
    
    const strengths = generateStrengths(scores, input);
    const weaknesses = generateWeaknesses(scores, input);
    const actions = generateActions(verdict.type);
    
    // Optional: Get AI insights from Claude
    let aiInsights: string | undefined;
    let productsAnalysis: string | undefined;
    
    try {
      const claudeService = new ClaudeAIService();
      const aiPrompt = `Tu es un expert en e-commerce dropshipping. Analyse rapidement cette boutique et donne 2-3 phrases d'insights actionnables.

Boutique: ${input.shopName || input.shopUrl}
Score global: ${globalScore}/100 (${verdict.label})
Trafic: ${input.trafficCurrent} visites/mois (${input.traffic3mTrend >= 0 ? '+' : ''}${input.traffic3mTrend}%)
Publicités: ${input.activeAdsCount} actives (${input.activeAds3mTrend >= 0 ? '+' : ''}${input.activeAds3mTrend}%)
Produits: ${input.productsCount}
Marchés: ${(input.markets || []).join(', ') || 'Non disponible'}

Réponds uniquement en français, en 2-3 phrases maximum. Sois direct et actionnable.`;

      aiInsights = await claudeService.generateContent(aiPrompt, 300);
    } catch {
      console.log('[Shop Analysis] AI insights generation skipped');
    }
    
    // Generate products analysis if top products are provided
    if (input.topProducts && input.topProducts.length > 0) {
      try {
        const claudeService = new ClaudeAIService();
        const productsInfo = input.topProducts.slice(0, 5).map((p, i) => 
          `${i + 1}. "${p.title}" - ${p.price}€${p.bestProduct ? ' (Best-seller)' : ''}`
        ).join('\n');
        
        const productsPrompt = `Tu es un expert dropshipping. Analyse ces produits best-sellers de la boutique "${input.shopName}" et donne une analyse courte et actionnable.

Produits:
${productsInfo}

Catégorie boutique: ${input.category || 'Non spécifiée'}
Thème: ${input.themeName || 'Non spécifié'}

Réponds en français, format bullet points (utilise •). 3-4 points max:
• Niche identifiée et potentiel
• Produit(s) gagnant(s) à copier
• Prix moyen et marge estimée
• Conseil stratégique`;

        productsAnalysis = await claudeService.generateContent(productsPrompt, 400);
      } catch {
        console.log('[Shop Analysis] Products analysis generation skipped');
      }
    }
    
    const result: AnalysisResult = {
      globalScore,
      verdict,
      scores,
      momentum,
      adsStrength,
      replicationDifficulty,
      strengths,
      weaknesses,
      actions,
      aiInsights: aiInsights || undefined,
      productsAnalysis: productsAnalysis || undefined,
    };

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Shop analysis error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze shop'
    }, { status: 500 })
  }
}
