import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";

export enum StatusVeiculo {
  ATIVO = "ATIVO",
  MANUTENCAO = "MANUTENCAO",
  VENDIDO = "VENDIDO"
}

@Entity("veiculos")
export class Veiculo {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true }) // Regra de Negócio: Placa única
  placa: string;

  @Column()
  modelo: string; // Ex: Volare W9

  @Column()
  marca: string; // Ex: Marcopolo

  @Column({ type: "int" })
  ano: number;

  @Column({ type: "int", default: 0 })
  capacidade: number; // Quantidade de passageiros

  @Column({ type: "simple-enum", enum: StatusVeiculo, default: StatusVeiculo.ATIVO })
  status: StatusVeiculo;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao: Date;

  @UpdateDateColumn({ name: "data_atualizacao" })
  dataAtualizacao: Date;

  @DeleteDateColumn({ name: "data_exclusao" })
  dataExclusao: Date;
}