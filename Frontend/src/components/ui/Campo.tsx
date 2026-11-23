"use client";

import { ReactNode, useId } from "react";
import { classeRotulo } from "@/src/lib/estilos";

export interface PropsDoControle {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

interface CampoProps {
  rotulo: string;
  opcional?: boolean;
  dica?: ReactNode;
  erro?: string | null;
  className?: string;
  /** Recebe id e atributos ARIA para repassar ao input/select. */
  children: (props: PropsDoControle) => ReactNode;
}

/** Rótulo visível ligado ao campo (htmlFor/id), com dica e mensagem de erro anunciadas pelo leitor de tela. */
export function Campo({ rotulo, opcional, dica, erro, className, children }: CampoProps) {
  const id = useId();
  const idDica = `${id}-dica`;
  const idErro = `${id}-erro`;
  const descritores = [dica ? idDica : null, erro ? idErro : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className={classeRotulo}>
        {rotulo}
        {opcional && <span className="font-normal text-slate-400"> (opcional)</span>}
      </label>
      {children({ id, "aria-describedby": descritores, "aria-invalid": erro ? true : undefined })}
      {dica && !erro && (
        <p id={idDica} className="text-xs text-slate-400 mt-1.5">{dica}</p>
      )}
      {erro && (
        <p id={idErro} className="text-sm text-rose-400 mt-1.5">{erro}</p>
      )}
    </div>
  );
}
