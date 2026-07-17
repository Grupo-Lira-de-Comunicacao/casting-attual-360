export type Talent = {
  slug: string;
  name: string;
  role: string;
  location: string;
  specialty: string;
  description: string;
  availability: string;
  highlight: string;
  category: string;
  image: string;
};

export type Package = {
  slug: string;
  name: string;
  audience: string;
  benefits: string[];
  price: string;
};

// DEMONSTRAÇÃO: todos os registros abaixo são fictícios e existem apenas
// para validar a experiência da Fase 1 até a integração com o Supabase.

export const demoTalents: Talent[] = [
  {
    slug: 'maria-silva',
    name: 'Maria Silva',
    role: 'Apresentadora e influenciadora',
    location: 'Recife, PE',
    specialty: 'Moda e lifestyle',
    description: 'Apresentadora com forte presença em eventos regionais e conteúdo premium para marcas que buscam conexão emocional.',
    availability: 'Disponível para campanhas mensais',
    highlight: 'Top 1 de alcance regional',
    category: 'Apresentação',
    image: '/talentos/maria-silva.png',
  },
  {
    slug: 'joao-pereira',
    name: 'João Pereira',
    role: 'Roterista e produtor de vídeo',
    location: 'Salvador, BA',
    specialty: 'Conteúdo digital e cinema',
    description: 'Produtor com visão estratégica para campanhas de publicidade, storytelling e vídeos institucionais.',
    availability: 'Aberto para projetos de curto prazo',
    highlight: 'Especialista em narrativa visual',
    category: 'Produção',
    image: '/talentos/joao-pereira.png',
  },
  {
    slug: 'ana-lima',
    name: 'Ana Lima',
    role: 'Modelo e embaixadora',
    location: 'Fortaleza, CE',
    specialty: 'Moda, beleza e eventos',
    description: 'Perfil versátil para campanhas de marca, eventos e presença em mídias sociais com alto engajamento.',
    availability: 'Disponível para lançamentos e campanhas',
    highlight: 'Presença regional forte',
    category: 'Modelo',
    image: '/talentos/ana-lima.png',
  },
];

export const demoPackages: Package[] = [
  {
    slug: 'essencia',
    name: 'Essência',
    audience: 'Marcas que querem presença regional com estratégia enxuta',
    benefits: ['Seleção de 3 talentos', 'Briefing estratégico', 'Acompanhamento de campanha'],
    price: 'a partir de R$ 8.500',
  },
  {
    slug: 'impacto',
    name: 'Impacto',
    audience: 'Campanhas com foco em alcance e ativação',
    benefits: ['Seleção curada', 'Gestão de contratação', 'Relatórios de desempenho'],
    price: 'a partir de R$ 15.000',
  },
  {
    slug: 'premium',
    name: 'Premium',
    audience: 'Projetos de alto valor com comunicação integrada',
    benefits: ['Equipe dedicada', 'Estratégia de mídia', 'Atendimento VIP'],
    price: 'Sob consulta',
  },
];

export const adminMetrics = {
  leads: 24,
  activeProjects: 8,
  registeredTalents: 36,
  campaignStatus: 'Em crescimento',
};
