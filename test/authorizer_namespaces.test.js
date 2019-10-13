const fixture = require('./fixture/namespace');
const request = require('request');
const io = require('socket.io-client');

describe('authorizer with namespaces', function () {

  //start and stop the server
  before(fixture.start);

  after(fixture.stop);

  describe('when the user is not logged in', function () {

    it('should be able to connect to the default namespace', function (done) {
      io.connect('http://localhost:9000')
        .once('hi', done);
    });

    it('should not be able to connect to the admin namespace', function (done) {
      io.connect('http://localhost:9000/admin')
        .once('disconnect', function() { done(); })
        .once('hi admin', function() {
          done(new Error('unauthenticated client was able to connect to the admin namespace'));
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

    it('should do the handshake and connect', function (done) {
      io.connect('http://localhost:9000/admin', { forceNew: true })
        .on('authenticated', done)
        .emit('authenticate', { token: this.token });
    });
  });

});