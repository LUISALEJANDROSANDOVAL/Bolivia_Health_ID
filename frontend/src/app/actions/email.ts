'use server'

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailParams {
  to: string
  subject: string
  title: string
  message: string
  actionUrl?: string
  actionLabel?: string
}

export async function sendEmailAction({
  to,
  subject,
  title,
  message,
  actionUrl,
  actionLabel
}: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY no configurada. Saltando envío de email.')
    return { success: false, error: 'API Key missing' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Bolivia Health ID <onboarding@resend.dev>', // Usar dominio verificado en producción
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #22d3ee; margin: 0; font-size: 24px; font-weight: 900;">Bolivia Health ID</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Seguridad Médica en la Red</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 18px; font-weight: 700;">${title}</h2>
            <p style="color: #475569; line-height: 1.6; margin: 0;">${message}</p>
          </div>

          ${actionUrl ? `
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${actionUrl}" 
                 style="background-color: #0f172a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">
                ${actionLabel || 'Ver en la Plataforma'}
              </a>
            </div>
          ` : ''}

          <div style="border-top: 1px solid #e2e8f0; pt-24px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
              Este es un correo automático de Bolivia Health ID. Por favor no respondas a este mensaje.
            </p>
          </div>
        </div>
      `
    })

    if (error) {
      console.error('Error de Resend:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (err) {
    console.error('Fallo al enviar email:', err)
    return { success: false, error: err }
  }
}
