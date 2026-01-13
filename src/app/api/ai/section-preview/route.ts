import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

const LIQUID_SERVICE_URL = process.env.LIQUID_SERVICE_URL || 'https://web-production-86921.up.railway.app/'
const THEMES_BASE_PATH = process.env.THEMES_PATH || path.join(process.cwd(), 'themes')
// Path to themes on the Liquid service server (Railway)
const LIQUID_SERVICE_THEMES_PATH = process.env.LIQUID_SERVICE_THEMES_PATH || '/app/themes'

/**
 * Load section schema from section liquid file
 */
function loadSectionSchema(themeKey: string, sectionType: string): Record<string, unknown> | null {
  const sectionPath = path.join(THEMES_BASE_PATH, themeKey, 'sections', `${sectionType}.liquid`)
  
  try {
    if (fs.existsSync(sectionPath)) {
      const content = fs.readFileSync(sectionPath, 'utf-8')
      
      // Extract schema from {% schema %}...{% endschema %}
      const schemaMatch = content.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/i)
      if (schemaMatch && schemaMatch[1]) {
        return JSON.parse(schemaMatch[1].trim())
      }
    }
  } catch (error) {
    console.error('Error loading section schema:', error)
  }
  
  return null
}

/**
 * Get default settings from section schema
 */
function getDefaultSettings(schema: Record<string, unknown>): Record<string, unknown> {
  const settings: Record<string, unknown> = {}
  
  if (schema.settings && Array.isArray(schema.settings)) {
    for (const setting of schema.settings) {
      if (setting.id && setting.default !== undefined) {
        settings[setting.id] = setting.default
      }
    }
  }
  
  return settings
}

/**
 * Get default blocks from section schema
 */
function getDefaultBlocks(schema: Record<string, unknown>): Array<Record<string, unknown>> {
  const blocks: Array<Record<string, unknown>> = []
  
  if (schema.presets && Array.isArray(schema.presets) && schema.presets[0]?.blocks) {
    for (const block of schema.presets[0].blocks) {
      const blockSettings: Record<string, unknown> = {}
      
      // Find block type definition to get defaults
      if (schema.blocks && Array.isArray(schema.blocks)) {
        const blockDef = schema.blocks.find((b: Record<string, unknown>) => b.type === block.type)
        if (blockDef?.settings && Array.isArray(blockDef.settings)) {
          for (const setting of blockDef.settings) {
            if (setting.id && setting.default !== undefined) {
              blockSettings[setting.id] = setting.default
            }
          }
        }
      }
      
      // Override with preset values
      if (block.settings) {
        Object.assign(blockSettings, block.settings)
      }
      
      blocks.push({
        type: block.type,
        settings: blockSettings
      })
    }
  }
  
  return blocks
}

/**
 * Convert hex color to RGB string
 */
function hexToRgbString(hex: string): string {
  if (hex.startsWith('#')) {
    const hexValue = hex.slice(1)
    const r = parseInt(hexValue.substring(0, 2), 16)
    const g = parseInt(hexValue.substring(2, 4), 16)
    const b = parseInt(hexValue.substring(4, 6), 16)
    return `${r},${g},${b}`
  }
  return '0,0,0'
}

/**
 * Lighten a color
 */
function lightenColor(hex: string, factor: number): string {
  if (!hex.startsWith('#')) return '247,243,237'
  const hexValue = hex.slice(1)
  const r = parseInt(hexValue.substring(0, 2), 16)
  const g = parseInt(hexValue.substring(2, 4), 16)
  const b = parseInt(hexValue.substring(4, 6), 16)
  
  const newR = Math.round(r + (255 - r) * factor)
  const newG = Math.round(g + (255 - g) * factor)
  const newB = Math.round(b + (255 - b) * factor)
  
  return `${newR},${newG},${newB}`
}

/**
 * Generate CSS variables for preview
 */
function generateCssVariables(aiContent: Record<string, unknown>): string {
  const primaryHex = (aiContent.primary_color_picker as string) || '#6f6254'
  const tertiaryHex = (aiContent.tertiary_color_picker as string) || '#e6e1dc'
  const primaryRgb = hexToRgbString(primaryHex)
  const tertiaryRgb = hexToRgbString(tertiaryHex)
  const fontFamily = (aiContent.font_family_input as string) || (aiContent.font_family as string) || 'Inter'
  
  const innerHighlightRgb = lightenColor(primaryHex, 0.85)
  
  return `
    :root {
      --color-base-text: ${primaryRgb};
      --color-shadow: ${primaryRgb};
      --color-button: ${primaryRgb};
      --color-button-text: 255,255,255;
      --color-secondary-button: ${primaryRgb};
      --color-secondary-button-text: 255,255,255;
      --color-link: ${primaryRgb};
      --color-badge-foreground: ${primaryRgb};
      --color-badge-background: ${tertiaryRgb};
      --color-badge-border: ${primaryRgb};
      --color-background: 255,255,255;
      --color-foreground: ${primaryRgb};
      --color-innerHighlight: ${innerHighlightRgb};
      --color-highliter: ${primaryHex};
      --font-body-family: "${fontFamily}", sans-serif;
      --font-heading-family: "${fontFamily}", sans-serif;
    }
  `
}

/**
 * Wrap section HTML in preview layout
 */
function wrapInPreviewLayout(sectionHtml: string, cssVariables: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        ${cssVariables}
        * { box-sizing: border-box; }
        body { 
          margin: 0; 
          padding: 16px;
          font-family: var(--font-body-family);
          color: rgb(var(--color-foreground));
          background: rgb(var(--color-background));
        }
        img { max-width: 100%; height: auto; }
      </style>
    </head>
    <body>
      ${sectionHtml}
    </body>
    </html>
  `
}

/**
 * Rewrite asset URLs in HTML to use our proxy
 * This transforms /shopify/ URLs to /api/shopify/ which serves the actual assets
 */
function rewriteAssetUrls(html: string, aiContent: Record<string, unknown>, baseUrl: string): string {
  // Rewrite /shopify/ URLs to /api/shopify/
  let result = html.replace(/(['"])\/shopify\//g, '$1/api/shopify/')
  
  // Generate and inject CSS variables for theme colors
  const cssVariables = generateCssVariables(aiContent)
  const cssInjection = `
<style data-shopify-color-override="">
${cssVariables}
</style>
`

  // Add <base> tag for blob URL compatibility
  const baseTag = `<base href="${baseUrl}">`
  if (result.includes('<head>')) {
    result = result.replace('<head>', `<head>\n${baseTag}`)
  } else if (result.includes('<HEAD>')) {
    result = result.replace('<HEAD>', `<HEAD>\n${baseTag}`)
  }
  
  // Inject CSS variables before </head>
  if (result.includes('</head>')) {
    result = result.replace('</head>', `${cssInjection}</head>`)
  }
  
  return result
}

/**
 * POST /api/ai/section-preview
 * Render a single section preview
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Section Preview] Starting request...')
    
    let session;
    try {
      session = await auth()
    } catch (authError) {
      console.error('[Section Preview] Auth error:', authError)
      return NextResponse.json({ success: false, message: 'Auth error' }, { status: 500 })
    }
    
    if (!session?.user?.email) {
      console.log('[Section Preview] Unauthorized - no session')
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    let body;
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('[Section Preview] JSON parse error:', parseError)
      return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 })
    }
    
    const { productId, sectionType, themeKey = 'theme_v4' } = body
    
    console.log('[Section Preview] Request params:', { productId, sectionType, themeKey })

    if (!sectionType) {
      console.log('[Section Preview] No section type provided')
      return NextResponse.json({ success: false, message: 'Section type required' }, { status: 400 })
    }

    let prisma;
    try {
      prisma = getPrisma()
      console.log('[Section Preview] Prisma client obtained')
    } catch (prismaError) {
      console.error('[Section Preview] Prisma error:', prismaError)
      return NextResponse.json({ success: false, message: 'Database not configured' }, { status: 500 })
    }
    
    // Get product data if provided
    let aiContent: Record<string, unknown> = {}
    let productData: Record<string, unknown> = {}
    
    if (productId) {
      console.log('[Section Preview] Fetching product:', productId)
      try {
        const generateProduct = await prisma.generateProduct.findUnique({
          where: { id: parseInt(productId) }
        })
        
        if (generateProduct) {
          aiContent = (generateProduct.aicontent as Record<string, unknown>) || {}
          productData = {
            title: generateProduct.product_title || 'Sample Product',
            description: generateProduct.product_description || '',
            price: generateProduct.product_price || 29.99,
            images: generateProduct.product_images || []
          }
          console.log('[Section Preview] Product found:', generateProduct.product_title)
        } else {
          console.log('[Section Preview] Product not found')
        }
      } catch (dbError) {
        console.error('[Section Preview] Database query error:', dbError)
        // Continue without product data
      }
    }

    // Load section schema
    console.log('[Section Preview] Loading schema for:', sectionType, 'in theme:', themeKey)
    const sectionPath = path.join(THEMES_BASE_PATH, themeKey, 'sections', `${sectionType}.liquid`)
    console.log('[Section Preview] Section path:', sectionPath)
    console.log('[Section Preview] File exists:', fs.existsSync(sectionPath))
    
    const schema = loadSectionSchema(themeKey, sectionType)
    
    if (!schema) {
      console.log('[Section Preview] Schema not found for section:', sectionType)
      // Return a placeholder if section doesn't exist
      const cssVariables = generateCssVariables(aiContent)
      const placeholderHtml = `
        <div style="padding: 40px; text-align: center; background: #f5f5f5; border-radius: 8px;">
          <p style="color: #666;">Section "${sectionType}" preview</p>
          <p style="color: #999; font-size: 12px;">Schema not found at: ${sectionPath}</p>
        </div>
      `
      return NextResponse.json({
        success: true,
        html: wrapInPreviewLayout(placeholderHtml, cssVariables)
      })
    }
    
    console.log('[Section Preview] Schema loaded successfully')

    // Get default settings and blocks from schema
    const defaultSettings = getDefaultSettings(schema)
    const defaultBlocks = getDefaultBlocks(schema)
    
    // Build section config
    const sectionId = `${sectionType.replace(/-/g, '_')}_preview`
    const blockOrder = defaultBlocks.map((_, i) => `block_${i}`)
    const blocksObj: Record<string, unknown> = {}
    defaultBlocks.forEach((block, i) => {
      blocksObj[`block_${i}`] = block
    })

    const sections = [{
      key: sectionId,
      type: sectionType,
      settings: defaultSettings,
      blocks: blocksObj,
      block_order: blockOrder
    }]

    // Build context
    const context = {
      shop: {
        name: (aiContent.store_name as string) || 'Store',
        email: 'contact@store.com',
        currency: 'USD',
        money_format: '${{amount}}'
      },
      product: {
        title: productData.title || 'Sample Product',
        description: productData.description || 'Product description',
        price: (productData.price as number) * 100 || 2999,
        compare_at_price: null,
        available: true,
        images: Array.isArray(productData.images) ? productData.images.map((url: string) => ({
          src: url,
          alt: productData.title || 'Product'
        })) : [],
        variants: [{
          id: 1,
          title: 'Default',
          price: (productData.price as number) * 100 || 2999,
          available: true
        }]
      },
      aicontent: aiContent
    }

    // Theme path for Liquid service (Railway path, not local)
    const themePath = `${LIQUID_SERVICE_THEMES_PATH}/${themeKey}`
    
    console.log('[Section Preview] Theme path:', themePath)
    console.log('[Section Preview] Calling Liquid service at:', LIQUID_SERVICE_URL)
    console.log('[Section Preview] Sections:', JSON.stringify(sections, null, 2))

    // Call Liquid service
    try {
      const requestBody = {
        theme_path: themePath,
        layout: 'theme',
        sections,
        context
      }
      
      console.log('[Section Preview] Request body size:', JSON.stringify(requestBody).length, 'bytes')
      
      const response = await fetch(`${LIQUID_SERVICE_URL}/render-theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      console.log('[Section Preview] Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('[Section Preview] Result success:', result.success, 'HTML length:', result.html?.length || 0)
        
        if (result.success && result.html) {
          // Rewrite asset URLs to use our proxy (/api/shopify/)
          const baseUrl = 'http://localhost:3000'
          const rewrittenHtml = rewriteAssetUrls(result.html, aiContent, baseUrl)
          
          return NextResponse.json({
            success: true,
            html: rewrittenHtml
          })
        }
      } else {
        const errorText = await response.text()
        console.error('[Section Preview] Liquid service error response:', errorText.substring(0, 500))
      }
    } catch (error) {
      console.error('[Section Preview] Liquid service error:', error)
    }

    // Fallback - return placeholder
    console.log('[Section Preview] Using fallback placeholder')
    const cssVariables = generateCssVariables(aiContent)
    const fallbackHtml = `
      <div style="padding: 40px; text-align: center; background: #f9f9f9; border-radius: 8px; border: 1px solid #eee;">
        <p style="color: #666; margin: 0;">Preview for "${sectionType}"</p>
        <p style="color: #999; font-size: 12px; margin-top: 8px;">Add this section to see it in your theme</p>
      </div>
    `
    
    return NextResponse.json({
      success: true,
      html: wrapInPreviewLayout(fallbackHtml, cssVariables)
    })

  } catch (error) {
    console.error('[Section Preview] CRITICAL ERROR:', error)
    console.error('[Section Preview] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json({ 
      success: false, 
      message: 'Internal error',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
