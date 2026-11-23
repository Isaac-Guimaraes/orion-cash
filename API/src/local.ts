// Servidor para desenvolvimento local (npm run dev).
// Em produção na Vercel, este arquivo não é usado: a Vercel importa o app de src/app.ts.
import { app } from "./app";
import { inicializarBanco } from "./database/data-source";

const PORTA = process.env.PORT || 3030;

inicializarBanco()
  .then(() => console.log("Banco de Dados Conectado com Sucesso!"))
  .catch((erro) => console.error("Erro ao conectar no banco:", erro));

app.listen(PORTA, () => {
  console.log(`Servidor Órion rodando na porta ${PORTA}!`);
  console.log(`Endereço: http://localhost:${PORTA}`);
});
