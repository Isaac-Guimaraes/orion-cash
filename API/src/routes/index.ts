import { Router } from "express";
import { rotasUsuario } from "./usuario.routes";
import { rotasAutenticacao } from "./autenticacao.routes";
import { rotasVeiculo } from "./veiculo.routes";
import { rotasContrato } from "./contrato.routes";
import { rotasTransacao } from "./transacao.routes";
import { rotasCategoria } from "./categoria.routes";
import { rotasDashboard } from "./dashboard.routes";
import { rotasRecuperarSenha } from "./RecuperarSenha.routes";
import { rotasNotificacao } from "./Notificacao.routes";


const rotas = Router();

rotas.use("/usuarios", rotasUsuario);
rotas.use("/sessao", rotasAutenticacao);
rotas.use("/veiculos", rotasVeiculo);
rotas.use("/contratos", rotasContrato);
rotas.use("/categorias", rotasCategoria);
rotas.use("/transacoes", rotasTransacao);
rotas.use("/dashboard", rotasDashboard);
rotas.use(rotasRecuperarSenha);
rotas.use("/notificacoes", rotasNotificacao);




export { rotas };