import { Router } from "express";
import { NotificacaoController } from "../controllers/NotificacaoController";

import { garantirAutenticacao } from "../middlewares/garantirAutenticacao";

const rotasNotificacao = Router();
const controller = new NotificacaoController();

rotasNotificacao.use(garantirAutenticacao);

rotasNotificacao.get("/", controller.listar);
rotasNotificacao.put("/lidas", controller.marcarLidas);

export { rotasNotificacao };