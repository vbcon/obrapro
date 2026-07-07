import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const ERROS_PT: Record<string, string> = {
  'User already registered': 'Este e-mail já está cadastrado no sistema.',
  'invalid email': 'E-mail inválido.',
  'Email rate limit exceeded': 'Muitos convites enviados. Aguarde alguns minutos.',
}

function traduzirErro(msg: string): string {
  for (const [en, pt] of Object.entries(ERROS_PT)) {
    if (msg.toLowerCase().includes(en.toLowerCase())) return pt
  }
  return msg
}

export async function POST(request: Request) {
  // Verificar que o solicitante é admin
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
      error: 'Configuração incompleta: SUPABASE_SERVICE_ROLE_KEY não definida. Adicione ao .env.local e às variáveis de ambiente do Vercel.',
    }, { status: 500 })
  }

  const { nome, email, papel, obra_ids } = await request.json()

  if (!nome || !email || !papel) {
    return NextResponse.json({ error: 'Nome, e-mail e papel são obrigatórios.' }, { status: 400 })
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Verificar se e-mail já existe na tabela perfis
  const { data: existente } = await adminSupabase
    .from('perfis').select('id').eq('email', email).maybeSingle()
  if (existente) {
    return NextResponse.json({ error: 'Este e-mail já está cadastrado no sistema.' }, { status: 400 })
  }

  // Determinar URL base para o redirect do convite
  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://app.vbcon.com.br'

  // Convidar usuário (ele receberá e-mail para definir a própria senha)
  const { data: invited, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
    data: { nome },
    redirectTo: `${origin}/auth/callback?type=invite`,
  })

  if (inviteError || !invited?.user) {
    const msg = traduzirErro(inviteError?.message || 'Erro ao convidar usuário')
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const newUserId = invited.user.id

  // Criar perfil com papel
  const { error: perfErr } = await adminSupabase.from('perfis').upsert({
    id: newUserId,
    nome,
    email,
    papel,
  })

  if (perfErr) {
    // Rollback: remover o usuário criado
    await adminSupabase.auth.admin.deleteUser(newUserId)
    return NextResponse.json({ error: 'Erro ao criar perfil. Tente novamente.' }, { status: 500 })
  }

  // Vincular obras
  if (obra_ids?.length > 0 && papel !== 'admin') {
    await adminSupabase.from('usuario_obras').insert(
      obra_ids.map((obraId: string) => ({ usuario_id: newUserId, obra_id: obraId }))
    )
  }

  return NextResponse.json({ id: newUserId, email })
}
