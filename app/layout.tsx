import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Human Movement Heatmap Detection',
  description: 'Real-time human movement detection with simulated heat signature overlay',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
