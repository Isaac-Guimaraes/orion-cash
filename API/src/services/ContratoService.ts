import { AppError } from "../errors/AppError";
import { IsNull } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Contrato } from "../models/Contrato";
import { Transacao, StatusTransacao, TipoTransacao } from "../models/Transacao";
import { Categoria, TipoTransacao as TipoCategoria } from "../models/Categoria";
import {
  paraDataLocal,
  indiceMes,
  competenciaDe,
  calcularMesesDeDuracao,
  calcularValorParcela,
  arredondar2
} from "../utils/datas";

const NOME_CATEGORIA_CONTRATO = "Contrato Fixo";

interface IDadosContrato {
  nomeCliente: string;
  cnpj: string;
  /** Valor total do contrato (RN de fatiamento). */
  valorTotal?: number;
  /** @deprecated Mantido para compatibilidade: versões antigas do frontend enviavam o total neste campo. */
  valorMensal?: number;
  dataInicio: string;
  dataTermino: string;
}

export class ContratoService {
  private repositorio = AppDataSource.getRepository(Contrato);

  async criar({ nomeCliente, cnpj, valorTotal, valorMensal, dataInicio, dataTermino }: IDadosContrato) {
    if (!nomeCliente?.trim()) {
      throw new AppError("O nome do cliente é obrigatório.");
    }

    // RN-010: CNPJ único. Normaliza para só dígitos, para "12.345.678/0001-90" e
    // "12345678000190" não virarem dois contratos diferentes.
    const cnpjNormalizado = String(cnpj ?? "").replace(/\D/g, "");
    if (cnpjNormalizado.length !== 14) {
      throw new AppError("CNPJ inválido. Informe os 14 dígitos.");
    }

    // withDeleted: a coluna é UNIQUE no banco também para contratos excluídos (soft delete).
    const contratoExiste = await this.repositorio.findOne({
      where: { cnpj: cnpjNormalizado },
      withDeleted: true
    });
    if (contratoExiste) {
      throw new AppError(
        contratoExiste.dataExclusao
          ? "Já existe um contrato excluído com este CNPJ."
          : "Já existe um contrato com este CNPJ."
      );
    }

    // RN-009: término estritamente posterior ao início
    const inicio = paraDataLocal(dataInicio);
    const termino = paraDataLocal(dataTermino);
    if (termino <= inicio) {
      throw new AppError("A data de término deve ser posterior à data de início.");
    }

    const total = Number(valorTotal ?? valorMensal);
    if (!Number.isFinite(total) || total <= 0) {
      throw new AppError("O valor deve ser positivo.");
    }

    // Fatiamento: valor total ÷ meses de duração
    const meses = calcularMesesDeDuracao(inicio, termino);

    const contrato = this.repositorio.create({
      nomeCliente: nomeCliente.trim(),
      cnpj: cnpjNormalizado,
      valorTotal: arredondar2(total),
      valorMensal: calcularValorParcela(total, meses, 0),
      dataInicio: inicio,
      dataTermino: termino
    });

    await this.repositorio.save(contrato);
    return contrato;
  }

  async listar() {
    return await this.repositorio.find({
      order: { nomeCliente: "ASC" }
    });
  }

  /**
   * Edita um contrato. Campos omitidos mantêm o valor atual.
   * A parcela mensal é recalculada; faturas PENDENTES do mês são ajustadas
   * na próxima geração de faturamento (upsert em gerarFaturamentoMensal).
   */
  async atualizar(id: string, dados: Partial<IDadosContrato> & { ativo?: boolean }) {
    const contrato = await this.repositorio.findOneBy({ id });
    if (!contrato) throw new AppError("Contrato não encontrado.", 404);

    const nomeCliente = (dados.nomeCliente ?? contrato.nomeCliente)?.trim();
    if (!nomeCliente) {
      throw new AppError("O nome do cliente é obrigatório.");
    }

    const cnpjNormalizado = String(dados.cnpj ?? contrato.cnpj).replace(/\D/g, "");
    if (cnpjNormalizado.length !== 14) {
      throw new AppError("CNPJ inválido. Informe os 14 dígitos.");
    }
    if (cnpjNormalizado !== contrato.cnpj) {
      const outro = await this.repositorio.findOne({ where: { cnpj: cnpjNormalizado }, withDeleted: true });
      if (outro) throw new AppError("Já existe um contrato com este CNPJ.");
    }

    const inicio = paraDataLocal(dados.dataInicio ?? contrato.dataInicio);
    const termino = paraDataLocal(dados.dataTermino ?? contrato.dataTermino);
    if (termino <= inicio) {
      throw new AppError("A data de término deve ser posterior à data de início.");
    }

    const meses = calcularMesesDeDuracao(inicio, termino);
    // Contratos antigos não têm valorTotal: reconstrói a partir da parcela gravada
    const total = Number(
      dados.valorTotal ?? contrato.valorTotal ?? Number(contrato.valorMensal) * meses
    );
    if (!Number.isFinite(total) || total <= 0) {
      throw new AppError("O valor deve ser positivo.");
    }

    contrato.nomeCliente = nomeCliente;
    contrato.cnpj = cnpjNormalizado;
    contrato.dataInicio = inicio;
    contrato.dataTermino = termino;
    contrato.valorTotal = arredondar2(total);
    contrato.valorMensal = calcularValorParcela(total, meses, 0);
    if (typeof dados.ativo === "boolean") contrato.ativo = dados.ativo;

    await this.repositorio.save(contrato);
    return contrato;
  }

  async deletar(id: string) {
    const contrato = await this.repositorio.findOneBy({ id });
    if (!contrato) throw new AppError("Contrato não encontrado.", 404);

    // Soft Delete
    await this.repositorio.softDelete(id);
  }

  /**
   * Motor de faturamento idempotente (upsert) da competência atual.
   * - Só fatura contratos cuja vigência inclui o mês atual.
   * - Identifica a fatura por contrato + competência (não mais só pelo nome do cliente).
   * - PENDENTE: atualiza o valor se mudou. PAGO/CANCELADO: não mexe no valor.
   */
  async gerarFaturamentoMensal(usuarioId: string) {
    if (!usuarioId) throw new AppError("ID do usuário é obrigatório.");

    const categoria = await AppDataSource.getRepository(Categoria).findOneBy({
      nome: NOME_CATEGORIA_CONTRATO,
      tipo: TipoCategoria.RECEITA
    });
    if (!categoria) {
      throw new Error(`Categoria "${NOME_CATEGORIA_CONTRATO}" não encontrada. Verifique o seed de categorias.`);
    }

    const contratosAtivos = await this.repositorio.find({ where: { ativo: true } });
    const transacaoRepo = AppDataSource.getRepository(Transacao);

    const dataAtual = new Date();
    const competencia = competenciaDe(dataAtual); // "AAAA-MM"
    const mes = String(dataAtual.getMonth() + 1).padStart(2, "0");
    const ano = dataAtual.getFullYear();

    let gerados = 0;
    let atualizados = 0;
    let foraDeVigencia = 0;

    for (const contrato of contratosAtivos) {
      const inicio = paraDataLocal(contrato.dataInicio);
      const termino = paraDataLocal(contrato.dataTermino);
      const meses = calcularMesesDeDuracao(inicio, termino);
      const indiceParcela = indiceMes(dataAtual) - indiceMes(inicio);

      // Contrato ainda não começou ou já terminou: não fatura
      if (indiceParcela < 0 || indiceParcela >= meses) {
        foraDeVigencia++;
        continue;
      }

      // Contratos novos têm valorTotal: a última parcela absorve os centavos do arredondamento.
      // Contratos antigos (sem valorTotal) continuam usando o valorMensal gravado.
      const valorParcela =
        contrato.valorTotal != null
          ? calcularValorParcela(Number(contrato.valorTotal), meses, indiceParcela)
          : arredondar2(Number(contrato.valorMensal));

      const descricaoFatura = `Recorrência: ${contrato.nomeCliente} - Mês ${mes}/${ano}`;

      // 1ª condição: chave nova (contrato + competência).
      // 2ª condição: faturas antigas, geradas antes desta correção (sem contrato_id).
      const faturaExistente = await transacaoRepo.findOne({
        where: [
          { contratoId: contrato.id, competencia },
          { descricao: descricaoFatura, contratoId: IsNull() }
        ]
      });

      if (faturaExistente) {
        let alterou = false;

        // Vincula faturas antigas ao contrato (não altera valor nem status)
        if (!faturaExistente.contratoId) {
          faturaExistente.contratoId = contrato.id;
          faturaExistente.competencia = competencia;
          alterou = true;
        }

        if (
          faturaExistente.status === StatusTransacao.PENDENTE &&
          arredondar2(Number(faturaExistente.valor)) !== valorParcela
        ) {
          faturaExistente.valor = valorParcela;
          atualizados++;
          alterou = true;
        }

        if (alterou) await transacaoRepo.save(faturaExistente);
      } else {
        const novaTransacao = transacaoRepo.create({
          descricao: descricaoFatura,
          valor: valorParcela,
          tipo: TipoTransacao.RECEITA,
          status: StatusTransacao.PENDENTE,
          data: dataAtual,
          competencia,
          contratoId: contrato.id,
          categoriaId: categoria.id,
          usuarioId
        });

        await transacaoRepo.save(novaTransacao);
        gerados++;
      }
    }

    return {
      mensagem: "Processamento concluído com sucesso!",
      faturasGeradas: gerados,
      faturasAtualizadas: atualizados,
      contratosForaDeVigencia: foraDeVigencia
    };
  }
}
