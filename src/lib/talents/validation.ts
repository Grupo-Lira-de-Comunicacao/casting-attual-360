import type { TalentInput } from '@/types/talent';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const instagramPattern = /^@?[a-zA-Z0-9._]{1,30}$/;
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? '').trim();
}

function list(formData: FormData, name: string) {
  const seen = new Set<string>();
  return text(formData, name)
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => {
      if (!item) return false;
      const key = item.toLocaleLowerCase('pt-BR');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function parseTalentInput(formData: FormData): TalentInput {
  const categoria = text(formData, 'categoria');
  return {
    slug: text(formData, 'slug').toLowerCase(),
    nome: text(formData, 'nome'),
    nome_artistico: text(formData, 'nome_artistico'),
    categoria,
    subcategorias: list(formData, 'subcategorias').filter(
      (item) => item.toLocaleLowerCase('pt-BR') !== categoria.toLocaleLowerCase('pt-BR'),
    ),
    especialidades: list(formData, 'especialidades'),
    habilidades: list(formData, 'habilidades'),
    idiomas: list(formData, 'idiomas'),
    disponibilidades: list(formData, 'disponibilidades'),
    cidade: text(formData, 'cidade'),
    estado: text(formData, 'estado').toUpperCase(),
    biografia: text(formData, 'biografia'),
    foto_url: text(formData, 'foto_url'),
    instagram: text(formData, 'instagram'),
    telefone: text(formData, 'telefone'),
    email: text(formData, 'email').toLowerCase(),
    destaque_texto: text(formData, 'destaque_texto'),
    destaque: formData.get('destaque') === 'on',
    ativo: formData.get('ativo') === 'on',
    ordem: Number(text(formData, 'ordem') || 0),
  };
}

function invalidList(items: string[], maxItems: number, maxLength: number) {
  return items.length > maxItems || items.some((item) => item.length > maxLength);
}

export function validateTalentInput(input: TalentInput): string | null {
  if (!slugPattern.test(input.slug) || input.slug.length > 120) return 'Use um slug com até 120 caracteres, apenas letras minúsculas, números e hífens.';
  if (input.nome.length < 2 || input.nome.length > 160) return 'O nome deve ter entre 2 e 160 caracteres.';
  if (input.nome_artistico.length > 160) return 'O nome artístico deve ter até 160 caracteres.';
  if (input.categoria.length < 2 || input.categoria.length > 100) return 'A categoria principal deve ter entre 2 e 100 caracteres.';
  if (invalidList(input.subcategorias, 20, 100)) return 'Informe no máximo 20 categorias adicionais, com até 100 caracteres cada.';
  if (invalidList(input.especialidades, 30, 120)) return 'Informe no máximo 30 especialidades, com até 120 caracteres cada.';
  if (invalidList(input.habilidades, 30, 120)) return 'Informe no máximo 30 habilidades, com até 120 caracteres cada.';
  if (invalidList(input.idiomas, 15, 80)) return 'Informe no máximo 15 idiomas, com até 80 caracteres cada.';
  if (invalidList(input.disponibilidades, 20, 100)) return 'Informe no máximo 20 opções de disponibilidade, com até 100 caracteres cada.';
  if (input.cidade.length < 2 || input.cidade.length > 120) return 'A cidade deve ter entre 2 e 120 caracteres.';
  if (!/^[A-Z]{2}$/.test(input.estado)) return 'Use a sigla do estado com duas letras.';
  if (input.biografia.length < 20 || input.biografia.length > 5000) return 'A biografia deve ter entre 20 e 5.000 caracteres.';
  if (input.foto_url && !input.foto_url.startsWith('/')) return 'A foto legada deve usar um caminho local iniciado por /.';
  if (input.instagram && !instagramPattern.test(input.instagram)) return 'Informe um usuário válido do Instagram.';
  if (input.telefone.length > 30) return 'O telefone deve ter até 30 caracteres.';
  if (input.email && (input.email.length > 180 || !emailPattern.test(input.email))) return 'Informe um e-mail válido.';
  if (input.destaque_texto.length > 160) return 'O texto de destaque deve ter até 160 caracteres.';
  if (!Number.isInteger(input.ordem) || input.ordem < 0 || input.ordem > 9999) return 'A ordem deve ser um número inteiro entre 0 e 9.999.';
  return null;
}

export function validatePhoto(file: File): string | null {
  if (file.size === 0) return null;
  if (!allowedImageTypes.has(file.type)) return 'A foto deve estar em JPEG, PNG ou WebP.';
  if (file.size > 5 * 1024 * 1024) return 'A foto deve ter no máximo 5 MB.';
  return null;
}

export function photoExtension(file: File) {
  const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  return extensions[file.type];
}
