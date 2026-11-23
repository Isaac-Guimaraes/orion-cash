import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // Cada rota define o próprio título ("Financeiro · Órion Cash") no seu layout.tsx
  title: { template: "%s · Órion Cash", default: "Órion Cash" },
  description: "Gestão financeira para empresas de transporte de passageiros: frota, contratos e fluxo de caixa.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-orion-bg text-white antialiased">
        {children}
      </body>
    </html>
  );
}
