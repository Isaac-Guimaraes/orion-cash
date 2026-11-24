"use client";

import { useState, useEffect, useId, useRef, FormEvent } from "react";
import {
  TrendingUp, TrendingDown, Wallet, Plus, Download, CheckCircle, Pencil, Trash2, RotateCcw,
  ChevronLeft, ChevronRight, SlidersHorizontal
} from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/src/lib/api";
import { Modal } from "@/src/components/ui/Modal";
import { Campo } from "@/src/components/ui/Campo";
import { useFeedback, mensagemDeErro } from "@/src/components/ui/Feedback";
import {
  formatarMoeda, formatarData, dataIsoLocal, converterValor, valorParaCampo, STATUS_TRANSACAO, textoDoErro
} from "@/src/lib/formatos";
import {
  classeBotaoIcone, classeBotaoPrimario, classeBotaoSecundario, classeCampo, classeCartao, foco
} from "@/src/lib/estilos";

type Tipo = "RECEITA" | "DESPESA";

interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  tipo: Tipo;
  data: string;
  status: "PENDENTE" | "PAGO" | "CANCELADO";
  categoriaId?: string;
  veiculoId?: string | null;
  categoria?: { id: string; nome: string };
  veiculo?: { id: string; placa: string } | null;
}

interface Categoria {
  id: string;
  nome: string;
  tipo: Tipo;
  subcategorias?: Categoria[];
}

interface Veiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
}

const FORMULARIO_VAZIO = {
  descricao: "",
  valor: "",
  tipo: "DESPESA" as Tipo,
  data: "",
  status: "",
  categoriaId: "",
  veiculoId: "",
};

type ErrosFormulario = Partial<Record<keyof typeof FORMULARIO_VAZIO, string>>;

interface Totais {
  receitas: number;
  despesas: number;
  saldo: number;
}

// Resposta de GET /transacoes?pagina=N
interface PaginaTransacoes {
  itens: Transacao[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
  totais: Totais;
}

const FILTROS_VAZIOS = { dataInicio: "", dataFim: "", tipo: "", status: "", categoriaId: "", veiculoId: "" };
type Filtros = typeof FILTROS_VAZIOS;

const OPCOES_POR_PAGINA = [10, 20, 50];
const ESPERA_DA_BUSCA_MS = 400;

// Filtros em parâmetros de URL (só os preenchidos), no formato que a API espera
function montarParametros(filtros: Filtros, busca: string) {
  const parametros = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) if (valor) parametros.set(chave, valor);
  if (busca) parametros.set("busca", busca);
  return parametros;
}

function periodoDoMesAtual() {
  const hoje = new Date();
  return {
    dataInicio: dataIsoLocal(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),
    dataFim: dataIsoLocal(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)),
  };
}

export default function FinanceiroPage() {
  const router = useRouter();
  const { avisar, confirmar } = useFeedback();
  const idPorPagina = useId();

  // Lista paginada: o servidor filtra, ordena e devolve só a página pedida
  const [resultado, setResultado] = useState<PaginaTransacoes | null>(null);
  const [resumoMes, setResumoMes] = useState<Totais | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [versao, setVersao] = useState(0); // muda para recarregar depois de salvar, excluir ou tentar de novo

  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
  const [busca, setBusca] = useState(""); // o que está digitado
  const [buscaAplicada, setBuscaAplicada] = useState(""); // o que já foi enviado (após a pausa na digitação)
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [porPagina, setPorPagina] = useState(20);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false); // só no celular
  const [exportando, setExportando] = useState(false);
  const secaoTabela = useRef<HTMLElement>(null);
  const campoBusca = useRef<HTMLInputElement>(null);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [formData, setFormData] = useState(FORMULARIO_VAZIO);

  const token = () => localStorage.getItem("@OrionCash:token");
  const cabecalhos = () => ({ Authorization: `Bearer ${token()}` });
  const atualizarDados = () => setVersao(v => v + 1);

  const erroPeriodo = filtros.dataInicio && filtros.dataFim && filtros.dataFim < filtros.dataInicio
    ? "A data final deve ser igual ou posterior à data inicial."
    : null;

  // Categorias e veículos: alimentam os filtros e o formulário
  useEffect(() => {
    if (!token()) {
      router.push("/login");
      return;
    }
    Promise.all([
      fetch(`${API_URL}/categorias`, { headers: cabecalhos() }),
      fetch(`${API_URL}/veiculos`, { headers: cabecalhos() }),
    ])
      .then(async ([rCategorias, rVeiculos]) => {
        if (rCategorias.ok) setCategorias(await rCategorias.json());
        if (rVeiculos.ok) setVeiculos(await rVeiculos.json());
      })
      .catch(() => { /* sem as listas, os filtros de texto, data, tipo e situação continuam funcionando */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cartões do mês atual: somados no servidor (a tela só tem uma página dos lançamentos)
  useEffect(() => {
    const controle = new AbortController();
    fetch(`${API_URL}/transacoes/resumo?${new URLSearchParams(periodoDoMesAtual())}`, { headers: cabecalhos(), signal: controle.signal })
      .then(async r => { if (r.ok) setResumoMes(await r.json()); })
      .catch(() => { /* os cartões ficam com "—" */ });
    return () => controle.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versao]);

  // Busca só é enviada depois de uma pausa na digitação, para não consultar a cada tecla
  useEffect(() => {
    const termo = busca.trim();
    if (termo === buscaAplicada) return;
    const espera = setTimeout(() => {
      setBuscaAplicada(termo);
      setPaginaAtual(1);
    }, ESPERA_DA_BUSCA_MS);
    return () => clearTimeout(espera);
  }, [busca, buscaAplicada]);

  // Página da lista. A resposta de uma consulta antiga é descartada se o usuário já mudou os filtros.
  useEffect(() => {
    if (erroPeriodo) return;
    const controle = new AbortController();

    async function carregarPagina() {
      setCarregando(true);
      setErroCarga(null);
      try {
        const parametros = montarParametros(filtros, buscaAplicada);
        parametros.set("pagina", String(paginaAtual));
        parametros.set("porPagina", String(porPagina));
        const resposta = await fetch(`${API_URL}/transacoes?${parametros}`, { headers: cabecalhos(), signal: controle.signal });
        if (!resposta.ok) throw new Error(await mensagemDeErro(resposta, "Não foi possível carregar as movimentações."));
        const dados: PaginaTransacoes = await resposta.json();

        // A página ficou vazia (ex.: excluiu o último item dela): vai para a última que existe
        if (dados.itens.length === 0 && dados.total > 0 && paginaAtual > dados.totalPaginas) {
          setPaginaAtual(dados.totalPaginas);
          return;
        }
        setResultado(dados);
      } catch (erro) {
        if (!controle.signal.aborted) {
          setErroCarga(textoDoErro(erro, "Não foi possível carregar as movimentações. Verifique sua conexão."));
        }
      } finally {
        if (!controle.signal.aborted) setCarregando(false);
      }
    }

    carregarPagina();
    return () => controle.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros, buscaAplicada, paginaAtual, porPagina, versao, erroPeriodo]);

  function mudarFiltro(chave: keyof Filtros, valor: string) {
    setFiltros(atuais => {
      const novos = { ...atuais, [chave]: valor };
      // Ao escolher um tipo, uma categoria do outro tipo deixa de valer
      if (chave === "tipo" && valor && novos.categoriaId) {
        const todas = categorias.flatMap(c => [c, ...(c.subcategorias ?? [])]);
        if (todas.find(c => c.id === novos.categoriaId)?.tipo !== valor) novos.categoriaId = "";
      }
      return novos;
    });
    setPaginaAtual(1);
  }

  function irParaPagina(numero: number) {
    if (!resultado || numero < 1 || numero > resultado.totalPaginas || numero === paginaAtual) return;
    setPaginaAtual(numero);
    // Leva o início da tabela para a vista; sem animação para quem prefere menos movimento
    const semAnimacao = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    secaoTabela.current?.scrollIntoView({ behavior: semAnimacao ? "auto" : "smooth", block: "start" });
  }

  const abrirModalNovo = () => {
    setEditandoId(null);
    setFormData({ ...FORMULARIO_VAZIO, data: dataIsoLocal() });
    setErros({});
    setErroModal(null);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (t: Transacao) => {
    setFormData({
      descricao: t.descricao,
      valor: valorParaCampo(t.valor),
      tipo: t.tipo,
      data: t.data.slice(0, 10),
      status: t.status,
      categoriaId: t.categoriaId ?? t.categoria?.id ?? "",
      veiculoId: t.veiculoId ?? t.veiculo?.id ?? "",
    });
    setEditandoId(t.id);
    setErros({});
    setErroModal(null);
    setIsModalOpen(true);
  };

  function validar(): ErrosFormulario {
    const novos: ErrosFormulario = {};
    if (!formData.descricao.trim()) novos.descricao = "Descreva a movimentação.";
    const valor = converterValor(formData.valor);
    if (!Number.isFinite(valor) || valor <= 0) novos.valor = "Informe um valor maior que zero, por exemplo 1.250,50.";
    if (!formData.data) novos.data = "Informe a data.";
    if (!formData.categoriaId) novos.categoriaId = "Escolha uma categoria.";
    if (!formData.status) novos.status = "Escolha se já foi pago ou se está pendente.";
    return novos;
  }

  async function handleSalvarTransacao(e: FormEvent) {
    e.preventDefault();
    setErroModal(null);
    const novosErros = validar();
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        descricao: formData.descricao.trim(),
        valor: converterValor(formData.valor),
        tipo: formData.tipo,
        status: formData.status,
        data: formData.data,
        categoriaId: formData.categoriaId,
        veiculoId: formData.veiculoId || null,
      };
      const resposta = await fetch(editandoId ? `${API_URL}/transacoes/${editandoId}` : `${API_URL}/transacoes`, {
        method: editandoId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(payload),
      });
      if (!resposta.ok) throw new Error(await mensagemDeErro(resposta, "Não foi possível salvar a movimentação."));

      setIsModalOpen(false);
      avisar(editandoId ? "Movimentação atualizada." : "Movimentação registrada.");
      atualizarDados();
    } catch (err) {
      setErroModal(textoDoErro(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleExcluirTransacao(t: Transacao) {
    const ok = await confirmar({
      titulo: "Excluir movimentação",
      mensagem: <>Excluir <strong className="text-white">{t.descricao}</strong> ({formatarMoeda(t.valor)})? Esta ação não pode ser desfeita.</>,
      textoConfirmar: "Excluir",
      perigoso: true,
    });
    if (!ok) return;
    try {
      const resposta = await fetch(`${API_URL}/transacoes/${t.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!resposta.ok) throw new Error(await mensagemDeErro(resposta, "Não foi possível excluir a movimentação."));
      avisar("Movimentação excluída.");
      atualizarDados();
    } catch (err) {
      avisar(textoDoErro(err), "erro");
    }
  }

  async function handleMarcarComoPago(t: Transacao) {
    try {
      const resposta = await fetch(`${API_URL}/transacoes/${t.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ status: "PAGO" }),
      });
      if (!resposta.ok) throw new Error(await mensagemDeErro(resposta, "Não foi possível marcar como pago."));
      avisar(`"${t.descricao}" marcada como paga.`);
      atualizarDados(); // com o filtro "Pendente", ela sai da lista
    } catch (err) {
      avisar(textoDoErro(err), "erro");
    }
  }

  const quantidadeFiltros = Object.values(filtros).filter(Boolean).length;
  const temFiltro = quantidadeFiltros > 0 || busca.trim() !== "";
  const temFiltroAplicado = quantidadeFiltros > 0 || buscaAplicada !== "";

  const limparFiltros = () => {
    setFiltros(FILTROS_VAZIOS);
    setBusca("");
    setBuscaAplicada("");
    setPaginaAtual(1);
    // O botão fica desabilitado sem filtros: o foco vai para a busca em vez de se perder
    campoBusca.current?.focus();
  };

  // Exporta TODOS os lançamentos filtrados (não só a página visível) em CSV para Excel/Planilhas
  async function exportarCsv() {
    if (erroPeriodo) {
      avisar(erroPeriodo, "erro");
      return;
    }
    setExportando(true);
    try {
      const resposta = await fetch(`${API_URL}/transacoes?${montarParametros(filtros, busca.trim())}`, { headers: cabecalhos() });
      if (!resposta.ok) throw new Error(await mensagemDeErro(resposta, "Não foi possível exportar as movimentações."));
      const lista: Transacao[] = await resposta.json();
      if (lista.length === 0) {
        avisar("Não há movimentações para exportar com os filtros atuais.", "erro");
        return;
      }
      baixarCsv(lista);
      avisar(`${lista.length} movimentação(ões) exportada(s) em CSV.`);
    } catch (err) {
      avisar(textoDoErro(err), "erro");
    } finally {
      setExportando(false);
    }
  }

  function baixarCsv(lista: Transacao[]) {
    const celula = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const linhas = [
      ["Data", "Descrição", "Tipo", "Categoria", "Veículo", "Status", "Valor (R$)"],
      ...lista.map(t => [
        formatarData(t.data),
        t.descricao,
        t.tipo === "RECEITA" ? "Receita" : "Despesa",
        t.categoria?.nome ?? "",
        t.veiculo?.placa ?? "",
        STATUS_TRANSACAO[t.status] ?? t.status,
        (t.tipo === "DESPESA" ? -t.valor : t.valor).toFixed(2).replace(".", ","),
      ]),
    ];
    // ";" e BOM UTF-8: é o que o Excel em português abre corretamente
    const csv = "﻿" + linhas.map(l => l.map(celula).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `orion-movimentacoes-${dataIsoLocal()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const categoriasDoTipo = categorias.filter(c => c.tipo === formData.tipo);
  const categoriasDoFiltro = categorias.filter(c => !filtros.tipo || c.tipo === filtros.tipo);

  // "Mostrando 21–40 de 66"
  const primeiroDaPagina = resultado && resultado.total > 0 ? (resultado.pagina - 1) * resultado.porPagina + 1 : 0;
  const ultimoDaPagina = resultado ? primeiroDaPagina + resultado.itens.length - 1 : 0;
  const classeBotaoPagina =
    `${classeBotaoSecundario} px-3 aria-disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:hover:bg-orion-bg`;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">Movimentações financeiras</h1>
          <p className="text-slate-400 text-sm mt-1">Gerencie as receitas e despesas da empresa.</p>
        </div>
        <button type="button" onClick={abrirModalNovo} className={classeBotaoPrimario}>
          <Plus size={18} aria-hidden="true" /> Novo lançamento
        </button>
      </div>

      {/* KPIs */}
      <section aria-label="Resumo do mês" className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {[
          { rotulo: "Receitas do mês", valor: resumoMes?.receitas, Icone: TrendingUp, cor: "text-emerald-400 bg-emerald-500/10" },
          { rotulo: "Despesas do mês", valor: resumoMes?.despesas, Icone: TrendingDown, cor: "text-rose-400 bg-rose-500/10" },
          { rotulo: "Saldo líquido do mês", valor: resumoMes?.saldo, Icone: Wallet, cor: "text-orion-primary bg-orion-primary/10" },
        ].map(({ rotulo, valor, Icone, cor }) => (
          <div key={rotulo} className={`${classeCartao} p-5 md:p-6`}>
            <div className="flex justify-between items-start mb-4">
              <p className="text-slate-300 text-sm font-medium">{rotulo}</p>
              <span className={`w-8 h-8 rounded-md flex items-center justify-center ${cor}`} aria-hidden="true">
                <Icone size={18} />
              </span>
            </div>
            {valor === undefined ? (
              <p className="text-2xl md:text-3xl font-bold text-slate-400" aria-busy="true">
                <span aria-hidden="true">—</span><span className="sr-only">Carregando</span>
              </p>
            ) : (
              <p className={`text-2xl md:text-3xl font-bold ${valor < 0 ? "text-rose-400" : "text-white"}`}>{formatarMoeda(valor)}</p>
            )}
          </div>
        ))}
      </section>

      {/* FILTROS */}
      <section aria-label="Filtros" className={`${classeCartao} rounded-xl p-4 space-y-4`}>
        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
          <Campo rotulo="Buscar por descrição ou placa" className="flex-1">
            {p => (
              <input {...p} ref={campoBusca} type="search" maxLength={100} placeholder="Ex.: diesel ou ABC1D23"
                value={busca} onChange={e => setBusca(e.target.value)} className={classeCampo} />
            )}
          </Campo>
          <div className="grid grid-cols-1 sm:flex gap-3">
            <button
              type="button"
              onClick={() => setFiltrosAbertos(!filtrosAbertos)}
              aria-expanded={filtrosAbertos}
              aria-controls="filtros-avancados"
              className={`${classeBotaoSecundario} md:hidden`}
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
              {filtrosAbertos ? "Ocultar filtros" : "Mais filtros"}
              {quantidadeFiltros > 0 && ` (${quantidadeFiltros} ativo${quantidadeFiltros > 1 ? "s" : ""})`}
            </button>
            <button type="button" onClick={limparFiltros} disabled={!temFiltro} className={classeBotaoSecundario}>
              <RotateCcw size={16} aria-hidden="true" /> Limpar filtros
            </button>
            <button type="button" onClick={() => { if (!exportando) exportarCsv(); }} aria-disabled={exportando} className={`${classeBotaoSecundario} aria-disabled:opacity-60 aria-disabled:cursor-wait`}>
              <Download size={16} aria-hidden="true" /> {exportando ? "Exportando..." : "Exportar CSV"}
            </button>
          </div>
        </div>

        {/* No celular ficam recolhidos atrás de "Mais filtros"; a partir de md, sempre visíveis */}
        <div id="filtros-avancados" className={`${filtrosAbertos ? "grid" : "hidden"} md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4`}>
          <Campo rotulo="Data inicial">
            {p => <input {...p} type="date" value={filtros.dataInicio} onChange={e => mudarFiltro("dataInicio", e.target.value)} className={classeCampo} />}
          </Campo>
          <Campo rotulo="Data final" erro={erroPeriodo}>
            {p => <input {...p} type="date" value={filtros.dataFim} min={filtros.dataInicio || undefined} onChange={e => mudarFiltro("dataFim", e.target.value)} className={classeCampo} />}
          </Campo>
          <Campo rotulo="Tipo">
            {p => (
              <select {...p} value={filtros.tipo} onChange={e => mudarFiltro("tipo", e.target.value)} className={classeCampo}>
                <option value="">Receitas e despesas</option>
                <option value="RECEITA">Só receitas</option>
                <option value="DESPESA">Só despesas</option>
              </select>
            )}
          </Campo>
          <Campo rotulo="Situação">
            {p => (
              <select {...p} value={filtros.status} onChange={e => mudarFiltro("status", e.target.value)} className={classeCampo}>
                <option value="">Todas as situações</option>
                {Object.entries(STATUS_TRANSACAO).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
              </select>
            )}
          </Campo>
          <Campo rotulo="Categoria">
            {p => (
              <select {...p} value={filtros.categoriaId} onChange={e => mudarFiltro("categoriaId", e.target.value)} className={classeCampo}>
                <option value="">Todas as categorias</option>
                {categoriasDoFiltro.map(c => (
                  <optgroup key={c.id} label={`${c.nome} (${c.tipo === "RECEITA" ? "receita" : "despesa"})`}>
                    <option value={c.id}>{c.nome} — todas</option>
                    {(c.subcategorias ?? []).map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </optgroup>
                ))}
              </select>
            )}
          </Campo>
          <Campo rotulo="Veículo">
            {p => (
              <select {...p} value={filtros.veiculoId} onChange={e => mudarFiltro("veiculoId", e.target.value)} className={classeCampo}>
                <option value="">Todos os veículos</option>
                {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>)}
              </select>
            )}
          </Campo>
        </div>
      </section>

      {/* TABELA */}
      {/* Carregando, erro e vazio ficam fora da tabela: numa célula da tabela rolável o texto sairia cortado no celular */}
      <section ref={secaoTabela} aria-label="Movimentações" aria-busy={carregando} className={`${classeCartao} rounded-xl scroll-mt-4`}>
        {/* Resumo do que foi encontrado: anunciado pelo leitor de tela quando os filtros mudam */}
        <div role="status" className="px-4 md:px-6 py-3 border-b border-slate-700/50 text-sm text-slate-300 flex flex-wrap items-center gap-x-5 gap-y-1 min-h-12">
          {erroCarga ? null : !resultado ? (
            "Carregando movimentações..."
          ) : (
            <>
              <span>
                <strong className="text-white">{resultado.total}</strong> movimentaç{resultado.total === 1 ? "ão" : "ões"}
                {temFiltroAplicado ? (resultado.total === 1 ? " encontrada" : " encontradas") : ""}
              </span>
              {resultado.total > 0 && (
                <>
                  <span>Receitas: <strong className="text-emerald-400">{formatarMoeda(resultado.totais.receitas)}</strong></span>
                  <span>Despesas: <strong className="text-rose-400">{formatarMoeda(resultado.totais.despesas)}</strong></span>
                  <span className="text-xs text-slate-400">Somas sem os cancelados</span>
                </>
              )}
              {carregando && <span className="text-slate-400">Atualizando...</span>}
            </>
          )}
        </div>

        {erroCarga ? (
          <div className="px-6 py-10 text-center">
            <p className="text-rose-400 mb-3">{erroCarga}</p>
            <button type="button" onClick={atualizarDados} className={classeBotaoSecundario}>Tentar de novo</button>
          </div>
        ) : !resultado ? null : resultado.total === 0 ? (
          <p className="px-6 py-10 text-center text-slate-300">
            {!temFiltroAplicado
              ? <>Nenhuma movimentação registrada ainda. Use <strong className="text-white">Novo lançamento</strong> para registrar a primeira, ou gere as faturas dos contratos em <strong className="text-white">Contratos</strong>.</>
              : <>Nenhuma movimentação encontrada com estes filtros. <button type="button" onClick={limparFiltros} className={`underline text-orion-primary rounded ${foco}`}>Limpar filtros</button></>}
          </p>
        ) : (
        <>
        <div className={`overflow-x-auto motion-safe:transition-opacity ${carregando ? "opacity-60" : ""}`}>
          <table className="w-full text-left text-sm whitespace-nowrap">
            <caption className="sr-only">
              Movimentações financeiras{temFiltroAplicado ? " (filtradas)" : ""}: página {resultado.pagina} de {resultado.totalPaginas}, {primeiroDaPagina} a {ultimoDaPagina} de {resultado.total}
            </caption>
            <thead className="bg-orion-bg/50 text-slate-300 text-xs font-bold tracking-wide uppercase border-b border-slate-700/50">
              <tr>
                <th scope="col" className="px-4 md:px-6 py-4">Data</th>
                <th scope="col" className="px-4 md:px-6 py-4">Descrição</th>
                <th scope="col" className="px-4 md:px-6 py-4">Veículo</th>
                <th scope="col" className="px-4 md:px-6 py-4">Categoria</th>
                <th scope="col" className="px-4 md:px-6 py-4">Status</th>
                <th scope="col" className="px-4 md:px-6 py-4 text-right">Valor</th>
                <th scope="col" className="px-4 md:px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {resultado.itens.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 md:px-6 py-4 text-slate-300">{formatarData(t.data)}</td>
                    <td className="px-4 md:px-6 py-4 text-white font-medium">{t.descricao}</td>
                    <td className="px-4 md:px-6 py-4">
                      {t.veiculo ? <span className="text-cyan-300 font-mono text-xs font-bold tracking-widest">{t.veiculo.placa}</span> : <span className="text-slate-400" aria-label="Sem veículo">—</span>}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-slate-300">{t.categoria?.nome ?? "—"}</td>
                    <td className="px-4 md:px-6 py-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        t.status === "PAGO" ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" :
                        t.status === "PENDENTE" ? "text-amber-300 bg-amber-500/10 border-amber-500/30" :
                        "text-rose-300 bg-rose-500/10 border-rose-500/30"
                      }`}>
                        {STATUS_TRANSACAO[t.status] ?? t.status}
                      </span>
                    </td>
                    <td className={`px-4 md:px-6 py-4 text-right font-bold ${t.tipo === "RECEITA" ? "text-emerald-400" : "text-rose-400"}`}>
                      <span className="sr-only">{t.tipo === "RECEITA" ? "Receita de " : "Despesa de "}</span>
                      <span aria-hidden="true">{t.tipo === "RECEITA" ? "+ " : "− "}</span>{formatarMoeda(t.valor)}
                    </td>
                    <td className="px-4 md:px-6 py-2">
                      <div className="flex justify-center gap-1">
                        {t.status === "PENDENTE" && (
                          <button type="button" onClick={() => handleMarcarComoPago(t)} className={`${classeBotaoIcone} text-emerald-400`} aria-label={`Marcar "${t.descricao}" como paga`} title="Marcar como pago">
                            <CheckCircle size={18} aria-hidden="true" />
                          </button>
                        )}
                        <button type="button" onClick={() => abrirModalEditar(t)} className={classeBotaoIcone} aria-label={`Editar "${t.descricao}"`} title="Editar">
                          <Pencil size={18} aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => handleExcluirTransacao(t)} className={`${classeBotaoIcone} text-rose-400`} aria-label={`Excluir "${t.descricao}"`} title="Excluir">
                          <Trash2 size={18} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <nav aria-label="Paginação das movimentações" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 md:px-6 py-4 border-t border-slate-700/50 text-sm">
          <p className="text-slate-300">
            Mostrando <strong className="text-white">{primeiroDaPagina}–{ultimoDaPagina}</strong> de <strong className="text-white">{resultado.total}</strong>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor={idPorPagina} className="text-slate-300 whitespace-nowrap">Por página</label>
              <select
                id={idPorPagina}
                value={porPagina}
                onChange={e => { setPorPagina(Number(e.target.value)); setPaginaAtual(1); }}
                className={classeCampo.replace("w-full", "w-auto")}
              >
                {OPCOES_POR_PAGINA.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            {/* aria-disabled em vez de disabled: o botão continua focável e o foco não se perde na primeira/última página */}
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => irParaPagina(paginaAtual - 1)} aria-disabled={paginaAtual <= 1} className={classeBotaoPagina}>
                <ChevronLeft size={16} aria-hidden="true" /> Anterior
              </button>
              <span className="text-slate-300 whitespace-nowrap px-1">
                Página <strong className="text-white">{resultado.pagina}</strong> de {resultado.totalPaginas}
              </span>
              <button type="button" onClick={() => irParaPagina(paginaAtual + 1)} aria-disabled={paginaAtual >= resultado.totalPaginas} className={classeBotaoPagina}>
                Próxima <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </nav>
        </>
        )}
      </section>

      {/* NOVO / EDITAR LANÇAMENTO */}
      <Modal
        aberto={isModalOpen}
        aoFechar={() => setIsModalOpen(false)}
        titulo={editandoId ? "Editar lançamento" : "Novo lançamento"}
        icone={<Wallet size={20} />}
      >
        <form onSubmit={handleSalvarTransacao} noValidate className="p-5 sm:p-6 space-y-5">
          {erroModal && (
            <div role="alert" className="bg-rose-500/10 border border-rose-500/40 text-rose-300 text-sm p-3 rounded-lg">{erroModal}</div>
          )}

          <fieldset>
            <legend className="block text-sm font-medium text-slate-300 mb-1.5">Tipo</legend>
            <div className="grid grid-cols-2 gap-3">
              {(["RECEITA", "DESPESA"] as Tipo[]).map(tipo => {
                const marcado = formData.tipo === tipo;
                const Icone = tipo === "RECEITA" ? TrendingUp : TrendingDown;
                return (
                  <label
                    key={tipo}
                    className={`flex items-center justify-center gap-2 min-h-11 p-3 rounded-xl border cursor-pointer font-bold text-sm transition-colors
                      has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-orion-primary
                      ${marcado
                        ? tipo === "RECEITA" ? "bg-emerald-500/10 border-emerald-400 text-emerald-300" : "bg-rose-500/10 border-rose-400 text-rose-300"
                        : "border-slate-600 text-slate-300 hover:border-slate-400"}`}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value={tipo}
                      className="sr-only"
                      checked={marcado}
                      onChange={() => setFormData({ ...formData, tipo, categoriaId: "" })}
                    />
                    <Icone size={16} aria-hidden="true" /> {tipo === "RECEITA" ? "Receita" : "Despesa"}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo rotulo="Descrição" erro={erros.descricao} className="sm:col-span-2">
              {p => (
                <input {...p} type="text" autoComplete="off" placeholder={formData.tipo === "DESPESA" ? "Ex.: Diesel do Volare ABC1D23" : "Ex.: Viagem extra para a escola municipal"}
                  value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} className={classeCampo} />
              )}
            </Campo>

            <Campo rotulo="Valor (R$)" erro={erros.valor} dica="Use vírgula para os centavos.">
              {p => (
                <input {...p} type="text" inputMode="decimal" autoComplete="off" placeholder="1.250,50"
                  value={formData.valor} onChange={e => setFormData({ ...formData, valor: e.target.value })} className={`${classeCampo} font-mono`} />
              )}
            </Campo>

            <Campo rotulo="Data" erro={erros.data}>
              {p => <input {...p} type="date" value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} className={classeCampo} />}
            </Campo>

            <Campo rotulo="Categoria" erro={erros.categoriaId}>
              {p => (
                <select {...p} value={formData.categoriaId} onChange={e => setFormData({ ...formData, categoriaId: e.target.value })} className={classeCampo}>
                  <option value="">Selecione...</option>
                  {categoriasDoTipo.map(c => (
                    <optgroup key={c.id} label={c.nome}>
                      <option value={c.id}>{c.nome} (geral)</option>
                      {(c.subcategorias ?? []).map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </optgroup>
                  ))}
                </select>
              )}
            </Campo>

            <Campo rotulo="Veículo" opcional>
              {p => (
                <select {...p} value={formData.veiculoId} onChange={e => setFormData({ ...formData, veiculoId: e.target.value })} className={classeCampo}>
                  <option value="">Nenhum (despesa geral)</option>
                  {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</option>)}
                </select>
              )}
            </Campo>

            <Campo rotulo="Situação do pagamento" erro={erros.status} className="sm:col-span-2">
              {p => (
                <select {...p} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className={classeCampo}>
                  <option value="">Selecione...</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="PAGO">Pago</option>
                  {editandoId && <option value="CANCELADO">Cancelado</option>}
                </select>
              )}
            </Campo>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-700">
            <button type="button" onClick={() => setIsModalOpen(false)} className={`${classeBotaoSecundario} flex-1`}>Cancelar</button>
            <button type="submit" disabled={isSubmitting} className={`${classeBotaoPrimario} flex-1`}>
              {isSubmitting ? "Salvando..." : editandoId ? "Salvar alterações" : "Salvar lançamento"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
