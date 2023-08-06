<h1 align="center">Thream/socketio-jwt</h1>

<p align="center">
  <strong>Authenticate socket.io incoming connections with JWTs.</strong>
</p>

<p align="center">
  <a href="./CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/licence-MIT-blue.svg" alt="Licence MIT"/></a>
  <a href="./CODE_OF_CONDUCT.md"><img src="https://img.shields.io/badge/Contributor%20Covenant-v2.0%20adopted-ff69b4.svg" alt="Contributor Covenant" /></a>
  <br/>
  <a href="https://github.com/Thream/socketio-jwt/actions/workflows/build.yml"><img src="https://github.com/Thream/socketio-jwt/actions/workflows/build.yml/badge.svg?branch=develop" /></a>
  <a href="https://github.com/Thream/socketio-jwt/actions/workflows/lint.yml"><img src="https://github.com/Thream/socketio-jwt/actions/workflows/lint.yml/badge.svg?branch=develop" /></a>
  <a href="https://github.com/Thream/socketio-jwt/actions/workflows/test.yml"><img src="https://github.com/Thream/socketio-jwt/actions/workflows/test.yml/badge.svg?branch=develop" /></a>
  <br />
  <a href="https://conventionalcommits.org"><img src="https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg" alt="Conventional Commits" /></a>
  <a href="https://github.com/semantic-release/semantic-release"><img src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg" alt="semantic-release" /></a>
  <a href="https://www.npmjs.com/package/@thream/socketio-jwt"><img src="https://img.shields.io/npm/v/@thream/socketio-jwt.svg" alt="npm version"></a>
</p>

## 📜 About

Authenticate socket.io incoming connections with JWTs.

This repository was originally forked from [auth0-socketio-jwt](https://github.com/auth0-community/auth0-socketio-jwt) and it is not intended to take any credit but to improve the code from now on.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 16.0.0
- [Socket.IO](https://socket.io/) >= 3.0.0

## 💾 Install

**Note:** It is a package that is recommended to use/install on both the client and server sides.

```sh
npm install --save @thream/socketio-jwt
```

## ⚙️ Usage

### Server side

```ts
import { Server } from 'socket.io'
import { authorize } from '@thream/socketio-jwt'

const io = new Server(9000)
io.use(
  authorize({
    secret: 'your secret or public key'
  })
)

io.on('connection', async (socket) => {
  // jwt payload of the connected client
  console.log(socket.decodedToken)
  const clients = await io.sockets.allSockets()
  if (clients != null) {
    for (const clientId of clients) {
      const client = io.sockets.sockets.get(clientId)
      client?.emit('messages', { message: 'Success!' })
      // we can access the jwt payload of each connected client
      console.log(client?.decodedToken)
    }
  }
})
```

### Server side with `jwks-rsa` (example)

```ts
import jwksClient from 'jwks-rsa'
import { Server } from 'socket.io'
import { authorize } from '@thream/socketio-jwt'

const client = jwksClient({
  jwksUri: 'https://sandrino.auth0.com/.well-known/jwks.json'
})

const io = new Server(9000)
io.use(
  authorize({
    secret: async (decodedToken) => {
      const key = await client.getSigningKeyAsync(decodedToken.header.kid)
      return key.getPublicKey()
    }
  })
)

io.on('connection', async (socket) => {
  // jwt payload of the connected client
  console.log(socket.decodedToken)
  // You can do the same things of the previous example there...
})
```

### Server side with `onAuthentication` (example)

```ts
import { Server } from 'socket.io'
import { authorize } from '@thream/socketio-jwt'

const io = new Server(9000)
io.use(
  authorize({
    secret: 'your secret or public key',
    onAuthentication: async (decodedToken) => {
      // return the object that you want to add to the user property
      // or throw an error if the token is unauthorized
    }
  })
)

io.on('connection', async (socket) => {
  // jwt payload of the connected client
  console.log(socket.decodedToken)
  // You can do the same things of the previous example there...
  // user object returned in onAuthentication
  console.log(socket.user)
})
```

### `authorize` options

- `secret` is a string containing the secret for HMAC algorithms, or a function that should fetch the secret or public key as shown in the example with `jwks-rsa`.
- `algorithms` (default: `HS256`)
- `onAuthentication` is a function that will be called with the `decodedToken` as a parameter after the token is authenticated. Return a value to add to the `user` property in the socket object.

### Client side

```ts
import { io } from 'socket.io-client'
import { isUnauthorizedError } from '@thream/socketio-jwt/build/UnauthorizedError.js'

// Require Bearer Token
const socket = io('http://localhost:9000', {
  auth: { token: `Bearer ${yourJWT}` }
})

// Handling token expiration
socket.on('connect_error', (error) => {
  if (isUnauthorizedError(error)) {
    console.log('User token has expired')
  }
})

// Listening to events
socket.on('messages', (data) => {
  console.log(data)
})
```

## 💡 Contributing

Anyone can help to improve the project, submit a Feature Request, a bug report or even correct a simple spelling mistake.

The steps to contribute can be found in the [CONTRIBUTING.md](./CONTRIBUTING.md) file.

## 📄 License

[MIT](./LICENSE)
