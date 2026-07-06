'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Papel, UserProfile } from '@/lib/types/roles'

export type { Papel, UserProfile }
export { PAPEL_LABELS, PAPEL_CORES } from '@/lib/types/roles'

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
