import { Router } from "express";
import { DashboardController } from "../controllers/DashboardController";
import { garantirAutenticacao } from "../middlewares/garantirAutenticacao";

const rotasDashboard = Router();
const controlador = new DashboardController();

// Só quem tem login pode ver o dinheiro da empresa!
rotasDashboard.use(garantirAutenticacao);

rotasDashboard.get("/", controlador.handle);

export { rotasDashboard };