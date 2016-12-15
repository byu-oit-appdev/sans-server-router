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
const middleware            = require('../bin/middleware');
const SansServer            = require('sans-server');

describe('middleware', () => {

    describe('implements server methods', () => {
        let server;

        before(() => {
            server = SansServer({ supportedMethods: ['GET'] });
            server.use(middleware(server));
        });

        it('get', () => {
            expect(server.get).to.be.a('function');
        });

        it('can call get', () => {
            expect(() => server.get('/', () => {})).to.not.throw(Error);
        });

        it('cannot call post', () => {
            try {
                server.post('/', () => {});
                throw Error('Should not get here');
            } catch (err) {
                expect(err.code).to.equal('ESSRMET');
            }
        });

    });

    describe('executes routes', () => {
        let server;

        beforeEach(() => {
            server = SansServer({ supportedMethods: ['GET'] });
            server.use(middleware(server));
        });

        it('terminal route', () => {
            const num = '' + Math.random();
            server.get('*', function(req, res, next) {
                res.send(num);
            });
            return server.request({ method: 'GET', path: '/' })
                .then(res => {
                    expect(res.body).to.equal(num);
                });
        });

        it('chained route', () => {
            const num = '' + Math.random();
            server.get('*',
                function(req, res, next) {
                    req.num = num;
                    next();
                },
                function(req, res, next) {
                    res.send(req.num);
                }
            );
            return server.request({ method: 'GET', path: '/' })
                .then(res => {
                    expect(res.body).to.equal(num);
                });
        });

        it('non termainal route', () => {
            const num = '' + Math.random();

            server.use(function(req, res, next) {
                res.send(req.num);
            });

            server.get('*', function(req, res, next) {
                req.num = num;
                next();
            });
            return server.request({ method: 'GET', path: '/' })
                .then(res => {
                    expect(res.body).to.equal(num);
                });
        });

    });

});