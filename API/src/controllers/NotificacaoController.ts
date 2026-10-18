import { Request, Response } from "express";
import { NotificacaoService } from "../services/NotificacaoService";

export class NotificacaoController {
  
  async listar(req: Request, res: Response) {
    const service = new NotificacaoService();
    try {
      const notificacoes = await service.listarUltimas();
      return res.json(notificacoes);
    } catch (erro: any) {
      return res.status(500).json({ mensagem: "Erro ao buscar notificações." });
    }
  }

  async marcarLidas(req: Request, res: Response) {
    const service = new NotificacaoService();
    try {
      await service.marcarComoLidas();
      return res.json({ mensagem: "Notificações atualizadas com sucesso." });
    } catch (erro: any) {
      return res.status(500).json({ mensagem: "Erro ao atualizar notificações." });
    }
  }
}