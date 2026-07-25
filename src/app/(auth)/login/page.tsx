'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

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
      <div className="hidden lg:flex flex-col items-center justify-center w-[420px] shrink-0 px-12 py-16 bg-white border-r border-lead-100 relative">

        <Image src="/logo.png" alt="VBCON Engenharia" width={300} height={300} className="object-contain" priority />

        <blockquote className="text-lead-500 text-base leading-relaxed font-light text-center mt-10">
          "Gestão da sua obra com visibilidade total — qualidade, transparência e planejamento."
        </blockquote>

        <p className="absolute bottom-8 text-lead-400 text-xs">© 2026 · Todos os direitos reservados</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Image src="/logo.png" alt="VBCON Engenharia" width={180} height={180} className="object-contain" priority />
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
