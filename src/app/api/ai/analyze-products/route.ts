/**
 * AI Product Analysis API
 * Analyzes similar products and recommends the best one
 * NOW WITH CATEGORY MATCHING - ensures recommended products match source category
 * 
 * POST /api/ai/analyze-products
 */

import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { ClaudeAIService } from "@/lib/services/claude"

interface ProductForAnalysis {
  index: number;
  id: string;
  title: string;
  price: number;
  sales: number;
  profit: number;
  profitPercent: number;
}

// Keywords to detect product categories
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  earrings: ['earring', 'boucle d\'oreille', 'boucles d\'oreilles', 'ear stud', 'ear cuff', 'hoop earring', 'drop earring', 'stud', 'huggies', 'tragus', 'cartilage'],
  necklace: ['necklace', 'collier', 'pendant', 'chain', 'choker'],
  bracelet: ['bracelet', 'bangle', 'wristband', 'charm bracelet'],
  ring: ['ring', 'bague', 'anneau', 'band ring'],
  jewelry: ['jewelry', 'bijoux', 'jewel', 'zircone', 'zircon', 'silver', 'argent', 'gold', 'or', 'plaqué'],
  watch: ['watch', 'montre', 'smartwatch', 'timepiece'],
  cosmetics: ['blush', 'foundation', 'fond de teint', 'makeup', 'maquillage', 'lipstick', 'mascara', 'eyeshadow', 'concealer', 'correcteur', 'powder', 'poudre', 'bronzer', 'highlighter', 'contour'],
  skincare: ['acne', 'patch', 'serum', 'cream', 'crème', 'moisturizer', 'cleanser', 'face mask', 'pimple', 'bouton'],
  clothing: ['shirt', 't-shirt', 'dress', 'robe', 'pants', 'pantalon', 'jacket', 'veste', 'hoodie', 'sweater'],
  shoes: ['shoe', 'chaussure', 'sneaker', 'boot', 'sandal', 'heel'],
  bag: ['bag', 'sac', 'purse', 'wallet', 'portefeuille', 'backpack', 'tote'],
  electronics: ['phone', 'téléphone', 'charger', 'cable', 'earbuds', 'écouteurs', 'speaker', 'bluetooth'],
  home: ['home', 'maison', 'decor', 'lamp', 'lampe', 'pillow', 'coussin', 'organizer'],
};

// Detect the main category of a product based on its title
function detectCategory(title: string): string[] {
  const lowerTitle = title.toLowerCase();
  const detectedCategories: string[] = [];
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerTitle.includes(keyword.toLowerCase())) {
        if (!detectedCategories.includes(category)) {
          detectedCategories.push(category);
        }
        break;
      }
    }
  }
  
  return detectedCategories.length > 0 ? detectedCategories : ['unknown'];
}

// Check if two products are in compatible categories
function areCategoriesCompatible(sourceCategories: string[], productCategories: string[]): boolean {
  // If source is unknown, accept everything
  if (sourceCategories.includes('unknown')) return true;
  
  // Direct match
  if (sourceCategories.some(c => productCategories.includes(c))) return true;
  
  // Jewelry sub-categories are compatible with each other
  const jewelryTypes = ['earrings', 'necklace', 'bracelet', 'ring', 'jewelry'];
  const sourceIsJewelry = sourceCategories.some(c => jewelryTypes.includes(c));
  const productIsJewelry = productCategories.some(c => jewelryTypes.includes(c));
  if (sourceIsJewelry && productIsJewelry) return true;
  
  return false;
}

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { products, sourceProduct } = await request.json() as { products: ProductForAnalysis[], sourceProduct: string }
    
    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'No products to analyze' }, { status: 400 })
    }

    // Detect source product category
    const sourceCategories = detectCategory(sourceProduct);
    console.log(`[AI-Products] Source: "${sourceProduct}" -> Categories: ${sourceCategories.join(', ')}`);

    // Score products based on multiple factors + CATEGORY MATCHING
    const scoredProducts = products.map((p: ProductForAnalysis) => {
      let score = 0;
      const productCategories = detectCategory(p.title);
      const categoryMatch = areCategoriesCompatible(sourceCategories, productCategories);
      
      // CRITICAL: Category matching (weight: 50%)
      // Products that don't match category get heavily penalized
      if (categoryMatch) {
        score += 50;
      } else {
        // Penalize non-matching products severely
        score -= 100;
      }
      
      // Sales score (weight: 25%)
      if (p.sales >= 5000) score += 25;
      else if (p.sales >= 1000) score += 22;
      else if (p.sales >= 500) score += 18;
      else if (p.sales >= 100) score += 12;
      else if (p.sales >= 50) score += 6;
      
      // Profit margin score (weight: 15%)
      if (p.profitPercent >= 70) score += 15;
      else if (p.profitPercent >= 60) score += 12;
      else if (p.profitPercent >= 50) score += 10;
      else if (p.profitPercent >= 40) score += 6;
      
      // Price point score (weight: 10%)
      if (p.price >= 10 && p.price <= 30) score += 10;
      else if (p.price > 30 && p.price <= 50) score += 8;
      else if (p.price > 5 && p.price < 10) score += 6;
      else if (p.price > 50 && p.price <= 80) score += 4;
      else score += 2;
      
      return { ...p, score, categoryMatch, productCategories };
    });
    
    // Sort by score descending
    scoredProducts.sort((a, b) => b.score - a.score);
    
    // Check if best product actually matches category
    const matchingProducts = scoredProducts.filter(p => p.categoryMatch);
    const bestProduct = matchingProducts.length > 0 ? matchingProducts[0] : scoredProducts[0];
    const hasValidMatch = bestProduct.categoryMatch;
    
    console.log(`[AI-Products] Best match: "${bestProduct.title}" (score: ${bestProduct.score}, categoryMatch: ${hasValidMatch})`);
    
    // Generate AI explanation
    let reason = '';
    try {
      const claudeService = new ClaudeAIService();
      
      if (!hasValidMatch) {
        // Product doesn't match - generate warning
        const prompt = `Tu es un expert dropshipping. Le produit source est "${sourceProduct}" (catégorie: ${sourceCategories.join('/')}).

Le produit recommandé par l'algorithme est: "${bestProduct.title}" (catégorie: ${bestProduct.productCategories.join('/')}).

CE N'EST PAS UN MATCH! Ces produits sont de catégories différentes.

Génère un court avertissement (2-3 phrases) en français expliquant:
1. Pourquoi ce n'est PAS un bon match (catégorie différente)
2. Ce que l'utilisateur devrait chercher à la place

Commence par "❌ Attention :"`;

        reason = await claudeService.generateContent(prompt, 300) || '❌ Attention : Ce produit ne correspond pas à la catégorie recherchée.';
      } else {
        // Good match - explain why it's good
        const prompt = `Tu es un expert dropshipping. Explique en 2-3 phrases pourquoi ce produit AliExpress est le MEILLEUR choix.

Produit source (boutique): "${sourceProduct}"

Produit recommandé (AliExpress):
- Titre: ${bestProduct.title}
- Prix AliExpress: $${bestProduct.price.toFixed(2)}
- Ventes: ${bestProduct.sales}
- Profit potentiel: $${bestProduct.profit.toFixed(2)} (${bestProduct.profitPercent}%)
- Catégorie: ${bestProduct.productCategories.join('/')}

Parmi ${matchingProducts.length} produits similaires analysés.

Réponds en français. Mentionne:
1. Pourquoi c'est similaire au produit source
2. Les ventes et la fiabilité du vendeur
3. La marge de profit

Commence par "✅ "`;

        reason = await claudeService.generateContent(prompt, 300) || '';
      }
    } catch {
      // Fallback to rule-based reason
      if (!hasValidMatch) {
        reason = `❌ Attention : Ce produit (${bestProduct.productCategories.join('/')}) ne correspond pas à "${sourceProduct}" (${sourceCategories.join('/')}). Cherchez des produits de la même catégorie.`;
      } else {
        const reasons = [];
        if (bestProduct.sales >= 1000) reasons.push(`${bestProduct.sales.toLocaleString()} ventes prouvées`);
        if (bestProduct.profitPercent >= 60) reasons.push(`marge de ${bestProduct.profitPercent}%`);
        reason = `✅ Meilleur choix : ${reasons.join(', ')}.`;
      }
    }

    return NextResponse.json({
      success: true,
      recommendedId: bestProduct.id,
      recommendedIndex: bestProduct.index,
      reason,
      isValidMatch: hasValidMatch,
      sourceCategories,
      matchingProductsCount: matchingProducts.length,
      allScores: scoredProducts.map(p => ({ id: p.id, score: p.score, categoryMatch: p.categoryMatch }))
    })

  } catch (error) {
    console.error('Product analysis error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze products'
    }, { status: 500 })
  }
}
