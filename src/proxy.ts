import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('babitrack_admin_token')?.value;
  const { pathname } = request.nextUrl;

  let userRole = '';
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const rawPayload = parts[1];
        const base64 = rawPayload.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = JSON.parse(atob(base64));
        userRole = jsonPayload.role;
      }
    } catch (e) {
      console.error('[Middleware] Erreur décodage token:', e);
    }
  }

  // Si accède à /superadmin
  if (pathname.startsWith('/superadmin')) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    if (userRole !== 'SUPER_ADMIN') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Si accède à /dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    if (userRole === 'SUPER_ADMIN') {
      const url = request.nextUrl.clone();
      url.pathname = '/superadmin';
      return NextResponse.redirect(url);
    }
  }

  // Si connecté et tente d'accéder à la page de login
  if (pathname === '/login' && token) {
    const url = request.nextUrl.clone();
    url.pathname = userRole === 'SUPER_ADMIN' ? '/superadmin' : '/dashboard';
    return NextResponse.redirect(url);
  }

  // Redirection de la racine
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    if (!token) {
      url.pathname = '/login';
    } else {
      url.pathname = userRole === 'SUPER_ADMIN' ? '/superadmin' : '/dashboard';
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*', '/superadmin/:path*'],
};

export default proxy;
