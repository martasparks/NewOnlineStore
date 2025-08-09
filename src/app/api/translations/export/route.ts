import { NextResponse } from 'next/server'
import { createClient } from '@lib/supabase/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST() {
  const supabase = await createClient()
  
  // Get all translations
  const { data: translations, error } = await supabase
    .from('translations')
    .select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Group by locale and namespace
  const locales = ['lv', 'en', 'ru']
  
  for (const locale of locales) {
    const localeTranslations = translations?.filter(t => t.locale === locale) || []
    
    // Group by namespace
    const namespaces: Record<string, any> = {}
    
    localeTranslations.forEach(translation => {
      const { namespace, key, value } = translation
      
      if (!namespaces[namespace]) {
        namespaces[namespace] = {}
      }
      
      // Handle nested keys like "Header.search.placeholder"
      const keyParts = key.split('.')
      let current = namespaces[namespace]
      
      for (let i = 0; i < keyParts.length - 1; i++) {
        if (!current[keyParts[i]]) {
          current[keyParts[i]] = {}
        }
        current = current[keyParts[i]]
      }
      
      current[keyParts[keyParts.length - 1]] = value
    })
    
    const mergedTranslations: Record<string, any> = {}

    // Type-safe iteration over namespaces
    for (const [namespaceName, namespaceContent] of Object.entries(namespaces)) {
      if (namespaceName === 'default') {
        // Only merge default namespace to root
        Object.assign(mergedTranslations, namespaceContent)
      } else {
        // Keep other namespaces as separate objects
        mergedTranslations[namespaceName] = namespaceContent
      }
    }
    
    const filePath = path.join(process.cwd(), 'messages', `${locale}.json`)
    await fs.writeFile(filePath, JSON.stringify(mergedTranslations, null, 2))
  }

  return NextResponse.json({ success: true, message: 'Translations exported successfully' })
}
