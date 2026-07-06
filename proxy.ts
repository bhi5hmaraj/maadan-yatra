import { clerkMiddleware } from '@clerk/nextjs/server';

function isAdminApiRoute(request: Request) {
  const url = new URL(request.url);
  const { pathname } = url;

  if (request.method === 'GET' && pathname === '/api/insurance/cases') {
    return true;
  }

  if (request.method === 'GET' && /^\/api\/insurance\/cases\/[^/]+$/.test(pathname)) {
    return true;
  }

  if (request.method === 'PUT' && /^\/api\/insurance\/cases\/[^/]+\/review$/.test(pathname)) {
    return true;
  }

  if (request.method === 'PUT' && /^\/api\/insurance\/cases\/[^/]+\/share$/.test(pathname)) {
    return true;
  }

  if (pathname.startsWith('/api/insurance/documents/')) {
    return true;
  }

  if (request.method === 'GET' && pathname === '/api/insurance/parse-jobs') {
    return true;
  }

  if (pathname === '/api/insurance/share-settings') {
    return true;
  }

  return false;
}

export default clerkMiddleware(async (auth, request) => {
  if (isAdminApiRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/__clerk/:path*',
    '/(api|trpc)(.*)',
  ],
};
