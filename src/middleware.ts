import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/users/credits(.*)', // Public user credits API
  '/api/payments(.*)', // Public payment APIs
  '/api/health(.*)', // Public health check APIs
  '/manifest.json', // PWA manifest
  '/about(.*)', // Public about page
  '/terms(.*)', // Public terms page
  '/privacy(.*)', // Public privacy page
  '/contact(.*)', // Public contact page
  '/cookies(.*)', // Public cookie policy page
  '/careers(.*)', // Public careers page
  '/blog(.*)' // Public blog page
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}