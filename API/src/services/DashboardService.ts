import { MoreThanOrEqual } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Transacao, StatusTransacao } from "../models/Transacao";
import { Veiculo } from "../models/Veiculo";
import { competenciaDe, dataIsoLocal, arredondar2 } from "../utils/datas";

const NOMES_MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
const MESES_NA_JANELA = 6;

/** "AAAA-MM" de uma data vinda do banco (SQLite devolve colunas `date` como string). */
function competenciaDaTransacao(data: Date | string): string {
  return typeof data === "string" ? data.slice(0, 7) : competenciaDe(data);
}

export class DashboardService {
  /**
   * RN-6 (Dashboard): receitas, despesas e saldo agregados dos últimos 6 meses
   * (mês atual + 5 anteriores). Transações CANCELADAS ficam de fora.
   */
  async executar() {
    const transacaoRepo = AppDataSource.getRepository(Transacao);
    const veiculoRepo = AppDataSource.getRepository(Veiculo);

    const hoje = new Date();
    const inicioJanela = new Date(hoje.getFullYear(), hoje.getMonth() - (MESES_NA_JANELA - 1), 1);

    // Comparação por string "AAAA-MM-DD": é assim que o SQLite guarda colunas `date`
    const transacoes = (
      await transacaoRepo.find({
        where: { data: MoreThanOrEqual(dataIsoLocal(inicioJanela) as unknown as Date) },
        order: { data: "ASC" }
      })
    ).filter(t => t.status !== StatusTransacao.CANCELADO);

    // Frota
    const veiculos = await veiculoRepo.find();
    const frotaTotal = veiculos.length;
    const frotaAtiva = veiculos.filter(v => v.status === "ATIVO").length;

    // Gráfico: os 6 meses aparecem sempre, mesmo sem movimentação.
    // A chave inclui o ano, para fevereiro/2025 e fevereiro/2026 não se misturarem.
    const mapaGrafico = new Map<string, { name: string; receitas: number; despesas: number }>();
    for (let i = MESES_NA_JANELA - 1; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      mapaGrafico.set(competenciaDe(d), { name: NOMES_MESES[d.getMonth()], receitas: 0, despesas: 0 });
    }

    let receitas = 0;
    let despesas = 0;
    let aReceber = 0; // receitas PENDENTES (ex.: faturas de contrato ainda não pagas)

    for (const t of transacoes) {
      const valor = Number(t.valor);
      const mes = mapaGrafico.get(competenciaDaTransacao(t.data));

      if (t.tipo === "RECEITA") {
        receitas += valor;
        if (t.status === StatusTransacao.PENDENTE) aReceber += valor;
        if (mes) mes.receitas += valor;
      }
      if (t.tipo === "DESPESA") {
        despesas += valor;
        if (mes) mes.despesas += valor;
      }
    }

    const grafico = Array.from(mapaGrafico.values()).map(m => ({
      ...m,
      receitas: arredondar2(m.receitas),
      despesas: arredondar2(m.despesas)
    }));

    // 5 últimas transações para a tabela
    const ultimasTransacoes = await transacaoRepo.find({
      order: { data: "DESC" },
      take: 5
    });

    const saldo = arredondar2(receitas - despesas);

    return {
      periodo: { inicio: dataIsoLocal(inicioJanela), meses: MESES_NA_JANELA },
      receitas: arredondar2(receitas),
      despesas: arredondar2(despesas),
      lucro: saldo, // mantido para compatibilidade com o frontend
      saldo,
      aReceber: arredondar2(aReceber),
      frotaAtiva,
      frotaTotal,
      grafico,
      ultimasTransacoes
    };
  }
}
