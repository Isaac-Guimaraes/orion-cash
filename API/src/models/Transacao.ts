import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Categoria } from "./Categoria";
import { Veiculo } from "./Veiculo";
import { Contrato } from "./Contrato";
import { Usuario } from "./Usuario";

export enum StatusTransacao {
  PENDENTE = "PENDENTE",
  PAGO = "PAGO",
  CANCELADO = "CANCELADO"
}

export enum TipoTransacao {
  RECEITA = "RECEITA",
  DESPESA = "DESPESA"
}

@Entity("transacoes")
export class Transacao {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  descricao: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  valor: number;

  @Column({ type: "simple-enum", enum: TipoTransacao })
  tipo: TipoTransacao;

  @Column({ type: "date" })
  data: Date;

  @Column({ 
    type: "simple-enum", 
    enum: StatusTransacao, 
    default: StatusTransacao.PAGO 
  })
  status: StatusTransacao;

  // Competência "AAAA-MM" das faturas geradas pelo motor de recorrência
  // (chave de idempotência junto com contrato_id). Nulo em lançamentos manuais.
  @Column({ type: "varchar", nullable: true })
  competencia: string | null;

  // --- RELACIONAMENTOS ---

  // 1. Categoria (Obrigatório)
  @Column({ name: "categoria_id" })
  categoriaId: string;

  @ManyToOne(() => Categoria)
  @JoinColumn({ name: "categoria_id" })
  categoria: Categoria;

  // 2. Veículo (Opcional - null se for despesa de escritório)
  @Column({ name: "veiculo_id", nullable: true })
  veiculoId: string;

  @ManyToOne(() => Veiculo)
  @JoinColumn({ name: "veiculo_id" })
  veiculo: Veiculo;

  // 3. Contrato (Opcional - null se for venda avulsa)
  @Column({ name: "contrato_id", nullable: true })
  contratoId: string;

  @ManyToOne(() => Contrato)
  @JoinColumn({ name: "contrato_id" })
  contrato: Contrato;

  // 4. Usuário (Obrigatório - Quem lançou?)
  @Column({ name: "usuario_id" })
  usuarioId: string;

  

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: "usuario_id" })
  usuario: Usuario;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao: Date;

  @UpdateDateColumn({ name: "data_atualizacao" })
  dataAtualizacao: Date;
}