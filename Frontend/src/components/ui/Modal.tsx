"use client";

import { ReactNode, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { classeBotaoIcone } from "@/src/lib/estilos";

interface ModalProps {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  icone?: ReactNode;
  children: ReactNode;
  largura?: string;
}

/**
 * Modal acessível com o <dialog> nativo + showModal():
 * fecha com Esc, prende o foco, deixa o fundo inerte e devolve o foco ao botão que o abriu.
 */
export function Modal({ aberto, aoFechar, titulo, icone, children, largura = "max-w-lg" }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (aberto && !dialogo.open) dialogo.showModal();
    if (!aberto && dialogo.open) dialogo.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      onClose={aoFechar}
      aria-labelledby={idTitulo}
      className={`m-auto w-[calc(100%-2rem)] ${largura} max-h-[calc(100dvh-2rem)] overflow-y-auto p-0 bg-orion-card text-white border border-slate-700 rounded-2xl shadow-2xl`}
    >
      {aberto && (
        <>
          <div className="px-5 sm:px-6 py-4 border-b border-slate-700 flex justify-between items-center gap-4 bg-orion-bg/50">
            <h2 id={idTitulo} className="text-lg font-bold text-white flex items-center gap-2">
              {icone && <span aria-hidden="true" className="text-orion-primary">{icone}</span>}
              {titulo}
            </h2>
            <button type="button" onClick={aoFechar} className={classeBotaoIcone} aria-label="Fechar">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          {children}
        </>
      )}
    </dialog>
  );
}
