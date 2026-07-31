'use client';

import { useActionState } from 'react';
import { TalentImage } from '@/components/talent-image';
import type { TalentActionState, TalentRecord } from '@/types/talent';

type TalentFormProps = {
  action: (state: TalentActionState, formData: FormData) => Promise<TalentActionState>;
  talent?: TalentRecord;
  currentPhotoUrl?: string | null;
};

const initialState: TalentActionState = { ok: true, message: '' };
const fieldClass = 'rounded-2xl border border-slate-300 bg-white px-4 py-3 text-navy outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20';
const help = <span className="font-normal text-slate-500">Uma opção por linha ou separadas por vírgula.</span>;

export function TalentForm({ action, talent, currentPhotoUrl }: TalentFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const isEditing = Boolean(talent);

  return (
    <form action={formAction} className="grid gap-6">
      {talent && <><input type="hidden" name="id" value={talent.id} /><input type="hidden" name="original_slug" value={talent.slug} /></>}
      {!state.ok && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-700">{state.error}</p>}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">Nome<input className={fieldClass} name="nome" defaultValue={talent?.nome} minLength={2} maxLength={160} required /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Nome artístico<input className={fieldClass} name="nome_artistico" defaultValue={talent?.nome_artistico ?? ''} maxLength={160} /></label>
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_.55fr]">
        <label className="grid gap-2 text-sm font-bold text-slate-700">Slug público<input className={fieldClass} name="slug" defaultValue={talent?.slug} maxLength={120} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /><span className="font-normal text-slate-500">Somente letras minúsculas, números e hífens.</span></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Ordem<input className={fieldClass} name="ordem" type="number" min={0} max={9999} defaultValue={talent?.ordem ?? 0} required /></label>
      </div>

      {isEditing && <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><input className="mt-1 h-4 w-4" type="checkbox" name="confirm_slug_change" /><span><strong>Proteção do endereço público:</strong> marque somente se alterou o slug intencionalmente.</span></label>}

      <section className="grid gap-5 rounded-[24px] border border-blue/20 bg-blue/5 p-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">Categoria principal<input className={fieldClass} name="categoria" defaultValue={talent?.categoria} maxLength={100} placeholder="Apresentadora" required /><span className="font-normal text-slate-500">A atividade principal exibida primeiro no perfil.</span></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Categorias adicionais<textarea className={fieldClass} name="subcategorias" rows={4} defaultValue={talent?.subcategorias?.join('\n')} placeholder={'Influencer\nRepórter\nMestre de cerimônias'} />{help}</label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Especialidades<textarea className={fieldClass} name="especialidades" rows={4} defaultValue={talent?.especialidades?.join('\n')} placeholder={'TV\nPodcast\nEventos\nModa'} />{help}</label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Habilidades<textarea className={fieldClass} name="habilidades" rows={4} defaultValue={talent?.habilidades?.join('\n')} placeholder={'Teleprompter\nImproviso\nEntrevistas'} />{help}</label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Idiomas<textarea className={fieldClass} name="idiomas" rows={3} defaultValue={talent?.idiomas?.join('\n')} placeholder={'Português\nInglês'} />{help}</label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Disponibilidade para trabalhos<textarea className={fieldClass} name="disponibilidades" rows={3} defaultValue={talent?.disponibilidades?.join('\n')} placeholder={'Eventos\nTV\nPublicidade\nPodcast'} />{help}</label>
      </section>

      <div className="grid gap-5 md:grid-cols-[1fr_.35fr]">
        <label className="grid gap-2 text-sm font-bold text-slate-700">Cidade<input className={fieldClass} name="cidade" defaultValue={talent?.cidade} maxLength={120} required /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Estado<input className={fieldClass} name="estado" defaultValue={talent?.estado ?? 'SP'} minLength={2} maxLength={2} required /></label>
      </div>

      <label className="grid gap-2 text-sm font-bold text-slate-700">Biografia<textarea className={fieldClass} name="biografia" rows={7} defaultValue={talent?.biografia} minLength={20} maxLength={5000} required /></label>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-bold text-slate-700">Instagram<input className={fieldClass} name="instagram" defaultValue={talent?.instagram ?? ''} maxLength={31} placeholder="@usuario" /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Telefone<input className={fieldClass} name="telefone" defaultValue={talent?.telefone ?? ''} maxLength={30} /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">E-mail<input className={fieldClass} name="email" type="email" defaultValue={talent?.email ?? ''} maxLength={180} /></label>
      </div>

      <section className="grid gap-5 rounded-[24px] border border-slate-200 bg-slate-50 p-5 md:grid-cols-2">
        {currentPhotoUrl && <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-200 md:col-span-2"><TalentImage src={currentPhotoUrl} alt={`Foto atual de ${talent?.nome ?? 'talento'}`} sizes="(min-width: 768px) 720px, 100vw" /></div>}
        <label className="grid gap-2 text-sm font-bold text-slate-700">Nova foto<input className={fieldClass} name="foto" type="file" accept="image/jpeg,image/png,image/webp" /><span className="font-normal text-slate-500">JPEG, PNG ou WebP, até 5 MB. A foto anterior não será apagada.</span></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Caminho da foto demonstrativa<input className={fieldClass} name="foto_url" defaultValue={talent?.foto_url ?? ''} placeholder="/talentos/perfil.webp" />{talent?.foto_path && <span className="font-normal text-slate-500">Uma foto privada já está associada ao perfil.</span>}</label>
      </section>

      <div className="flex flex-wrap gap-5 rounded-[24px] border border-slate-200 bg-white p-5">
        <label className="flex items-center gap-3 font-bold text-slate-700"><input className="h-5 w-5" name="destaque" type="checkbox" defaultChecked={talent?.destaque} />Exibir como destaque</label>
        <label className="flex items-center gap-3 font-bold text-slate-700"><input className="h-5 w-5" name="ativo" type="checkbox" defaultChecked={talent?.ativo ?? true} />Perfil ativo</label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className="rounded-full bg-navy px-7 py-3 font-bold text-white transition hover:bg-blue disabled:cursor-wait disabled:opacity-60">{pending ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Criar talento'}</button>
        {talent && <a className="font-bold text-blue hover:text-navy" href={`/talentos/${talent.slug}`} target="_blank" rel="noreferrer">Visualizar perfil público ↗</a>}
      </div>
    </form>
  );
}
