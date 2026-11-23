import "reflect-metadata";
import express, { NextFunction, Request, Response } from 'express';
import "express-async-errors";
import cors from 'cors';
import helmet from 'helmet';
import { inicializarBanco } from "./database/data-source";
import { rotas } from "./routes";
import { AppError } from "./errors/AppError";

const app = express();

// 1. Middlewares (Configurações)
app.use(helmet()); // Protege headers HTTP
// CORS: só o(s) endereço(s) do frontend podem chamar a API pelo navegador.
// CORS_ORIGIN aceita vários, separados por vírgula. Sem a variável (desenvolvimento), libera tudo.
const origensPermitidas = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
  : undefined;
app.use(cors(origensPermitidas ? { origin: origensPermitidas } : undefined));
app.use(express.json()); // Permite ler JSON no corpo da requisição

// 2. Verificação de saúde (não depende do banco)
app.get("/", (req, res) => {
  res.json({ app: "Órion Cash API", status: "ok" });
});

// 3. Banco: conecta na primeira requisição e reaproveita a conexão nas seguintes.
// Funciona tanto no servidor local quanto em funções serverless (Vercel).
app.use(async (req, res, next) => {
  await inicializarBanco();
  next();
});

// 4. Rotas
app.use(rotas);

// 5. Tratamento Global de Erros (Para não travar o servidor)
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

  // Postgres: valor em formato inválido para a coluna (ex.: id que não é UUID na URL)
  if ((err as any).code === "22P02") {
    return res.status(400).json({
      status: "erro",
      mensagem: "Identificador ou valor em formato inválido."
    });
  }

  // Qualquer outro erro é interno: registra no log e não expõe detalhes ao cliente
  console.error(err);

  return res.status(500).json({
    status: "erro",
    mensagem: "Erro Interno do Servidor"
  });
});

// Export default: é o que a Vercel procura para rodar o Express como função.
// Localmente, quem chama app.listen é src/local.ts.
export { app };
export default app;