import { AppError } from "../errors/AppError";
import { AppDataSource } from "../database/data-source";
import { Categoria, TipoTransacao } from "../models/Categoria";
import { IsNull } from "typeorm";


interface IDadosCategoria {
  nome: string;
  tipo: TipoTransacao;
  idPai?: string;
}

export class CategoriaService {
  private repositorio = AppDataSource.getRepository(Categoria);

  async criar({ nome, tipo, idPai }: IDadosCategoria) {
    // Se tiver pai, verifica se ele existe
    if (idPai) {
      const paiExiste = await this.repositorio.findOneBy({ id: idPai });
      if (!paiExiste) {
        throw new AppError("Categoria pai não encontrada.", 404);
      }
      if (paiExiste.tipo !== tipo) {
        throw new AppError("A subcategoria deve ser do mesmo tipo da categoria pai.");
      }
    }

    const categoria = this.repositorio.create({
      nome,
      tipo,
      idPai
    });

    await this.repositorio.save(categoria);
    return categoria;
  }

  async listar() {
    return await this.repositorio.find({
      where: { idPai: IsNull() },
      relations: ["subcategorias"],
      order: { nome: "ASC" }
    });
    }
  
  async deletar(id: string) {
      const categoria = await this.repositorio.findOne({ 
          where: { id },
          relations: ["subcategorias"]
      });
      
      if(!categoria) throw new AppError("Categoria não encontrada", 404);
      
      if(categoria.isSistema) {
          throw new AppError("Não é possível deletar uma categoria do sistema.");
      }
      
      if(categoria.subcategorias.length > 0) {
          throw new AppError("Não é possível deletar categoria que possui subcategorias.");
      }
      
      await this.repositorio.remove(categoria);
  }
}