import { redirect } from 'next/navigation'

// Redirigir la ruta antigua /registros a /diagnosticos
export default function RegistrosPage() {
  redirect('/diagnosticos')
}
