-- Seed idempotente dos 16 perfis demonstrativos.
-- Registros existentes nunca sao sobrescritos ou apagados.

insert into public.talents (
  slug, nome, nome_artistico, categoria, subcategorias, cidade, estado,
  biografia, habilidades, foto_url, foto_path, instagram, telefone, email,
  destaque, ativo, ordem
)
values
(
  'maria-silva', 'Maria Silva', null, 'Apresentação',
  array['Cultura, eventos e lifestyle'], 'Caçapava', 'SP',
  'Comunicadora com presença em eventos regionais e conteúdo voltado a marcas que buscam proximidade, credibilidade e conexão com o público local.',
  array['Cultura, eventos e lifestyle', 'Conexão com o público regional', 'Disponível para campanhas e eventos'],
  '/talentos/maria-silva/foto-0.webp', null, null, null, null, true, true, 1
),
(
  'joao-pereira', 'João Pereira', null, 'Audiovisual',
  array['Vídeo institucional e conteúdo digital'], 'São José dos Campos', 'SP',
  'Produtor com olhar estratégico para campanhas, cobertura de eventos, storytelling e vídeos institucionais para empresas do Vale do Paraíba.',
  array['Vídeo institucional e conteúdo digital', 'Narrativa visual e produção ágil', 'Aberto para projetos regionais'],
  '/talentos/joao-pereira/foto-0.webp', null, null, null, null, true, true, 2
),
(
  'ana-lima', 'Ana Lima', null, 'Modelo',
  array['Moda, beleza e presença em eventos'], 'Taubaté', 'SP',
  'Perfil versátil para campanhas comerciais, lançamentos, fotografia publicitária e ativações presenciais em toda a região.',
  array['Moda, beleza e presença em eventos', 'Versatilidade para campanhas locais', 'Disponível para lançamentos e campanhas'],
  '/talentos/ana-lima/foto-0.webp', null, null, null, null, true, true, 3
),
(
  'camila-rocha', 'Camila Rocha', null, 'Influência',
  array['Rotina, bem-estar e negócios locais'], 'Caçapava', 'SP',
  'Criadora de conteúdo com linguagem próxima e foco em experiências, serviços e marcas regionais.',
  array['Rotina, bem-estar e negócios locais', 'Conteúdo espontâneo e conexão local', 'Disponível para campanhas digitais'],
  '/talentos/camila-rocha/perfil.webp', null, null, null, null, false, true, 4
),
(
  'beatriz-nogueira', 'Beatriz Nogueira', null, 'Influência',
  array['Beleza, moda e comportamento'], 'Taubaté', 'SP',
  'Perfil elegante para lançamentos, conteúdo de produto, presença em eventos e campanhas de posicionamento.',
  array['Beleza, moda e comportamento', 'Estética apurada e presença de marca', 'Disponível para collabs e eventos'],
  '/talentos/beatriz-nogueira/perfil.webp', null, null, null, null, false, true, 5
),
(
  'rafael-mendes', 'Rafael Mendes', null, 'Influência',
  array['Tecnologia, inovação e produtividade'], 'São José dos Campos', 'SP',
  'Comunicador digital focado em tornar tecnologia e inovação acessíveis ao público e aos pequenos negócios.',
  array['Tecnologia, inovação e produtividade', 'Didática e credibilidade digital', 'Disponível para reviews e campanhas'],
  '/talentos/rafael-mendes/perfil.webp', null, null, null, null, false, true, 6
),
(
  'juliana-costa', 'Juliana Costa', null, 'Reportagem',
  array['Reportagem comunitária e eventos'], 'Jacareí', 'SP',
  'Repórter com comunicação clara para entrevistas, entradas externas e cobertura de acontecimentos regionais.',
  array['Reportagem comunitária e eventos', 'Agilidade e escuta qualificada', 'Disponível para coberturas e institucionais'],
  '/talentos/juliana-costa/perfil.webp', null, null, null, null, false, true, 7
),
(
  'marcos-vieira', 'Marcos Vieira', null, 'Reportagem',
  array['Notícias locais e entrevistas'], 'Pindamonhangaba', 'SP',
  'Profissional preparado para reportagens externas, entrevistas rápidas e apresentação de conteúdo informativo.',
  array['Notícias locais e entrevistas', 'Postura profissional em campo', 'Disponível para pautas regionais'],
  '/talentos/marcos-vieira/perfil.webp', null, null, null, null, false, true, 8
),
(
  'antonio-ribeiro', 'Antônio Ribeiro', null, 'Locução',
  array['Locução comercial, rádio e eventos'], 'Caçapava', 'SP',
  'Voz madura e versátil para chamadas, institucionais, publicidade, cerimônias e conteúdos radiofônicos.',
  array['Locução comercial, rádio e eventos', 'Voz marcante e interpretação natural', 'Disponível para gravações e eventos'],
  '/talentos/antonio-ribeiro/perfil.webp', null, null, null, null, false, true, 9
),
(
  'debora-santos', 'Débora Santos', null, 'Fotografia',
  array['Retratos, eventos e publicidade'], 'Taubaté', 'SP',
  'Fotógrafa com olhar humano para ensaios, cobertura de eventos, produtos e campanhas de comunicação.',
  array['Retratos, eventos e publicidade', 'Direção sensível e imagem autêntica', 'Disponível para ensaios e eventos'],
  '/talentos/debora-santos/perfil.webp', null, null, null, null, false, true, 10
),
(
  'bruno-almeida', 'Bruno Almeida', null, 'Audiovisual',
  array['Captação multicâmera e externas'], 'São José dos Campos', 'SP',
  'Operador de câmera voltado a entrevistas, eventos, programas, documentários e produções institucionais.',
  array['Captação multicâmera e externas', 'Precisão técnica e olhar de cena', 'Disponível para diárias e projetos'],
  '/talentos/bruno-almeida/perfil.webp', null, null, null, null, false, true, 11
),
(
  'luana-freitas', 'Luana Freitas', null, 'Audiovisual',
  array['Vídeos verticais e campanhas digitais'], 'Jacareí', 'SP',
  'Videomaker especializada em conteúdo ágil para redes sociais, bastidores, marcas e pequenos negócios.',
  array['Vídeos verticais e campanhas digitais', 'Ritmo digital e narrativa contemporânea', 'Disponível para campanhas e recorrência'],
  '/talentos/luana-freitas/perfil.webp', null, null, null, null, false, true, 12
),
(
  'renata-alves', 'Renata Alves', null, 'Jornalismo',
  array['Entrevistas, redação e apresentação'], 'Taubaté', 'SP',
  'Jornalista com experiência demonstrativa em apuração, entrevistas e condução de conteúdos informativos.',
  array['Entrevistas, redação e apresentação', 'Clareza, análise e boa condução', 'Disponível para projetos editoriais'],
  '/talentos/renata-alves/perfil.webp', null, null, null, null, false, true, 13
),
(
  'eduardo-lima', 'Eduardo Lima', null, 'Jornalismo',
  array['Notícias, roteiros e conteúdo institucional'], 'São José dos Campos', 'SP',
  'Profissional focado em pesquisa, redação, entrevistas e transformação de pautas em conteúdo acessível.',
  array['Notícias, roteiros e conteúdo institucional', 'Apuração e síntese editorial', 'Disponível para redação e produção'],
  '/talentos/eduardo-lima/perfil.webp', null, null, null, null, false, true, 14
),
(
  'vanessa-martins', 'Vanessa Martins', null, 'Dança',
  array['Dança contemporânea e expressão corporal'], 'Caçapava', 'SP',
  'Professora com abordagem acolhedora para aulas, oficinas, eventos, coreografias e projetos culturais.',
  array['Dança contemporânea e expressão corporal', 'Expressão, energia e didática', 'Disponível para aulas e eventos'],
  '/talentos/vanessa-martins/perfil.webp', null, null, null, null, false, true, 15
),
(
  'diego-souza', 'Diego Souza', null, 'Dança',
  array['Danças urbanas e performance'], 'Pindamonhangaba', 'SP',
  'Professor e coreógrafo para oficinas, apresentações, videoclipes, eventos e preparação de elenco.',
  array['Danças urbanas e performance', 'Performance e criação coreográfica', 'Disponível para oficinas e produções'],
  '/talentos/diego-souza/perfil.webp', null, null, null, null, false, true, 16
)
on conflict (slug) do nothing;

