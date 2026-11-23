"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Wallet, PieChart, Truck, AlertTriangle } from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { useRouter } from "next/navigation";
import { API_URL } from "@/src/lib/api";

interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  tipo: "RECEITA" | "DESPESA";
  data: string;
  status: "PENDENTE" | "PAGO" | "CANCELADO";
}

export default function DashboardHome() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erroApi, setErroApi] = useState<string | null>(null);

  const [kpis, setKpis] = useState({ receitas: 0, despesas: 0, lucro: 0, frotaAtiva: 0, frotaTotal: 0 });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);
    
    async function carregarDashboard() {
      try {
        const token = localStorage.getItem("@OrionCash:token");
        if (!token) return router.push("/login");

        const resposta = await fetch(`${API_URL}/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!resposta.ok) throw new Error(`Erro na API: ${resposta.status}`);
        
        const dados = await resposta.json();
        const listaTransacoes = dados.ultimasTransacoes ?? dados.transacoesRecentes ?? dados.transacoes ?? [];
        setTransacoes(listaTransacoes);

        // KPIs e gráfico dos últimos 6 meses vêm agregados do backend (DashboardService).
        // Antes eram calculados aqui a partir de `ultimasTransacoes`, que só traz 5 registros.
        setKpis({
          receitas: Number(dados.receitas ?? 0),
          despesas: Number(dados.despesas ?? 0),
          lucro: Number(dados.saldo ?? dados.lucro ?? 0),
          frotaAtiva: dados.frotaAtiva ?? 0,
          frotaTotal: dados.frotaTotal ?? 0
        });

        setChartData(Array.isArray(dados.grafico) ? dados.grafico : []);

      } catch (erro: any) {
        console.error("Falha na ligação à API do Dashboard:", erro);
        setErroApi(erro.message || "Erro ao buscar dados.");
      } finally {
        setIsLoading(false);
      }
    }

    carregarDashboard();
  }, [router]);

  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      
      {/* 1. CARTÕES DE KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-[#1A2235] p-6 rounded-2xl border border-slate-700/50 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="text-emerald-400" size={20} />
            </div>
            <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">6 Meses</span>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Receitas (Semestre)</p>
            <h3 className="text-white text-2xl font-bold">{formatarMoeda(kpis.receitas)}</h3>
          </div>
        </div>

        <div className="bg-[#1A2235] p-6 rounded-2xl border border-slate-700/50 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <Wallet className="text-rose-400" size={20} />
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Despesas (Semestre)</p>
            <h3 className="text-white text-2xl font-bold">{formatarMoeda(kpis.despesas)}</h3>
          </div>
        </div>

        <div className="bg-[#1A2235] p-6 rounded-2xl border border-slate-700/50 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <PieChart className="text-blue-400" size={20} />
            </div>
            <span className={`text-xs font-bold flex items-center gap-1 ${kpis.lucro >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {kpis.lucro >= 0 ? 'Positivo' : 'Negativo'}
            </span>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Lucro (Semestre)</p>
            <h3 className="text-white text-2xl font-bold">{formatarMoeda(kpis.lucro)}</h3>
          </div>
        </div>

        <div className="bg-[#1A2235] p-6 rounded-2xl border border-slate-700/50 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#F59E0B]/10 rounded-full blur-2xl -mr-4 -mt-4"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
              <Truck className="text-[#F59E0B]" size={20} />
            </div>
            {kpis.frotaAtiva < kpis.frotaTotal && (
              <span className="text-[#F59E0B] text-xs font-bold flex items-center gap-1">
                <AlertTriangle size={12} /> Manutenção
              </span>
            )}
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Frota Ativa</p>
            <h3 className="text-white text-2xl font-bold">
              {kpis.frotaAtiva} <span className="text-slate-500 text-lg font-medium">/ {kpis.frotaTotal}</span>
            </h3>
          </div>
        </div>
      </div>

      {/* 2. SESSÃO DO GRÁFICO */}
      <div className="bg-[#1A2235] p-6 rounded-2xl border border-slate-700/50 flex flex-col w-full shadow-lg">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-white font-bold text-lg">Evolução Financeira</h2>
            <p className="text-slate-400 text-xs mt-1">Comparativo de Receitas vs Despesas dos Últimos 6 Meses</p>
          </div>
        </div>
        
        <div className="w-full h-[350px]">
          {isMounted && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDesp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(val) => `R$ ${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ fontWeight: 'bold' }}
                  formatter={(value: any, name?: string) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), (name ?? '').toUpperCase()]}
                />
                <Area type="monotone" dataKey="receitas" name="Receitas" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRec)" />
                <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#F43F5E" strokeWidth={3} fillOpacity={1} fill="url(#colorDesp)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : isMounted && chartData.length === 0 && !isLoading ? (
            <div className="h-full w-full flex items-center justify-center text-slate-500">Sem dados recentes.</div>
          ) : (
             <div className="h-full w-full flex items-center justify-center text-slate-500">A carregar gráfico...</div>
          )}
        </div>
      </div>

      {/* 3. TABELA DE TRANSAÇÕES DINÂMICA (Inalterada) */}
      <div className="bg-[#1A2235] rounded-2xl border border-slate-700/50 overflow-hidden shadow-lg">
        <div className="p-6 flex items-center justify-between border-b border-slate-700/50">
          <div>
            <h2 className="text-white font-bold text-lg">Últimas Movimentações</h2>
            <p className="text-slate-400 text-xs mt-1">Registos recentes na plataforma</p>
          </div>
          <button onClick={() => router.push('/dashboard/financeiro')} className="text-xs font-bold text-[#F59E0B] hover:text-[#D97706] transition-colors uppercase tracking-widest">
            Ver Todas
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0F172A]/50 text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição da Operação</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {isLoading && <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">A processar dados no backend...</td></tr>}
              {!isLoading && erroApi && <tr><td colSpan={4} className="px-6 py-8 text-center text-rose-500 font-medium">{erroApi}</td></tr>}
              {!isLoading && !erroApi && transacoes.slice(0, 10).map((transacao) => (
                <tr key={transacao.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 text-slate-400">
                    {transacao.data ? new Date(transacao.data.split('T')[0]).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="px-6 py-4 text-white font-medium">{transacao.descricao}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${
                      transacao.status === 'PAGO' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                      transacao.status === 'PENDENTE' ? 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    }`}>
                      {transacao.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${transacao.tipo === 'RECEITA' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {transacao.tipo === 'RECEITA' ? '+ ' : '- '}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transacao.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}