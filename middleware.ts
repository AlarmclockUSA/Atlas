import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  console.log('Middleware - Current path:', path);

  // Check if the path is create-password first
  if (path === '/create-password') {
    console.log('Middleware - Allowing access to create-password');
    return NextResponse.next()
  }

  // Define other public paths
  const publicPaths = ['/signin', '/signup', '/signup/success']
  const isPublicPath = publicPaths.includes(path)
  console.log('Middleware - Is public path:', isPublicPath);

  // Get the token from the session (if it exists)
  const token = request.cookies.get('session')?.value
  console.log('Middleware - Token exists:', !!token, 'Path:', path, 'Is public:', isPublicPath);

  // Allow access to public pages
  if (isPublicPath) {
    console.log('Middleware - Allowing access to public path:', path);
    return NextResponse.next()
  }

  // Redirect to signin if trying to access protected route without token
  if (!token) {
    console.log('Middleware - Redirecting to signin from protected route without token');
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  // For all other cases, allow the request to proceed
  console.log('Middleware - Allowing request to proceed normally');
  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

