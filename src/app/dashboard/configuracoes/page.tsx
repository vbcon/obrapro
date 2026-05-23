import Header from '@/components/layout/Header'
import { Settings, User, Bell, Shield, Building2 } from 'lucide-react'

export default function ConfiguracoesPage() {
  return (
    <>
      <Header titulo="Configurações" subtitulo="Gerencie suas preferências e conta" />

      <div className="p-6 max-w-2xl space-y-5">

        <div className="card divide-y divide-lead-100">
          {[
            { icon: User,      label: 'Perfil',         desc: 'Nome, foto, cargo e dados pessoais' },
            { icon: Building2, label: 'Empresa',         desc: 'Dados da construtora / empresa' },
            { icon: Bell,      label: 'Notificações',    desc: 'Alertas de prazo, compras e WhatsApp' },
            { icon: Shield,    label: 'Segurança',       desc: 'Senha, autenticação e acessos' },
          ].map(item => {
            const Icon = item.icon
            return (
              <button key={item.label} className="flex items-center gap-4 w-full px-5 py-4 hover:bg-lead-50 transition-colors text-left">
                <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-brand-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-lead-900">{item.label}</p>
                  <p className="text-xs text-lead-500">{item.desc}</p>
                </div>
                <Settings className="w-4 h-4 text-lead-300" />
              </button>
            )
          })}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-lead-900 mb-4">Informações do sistema</h3>
          <dl className="space-y-2 text-sm">
            {[
              ['Versão', '1.0.0'],
              ['Ambiente', 'Produção'],
              ['Banco de dados', 'Supabase PostgreSQL'],
              ['Framework', 'Next.js 14'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-lead-500">{k}</dt>
                <dd className="font-medium text-lead-700 font-mono text-xs">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

      </div>
    </>
  )
}
