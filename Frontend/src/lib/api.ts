// Endereço da API, lido da variável de ambiente NEXT_PUBLIC_API_URL.
// Em desenvolvimento ela fica no arquivo Frontend/.env.local;
// em testes/produção, é configurada no serviço de hospedagem.
// O prefixo NEXT_PUBLIC_ é obrigatório para a variável chegar ao navegador.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030";
