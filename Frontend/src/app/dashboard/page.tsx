"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Wallet, PieChart, Bus, AlertTriangle, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useRouter } from "next/navigation";
import { API_URL } from "@/src/lib/api";
import { formatarData, formatarMoeda, formatarMoedaCompacta, formatarMoedaInteira, STATUS_TRANSACAO, textoDoErro } from "@/src/lib/formatos";
import { classeBotaoSecundario, classeCartao, foco } from "@/src/lib/estilos";

interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  tipo: "RECEITA" | "DESPESA";
  data: string;
  status: "PENDENTE" | "PAGO" | "CANCELADO";
}

interface PontoGrafico {
  name: string;
  receitas: number;
  despesas: number;
}

export default function DashboardHome() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [kpis, setKpis] = useState({ receitas: 0, despesas: 0, saldo: 0, aReceber: 0, frotaAtiva: 0, frotaTotal: 0 });
  const [grafico, setGrafico] = useState<PontoGrafico[]>([]);

  async function carregarDashboard() {
    setErroApi(null);
    setIsLoading(true);
    try {
      const token = localStorage.getItem("@OrionCash:token");
      if (!token) return router.push("/login");

      const resposta = await fetch(`${API_URL}/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
      if (!resposta.ok) throw new Error("Não foi possível carregar o painel. Tente novamente em instantes.");

      const dados = await resposta.json();
      setTransacoes(dados.ultimasTransacoes ?? []);
      setKpis({
        receitas: Number(dados.receitas ?? 0),
        despesas: Number(dados.despesas ?? 0),
        saldo: Number(dados.saldo ?? dados.lucro ?? 0),
        aReceber: Number(dados.aReceber ?? 0),
        frotaAtiva: dados.frotaAtiva ?? 0,
        frotaTotal: dados.frotaTotal ?? 0,
      });
      setGrafico(Array.isArray(dados.grafico) ? dados.grafico : []);
    } catch (erro) {
      setErroApi(textoDoErro(erro, "Não foi possível carregar o painel. Verifique sua conexão."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setIsMounted(true);
    carregarDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const graficoTemDados = grafico.some(p => p.receitas > 0 || p.despesas > 0);
  const semMovimento = kpis.receitas === 0 && kpis.despesas === 0;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      <div>
        <h1 className="text-white text-2xl font-bold">Visão geral</h1>
        <p className="text-slate-400 text-sm mt-1">Resultado dos últimos 6 meses (mês atual e os 5 anteriores). Lançamentos cancelados não entram.</p>
      </div>

      {erroApi && (
        <div role="alert" className="bg-rose-500/10 border border-rose-500/40 text-rose-300 text-sm p-4 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          {erroApi}
          <button type="button" onClick={carregarDashboard} className={classeBotaoSecundario}>Tentar de novo</button>
        </div>
      )}

      {/* KPIs */}
      <section aria-label="Indicadores" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <div className={`${classeCartao} p-5 md:p-6`}>
          <div className="flex justify-between items-start mb-4">
            <span className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center" aria-hidden="true"><TrendingUp size={20} /></span>
          </div>
          <p className="text-slate-300 text-sm font-medium mb-1">Receitas (6 meses)</p>
          <p className="text-white text-2xl font-bold">{isLoading ? "…" : formatarMoedaInteira(kpis.receitas)}</p>
          {kpis.aReceber > 0 && (
            <p className="text-xs text-amber-200 mt-2 flex items-center gap-1"><Clock size={12} aria-hidden="true" /> {formatarMoeda(kpis.aReceber)} ainda a receber</p>
          )}
        </div>

        <div className={`${classeCartao} p-5 md:p-6`}>
          <div className="flex justify-between items-start mb-4">
            <span className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center" aria-hidden="true"><Wallet size={20} /></span>
          </div>
          <p className="text-slate-300 text-sm font-medium mb-1">Despesas (6 meses)</p>
          <p className="text-white text-2xl font-bold">{isLoading ? "…" : formatarMoedaInteira(kpis.despesas)}</p>
        </div>

        <div className={`${classeCartao} p-5 md:p-6`}>
          <div className="flex justify-between items-start mb-4">
            <span className="w-10 h-10 rounded-lg bg-orion-accent/10 text-orion-accent flex items-center justify-center" aria-hidden="true"><PieChart size={20} /></span>
            {!isLoading && kpis.saldo !== 0 && (
              <span className={`text-xs font-bold ${kpis.saldo > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {kpis.saldo > 0 ? "Positivo" : "Negativo"}
              </span>
            )}
          </div>
          <p className="text-slate-300 text-sm font-medium mb-1">Resultado (6 meses)</p>
          <p className={`text-2xl font-bold ${kpis.saldo < 0 ? "text-rose-400" : "text-white"}`}>{isLoading ? "…" : formatarMoedaInteira(kpis.saldo)}</p>
        </div>

        <div className={`${classeCartao} p-5 md:p-6`}>
          <div className="flex justify-between items-start mb-4">
            <span className="w-10 h-10 rounded-lg bg-orion-primary/10 text-orion-primary flex items-center justify-center" aria-hidden="true"><Bus size={20} /></span>
            {kpis.frotaAtiva < kpis.frotaTotal && (
              <span className="text-amber-300 text-xs font-bold flex items-center gap-1">
                <AlertTriangle size={12} aria-hidden="true" /> {kpis.frotaTotal - kpis.frotaAtiva} fora de operação
              </span>
            )}
          </div>
          <p className="text-slate-300 text-sm font-medium mb-1">Frota em operação</p>
          <p className="text-white text-2xl font-bold">
            {kpis.frotaAtiva} <span className="text-slate-400 text-lg font-medium">de {kpis.frotaTotal}</span>
          </p>
        </div>
      </section>

      {!isLoading && !erroApi && semMovimento && (
        <div className="bg-orion-primary/10 border border-orion-primary/30 text-amber-100 text-sm p-4 rounded-xl">
          Ainda não há receitas nem despesas no período. Para começar, registre um lançamento em{" "}
          <Link href="/dashboard/financeiro" className={`underline font-bold text-orion-primary rounded ${foco}`}>Financeiro</Link>{" "}
          ou, se já tem contratos cadastrados, use <strong>Gerar faturas do mês</strong> em{" "}
          <Link href="/dashboard/contratos" className={`underline font-bold text-orion-primary rounded ${foco}`}>Contratos</Link>.
        </div>
      )}

      {/* GRÁFICO */}
      <section aria-labelledby="titulo-grafico" className={`${classeCartao} p-5 md:p-6`}>
        <h2 id="titulo-grafico" className="text-white font-bold text-lg">Receitas e despesas por mês</h2>
        <p className="text-slate-400 text-sm mt-1 mb-6">Últimos 6 meses</p>

        <div className="w-full h-[300px] md:h-[350px]">
          {isLoading || !isMounted ? (
            <p className="h-full flex items-center justify-center text-slate-300">Carregando gráfico...</p>
          ) : !graficoTemDados ? (
            <p className="h-full flex items-center justify-center text-center text-slate-300 px-4">
              Sem movimentações nos últimos 6 meses. O gráfico aparece assim que houver lançamentos.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={grafico} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="corReceitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="corDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#CBD5E1", fontSize: 12, fontWeight: "bold" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} width={80} tick={{ fill: "#CBD5E1", fontSize: 12 }} tickFormatter={v => formatarMoedaCompacta(v)} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "12px", color: "#fff" }}
                  itemStyle={{ fontWeight: "bold" }}
                  formatter={(value, name) => [formatarMoeda(Number(value)), String(name ?? "")]}
                />
                <Legend wrapperStyle={{ color: "#CBD5E1", fontSize: 13, paddingTop: 12 }} />
                {/* Receita em linha contínua e despesa tracejada: não depende só da cor (WCAG 1.4.1) */}
                <Area type="monotone" dataKey="receitas" name="Receitas" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#corReceitas)" />
                <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#F43F5E" strokeWidth={3} strokeDasharray="6 4" fillOpacity={1} fill="url(#corDespesas)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* ÚLTIMAS MOVIMENTAÇÕES */}
      <section aria-labelledby="titulo-ultimas" className={`${classeCartao} overflow-hidden`}>
        <div className="p-5 md:p-6 flex items-center justify-between gap-4 border-b border-slate-700/50">
          <div>
            <h2 id="titulo-ultimas" className="text-white font-bold text-lg">Últimas movimentações</h2>
            <p className="text-slate-400 text-sm mt-1">Os 5 registros mais recentes</p>
          </div>
          <Link href="/dashboard/financeiro" className={`text-sm font-bold text-orion-primary hover:text-amber-300 underline-offset-4 hover:underline rounded px-1 min-h-6 ${foco}`}>
            Ver todas
          </Link>
        </div>

        {/* Carregando e vazio ficam fora da tabela: numa célula da tabela rolável o texto sairia cortado no celular */}
        {isLoading ? (
          <p role="status" className="px-6 py-8 text-center text-slate-300">Carregando...</p>
        ) : transacoes.length === 0 ? (
          <p className="px-6 py-8 text-center text-slate-300">
            Nenhuma movimentação ainda. Registre a primeira em{" "}
            <Link href="/dashboard/financeiro" className={`underline font-bold text-orion-primary rounded ${foco}`}>Financeiro</Link>.
          </p>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <caption className="sr-only">Últimas movimentações</caption>
            <thead className="bg-orion-bg/50 text-slate-300 uppercase text-xs font-bold tracking-wide border-b border-slate-700/50">
              <tr>
                <th scope="col" className="px-4 md:px-6 py-4">Data</th>
                <th scope="col" className="px-4 md:px-6 py-4">Descrição</th>
                <th scope="col" className="px-4 md:px-6 py-4">Status</th>
                <th scope="col" className="px-4 md:px-6 py-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {transacoes.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 md:px-6 py-4 text-slate-300">{formatarData(t.data)}</td>
                    <td className="px-4 md:px-6 py-4 text-white font-medium">{t.descricao}</td>
                    <td className="px-4 md:px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
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
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        )}
      </section>
    </div>
  );
}
