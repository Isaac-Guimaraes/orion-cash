import { Request, Response, NextFunction } from "express";
import { CargoUsuario } from "../models/Usuario";

// Usar sempre DEPOIS de garantirAutenticacao (depende de req.usuario).
export function garantirCargo(...cargosPermitidos: CargoUsuario[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!cargosPermitidos.includes(req.usuario?.cargo as CargoUsuario)) {
            return res.status(403).json({ mensagem: "Você não tem permissão para esta ação." });
        }
        return next();
    };
}
