import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ClaudeAIService } from "@/lib/services/claude";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { fieldName, currentValue, productTitle, productDescription, language = 'fr' } = body;

    if (!fieldName) {
      return NextResponse.json({ error: "Nom du champ requis" }, { status: 400 });
    }

    // Create prompts based on field type
    const prompts: Record<string, string> = {
      title: `Génère un titre de produit accrocheur et vendeur pour un produit e-commerce.
Le titre actuel est: "${currentValue || 'Non défini'}"
La description du produit est: "${productDescription || 'Non disponible'}"

Le nouveau titre doit être:
- Accrocheur et mémorable
- Maximum 60 caractères
- Orienté bénéfice client
- En ${language === 'fr' ? 'français' : language}

Réponds UNIQUEMENT avec le nouveau titre, sans guillemets ni explication.`,

      description: `Génère une description de produit engageante et convaincante pour un produit e-commerce.
Le titre du produit est: "${productTitle || 'Non défini'}"
La description actuelle est: "${currentValue || 'Non disponible'}"

La nouvelle description doit être:
- Engageante et convaincante
- Entre 150 et 300 caractères
- Mettre en avant les bénéfices clés
- Utiliser un ton professionnel mais accessible
- En ${language === 'fr' ? 'français' : language}

Réponds UNIQUEMENT avec la nouvelle description, sans guillemets ni explication.`,

      mainCatchyText: `Génère un titre accrocheur principal (headline) pour la section hero d'une page produit.
Le produit est: "${productTitle || 'Non défini'}"
Le titre actuel est: "${currentValue || 'Non défini'}"

Le nouveau titre doit être:
- Court et percutant (maximum 8 mots)
- Créer une émotion ou curiosité
- Orienté bénéfice ou transformation
- En ${language === 'fr' ? 'français' : language}

Réponds UNIQUEMENT avec le nouveau titre, sans guillemets ni explication.`,

      subMainCatchyText: `Génère un sous-titre accrocheur pour la section hero d'une page produit.
Le produit est: "${productTitle || 'Non défini'}"
Le titre principal est: "${currentValue || 'Non défini'}"

Le nouveau sous-titre doit être:
- Complémentaire au titre principal
- Maximum 12 mots
- Apporter une précision ou un bénéfice supplémentaire
- En ${language === 'fr' ? 'français' : language}

Réponds UNIQUEMENT avec le nouveau sous-titre, sans guillemets ni explication.`,
    };

    const prompt = prompts[fieldName];
    if (!prompt) {
      return NextResponse.json(
        { error: `Régénération non supportée pour le champ: ${fieldName}` },
        { status: 400 }
      );
    }

    // Use Claude AI to regenerate
    const claudeService = new ClaudeAIService();
    const newValue = await claudeService.generateContent(prompt);

    if (!newValue) {
      return NextResponse.json(
        { error: "Échec de la génération du contenu" },
        { status: 500 }
      );
    }

    // Clean up the response (remove quotes if present)
    const cleanValue = newValue.trim().replace(/^["']|["']$/g, '');

    return NextResponse.json({ 
      success: true, 
      newValue: cleanValue,
      fieldName 
    });

  } catch (error) {
    console.error("Error regenerating field:", error);
    return NextResponse.json(
      { error: "Erreur lors de la régénération" },
      { status: 500 }
    );
  }
}

