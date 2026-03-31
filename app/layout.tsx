import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quote Chaser',
  description: 'Recover more roofing jobs from estimates you already sent.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
