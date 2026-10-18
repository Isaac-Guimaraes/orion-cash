import { redirect } from "next/navigation";

// A raiz "/" não tem conteúdo próprio: manda para o dashboard.
// Se o usuário não estiver logado, o middleware redireciona para /login.
export default function Home() {
  redirect("/dashboard");
}
