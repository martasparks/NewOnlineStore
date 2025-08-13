# Vercel Environment Variables Checklist

## Required Environment Variables for Vercel:

### Production Settings:
1. `NEXT_PUBLIC_SITE_URL` = `https://your-domain.vercel.app`
2. `NEXT_PUBLIC_SUPABASE_URL` = (jau ir)
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (jau ir)
4. `S3_REGION` = (jau ir)
5. `S3_ACCESS_KEY` = (jau ir)
6. `S3_SECRET_KEY` = (jau ir)
7. `S3_BUCKET_NAME` = (jau ir)
8. `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` = (jau ir)

### Steps to add NEXT_PUBLIC_SITE_URL to Vercel:

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Click "Add New"
5. Name: `NEXT_PUBLIC_SITE_URL`
6. Value: `https://your-domain.vercel.app` (replace with your actual domain)
7. Environment: Production, Preview, Development (check all)
8. Click "Save"

### After adding:
1. Redeploy your project (Settings → Functions → Redeploy)
2. Test API endpoints on production

### Local vs Production Values:

| Variable | Local | Production |
|----------|-------|------------|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://your-domain.vercel.app` |
| `NODE_ENV` | `development` | `production` (auto) |

## Note:
- Local .env file is NOT uploaded to Vercel
- Vercel uses its own environment variables system
- Each environment (dev/preview/prod) can have different values
