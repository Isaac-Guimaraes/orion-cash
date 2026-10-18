import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";

export enum CargoUsuario {
  ADMIN = "ADMIN",
  SOCIO = "SOCIO",
  VISUALIZADOR = "VISUALIZADOR"
}

@Entity("usuarios") // Nome da tabela no banco
export class Usuario {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: "senha_hash", select: false }) // No banco: senha_hash
  senhaHash: string;

  @Column({ type: "simple-enum", enum: CargoUsuario, default: CargoUsuario.VISUALIZADOR })
  cargo: CargoUsuario;

  @Column({ nullable: true })
  token_recuperacao: string;

  @Column({ type: "datetime", nullable: true })
  validade_token_recuperacao: Date;

  @Column({ name: "ativo", default: true })
  ativo: boolean;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao: Date;

  @UpdateDateColumn({ name: "data_atualizacao" })
  dataAtualizacao: Date;

  @DeleteDateColumn({ name: "data_exclusao" }) // Soft Delete
  dataExclusao: Date;
}