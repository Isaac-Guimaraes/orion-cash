"use client";

import { useState, useEffect, FormEvent } from "react";
import { TrendingUp, TrendingDown, Wallet, Plus, Download, CheckCircle, Pencil, Trash2, RotateCcw } from "lucide-react";
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

export default function FinanceiroPage() {
  const router = useRouter();
  const { avisar, confirmar } = useFeedback();

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erroCarga, setErroCarga] = useState<string | null>(null);

  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroBusca, setFiltroBusca] = useState("");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [formData, setFormData] = useState(FORMULARIO_VAZIO);

  const token = () => localStorage.getItem("@OrionCash:token");

  async function carregarDados() {
    setErroCarga(null);
    try {
      if (!token()) return router.push("/login");
      const cabecalhos = { Authorization: `Bearer ${token()}` };
      const [rTransacoes, rCategorias, rVeiculos] = await Promise.all([
        fetch(`${API_URL}/transacoes`, { headers: cabecalhos }),
        fetch(`${API_URL}/categorias`, { headers: cabecalhos }),
        fetch(`${API_URL}/veiculos`, { headers: cabecalhos }),
      ]);
      if (!rTransacoes.ok) throw new Error(await mensagemDeErro(rTransacoes, "Não foi possível carregar as movimentações."));
      setTransacoes(await rTransacoes.json());
      if (rCategorias.ok) setCategorias(await rCategorias.json());
      if (rVeiculos.ok) setVeiculos(await rVeiculos.json());
    } catch (erro) {
      setErroCarga(textoDoErro(erro, "Não foi possível carregar as movimentações. Verifique sua conexão."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Categoria escolhida no filtro inclui as subcategorias dela
  function idsDaCategoria(id: string): string[] {
    const pai = categorias.find(c => c.id === id);
    return pai ? [pai.id, ...(pai.subcategorias ?? []).map(s => s.id)] : [id];
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
      carregarDados();
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
      setTransacoes(prev => prev.filter(x => x.id !== t.id));
      avisar("Movimentação excluída.");
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
      setTransacoes(prev => prev.map(x => (x.id === t.id ? { ...x, status: "PAGO" } : x)));
      avisar(`"${t.descricao}" marcada como paga.`);
    } catch (err) {
      avisar(textoDoErro(err), "erro");
    }
  }

  const limparFiltros = () => {
    setFiltroDataInicio("");
    setFiltroDataFim("");
    setFiltroCategoria("");
    setFiltroBusca("");
  };
  const temFiltro = Boolean(filtroDataInicio || filtroDataFim || filtroCategoria || filtroBusca);

  const transacoesFiltradas = transacoes.filter(t => {
    const data = t.data.slice(0, 10);
    if (filtroDataInicio && data < filtroDataInicio) return false;
    if (filtroDataFim && data > filtroDataFim) return false;
    if (filtroCategoria && !idsDaCategoria(filtroCategoria).includes(t.categoriaId ?? t.categoria?.id ?? "")) return false;
    if (filtroBusca) {
      const termo = filtroBusca.toLowerCase();
      const placa = t.veiculo?.placa?.toLowerCase() ?? "";
      if (!placa.includes(termo) && !t.descricao.toLowerCase().includes(termo)) return false;
    }
    return true;
  });

  // Exporta o que está na tabela (respeita os filtros) em CSV para Excel/Planilhas
  function exportarCsv() {
    if (transacoesFiltradas.length === 0) {
      avisar("Não há movimentações para exportar com os filtros atuais.", "erro");
      return;
    }
    const celula = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const linhas = [
      ["Data", "Descrição", "Tipo", "Categoria", "Veículo", "Status", "Valor (R$)"],
      ...transacoesFiltradas.map(t => [
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
    avisar(`${transacoesFiltradas.length} movimentação(ões) exportada(s) em CSV.`);
  }

  // KPIs do mês atual
  const competenciaAtual = dataIsoLocal().slice(0, 7);
  const doMes = transacoes.filter(t => t.data.slice(0, 7) === competenciaAtual && t.status !== "CANCELADO");
  const totalReceitas = doMes.reduce((acc, t) => (t.tipo === "RECEITA" ? acc + Number(t.valor) : acc), 0);
  const totalDespesas = doMes.reduce((acc, t) => (t.tipo === "DESPESA" ? acc + Number(t.valor) : acc), 0);
  const saldoLiquido = totalReceitas - totalDespesas;

  const categoriasDoTipo = categorias.filter(c => c.tipo === formData.tipo);

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
          { rotulo: "Receitas do mês", valor: totalReceitas, Icone: TrendingUp, cor: "text-emerald-400 bg-emerald-500/10" },
          { rotulo: "Despesas do mês", valor: totalDespesas, Icone: TrendingDown, cor: "text-rose-400 bg-rose-500/10" },
          { rotulo: "Saldo líquido do mês", valor: saldoLiquido, Icone: Wallet, cor: "text-orion-primary bg-orion-primary/10" },
        ].map(({ rotulo, valor, Icone, cor }) => (
          <div key={rotulo} className={`${classeCartao} p-5 md:p-6`}>
            <div className="flex justify-between items-start mb-4">
              <p className="text-slate-300 text-sm font-medium">{rotulo}</p>
              <span className={`w-8 h-8 rounded-md flex items-center justify-center ${cor}`} aria-hidden="true">
                <Icone size={18} />
              </span>
            </div>
            <p className={`text-2xl md:text-3xl font-bold ${valor < 0 ? "text-rose-400" : "text-white"}`}>{formatarMoeda(valor)}</p>
          </div>
        ))}
      </section>

      {/* FILTROS */}
      <section aria-label="Filtros" className={`${classeCartao} rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.3fr_1.3fr_auto_auto] gap-4 items-end`}>
        <Campo rotulo="Data inicial">
          {p => <input {...p} type="date" value={filtroDataInicio} onChange={e => setFiltroDataInicio(e.target.value)} className={classeCampo} />}
        </Campo>
        <Campo rotulo="Data final">
          {p => <input {...p} type="date" value={filtroDataFim} onChange={e => setFiltroDataFim(e.target.value)} className={classeCampo} />}
        </Campo>
        <Campo rotulo="Categoria">
          {p => (
            <select {...p} value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className={classeCampo}>
              <option value="">Todas as categorias</option>
              {categorias.map(c => (
                <optgroup key={c.id} label={`${c.nome} (${c.tipo === "RECEITA" ? "receita" : "despesa"})`}>
                  <option value={c.id}>{c.nome} — todas</option>
                  {(c.subcategorias ?? []).map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </optgroup>
              ))}
            </select>
          )}
        </Campo>
        <Campo rotulo="Buscar por placa ou descrição">
          {p => <input {...p} type="search" placeholder="Ex.: ABC1D23 ou diesel" value={filtroBusca} onChange={e => setFiltroBusca(e.target.value)} className={classeCampo} />}
        </Campo>
        <button type="button" onClick={limparFiltros} disabled={!temFiltro} className={classeBotaoSecundario}>
          <RotateCcw size={16} aria-hidden="true" /> Limpar filtros
        </button>
        <button type="button" onClick={exportarCsv} className={classeBotaoSecundario}>
          <Download size={16} aria-hidden="true" /> Exportar CSV
        </button>
      </section>

      {/* TABELA */}
      {/* Carregando, erro e vazio ficam fora da tabela: numa célula da tabela rolável o texto sairia cortado no celular */}
      <section className={`${classeCartao} rounded-xl`}>
        {isLoading ? (
          <p role="status" className="px-6 py-10 text-center text-slate-300">Carregando movimentações...</p>
        ) : erroCarga ? (
          <div className="px-6 py-10 text-center">
            <p className="text-rose-400 mb-3">{erroCarga}</p>
            <button type="button" onClick={carregarDados} className={classeBotaoSecundario}>Tentar de novo</button>
          </div>
        ) : transacoesFiltradas.length === 0 ? (
          <p className="px-6 py-10 text-center text-slate-300">
            {transacoes.length === 0
              ? <>Nenhuma movimentação registrada ainda. Use <strong className="text-white">Novo lançamento</strong> para registrar a primeira, ou gere as faturas dos contratos em <strong className="text-white">Contratos</strong>.</>
              : <>Nenhuma movimentação encontrada com estes filtros. <button type="button" onClick={limparFiltros} className={`underline text-orion-primary rounded ${foco}`}>Limpar filtros</button></>}
          </p>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <caption className="sr-only">
              Movimentações financeiras{temFiltro ? " (filtradas)" : ""}: {transacoesFiltradas.length} registro(s)
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
              {transacoesFiltradas.map(t => (
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
