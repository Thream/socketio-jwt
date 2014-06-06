var xtend = require('xtend');
var jwt = require('jsonwebtoken');
var UnauthorizedError = require('./UnauthorizedError');

function noQsMethod(options) {
  return function (socket) {
    var server = this;

    if (!server.$emit) {
      //then is socket.io 1.0
      var Namespace = Object.getPrototypeOf(server.server.sockets).constructor;
      if (!~Namespace.events.indexOf('authenticated')) {
        Namespace.events.push('authenticated');
      }
    }

    var auth_timeout = setTimeout(function () {
      socket.disconnect('unauthorized');
    }, options.timeout || 5000);

    socket.on('authenticate', function (data) {
      clearTimeout(auth_timeout);
      jwt.verify(data.token, options.secret, options, function(err, decoded) {
        if (err) {
          return socket.disconnect('unauthorized');
        }

        socket.decoded_token = decoded;
        socket.emit('authenticated');
        if (server.$emit) {
          server.$emit('authenticated', socket);
        } else {
          server.server.sockets.emit('authenticated', socket);
        }
      });
    });

  };
}

function authorize(options, onConnection) {
  var defaults = {
    success: function(data, accept){
      if (data.request) {
        accept();
      } else {
        accept(null, true);
      }
    },
    fail: function(error, data, accept){
      if (data.request) {
        accept(error);
      } else {
        accept(null, false);
      }
    }
  };

  var auth = xtend(defaults, options);

  if (!options.handshake) {
    return noQsMethod(options);
  }

  return function(data, accept){
    var token, error;
    var req = data.request || data;
    var authorization_header = (req.headers || {}).authorization;

    if (authorization_header) {
      var parts = authorization_header.split(' ');
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

    //get the token from query string
    if (req._query && req._query.token) {
      token = req._query.token;
    }
    else if (req.query && req.query.token) {
      token = req.query.token;
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

      data.decoded_token = decoded;

      auth.success(data, accept);
    });
  };
}

exports.authorize = authorize;
