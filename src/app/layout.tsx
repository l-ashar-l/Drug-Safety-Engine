import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Drug Safety Engine',
  description: 'Deterministic drug safety checks for clinical AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
