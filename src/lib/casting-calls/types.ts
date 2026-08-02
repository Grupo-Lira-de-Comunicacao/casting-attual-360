export const CASTING_CALL_STATUSES = ['draft', 'open', 'paused', 'closed', 'cancelled'] as const;
export type CastingCallStatus = (typeof CASTING_CALL_STATUSES)[number];

export const CASTING_REQUIREMENT_TYPES = [
  'category',
  'skill',
  'specialty',
  'language',
  'availability',
  'location',
  'age_range',
  'profile_attribute',
  'other',
] as const;
export type CastingRequirementType = (typeof CASTING_REQUIREMENT_TYPES)[number];

export type CastingCall = {
  id: string;
  production_id: string;
  title: string;
  role_name: string;
  description: string | null;
  status: CastingCallStatus;
  quantity: number;
  application_deadline: string | null;
  work_starts_at: string | null;
  work_ends_at: string | null;
  city: string | null;
  state: string | null;
  venue: string | null;
  is_remote: boolean;
  compensation_amount: number | null;
  currency: string;
  compensation_notes: string | null;
  internal_notes: string | null;
  published_at: string | null;
  closed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CastingRequirement = {
  id: string;
  casting_call_id: string;
  requirement_type: CastingRequirementType;
  label: string;
  value_text: string | null;
  min_value: number | null;
  max_value: number | null;
  is_required: boolean;
  weight: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CastingCallWithRequirements = CastingCall & {
  requirements: CastingRequirement[];
};
