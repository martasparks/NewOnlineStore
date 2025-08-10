import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  region: process.env.S3_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

export async function uploadToS3(
  buffer: Buffer, 
  fileName: string, 
  folder: string, 
  mimetype: string
): Promise<string> {
  // Papildu validācija
  const allowedTypes = [
    'image/jpeg', 
    'image/jpg',
    'image/png', 
    'image/webp', 
    'image/gif'
  ];
  
  if (!allowedTypes.includes(mimetype)) {
    throw new Error('Nepieļaujams faila tips. Atļauti: JPEG, PNG, WebP, GIF');
  }

  // Palielināts maksimālais izmērs produktu attēliem
  const maxSize = folder === 'products' ? 10 * 1024 * 1024 : 5 * 1024 * 1024; // 10MB produktiem, 5MB citiem
  if (buffer.length > maxSize) {
    throw new Error(`Fails ir pārāk liels! Maksimālais izmērs ir ${Math.floor(maxSize / 1024 / 1024)}MB`);
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const uuid = randomUUID();
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  
  // Sanitize original filename
  const sanitizedName = fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();
  
  const key = `${folder}/${timestamp}/${uuid}_${sanitizedName}`;

  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  if (!allowedExtensions.includes(extension)) {
    throw new Error('Neatbalstīts attēla formāts! Atļautie: ' + allowedExtensions.join(', '));
  }

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ServerSideEncryption: 'AES256',
      Metadata: {
        'uploaded-at': new Date().toISOString(),
        'original-name': fileName,
        'folder': folder
      },
    });

    await s3.send(command);

    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION || 'eu-north-1'}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Neizdevās augšupielādēt failu uz S3');
  }
}