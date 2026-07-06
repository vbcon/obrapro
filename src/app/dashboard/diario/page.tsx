import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { Camera, Plus, Sun, Cloud, CloudRain, CloudSun, Users, MessageSquare } from 'lucide-react'

const climaConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  ensolarado:           { label: 'Ensolarado', icon: Sun,      color: 'text-yellow-500' },
  nublado:              { label: 'Nublado',    icon: Cloud,    color: 'text-lead-400'   },
  chuvoso:              { label: 'Chuvoso',    icon: CloudRain,color: 'text-blue-500'   },
  parcialmente_nublado: { label: 'Parcial',    icon: CloudSun, color: 'text-yellow-400' },
}

export default async function StatusObraPage() {
  const supabase = await createClient()
  const { data: registros } = await supabase
    .from('diario_obra')
    .select('*, obras(nome, codigo)')
    .order('data', { ascending: false })
    .limit(50)

  const lista = registros || []

  return (
    <>
      <Header titulo="Status da Obra" subtitulo="Registros diários de progresso e fotos" />

      <div className="p-6 space-y-5">
        <div className="flex justify-end">
          <Link href="/dashboard/diario/nova" className="btn-primary">
            <Plus className="w-4 h-4" />
            Novo registro
          </Link>
        </div>

        {lista.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-brand-500" />
            </div>
            <h3 className="text-lg font-semibold text-lead-900">Nenhum registro</h3>
            <p className="text-lead-500 text-sm mt-1 max-w-xs">Comece registrando o status de uma obra com fotos.</p>
            <Link href="/dashboard/diario/nova" className="btn-primary mt-6">
              <Plus className="w-4 h-4" />Novo registro
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-lead-100">
            {lista.map((rdo: any) => {
              const clima = climaConfig[rdo.clima] || climaConfig.ensolarado
              const ClimaIcon = clima.icon
              const fotos: string[] = rdo.fotos || []
              return (
                <Link key={rdo.id} href={`/dashboard/diario/${rdo.id}`} className="flex items-start gap-4 p-5 hover:bg-lead-50 transition-colors">
                  {/* Data */}
                  <div className="flex flex-col items-center justify-center w-12 text-center shrink-0">
                    <span className="text-xl font-bold text-lead-900">{new Date(rdo.data + 'T00:00:00').getDate()}</span>
                    <span className="text-[10px] font-semibold text-lead-400 uppercase">
                      {new Date(rdo.data + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                    </span>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-lead-900">{rdo.obras?.codigo} — {rdo.obras?.nome}</p>
                      <ClimaIcon className={`w-4 h-4 ${clima.color} shrink-0`} />
                    </div>
                    {rdo.atividades && (
                      <p className="text-sm text-lead-600 line-clamp-2">{rdo.atividades}</p>
                    )}
                    {rdo.comentarios && (
                      <p className="text-xs text-lead-500 mt-1 line-clamp-1 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />{rdo.comentarios}
                      </p>
                    )}
                    {rdo.ocorrencias && (
                      <p className="text-xs text-red-600 mt-1 line-clamp-1">⚠ {rdo.ocorrencias}</p>
                    )}
                  </div>

                  {/* Info direita */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1 text-xs text-lead-500">
                      <Users className="w-3.5 h-3.5" />
                      <span>{rdo.efetivo_total || 0}</span>
                    </div>
                    {fotos.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-brand-600">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{fotos.length} foto{fotos.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
