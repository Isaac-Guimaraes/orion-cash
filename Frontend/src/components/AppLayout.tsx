"use client";

import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Wallet, Truck, 
  Bell, Search, Menu, 
  ChevronDown, User, Settings, LogOut, X, FileText
} from "lucide-react";
import { API_URL } from "@/src/lib/api";

export function AppLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [busca, setBusca] = useState("");
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);

  // ESTADOS DOS MODAIS
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // ESTADO DO USUÁRIO
  const [usuario, setUsuario] = useState({ id: "", nome: "Carregando...", email: "..." });
  
  // NOVOS ESTADOS PARA EDIÇÃO DO PERFIL
  const [nomeEditado, setNomeEditado] = useState("");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  useEffect(() => {
    const userStorage = localStorage.getItem("@OrionCash:user");
    if (userStorage) {
      const userData = JSON.parse(userStorage);
      setUsuario(userData);
      setNomeEditado(userData.nome); 
    }

    async function buscarNotificacoes() {
      try {
        const token = localStorage.getItem("@OrionCash:token");
        if (!token) return;

        const resposta = await fetch(`${API_URL}/notificacoes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (resposta.ok) {
          const dados = await resposta.json();
          setNotificacoes(dados);
        }
      } catch (erro) {
        console.error("Erro ao buscar notificações:", erro);
      }
    }

    buscarNotificacoes();
    const intervalo = setInterval(buscarNotificacoes, 30000);
    return () => clearInterval(intervalo);
  }, []);

  // Mantém o nome editado sincronizado se o usuário mudar
  useEffect(() => {
    setNomeEditado(usuario.nome);
  }, [usuario]);

  const notificacoesParaMostrar = notificacoes.filter(notif => notif.autor !== usuario.nome);
  const temNovas = notificacoesParaMostrar.some(n => !n.lida);

  const handleToggleNotificacoes = async () => {
    if (!showNotificacoes && temNovas) {
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
      try {
        const token = localStorage.getItem("@OrionCash:token");
        await fetch(`${API_URL}/notificacoes/lidas`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (erro) {
        console.error("Erro ao marcar notificações como lidas:", erro);
      }
    }
    setShowNotificacoes(!showNotificacoes);
    setIsProfileMenuOpen(false);
  };

  // FUNÇÃO QUE SALVA O PERFIL NO BACKEND
  const handleSalvarPerfil = async () => {
    if (!usuario.id) return;
    
    setSalvandoPerfil(true);
    try {
      const token = localStorage.getItem("@OrionCash:token");
      
      const resposta = await fetch(`${API_URL}/usuarios/${usuario.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ nome: nomeEditado })
      });

      if (!resposta.ok) throw new Error("Falha ao atualizar");

      const usuarioAtualizado = await resposta.json();

      setUsuario(usuarioAtualizado);
      localStorage.setItem("@OrionCash:user", JSON.stringify(usuarioAtualizado));
      
      setShowPerfilModal(false); 
    } catch (erro) {
      console.error("Erro ao salvar perfil:", erro);
      alert("Ocorreu um erro ao salvar os dados.");
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("@OrionCash:token");
    localStorage.removeItem("@OrionCash:user");
    document.cookie = "orion_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0F172A] text-slate-300">
      
      {/* SIDEBAR RETRÁTIL */}
      <aside className={`${isSidebarOpen ? "w-64" : "w-20"} bg-[#0B1120] border-r border-slate-800/50 flex flex-col z-20 transition-all duration-300 ease-in-out relative`}>
        
        {/* Header da Sidebar (Logo Real) */}
        <div className={`h-24 flex items-center ${isSidebarOpen ? "justify-between px-4" : "justify-center"} transition-all border-b border-slate-800/30`}>
          {isSidebarOpen ? (
            <>
              {/* LOGO E TEXTO EXATAMENTE COMO NO LOGIN */}
              <div className="flex items-center gap-3 overflow-hidden">
                <img 
                  src="/logo.png" 
                  alt="Órion Cash" 
                  className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.3)] flex-shrink-0" 
                />
                <span className="text-[22px] font-extrabold tracking-widest text-white leading-none whitespace-nowrap flex items-baseline gap-1">
                  ÓRION <span className="text-[#F59E0B] text-[13px] font-bold tracking-wider">CASH</span>
                </span>
              </div>
              
              <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800/50 flex-shrink-0 ml-1">
                <Menu size={20} />
              </button>
            </>
          ) : (
            // Versão fechada (Apenas a imagem da logo)
            <button onClick={() => setIsSidebarOpen(true)} className="w-full flex justify-center items-center py-6 hover:scale-110 transition-transform" title="Expandir menu">
              <img 
                src="/logo.png" 
                alt="Órion Cash" 
                className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" 
              />
            </button>
          )}
        </div>

        <nav className="flex-1 py-6 overflow-y-auto overflow-x-hidden flex flex-col w-full">
          {isSidebarOpen && <p className="px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Menu Principal</p>}
          <div className={`space-y-3 w-full ${isSidebarOpen ? "px-3" : "px-0 flex flex-col items-center"}`}>
            <Link href="/dashboard" className={`flex items-center transition-colors group ${isSidebarOpen ? `gap-3 px-3 py-2.5 rounded-r-lg border-l-4 ${pathname === "/dashboard" ? "bg-slate-800/40 text-white border-cyan-500" : "border-transparent text-slate-400 hover:text-white hover:bg-slate-800/40"}` : `justify-center p-3 rounded-xl w-12 h-12 ${pathname === "/dashboard" ? "bg-slate-800/40 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/40"}`}`}>
              <LayoutDashboard size={20} className={`${pathname === "/dashboard" ? "text-cyan-500" : "group-hover:text-white"} flex-shrink-0 transition-colors`} />
              {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Dashboard</span>}
            </Link>
            <Link href="/dashboard/financeiro" className={`flex items-center transition-colors group ${isSidebarOpen ? `gap-3 px-3 py-2.5 rounded-r-lg border-l-4 ${pathname.includes("/financeiro") ? "bg-slate-800/40 text-white border-cyan-500" : "border-transparent text-slate-400 hover:text-white hover:bg-slate-800/40"}` : `justify-center p-3 rounded-xl w-12 h-12 ${pathname.includes("/financeiro") ? "bg-slate-800/40 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/40"}`}`}>
              <Wallet size={20} className={`${pathname.includes("/financeiro") ? "text-cyan-500" : "group-hover:text-white"} flex-shrink-0 transition-colors`} />
              {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Financeiro</span>}
            </Link>
            <Link href="/dashboard/contratos" className={`flex items-center transition-colors group ${isSidebarOpen ? `gap-3 px-3 py-2.5 rounded-r-lg border-l-4 ${pathname.includes("/contratos") ? "bg-slate-800/40 text-white border-cyan-500" : "border-transparent text-slate-400 hover:text-white hover:bg-slate-800/40"}` : `justify-center p-3 rounded-xl w-12 h-12 ${pathname.includes("/contratos") ? "bg-slate-800/40 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/40"}`}`}>
              <FileText size={20} className={`${pathname.includes("/contratos") ? "text-cyan-500" : "group-hover:text-white"} flex-shrink-0 transition-colors`} />
              {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Contratos</span>}
            </Link>
            <Link href="/dashboard/frota" className={`flex items-center transition-colors group ${isSidebarOpen ? `gap-3 px-3 py-2.5 rounded-r-lg border-l-4 ${pathname.includes("/frota") ? "bg-slate-800/40 text-white border-cyan-500" : "border-transparent text-slate-400 hover:text-white hover:bg-slate-800/40"}` : `justify-center p-3 rounded-xl w-12 h-12 ${pathname.includes("/frota") ? "bg-slate-800/40 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/40"}`}`}>
              <Truck size={20} className={`${pathname.includes("/frota") ? "text-cyan-500" : "group-hover:text-white"} flex-shrink-0 transition-colors`} />
              {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">Frota</span>}
            </Link>
          </div>
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header (Topo) */}
        <header className="h-20 bg-[#0F172A] border-b border-slate-800/60 flex items-center justify-between px-8 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-white">
              {pathname.includes("/financeiro") ? "Financeiro" : pathname.includes("/frota") ? "Gestão de Frota" : pathname.includes("/contratos") ? "Contratos" : "Visão Geral"}
            </h1>
            <span className="text-slate-500 text-sm hidden md:block">| Bem-vindo, {usuario.nome.split(' ')[0]}</span>
          </div>

          <div className="flex items-center gap-6">
            {/* BUSCA INTERATIVA */}
            <div className="relative flex items-center hidden lg:flex">
              <Search size={16} className="absolute left-3 text-slate-400" />
              <input type="text" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') console.log("Buscando por:", busca); }} className="bg-[#1E293B] border border-slate-700/50 text-white rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:outline-none focus:border-orange-500 transition-colors placeholder:text-slate-500" />
            </div>

            {/* SISTEMA DE NOTIFICAÇÕES */}
            <div className="relative">
              <button onClick={handleToggleNotificacoes} className="relative text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800">
                <Bell size={20} />
                {temNovas && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-[#0F172A]"></span>}
              </button>

              {showNotificacoes && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotificacoes(false)}></div>
                  <div className="absolute right-0 mt-3 w-80 bg-[#1A2235] border border-slate-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4">
                    <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-[#0F172A]/50">
                      <h3 className="text-white font-bold text-sm tracking-widest uppercase">Notificações</h3>
                      <span className="text-xs text-slate-400 font-medium">{notificacoesParaMostrar.length} Total</span>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                      {notificacoesParaMostrar.length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-500">Não há notificações no momento.</div>
                      ) : (
                        notificacoesParaMostrar.map(notif => (
                          <div key={notif.id} className="p-4 border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors cursor-pointer flex gap-3">
                            <div className="mt-1 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
                              <Bell size={14} className="text-orange-400" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-200"><span className="font-bold text-orange-400">{notif.autor}: </span>{notif.texto}</p>
                              <span className="text-xs text-slate-500 mt-1 block">{notif.dataCriacao ? new Date(notif.dataCriacao).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : notif.tempo || "Agora"}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 text-center bg-[#0F172A]/50 border-t border-slate-700/50">
                      <button onClick={() => setShowNotificacoes(false)} className="text-xs text-slate-400 hover:text-orange-500 font-bold uppercase tracking-widest transition-colors">Fechar Menu</button>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* SESSÃO DO PERFIL */}
            <div className="relative">
              <button onClick={() => { setIsProfileMenuOpen(!isProfileMenuOpen); setShowNotificacoes(false); }} className="flex items-center gap-3 pl-4 border-l border-slate-800 hover:opacity-80 transition-opacity focus:outline-none">
                <div className="w-10 h-10 rounded-full bg-[#1E293B] overflow-hidden border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.nome)}&background=1E293B&color=F59E0B&bold=true`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-bold text-white leading-none">{usuario.nome}</p>
                  <p className="text-[11px] text-slate-400 mt-1 truncate max-w-[150px]">{usuario.email}</p>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform hidden md:block ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-56 bg-[#1A2235] border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-700/50 mb-2 md:hidden">
                      <p className="text-sm font-bold text-white">{usuario.nome}</p>
                      <p className="text-[11px] text-slate-400 truncate">{usuario.email}</p>
                    </div>

                    <button onClick={() => { setShowPerfilModal(true); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                      <User size={16} className="text-slate-400" /> Meu Perfil
                    </button>
                    <button onClick={() => { setShowConfigModal(true); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                      <Settings size={16} className="text-slate-400" /> Configurações
                    </button>
                    
                    <div className="h-px bg-slate-700/50 my-2 w-full"></div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-500/10 transition-colors font-bold tracking-wide">
                      <LogOut size={16} /> Sair do Sistema
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Conteúdo da Página */}
        <main className="flex-1 overflow-auto bg-[#0F172A] p-8 relative z-0">
          {children}
        </main>
      </div>

      {/* ========================================= */}
      {/* MODAL: MEU PERFIL                         */}
      {/* ========================================= */}
      {showPerfilModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#131C2D] border border-slate-700/50 w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#0F172A]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <User size={20} className="text-[#F59E0B]" /> Meu Perfil
              </h2>
              <button onClick={() => setShowPerfilModal(false)} className="text-slate-400 hover:text-rose-400 transition-colors p-1 rounded-lg hover:bg-slate-800">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-[#1E293B] overflow-hidden border-2 border-orange-500/30">
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.nome)}&background=1E293B&color=F59E0B&bold=true&size=128`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <button className="text-xs font-bold text-[#F59E0B] hover:text-[#D97706] uppercase tracking-widest transition-colors">Alterar Foto</button>
                  <p className="text-[10px] text-slate-500 mt-1">JPG ou PNG até 2MB</p>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold tracking-widest uppercase text-[10px] mb-1.5 block">Nome Completo:</label>
                <input 
                  type="text" 
                  value={nomeEditado} 
                  onChange={(e) => setNomeEditado(e.target.value)}
                  className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B] transition-colors text-sm" 
                />
              </div>
              
              <div>
                <label className="text-slate-400 font-bold tracking-widest uppercase text-[10px] mb-1.5 block">E-mail de Acesso:</label>
                <input type="email" defaultValue={usuario.email} disabled className="w-full bg-[#0B1120]/50 border border-slate-800 text-slate-500 rounded-lg px-4 py-2.5 text-sm cursor-not-allowed" title="O e-mail não pode ser alterado" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-[#0F172A] flex justify-end gap-3">
              <button onClick={() => setShowPerfilModal(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancelar</button>
              <button 
                onClick={handleSalvarPerfil} 
                disabled={salvandoPerfil}
                className="px-6 py-2 rounded-lg text-sm font-bold bg-[#F59E0B] text-black hover:bg-[#D97706] transition-colors shadow-lg shadow-[#F59E0B]/20 disabled:opacity-50"
              >
                {salvandoPerfil ? "Salvando..." : "Salvar Dados"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL: CONFIGURAÇÕES                      */}
      {/* ========================================= */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#131C2D] border border-slate-700/50 w-full max-w-lg rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#0F172A]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings size={20} className="text-[#F59E0B]" /> Configurações do Sistema
              </h2>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-rose-400 transition-colors p-1 rounded-lg hover:bg-slate-800">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Notificações por E-mail</h3>
                  <p className="text-xs text-slate-500 mt-1">Receber alertas críticos de frota na sua caixa de entrada.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F59E0B]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Modo Escuro Fixo</h3>
                  <p className="text-xs text-slate-500 mt-1">Forçar o tema escuro independentemente do sistema.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked disabled />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-500"></div>
                </label>
              </div>

              <div className="pt-2">
                <h3 className="text-sm font-bold text-slate-200 mb-3">Dados da Empresa</h3>
                <input type="text" placeholder="Razão Social" defaultValue="Órion Cash Logística" className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B] transition-colors text-sm mb-3" />
                <input type="text" placeholder="CNPJ" defaultValue="00.000.000/0001-00" className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B] transition-colors text-sm" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-[#0F172A] flex justify-end gap-3">
              <button onClick={() => setShowConfigModal(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-colors">Fechar</button>
              <button onClick={() => setShowConfigModal(false)} className="px-6 py-2 rounded-lg text-sm font-bold bg-[#F59E0B] text-black hover:bg-[#D97706] transition-colors shadow-lg shadow-[#F59E0B]/20">Salvar Alterações</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}