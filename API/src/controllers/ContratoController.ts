import { Request, Response } from "express";
import { ContratoService } from "../services/ContratoService";

export class ContratoController {

  async criar(req: Request, res: Response) {
    const servico = new ContratoService();
    const resultado = await servico.criar(req.body);
    return res.status(201).json(resultado);
  }

  async listar(req: Request, res: Response) {
    const servico = new ContratoService();
    const resultado = await servico.listar();
    return res.json(resultado);
  }

  async deletar(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const servico = new ContratoService();
    await servico.deletar(id);
    return res.status(204).send();
  }

  async gerarFaturamento(req: Request, res: Response) {
    // O operador vem do token JWT (garantirAutenticacao), não do body:
    // assim ninguém consegue lançar faturas em nome de outro usuário.
    const usuarioId = req.usuario.id;
    const servico = new ContratoService();
    // Erros sobem para o handler global (express-async-errors) e voltam como 400
    const resultado = await servico.gerarFaturamentoMensal(usuarioId);
    return res.json(resultado);
  }

}
