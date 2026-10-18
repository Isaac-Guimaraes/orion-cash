import { Request, Response } from "express";
import { VeiculoService } from "../services/VeiculoService";

export class VeiculoController {
  
  async criar(req: Request, res: Response) {
    const servico = new VeiculoService();
    const resultado = await servico.criar(req.body);
    return res.status(201).json(resultado);
  }

  async listar(req: Request, res: Response) {
    const servico = new VeiculoService();
    const resultado = await servico.listar();
    return res.json(resultado);
  }

  async buscarPorId(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const servico = new VeiculoService();
    const resultado = await servico.buscarPorId(id);
    return res.json(resultado);
  }

  async atualizar(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const servico = new VeiculoService();
    const resultado = await servico.atualizar(id, req.body);
    return res.json(resultado);
  }

  async deletar(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const servico = new VeiculoService();
    await servico.deletar(id);
    return res.status(204).send();
  }
}