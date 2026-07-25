import { NextRequest, NextResponse } from 'next/server'

const WA_API_URL = 'https://graph.facebook.com/v19.0'
const PHONE_ID   = process.env.WHATSAPP_PHONE_NUMBER_ID
const TOKEN      = process.env.WHATSAPP_ACCESS_TOKEN
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL || 'https://obrapro.vercel.app'

export async function POST(req: NextRequest) {
  if (!PHONE_ID || !TOKEN) {
    return NextResponse.json(
      { ok: false, erro: 'WHATSAPP_PHONE_NUMBER_ID ou WHATSAPP_ACCESS_TOKEN não configurados.' },
      { status: 500 }
    )
  }

  const { telefone, numero_oc, obra_nome, token } = await req.json()
  if (!telefone || !token) {
    return NextResponse.json({ ok: false, erro: 'Parâmetros insuficientes.' }, { status: 400 })
  }

  const linkAprovacao = `${APP_URL}/aprovar-oc/${token}`

  // Formata número: garante código do país sem '+'
  const numero = telefone.replace(/\D/g, '').replace(/^0+/, '')
  const to = numero.startsWith('55') ? numero : `55${numero}`

  const mensagem =
    `Olá! 👋\n\n` +
    `A *${numero_oc}* referente à obra *${obra_nome || 'sua obra'}* está aguardando sua aprovação.\n\n` +
    `Clique no link abaixo para revisar os itens e aprovar:\n` +
    `${linkAprovacao}\n\n` +
    `_VBCON Engenharia_`

  const body = {
    messaging_product: 'whatsapp',
    recipient_type:    'individual',
    to,
    type:   'text',
    text: {
      preview_url: true,
      body:        mensagem,
    },
  }

  const res = await fetch(`${WA_API_URL}/${PHONE_ID}/messages`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok) {
    const erro = data?.error?.message || 'Erro ao enviar mensagem pelo WhatsApp.'
    return NextResponse.json({ ok: false, erro }, { status: res.status })
  }

  return NextResponse.json({ ok: true, message_id: data?.messages?.[0]?.id })
}
