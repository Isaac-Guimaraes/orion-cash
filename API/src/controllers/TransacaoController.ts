import { Request, Response } from "express";
import { TransacaoService } from "../services/TransacaoService";

export class TransacaoController {
  
  

  async listar(req: Request, res: Response) {
    const servico = new TransacaoService();
    const resultado = await servico.listar();
    return res.json(resultado);
  }

  async criar(req: Request, res: Response) {
    const { descricao, valor, tipo,status, data, categoriaId, veiculoId, contratoId } = req.body;
    const usuarioId = req.usuario.id;

    const servico = new TransacaoService();
    
    const resultado = await servico.criar({
      descricao,
      valor,
      tipo,
      status,
      data,
      categoriaId,
      usuarioId,
      veiculoId,
      contratoId
    });

    return res.status(201).json(resultado);
  }

  async buscarPorId(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const servico = new TransacaoService();
    const resultado = await servico.buscarPorId(id);
    return res.json(resultado);
  }

  async atualizar(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    console.log("Recebido para atualizar:", req.body);

    const servico = new TransacaoService();
    
 
    const resultado = await servico.atualizar(id, req.body);
    
    return res.json(resultado);
  }

  async deletar(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const servico = new TransacaoService();
    await servico.deletar(id);
    return res.status(204).send();
  }
  
}