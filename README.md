Authenticate socket.io incoming connections with JWTs. This is useful if you are build a single page application and you are not using cookies as explained in this blog post: [Cookies vs Tokens. Getting auth right with Angular.JS](http://blog.auth0.com/2014/01/07/angularjs-authentication-with-cookies-vs-token/).

## Installation

```
npm install socketio-jwt
```

## Example usage


```javascript
var io            = require("socket.io")(server);
var socketioJwt   = require("socketio-jwt");

// set authorization for socket.io
io.set('authorization', socketioJwt.authorize({
  secret: 'your secret or public key'
}));

io.on('connection', function (socket) {
  console.log('hello! ', socket.handshake.decoded_token.name);
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

## Second method, without querystrings

The previous approach send the token through querystring which could be logged by intermediary HTTP proxies. This second method doesn't but it requires an extra roundtrip. __Take care with this method to filter unauthenticated sockets when broadcasting.__

```javascript
// set authorization for socket.io
io.sockets.on('connection', socketioJwt.authorize({
  secret: 'your secret or public key',
  timeout: 15000 // 15 seconds to send the authentication message
}, function(socket) {
  //this socket is authenticated, we are good to handle more events from it.
  console.log('hello! ' + socket.decoded_token.name);
}));
```

__Client side__:

For now the only way to append the jwt token is using query string:

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

## Contribute

You are always welcome to open an issue or provide a pull-request!

Also check out the unit tests:
```bash
npm test
```

## License

Licensed under the MIT-License.
2013 AUTH10 LLC.