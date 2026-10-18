import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Órion Cash",
  description: "Sistema de Gestão Logística da Órion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#10151f] text-white antialiased">
        {/* Aqui entra o conteúdo da página, sem nenhuma sidebar global! */}
        {children}
      </body>
    </html>
  );
}