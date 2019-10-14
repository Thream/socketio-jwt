const fixture = require('./fixture/namespace');
const request = require('request');
const io = require('socket.io-client');

describe('authorizer with namespaces', () => {

  //start and stop the server
  before(fixture.start);
  after(fixture.stop);

  describe('when the user is not logged in', () => {

    it('should be able to connect to the default namespace', (done) => {
      io.connect('http://localhost:9000')
        .once('hi', () => done());
    });

    it('should not be able to connect to the admin namespace', (done) => {
      io.connect('http://localhost:9000/admin')
        .once('disconnect', () => done())
        .once('hi admin', () => done(new Error('unauthenticated client was able to connect to the admin namespace')));
    });

  });

  describe('when the user is logged in', () => {

    beforeEach((done) => {
      request.post({
        url: 'http://localhost:9000/login',
        form: { username: 'jose', password: 'Pa123' },
        json: true
      }, (err, resp, body) => {
        this.token = body.token;
        done();
      });
    });

    it('should do the handshake and connect', (done) => {
      io.connect('http://localhost:9000/admin', { forceNew: true })
        .on('authenticated', () => done())
        .emit('authenticate', { token: this.token });
    });
  });

});