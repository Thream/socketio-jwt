var xtend = require('xtend');
var jwt = require('jsonwebtoken');
var UnauthorizedError = require('./UnauthorizedError');

function noQsMethod(options) {
  return function (socket) {
    var server = this;

    var auth_timeout = setTimeout(function () {
      socket.disconnect('unauthorized');
    }, options.timeout || 5000);

    socket.on('authenticate', function (data) {
      clearTimeout(auth_timeout);
      jwt.verify(data.token, options.secret, options, function(err, decoded) {
        if (err) {
          return socket.disconnect('unauthorized');
        }

        socket.user = decoded;
        socket.emit('authenticated');
        server.$emit('authenticated', socket);
      });
    });

  };
}

function authorize(options, onConnection) {
  var defaults = {
    success: function(data, accept){
      accept(null, true);
    },
    fail: function(error, data, accept){
      accept(null, false);
    }
  };

  var auth = xtend(defaults, options);

  if (!options.handshake) {
    return noQsMethod(options);
  }

  return function(data, accept){
    var token, error;

    if (data.headers && data.headers.authorization) {
      var parts = data.headers.authorization.split(' ');
      if (parts.length == 2) {
        var scheme = parts[0],
          credentials = parts[1];

        if (/^Bearer$/i.test(scheme)) {
          token = credentials;
        }
      } else {
        error = new UnauthorizedError('credentials_bad_format', {
          message: 'Format is Authorization: Bearer [token]'
        });
        return auth.fail(error, data, accept);
      }
    }

    if (data.query.token) {
      token = data.query.token;
    }

    if (!token) {
      error = new UnauthorizedError('credentials_required', {
        message: 'No Authorization header was found'
      });
      return auth.fail(error, data, accept);
    }

    jwt.verify(token, options.secret, options, function(err, decoded) {

      if (err) {
        error = new UnauthorizedError('invalid_token', err);
        return auth.fail(error, data, accept);
      }

      data.user = decoded;
      data.logged_in = true;

      auth.success(data, accept);
    });
  };
}

function filterSocketsByUser(socketIo, filter){
  var handshaken = socketIo.sockets.manager.handshaken;
  return Object.keys(handshaken || {})
    .filter(function(skey){
      return filter(handshaken[skey].user);
    })
    .map(function(skey){
      return socketIo.sockets.manager.sockets.sockets[skey];
    });
}

exports.authorize = authorize;
exports.filterSocketsByUser = filterSocketsByUser;
