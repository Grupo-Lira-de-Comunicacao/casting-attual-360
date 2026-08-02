import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/admin';
import { getAdminProduction } from '@/lib/productions/queries';
import { createCastingCall } from '../actions';

export default async function NewCastingCallPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  await requireAdminPage(`/admin/producoes/${id}/convocacoes/nova`);
  const { error } = await searchParams;
  const { production } = await getAdminProduction(id);

  if (!production) notFound();

  const action = createCastingCall.bind(null, id);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <Link href={`/admin/producoes/${id}/convocacoes`} className="text-sm text-slate-500 hover:text-slate-900">
          ← Voltar para convocações
        </Link>
        <h1 className="mt-2 text-3xl font-semibold">Nova convocação</h1>
        <p className="mt-1 text-slate-600">{production.name}</p>
      </div>

      {error ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Não foi possível salvar a convocação. Revise os campos obrigatórios e tente novamente.
        </div>
      ) : null}

      <form action={action} className="space-y-8 rounded-xl border bg-white p-6">
        <section className="grid gap-5 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-medium">Título da convocação *</span>
            <input name="title" required minLength={2} maxLength={160} className="w-full rounded-lg border px-3 py-2" placeholder="Ex.: Elenco para campanha institucional" />
          </label>

          <label>
            <span className="mb-1 block text-sm font-medium">Função / perfil procurado *</span>
            <input name="role_name" required minLength={2} maxLength={160} className="w-full rounded-lg border px-3 py-2" placeholder="Ex.: Atriz, apresentador, modelo" />
          </label>

          <label>
            <span className="mb-1 block text-sm font-medium">Quantidade de vagas *</span>
            <input name="quantity" type="number" required min={1} defaultValue={1} className="w-full rounded-lg border px-3 py-2" />
          </label>

          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-medium">Descrição</span>
            <textarea name="description" rows={5} className="w-full rounded-lg border px-3 py-2" placeholder="Contexto, perfil, responsabilidades e observações da seleção." />
          </label>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-medium">Prazo de candidatura</span>
            <input name="application_deadline" type="datetime-local" className="w-full rounded-lg border px-3 py-2" />
          </label>

          <label>
            <span className="mb-1 block text-sm font-medium">Início do trabalho</span>
            <input name="work_starts_at" type="datetime-local" className="w-full rounded-lg border px-3 py-2" />
          </label>

          <label>
            <span className="mb-1 block text-sm font-medium">Fim do trabalho</span>
            <input name="work_ends_at" type="datetime-local" className="w-full rounded-lg border px-3 py-2" />
          </label>

          <label className="flex items-center gap-2 pt-7 text-sm font-medium">
            <input name="is_remote" type="checkbox" />
            Trabalho remoto
          </label>

          <label>
            <span className="mb-1 block text-sm font-medium">Cidade</span>
            <input name="city" className="w-full rounded-lg border px-3 py-2" />
          </label>

          <label>
            <span className="mb-1 block text-sm font-medium">UF</span>
            <input name="state" maxLength={2} className="w-full rounded-lg border px-3 py-2 uppercase" placeholder="SP" />
          </label>

          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-medium">Local</span>
            <input name="venue" className="w-full rounded-lg border px-3 py-2" placeholder="Estúdio, endereço ou ponto de encontro" />
          </label>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-medium">Cachê / remuneração (R$)</span>
            <input name="compensation_amount" inputMode="decimal" className="w-full rounded-lg border px-3 py-2" placeholder="0,00" />
          </label>

          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-medium">Observações sobre remuneração</span>
            <textarea name="compensation_notes" rows={3} className="w-full rounded-lg border px-3 py-2" placeholder="Ajuda de custo, permuta, direitos de imagem, forma de pagamento etc." />
          </label>

          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-medium">Notas internas</span>
            <textarea name="internal_notes" rows={3} className="w-full rounded-lg border px-3 py-2" />
          </label>
        </section>

        <div className="flex flex-wrap justify-end gap-3 border-t pt-6">
          <Link href={`/admin/producoes/${id}/convocacoes`} className="rounded-lg border px-4 py-2 text-sm font-medium">
            Cancelar
          </Link>
          <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Salvar rascunho
          </button>
        </div>
      </form>
    </main>
  );
}
