import { AppError } from "../errors/AppError";
import { AppDataSource } from "../database/data-source";
import { Transacao, TipoTransacao, StatusTransacao } from "../models/Transacao";
import { Categoria } from "../models/Categoria";
import { Veiculo } from "../models/Veiculo";
import { paraDataLocal } from "../utils/datas";



interface IDadosTransacao {
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  status?: StatusTransacao;
  data: string;
  categoriaId: string;
  usuarioId: string;
  veiculoId?: string;
  contratoId?: string;
}

export class TransacaoService {
  private repositorio = AppDataSource.getRepository(Transacao);
  private repoCategoria = AppDataSource.getRepository(Categoria);
  private repoVeiculo = AppDataSource.getRepository(Veiculo);

  async criar({ descricao, valor, tipo,status, data, categoriaId, usuarioId, veiculoId, contratoId }: IDadosTransacao) {
    
    // 1. Validar Categoria
    const categoria = await this.repoCategoria.findOneBy({ id: categoriaId });
    if (!categoria) {
      throw new AppError("Categoria não encontrada.", 404);
    }

    if (categoria.tipo !== tipo) {
      throw new AppError(`A categoria selecionada não permite lançamentos do tipo ${tipo}`);
    }

    // 2. Validar Veículo (se informado)
    if (veiculoId) {
      const veiculo = await this.repoVeiculo.findOneBy({ id: veiculoId });
      if (!veiculo) {
        throw new AppError("Veículo não encontrado.", 404);
      }
    }

    const transacao = this.repositorio.create({
      descricao,
      valor,
      tipo,
      status: status || StatusTransacao.PAGO,
      data: paraDataLocal(data), // evita a data recuar 1 dia (UTC x horário local)
      categoriaId,
      usuarioId,
      veiculoId,
      contratoId
    });

    await this.repositorio.save(transacao);
    return transacao;
  }

  async listar() {
    // Traz todos os dados relacionados (Join) para exibir na tela
    return await this.repositorio.find({
      relations: ["categoria", "veiculo", "contrato", "usuario"],
      order: { data: "DESC" }
    });
  }

  async buscarPorId(id: string) {
    const transacao = await this.repositorio.findOne({
      where: { id },
      relations: ["categoria", "veiculo", "contrato", "usuario"]
    });

    if (!transacao) {
      throw new AppError("Transação não encontrada.", 404);
    }

    return transacao;
  }

  async atualizar(id: string, dados: Partial<IDadosTransacao>) {
    const transacao = await this.repositorio.findOneBy({ id });

    if (!transacao) {
      throw new AppError("Transação não encontrada.", 404);
    }

    // Se estiver tentando mudar a categoria, precisamos validar o tipo novamente
    if (dados.categoriaId) {
       const categoria = await this.repoCategoria.findOneBy({ id: dados.categoriaId });
       if (categoria && categoria.tipo !== dados.tipo) {
           // Nota: Aqui assumimos que se mudou a categoria, o tipo da transação deve bater
           // Se o usuário não mandou 'tipo' no update, usamos o que já estava no banco
           const tipoFinal = dados.tipo || transacao.tipo;
           if (categoria.tipo !== tipoFinal) {
               throw new AppError(`A nova categoria não aceita lançamentos do tipo ${tipoFinal}`);
           }
       }
    }

    this.repositorio.merge(transacao, {
        ...dados,
        data: dados.data ? paraDataLocal(dados.data) : transacao.data
    });

    await this.repositorio.save(transacao);
    return transacao;
  }

  async deletar(id: string) {
    const transacao = await this.repositorio.findOneBy({ id });

    if (!transacao) {
      throw new AppError("Transação não encontrada.", 404);
    }

    await this.repositorio.remove(transacao);
  }
}