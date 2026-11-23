import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";
import { decimalParaNumero } from "../database/transformers";

@Entity("contratos")
export class Contrato {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  nomeCliente: string; // Ex: "Prefeitura de Irecê"

  @Column({ unique: true }) // RN-010: CNPJ único (somente dígitos)
  cnpj: string;

  // Valor total informado no cadastro. Nulo em contratos criados antes de 18/10/2026.
  @Column({ type: "decimal", precision: 12, scale: 2, transformer: decimalParaNumero, nullable: true })
  valorTotal: number | null;

  @Column({ type: "decimal", precision: 10, scale: 2, transformer: decimalParaNumero }) // Valor da parcela mensal. Ex: 15000.00
  valorMensal: number;

  @Column({ type: "date" })
  dataInicio: Date;

  @Column({ type: "date" })
  dataTermino: Date;

  @Column({ name: "ativo", default: true })
  ativo: boolean;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao: Date;

  @UpdateDateColumn({ name: "data_atualizacao" })
  dataAtualizacao: Date;

  @DeleteDateColumn({ name: "data_exclusao" })
  dataExclusao: Date;
}
