// Formatação e conversão de valores exibidos na interface (pt-BR).

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const moedaInteira = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const moedaCompacta = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });

export const formatarMoeda = (valor: number | string) => moeda.format(Number(valor) || 0);
export const formatarMoedaInteira = (valor: number | string) => moedaInteira.format(Number(valor) || 0);
/** "R$ 1,5 mil", "R$ 2 mi": para eixos de gráfico. */
export const formatarMoedaCompacta = (valor: number | string) => moedaCompacta.format(Number(valor) || 0);

/**
 * "2026-11-23" (ou "2026-11-23T03:00:00.000Z") → "23/11/2026".
 * Não passa por `new Date()`: "AAAA-MM-DD" é interpretado como meia-noite UTC
 * e, no Brasil (UTC-3), a data apareceria um dia antes.
 */
export function formatarData(dataIso?: string | null): string {
  if (!dataIso) return "—";
  const [ano, mes, dia] = dataIso.slice(0, 10).split("-");
  if (!ano || !mes || !dia) return "—";
  return `${dia}/${mes}/${ano}`;
}

/** "AAAA-MM-DD" de uma data, no horário LOCAL (toISOString usaria UTC e viraria o dia seguinte após as 21h). */
export function dataIsoLocal(data: Date = new Date()): string {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

/**
 * Converte o que o usuário digitou num valor em reais: aceita "1.234,56", "1234,56" e "1234.56".
 * Devolve NaN se não for um número.
 */
export function converterValor(texto: string): number {
  const limpo = texto.trim().replace(/[R$\s]/g, "");
  if (!limpo) return NaN;
  // Com vírgula: padrão brasileiro (ponto é separador de milhar)
  const normalizado = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  return /^-?\d+(\.\d+)?$/.test(normalizado) ? Number(normalizado) : NaN;
}

/** 1234.5 → "1234,50" (para preencher campos de valor ao editar). */
export const valorParaCampo = (valor: number | string) =>
  Number(valor).toFixed(2).replace(".", ",");

/** Aplica a máscara 00.000.000/0000-00 enquanto o usuário digita. */
export function mascaraCnpj(texto: string): string {
  const d = texto.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/** Mensagem legível de um erro capturado em try/catch. */
export function textoDoErro(erro: unknown, padrao = "Algo deu errado. Tente novamente."): string {
  return erro instanceof Error && erro.message ? erro.message : padrao;
}

export const STATUS_TRANSACAO: Record<string, string> = {
  PAGO: "Pago",
  PENDENTE: "Pendente",
  CANCELADO: "Cancelado",
};

export const STATUS_VEICULO: Record<string, string> = {
  ATIVO: "Ativo",
  MANUTENCAO: "Em manutenção",
  VENDIDO: "Vendido",
};
