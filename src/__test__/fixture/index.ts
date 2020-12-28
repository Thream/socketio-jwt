import express from 'express'
import jwt from 'jsonwebtoken'
import { Server as HttpServer } from 'http'
import { Server as HttpsServer } from 'https'
import socketIo, { Server as SocketIoServer } from 'socket.io'
import enableDestroy from 'server-destroy'

import { authorize } from '../../index'

interface Socket {
  io: null | SocketIoServer
  init: (httpServer: HttpServer | HttpsServer) => void
}

const socket: Socket = {
  io: null,
  init(httpServer) {
    socket.io = socketIo(httpServer)
  }
}

let server: HttpServer | null = null

export const fixtureStart = (done: any, optionsAuth: any = {}) => {
  const options = Object.assign(
    {
      secret: 'aaafoo super sercret',
      timeout: 1000,
      handshake: true
    },
    optionsAuth
  )
  const app = express()
  app.use(express.json())
  app.post('/login', (_req, res) => {
    const profile = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@doe.com',
      id: 123
    }
    const token = jwt.sign(profile, options.secret, { expiresIn: 60 * 60 * 5 })
    return res.json({ token })
  })
  server = app.listen(9000, done)
  socket.init(server)
  socket.io?.use(authorize(options))
  enableDestroy(server)
}

export const fixtureStop = (callback: Function) => {
  socket.io?.close()
  try {
    server?.destroy()
  } catch (err) {}
  callback()
}
