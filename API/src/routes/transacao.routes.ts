import { Router } from "express";
import { TransacaoController } from "../controllers/TransacaoController";
import { garantirAutenticacao } from "../middlewares/garantirAutenticacao";

const rotasTransacao = Router();
const controlador = new TransacaoController();

rotasTransacao.use(garantirAutenticacao);

rotasTransacao.post("/", controlador.criar);
rotasTransacao.get("/", controlador.listar);
rotasTransacao.get("/resumo", controlador.resumir); // antes de "/:id", senão "resumo" seria lido como id
rotasTransacao.get("/:id", controlador.buscarPorId);
rotasTransacao.put("/:id", controlador.atualizar);
rotasTransacao.delete("/:id", controlador.deletar);

export { rotasTransacao };