import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') // 'recovery' | 'invite' | 'signup'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Para recovery e invite, redirecionar para definir nova senha
      if (type === 'recovery' || type === 'invite') {
        return NextResponse.redirect(`${origin}/nova-senha`)
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=link_invalido`)
}
