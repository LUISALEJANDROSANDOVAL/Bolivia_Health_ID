import { supabase } from './supabase'

export type NotificationType = 'request' | 'approval' | 'prescription' | 'alert' | 'info'

export async function sendNotification({
  recipientId,
  senderId,
  title,
  message,
  type,
  link
}: {
  recipientId: string
  senderId?: string
  title: string
  message: string
  type: NotificationType
  link?: string
}) {
  try {
    // 1. Insertar notificación interna en la base de datos (seguro en cliente)
    const { error: dbError } = await supabase
      .from('notifications')
      .insert([{
        user_id: recipientId,
        sender_id: senderId,
        title,
        message,
        type,
        link
      }])

    if (dbError) throw dbError

    // 2. Disparar email via API Route (evita conflicto cliente/servidor de Next.js)
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId, title, message, link })
    }).catch(err => console.warn('Email no enviado (no bloquea el flujo):', err))

    return { success: true }
  } catch (err) {
    console.error('Error al crear notificación:', err)
    return { success: false, error: err }
  }
}
