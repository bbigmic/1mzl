// Middleware disabled - authentication is handled in the dashboard page component
// This is because NextAuth v4 with database sessions doesn't work well with middleware
export { default } from 'next-auth/middleware'

export const config = {
  matcher: [],
}

