import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mi Perfil',
  description:
    'Administra tu perfil en Switch&Tech: edita tu nombre, correo electrónico y cambia tu contraseña.',
};

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  return children;
}
