import { Router } from "express";
import { CategoriaController } from "../controllers/CategoriaController";
import { garantirAutenticacao } from "../middlewares/garantirAutenticacao";

const rotasCategoria = Router();
const controlador = new CategoriaController();

rotasCategoria.use(garantirAutenticacao);

rotasCategoria.post("/", controlador.criar);
rotasCategoria.get("/", controlador.listar);
rotasCategoria.delete("/:id", controlador.deletar);

export { rotasCategoria };