'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Trash2, Loader2 } from 'lucide-react'

export default function DiarioActions({ id }: { id: string }) {
  const router = useRouter()
  const [excluindo, setExcluindo] = useState(false)

  async function excluir() {
    if (!confirm('Excluir este registro? Esta ação não pode ser desfeita.')) return
    setExcluindo(true)
    const { error } = await createClient().from('diario_obra').delete().eq('id', id)
    if (error) { alert('Erro ao excluir: ' + error.message); setExcluindo(false); return }
    router.push('/dashboard/diario')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/dashboard/diario/${id}/editar`} className="btn-secondary btn-sm">
        <Pencil className="w-4 h-4" />Editar
      </Link>
      <button onClick={excluir} disabled={excluindo}
        className="btn-ghost btn-sm text-red-600 hover:bg-red-50">
        {excluindo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        Excluir
      </button>
    </div>
  )
}
