import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const ERROS_PT: Record<string, string> = {
  'user already registered': 'Este e-mail já está cadastrado no sistema.',
  'email already registered': 'Este e-mail já está cadastrado no sistema.',
  'invalid email': 'Endereço de e-mail inválido.',
  'password should be at least': 'A senha deve ter pelo menos 6 caracteres.',
  'unable to validate email address': 'E-mail inválido ou domínio não aceito.',
}

function traduzirErro(msg: string): string {
  const lower = msg.toLowerCase()
  for (const [en, pt] of Object.entries(ERROS_PT)) {
    if (lower.includes(en)) return pt
  }
  return msg
}

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
  const { nome, email, senha, papel, obra_ids } = body

  if (!nome || !email || !papel) {
    return NextResponse.json({ error: 'Nome, e-mail e papel são obrigatórios.' }, { status: 400 })
  }
  if (!senha || senha.length < 6) {
    return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
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

  // Criar usuário com senha definida e e-mail já confirmado
  const { data: created, error: createError } = await adminSupabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  })

  if (createError || !created?.user) {
    const msg = traduzirErro(createError?.message || 'Erro ao criar usuário')
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const newUserId = created.user.id

  // Criar perfil com papel correto
  const { error: perfErr } = await adminSupabase.from('perfis').upsert({
    id: newUserId,
    nome,
    email,
    papel,
  })

  if (perfErr) {
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
