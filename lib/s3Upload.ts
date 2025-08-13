import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

// Optimize S3 client configuration
const s3 = new S3Client({
  region: process.env.S3_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  // Performance optimizations
  maxAttempts: 2, // Reduce retry attempts for faster failure
  // Use HTTP/2 if available
  requestHandler: {
    connectionTimeout: 5000,
    socketTimeout: 30000,
  }
});

export async function uploadToS3(
  buffer: Buffer, 
  fileName: string, 
  folder: string, 
  mimetype: string
): Promise<string> {
  
  // Quick validation - only essential checks
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(mimetype)) {
    throw new Error('Nepieļaujams faila tips');
  }

  const maxSize = 10 * 1024 * 1024; // 10MB limit
  if (buffer.length > maxSize) {
    throw new Error(`Fails pārāk liels (max 10MB)`);
  }

  // Optimized file naming - simpler and faster
  const timestamp = new Date().toISOString().split('T')[0];
  const uuid = randomUUID();
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  
  // Simplified sanitization
  const sanitizedName = fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase()
    .substring(0, 50); // Shorter for performance
  
  const key = `${folder}/${timestamp}/${uuid}_${sanitizedName}`;

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ServerSideEncryption: 'AES256',
      // Simplified metadata for performance
      Metadata: {
        'uploaded': timestamp,
        'folder': folder
      },
      // Performance optimizations
      StorageClass: 'STANDARD_IA', // Cheaper storage for images
      CacheControl: 'max-age=31536000', // 1 year cache
    });

    await s3.send(command);

    // Return optimized URL
    const region = process.env.S3_REGION || 'eu-north-1';
    return `https://${process.env.S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
    
  } catch (error) {
    console.error('S3 upload error:', error);
    
    // More specific error messages for debugging
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('Upload timeout - mēģiniet mazāku failu');
      }
      if (error.message.includes('credentials')) {
        throw new Error('S3 konfigurācijas kļūda');
      }
      if (error.message.includes('network')) {
        throw new Error('Tīkla kļūda augšupielādē');
      }
    }
    
    throw new Error('S3 augšupielādes kļūda');
  }
}

// Helper function for large file uploads (future enhancement)
export async function uploadLargeFileToS3(
  buffer: Buffer,
  fileName: string,
  folder: string,
  mimetype: string
): Promise<string> {
  // For files > 5MB, we could implement multipart upload
  // This would significantly improve performance for large files
  if (buffer.length > 5 * 1024 * 1024) {
    // TODO: Implement multipart upload for better performance
    console.log('Large file detected - consider implementing multipart upload');
  }
  
  return uploadToS3(buffer, fileName, folder, mimetype);
}
