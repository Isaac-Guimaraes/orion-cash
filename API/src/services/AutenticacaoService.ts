import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { AppDataSource } from "../database/data-source";
import { Usuario } from "../models/Usuario";

interface IRequisicaoAutenticacao {
    email: string;
    senha: string;
}

export class AutenticacaoService {
    async executar({ email, senha }: IRequisicaoAutenticacao) {
        const repositorio = AppDataSource.getRepository(Usuario);

        const usuario = await repositorio.findOne({
            where: { email },
            select: ["id", "nome", "email", "senhaHash", "cargo", "ativo"] 
        });

        if (!usuario) {
            throw new Error("E-mail ou senha incorretos.");
        }

        if (!usuario.ativo) {
            throw new Error("Usuário desativado.");
        }

        // Compara a senha enviada com o Hash do banco
        const senhaConfere = await compare(senha, usuario.senhaHash);

        if (!senhaConfere) {
            throw new Error("E-mail ou senha incorretos.");
        }

        // Sem fallback: um segredo padrão conhecido permitiria forjar tokens
        const segredo = process.env.JWT_SECRET;
        if (!segredo) {
            throw new Error("JWT_SECRET não configurado no servidor.");
        }

        // Gera o Token JWT
        const token = sign(
            { 
                cargo: usuario.cargo,
                email: usuario.email 
            }, 
            segredo, // Chave do .env
            {
                subject: usuario.id,
                expiresIn: "1d" // Token expira em 1 dia
            }
        );

        return {
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                cargo: usuario.cargo
            }
        };
    }
}