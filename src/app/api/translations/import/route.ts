import { NextResponse } from 'next/server'
import { createClient } from '@lib/supabase/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST() {
  const supabase = await createClient()
  
  try {
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const locales = ['lv', 'en', 'ru']
    let totalImported = 0

    // Clear existing translations
    await supabase.from('translations').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    for (const locale of locales) {
      const filePath = path.join(process.cwd(), 'messages', `${locale}.json`)
      
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8')
        const messages = JSON.parse(fileContent)
        
        const flattenTranslations = (obj: any, namespace = 'default', prefix = ''): any[] => {
          const translations: any[] = []
          
          for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key
            
            if (typeof value === 'object' && value !== null) {
              // If we're at the root level and this looks like a namespace
              if (prefix === '') {
                // This IS a namespace (Header, HomePage, etc.)
                translations.push(...flattenTranslations(value, key, ''))
              } else {
                // We're inside a namespace, continue with same namespace
                translations.push(...flattenTranslations(value, namespace, fullKey))
              }
            } else {
              translations.push({
                key: fullKey,
                locale,
                value: String(value),
                namespace,
                created_by: user.id
              })
            }
          }
          
          return translations
        }
        
        const translations = flattenTranslations(messages)
        
        // Insert translations in batches
        if (translations.length > 0) {
          const { error } = await supabase
            .from('translations')
            .insert(translations)
          
          if (error) {
            console.error(`Error importing ${locale} translations:`, error)
          } else {
            totalImported += translations.length
          }
        }
        
      } catch (fileError) {
        console.error(`Error reading ${locale}.json:`, fileError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Imported ${totalImported} translations from JSON files`,
      imported: totalImported
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import translations' }, 
      { status: 500 }
    )
  }
}
