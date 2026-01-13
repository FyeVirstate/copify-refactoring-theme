import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

const THEMES_BASE_PATH = process.env.THEMES_PATH || path.join(process.cwd(), 'themes')

// MIME types for common theme assets
const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.json': 'application/json',
  '.liquid': 'text/plain',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    const assetPath = resolvedParams.path.join('/')
    
    // Build full file path - assets are stored in themes/
    const filePath = path.join(THEMES_BASE_PATH, assetPath)
    
    // Security: Ensure the path doesn't escape the themes directory
    const normalizedPath = path.normalize(filePath)
    if (!normalizedPath.startsWith(path.normalize(THEMES_BASE_PATH))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('Theme asset not found:', filePath)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    
    // Get file stats and read file
    const stats = fs.statSync(filePath)
    if (stats.isDirectory()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    
    const fileContent = fs.readFileSync(filePath)
    
    // Determine MIME type
    const ext = path.extname(filePath).toLowerCase()
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream'
    
    // Return the file with appropriate headers
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
    
  } catch (error) {
    console.error('Error serving theme asset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
