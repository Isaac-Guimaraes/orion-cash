"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, TrendingDown, Wallet, Plus, 
  Calendar, Search, Filter, Download, X, CheckCircle, Pencil, Trash2 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/src/lib/api";

// 1. Atualizamos a interface para garantir que conseguimos ler os IDs das relações
interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  tipo: "RECEITA" | "DESPESA";
  data: string;
  status: "PENDENTE" | "PAGO" | "CANCELADO";
  categoria?: { id?: string, nome: string };
  veiculo?: { id?: string, placa: string };
  categoriaId?: string; 
  veiculoId?: string;
}

const CATEGORIAS_DB = [
  { id: "e6ad5bc2-7c72-4ccf-87bc-9cb2c2571fe8", nome: "Receita Operacional", tipo: "RECEITA" },
  { id: "92059894-4df1-4ddd-b72d-cd7f10f97f85", nome: "Viagem Extra", tipo: "RECEITA" },
  { id: "7d104204-5cf9-4733-b714-c75dae3a02bd", nome: "Contrato Fixo", tipo: "RECEITA" },
  { id: "4a5a6141-1580-47df-b30a-b89cf7c8b56f", nome: "Combustível", tipo: "DESPESA" },
  { id: "fbc5ad91-7e24-42c5-8351-fdc89580c8e2", nome: "Manutenção", tipo: "DESPESA" },
  { id: "0daa72d7-b857-4c71-9175-b5625cdda560", nome: "Administrativo", tipo: "DESPESA" },
  { id: "e145adcd-2bb1-4832-96a2-5d858a0afb6c", nome: "Sistemas", tipo: "DESPESA" },
  { id: "1dc4840e-b80f-41b3-b26a-88acdc788770", nome: "Pró-labore", tipo: "DESPESA" },
  { id: "a4913395-fe0f-49e3-87af-cf04592c2e58", nome: "Salários", tipo: "DESPESA" },
  { id: "508592d2-ccd2-476f-a4da-ddf01d9e7847", nome: "Contabilidade", tipo: "DESPESA" },
  { id: "824590cb-100d-44e7-a8e3-55fc95f403b8", nome: "Lavagem", tipo: "DESPESA" },
  { id: "a64b3bb8-9d9a-4e28-96b7-1ce6c0f88c23", nome: "Troca de Óleo", tipo: "DESPESA" },
  { id: "42200f04-db96-4bbf-8e89-ce3317bcb22b", nome: "Funilaria", tipo: "DESPESA" },
  { id: "6a2fd21d-f5a8-4628-a996-8d37317d75da", nome: "Elétrica", tipo: "DESPESA" },
  { id: "789a9ec1-5e2f-4d48-930e-64b3a9336d38", nome: "Mecânica", tipo: "DESPESA" },
  { id: "5e87824a-9c23-4c8f-8b6c-103c9b3f6211", nome: "Pneus", tipo: "DESPESA" }
];

export default function FinanceiroPage() {
  const router = useRouter();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ESTADOS DOS FILTROS
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroBusca, setFiltroBusca] = useState("");

  // ESTADO DO MENU DE AÇÕES ("...")
  const [menuAbertoId, setMenuAbertoId] = useState<string | null>(null);

  // 🚀 ESTADO QUE CONTROLA SE ESTAMOS A EDITAR OU A CRIAR
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    tipo: "DESPESA" as "RECEITA" | "DESPESA",
    data: new Date().toISOString().split('T')[0],
    status: "PAGO",
    categoriaId: "4a5a6141-1580-47df-b30a-b89cf7c8b56f", 
    veiculoId: ""
  });

  const handleMudarTipo = (novoTipo: "RECEITA" | "DESPESA") => {
    const primeiraCategoria = CATEGORIAS_DB.find(c => c.tipo === novoTipo)?.id || "";
    setFormData({ ...formData, tipo: novoTipo, categoriaId: primeiraCategoria });
  };

  async function buscarTransacoes() {
    try {
      const token = localStorage.getItem("@OrionCash:token");
      if (!token) return router.push("/login");

      const resposta = await fetch(`${API_URL}/transacoes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!resposta.ok) throw new Error("Erro ao buscar dados");
      
      const dados: Transacao[] = await resposta.json();
      setTransacoes(dados);
    } catch (erro) {
      console.error("Falha", erro);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    buscarTransacoes();
  }, [router]);

  // 🚀 FUNÇÃO PARA ABRIR O MODAL VAZIO (NOVO LANÇAMENTO)
  const abrirModalNovo = () => {
    setEditandoId(null); // Limpa o ID de edição
    setFormData({
      descricao: "",
      valor: "",
      tipo: "DESPESA",
      data: new Date().toISOString().split('T')[0],
      status: "PAGO",
      categoriaId: CATEGORIAS_DB.find(c => c.tipo === "DESPESA")?.id || CATEGORIAS_DB[0].id,
      veiculoId: ""
    });
    setErroModal(null);
    setIsModalOpen(true);
  };

  // 🚀 FUNÇÃO PARA ABRIR O MODAL PREENCHIDO (EDITAR)
  const abrirModalEditar = (t: Transacao) => {
    // Tenta encontrar a categoria correspondente
    const catId = CATEGORIAS_DB.find(c => c.nome === t.categoria?.nome)?.id 
                  || t.categoria?.id 
                  || t.categoriaId 
                  || CATEGORIAS_DB[0].id;
    
    // Tenta encontrar o veículo
    const veicId = t.veiculo?.id || t.veiculoId || "";

    setFormData({
      descricao: t.descricao,
      valor: t.valor.toString(), // Converte para string para o input
      tipo: t.tipo,
      data: t.data.split('T')[0], // Garante formato YYYY-MM-DD
      status: t.status,
      categoriaId: catId,
      veiculoId: veicId
    });
    
    setEditandoId(t.id); // Define que estamos a editar este ID específico
    setErroModal(null);
    setIsModalOpen(true);
    setMenuAbertoId(null); // Fecha o dropdown dos "..."
  };

  // 🚀 FUNÇÃO MÁGICA: SALVA (POST) OU ATUALIZA (PUT)
  async function handleSalvarTransacao(e: React.FormEvent) {
    e.preventDefault();
    setErroModal(null);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("@OrionCash:token");
      const payload = {
        descricao: formData.descricao,
        valor: Number(formData.valor),
        tipo: formData.tipo,
        status: formData.status,
        data: formData.data,
        categoriaId: formData.categoriaId,
        veiculoId: formData.veiculoId || null // Envia null se for vazio
      };

      // Decide dinamicamente a URL e o Método com base no estado "editandoId"
      const url = editandoId 
        ? `${API_URL}/transacoes/${editandoId}` 
        : `${API_URL}/transacoes`;
      
      const metodo = editandoId ? 'PUT' : 'POST';

      const resposta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const retorno = await resposta.json();
      if (!resposta.ok) throw new Error(retorno.mensagem || "Erro ao salvar");

      setIsModalOpen(false);
      buscarTransacoes(); // Recarrega a tabela atualizada
    } catch (err: any) {
      setErroModal(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleExcluirTransacao(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta movimentação?")) return;
    try {
      const token = localStorage.getItem("@OrionCash:token");
      await fetch(`${API_URL}/transacoes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTransacoes(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir movimentação.");
    } finally {
      setMenuAbertoId(null);
    }
  }

  async function handleMarcarComoPago(id: string) {
    try {
      const token = localStorage.getItem("@OrionCash:token");
      await fetch(`${API_URL}/transacoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'PAGO' })
      });
      setTransacoes(prev => prev.map(t => t.id === id ? { ...t, status: 'PAGO' } : t));
    } catch (err) {
      console.error(err);
    } finally {
      setMenuAbertoId(null);
    }
  }

  // LÓGICA DE FILTRAGEM
  const transacoesFiltradas = transacoes.filter(t => {
    let passou = true;
    const dataApenas = t.data.split('T')[0]; 

    if (filtroDataInicio && dataApenas < filtroDataInicio) passou = false;
    if (filtroDataFim && dataApenas > filtroDataFim) passou = false;
    if (filtroCategoria !== "Todas" && t.categoria?.nome !== filtroCategoria) passou = false;
    if (filtroBusca) {
      const termo = filtroBusca.toLowerCase();
      const placa = t.veiculo?.placa?.toLowerCase() || "";
      const desc = t.descricao.toLowerCase();
      if (!placa.includes(termo) && !desc.includes(termo)) passou = false;
    }

    return passou;
  });

  //CÁLCULO ESTÁTICO DOS KPIs (Apenas para o Mês Atual)
  const dataHoje = new Date();
  const mesAtual = dataHoje.getMonth() + 1; 
  const anoAtual = dataHoje.getFullYear();

  const transacoesMesAtual = transacoes.filter(t => {
    if (!t.data) return false;
    const [ano, mes] = t.data.split('T')[0].split('-'); 
    return parseInt(ano) === anoAtual && parseInt(mes) === mesAtual;
  });

  const totalReceitas = transacoesMesAtual.reduce((acc, t) => t.tipo === "RECEITA" ? acc + Number(t.valor) : acc, 0);
  const totalDespesas = transacoesMesAtual.reduce((acc, t) => t.tipo === "DESPESA" ? acc + Number(t.valor) : acc, 0);
  const saldoLiquido = totalReceitas - totalDespesas;

  // Utilitários de Formatação
  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  const formatarData = (dataIso: string) => {
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 relative">
      
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-wide">Movimentações Financeiras</h1>
          <p className="text-slate-400 text-sm mt-1">Faça a gestão de receitas e despesas da frota em tempo real.</p>
        </div>
        
        {/* 🚀 Alterado para usar o abrirModalNovo */}
        <button 
          onClick={abrirModalNovo}
          className="bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold text-sm px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#F59E0B]/20"
        >
          <Plus size={18} />
          Novo Lançamento
        </button>
      </div>

      {/* 2. KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1A2235] p-6 rounded-2xl border border-slate-700/50 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 text-sm font-medium">Total Receitas (Mensal)</span>
            <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="text-emerald-400" size={18} />
            </div>
          </div>
          <h3 className="text-white text-3xl font-bold mb-2">{formatarMoeda(totalReceitas)}</h3>
        </div>

        <div className="bg-[#1A2235] p-6 rounded-2xl border border-slate-700/50 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 text-sm font-medium">Total Despesas (Mensal)</span>
            <div className="w-8 h-8 rounded-md bg-rose-500/10 flex items-center justify-center">
              <TrendingDown className="text-rose-400" size={18} />
            </div>
          </div>
          <h3 className="text-white text-3xl font-bold mb-2">{formatarMoeda(totalDespesas)}</h3>
        </div>

        <div className="bg-[#1A2235] p-6 rounded-2xl border border-slate-700/50 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 text-sm font-medium">Saldo Líquido (Mensal)</span>
            <div className="w-8 h-8 rounded-md bg-[#F59E0B]/10 flex items-center justify-center">
              <Wallet className="text-[#F59E0B]" size={18} />
            </div>
          </div>
          <h3 className={`text-3xl font-bold mb-2 ${saldoLiquido >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {formatarMoeda(saldoLiquido)}
          </h3>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS INTERATIVA */}
      <div className="bg-[#1A2235] p-4 rounded-xl border border-slate-700/50 flex flex-wrap gap-4 items-end shadow-lg">
        <div className="flex-1 min-w-[150px]">
          <label className="text-xs text-slate-400 font-medium mb-1.5 block">Data Inicial</label>
          <div className="relative">
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
             <input 
               type="date" 
               value={filtroDataInicio}
               onChange={(e) => setFiltroDataInicio(e.target.value)}
               className="w-full bg-[#0F172A] border border-slate-700 text-slate-300 text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-[#F59E0B] [color-scheme:dark]" 
             />
          </div>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="text-xs text-slate-400 font-medium mb-1.5 block">Data Final</label>
          <div className="relative">
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
             <input 
               type="date" 
               value={filtroDataFim}
               onChange={(e) => setFiltroDataFim(e.target.value)}
               className="w-full bg-[#0F172A] border border-slate-700 text-slate-300 text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-[#F59E0B] [color-scheme:dark]" 
             />
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-slate-400 font-medium mb-1.5 block">Categoria</label>
          <select 
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="w-full bg-[#0F172A] border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#F59E0B] appearance-none"
          >
            <option value="Todas">Todas as Categorias</option>
            {CATEGORIAS_DB.map(cat => (
              <option key={cat.id} value={cat.nome}>{cat.nome}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-slate-400 font-medium mb-1.5 block">Veículo / Descrição</label>
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
             <input 
               type="text" 
               placeholder="Placa ou Descrição..." 
               value={filtroBusca}
               onChange={(e) => setFiltroBusca(e.target.value)}
               className="w-full bg-[#0F172A] border border-slate-700 text-slate-300 text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-[#F59E0B]" 
             />
          </div>
        </div>

        <button 
          onClick={() => {
            setFiltroDataInicio(""); setFiltroDataFim(""); setFiltroCategoria("Todas"); setFiltroBusca("");
          }}
          className="bg-[#0F172A] border border-slate-700 hover:bg-slate-800 text-slate-300 p-2.5 rounded-lg transition-colors"
          title="Limpar Filtros"
        >
          <Filter size={18} />
        </button>

        <button className="bg-[#0F172A] border border-slate-700 hover:bg-slate-800 text-slate-300 px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
          <Download size={16} /> Exportar
        </button>
      </div>

      {/* 4. TABELA DE DADOS COM AÇÕES FLUTUANTES */}
      <div className="bg-[#1A2235] rounded-xl border border-slate-700/50 overflow-visible mt-6 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0F172A]/50 text-slate-400 text-xs font-bold tracking-wider uppercase border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Veículo</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 relative">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">A carregar movimentações...</td>
                </tr>
              ) : transacoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">Nenhuma movimentação encontrada para estes filtros.</td>
                </tr>
              ) : (
                transacoesFiltradas.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-300">{formatarData(t.data.split('T')[0])}</td>
                    <td className="px-6 py-4 text-white font-medium">{t.descricao}</td>
                    <td className="px-6 py-4">
                      {t.veiculo ? (
                        <span className="text-cyan-400 font-mono text-xs font-bold uppercase tracking-widest">{t.veiculo.placa}</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          t.categoria?.nome.includes('Combustível') ? 'bg-[#F59E0B]' : 
                          t.categoria?.nome.includes('Manutenção') ? 'bg-slate-400' : 'bg-indigo-500'
                        }`}></div>
                        <span className="text-slate-300 text-xs font-medium">{t.categoria?.nome || 'Geral'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${
                        t.status === 'PAGO' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                        t.status === 'PENDENTE' ? 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20' : 
                        'text-rose-400 bg-rose-500/10 border-rose-500/20'
                      }`}>
                        {t.status === 'PAGO' ? 'Concluído' : t.status === 'PENDENTE' ? 'Pendente' : 'Cancelado'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${t.tipo === 'RECEITA' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.tipo === 'RECEITA' ? '+ ' : '- '}{formatarMoeda(t.valor)}
                    </td>
                    
                    <td className="px-6 py-4 text-center relative">
                      <button 
                        onClick={() => setMenuAbertoId(menuAbertoId === t.id ? null : t.id)}
                        className="text-slate-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700"
                        title="Opções"
                      >
                        <span className="font-bold tracking-widest">•••</span>
                      </button>

                      {menuAbertoId === t.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuAbertoId(null)}></div>
                          <div className="absolute right-12 top-10 w-48 bg-[#131C2D] border border-slate-700/80 rounded-xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95">
                            
                            {t.status === 'PENDENTE' && (
                              <button 
                                onClick={() => handleMarcarComoPago(t.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-colors font-medium"
                              >
                                <CheckCircle size={16} /> Marcar como Pago
                              </button>
                            )}

                            {/* 🚀 CHAMA A FUNÇÃO DE ABRIR MODAL EDITAR */}
                            <button 
                              onClick={() => abrirModalEditar(t)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 transition-colors font-medium border-t border-slate-700/50"
                            >
                              <Pencil size={16} className="text-slate-400" /> Editar Registro
                            </button>

                            <button 
                              onClick={() => handleExcluirTransacao(t.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors font-bold border-t border-slate-700/50"
                            >
                              <Trash2 size={16} /> Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL REAPROVEITADO (CRIAÇÃO OU EDIÇÃO) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1A2235] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-[#0F172A]/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Wallet className="text-[#F59E0B]" size={20} />
                {/* 🚀 TÍTULO DINÂMICO */}
                {editandoId ? "Editar Lançamento" : "Novo Lançamento"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-400 transition-colors p-1 rounded-lg hover:bg-slate-800">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvarTransacao} className="p-6 space-y-4">
              
              {erroModal && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm font-bold p-3 rounded-lg text-center">
                  {erroModal}
                </div>
              )}

              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer font-bold text-sm transition-all ${formData.tipo === 'RECEITA' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                  <input type="radio" name="tipo" value="RECEITA" className="hidden" checked={formData.tipo === 'RECEITA'} onChange={() => handleMudarTipo("RECEITA")} />
                  <TrendingUp size={16} /> Receita
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer font-bold text-sm transition-all ${formData.tipo === 'DESPESA' ? 'bg-rose-500/10 border-rose-500 text-rose-400' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                  <input type="radio" name="tipo" value="DESPESA" className="hidden" checked={formData.tipo === 'DESPESA'} onChange={() => handleMudarTipo("DESPESA")} />
                  <TrendingDown size={16} /> Despesa
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Descrição</label>
                  <input required type="text" placeholder="Ex: Abastecimento Volvo" value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} className="w-full bg-[#0F172A] border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B]" />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Valor (R$)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={formData.valor} 
                    onChange={(e) => setFormData({...formData, valor: e.target.value})} 
                    className="w-full bg-[#0F172A] border border-slate-700 text-white font-mono rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Data</label>
                  <input 
                    required 
                    type="date" 
                    value={formData.data} 
                    onChange={(e) => setFormData({...formData, data: e.target.value})} 
                    className="w-full bg-[#0F172A] border border-slate-700 text-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B] [color-scheme:dark]" 
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Categoria</label>
                  <select required value={formData.categoriaId} onChange={(e) => setFormData({...formData, categoriaId: e.target.value})} className="w-full bg-[#0F172A] border border-slate-700 text-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B] appearance-none">
                    {CATEGORIAS_DB.filter(c => c.tipo === formData.tipo).map(categoria => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Veículo <span className="text-slate-600 font-normal lowercase">(opcional)</span></label>
                  <select value={formData.veiculoId} onChange={(e) => setFormData({...formData, veiculoId: e.target.value})} className="w-full bg-[#0F172A] border border-slate-700 text-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B] appearance-none">
                    <option value="">Nenhum (Despesa Fixa)</option>
                    <option value="fcb88c82-3769-43cb-ae5b-f24d510ee9ce">ABC-1234 (Teste)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Status de Pagamento</label>
                  <select required value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-[#0F172A] border border-slate-700 text-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B] appearance-none">
                    <option value="PAGO">Pago / Concluído</option>
                    <option value="PENDENTE">Pendente</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-700 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-white font-bold hover:bg-slate-800 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-lg bg-[#F59E0B] text-black font-extrabold hover:bg-[#D97706] transition-colors disabled:opacity-70 flex justify-center items-center shadow-lg shadow-[#F59E0B]/20">
                  {/* 🚀 BOTÃO DINÂMICO */}
                  {isSubmitting ? "A guardar..." : editandoId ? "Salvar Alterações" : "Salvar Lançamento"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}