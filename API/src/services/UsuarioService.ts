import { AppError } from "../errors/AppError";
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

const TAMANHO_MINIMO_SENHA = 8;

// Só estes campos saem da API: nunca senha nem token de recuperação.
function paraRespostaPublica(usuario: Usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    cargo: usuario.cargo,
    ativo: usuario.ativo,
  };
}

export class UsuarioService {
  private repositorioUsuario = AppDataSource.getRepository(Usuario);

  async criar({ nome, email, senha, cargo }: IDadosCadastroUsuario) {
    if (!nome?.trim() || !email?.trim() || !senha) {
      throw new AppError("Nome, e-mail e senha são obrigatórios.");
    }

    if (senha.length < TAMANHO_MINIMO_SENHA) {
      throw new AppError(`A senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`);
    }

    if (cargo && !Object.values(CargoUsuario).includes(cargo)) {
      throw new AppError("Cargo inválido.");
    }

    const usuarioExiste = await this.repositorioUsuario.findOneBy({ email });

    if (usuarioExiste) {
      throw new AppError("Já existe um usuário com este e-mail.");
    }

    // A primeira conta do sistema é sempre ADMIN (ver garantirAdminOuPrimeiroCadastro)
    const ehPrimeiroUsuario = (await this.repositorioUsuario.count({ withDeleted: true })) === 0;

    const senhaCriptografada = await hash(senha, 10);

    const usuario = this.repositorioUsuario.create({
      nome: nome.trim(),
      email: email.trim(),
      senhaHash: senhaCriptografada,
      cargo: ehPrimeiroUsuario ? CargoUsuario.ADMIN : cargo || CargoUsuario.VISUALIZADOR,
    });

    await this.repositorioUsuario.save(usuario);

    return paraRespostaPublica(usuario);
  }

  async listarTodos() {
    const usuarios = await this.repositorioUsuario.find();
    return usuarios.map(paraRespostaPublica);
  }

  async atualizar({ id, nome }: IDadosAtualizacaoUsuario) {
    if (!nome?.trim()) {
      throw new AppError("O nome é obrigatório.");
    }

    const usuario = await this.repositorioUsuario.findOneBy({ id });

    if (!usuario) {
      throw new AppError("Usuário não encontrado.", 404);
    }
    usuario.nome = nome.trim();

    await this.repositorioUsuario.save(usuario);

    return paraRespostaPublica(usuario);
  }

}
