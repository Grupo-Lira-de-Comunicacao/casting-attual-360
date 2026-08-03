import type { CastingRequirement } from '@/lib/casting-calls/types';
import type { TalentRecord } from '@/types/talent';

export type MatchEligibility = 'eligible' | 'ineligible' | 'review';

export type RequirementEvaluation = {
  requirement_id: string;
  type: CastingRequirement['requirement_type'];
  label: string;
  required: boolean;
  weight: number;
  result: 'matched' | 'failed' | 'review';
  reason: string;
};

export type TalentMatchResult = {
  talent_id: string;
  match_score: number;
  eligibility_status: MatchEligibility;
  matched_requirements: RequirementEvaluation[];
  failed_requirements: RequirementEvaluation[];
  review_requirements: RequirementEvaluation[];
  score_explanation: {
    calculable_weight: number;
    matched_weight: number;
    calculable_requirements: number;
    review_requirements: number;
    summary: string;
  };
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function alternatives(value: string | null) {
  return (value ?? '')
    .split(/[,;\n|]/)
    .map(normalize)
    .filter(Boolean);
}

function normalizedList(values: string[]) {
  return values.map(normalize).filter(Boolean);
}

function matchesAny(expected: string[], actual: string[]) {
  if (expected.length === 0 || actual.length === 0) return false;
  return expected.some((item) => actual.some((candidate) => candidate === item || candidate.includes(item) || item.includes(candidate)));
}

function review(requirement: CastingRequirement, reason: string): RequirementEvaluation {
  return {
    requirement_id: requirement.id,
    type: requirement.requirement_type,
    label: requirement.label,
    required: requirement.is_required,
    weight: requirement.weight,
    result: 'review',
    reason,
  };
}

function evaluateRequirement(requirement: CastingRequirement, talent: TalentRecord): RequirementEvaluation {
  const expected = alternatives(requirement.value_text);
  if (expected.length === 0) return review(requirement, 'Requisito sem valor estruturado para comparação automática.');

  let actual: string[] | null = null;

  switch (requirement.requirement_type) {
    case 'category':
      actual = normalizedList([talent.categoria, ...talent.subcategorias]);
      break;
    case 'skill':
      actual = normalizedList(talent.habilidades);
      break;
    case 'specialty':
      actual = normalizedList(talent.especialidades);
      break;
    case 'language':
      actual = normalizedList(talent.idiomas);
      break;
    case 'availability':
      actual = normalizedList(talent.disponibilidades);
      break;
    case 'location':
      actual = normalizedList([talent.cidade, talent.estado, `${talent.cidade} ${talent.estado}`]);
      break;
    case 'age_range':
      return review(requirement, 'O perfil atual do talento não possui idade estruturada para cálculo seguro.');
    case 'profile_attribute':
      return review(requirement, 'Atributos livres de perfil exigem revisão humana nesta versão.');
    case 'other':
      return review(requirement, 'Requisito textual livre exige revisão humana.');
    default:
      return review(requirement, 'Tipo de requisito ainda não suportado pelo motor de matching.');
  }

  const matched = matchesAny(expected, actual);
  return {
    requirement_id: requirement.id,
    type: requirement.requirement_type,
    label: requirement.label,
    required: requirement.is_required,
    weight: requirement.weight,
    result: matched ? 'matched' : 'failed',
    reason: matched
      ? 'Há correspondência objetiva entre o requisito e o perfil estruturado do talento.'
      : 'Não foi encontrada correspondência objetiva no perfil estruturado do talento.',
  };
}

export function matchTalent(requirements: CastingRequirement[], talent: TalentRecord): TalentMatchResult {
  const evaluations = requirements.map((requirement) => evaluateRequirement(requirement, talent));
  const matched = evaluations.filter((item) => item.result === 'matched');
  const failed = evaluations.filter((item) => item.result === 'failed');
  const needsReview = evaluations.filter((item) => item.result === 'review');

  const calculable = evaluations.filter((item) => item.result !== 'review');
  const calculableWeight = calculable.reduce((total, item) => total + Math.max(0, item.weight), 0);
  const matchedWeight = matched.reduce((total, item) => total + Math.max(0, item.weight), 0);
  const score = calculableWeight > 0 ? Math.round((matchedWeight / calculableWeight) * 10000) / 100 : 0;

  const hasRequiredFailure = failed.some((item) => item.required);
  const hasRequiredReview = needsReview.some((item) => item.required);
  const eligibility: MatchEligibility = hasRequiredFailure ? 'ineligible' : hasRequiredReview || calculableWeight === 0 ? 'review' : 'eligible';

  const summary = hasRequiredFailure
    ? 'Inelegível: ao menos um requisito obrigatório calculável não foi atendido.'
    : hasRequiredReview
      ? 'Revisão necessária: existe requisito obrigatório que não pode ser calculado com segurança.'
      : calculableWeight === 0
        ? 'Revisão necessária: não há requisitos calculáveis suficientes para gerar recomendação automática.'
        : `Compatibilidade calculada em ${score}% usando somente requisitos estruturados e verificáveis.`;

  return {
    talent_id: talent.id,
    match_score: score,
    eligibility_status: eligibility,
    matched_requirements: matched,
    failed_requirements: failed,
    review_requirements: needsReview,
    score_explanation: {
      calculable_weight: calculableWeight,
      matched_weight: matchedWeight,
      calculable_requirements: calculable.length,
      review_requirements: needsReview.length,
      summary,
    },
  };
}
