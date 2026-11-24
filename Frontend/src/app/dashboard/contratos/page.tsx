"use client";

import { useState, useEffect, FormEvent } from "react";
import { Building2, Plus, DollarSign, FileText, Trash2, Pencil, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/src/lib/api";
import { Modal } from "@/src/components/ui/Modal";
import { Campo } from "@/src/components/ui/Campo";
import { useFeedback, mensagemDeErro } from "@/src/components/ui/Feedback";
import {
  formatarMoeda, formatarData, dataIsoLocal, converterValor, valorParaCampo, mascaraCnpj, textoDoErro
} from "@/src/lib/formatos";
import {
  classeBotaoIcone, classeBotaoPrimario, classeBotaoSecundario, classeCampo, classeCartao
} from "@/src/lib/estilos";

interface Contrato {
  id: string;
  nomeCliente: string;
  cnpj: string;
  valorTotal: number | null;
  valorMensal: number;
  dataInicio: string;
  dataTermino: string;
  ativo: boolean;
}

const FORMULARIO_VAZIO = { nomeCliente: "", cnpj: "", valorTotal: "", dataInicio: "", dataTermino: "" };
type ErrosFormulario = Partial<Record<keyof typeof FORMULARIO_VAZIO, string>>;

/** Mesma regra do backend (API/src/utils/datas.ts → calcularMesesDeDuracao). */
function previaParcelas(valorTotal: number, dataInicio: string, dataTermino: string): string | null {
  if (!Number.isFinite(valorTotal) || valorTotal <= 0 || !dataInicio || !dataTermino || dataTermino <= dataInicio) return null;
  const [ai, mi, di] = dataInicio.split("-").map(Number);
  const [at, mt, dt] = dataTermino.split("-").map(Number);
  let meses = at * 12 + mt - (ai * 12 + mi);
  if (dt > di) meses += 1;
  meses = Math.max(meses, 1);
  const totalCentavos = Math.round(valorTotal * 100);
  const parcela = Math.floor(totalCentavos / meses) / 100;
  const ultima = (totalCentavos - Math.floor(totalCentavos / meses) * (meses - 1)) / 100;
  return ultima !== parcela
    ? `Serão ${meses} parcelas de ${formatarMoeda(parcela)} (a última de ${formatarMoeda(ultima)}).`
    : `Serão ${meses} parcela(s) mensal(is) de ${formatarMoeda(parcela)}.`;
}

export default function ContratosPage() {
  const router = useRouter();
  const { avisar, confirmar } = useFeedback();

  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erroCarga, setErroCarga] = useState<string | null>(null);

  const [filtroBusca, setFiltroBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editando, setEditando] = useState<Contrato | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [formData, setFormData] = useState(FORMULARIO_VAZIO);
  const [isGerando, setIsGerando] = useState(false);

  const token = () => localStorage.getItem("@OrionCash:token");

  async function buscarContratos() {
    setErroCarga(null);
    try {
      if (!token()) return router.push("/login");
      const resposta = await fetch(`${API_URL}/contratos`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!resposta.ok) throw new Error(await mensagemDeErro(resposta, "Não foi possível carregar os contratos."));
      setContratos(await resposta.json());
    } catch (erro) {
      setErroCarga(textoDoErro(erro, "Não foi possível carregar os contratos. Verifique sua conexão."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    buscarContratos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGerarFaturamento() {
    setIsGerando(true);
    try {
      const resposta = await fetch(`${API_URL}/contratos/faturamento`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!resposta.ok) throw new Error(await mensagemDeErro(resposta, "Não foi possível gerar as faturas."));
      const dados = await resposta.json();
      const partes = [`${dados.faturasGeradas} nova(s) fatura(s)`];
      if (dados.faturasAtualizadas) partes.push(`${dados.faturasAtualizadas} atualizada(s)`);
      if (dados.contratosForaDeVigencia) partes.push(`${dados.contratosForaDeVigencia} contrato(s) fora da vigência`);
      avisar(`Faturamento do mês processado: ${partes.join(", ")}. As faturas aparecem no Financeiro como pendentes.`);
    } catch (err) {
      avisar(textoDoErro(err), "erro");
    } finally {
      setIsGerando(false);
    }
  }

  const abrirNovo = () => {
    setEditando(null);
    setFormData(FORMULARIO_VAZIO);
    setErros({});
    setErroModal(null);
    setIsModalOpen(true);
  };

  const abrirEdicao = (c: Contrato) => {
    setEditando(c);
    setFormData({
      nomeCliente: c.nomeCliente,
      cnpj: mascaraCnpj(c.cnpj),
      valorTotal: c.valorTotal != null ? valorParaCampo(c.valorTotal) : "",
      dataInicio: c.dataInicio.slice(0, 10),
      dataTermino: c.dataTermino.slice(0, 10),
    });
    setErros({});
    setErroModal(null);
    setIsModalOpen(true);
  };

  function validar(): ErrosFormulario {
    const novos: ErrosFormulario = {};
    if (!formData.nomeCliente.trim()) novos.nomeCliente = "Informe o nome do cliente.";
    if (formData.cnpj.replace(/\D/g, "").length !== 14) novos.cnpj = "Informe os 14 dígitos do CNPJ.";
    const valor = converterValor(formData.valorTotal);
    if (!Number.isFinite(valor) || valor <= 0) novos.valorTotal = "Informe o valor total, por exemplo 120.000,00.";
    if (!formData.dataInicio) novos.dataInicio = "Informe a data de início.";
    if (!formData.dataTermino) novos.dataTermino = "Informe a data de término.";
    else if (formData.dataInicio && formData.dataTermino <= formData.dataInicio) novos.dataTermino = "O término deve ser depois do início.";
    return novos;
  }

  async function handleSalvarContrato(e: FormEvent) {
    e.preventDefault();
    setErroModal(null);
    const novosErros = validar();
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        nomeCliente: formData.nomeCliente.trim(),
        cnpj: formData.cnpj.replace(/\D/g, ""),
        valorTotal: converterValor(formData.valorTotal),
        dataInicio: formData.dataInicio,
        dataTermino: formData.dataTermino,
      };
      const resposta = await fetch(editando ? `${API_URL}/contratos/${editando.id}` : `${API_URL}/contratos`, {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(payload),
      });
      if (!resposta.ok) throw new Error(await mensagemDeErro(resposta, "Não foi possível salvar o contrato."));

      setIsModalOpen(false);
      avisar(editando ? "Contrato atualizado." : "Contrato cadastrado.");
      buscarContratos();
    } catch (err) {
      setErroModal(textoDoErro(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleExcluir(c: Contrato) {
    const ok = await confirmar({
      titulo: "Excluir contrato",
      mensagem: <>Excluir o contrato de <strong className="text-white">{c.nomeCliente}</strong>? Ele deixará de gerar faturas. As faturas já lançadas continuam no Financeiro.</>,
      textoConfirmar: "Excluir contrato",
      perigoso: true,
    });
    if (!ok) return;
    try {
      const resposta = await fetch(`${API_URL}/contratos/${c.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!resposta.ok) throw new Error(await mensagemDeErro(resposta, "Não foi possível excluir o contrato."));
      setContratos(prev => prev.filter(x => x.id !== c.id));
      avisar("Contrato excluído.");
    } catch (err) {
      avisar(textoDoErro(err), "erro");
    }
  }

  const hoje = dataIsoLocal();
  const daquiTrintaDias = (() => { const d = new Date(); d.setDate(d.getDate() + 30); return dataIsoLocal(d); })();

  const contratosFiltrados = contratos.filter(c => {
    if (filtroStatus === "ATIVOS" && !c.ativo) return false;
    if (filtroStatus === "INATIVOS" && c.ativo) return false;
    if (filtroBusca) {
      const termo = filtroBusca.toLowerCase();
      const termoDigitos = filtroBusca.replace(/\D/g, "");
      const casaNome = c.nomeCliente.toLowerCase().includes(termo);
      const casaCnpj = termoDigitos.length > 0 && c.cnpj.includes(termoDigitos);
      if (!casaNome && !casaCnpj) return false;
    }
    return true;
  });

  const contratosAtivos = contratos.filter(c => c.ativo);
  const receitaMensal = contratosAtivos.reduce((acc, c) => acc + Number(c.valorMensal), 0);
  // Comparação por string "AAAA-MM-DD": sem conversão para Date UTC
  const aVencer = contratosAtivos.filter(c => {
    const termino = c.dataTermino.slice(0, 10);
    return termino >= hoje && termino <= daquiTrintaDias;
  });

  const previa = previaParcelas(converterValor(formData.valorTotal), formData.dataInicio, formData.dataTermino);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">Contratos</h1>
          <p className="text-slate-400 text-sm mt-1">Gerencie os contratos fixos e gere as faturas de cada mês.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={handleGerarFaturamento} disabled={isGerando} className={classeBotaoSecundario}>
            <RefreshCw size={18} aria-hidden="true" className={`text-orion-accent ${isGerando ? "motion-safe:animate-spin" : ""}`} />
            {isGerando ? "Gerando faturas..." : "Gerar faturas do mês"}
          </button>
          <button type="button" onClick={abrirNovo} className={classeBotaoPrimario}>
            <Plus size={18} aria-hidden="true" /> Novo contrato
          </button>
        </div>
      </div>

      <section aria-label="Resumo dos contratos" className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className={`${classeCartao} p-5 md:p-6`}>
          <div className="flex justify-between items-start mb-4">
            <p className="text-slate-300 text-sm font-medium">Contratos ativos</p>
            <span className="w-8 h-8 rounded-md bg-orion-accent/10 text-orion-accent flex items-center justify-center" aria-hidden="true"><FileText size={18} /></span>
          </div>
          <p className="text-white text-2xl md:text-3xl font-bold">{contratosAtivos.length} <span className="text-sm text-slate-400 font-medium">cliente(s)</span></p>
        </div>

        <div className={`${classeCartao} p-5 md:p-6`}>
          <div className="flex justify-between items-start mb-4">
            <p className="text-slate-300 text-sm font-medium">Receita mensal dos contratos</p>
            <span className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center" aria-hidden="true"><DollarSign size={18} /></span>
          </div>
          <p className="text-emerald-400 text-2xl md:text-3xl font-bold">{formatarMoeda(receitaMensal)}</p>
        </div>

        <div className={`${classeCartao} p-5 md:p-6`}>
          <div className="flex justify-between items-start mb-4">
            <p className="text-slate-300 text-sm font-medium">Terminam nos próximos 30 dias</p>
            <span className="w-8 h-8 rounded-md bg-orion-primary/10 text-orion-primary flex items-center justify-center" aria-hidden="true"><AlertCircle size={18} /></span>
          </div>
          <p className={`text-2xl md:text-3xl font-bold ${aVencer.length > 0 ? "text-orion-primary" : "text-white"}`}>
            {aVencer.length} <span className="text-sm text-slate-400 font-medium">contrato(s)</span>
          </p>
        </div>
      </section>

      <section aria-label="Filtros" className={`${classeCartao} rounded-xl p-4 grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-4 items-end`}>
        <Campo rotulo="Buscar por cliente ou CNPJ">
          {p => <input {...p} type="search" placeholder="Ex.: Prefeitura ou 12.345.678" value={filtroBusca} onChange={e => setFiltroBusca(e.target.value)} className={classeCampo} />}
        </Campo>
        <Campo rotulo="Situação">
          {p => (
            <select {...p} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className={classeCampo}>
              <option value="TODOS">Todos</option>
              <option value="ATIVOS">Somente ativos</option>
              <option value="INATIVOS">Inativos</option>
            </select>
          )}
        </Campo>
      </section>

      {/* Carregando, erro e vazio ficam fora da tabela: numa célula da tabela rolável o texto sairia cortado no celular */}
      <section className={`${classeCartao} rounded-xl`}>
        {isLoading ? (
          <p role="status" className="px-6 py-10 text-center text-slate-300">Carregando contratos...</p>
        ) : erroCarga ? (
          <div className="px-6 py-10 text-center">
            <p className="text-rose-400 mb-3">{erroCarga}</p>
            <button type="button" onClick={buscarContratos} className={classeBotaoSecundario}>Tentar de novo</button>
          </div>
        ) : contratosFiltrados.length === 0 ? (
          <p className="px-6 py-10 text-center text-slate-300">
            {contratos.length === 0
              ? <>Nenhum contrato cadastrado. Use <strong className="text-white">Novo contrato</strong> para cadastrar o primeiro.</>
              : "Nenhum contrato encontrado com estes filtros."}
          </p>
        ) : (
        <div className="relative overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <caption className="sr-only">Contratos: {contratosFiltrados.length} registro(s)</caption>
            <thead className="bg-orion-bg/50 text-slate-300 text-xs font-bold tracking-wide uppercase border-b border-slate-700/50">
              <tr>
                <th scope="col" className="px-4 md:px-6 py-4">Cliente / CNPJ</th>
                <th scope="col" className="px-4 md:px-6 py-4">Início</th>
                <th scope="col" className="px-4 md:px-6 py-4">Término</th>
                <th scope="col" className="px-4 md:px-6 py-4 text-center">Situação</th>
                <th scope="col" className="px-4 md:px-6 py-4 text-right">Parcela mensal</th>
                <th scope="col" className="px-4 md:px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {contratosFiltrados.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700" aria-hidden="true">
                          <Building2 size={14} className="text-orion-primary" />
                        </span>
                        <div>
                          <p className="text-white font-bold">{c.nomeCliente}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{mascaraCnpj(c.cnpj)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-slate-300">{formatarData(c.dataInicio)}</td>
                    <td className="px-4 md:px-6 py-4 text-slate-300">{formatarData(c.dataTermino)}</td>
                    <td className="px-4 md:px-6 py-4 text-center">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        c.ativo ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" : "text-slate-300 bg-slate-500/10 border-slate-500/30"
                      }`}>
                        {c.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right font-bold text-emerald-400">{formatarMoeda(c.valorMensal)}</td>
                    <td className="px-4 md:px-6 py-2">
                      <div className="flex justify-center gap-1">
                        <button type="button" onClick={() => abrirEdicao(c)} className={classeBotaoIcone} aria-label={`Editar contrato de ${c.nomeCliente}`} title="Editar">
                          <Pencil size={18} aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => handleExcluir(c)} className={`${classeBotaoIcone} text-rose-400`} aria-label={`Excluir contrato de ${c.nomeCliente}`} title="Excluir">
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

      <Modal
        aberto={isModalOpen}
        aoFechar={() => setIsModalOpen(false)}
        titulo={editando ? "Editar contrato" : "Novo contrato"}
        icone={<ShieldCheck size={20} />}
      >
        <form onSubmit={handleSalvarContrato} noValidate className="p-5 sm:p-6 space-y-5">
          {erroModal && <div role="alert" className="bg-rose-500/10 border border-rose-500/40 text-rose-300 text-sm p-3 rounded-lg">{erroModal}</div>}

          <Campo rotulo="Nome do cliente" erro={erros.nomeCliente}>
            {p => <input {...p} type="text" autoComplete="organization" placeholder="Ex.: Prefeitura de Irecê" value={formData.nomeCliente} onChange={e => setFormData({ ...formData, nomeCliente: e.target.value })} className={classeCampo} />}
          </Campo>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo rotulo="CNPJ" erro={erros.cnpj}>
              {p => <input {...p} type="text" inputMode="numeric" autoComplete="off" placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: mascaraCnpj(e.target.value) })} className={`${classeCampo} font-mono`} />}
            </Campo>
            <Campo rotulo="Valor total do contrato (R$)" erro={erros.valorTotal} dica="A parcela mensal é calculada automaticamente.">
              {p => <input {...p} type="text" inputMode="decimal" autoComplete="off" placeholder="120.000,00" value={formData.valorTotal} onChange={e => setFormData({ ...formData, valorTotal: e.target.value })} className={`${classeCampo} font-mono`} />}
            </Campo>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo rotulo="Data de início" erro={erros.dataInicio}>
              {p => <input {...p} type="date" value={formData.dataInicio} onChange={e => setFormData({ ...formData, dataInicio: e.target.value })} className={classeCampo} />}
            </Campo>
            <Campo rotulo="Data de término" erro={erros.dataTermino}>
              {p => <input {...p} type="date" value={formData.dataTermino} onChange={e => setFormData({ ...formData, dataTermino: e.target.value })} className={classeCampo} />}
            </Campo>
          </div>

          {previa && (
            <p aria-live="polite" className="text-sm text-amber-200 bg-orion-primary/10 border border-orion-primary/30 p-3 rounded-lg">{previa}</p>
          )}
          {editando && (
            <p className="text-xs text-slate-400">Faturas pendentes do mês são ajustadas ao novo valor na próxima vez que você gerar as faturas.</p>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-700">
            <button type="button" onClick={() => setIsModalOpen(false)} className={`${classeBotaoSecundario} flex-1`}>Cancelar</button>
            <button type="submit" disabled={isSubmitting} className={`${classeBotaoPrimario} flex-1`}>
              {isSubmitting ? "Salvando..." : editando ? "Salvar alterações" : "Salvar contrato"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
