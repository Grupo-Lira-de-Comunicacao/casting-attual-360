export function ContactForm({ title, description }: { title: string; description: string }) {
  const fieldClassName =
    'rounded-2xl border border-slate-300 bg-white px-4 py-3 text-navy caret-blue outline-none placeholder:text-slate-400 transition focus:border-teal focus:ring-2 focus:ring-teal/25';

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-soft">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue">Formulário</p>
        <h2 className="text-2xl font-bold text-navy">{title}</h2>
        <p className="text-slate-600">{description}</p>
      </div>

      <form className="mt-8 grid gap-4">
        <input className={fieldClassName} placeholder="Nome" />
        <input className={fieldClassName} type="email" placeholder="Email" />
        <input className={fieldClassName} placeholder="Empresa ou talento" />
        <textarea className={`min-h-28 ${fieldClassName}`} placeholder="Conteúdo da mensagem" />
        <button className="rounded-full bg-navy px-6 py-3 font-semibold text-white transition hover:bg-blue">
          Enviar
        </button>
      </form>
    </section>
  );
}
