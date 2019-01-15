# socketio-jwt
<img src="https://img.shields.io/badge/community-driven-brightgreen.svg"/> <br>

Authenticate socket.io incoming connections with JWTs. This is useful if you are build a single page application and you are not using cookies as explained in this blog post: [Cookies vs Tokens. Getting auth right with Angular.JS](http://blog.auth0.com/2014/01/07/angularjs-authentication-with-cookies-vs-token/).

This repo is supported and maintained by Community Developers, not Auth0. For more information about different support levels check https://auth0.com/docs/support/matrix .

## Getting started

Chrome extensions are packaged as `.crx` files for distribution but may be loaded "unpacked" for development. For more information on how to load an unpacked extension, see the [Chrome extension docs](https://developer.chrome.com/extensions/getstarted#unpacked).

### Installation

```
npm install socketio-jwt
```

## Usage

```javascript
// set authorization for socket.io
io.sockets
  .on('connection', socketioJwt.authorize({
    secret: 'your secret or public key',
    timeout: 15000 // 15 seconds to send the authentication message
  })).on('authenticated', function(socket) {
    //this socket is authenticated, we are good to handle more events from it.
    console.log('hello! ' + socket.decoded_token.name);
  });
```

**Note:** If you are using a base64-encoded secret (e.g. your Auth0 secret key), you need to convert it to a Buffer: `Buffer('your secret key', 'base64')`

**Client side**

```javascript
var socket = io.connect('http://localhost:9000');
socket.on('connect', function () {
  socket
    .emit('authenticate', {token: jwt}) //send the jwt
    .on('authenticated', function () {
      //do other things
    })
    .on('unauthorized', function(msg) {
      console.log("unauthorized: " + JSON.stringify(msg.data));
      throw new Error(msg.data.type);
    })
});
```

### One roundtrip

The previous approach uses a second roundtrip to send the jwt. There is a way you can authenticate on the handshake by sending the JWT as a query string, the caveat is that intermediary HTTP servers can log the url.

```javascript
var io            = require("socket.io")(server);
var socketioJwt   = require("socketio-jwt");

//// With socket.io < 1.0 ////
io.set('authorization', socketioJwt.authorize({
  secret: 'your secret or public key',
  handshake: true
}));

//// With socket.io >= 1.0 ////
io.use(socketioJwt.authorize({
  secret: 'your secret or public key',
  handshake: true
}));

io.on('connection', function (socket) {
  // in socket.io < 1.0
  console.log('hello!', socket.handshake.decoded_token.name);

  // in socket.io 1.0
  console.log('hello! ', socket.decoded_token.name);
})
```

For more validation options see [auth0/jsonwebtoken](https://github.com/auth0/node-jsonwebtoken).

**Client side**

Append the jwt token using query string:

```javascript
var socket = io.connect('http://localhost:9000', {
  'query': 'token=' + your_jwt
});
```

### Handling token expiration

**Server side**

When you sign the token with an expiration time:

```javascript
var token = jwt.sign(user_profile, jwt_secret, {expiresInMinutes: 60});
```

Your client-side code should handle it as below:

**Client side**

```javascript
socket.on("unauthorized", function(error) {
  if (error.data.type == "UnauthorizedError" || error.data.code == "invalid_token") {
    // redirect user to login page perhaps?
    console.log("User's token has expired");
  }
});
```

### Handling invalid token

Token sent by client is invalid.

**Server side**:

No further configuration needed.

**Client side**

Add a callback client-side to execute socket disconnect server-side.

```javascript
socket.on("unauthorized", function(error, callback) {
  if (error.data.type == "UnauthorizedError" || error.data.code == "invalid_token") {
    // redirect user to login page perhaps or execute callback:
    callback();
    console.log("User's token has expired");
  }
});
```

**Server side**

To disconnect socket server-side without client-side callback:

```javascript
io.sockets.on('connection', socketioJwt.authorize({
  secret: 'secret goes here',
  // No client-side callback, terminate connection server-side
  callback: false
}))
```

**Client side**

Nothing needs to be changed client-side if callback is false.

**Server side**

To disconnect socket server-side while giving client-side 15 seconds to execute callback:

```javascript
io.sockets.on('connection', socketioJwt.authorize({
  secret: 'secret goes here',
  // Delay server-side socket disconnect to wait for client-side callback
  callback: 15000
}))
```

Your client-side code should handle it as below:

**Client side**

```javascript
socket.on("unauthorized", function(error, callback) {
  if (error.data.type == "UnauthorizedError" || error.data.code == "invalid_token") {
    // redirect user to login page perhaps or execute callback:
    callback();
    console.log("User's token has expired");
  }
});
```

### Getting the secret dynamically

You can pass a function instead of a string when configuring secret.
This function receives the request, the decoded token and a callback. This
way, you are allowed to use a different secret based on the request and / or
the provided token.

**Server side**

```javascript
var SECRETS = {
  'user1': 'secret 1',
  'user2': 'secret 2'
}

io.use(socketioJwt.authorize({
  secret: function(request, decodedToken, callback) {
    // SECRETS[decodedToken.userId] will be used as a secret or
    // public key for connection user.

    callback(null, SECRETS[decodedToken.userId]);
  },
  handshake: false
}));
```

## Contribute

Feel like contributing to this repo? We're glad to hear that! Before you start contributing please visit our [Contributing Guideline](https://github.com/auth0-community/getting-started/blob/master/CONTRIBUTION.md).

Here you can also find the [PR template](https://github.com/auth0-community/socketio-jwt/blob/master/PULL_REQUEST_TEMPLATE.md) to fill once creating a PR. It will automatically appear once you open a pull request.

## Issues Reporting

Spotted a bug or any other kind of issue? We're just humans and we're always waiting for constructive feedback! Check our section on how to [report issues](https://github.com/auth0-community/getting-started/blob/master/CONTRIBUTION.md#issues)!

Here you can also find the [Issue template](https://github.com/auth0-community/socketio-jwt/blob/master/ISSUE_TEMPLATE.md) to fill once opening a new issue. It will automatically appear once you create an issue.

## Repo Community

Feel like PRs and issues are not enough? Want to dive into further discussion about the tool? We created topics for each Auth0 Community repo so that you can join discussion on stack available on our repos. Here it is for this one: [socketio-jwt](https://community.auth0.com/t/auth0-community-oss-socketio-jwt/20024)

<a href="https://community.auth0.com/">
<img src="/assets/join_auth0_community_badge.png"/>
</a>

## License

This project is licensed under the MIT license. See the [LICENSE](https://github.com/auth0-community/socketio-jwt/blob/master/LICENSE) file for more info.

## What is Auth0?

Auth0 helps you to:

* Add authentication with [multiple authentication sources](https://docs.auth0.com/identityproviders), either social like
  * Google
  * Facebook
  * Microsoft
  * Linkedin
  * GitHub
  * Twitter
  * Box
  * Salesforce
  * etc.

  **or** enterprise identity systems like:
  * Windows Azure AD
  * Google Apps
  * Active Directory
  * ADFS
  * Any SAML Identity Provider

* Add authentication through more traditional [username/password databases](https://docs.auth0.com/mysql-connection-tutorial)
* Add support for [linking different user accounts](https://docs.auth0.com/link-accounts) with the same user
* Support for generating signed [JSON Web Tokens](https://docs.auth0.com/jwt) to call your APIs and create user identity flow securely
* Analytics of how, when and where users are logging in
* Pull data from other sources and add it to user profile, through [JavaScript rules](https://docs.auth0.com/rules)

## Create a free Auth0 account

* Go to [Auth0 website](https://auth0.com/signup)
* Hit the **SIGN UP** button in the upper-right corner
