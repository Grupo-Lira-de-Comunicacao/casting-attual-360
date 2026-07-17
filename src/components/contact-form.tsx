export function ContactForm({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-soft">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue">Formulário</p>
        <h2 className="text-2xl font-bold text-navy">{title}</h2>
        <p className="text-slate-600">{description}</p>
      </div>

      <form className="mt-8 grid gap-4">
        <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Nome" />
        <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" />
        <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Empresa ou talento" />
        <textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Conteúdo da mensagem" />
        <button className="rounded-full bg-navy px-6 py-3 font-semibold text-white transition hover:bg-blue">
          Enviar
        </button>
      </form>
    </section>
  );
}
