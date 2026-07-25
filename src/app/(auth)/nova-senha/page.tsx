'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function NovaSenhaPage() {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [concluido, setConcluido] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }

    setCarregando(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: senha })

    if (error) {
      setErro('Não foi possível atualizar a senha. O link pode ter expirado — solicite um novo.')
      setCarregando(false)
      return
    }

    setConcluido(true)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  const forca = senha.length === 0 ? 0 : senha.length < 8 ? 1 : senha.length < 12 ? 2 : 3
  const forcaCores = ['', 'bg-red-400', 'bg-amber-400', 'bg-green-500']
  const forcaLabels = ['', 'Fraca', 'Média', 'Forte']

  return (
    <div className="min-h-screen bg-gradient-to-br from-lead-900 via-lead-800 to-lead-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="VBCON Engenharia" width={120} height={120} className="object-contain" priority />
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {concluido ? (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-lead-900">Senha definida!</h2>
                <p className="text-sm text-lead-500 mt-2">Redirecionando para o dashboard...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-lead-900">Defina sua senha</h2>
                <p className="text-lead-500 text-sm mt-1">Escolha uma senha segura para acessar o sistema.</p>
              </div>

              {erro && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3.5 mb-5">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-red-700 text-sm">{erro}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="senha" className="label">Nova senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lead-400" />
                    <input
                      id="senha"
                      type={mostrarSenha ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
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
                  {senha.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= forca ? forcaCores[forca] : 'bg-lead-200'}`} />
                        ))}
                      </div>
                      <span className={`text-xs font-medium ${forca === 1 ? 'text-red-500' : forca === 2 ? 'text-amber-600' : 'text-green-600'}`}>
                        {forcaLabels[forca]}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmar" className="label">Confirmar senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lead-400" />
                    <input
                      id="confirmar"
                      type={mostrarSenha ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={confirmar}
                      onChange={e => setConfirmar(e.target.value)}
                      placeholder="Repita a senha"
                      className={`input pl-10 ${confirmar && senha !== confirmar ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                    />
                  </div>
                  {confirmar && senha !== confirmar && (
                    <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
                  )}
                </div>

                <button type="submit" disabled={carregando || senha !== confirmar || forca === 0} className="btn-primary w-full mt-2">
                  {carregando ? (
                    <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</>
                  ) : 'Salvar senha e entrar'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
