import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";

export enum TipoTransacao {
  RECEITA = "RECEITA",
  DESPESA = "DESPESA"
}

@Entity("categorias")
export class Categoria {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  nome: string; // Ex: "Manutenção" ou "Pneus"

  @Column({ type: "simple-enum", enum: TipoTransacao })
  tipo: TipoTransacao;

  @Column({ name: "is_sistema", default: false })
  isSistema: boolean; // Se true, não deixa deletar

  // Auto-relacionamento (Pai)
  @Column({ name: "id_pai", nullable: true })
  idPai: string;

  @ManyToOne(() => Categoria, (categoria) => categoria.subcategorias)
  @JoinColumn({ name: "id_pai" })
  categoriaPai: Categoria;

  // Auto-relacionamento (Filhos)
  @OneToMany(() => Categoria, (categoria) => categoria.categoriaPai)
  subcategorias: Categoria[];

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao: Date;

  @UpdateDateColumn({ name: "data_atualizacao" })
  dataAtualizacao: Date;
}