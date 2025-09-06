import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import formidable from 'formidable';
import { addFile, FileMetadata } from '@/lib/files';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priceUsd = parseFloat(formData.get('priceUsd') as string);
    const recipient = formData.get('recipient') as string;

    if (!file || !title || !description || isNaN(priceUsd) || !recipient) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create files directory if it doesn't exist
    const filesDir = path.join(process.cwd(), 'public', 'files');
    await fs.mkdir(filesDir, { recursive: true });

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const filename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(filesDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    // Create file metadata
    const fileMetadata: FileMetadata = {
      id: uuidv4(),
      filename,
      title,
      description,
      priceUsd,
      priceToken: 'USDC',
      recipient,
      uploadedAt: new Date().toISOString(),
    };

    // Save metadata
    await addFile(fileMetadata);

    return NextResponse.json({
      success: true,
      file: fileMetadata,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
