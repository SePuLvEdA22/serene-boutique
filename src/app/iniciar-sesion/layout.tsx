import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description:
    "Accede a tu cuenta de Switch&Tech para gestionar tus pedidos, favoritos y datos personales.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
