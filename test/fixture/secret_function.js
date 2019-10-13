const express = require('express');
const http = require('http');

const socketIo = require('socket.io');
const socketio_jwt = require('../../lib');

const jwt = require('jsonwebtoken');
const xtend = require('xtend');
const bodyParser = require('body-parser');
const enableDestroy = require('server-destroy');

let sio;

exports.start = function (options, callback) {
  const SECRETS = {
    123: 'aaafoo super sercret',
    555: 'other'
  };

  if(typeof options == 'function'){
    callback = options;
    options = {};
  }

  options = xtend({
    secret: function(request, decodedToken, callback) {
      callback(null, SECRETS[decodedToken.id]);
    },
    timeout: 1000,
    handshake: true
  }, options);

  const app = express();
  const server = http.createServer(app);
  sio = socketIo.listen(server);

  app.use(bodyParser.json());
  app.post('/login', function (req, res) {
    const profile = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@doe.com',
      id: req.body.username === 'valid_signature' ? 123 : 555
    };

    // We are sending the profile inside the token
    const token = jwt.sign(profile, SECRETS[123], { expiresIn: 60*60*5 });
    res.json({token: token});
  });

  if (options.handshake) {
    sio.use(socketio_jwt.authorize(options));

    sio.sockets.on('echo', function (m) {
      sio.sockets.emit('echo-response', m);
    });
  } else {
    sio.sockets
      .on('connection', socketio_jwt.authorize(options))
      .on('authenticated', function (socket) {
        socket.on('echo', function (m) {
          socket.emit('echo-response', m);
        });
      });
  }

  server.__sockets = [];
  server.on('connection', function (c) {
    server.__sockets.push(c);
  });

  server.listen(9000, callback);
  enableDestroy(server);
};

exports.stop = function (callback) {
  sio.close();
  try {
    server.destroy();
  } catch (er) {}

  callback();
};
