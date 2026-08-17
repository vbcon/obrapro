'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles, Loader2, RotateCcw } from 'lucide-react'
import { useChat } from '@/lib/context/ChatContext'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

const SUGESTOES = [
  'Qual o status geral das obras?',
  'Quanto gastamos este mês?',
  'Quais etapas estão atrasadas?',
  'Quais OCs pendentes de aprovação?',
  'Tem alguma solicitação aberta?',
]

export default function ChatWidget() {
  const { isOpen: aberto, close } = useChat()
  const [msgs, setMsgs]           = useState<Msg[]>([])
  const [input, setInput]         = useState('')
  const [carregando, setCarregando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, carregando])

  useEffect(() => {
    if (aberto) setTimeout(() => inputRef.current?.focus(), 100)
  }, [aberto])

  async function enviar(texto?: string) {
    const mensagem = (texto || input).trim()
    if (!mensagem || carregando) return

    const novas: Msg[] = [...msgs, { role: 'user', content: mensagem }]
    setMsgs(novas)
    setInput('')
    setCarregando(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: mensagem, historico: msgs.slice(-8) }),
      })
      const data = await res.json()
      setMsgs(prev => [...prev, {
        role: 'assistant',
        content: data.reply || 'Não consegui processar. Tente novamente.',
      }])
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Erro de conexão. Tente novamente.' }])
    } finally {
      setCarregando(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  return (
    <>
      {/* Painel de chat */}
      {aberto && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl overflow-hidden"
          style={{
            width: 380,
            height: 540,
            background: '#ffffff',
            boxShadow: '0 24px 64px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.06)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3.5 shrink-0"
            style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'rgba(249,115,22,0.15)' }}>
              <Sparkles className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Assistente VBCON</p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Powered by Claude</p>
            </div>
            <div className="flex items-center gap-1">
              {msgs.length > 0 && (
                <button
                  onClick={() => setMsgs([])}
                  title="Limpar conversa"
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={close}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'rgba(255,255,255,0.35)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {msgs.length === 0 ? (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-center text-lead-400">
                  Pergunte sobre obras, compras, cronograma ou financeiro.
                </p>
                <div className="space-y-2">
                  {SUGESTOES.map(s => (
                    <button
                      key={s}
                      onClick={() => enviar(s)}
                      className="w-full text-left text-[13px] px-3.5 py-2.5 rounded-xl border transition-all"
                      style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#475569' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#fff7ed'
                        e.currentTarget.style.borderColor = '#fdba74'
                        e.currentTarget.style.color = '#c2410c'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#f8fafc'
                        e.currentTarget.style.borderColor = '#e2e8f0'
                        e.currentTarget.style.color = '#475569'
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap"
                    style={m.role === 'user'
                      ? { background: '#f97316', color: '#fff', borderBottomRightRadius: 4 }
                      : { background: '#f1f5f9', color: '#1e293b', borderBottomLeftRadius: 4, border: '1px solid #e2e8f0' }
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}

            {carregando && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-bl-sm"
                  style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                  <Loader2 className="w-3.5 h-3.5 text-orange-500 animate-spin" />
                  <span className="text-xs text-slate-400">Analisando dados...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-3 shrink-0" style={{ borderTop: '1px solid #f1f5f9' }}>
            <form
              onSubmit={e => { e.preventDefault(); enviar() }}
              className="flex items-center gap-2 rounded-xl px-3 py-2 mt-3 transition-all"
              style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Pergunte sobre as obras..."
                className="flex-1 bg-transparent text-[13px] text-slate-700 placeholder-slate-400 outline-none"
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), enviar())}
              />
              <button
                type="submit"
                disabled={!input.trim() || carregando}
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
                style={{ background: '#f97316' }}
                onMouseEnter={e => { if (!carregando && input.trim()) e.currentTarget.style.background = '#ea580c' }}
                onMouseLeave={e => (e.currentTarget.style.background = '#f97316')}
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
