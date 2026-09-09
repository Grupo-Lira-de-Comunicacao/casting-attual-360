import { SiteShell } from '@/components/site-shell';

export default function PrivacyPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-4xl rounded-[28px] border border-slate-200 bg-white p-8 text-navy shadow-soft sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue">Privacidade e LGPD</p>
        <h1 className="mt-3 text-3xl font-black">Política de Privacidade do Casting Attual 360</h1>
        <p className="mt-4 leading-7 text-slate-600">Última atualização: 9 de setembro de 2026.</p>

        <div className="mt-8 space-y-7 leading-7 text-slate-700">
          <section><h2 className="text-xl font-black text-navy">1. Quem somos</h2><p className="mt-2">O Casting Attual 360 é uma iniciativa do Grupo Lira de Comunicação voltada à conexão entre talentos, marcas, produtoras e projetos de mídia.</p></section>
          <section><h2 className="text-xl font-black text-navy">2. Dados coletados</h2><p className="mt-2">Podemos coletar dados informados voluntariamente em formulários, como nome, e-mail, telefone, cidade, dados profissionais, redes sociais, portfólio, briefing de campanha e demais informações necessárias para avaliar e operar a solicitação.</p></section>
          <section><h2 className="text-xl font-black text-navy">3. Finalidades</h2><p className="mt-2">Os dados podem ser usados para cadastro, análise de perfil, curadoria, contato, formação de casting, criação e gestão de campanhas, convocações, atendimento a empresas, segurança operacional e cumprimento de obrigações legais.</p></section>
          <section><h2 className="text-xl font-black text-navy">4. Base legal e consentimento</h2><p className="mt-2">O tratamento é realizado conforme a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), especialmente com base em consentimento, execução de procedimentos preliminares relacionados a contratação, cumprimento de obrigação legal e legítimo interesse quando aplicável.</p></section>
          <section><h2 className="text-xl font-black text-navy">5. Compartilhamento</h2><p className="mt-2">Os dados podem ser acessados por equipes autorizadas do Grupo Lira de Comunicação e por prestadores de tecnologia necessários à operação da plataforma. Informações de talentos somente serão apresentadas a marcas, produtoras ou parceiros quando isso fizer parte da finalidade do Casting 360 e respeitar os limites legais e contratuais aplicáveis.</p></section>
          <section><h2 className="text-xl font-black text-navy">6. Imagem, voz e material profissional</h2><p className="mt-2">O envio de fotos, vídeos, links ou materiais profissionais não implica autorização irrestrita de uso publicitário. Usos específicos de imagem, voz ou conteúdo poderão exigir autorização adicional, contratação ou instrumento próprio.</p></section>
          <section><h2 className="text-xl font-black text-navy">7. Retenção e segurança</h2><p className="mt-2">Os dados são mantidos pelo período necessário às finalidades informadas, à manutenção do relacionamento e ao cumprimento de obrigações legais, adotando-se medidas razoáveis de segurança compatíveis com a natureza da operação.</p></section>
          <section><h2 className="text-xl font-black text-navy">8. Direitos do titular</h2><p className="mt-2">O titular pode solicitar confirmação de tratamento, acesso, correção, atualização, anonimização, bloqueio, eliminação quando cabível, informação sobre compartilhamento, portabilidade quando aplicável e revogação do consentimento.</p></section>
          <section><h2 className="text-xl font-black text-navy">9. Contato</h2><p className="mt-2">Solicitações relacionadas a privacidade e proteção de dados podem ser encaminhadas pelos canais institucionais do Grupo Lira de Comunicação e da TV Attual, com identificação suficiente para análise do pedido.</p></section>
          <section><h2 className="text-xl font-black text-navy">10. Atualizações</h2><p className="mt-2">Esta política poderá ser atualizada para refletir mudanças legais, tecnológicas ou operacionais. A versão vigente permanecerá publicada nesta página.</p></section>
        </div>
      </article>
    </SiteShell>
  );
}
