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

interface CompleteDecodedToken {
  header: {
    alg: Algorithm
    [key: string]: any
  }
  payload: any
}

type SecretCallback = (decodedToken: CompleteDecodedToken) => Promise<string>

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
    socket.encodedToken = encodedToken
    let keySecret: string | null = null
    let decodedToken: any
    if (typeof secret === 'string') {
      keySecret = secret
    } else {
      const completeDecodedToken = jwt.decode(encodedToken, { complete: true })
      keySecret = await secret(completeDecodedToken as CompleteDecodedToken)
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
    socket.decodedToken = decodedToken
    return next()
  }
}
