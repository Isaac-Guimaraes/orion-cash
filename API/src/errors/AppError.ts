// Erro de regra de negócio: a mensagem é segura para mostrar ao usuário.
// Qualquer outro erro (banco, bug, configuração) vira 500 com mensagem genérica
// no tratador global em app.ts, para não vazar detalhes internos.
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(mensagem: string, statusCode = 400) {
    super(mensagem);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}
