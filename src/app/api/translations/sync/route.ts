import { NextResponse } from 'next/server'
import { createClient } from '@lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  try {
    // Check if user is admin (same as in import route)
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

    // Step 1: Import from JSON files (call the import logic directly)
    const importResponse = await import('../import/route')
    const importResult = await importResponse.POST()
    
    if (!importResult.ok) {
      const importError = await importResult.json()
      return NextResponse.json(
        { error: `Import failed: ${importError.error}` }, 
        { status: 500 }
      )
    }

    // Step 2: Export to JSON files (call the export logic directly)  
    const exportResponse = await import('../export/route')
    const exportResult = await exportResponse.POST()

    if (!exportResult.ok) {
      const exportError = await exportResult.json()
      return NextResponse.json(
        { error: `Export failed: ${exportError.error}` }, 
        { status: 500 }
      )
    }

    const importData = await importResult.json()
    const exportData = await exportResult.json()

    return NextResponse.json({ 
      success: true, 
      message: `Sinhronizācija pabeigta! ${importData.message}. ${exportData.message}`,
      imported: importData.imported
    })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Sinhronizācijas kļūda' }, 
      { status: 500 }
    )
  }
}
