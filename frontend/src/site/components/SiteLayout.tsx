import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CinematicBackground } from './CinematicBackground';

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen text-white">
      <CinematicBackground />
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
      <Footer />
    </div>
  );
}
