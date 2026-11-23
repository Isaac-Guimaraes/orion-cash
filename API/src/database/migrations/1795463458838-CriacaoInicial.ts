import { MigrationInterface, QueryRunner } from "typeorm";

export class CriacaoInicial1795463458838 implements MigrationInterface {
    name = 'CriacaoInicial1795463458838'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "orion"."usuarios_cargo_enum" AS ENUM('ADMIN', 'SOCIO', 'VISUALIZADOR')`);
        await queryRunner.query(`CREATE TABLE "usuarios" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "nome" character varying NOT NULL, "email" character varying NOT NULL, "senha_hash" character varying NOT NULL, "cargo" "orion"."usuarios_cargo_enum" NOT NULL DEFAULT 'VISUALIZADOR', "token_recuperacao" character varying, "validade_token_recuperacao" TIMESTAMP, "ativo" boolean NOT NULL DEFAULT true, "data_criacao" TIMESTAMP NOT NULL DEFAULT now(), "data_atualizacao" TIMESTAMP NOT NULL DEFAULT now(), "data_exclusao" TIMESTAMP, CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5" UNIQUE ("email"), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "orion"."veiculos_status_enum" AS ENUM('ATIVO', 'MANUTENCAO', 'VENDIDO')`);
        await queryRunner.query(`CREATE TABLE "veiculos" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "placa" character varying NOT NULL, "modelo" character varying NOT NULL, "marca" character varying NOT NULL, "ano" integer NOT NULL, "capacidade" integer NOT NULL DEFAULT '0', "status" "orion"."veiculos_status_enum" NOT NULL DEFAULT 'ATIVO', "data_criacao" TIMESTAMP NOT NULL DEFAULT now(), "data_atualizacao" TIMESTAMP NOT NULL DEFAULT now(), "data_exclusao" TIMESTAMP, CONSTRAINT "UQ_3c7f2de70c4765a04c070a9f745" UNIQUE ("placa"), CONSTRAINT "PK_0c3daa1e5d16914bd9e7777cf77" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "orion"."categorias_tipo_enum" AS ENUM('RECEITA', 'DESPESA')`);
        await queryRunner.query(`CREATE TABLE "categorias" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "nome" character varying NOT NULL, "tipo" "orion"."categorias_tipo_enum" NOT NULL, "is_sistema" boolean NOT NULL DEFAULT false, "id_pai" uuid, "data_criacao" TIMESTAMP NOT NULL DEFAULT now(), "data_atualizacao" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3886a26251605c571c6b4f861fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "contratos" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "nomeCliente" character varying NOT NULL, "cnpj" character varying NOT NULL, "valorTotal" numeric(12,2), "valorMensal" numeric(10,2) NOT NULL, "dataInicio" date NOT NULL, "dataTermino" date NOT NULL, "ativo" boolean NOT NULL DEFAULT true, "data_criacao" TIMESTAMP NOT NULL DEFAULT now(), "data_atualizacao" TIMESTAMP NOT NULL DEFAULT now(), "data_exclusao" TIMESTAMP, CONSTRAINT "UQ_599a5d875979f1872f974326625" UNIQUE ("cnpj"), CONSTRAINT "PK_cfae35069d6f59da899c17ed397" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "orion"."transacoes_tipo_enum" AS ENUM('RECEITA', 'DESPESA')`);
        await queryRunner.query(`CREATE TYPE "orion"."transacoes_status_enum" AS ENUM('PENDENTE', 'PAGO', 'CANCELADO')`);
        await queryRunner.query(`CREATE TABLE "transacoes" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "descricao" character varying NOT NULL, "valor" numeric(10,2) NOT NULL, "tipo" "orion"."transacoes_tipo_enum" NOT NULL, "data" date NOT NULL, "status" "orion"."transacoes_status_enum" NOT NULL DEFAULT 'PAGO', "competencia" character varying, "categoria_id" uuid NOT NULL, "veiculo_id" uuid, "contrato_id" uuid, "usuario_id" uuid NOT NULL, "data_criacao" TIMESTAMP NOT NULL DEFAULT now(), "data_atualizacao" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_19e05c3d8e87df1545fcc6c8505" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notificacoes" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "autor" character varying NOT NULL, "texto" character varying NOT NULL, "lida" boolean NOT NULL DEFAULT false, "data_criacao" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1161e00a97df46d9d3c5eed6545" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "categorias" ADD CONSTRAINT "FK_b7a1636595161eca4c42c15125d" FOREIGN KEY ("id_pai") REFERENCES "categorias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transacoes" ADD CONSTRAINT "FK_6975e4a0343a3d79aae921971a3" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transacoes" ADD CONSTRAINT "FK_ae32821b7088151b754e23d9891" FOREIGN KEY ("veiculo_id") REFERENCES "veiculos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transacoes" ADD CONSTRAINT "FK_0e87c58a6e9643067df9e168a3b" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transacoes" ADD CONSTRAINT "FK_8cb6a1f4e77824057f799940ec7" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transacoes" DROP CONSTRAINT "FK_8cb6a1f4e77824057f799940ec7"`);
        await queryRunner.query(`ALTER TABLE "transacoes" DROP CONSTRAINT "FK_0e87c58a6e9643067df9e168a3b"`);
        await queryRunner.query(`ALTER TABLE "transacoes" DROP CONSTRAINT "FK_ae32821b7088151b754e23d9891"`);
        await queryRunner.query(`ALTER TABLE "transacoes" DROP CONSTRAINT "FK_6975e4a0343a3d79aae921971a3"`);
        await queryRunner.query(`ALTER TABLE "categorias" DROP CONSTRAINT "FK_b7a1636595161eca4c42c15125d"`);
        await queryRunner.query(`DROP TABLE "notificacoes"`);
        await queryRunner.query(`DROP TABLE "transacoes"`);
        await queryRunner.query(`DROP TYPE "orion"."transacoes_status_enum"`);
        await queryRunner.query(`DROP TYPE "orion"."transacoes_tipo_enum"`);
        await queryRunner.query(`DROP TABLE "contratos"`);
        await queryRunner.query(`DROP TABLE "categorias"`);
        await queryRunner.query(`DROP TYPE "orion"."categorias_tipo_enum"`);
        await queryRunner.query(`DROP TABLE "veiculos"`);
        await queryRunner.query(`DROP TYPE "orion"."veiculos_status_enum"`);
        await queryRunner.query(`DROP TABLE "usuarios"`);
        await queryRunner.query(`DROP TYPE "orion"."usuarios_cargo_enum"`);
    }

}
