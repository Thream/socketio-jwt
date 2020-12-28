import io from 'socket.io-client'
import { fixtureStart, fixtureStop } from './fixture/index'
import axios from 'axios'

describe('authorizer', () => {
  describe('when the user is not logged in', () => {
    beforeEach((done) => {
      jest.setTimeout(15_000)
      fixtureStart(done)
    })

    afterEach((done) => {
      fixtureStop(done)
    })

    it('should emit error with unauthorized handshake', (done) => {
      const socket = io.connect('http://localhost:9000?token=boooooo')
      socket.on('error', (err: any) => {
        expect(err.message).toEqual('jwt malformed')
        expect(err.code).toEqual('invalid_token')
        socket.close()
        done()
      })
    })
  })

  describe('when the user is logged in', () => {
    describe('authorizer disallows query string token when specified in startup options', () => {
      let token: string = ''

      beforeEach((done) => {
        jest.setTimeout(15_000)
        fixtureStart(
          async () => {
            const response = await axios.post('http://localhost:9000/login')
            token = response.data.token
            done()
          },
          { auth_header_required: true }
        )
      })

      afterEach((done) => {
        fixtureStop(done)
      })

      test('auth headers are supported', (done) => {
        const socket = io.connect('http://localhost:9000', {
          // @ts-ignore
          extraHeaders: { Authorization: `Bearer ${token}` }
        })
        socket.on('connect', () => {
          socket.close()
          done()
        })
      })

      test('auth token in query string is disallowed', (done) => {
        const socket = io.connect('http://localhost:9000', {
          query: `token=${token}`
        })
        socket.on('error', (err: any) => {
          expect(err.message).toEqual('Server requires Authorization Header')
          expect(err.code).toEqual('missing_authorization_header')
          socket.close()
          done()
        })
      })
    })

    describe('authorizer all auth types allowed', () => {
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

      it('auth headers are supported', (done) => {
        const socket = io.connect('http://localhost:9000', {
          // @ts-ignore
          extraHeaders: { Authorization: `Bearer ${token}` }
        })
        socket.on('connect', () => {
          socket.close()
          done()
        })
      })

      it('should do the handshake and connect', (done) => {
        const socket = io.connect('http://localhost:9000', {
          query: `token=${token}`
        })
        socket.on('connect', () => {
          socket.close()
          done()
        })
      })
    })
  })

  describe('unsigned token', () => {
    let token =
      'eyJhbGciOiJub25lIiwiY3R5IjoiSldUIn0.eyJuYW1lIjoiSm9obiBGb28ifQ.'

    beforeEach((done) => {
      jest.setTimeout(15_000)
      fixtureStart(done)
    })

    afterEach((done) => {
      fixtureStop(done)
    })

    it('should not do the handshake and connect', (done) => {
      const socket = io.connect('http://localhost:9000', {
        query: `token=${token}`
      })
      socket
        .on('connect', () => {
          socket.close()
          done(new Error("this shouldn't happen"))
        })
        .on('error', (err: any) => {
          socket.close()
          expect(err.message).toEqual('jwt signature is required')
          done()
        })
    })
  })
})
