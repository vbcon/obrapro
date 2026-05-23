export type ObraStatus = 'planejamento' | 'em_andamento' | 'pausada' | 'concluida' | 'cancelada'
export type ObraTipo = 'residencial' | 'comercial' | 'industrial' | 'reforma' | 'outro'
export type EtapaStatus = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'
export type TarefaStatus = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'
export type TarefaPrioridade = 'baixa' | 'media' | 'alta' | 'urgente'
export type CompraStatus = 'rascunho' | 'enviado' | 'aprovado' | 'recebido' | 'cancelado'
export type WhatsappStatus = 'enviando' | 'enviada' | 'entregue' | 'lida' | 'erro'

export interface Perfil {
  id: string
  nome: string
  email: string
  telefone?: string
  cargo?: string
  avatar_url?: string
  empresa?: string
  criado_em: string
  atualizado_em: string
}

export interface Obra {
  id: string
  codigo: string
  nome: string
  descricao?: string
  cliente: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  tipo: ObraTipo
  status: ObraStatus
  data_inicio?: string
  data_prevista?: string
  data_conclusao?: string
  orcamento_total: number
  custo_atual: number
  percentual_conclusao: number
  responsavel_id?: string
  criado_por?: string
  criado_em: string
  atualizado_em: string
}

export interface Etapa {
  id: string
  obra_id: string
  nome: string
  descricao?: string
  ordem: number
  status: EtapaStatus
  data_inicio?: string
  data_prevista?: string
  data_conclusao?: string
  percentual_conclusao: number
  responsavel_id?: string
  criado_em: string
  atualizado_em: string
}

export interface Tarefa {
  id: string
  etapa_id: string
  obra_id: string
  titulo: string
  descricao?: string
  status: TarefaStatus
  prioridade: TarefaPrioridade
  data_inicio?: string
  data_prevista?: string
  data_conclusao?: string
  responsavel_id?: string
  criado_por?: string
  criado_em: string
  atualizado_em: string
}

export interface Fornecedor {
  id: string
  razao_social: string
  nome_fantasia?: string
  cnpj_cpf?: string
  email?: string
  telefone?: string
  whatsapp?: string
  endereco?: string
  cidade?: string
  estado?: string
  categoria?: string
  ativo: boolean
  observacoes?: string
  criado_em: string
  atualizado_em: string
}

export interface Compra {
  id: string
  obra_id: string
  fornecedor_id?: string
  numero_pedido?: string
  status: CompraStatus
  data_pedido: string
  data_entrega_prevista?: string
  data_entrega_real?: string
  valor_total: number
  desconto: number
  forma_pagamento?: string
  condicao_pagamento?: string
  observacoes?: string
  solicitado_por?: string
  aprovado_por?: string
  criado_em: string
  atualizado_em: string
}

export interface ItemCompra {
  id: string
  compra_id: string
  descricao: string
  unidade: string
  quantidade: number
  preco_unitario: number
  preco_total: number
  observacoes?: string
  criado_em: string
}

export interface EventoCronograma {
  id: string
  obra_id: string
  etapa_id?: string
  titulo: string
  descricao?: string
  tipo: 'marco' | 'entrega' | 'reuniao' | 'vistoria' | 'pagamento' | 'outro'
  data_inicio: string
  data_fim?: string
  dia_todo: boolean
  concluido: boolean
  cor: string
  responsavel_id?: string
  criado_em: string
  atualizado_em: string
}

export interface WhatsappContato {
  id: string
  nome: string
  telefone: string
  grupo?: string
  obra_id?: string
  ativo: boolean
  criado_em: string
}

export interface WhatsappMensagem {
  id: string
  contato_id?: string
  obra_id?: string
  telefone: string
  mensagem: string
  status: WhatsappStatus
  enviado_por?: string
  enviado_em: string
  erro_detalhes?: string
}
