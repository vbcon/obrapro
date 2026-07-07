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
    return NextResponse.json({ error: 'Configuração incompleta no servidor.' }, { status: 500 })
  }

  const { id, nome, papel, empresa, telefone, obra_ids } = await request.json()

  if (!id || !nome || !papel) {
    return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Atualizar perfil
  const { error: perfErr } = await adminSupabase.from('perfis').update({
    nome,
    papel,
    empresa: empresa || null,
    telefone: telefone || null,
  }).eq('id', id)

  if (perfErr) {
    return NextResponse.json({ error: 'Erro ao atualizar perfil.' }, { status: 500 })
  }

  // Remover todos os vínculos de obras existentes
  await adminSupabase.from('usuario_obras').delete().eq('usuario_id', id)

  // Inserir novos vínculos
  if (papel !== 'admin' && obra_ids?.length > 0) {
    const { error: vinculoErr } = await adminSupabase.from('usuario_obras').insert(
      obra_ids.map((obraId: string) => ({ usuario_id: id, obra_id: obraId }))
    )
    if (vinculoErr) {
      return NextResponse.json({ error: 'Erro ao vincular obras.' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
