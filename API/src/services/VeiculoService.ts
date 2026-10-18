import { AppDataSource } from "../database/data-source";
import { Veiculo, StatusVeiculo } from "../models/Veiculo";

interface IDadosVeiculo {
  placa: string;
  modelo: string;
  marca: string;
  ano: number;
  capacidade: number;
}

interface IDadosAtualizacaoVeiculo {
  modelo?: string;
  marca?: string;
  ano?: number;
  capacidade?: number;
  status?: StatusVeiculo;
}

export class VeiculoService {
  private repositorio = AppDataSource.getRepository(Veiculo);

  async criar({ placa, modelo, marca, ano, capacidade }: IDadosVeiculo) {
    const veiculoExiste = await this.repositorio.findOneBy({ placa });

    if (veiculoExiste) {
      throw new Error("Já existe um veículo cadastrado com esta placa.");
    }

    const veiculo = this.repositorio.create({
      placa,
      modelo,
      marca,
      ano,
      capacidade
    });

    await this.repositorio.save(veiculo);
    return veiculo;
  }

  async listar() {
    return await this.repositorio.find();
  }

  async buscarPorId(id: string) {
    const veiculo = await this.repositorio.findOneBy({ id });
    if (!veiculo) throw new Error("Veículo não encontrado.");
    return veiculo;
  }

  async atualizar(id: string, dados: IDadosAtualizacaoVeiculo) {
    const veiculo = await this.repositorio.findOneBy({ id });
    if (!veiculo) throw new Error("Veículo não encontrado.");

    this.repositorio.merge(veiculo, dados);
    await this.repositorio.save(veiculo);
    return veiculo;
  }

  async deletar(id: string) {
    const veiculo = await this.repositorio.findOneBy({ id });
    if (!veiculo) throw new Error("Veículo não encontrado.");
    
    await this.repositorio.softDelete(id);
  }
}