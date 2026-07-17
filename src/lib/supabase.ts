// Preparado para integração futura com Supabase.
// Substituir por dados reais quando a base estiver criada.

export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
};

export function getSupabaseStatus() {
  return 'Configuração inicial pronta para Supabase';
}
