import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Casting Attual 360',
  description: 'Casting Attual 360 — talentos, conexões e visibilidade para marcas que querem ampliar sua voz, imagem e alcance.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
