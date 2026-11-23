import { Router } from "express";
import { UsuarioController } from "../controllers/UsuarioController";
import { garantirAutenticacao } from "../middlewares/garantirAutenticacao";
import { garantirCargo } from "../middlewares/garantirCargo";
import { garantirAdminOuPrimeiroCadastro } from "../middlewares/garantirAdminOuPrimeiroCadastro";
import { CargoUsuario } from "../models/Usuario";

const rotasUsuario = Router();
const controlador = new UsuarioController();

rotasUsuario.post("/", garantirAdminOuPrimeiroCadastro, controlador.criar);
rotasUsuario.get("/", garantirAutenticacao, garantirCargo(CargoUsuario.ADMIN), controlador.listar);
// Cada um edita o próprio perfil; ADMIN edita qualquer um (checado no controller)
rotasUsuario.put("/:id", garantirAutenticacao, controlador.atualizar);

export { rotasUsuario };
