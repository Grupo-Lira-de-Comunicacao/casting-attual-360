import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://casting360.grupolira.com'),
  applicationName: 'Casting Attual 360',
  title: {
    default: 'Casting Attual 360 | Talentos, campanhas e mídia regional',
    template: '%s | Casting Attual 360',
  },
  description:
    'Casting Attual 360 conecta marcas, talentos, audiovisual e mídia regional com curadoria estratégica no Vale do Paraíba.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Casting Attual 360',
    title: 'Casting Attual 360 | Talentos, campanhas e mídia regional',
    description:
      'Curadoria estratégica para conectar marcas a talentos, audiovisual e presença regional no Vale do Paraíba.',
  },
  twitter: {
    card: 'summary',
    title: 'Casting Attual 360',
    description:
      'Talentos, campanhas, audiovisual e mídia regional com curadoria estratégica.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
