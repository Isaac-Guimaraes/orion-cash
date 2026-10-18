import { Request, Response } from "express";
import { AutenticacaoService } from "../services/AutenticacaoService";

export class AutenticacaoController {
    async login(req: Request, res: Response) {
        const { email, senha } = req.body;

        const servico = new AutenticacaoService();

        try {
            const resultado = await servico.executar({ email, senha });
            return res.json(resultado);
            
        } catch (erro: any) {

            return res.status(401).json({ mensagem: erro.message });
        }
    }
}