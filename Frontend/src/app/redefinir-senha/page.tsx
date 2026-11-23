"use client";

import { useId, useState, Suspense, FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, CheckCircle2, ArrowLeft } from "lucide-react";
import { API_URL } from "@/src/lib/api";
import { textoDoErro } from "@/src/lib/formatos";
import { foco } from "@/src/lib/estilos";
import {
  TelaAutenticacao, classeBotaoAutenticacao, classeCampoAutenticacao, classeRotuloAutenticacao
} from "@/src/components/TelaAutenticacao";

const TAMANHO_MINIMO = 8; // mesma regra da API

// useSearchParams precisa estar dentro de um Suspense no Next.js
function RedefinirSenhaForm() {
  const id = useId();
  const token = useSearchParams().get("token");

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [concluido, setConcluido] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRedefinir = async (e: FormEvent) => {
    e.preventDefault();
    setErro("");

    if (!token) return setErro("O link de recuperação está incompleto. Abra novamente o link enviado para o seu e-mail.");
    if (senha.length < TAMANHO_MINIMO) return setErro(`A senha deve ter pelo menos ${TAMANHO_MINIMO} caracteres.`);
    if (senha !== confirmarSenha) return setErro("As duas senhas não são iguais. Digite a mesma senha nos dois campos.");

    setIsLoading(true);
    try {
      const resposta = await fetch(`${API_URL}/redefinir-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, novaSenha: senha }),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível redefinir a senha. O link pode ter expirado.");
      setConcluido(true);
    } catch (err) {
      setErro(textoDoErro(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (concluido) {
    return (
      <div role="status" className="text-center">
        <div className="flex justify-center mb-4">
          <span className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30" aria-hidden="true">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </span>
        </div>
        <h2 className="text-white text-xl font-bold mb-2">Senha alterada</h2>
        <p className="text-emerald-300 text-sm mb-8">Agora você já pode entrar com a nova senha.</p>
        <Link href="/login" className={classeBotaoAutenticacao}>Ir para o login</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleRedefinir} className="space-y-6">
      {!token && (
        <div role="alert" className="bg-rose-500/10 border border-rose-500/40 text-rose-300 text-sm p-3 rounded-lg text-center">
          Este endereço não tem o código de recuperação. Use o link enviado para o seu e-mail.
        </div>
      )}
      {erro && (
        <div role="alert" className="bg-rose-500/10 border border-rose-500/40 text-rose-300 text-sm p-3 rounded-lg text-center">
          {erro}
        </div>
      )}

      <div>
        <label htmlFor={`${id}-senha`} className={classeRotuloAutenticacao}>Nova senha</label>
        <input
          id={`${id}-senha`}
          type="password"
          required
          minLength={TAMANHO_MINIMO}
          autoComplete="new-password"
          disabled={!token || isLoading}
          value={senha}
          onChange={e => setSenha(e.target.value)}
          aria-describedby={`${id}-dica`}
          className={classeCampoAutenticacao}
        />
        <p id={`${id}-dica`} className="text-xs text-slate-300 mt-1.5">Mínimo de {TAMANHO_MINIMO} caracteres.</p>
      </div>

      <div>
        <label htmlFor={`${id}-confirmar`} className={classeRotuloAutenticacao}>Confirme a nova senha</label>
        <input
          id={`${id}-confirmar`}
          type="password"
          required
          autoComplete="new-password"
          disabled={!token || isLoading}
          value={confirmarSenha}
          onChange={e => setConfirmarSenha(e.target.value)}
          className={classeCampoAutenticacao}
        />
      </div>

      <div className="flex flex-col gap-3">
        <button type="submit" disabled={!token || isLoading} className={classeBotaoAutenticacao}>
          {isLoading ? "Salvando..." : "Salvar nova senha"}
          {!isLoading && <Lock size={18} aria-hidden="true" />}
        </button>
        <Link href="/login" className={`w-full flex items-center justify-center gap-2 text-sm text-slate-300 hover:text-white font-bold min-h-11 rounded-lg ${foco}`}>
          <ArrowLeft size={16} aria-hidden="true" /> Voltar para o login
        </Link>
      </div>
    </form>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <TelaAutenticacao titulo={<span className="text-xl uppercase">Criar nova senha</span>}>
      <Suspense fallback={<p className="text-center text-slate-300">Carregando...</p>}>
        <RedefinirSenhaForm />
      </Suspense>
    </TelaAutenticacao>
  );
}
