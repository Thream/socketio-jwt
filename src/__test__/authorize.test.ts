import axios from 'axios'
import { io } from 'socket.io-client'

import { fixtureStart, fixtureStop } from './fixture'

describe('authorize', () => {
  let token: string = ''

  beforeEach((done) => {
    jest.setTimeout(15_000)
    fixtureStart(async () => {
      const response = await axios.post('http://localhost:9000/login')
      token = response.data.token
      done()
    })
  })

  afterEach((done) => {
    fixtureStop(done)
  })

  it('should emit error with no token provided', (done) => {
    const socket = io('http://localhost:9000')
    socket.on('connect_error', (err: any) => {
      expect(err.data.message).toEqual('no token provided')
      expect(err.data.code).toEqual('credentials_required')
      socket.close()
      done()
    })
  })

  it('should emit error with bad token format', (done) => {
    const socket = io('http://localhost:9000', {
      extraHeaders: { Authorization: 'testing' }
    })
    socket.on('connect_error', (err: any) => {
      expect(err.data.message).toEqual(
        'Format is Authorization: Bearer [token]'
      )
      expect(err.data.code).toEqual('credentials_bad_format')
      socket.close()
      done()
    })
  })

  it('should emit error with unauthorized handshake', (done) => {
    const socket = io('http://localhost:9000', {
      extraHeaders: { Authorization: 'Bearer testing' }
    })
    socket.on('connect_error', (err: any) => {
      expect(err.data.message).toEqual(
        'Unauthorized: Token is missing or invalid Bearer'
      )
      expect(err.data.code).toEqual('invalid_token')
      socket.close()
      done()
    })
  })

  it('should connect the user', (done) => {
    const socket = io('http://localhost:9000', {
      extraHeaders: { Authorization: `Bearer ${token}` }
    })
    socket.on('connect', () => {
      socket.close()
      done()
    })
  })
})
