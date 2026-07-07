'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Building2, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]             = useState('')
  const [senha, setSenha]             = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando]   = useState(false)
  const [erro, setErro]               = useState('')

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
    <div className="min-h-screen flex"
      style={{ background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)' }}>

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-12"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center"
            style={{ boxShadow: '0 0 0 3px rgba(249,115,22,0.15)' }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Obra<span className="text-brand-400">Pro</span>
          </span>
        </div>

        <div>
          <blockquote className="text-lead-300 text-lg leading-relaxed font-light">
            "Gestão de obras com visibilidade total — do cronograma ao financeiro."
          </blockquote>
          <p className="text-lead-600 text-sm mt-4">VBCON ENGENHARIA</p>
        </div>

        <p className="text-lead-700 text-xs">© 2026 · Todos os direitos reservados</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center mb-3"
              style={{ boxShadow: '0 0 0 4px rgba(249,115,22,0.15)' }}>
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              Obra<span className="text-brand-400">Pro</span>
            </span>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl p-8"
            style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)' }}>

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
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com.br"
                    className="input pl-10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="senha" className="label">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lead-400 pointer-events-none" />
                  <input
                    id="senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lead-400 hover:text-lead-600 transition-colors"
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link href="/esqueci-senha" className="text-xs text-lead-400 hover:text-brand-600 transition-colors">
                  Esqueci minha senha
                </Link>
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="btn-primary w-full py-2.5"
              >
                {carregando ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Entrando...
                  </>
                ) : 'Entrar'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
