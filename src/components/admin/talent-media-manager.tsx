import { addTalentPhotos, addTalentVideo, removeTalentMedia } from '@/app/admin/talentos/actions';
import { TalentImage } from '@/components/talent-image';
import type { AdminTalentMedia } from '@/types/talent';

type Props = {
  talentId: string;
  slug: string;
  media: AdminTalentMedia[];
};

const fieldClass = 'rounded-2xl border border-slate-300 bg-white px-4 py-3 text-navy outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20';

export function TalentMediaManager({ talentId, slug, media }: Props) {
  const photos = media.filter((item) => item.kind === 'photo');
  const videos = media.filter((item) => item.kind === 'video');

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 text-navy shadow-soft sm:p-8">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.25em] text-blue">Portfólio do talento</p>
        <h2 className="mt-2 text-3xl font-black">Galeria de fotos e vídeos</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          A foto principal continua sendo a capa do perfil. Aqui você adiciona fotos extras para a galeria e vídeos de apresentação.
        </p>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <form action={addTalentPhotos} className="rounded-[24px] border border-blue/15 bg-blue/5 p-5">
          <input type="hidden" name="talent_id" value={talentId} />
          <input type="hidden" name="slug" value={slug} />
          <h3 className="text-xl font-black">Adicionar fotos</h3>
          <p className="mt-2 text-sm text-slate-600">Selecione até 8 fotos por vez. O perfil aceita até 12 fotos adicionais.</p>
          <label className="mt-5 grid gap-2 text-sm font-bold text-slate-700">
            Fotos da galeria
            <input className={fieldClass} name="gallery_photos" type="file" accept="image/jpeg,image/png,image/webp" multiple required />
            <span className="font-normal text-slate-500">JPEG, PNG ou WebP, até 5 MB por foto.</span>
          </label>
          <button className="mt-5 rounded-full bg-navy px-6 py-3 font-bold text-white transition hover:bg-blue">Enviar fotos</button>
        </form>

        <form action={addTalentVideo} className="rounded-[24px] border border-teal/20 bg-teal/5 p-5">
          <input type="hidden" name="talent_id" value={talentId} />
          <input type="hidden" name="slug" value={slug} />
          <h3 className="text-xl font-black">Adicionar vídeo</h3>
          <p className="mt-2 text-sm text-slate-600">Use YouTube, Vimeo ou link direto HTTPS para MP4/WebM/OGG. Até 6 vídeos por perfil.</p>
          <label className="mt-5 grid gap-2 text-sm font-bold text-slate-700">
            Título do vídeo
            <input className={fieldClass} name="video_title" maxLength={160} placeholder="Apresentação profissional" />
          </label>
          <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
            Link do vídeo
            <input className={fieldClass} name="video_url" type="url" required placeholder="https://www.youtube.com/watch?v=..." />
          </label>
          <button className="mt-5 rounded-full bg-teal px-6 py-3 font-bold text-navy transition hover:brightness-105">Adicionar vídeo</button>
        </form>
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-black">Fotos adicionais <span className="text-slate-400">({photos.length})</span></h3>
        </div>
        {photos.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-slate-300 px-5 py-6 text-sm text-slate-500">Nenhuma foto adicional cadastrada.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {photos.map((item, index) => (
              <div key={item.id} className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50">
                <div className="relative aspect-[4/5] bg-slate-200">
                  <TalentImage src={item.previewUrl} alt={`Foto adicional ${index + 1}`} sizes="(min-width: 1024px) 220px, 50vw" />
                </div>
                <form action={removeTalentMedia} className="p-3">
                  <input type="hidden" name="talent_id" value={talentId} />
                  <input type="hidden" name="media_id" value={item.id} />
                  <input type="hidden" name="slug" value={slug} />
                  <button className="w-full rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50">Remover do perfil</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-black">Vídeos <span className="text-slate-400">({videos.length})</span></h3>
        {videos.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-slate-300 px-5 py-6 text-sm text-slate-500">Nenhum vídeo cadastrado.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {videos.map((item, index) => (
              <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-black">{item.title || `Vídeo ${index + 1}`}</p>
                  <a className="mt-1 block truncate text-sm font-semibold text-blue hover:underline" href={item.external_url ?? '#'} target="_blank" rel="noreferrer">{item.external_url}</a>
                </div>
                <form action={removeTalentMedia} className="shrink-0">
                  <input type="hidden" name="talent_id" value={talentId} />
                  <input type="hidden" name="media_id" value={item.id} />
                  <input type="hidden" name="slug" value={slug} />
                  <button className="rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50">Remover</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
