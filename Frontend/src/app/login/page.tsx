"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowLeft } from "lucide-react";
import { API_URL } from "@/src/lib/api";

export default function LoginPage() {
  const router = useRouter();
  
  // Estados de dados
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  
  // Estados de interface
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setIsLoading(true);

    try {
      const resposta = await fetch(`${API_URL}/sessao/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const dados = await resposta.json();

      if (!resposta.ok) throw new Error(dados.mensagem || "Credenciais inválidas.");

      localStorage.setItem("@OrionCash:token", dados.token);
      localStorage.setItem("@OrionCash:user", JSON.stringify(dados.usuario));
      document.cookie = `orion_token=${dados.token}; path=/; max-age=86400`;

      router.push("/dashboard");
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecuperarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setIsLoading(true);

    try {
      
      const resposta = await fetch(`${API_URL}/recuperar-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

    
      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados.mensagem || "Falha ao solicitar recuperação.");
      }
      
      setSucesso("Se o e-mail existir no sistema, receberá um link de recuperação em breve.");
      setEmail("");

    } catch (err: any) {
      setErro(err.message || "Ocorreu um erro. Verifique a conexão.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090E17] flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* CAMADA 1: Estrelas e Brilhos do Fundo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#F59E0B]/20 rounded-full blur-[120px]"></div>
      </div>

      {/* CAMADA 2: MONTAGEM SOBREPOSTA */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <img 
          src="/fundo-login.png"  
          alt="Fundo Órion" 
          className="w-full h-full object-cover opacity-30 mix-blend-overlay contrast-125"
        />
        <div className="absolute inset-0 bg-[#090E17]/40 mix-blend-multiply"></div>
      </div>

      {/* CAMADA 3: Caixa de Login */}
      <div className="z-10 w-full max-w-[400px] p-10 bg-[#131C2D]/70 backdrop-blur-xl rounded-3xl border border-slate-800/50 shadow-2xl relative">
        
        {/* LOGOTIPO */}
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="relative flex items-center justify-center mb-2">
            <img 
              src="/logo.png" 
              alt="Logo Órion Cash" 
              className="h-24 w-auto object-contain relative z-10 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            />
            <div className="absolute inset-0 bg-[#F59E0B] blur-3xl opacity-25 rounded-full scale-150"></div>
          </div>
          
          {!isRecovering ? (
             <h1 className="text-3xl font-bold tracking-widest text-white mt-4 drop-shadow-lg text-center leading-tight">
               ÓRION <span className="text-[#F59E0B] text-lg">CASH</span>
             </h1>
          ) : (
             <h1 className="text-xl font-bold tracking-widest text-white mt-4 drop-shadow-lg text-center uppercase">
               Recuperar Senha
             </h1>
          )}
        </div>

        {/* FEEDBACK MENSAGENS */}
        {erro && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold p-3 rounded-lg text-center uppercase tracking-wider mb-6">
            {erro}
          </div>
        )}
        {sucesso && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold p-3 rounded-lg text-center tracking-wide mb-6">
            {sucesso}
          </div>
        )}

        {/* FORMULÁRIO DINÂMICO */}
        {!isRecovering ? (
          /* ===== MODO: LOGIN ===== */
          <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in duration-300">
            <div>
              <label className="text-[#F59E0B] font-bold tracking-widest uppercase text-xs mb-2 block shadow-sm">
                Login:
              </label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B1120]/80 border-2 border-transparent text-white rounded-xl px-5 py-3.5 focus:outline-none focus:border-[#F59E0B] transition-colors shadow-inner backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="text-[#F59E0B] font-bold tracking-widest uppercase text-xs mb-2 block shadow-sm">
                Senha:
              </label>
              <input 
                type="password" 
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-[#0B1120]/80 border-2 border-transparent text-white rounded-xl px-5 py-3.5 focus:outline-none focus:border-[#F59E0B] transition-colors shadow-inner backdrop-blur-sm"
              />
              <div className="flex justify-end mt-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsRecovering(true);
                    setErro("");
                    setSucesso("");
                  }}
                  className="text-[10px] text-slate-400 hover:text-[#F59E0B] transition-colors font-bold uppercase tracking-widest"
                >
                  Esqueceu a senha?
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-extrabold uppercase tracking-widest rounded-xl px-4 py-4 flex items-center justify-center gap-3 transition-colors disabled:opacity-70 shadow-lg shadow-[#F59E0B]/20"
              >
                {isLoading ? "Acessando..." : "Entrar"}
                {!isLoading && <Lock size={18} className="text-black" />}
              </button>
            </div>
          </form>

        ) : (

          /* ===== MODO: RECUPERAR SENHA ===== */
          <form onSubmit={handleRecuperarSenha} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <p className="text-xs text-slate-400 mb-4 text-center leading-relaxed">
                Insira o seu e-mail de acesso. Se ele existir na nossa base de dados, enviaremos as instruções para redefinir a sua senha.
              </p>
              <label className="text-[#F59E0B] font-bold tracking-widest uppercase text-xs mb-2 block shadow-sm">
                E-mail:
              </label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B1120]/80 border-2 border-transparent text-white rounded-xl px-5 py-3.5 focus:outline-none focus:border-[#F59E0B] transition-colors shadow-inner backdrop-blur-sm"
              />
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button 
                type="submit" 
                disabled={isLoading || sucesso.length > 0}
                className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-extrabold uppercase tracking-widest rounded-xl px-4 py-4 flex items-center justify-center gap-3 transition-colors disabled:opacity-70 shadow-lg shadow-[#F59E0B]/20"
              >
                {isLoading ? "A enviar..." : "Enviar Link"}
                {!isLoading && <Mail size={18} className="text-black" />}
              </button>

              <button 
                type="button" 
                onClick={() => {
                  setIsRecovering(false);
                  setErro("");
                  setSucesso("");
                }}
                className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white transition-colors font-bold uppercase tracking-widest py-3"
              >
                <ArrowLeft size={14} /> Voltar para o Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}