import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ShopifyThemeService } from '@/lib/services/shopify';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/ai/push-theme
 * Push generated AI content to Shopify store
 */
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { productId, method = 'template', publish = false } = await req.json();

    if (!productId) {
      return NextResponse.json({ message: 'Missing productId' }, { status: 400 });
    }

    // Get user's Shopify credentials
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: {
        shopifyDomain: true,
        shopifyAccessToken: true,
      },
    });

    if (!user?.shopifyDomain || !user?.shopifyAccessToken) {
      return NextResponse.json(
        { message: 'Shopify store not connected. Please connect your store in settings.' },
        { status: 400 }
      );
    }

    // Get the generated product
    const product = await prisma.generate_products.findFirst({
      where: {
        id: BigInt(productId),
        user_id: BigInt(userId),
      },
    });

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Initialize Shopify service
    const shopifyService = new ShopifyThemeService(user.shopifyDomain, user.shopifyAccessToken);

    // Extract AI content
    const aiContent = product.aicontent as any || {};
    const productContent = product.product_content as any || {};
    const images = (product.ai_generated_images as string[]) || [];

    // Build Shopify product data
    const shopifyProductData = {
      title: product.product_name || aiContent.title,
      body_html: buildProductDescription(aiContent, productContent),
      vendor: aiContent.store_name || 'CopyfyAI Store',
      product_type: product.category || aiContent.category || 'General',
      tags: buildProductTags(aiContent),
      variants: [
        {
          price: extractPrice(aiContent.price || productContent.price),
          compare_at_price: aiContent.compare_at_price ? extractPrice(aiContent.compare_at_price) : undefined,
          inventory_management: null,
          inventory_quantity: 999,
        },
      ],
      images: images.map((url: string, index: number) => ({
        src: url,
        position: index + 1,
      })),
    };

    let result: any = {};

    if (method === 'full') {
      // Full theme upload (creates new theme)
      result = await pushFullTheme(shopifyService, shopifyProductData, aiContent, publish);
    } else {
      // Template-only (add product to existing theme)
      result = await pushProductOnly(shopifyService, shopifyProductData);
    }

    // Update product status in database
    await prisma.generate_products.update({
      where: { id: BigInt(productId) },
      data: {
        product_id: result.product?.id?.toString() || null,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Theme pushed successfully to Shopify',
      ...result,
    });
  } catch (error: any) {
    console.error('Error pushing theme to Shopify:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to push theme to Shopify' },
      { status: 500 }
    );
  }
}

/**
 * Push only the product (no theme modifications)
 */
async function pushProductOnly(
  shopifyService: ShopifyThemeService,
  productData: any
): Promise<any> {
  // Create product on Shopify
  const { product } = await shopifyService.createProduct(productData);

  return {
    method: 'product-only',
    product: {
      id: product.id,
      handle: product.handle,
      url: `https://${shopifyService.getFullDomain()}/products/${product.handle}`,
    },
  };
}

/**
 * Push full theme with product template
 */
async function pushFullTheme(
  shopifyService: ShopifyThemeService,
  productData: any,
  aiContent: any,
  publish: boolean
): Promise<any> {
  // Get active theme
  const activeTheme = await shopifyService.getActiveTheme();
  
  if (!activeTheme) {
    throw new Error('No active theme found on Shopify store');
  }

  const themeId = activeTheme.theme.id;

  // Generate unique template suffix
  const templateSuffix = `copyfy-${Date.now()}`;

  // Create product template JSON
  const productTemplate = buildProductTemplate(aiContent, templateSuffix);

  // Add template to theme
  await shopifyService.addProductTemplate(themeId, templateSuffix, productTemplate);

  // Create product with custom template
  const { product } = await shopifyService.createProductWithTemplate(
    productData,
    templateSuffix
  );

  // Optionally add sections
  // await addCustomSections(shopifyService, themeId, aiContent);

  return {
    method: 'full-theme',
    themeId,
    templateSuffix,
    product: {
      id: product.id,
      handle: product.handle,
      url: `https://${shopifyService.getFullDomain()}/products/${product.handle}`,
    },
  };
}

/**
 * Build product description HTML from AI content
 */
function buildProductDescription(aiContent: any, productContent: any): string {
  const description = aiContent.description || productContent.description || '';
  const features = aiContent.features || [];
  const benefits = aiContent.benefits || [];

  let html = `<div class="product-description">${description}</div>`;

  if (features.length > 0) {
    html += `
      <div class="product-features">
        <h3>Caractéristiques</h3>
        <ul>
          ${features.map((f: string) => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  if (benefits.length > 0) {
    html += `
      <div class="product-benefits">
        <h3>Avantages</h3>
        <ul>
          ${benefits.map((b: any) => `<li><strong>${b.title || b}</strong>${b.text ? `: ${b.text}` : ''}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  return html;
}

/**
 * Build product tags from AI content
 */
function buildProductTags(aiContent: any): string {
  const tags: string[] = ['CopyfyAI'];
  
  if (aiContent.category) tags.push(aiContent.category);
  if (aiContent.niche) tags.push(aiContent.niche);
  
  return tags.join(', ');
}

/**
 * Extract numeric price from string
 */
function extractPrice(price: string | number): string {
  if (typeof price === 'number') return price.toFixed(2);
  if (!price) return '0.00';
  
  // Remove currency symbols and extract number
  const match = price.toString().match(/[\d,.]+/);
  if (match) {
    return parseFloat(match[0].replace(',', '.')).toFixed(2);
  }
  return '0.00';
}

/**
 * Build product template JSON for Shopify
 */
function buildProductTemplate(aiContent: any, templateSuffix: string): object {
  return {
    name: `product.${templateSuffix}`,
    sections: {
      main: {
        type: 'main-product',
        settings: {
          enable_sticky_info: true,
          show_vendor: true,
        },
        blocks: {
          title: { type: 'title', settings: {} },
          price: { type: 'price', settings: {} },
          variant_picker: { type: 'variant_picker', settings: { picker_type: 'button' } },
          quantity_selector: { type: 'quantity_selector', settings: {} },
          buy_buttons: { type: 'buy_buttons', settings: { show_dynamic_checkout: true } },
          description: { type: 'description', settings: {} },
        },
        block_order: ['title', 'price', 'variant_picker', 'quantity_selector', 'buy_buttons', 'description'],
      },
    },
    order: ['main'],
  };
}

