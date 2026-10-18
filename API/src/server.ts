import { app } from "./app";



const PORTA = process.env.PORT;

app.listen(PORTA, () => {
  console.log(`Servidor Órion rodando na porta ${PORTA}!`);
  console.log(`Endereço: http://localhost:${PORTA}`);
});