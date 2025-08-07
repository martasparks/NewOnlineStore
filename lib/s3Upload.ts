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
  const timestamp = new Date().toISOString().split('T')[0];
  const uuid = randomUUID();
  const extension = fileName.split('.').pop();
  const key = `${folder}/${timestamp}/${uuid}.${extension}`;

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(mimetype)) {
      throw new Error('Nepieļaujams faila tips')
    }

    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error('Fails ir pārāk liels! Maksimālais izmērs ir 5MB')
    }

  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    if (!allowedExtensions.includes(extension?.toLowerCase() || '')) {
      throw new Error('Neatbalstīts attēla formāts! Atļautie: ' + allowedExtensions.join(', '));
    }

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
    ServerSideEncryption: 'AES256',
    Metadata: {
      'uploaded-at': new Date().toISOString(),
    },
  });

  await s3.send(command);

  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION || 'eu-north-1'}.amazonaws.com/${key}`;
}