import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Balloons & Bliss SG',
  description: 'Mobile-first balloon decoration booking for celebrations in Singapore.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-SG">
      <body>{children}</body>
    </html>
  );
}
