export type TalentRecord = {
  id: string;
  slug: string;
  nome: string;
  nome_artistico: string | null;
  categoria: string;
  subcategorias: string[];
  especialidades: string[];
  habilidades: string[];
  idiomas: string[];
  disponibilidades: string[];
  cidade: string;
  estado: string;
  biografia: string;
  foto_url: string | null;
  foto_path: string | null;
  instagram: string | null;
  telefone: string | null;
  email: string | null;
  destaque: boolean;
  ativo: boolean;
  ordem: number;
  criado_em: string;
  atualizado_em: string;
};

export type PublicTalent = {
  id: string;
  slug: string;
  name: string;
  artisticName: string | null;
  role: string;
  location: string;
  specialty: string;
  description: string;
  availability: string;
  highlight: string;
  category: string;
  categories: string[];
  specialties: string[];
  skills: string[];
  languages: string[];
  availabilityOptions: string[];
  image: string | null;
  gallery: string[];
  instagram: string | null;
  featured: boolean;
  order: number;
  isDemo: boolean;
};

export type TalentInput = {
  slug: string;
  nome: string;
  nome_artistico: string;
  categoria: string;
  subcategorias: string[];
  especialidades: string[];
  habilidades: string[];
  idiomas: string[];
  disponibilidades: string[];
  cidade: string;
  estado: string;
  biografia: string;
  foto_url: string;
  instagram: string;
  telefone: string;
  email: string;
  destaque: boolean;
  ativo: boolean;
  ordem: number;
};

export type TalentActionState =
  | { ok: false; error: string }
  | { ok: true; message: string };
