import { Request, Response } from "express";
import { UsuarioService } from "../services/UsuarioService";

export class UsuarioController {
  
  async criar(req: Request, res: Response) {
    const { nome, email, senha, cargo } = req.body;
    const servico = new UsuarioService();
    
    try {
      const resultado = await servico.criar({ nome, email, senha, cargo });
      return res.status(201).json(resultado);
    } catch (erro: any) {
      return res.status(400).json({ mensagem: erro.message });
    }
  }

  async listar(req: Request, res: Response) {
    const servico = new UsuarioService();
    
    try {
      const resultado = await servico.listarTodos();
      return res.json(resultado); // 200: listagem não cria recurso
    } catch (erro: any) {
      return res.status(400).json({ mensagem: erro.message });
    }
    
  }

  async atualizar(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const { nome } = req.body;

    const servico = new UsuarioService();

    try {
      const resultado = await servico.atualizar({ id, nome });
      return res.json(resultado);
    } catch (erro: any) {
      return res.status(400).json({ mensagem: erro.message });
    }
  }
  
}