import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // 1. Verificar que o solicitante é admin
  const serverSupabase = await createServerClient()
  const { data: { user } } = await serverSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: perfil } = await serverSupabase
    .from('perfis').select('papel').eq('id', user.id).single()
  if (perfil?.papel !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  // 2. Criar usuário com service role
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'Service role key não configurada' }, { status: 500 })
  }

  const { nome, email, senha, papel, obra_ids } = await request.json()

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: { user: newUser }, error: createError } = await adminSupabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  })

  if (createError || !newUser) {
    return NextResponse.json({ error: createError?.message || 'Erro ao criar usuário' }, { status: 400 })
  }

  // 3. Criar perfil com papel
  await adminSupabase.from('perfis').upsert({
    id: newUser.id,
    nome,
    email,
    papel,
  })

  // 4. Vincular obras (para cliente e arquiteto)
  if (obra_ids?.length > 0 && papel !== 'admin') {
    await adminSupabase.from('usuario_obras').insert(
      obra_ids.map((obraId: string) => ({ usuario_id: newUser.id, obra_id: obraId }))
    )
  }

  return NextResponse.json({ id: newUser.id, email: newUser.email })
}
