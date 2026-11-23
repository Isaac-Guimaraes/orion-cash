import { Request, Response } from "express";
import { UsuarioService } from "../services/UsuarioService";
import { CargoUsuario } from "../models/Usuario";
import { AppError } from "../errors/AppError";

// Erros lançados pelos services são tratados no handler global (app.ts).
export class UsuarioController {

  async criar(req: Request, res: Response) {
    const { nome, email, senha, cargo } = req.body;
    const servico = new UsuarioService();

    const resultado = await servico.criar({ nome, email, senha, cargo });
    return res.status(201).json(resultado);
  }

  async listar(req: Request, res: Response) {
    const servico = new UsuarioService();

    const resultado = await servico.listarTodos();
    return res.json(resultado); // 200: listagem não cria recurso
  }

  async atualizar(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const { nome } = req.body;

    const ehOProprioUsuario = req.usuario.id === id;
    const ehAdmin = req.usuario.cargo === CargoUsuario.ADMIN;
    if (!ehOProprioUsuario && !ehAdmin) {
      throw new AppError("Você só pode editar o seu próprio perfil.", 403);
    }

    const servico = new UsuarioService();

    const resultado = await servico.atualizar({ id, nome });
    return res.json(resultado);
  }

}
