import type { Metadata } from "next";
import { AppLayout } from "@/src/components/AppLayout";

// default: título de /dashboard; template: aplicado às subpáginas (Financeiro, Contratos, Frota)
export const metadata: Metadata = {
  title: { default: "Visão geral", template: "%s · Órion Cash" },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
