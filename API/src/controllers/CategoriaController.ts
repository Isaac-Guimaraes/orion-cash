import { Request, Response } from "express";
import { CategoriaService } from "../services/CategoriaService";

export class CategoriaController {
  async criar(req: Request, res: Response) {
    const servico = new CategoriaService();
    const resultado = await servico.criar(req.body);
    return res.status(201).json(resultado);
  }

  async listar(req: Request, res: Response) {
    const servico = new CategoriaService();
    const resultado = await servico.listar();
    return res.json(resultado);
  }

  async deletar(req: Request<{ id: string }>, res: Response) {
      const { id } = req.params;
      const servico = new CategoriaService();
      await servico.deletar(id);
      return res.status(204).send();
  }
}