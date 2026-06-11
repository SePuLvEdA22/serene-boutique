'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <>
      {!isAdmin && <Header />}
      <main id="main-content" className="flex-1 pt-6">{children}</main>
      {!isAdmin && <Footer />}
    </>
  );
}
