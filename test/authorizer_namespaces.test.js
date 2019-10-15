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
        .once('hi', () => done())
        .on('error', done);
    });

    it('should not be able to connect to the admin namespace', (done) => {
      io.connect('http://localhost:9000/admin')
        .once('disconnect', () => done())
        .once('hi admin', () => done(new Error('unauthenticated client was able to connect to the admin namespace')));
    });

    it('should not be able to connect to the admin_hs namespace', (done) => {
      io.connect('http://localhost:9000/admin_hs')
        .once('hi admin', () => done(new Error('unauthenticated client was able to connect to the admin_hs namespace')))
        .on('error', (err) => {
          if (err === 'Invalid namespace') { // SocketIO throws this error, if auth failed
            return;
          } else if (err && err.type == 'UnauthorizedError') {
            done();
          } else {
            done(err);
          }
        });
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
      io.connect('http://localhost:9000/admin', { forceNew: true })
        .on('hi admin', () => done())
        .emit('authenticate', { token: this.token });
    });

    it('should do the authentication and connect without "forceNew"', (done) => {
      io.connect('http://localhost:9000/admin', { forceNew: false })
        .on('hi admin', () => done())
        .emit('authenticate', { token: this.token });
    });
  });

  describe('when the user is logged in via handshake', () => {

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
      io.connect('http://localhost:9000/admin_hs', { forceNew: true, query: 'token=' + this.token })
        .once('hi admin', () => done());
    });

    it('should do the handshake and connect without "forceNew"', (done) => {
      io.connect('http://localhost:9000/admin_hs', { forceNew: false, query: 'token=' + this.token })
        .once('hi admin', () => done());
    });
  });

});