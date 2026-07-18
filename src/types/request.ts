export type RequestStatus = 'novo' | 'em_analise' | 'contatado' | 'arquivado';
export type RequestType = 'empresa' | 'talento';

export type RequestRecord = {
  id: number;
  created_at: string;
  request_type: RequestType;
  name: string;
  email: string;
  organization: string;
  message: string;
  status: RequestStatus;
  is_test: boolean;
};
