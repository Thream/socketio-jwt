Authenticate socket.io incoming connections with JWTs. This is useful if you are build a single page application and you are not using cookies as explained in this blog post: [Cookies vs Tokens. Getting auth right with Angular.JS](http://blog.auth0.com/2014/01/07/angularjs-authentication-with-cookies-vs-token/).

## Installation

```
npm install socketio-jwt
```

## Example usage

```javascript
// set authorization for socket.io
io.sockets
  .on('connection', socketioJwt.authorize({
    secret: 'your secret or public key',
    timeout: 15000 // 15 seconds to send the authentication message
  })).on('authenticated', function(socket) {
    //this socket is authenticated, we are good to handle more events from it.
    console.log('hello! ' + socket.decoded_token.name);
  }));
```

**Note:** If you are using a base64-encoded secret (e.g. your Auth0 secret key), you need to convert it to a Buffer: `Buffer('your secret key', 'base64')`

__Client side__:

```javascript
var socket = io.connect('http://localhost:9000');
socket.on('connect', function (socket) {
  socket
    .on('authenticated', function () {
      //do other things
    })
    .emit('authenticate', {token: jwt}); //send the jwt
});
```

## One roundtrip

The previous approach uses a second roundtrip to send the jwt, there is a way you can authenticate on the handshake by sending the JWT as a query string, the caveat is that intermediary HTTP servers can log the url.

```javascript
var io            = require("socket.io")(server);
var socketioJwt   = require("socketio-jwt");

//// With socket.io < 1.0 ////
io.set('authorization', socketioJwt.authorize({
  secret: 'your secret or public key',
  handshake: true
}));
//////////////////////////////

//// With socket.io >= 1.0 ////
io.use(socketioJwt.authorize({
  secret: 'your secret or public key',
  handshake: true
}));
///////////////////////////////

io.on('connection', function (socket) {
  // in socket.io < 1.0
  console.log('hello!', socket.handshake.decoded_token.name);

  // in socket.io 1.0
  console.log('hello! ', socket.decoded_token.name);
})
```

For more validation options see [auth0/jsonwebtoken](https://github.com/auth0/node-jsonwebtoken).

__Client side__:

Append the jwt token using query string:

```javascript
var socket = io.connect('http://localhost:9000', {
  'query': 'token=' + your_jwt
});
```

## Contribute

You are always welcome to open an issue or provide a pull-request!

Also check out the unit tests:
```bash
npm test
```

## License

Licensed under the MIT-License.
2013 AUTH10 LLC.
