/**
 *  @license
 *    Copyright 2016 Brigham Young University
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 **/
'use strict';
const expect                = require('chai').expect;
const Request               = require('sans-server').Request;
const Response              = require('sans-server').Response;
const Router                = require('../bin/router');
const SansServer            = require('sans-server');

describe('router', () => {

    it('all', () => {
        const server = SansServer();
        const router = Router()
            .all('*', function(req, res) {
                expect(req.method).to.equal('PUT');
                res.send();
            });
        server.use(router);
        return server.request({ method: 'PUT', path: '/' })
    });

    it('DELETE', () => {
        const server = SansServer();
        const router = Router()
            .delete('*', function(req, res) {
                res.send();
            });
        server.use(router);
        return server.request({ method: 'DELETE', path: '/' })
    });

    it('GET', () => {
        const server = SansServer();
        const router = Router()
            .get('*', function(req, res) {
                res.send();
            });
        server.use(router);
        return server.request({ method: 'GET', path: '/' });
    });

    it('HEAD', () => {
        const server = SansServer();
        const router = Router()
            .head('*', function(req, res) {
                res.send();
            });
        server.use(router);
        return server.request({ method: 'HEAD', path: '/' });
    });

    it('OPTIONS', () => {
        const server = SansServer();
        const router = Router()
            .options('*', function(req, res) {
                res.send();
            });
        server.use(router);
        return server.request({ method: 'OPTIONS', path: '/' });
    });

    it('PATCH', () => {
        const server = SansServer();
        const router = Router()
            .patch('*', function(req, res) {
                res.send();
            });
        server.use(router);
        return server.request({ method: 'PATCH', path: '/' });
    });

    it('POST', () => {
        const server = SansServer();
        const router = Router()
            .post('*', function(req, res) {
                res.send();
            });
        server.use(router);
        return server.request({ method: 'POST', path: '/' });
    });

    it('PUT', () => {
        const server = SansServer();
        const router = Router()
            .put('*', function(req, res) {
                res.send();
            });
        server.use(router);
        return server.request({ method: 'PUT', path: '/' });
    });

    it('chained', () => {
        const server = SansServer();
        const router = Router()
            .get('*',
                function(req, res, next) {
                    next();
                },
                function(req, res) {
                    res.send();
                }
            );
        server.use(router);
        return server.request({ method: 'GET', path: '/' });
    });

    it('chained next error', () => {
        const server = SansServer();
        const router = Router()
            .get('*',
                function(req, res, next) {
                    next(Error('Oops1'));
                },
                function(req, res) {
                    throw Error('Should not get here');
                }
            );
        server.use(router);
        return server.request({ method: 'GET', path: '/' })
            .then(function(res) {
                expect(res.error.message).to.equal('Oops1');
            });
    });

    it('throw error', () => {
        const server = SansServer();
        const router = Router()
            .get('*',
                function(req, res) {
                    throw Error('Oops2');
                }
            );
        server.use(router);
        return server.request({ method: 'GET', path: '/' })
            .then(res => {
                expect(res.error.message).to.equal('Oops2');
            });
    });

    it('invalid handler', () => {
        try {
            Router().get('*', {});
            throw Error('Should not get here');
        } catch (e) {
            expect(e.code).to.equal('ESSRHDLR');
        }
    });

    it('chained routes', () => {
        const num = '' + Math.random();
        const server = SansServer();

        const router = Router()
            .get('*', function(req, res, next) {
                req.foo = num;
                next();
            })
            .get('*', function(req, res, next) {
                expect(req.foo).to.equal(num);
                res.send(num);
            });
        server.use(router);

        return server.request({ method: 'GET', path: '/' })
            .then(res => {
                expect(res.body).to.equal(num);
            });
    });

    it('non terminal router', () => {
        const num = '' + Math.random();
        const server = SansServer();

        const router = Router()
            .get('/foo/bar', function(req, res, next) {
                req.foo = num;
                next();
            })
            .get('/foo/:p', function(req, res, next) {
                expect(req.params.p).to.equal('bar');
                expect(req.foo).to.equal(num);
                next();
            });
        server.use(router);

        return server.request({ method: 'GET', path: '/foo/bar' })
            .then(res => {
                expect(res.statusCode).to.equal(404);
            });
    });

    it('parser parameters', () => {
        const num = '' + Math.random();
        const server = SansServer();
        const router = Router()
            .get('/foo/:first/bar/:second*', function(req, res, next) {
                expect(req.params.first).to.equal('abc');
                expect(req.params.second).to.equal('def/ghi');
                res.send();
            });
        server.use(router);
        return server.request({ method: 'GET', path: '/foo/abc/bar/def/ghi' })
            .then(res => {
                expect(!res.error).to.be.true;
            });
    });

    it('updates parser parameters', () => {
        const server = SansServer();
        const router = Router()
            .get('/foo/:first/bar/:second*', function(req, res, next) {
                expect(req.params.first).to.equal('abc');
                expect(req.params.second).to.equal('def/ghi');
                next();
            })
            .get('/foo/:first/bar/:second/:third', function(req, res, next) {
                expect(req.params.first).to.equal('abc');
                expect(req.params.second).to.equal('def');
                expect(req.params.third).to.equal('ghi');
                res.send();
            });
        server.use(router);
        return server.request({ method: 'GET', path: '/foo/abc/bar/def/ghi' })
            .then(res => {
                expect(!res.error).to.be.true;
            });
    });

    it('can be used as middleware', done => {
        const server = SansServer({ supportedMethods: ['GET'] });
        const router = Router();
        const num = '' + Math.random();

        router.get('/foo', function(req, res) {
            res.send(num)
        });

        server.use(router);

        server.request({ method: 'GET', path: '/foo' }, function(res) {
            expect(res.body).to.equal(num);
            done();
        });
    });

    it('can send a 404', () => {
        const server = SansServer();
        const router = Router();
        server.use(router);
        return server.request({ method: 'GET', path: '/' })
            .then(res => {
                expect(res.statusCode).to.equal(404);
            });
    });

    it('can send a 405', () => {
        const server = SansServer();
        const router = Router();

        router.get('/foo', function(req, res) {
            res.send('ok')
        });

        server.use(router);

        return server.request({ method: 'POST', path: '/foo' })
            .then(function(res) {
                expect(res.statusCode).to.equal(405);
            });
    });
});

function noop() {}