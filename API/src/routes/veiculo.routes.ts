import { Router } from "express";
import { VeiculoController } from "../controllers/VeiculoController";
import { garantirAutenticacao } from "../middlewares/garantirAutenticacao";

const rotasVeiculo = Router();
const controlador = new VeiculoController();


rotasVeiculo.use(garantirAutenticacao);

rotasVeiculo.post("/", controlador.criar);
rotasVeiculo.get("/", controlador.listar);
rotasVeiculo.get("/:id", controlador.buscarPorId);
rotasVeiculo.put("/:id", controlador.atualizar);
rotasVeiculo.delete("/:id", controlador.deletar);

export { rotasVeiculo };