import Link from 'next/link';

const navigation = [
  { href: '/', label: 'Home' },
  { href: '/talentos', label: 'Talentos' },
  { href: '/pacotes', label: 'Pacotes' },
  { href: '/empresas', label: 'Empresas' },
  { href: '/talentos/cadastrar', label: 'Cadastrar talento' },
  { href: '/admin', label: 'Admin' },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-navy via-blue to-teal text-lg font-black text-white">
              C
            </div>
            <div>
              <p className="text-base font-black text-navy">Casting Attual 360</p>
              <p className="text-xs text-slate-500">Talentos, conexões e visibilidade.</p>
            </div>
          </Link>
          <nav aria-label="Navegação principal" className="order-3 flex w-full gap-2 overflow-x-auto pb-1 text-sm font-semibold text-slate-700 md:order-none md:w-auto md:gap-5 md:pb-0">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-full px-2 py-1 transition hover:bg-slate-100 hover:text-blue md:px-0 md:hover:bg-transparent">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10 lg:px-8">{children}</main>

      <footer className="border-t border-slate-200 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>© 2026 Casting Attual 360 — base demonstrativa preparada para Supabase.</p>
          <p>Identidade: premium, regional, tecnológica e ligada à comunicação.</p>
        </div>
      </footer>
    </div>
  );
}
