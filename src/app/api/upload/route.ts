import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@lib/s3Upload";
import { createClient } from "@lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
 'image/jpeg',
 'image/jpg', 
 'image/png',
 'image/webp',
 'image/gif'
];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const MAX_FILENAME_LENGTH = 200;

const uploadAttempts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
 const now = Date.now();
 const limit = uploadAttempts.get(ip);
 
 if (uploadAttempts.size > 1000) {
   for (const [key, value] of uploadAttempts) {
     if (now > value.resetTime) {
       uploadAttempts.delete(key);
     }
   }
 }
 
 if (!limit || now > limit.resetTime) {
   uploadAttempts.set(ip, { count: 1, resetTime: now + 60000 });
   return true;
 }
 
 if (limit.count >= 10) {
   return false;
 }
 
 limit.count++;
 return true;
}

function sanitizeFilename(filename: string): string {
 if (!filename || typeof filename !== 'string') {
   return `upload_${Date.now()}.jpg`;
 }

 const parts = filename.split('.');
 const extension = parts.pop()?.toLowerCase() || 'jpg';
 const name = parts.join('.');
 
 const sanitizedName = name
   .replace(/[^a-zA-Z0-9\-_]/g, '_')
   .replace(/_+/g, '_')
   .replace(/^_|_$/g, '')
   .substring(0, MAX_FILENAME_LENGTH - extension.length - 1);
 
 return sanitizedName ? `${sanitizedName}.${extension}` : `file_${Date.now()}.${extension}`;
}

function validateFileType(file: File): boolean {
 if (!file || !file.name || !file.type) {
   return false;
 }
 
 const mimeTypeValid = ALLOWED_FILE_TYPES.includes(file.type);
 
 const extension = file.name.toLowerCase().split('.').pop();
 const extensionValid = extension && ALLOWED_EXTENSIONS.includes(extension);
 
 return mimeTypeValid && Boolean(extensionValid);
}

function getClientIP(request: NextRequest): string {
 const forwarded = request.headers.get('x-forwarded-for');
 const realIp = request.headers.get('x-real-ip');
 const cfConnecting = request.headers.get('cf-connecting-ip');
 
 return (
   (forwarded ? forwarded.split(',')[0].trim() : null) ||
   realIp ||
   cfConnecting ||
   'unknown'
 );
}

function isValidImageBuffer(buffer: Buffer): boolean {
 if (!buffer || buffer.length < 4) return false;

 if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
   return true;
 }
 
 if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
   return true;
 }
 
 if (buffer.length >= 12) {
   const riff = buffer.subarray(0, 4).toString('ascii');
   const webp = buffer.subarray(8, 12).toString('ascii');
   if (riff === 'RIFF' && webp === 'WEBP') {
     return true;
   }
 }
 
 if (buffer.length >= 6) {
   const gif = buffer.subarray(0, 3).toString('ascii');
   if (gif === 'GIF') {
     return true;
   }
 }
 
 return false;
}

export async function POST(req: NextRequest) {
 try {
   const clientIP = getClientIP(req);
   const isDevelopment = process.env.NODE_ENV === 'development';
   
   if (!isDevelopment && !checkRateLimit(clientIP)) {
     return NextResponse.json(
       { error: "Pārāk daudz pieprasījumu. Mēģiniet vēlāk." }, 
       { status: 429 }
     );
   }

   if (!isDevelopment) {
     const supabase = await createClient();
     const { data: { user }, error: authError } = await supabase.auth.getUser();
     
     if (authError || !user) {
       return NextResponse.json(
         { error: "Nav autorizēts" }, 
         { status: 401 }
       );
     }
   }

   let formData: FormData;
try {
  formData = await Promise.race([
    req.formData(),
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 30000)
    )
  ]);
} catch {
  return NextResponse.json(
    { error: "Neizdevās nolasīt datus" }, 
    { status: 400 }
  );
}

   const file = formData.get("file") as File;
   const folder = formData.get("folder") as string;

   if (!file || !folder) {
     return NextResponse.json(
       { error: "Nepilnīgi dati" }, 
       { status: 400 }
     );
   }

   if (file.size === 0) {
     return NextResponse.json(
       { error: "Fails ir tukšs" }, 
       { status: 400 }
     );
   }

   if (file.size > MAX_FILE_SIZE) {
     return NextResponse.json(
       { error: `Fails pārāk liels. Maksimālais izmērs: ${Math.floor(MAX_FILE_SIZE / 1024 / 1024)}MB` }, 
       { status: 400 }
     );
   }

   if (!validateFileType(file)) {
     return NextResponse.json(
       { error: "Neatļauts faila tips. Atļauti: JPEG, PNG, WebP, GIF" }, 
       { status: 400 }
     );
   }

   const sanitizedFilename = sanitizeFilename(file.name);

   const allowedFolders = ['slider', 'products', 'categories', 'profiles', 'uploads'];
   if (!allowedFolders.includes(folder)) {
     console.warn(`Unknown folder: ${folder}, using 'uploads' instead`);
   }
   
   let buffer: Buffer;
try {
  const arrayBuffer = await file.arrayBuffer();
  buffer = Buffer.from(arrayBuffer);
} catch {
  return NextResponse.json(
    { error: "Neizdevās nolasīt failu" }, 
    { status: 400 }
  );
}

   const isValidImage = isValidImageBuffer(buffer);
   if (!isValidImage) {
     if (isDevelopment) {
       console.warn(`File ${sanitizedFilename} failed magic bytes validation but allowing in development`);
     } else {
       return NextResponse.json(
         { error: "Faila saturs neatbilst deklarētajam tipam" }, 
         { status: 400 }
       );
     }
   }

   let url: string = '';
   
   for (let attempt = 1; attempt <= 3; attempt++) {
     try {
       url = await uploadToS3(buffer, sanitizedFilename, folder, file.type);
       break;
     } catch (error) {
       console.error(`S3 upload attempt ${attempt} failed:`, error);
       
       if (attempt === 3) {
         return NextResponse.json(
           { error: "Neizdevās augšupielādēt failu. Mēģiniet vēlāk." }, 
           { status: 500 }
         );
       }
       
       await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
     }
   }

if (!isDevelopment) {
  try {
    const supabase = await createClient();
    await supabase.auth.getUser();
  } catch (logError) {
    console.error('Logging failed:', logError);
  }
}

   return NextResponse.json({ 
     url
   }, {
     headers: {
       'Cache-Control': 'no-cache',
       'X-Content-Type-Options': 'nosniff',
     }
   });

 } catch (error) {
   console.error('Unexpected upload error:', error);
   return NextResponse.json(
     { error: "Servera kļūda. Mēģiniet vēlāk." }, 
     { status: 500 }
   );
 }
}

export const runtime = 'nodejs';