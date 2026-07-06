// Tipos e constantes de papéis — sem 'use client', importável em server e client

export type Papel = 'admin' | 'cliente' | 'arquiteto'

export interface UserProfile {
  id: string
  nome: string
  email: string
  papel: Papel
  empresa?: string
  telefone?: string
}

export const PAPEL_LABELS: Record<Papel, string> = {
  admin:     'Construtora (Admin)',
  cliente:   'Cliente',
  arquiteto: 'Arquiteto',
}

export const PAPEL_CORES: Record<Papel, string> = {
  admin:     'bg-brand-100 text-brand-700',
  cliente:   'bg-blue-50 text-blue-700',
  arquiteto: 'bg-purple-50 text-purple-700',
}
