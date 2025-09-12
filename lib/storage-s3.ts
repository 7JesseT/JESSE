import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// S3 configuration from environment variables
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const S3_REGION = process.env.S3_REGION || 'us-east-1';
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_UPLOAD_PREFIX = process.env.S3_UPLOAD_PREFIX || 'uploads';
const SIGNED_URL_EXPIRY_SECONDS = parseInt(process.env.SIGNED_URL_EXPIRY_SECONDS || '3600');

// Check if S3 is configured
export const isS3Configured = (): boolean => {
  return !!(S3_BUCKET_NAME && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY);
};

// Initialize S3 client
const getS3Client = (): S3Client => {
  if (!isS3Configured()) {
    throw new Error('S3 configuration is missing. Please set S3_BUCKET_NAME, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY environment variables.');
  }

  return new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID!,
      secretAccessKey: S3_SECRET_ACCESS_KEY!,
    },
  });
};

// Upload file to S3
export const uploadFileToS3 = async (
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<{ key: string; url?: string }> => {
  if (!isS3Configured()) {
    throw new Error('S3 is not configured');
  }

  const client = getS3Client();
  
  // Generate deterministic upload path
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
  const uuid = uuidv4();
  const key = `${S3_UPLOAD_PREFIX}/${date}/${uuid}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'private', // Ensure files are private by default
  });

  try {
    await client.send(command);
    
    return {
      key,
      // Note: We don't return a public URL since files are private
      // Access is only through signed URLs
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Generate signed download URL
export const getSignedDownloadUrl = async (
  key: string,
  expiresInSeconds: number = SIGNED_URL_EXPIRY_SECONDS
): Promise<string> => {
  if (!isS3Configured()) {
    throw new Error('S3 is not configured');
  }

  const client = getS3Client();
  
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
  });

  try {
    const signedUrl = await getSignedUrl(client, command, {
      expiresIn: expiresInSeconds,
    });
    
    return signedUrl;
  } catch (error) {
    console.error('S3 signed URL generation error:', error);
    throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Validate file before upload
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'Only PDF files are allowed' };
  }

  // Check file size (max 10 MB)
  const maxSize = 10 * 1024 * 1024; // 10 MB in bytes
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10 MB' };
  }

  return { valid: true };
};

// Get S3 configuration status for debugging
export const getS3ConfigStatus = () => {
  return {
    configured: isS3Configured(),
    bucket: S3_BUCKET_NAME ? '***' : 'Not set',
    region: S3_REGION,
    prefix: S3_UPLOAD_PREFIX,
    expirySeconds: SIGNED_URL_EXPIRY_SECONDS,
    hasAccessKey: !!S3_ACCESS_KEY_ID,
    hasSecretKey: !!S3_SECRET_ACCESS_KEY,
  };
};
