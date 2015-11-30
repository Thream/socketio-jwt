var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var socketioJwt = require('socketio-jwt');
var auth0Variables = require('./auth0-variables');

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

app.get('/auth0-variables.js', function(req, res){
	res.sendFile(__dirname + '/auth0-variables.js');
});

io
	.on('connection', socketioJwt.authorize({
		secret: Buffer(auth0Variables.AUTH0_CLIENT_SECRET, 'base64'),
		timeout: 15000 // 15 seconds to send the authentication message
	}))
	.on('authenticated', function(socket){
		console.log('connected & authenticated: ' + JSON.stringify(socket.decoded_token));
		socket.on('chat message', function(msg){
			debugger;
			io.emit('chat message', msg);
		});
	});

http.listen(3001, function(){
	console.log('listening on *:3001');
});
