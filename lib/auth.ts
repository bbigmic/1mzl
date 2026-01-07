import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      console.log('Session callback called', { hasUser: !!user, hasSessionUser: !!session.user, userEmail: session.user?.email })
      
      if (!session.user) {
        console.error('Session user is missing')
        return session
      }
      
      // For database sessions, user should always be provided by PrismaAdapter
      // But we'll handle the case where it might not be
      let userId = user?.id
      
      if (!userId) {
        console.warn('User not provided in session callback, trying to find by email')
        if (session.user.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: session.user.email },
            })
            if (dbUser) {
              userId = dbUser.id
              console.log('Found user from database by email:', userId)
            } else {
              console.error('User not found in database by email:', session.user.email)
            }
          } catch (error) {
            console.error('Error fetching user from database:', error)
          }
        } else {
          console.error('No email in session.user to lookup user')
        }
      }

      if (!userId) {
        console.error('User ID is missing in session callback - session will not have id')
        // Return session without id - this will cause redirect in dashboard
        // But at least we log the issue
        return session
      }

      session.user.id = userId
      console.log('Session user id set to:', userId)
      
      // Get user subscription
      try {
        const subscription = await prisma.subscription.findUnique({
          where: { userId },
        })
        session.user.subscription = subscription
      } catch (error) {
        console.error('Error fetching subscription:', error)
        session.user.subscription = null
      }
      
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}

