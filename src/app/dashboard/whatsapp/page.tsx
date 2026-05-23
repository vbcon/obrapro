import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { MessageCircle, Plus, Send, CheckCheck, Clock, XCircle, Users } from 'lucide-react'
import type { WhatsappMensagem } from '@/lib/types/database'

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  enviando:  { label: 'Enviando',   color: 'bg-yellow-50 text-yellow-700',  icon: Clock },
  enviada:   { label: 'Enviada',    color: 'bg-blue-50 text-blue-700',      icon: Send },
  entregue:  { label: 'Entregue',   color: 'bg-brand-50 text-brand-700',    icon: CheckCheck },
  lida:      { label: 'Lida',       color: 'bg-green-50 text-green-700',    icon: CheckCheck },
  erro:      { label: 'Erro',       color: 'bg-red-50 text-red-700',        icon: XCircle },
}

export default async function WhatsappPage() {
  const supabase = await createClient()

  const [{ data: mensagens }, { data: contatos }] = await Promise.all([
    supabase
      .from('whatsapp_mensagens')
      .select('*, whatsapp_contatos(nome), obras(nome)')
      .order('enviado_em', { ascending: false })
      .limit(50),
    supabase
      .from('whatsapp_contatos')
      .select('*')
      .eq('ativo', true)
      .order('nome'),
  ])

  const listaMensagens: WhatsappMensagem[] = mensagens || []
  const listaContatos = contatos || []

  const totalEnviadas = listaMensagens.filter(m => ['enviada', 'entregue', 'lida'].includes(m.status)).length
  const totalErros = listaMensagens.filter(m => m.status === 'erro').length

  return (
    <>
      <Header titulo="WhatsApp" subtitulo="Comunicação com equipes e clientes" />

      <div className="p-6 space-y-5">

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total enviadas', valor: listaMensagens.length, cor: 'text-lead-900' },
            { label: 'Com sucesso', valor: totalEnviadas, cor: 'text-green-600' },
            { label: 'Com erro', valor: totalErros, cor: 'text-red-600' },
            { label: 'Contatos ativos', valor: listaContatos.length, cor: 'text-brand-600' },
          ].map(item => (
            <div key={item.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${item.cor}`}>{item.valor}</p>
              <p className="text-xs text-lead-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Envio de mensagem */}
          <div className="lg:col-span-1">
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-lead-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-brand-500" />
                Enviar mensagem
              </h2>

              <div>
                <label className="label">Contato / Número</label>
                <input type="tel" placeholder="+55 61 99999-9999" className="input" />
              </div>

              <div>
                <label className="label">Obra (opcional)</label>
                <select className="input">
                  <option value="">Selecione uma obra...</option>
                </select>
              </div>

              <div>
                <label className="label">Mensagem</label>
                <textarea
                  rows={4}
                  placeholder="Digite a mensagem..."
                  className="input resize-none"
                />
              </div>

              <button className="btn-primary w-full">
                <Send className="w-4 h-4" />
                Enviar via WhatsApp
              </button>

              <p className="text-xs text-lead-400 text-center">
                Integração com WhatsApp Business API
              </p>
            </div>

            {/* Contatos */}
            <div className="card mt-4">
              <div className="flex items-center justify-between px-5 py-4 border-b border-lead-100">
                <h2 className="font-semibold text-lead-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-lead-500" />
                  Contatos ({listaContatos.length})
                </h2>
                <button className="btn-ghost text-xs px-2 py-1">
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar
                </button>
              </div>

              {listaContatos.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-lead-400">Nenhum contato cadastrado</p>
                </div>
              ) : (
                <div className="divide-y divide-lead-100 max-h-64 overflow-y-auto scrollbar-thin">
                  {listaContatos.map((contato: { id: string; nome: string; telefone: string; grupo?: string }) => (
                    <div key={contato.id} className="flex items-center gap-3 px-5 py-3 hover:bg-lead-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-brand-500/15 text-brand-600 font-semibold text-sm flex items-center justify-center shrink-0">
                        {contato.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-lead-900 truncate">{contato.nome}</p>
                        <p className="text-xs text-lead-500">{contato.telefone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Histórico de mensagens */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-lead-100">
                <h2 className="font-semibold text-lead-900">Histórico de mensagens</h2>
              </div>

              {listaMensagens.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-base font-semibold text-lead-900">Nenhuma mensagem enviada</h3>
                  <p className="text-lead-500 text-sm mt-1 max-w-xs">
                    Use o painel ao lado para enviar mensagens via WhatsApp.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-lead-100 max-h-[500px] overflow-y-auto scrollbar-thin">
                  {listaMensagens.map((msg: WhatsappMensagem & { whatsapp_contatos?: { nome: string }; obras?: { nome: string } }) => {
                    const cfg = statusConfig[msg.status] || statusConfig.enviando
                    const StatusIcon = cfg.icon
                    return (
                      <div key={msg.id} className="px-5 py-4 hover:bg-lead-50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-green-500/15 text-green-600 font-semibold text-sm flex items-center justify-center shrink-0">
                              {(msg.whatsapp_contatos?.nome || msg.telefone).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-lead-900">
                                {msg.whatsapp_contatos?.nome || msg.telefone}
                              </p>
                              {msg.obras && (
                                <p className="text-xs text-lead-400">{msg.obras.nome}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`badge ${cfg.color} inline-flex items-center gap-1`}>
                              <StatusIcon className="w-3 h-3" />
                              <span className="hidden sm:inline">{cfg.label}</span>
                            </span>
                            <span className="text-xs text-lead-400">
                              {new Date(msg.enviado_em).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-lead-600 mt-2.5 pl-10.5 line-clamp-2">{msg.mensagem}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
