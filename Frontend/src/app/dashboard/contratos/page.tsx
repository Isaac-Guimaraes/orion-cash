"use client";

import { useState, useEffect } from "react";
import { 
  Building2, Plus, Search, Calendar, 
  DollarSign, FileText, X, Trash2, ShieldCheck, AlertCircle, RefreshCw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/src/lib/api";

// Interface baseada no backend (Contrato.ts)
interface Contrato {
  id: string;
  nomeCliente: string;
  cnpj: string;
  valorMensal: string | number; 
  dataInicio: string;
  dataTermino: string;
  ativo: boolean;
}

export default function ContratosPage() {
  const router = useRouter();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados dos Filtros
  const [filtroBusca, setFiltroBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");

  // Estados do Modal e Formulário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);
  const [isGerando, setIsGerando] = useState(false); 
  
  const [formData, setFormData] = useState({
    nomeCliente: "",
    cnpj: "",
    valorTotal: "", // Valor TOTAL do contrato; o backend calcula a parcela mensal
    dataInicio: "",
    dataTermino: ""
  });

  // Função do motor de faturamento recorrente
  async function handleGerarFaturamento() {
    setIsGerando(true);
    try {
      const token = localStorage.getItem("@OrionCash:token");

      const resposta = await fetch(`${API_URL}/contratos/faturamento`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        // O backend identifica o operador pelo token JWT
      });
      
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.mensagem || "Erro ao gerar faturas");
      
      alert(`✅ Sucesso!\nNovas faturas geradas: ${dados.faturasGeradas}\nFaturas atualizadas: ${dados.faturasAtualizadas}\nContratos fora de vigência: ${dados.contratosForaDeVigencia ?? 0}`);
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setIsGerando(false);
    }
  }

  // Busca inicial dos contratos cadastrados
  async function buscarContratos() {
    try {
      const token = localStorage.getItem("@OrionCash:token");
      if (!token) return router.push("/login");

      const resposta = await fetch(`${API_URL}/contratos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!resposta.ok) throw new Error("Erro ao buscar contratos");
      
      const dados = await resposta.json();
      setContratos(dados);
    } catch (erro) {
      console.error("Falha", erro);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    buscarContratos();
  }, [router]);

  // Salvar novo Contrato
  async function handleSalvarContrato(e: React.FormEvent) {
    e.preventDefault();
    setErroModal(null);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("@OrionCash:token");
      const payload = {
        ...formData,
        valorTotal: Number(formData.valorTotal)
      };

      const resposta = await fetch(`${API_URL}/contratos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const retorno = await resposta.json();
      if (!resposta.ok) throw new Error(retorno.mensagem || "Erro ao salvar contrato");

      setIsModalOpen(false);
      setFormData({ nomeCliente: "", cnpj: "", valorTotal: "", dataInicio: "", dataTermino: "" });
      buscarContratos(); 
    } catch (err: any) {
      setErroModal(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Deletar Contrato (Soft Delete)
  async function handleExcluir(id: string) {
    if (!confirm("Tem certeza que deseja excluir este contrato? Ele deixará de gerar faturamento.")) return;
    try {
      const token = localStorage.getItem("@OrionCash:token");
      await fetch(`${API_URL}/contratos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setContratos(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir contrato.");
    }
  }

  // Funções Utilitárias de Formatação
  const formatarCNPJ = (cnpj: string) => cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  
  const formatarData = (dataIso: string) => {
    if (!dataIso) return "-";
    const [ano, mes, dia] = dataIso.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const formatarMoeda = (valor: number | string) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor));
  };

  // Lógica de Filtragem da Tabela
  const contratosFiltrados = contratos.filter(c => {
    let passou = true;
    if (filtroStatus === "ATIVOS" && !c.ativo) passou = false;
    if (filtroStatus === "INATIVOS" && c.ativo) passou = false;
    
    if (filtroBusca) {
      const termo = filtroBusca.toLowerCase();
      if (!c.nomeCliente.toLowerCase().includes(termo) && !c.cnpj.includes(termo)) {
        passou = false;
      }
    }
    return passou;
  });

  // Cálculos de KPIs
  const contratosAtivos = contratos.filter(c => c.ativo);
  const receitaRecorrente = contratosAtivos.reduce((acc, c) => acc + Number(c.valorMensal), 0);
  
  const hoje = new Date();
  const trintaDias = new Date();
  trintaDias.setDate(hoje.getDate() + 30);
  
  const aVencer = contratosAtivos.filter(c => {
    const termino = new Date(c.dataTermino);
    return termino <= trintaDias && termino >= hoje;
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      
      {/* CABEÇALHO E BOTÕES DE AÇÃO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-wide">Contratos e Recorrência</h1>
          <p className="text-slate-400 text-sm mt-1">Gira os contratos fixos e garanta a previsibilidade financeira.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleGerarFaturamento}
            disabled={isGerando}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg disabled:opacity-50"
          >
            <RefreshCw size={18} className={isGerando ? "animate-spin" : ""} />
            {isGerando ? "A processar..." : "Gerar Faturas do Mês"}
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold text-sm px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#F59E0B]/20"
          >
            <Plus size={18} />
            Novo Contrato
          </button>
        </div>
      </div>

      {/* CARTÕES DE KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1A2235] p-6 rounded-2xl border border-slate-700/50 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 text-sm font-medium">Contratos Ativos</span>
            <div className="w-8 h-8 rounded-md bg-indigo-500/10 flex items-center justify-center">
              <FileText className="text-indigo-400" size={18} />
            </div>
          </div>
          <h3 className="text-white text-3xl font-bold mb-2">{contratosAtivos.length} <span className="text-sm text-slate-500 font-medium">clientes</span></h3>
        </div>

        <div className="bg-[#1A2235] p-6 rounded-2xl border border-slate-700/50 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-slate-400 text-sm font-medium">Receita Recorrente (MRR)</span>
            <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="text-emerald-400" size={18} />
            </div>
          </div>
          <h3 className="text-emerald-400 text-3xl font-bold mb-2 relative z-10">{formatarMoeda(receitaRecorrente)}</h3>
        </div>

        <div className="bg-[#1A2235] p-6 rounded-2xl border border-slate-700/50 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 text-sm font-medium">A Vencer (30 dias)</span>
            <div className="w-8 h-8 rounded-md bg-[#F59E0B]/10 flex items-center justify-center">
              <AlertCircle className="text-[#F59E0B]" size={18} />
            </div>
          </div>
          <h3 className={`text-3xl font-bold mb-2 ${aVencer.length > 0 ? 'text-[#F59E0B]' : 'text-slate-300'}`}>
            {aVencer.length} <span className="text-sm text-slate-500 font-medium">contratos</span>
          </h3>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-[#1A2235] p-4 rounded-xl border border-slate-700/50 flex flex-wrap gap-4 items-end shadow-lg">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-slate-400 font-medium mb-1.5 block">Buscar Cliente ou CNPJ</label>
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
             <input 
               type="text" 
               placeholder="Pesquisar..." 
               value={filtroBusca}
               onChange={(e) => setFiltroBusca(e.target.value)}
               className="w-full bg-[#0F172A] border border-slate-700 text-slate-300 text-sm rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#F59E0B]" 
             />
          </div>
        </div>

        <div className="w-[200px]">
          <label className="text-xs text-slate-400 font-medium mb-1.5 block">Status</label>
          <select 
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full bg-[#0F172A] border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#F59E0B] appearance-none"
          >
            <option value="TODOS">Todos</option>
            <option value="ATIVOS">Apenas Ativos</option>
            <option value="INATIVOS">Inativos / Vencidos</option>
          </select>
        </div>
      </div>

      {/* TABELA DE CONTRATOS */}
      <div className="bg-[#1A2235] rounded-xl border border-slate-700/50 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0F172A]/50 text-slate-400 text-[10px] font-bold tracking-widest uppercase border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4">Cliente / CNPJ</th>
                <th className="px-6 py-4">Início</th>
                <th className="px-6 py-4">Término</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Valor Mensal</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">A carregar contratos...</td></tr>
              ) : contratosFiltrados.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Nenhum contrato encontrado.</td></tr>
              ) : (
                contratosFiltrados.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                          <Building2 size={14} className="text-[#F59E0B]" />
                        </div>
                        <div>
                          <p className="text-white font-bold">{c.nomeCliente}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{formatarCNPJ(c.cnpj)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-500" /> {formatarData(c.dataInicio)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{formatarData(c.dataTermino)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-full border ${
                        c.ativo ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                      }`}>
                        {c.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-400">
                      {formatarMoeda(c.valorMensal)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleExcluir(c.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-2 rounded-lg hover:bg-rose-500/10"
                        title="Excluir Contrato"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE NOVO CONTRATO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1A2235] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-[#0F172A]/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="text-[#F59E0B]" size={20} />
                Novo Contrato Recorrente
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-400 transition-colors p-1 rounded-lg hover:bg-slate-800">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvarContrato} className="p-6 space-y-4">
              
              {erroModal && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm font-bold p-3 rounded-lg text-center">
                  {erroModal}
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Nome do Cliente</label>
                <input required type="text" placeholder="Ex: Prefeitura de Irecê" value={formData.nomeCliente} onChange={(e) => setFormData({...formData, nomeCliente: e.target.value})} className="w-full bg-[#0F172A] border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">CNPJ (Apenas Números)</label>
                  <input required type="text" maxLength={14} placeholder="00000000000100" value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: e.target.value.replace(/\D/g, '')})} className="w-full bg-[#0F172A] border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B]" />
                </div>
                
                {/* BLOCO DO VALOR TOTAL E PRÉ-VISUALIZAÇÃO DA PARCELA */}
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Valor Total do Contrato (R$)</label>
                  <input required type="number" step="0.01" placeholder="120000.00" value={formData.valorTotal} onChange={(e) => setFormData({...formData, valorTotal: e.target.value})} className="w-full bg-[#0F172A] border border-slate-700 text-emerald-400 font-bold font-mono rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B]" />
                  
                  {formData.valorTotal && formData.dataInicio && formData.dataTermino && (
                    <p className="text-[11px] text-[#F59E0B] font-medium mt-2 flex items-center gap-1 bg-[#F59E0B]/10 p-1.5 rounded border border-[#F59E0B]/20">
                      {(() => {
                        // Mesma regra do backend (API/src/utils/datas.ts → calcularMesesDeDuracao)
                        const [ai, mi, di] = formData.dataInicio.split('-').map(Number);
                        const [at, mt, dt] = formData.dataTermino.split('-').map(Number);
                        let m = (at * 12 + mt) - (ai * 12 + mi);
                        if (dt > di) m += 1;
                        if (m <= 0) m = 1;
                        const totalCentavos = Math.round(Number(formData.valorTotal) * 100);
                        const parcela = Math.floor(totalCentavos / m) / 100;
                        const ultima = (totalCentavos - Math.floor(totalCentavos / m) * (m - 1)) / 100;
                        return ultima !== parcela
                          ? `Gerará ${m} parcelas de ${formatarMoeda(parcela)} (última de ${formatarMoeda(ultima)})`
                          : `Gerará ${m} parcelas mensais de ${formatarMoeda(parcela)}`;
                      })()}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Data de Início</label>
                  <input required type="date" value={formData.dataInicio} onChange={(e) => setFormData({...formData, dataInicio: e.target.value})} className="w-full bg-[#0F172A] border border-slate-700 text-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B] [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Data de Término</label>
                  <input required type="date" value={formData.dataTermino} onChange={(e) => setFormData({...formData, dataTermino: e.target.value})} className="w-full bg-[#0F172A] border border-slate-700 text-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B] [color-scheme:dark]" />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-700 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-white font-bold hover:bg-slate-800 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-lg bg-[#F59E0B] text-black font-extrabold hover:bg-[#D97706] transition-colors disabled:opacity-70 flex justify-center items-center shadow-lg shadow-[#F59E0B]/20">
                  {isSubmitting ? "A Guardar..." : "Salvar Contrato"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}