import { redirect } from 'next/navigation';
import { SiteShell } from '@/components/site-shell';
import { createClient } from '@/lib/supabase/server';
import { signInAdmin } from './actions';

export const dynamic = 'force-dynamic';

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  missing: 'Informe email e senha para acessar a área administrativa.',
  invalid: 'Email ou senha inválidos. Verifique os dados e tente novamente.',
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(params.next?.startsWith('/admin') && !params.next.startsWith('/admin/login') ? params.next : '/admin');
  }

  return (
    <SiteShell>
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_.85fr] lg:items-center">
        <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-navy via-blue to-teal p-8 text-white shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Área administrativa</p>
          <h1 className="mt-4 text-4xl font-black leading-tight">Acesso protegido do Casting Attual 360</h1>
          <p className="mt-4 max-w-2xl text-white/80">
            Entre com uma conta autorizada no Supabase Auth para visualizar solicitações reais recebidas pela tabela
            public.requests.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-white/80 sm:grid-cols-3">
            <span className="rounded-2xl border border-white/15 bg-white/10 p-4">Sessão via cookies SSR</span>
            <span className="rounded-2xl border border-white/15 bg-white/10 p-4">Sem service_role no navegador</span>
            <span className="rounded-2xl border border-white/15 bg-white/10 p-4">Dados reais do Supabase</span>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-8 text-navy shadow-soft">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue">Login</p>
            <h2 className="mt-2 text-2xl font-black">Entrar no painel</h2>
          </div>

          {params.error && (
            <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errorMessages[params.error] ?? errorMessages.invalid}
            </p>
          )}

          <form action={signInAdmin} className="mt-6 grid gap-4">
            <input type="hidden" name="next" value={params.next ?? '/admin'} />
            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-700">Email</span>
              <input
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-navy caret-blue outline-none placeholder:text-slate-400 transition focus:border-teal focus:ring-2 focus:ring-teal/25"
                name="email"
                type="email"
                placeholder="admin@attual.com.br"
                required
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-700">Senha</span>
              <input
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-navy caret-blue outline-none placeholder:text-slate-400 transition focus:border-teal focus:ring-2 focus:ring-teal/25"
                name="password"
                type="password"
                placeholder="Sua senha"
                required
              />
            </label>
            <button className="rounded-full bg-navy px-6 py-3 font-semibold text-white transition hover:bg-blue">
              Acessar painel
            </button>
          </form>
        </section>
      </div>
    </SiteShell>
  );
}
