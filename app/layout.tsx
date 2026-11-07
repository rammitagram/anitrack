import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ANITRACK — Your Anime Universe',
  description: 'Descubrí, organizá y compartí tu universo anime.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
