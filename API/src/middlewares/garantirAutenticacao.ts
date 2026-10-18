import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";

interface IPayloadJWT {
    sub: string;
    cargo: string;
}

export function garantirAutenticacao(req: Request, res: Response, next: NextFunction) {
    const tokenAutenticacao = req.headers.authorization;

    if (!tokenAutenticacao) {
        return res.status(401).json({ mensagem: "É necessário estar logado!" });
    }

    const [, token] = tokenAutenticacao.split(" ");

    const segredo = process.env.JWT_SECRET;
    if (!segredo) {
        console.error("JWT_SECRET não definido no .env");
        return res.status(500).json({ mensagem: "Servidor sem configuração de autenticação." });
    }

    try {
        const { sub, cargo } = verify(
            token, 
            segredo
        ) as IPayloadJWT;

        req.usuario = {
            id: sub,
            cargo: cargo
        };

        return next();
    } catch (erro) {
        return res.status(401).json({ mensagem: "É necessário realizar o login!" });
    }
}