import { Router } from "express";
import { RecuperarSenhaController } from "../controllers/RecuperarSenhaController";

const rotasRecuperarSenha = Router();
const recuperarSenhaController = new RecuperarSenhaController();

// Rota que recebe o e-mail e gera o Token + Envia o E-mail
rotasRecuperarSenha.post("/recuperar-senha", recuperarSenhaController.solicitar);

// Rota que recebe o Token do e-mail + a nova Senha para gravar no banco
rotasRecuperarSenha.post("/redefinir-senha", recuperarSenhaController.redefinir);

export { rotasRecuperarSenha };