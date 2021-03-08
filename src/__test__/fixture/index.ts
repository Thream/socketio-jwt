import express from 'express'
import jwt from 'jsonwebtoken'
import { Server as HttpServer } from 'http'
import { Server as HttpsServer } from 'https'
import { Server as SocketIoServer } from 'socket.io'
import enableDestroy from 'server-destroy'

import { authorize, AuthorizeOptions } from '../../index'

export interface Profile {
  email: string
  id: number
  checkField: boolean
}

interface Socket {
  io: null | SocketIoServer
  init: (httpServer: HttpServer | HttpsServer) => void
}

const socket: Socket = {
  io: null,
  init (httpServer) {
    socket.io = new SocketIoServer(httpServer)
  }
}

let server: HttpServer | null = null

export const fixtureStart = async (
  done: any,
  options: AuthorizeOptions = { secret: 'aaafoo super sercret' }
): Promise<void> => {
  const app = express()
  app.use(express.json())
  let keySecret = 'secret'
  if (typeof options.secret === 'string') {
    keySecret = options.secret
  } else {
    keySecret = await options.secret({ header: { alg: 'RS256' }, payload: '' })
  }
  app.post('/login', (_req, res) => {
    const profile: Profile = {
      email: 'john@doe.com',
      id: 123,
      checkField: true
    }
    const token = jwt.sign(profile, keySecret, {
      expiresIn: 60 * 60 * 5
    })
    return res.json({ token })
  })
  app.post('/login-wrong', (_req, res) => {
    const profile: Profile = {
      email: 'john@doe.com',
      id: 123,
      checkField: false
    }
    const token = jwt.sign(profile, keySecret, {
      expiresIn: 60 * 60 * 5
    })
    return res.json({ token })
  })
  server = app.listen(9000, done)
  socket.init(server)
  socket.io?.use(authorize(options))
  enableDestroy(server)
}

export const fixtureStop = (callback: Function): void => {
  socket.io?.close()
  try {
    server?.destroy()
  } catch (err) {}
  callback()
}

export const getSocket = (): SocketIoServer | null => {
  return socket.io
}
