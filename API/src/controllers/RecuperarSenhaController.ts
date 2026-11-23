import { Request, Response } from "express";
import { RecuperarSenhaService } from "../services/RecuperarSenhaService";
import { AppError } from "../errors/AppError";

export class RecuperarSenhaController {
  
  // Endpoint acionado pelo formulário do Frontend
  async solicitar(req: Request, res: Response) {
    const { email } = req.body;

    const servico = new RecuperarSenhaService();
    // Executamos sem o "await" bloquear, ou esperamos a execução
    await servico.solicitar(email);

    // Retornamos sempre sucesso, independente do e-mail existir (Anti-Enumeração)
    return res.status(200).json({ 
      mensagem: "Se o e-mail existir na nossa base de dados, receberá um link com as instruções em breve." 
    });
  }

  // Endpoint acionado quando o utilizador digita a senha nova
  async redefinir(req: Request, res: Response) {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
      throw new AppError("Token e nova senha são obrigatórios.");
    }

    const servico = new RecuperarSenhaService();

    await servico.redefinir(token, novaSenha);
    return res.status(200).json({ mensagem: "Senha redefinida com sucesso!" });
  }
}