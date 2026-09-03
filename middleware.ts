import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/index.html') {
    return NextResponse.redirect(new URL('/original-home.html', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/index.html'],
};
