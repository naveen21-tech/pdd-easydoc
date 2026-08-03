import type { Metadata } from 'next';
import { Inter, Sora, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EasyDoc — AI Document Generation Platform',
  description: 'Instant, professional document generation powered by multi-provider AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-screen bg-surface font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
