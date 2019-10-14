const Q = require('q');
const fixture = require('./fixture');
const request = require('request');
const io = require('socket.io-client');

describe('authorizer', () => {
  //start and stop the server
  before((done) => { fixture.start({ }, done) });
  after(fixture.stop);

  describe('when the user is not logged in', () => {
    it('should emit error with unauthorized handshake', (done) => {
      const socket = io.connect('http://localhost:9000?token=boooooo', {
        forceNew: true
      });

      socket.on('error', (err) => {
        err.message.should.eql('jwt malformed');
        err.code.should.eql('invalid_token');
        socket.close();
        done();
      });
    });
  });

  describe('when the user is logged in', () => {
    before((done) => {
      request.post({
        url: 'http://localhost:9000/login',
        form: { username: 'jose', password: 'Pa123' },
        json: true
      }, (err, resp, body) => {
        this.token = body.token;
        done();
      });
    });

    describe('authorizer disallows query string token when specified in startup options', () => {
      before((done) => {
        Q.ninvoke(fixture, 'stop')
          .then(() => Q.ninvoke(fixture, 'start', { auth_header_required: true }))
          .done(done);
      });

      after((done) => {
        Q.ninvoke(fixture, 'stop')
          .then(() => Q.ninvoke(fixture, 'start', { }))
          .done(done);
      });

      it('auth headers are supported', (done) => {
        const socket = io.connect('http://localhost:9000', {
          forceNew: true,
          extraHeaders: { Authorization: 'Bearer ' + this.token}
        });

        socket
          .on('connect', () => {
            socket.close();
            done();
          })
          .on('error', done);
      });

      it('auth token in query string is disallowed', (done) => {
        const socket = io.connect('http://localhost:9000', {
          forceNew: true,
          query: 'token=' + this.token
        });

        socket.on('error', (err) => {
          err.message.should.eql('Server requires Authorization Header');
          err.code.should.eql('missing_authorization_header');
          socket.close();
          done();
        });
      });
    })

    describe('authorizer all auth types allowed', () => {
      before((done) => {
        Q.ninvoke(fixture, 'stop')
          .then(() => Q.ninvoke(fixture, 'start', {}))
          .done(done);
      })

      it('auth headers are supported', (done) => {
        const socket = io.connect('http://localhost:9000', {
          forceNew: true,
          extraHeaders: { Authorization: 'Bearer ' + this.token }
        });

        socket
          .on('connect', () => {
            socket.close();
            done();
          })
          .on('error', done);
      });

      it('should do the handshake and connect', (done) => {
        const socket = io.connect('http://localhost:9000', {
          forceNew: true,
          query: 'token=' + this.token
        });

        socket
          .on('connect', () => {
            socket.close();
            done();
          })
          .on('error', done);
      });

    });
  });

  describe('unsigned token', () => {
    beforeEach(() => {
      this.token = 'eyJhbGciOiJub25lIiwiY3R5IjoiSldUIn0.eyJuYW1lIjoiSm9obiBGb28ifQ.';
    });

    it('should not do the handshake and connect', (done) => {
      const socket = io.connect('http://localhost:9000', {
        forceNew: true,
        query: 'token=' + this.token
      });

      socket
        .on('connect', () => {
          socket.close();
          done(new Error('this shouldnt happen'));
        })
        .on('error', (err) => {
          socket.close();
          err.message.should.eql('jwt signature is required');
          done();
        });
    });
  });
});
