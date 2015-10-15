var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var socketioJwt = require('socketio-jwt');

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

io
	.on('connection', socketioJwt.authorize({
		secret: Buffer('YOUR_CLIENT_SECRET', 'base64'),
		timeout: 15000 // 15 seconds to send the authentication message
	}))
	.on('authenticated', function(socket){
		console.log('connected & authenticated: ' + socket.decoded_token.toString());
		socket.on('chat message', function(msg){
			debugger;
			io.emit('chat message', msg);
		});
	});

http.listen(3001, function(){
	console.log('listening on *:3001');
});
