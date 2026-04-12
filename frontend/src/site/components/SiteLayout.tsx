import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
      <Footer />
    </div>
  );
}
