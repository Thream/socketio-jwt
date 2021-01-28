# Changelog

## [1.1.1](https://github.com/Thream/socketio-jwt/compare/v1.1.0...v1.1.1) (2021-01-28)

### Bug Fixes

- **types:** decodedToken in secret callback ([c1a9213](https://github.com/Thream/socketio-jwt/commit/c1a9213a527e4c6188328221372e1f40191a790e)), closes [#21](https://github.com/Thream/socketio-jwt/issues/21)

### Documentation

- update server side usage with `jwks-rsa` : get the secret with `key.getPublicKey()` instead of `key.rsaPublicKey`

## [1.1.0](https://github.com/Thream/socketio-jwt/compare/v1.0.1...v1.1.0) (2021-01-07)

### Features

- add algorithms option ([abbabc5](https://github.com/Thream/socketio-jwt/commit/abbabc588e3ea8b906fa0a0dcc83c91a3b5b5ea8))
- add support for jwks-rsa ([#1](https://github.com/Thream/socketio-jwt/issues/1)) ([261e8d6](https://github.com/Thream/socketio-jwt/commit/261e8d66e2ec6fefb77429abcef8f846d996ecac))
- improve types by extending socket.io module ([#6](https://github.com/Thream/socketio-jwt/issues/6)) ([84b523f](https://github.com/Thream/socketio-jwt/commit/84b523f4348c81933887f0dc700f438c84bd779a))

## [1.0.1](https://github.com/Thream/socketio-jwt/compare/v1.0.0...v1.0.1) (2020-12-29)

### Documentation

- fix usage section by correctly importing `authorize`

## [1.0.0](https://github.com/Thream/socketio-jwt/compare/v4.6.2...v1.0.0) (2020-12-29)

Initial release.
