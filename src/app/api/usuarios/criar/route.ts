import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const serverSupabase = await createServerClient()
  const { data: { user } } = await serverSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: perfil } = await serverSupabase
    .from('perfis').select('papel').eq('id', user.id).single()
  if (perfil?.papel !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({
      error: 'Configuração incompleta no servidor. Contate o administrador.',
    }, { status: 500 })
  }

  const body = await request.json()
  const { nome, email, papel, obra_ids } = body

  if (!nome || !email || !papel) {
    return NextResponse.json({ error: 'Nome, e-mail e papel são obrigatórios.' }, { status: 400 })
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Verificar se e-mail já existe
  const { data: existente } = await adminSupabase
    .from('perfis').select('id').eq('email', email).maybeSingle()
  if (existente) {
    return NextResponse.json({ error: 'Este e-mail já está cadastrado no sistema.' }, { status: 400 })
  }

  // Criar usuário e enviar e-mail de convite
  const { data: invited, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
    data: { nome },
  })

  if (inviteError || !invited?.user) {
    return NextResponse.json({
      error: inviteError?.message || 'Erro ao criar usuário. Verifique o e-mail e tente novamente.',
    }, { status: 400 })
  }

  const newUserId = invited.user.id

  // Definir papel correto (trigger cria com padrão 'admin')
  const { error: perfErr } = await adminSupabase.from('perfis').upsert({
    id: newUserId,
    nome,
    email,
    papel,
  })

  if (perfErr) {
    await adminSupabase.auth.admin.deleteUser(newUserId)
    return NextResponse.json({ error: 'Erro ao configurar perfil. Tente novamente.' }, { status: 500 })
  }

  // Vincular obras
  if (obra_ids?.length > 0 && papel !== 'admin') {
    await adminSupabase.from('usuario_obras').insert(
      obra_ids.map((obraId: string) => ({ usuario_id: newUserId, obra_id: obraId }))
    )
  }

  return NextResponse.json({ id: newUserId, email })
}
