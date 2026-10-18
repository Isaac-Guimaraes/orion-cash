//Arquivo para popular o banco com as categorias '-'

import { AppDataSource } from "../database/data-source";
import { Categoria, TipoTransacao } from "../models/Categoria";

export class SeedCategoriaService {
  async executar() {
    const repo = AppDataSource.getRepository(Categoria);

    const quantidade = await repo.count();
    if (quantidade > 0) {
      console.log("✅ Categorias já existem. Pula Seed.");
      return; 
    }

    console.log("🌱 Criando categorias padrão...");

    // 1. DESPESAS - Manutenção
    const manutencao = repo.create({ nome: "Manutenção", tipo: TipoTransacao.DESPESA, isSistema: true });
    await repo.save(manutencao);

    const subsManutencao = ["Pneus", "Mecânica", "Elétrica", "Funilaria", "Troca de Óleo", "Lavagem"].map(nome => 
      repo.create({ nome, tipo: TipoTransacao.DESPESA, categoriaPai: manutencao, isSistema: true })
    );
    await repo.save(subsManutencao);

    // 2. DESPESAS - Combustível
    const combustivel = repo.create({ nome: "Combustível", tipo: TipoTransacao.DESPESA, isSistema: true });
    await repo.save(combustivel);

    // 3. DESPESAS - Administrativo
    const admin = repo.create({ nome: "Administrativo", tipo: TipoTransacao.DESPESA, isSistema: true });
    await repo.save(admin);
    const subsAdmin = ["Contabilidade", "Salários", "Pró-labore", "Sistemas"].map(nome => 
        repo.create({ nome, tipo: TipoTransacao.DESPESA, categoriaPai: admin, isSistema: true })
    );
    await repo.save(subsAdmin);

    // 4. RECEITAS
    const receita = repo.create({ nome: "Receita Operacional", tipo: TipoTransacao.RECEITA, isSistema: true });
    await repo.save(receita);
    const subsReceita = ["Contrato Fixo", "Viagem Extra"].map(nome => 
        repo.create({ nome, tipo: TipoTransacao.RECEITA, categoriaPai: receita, isSistema: true })
    );
    await repo.save(subsReceita);

    console.log("✅ Seed de Categorias finalizado!");
  }
}