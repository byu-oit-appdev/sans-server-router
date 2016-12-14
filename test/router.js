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

describe('router', () => {

    it('all', done => {
        const router = Router()
            .all('*', function(req, res) {
                expect(req.method).to.equal('PUT');
                done();
            });
        const req = Request({ method: 'PUT', path: '/' });
        const res = Response(req);
        router.handler(req.method, req.path)(req, res);
    });

    it('DELETE', done => {
        const router = Router();
        router.delete('*', function(req, res) {
            done();
        });

        const req = Request({ method: 'DELETE', path: '/' });
        const res = Response(req);
        router.handler(req.method, req.path)(req, res);
    });

    it('GET', done => {
        const router = Router();
        router.get('*', function(req, res) {
            done();
        });

        const req = Request({ method: 'GET', path: '/' });
        const res = Response(req);
        router.handler(req.method, req.path)(req, res);
    });

    it('HEAD', done => {
        const router = Router();
        router.head('*', function(req, res) {
            done();
        });

        const req = Request({ method: 'HEAD', path: '/' });
        const res = Response(req);
        router.handler(req.method, req.path)(req, res);
    });

    it('OPTIONS', done => {
        const router = Router();
        router.options('*', function(req, res) {
            done();
        });

        const req = Request({ method: 'OPTIONS', path: '/' });
        const res = Response(req);
        router.handler(req.method, req.path)(req, res);
    });

    it('PATCH', done => {
        const router = Router();
        router.patch('*', function(req, res) {
            done();
        });

        const req = Request({ method: 'PATCH', path: '/' });
        const res = Response(req);
        router.handler(req.method, req.path)(req, res);
    });

    it('POST', done => {
        const router = Router();
        router.post('*', function(req, res) {
            done();
        });

        const req = Request({ method: 'POST', path: '/' });
        const res = Response(req);
        router.handler(req.method, req.path)(req, res);
    });

    it('PUT', done => {
        const router = Router();
        router.put('*', function(req, res) {
            done();
        });

        const req = Request({ method: 'PUT', path: '/' });
        const res = Response(req);
        router.handler(req.method, req.path)(req, res);
    });

    it('chained', done => {
        const router = Router();
        router.get('*',
            function(req, res, next) {
                next();
            },
            function(req, res) {
                done();
            }
        );

        const req = Request({ method: 'GET', path: '/' });
        const res = Response(req);
        router.handler(req.method, req.path)(req, res);
    });

    it('chained next error', done => {
        const router = Router();
        router.get('*',
            function(req, res, next) {
                next(Error('Oops'));
            },
            function(req, res) {
                throw Error('Should not get here');
            }
        );

        const req = Request({ method: 'GET', path: '/' });
        const res = Response(req, function(err) {
            expect(err.message).to.equal('Oops');
            done();
        });
        router.handler(req.method, req.path)(req, res);
    });

    it('throw error', done => {
        const router = Router();
        router.get('*',
            function(req, res) {
                throw Error('Oops');
            }
        );

        const req = Request({ method: 'GET', path: '/' });
        const res = Response(req, function(err) {
            expect(err.message).to.equal('Oops');
            done();
        });
        router.handler(req.method, req.path)(req, res);
    });

    it('bad context', () => {
        const router = Router();
        try {
            router.handler.call({}, 'GET', '/');
            throw Error('Should not get here');
        } catch (e) {
            expect(e.code).to.equal('ESSRCTX');
        }
    });

    it('invalid handler', () => {
        try {
            Router().get('*', {});
            throw Error('Should not get here');
        } catch (e) {
            expect(e.code).to.equal('ESSRHDLR');
        }
    });



});