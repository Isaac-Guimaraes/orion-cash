import "reflect-metadata";
import { DataSource } from "typeorm";
import 'dotenv/config';
import { Usuario } from "../models/Usuario";
import { Veiculo } from "../models/Veiculo";
import { Categoria } from "../models/Categoria"; 
import { Contrato } from "../models/Contrato";
import { Transacao } from "../models/Transacao";
import { Notificacao } from "../models/Notificacao";



export const AppDataSource = new DataSource({
    type: "sqlite",
    // Cada ambiente (dev, testes, produção) aponta para o SEU arquivo de banco
    database: process.env.DATABASE_PATH || "./src/database/orion.sqlite",
    // Em produção, alterações de schema devem ir por migrations (NODE_ENV=production desliga o sync)
    synchronize: process.env.NODE_ENV !== "production",
    logging: true,
    
    entities: [
        Usuario,
        Veiculo,
        Categoria,
        Contrato,
        Transacao,
        Notificacao
    ], 
    
    migrations: [],
    subscribers: [],
});