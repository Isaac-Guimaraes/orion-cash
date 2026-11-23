import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import 'dotenv/config';
import { Usuario } from "../models/Usuario";
import { Veiculo } from "../models/Veiculo";
import { Categoria } from "../models/Categoria";
import { Contrato } from "../models/Contrato";
import { Transacao } from "../models/Transacao";
import { Notificacao } from "../models/Notificacao";
import { migrations } from "./migrations";

const entities = [Usuario, Veiculo, Categoria, Contrato, Transacao, Notificacao];

const emProducao = process.env.NODE_ENV === "production";

// SQL no console só em desenvolvimento; em produção, apenas erros
const logging: DataSourceOptions["logging"] = emProducao ? ["error"] : true;

// Com DATABASE_URL (produção/Supabase): PostgreSQL, schema evoluído só por migrations.
// Sem ela (desenvolvimento local): SQLite em arquivo, com o schema sincronizado automaticamente.
const opcoes: DataSourceOptions = process.env.DATABASE_URL
    ? {
        type: "postgres",
        url: process.env.DATABASE_URL,
        // Schema próprio: no Supabase, o "public" fica exposto pela API REST do projeto
        schema: process.env.DATABASE_SCHEMA || "orion",
        ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
        synchronize: false,
        migrations,
        // UUIDs com gen_random_uuid() (nativo do Postgres 13+), sem instalar extensões:
        // o usuário da aplicação não tem (nem deve ter) permissão para isso
        uuidExtension: "pgcrypto",
        installExtensions: false,
        // Em funções serverless, cada instância precisa de poucas conexões
        extra: { max: Number(process.env.DATABASE_POOL_MAX) || 3 },
        logging,
        entities,
    }
    : {
        type: "sqlite",
        database: process.env.DATABASE_PATH || "./src/database/orion.sqlite",
        synchronize: !emProducao,
        logging,
        entities,
    };

export const AppDataSource = new DataSource(opcoes);

// Inicializa a conexão uma única vez por instância (servidor local ou função serverless)
// e garante as categorias padrão. Chamadas concorrentes aguardam a mesma promessa.
let inicializacao: Promise<DataSource> | null = null;

export function inicializarBanco(): Promise<DataSource> {
    if (!inicializacao) {
        inicializacao = (async () => {
            await AppDataSource.initialize();
            // Import tardio para evitar dependência circular (o seed usa AppDataSource)
            const { SeedCategoriaService } = await import("../services/SeedCategoriaService");
            await new SeedCategoriaService().executar();
            return AppDataSource;
        })().catch((erro) => {
            inicializacao = null; // permite nova tentativa na próxima requisição
            if (AppDataSource.isInitialized) AppDataSource.destroy().catch(() => {});
            throw erro;
        });
    }
    return inicializacao;
}
