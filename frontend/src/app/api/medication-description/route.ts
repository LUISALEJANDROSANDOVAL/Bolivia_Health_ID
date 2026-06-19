import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { medicationName } = await request.json()

    if (!medicationName) {
      return NextResponse.json(
        { error: 'El parámetro medicationName es requerido.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'La clave GEMINI_API_KEY no está configurada.' },
        { status: 500 }
      )
    }

    const prompt = `Eres un asistente médico inteligente para pacientes en Bolivia. Explica de manera muy sencilla, directa y en un máximo de dos frases breves qué es y para qué sirve el medicamento llamado: "${medicationName}". No uses lenguaje técnico complejo, habla claro para que cualquier paciente lo entienda de forma sencilla. Empieza directamente con la explicación sin preámbulos ni introducciones.`

    const geminiPayload = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ]
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiPayload)
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Gemini API Error:', errText)
      return NextResponse.json(
        { error: 'Error al consultar la inteligencia artificial.' },
        { status: response.status }
      )
    }

    const responseData = await response.json()
    const description = responseData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!description) {
      return NextResponse.json(
        { error: 'No se obtuvo una respuesta válida de la IA.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ description })
  } catch (error: any) {
    console.error('API /api/medication-description error:', error)
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}
