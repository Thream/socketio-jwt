const fixture = require('./fixture');
const request = require('request');
const io = require('socket.io-client');

describe('authorizer without querystring', () => {

  //start and stop the server
  before((done) => {
    fixture.start({ handshake: false }, done);
  });

  after(fixture.stop);

  describe('when the user is not logged in', () => {

    it('should close the connection after a timeout if no auth message is received', (done) => {
      io.connect('http://localhost:9000', { forceNew: true })
        .once('disconnect', () => done());
    });

    it('should not respond echo', (done) => {
      io.connect('http://localhost:9000', { forceNew: true })
        .on('echo-response', () => done(new Error('this should not happen')))
        .emit('echo', { hi: 123 });

      setTimeout(done, 1200);
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

    it('should do the authentication and connect', (done) => {
      const socket = io.connect('http://localhost:9000', { forceNew: true });

      socket
        .on('echo-response', () => {
          socket.close();
          done();
        })
        .on('authenticated', () => { socket.emit('echo'); })
        .emit('authenticate', { token: this.token });
    });
  });

});