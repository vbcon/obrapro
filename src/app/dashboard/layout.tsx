import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfis')
    .select('nome, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-lead-50">
      <Sidebar
        nomeUsuario={perfil?.nome || user.email?.split('@')[0]}
        emailUsuario={perfil?.email || user.email}
      />

      {/* Conteúdo principal com margem para o sidebar */}
      <div className="pl-64 min-h-screen flex flex-col">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
