import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("notificacoes")
export class Notificacao {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  autor: string;

  @Column()
  texto: string;

  @Column({ default: false })
  lida: boolean;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao: Date;
}