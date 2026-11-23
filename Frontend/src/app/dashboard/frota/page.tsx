"use client";

import { useState, useEffect, FormEvent } from "react";
import { Bus, Plus, Wrench, CheckCircle2, AlertTriangle, Settings2, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/src/lib/api";
import { Modal } from "@/src/components/ui/Modal";
import { Campo } from "@/src/components/ui/Campo";
import { useFeedback, mensagemDeErro } from "@/src/components/ui/Feedback";
import { STATUS_VEICULO, textoDoErro } from "@/src/lib/formatos";
import { classeBotaoPrimario, classeBotaoSecundario, classeCampo, classeCartao, foco } from "@/src/lib/estilos";

type StatusVeiculo = "ATIVO" | "MANUTENCAO" | "VENDIDO";

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  marca: string;
  ano: number;
  capacidade: number;
  status: StatusVeiculo;
}

interface FormularioVeiculo {
  placa: string;
  marca: string;
  modelo: string;
  ano: string;
  capacidade: string;
  status: StatusVeiculo;
}

const anoAtual = new Date().getFullYear();
const FORMULARIO_VAZIO: FormularioVeiculo = { placa: "", marca: "", modelo: "", ano: String(anoAtual), capacidade: "", status: "ATIVO" };
type ErrosFormulario = Partial<Record<keyof FormularioVeiculo, string>>;

/** Placa no padrão visual Mercosul (só decoração: o texto da placa continua legível). */
function PlacaMercosul({ placa }: { placa: string }) {
  const placaFormatada = placa.length === 7 ? `${placa.substring(0, 3)} ${placa.substring(3)}` : placa;
  return (
    <div className="flex flex-col w-[130px] rounded-md overflow-hidden border-2 border-slate-300 bg-white">
      <div className="bg-blue-700 h-4 w-full flex items-center justify-center" aria-hidden="true">
        <span className="text-[8px] font-bold text-white tracking-widest uppercase">Brasil</span>
      </div>
      <p className="h-10 flex items-center justify-center text-black font-extrabold tracking-widest text-lg font-mono uppercase">
        <span className="sr-only">Placa </span>{placaFormatada}
      </p>
    </div>
  );
}

export default function FrotaPage() {
  const router = useRouter();
  const { avisar, confirmar } = useFeedback();

  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erroCarga, setErroCarga] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editando, setEditando] = useState<Veiculo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [formData, setFormData] = useState<FormularioVeiculo>(FORMULARIO_VAZIO);

  const token = () => localStorage.getItem("@OrionCash:token");

  async function buscarVeiculos() {
    setErroCarga(null);
    try {
      if (!token()) return router.push("/login");
      const resposta = await fetch(`${API_URL}/veiculos`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!resposta.ok) throw new Error(await mensagemDeErro(resposta, "Não foi possível carregar a frota."));
      setVeiculos(await resposta.json());
    } catch (erro) {
      setErroCarga(textoDoErro(erro, "Não foi possível carregar a frota. Verifique sua conexão."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    buscarVeiculos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalAtivos = veiculos.filter(v => v.status === "ATIVO").length;
  const totalManutencao = veiculos.filter(v => v.status === "MANUTENCAO").length;

  const abrirNovo = () => {
    setEditando(null);
    setFormData(FORMULARIO_VAZIO);
    setErros({});
    setErroModal(null);
    setIsModalOpen(true);
  };

  const abrirEdicao = (v: Veiculo) => {
    setEditando(v);
    setFormData({ placa: v.placa, marca: v.marca, modelo: v.modelo, ano: String(v.ano), capacidade: String(v.capacidade || ""), status: v.status });
    setErros({});
    setErroModal(null);
    setIsModalOpen(true);
  };

  function validar(): ErrosFormulario {
    const novos: ErrosFormulario = {};
    if (!editando && !/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(formData.placa)) novos.placa = "Informe a placa com 7 caracteres, por exemplo ABC1D23 ou ABC1234.";
    if (!formData.marca.trim()) novos.marca = "Informe a marca.";
    if (!formData.modelo.trim()) novos.modelo = "Informe o modelo.";
    const ano = Number(formData.ano);
    if (!Number.isInteger(ano) || ano < 1950 || ano > anoAtual + 1) novos.ano = `Informe um ano entre 1950 e ${anoAtual + 1}.`;
    const lugares = Number(formData.capacidade);
    if (!Number.isInteger(lugares) || lugares < 1) novos.capacidade = "Informe a quantidade de lugares (passageiros).";
    return novos;
  }

  async function handleSalvar(e: FormEvent) {
    e.preventDefault();
    setErroModal(null);
    const novosErros = validar();
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setIsSubmitting(true);
    try {
      const comum = {
        marca: formData.marca.trim(),
        modelo: formData.modelo.trim(),
        ano: Number(formData.ano),
        capacidade: Number(formData.capacidade),
        status: formData.status,
      };
      // A placa não pode ser alterada depois do cadastro (regra do backend)
      const resposta = await fetch(editando ? `${API_URL}/veiculos/${editando.id}` : `${API_URL}/veiculos`, {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(editando ? comum : { ...comum, placa: formData.placa }),
      });
      if (!resposta.ok) throw new Error(await mensagemDeErro(resposta, "Não foi possível salvar o veículo."));

      setIsModalOpen(false);
      avisar(editando ? `Veículo ${editando.placa} atualizado.` : `Veículo ${formData.placa} cadastrado.`);
      buscarVeiculos();
    } catch (err) {
      setErroModal(textoDoErro(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleExcluir() {
    if (!editando) return;
    const ok = await confirmar({
      titulo: "Excluir veículo",
      mensagem: <>Excluir o veículo <strong className="text-white">{editando.placa}</strong> ({editando.marca} {editando.modelo})? Esta ação não pode ser desfeita.</>,
      textoConfirmar: "Excluir veículo",
      perigoso: true,
    });
    if (!ok) return;
    try {
      const resposta = await fetch(`${API_URL}/veiculos/${editando.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!resposta.ok) throw new Error(await mensagemDeErro(resposta, "Não foi possível excluir o veículo."));
      setIsModalOpen(false);
      avisar(`Veículo ${editando.placa} excluído.`);
      buscarVeiculos();
    } catch (err) {
      avisar(textoDoErro(err), "erro");
    }
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">Frota</h1>
          <p className="text-slate-400 text-sm mt-1">Acompanhe os ônibus e vans, a lotação e o que está em manutenção.</p>
        </div>
        <button type="button" onClick={abrirNovo} className={classeBotaoPrimario}>
          <Plus size={18} aria-hidden="true" /> Cadastrar veículo
        </button>
      </div>

      <section aria-label="Resumo da frota" className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {[
          { rotulo: "Total da frota", valor: veiculos.length, unidade: "veículo(s)", Icone: Bus, cor: "text-orion-accent bg-orion-accent/10" },
          { rotulo: "Em operação", valor: totalAtivos, unidade: "ativo(s)", Icone: CheckCircle2, cor: "text-emerald-400 bg-emerald-500/10" },
          { rotulo: "Em manutenção", valor: totalManutencao, unidade: "parado(s)", Icone: Wrench, cor: "text-orion-primary bg-orion-primary/10" },
        ].map(({ rotulo, valor, unidade, Icone, cor }) => (
          <div key={rotulo} className={`${classeCartao} p-5 md:p-6`}>
            <div className="flex justify-between items-start mb-4">
              <p className="text-slate-300 text-sm font-medium">{rotulo}</p>
              <span className={`w-8 h-8 rounded-md flex items-center justify-center ${cor}`} aria-hidden="true"><Icone size={18} /></span>
            </div>
            <p className="text-white text-2xl md:text-3xl font-bold">{valor} <span className="text-base text-slate-400 font-medium">{unidade}</span></p>
          </div>
        ))}
      </section>

      {isLoading ? (
        <p className="text-center py-20 text-slate-300">Carregando a frota...</p>
      ) : erroCarga ? (
        <div className="text-center py-16">
          <p className="text-rose-400 mb-3">{erroCarga}</p>
          <button type="button" onClick={buscarVeiculos} className={classeBotaoSecundario}>Tentar de novo</button>
        </div>
      ) : veiculos.length === 0 ? (
        <p className="text-center py-20 text-slate-300">
          Nenhum veículo cadastrado. Use <strong className="text-white">Cadastrar veículo</strong> para incluir o primeiro.
        </p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {veiculos.map(veiculo => (
            <li key={veiculo.id} className={`${classeCartao} p-5 md:p-6 hover:border-slate-500 transition-colors`}>
              <div className="flex justify-between items-start gap-3 mb-6">
                <PlacaMercosul placa={veiculo.placa} />
                <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${
                  veiculo.status === "ATIVO" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" :
                  veiculo.status === "MANUTENCAO" ? "bg-amber-500/10 text-amber-300 border-amber-500/30" :
                  "bg-rose-500/10 text-rose-300 border-rose-500/30"
                }`}>
                  {veiculo.status === "ATIVO" ? <CheckCircle2 size={12} aria-hidden="true" /> :
                   veiculo.status === "MANUTENCAO" ? <Wrench size={12} aria-hidden="true" /> :
                   <AlertTriangle size={12} aria-hidden="true" />}
                  {STATUS_VEICULO[veiculo.status] ?? veiculo.status}
                </span>
              </div>

              <h2 className="text-white text-xl font-bold">{veiculo.marca} {veiculo.modelo}</h2>
              <p className="text-slate-400 text-sm mb-4">Ano {veiculo.ano}</p>

              <div className="flex items-center gap-4 bg-orion-bg rounded-xl p-3 border border-slate-800">
                <div className="flex-1 flex items-center gap-2">
                  <Users size={16} className="text-slate-400" aria-hidden="true" />
                  <p className="text-slate-200 text-sm">
                    <span className="font-bold">{veiculo.capacidade || "—"}</span> lugares
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => abrirEdicao(veiculo)}
                  className={`inline-flex items-center gap-1 min-h-10 px-3 rounded-lg text-orion-primary hover:text-white hover:bg-slate-800 text-sm font-bold ${foco}`}
                  aria-label={`Gerenciar veículo ${veiculo.placa}`}
                >
                  <Settings2 size={16} aria-hidden="true" /> Gerenciar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        aberto={isModalOpen}
        aoFechar={() => setIsModalOpen(false)}
        titulo={editando ? `Gerenciar veículo ${editando.placa}` : "Cadastrar veículo"}
        icone={editando ? <Settings2 size={20} /> : <Bus size={20} />}
      >
        <form onSubmit={handleSalvar} noValidate className="p-5 sm:p-6 space-y-5">
          {erroModal && <div role="alert" className="bg-rose-500/10 border border-rose-500/40 text-rose-300 text-sm p-3 rounded-lg">{erroModal}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo rotulo="Placa" erro={erros.placa} dica={editando ? "A placa não pode ser alterada depois do cadastro." : "7 caracteres, sem hífen."} className="sm:col-span-2">
              {p => (
                <input {...p} type="text" autoComplete="off" maxLength={7} placeholder="ABC1D23" disabled={!!editando}
                  value={formData.placa} onChange={e => setFormData({ ...formData, placa: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
                  className={`${classeCampo} font-mono uppercase tracking-widest`} />
              )}
            </Campo>
            <Campo rotulo="Marca" erro={erros.marca}>
              {p => <input {...p} type="text" placeholder="Ex.: Marcopolo" value={formData.marca} onChange={e => setFormData({ ...formData, marca: e.target.value })} className={classeCampo} />}
            </Campo>
            <Campo rotulo="Modelo" erro={erros.modelo}>
              {p => <input {...p} type="text" placeholder="Ex.: Volare W9" value={formData.modelo} onChange={e => setFormData({ ...formData, modelo: e.target.value })} className={classeCampo} />}
            </Campo>
            <Campo rotulo="Ano de fabricação" erro={erros.ano}>
              {p => <input {...p} type="text" inputMode="numeric" maxLength={4} value={formData.ano} onChange={e => setFormData({ ...formData, ano: e.target.value.replace(/\D/g, "") })} className={classeCampo} />}
            </Campo>
            <Campo rotulo="Lugares (passageiros)" erro={erros.capacidade}>
              {p => <input {...p} type="text" inputMode="numeric" maxLength={3} placeholder="Ex.: 30" value={formData.capacidade} onChange={e => setFormData({ ...formData, capacidade: e.target.value.replace(/\D/g, "") })} className={classeCampo} />}
            </Campo>
            <Campo rotulo="Situação" className="sm:col-span-2">
              {p => (
                <select {...p} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as StatusVeiculo })} className={classeCampo}>
                  <option value="ATIVO">Ativo (em operação)</option>
                  <option value="MANUTENCAO">Em manutenção</option>
                  {editando && <option value="VENDIDO">Vendido</option>}
                </select>
              )}
            </Campo>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-700">
            {editando && (
              <button type="button" onClick={handleExcluir} className={`${classeBotaoSecundario} text-rose-300 border-rose-500/40 hover:bg-rose-500/10 sm:mr-auto`}>
                <Trash2 size={18} aria-hidden="true" /> Excluir
              </button>
            )}
            <button type="button" onClick={() => setIsModalOpen(false)} className={classeBotaoSecundario}>Cancelar</button>
            <button type="submit" disabled={isSubmitting} className={classeBotaoPrimario}>
              {isSubmitting ? "Salvando..." : editando ? "Salvar alterações" : "Salvar veículo"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
