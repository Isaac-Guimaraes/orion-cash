import { Request, Response } from "express";
import { AutenticacaoService } from "../services/AutenticacaoService";

export class AutenticacaoController {
    async login(req: Request, res: Response) {
        const { email, senha } = req.body;

        const servico = new AutenticacaoService();

        // Credenciais inválidas viram AppError 401 no service; o handler global responde
        const resultado = await servico.executar({ email, senha });
        return res.json(resultado);
    }
}
