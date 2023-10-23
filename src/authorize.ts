import type { Algorithm } from "jsonwebtoken"
import jwt from "jsonwebtoken"
import type { Socket } from "socket.io"

import { UnauthorizedError } from "./UnauthorizedError.js"

declare module "socket.io" {
  interface Socket extends ExtendedSocket {}
}

interface ExtendedSocket {
  encodedToken?: string
  decodedToken?: any
  user?: any
}

type SocketIOMiddleware = (
  socket: Socket,
  next: (error?: UnauthorizedError) => void,
) => void

interface CompleteDecodedToken {
  header: {
    alg: Algorithm
    [key: string]: any
  }
  payload: any
}

type SecretCallback = (
  decodedToken: CompleteDecodedToken,
) => Promise<string> | string

export interface AuthorizeOptions {
  secret: string | SecretCallback
  algorithms?: Algorithm[]
  onAuthentication?: (decodedToken: any) => Promise<any> | any
}

export const authorize = (options: AuthorizeOptions): SocketIOMiddleware => {
  const { secret, algorithms = ["HS256"], onAuthentication } = options
  return async (socket, next) => {
    let encodedToken: string | null = null
    const { token } = socket.handshake.auth
    if (token != null) {
      const tokenSplitted = token.split(" ")
      if (tokenSplitted.length !== 2 || tokenSplitted[0] !== "Bearer") {
        return next(
          new UnauthorizedError("credentials_bad_format", {
            message: "Format is Authorization: Bearer [token]",
          }),
        )
      }
      encodedToken = tokenSplitted[1]
    }
    if (encodedToken == null) {
      return next(
        new UnauthorizedError("credentials_required", {
          message: "no token provided",
        }),
      )
    }
    socket.encodedToken = encodedToken
    let keySecret: string | null = null
    let decodedToken: any = null
    if (typeof secret === "string") {
      keySecret = secret
    } else {
      const completeDecodedToken = jwt.decode(encodedToken, { complete: true })
      keySecret = await secret(completeDecodedToken as CompleteDecodedToken)
    }
    try {
      decodedToken = jwt.verify(encodedToken, keySecret, { algorithms })
    } catch {
      return next(
        new UnauthorizedError("invalid_token", {
          message: "Unauthorized: Token is missing or invalid Bearer",
        }),
      )
    }
    socket.decodedToken = decodedToken
    if (onAuthentication != null) {
      try {
        socket.user = await onAuthentication(decodedToken)
      } catch (error: any) {
        return next(error)
      }
    }
    return next()
  }
}
