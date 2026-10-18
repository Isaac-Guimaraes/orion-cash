import { Router } from "express";
import { AutenticacaoController } from "../controllers/AutenticacaoController";

const rotasAutenticacao = Router();
const controlador = new AutenticacaoController();

rotasAutenticacao.post("/login", controlador.login);

export { rotasAutenticacao };