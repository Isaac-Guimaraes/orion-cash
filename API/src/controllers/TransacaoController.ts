import { Request, Response } from "express";
import {
  TransacaoService, IFiltrosTransacao, POR_PAGINA_PADRAO, POR_PAGINA_MAXIMO
} from "../services/TransacaoService";
import { TipoTransacao, StatusTransacao } from "../models/Transacao";
import { AppError } from "../errors/AppError";

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Lê um parâmetro de texto da URL (?chave=valor); vazio vira undefined
function texto(req: Request, chave: string): string | undefined {
  const valor = req.query[chave];
  const unico = Array.isArray(valor) ? valor[0] : valor;
  return typeof unico === "string" && unico.trim() !== "" ? unico.trim() : undefined;
}

function inteiro(req: Request, chave: string, padrao: number, minimo: number, maximo: number, descricao: string) {
  const bruto = texto(req, chave);
  if (bruto === undefined) return padrao;
  const n = Number(bruto);
  if (!Number.isInteger(n) || n < minimo || n > maximo) {
    throw new AppError(`${descricao} deve ser um número inteiro entre ${minimo} e ${maximo}.`);
  }
  return n;
}

// Valida os filtros da listagem: GET /transacoes?dataInicio=&dataFim=&categoriaId=&veiculoId=&tipo=&status=&busca=
function lerFiltros(req: Request): IFiltrosTransacao {
  const dataInicio = texto(req, "dataInicio");
  const dataFim = texto(req, "dataFim");
  for (const [nome, valor] of [["Data inicial", dataInicio], ["Data final", dataFim]] as const) {
    if (valor && !DATA_ISO.test(valor)) throw new AppError(`${nome} inválida. Use o formato AAAA-MM-DD.`);
  }
  if (dataInicio && dataFim && dataFim < dataInicio) {
    throw new AppError("A data final deve ser igual ou posterior à data inicial.");
  }

  const categoriaId = texto(req, "categoriaId");
  const veiculoId = texto(req, "veiculoId");
  if (categoriaId && !UUID.test(categoriaId)) throw new AppError("Categoria inválida.");
  if (veiculoId && !UUID.test(veiculoId)) throw new AppError("Veículo inválido.");

  const tipo = texto(req, "tipo");
  if (tipo && !Object.values(TipoTransacao).includes(tipo as TipoTransacao)) {
    throw new AppError("Tipo inválido. Use RECEITA ou DESPESA.");
  }
  const status = texto(req, "status");
  if (status && !Object.values(StatusTransacao).includes(status as StatusTransacao)) {
    throw new AppError("Situação inválida. Use PENDENTE, PAGO ou CANCELADO.");
  }

  const busca = texto(req, "busca");
  if (busca && busca.length > 100) throw new AppError("A busca pode ter no máximo 100 caracteres.");

  return {
    dataInicio, dataFim, categoriaId, veiculoId, busca,
    tipo: tipo as TipoTransacao | undefined,
    status: status as StatusTransacao | undefined,
  };
}

export class TransacaoController {

  // Com ?pagina=N devolve { itens, total, pagina, porPagina, totalPaginas, totais }.
  // Sem "pagina" devolve a lista completa filtrada (exportação em CSV e clientes antigos).
  async listar(req: Request, res: Response) {
    const servico = new TransacaoService();
    const filtros = lerFiltros(req);

    if (texto(req, "pagina") === undefined) {
      return res.json(await servico.listar(filtros));
    }
    const pagina = inteiro(req, "pagina", 1, 1, 1_000_000, "A página");
    const porPagina = inteiro(req, "porPagina", POR_PAGINA_PADRAO, 1, POR_PAGINA_MAXIMO, "A quantidade por página");
    return res.json(await servico.listarPaginado(filtros, pagina, porPagina));
  }

  // GET /transacoes/resumo: soma de receitas e despesas com os mesmos filtros (cancelados não entram)
  async resumir(req: Request, res: Response) {
    const servico = new TransacaoService();
    return res.json(await servico.resumir(lerFiltros(req)));
  }

  async criar(req: Request, res: Response) {
    const { descricao, valor, tipo,status, data, categoriaId, veiculoId, contratoId } = req.body;
    const usuarioId = req.usuario.id;

    const servico = new TransacaoService();
    
    const resultado = await servico.criar({
      descricao,
      valor,
      tipo,
      status,
      data,
      categoriaId,
      usuarioId,
      veiculoId,
      contratoId
    });

    return res.status(201).json(resultado);
  }

  async buscarPorId(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const servico = new TransacaoService();
    const resultado = await servico.buscarPorId(id);
    return res.json(resultado);
  }

  async atualizar(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    console.log("Recebido para atualizar:", req.body);

    const servico = new TransacaoService();
    
 
    const resultado = await servico.atualizar(id, req.body);
    
    return res.json(resultado);
  }

  async deletar(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const servico = new TransacaoService();
    await servico.deletar(id);
    return res.status(204).send();
  }
  
}