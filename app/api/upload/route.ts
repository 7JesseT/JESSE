import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import formidable from 'formidable';
import { addFile, FileMetadata } from '@/lib/files';
import { uploadFileToS3, validateFile, isS3Configured } from '@/lib/storage-s3';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priceUsd = parseFloat(formData.get('priceUsd') as string);
    const recipient = formData.get('recipient') as string;
    const isFree = formData.get('isFree') === 'true';

    if (!file || !title || !description || isNaN(priceUsd)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For paid files, require recipient
    if (!isFree && !recipient) {
      return NextResponse.json(
        { error: 'Recipient address is required for paid files' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const filename = `${uuidv4()}${fileExtension}`;
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let s3Key: string | undefined;
    let storageMethod: string;

    // Try S3 upload first if configured
    if (isS3Configured()) {
      try {
        const uploadResult = await uploadFileToS3(buffer, file.name, file.type);
        s3Key = uploadResult.key;
        storageMethod = 'S3';
        console.log(`File uploaded to S3: ${s3Key}`);
      } catch (s3Error) {
        console.error('S3 upload failed, falling back to local storage:', s3Error);
        // Fall through to local storage
      }
    }

    // Fallback to local storage if S3 is not configured or failed
    if (!s3Key) {
      // Create files directory if it doesn't exist
      const filesDir = path.join(process.cwd(), 'public', 'files');
      await fs.mkdir(filesDir, { recursive: true });

      const filePath = path.join(filesDir, filename);
      await fs.writeFile(filePath, buffer);
      storageMethod = 'local';
      console.log(`File saved locally: ${filePath}`);
    }

    // Create file metadata
    const fileMetadata: FileMetadata = {
      id: uuidv4(),
      filename,
      title,
      description,
      priceUsd,
      priceToken: 'USDC',
      recipient: recipient || '', // Empty string for free files
      uploadedAt: new Date().toISOString(),
      s3Key, // Will be undefined for local storage
      isFree, // Add the isFree field
    };

    // Save metadata
    await addFile(fileMetadata);

    // Create audit log for file upload
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'upload',
          actor: 'admin', // File uploads are typically admin-only
          details: {
            fileId: fileMetadata.id,
            filename: fileMetadata.filename,
            title: fileMetadata.title,
            size: buffer.length,
            type: file.type,
            priceUsd: fileMetadata.priceUsd,
            recipient: fileMetadata.recipient,
            isFree: fileMetadata.isFree,
            storageMethod,
            s3Key: s3Key || null
          },
          metadata: `File upload: ${fileMetadata.title} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`
        })
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    return NextResponse.json({
      success: true,
      file: fileMetadata,
      storageMethod,
      s3Key: s3Key || null,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
