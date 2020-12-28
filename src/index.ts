import jwt from 'jsonwebtoken'
import { Socket } from 'socket.io'

class UnauthorizedError extends Error {
  public inner: { message: string }
  public data: { message: string, code: string, type: 'UnauthorizedError' }

  constructor (code: string, error: { message: string }) {
    super(error.message)
    this.message = error.message
    this.inner = error
    this.data = {
      message: this.message,
      code,
      type: 'UnauthorizedError'
    }
    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }
}

/**
 * If JwtAuthOptions.secret is a function, then this is the signature of the callback function provided to that function
 */
export type JwtSecretFuncCallback = (err: Error | null, secret: string) => void

/**
 * This is a function with two args payload, and done.
 *
 * `request` is the original request
 * `payload` is the decoded JWT payload
 * `callback` is an error-first callback defined below
 */
export type JwtSecretFunc = (
  request: any,
  payload: any,
  callback: JwtSecretFuncCallback
) => void

/**
 * This is an object literal that contains options.
 */
export interface JwtAuthOptions {
  auth_header_required?: boolean
  secret: string | JwtSecretFunc
  timeout?: number // In milliseconds to handle the second round trip.
  callback?: boolean | number // To disconnect socket server-side without a client-side callback if no valid token.
  decodedPropertyName?: string // Property to store the decoded token to.
  handshake?: boolean // Used to trigger a single round trip authentication.
  required?: boolean
}

/**
 * Defines possible errors for the secret-callback.
 */
interface ISocketIOError {
  readonly code: string
  readonly message: string
}

interface AuthOptions extends JwtAuthOptions {
  additional_auth?: (
    decoded: object,
    onSuccess: () => void,
    onError: (err: string | ISocketIOError, code: string) => void
  ) => void
  customDecoded?: (decoded: object) => object
  encodedPropertyName: string
  decodedPropertyName: string
  cookie?: string
}

type ISocketIOMiddleware = (socket: Socket, fn: (err?: any) => void) => void

/**
 * @description This function returns a middleware function for use with Socket.IO that authenticates a new connection.
 * @param options is an object literal that contains options.
 */
export function authorize (authOptions: JwtAuthOptions): ISocketIOMiddleware {
  const options: AuthOptions = Object.assign(
    {
      decodedPropertyName: 'decoded_token',
      encodedPropertyName: 'encoded_token'
    },
    authOptions
  )

  if (
    typeof options.secret !== 'string' &&
    typeof options.secret !== 'function'
  ) {
    throw new Error(
      `Provided secret ${options.secret} is invalid, must be of type string or function.`
    )
  }

  if (!options.handshake) {
    return noQsMethod(options)
  }

  const defaults = {
    success: (socket: Socket, accept: Function) => {
      if (socket.request) {
        accept()
      } else {
        accept(null, true)
      }
    },
    fail: (error: Error, socket: Socket, accept: Function) => {
      if (socket.request) {
        accept(error)
      } else {
        accept(null, false)
      }
    }
  }

  const auth = Object.assign(defaults, options)

  return (socket: Socket, accept: Function) => {
    let token: any, error: any

    const handshake = socket.handshake
    const req = socket.request || socket
    const authorization_header = (req.headers || {}).authorization

    if (authorization_header) {
      const parts = authorization_header.split(' ')
      if (parts.length == 2) {
        const scheme = parts[0]
        const credentials = parts[1]

        if (scheme.toLowerCase() === 'bearer') {
          token = credentials
        }
      } else {
        error = new UnauthorizedError('credentials_bad_format', {
          message: 'Format is Authorization: Bearer [token]'
        })
        return auth.fail(error, socket, accept)
      }
    }

    // Check if the header has to include authentication
    if (options.auth_header_required && token == null) {
      return auth.fail(
        new UnauthorizedError('missing_authorization_header', {
          message: 'Server requires Authorization Header'
        }),
        socket,
        accept
      )
    }

    // Get the token from handshake or query string
    if (handshake && handshake.query.token) {
      token = handshake.query.token
    } else if (req._query && req._query.token) {
      token = req._query.token
    } else if (req.query && req.query.token) {
      token = req.query.token
    }

    if (token == null) {
      error = new UnauthorizedError('credentials_required', {
        message: 'no token provided'
      })
      return auth.fail(error, socket, accept)
    }

    // Store encoded JWT
    socket = Object.assign(socket, { [options.encodedPropertyName]: token })

    const onJwtVerificationReady = (err: any) => {
      if (err != null) {
        error = new UnauthorizedError(err.code || 'invalid_token', err)
        return auth.fail(error, socket, accept)
      }

      socket = Object.assign(socket, {
        [options.decodedPropertyName]: options.customDecoded
      })

      return auth.success(socket, accept)
    }

    const onSecretReady = (err: any, secret: string) => {
      if (err) {
        error = new UnauthorizedError(err.code || 'invalid_secret', err)
        return auth.fail(error, socket, accept)
      }

      jwt.verify(token, secret, onJwtVerificationReady)
    }

    getSecret(req, options.secret, token, onSecretReady)
  }
}

function getSecret (request: any, secret: any, token: string, callback: Function) {
  if (typeof secret === 'function') {
    if (!token) {
      return callback({
        code: 'invalid_token',
        message: 'jwt must be provided'
      })
    }

    const parts = token.split('.')

    if (parts.length < 3) {
      return callback({ code: 'invalid_token', message: 'jwt malformed' })
    }

    if (parts[2].trim() === '') {
      return callback({
        code: 'invalid_token',
        message: 'jwt signature is required'
      })
    }

    const decodedToken = jwt.decode(token, { complete: true }) as { [key: string]: any }

    if (decodedToken == null) {
      return callback({ code: 'invalid_token', message: 'jwt malformed' })
    }

    const arity = secret.length
    if (arity == 4) {
      secret(request, decodedToken.header, decodedToken.payload, callback)
    } else {
      // arity == 3
      secret(request, decodedToken.payload, callback)
    }
  } else {
    callback(null, secret)
  }
}

function noQsMethod (options: AuthOptions): ISocketIOMiddleware {
  const defaults = { required: true }
  options = Object.assign(defaults, options)

  return (socket: Socket) => {
    let auth_timeout: NodeJS.Timeout | null = null
    if (options.required) {
      auth_timeout = setTimeout(() => {
        socket.disconnect(true)
      }, options.timeout ?? 5000)
    }

    socket.on('authenticate', (data: any) => {
      if (options.required && auth_timeout != null) {
        clearTimeout(auth_timeout)
      }

      const onError = (err: any, code: string) => {
        if (err) {
          code = code ?? 'unknown'
          const error = new UnauthorizedError(code, {
            message:
              Object.prototype.toString.call(err) === '[object Object]' &&
              err.message
                ? err.message
                : err
          })

          let callback_timeout: NodeJS.Timeout | null = null
          // If callback explicitly set to false, start timeout to disconnect socket
          if (
            options.callback === false ||
            typeof options.callback === 'number'
          ) {
            if (typeof options.callback === 'number') {
              if (options.callback < 0) {
                // If callback is negative(invalid value), make it positive
                options.callback = Math.abs(options.callback)
              }
            }

            callback_timeout = setTimeout(
              () => {
                socket.disconnect(true)
              },
              options.callback === false ? 0 : options.callback
            )
          }

          socket.emit('unauthorized', error, () => {
            if (typeof options.callback === 'number' && callback_timeout != null) {
              clearTimeout(callback_timeout)
            }
            socket.disconnect(true)
          })
          return null
        }
      }

      const token = options.cookie
        ? socket.request.cookies[options.cookie]
        : data
          ? data.token
          : undefined

      if (token == null || typeof token !== 'string') {
        return onError({ message: 'invalid token datatype' }, 'invalid_token')
      }

      // Store encoded JWT
      socket = Object.assign(socket, { [options.encodedPropertyName]: token })

      const onJwtVerificationReady = (err: any, decoded: any) => {
        if (err) {
          return onError(err, 'invalid_token')
        }

        // success handler
        const onSuccess = () => {
          socket = Object.assign(socket, {
            [options.decodedPropertyName]: options.customDecoded
          })
          socket.emit('authenticated')
        }

        if (
          options.additional_auth != null &&
          typeof options.additional_auth === 'function'
        ) {
          options.additional_auth(decoded, onSuccess, onError)
        } else {
          onSuccess()
        }
      }

      const onSecretReady = (err: any, secret: string) => {
        if (err != null || secret == null) {
          return onError(err, 'invalid_secret')
        }

        jwt.verify(token, secret, onJwtVerificationReady)
      }

      getSecret(socket.request, options.secret, token, onSecretReady)
    })
  }
}
