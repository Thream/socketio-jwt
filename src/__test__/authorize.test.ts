import tap from 'tap'
import axios from 'axios'
import { io, Socket } from 'socket.io-client'

import { isUnauthorizedError } from '../UnauthorizedError.js'
import {
  API_URL,
  fixtureStart,
  fixtureStop,
  getSocket,
  basicProfile,
  Profile
} from './fixture/index.js'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

const secretCallback = async (): Promise<string> => {
  return 'somesecret'
}

await tap.test('authorize', async (t) => {
  await t.test('with secret as string in options', async (t) => {
    let token = ''
    let socket: Socket | null = null

    t.beforeEach(async () => {
      await fixtureStart()
      const response = await api.post('/login', {})
      token = response.data.token
    })

    t.afterEach(async () => {
      socket?.disconnect()
      await fixtureStop()
    })

    await t.test('should emit error with no token provided', (t) => {
      t.plan(4)
      socket = io(API_URL)
      socket.on('connect_error', async (error) => {
        t.equal(isUnauthorizedError(error), true)
        if (isUnauthorizedError(error)) {
          t.equal(error.data.message, 'no token provided')
          t.equal(error.data.code, 'credentials_required')
        }
        t.pass()
      })
      socket.on('connect', async () => {
        t.fail()
      })
    })

    await t.test('should emit error with bad token format', (t) => {
      t.plan(4)
      socket = io(API_URL, {
        auth: { token: 'testing' }
      })
      socket.on('connect_error', async (error) => {
        t.equal(isUnauthorizedError(error), true)
        if (isUnauthorizedError(error)) {
          t.equal(error.data.message, 'Format is Authorization: Bearer [token]')
          t.equal(error.data.code, 'credentials_bad_format')
        }
        t.pass()
      })
      socket.on('connect', async () => {
        t.fail()
      })
    })

    await t.test('should emit error with unauthorized handshake', (t) => {
      t.plan(4)
      socket = io(API_URL, {
        auth: { token: 'Bearer testing' }
      })
      socket.on('connect_error', async (error) => {
        t.equal(isUnauthorizedError(error), true)
        if (isUnauthorizedError(error)) {
          t.equal(
            error.data.message,
            'Unauthorized: Token is missing or invalid Bearer'
          )
          t.equal(error.data.code, 'invalid_token')
        }
        t.pass()
      })
      socket.on('connect', async () => {
        t.fail()
      })
    })

    await t.test('should connect the user', (t) => {
      t.plan(1)
      socket = io(API_URL, {
        auth: { token: `Bearer ${token}` }
      })
      socket.on('connect', async () => {
        t.pass()
      })
      socket.on('connect_error', async (error) => {
        t.fail(error.message)
      })
    })
  })

  await t.test('with secret as callback in options', async (t) => {
    let token = ''
    let socket: Socket | null = null

    t.beforeEach(async () => {
      await fixtureStart({ secret: secretCallback })
      const response = await api.post('/login', {})
      token = response.data.token
    })

    t.afterEach(async () => {
      socket?.disconnect()
      await fixtureStop()
    })

    await t.test('should emit error with no token provided', (t) => {
      t.plan(4)
      socket = io(API_URL)
      socket.on('connect_error', async (error) => {
        t.equal(isUnauthorizedError(error), true)
        if (isUnauthorizedError(error)) {
          t.equal(error.data.message, 'no token provided')
          t.equal(error.data.code, 'credentials_required')
        }
        t.pass()
      })
      socket.on('connect', async () => {
        t.fail()
      })
    })

    await t.test('should emit error with bad token format', (t) => {
      t.plan(4)
      socket = io(API_URL, {
        auth: { token: 'testing' }
      })
      socket.on('connect_error', async (error) => {
        t.equal(isUnauthorizedError(error), true)
        if (isUnauthorizedError(error)) {
          t.equal(error.data.message, 'Format is Authorization: Bearer [token]')
          t.equal(error.data.code, 'credentials_bad_format')
        }
        t.pass()
      })
      socket.on('connect', async () => {
        t.fail()
      })
    })

    await t.test('should emit error with unauthorized handshake', (t) => {
      t.plan(4)
      socket = io(API_URL, {
        auth: { token: 'Bearer testing' }
      })
      socket.on('connect_error', async (error) => {
        t.equal(isUnauthorizedError(error), true)
        if (isUnauthorizedError(error)) {
          t.equal(
            error.data.message,
            'Unauthorized: Token is missing or invalid Bearer'
          )
          t.equal(error.data.code, 'invalid_token')
        }
        t.pass()
      })
      socket.on('connect', async () => {
        t.fail()
      })
    })

    await t.test('should connect the user', (t) => {
      t.plan(1)
      socket = io(API_URL, {
        auth: { token: `Bearer ${token}` }
      })
      socket.on('connect', async () => {
        t.pass()
      })
      socket.on('connect_error', async (error) => {
        t.fail(error.message)
      })
    })
  })

  await t.test('with onAuthentication callback in options', async (t) => {
    let token = ''
    let wrongToken = ''
    let socket: Socket | null = null

    t.beforeEach(async () => {
      await fixtureStart({
        secret: secretCallback,
        onAuthentication: (decodedToken: Profile) => {
          if (!decodedToken.checkField) {
            throw new Error('Check Field validation failed')
          }
          return {
            email: decodedToken.email
          }
        }
      })
      const response = await api.post('/login', {})
      token = response.data.token
      const responseWrong = await api.post('/login-wrong', {})
      wrongToken = responseWrong.data.token
    })

    t.afterEach(async () => {
      socket?.disconnect()
      await fixtureStop()
    })

    await t.test('should emit error with no token provided', (t) => {
      t.plan(4)
      socket = io(API_URL)
      socket.on('connect_error', async (error) => {
        t.equal(isUnauthorizedError(error), true)
        if (isUnauthorizedError(error)) {
          t.equal(error.data.message, 'no token provided')
          t.equal(error.data.code, 'credentials_required')
        }
        t.pass()
      })
      socket.on('connect', async () => {
        t.fail()
      })
    })

    await t.test('should emit error with bad token format', (t) => {
      t.plan(4)
      socket = io(API_URL, {
        auth: { token: 'testing' }
      })
      socket.on('connect_error', async (error) => {
        t.equal(isUnauthorizedError(error), true)
        if (isUnauthorizedError(error)) {
          t.equal(error.data.message, 'Format is Authorization: Bearer [token]')
          t.equal(error.data.code, 'credentials_bad_format')
        }
        t.pass()
      })
      socket.on('connect', async () => {
        t.fail()
      })
    })

    await t.test('should emit error with unauthorized handshake', (t) => {
      t.plan(4)
      socket = io(API_URL, {
        auth: { token: 'Bearer testing' }
      })
      socket.on('connect_error', async (error) => {
        t.equal(isUnauthorizedError(error), true)
        if (isUnauthorizedError(error)) {
          t.equal(
            error.data.message,
            'Unauthorized: Token is missing or invalid Bearer'
          )
          t.equal(error.data.code, 'invalid_token')
        }
        t.pass()
      })
      socket.on('connect', async () => {
        t.fail()
      })
    })

    await t.test('should connect the user', (t) => {
      t.plan(1)
      socket = io(API_URL, {
        auth: { token: `Bearer ${token}` }
      })
      socket.on('connect', async () => {
        t.pass()
      })
      socket.on('connect_error', async (error) => {
        t.fail(error.message)
      })
    })

    await t.test('should contains user properties', (t) => {
      t.plan(2)
      const socketServer = getSocket()
      socketServer?.on('connection', (client: any) => {
        t.equal(client.user.email, basicProfile.email)
        t.pass()
      })
      socket = io(API_URL, {
        auth: { token: `Bearer ${token}` }
      })
      socket.on('connect_error', async (error) => {
        t.fail(error.message)
      })
    })

    await t.test('should emit error when user validation fails', (t) => {
      t.plan(2)
      socket = io(API_URL, {
        auth: { token: `Bearer ${wrongToken}` }
      })
      socket.on('connect_error', async (error) => {
        try {
          t.equal(error.message, 'Check Field validation failed')
          t.pass()
        } catch {
          t.fail()
        }
      })
      socket.on('connect', async () => {
        t.fail()
      })
    })
  })
})
