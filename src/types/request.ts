export type RequestStatus = 'novo' | 'em_analise' | 'contatado' | 'arquivado';
export type RequestType = 'empresa' | 'talento';

export type RequestRecord = {
  id: number;
  created_at: string;
  updated_at: string;
  request_type: RequestType;
  name: string;
  email: string;
  organization: string;
  message: string;
  status: RequestStatus;
  is_test: boolean;
  assigned_to: string;
  internal_notes: string;
};

export type RequestAdminUpdate = Pick<
  RequestRecord,
  'request_type' | 'name' | 'email' | 'organization' | 'status' | 'assigned_to' | 'internal_notes'
>;

export type RequestHistoryEntry = {
  id: number;
  request_id: number;
  changed_at: string;
  changed_by_email: string | null;
  changes: Record<string, { from: unknown; to: unknown }>;
};
