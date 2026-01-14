import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { fal } from '@fal-ai/client';

export const maxDuration = 60; // 1 minute timeout for upload

const FAL_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY || '';

// Configure fal client
fal.config({
  credentials: FAL_KEY
});

/**
 * POST /api/ai/upload-image
 * 
 * Upload an image to FAL storage and return a public URL
 * This is needed because FAL can't access blob: URLs or localhost URLs
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Check if FAL key is configured
    if (!FAL_KEY) {
      return NextResponse.json(
        { success: false, message: 'FAL API key not configured' },
        { status: 500 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    
    let fileToUpload: File | Blob;
    let fileName = `upload-${Date.now()}.png`;
    let mimeType = 'image/png';

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData upload
      const formData = await request.formData();
      const file = formData.get('image') as File;
      
      if (!file) {
        return NextResponse.json(
          { success: false, message: 'No image file provided' },
          { status: 400 }
        );
      }

      fileToUpload = file;
      fileName = file.name || fileName;
      mimeType = file.type || mimeType;
    } else if (contentType.includes('application/json')) {
      // Handle base64 upload
      const body = await request.json();
      const { base64, filename, mimetype } = body;

      if (!base64) {
        return NextResponse.json(
          { success: false, message: 'No base64 image data provided' },
          { status: 400 }
        );
      }

      // Remove data URL prefix if present
      const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      if (filename) fileName = filename;
      if (mimetype) mimeType = mimetype;
      
      // Create a Blob from the buffer
      fileToUpload = new Blob([buffer], { type: mimeType });
    } else {
      return NextResponse.json(
        { success: false, message: 'Unsupported content type' },
        { status: 400 }
      );
    }

    console.log('[Upload Image] Uploading to FAL storage...', {
      userId: session.user.id,
      fileName,
      size: fileToUpload.size,
    });

    // Use fal.storage.upload() - the proper way to upload files
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileUrl = await (fal as any).storage.upload(fileToUpload);
    
    console.log('[Upload Image] Success', {
      userId: session.user.id,
      url: fileUrl?.substring(0, 50) + '...',
    });

    return NextResponse.json({
      success: true,
      url: fileUrl,
    });

  } catch (error) {
    console.error('[Upload Image] Error:', error);
    return NextResponse.json(
      { success: false, message: "Une erreur s'est produite lors du téléchargement." },
      { status: 500 }
    );
  }
}
