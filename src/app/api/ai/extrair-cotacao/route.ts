import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const isPdf = file.type === 'application/pdf'

    const mediaType = isPdf
      ? 'application/pdf'
      : (file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif')

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: isPdf ? 'document' : 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            } as any,
            {
              type: 'text',
              text: `Este documento é uma COTAÇÃO / ORÇAMENTO de fornecedor. Extraia TODOS os itens e retorne APENAS um JSON válido.

Regras importantes:
- Valores em formato brasileiro (1.234,56) devem ser convertidos para decimal com ponto (1234.56).
- "quantidade" e "valor_unitario" devem ser números, sem símbolo de moeda, sem separador de milhar.
- Se a unidade não estiver clara, use "un".
- Se o valor unitário não aparecer mas houver valor total e quantidade, calcule: valor_unitario = valor_total / quantidade.
- Inclua TODOS os itens listados, na ordem em que aparecem.

Formato:
{
  "fornecedor": "nome do fornecedor/emitente ou null",
  "condicao_pagamento": "condição de pagamento se houver, ou null",
  "itens": [
    { "descricao": "descrição do item", "unidade": "un/m/kg/etc", "quantidade": número, "valor_unitario": número }
  ]
}

Retorne SOMENTE o JSON, sem markdown, sem texto adicional.`,
            },
          ],
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}'
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const json = JSON.parse(cleaned)

    // Normaliza itens
    const itens = Array.isArray(json.itens) ? json.itens.map((it: any) => ({
      descricao:      String(it.descricao ?? '').trim(),
      unidade:        String(it.unidade ?? 'un').trim() || 'un',
      quantidade:     Number(it.quantidade) || 0,
      valor_unitario: Number(it.valor_unitario) || 0,
    })).filter((it: any) => it.descricao) : []

    return NextResponse.json({
      fornecedor:         json.fornecedor ?? null,
      condicao_pagamento: json.condicao_pagamento ?? null,
      itens,
    })
  } catch (err) {
    console.error('[extrair-cotacao]', err)
    return NextResponse.json({ error: 'Erro ao ler a cotação' }, { status: 500 })
  }
}
