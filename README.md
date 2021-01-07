<h1 align="center">Thream/socketio-jwt</h1>

<p align="center">
  <strong>Authenticate socket.io incoming connections with JWTs.</strong>
</p>

<p align="center">
  <a href="https://github.com/Thream/socketio-jwt/actions?query=workflow%3A%22Node.js+CI%22"><img src="https://github.com/Thream/socketio-jwt/workflows/Node.js%20CI/badge.svg" alt="Node.js CI" /></a>
  <a href="https://codecov.io/gh/Thream/socketio-jwt"><img src="https://codecov.io/gh/Thream/socketio-jwt/branch/develop/graph/badge.svg" alt="codecov" /></a>
  <a href="https://dependabot.com/"><img src="https://badgen.net/github/dependabot/Thream/socketio-jwt?icon=dependabot" alt="Dependabot badge" /></a>
  <a href="https://www.npmjs.com/package/@thream/socketio-jwt"><img src="https://img.shields.io/npm/v/@thream/socketio-jwt.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/ts-standard"><img alt="TypeScript Standard Style" src="https://camo.githubusercontent.com/f87caadb70f384c0361ec72ccf07714ef69a5c0a/68747470733a2f2f62616467656e2e6e65742f62616467652f636f64652532307374796c652f74732d7374616e646172642f626c75653f69636f6e3d74797065736372697074"/></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/licence-MIT-blue.svg" alt="Licence MIT"/></a>
  <a href="https://conventionalcommits.org"><img src="https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg" alt="Conventional Commits" /></a>
  <a href="https://github.com/Thream/Thream/blob/master/.github/CODE_OF_CONDUCT.md"><img src="https://img.shields.io/badge/Contributor%20Covenant-v2.0%20adopted-ff69b4.svg" alt="Contributor Covenant" /></a>
</p>

## 📜 About

Authenticate socket.io incoming connections with JWTs.

Compatible with `socket.io >= 3.0`.

This repository was originally forked from [auth0-socketio-jwt](https://github.com/auth0-community/auth0-socketio-jwt) & it is not intended to take any credit but to improve the code from now on.

## 💾 Install

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

### Client side

```ts
import { io } from 'socket.io-client'

// Require Bearer Tokens to be passed in as an Authorization Header
const socket = io('http://localhost:9000', {
  extraHeaders: { Authorization: `Bearer ${yourJWT}` }
})

// Handling token expiration
socket.on('connect_error', (error) => {
  if (error.data.type === 'UnauthorizedError') {
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

The steps to contribute can be found in the [CONTRIBUTING.md](./.github/CONTRIBUTING.md) file.

## 📄 License

[MIT](./LICENSE)
