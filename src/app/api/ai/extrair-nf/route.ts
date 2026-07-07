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
      max_tokens: 512,
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
              text: `Extraia os dados desta nota fiscal / boleto e retorne APENAS um JSON válido.
Se um campo não existir no documento, use null.

{
  "numero_nota": "número da NF, fatura ou boleto",
  "fornecedor": "razão social ou nome do emitente",
  "valor": número decimal sem formatação (ex: 1500.00),
  "data_emissao": "YYYY-MM-DD",
  "data_vencimento": "YYYY-MM-DD",
  "descricao": "descrição curta dos itens ou serviço (máx 80 caracteres)"
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

    return NextResponse.json(json)
  } catch (err) {
    console.error('[extrair-nf]', err)
    return NextResponse.json({ error: 'Erro ao processar documento' }, { status: 500 })
  }
}
