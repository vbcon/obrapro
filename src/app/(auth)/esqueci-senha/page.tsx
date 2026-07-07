'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Building2, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })

    setCarregando(false)
    if (error) {
      setErro('Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.')
      return
    }
    setEnviado(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lead-900 via-lead-800 to-lead-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/30 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            OBRA<span className="text-brand-400">PRO</span>
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {enviado ? (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-lead-900">E-mail enviado!</h2>
                <p className="text-sm text-lead-500 mt-2">
                  Enviamos um link para <strong>{email}</strong>.<br />
                  Verifique sua caixa de entrada (e o spam).
                </p>
              </div>
              <Link href="/login" className="btn-primary w-full mt-2">
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-lead-900">Recuperar senha</h2>
                <p className="text-lead-500 text-sm mt-1">Digite seu e-mail para receber o link de redefinição.</p>
              </div>

              {erro && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3.5 mb-5">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-red-700 text-sm">{erro}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="label">E-mail</label>
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

                <button type="submit" disabled={carregando} className="btn-primary w-full">
                  {carregando ? (
                    <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Enviando...</>
                  ) : 'Enviar link de recuperação'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-lead-500 hover:text-lead-700 transition-colors">
                  <ArrowLeft className="w-4 h-4" />Voltar ao login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
