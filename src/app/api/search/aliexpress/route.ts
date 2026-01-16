import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Check if URL is an image link
function isImageLink(url: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  const extension = url.split('.').pop()?.toLowerCase().split('?')[0] || ''
  return imageExtensions.includes(extension)
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    let { url, price } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // If the URL is not an image link, try to fetch the image URL from Shopify
    if (!isImageLink(url)) {
      try {
        const shopifyResponse = await fetch(`${url}.json`)
        if (shopifyResponse.ok) {
          const shopifyData = await shopifyResponse.json()
          if (shopifyData?.product?.images?.length > 0) {
            url = shopifyData.product.images[0].src
          }
        }
      } catch (e) {
        // Ignore error, continue with original URL
        console.log('Failed to fetch Shopify product:', e)
      }
    }

    // Prepare query parameters for the API request
    const queryParams = new URLSearchParams({
      sort: 'salesDesc',
      catId: '0',
      imgUrl: url,
    })

    // Add French locale
    queryParams.append('locale', 'fr_FR')

    // Make the API request to AliExpress DataHub via RapidAPI
    const response = await fetch(
      `https://aliexpress-datahub.p.rapidapi.com/item_search_image?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'aliexpress-datahub.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY || '0195f6b9e2mshf728d226ba3a9b4p1cd80cjsne047e7e50f2c',
        },
      }
    )

    if (!response.ok) {
      console.error('RapidAPI Error:', response.status, await response.text())
      return NextResponse.json({ error: 'Failed to fetch products from AliExpress' }, { status: 500 })
    }

    const data = await response.json()
    let items = data?.result?.resultList || []

    // If a price is provided, calculate the profit for each item
    if (price && !isNaN(parseFloat(price)) && parseFloat(price) > 0) {
      const productPrice = parseFloat(price)
      items = items.map((item: any) => {
        if (item?.item?.sku?.def?.promotionPrice) {
          const aliPrice = parseFloat(item.item.sku.def.promotionPrice)
          const profit = productPrice - aliPrice
          const profitPercentage = ((profit / productPrice) * 100).toFixed(0)
          return {
            ...item,
            calculatedProfit: profit.toFixed(2),
            profitPercentage: `${profitPercentage}%`,
          }
        }
        return item
      })
    }

    return NextResponse.json({ 
      success: true, 
      items,
      total: items.length 
    })
  } catch (error) {
    console.error('AliExpress search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
