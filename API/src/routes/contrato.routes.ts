import { Router } from "express";
import { ContratoController } from "../controllers/ContratoController";
import { garantirAutenticacao } from "../middlewares/garantirAutenticacao";

const rotasContrato = Router();
const controlador = new ContratoController();

rotasContrato.use(garantirAutenticacao);

rotasContrato.post("/", controlador.criar);
rotasContrato.get("/", controlador.listar);
rotasContrato.delete("/:id", controlador.deletar);
rotasContrato.post("/faturamento", controlador.gerarFaturamento);


export { rotasContrato };