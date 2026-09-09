import { SiteShell } from '@/components/site-shell';

export default function TermsPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-4xl rounded-[28px] border border-slate-200 bg-white p-8 text-navy shadow-soft sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue">Termos de uso</p>
        <h1 className="mt-3 text-3xl font-black">Termos de Uso do Casting Attual 360</h1>
        <p className="mt-4 leading-7 text-slate-600">Última atualização: 9 de setembro de 2026.</p>

        <div className="mt-8 space-y-7 leading-7 text-slate-700">
          <section><h2 className="text-xl font-black text-navy">1. Finalidade da plataforma</h2><p className="mt-2">O Casting Attual 360 conecta talentos, marcas, produtoras, campanhas e projetos de mídia. O cadastro ou envio de briefing não garante contratação, seleção, publicação ou participação em campanha.</p></section>
          <section><h2 className="text-xl font-black text-navy">2. Responsabilidade pelas informações</h2><p className="mt-2">Talentos e empresas são responsáveis pela veracidade, atualidade e legitimidade das informações e materiais que enviarem à plataforma.</p></section>
          <section><h2 className="text-xl font-black text-navy">3. Curadoria e seleção</h2><p className="mt-2">O Casting Attual 360 pode realizar curadoria, classificação, contato, solicitação de informações adicionais e análise de compatibilidade entre perfis e oportunidades. A decisão final de contratação pode depender da empresa contratante, da produção ou do próprio talento.</p></section>
          <section><h2 className="text-xl font-black text-navy">4. Imagem, voz e conteúdo</h2><p className="mt-2">O envio de fotos, vídeos, áudios, links ou portfólio permite sua análise interna e apresentação dentro do contexto do casting. Qualquer uso publicitário, comercial ou de campanha deverá observar as autorizações, contratos e condições aplicáveis ao caso.</p></section>
          <section><h2 className="text-xl font-black text-navy">5. Conduta e uso adequado</h2><p className="mt-2">Não é permitido enviar conteúdo ilegal, fraudulento, ofensivo, que viole direitos de terceiros ou que tente comprometer a segurança da plataforma.</p></section>
          <section><h2 className="text-xl font-black text-navy">6. Disponibilidade</h2><p className="mt-2">A plataforma pode passar por atualizações, manutenção, alterações de funcionalidades ou indisponibilidades temporárias sem que isso constitua garantia de serviço ininterrupto.</p></section>
          <section><h2 className="text-xl font-black text-navy">7. Privacidade</h2><p className="mt-2">O tratamento de dados pessoais segue a Política de Privacidade publicada no Casting Attual 360 e a legislação aplicável.</p></section>
          <section><h2 className="text-xl font-black text-navy">8. Alterações</h2><p className="mt-2">Estes termos podem ser atualizados conforme a evolução do projeto, mudanças operacionais ou requisitos legais. A versão vigente permanecerá publicada nesta página.</p></section>
        </div>
      </article>
    </SiteShell>
  );
}
