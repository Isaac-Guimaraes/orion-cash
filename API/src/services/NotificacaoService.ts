import { AppDataSource } from "../database/data-source";
import { Notificacao } from "../models/Notificacao";

export class NotificacaoService {
  private repositorio = AppDataSource.getRepository(Notificacao);

  async criar(autor: string, texto: string) {
    const notificacao = this.repositorio.create({ autor, texto });
    await this.repositorio.save(notificacao);
    return notificacao;
  }

  async listarUltimas() {
    return await this.repositorio.find({
      order: { dataCriacao: "DESC" },
      take: 5
    });
  }

  async marcarComoLidas() {
    await this.repositorio
      .createQueryBuilder()
      .update(Notificacao)
      .set({ lida: true })
      .where("lida = :lida", { lida: false })
      .execute();
  }
}