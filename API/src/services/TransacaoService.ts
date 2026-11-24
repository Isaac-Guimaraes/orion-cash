import { Brackets, SelectQueryBuilder } from "typeorm";
import { AppError } from "../errors/AppError";
import { AppDataSource } from "../database/data-source";
import { Transacao, TipoTransacao, StatusTransacao } from "../models/Transacao";
import { Categoria } from "../models/Categoria";
import { Veiculo } from "../models/Veiculo";
import { paraDataLocal } from "../utils/datas";

export interface IFiltrosTransacao {
  dataInicio?: string; // AAAA-MM-DD
  dataFim?: string; // AAAA-MM-DD
  categoriaId?: string; // inclui as subcategorias
  veiculoId?: string;
  tipo?: TipoTransacao;
  status?: StatusTransacao;
  busca?: string; // descrição ou placa
}

export const POR_PAGINA_PADRAO = 20;
export const POR_PAGINA_MAXIMO = 100;

// Relações devolvidas na listagem. O usuário que lançou NÃO entra: o modelo Usuario traz
// token_recuperacao, e qualquer pessoa logada poderia usá-lo para redefinir a senha de outra.
const RELACOES = ["categoria", "veiculo", "contrato"];


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

  // Aplica os filtros numa consulta que tenha os apelidos "t" (transação) e "veiculo"
  private async aplicarFiltros(qb: SelectQueryBuilder<Transacao>, f: IFiltrosTransacao) {
    if (f.dataInicio) qb.andWhere("t.data >= :dataInicio", { dataInicio: f.dataInicio });
    if (f.dataFim) qb.andWhere("t.data <= :dataFim", { dataFim: f.dataFim });
    if (f.tipo) qb.andWhere("t.tipo = :tipo", { tipo: f.tipo });
    if (f.status) qb.andWhere("t.status = :status", { status: f.status });
    if (f.veiculoId) qb.andWhere("t.veiculoId = :veiculoId", { veiculoId: f.veiculoId });

    if (f.categoriaId) {
      const subcategorias = await this.repoCategoria.find({ where: { idPai: f.categoriaId }, select: { id: true } });
      qb.andWhere("t.categoriaId IN (:...categorias)", { categorias: [f.categoriaId, ...subcategorias.map(s => s.id)] });
    }

    if (f.busca) {
      // Escapa % e _ para o termo ser buscado ao pé da letra
      const termo = `%${f.busca.toLowerCase().replace(/[\\%_]/g, "\\$&")}%`;
      qb.andWhere(new Brackets(sub => {
        sub.where("LOWER(t.descricao) LIKE :termo ESCAPE '\\'", { termo })
          .orWhere("LOWER(veiculo.placa) LIKE :termo ESCAPE '\\'", { termo });
      }));
    }
    return qb;
  }

  private consultaListagem() {
    return this.repositorio
      .createQueryBuilder("t")
      .leftJoinAndSelect("t.categoria", "categoria")
      .leftJoinAndSelect("t.veiculo", "veiculo")
      .leftJoinAndSelect("t.contrato", "contrato")
      // Desempate por data de criação e id: sem ele, a paginação pode repetir ou pular registros
      .orderBy("t.data", "DESC")
      .addOrderBy("t.dataCriacao", "DESC")
      .addOrderBy("t.id", "DESC");
  }

  /** Todos os lançamentos que atendem aos filtros (usado na exportação em CSV). */
  async listar(filtros: IFiltrosTransacao = {}) {
    const qb = await this.aplicarFiltros(this.consultaListagem(), filtros);
    return qb.getMany();
  }

  /** Uma página dos lançamentos filtrados, com o total e as somas do conjunto filtrado. */
  async listarPaginado(filtros: IFiltrosTransacao, pagina: number, porPagina: number) {
    const qb = await this.aplicarFiltros(this.consultaListagem(), filtros);
    const [itens, total] = await qb.skip((pagina - 1) * porPagina).take(porPagina).getManyAndCount();
    return {
      itens,
      total,
      pagina,
      porPagina,
      totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
      totais: await this.resumir(filtros),
    };
  }

  /** Soma das receitas e despesas filtradas. Lançamentos cancelados não entram. */
  async resumir(filtros: IFiltrosTransacao) {
    const qb = this.repositorio
      .createQueryBuilder("t")
      .leftJoin("t.veiculo", "veiculo")
      .select("t.tipo", "tipo")
      .addSelect("COALESCE(SUM(t.valor), 0)", "soma")
      .where("t.status != :cancelado", { cancelado: StatusTransacao.CANCELADO })
      .groupBy("t.tipo");
    await this.aplicarFiltros(qb, filtros);

    const linhas: { tipo: TipoTransacao; soma: string | number }[] = await qb.getRawMany();
    // Postgres devolve SUM de decimal como texto; arredonda para centavos
    const somaDe = (tipo: TipoTransacao) =>
      Math.round(Number(linhas.find(l => l.tipo === tipo)?.soma ?? 0) * 100) / 100;
    const receitas = somaDe(TipoTransacao.RECEITA);
    const despesas = somaDe(TipoTransacao.DESPESA);
    return { receitas, despesas, saldo: Math.round((receitas - despesas) * 100) / 100 };
  }

  async buscarPorId(id: string) {
    const transacao = await this.repositorio.findOne({
      where: { id },
      relations: RELACOES
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