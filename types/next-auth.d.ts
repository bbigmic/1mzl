import 'next-auth'
import { Subscription } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      subscription?: Subscription | null
    }
  }
}

