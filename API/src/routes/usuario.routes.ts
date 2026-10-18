import { Router } from "express";
import { UsuarioController } from "../controllers/UsuarioController";

const rotasUsuario = Router();
const controlador = new UsuarioController();

rotasUsuario.post("/", controlador.criar);
rotasUsuario.get("/", controlador.listar);
rotasUsuario.put("/:id", controlador.atualizar);

export { rotasUsuario };