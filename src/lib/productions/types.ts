export const PRODUCTION_TYPES = [
  'tv',
  'advertising',
  'institutional',
  'photography',
  'event',
  'music',
  'audiovisual',
  'digital',
  'other',
] as const;

export type ProductionType = (typeof PRODUCTION_TYPES)[number];

export const PRODUCTION_STATUSES = [
  'draft',
  'planning',
  'casting',
  'pre_production',
  'in_production',
  'post_production',
  'completed',
  'cancelled',
  'archived',
] as const;

export type ProductionStatus = (typeof PRODUCTION_STATUSES)[number];

export type Production = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  production_type: ProductionType;
  client_name: string | null;
  project_reference: string | null;
  status: ProductionStatus;
  starts_at: string | null;
  ends_at: string | null;
  city: string | null;
  state: string | null;
  venue: string | null;
  address: string | null;
  is_remote: boolean;
  responsible_user_id: string | null;
  budget_casting: number | null;
  currency: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export const PRODUCTION_TYPE_LABELS: Record<ProductionType, string> = {
  tv: 'TV',
  advertising: 'Publicidade',
  institutional: 'Institucional',
  photography: 'Fotografia',
  event: 'Evento',
  music: 'Música',
  audiovisual: 'Audiovisual',
  digital: 'Digital',
  other: 'Outro',
};

export const PRODUCTION_STATUS_LABELS: Record<ProductionStatus, string> = {
  draft: 'Rascunho',
  planning: 'Planejamento',
  casting: 'Em casting',
  pre_production: 'Pré-produção',
  in_production: 'Em produção',
  post_production: 'Pós-produção',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  archived: 'Arquivada',
};
