var express = require('express');
var http = require('http');

var socketIo = require('socket.io');
var socketio_jwt = require('../'); //require('socketio-jwt');

var jwt = require('jsonwebtoken');
var jwt_secret = 'foo bar big secret';

var app = express();

app.configure(function(){
  this.use(express.json());
  this.use(express.static(__dirname + '/public'));
});

app.post('/login', function (req, res) {
  var profile = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@doe.com',
    id: 123
  };

  // We are sending the profile inside the token
  var token = jwt.sign(profile, jwt_secret, { expiresInMinutes: 60*5 });

  res.json({token: token});
});

var server = http.createServer(app);
var sio = socketIo.listen(server);

sio.use(socketio_jwt.authorize({
  secret: jwt_secret,
  handshake: true
}));

sio.sockets
  .on('connection', function (socket) {
    console.log(socket.decoded_token.email, 'connected');
    socket.on('ping', function (m) {
      socket.emit('pong', m);
    });
  });

setInterval(function () {
  sio.sockets.emit('time', Date());
}, 5000);

server.listen(9000, function () {
  console.log('listening on http://localhost:9000');
});