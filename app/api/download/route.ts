import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { isTokenValid } from '@/lib/purchases';
import { getFileById } from '@/lib/files';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      );
    }

    // Validate token
    const isValid = await isTokenValid(token);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 403 }
      );
    }

    // Get purchase details to find the file
    const { getPurchaseByToken } = await import('@/lib/purchases');
    const purchase = await getPurchaseByToken(token);
    
    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    const file = await getFileById(purchase.fileId);
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Stream the file
    const filePath = path.join(process.cwd(), 'public', 'files', file.filename);
    
    try {
      const fileBuffer = await fs.readFile(filePath);
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${file.title}.pdf"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    } catch (fileError) {
      return NextResponse.json(
        { error: 'File not found on disk' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}
