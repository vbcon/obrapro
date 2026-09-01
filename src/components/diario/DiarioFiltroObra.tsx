'use client'

import { useRouter } from 'next/navigation'

interface Props {
  obras: { id: string; nome: string; codigo: string }[]
  atual: string
}

export default function DiarioFiltroObra({ obras, atual }: Props) {
  const router = useRouter()

  function mudar(obraId: string) {
    router.push(obraId ? `/dashboard/diario?obra=${obraId}` : '/dashboard/diario')
  }

  return (
    <select value={atual} onChange={e => mudar(e.target.value)} className="select max-w-xs">
      <option value="">Todas as obras</option>
      {obras.map(o => (
        <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>
      ))}
    </select>
  )
}
