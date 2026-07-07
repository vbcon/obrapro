import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { Users, Plus, Pencil, Building2 } from 'lucide-react'
import { PAPEL_LABELS, type Papel } from '@/lib/types/roles'

const PAPEL_BADGE: Record<Papel, string> = {
  admin:     'badge-brand',
  cliente:   'badge-blue',
  arquiteto: 'badge-purple',
}

const PAPEL_AVATAR: Record<Papel, string> = {
  admin:     'bg-orange-500/12 text-orange-600',
  cliente:   'bg-blue-500/12 text-blue-600',
  arquiteto: 'bg-violet-500/12 text-violet-600',
}

export default async function UsuariosPage() {
  const supabase = await createClient()

  const [{ data: usuarios }, { data: vinculos }] = await Promise.all([
    supabase.from('perfis').select('id, nome, email, papel, empresa').order('nome'),
    supabase.from('usuario_obras').select('usuario_id, obra_id, obras(nome, codigo)'),
  ])

  const vinculosPorUsuario: Record<string, any[]> = {}
  for (const v of vinculos || []) {
    if (!vinculosPorUsuario[v.usuario_id]) vinculosPorUsuario[v.usuario_id] = []
    vinculosPorUsuario[v.usuario_id].push(v.obras)
  }

  const lista = usuarios || []

  return (
    <>
      <Header titulo="Usuários" subtitulo="Gerencie acessos e permissões" />

      <div className="page-body max-w-3xl">

        <div className="flex items-center justify-between">
          <p className="text-sm text-lead-400">
            {lista.length} usuário{lista.length !== 1 ? 's' : ''} cadastrado{lista.length !== 1 ? 's' : ''}
          </p>
          <Link href="/dashboard/configuracoes/usuarios/novo" className="btn-primary">
            <Plus className="w-4 h-4" />
            Novo usuário
          </Link>
        </div>

        {lista.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20">
            <div className="empty-state-icon"><Users className="w-6 h-6 text-lead-400" /></div>
            <p className="text-sm font-medium text-lead-600">Nenhum usuário cadastrado</p>
            <Link href="/dashboard/configuracoes/usuarios/novo" className="btn-primary mt-4">
              <Plus className="w-4 h-4" />
              Criar primeiro usuário
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-lead-100/80 animate-fade-up">
            {lista.map(u => {
              const papel        = (u.papel as Papel) || 'admin'
              const obrasVinc    = vinculosPorUsuario[u.id] || []
              const avatarBg     = PAPEL_AVATAR[papel] || PAPEL_AVATAR.cliente
              const initials     = u.nome
                ? u.nome.trim().split(/\s+/).slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
                : '?'

              return (
                <div key={u.id} className="flex items-start gap-4 px-6 py-4 hover:bg-lead-50/60 transition-colors">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarBg}`}>
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-[13px] font-semibold text-lead-900">{u.nome || '(sem nome)'}</p>
                      <span className={PAPEL_BADGE[papel]}>{PAPEL_LABELS[papel]}</span>
                    </div>
                    <p className="text-xs text-lead-500">{u.email}</p>
                    {u.empresa && <p className="text-xs text-lead-400 mt-0.5">{u.empresa}</p>}

                    {papel !== 'admin' && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {obrasVinc.length === 0 ? (
                          <span className="text-xs text-red-500 font-medium">Nenhuma obra vinculada</span>
                        ) : obrasVinc.map((o: any) => (
                          <span key={o?.id}
                            className="inline-flex items-center gap-1 text-xs bg-lead-100 text-lead-600 px-2 py-0.5 rounded-full">
                            <Building2 className="w-3 h-3 text-lead-400" />
                            {o?.codigo ? `${o.codigo} · ` : ''}{o?.nome}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <Link href={`/dashboard/configuracoes/usuarios/${u.id}`}
                    className="btn-secondary btn-sm shrink-0 mt-0.5">
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
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
