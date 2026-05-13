import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const { recipientId, title, message, link } = await request.json()

    if (!recipientId) {
      return NextResponse.json({ error: 'recipientId requerido' }, { status: 400 })
    }

    // Buscar email y preferencias del usuario
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, preferences')
      .eq('id', recipientId)
      .single()

    if (!profile?.email) {
      return NextResponse.json({ message: 'Sin email configurado' }, { status: 200 })
    }

    const emailEnabled = profile?.preferences?.notifications?.email?.enabled ?? true

    if (!emailEnabled) {
      return NextResponse.json({ message: 'Email desactivado por el usuario' }, { status: 200 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ message: 'RESEND_API_KEY no configurada' }, { status: 200 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const { error } = await resend.emails.send({
      from: 'Bolivia Health ID <onboarding@resend.dev>',
      to: [profile.email],
      subject: `Bolivia Health ID: ${title}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #0ea5e9, #22d3ee); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -1px;">Bolivia Health ID</h1>
            <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 4px;">Plataforma de Salud Segura</p>
          </div>
          
          <div style="padding: 32px; background: #1e293b;">
            <h2 style="color: #f8fafc; font-size: 20px; font-weight: 700; margin: 0 0 12px 0;">${title}</h2>
            <p style="color: #94a3b8; line-height: 1.7; font-size: 15px; margin: 0 0 24px 0;">${message}</p>
            
            ${link ? `
            <div style="text-align: center;">
              <a href="${appUrl}${link}" 
                 style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #22d3ee); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">
                Ver en la Plataforma →
              </a>
            </div>
            ` : ''}
          </div>

          <div style="padding: 20px; background: #0f172a; text-align: center; border-top: 1px solid #334155;">
            <p style="color: #475569; font-size: 12px; margin: 0;">
              Este es un correo automático de Bolivia Health ID. No respondas a este mensaje.
            </p>
          </div>
        </div>
      `
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('API send-email error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
