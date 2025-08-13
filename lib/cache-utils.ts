/**
 * Cache busting utilities for admin interfaces
 */

// Generate cache-busting timestamp
export function getCacheBustParam(): string {
  return `_cb=${Date.now()}`
}

// Add cache-busting to URL
export function addCacheBust(url: string): string {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${getCacheBustParam()}`
}

// Fetch with aggressive no-cache headers
export async function fetchNoCacheAdmin(url: string, options: RequestInit = {}): Promise<Response> {
  const noCacheUrl = addCacheBust(url)
  
  return fetch(noCacheUrl, {
    ...options,
    cache: 'no-cache',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options.headers
    }
  })
}

// SWR key with timestamp for cache busting
export function getSWRKey(baseKey: string): string {
  return `${baseKey}?${getCacheBustParam()}`
}

// Force browser to clear specific cache entries
export function clearBrowserCache(patterns: string[] = ['/api/products']) {
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        patterns.forEach(pattern => {
          if (cacheName.includes(pattern)) {
            caches.delete(cacheName)
          }
        })
      })
    })
  }
}

// Helper for admin pages - force refresh SWR cache
export function forceRefreshAdminData(mutate: any, key: string) {
  // Clear any potential browser cache
  clearBrowserCache()
  
  // Force SWR revalidation
  return mutate(undefined, { 
    revalidate: true,
    populateCache: false, // Don't use cached data
    optimisticData: undefined // Don't show optimistic updates
  })
}
