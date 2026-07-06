'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Papel = 'admin' | 'cliente' | 'arquiteto'

export interface UserProfile {
  id: string
  nome: string
  email: string
  papel: Papel
  empresa?: string
  telefone?: string
}

const UserContext = createContext<UserProfile | null>(null)

export function UserProvider({
  children,
  initialProfile,
}: {
  children: React.ReactNode
  initialProfile: UserProfile | null
}) {
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile)

  useEffect(() => {
    // Re-fetch on client in case server-side data is stale
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('perfis').select('nome, email, papel, empresa, telefone').eq('id', user.id).single().then(({ data }) => {
        if (data) {
          setProfile({
            id: user.id,
            nome: data.nome || user.email?.split('@')[0] || '',
            email: data.email || user.email || '',
            papel: (data.papel as Papel) || 'admin',
            empresa: data.empresa,
            telefone: data.telefone,
          })
        }
      })
    })
  }, [])

  return <UserContext.Provider value={profile}>{children}</UserContext.Provider>
}

export function useUserProfile() {
  return useContext(UserContext)
}

// Helpers de papel
export function isAdmin(profile: UserProfile | null) { return profile?.papel === 'admin' }
export function isCliente(profile: UserProfile | null) { return profile?.papel === 'cliente' }
export function isArquiteto(profile: UserProfile | null) { return profile?.papel === 'arquiteto' }

export const PAPEL_LABELS: Record<Papel, string> = {
  admin: 'Construtora (Admin)',
  cliente: 'Cliente',
  arquiteto: 'Arquiteto',
}

export const PAPEL_CORES: Record<Papel, string> = {
  admin: 'bg-brand-100 text-brand-700',
  cliente: 'bg-blue-50 text-blue-700',
  arquiteto: 'bg-purple-50 text-purple-700',
}
