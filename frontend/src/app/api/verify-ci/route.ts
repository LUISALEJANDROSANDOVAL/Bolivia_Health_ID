import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const { rawText } = await request.json()

    if (!rawText) {
      return NextResponse.json({ status: 'error', message: 'No se recibió texto' }, { status: 400 })
    }

    // --- Smart CI extraction from OCR text ---
    // OCR often inserts spaces in numbers, e.g. "8 25 1 794" or "8-251-794"
    // Strategy: clean text, find all numeric sequences, join adjacent short ones
    const cleanText = rawText
      .replace(/[oO]/g, '0')   // common OCR mistake: letter O as zero
      .replace(/[lI]/g, '1')   // letter l or I as one
      .replace(/[-_.]/g, '')    // remove dashes and dots within numbers
      
    // Extract all digit groups
    const digitGroups = cleanText.match(/\d+/g) || []
    
    // Build candidates: individual groups of 6-9 digits
    // AND sliding window concatenations of adjacent groups (to handle split numbers)
    const candidates = new Set<string>()
    
    for (let i = 0; i < digitGroups.length; i++) {
      const g = digitGroups[i]
      
      // Single group
      if (g.length >= 6 && g.length <= 10) candidates.add(g)
      
      // Concatenate with next 1-2 groups if together they form 6-9 digits
      for (let j = 1; j <= 3 && i + j < digitGroups.length; j++) {
        const combined = digitGroups.slice(i, i + j + 1).join('')
        if (combined.length >= 6 && combined.length <= 9) candidates.add(combined)
      }
    }
    
    if (candidates.size === 0) {
      return NextResponse.json({
        status: 'not_found',
        message: 'No se pudo detectar un número de CI en el documento.',
        extractedCI: null,
        data: null
      })
    }

    // Try each candidate against mock_segip_data
    for (const candidate of candidates) {
      const { data, error } = await supabaseAdmin
        .from('mock_segip_data')
        .select('*')
        .eq('cedula_identidad', candidate)
        .single()

      if (data && !error) {
        return NextResponse.json({
          status: 'verified',
          extractedCI: candidate,
          data: {
            nombres: data.nombres,
            apellidos: data.apellidos,
            cedula: data.cedula_identidad,
            fechaNacimiento: data.fecha_nacimiento,
            estado: data.estado
          }
        })
      }
    }

    // Ningún número coincidió con el SEGIP
    return NextResponse.json({
      status: 'pending',
      message: 'CI detectada pero no encontrada en el registro del SEGIP. Ingrese sus datos manualmente.',
      extractedCI: [...candidates][0] ?? null,
      data: null
    })

  } catch (err) {
    console.error('Error verify-ci:', err)
    return NextResponse.json({ status: 'error', message: 'Error interno' }, { status: 500 })
  }
}
