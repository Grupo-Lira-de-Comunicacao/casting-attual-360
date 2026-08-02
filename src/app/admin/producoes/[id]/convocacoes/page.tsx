import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/admin';
import { getAdminProduction } from '@/lib/productions/queries';
import { getCastingCallsByProduction } from '@/lib/casting-calls/queries';

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  open: 'Aberta',
  paused: 'Pausada',
  closed: 'Encerrada',
  cancelled: 'Cancelada',
};

export default async function CastingCallsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/producoes/${id}/convocacoes`);
  const [{ production }, { castingCalls: calls }] = await Promise.all([
    getAdminProduction(id),
    getCastingCallsByProduction(id),
  ]);

  if (!production) notFound();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href={`/admin/producoes/${id}`} className="text-sm text-slate-500 hover:text-slate-900">← Voltar para a produção</Link>
          <h1 className="mt-2 text-3xl font-semibold">Convocações</h1>
          <p className="mt-1 text-slate-600">{production.name}</p>
        </div>
        <Link href={`/admin/producoes/${id}/convocacoes/nova`} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Nova convocação</Link>
      </div>

      {calls.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-slate-600">
          Nenhuma convocação criada para esta produção.
        </div>
      ) : (
        <div className="grid gap-4">
          {calls.map((call) => (
            <Link key={call.id} href={`/admin/producoes/${id}/convocacoes/${call.id}`} className="rounded-xl border bg-white p-5 transition hover:border-slate-400">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{call.title}</h2>
                  <p className="text-sm text-slate-600">{call.role_name} · {call.quantity} vaga{call.quantity === 1 ? '' : 's'}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">{statusLabels[call.status] ?? call.status}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                <span>{call.is_remote ? 'Remoto' : [call.city, call.state].filter(Boolean).join(' / ') || 'Local a definir'}</span>
                <span>{call.application_deadline ? `Inscrições até ${new Date(call.application_deadline).toLocaleDateString('pt-BR')}` : 'Prazo a definir'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
