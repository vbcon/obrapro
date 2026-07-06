import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Sun, Cloud, CloudRain, CloudSun, Users, MessageSquare, AlertTriangle, Megaphone, Camera } from 'lucide-react'

const climaConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  ensolarado:           { label: 'Ensolarado', icon: Sun,      color: 'text-yellow-500' },
  nublado:              { label: 'Nublado',    icon: Cloud,    color: 'text-lead-400'   },
  chuvoso:              { label: 'Chuvoso',    icon: CloudRain,color: 'text-blue-500'   },
  parcialmente_nublado: { label: 'Parcial',    icon: CloudSun, color: 'text-yellow-400' },
}

export default async function StatusObraDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: rdo } = await supabase
    .from('diario_obra')
    .select('*, obras(nome, codigo)')
    .eq('id', params.id)
    .single()

  if (!rdo) notFound()

  const clima = climaConfig[rdo.clima] || climaConfig.ensolarado
  const ClimaIcon = clima.icon
  const fotos: string[] = rdo.fotos || []
  const efetivo: { funcao: string; quantidade: number }[] = rdo.efetivo_detalhe || []
  const data = new Date(rdo.data + 'T00:00:00')

  return (
    <>
      <Header titulo="Status da Obra" subtitulo={`${rdo.obras?.codigo} — ${rdo.obras?.nome}`} />

      <div className="p-6 max-w-3xl space-y-5">
        <Link href="/dashboard/diario" className="inline-flex items-center gap-2 text-sm text-lead-500 hover:text-lead-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />Voltar
        </Link>

        {/* Cabeçalho */}
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center w-14 text-center shrink-0">
              <span className="text-3xl font-bold text-lead-900">{data.getDate()}</span>
              <span className="text-xs font-semibold text-lead-400 uppercase">
                {data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lead-900 text-lg">{rdo.obras?.codigo} — {rdo.obras?.nome}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-lead-500">
                <span className="flex items-center gap-1"><ClimaIcon className={`w-4 h-4 ${clima.color}`} />{clima.label}</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{rdo.efetivo_total || 0} pessoas</span>
                {fotos.length > 0 && <span className="flex items-center gap-1"><Camera className="w-3.5 h-3.5" />{fotos.length} foto{fotos.length !== 1 ? 's' : ''}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Fotos */}
        {fotos.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold text-lead-900 mb-4 flex items-center gap-2">
              <Camera className="w-4 h-4 text-brand-500" />Fotos
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {fotos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-video rounded-xl overflow-hidden hover:opacity-90 transition-opacity">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Atividades */}
        {rdo.atividades && (
          <div className="card p-5">
            <h3 className="font-semibold text-lead-900 mb-3">Atividades realizadas</h3>
            <p className="text-sm text-lead-600 whitespace-pre-wrap">{rdo.atividades}</p>
          </div>
        )}

        {/* Comentários */}
        {rdo.comentarios && (
          <div className="card p-5">
            <h3 className="font-semibold text-lead-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-500" />Comentários
            </h3>
            <p className="text-sm text-lead-600 whitespace-pre-wrap">{rdo.comentarios}</p>
          </div>
        )}

        {/* Ocorrências + Avisos */}
        {(rdo.ocorrencias || rdo.avisos) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rdo.ocorrencias && (
              <div className="card p-5">
                <h3 className="font-semibold text-lead-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />Ocorrências
                </h3>
                <p className="text-sm text-lead-600 whitespace-pre-wrap">{rdo.ocorrencias}</p>
              </div>
            )}
            {rdo.avisos && (
              <div className="card p-5">
                <h3 className="font-semibold text-lead-900 mb-3 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-brand-500" />Avisos
                </h3>
                <p className="text-sm text-lead-600 whitespace-pre-wrap">{rdo.avisos}</p>
              </div>
            )}
          </div>
        )}

        {/* Efetivo */}
        {efetivo.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold text-lead-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-500" />Efetivo — {rdo.efetivo_total} pessoas
            </h3>
            <div className="space-y-1.5">
              {efetivo.map((e, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-lead-50 text-sm">
                  <span className="text-lead-700">{e.funcao}</span>
                  <span className="font-semibold text-lead-900">{e.quantidade}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
