import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { fileBase64, fileType } = await request.json()

    if (!fileBase64 || !fileType) {
      return NextResponse.json(
        { error: 'Faltan parámetros: fileBase64 y fileType son requeridos.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'La clave GEMINI_API_KEY no está configurada en el servidor (.env.local).' },
        { status: 500 }
      )
    }

    // Limpiar el prefijo de base64 si está presente
    const cleanBase64 = fileBase64.replace(/^data:.*?;base64,/, '')

    const prompt = `Analiza la siguiente imagen o documento de un expediente médico (receta, diagnóstico, estudio o examen de laboratorio).
Extrae la información clínica relevante y devuélvela estrictamente en formato JSON utilizando el siguiente esquema:

{
  "document_type": "receta" | "estudio" | "diagnostico",
  "diagnoses": [
    {
      "code": "Código CIE-10 aproximado (ej. K29.7, E11, etc.) o vacío si no se deduce",
      "description": "Nombre o descripción detallada del diagnóstico en español"
    }
  ],
  "medications": [
    {
      "name": "Nombre comercial o genérico del medicamento (ej. Omeprazol, Paracetamol)",
      "dosage": "Dosis prescrita (ej. 20mg, 500mg, 1 tableta)",
      "frequency": "Frecuencia de administración (ej. Cada 8 horas, En ayunas)",
      "start_date": "Fecha de inicio aproximada en formato YYYY-MM-DD (si no se especifica usa la fecha actual)",
      "end_date": "Fecha de finalización aproximada en formato YYYY-MM-DD o vacío si es indefinido"
    }
  ],
  "additional_details": "Instrucciones, indicaciones terapéuticas o recomendaciones adicionales indicadas en el documento"
}

No incluyas explicaciones de texto fuera del JSON. Devuelve únicamente el JSON válido.`

    const geminiPayload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: fileType,
                data: cleanBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiPayload)
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Gemini API Error Response:', errText)
      return NextResponse.json(
        { error: `Error de la API de Gemini: ${response.statusText}` },
        { status: response.status }
      )
    }

    const responseData = await response.json()
    const textResult = responseData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textResult) {
      return NextResponse.json(
        { error: 'No se obtuvo respuesta del análisis del documento.' },
        { status: 500 }
      )
    }

    try {
      const parsedJson = JSON.parse(textResult)
      return NextResponse.json(parsedJson)
    } catch (parseErr) {
      console.error('Error parsing JSON from Gemini response:', textResult)
      return NextResponse.json(
        { error: 'La respuesta de IA no tiene un formato JSON válido.' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('API /api/parse-document error:', error)
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}
