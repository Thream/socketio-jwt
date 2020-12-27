<h1 align="center">Thream/socketio-jwt</h1>

<p align="center">
  <strong>Authenticate socket.io incoming connections with JWTs.</strong>
</p>

<p align="center">
  <a href="https://github.com/Thream/socketio-jwt/actions?query=workflow%3A%22Node.js+CI%22"><img src="https://github.com/Thream/socketio-jwt/workflows/Node.js%20CI/badge.svg" alt="Node.js CI" /></a>
  <a href="https://dependabot.com/"><img src="https://badgen.net/github/dependabot/Thream/socketio-jwt?icon=dependabot" alt="Dependabot badge" /></a>
  <a href="https://www.npmjs.com/package/ts-standard"><img alt="TypeScript Standard Style" src="https://camo.githubusercontent.com/f87caadb70f384c0361ec72ccf07714ef69a5c0a/68747470733a2f2f62616467656e2e6e65742f62616467652f636f64652532307374796c652f74732d7374616e646172642f626c75653f69636f6e3d74797065736372697074"/></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/licence-MIT-blue.svg" alt="Licence MIT"/></a>
  <a href="https://conventionalcommits.org"><img src="https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg" alt="Conventional Commits" /></a>
  <a href="./.github/CODE_OF_CONDUCT.md"><img src="https://img.shields.io/badge/Contributor%20Covenant-v2.0%20adopted-ff69b4.svg" alt="Contributor Covenant" /></a>
</p>

## 📜 About

Authenticate socket.io incoming connections with JWTs. This is useful if you are building a single page application and you are not using cookies as explained in this blog post: [Cookies vs Tokens. Getting auth right with Angular.JS](http://blog.auth0.com/2014/01/07/angularjs-authentication-with-cookies-vs-token/).

This repository was originally forked from [auth0-socketio-jwt](https://github.com/auth0-community/auth0-socketio-jwt) & it is not intended to take any credit but to improve the code from now on.

## Installation

```sh
npm install socketio-jwt
```

## ⚙️ Usage

```javascript
// set authorization for socket.io
io.sockets
  .on(
    'connection',
    socketioJwt.authorize({
      secret: 'your secret or public key',
      timeout: 15000 // 15 seconds to send the authentication message
    })
  )
  .on('authenticated', (socket) => {
    //this socket is authenticated, we are good to handle more events from it.
    console.log(`hello! ${socket.decoded_token.name}`)
  })
```

**Note:** If you are using a base64-encoded secret (e.g. your Auth0 secret key), you need to convert it to a Buffer: `Buffer('your secret key', 'base64')`

**Client side**

```javascript
const socket = io.connect('http://localhost:9000')
socket.on('connect', () => {
  socket
    .emit('authenticate', { token: jwt }) //send the jwt
    .on('authenticated', () => {
      //do other things
    })
    .on('unauthorized', (msg) => {
      console.log(`unauthorized: ${JSON.stringify(msg.data)}`)
      throw new Error(msg.data.type)
    })
})
```

### One roundtrip

The previous approach uses a second roundtrip to send the jwt. There is a way you can authenticate on the handshake by sending the JWT as a query string, the caveat is that intermediary HTTP servers can log the url.

```javascript
const io = require('socket.io')(server)
const socketioJwt = require('socketio-jwt')
```

With socket.io < 1.0:

```javascript
io.set(
  'authorization',
  socketioJwt.authorize({
    secret: 'your secret or public key',
    handshake: true
  })
)

io.on('connection', (socket) => {
  console.log('hello!', socket.handshake.decoded_token.name)
})
```

With socket.io >= 1.0:

```javascript
io.use(
  socketioJwt.authorize({
    secret: 'your secret or public key',
    handshake: true
  })
)

io.on('connection', (socket) => {
  console.log('hello!', socket.decoded_token.name)
})
```

For more validation options see [auth0/jsonwebtoken](https://github.com/auth0/node-jsonwebtoken).

**Client side**

Append the jwt token using query string:

```javascript
const socket = io.connect('http://localhost:9000', {
  query: `token=${your_jwt}`
})
```

Append the jwt token using 'Authorization Header' (Bearer Token):

```javascript
const socket = io.connect('http://localhost:9000', {
  extraHeaders: { Authorization: `Bearer ${your_jwt}` }
})
```

Both options can be combined or used optionally.

### Authorization Header Requirement

Require Bearer Tokens to be passed in as an Authorization Header

**Server side**:

```javascript
io.use(
  socketioJwt.authorize({
    secret: 'your secret or public key',
    handshake: true,
    auth_header_required: true
  })
)
```

### Handling token expiration

**Server side**

When you sign the token with an expiration time (example: 60 minutes):

```javascript
const token = jwt.sign(user_profile, jwt_secret, { expiresIn: 60 * 60 })
```

Your client-side code should handle it as below:

**Client side**

```javascript
socket.on('unauthorized', (error) => {
  if (
    error.data.type == 'UnauthorizedError' ||
    error.data.code == 'invalid_token'
  ) {
    // redirect user to login page perhaps?
    console.log('User token has expired')
  }
})
```

### Handling invalid token

Token sent by client is invalid.

**Server side**:

No further configuration needed.

**Client side**

Add a callback client-side to execute socket disconnect server-side.

```javascript
socket.on('unauthorized', (error, callback) => {
  if (
    error.data.type == 'UnauthorizedError' ||
    error.data.code == 'invalid_token'
  ) {
    // redirect user to login page perhaps or execute callback:
    callback()
    console.log('User token has expired')
  }
})
```

**Server side**

To disconnect socket server-side without client-side callback:

```javascript
io.sockets.on(
  'connection',
  socketioJwt.authorize({
    secret: 'secret goes here',
    // No client-side callback, terminate connection server-side
    callback: false
  })
)
```

**Client side**

Nothing needs to be changed client-side if callback is false.

**Server side**

To disconnect socket server-side while giving client-side 15 seconds to execute callback:

```javascript
io.sockets.on(
  'connection',
  socketioJwt.authorize({
    secret: 'secret goes here',
    // Delay server-side socket disconnect to wait for client-side callback
    callback: 15000
  })
)
```

Your client-side code should handle it as below:

**Client side**

```javascript
socket.on('unauthorized', (error, callback) => {
  if (
    error.data.type == 'UnauthorizedError' ||
    error.data.code == 'invalid_token'
  ) {
    // redirect user to login page perhaps or execute callback:
    callback()
    console.log('User token has expired')
  }
})
```

### Getting the secret dynamically

You can pass a function instead of a string when configuring secret.
This function receives the request, the decoded token and a callback. This
way, you are allowed to use a different secret based on the request and / or
the provided token.

**Server side**

```javascript
const SECRETS = {
  user1: 'secret 1',
  user2: 'secret 2'
}

io.use(
  socketioJwt.authorize({
    secret: (request, decodedToken, callback) => {
      // SECRETS[decodedToken.userId] will be used as a secret or
      // public key for connection user.

      callback(null, SECRETS[decodedToken.userId])
    },
    handshake: false
  })
)
```

### Altering the value of the decoded token

You can pass a function to change the value of the decoded token

```javascript
io.on(
  'connection',
  socketIOJwt.authorize({
    customDecoded: (decoded) => {
      return 'new decoded token'
    },
    secret: 'my_secret_key',
    decodedPropertyName: 'my_decoded_token'
  })
)

io.on('authenticated', (socket) => {
  console.log(socket.my_decoded_token) // new decoded token
})
```

## 💡 Contributing

Anyone can help to improve the project, submit a Feature Request, a bug report or even correct a simple spelling mistake.

The steps to contribute can be found in the [CONTRIBUTING.md](./.github/CONTRIBUTING.md) file.

## 📄 License

[MIT](./LICENSE)
