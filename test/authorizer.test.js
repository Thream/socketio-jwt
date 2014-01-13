var fixture = require('./fixture');
var request = require('request');
var io = require('socket.io-client');

describe('authorizer', function () {

  //start and stop the server
  before(fixture.start);
  after(fixture.stop);

  describe('when the user is not logged in', function () {

    it('should emit error with unauthorized handshake', function (done){
      var socket = io.connect('http://localhost:9000', {
        'query': 'token=Booooooooooooooooooooo',
        'force new connection': true
      });

      socket.on('error', function(err){
        err.should.eql('handshake unauthorized');
        done();
      });
    });

  });

  describe('when the user is logged in', function() {

    beforeEach(function (done) {
      request.post({
        url: 'http://localhost:9000/login',
        form: { username: 'jose', password: 'Pa123' },
        json: true
      }, function (err, resp, body) {
        this.token = body.token;
        done();
      }.bind(this));
    });

    it('should do the handshake and connect', function (done){
      var socket = io.connect('http://localhost:9000', {
        'force new connection':true,
        'query': 'token=' + this.token
      });
      socket.on('connect', function(){
        done();
      }).on('error', done);
    });
  });

});