import { hash } from "bcryptjs";
import { AppDataSource } from "../database/data-source";
import { Usuario, CargoUsuario } from "../models/Usuario";

interface IDadosCadastroUsuario {
  nome: string;
  email: string;
  senha: string;
  cargo?: CargoUsuario;
}

interface IDadosAtualizacaoUsuario {
  id: string;
  nome: string;
}


export class UsuarioService {
  private repositorioUsuario = AppDataSource.getRepository(Usuario);

  async criar({ nome, email, senha, cargo }: IDadosCadastroUsuario) {
    const usuarioExiste = await this.repositorioUsuario.findOneBy({ email });

    if (usuarioExiste) {
      throw new Error("Já existe um usuário com este e-mail.");
    }

    const senhaCriptografada = await hash(senha, 8);

    const usuario = this.repositorioUsuario.create({
      nome,
      email,
      senhaHash: senhaCriptografada,
      cargo: cargo || CargoUsuario.VISUALIZADOR,
    });

    await this.repositorioUsuario.save(usuario);

    const usuarioRetorno = { ...usuario };
    delete (usuarioRetorno as any).senhaHash;
    
    return usuarioRetorno;
  }

  async listarTodos() {
    return await this.repositorioUsuario.find();
  }

  async atualizar({ id, nome }: IDadosAtualizacaoUsuario) {
    const usuario = await this.repositorioUsuario.findOneBy({ id });

    if (!usuario) {
      throw new Error("Usuário não encontrado.");
    }
    usuario.nome = nome;
    
    await this.repositorioUsuario.save(usuario);
    const usuarioRetorno = { ...usuario };
    delete (usuarioRetorno as any).senhaHash;
    
    return usuarioRetorno;
  }

}