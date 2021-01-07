import jwt, { Algorithm } from 'jsonwebtoken'
import { Socket } from 'socket.io'

import { UnauthorizedError } from './UnauthorizedError'

declare module 'socket.io' {
  interface Socket extends ExtendedSocket {}
}

interface ExtendedError extends Error {
  data?: any
}

interface ExtendedSocket {
  encodedToken?: string
  decodedToken?: any
}

type SocketIOMiddleware = (
  socket: Socket,
  next: (err?: ExtendedError) => void
) => void

type SecretCallback = (decodedToken: null | { [key: string]: any } | string) => Promise<string>

export interface AuthorizeOptions {
  secret: string | SecretCallback
  algorithms?: Algorithm[]
}

export const authorize = (options: AuthorizeOptions): SocketIOMiddleware => {
  const { secret, algorithms = ['HS256'] } = options
  return async (socket, next) => {
    let encodedToken: string | null = null
    const authorizationHeader = socket.request.headers.authorization
    if (authorizationHeader != null) {
      const tokenSplitted = authorizationHeader.split(' ')
      if (tokenSplitted.length !== 2 || tokenSplitted[0] !== 'Bearer') {
        return next(
          new UnauthorizedError('credentials_bad_format', {
            message: 'Format is Authorization: Bearer [token]'
          })
        )
      }
      encodedToken = tokenSplitted[1]
    }
    if (encodedToken == null) {
      return next(
        new UnauthorizedError('credentials_required', {
          message: 'no token provided'
        })
      )
    }
    // Store encoded JWT
    socket.encodedToken = encodedToken
    let keySecret: string | null = null
    let decodedToken: any
    if (typeof secret === 'string') {
      keySecret = secret
    } else {
      decodedToken = jwt.decode(encodedToken, { complete: true })
      keySecret = await secret(decodedToken)
    }
    try {
      decodedToken = jwt.verify(encodedToken, keySecret, { algorithms })
    } catch {
      return next(
        new UnauthorizedError('invalid_token', {
          message: 'Unauthorized: Token is missing or invalid Bearer'
        })
      )
    }
    // Store decoded JWT
    socket.decodedToken = decodedToken
    return next()
  }
}
