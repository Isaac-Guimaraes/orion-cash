// Migrations do PostgreSQL (produção). Importadas explicitamente, e não por glob,
// para que o empacotamento da Vercel as inclua.
// Para criar uma nova: npm run migration:generate -- src/database/migrations/NomeDaMudanca
// e adicione a classe gerada nesta lista.
import { CriacaoInicial1795463458838 } from "./1795463458838-CriacaoInicial";

export const migrations: Function[] = [CriacaoInicial1795463458838];
