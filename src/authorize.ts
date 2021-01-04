import jwt, { Algorithm } from 'jsonwebtoken'
import { Socket } from 'socket.io'

import { UnauthorizedError } from './UnauthorizedError'

interface ExtendedError extends Error {
  data?: any
}

interface ExtendedSocket extends Socket {
  encodedToken?: string
  decodedToken?: any

type SocketIOMiddleware = (
  socket: ExtendedSocket,
  next: (err?: ExtendedError) => void
) => void

interface AuthorizeOptions {
  secret: string
  algorithms?: Algorithm[]
}

export const authorize = (options: AuthorizeOptions): SocketIOMiddleware => {
  const { secret, algorithms = ['HS256'] } = options
  return (socket, next) => {
    let token: string | null = null
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
      token = tokenSplitted[1]
    }
    if (token == null) {
      return next(
        new UnauthorizedError('credentials_required', {
          message: 'no token provided'
        })
      )
    }
    // Store encoded JWT
    socket.encodedToken = token
    let payload: any
    try {
      payload = jwt.verify(token, secret, { algorithms })
    } catch {
      return next(
        new UnauthorizedError('invalid_token', {
          message: 'Unauthorized: Token is missing or invalid Bearer'
        })
      )
    }
    // Store decoded JWT
    socket.decodedToken = payload
    return next()
  }
}
