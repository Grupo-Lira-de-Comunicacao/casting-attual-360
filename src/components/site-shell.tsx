'use client';

import Link from 'next/link';
import { useState } from 'react';

const navigation = [
  { href: '/', label: 'Home' },
  { href: '/talentos', label: 'Talentos' },
  { href: '/pacotes', label: 'Soluções' },
  { href: '/empresas', label: 'Para empresas' },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-hidden bg-[#041628] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#041628]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setMenuOpen(false)}>
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-blue via-teal to-gold text-base font-black text-white shadow-[0_0_28px_rgba(25,199,197,0.32)]">
              <span className="tracking-[-.08em]">CA</span>
              <span className="absolute bottom-1 right-1 rounded bg-[#041628]/75 px-1 text-[7px] tracking-normal">360</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-black text-white">Casting Attual 360</p>
              <p className="truncate text-xs text-slate-400">Talentos, campanhas e mídia regional.</p>
            </div>
          </Link>

          <nav aria-label="Navegação principal" className="hidden items-center gap-6 text-sm font-semibold text-slate-300 lg:flex">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-teal">
                {item.label}
              </Link>
            ))}
            <Link href="/talentos/cadastrar" className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-white transition hover:border-teal/50 hover:bg-teal/10">
              Quero participar
            </Link>
            <Link href="/empresas" className="rounded-full bg-gradient-to-r from-blue to-teal px-5 py-2.5 text-white shadow-[0_10px_28px_-14px_#19c7c5] transition hover:brightness-110">
              Criar campanha
            </Link>
          </nav>

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMenuOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-xl lg:hidden"
          >
            {menuOpen ? '×' : '☰'}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 bg-[#031522] px-5 py-5 lg:hidden">
            <nav className="mx-auto grid max-w-7xl gap-2" aria-label="Navegação mobile">
              {navigation.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 font-semibold text-slate-200 transition hover:bg-white/10">
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Link href="/talentos/cadastrar" onClick={() => setMenuOpen(false)} className="rounded-full border border-white/15 px-5 py-3 text-center font-bold">
                  Quero participar
                </Link>
                <Link href="/empresas" onClick={() => setMenuOpen(false)} className="rounded-full bg-gradient-to-r from-blue to-teal px-5 py-3 text-center font-bold">
                  Criar campanha
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10 lg:px-8">{children}</main>

      <footer className="border-t border-white/10 bg-[#03111f]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 text-sm text-slate-400 md:grid-cols-[1.2fr_.8fr_.8fr] lg:px-8">
          <div>
            <p className="text-lg font-black text-white">Casting Attual 360</p>
            <p className="mt-3 max-w-md leading-6">Uma iniciativa do Grupo Lira de Comunicação para conectar talentos, marcas, audiovisual e presença regional no Vale do Paraíba.</p>
          </div>
          <div>
            <p className="font-bold text-white">Plataforma</p>
            <div className="mt-3 grid gap-2">
              <Link href="/talentos" className="hover:text-teal">Explorar talentos</Link>
              <Link href="/pacotes" className="hover:text-teal">Conhecer soluções</Link>
              <Link href="/empresas" className="hover:text-teal">Solicitar curadoria</Link>
            </div>
          </div>
          <div>
            <p className="font-bold text-white">Institucional</p>
            <div className="mt-3 grid gap-2">
              <span>TV Attual • Grupo Lira</span>
              <span>Caçapava • Vale do Paraíba</span>
              <span>© 2026 Todos os direitos reservados.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
