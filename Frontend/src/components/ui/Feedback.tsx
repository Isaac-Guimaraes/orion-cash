"use client";

import { createContext, ReactNode, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { Modal } from "./Modal";
import { classeBotaoIcone, classeBotaoPerigo, classeBotaoPrimario, classeBotaoSecundario } from "@/src/lib/estilos";

type TipoAviso = "sucesso" | "erro";

interface Aviso {
  id: number;
  mensagem: string;
  tipo: TipoAviso;
}

interface OpcoesConfirmacao {
  titulo: string;
  mensagem: ReactNode;
  textoConfirmar?: string;
  perigoso?: boolean;
}

interface FeedbackContexto {
  /** Aviso temporário anunciado pelo leitor de tela (substitui alert()). */
  avisar: (mensagem: string, tipo?: TipoAviso) => void;
  /** Diálogo de confirmação próprio (substitui confirm()). Resolve true se o usuário confirmar. */
  confirmar: (opcoes: OpcoesConfirmacao) => Promise<boolean>;
}

const Contexto = createContext<FeedbackContexto | null>(null);

export function useFeedback() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useFeedback precisa estar dentro de <FeedbackProvider>.");
  return contexto;
}

const DURACAO_AVISO_MS = 6000;

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [confirmacao, setConfirmacao] = useState<OpcoesConfirmacao | null>(null);
  const resolver = useRef<((valor: boolean) => void) | null>(null);
  const proximoId = useRef(1);

  const remover = useCallback((id: number) => {
    setAvisos(atuais => atuais.filter(a => a.id !== id));
  }, []);

  const avisar = useCallback((mensagem: string, tipo: TipoAviso = "sucesso") => {
    const id = proximoId.current++;
    setAvisos(atuais => [...atuais, { id, mensagem, tipo }]);
    setTimeout(() => remover(id), DURACAO_AVISO_MS);
  }, [remover]);

  const confirmar = useCallback((opcoes: OpcoesConfirmacao) => {
    setConfirmacao(opcoes);
    return new Promise<boolean>(resolve => { resolver.current = resolve; });
  }, []);

  const responder = (valor: boolean) => {
    resolver.current?.(valor);
    resolver.current = null;
    setConfirmacao(null);
  };

  return (
    <Contexto.Provider value={{ avisar, confirmar }}>
      {children}

      {/* Região viva: o leitor de tela anuncia cada aviso que aparece aqui */}
      <div
        role="status"
        aria-live="polite"
        className="fixed z-[200] bottom-4 right-4 left-4 sm:left-auto sm:w-96 flex flex-col gap-3 pointer-events-none"
      >
        {avisos.map(aviso => (
          <div
            key={aviso.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl bg-orion-panel ${
              aviso.tipo === "sucesso" ? "border-emerald-500/40" : "border-rose-500/50"
            }`}
          >
            {aviso.tipo === "sucesso"
              ? <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
              : <AlertCircle size={20} className="text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />}
            <p className="text-sm text-slate-100 flex-1">
              <span className="sr-only">{aviso.tipo === "sucesso" ? "Sucesso: " : "Erro: "}</span>
              {aviso.mensagem}
            </p>
            <button type="button" onClick={() => remover(aviso.id)} className={classeBotaoIcone} aria-label="Fechar aviso">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      <Modal aberto={confirmacao !== null} aoFechar={() => responder(false)} titulo={confirmacao?.titulo ?? ""} largura="max-w-md">
        <div className="p-5 sm:p-6 text-sm text-slate-300 leading-relaxed">{confirmacao?.mensagem}</div>
        <div className="px-5 sm:px-6 py-4 border-t border-slate-700 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button type="button" onClick={() => responder(false)} className={classeBotaoSecundario} autoFocus>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => responder(true)}
            className={confirmacao?.perigoso ? classeBotaoPerigo : classeBotaoPrimario}
          >
            {confirmacao?.textoConfirmar ?? "Confirmar"}
          </button>
        </div>
      </Modal>
    </Contexto.Provider>
  );
}

/** Extrai a mensagem de erro de uma resposta da API ({ mensagem }) ou devolve um texto padrão. */
export async function mensagemDeErro(resposta: Response, padrao: string): Promise<string> {
  const dados = await resposta.json().catch(() => ({}));
  return dados?.mensagem || padrao;
}
