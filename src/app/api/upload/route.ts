import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@lib/s3Upload";
import { createClient } from "@lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
 'image/jpeg',
 'image/jpg', 
 'image/png',
 'image/webp',
 'image/gif'
];

// Simplified rate limiting for performance
const uploadAttempts = new Map<string, number>();

function checkRateLimit(ip: string): boolean {
 const now = Date.now();
 const windowStart = Math.floor(now / 60000) * 60000; // 1-minute windows
 const key = `${ip}-${windowStart}`;
 
 const currentCount = uploadAttempts.get(key) || 0;
 if (currentCount >= 20) { // 20 uploads per minute
   return false;
 }
 
 uploadAttempts.set(key, currentCount + 1);
 
 // Clean up old entries periodically
 if (uploadAttempts.size > 1000) {
   const cutoff = windowStart - 300000; // Keep last 5 minutes
   for (const [key] of uploadAttempts) {
     const keyTime = parseInt(key.split('-')[1]);
     if (keyTime < cutoff) {
       uploadAttempts.delete(key);
     }
   }
 }
 
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
   .substring(0, 100); // Shorter limit for performance
 
 return sanitizedName ? `${sanitizedName}.${extension}` : `file_${Date.now()}.${extension}`;
}

function getClientIP(request: NextRequest): string {
 return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        'unknown';
}

// Fast image validation - just check basic headers
function isValidImageBuffer(buffer: Buffer): boolean {
 if (!buffer || buffer.length < 4) return false;
 
 // JPEG
 if (buffer[0] === 0xFF && buffer[1] === 0xD8) return true;
 
 // PNG
 if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
 
 // WebP (quick check)
 if (buffer.length >= 12) {
   const riff = buffer.subarray(0, 4).toString('ascii');
   const webp = buffer.subarray(8, 12).toString('ascii');
   if (riff === 'RIFF' && webp === 'WEBP') return true;
 }
 
 // GIF
 if (buffer.length >= 6 && buffer.subarray(0, 3).toString('ascii') === 'GIF') return true;
 
 return false;
}

export async function POST(req: NextRequest) {
 const startTime = Date.now();
 
 try {
   const isDevelopment = process.env.NODE_ENV === 'development';
   
   // Skip rate limiting in development for faster testing
   if (!isDevelopment) {
     const clientIP = getClientIP(req);
     if (!checkRateLimit(clientIP)) {
       return NextResponse.json(
         { error: "Pārāk daudz pieprasījumu. Mēģiniet vēlāk." }, 
         { status: 429 }
       );
     }
   }

   // Quick auth check - skip in development
   if (!isDevelopment) {
     try {
       const supabase = await createClient();
       const { data: { user }, error: authError } = await supabase.auth.getUser();
       
       if (authError || !user) {
         return NextResponse.json(
           { error: "Nav autorizēts" }, 
           { status: 401 }
         );
       }
     } catch {
       return NextResponse.json(
         { error: "Autorizācijas kļūda" }, 
         { status: 401 }
       );
     }
   }

   // Parse form data with timeout
   let formData: FormData;
   try {
     formData = await Promise.race([
       req.formData(),
       new Promise<never>((_, reject) => 
         setTimeout(() => reject(new Error('Formdata timeout')), 15000) // Reduced timeout
       )
     ]);
   } catch {
     return NextResponse.json(
       { error: "Neizdevās nolasīt datus vai timeout" }, 
       { status: 400 }
     );
   }

   const file = formData.get("file") as File;
   const folder = formData.get("folder") as string;

   // Basic validation
   if (!file || !folder) {
     return NextResponse.json(
       { error: "Nepilnīgi dati" }, 
       { status: 400 }
     );
   }

   if (file.size === 0 || file.size > MAX_FILE_SIZE) {
     return NextResponse.json(
       { error: file.size === 0 ? "Fails ir tukšs" : `Fails pārāk liels (max ${Math.floor(MAX_FILE_SIZE / 1024 / 1024)}MB)` }, 
       { status: 400 }
     );
   }

   // Quick file type validation
   if (!ALLOWED_FILE_TYPES.includes(file.type)) {
     return NextResponse.json(
       { error: "Neatļauts faila tips. Atļauti: JPEG, PNG, WebP, GIF" }, 
       { status: 400 }
     );
   }

   const sanitizedFilename = sanitizeFilename(file.name);
   
   // Convert to buffer
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

   // Quick image validation - skip in development for speed
   if (!isDevelopment && !isValidImageBuffer(buffer)) {
     return NextResponse.json(
       { error: "Faila saturs neatbilst attēla formātam" }, 
       { status: 400 }
     );
   }

   // Upload to S3 - only one attempt in optimized version
   let url: string;
   try {
     url = await uploadToS3(buffer, sanitizedFilename, folder, file.type);
   } catch (error) {
     console.error('S3 upload failed:', error);
     return NextResponse.json(
       { error: "Neizdevās augšupielādēt failu" }, 
       { status: 500 }
     );
   }

   const processingTime = Date.now() - startTime;
   
   return NextResponse.json({ 
     url,
     ...(isDevelopment && { processingTime: `${processingTime}ms` })
   }, {
     headers: {
       'X-Content-Type-Options': 'nosniff',
     }
   });

 } catch (error) {
   console.error('Upload error:', error);
   return NextResponse.json(
     { error: "Servera kļūda" }, 
     { status: 500 }
   );
 }
}

// Optimize for faster cold starts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
