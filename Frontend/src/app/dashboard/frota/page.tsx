"use client";

import { useState, useEffect } from "react";
import { 
  Truck, Plus, Search, Filter, 
  Wrench, CheckCircle2, AlertTriangle, Settings2, X, Trash2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/src/lib/api";

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  marca: string;
  ano: number;
  capacidade: number;
  status: "ATIVO" | "MANUTENCAO" | "VENDIDO";
}

export default function FrotaPage() {
  const router = useRouter();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // KPIs
  const [totalAtivos, setTotalAtivos] = useState(0);
  const [totalManutencao, setTotalManutencao] = useState(0);

  // Estados do Modal de Cadastro
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  // Estados do Modal de Edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [veiculoEmEdicao, setVeiculoEmEdicao] = useState<Veiculo | null>(null);

  const [formData, setFormData] = useState({
    placa: "",
    marca: "",
    modelo: "",
    ano: new Date().getFullYear(),
    capacidade: 0,
    status: "ATIVO"
  });

  async function buscarVeiculos() {
    try {
      const token = localStorage.getItem("@OrionCash:token");
      if (!token) return router.push("/login");

      const resposta = await fetch(`${API_URL}/veiculos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!resposta.ok) throw new Error("Falha ao carregar veículos");
      
      const dados: Veiculo[] = await resposta.json();
      setVeiculos(dados);
      
      setTotalAtivos(dados.filter(v => v.status === 'ATIVO').length);
      setTotalManutencao(dados.filter(v => v.status === 'MANUTENCAO').length);

    } catch (erro) {
      console.error(erro);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    buscarVeiculos();
  }, [router]);

  // Função para salvar um NOVO veículo
  async function handleSalvarVeiculo(e: React.FormEvent) {
    e.preventDefault();
    setErroModal(null);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("@OrionCash:token");
      
      const payload = {
        placa: formData.placa.toUpperCase().trim(),
        marca: formData.marca,
        modelo: formData.modelo,
        ano: Number(formData.ano),
        capacidade: Number(formData.capacidade),
        status: formData.status
      };

      const resposta = await fetch(`${API_URL}/veiculos`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      const retorno = await resposta.json();
      if (!resposta.ok) throw new Error(retorno.mensagem || "Erro ao salvar veículo");

      setIsModalOpen(false);
      setFormData({ placa: "", marca: "", modelo: "", ano: new Date().getFullYear(), capacidade: 0, status: "ATIVO" });
      buscarVeiculos(); 

    } catch (err: any) {
      setErroModal(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Abir modal de edição preenchido
  function abrirModalEdicao(veiculo: Veiculo) {
    setVeiculoEmEdicao({ ...veiculo });
    setErroModal(null);
    setIsEditModalOpen(true);
  }

  // Função para ATUALIZAR veículo existente (PUT)
  async function handleAtualizarVeiculo(e: React.FormEvent) {
    e.preventDefault();
    if (!veiculoEmEdicao) return;
    
    setErroModal(null);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("@OrionCash:token");
      
      // O backend não aceita atualizar a placa, então enviamos apenas os outros dados
      const payload = {
        marca: veiculoEmEdicao.marca,
        modelo: veiculoEmEdicao.modelo,
        ano: Number(veiculoEmEdicao.ano),
        capacidade: Number(veiculoEmEdicao.capacidade),
        status: veiculoEmEdicao.status
      };

      const resposta = await fetch(`${API_URL}/veiculos/${veiculoEmEdicao.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      const retorno = await resposta.json();
      if (!resposta.ok) throw new Error(retorno.mensagem || "Erro ao atualizar veículo");

      setIsEditModalOpen(false);
      setVeiculoEmEdicao(null);
      buscarVeiculos(); 

    } catch (err: any) {
      setErroModal(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Função para EXCLUIR veículo (DELETE)
  async function handleExcluirVeiculo() {
    if (!veiculoEmEdicao) return;
    
    const confirmacao = window.confirm(`Tem a certeza que deseja excluir o veículo placa ${veiculoEmEdicao.placa}? Esta ação não pode ser desfeita.`);
    if (!confirmacao) return;

    try {
      const token = localStorage.getItem("@OrionCash:token");
      
      const resposta = await fetch(`${API_URL}/veiculos/${veiculoEmEdicao.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!resposta.ok) throw new Error("Erro ao excluir o veículo");

      setIsEditModalOpen(false);
      setVeiculoEmEdicao(null);
      buscarVeiculos();

    } catch (err: any) {
      alert(err.message);
    }
  }

  const PlacaMercosul = ({ placa }: { placa: string }) => {
    const placaFormatada = placa.length === 7 ? `${placa.substring(0,3)} ${placa.substring(3)}` : placa;

    return (
      <div className="flex flex-col w-[130px] rounded-md overflow-hidden border-2 border-slate-300 bg-white shadow-inner transform hover:scale-105 transition-transform">
        <div className="bg-blue-700 h-4 w-full flex items-center justify-between px-1">
           <div className="w-2 h-2"></div>
           <span className="text-[8px] font-bold text-white tracking-widest uppercase">Brasil</span>
           <div className="w-2 h-2 rounded-sm bg-green-500 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-yellow-400"></div>
           </div>
        </div>
        <div className="h-10 flex items-center justify-center bg-white text-black font-extrabold tracking-widest text-lg font-mono uppercase">
          {placaFormatada}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-wide">Gestão de Frota</h1>
          <p className="text-slate-400 text-sm mt-1">Acompanhe os veículos, capacidade e status de manutenção.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold text-sm px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#F59E0B]/20"
        >
          <Plus size={18} />
          Cadastrar Veículo
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1A2235] p-6 rounded-2xl border border-slate-700/50 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 text-sm font-medium">Total da Frota</span>
            <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center">
              <Truck className="text-blue-400" size={18} />
            </div>
          </div>
          <h3 className="text-white text-3xl font-bold mb-2">{veiculos.length} <span className="text-base text-slate-500 font-medium">veículos</span></h3>
        </div>

        <div className="bg-[#1A2235] p-6 rounded-2xl border border-slate-700/50 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 text-sm font-medium">Em Operação</span>
            <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="text-emerald-400" size={18} />
            </div>
          </div>
          <h3 className="text-white text-3xl font-bold mb-2">{totalAtivos} <span className="text-base text-slate-500 font-medium">ativos</span></h3>
        </div>

        <div className="bg-[#1A2235] p-6 rounded-2xl border border-slate-700/50 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 text-sm font-medium">Em Manutenção</span>
            <div className="w-8 h-8 rounded-md bg-[#F59E0B]/10 flex items-center justify-center">
              <Wrench className="text-[#F59E0B]" size={18} />
            </div>
          </div>
          <h3 className="text-white text-3xl font-bold mb-2">{totalManutencao} <span className="text-base text-slate-500 font-medium">parados</span></h3>
        </div>
      </div>

      {/* GRID DE VEÍCULOS */}
      {isLoading ? (
         <div className="text-center py-20 text-slate-500">A carregar a frota...</div>
      ) : veiculos.length === 0 ? (
         <div className="text-center py-20 text-slate-500">Nenhum veículo cadastrado na sua base de dados.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
          {veiculos.map((veiculo) => (
            <div key={veiculo.id} className="bg-[#1A2235] border border-slate-700/50 rounded-2xl p-6 shadow-lg hover:border-slate-600 transition-colors group relative overflow-hidden">
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

              <div className="flex justify-between items-start mb-6">
                <PlacaMercosul placa={veiculo.placa} />
                
                <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${
                  veiculo.status === 'ATIVO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                  veiculo.status === 'MANUTENCAO' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20' : 
                  'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {veiculo.status === 'ATIVO' ? <CheckCircle2 size={12} /> : 
                   veiculo.status === 'MANUTENCAO' ? <Wrench size={12} /> : 
                   <AlertTriangle size={12} />}
                  {veiculo.status}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-white text-xl font-bold uppercase tracking-wide">{veiculo.marca} {veiculo.modelo}</h4>
                  <p className="text-slate-400 text-sm">Ano Fab: {veiculo.ano}</p>
                </div>

                <div className="flex items-center gap-4 bg-[#0F172A] rounded-xl p-3 border border-slate-800">
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Capacidade Carga</p>
                    <p className="text-slate-300 font-mono font-medium">{veiculo.capacidade.toLocaleString('pt-BR')} KG</p>
                  </div>
                  <div className="w-px h-8 bg-slate-700"></div>
                  
                  {/* AQUI ESTÁ O BOTÃO GERENCIAR ATIVADO */}
                  <div className="flex-1 flex justify-end pr-2">
                    <button 
                      onClick={() => abrirModalEdicao(veiculo)}
                      className="text-[#F59E0B] hover:text-white text-xs font-bold uppercase tracking-wider transition-colors mt-0.5 flex items-center gap-1"
                    >
                       <Settings2 size={14} /> Gerenciar
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL 1: CADASTRAR NOVO VEÍCULO           */}
      {/* ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1A2235] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-[#0F172A]/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Truck className="text-[#F59E0B]" size={20} />
                Cadastrar Veículo
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvarVeiculo} className="p-6 space-y-4">
              {erroModal && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm font-bold p-3 rounded-lg text-center">
                  {erroModal}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Placa</label>
                  <input required type="text" maxLength={7} placeholder="Ex: ABC1D23" value={formData.placa} onChange={(e) => setFormData({...formData, placa: e.target.value.toUpperCase()})} className="w-full bg-[#0F172A] border border-slate-700 text-white font-mono uppercase tracking-widest rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B]" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Marca</label>
                  <input required type="text" placeholder="Ex: Volvo" value={formData.marca} onChange={(e) => setFormData({...formData, marca: e.target.value})} className="w-full bg-[#0F172A] border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B]" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Modelo</label>
                  <input required type="text" placeholder="Ex: FH 540" value={formData.modelo} onChange={(e) => setFormData({...formData, modelo: e.target.value})} className="w-full bg-[#0F172A] border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B]" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Ano</label>
                  <input required type="text" inputMode="numeric" maxLength={4} value={formData.ano || ""} onChange={(e) => setFormData({...formData, ano: Number(e.target.value.replace(/\D/g, ''))})} className="w-full bg-[#0F172A] border border-slate-700 text-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B]" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Capacidade (KG)</label>
                  <input required type="text" inputMode="numeric" placeholder="Ex: 45000" value={formData.capacidade || ""} onChange={(e) => setFormData({...formData, capacidade: Number(e.target.value.replace(/\D/g, ''))})} className="w-full bg-[#0F172A] border border-slate-700 text-slate-300 font-mono rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B]" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Status Inicial</label>
                  <select required value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-[#0F172A] border border-slate-700 text-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B] appearance-none">
                    <option value="ATIVO">Ativo e Operante</option>
                    <option value="MANUTENCAO">Em Manutenção</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-700 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-white font-bold hover:bg-slate-800 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-lg bg-[#F59E0B] text-black font-extrabold hover:bg-[#D97706] transition-colors disabled:opacity-70">
                  {isSubmitting ? "A guardar..." : "Salvar Veículo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL 2: EDITAR / GERENCIAR VEÍCULO       */}
      {/* ========================================= */}
      {isEditModalOpen && veiculoEmEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1A2235] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-[#0F172A]/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings2 className="text-[#F59E0B]" size={20} />
                Gerenciar Veículo
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAtualizarVeiculo} className="p-6 space-y-4">
              
              {erroModal && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm font-bold p-3 rounded-lg text-center">
                  {erroModal}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                
                {/* Placa (Desabilitada conforme backend) */}
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Placa (Não alterável)</label>
                  <input 
                    type="text" 
                    disabled
                    value={veiculoEmEdicao.placa} 
                    className="w-full bg-[#0F172A]/50 border border-slate-800 text-slate-500 font-mono uppercase tracking-widest rounded-lg px-4 py-2.5 cursor-not-allowed" 
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Marca</label>
                  <input required type="text" value={veiculoEmEdicao.marca} onChange={(e) => setVeiculoEmEdicao({...veiculoEmEdicao, marca: e.target.value})} className="w-full bg-[#0F172A] border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B]" />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Modelo</label>
                  <input required type="text" value={veiculoEmEdicao.modelo} onChange={(e) => setVeiculoEmEdicao({...veiculoEmEdicao, modelo: e.target.value})} className="w-full bg-[#0F172A] border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B]" />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Ano</label>
                  <input required type="text" inputMode="numeric" maxLength={4} value={veiculoEmEdicao.ano || ""} onChange={(e) => setVeiculoEmEdicao({...veiculoEmEdicao, ano: Number(e.target.value.replace(/\D/g, ''))})} className="w-full bg-[#0F172A] border border-slate-700 text-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B]" />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Capacidade (KG)</label>
                  <input required type="text" inputMode="numeric" value={veiculoEmEdicao.capacidade || ""} onChange={(e) => setVeiculoEmEdicao({...veiculoEmEdicao, capacidade: Number(e.target.value.replace(/\D/g, ''))})} className="w-full bg-[#0F172A] border border-slate-700 text-slate-300 font-mono rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B]" />
                </div>

                <div className="col-span-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Status Atual</label>
                  <select required value={veiculoEmEdicao.status} onChange={(e) => setVeiculoEmEdicao({...veiculoEmEdicao, status: e.target.value as any})} className="w-full bg-[#0F172A] border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F59E0B] appearance-none">
                    <option value="ATIVO">Ativo e Operante</option>
                    <option value="MANUTENCAO">Em Manutenção</option>
                    <option value="VENDIDO">Vendido / Inativo</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-700 mt-6 items-center">
                
                {/* Botão de Excluir */}
                <button 
                  type="button" 
                  onClick={handleExcluirVeiculo}
                  className="p-2.5 rounded-lg border border-transparent text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors"
                  title="Excluir Veículo"
                >
                  <Trash2 size={20} />
                </button>

                <div className="flex-1 flex gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-white font-bold hover:bg-slate-800 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-lg bg-[#F59E0B] text-black font-extrabold hover:bg-[#D97706] transition-colors disabled:opacity-70">
                    {isSubmitting ? "A guardar..." : "Salvar Alterações"}
                  </button>
                </div>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}