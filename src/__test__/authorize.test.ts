import test from 'node:test'
import assert from 'node:assert/strict'

import axios from 'axios'
import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'

import { isUnauthorizedError } from '../UnauthorizedError.js'
import type { Profile } from './fixture/index.js'
import {
  API_URL,
  fixtureStart,
  fixtureStop,
  getSocket,
  basicProfile
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

await test('authorize', async (t) => {
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

    await t.test('should emit error with no token provided', () => {
      socket = io(API_URL)
      socket.on('connect_error', async (error) => {
        assert.strictEqual(isUnauthorizedError(error), true)
        if (isUnauthorizedError(error)) {
          assert.strictEqual(error.data.message, 'no token provided')
          assert.strictEqual(error.data.code, 'credentials_required')
          assert.ok(true)
        } else {
          assert.fail('should be unauthorized error')
        }
      })
      socket.on('connect', async () => {
        assert.fail('should not connect')
      })
    })

    await t.test('should emit error with bad token format', () => {
      socket = io(API_URL, {
        auth: { token: 'testing' }
      })
      socket.on('connect_error', async (error) => {
        assert.strictEqual(isUnauthorizedError(error), true)
        if (isUnauthorizedError(error)) {
          assert.strictEqual(
            error.data.message,
            'Format is Authorization: Bearer [token]'
          )
          assert.strictEqual(error.data.code, 'credentials_bad_format')
          assert.ok(true)
        } else {
          assert.fail('should be unauthorized error')
        }
      })
      socket.on('connect', async () => {
        assert.fail('should not connect')
      })
    })

    await t.test('should emit error with unauthorized handshake', () => {
      socket = io(API_URL, {
        auth: { token: 'Bearer testing' }
      })
      socket.on('connect_error', async (error) => {
        assert.strictEqual(isUnauthorizedError(error), true)
        if (isUnauthorizedError(error)) {
          assert.strictEqual(
            error.data.message,
            'Unauthorized: Token is missing or invalid Bearer'
          )
          assert.strictEqual(error.data.code, 'invalid_token')
          assert.ok(true)
        } else {
          assert.fail('should be unauthorized error')
        }
      })
      socket.on('connect', async () => {
        assert.fail('should not connect')
      })
    })

    await t.test('should connect the user', () => {
      socket = io(API_URL, {
        auth: { token: `Bearer ${token}` }
      })
      socket.on('connect', async () => {
        assert.ok(true)
      })
      socket.on('connect_error', async (error) => {
        assert.fail(error.message)
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

    await t.test('should emit error with no token provided', () => {
      socket = io(API_URL)
      socket.on('connect_error', async (error) => {
        assert.strictEqual(isUnauthorizedError(error), true)
        if (isUnauthorizedError(error)) {
          assert.strictEqual(error.data.message, 'no token provided')
          assert.strictEqual(error.data.code, 'credentials_required')
          assert.ok(true)
        } else {
          assert.fail('should be unauthorized error')
        }
      })
      socket.on('connect', async () => {
        assert.fail('should not connect')
      })
    })

    await t.test('should emit error with bad token format', () => {
      socket = io(API_URL, {
        auth: { token: 'testing' }
      })
      socket.on('connect_error', async (error) => {
        assert.strictEqual(isUnauthorizedError(error), true)
        if (isUnauthorizedError(error)) {
          assert.strictEqual(
            error.data.message,
            'Format is Authorization: Bearer [token]'
          )
          assert.strictEqual(error.data.code, 'credentials_bad_format')
          assert.ok(true)
        } else {
          assert.fail('should be unauthorized error')
        }
      })
      socket.on('connect', async () => {
        assert.fail('should not connect')
      })
    })

    await t.test('should emit error with unauthorized handshake', () => {
      socket = io(API_URL, {
        auth: { token: 'Bearer testing' }
      })
      socket.on('connect_error', async (error) => {
        assert.strictEqual(isUnauthorizedError(error), true)
        if (isUnauthorizedError(error)) {
          assert.strictEqual(
            error.data.message,
            'Unauthorized: Token is missing or invalid Bearer'
          )
          assert.strictEqual(error.data.code, 'invalid_token')
          assert.ok(true)
        } else {
          assert.fail('should be unauthorized error')
        }
      })
      socket.on('connect', async () => {
        assert.fail('should not connect')
      })
    })

    await t.test('should connect the user', () => {
      socket = io(API_URL, {
        auth: { token: `Bearer ${token}` }
      })
      socket.on('connect', async () => {
        assert.ok(true)
      })
      socket.on('connect_error', async (error) => {
        assert.fail(error.message)
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

    await t.test('should emit error with no token provided', () => {
      socket = io(API_URL)
      socket.on('connect_error', async (error) => {
        assert.strictEqual(isUnauthorizedError(error), true)
        if (isUnauthorizedError(error)) {
          assert.strictEqual(error.data.message, 'no token provided')
          assert.strictEqual(error.data.code, 'credentials_required')
          assert.ok(true)
        } else {
          assert.fail('should be unauthorized error')
        }
      })
      socket.on('connect', async () => {
        assert.fail('should not connect')
      })
    })

    await t.test('should emit error with bad token format', () => {
      socket = io(API_URL, {
        auth: { token: 'testing' }
      })
      socket.on('connect_error', async (error) => {
        assert.strictEqual(isUnauthorizedError(error), true)
        if (isUnauthorizedError(error)) {
          assert.strictEqual(
            error.data.message,
            'Format is Authorization: Bearer [token]'
          )
          assert.strictEqual(error.data.code, 'credentials_bad_format')
          assert.ok(true)
        } else {
          assert.fail('should be unauthorized error')
        }
      })
      socket.on('connect', async () => {
        assert.fail('should not connect')
      })
    })

    await t.test('should emit error with unauthorized handshake', () => {
      socket = io(API_URL, {
        auth: { token: 'Bearer testing' }
      })
      socket.on('connect_error', async (error) => {
        assert.strictEqual(isUnauthorizedError(error), true)
        if (isUnauthorizedError(error)) {
          assert.strictEqual(
            error.data.message,
            'Unauthorized: Token is missing or invalid Bearer'
          )
          assert.strictEqual(error.data.code, 'invalid_token')
          assert.ok(true)
        } else {
          assert.fail('should be unauthorized error')
        }
      })
      socket.on('connect', async () => {
        assert.fail('should not connect')
      })
    })

    await t.test('should connect the user', () => {
      socket = io(API_URL, {
        auth: { token: `Bearer ${token}` }
      })
      socket.on('connect', async () => {
        assert.ok(true)
      })
      socket.on('connect_error', async (error) => {
        assert.fail(error.message)
      })
    })

    await t.test('should contains user properties', () => {
      const socketServer = getSocket()
      socketServer?.on('connection', (client: any) => {
        assert.strictEqual(client.user.email, basicProfile.email)
        assert.ok(true)
      })
      socket = io(API_URL, {
        auth: { token: `Bearer ${token}` }
      })
      socket.on('connect_error', async (error) => {
        assert.fail(error.message)
      })
    })

    await t.test('should emit error when user validation fails', () => {
      socket = io(API_URL, {
        auth: { token: `Bearer ${wrongToken}` }
      })
      socket.on('connect_error', async (error) => {
        try {
          assert.strictEqual(error.message, 'Check Field validation failed')
          assert.ok(true)
        } catch {
          assert.fail(error.message)
        }
      })
      socket.on('connect', async () => {
        assert.fail('should not connect')
      })
    })
  })
})
