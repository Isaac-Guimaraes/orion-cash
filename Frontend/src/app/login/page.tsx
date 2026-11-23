"use client";

import { useId, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowLeft } from "lucide-react";
import { API_URL } from "@/src/lib/api";
import { textoDoErro } from "@/src/lib/formatos";
import { foco } from "@/src/lib/estilos";
import {
  TelaAutenticacao, classeBotaoAutenticacao, classeCampoAutenticacao, classeRotuloAutenticacao
} from "@/src/components/TelaAutenticacao";

export default function LoginPage() {
  const router = useRouter();
  const id = useId();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const trocarModo = (recuperar: boolean) => {
    setIsRecovering(recuperar);
    setErro("");
    setSucesso("");
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErro("");
    setIsLoading(true);
    try {
      const resposta = await fetch(`${API_URL}/sessao/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), senha }),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.mensagem || "E-mail ou senha incorretos.");

      localStorage.setItem("@OrionCash:token", dados.token);
      localStorage.setItem("@OrionCash:user", JSON.stringify(dados.usuario));
      document.cookie = `orion_token=${dados.token}; path=/; max-age=86400; SameSite=Lax`;
      router.push("/dashboard");
    } catch (err) {
      setErro(textoDoErro(err) === "Failed to fetch" ? "Não foi possível conectar ao servidor. Verifique sua internet e tente de novo." : textoDoErro(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecuperarSenha = async (e: FormEvent) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setIsLoading(true);
    try {
      const resposta = await fetch(`${API_URL}/recuperar-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível enviar o link agora. Tente novamente mais tarde.");
      setSucesso("Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha. Confira também a caixa de spam.");
    } catch (err) {
      setErro(textoDoErro(err, "Não foi possível enviar o link agora. Tente novamente mais tarde."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TelaAutenticacao
      titulo={isRecovering
        ? <span className="text-xl uppercase">Recuperar senha</span>
        : <span className="text-3xl">ÓRION <span className="text-orion-primary text-lg">CASH</span></span>}
    >
      {erro && (
        <div role="alert" className="bg-rose-500/10 border border-rose-500/40 text-rose-300 text-sm font-medium p-3 rounded-lg text-center mb-6">
          {erro}
        </div>
      )}
      {sucesso && (
        <div role="status" className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-sm p-3 rounded-lg text-center mb-6">
          {sucesso}
        </div>
      )}

      {!isRecovering ? (
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor={`${id}-email`} className={classeRotuloAutenticacao}>E-mail</label>
            <input
              id={`${id}-email`}
              type="email"
              required
              autoComplete="username"
              inputMode="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={classeCampoAutenticacao}
            />
          </div>

          <div>
            <label htmlFor={`${id}-senha`} className={classeRotuloAutenticacao}>Senha</label>
            <input
              id={`${id}-senha`}
              type="password"
              required
              autoComplete="current-password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className={classeCampoAutenticacao}
            />
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => trocarModo(true)}
                className={`text-sm text-slate-300 hover:text-orion-primary underline-offset-4 hover:underline min-h-8 px-1 rounded ${foco}`}
              >
                Esqueceu a senha?
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className={classeBotaoAutenticacao}>
            {isLoading ? "Entrando..." : "Entrar"}
            {!isLoading && <Lock size={18} aria-hidden="true" />}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRecuperarSenha} className="space-y-6">
          <p className="text-sm text-slate-300 text-center leading-relaxed">
            Informe o e-mail que você usa para entrar. Enviaremos um link para criar uma nova senha.
          </p>
          <div>
            <label htmlFor={`${id}-email-recuperacao`} className={classeRotuloAutenticacao}>E-mail</label>
            <input
              id={`${id}-email-recuperacao`}
              type="email"
              required
              autoFocus
              autoComplete="username"
              inputMode="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={classeCampoAutenticacao}
            />
          </div>

          <div className="flex flex-col gap-3">
            <button type="submit" disabled={isLoading || sucesso.length > 0} className={classeBotaoAutenticacao}>
              {isLoading ? "Enviando..." : "Enviar link"}
              {!isLoading && <Mail size={18} aria-hidden="true" />}
            </button>
            <button
              type="button"
              onClick={() => trocarModo(false)}
              className={`w-full flex items-center justify-center gap-2 text-sm text-slate-300 hover:text-white font-bold min-h-11 rounded-lg ${foco}`}
            >
              <ArrowLeft size={16} aria-hidden="true" /> Voltar para o login
            </button>
          </div>
        </form>
      )}
    </TelaAutenticacao>
  );
}
