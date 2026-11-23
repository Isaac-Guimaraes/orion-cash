// Classes Tailwind reutilizadas. O anel de foco segue o docs/usabilidade.md (WCAG 2.4.7).

export const foco =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orion-primary focus-visible:ring-offset-2 focus-visible:ring-offset-orion-card";

export const classeCampo =
  "w-full bg-orion-bg border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm placeholder:text-slate-400 " +
  "focus:outline-none focus:border-orion-primary focus:ring-2 focus:ring-orion-primary/40 " +
  "disabled:opacity-60 disabled:cursor-not-allowed aria-[invalid=true]:border-rose-400 [color-scheme:dark]";

export const classeRotulo = "block text-sm font-medium text-slate-300 mb-1.5";

export const classeBotaoPrimario =
  "inline-flex items-center justify-center gap-2 min-h-11 px-5 py-2.5 rounded-lg bg-orion-primary hover:bg-orion-primary-hover " +
  "text-black font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed " + foco;

export const classeBotaoSecundario =
  "inline-flex items-center justify-center gap-2 min-h-11 px-5 py-2.5 rounded-lg border border-slate-600 bg-orion-bg " +
  "hover:bg-slate-800 text-slate-200 font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed " + foco;

export const classeBotaoPerigo =
  "inline-flex items-center justify-center gap-2 min-h-11 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 " +
  "text-white font-bold text-sm transition-colors disabled:opacity-60 " + foco;

export const classeBotaoIcone =
  "inline-flex items-center justify-center min-w-10 min-h-10 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors " + foco;

export const classeCartao = "bg-orion-card rounded-2xl border border-slate-700/50 shadow-lg";
