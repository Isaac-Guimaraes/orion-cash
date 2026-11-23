import { ReactNode } from "react";

// Moldura comum do login e da redefinição de senha (fundo, cartão e logotipo).
export function TelaAutenticacao({ titulo, children }: { titulo: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#090E17] flex items-center justify-center relative overflow-hidden px-4 py-8">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orion-primary/20 rounded-full blur-[120px]" />
      </div>
      <div className="absolute inset-0 z-0 pointer-events-none select-none" aria-hidden="true">
        <img src="/fundo-login.png" alt="" className="w-full h-full object-cover opacity-30 mix-blend-overlay contrast-125" />
        <div className="absolute inset-0 bg-[#090E17]/40 mix-blend-multiply" />
      </div>

      <main className="z-10 w-full max-w-[400px] p-6 sm:p-10 bg-orion-panel/80 backdrop-blur-xl rounded-3xl border border-slate-700/60 shadow-2xl relative">
        <div className="flex flex-col items-center justify-center mb-8">
          <img src="/logo.png" alt="" className="h-20 sm:h-24 w-auto object-contain drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]" />
          <h1 className="text-white font-bold tracking-widest mt-4 text-center leading-tight">{titulo}</h1>
        </div>
        {children}
      </main>
    </div>
  );
}

export const classeCampoAutenticacao =
  "w-full bg-orion-deep/80 border-2 border-slate-600 text-white rounded-xl px-5 py-3.5 " +
  "focus:outline-none focus:border-orion-primary focus:ring-2 focus:ring-orion-primary/40 transition-colors disabled:opacity-50";

export const classeRotuloAutenticacao = "block text-orion-primary font-bold tracking-wide text-sm mb-2";

export const classeBotaoAutenticacao =
  "w-full min-h-12 bg-orion-primary hover:bg-orion-primary-hover text-black font-extrabold uppercase tracking-widest rounded-xl px-4 py-4 " +
  "flex items-center justify-center gap-3 transition-colors disabled:opacity-60 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orion-primary focus-visible:ring-offset-2 focus-visible:ring-offset-orion-panel";
