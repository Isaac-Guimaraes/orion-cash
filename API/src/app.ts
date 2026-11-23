import "reflect-metadata";
import express, { NextFunction, Request, Response } from 'express';
import "express-async-errors";
import cors from 'cors';
import helmet from 'helmet';
import { AppDataSource } from "./database/data-source";
import { rotas } from "./routes";
import { SeedCategoriaService } from "./services/SeedCategoriaService";
import { AppError } from "./errors/AppError";



// 1. Conecta ao Banco de Dados SQLite
AppDataSource.initialize()
  .then(async() => {
    console.log("Banco de Dados Conectado com Sucesso!");
    const seed = new SeedCategoriaService();
    await seed.executar();
  })
  .catch((erro) => {
    console.error("Erro ao conectar no banco:", erro);
  });

const app = express();

// 2. Middlewares (Configurações)
app.use(helmet()); // Protege headers HTTP
// CORS: só o(s) endereço(s) do frontend podem chamar a API pelo navegador.
// CORS_ORIGIN aceita vários, separados por vírgula. Sem a variável (desenvolvimento), libera tudo.
const origensPermitidas = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
  : undefined;
app.use(cors(origensPermitidas ? { origin: origensPermitidas } : undefined));
app.use(express.json()); // Permite ler JSON no corpo da requisição

// 3. Rotas
app.use(rotas);

// 4. Tratamento Global de Erros (Para não travar o servidor)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Erro de regra de negócio (ex: "Já existe um usuário com este e-mail"): mensagem segura
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "erro",
      mensagem: err.message
    });
  }

  // JSON malformado no corpo da requisição
  if ((err as any).type === "entity.parse.failed") {
    return res.status(400).json({
      status: "erro",
      mensagem: "Corpo da requisição inválido."
    });
  }

  // Qualquer outro erro é interno: registra no log e não expõe detalhes ao cliente
  console.error(err);

  return res.status(500).json({
    status: "erro",
    mensagem: "Erro Interno do Servidor"
  });
});

export { app };