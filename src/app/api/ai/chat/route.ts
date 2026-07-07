import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { message, historico = [] } = await req.json()
    if (!message) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })

    const supabase = await createClient()

    const [
      { data: obras },
      { data: compras },
      { data: cronograma },
      { data: financeiro },
      { data: solicitacoes },
    ] = await Promise.all([
      supabase.from('obras')
        .select('nome, codigo, status, progresso, orcamento_total, data_inicio, data_prevista, cliente, cidade')
        .order('nome').limit(20),

      supabase.from('compras')
        .select('numero_pedido, status, valor_total, fornecedor_nome, criado_em, obras(nome, codigo)')
        .order('criado_em', { ascending: false }).limit(20),

      supabase.from('cronograma')
        .select('titulo, categoria, responsavel, data_inicio, duracao_dias, data_fim, concluido, obras(nome, codigo)')
        .order('data_inicio').limit(40),

      supabase.from('financeiro')
        .select('tipo, descricao, valor, data, status, obras(nome, codigo)')
        .order('data', { ascending: false }).limit(20),

      supabase.from('solicitacoes_cliente')
        .select('titulo, categoria, status, criado_em, obras(nome, codigo)')
        .order('criado_em', { ascending: false }).limit(10),
    ])

    const hoje = new Date().toLocaleDateString('pt-BR')

    const systemPrompt = `Você é o assistente de IA do ObraPro, sistema de gestão de obras da VBCON ENGENHARIA.
Hoje é ${hoje}. Responda sempre em português, de forma direta e objetiva.
Use os dados abaixo para responder perguntas. Quando fizer cálculos, mostre os valores em R$.
Se não souber ou os dados não estiverem disponíveis, diga claramente.

=== OBRAS ===
${JSON.stringify(obras ?? [], null, 2)}

=== COMPRAS RECENTES ===
${JSON.stringify(compras ?? [], null, 2)}

=== CRONOGRAMA ===
${JSON.stringify(cronograma ?? [], null, 2)}

=== FINANCEIRO ===
${JSON.stringify(financeiro ?? [], null, 2)}

=== SOLICITAÇÕES ABERTAS ===
${JSON.stringify(solicitacoes ?? [], null, 2)}`

    const messages: Anthropic.MessageParam[] = [
      ...historico.slice(-8),
      { role: 'user', content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[ai/chat]', err)
    return NextResponse.json({ error: 'Erro ao processar mensagem' }, { status: 500 })
  }
}
