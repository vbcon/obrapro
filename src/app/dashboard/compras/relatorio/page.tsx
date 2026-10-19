'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { ArrowLeft, Download, Printer, Package, Building2 } from 'lucide-react'

const STATUS_OC: Record<string, { label: string; badge: string }> = {
  rascunho:             { label: 'Rascunho',     badge: 'badge-neutral' },
  enviado:              { label: 'Enviado',      badge: 'badge-blue'    },
  aguardando_aprovacao: { label: 'Aguard. aprov.', badge: 'badge-yellow' },
  pendente:             { label: 'Pendente',     badge: 'badge-yellow'  },
  aprovado:             { label: 'Aprovado',     badge: 'badge-green'   },
  direta:               { label: 'Direta',       badge: 'badge-purple'  },
  recebido:             { label: 'Recebido',     badge: 'badge-neutral' },
  cancelado:            { label: 'Cancelado',    badge: 'badge-red'     },
}

function fmtMoeda(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}
function fmtData(d?: string) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}
function fornecedorDe(oc: any) {
  return oc.fornecedor_nome || oc.fornecedores?.nome_fantasia || oc.fornecedores?.razao_social || '—'
}
function csvCell(v: unknown) {
  return `"${String(v ?? '').replace(/"/g, '""')}"`
}

export default function RelatorioComprasPage() {
  const [ordens, setOrdens]         = useState<any[]>([])
  const [obras, setObras]           = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [carregando, setCarregando] = useState(true)

  const [filtroObra, setFiltroObra]     = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [dataIni, setDataIni]           = useState('')
  const [dataFim, setDataFim]           = useState('')
  const [incluirCanc, setIncluirCanc]   = useState(false)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('compras')
        .select('id, obra_id, numero_pedido, status, tipo, data_pedido, valor_total, fornecedor_nome, fornecedores(nome_fantasia, razao_social)')
        .order('data_pedido', { ascending: false }),
      supabase.from('obras').select('id, nome, codigo').order('nome'),
    ]).then(([{ data: o }, { data: ob }]) => {
      setOrdens(o || [])
      setObras(ob || [])
      setCarregando(false)
    })
  }, [])

  const filtradas = useMemo(() => ordens.filter(o => {
    if (filtroObra && o.obra_id !== filtroObra) return false
    if (filtroStatus && o.status !== filtroStatus) return false
    if (!incluirCanc && !filtroStatus && o.status === 'cancelado') return false
    if (dataIni && (!o.data_pedido || o.data_pedido < dataIni)) return false
    if (dataFim && (!o.data_pedido || o.data_pedido > dataFim)) return false
    return true
  }), [ordens, filtroObra, filtroStatus, incluirCanc, dataIni, dataFim])

  const grupos = useMemo(() => {
    const porObra = new Map<string, any[]>()
    filtradas.forEach(o => porObra.set(o.obra_id, [...(porObra.get(o.obra_id) || []), o]))
    return obras
      .filter(ob => porObra.has(ob.id))
      .map(ob => {
        const lista = porObra.get(ob.id)!
        return { obra: ob, lista, total: lista.reduce((s, o) => s + (Number(o.valor_total) || 0), 0) }
      })
  }, [filtradas, obras])

  const totalGeral = grupos.reduce((s, g) => s + g.total, 0)

  function exportarCSV() {
    const linhas = [['Obra', 'Código', 'Nº OC', 'Data', 'Fornecedor', 'Tipo', 'Status', 'Valor (R$)']]
    grupos.forEach(g => g.lista.forEach(o => linhas.push([
      g.obra.nome, g.obra.codigo, o.numero_pedido || o.id.slice(0, 8).toUpperCase(),
      fmtData(o.data_pedido), fornecedorDe(o), o.tipo === 'direta' ? 'Direta' : 'Cotação',
      STATUS_OC[o.status]?.label || o.status, (Number(o.valor_total) || 0).toFixed(2).replace('.', ','),
    ])))
    const csv = '﻿' + linhas.map(l => l.map(csvCell).join(';')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `ordens-de-compra-por-obra-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="print:hidden">
        <Header titulo="Relatório de Ordens de Compra" subtitulo="Agrupado por obra" />
      </div>

      <div className="page-body">
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Link href="/dashboard/compras" className="btn-ghost py-1.5 px-3 text-sm">
            <ArrowLeft className="w-4 h-4" />Compras
          </Link>
          <div className="ml-auto flex gap-2">
            <button onClick={exportarCSV} disabled={!filtradas.length} className="btn-secondary btn-sm">
              <Download className="w-3.5 h-3.5" />Exportar CSV
            </button>
            <button onClick={() => window.print()} className="btn-primary btn-sm">
              <Printer className="w-3.5 h-3.5" />Imprimir / PDF
            </button>
          </div>
        </div>

        <div className="card p-4 flex flex-wrap items-end gap-3 print:hidden">
          <label className="text-xs text-lead-500 space-y-1">
            <span>Obra</span>
            <select value={filtroObra} onChange={e => setFiltroObra(e.target.value)} className="select select-sm block max-w-[220px]">
              <option value="">Todas as obras</option>
              {obras.map(o => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
            </select>
          </label>
          <label className="text-xs text-lead-500 space-y-1">
            <span>Status</span>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="select select-sm block">
              <option value="">Todos</option>
              {Object.entries(STATUS_OC).filter(([v]) => v !== 'pendente').map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
            </select>
          </label>
          <label className="text-xs text-lead-500 space-y-1">
            <span>De</span>
            <input type="date" value={dataIni} onChange={e => setDataIni(e.target.value)} className="input input-sm block" />
          </label>
          <label className="text-xs text-lead-500 space-y-1">
            <span>Até</span>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="input input-sm block" />
          </label>
          <label className="flex items-center gap-2 text-xs text-lead-600 pb-1.5">
            <input type="checkbox" checked={incluirCanc} onChange={e => setIncluirCanc(e.target.checked)} />
            Incluir canceladas
          </label>
        </div>

        <div className="hidden print:block">
          <h1 className="text-lg font-bold">Relatório de Ordens de Compra por Obra</h1>
          <p className="text-xs text-lead-500">
            Emitido em {new Date().toLocaleDateString('pt-BR')}
            {dataIni && ` · de ${fmtData(dataIni)}`}{dataFim && ` até ${fmtData(dataFim)}`}
            {filtroStatus && ` · status: ${STATUS_OC[filtroStatus]?.label}`}
          </p>
        </div>

        {carregando ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : grupos.length === 0 ? (
          <div className="card empty-state py-12">
            <div className="empty-state-icon"><Package className="w-6 h-6 text-lead-400" /></div>
            <p className="text-sm font-medium text-lead-600">Nenhuma ordem de compra encontrada</p>
          </div>
        ) : (
          <>
            {grupos.map(g => (
              <div key={g.obra.id} className="card overflow-hidden break-inside-avoid">
                <div className="flex items-center gap-3 px-5 py-3 bg-lead-50/70 border-b border-lead-100">
                  <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-lead-900 truncate">{g.obra.codigo} — {g.obra.nome}</p>
                    <p className="text-xs text-lead-400">{g.lista.length} {g.lista.length === 1 ? 'ordem' : 'ordens'}</p>
                  </div>
                  <span className="text-[13px] font-bold text-lead-900 tabular-nums">{fmtMoeda(g.total)}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-lead-400 border-b border-lead-100">
                        <th className="px-5 py-2 font-medium">Nº OC</th>
                        <th className="px-3 py-2 font-medium">Data</th>
                        <th className="px-3 py-2 font-medium">Fornecedor</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-5 py-2 font-medium text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-lead-100/80">
                      {g.lista.map(o => {
                        const sts = STATUS_OC[o.status] || { label: o.status, badge: 'badge-neutral' }
                        return (
                          <tr key={o.id}>
                            <td className="px-5 py-2 font-mono text-lead-900">
                              <Link href={`/dashboard/compras/oc/${o.id}`} className="hover:underline">
                                {o.numero_pedido || o.id.slice(0, 8).toUpperCase()}
                              </Link>
                            </td>
                            <td className="px-3 py-2 text-lead-600">{fmtData(o.data_pedido)}</td>
                            <td className="px-3 py-2 text-lead-600">{fornecedorDe(o)}</td>
                            <td className="px-3 py-2"><span className={`${sts.badge} text-[10px]`}>{sts.label}</span></td>
                            <td className="px-5 py-2 text-right tabular-nums font-semibold text-lead-900">{fmtMoeda(Number(o.valor_total))}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            <div className="flex justify-end px-2">
              <span className="text-sm font-bold text-lead-900">
                Total geral ({filtradas.length} OCs): {fmtMoeda(totalGeral)}
              </span>
            </div>
          </>
        )}
      </div>
    </>
  )
}
