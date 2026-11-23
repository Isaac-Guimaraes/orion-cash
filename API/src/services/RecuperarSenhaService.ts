import { AppError } from "../errors/AppError";
import { AppDataSource } from "../database/data-source";
import { Usuario } from "../models/Usuario";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { hash } from "bcryptjs";

export class RecuperarSenhaService {
  private repositorio = AppDataSource.getRepository(Usuario);

  // 1. SOLICITAR RECUPERAÇÃO DE SENHA
  async solicitar(email: string) {
    const usuario = await this.repositorio.findOneBy({ email });

    // Regra Anti-Enumeração: Se não existir, paramos silenciosamente sem dar erro
    if (!usuario) return;

    // Gera um token criptograficamente seguro e aleatório
    const tokenAleatorio = crypto.randomBytes(32).toString("hex");

    // Define a expiração para 1 hora a partir de agora
    const expiracao = new Date();
    expiracao.setHours(expiracao.getHours() + 1);

    // Salva o token e a validade no banco
    usuario.token_recuperacao = tokenAleatorio;
    usuario.validade_token_recuperacao = expiracao;
    await this.repositorio.save(usuario);

    // Configuração do envio de E-mail

    const transportador = nodemailer.createTransport({
      service: "gmail",
      // Credenciais vêm do .env — nunca escreva senhas no código
      auth: {
        user: process.env.EMAIL,
        pass: process.env.SENHAEMAIL
      }
    });

    const urlFrontend = process.env.FRONTEND_URL || "http://localhost:3000";
    const linkDeRecuperacao = `${urlFrontend}/redefinir-senha?token=${tokenAleatorio}`;

    await transportador.sendMail({
      from: `"Órion Cash" <${process.env.EMAIL}>`,
      to: usuario.email,
      subject: "Recuperação de Senha - Órion Cash",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #F59E0B;">Órion Cash</h2>
          <p>Olá, ${usuario.nome},</p>
          <p>Recebemos um pedido para redefinir a sua senha. Clique no botão abaixo para criar uma nova senha:</p>
          <a href="${linkDeRecuperacao}" style="display: inline-block; padding: 12px 24px; background-color: #F59E0B; color: #000; font-weight: bold; text-decoration: none; border-radius: 6px; margin: 20px 0;">Redefinir Minha Senha</a>
          <p style="color: #666; font-size: 12px;">Se você não solicitou esta alteração, ignore este e-mail. Este link é válido por 1 hora.</p>
        </div>
      `
    });
  }

  // 2. EXECUTAR A REDEFINIÇÃO
  async redefinir(token: string, novaSenha: string) {
    const usuario = await this.repositorio.findOneBy({ token_recuperacao: token });

    if (!usuario) {
      throw new AppError("Token inválido ou já utilizado.");
    }

    // Verifica se o tempo já passou
    if (new Date() > usuario.validade_token_recuperacao) {
      throw new AppError("O seu token expirou. Solicite um novo link de recuperação.");
    }

    // Encripta a nova senha
    const senhaHashEncr = await hash(novaSenha, 10);

    usuario.senhaHash = senhaHashEncr;
    
    usuario.token_recuperacao = null as any;
    usuario.validade_token_recuperacao = null as any;

    await this.repositorio.save(usuario);
  }
}