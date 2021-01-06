import jwt from 'jsonwebtoken'
import { Socket } from 'socket.io'
import { UnauthorizedError } from './UnauthorizedError'
import { JwksClient } from 'jwks-rsa'

interface ExtendedError extends Error {
  data?: any
}

type SocketIOMiddleware = (
  socket: Socket,
  next: (err?: ExtendedError) => void
) => void

interface AuthorizeOptions {
  secret: any
}

export const authorize = (options: AuthorizeOptions): SocketIOMiddleware => {
  const { secret } = options
  return async (socket, next) => {
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
    socket = Object.assign(socket, { encodedToken: token })
    let decodedToken: any
    let payload: any
    try {
      decodedToken = jwt.decode(token, { complete: true });
      if (!decodedToken) {
        return next(
          new UnauthorizedError('invalid_token', {
            message: 'jwt malformed'
          })
        )
      }
      if (secret.options.jwksUri) {
        let key: any
        let client: JwksClient
        client = secret;
        key = await client.getSigningKeyAsync(decodedToken.header.kid);
        payload = jwt.verify(token, key.rsaPublicKey)
      } else {
        payload = jwt.verify(token, secret)
      }
    } catch {
      return next(
        new UnauthorizedError('invalid_token', {
          message: 'Unauthorized: Token is missing or invalid Bearer'
        })
      )
    }
    // Store decoded JWT
    socket = Object.assign(socket, { decodedToken: payload })
    return next()
  }
}