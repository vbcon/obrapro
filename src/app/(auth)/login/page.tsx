'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

function VbconLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 28 : size === 'lg' ? 56 : 40
  const textSm = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg'
  const subSm  = size === 'sm' ? 'text-[7px]' : size === 'lg' ? 'text-[11px]' : 'text-[9px]'
  return (
    <div className="flex items-center gap-2.5">
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="36" height="36" stroke="#1a1a1a" strokeWidth="2.5"/>
        <polygon points="7,7 20,31 33,7 29,7 20,25 11,7" fill="#f97316"/>
      </svg>
      <div className="leading-none">
        <p className={`font-black tracking-wider leading-none text-lead-900 ${textSm}`}>VBCON</p>
        <p className={`font-bold tracking-[0.18em] leading-none mt-1 text-brand-500 ${subSm}`}>ENGENHARIA</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]               = useState('')
  const [senha, setSenha]               = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando]     = useState(false)
  const [erro, setErro]                 = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro('Email ou senha incorretos. Verifique seus dados e tente novamente.')
      setCarregando(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f0f2f5' }}>

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-12 bg-white border-r border-lead-100">

        <VbconLogo size="md" />

        <div>
          <blockquote className="text-lead-600 text-lg leading-relaxed font-light">
            "Gestão de obras com visibilidade total — do cronograma ao financeiro."
          </blockquote>
          <div className="mt-6 flex items-center gap-3">
            <div className="w-10 h-10">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="36" height="36" stroke="#1a1a1a" strokeWidth="2.5"/>
                <polygon points="7,7 20,31 33,7 29,7 20,25 11,7" fill="#f97316"/>
              </svg>
            </div>
            <div>
              <p className="font-bold text-lead-900 text-sm">VBCON Engenharia</p>
              <p className="text-xs text-lead-400">Plataforma de gestão de obras</p>
            </div>
          </div>
        </div>

        <p className="text-lead-400 text-xs">© 2026 · Todos os direitos reservados</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <VbconLogo size="lg" />
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">

            <div className="mb-7">
              <h2 className="text-xl font-bold text-lead-900">Entrar na plataforma</h2>
              <p className="text-sm text-lead-400 mt-1">Digite suas credenciais de acesso</p>
            </div>

            {erro && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-red-700 text-sm">{erro}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lead-400 pointer-events-none" />
                  <input id="email" type="email" required autoComplete="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com.br" className="input pl-10" />
                </div>
              </div>

              <div>
                <label htmlFor="senha" className="label">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lead-400 pointer-events-none" />
                  <input id="senha" type={mostrarSenha ? 'text' : 'password'} required
                    autoComplete="current-password"
                    value={senha} onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••" className="input pl-10 pr-10" />
                  <button type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lead-400 hover:text-lead-600 transition-colors">
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link href="/esqueci-senha" className="text-xs text-lead-400 hover:text-brand-600 transition-colors">
                  Esqueci minha senha
                </Link>
              </div>

              <button type="submit" disabled={carregando} className="btn-primary w-full py-2.5">
                {carregando ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>Entrando...</>
                ) : 'Entrar'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
