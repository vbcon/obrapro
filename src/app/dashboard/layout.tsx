import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import { UserProvider, type Papel } from '@/lib/context/UserContext'

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
    .select('nome, email, papel, empresa, telefone')
    .eq('id', user.id)
    .single()

  const initialProfile = perfil ? {
    id: user.id,
    nome: perfil.nome || user.email?.split('@')[0] || '',
    email: perfil.email || user.email || '',
    papel: (perfil.papel as Papel) || 'admin',
    empresa: perfil.empresa,
    telefone: perfil.telefone,
  } : null

  return (
    <UserProvider initialProfile={initialProfile}>
      <div className="min-h-screen bg-lead-50">
        <Sidebar
          nomeUsuario={perfil?.nome || user.email?.split('@')[0]}
          emailUsuario={perfil?.email || user.email}
          papel={(perfil?.papel as Papel) || 'admin'}
        />
        <div className="pl-64 min-h-screen flex flex-col">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </UserProvider>
  )
}
