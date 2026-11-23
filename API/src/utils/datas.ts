import { AppError } from "../errors/AppError";
// Utilitários de data e valores monetários.
//
// Por que existe: `new Date("2026-01-01")` é interpretado como meia-noite UTC.
// No Brasil (UTC-3) isso vira 31/12/2025 às 21h, e o TypeORM grava colunas
// `date` usando o horário LOCAL — ou seja, a data recuava um dia no banco.
// Aqui todas as datas "AAAA-MM-DD" são tratadas como meia-noite no horário local.

const REGEX_DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})/;

/** Converte "AAAA-MM-DD" (ou um Date) para um Date à meia-noite local. */
export function paraDataLocal(valor: string | Date): Date {
  if (valor instanceof Date) {
    return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
  }

  const partes = REGEX_DATA_ISO.exec(String(valor));
  if (!partes) {
    throw new AppError(`Data inválida: "${valor}". Use o formato AAAA-MM-DD.`);
  }

  const [, ano, mes, dia] = partes.map(Number);
  const data = new Date(ano, mes - 1, dia);

  // Rejeita datas como 2026-02-31 (que o JS "rolaria" para março)
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    throw new AppError(`Data inválida: "${valor}".`);
  }

  return data;
}

/** Índice absoluto do mês (ano * 12 + mês), útil para diferenças entre competências. */
export function indiceMes(data: Date): number {
  return data.getFullYear() * 12 + data.getMonth();
}

/** Competência no formato "AAAA-MM". */
export function competenciaDe(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

/** Data local no formato "AAAA-MM-DD". */
export function dataIsoLocal(data: Date): string {
  return `${competenciaDe(data)}-${String(data.getDate()).padStart(2, "0")}`;
}

/**
 * Quantidade de parcelas mensais de um contrato (RN de fatiamento).
 *
 * Conta meses de calendário e soma 1 quando o término passa do "dia de aniversário"
 * do início (mês parcial também é faturado):
 *   01/01/2026 → 31/12/2026 = 12   (antes: 11)
 *   11/03/2026 → 11/03/2027 = 12
 *   15/01/2026 → 14/01/2027 = 12
 *   01/01/2026 → 31/01/2026 = 1
 */
export function calcularMesesDeDuracao(inicio: Date, termino: Date): number {
  let meses = indiceMes(termino) - indiceMes(inicio);
  if (termino.getDate() > inicio.getDate()) meses += 1;
  return Math.max(meses, 1);
}

/**
 * Valor da parcela de índice `indice` (0 = primeiro mês), sem perder centavos:
 * as parcelas são arredondadas para baixo e a última recebe a diferença.
 *   100.000,00 / 3 → 33.333,33 + 33.333,33 + 33.333,34
 */
export function calcularValorParcela(valorTotal: number, meses: number, indice: number): number {
  const totalCentavos = Math.round(Number(valorTotal) * 100);
  const parcelaCentavos = Math.floor(totalCentavos / meses);

  if (indice === meses - 1) {
    return (totalCentavos - parcelaCentavos * (meses - 1)) / 100;
  }
  return parcelaCentavos / 100;
}

/** Arredonda para 2 casas decimais. */
export function arredondar2(valor: number): number {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}
