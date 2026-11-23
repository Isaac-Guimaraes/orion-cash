import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../database/data-source";
import { Usuario, CargoUsuario } from "../models/Usuario";
import { garantirAutenticacao } from "./garantirAutenticacao";
import { garantirCargo } from "./garantirCargo";

// Cadastro de usuários é restrito a administradores.
// Exceção: com o banco vazio, o primeiro cadastro é liberado (e vira ADMIN,
// ver UsuarioService.criar) — senão ninguém conseguiria criar a primeira conta.
export async function garantirAdminOuPrimeiroCadastro(req: Request, res: Response, next: NextFunction) {
    const totalUsuarios = await AppDataSource.getRepository(Usuario).count({ withDeleted: true });

    if (totalUsuarios === 0) {
        return next();
    }

    return garantirAutenticacao(req, res, () => garantirCargo(CargoUsuario.ADMIN)(req, res, next));
}
