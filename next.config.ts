import { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
  
  const recommended = [
    'NEXT_PUBLIC_SITE_URL',
    'NODE_ENV'
  ]
  
  const missing = required.filter(env => !process.env[env])
  const missingRecommended = recommended.filter(env => !process.env[env])
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    missing.forEach(env => console.error(`   - ${env}`))
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
  
  if (missingRecommended.length > 0) {
    console.warn('⚠️  Missing recommended environment variables:')
    missingRecommended.forEach(env => console.warn(`   - ${env}`))
    console.warn('   This may cause issues with CSRF validation and other features.')
  }
  
  console.log('✅ Environment variables validation passed')
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode environment:')
    console.log(`   - NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET'}`)
    console.log(`   - SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...`)
  }
}

validateEnvironment()

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "martas-mebeles-images.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https", 
        hostname: "martas-mebeles-images.s3.eu-north-1.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);