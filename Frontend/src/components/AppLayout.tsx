"use client";

import { useState, useEffect, useRef, ReactNode, FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Wallet, Bus, Bell, Menu,
  ChevronDown, User, LogOut, X, FileText, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import { API_URL } from "@/src/lib/api";
import { textoDoErro } from "@/src/lib/formatos";
import { FeedbackProvider, useFeedback, mensagemDeErro } from "@/src/components/ui/Feedback";
import { Modal } from "@/src/components/ui/Modal";
import { Campo } from "@/src/components/ui/Campo";
import { classeBotaoIcone, classeBotaoPrimario, classeBotaoSecundario, classeCampo, foco } from "@/src/lib/estilos";

const ITENS_MENU = [
  { href: "/dashboard", rotulo: "Visão geral", Icone: LayoutDashboard },
  { href: "/dashboard/financeiro", rotulo: "Financeiro", Icone: Wallet },
  { href: "/dashboard/contratos", rotulo: "Contratos", Icone: FileText },
  { href: "/dashboard/frota", rotulo: "Frota", Icone: Bus },
];

interface Notificacao {
  id: string;
  autor: string;
  texto: string;
  lida: boolean;
  dataCriacao?: string;
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <FeedbackProvider>
      <Estrutura>{children}</Estrutura>
    </FeedbackProvider>
  );
}

function Estrutura({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { avisar } = useFeedback();

  // Menu lateral: no celular é uma gaveta (fechada por padrão); no computador, pode ser recolhido
  const [menuMovelAberto, setMenuMovelAberto] = useState(false);
  const [menuRecolhido, setMenuRecolhido] = useState(false);

  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  const [perfilAberto, setPerfilAberto] = useState(false);
  const [usuario, setUsuario] = useState({ id: "", nome: "", email: "" });
  const [nomeEditado, setNomeEditado] = useState("");
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  useEffect(() => {
    const userStorage = localStorage.getItem("@OrionCash:user");
    if (userStorage) setUsuario(JSON.parse(userStorage));

    async function buscarNotificacoes() {
      try {
        const token = localStorage.getItem("@OrionCash:token");
        if (!token) return;
        const resposta = await fetch(`${API_URL}/notificacoes`, { headers: { Authorization: `Bearer ${token}` } });
        if (resposta.ok) setNotificacoes(await resposta.json());
      } catch (erro) {
        console.error("Erro ao buscar notificações:", erro);
      }
    }

    buscarNotificacoes();
    const intervalo = setInterval(buscarNotificacoes, 30000);
    return () => clearInterval(intervalo);
  }, []);

  // Ao abrir a gaveta no celular, o foco vai para dentro dela
  const botaoFecharMenu = useRef<HTMLButtonElement>(null);
  const botaoAbrirMenu = useRef<HTMLButtonElement>(null);
  const botaoPerfil = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (menuMovelAberto) botaoFecharMenu.current?.focus();
  }, [menuMovelAberto]);

  // Ao fechar a gaveta ou o menu do usuário, o foco volta ao botão que os abriu (WCAG 2.4.3).
  // Fica num efeito porque, com a gaveta aberta, o cabeçalho está inerte e não aceita foco.
  const devolverFoco = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (menuMovelAberto || menuPerfilAberto || !devolverFoco.current) return;
    devolverFoco.current.focus();
    devolverFoco.current = null;
  }, [menuMovelAberto, menuPerfilAberto]);

  const fecharGaveta = () => {
    devolverFoco.current = botaoAbrirMenu.current;
    setMenuMovelAberto(false);
  };

  // Ao trocar de página, fecha a gaveta e os menus
  useEffect(() => {
    setMenuMovelAberto(false);
    setMenuPerfilAberto(false);
    setNotificacoesAbertas(false);
  }, [pathname]);

  // Se a janela passar para a largura de computador com a gaveta aberta, fecha a gaveta
  // (senão o conteúdo continuaria inerte com o menu lateral fixo)
  useEffect(() => {
    if (!menuMovelAberto) return;
    const md = window.matchMedia("(min-width: 768px)");
    const aoMudar = () => { if (md.matches) setMenuMovelAberto(false); };
    md.addEventListener("change", aoMudar);
    return () => md.removeEventListener("change", aoMudar);
  }, [menuMovelAberto]);

  // Esc fecha gaveta e menus suspensos (WCAG 1.4.13)
  useEffect(() => {
    if (!menuMovelAberto && !menuPerfilAberto && !notificacoesAbertas) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (menuMovelAberto) devolverFoco.current = botaoAbrirMenu.current;
      else if (menuPerfilAberto) devolverFoco.current = botaoPerfil.current;
      setMenuMovelAberto(false);
      setMenuPerfilAberto(false);
      setNotificacoesAbertas(false);
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [menuMovelAberto, menuPerfilAberto, notificacoesAbertas]);

  const notificacoesParaMostrar = notificacoes.filter(n => n.autor !== usuario.nome);
  const temNovas = notificacoesParaMostrar.some(n => !n.lida);
  const primeiroNome = usuario.nome.split(" ")[0];

  const alternarNotificacoes = async () => {
    if (!notificacoesAbertas && temNovas) {
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
      try {
        const token = localStorage.getItem("@OrionCash:token");
        await fetch(`${API_URL}/notificacoes/lidas`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      } catch (erro) {
        console.error("Erro ao marcar notificações como lidas:", erro);
      }
    }
    setNotificacoesAbertas(!notificacoesAbertas);
    setMenuPerfilAberto(false);
  };

  const abrirPerfil = () => {
    setNomeEditado(usuario.nome);
    setErroNome(null);
    setPerfilAberto(true);
    setMenuPerfilAberto(false);
  };

  const salvarPerfil = async (e: FormEvent) => {
    e.preventDefault();
    if (!usuario.id) return;
    if (!nomeEditado.trim()) {
      setErroNome("Informe o seu nome.");
      return;
    }

    setSalvandoPerfil(true);
    try {
      const token = localStorage.getItem("@OrionCash:token");
      const resposta = await fetch(`${API_URL}/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nome: nomeEditado.trim() }),
      });
      if (!resposta.ok) throw new Error(await mensagemDeErro(resposta, "Não foi possível salvar o perfil."));

      const atualizado = await resposta.json();
      setUsuario(atualizado);
      localStorage.setItem("@OrionCash:user", JSON.stringify(atualizado));
      setPerfilAberto(false);
      avisar("Perfil atualizado.");
    } catch (erro) {
      setErroNome(textoDoErro(erro));
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const sair = () => {
    localStorage.removeItem("@OrionCash:token");
    localStorage.removeItem("@OrionCash:user");
    document.cookie = "orion_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/login";
  };

  const estaAtivo = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));
  const avatar = (tamanho: number) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.nome || "?")}&background=1E293B&color=F59E0B&bold=true&size=${tamanho}`;

  // No celular o menu nunca fica recolhido (só aberto/fechado); no computador pode recolher
  const recolhido = menuRecolhido;

  return (
    <div className="flex h-dvh overflow-hidden bg-orion-bg text-slate-300">
      {/* Some com a gaveta aberta: o conteúdo fica inerte e o link não teria para onde levar */}
      {!menuMovelAberto && (
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[300] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-orion-primary focus:text-black focus:font-bold"
        >
          Pular para o conteúdo
        </a>
      )}

      {/* Fundo escuro da gaveta (só no celular) */}
      {menuMovelAberto && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={fecharGaveta} aria-hidden="true" />
      )}

      {/* MENU LATERAL */}
      <aside
        id="menu-lateral"
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-orion-deep border-r border-slate-800 flex flex-col transition-transform duration-300
          ${menuMovelAberto ? "translate-x-0 visible" : "-translate-x-full invisible"}
          md:visible md:static md:translate-x-0 md:transition-[width] ${recolhido ? "md:w-20" : "md:w-64"}`}
      >
        <div className={`h-20 flex items-center border-b border-slate-800 px-4 ${recolhido ? "md:justify-center md:px-0" : "justify-between"}`}>
          <Link href="/dashboard" className={`flex items-center gap-3 rounded-lg ${foco}`} aria-label="Órion Cash, ir para a visão geral">
            <img src="/logo.png" alt="" className="w-10 h-10 object-contain shrink-0" />
            <span className={`text-[22px] font-extrabold tracking-widest text-white leading-none whitespace-nowrap ${recolhido ? "md:hidden" : ""}`}>
              ÓRION <span className="text-orion-primary text-sm font-bold tracking-wider">CASH</span>
            </span>
          </Link>
          <button ref={botaoFecharMenu} type="button" onClick={fecharGaveta} className={`${classeBotaoIcone} md:hidden`} aria-label="Fechar menu">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Menu principal" className="flex-1 py-6 overflow-y-auto overflow-x-hidden">
          <ul className={`space-y-2 px-3 ${recolhido ? "md:px-0 md:flex md:flex-col md:items-center" : ""}`}>
            {ITENS_MENU.map(({ href, rotulo, Icone }) => {
              const ativo = estaAtivo(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={ativo ? "page" : undefined}
                    title={recolhido ? rotulo : undefined}
                    className={`flex items-center gap-3 min-h-11 px-3 rounded-lg border-l-4 transition-colors ${foco}
                      ${recolhido ? "md:justify-center md:w-12 md:h-12 md:px-0 md:border-l-0" : ""}
                      ${ativo
                        ? "bg-slate-800/60 text-white border-orion-accent"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/40 border-transparent"}`}
                  >
                    <Icone size={20} aria-hidden="true" className={`shrink-0 ${ativo ? "text-orion-accent" : ""}`} />
                    <span className={`text-sm font-medium whitespace-nowrap ${recolhido ? "md:sr-only" : ""}`}>{rotulo}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Recolher/expandir: só no computador */}
        <div className="hidden md:flex border-t border-slate-800 p-3 justify-center">
          <button
            type="button"
            onClick={() => setMenuRecolhido(!menuRecolhido)}
            className={classeBotaoIcone}
            aria-label={menuRecolhido ? "Expandir menu" : "Recolher menu"}
            aria-controls="menu-lateral"
            aria-expanded={!menuRecolhido}
          >
            {menuRecolhido ? <PanelLeftOpen size={20} aria-hidden="true" /> : <PanelLeftClose size={20} aria-hidden="true" />}
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL — inerte com a gaveta aberta, para o Tab não sair dela (WCAG 2.4.3) */}
      <div className="flex-1 flex flex-col min-w-0 h-dvh overflow-hidden" inert={menuMovelAberto}>
        <header className="h-16 md:h-20 shrink-0 bg-orion-bg border-b border-slate-800 flex items-center justify-between gap-3 px-4 md:px-8">
          <div className="flex items-center gap-2 min-w-0">
            <button
              ref={botaoAbrirMenu}
              type="button"
              onClick={() => setMenuMovelAberto(true)}
              className={`${classeBotaoIcone} md:hidden`}
              aria-label="Abrir menu"
              aria-controls="menu-lateral"
              aria-expanded={menuMovelAberto}
            >
              <Menu size={22} aria-hidden="true" />
            </button>
            <p className="text-sm md:text-base text-slate-300 truncate">
              {primeiroNome ? <>Olá, <span className="font-bold text-white">{primeiroNome}</span></> : "Órion Cash"}
            </p>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* NOTIFICAÇÕES */}
            <div className="relative">
              <button
                type="button"
                onClick={alternarNotificacoes}
                className={`${classeBotaoIcone} relative`}
                aria-label={temNovas ? "Notificações (há novas)" : "Notificações"}
                aria-expanded={notificacoesAbertas}
                aria-controls="painel-notificacoes"
              >
                <Bell size={20} aria-hidden="true" />
                {temNovas && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orion-primary rounded-full border-2 border-orion-bg" aria-hidden="true" />}
              </button>

              {notificacoesAbertas && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificacoesAbertas(false)} aria-hidden="true" />
                  <div
                    id="painel-notificacoes"
                    className="fixed left-4 right-4 top-[4.5rem] md:absolute md:left-auto md:right-0 md:top-auto md:mt-3 md:w-80 bg-orion-card border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-orion-bg/50">
                      <h2 className="text-white font-bold text-sm">Notificações</h2>
                      <span className="text-xs text-slate-400">{notificacoesParaMostrar.length} no total</span>
                    </div>
                    <ul className="max-h-80 overflow-y-auto">
                      {notificacoesParaMostrar.length === 0 ? (
                        <li className="p-6 text-center text-sm text-slate-400">Nenhuma notificação por enquanto.</li>
                      ) : (
                        notificacoesParaMostrar.map(n => (
                          <li key={n.id} className="p-4 border-b border-slate-700/50 flex gap-3">
                            <Bell size={16} className="text-orion-primary mt-1 shrink-0" aria-hidden="true" />
                            <div>
                              <p className="text-sm text-slate-200"><span className="font-bold text-orion-primary">{n.autor}: </span>{n.texto}</p>
                              {n.dataCriacao && (
                                <span className="text-xs text-slate-400 mt-1 block">
                                  {new Date(n.dataCriacao).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* PERFIL */}
            <div className="relative">
              <button
                ref={botaoPerfil}
                type="button"
                onClick={() => { setMenuPerfilAberto(!menuPerfilAberto); setNotificacoesAbertas(false); }}
                className={`flex items-center gap-3 md:pl-4 md:border-l border-slate-800 rounded-lg min-h-11 ${foco}`}
                aria-label={`Menu do usuário ${usuario.nome}`}
                aria-expanded={menuPerfilAberto}
                aria-controls="menu-perfil"
              >
                <img src={avatar(80)} alt="" className="w-10 h-10 rounded-full border border-orion-primary/30 shrink-0" />
                <span className="text-left hidden md:block">
                  <span className="block text-sm font-bold text-white leading-none">{usuario.nome}</span>
                  <span className="block text-xs text-slate-400 mt-1 truncate max-w-[150px]">{usuario.email}</span>
                </span>
                <ChevronDown size={16} aria-hidden="true" className={`text-slate-400 transition-transform hidden md:block ${menuPerfilAberto ? "rotate-180" : ""}`} />
              </button>

              {menuPerfilAberto && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuPerfilAberto(false)} aria-hidden="true" />
                  <div id="menu-perfil" className="absolute right-0 mt-3 w-60 bg-orion-panel border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-700/50 mb-2 md:hidden">
                      <p className="text-sm font-bold text-white">{usuario.nome}</p>
                      <p className="text-xs text-slate-400 truncate">{usuario.email}</p>
                    </div>
                    <button type="button" onClick={abrirPerfil} className={`w-full flex items-center gap-3 px-4 min-h-11 text-sm text-slate-200 hover:bg-slate-800 ${foco}`}>
                      <User size={16} className="text-slate-400" aria-hidden="true" /> Meu perfil
                    </button>
                    <div className="h-px bg-slate-700/50 my-2" />
                    <button type="button" onClick={sair} className={`w-full flex items-center gap-3 px-4 min-h-11 text-sm text-rose-400 hover:bg-rose-500/10 font-bold ${foco}`}>
                      <LogOut size={16} aria-hidden="true" /> Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main id="conteudo" tabIndex={-1} className="flex-1 overflow-auto bg-orion-bg p-4 md:p-8 focus:outline-none">
          {children}
        </main>
      </div>

      {/* MEU PERFIL */}
      <Modal aberto={perfilAberto} aoFechar={() => setPerfilAberto(false)} titulo="Meu perfil" icone={<User size={20} />} largura="max-w-md" devolverFocoPara={botaoPerfil}>
        <form onSubmit={salvarPerfil} noValidate>
          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-4">
              <img src={avatar(128)} alt="" className="w-16 h-16 rounded-full border-2 border-orion-primary/30" />
              <p className="text-sm text-slate-400">A foto é gerada a partir das iniciais do seu nome.</p>
            </div>
            <Campo rotulo="Nome completo" erro={erroNome}>
              {props => (
                <input {...props} type="text" autoComplete="name" value={nomeEditado} onChange={e => setNomeEditado(e.target.value)} className={classeCampo} />
              )}
            </Campo>
            <Campo rotulo="E-mail de acesso" dica="O e-mail não pode ser alterado.">
              {props => <input {...props} type="email" value={usuario.email} disabled className={classeCampo} />}
            </Campo>
          </div>
          <div className="px-5 sm:px-6 py-4 border-t border-slate-700 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button type="button" onClick={() => setPerfilAberto(false)} className={classeBotaoSecundario}>Cancelar</button>
            <button type="submit" disabled={salvandoPerfil} className={classeBotaoPrimario}>
              {salvandoPerfil ? "Salvando..." : "Salvar perfil"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
