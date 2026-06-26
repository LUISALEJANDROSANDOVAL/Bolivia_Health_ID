import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json()

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Configuración de Supabase incompleta en el servidor' },
        { status: 500 }
      )
    }

    // Inicializar Supabase Client de forma dinámica por petición
    const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey)

    // Autenticar contra Supabase desde el servidor (sin bloqueos del navegador)
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message === 'Invalid login credentials' ? 'Credenciales inválidas' : error.message },
        { status: 401 }
      )
    }

    if (!data.session || !data.user) {
      return NextResponse.json(
        { error: 'No se pudo crear la sesión' },
        { status: 500 }
      )
    }

    // Consultar el perfil en la base de datos para validar el rol dinámicamente
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Error al consultar perfil del usuario:', profileError)
      return NextResponse.json(
        { error: 'Error al verificar el rol de la cuenta' },
        { status: 500 }
      )
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'No se encontró un perfil asociado a esta cuenta.' },
        { status: 403 }
      )
    }

    // Validar que el rol del perfil coincida con el rol seleccionado
    if (profile.role !== role) {
      return NextResponse.json(
        { error: `Esta cuenta no corresponde a un perfil de ${role === 'admin' ? 'Administrador' : 'Secretaría'}.` },
        { status: 403 }
      )
    }

    // Devolver los tokens al cliente
    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })
  } catch (err: any) {
    console.error('Admin login API error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

