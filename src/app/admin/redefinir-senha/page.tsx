import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SiteShell } from '@/components/site-shell';
import { createClient } from '@/lib/supabase/server';
import { updateAdminPassword } from './actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Redefinir senha | Casting Attual 360',
  robots: {
    index: false,
    follow: false,
  },
};

const ADMIN_EMAIL = 'splira@gmail.com';

const errorMessages: Record<string, string> = {
  missing: 'Preencha a nova senha e a confirmação.',
  mismatch: 'As duas senhas não conferem.',
  weak: 'Use uma senha com pelo menos 10 caracteres.',
  update: 'Não foi possível atualizar a senha. Solicite um novo link e tente novamente.',
};

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function ResetAdminPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
    redirect('/admin/login?reset=expired');
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-xl">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 text-navy shadow-soft sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue">Recuperação de acesso</p>
          <h1 className="mt-3 text-3xl font-black">Defina uma nova senha</h1>
          <p className="mt-3 leading-7 text-slate-600">
            O link foi validado para <strong>{ADMIN_EMAIL}</strong>. Escolha uma nova senha para o painel administrativo.
          </p>

          {params.error && (
            <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errorMessages[params.error] ?? errorMessages.update}
            </p>
          )}

          <form action={updateAdminPassword} className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-700">Nova senha</span>
              <input
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-navy caret-blue outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/25"
                name="password"
                type="password"
                minLength={10}
                autoComplete="new-password"
                placeholder="Pelo menos 10 caracteres"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-700">Confirmar nova senha</span>
              <input
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-navy caret-blue outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/25"
                name="confirmPassword"
                type="password"
                minLength={10}
                autoComplete="new-password"
                placeholder="Digite novamente"
                required
              />
            </label>

            <button className="rounded-full bg-navy px-6 py-3 font-semibold text-white transition hover:bg-blue">
              Salvar nova senha
            </button>
          </form>

          <p className="mt-5 text-sm leading-6 text-slate-500">
            Depois de salvar, sua sessão será encerrada e você entrará novamente usando a nova senha.
          </p>
        </section>
      </div>
    </SiteShell>
  );
}
