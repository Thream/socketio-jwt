import jwt, { Algorithm } from 'jsonwebtoken'
import { Socket } from 'socket.io'

import { UnauthorizedError } from './UnauthorizedError'

interface ExtendedError extends Error {
  data?: any
}

type SocketIOMiddleware = (
  socket: Socket,
  next: (err?: ExtendedError) => void
) => void

interface AuthorizeOptions {
  secret: string | any; //TODO "any" makes no sense pls fix it thx ;)
  algorithms?: Algorithm[]
}

export const authorize = (options: AuthorizeOptions): SocketIOMiddleware => { //TODO pls add here async
  const { secret, algorithms = ['HS256', 'RS256'] } = options
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
    socket = Object.assign(socket, { encodedToken: token })
    let payload: any
    try {
      let decodedToken: any
      decodedToken = jwt.decode(token, { complete: true });

      if (!decodedToken)
        new UnauthorizedError('invalid_token', {
          message: 'Unauthorized: Jwt malformed'
        })

      if (typeof secret === "object") { //TODO exactly type is "JwksClient"
        secret.getSigningKey(decodedToken.header.kid, function (err: any, key: { publicKey: any; rsaPublicKey: any }) {
          var signingKey = key.publicKey || key.rsaPublicKey;
        });

        //payload = jwt.verify(token, secret, { algorithms });
      } else {
        payload = jwt.verify(token, secret, { algorithms })
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
