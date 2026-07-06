import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { Users, Plus, Pencil, Building2 } from 'lucide-react'
import { PAPEL_LABELS, PAPEL_CORES, type Papel } from '@/lib/types/roles'

export default async function UsuariosPage() {
  const supabase = await createClient()

  const [{ data: usuarios }, { data: obras }] = await Promise.all([
    supabase.from('perfis').select('id, nome, email, papel, empresa').order('nome'),
    supabase.from('obras').select('id, nome, codigo').order('nome'),
  ])

  // Buscar vínculos obra por usuário
  const { data: vinculos } = await supabase.from('usuario_obras').select('usuario_id, obra_id, obras(nome, codigo)')

  const vinculosPorUsuario: Record<string, any[]> = {}
  for (const v of vinculos || []) {
    if (!vinculosPorUsuario[v.usuario_id]) vinculosPorUsuario[v.usuario_id] = []
    vinculosPorUsuario[v.usuario_id].push(v.obras)
  }

  const lista = usuarios || []

  return (
    <>
      <Header titulo="Usuários" subtitulo="Gerencie acessos e permissões" />
      <div className="p-6 max-w-4xl space-y-5">

        <div className="flex justify-end">
          <Link href="/dashboard/configuracoes/usuarios/novo" className="btn-primary">
            <Plus className="w-4 h-4" />Novo usuário
          </Link>
        </div>

        {lista.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20">
            <Users className="w-10 h-10 text-lead-300 mb-3" />
            <p className="font-medium text-lead-600">Nenhum usuário ainda</p>
          </div>
        ) : (
          <div className="card divide-y divide-lead-100">
            {lista.map(u => {
              const papel = (u.papel as Papel) || 'admin'
              const obrasDoUsuario = vinculosPorUsuario[u.id] || []
              return (
                <div key={u.id} className="flex items-start gap-4 px-6 py-4 hover:bg-lead-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-brand-500/15 flex items-center justify-center text-brand-600 font-bold text-sm shrink-0">
                    {u.nome?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-lead-900">{u.nome || '(sem nome)'}</p>
                      <span className={`badge ${PAPEL_CORES[papel]}`}>{PAPEL_LABELS[papel]}</span>
                    </div>
                    <p className="text-sm text-lead-500">{u.email}</p>
                    {u.empresa && <p className="text-xs text-lead-400">{u.empresa}</p>}

                    {/* Obras vinculadas (para não-admins) */}
                    {papel !== 'admin' && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {obrasDoUsuario.length === 0 ? (
                          <span className="text-xs text-red-500">Nenhuma obra vinculada</span>
                        ) : obrasDoUsuario.map((o: any) => (
                          <span key={o?.id} className="inline-flex items-center gap-1 text-xs bg-lead-100 text-lead-600 px-2 py-0.5 rounded-full">
                            <Building2 className="w-3 h-3" />
                            {o?.codigo ? `${o.codigo} · ` : ''}{o?.nome}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Link href={`/dashboard/configuracoes/usuarios/${u.id}`} className="btn-ghost py-1.5 px-3 text-sm shrink-0">
                    <Pencil className="w-3.5 h-3.5" />Editar
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
