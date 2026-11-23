import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Next.js 16: "proxy" substitui a antiga convenção "middleware".
// Sem o cookie de sessão, /dashboard redireciona para /login (e vice-versa).
export function proxy(request: NextRequest) {
  const token = request.cookies.get('orion_token')?.value;
  const urlAtual = request.nextUrl.pathname;

  if (urlAtual.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (urlAtual === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/login'             
  ]
};