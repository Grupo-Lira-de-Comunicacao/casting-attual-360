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
    name: 'Marina Silva',
    role: 'Apresentadora e criadora de conteúdo',
    location: 'Caçapava, SP',
    specialty: 'Cultura, eventos e lifestyle',
    description: 'Comunicadora com presença em eventos regionais e conteúdo voltado a marcas que buscam proximidade, credibilidade e conexão com o público local.',
    availability: 'Disponível para campanhas e eventos',
    highlight: 'Conexão com o público regional',
    category: 'Apresentação',
    image: '/talentos/maria-silva.png',
  },
  {
    slug: 'joao-pereira',
    name: 'João Pereira',
    role: 'Videomaker e produtor audiovisual',
    location: 'São José dos Campos, SP',
    specialty: 'Vídeo institucional e conteúdo digital',
    description: 'Produtor com olhar estratégico para campanhas, cobertura de eventos, storytelling e vídeos institucionais para empresas do Vale do Paraíba.',
    availability: 'Aberto para projetos regionais',
    highlight: 'Narrativa visual e produção ágil',
    category: 'Audiovisual',
    image: '/talentos/joao-pereira.png',
  },
  {
    slug: 'ana-lima',
    name: 'Ana Lima',
    role: 'Modelo e embaixadora de marca',
    location: 'Taubaté, SP',
    specialty: 'Moda, beleza e presença em eventos',
    description: 'Perfil versátil para campanhas comerciais, lançamentos, fotografia publicitária e ativações presenciais em toda a região.',
    availability: 'Disponível para lançamentos e campanhas',
    highlight: 'Versatilidade para campanhas locais',
    category: 'Modelo',
    image: '/talentos/ana-lima.png',
  },
];

export const demoPackages: Package[] = [
  {
    slug: 'presenca-local',
    name: 'Presença Local',
    audience: 'Pequenos negócios que querem começar com estratégia e alcance regional',
    benefits: ['Seleção orientada de talento', 'Briefing de campanha', '1 entrega principal de conteúdo'],
    price: 'a partir de R$ 890',
  },
  {
    slug: 'campanha-regional',
    name: 'Campanha Regional',
    audience: 'Empresas que precisam de divulgação integrada e presença em diferentes formatos',
    benefits: ['Curadoria de talentos', 'Produção audiovisual', 'Plano de divulgação regional'],
    price: 'a partir de R$ 2.490',
  },
  {
    slug: 'attual-360',
    name: 'Attual 360',
    audience: 'Projetos especiais com estratégia, conteúdo, mídia e acompanhamento completo',
    benefits: ['Equipe dedicada', 'Conteúdo multiplataforma', 'Gestão e relatório de campanha'],
    price: 'Sob consulta',
  },
];

export const adminMetrics = {
  leads: 24,
  activeProjects: 8,
  registeredTalents: 36,
  campaignStatus: 'Em crescimento',
};
