import jwt from "jsonwebtoken"
import { Server as SocketIoServer } from "socket.io"
import type { FastifyInstance } from "fastify"
import fastify from "fastify"

import type { AuthorizeOptions } from "../../index.js"
import { authorize } from "../../index.js"

interface FastifyIo {
  instance: SocketIoServer
}

declare module "fastify" {
  export interface FastifyInstance {
    io: FastifyIo
  }
}

export interface BasicProfile {
  email: string
  id: number
}

export interface Profile extends BasicProfile {
  checkField: boolean
}

export const PORT = 9000
export const API_URL = `http://localhost:${PORT}`
export const basicProfile: BasicProfile = {
  email: "john@doe.com",
  id: 123,
}

let application: FastifyInstance | null = null

export const fixtureStart = async (
  options: AuthorizeOptions = { secret: "super secret" },
): Promise<void> => {
  const profile: Profile = { ...basicProfile, checkField: true }
  let keySecret = ""
  if (typeof options.secret === "string") {
    keySecret = options.secret
  } else {
    keySecret = await options.secret({
      header: { alg: "HS256" },
      payload: profile,
    })
  }
  application = fastify()
  application.post("/login", async (_request, reply) => {
    const token = jwt.sign(profile, keySecret, {
      expiresIn: 60 * 60 * 5,
    })
    reply.statusCode = 201
    return { token }
  })
  application.post("/login-wrong", async (_request, reply) => {
    profile.checkField = false
    const token = jwt.sign(profile, keySecret, {
      expiresIn: 60 * 60 * 5,
    })
    reply.statusCode = 201
    return { token }
  })
  const instance = new SocketIoServer(application.server)
  instance.use(authorize(options))
  application.decorate("io", { instance })
  application.addHook("onClose", (fastify) => {
    fastify.io.instance.close()
  })
  await application.listen({
    port: PORT,
  })
}

export const fixtureStop = async (): Promise<void> => {
  await application?.close()
}

export const getSocket = (): SocketIoServer | undefined => {
  return application?.io.instance
}
