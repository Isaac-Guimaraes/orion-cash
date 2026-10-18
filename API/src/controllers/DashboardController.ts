import { Request, Response } from "express";
import { DashboardService } from "../services/DashboardService";

export class DashboardController {
  async handle(req: Request, res: Response) {
    const servico = new DashboardService();
    const resultado = await servico.executar();
    return res.json(resultado);
  }
}