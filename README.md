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
```

For more validation options see [auth0/jsonwebtoken](https://github.com/auth0/node-jsonwebtoken).

__Client side__:

For now the only way to append the jwt token is using query string:

```javascript
var socket = io.connect('http://localhost:9000', {
  'query': 'token=' + your_jwt
});
```

Take care as URLs has a lenght limitation on Internet Explorer. I opened a [issue in engine-io-client](https://github.com/LearnBoost/engine.io-client/issues/228) to support headers.

## Contribute

You are always welcome to open an issue or provide a pull-request!

Also check out the unit tests:
```bash
npm test
```

## License

Licensed under the MIT-License.
2013 AUTH10 LLC.