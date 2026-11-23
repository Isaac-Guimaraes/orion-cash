import { ValueTransformer } from "typeorm";

// O PostgreSQL devolve colunas decimal como string ("4500.00") para não perder precisão;
// o SQLite devolve number. Este transformer padroniza a saída como number nos dois bancos.
export const decimalParaNumero: ValueTransformer = {
  to: (valor?: number | null) => valor,
  from: (valor?: string | number | null) => (valor === null || valor === undefined ? valor : Number(valor)),
};
