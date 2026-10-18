"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, CheckCircle2, ArrowLeft } from "lucide-react";
import { API_URL } from "@/src/lib/api";

// O Next.js exige que o useSearchParams seja envolvido num Suspense.
// Por isso criamos o formulário num componente separado.
function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); // Pega o token da URL

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRedefinir = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!token) {
      setErro("Token de recuperação inválido ou ausente.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem. Tente novamente.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      const resposta = await fetch(`${API_URL}/redefinir-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha: senha })
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados.mensagem || "Erro ao redefinir a senha.");
      }

      setSucesso("Senha alterada com sucesso! Agora pode aceder à sua conta.");
      setSenha("");
      setConfirmarSenha("");

    } catch (err: any) {
      setErro(err.message || "Ocorreu um erro. O token pode ter expirado.");
    } finally {
      setIsLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className="text-center animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
        </div>
        <h2 className="text-white text-xl font-bold tracking-wide mb-2">Tudo Certo!</h2>
        <p className="text-emerald-400 text-sm mb-8 px-4">{sucesso}</p>
        <button 
          onClick={() => router.push("/login")}
          className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-extrabold uppercase tracking-widest rounded-xl px-4 py-4 flex items-center justify-center gap-3 transition-colors shadow-lg shadow-[#F59E0B]/20"
        >
          Ir para o Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleRedefinir} className="space-y-6 animate-in fade-in duration-300">
      
      {!token && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold p-3 rounded-lg text-center uppercase tracking-wider mb-6">
          Nenhum token encontrado na URL. Utilize o link enviado para o seu e-mail.
        </div>
      )}

      {erro && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold p-3 rounded-lg text-center uppercase tracking-wider mb-6">
          {erro}
        </div>
      )}

      <div>
        <label className="text-[#F59E0B] font-bold tracking-widest uppercase text-xs mb-2 block shadow-sm">
          Nova Senha:
        </label>
        <input 
          type="password" 
          required
          disabled={!token || isLoading}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full bg-[#0B1120]/80 border-2 border-transparent text-white rounded-xl px-5 py-3.5 focus:outline-none focus:border-[#F59E0B] transition-colors shadow-inner backdrop-blur-sm disabled:opacity-50"
          placeholder="Mínimo de 6 caracteres"
        />
      </div>

      <div>
        <label className="text-[#F59E0B] font-bold tracking-widest uppercase text-xs mb-2 block shadow-sm">
          Confirmar Nova Senha:
        </label>
        <input 
          type="password" 
          required
          disabled={!token || isLoading}
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          className="w-full bg-[#0B1120]/80 border-2 border-transparent text-white rounded-xl px-5 py-3.5 focus:outline-none focus:border-[#F59E0B] transition-colors shadow-inner backdrop-blur-sm disabled:opacity-50"
          placeholder="Repita a nova senha"
        />
      </div>

      <div className="pt-4 flex flex-col gap-3">
        <button 
          type="submit" 
          disabled={!token || isLoading}
          className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-extrabold uppercase tracking-widest rounded-xl px-4 py-4 flex items-center justify-center gap-3 transition-colors disabled:opacity-70 shadow-lg shadow-[#F59E0B]/20"
        >
          {isLoading ? "A Salvar..." : "Redefinir Senha"}
          {!isLoading && <Lock size={18} className="text-black" />}
        </button>

        <button 
          type="button" 
          onClick={() => router.push("/login")}
          className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white transition-colors font-bold uppercase tracking-widest py-3"
        >
          <ArrowLeft size={14} /> Cancelar
        </button>
      </div>
    </form>
  );
}

// A Página principal que envolve o formulário
export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-screen bg-[#090E17] flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* CAMADA 1: Fundo Animado */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#F59E0B]/20 rounded-full blur-[120px]"></div>
      </div>

      {/* CAMADA 2: Montagem */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <img 
          src="/fundo-login.png"  
          alt="Fundo Órion" 
          className="w-full h-full object-cover opacity-30 mix-blend-overlay contrast-125"
        />
        <div className="absolute inset-0 bg-[#090E17]/40 mix-blend-multiply"></div>
      </div>

      {/* CAMADA 3: Caixa Principal */}
      <div className="z-10 w-full max-w-[400px] p-10 bg-[#131C2D]/70 backdrop-blur-xl rounded-3xl border border-slate-800/50 shadow-2xl relative">
        
        {/* LOGO */}
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="relative flex items-center justify-center mb-2">
            <img 
              src="/logo.png" 
              alt="Logo Órion Cash" 
              className="h-24 w-auto object-contain relative z-10 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            />
            <div className="absolute inset-0 bg-[#F59E0B] blur-3xl opacity-25 rounded-full scale-150"></div>
          </div>
          
          <h1 className="text-xl font-bold tracking-widest text-white mt-4 drop-shadow-lg text-center uppercase">
            Criar Nova Senha
          </h1>
        </div>

        {/* O formulário precisa estar no Suspense por causa do token na URL */}
        <Suspense fallback={<div className="text-center text-[#F59E0B] font-bold">A carregar...</div>}>
          <RedefinirSenhaForm />
        </Suspense>

      </div>
    </div>
  );
}