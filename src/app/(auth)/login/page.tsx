'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Building2, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

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
    <div className="min-h-screen bg-gradient-to-br from-lead-900 via-lead-800 to-lead-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo e cabeçalho */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/30 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            OBRA<span className="text-brand-400">PRO</span>
          </h1>
          <p className="text-lead-400 mt-1 text-sm">Gestão Profissional de Obras</p>
        </div>

        {/* Card de login */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-lead-900">Entrar na plataforma</h2>
            <p className="text-lead-500 text-sm mt-1">Digite suas credenciais de acesso</p>
          </div>

          {erro && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3.5 mb-5">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-700 text-sm">{erro}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lead-400" />
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
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lead-400" />
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

            <div className="flex justify-end -mt-1">
              <Link href="/esqueci-senha" className="text-xs text-lead-500 hover:text-brand-600 transition-colors">
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="btn-primary w-full"
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

        <p className="text-center text-lead-500 text-xs mt-6">
          © 2026 VBCON ENGENHARIA · Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
